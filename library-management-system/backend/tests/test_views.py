from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import Book, Reservation
from datetime import date

User = get_user_model()

class BookReserveIntegrationTest(APITestCase):
    def setUp(self):
        # create test user
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        # ✅ Authenticate without needing tokens
        self.client.force_authenticate(user=self.user)

        # create test book
        self.book = Book.objects.create(
            title="Test Book",
            author="John Doe",
            publication_date=date.today(),
            isbn="1234567890123",
            total_copies=3,
            available_copies=3,
            language="English",
        )

    def test_successful_reservation(self):
        url = reverse("book-reserve", args=[self.book.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        reservation = Reservation.objects.get(book=self.book, user=self.user)
        self.assertEqual(reservation.status, "pending")

    def test_duplicate_reservation_not_allowed(self):
        url = reverse("book-reserve", args=[self.book.id])

        # First reservation succeeds
        first_response = self.client.post(url)
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        # Second reservation should fail
        second_response = self.client.post(url)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", second_response.data)

        # Only one reservation should exist
        self.assertEqual(
            Reservation.objects.filter(book=self.book, user=self.user).count(), 1
        )
