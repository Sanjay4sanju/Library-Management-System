from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Update the router registration
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'borrow-records', views.BorrowRecordViewSet, basename='borrowrecord')
router.register(r'reservations', views.ReservationViewSet, basename='reservation')
router.register(r'fines', views.FineViewSet, basename='fine')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    
    # Add these custom endpoints
    path('borrow-records-list/', views.borrow_records_list, name='borrow-records-list'),
    path('reading-history/', views.reading_history, name='reading-history'),
    path('personal-stats/', views.personal_stats, name='personal-stats'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard-stats'),
    path('impose-overdue-fines/', views.impose_overdue_fines, name='impose-overdue-fines'),
    path('overdue-books/', views.get_overdue_books, name='overdue-books'),
    
    # Add users endpoints
]