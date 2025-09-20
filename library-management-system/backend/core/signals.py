from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import BorrowRecord, Reservation, Notification

@receiver(pre_save, sender=BorrowRecord)
def calculate_fine_before_save(sender, instance, **kwargs):
    if instance.is_returned and not instance.return_date:
        instance.return_date = timezone.now().date()
    
    if not instance.is_returned and instance.due_date and instance.due_date < timezone.now().date():
        days_overdue = (timezone.now().date() - instance.due_date).days
        instance.fine_amount = days_overdue * 1.00  # $1 per day

@receiver(post_save, sender=BorrowRecord)
def create_notification_for_overdue(sender, instance, created, **kwargs):
    if not created and instance.is_overdue and instance.fine_amount > 0:
        Notification.objects.create(
            user=instance.borrower,
            title="Overdue Book Fine",
            message=f"You have been charged ${instance.fine_amount:.2f} for overdue book: {instance.book.title}",
            notification_type="warning"
        )

@receiver(pre_save, sender=Reservation)
def check_reservation_expiry(sender, instance, **kwargs):
    if instance.is_expired and instance.status == 'pending':
        instance.status = 'expired'

@receiver(post_save, sender=Reservation)
def create_notification_for_reservation(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.user,
            title="Book Reservation",
            message=f"Your reservation for {instance.book.title} is pending. It will expire on {instance.expiry_date.strftime('%Y-%m-%d %H:%M')}",
            notification_type="info"
        )
    elif instance.status == 'fulfilled':
        Notification.objects.create(
            user=instance.user,
            title="Reservation Fulfilled",
            message=f"Your reservation for {instance.book.title} is now available for pickup!",
            notification_type="success"
        )