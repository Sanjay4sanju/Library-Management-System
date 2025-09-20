from django.test import TestCase
from core.models import Notification, User

class NotificationUsabilityTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="password123"
        )

    def test_notification_clarity(self):
        notification = Notification.objects.create(
            title="Overdue Book",
            message="Your book is overdue. Please return it.",
            is_read=False,
            notification_type="info",  # <-- FIXED FIELD NAME
            user=self.user
        )

        self.assertEqual(notification.title, "Overdue Book")
        self.assertEqual(notification.notification_type, "info")
        self.assertFalse(notification.is_read)
