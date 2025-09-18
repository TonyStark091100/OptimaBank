from django.contrib import admin
from .models import (
    VoucherCategory, Voucher, UserProfile, Cart, CartItem, Redemption, Notification,
    RewardTier, UserTier, TierBenefit, TierActivity
)

@admin.register(VoucherCategory)
class VoucherCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'created_at')
    search_fields = ('name',)

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'points', 'discount_percentage', 'rating', 'featured', 'is_active')
    list_filter = ('category', 'featured', 'is_active', 'created_at')
    search_fields = ('title', 'description')
    list_editable = ('featured', 'is_active')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    list_filter = ('created_at', 'updated_at')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_points', 'created_at', 'updated_at')
    search_fields = ('user__email',)

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'voucher', 'quantity', 'added_at')
    list_filter = ('added_at',)

@admin.register(Redemption)
class RedemptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'voucher', 'quantity', 'points_used', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'voucher__title', 'coupon_code')
    list_editable = ('status',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'read', 'created_at')
    list_filter = ('read', 'created_at')
    search_fields = ('user__email', 'message')
    list_editable = ('read',)

# Tiered Rewards System Admin
@admin.register(RewardTier)
class RewardTierAdmin(admin.ModelAdmin):
    list_display = ('tier_name', 'tier_level', 'min_points', 'color', 'icon', 'exclusive_offers', 'premium_support')
    list_filter = ('tier_level', 'exclusive_offers', 'premium_support')
    list_editable = ('min_points', 'color', 'icon', 'exclusive_offers', 'premium_support')
    ordering = ('tier_level',)

@admin.register(UserTier)
class UserTierAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_tier', 'total_points_earned', 'tier_points', 'tier_start_date', 'last_tier_upgrade')
    list_filter = ('current_tier', 'tier_start_date', 'last_tier_upgrade')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('tier_start_date', 'last_tier_upgrade', 'created_at', 'updated_at')

@admin.register(TierBenefit)
class TierBenefitAdmin(admin.ModelAdmin):
    list_display = ('tier', 'benefit_name', 'benefit_type', 'is_active', 'created_at')
    list_filter = ('tier', 'benefit_type', 'is_active')
    search_fields = ('benefit_name', 'description')
    list_editable = ('is_active',)

@admin.register(TierActivity)
class TierActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'points_earned', 'description', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__email', 'description')
    readonly_fields = ('created_at',)
