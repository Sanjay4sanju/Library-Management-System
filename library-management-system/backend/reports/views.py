from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta, datetime
from django.http import JsonResponse
from core.models import Book, BorrowRecord, User, Reservation, Fine
from core.serializers import BookSerializer, BorrowRecordSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    try:
        total_users = User.objects.count()
        total_books = Book.objects.count()
        active_borrows = BorrowRecord.objects.filter(is_returned=False).count()
        pending_reservations = Reservation.objects.filter(status='pending').count()
        
        # Calculate pending fines
        pending_fines = Fine.objects.filter(is_paid=False).aggregate(
            total_fines=Sum('amount')
        )['total_fines'] or 0
        
        # Calculate overdue books
        overdue_books = BorrowRecord.objects.filter(
            is_returned=False, 
            due_date__lt=timezone.now().date()
        ).count()
        
        # Recent activities (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_borrows = BorrowRecord.objects.filter(
            borrow_date__gte=seven_days_ago
        ).count()
        
        recent_returns = BorrowRecord.objects.filter(
            return_date__gte=seven_days_ago
        ).count()

        # Calculate available books
        available_books = Book.objects.filter(available_copies__gt=0).count()
        
        return Response({
            'totalUsers': total_users,
            'totalBooks': total_books,
            'activeBorrows': active_borrows,
            'pendingReservations': pending_reservations,
            'pendingFines': float(pending_fines),
            'overdueBooks': overdue_books,
            'recentBorrows': recent_borrows,
            'recentReturns': recent_returns,
            'availableBooks': available_books
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch dashboard stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def popular_books(request):
    try:
        # Use the correct field name: borrow_records (not borrowrecord)
        popular_books = Book.objects.annotate(
            borrow_count=Count('borrow_records')  # Changed from 'borrowrecord' to 'borrow_records'
        ).order_by('-borrow_count')[:10]
        
        result = []
        for book in popular_books:
            result.append({
                'id': book.id,
                'title': book.title,
                'author': book.author,
                'borrow_count': book.borrow_count,
                'available_copies': book.available_copies,
                'total_copies': book.total_copies,
                'genre': book.genre,
                'isbn': book.isbn
            })
        
        return Response(result)
    except Exception as e:
        print(f"Error in popular_books: {str(e)}")
        return Response(
            {'error': 'Failed to fetch popular books'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_reading_history(request, user_id=None):
    try:
        if user_id and request.user.user_type in ['librarian', 'admin']:
            user = User.objects.get(id=user_id)
        else:
            user = request.user
        
        borrow_records = BorrowRecord.objects.filter(borrower=user).order_by('-borrow_date')
        
        history = []
        for record in borrow_records:
            history.append({
                'id': record.id,
                'book_title': record.book.title,
                'book_author': record.book.author,
                'borrow_date': record.borrow_date,
                'due_date': record.due_date,
                'return_date': record.return_date,
                'is_returned': record.is_returned,
                'is_overdue': record.is_overdue,
                'fine_amount': float(record.fine_amount)
            })
        
        return Response(history)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch reading history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ... keep the rest of your views functions ...
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def borrowing_trends(request):
    # Get borrowing trends for the last 6 months
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=180)  # 6 months
    
    # Generate dates for the period
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    
    # Get daily borrow counts
    daily_borrows = BorrowRecord.objects.filter(
        borrow_date__gte=start_date,
        borrow_date__lte=end_date
    ).values('borrow_date').annotate(count=Count('id')).order_by('borrow_date')
    
    # Convert to dictionary for easy lookup
    borrow_dict = {item['borrow_date']: item['count'] for item in daily_borrows}
    
    # Prepare data for response
    trend_data = []
    for date in dates:
        trend_data.append({
            'date': date.isoformat(),
            'borrows': borrow_dict.get(date, 0)
        })
    
    return Response(trend_data)

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def user_activity_report(request):
    # Get user activity statistics
    user_activity = User.objects.annotate(
        total_borrows=Count('borrowrecord'),
        active_borrows=Count('borrowrecord', filter=Q(borrowrecord__is_returned=False)),
        total_fines=Sum('fines__amount', filter=Q(fines__is_paid=False)),
        total_reservations=Count('reservations')
    ).values(
        'id', 'username', 'email', 'user_type', 'date_joined',
        'total_borrows', 'active_borrows', 'total_fines', 'total_reservations'
    ).order_by('-total_borrows')
    
    return Response(list(user_activity))

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def book_utilization_report(request):
    # Get book utilization statistics
    book_utilization = Book.objects.annotate(
        total_borrows=Count('borrowrecord'),
        current_borrows=Count('borrowrecord', filter=Q(borrowrecord__is_returned=False)),
        utilization_rate=(Count('borrowrecord') * 100.0) / F('total_copies')
    ).values(
        'id', 'title', 'author', 'total_copies', 'available_copies',
        'total_borrows', 'current_borrows', 'utilization_rate'
    ).order_by('-utilization_rate')
    
    return Response(list(book_utilization))

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def fine_collection_report(request):
    # Get fine collection statistics
    time_filter = request.GET.get('time_filter', 'month')  # month, quarter, year
    
    now = timezone.now()
    if time_filter == 'month':
        start_date = now - timedelta(days=30)
    elif time_filter == 'quarter':
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    fine_stats = Fine.objects.filter(
        paid_date__gte=start_date,
        is_paid=True
    ).extra({
        'paid_day': "date(paid_date)"
    }).values('paid_day').annotate(
        total_amount=Sum('amount'),
        count=Count('id')
    ).order_by('paid_day')
    
    return Response(list(fine_stats))

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def personal_stats(request):
    user = request.user
    
    stats = {
        'total_borrowed': BorrowRecord.objects.filter(borrower=user).count(),
        'currently_borrowed': BorrowRecord.objects.filter(borrower=user, is_returned=False).count(),
        'total_reservations': Reservation.objects.filter(user=user).count(),
        'active_reservations': Reservation.objects.filter(user=user, status='pending').count(),
        'total_fines': Fine.objects.filter(user=user, is_paid=False).aggregate(Sum('amount'))['amount__sum'] or 0,
        'favorite_genre': BorrowRecord.objects.filter(borrower=user)
            .values('book__genre')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
    }
    
    # Convert Decimal to float for JSON serialization
    stats['total_fines'] = float(stats['total_fines'])
    
    # Handle favorite_genre
    if stats['favorite_genre']:
        stats['favorite_genre'] = stats['favorite_genre']['book__genre']
    else:
        stats['favorite_genre'] = 'None'
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def export_report(request, report_type):
    # This would typically generate and return a file (CSV, PDF, etc.)
    # For now, we'll return JSON data that can be used to generate reports
    
    if report_type == 'users':
        data = User.objects.all().values('username', 'email', 'user_type', 'date_joined', 'is_active')
    elif report_type == 'books':
        data = Book.objects.all().values('title', 'author', 'isbn', 'genre', 'total_copies', 'available_copies')
    elif report_type == 'transactions':
        data = BorrowRecord.objects.all().values(
            'book__title', 'borrower__username', 'borrow_date', 
            'due_date', 'return_date', 'is_returned', 'fine_amount'
        )
    else:
        return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(list(data))

    