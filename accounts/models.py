from django.db import models
from django.conf import settings
import uuid
import random
import string

class VoucherCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Voucher(models.Model):
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
    
    def __str__(self):
        return self.title
    
    @property
    def discount(self):
        return f"{self.discount_percentage}% off"

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.points} points"

class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"

    @property
    def total_points(self):
        return sum(item.quantity * item.voucher.points for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.voucher.title} x{self.quantity}"

class Redemption(models.Model):
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
    pdf_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Redemption {self.id} - {self.voucher.title}"

    def save(self, *args, **kwargs):
        if not self.coupon_code:
            self.coupon_code = self.generate_coupon_code()
        super().save(*args, **kwargs)

    def generate_coupon_code(self):
        """Generate a unique coupon code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Redemption.objects.filter(coupon_code=code).exists():
                return code

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.message[:50]}"
