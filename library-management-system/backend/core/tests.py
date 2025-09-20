from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from .models import Book, Category, BorrowRecord

User = get_user_model()

class BookAPITestCase(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin', 
            password='testpass123', 
            user_type='admin',
            email='admin@library.com'
        )
        self.librarian_user = User.objects.create_user(
            username='librarian', 
            password='testpass123', 
            user_type='librarian',
            email='librarian@library.com'
        )
        self.student_user = User.objects.create_user(
            username='student', 
            password='testpass123', 
            user_type='student',
            email='student@library.com'
        )
        
        self.category = Category.objects.create(name='Fiction', description='Fiction books')
        
        self.book = Book.objects.create(
            title='Test Book',
            author='Test Author',
            isbn='1234567890123',
            genre='fiction',
            category=self.category,
            publication_date='2023-01-01',
            publisher='Test Publisher',
            total_copies=5,
            available_copies=5
        )
        
        self.client = APIClient()
    
    def test_admin_can_create_book(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'title': 'New Book',
            'author': 'New Author',
            'isbn': '0987654321098',
            'genre': 'non-fiction',
            'category': self.category.id,
            'publication_date': '2023-02-01',
            'publisher': 'New Publisher',
            'total_copies': 3,
            'available_copies': 3,
            'language': 'English',
            'pages': 200
        }
        response = self.client.post(reverse('book-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Book.objects.count(), 2)
    
    def test_student_cannot_create_book(self):
        self.client.force_authenticate(user=self.student_user)
        data = {
            'title': 'Student Book',
            'author': 'Student Author',
            'isbn': '1122334455667',
            'genre': 'fiction',
            'publication_date': '2023-03-01',
            'publisher': 'Student Publisher',
            'total_copies': 2,
            'available_copies': 2
        }
        response = self.client.post(reverse('book-list'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_any_authenticated_user_can_list_books(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse('book-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_book_borrow_success(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(reverse('book-borrow', kwargs={'pk': self.book.id}))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that book availability decreased
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 4)
        
        # Check that borrow record was created
        borrow_record = BorrowRecord.objects.get(book=self.book, borrower=self.student_user)
        self.assertIsNotNone(borrow_record)
        self.assertFalse(borrow_record.is_returned)
    
    def test_book_borrow_no_copies_available(self):
        # Make book unavailable
        self.book.available_copies = 0
        self.book.save()
        
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(reverse('book-borrow', kwargs={'pk': self.book.id}))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

class BorrowRecordAPITestCase(APITestCase):
    def setUp(self):
        self.student_user = User.objects.create_user(
            username='student', 
            password='testpass123', 
            user_type='student'
        )
        
        self.librarian_user = User.objects.create_user(
            username='librarian', 
            password='testpass123', 
            user_type='librarian'
        )
        
        self.book = Book.objects.create(
            title='Test Book',
            author='Test Author',
            isbn='1234567890123',
            genre='fiction',
            publication_date='2023-01-01',
            publisher='Test Publisher',
            total_copies=5,
            available_copies=5
        )
        
        self.borrow_record = BorrowRecord.objects.create(
            book=self.book,
            borrower=self.student_user,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        
        self.client = APIClient()
    
    def test_student_can_view_own_records(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse('borrowrecord-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_librarian_can_view_all_records(self):
        self.client.force_authenticate(user=self.librarian_user)
        response = self.client.get(reverse('borrowrecord-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see all records (1 in this case)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_book_return_success(self):
        self.client.force_authenticate(user=self.librarian_user)
        response = self.client.post(reverse('borrowrecord-return-book', kwargs={'pk': self.borrow_record.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that borrow record is marked as returned
        self.borrow_record.refresh_from_db()
        self.assertTrue(self.borrow_record.is_returned)
        self.assertIsNotNone(self.borrow_record.return_date)
        
        # Check that book availability increased
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 5)