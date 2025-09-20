# tests/test_models.py
from django.test import TestCase
from core.models import Book, BorrowRecord
from django.utils import timezone

class BookModelTest(TestCase):
    def test_book_availability(self):
        book = Book(
            title="Sample Book",
            author="Author",
            isbn="9876543210123",
            genre="Test Genre",
            publication_date=timezone.now().date(),
            publisher="Publisher",
            total_copies=5,
            available_copies=3,
            category_id=1
        )
        self.assertTrue(book.is_available)

        book.available_copies = 0
        self.assertFalse(book.is_available)


class BorrowRecordTest(TestCase):
    def test_overdue_calculation(self):
        record = BorrowRecord(
            due_date=timezone.now().date() - timezone.timedelta(days=5),
            is_returned=False
        )
        self.assertTrue(record.is_overdue)
