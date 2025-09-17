from rest_framework import serializers
from .models import Voucher, VoucherCategory, UserProfile, Cart, CartItem, Redemption, Notification

class VoucherCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherCategory
        fields = ['id', 'name', 'icon']

class VoucherSerializer(serializers.ModelSerializer):
    category = VoucherCategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    discount = serializers.ReadOnlyField()
    
    class Meta:
        model = Voucher
        fields = [
            'id', 'title', 'category', 'category_id', 'points', 'original_points',
            'discount_percentage', 'discount', 'rating', 'image_url', 'description',
            'terms', 'quantity_available', 'featured', 'is_active', 'created_at'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'points', 'created_at', 'updated_at']

class CartItemSerializer(serializers.ModelSerializer):
    voucher = VoucherSerializer(read_only=True)
    voucher_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'voucher', 'voucher_id', 'quantity', 'added_at']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_points = serializers.ReadOnlyField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_points', 'created_at', 'updated_at']

class RedemptionSerializer(serializers.ModelSerializer):
    voucher = VoucherSerializer(read_only=True)
    voucher_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Redemption
        fields = [
            'id', 'voucher', 'voucher_id', 'quantity', 'points_used',
            'coupon_code', 'status', 'pdf_url', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'coupon_code', 'status', 'pdf_url', 'created_at', 'completed_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'read', 'created_at']

class AddToCartSerializer(serializers.Serializer):
    voucher_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

class RedeemVoucherSerializer(serializers.Serializer):
    voucher_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)

class CheckoutCartSerializer(serializers.Serializer):
    pass  # No additional fields needed for checkout
