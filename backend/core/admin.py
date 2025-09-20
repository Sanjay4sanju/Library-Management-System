from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Book, BorrowRecord, Reservation, Fine, Notification

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_verified', 'is_staff')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'is_active', 'is_verified')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone_number', 'address', 'date_of_birth', 'is_verified')}),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'isbn', 'genre', 'total_copies', 'available_copies', 'created_at')
    list_filter = ('genre', 'category', 'created_at')
    search_fields = ('title', 'author', 'isbn', 'publisher')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ()
    fieldsets = (
        (None, {
            'fields': ('title', 'author', 'isbn', 'genre', 'category')
        }),
        ('Publication Details', {
            'fields': ('publication_date', 'publisher', 'language', 'pages')
        }),
        ('Inventory', {
            'fields': ('total_copies', 'available_copies', 'description')
        }),
        ('Media', {
            'fields': ('cover_image',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ('book', 'borrower', 'borrow_date', 'due_date', 'is_returned', 'fine_amount')
    list_filter = ('is_returned', 'borrow_date', 'due_date')
    search_fields = ('book__title', 'borrower__username')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'borrow_date'

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('book', 'user', 'reservation_date', 'status', 'expiry_date')
    list_filter = ('status', 'reservation_date')
    search_fields = ('book__title', 'user__username')
    readonly_fields = ('created_at',)

@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ('user', 'borrow_record', 'amount', 'is_paid', 'paid_date')
    list_filter = ('is_paid', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_read', 'notification_type', 'created_at')
    list_filter = ('is_read', 'notification_type', 'created_at')
    search_fields = ('user__username', 'title')
    readonly_fields = ('created_at',)