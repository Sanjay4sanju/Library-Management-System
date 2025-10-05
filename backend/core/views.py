from .models import User, Book, BorrowRecord, Reservation, Fine, Notification, Category
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from .serializers import (
    BookSerializer, BorrowRecordSerializer, ReservationSerializer, 
    FineSerializer, NotificationSerializer, CategorySerializer,
    ChangePasswordSerializer, UserSerializer
)
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from .models import Reservation
from .permissions import IsLibrarian, IsAdmin, IsOwner
# Add this import at the top
from django.http import JsonResponse, HttpResponseNotFound
import json

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsLibrarian()]
        return super().get_permissions()

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genre', 'category']
    search_fields = ['title', 'author', 'isbn', 'publisher']
    ordering_fields = ['title', 'author', 'publication_date', 'created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        available = self.request.query_params.get('available', None)
        if available is not None:
            if available.lower() == 'true':
                queryset = queryset.filter(available_copies__gt=0)
            elif available.lower() == 'false':
                queryset = queryset.filter(available_copies=0)
        
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsLibrarian()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        book = self.get_object()
        user = request.user

        # Check if user already has pending reservation
        if Reservation.objects.filter(book=book, user=user, status='pending').exists():
            return Response(
                {"error": "You already have a pending reservation for this book."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create reservation with expiry date 3 days from now
        expiry_date = timezone.now() + timedelta(days=3)
        reservation = Reservation.objects.create(
            book=book,
            user=user,
            expiry_date=expiry_date
        )

        return Response(
            {"message": "Book reserved successfully", "reservation_id": reservation.id},
            status=status.HTTP_201_CREATED
        )

    # ADD THIS BORROW ACTION TO BOOKVIEWSET
    @action(detail=True, methods=['post'])
    def borrow(self, request, pk=None):
        book = self.get_object()
        user = request.user
        
        if book.available_copies <= 0:
            return Response(
                {'error': 'No copies available for borrowing.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has this book borrowed
        existing_borrow = BorrowRecord.objects.filter(
            book=book, 
            borrower=user, 
            is_returned=False
        ).exists()
        
        if existing_borrow:
            return Response(
                {'error': 'You have already borrowed this book.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has too many borrowed books
        max_books = 5  # Maximum books a user can borrow
        current_borrows = BorrowRecord.objects.filter(
            borrower=user, 
            is_returned=False
        ).count()
        
        if current_borrows >= max_books:
            return Response(
                {'error': f'You can only borrow {max_books} books at a time.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for overdue books
        overdue_books = BorrowRecord.objects.filter(
            borrower=user, 
            is_returned=False,
            due_date__lt=timezone.now().date()
        ).exists()
        
        if overdue_books:
            return Response(
                {'error': 'You have overdue books. Please return them before borrowing new ones.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create borrow record
        borrow_record = BorrowRecord.objects.create(
            book=book,
            borrower=user,
            due_date=timezone.now().date() + timedelta(days=14)  # 2 weeks
        )
        
        # Update book availability
        book.available_copies -= 1
        book.save()
        
        # Check for reservations and update if any
        reservation = Reservation.objects.filter(
            book=book, 
            user=user, 
            status='pending'
        ).first()
        
        if reservation:
            reservation.status = 'fulfilled'
            reservation.save()
        
        serializer = BorrowRecordSerializer(borrow_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    # ... rest of your BookViewSet code ...

    # Add this ViewSet class after the other ViewSets
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsLibrarian]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsLibrarian()]

        # Add this to your UserViewSet
    def destroy(self, request, *args, **kwargs):
     try:
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
     except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type in ['librarian', 'admin']:
            return User.objects.all()
        # Regular users can only see their own profile
        return User.objects.filter(id=user.id)
    
    def create(self, request, *args, **kwargs):
        print("=== USER CREATE DEBUG ===")
        print("Request data:", request.data)
        print("Content type:", request.content_type)
        
        serializer = self.get_serializer(data=request.data)
        print("Serializer data:", serializer.initial_data)
        
        if serializer.is_valid():
            print("Serializer is valid")
            # Handle password hashing
            user = serializer.save()
            password = request.data.get('password', '')
            if password:
                user.set_password(password)
                user.save()
                print("Password set and user saved")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            # Handle password update if provided
            if 'password' in request.data and request.data['password']:
                instance.set_password(request.data['password'])
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_books = Book.objects.count()
        available_books = Book.objects.filter(available_copies__gt=0).count()
        borrowed_books = BorrowRecord.objects.filter(is_returned=False).count()
        
        genre_stats = Book.objects.values('genre').annotate(
            count=Count('id'),
            available=Sum('available_copies')
        )
        
        return Response({
            'total_books': total_books,
            'available_books': available_books,
            'borrowed_books': borrowed_books,
            'genre_stats': genre_stats
        })
    
    @action(detail=True, methods=['post'])
    def borrow(self, request, pk=None):
        book = self.get_object()
        user = request.user
        
        if book.available_copies <= 0:
            return Response(
                {'error': 'No copies available for borrowing.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has this book borrowed
        existing_borrow = BorrowRecord.objects.filter(
            book=book, 
            borrower=user, 
            is_returned=False
        ).exists()
        
        if existing_borrow:
            return Response(
                {'error': 'You have already borrowed this book.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has too many borrowed books
        max_books = 5  # Maximum books a user can borrow
        current_borrows = BorrowRecord.objects.filter(
            borrower=user, 
            is_returned=False
        ).count()
        
        if current_borrows >= max_books:
            return Response(
                {'error': f'You can only borrow {max_books} books at a time.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for overdue books
        overdue_books = BorrowRecord.objects.filter(
            borrower=user, 
            is_returned=False,
            due_date__lt=timezone.now().date()
        ).exists()
        
        if overdue_books:
            return Response(
                {'error': 'You have overdue books. Please return them before borrowing new ones.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create borrow record
        borrow_record = BorrowRecord.objects.create(
            book=book,
            borrower=user,
            due_date=timezone.now().date() + timedelta(days=14)  # 2 weeks
        )
        
        # Update book availability
        book.available_copies -= 1
        book.save()
        
        # Check for reservations and update if any
        reservation = Reservation.objects.filter(
            book=book, 
            user=user, 
            status='pending'
        ).first()
        
        if reservation:
            reservation.status = 'fulfilled'
            reservation.save()
        
        serializer = BorrowRecordSerializer(borrow_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        book = self.get_object()
        user = request.user
        
        if book.available_copies > 0:
            return Response(
                {'error': 'Book is available for borrowing. No need to reserve.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has a pending reservation for this book
        existing_reservation = Reservation.objects.filter(
            book=book, 
            user=user, 
            status='pending'
        ).exists()
        
        if existing_reservation:
            return Response(
                {'error': 'You already have a pending reservation for this book.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create reservation
        reservation = Reservation.objects.create(
            book=book,
            user=user,
            expiry_date=timezone.now() + timedelta(days=3)  # 3 days to fulfill
        )
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BorrowRecordViewSet(viewsets.ModelViewSet):
    serializer_class = BorrowRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_returned', 'book', 'borrower']
    ordering_fields = ['borrow_date', 'due_date', 'return_date']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['librarian', 'admin']:
            return BorrowRecord.objects.all()
        
        return BorrowRecord.objects.filter(borrower=user)
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsLibrarian()]
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        # Handle both student and librarian borrow requests
        data = request.data.copy()
        
        # For students, set borrower to current user
        if request.user.user_type == 'student':
            data['borrower'] = request.user.id
        
        # For librarians, they can specify borrower
        elif request.user.user_type in ['librarian', 'admin']:
            if 'borrower' not in data:
                return Response(
                    {'error': 'Borrower ID is required for librarian/admin requests'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Check if book is available
        book_id = data.get('book')
        book = get_object_or_404(Book, id=book_id)
        
        if book.available_copies <= 0:
            return Response(
                {'error': 'No copies available for borrowing.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has this book borrowed
        borrower_id = data.get('borrower', request.user.id)
        existing_borrow = BorrowRecord.objects.filter(
            book=book, 
            borrower_id=borrower_id, 
            is_returned=False
        ).exists()
        
        if existing_borrow:
            return Response(
                {'error': 'This user has already borrowed this book.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has too many borrowed books
        max_books = 5
        current_borrows = BorrowRecord.objects.filter(
            borrower_id=borrower_id, 
            is_returned=False
        ).count()
        
        if current_borrows >= max_books:
            return Response(
                {'error': f'User can only borrow {max_books} books at a time.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for overdue books
        overdue_books = BorrowRecord.objects.filter(
            borrower_id=borrower_id, 
            is_returned=False,
            due_date__lt=timezone.now().date()
        ).exists()
        
        if overdue_books:
            return Response(
                {'error': 'User has overdue books. Please return them before borrowing new ones.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create borrow record
        borrow_record = serializer.save()
        
        # Update book availability
        book.available_copies -= 1
        book.save()
        
        # Check for reservations and update if any
        reservation = Reservation.objects.filter(
            book=book, 
            user_id=borrower_id, 
            status='pending'
        ).first()
        
        if reservation:
            reservation.status = 'fulfilled'
            reservation.save()
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        borrow_record = self.get_object()
        user = request.user
        
        # Check permissions
        if user.user_type not in ['librarian', 'admin'] and borrow_record.borrower != user:
            return Response(
                {'error': 'You can only return your own books.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if borrow_record.is_returned:
            return Response(
                {'error': 'This book has already been returned.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update borrow record
        borrow_record.is_returned = True
        borrow_record.return_date = timezone.now().date()
        borrow_record.calculate_fine()  # Calculate any fines
        borrow_record.save()
        
        # Update book availability
        book = borrow_record.book
        book.available_copies += 1
        book.save()
        
        # Create fine record if applicable
        if borrow_record.fine_amount > 0:
            Fine.objects.create(
                user=borrow_record.borrower,
                borrow_record=borrow_record,
                amount=borrow_record.fine_amount
            )
        
        serializer = self.get_serializer(borrow_record)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        overdue_records = BorrowRecord.objects.filter(
            is_returned=False,
            due_date__lt=timezone.now().date()
        )
        
        page = self.paginate_queryset(overdue_records)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(overdue_records, many=True)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'book', 'user']
    ordering_fields = ['reservation_date', 'expiry_date']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['librarian', 'admin']:
            return Reservation.objects.all()
        
        return Reservation.objects.filter(user=user)
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsLibrarian()]
        return super().get_permissions()
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        user = request.user
        
        # Check permissions
        if user.user_type not in ['librarian', 'admin'] and reservation.user != user:
            return Response(
                {'error': 'You can only cancel your own reservations.'},
                status=status.HTTP_403_FORBidDEN
            )
        
        if reservation.status != 'pending':
            return Response(
                {'error': 'Only pending reservations can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'cancelled'
        reservation.save()
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)

class FineViewSet(viewsets.ModelViewSet):
    serializer_class = FineSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_paid', 'user']
    ordering_fields = ['amount', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['librarian', 'admin']:
            return Fine.objects.all()
        
        return Fine.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        # Ensure only librarians/admins can create fines
        if request.user.user_type not in ['librarian', 'admin']:
            return Response(
                {'error': 'You do not have permission to impose fines.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        fine = self.get_object()
        user = request.user
        
        # Check permissions
        if user.user_type not in ['librarian', 'admin'] and fine.user != user:
            return Response(
                {'error': 'You can only pay your own fines.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if fine.is_paid:
            return Response(
                {'error': 'This fine has already been paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        fine.is_paid = True
        fine.paid_date = timezone.now()
        fine.save()
        
        serializer = self.get_serializer(fine)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        unread_notifications = Notification.objects.filter(
            user=request.user, 
            is_read=False
        )
        
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({'status': 'all notifications marked as read'})

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def users_list(request):
    """Return a list of all users (admin/librarian only)."""
    if request.user.user_type not in ['librarian', 'admin']:
        return Response(
            {'error': 'You do not have permission to view users.'},
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

    
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # or restrict to admins if needed
def create_user(request):
    """Create a new user."""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
def update_user(request, user_id):
    if request.method == 'PUT':
        try:
            user = User.objects.get(id=user_id)
            data = json.loads(request.body)

            # Update only the allowed fields
            user.username = data.get("username", user.username)
            user.email = data.get("email", user.email)
            user.save()

            return JsonResponse({"message": "User updated successfully"})
        except User.DoesNotExist:
            return HttpResponseNotFound({"error": "User not found"})
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def delete_user(request, user_id):
    if request.method == "DELETE":
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({"message": "User deleted successfully"}, status=200)
        except User.DoesNotExist:
            return HttpResponseNotFound("User not found")
    else:
        return JsonResponse({"error": "Invalid request method"}, status=405)
    
# API VIEWS - Add these at the end of the file (remove duplicates)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Dashboard statistics endpoint for librarians/admins"""
    user = request.user
    
    # Only allow librarians and admins to access this endpoint
    if user.user_type not in ['librarian', 'admin']:
        return Response(
            {'error': 'You do not have permission to access this resource.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Calculate statistics
    total_books = Book.objects.count()
    available_books = Book.objects.filter(available_copies__gt=0).count()
    active_borrows = BorrowRecord.objects.filter(is_returned=False).count()
    overdue_books = BorrowRecord.objects.filter(
        is_returned=False, 
        due_date__lt=timezone.now().date()
    ).count()
    total_users = User.objects.count()
    
    # Calculate pending fines
    pending_fines = Fine.objects.filter(is_paid=False).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    stats = {
        'totalBooks': total_books,
        'activeBorrows': active_borrows,
        'availableBooks': available_books,
        'overdueBooks': overdue_books,
        'totalUsers': total_users,
        'pendingFines': float(pending_fines)
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def borrow_records_list(request):
    """Direct endpoint for borrow records"""
    user = request.user
    
    if user.user_type in ['librarian', 'admin']:
        records = BorrowRecord.objects.all().select_related('book', 'borrower')
    else:
        records = BorrowRecord.objects.filter(borrower=user).select_related('book')
    
    records = records.order_by('-borrow_date')
    
    result = []
    for record in records:
        result.append({
            'id': record.id,
            'book_title': record.book.title,
            'book_author': record.book.author,
            'borrower_name': record.borrower.username,
            'borrow_date': record.borrow_date,
            'due_date': record.due_date,
            'return_date': record.return_date,
            'is_returned': record.is_returned,
            'is_overdue': record.is_overdue,
            'fine_amount': float(record.fine_amount) if record.fine_amount else 0.0
        })
    
    return Response(result)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reading_history(request):
    """Simple reading history endpoint"""
    user = request.user
    records = BorrowRecord.objects.filter(borrower=user).select_related('book').order_by('-borrow_date')
    
    history_data = []
    for record in records:
        history_data.append({
            'id': record.id,
            'book_title': record.book.title,
            'book_author': record.book.author,
            'book_isbn': record.book.isbn,
            'borrow_date': record.borrow_date,
            'due_date': record.due_date,
            'return_date': record.return_date,
            'is_returned': record.is_returned,
            'is_overdue': record.is_overdue,
            'fine_amount': float(record.fine_amount) if record.fine_amount else 0.0
        })
    
    return Response(history_data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def personal_stats(request):
    """Personal statistics endpoint"""
    user = request.user
    
    # Calculate statistics
    total_borrowed = BorrowRecord.objects.filter(borrower=user).count()
    currently_borrowed = BorrowRecord.objects.filter(borrower=user, is_returned=False).count()
    overdue_books = BorrowRecord.objects.filter(
        borrower=user, 
        is_returned=False, 
        due_date__lt=timezone.now().date()
    ).count()
    
    total_reservations = Reservation.objects.filter(user=user).count()
    active_reservations = Reservation.objects.filter(user=user, status='pending').count()
    
    total_fines = Fine.objects.filter(user=user, is_paid=False).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Favorite genre
    favorite_genre = BorrowRecord.objects.filter(borrower=user).values(
        'book__genre'
    ).annotate(
        count=Count('id')
    ).order_by('-count').first()
    
    stats = {
        'total_borrowed': total_borrowed,
        'currently_borrowed': currently_borrowed,
        'overdue_books': overdue_books,
        'total_reservations': total_reservations,
        'active_reservations': active_reservations,
        'total_fines': float(total_fines),
        'favorite_genre': favorite_genre['book__genre'] if favorite_genre else 'None'
    }
    
    return Response(stats)