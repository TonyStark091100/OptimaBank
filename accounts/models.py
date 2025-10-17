"""
Django models for the accounts app.
Defines voucher categories, vouchers, user profiles, cart, and redemption models.
"""
import random
import string
import uuid
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser

class VoucherCategory(models.Model):
    """Model representing voucher categories."""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return str(self.name) if self.name else "Unnamed Category"

class Voucher(models.Model):
    """Model representing vouchers that can be redeemed with points."""
    title = models.CharField(max_length=200)
    category = models.ForeignKey(VoucherCategory, on_delete=models.CASCADE)
    points = models.IntegerField()
    original_points = models.IntegerField()
    discount_percentage = models.IntegerField()
    rating = models.FloatField(default=0.0)
    image_url = models.URLField()
    description = models.TextField()
    terms = models.TextField()
    quantity_available = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return str(self.title) if self.title else "Untitled Voucher"

    @property
    def discount(self) -> str:
        """Return formatted discount percentage."""
        return f"{self.discount_percentage}% off"

class Promotion(models.Model):
    """A time-based promotion that applies a percentage discount to selected voucher categories."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    discount_percentage = models.IntegerField(default=20)
    # Daily window (server local time, HH:MM)
    start_time = models.TimeField()
    end_time = models.TimeField()
    # Active on these days: 0=Monday ... 6=Sunday
    active_days = models.CharField(
        max_length=20,
        default="0,1,2,3,4",  # weekdays by default
        help_text="Comma-separated day indices where 0=Mon ... 6=Sun",
    )
    applicable_categories = models.ManyToManyField(VoucherCategory, related_name="promotions", blank=True)
    is_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

    def active_day_indices(self):
        try:
            return [int(x) for x in self.active_days.split(',') if x != '']
        except Exception:
            return []

class UserProfile(models.Model):
    """Model representing user profile with points."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        user_email = getattr(self.user, 'email', 'Unknown')
        return f"{user_email} - {self.points} points"

class Cart(models.Model):
    """Model representing user's shopping cart."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        user_email = getattr(self.user, 'email', 'Unknown')
        return f"Cart for {user_email}"

    @property
    def total_points(self) -> int:
        """Calculate total points for all items in cart."""
        # items is created by the related_name='items' in CartItem model
        # Using getattr to safely access the related manager
        items = getattr(self, 'items', None)
        if items is None:
            return 0
        return sum(item.quantity * item.voucher.points for item in items.all())

class CartItem(models.Model):
    """Model representing individual items in a user's cart."""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        voucher_title = getattr(self.voucher, 'title', 'Unknown')
        return f"{voucher_title} x{self.quantity}"

class Redemption(models.Model):
    """Model representing voucher redemptions."""
    REDEMPTION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    points_used = models.IntegerField()
    coupon_code = models.CharField(max_length=20, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=REDEMPTION_STATUS_CHOICES, default='pending')
    pdf_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        voucher_title = getattr(self.voucher, 'title', 'Unknown')
        return f"Redemption {self.id} - {voucher_title}"

    def save(self, *args, **kwargs):
        """Save method that generates coupon code if not present."""
        if not self.coupon_code:
            self.coupon_code = self.generate_coupon_code()
        super().save(*args, **kwargs)

    def generate_coupon_code(self) -> str:
        """Generate a unique coupon code."""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            # Using getattr to safely access the Django manager
            manager = getattr(self.__class__, 'objects', None)
            if manager is None:
                return code  # Fallback if manager is not available
            if not manager.filter(coupon_code=code).exists():
                return code

class Notification(models.Model):
    """Model representing user notifications."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        user_email = getattr(self.user, 'email', 'Unknown')
        message_preview = str(self.message)[:50] if self.message else ""
        return f"Notification for {user_email}: {message_preview}"


# -------------------------
# Tiered Rewards System
# -------------------------

class RewardTier(models.Model):
    """Model representing reward tiers (Bronze, Silver, Gold, Platinum)."""
    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    tier_name = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    tier_level = models.IntegerField(unique=True)  # 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
    min_points = models.IntegerField()  # Minimum points required for this tier
    color = models.CharField(max_length=7, default='#CD7F32')  # Hex color for Bronze
    icon = models.CharField(max_length=50, default='🥉')  # Emoji icon
    benefits = models.JSONField(default=list)  # List of benefits for this tier
    exclusive_offers = models.BooleanField(default=False)  # Has exclusive offers
    premium_support = models.BooleanField(default=False)  # Has premium support
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['tier_level']

    def __str__(self) -> str:
        return f"{self.get_tier_name_display()} (Level {self.tier_level})"

    def get_next_tier(self):
        """Get the next tier in the hierarchy."""
        return RewardTier.objects.filter(tier_level=self.tier_level + 1).first()


class UserTier(models.Model):
    """Model representing user's current tier and progress."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tier_info')
    current_tier = models.ForeignKey(RewardTier, on_delete=models.CASCADE)
    total_points_earned = models.IntegerField(default=0)  # Lifetime points earned
    tier_points = models.IntegerField(default=0)  # Points earned in current tier
    tier_start_date = models.DateTimeField(auto_now_add=True)
    last_tier_upgrade = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        user_email = getattr(self.user, 'email', 'Unknown')
        tier_name = getattr(self.current_tier, 'tier_name', 'Unknown')
        return f"{user_email} - {tier_name.title()} Tier"

    def calculate_tier_progress(self):
        """Calculate progress towards next tier."""
        next_tier = self.current_tier.get_next_tier()
        if not next_tier:
            return 100  # Already at highest tier
        
        current_tier_min = self.current_tier.min_points
        next_tier_min = next_tier.min_points
        user_total = self.total_points_earned
        
        if user_total >= next_tier_min:
            return 100
        
        progress = ((user_total - current_tier_min) / (next_tier_min - current_tier_min)) * 100
        return max(0, min(100, progress))

    def get_points_to_next_tier(self):
        """Get points needed to reach next tier."""
        next_tier = self.current_tier.get_next_tier()
        if not next_tier:
            return 0  # Already at highest tier
        
        points_needed = next_tier.min_points - self.total_points_earned
        return max(0, points_needed)

    def check_tier_upgrade(self):
        """Check if user should be upgraded to next tier with enhanced real-time logic."""
        next_tier = self.current_tier.get_next_tier()
        if not next_tier:
            return False  # Already at highest tier
        
        # Enhanced tier upgrade logic with more realistic requirements
        points_required = next_tier.min_points
        
        # Check if user has enough points for tier upgrade
        if self.total_points_earned >= points_required:
            old_tier = self.current_tier
            
            # Calculate tier points for the new tier
            tier_points_for_new_tier = self.total_points_earned - points_required
            
            self.current_tier = next_tier
            self.tier_points = tier_points_for_new_tier
            self.last_tier_upgrade = timezone.now()
            self.save()
            
            # Create comprehensive notification for tier upgrade
            tier_benefits = next_tier.tier_benefits.all()[:3]  # Get first 3 benefits
            benefits_text = ""
            if tier_benefits:
                benefits_text = f"\n\nNew benefits unlocked:\n"
                for benefit in tier_benefits:
                    benefits_text += f"• {benefit.benefit_name}\n"
            
            Notification.objects.create(
                user=self.user,
                message=f"🎉 Congratulations! You've been upgraded to {next_tier.get_tier_name_display()} tier!{benefits_text}"
            )
            
            # Check if there's another tier upgrade possible
            self.check_tier_upgrade()  # Recursive check for multiple tier upgrades
            
            return True
        return False
    
    def get_tier_progress_info(self):
        """Get detailed tier progress information for real-time display."""
        next_tier = self.current_tier.get_next_tier()
        
        if not next_tier:
            return {
                'current_tier': self.current_tier,
                'next_tier': None,
                'progress_percentage': 100,
                'points_needed': 0,
                'points_in_current_tier': self.tier_points,
                'is_max_tier': True
            }
        
        current_tier_min = self.current_tier.min_points
        next_tier_min = next_tier.min_points
        points_needed = next_tier_min - self.total_points_earned
        
        progress_percentage = ((self.total_points_earned - current_tier_min) / (next_tier_min - current_tier_min)) * 100
        progress_percentage = max(0, min(100, progress_percentage))
        
        return {
            'current_tier': self.current_tier,
            'next_tier': next_tier,
            'progress_percentage': round(progress_percentage, 1),
            'points_needed': max(0, points_needed),
            'points_in_current_tier': self.tier_points,
            'total_points_earned': self.total_points_earned,
            'is_max_tier': False
        }


class TierBenefit(models.Model):
    """Model representing specific benefits for each tier."""
    tier = models.ForeignKey(RewardTier, on_delete=models.CASCADE, related_name='tier_benefits')
    benefit_name = models.CharField(max_length=200)
    description = models.TextField()
    benefit_type = models.CharField(max_length=50, choices=[
        ('discount', 'Discount'),
        ('exclusive_offer', 'Exclusive Offer'),
        ('premium_support', 'Premium Support'),
        ('early_access', 'Early Access'),
        ('bonus_points', 'Bonus Points'),
        ('free_shipping', 'Free Shipping'),
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        tier_name = getattr(self.tier, 'tier_name', 'Unknown')
        return f"{tier_name.title()} - {self.benefit_name}"


class TierActivity(models.Model):
    """Model to track user activities that contribute to tier progression."""
    ACTIVITY_TYPES = [
        ('login', 'Daily Login'),
        ('transaction', 'Transaction'),
        ('redemption', 'Voucher Redemption'),
        ('referral', 'Referral'),
        ('review', 'Review'),
        ('social_share', 'Social Share'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    points_earned = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        user_email = getattr(self.user, 'email', 'Unknown')
        return f"{user_email} - {self.get_activity_type_display()} (+{self.points_earned} pts)"

    def save(self, *args, **kwargs):
        """Update user tier when activity is saved."""
        super().save(*args, **kwargs)
        
        # Update user's total points and check for tier upgrade
        user_profile, created = UserProfile.objects.get_or_create(user=self.user)
        user_profile.points += self.points_earned
        user_profile.save()
        
        # Update or create user tier
        user_tier, created = UserTier.objects.get_or_create(
            user=self.user,
            defaults={'current_tier': RewardTier.objects.filter(tier_level=1).first()}
        )
        user_tier.total_points_earned += self.points_earned
        user_tier.tier_points += self.points_earned
        
        # Check for tier upgrade
        user_tier.check_tier_upgrade()


class MiniGame(models.Model):
    """Model representing mini-games that users can play to earn points."""
    GAME_TYPES = [
        ('spin_wheel', 'Spin the Wheel'),
        ('memory_game', 'Memory Game'),
        ('trivia_quiz', 'Trivia Quiz'),
        ('daily_challenge', 'Daily Challenge'),
    ]
    
    name = models.CharField(max_length=100)
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    description = models.TextField()
    base_points = models.IntegerField(default=10)
    max_points = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self) -> str:
        return str(self.name)


class GameSession(models.Model):
    """Model representing a user's game session and points earned."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    game = models.ForeignKey(MiniGame, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    points_earned = models.IntegerField(default=0)
    played_at = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-played_at']
    
    def __str__(self) -> str:
        return f"{self.user.email} - {self.game.name} - {self.points_earned} points"


class LeaderboardEntry(models.Model):
    """Model for leaderboard entries with privacy controls."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_points = models.IntegerField(default=0)
    tier_name = models.CharField(max_length=20, default='bronze')
    is_public = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_points', 'last_updated']