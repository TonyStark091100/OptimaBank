from rest_framework import serializers
from .models import (
    Voucher, VoucherCategory, UserProfile, Cart, CartItem, Redemption, Notification,
    RewardTier, UserTier, TierBenefit, TierActivity
)

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

# Tiered Rewards System Serializers
class RewardTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardTier
        fields = [
            'id', 'tier_name', 'tier_level', 'min_points', 'color', 'icon',
            'benefits', 'exclusive_offers', 'premium_support', 'created_at'
        ]

class TierBenefitSerializer(serializers.ModelSerializer):
    class Meta:
        model = TierBenefit
        fields = ['id', 'benefit_name', 'description', 'benefit_type', 'is_active', 'created_at']

class UserTierSerializer(serializers.ModelSerializer):
    current_tier = RewardTierSerializer(read_only=True)
    tier_progress = serializers.SerializerMethodField()
    points_to_next_tier = serializers.SerializerMethodField()
    next_tier = serializers.SerializerMethodField()
    
    class Meta:
        model = UserTier
        fields = [
            'id', 'current_tier', 'total_points_earned', 'tier_points',
            'tier_start_date', 'last_tier_upgrade', 'tier_progress',
            'points_to_next_tier', 'next_tier', 'created_at', 'updated_at'
        ]
        read_only_fields = ['tier_start_date', 'last_tier_upgrade', 'created_at', 'updated_at']
    
    def get_tier_progress(self, obj):
        return obj.calculate_tier_progress()
    
    def get_points_to_next_tier(self, obj):
        return obj.get_points_to_next_tier()
    
    def get_next_tier(self, obj):
        next_tier = obj.current_tier.get_next_tier()
        if next_tier:
            return RewardTierSerializer(next_tier).data
        return None

class TierActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TierActivity
        fields = ['id', 'activity_type', 'points_earned', 'description', 'created_at']
        read_only_fields = ['created_at']

class TierProgressSerializer(serializers.Serializer):
    """Serializer for tier progress information."""
    current_tier = RewardTierSerializer()
    next_tier = RewardTierSerializer(allow_null=True)
    progress_percentage = serializers.FloatField()
    points_to_next_tier = serializers.IntegerField()
    total_points_earned = serializers.IntegerField()
    tier_benefits = TierBenefitSerializer(many=True)
