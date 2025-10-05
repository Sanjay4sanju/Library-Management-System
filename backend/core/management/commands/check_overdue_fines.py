from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import BorrowRecord, Fine
from datetime import timedelta

class Command(BaseCommand):
    help = 'Check for overdue books and impose fines'

    def handle(self, *args, **options):
        # Find all overdue books that aren't returned
        overdue_records = BorrowRecord.objects.filter(
            is_returned=False,
            due_date__lt=timezone.now().date()
        )
        
        self.stdout.write(f"Checking {overdue_records.count()} overdue records...")
        
        fines_imposed = 0
        for record in overdue_records:
            fine_amount = record.calculate_fine()
            if fine_amount > 0:
                fines_imposed += 1
                self.stdout.write(
                    f"Imposed ${fine_amount} fine on {record.borrower.username} "
                    f"for '{record.book.title}' ({record.due_date})"
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully imposed fines on {fines_imposed} overdue records"
            )
        )