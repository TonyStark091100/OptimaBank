"""
Accounts views for voucher management, cart operations, and redemptions.
"""
import os
from io import BytesIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import CustomUser
from .models import (
    Voucher, VoucherCategory, UserProfile, Cart, CartItem, Redemption, Notification,
    RewardTier, UserTier, TierBenefit, TierActivity
)
from .serializers import (
    RewardTierSerializer, UserTierSerializer, TierBenefitSerializer, TierActivitySerializer
)

def index(request):
    """Simple index view for the accounts app."""
    _ = request.method
    return HttpResponse("Hello from Accounts app!")

def voucher_display(request):
    """Simple HTML view to display vouchers"""
    vouchers = Voucher.objects.filter(is_active=True)
    categories = VoucherCategory.objects.all()

    context = {
        'vouchers': vouchers,
        'categories': categories,
    }
    return render(request, 'accounts/voucher_display.html', context)

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint that returns JWT tokens"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password required'},
        status=status.HTTP_400_BAD_REQUEST)

    try:
        # For demo purposes, accept any email/password combination
        # In production, you'd validate credentials properly
        user, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'first_name': email.split('@')[0],
                'last_name': 'User',
                'phone_number': '+1234567890'
            }
        )

        # Create user profile if it doesn't exist
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 10000}
        )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'points': profile.points
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # no auth required for this endpoint
def google_auth(request):
    """
    Accepts JSON { "token": "<google id_token>" }
    Verifies the token with Google, creates/gets a user and returns JWT tokens.
    """
    token = request.data.get("token")
    if not token:
        return Response({"detail": "No token provided"}, status=400)

    try:
        # Verify the token. Audience must be your Google client ID.
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
    except ValueError:
        return Response({"detail": "Invalid token"}, status=400)

    email = idinfo.get("email")
    if not email:
        return Response({"detail": "Email not present in token"}, status=400)

    user_model = get_user_model()
    # Create user with custom user model
    user, _ = user_model.objects.get_or_create(
        email=email,
        defaults={
            "first_name": idinfo.get("given_name", ""),
            "last_name": idinfo.get("family_name", ""),
            "phone_number": ""
        }
    )

    # Optional: update user fields from Google payload
    name = idinfo.get("name")
    if name and getattr(user, "get_full_name", None):
        # if your User model stores first_name/last_name, you can split and update here
        pass

    # Create user profile if it doesn't exist (for Google OAuth users)
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'points': 10000}
    )

    # Create JWT tokens (SimpleJWT)
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "email": user.email, "name": idinfo.get("name")},
            "created": False,
        }
    )

# Helper functions
def get_user_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'points': 10000})
    return profile

def get_user_cart(user):
    """Get or create cart for the given user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart

def create_notification(user, message):
    """Create a notification for the given user."""
    Notification.objects.create(user=user, message=message)

# Voucher Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def voucher_list(request):
    """Get list of vouchers with optional filtering"""
    queryset = Voucher.objects.filter(is_active=True)
    category = request.query_params.get('category')
    search = request.query_params.get('search')

    if category and category != 'All Vouchers':
        queryset = queryset.filter(category__name=category)

    if search:
        queryset = queryset.filter(
            title__icontains=search
        ) | queryset.filter(
            description__icontains=search
        )

    vouchers = queryset.order_by('-featured', '-created_at')

    data = []
    for voucher in vouchers:
        data.append({
            'id': voucher.id,
            'title': voucher.title,
            'category': voucher.category.name,
            'points': voucher.points,
            'original_points': voucher.original_points,
            'discount': voucher.discount,
            'rating': voucher.rating,
            'image_url': voucher.image_url,
            'description': voucher.description,
            'terms': voucher.terms,
            'quantity_available': voucher.quantity_available,
            'featured': voucher.featured,
            'created_at': voucher.created_at.isoformat()
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def voucher_detail(request, voucher_id):
    """Get voucher details"""
    try:
        voucher = Voucher.objects.get(id=voucher_id, is_active=True)
        data = {
            'id': voucher.id,
            'title': voucher.title,
            'category': voucher.category.name,
            'points': voucher.points,
            'original_points': voucher.original_points,
            'discount': voucher.discount,
            'rating': voucher.rating,
            'image_url': voucher.image_url,
            'description': voucher.description,
            'terms': voucher.terms,
            'quantity_available': voucher.quantity_available,
            'featured': voucher.featured,
            'created_at': voucher.created_at.isoformat()
        }
        return Response(data)
    except Voucher.DoesNotExist:
        return Response({'error': 'Voucher not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access for demo
def category_list(request):
    """Get list of voucher categories"""
    categories = VoucherCategory.objects.all()
    data = [{'id': cat.id, 'name': cat.name, 'icon': cat.icon} for cat in categories]
    return Response(data)

# User Profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get user profile with points"""
    try:
        profile = get_user_profile(request.user)
        return Response({
            'id': request.user.id,
            'username': request.user.email,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'points': profile.points,
            'created_at': request.user.date_joined.isoformat()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Cart Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    """Get user's cart"""
    try:
        cart = get_user_cart(request.user)
        items = []
        for item in cart.items.all():
            items.append({
                'id': item.id,
                'voucher': {
                    'id': item.voucher.id,
                    'title': item.voucher.title,
                    'points': item.voucher.points,
                    'image_url': item.voucher.image_url
                },
                'quantity': item.quantity,
                'added_at': item.added_at.isoformat()
            })

        return Response({
            'id': cart.id,
            'items': items,
            'total_points': cart.total_points,
            'created_at': cart.created_at.isoformat(),
            'updated_at': cart.updated_at.isoformat()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add voucher to cart"""
    voucher_id = request.data.get('voucher_id')
    quantity = request.data.get('quantity', 1)

    if not voucher_id:
        return Response({'error': 'Voucher ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        voucher = Voucher.objects.get(id=voucher_id, is_active=True)

        if voucher.quantity_available < quantity:
            return Response(
                {'error': 'Insufficient quantity available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = get_user_cart(request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            voucher=voucher,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        create_notification(request.user, f"Added {voucher.title} to cart")

        return Response(
            {'message': f'{voucher.title} added to cart successfully'},
            status=status.HTTP_201_CREATED
        )
    except Voucher.DoesNotExist:
        return Response(
            {'error': 'Voucher not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, item_id):
    """Update cart item quantity"""
    quantity = request.data.get('quantity')

    if not quantity or quantity < 1:
        return Response({'error': 'Valid quantity is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = get_user_cart(request.user)
        cart_item = CartItem.objects.get(id=item_id, cart=cart)

        if cart_item.voucher.quantity_available < quantity:
            return Response(
                {'error': 'Insufficient quantity available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        return Response({'message': 'Cart item updated successfully'})
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, item_id):
    """Remove item from cart"""
    try:
        cart = get_user_cart(request.user)
        cart_item = CartItem.objects.get(id=item_id, cart=cart)
        cart_item.delete()
        return Response({'message': 'Item removed from cart'})
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Cart item not found'},
            status=status.HTTP_404_NOT_FOUND
        )

# Redemption Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def redeem_voucher(request):
    """Redeem a single voucher"""
    voucher_id = request.data.get('voucher_id')
    quantity = request.data.get('quantity', 1)

    if not voucher_id:
        return Response({'error': 'Voucher ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        voucher = Voucher.objects.get(id=voucher_id, is_active=True)
        total_points = voucher.points * quantity

        profile = get_user_profile(request.user)

        if profile.points < total_points:
            return Response(
                {'error': f'Insufficient points. You need {total_points} points '
                          f'but have {profile.points}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if voucher.quantity_available < quantity:
            return Response(
                {'error': 'Insufficient quantity available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Create redemption
            redemption = Redemption.objects.create(
                user=request.user,
                voucher=voucher,
                quantity=quantity,
                points_used=total_points,
                status='completed'
            )

            # Update user points
            profile.points -= total_points
            profile.save()

            # Update voucher quantity
            voucher.quantity_available -= quantity
            voucher.save()

            # Generate PDF
            try:
                pdf_url = generate_voucher_pdf(redemption)
                redemption.pdf_url = pdf_url
            except Exception as e:
                print(f"PDF generation error: {e}")
                pdf_url = None
            redemption.completed_at = timezone.now()
            redemption.save()

            create_notification(
                request.user,
                f"Successfully redeemed {voucher.title} for {total_points} points"
            )

            return Response({
                'message': 'Voucher redeemed successfully',
                'redemption_id': str(redemption.id),
                'coupon_code': redemption.coupon_code,
                'pdf_url': pdf_url,
                'points_remaining': profile.points
            }, status=status.HTTP_201_CREATED)

    except Voucher.DoesNotExist:
        return Response(
            {'error': 'Voucher not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_cart(request):
    """Checkout entire cart"""
    cart = get_user_cart(request.user)
    cart_items = cart.items.all()

    if not cart_items.exists():
        return Response(
            {'error': 'Cart is empty'},
            status=status.HTTP_400_BAD_REQUEST
        )

    total_points = sum(item.quantity * item.voucher.points for item in cart_items)
    profile = get_user_profile(request.user)

    if profile.points < total_points:
        return Response(
            {'error': f'Insufficient points. You need {total_points} points '
                     f'but have {profile.points}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check availability for all items
    for item in cart_items:
        if item.voucher.quantity_available < item.quantity:
            return Response(
                {'error': f'Insufficient quantity available for {item.voucher.title}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    redemptions = []

    with transaction.atomic():
        for item in cart_items:
            # Create redemption
            redemption = Redemption.objects.create(
                user=request.user,
                voucher=item.voucher,
                quantity=item.quantity,
                points_used=item.voucher.points * item.quantity,
                status='completed'
            )

            # Update voucher quantity
            item.voucher.quantity_available -= item.quantity
            item.voucher.save()

            # Generate PDF
            try:
                pdf_url = generate_voucher_pdf(redemption)
                redemption.pdf_url = pdf_url
            except Exception as e:
                print(f"PDF generation error: {e}")
                pdf_url = None
            redemption.completed_at = timezone.now()
            redemption.save()

            redemptions.append({
                'redemption_id': str(redemption.id),
                'voucher_title': item.voucher.title,
                'coupon_code': redemption.coupon_code,
                'pdf_url': pdf_url
            })

        # Update user points
        profile.points -= total_points
        profile.save()

        # Clear cart
        cart_items.delete()

        create_notification(
            request.user,
            f"Successfully checked out cart for {total_points} points"
        )

        return Response({
            'message': 'Cart checked out successfully',
            'redemptions': redemptions,
            'total_points_used': total_points,
            'points_remaining': profile.points
        }, status=status.HTTP_201_CREATED)

# Notification Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """Get user notifications"""
    try:
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for notification in notifications:
            data.append({
                'id': notification.id,
                'message': notification.message,
                'read': notification.read,
                'created_at': notification.created_at.isoformat()
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """Mark all notifications as read"""
    try:
        Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'message': 'All notifications marked as read'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# PDF Generation
def generate_voucher_pdf(redemption):
    """Generate PDF for voucher redemption"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    _, height = letter

    # Title
    p.setFont("Helvetica-Bold", 24)
    p.drawString(100, height - 100, "OPTIMA REWARDS")

    # Voucher Title
    p.setFont("Helvetica-Bold", 18)
    p.drawString(100, height - 150, redemption.voucher.title)

    # Coupon Code
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 200, f"Coupon Code: {redemption.coupon_code}")

    # Details
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 250, f"Quantity: {redemption.quantity}")
    p.drawString(100, height - 270, f"Points Used: {redemption.points_used}")
    redeemed_time = redemption.completed_at or timezone.now()
    p.drawString(100, height - 290, f"Redeemed On: {redeemed_time.strftime('%Y-%m-%d %H:%M')}")

    # Description
    p.drawString(100, height - 320, "Description:")
    p.setFont("Helvetica", 10)
    description_lines = redemption.voucher.description.split('\n')
    y_pos = height - 340
    for line in description_lines[:5]:  # Limit to 5 lines
        p.drawString(120, y_pos, line[:80])  # Limit line length
        y_pos -= 15

    # Terms
    p.setFont("Helvetica", 12)
    p.drawString(100, y_pos - 20, "Terms and Conditions:")
    p.setFont("Helvetica", 10)
    terms_lines = redemption.voucher.terms.split('\n')
    y_pos -= 40
    for line in terms_lines[:8]:  # Limit to 8 lines
        p.drawString(120, y_pos, line[:80])
        y_pos -= 15

    p.showPage()
    p.save()

    buffer.seek(0)

    # Save PDF to media directory
    filename = f"voucher_{redemption.id}.pdf"
    filepath = os.path.join(settings.MEDIA_ROOT, 'vouchers', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'wb') as f:
        f.write(buffer.getvalue())

    # Return URL
    return f"{settings.MEDIA_URL}vouchers/{filename}"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_voucher_pdf(request, redemption_id):
    """Download voucher PDF"""
    try:
        redemption = Redemption.objects.get(id=redemption_id, user=request.user)
        if not redemption.pdf_url:
            return Response(
                {'error': 'PDF not available'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Return PDF URL for frontend to download
        return Response({'pdf_url': redemption.pdf_url})
    except Redemption.DoesNotExist:
        return Response(
            {'error': 'Redemption not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# -------------------------
# Tiered Rewards System Views
# -------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_tier_info(request):
    """Get user's current tier information and progress."""
    try:
        user_tier, created = UserTier.objects.get_or_create(
            user=request.user,
            defaults={'current_tier': RewardTier.objects.filter(tier_level=1).first()}
        )
        
        # Get tier benefits
        tier_benefits = TierBenefit.objects.filter(tier=user_tier.current_tier, is_active=True)
        
        # Calculate progress
        progress_data = {
            'current_tier': RewardTierSerializer(user_tier.current_tier).data,
            'next_tier': RewardTierSerializer(user_tier.current_tier.get_next_tier()).data if user_tier.current_tier.get_next_tier() else None,
            'progress_percentage': user_tier.calculate_tier_progress(),
            'points_to_next_tier': user_tier.get_points_to_next_tier(),
            'total_points_earned': user_tier.total_points_earned,
            'tier_benefits': TierBenefitSerializer(tier_benefits, many=True).data,
            'tier_points': user_tier.tier_points,
            'tier_start_date': user_tier.tier_start_date,
            'last_tier_upgrade': user_tier.last_tier_upgrade,
        }
        
        return Response(progress_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get tier info: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_tiers(request):
    """Get all available reward tiers."""
    try:
        tiers = RewardTier.objects.all().order_by('tier_level')
        serializer = RewardTierSerializer(tiers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to get tiers: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tier_benefits(request, tier_id):
    """Get benefits for a specific tier."""
    try:
        tier = RewardTier.objects.get(id=tier_id)
        benefits = TierBenefit.objects.filter(tier=tier, is_active=True)
        serializer = TierBenefitSerializer(benefits, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except RewardTier.DoesNotExist:
        return Response(
            {'error': 'Tier not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to get tier benefits: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_activities(request):
    """Get user's tier activities."""
    try:
        activities = TierActivity.objects.filter(user=request.user).order_by('-created_at')[:20]
        serializer = TierActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to get activities: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tier_activity(request):
    """Add a new tier activity for the user."""
    try:
        activity_type = request.data.get('activity_type')
        points_earned = request.data.get('points_earned', 0)
        description = request.data.get('description', '')
        
        if not activity_type:
            return Response(
                {'error': 'Activity type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the activity (this will automatically update user tier)
        activity = TierActivity.objects.create(
            user=request.user,
            activity_type=activity_type,
            points_earned=points_earned,
            description=description
        )
        
        serializer = TierActivitySerializer(activity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to add activity: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_login_activity(request):
    """Simulate daily login activity for tier progression."""
    try:
        # Check if user already has login activity today
        today = timezone.now().date()
        existing_activity = TierActivity.objects.filter(
            user=request.user,
            activity_type='login',
            created_at__date=today
        ).first()
        
        if existing_activity:
            return Response(
                {'message': 'Daily login bonus already claimed today'},
                status=status.HTTP_200_OK
            )
        
        # Add login activity (10 points for daily login)
        activity = TierActivity.objects.create(
            user=request.user,
            activity_type='login',
            points_earned=10,
            description='Daily login bonus'
        )
        
        # Get updated tier info
        user_tier = UserTier.objects.get(user=request.user)
        tier_info = {
            'activity': TierActivitySerializer(activity).data,
            'tier_info': UserTierSerializer(user_tier).data,
            'message': f'Daily login bonus! +{activity.points_earned} points'
        }
        
        return Response(tier_info, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to add login activity: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# -------------------------
# Real-time Analytics Views
# -------------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def get_realtime_analytics(request):
    """Get real-time analytics data for the login page chart."""
    try:
        from django.utils import timezone
        from datetime import timedelta
        import random
        
        # Get current time and calculate time ranges
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        last_day = now - timedelta(days=1)
        last_week = now - timedelta(weeks=1)
        
        # Get real user data
        total_users = CustomUser.objects.count()
        active_users_today = CustomUser.objects.filter(
            last_login__date=now.date()
        ).count()
        
        # Get tier distribution
        tier_distribution = {}
        for tier in RewardTier.objects.all():
            user_count = UserTier.objects.filter(current_tier=tier).count()
            tier_distribution[tier.tier_name] = user_count
        
        # Get recent activities
        recent_activities = TierActivity.objects.filter(
            created_at__gte=last_hour
        ).count()
        
        # Generate realistic chart data based on real metrics
        chart_data = []
        base_users = max(50, total_users // 10)  # Ensure minimum base
        
        for i in range(12):  # Last 12 hours
            hour_time = now - timedelta(hours=11-i)
            
            # Simulate realistic user activity patterns
            # Higher activity during business hours (9 AM - 5 PM)
            hour = hour_time.hour
            if 9 <= hour <= 17:
                activity_multiplier = 1.2 + random.uniform(-0.2, 0.3)
            elif 18 <= hour <= 22:
                activity_multiplier = 0.8 + random.uniform(-0.1, 0.2)
            else:
                activity_multiplier = 0.3 + random.uniform(-0.1, 0.1)
            
            # Base users with realistic variation
            users_count = int(base_users * activity_multiplier)
            users_count = max(10, min(users_count, base_users * 2))  # Keep within bounds
            
            chart_data.append({
                'hour': hour_time.strftime('%H:%M'),
                'users': users_count,
                'timestamp': hour_time.isoformat()
            })
        
        # Get real-time metrics
        metrics = {
            'total_users': total_users,
            'active_today': active_users_today,
            'recent_activities': recent_activities,
            'tier_distribution': tier_distribution,
            'server_time': now.isoformat(),
            'uptime_hours': 24,  # Could be calculated from server start time
        }
        
        return Response({
            'chart_data': chart_data,
            'metrics': metrics,
            'status': 'success'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get analytics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_live_user_count(request):
    """Get live user count for real-time updates."""
    try:
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        last_5_minutes = now - timedelta(minutes=5)
        
        # Count users active in last 5 minutes
        active_users = CustomUser.objects.filter(
            last_login__gte=last_5_minutes
        ).count()
        
        # Count total users
        total_users = CustomUser.objects.count()
        
        # Count online users (simplified - users with recent activity)
        online_users = TierActivity.objects.filter(
            created_at__gte=last_5_minutes
        ).values('user').distinct().count()
        
        return Response({
            'active_users': active_users,
            'total_users': total_users,
            'online_users': online_users,
            'timestamp': now.isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get user count: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
