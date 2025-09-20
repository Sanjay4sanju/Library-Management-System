from .models import User
from datetime import timedelta
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, Category, Book, BorrowRecord, Reservation, Fine, Notification
from core.models import BorrowRecord 
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'user_type', 'is_active', 'phone_number', 'address', 
            'date_of_birth', 'date_joined', 'is_staff', 'is_superuser', 'password'
        ]
        read_only_fields = ['date_joined', 'is_staff', 'is_superuser']
    
    def create(self, validated_data):
        # Create user with hashed password
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        # Handle password hashing on update
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BookSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Book
        fields = '__all__'

class BorrowRecordSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    borrower_name = serializers.CharField(source='borrower.get_full_name', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    # ✅ explicitly mark due_date as not required
    due_date = serializers.DateField(required=False)

    class Meta:
        model = BorrowRecord
        fields = '__all__'
        read_only_fields = ('borrower', 'fine_amount', 'created_at', 'updated_at')

    def create(self, validated_data):
        # Set default due date if not provided
        if 'due_date' not in validated_data:
            validated_data['due_date'] = timezone.now().date() + timedelta(days=14)

        # Set borrower to current user if not provided
        if 'borrower' not in validated_data:
            validated_data['borrower'] = self.context['request'].user

        return super().create(validated_data)

class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('user', 'reservation_date', 'expiry_date', 'created_at')
class FineSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    book_title = serializers.CharField(
        source='borrow_record.book.title', 
        read_only=True, 
        allow_null=True,
        default=None
    )
    
    class Meta:
        model = Fine
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'borrow_record': {'required': False, 'allow_null': True}
        }
    
    def validate(self, data):
        # Check if borrow_record is provided and if it belongs to the user
        borrow_record = data.get('borrow_record')
        user = data.get('user')
        
        if borrow_record and user:
            if borrow_record.borrower != user:
                raise serializers.ValidationError({"borrow_record": "The borrow record does not belong to this user."})
        
        return data

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include username and password.')
        
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirmation', 
                 'first_name', 'last_name', 'user_type', 'phone_number')
    
    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirmation')
        user = User.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirmation = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirmation']:
            raise serializers.ValidationError("New passwords don't match")
        return data
