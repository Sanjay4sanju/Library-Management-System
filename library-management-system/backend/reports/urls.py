from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('popular-books/', views.popular_books, name='popular_books'),
    path('reading-history/', views.user_reading_history, name='user_reading_history'),
    path('reading-history/<int:user_id>/', views.user_reading_history, name='user_reading_history_detail'),
    path('borrowing-trends/', views.borrowing_trends, name='borrowing_trends'),
    path('user-activity/', views.user_activity_report, name='user_activity_report'),
    path('book-utilization/', views.book_utilization_report, name='book_utilization_report'),
    path('fine-collection/', views.fine_collection_report, name='fine_collection_report'),
    path('personal-stats/', views.personal_stats, name='personal_stats'),
    path('export/<str:report_type>/', views.export_report, name='export_report'),
]