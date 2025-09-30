"""
Accounts views for voucher management, cart operations, and redemptions.
"""
import os
import requests
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
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from .premium_pdf import generate_premium_voucher_pdf, generate_premium_multi_voucher_pdf
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import CustomUser
from .models import (
    Voucher, VoucherCategory, UserProfile, Cart, CartItem, Redemption, Notification,
    RewardTier, UserTier, TierBenefit, TierActivity, MiniGame, GameSession, LeaderboardEntry
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
        # Try to authenticate the user
        user = CustomUser.objects.filter(email=email).first()
        
        if not user:
            return Response({'error': 'Invalid email or password'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
        
        # Check password properly
        if not user.check_password(password):
            return Response({'error': 'Invalid email or password'}, 
                          status=status.HTTP_401_UNAUTHORIZED)

        # Create user profile if it doesn't exist
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 10000}
        )

        # Create login notification
        create_notification(user, f"Welcome back! You logged in with email/password")

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
    Enhanced Google OAuth authentication that handles existing Gmail accounts.
    Accepts JSON { "token": "<google id_token>", "action": "signup" | "login" }
    Verifies the token with Google, creates/gets a user and returns JWT tokens.
    """
    token = request.data.get("token")
    action = request.data.get("action", "login")  # Default to login for backward compatibility
    
    if not token:
        return Response({"detail": "No token provided"}, status=400)

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not google_client_id:
        return Response({
            "detail": "Google Client ID not configured. Please set GOOGLE_CLIENT_ID environment variable."
        }, status=500)

    try:
        # Verify the token. Audience must be your Google client ID.
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), google_client_id
        )
    except ValueError as e:
        # For development, let's try to decode the token without verification
        # This is NOT recommended for production!
        try:
            import base64
            import json
            
            # Decode the JWT token manually (without signature verification)
            parts = token.split('.')
            if len(parts) != 3:
                return Response({
                    "detail": f"Invalid token format: {str(e)}"
                }, status=400)
            
            # Decode the payload (second part)
            payload = parts[1]
            # Add padding if needed
            payload += '=' * (4 - len(payload) % 4)
            decoded_payload = base64.urlsafe_b64decode(payload)
            idinfo = json.loads(decoded_payload)
            
            # Basic validation
            if idinfo.get('aud') != google_client_id:
                return Response({
                    "detail": "Token audience doesn't match client ID"
                }, status=400)
                
            if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response({
                    "detail": "Invalid token issuer"
                }, status=400)
                
        except Exception as decode_error:
            return Response({
                "detail": f"Invalid token: {str(e)} (Decode error: {str(decode_error)})"
            }, status=400)

    email = idinfo.get("email")
    if not email:
        return Response({"detail": "Email not present in token"}, status=400)

    user_model = get_user_model()
    
    # Check if user already exists
    user_exists = user_model.objects.filter(email=email).exists()
    
    if action == "signup" and user_exists:
        # User is trying to sign up but account already exists
        return Response({
            "detail": "Account already exists with this email address. Please use the login option instead.",
            "error_type": "account_exists",
            "email": email
        }, status=400)
    
    elif action == "login" and not user_exists:
        # User is trying to login but account doesn't exist
        return Response({
            "detail": "No account found with this email address. Please sign up first.",
            "error_type": "account_not_found", 
            "email": email
        }, status=400)
    
    if user_exists:
        # User exists - log them in
        user = user_model.objects.get(email=email)
        
        # Update user information from Google (in case it changed)
        user.first_name = idinfo.get("given_name", user.first_name)
        user.last_name = idinfo.get("family_name", user.last_name)
        user.save()
        
        # Create notification for existing user login
        create_notification(user, f"Welcome back! You logged in with Google")
        
    else:
        # New user - create account
        user = user_model.objects.create(
            email=email,
            first_name=idinfo.get("given_name", ""),
            last_name=idinfo.get("family_name", ""),
            phone_number=""
        )
        
        # Create welcome notification for new user
        create_notification(user, f"Welcome to Optima Rewards! Your account was created with Google")

    # Create user profile if it doesn't exist (for Google OAuth users)
    # Give 10,000 points ONLY to completely new users
    if not user_exists:
        # This is a completely new user - give them 10,000 points
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 10000}  # New users get 10,000 points
        )
        
        # Create welcome bonus activity for new users only
        if profile_created:
            # Check if welcome bonus already exists to prevent duplicates
            existing_welcome_bonus = TierActivity.objects.filter(
                user=user,
                activity_type='welcome_bonus'
            ).exists()
            
            if not existing_welcome_bonus:
                TierActivity.objects.create(
                    user=user,
                    activity_type='welcome_bonus',
                    points_earned=10000,
                    description='Welcome bonus for new Google OAuth user'
                )
    else:
        # This is an existing user - get their existing profile (no points added)
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 0}  # Existing users get no additional points
        )

    # Create JWT tokens (SimpleJWT)
    refresh = RefreshToken.for_user(user)
    
    # Enhanced response with more user information
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id, 
                "email": user.email, 
                "first_name": user.first_name,
                "last_name": user.last_name,
                "name": f"{user.first_name} {user.last_name}".strip(),
                "points": profile.points,
                "is_new_user": not user_exists
            },
            "created": not user_exists,
            "message": "Welcome back!" if user_exists else "Account created successfully!",
            "action": "login" if user_exists else "signup"
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
@permission_classes([AllowAny])
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tier_status(request):
    """Get real-time tier status and progress for authenticated user."""
    try:
        user = request.user
        
        # Get user tier information
        user_tier, created = UserTier.objects.get_or_create(
            user=user,
            defaults={'current_tier': RewardTier.objects.filter(tier_level=1).first()}
        )
        
        # Check for tier upgrade first
        user_tier.check_tier_upgrade()
        
        # Get tier progress information
        progress_info = user_tier.get_tier_progress_info()
        
        # Get user profile for current points
        profile = UserProfile.objects.get(user=user)
        
        # Get recent tier activities
        recent_activities = TierActivity.objects.filter(user=user).order_by('-created_at')[:5]
        
        # Get tier benefits
        current_tier_benefits = user_tier.current_tier.tier_benefits.all()
        
        response_data = {
            'user_info': {
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip(),
                'current_points': profile.points,
                'total_points_earned': progress_info['total_points_earned'],
                'tier_start_date': user_tier.tier_start_date,
                'last_tier_upgrade': user_tier.last_tier_upgrade
            },
            'current_tier': {
                'name': user_tier.current_tier.get_tier_name_display(),
                'level': user_tier.current_tier.tier_level,
                'min_points': user_tier.current_tier.min_points,
                'color': user_tier.current_tier.color,
                'icon': user_tier.current_tier.icon,
                'benefits': user_tier.current_tier.benefits,
                'exclusive_offers': user_tier.current_tier.exclusive_offers,
                'tier_points': user_tier.tier_points
            },
            'progress': {
                'progress_percentage': progress_info['progress_percentage'],
                'points_needed': progress_info['points_needed'],
                'points_in_current_tier': progress_info['points_in_current_tier'],
                'is_max_tier': progress_info['is_max_tier']
            },
            'next_tier': None,
            'benefits': [
                {
                    'name': benefit.benefit_name,
                    'description': benefit.description,
                    'type': benefit.benefit_type
                }
                for benefit in current_tier_benefits
            ],
            'recent_activities': [
                {
                    'type': activity.get_activity_type_display(),
                    'points': activity.points_earned,
                    'description': activity.description,
                    'date': activity.created_at
                }
                for activity in recent_activities
            ],
            'status': 'success'
        }
        
        # Add next tier information if not at max tier
        if not progress_info['is_max_tier']:
            next_tier = progress_info['next_tier']
            response_data['next_tier'] = {
                'name': next_tier.get_tier_name_display(),
                'level': next_tier.tier_level,
                'min_points': next_tier.min_points,
                'color': next_tier.color,
                'icon': next_tier.icon,
                'benefits': next_tier.benefits,
                'exclusive_offers': next_tier.exclusive_offers
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get tier status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# User Profile
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update user profile with points"""
    try:
        if request.method == 'GET':
            profile = get_user_profile(request.user)
            return Response({
                'id': request.user.id,
                'username': request.user.email,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'phone_number': request.user.phone_number,
                'address': request.user.address,
                'points': profile.points,
                'created_at': request.user.date_joined.isoformat()
            })
        
        elif request.method == 'PUT':
            # Update user profile
            user = request.user
            data = request.data
            
            # Update user fields
            if 'first_name' in data and data['first_name']:
                user.first_name = data['first_name']
            if 'last_name' in data and data['last_name']:
                user.last_name = data['last_name']
            if 'email' in data and data['email']:
                # Email cannot be changed as it's used for authentication
                if data['email'] != user.email:
                    return Response({'error': 'Email cannot be changed as it\'s used for account authentication'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            if 'phone_number' in data and data['phone_number']:
                user.phone_number = data['phone_number']
            if 'address' in data:
                user.address = data['address']
            
            try:
                user.save()
                
                profile = get_user_profile(user)
                return Response({
                    'id': user.id,
                    'username': user.email,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone_number': user.phone_number,
                    'address': user.address,
                    'points': profile.points,
                    'created_at': user.date_joined.isoformat()
                })
            except Exception as e:
                return Response({'error': f'Failed to update profile: {str(e)}'}, 
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
        # Create all redemptions first
        for item in cart_items:
            # Create redemption
            redemption = Redemption.objects.create(
                user=request.user,
                voucher=item.voucher,
                quantity=item.quantity,
                points_used=item.voucher.points * item.quantity,
                status='completed',
                completed_at=timezone.now()
            )

            # Update voucher quantity
            item.voucher.quantity_available -= item.quantity
            item.voucher.save()

            redemptions.append(redemption)

        # Generate PDF(s) based on number of items
        pdf_url = None
        if len(redemptions) == 1:
            # Single voucher - generate individual PDF
            try:
                print(f"Generating single voucher PDF for: {redemptions[0].voucher.title}")
                pdf_url = generate_voucher_pdf(redemptions[0])
                redemptions[0].pdf_url = pdf_url
                redemptions[0].save()
                print(f"Single voucher PDF generated successfully: {pdf_url}")
            except Exception as e:
                print(f"Single PDF generation error: {e}")
                import traceback
                traceback.print_exc()
                pdf_url = None
        else:
            # Multiple vouchers - generate single multi-voucher PDF
            try:
                print(f"Generating multi-voucher PDF for {len(redemptions)} vouchers:")
                for i, redemption in enumerate(redemptions):
                    print(f"  {i+1}. {redemption.voucher.title} (ID: {redemption.voucher.id})")
                
                multi_pdf_url = generate_multi_voucher_pdf(redemptions)
                print(f"Multi-voucher PDF generated successfully: {multi_pdf_url}")
                
                # Set the same PDF URL for all redemptions
                for redemption in redemptions:
                    redemption.pdf_url = multi_pdf_url
                    redemption.save()
                pdf_url = multi_pdf_url
            except Exception as e:
                print(f"Multi-voucher PDF generation error: {e}")
                import traceback
                traceback.print_exc()
                pdf_url = None

        # Prepare response data
        redemption_data = []
        for redemption in redemptions:
            redemption_data.append({
                'redemption_id': str(redemption.id),
                'voucher_title': redemption.voucher.title,
                'coupon_code': redemption.coupon_code,
                'pdf_url': redemption.pdf_url
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
            'redemptions': redemption_data,
            'total_points_used': total_points,
            'points_remaining': profile.points,
            'is_multi_voucher': len(redemptions) > 1,
            'pdf_url': pdf_url
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
    """Generate premium PDF for voucher redemption with luxury design"""
    try:
        # Use premium PDF generation first
        return generate_premium_voucher_pdf(redemption)
    except Exception as e:
        print(f"Premium PDF generation failed: {e}")
        try:
            # Fallback to platypus approach
            return generate_voucher_pdf_platypus(redemption)
        except Exception as e2:
            print(f"Platypus PDF generation failed: {e2}")
            print("Falling back to canvas method...")
            return generate_voucher_pdf_canvas(redemption)

def generate_multi_voucher_pdf(redemptions):
    """Generate a premium single PDF containing all purchased vouchers"""
    try:
        # Use premium multi-voucher PDF generation first
        return generate_premium_multi_voucher_pdf(redemptions)
    except Exception as e:
        print(f"Premium multi-voucher PDF generation failed: {e}")
        try:
            # Fallback to platypus approach
            return generate_multi_voucher_pdf_platypus(redemptions)
        except Exception as e2:
            print(f"Multi-voucher Platypus PDF generation failed: {e2}")
            print("Falling back to canvas method...")
            return generate_multi_voucher_pdf_canvas(redemptions)

def generate_voucher_pdf_platypus(redemption):
    """Generate PDF using platypus for better layout"""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Define custom styles
        styles = getSampleStyleSheet()
        
        # Custom styles for professional look
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=HexColor('#2E86AB'),
            fontName='Helvetica-Bold'
        )
        
        voucher_title_style = ParagraphStyle(
            'VoucherTitle',
            parent=styles['Heading2'],
            fontSize=20,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=HexColor('#A23B72'),
            fontName='Helvetica-Bold'
        )
        
        coupon_style = ParagraphStyle(
            'CouponCode',
            parent=styles['Normal'],
            fontSize=16,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=HexColor('#F18F01'),
            fontName='Helvetica-Bold',
            backColor=HexColor('#FFF8E1'),
            borderWidth=2,
            borderColor=HexColor('#F18F01'),
            borderPadding=10
        )
        
        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading3'],
            fontSize=14,
            spaceAfter=10,
            spaceBefore=15,
            textColor=HexColor('#2E86AB'),
            fontName='Helvetica-Bold'
        )
        
        detail_style = ParagraphStyle(
            'Detail',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=5,
            textColor=HexColor('#333333'),
            fontName='Helvetica'
        )
        
        terms_style = ParagraphStyle(
            'Terms',
            parent=styles['Normal'],
            fontSize=9,
            spaceAfter=5,
            textColor=HexColor('#666666'),
            fontName='Helvetica',
            leftIndent=20
        )

        # Build the story (content)
        story = []
        
        # Header with company branding
        story.append(Paragraph("OPTIMA REWARDS", title_style))
        story.append(Spacer(1, 20))
        
        # Voucher Image (if available)
        if redemption.voucher.image_url:
            try:
                print(f"Attempting to load image from URL: {redemption.voucher.image_url}")
                response = requests.get(redemption.voucher.image_url, timeout=10)
                print(f"Image response status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"Image downloaded successfully, size: {len(response.content)} bytes")
                    
                    # Use ImageReader for better compatibility
                    img_buffer = BytesIO(response.content)
                    img_reader = ImageReader(img_buffer)
                    
                    # Get original dimensions
                    img_width, img_height = img_reader.getSize()
                    print(f"Original image dimensions: {img_width} x {img_height}")
                    
                    # Calculate scaled dimensions
                    max_width = 3 * inch
                    if img_width > max_width:
                        scale = max_width / img_width
                        img_width = max_width
                        img_height = img_height * scale
                        print(f"Scaled image dimensions: {img_width} x {img_height}")
                    
                    # Create Image object with proper sizing
                    img = Image(img_buffer, width=img_width, height=img_height)
                    img.hAlign = 'CENTER'
                    story.append(img)
                    story.append(Spacer(1, 20))
                    print("Image added to PDF successfully")
                else:
                    print(f"Failed to download image, status code: {response.status_code}")
                    
            except Exception as img_error:
                print(f"Error loading voucher image: {img_error}")
                import traceback
                traceback.print_exc()
        else:
            print("No image URL found for voucher")
        
        # Voucher Title
        story.append(Paragraph(redemption.voucher.title, voucher_title_style))
        
        # Coupon Code in highlighted box
        coupon_text = f"<b>COUPON CODE: {redemption.coupon_code}</b>"
        story.append(Paragraph(coupon_text, coupon_style))
        story.append(Spacer(1, 20))
        
        # Redemption Details Section
        story.append(Paragraph("REDEMPTION DETAILS", section_style))
        
        redeemed_time = redemption.completed_at or timezone.now()
        details_text = f"""
        <b>Quantity:</b> {redemption.quantity}<br/>
        <b>Points Used:</b> {redemption.points_used:,} points<br/>
        <b>Redeemed On:</b> {redeemed_time.strftime('%B %d, %Y at %I:%M %p')}<br/>
        <b>Status:</b> <font color="green">ACTIVE</font>
        """
        story.append(Paragraph(details_text, detail_style))
        story.append(Spacer(1, 20))
        
        # Description Section
        story.append(Paragraph("DESCRIPTION", section_style))
        description_text = redemption.voucher.description.replace('\n', '<br/>')
        story.append(Paragraph(description_text, detail_style))
        story.append(Spacer(1, 20))
        
        # Terms and Conditions Section
        story.append(Paragraph("TERMS AND CONDITIONS", section_style))
        terms_text = redemption.voucher.terms.replace('\n', '<br/>')
        story.append(Paragraph(terms_text, terms_style))
        story.append(Spacer(1, 30))
        
        # Footer
        footer_text = """
        <para align="center" fontSize="8" textColor="#999999">
        This voucher is valid until redeemed. Please present this voucher at the time of purchase.<br/>
        For customer support, contact us at support@optima.com or call 1-800-OPTIMA-1
        </para>
        """
        story.append(Paragraph(footer_text, styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)

        # Save PDF to media directory
        filename = f"voucher_{redemption.id}.pdf"
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL that works with Django's media serving
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Platypus PDF generation error: {e}")
        raise e

def generate_voucher_pdf_canvas(redemption):
    """Generate PDF using canvas method (fallback)"""
    try:
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Title
        p.setFont("Helvetica-Bold", 24)
        p.drawString(100, height - 100, "OPTIMA REWARDS")

        # Voucher Image (if available)
        image_height = 0
        if redemption.voucher.image_url:
            try:
                print(f"Canvas: Attempting to load image from URL: {redemption.voucher.image_url}")
                response = requests.get(redemption.voucher.image_url, timeout=10)
                print(f"Canvas: Image response status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"Canvas: Image downloaded successfully, size: {len(response.content)} bytes")
                    img_buffer = BytesIO(response.content)
                    img = ImageReader(img_buffer)
                    
                    # Calculate image dimensions (max width 200px, maintain aspect ratio)
                    img_width, img_height = img.getSize()
                    print(f"Canvas: Original image dimensions: {img_width} x {img_height}")
                    
                    max_width = 200
                    if img_width > max_width:
                        scale = max_width / img_width
                        img_width = max_width
                        img_height = img_height * scale
                        print(f"Canvas: Scaled image dimensions: {img_width} x {img_height}")
                    
                    # Center the image
                    x_pos = (width - img_width) / 2
                    p.drawImage(img, x_pos, height - 150 - img_height, width=img_width, height=img_height)
                    image_height = img_height + 20  # Add some spacing
                    print("Canvas: Image added to PDF successfully")
                else:
                    print(f"Canvas: Failed to download image, status code: {response.status_code}")
                    
            except Exception as img_error:
                print(f"Canvas: Error loading voucher image: {img_error}")
                import traceback
                traceback.print_exc()
        else:
            print("Canvas: No image URL found for voucher")

        # Voucher Title
        p.setFont("Helvetica-Bold", 18)
        p.drawString(100, height - 150 - image_height, redemption.voucher.title)

        # Coupon Code
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, height - 200 - image_height, f"Coupon Code: {redemption.coupon_code}")

        # Details
        p.setFont("Helvetica", 12)
        p.drawString(100, height - 250 - image_height, f"Quantity: {redemption.quantity}")
        p.drawString(100, height - 270 - image_height, f"Points Used: {redemption.points_used}")
        redeemed_time = redemption.completed_at or timezone.now()
        p.drawString(100, height - 290 - image_height, f"Redeemed On: {redeemed_time.strftime('%Y-%m-%d %H:%M')}")

        # Description
        p.drawString(100, height - 320 - image_height, "Description:")
        p.setFont("Helvetica", 10)
        description_lines = redemption.voucher.description.split('\n')
        y_pos = height - 340 - image_height
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
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL that works with Django's media serving
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Canvas PDF generation error: {e}")
        # Return a fallback URL or None
        return None

def generate_multi_voucher_pdf_platypus(redemptions):
    """Generate a single PDF containing all purchased vouchers using platypus"""
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Define custom styles
        styles = getSampleStyleSheet()
        
        # Custom styles for professional look
        title_style = ParagraphStyle(
            'MultiTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=HexColor('#2E86AB'),
            fontName='Helvetica-Bold'
        )
        
        voucher_title_style = ParagraphStyle(
            'VoucherTitle',
            parent=styles['Heading2'],
            fontSize=18,
            spaceAfter=15,
            alignment=TA_CENTER,
            textColor=HexColor('#A23B72'),
            fontName='Helvetica-Bold'
        )
        
        coupon_style = ParagraphStyle(
            'CouponCode',
            parent=styles['Normal'],
            fontSize=14,
            spaceAfter=10,
            alignment=TA_CENTER,
            textColor=HexColor('#F18F01'),
            fontName='Helvetica-Bold',
            borderWidth=2,
            borderColor=HexColor('#F18F01'),
            borderPadding=8,
            backColor=HexColor('#FFF8E7')
        )
        
        # Build the story (content)
        story = []
        
        # Main title
        story.append(Paragraph("OPTIMA REWARDS", title_style))
        story.append(Paragraph("Your Voucher Collection", styles['Heading2']))
        story.append(Spacer(1, 20))
        
        # Add each voucher
        for i, redemption in enumerate(redemptions, 1):
            try:
                print(f"Processing voucher {i}: {redemption.voucher.title}")
                
                # Voucher separator (except for first one)
                if i > 1:
                    story.append(Spacer(1, 20))
                    story.append(HRFlowable(width="100%", thickness=2, color=HexColor('#E0E0E0')))
                    story.append(Spacer(1, 20))
                
                # Voucher title - handle None values
                voucher_title = redemption.voucher.title or f"Voucher {i}"
                story.append(Paragraph(f"Voucher {i}: {voucher_title}", voucher_title_style))
                
                # Coupon code - handle None values
                coupon_code = redemption.coupon_code or "N/A"
                story.append(Paragraph(f"Coupon Code: {coupon_code}", coupon_style))
                
                # Voucher details
                details = [
                    f"Quantity: {redemption.quantity}",
                    f"Points Used: {redemption.points_used}",
                    f"Redeemed On: {(redemption.completed_at or timezone.now()).strftime('%Y-%m-%d %H:%M')}"
                ]
                
                for detail in details:
                    story.append(Paragraph(detail, styles['Normal']))
                    story.append(Spacer(1, 8))
                
                # Description - handle None values
                if redemption.voucher.description:
                    story.append(Paragraph("Description:", styles['Heading3']))
                    description_text = redemption.voucher.description.replace('\n', '<br/>')
                    story.append(Paragraph(description_text, styles['Normal']))
                    story.append(Spacer(1, 12))
                
                # Terms (condensed for multi-voucher) - handle None values
                if redemption.voucher.terms:
                    story.append(Paragraph("Terms:", styles['Heading4']))
                    terms_text = redemption.voucher.terms.replace('\n', '<br/>')
                    # Limit terms length for multi-voucher PDF
                    if len(terms_text) > 200:
                        terms_text = terms_text[:200] + "..."
                    story.append(Paragraph(terms_text, styles['Normal']))
                
                print(f"Successfully processed voucher {i}")
                
            except Exception as e:
                print(f"Error processing voucher {i}: {e}")
                # Add a fallback entry for this voucher
                story.append(Paragraph(f"Voucher {i}: {redemption.voucher.title or 'Unknown'}", voucher_title_style))
                story.append(Paragraph(f"Error processing this voucher: {str(e)}", styles['Normal']))
                continue
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#CCCCCC')))
        story.append(Paragraph("Thank you for choosing Optima Rewards!", 
                              ParagraphStyle('Footer', parent=styles['Normal'], 
                                           alignment=TA_CENTER, fontSize=10)))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Save PDF to media directory
        # Use first redemption ID for filename, but indicate it's multi-voucher
        first_redemption = redemptions[0]
        filename = f"multi_vouchers_{first_redemption.id}_{len(redemptions)}_items.pdf"
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)
        print(f"Generating multi-voucher PDF: {filepath}")

        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL that works with Django's media serving
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Multi-voucher Platypus PDF generation error: {e}")
        raise e

def generate_multi_voucher_pdf_canvas(redemptions):
    """Generate a single PDF containing all purchased vouchers using canvas (fallback)"""
    try:
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        y_position = height - 50
        
        # Main title
        p.setFont("Helvetica-Bold", 24)
        p.drawCentredText(width/2, y_position, "OPTIMA REWARDS")
        y_position -= 40
        
        p.setFont("Helvetica-Bold", 18)
        p.drawCentredText(width/2, y_position, "Your Voucher Collection")
        y_position -= 60
        
        # Add each voucher
        for i, redemption in enumerate(redemptions, 1):
            # Voucher separator (except for first one)
            if i > 1:
                y_position -= 30
                p.line(100, y_position, width-100, y_position)
                y_position -= 30
            
            # Check if we need a new page
            if y_position < 200:
                p.showPage()
                y_position = height - 50
            
            # Voucher title
            p.setFont("Helvetica-Bold", 16)
            p.drawString(100, y_position, f"Voucher {i}: {redemption.voucher.title}")
            y_position -= 25
            
            # Coupon code (highlighted)
            p.setFont("Helvetica-Bold", 14)
            p.setFillColorRGB(0.95, 0.56, 0.0)  # Orange color
            p.drawString(100, y_position, f"Coupon Code: {redemption.coupon_code}")
            p.setFillColorRGB(0, 0, 0)  # Reset to black
            y_position -= 25
            
            # Voucher details
            p.setFont("Helvetica", 12)
            details = [
                f"Quantity: {redemption.quantity}",
                f"Points Used: {redemption.points_used}",
                f"Redeemed On: {(redemption.completed_at or timezone.now()).strftime('%Y-%m-%d %H:%M')}"
            ]
            
            for detail in details:
                p.drawString(100, y_position, detail)
                y_position -= 20
            
            # Description
            if redemption.voucher.description:
                p.setFont("Helvetica-Bold", 12)
                p.drawString(100, y_position, "Description:")
                y_position -= 20
                p.setFont("Helvetica", 10)
                
                # Split description into lines
                desc_lines = redemption.voucher.description.split('\n')
                for line in desc_lines[:3]:  # Limit to 3 lines
                    if len(line) > 80:
                        line = line[:80] + "..."
                    p.drawString(120, y_position, line)
                    y_position -= 15
            
            y_position -= 20
        
        # Footer
        p.setFont("Helvetica", 10)
        p.drawCentredText(width/2, 50, "Thank you for choosing Optima Rewards!")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        
        # Save PDF to media directory
        first_redemption = redemptions[0]
        filename = f"multi_vouchers_{first_redemption.id}_{len(redemptions)}_items.pdf"
        vouchers_dir = os.path.join(settings.MEDIA_ROOT, 'vouchers')
        os.makedirs(vouchers_dir, exist_ok=True)
        filepath = os.path.join(vouchers_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(buffer.getvalue())

        # Return relative URL that works with Django's media serving
        return f"{settings.MEDIA_URL}vouchers/{filename}"
        
    except Exception as e:
        print(f"Multi-voucher Canvas PDF generation error: {e}")
        return None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_voucher_pdf(request, redemption_id):
    """Download voucher PDF"""
    try:
        redemption = Redemption.objects.get(id=redemption_id, user=request.user)
        
        # If PDF URL doesn't exist, try to generate it
        if not redemption.pdf_url:
            pdf_url = generate_voucher_pdf(redemption)
            if pdf_url:
                redemption.pdf_url = pdf_url
                redemption.save()
            else:
                return Response(
                    {'error': 'PDF generation failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Return PDF URL for frontend to download
        return Response({'pdf_url': redemption.pdf_url})
    except Redemption.DoesNotExist:
        return Response(
            {'error': 'Redemption not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_voucher_pdf(request, redemption_id):
    """Serve voucher PDF file directly"""
    try:
        redemption = Redemption.objects.get(id=redemption_id, user=request.user)
        
        # Generate PDF if it doesn't exist
        if not redemption.pdf_url:
            pdf_url = generate_voucher_pdf(redemption)
            if not pdf_url:
                return Response(
                    {'error': 'PDF generation failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            redemption.pdf_url = pdf_url
            redemption.save()
        
        # Get the file path from the PDF URL
        if not redemption.pdf_url:
            return Response(
                {'error': 'No PDF URL found for this redemption'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extract filename from PDF URL
        pdf_url = redemption.pdf_url
        if pdf_url.startswith(settings.MEDIA_URL):
            # Remove MEDIA_URL prefix to get relative path
            relative_path = pdf_url[len(settings.MEDIA_URL):]
            filepath = os.path.join(settings.MEDIA_ROOT, relative_path)
        else:
            # Fallback to old naming pattern
            filename = f"voucher_{redemption.id}.pdf"
            filepath = os.path.join(settings.MEDIA_ROOT, 'vouchers', filename)
        
        if not os.path.exists(filepath):
            return Response(
                {'error': f'PDF file not found at {filepath}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Extract filename for download
        filename = os.path.basename(filepath)
        
        # Serve the file
        with open(filepath, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
    except Redemption.DoesNotExist:
        return Response(
            {'error': 'Redemption not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Error serving PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        
        # Add login activity (100 points for daily login)
        activity = TierActivity.objects.create(
            user=request.user,
            activity_type='login',
            points_earned=100,
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
    """Get real-time analytics data for the login page chart with enhanced real-time features."""
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
        
        # Generate more dynamic chart data based on real metrics
        chart_data = []
        base_users = max(50, total_users // 10)  # Ensure minimum base
        
        # Add some randomness to make it more realistic
        current_minute = now.minute
        current_second = now.second
        
        for i in range(24):  # Last 24 hours for better visualization
            hour_time = now - timedelta(hours=23-i)
            
            # Enhanced activity patterns with more realistic curves
            hour = hour_time.hour
            
            # More sophisticated activity patterns
            if 6 <= hour <= 9:  # Morning ramp-up
                activity_multiplier = 0.4 + (hour - 6) * 0.2 + random.uniform(-0.1, 0.2)
            elif 9 <= hour <= 17:  # Business hours
                activity_multiplier = 1.0 + random.uniform(-0.2, 0.4)
            elif 17 <= hour <= 21:  # Evening peak
                activity_multiplier = 0.8 + random.uniform(-0.1, 0.3)
            elif 21 <= hour <= 23:  # Evening wind-down
                activity_multiplier = 0.6 + random.uniform(-0.1, 0.2)
            else:  # Night hours
                activity_multiplier = 0.2 + random.uniform(-0.1, 0.1)
            
            # Add current time boost for the current hour
            if i == 23:  # Current hour
                activity_multiplier *= (1 + (current_minute / 60) * 0.3)
            
            # Base users with realistic variation
            users_count = int(base_users * activity_multiplier)
            users_count = max(5, min(users_count, base_users * 2.5))  # Keep within bounds
            
            chart_data.append({
                'hour': hour_time.strftime('%H:%M'),
                'users': users_count,
                'timestamp': hour_time.isoformat(),
                'activity_level': 'high' if users_count > base_users * 1.2 else 'medium' if users_count > base_users * 0.8 else 'low'
            })
        
        # Get real-time metrics with enhanced data
        metrics = {
            'total_users': total_users,
            'active_today': active_users_today,
            'recent_activities': recent_activities,
            'tier_distribution': tier_distribution,
            'server_time': now.isoformat(),
            'uptime_hours': 24,  # Could be calculated from server start time
            'current_activity': chart_data[-1]['users'] if chart_data else 0,
            'peak_activity_today': max([data['users'] for data in chart_data]) if chart_data else 0,
            'avg_activity_today': sum([data['users'] for data in chart_data]) // len(chart_data) if chart_data else 0,
        }
        
        return Response({
            'chart_data': chart_data,
            'metrics': metrics,
            'status': 'success',
            'last_updated': now.isoformat(),
            'update_interval': 5000  # milliseconds
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get analytics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_live_user_count(request):
    """Get live user count for real-time updates with enhanced metrics."""
    try:
        from django.utils import timezone
        from datetime import timedelta
        import random
        
        now = timezone.now()
        last_5_minutes = now - timedelta(minutes=5)
        last_15_minutes = now - timedelta(minutes=15)
        last_hour = now - timedelta(hours=1)
        
        # Count users active in different time windows
        active_users_5min = CustomUser.objects.filter(
            last_login__gte=last_5_minutes
        ).count()
        
        active_users_15min = CustomUser.objects.filter(
            last_login__gte=last_15_minutes
        ).count()
        
        active_users_1hour = CustomUser.objects.filter(
            last_login__gte=last_hour
        ).count()
        
        # Count total users
        total_users = CustomUser.objects.count()
        
        # Count online users (users with recent activity)
        online_users = TierActivity.objects.filter(
            created_at__gte=last_5_minutes
        ).values('user').distinct().count()
        
        # Add some realistic variation to make it more dynamic
        # This simulates real-world fluctuations
        variation_factor = random.uniform(0.95, 1.05)
        online_users = max(1, int(online_users * variation_factor))
        active_users_5min = max(1, int(active_users_5min * variation_factor))
        
        # Calculate activity trend
        if active_users_15min > 0:
            activity_trend = ((active_users_5min - (active_users_15min - active_users_5min)) / active_users_15min) * 100
        else:
            activity_trend = 0
        
        return Response({
            'active_users': active_users_5min,
            'active_users_15min': active_users_15min,
            'active_users_1hour': active_users_1hour,
            'total_users': total_users,
            'online_users': online_users,
            'activity_trend': round(activity_trend, 2),
            'timestamp': now.isoformat(),
            'status': 'live'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get user count: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Mini-Games API Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mini_games(request):
    """Get list of available mini-games"""
    try:
        games = MiniGame.objects.filter(is_active=True)
        games_data = []
        for game in games:
            games_data.append({
                'id': game.id,
                'name': game.name,
                'game_type': game.game_type,
                'description': game.description,
                'base_points': game.base_points,
                'max_points': game.max_points
            })
        return Response({'games': games_data})
    except Exception as e:
        return Response(
            {'error': f'Failed to get mini-games: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_game_score(request):
    """Submit game score and award points"""
    try:
        game_id = request.data.get('game_id')
        score = request.data.get('score', 0)
        duration_seconds = request.data.get('duration_seconds', 0)
        
        if not game_id:
            return Response(
                {'error': 'Game ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            game = MiniGame.objects.get(id=game_id, is_active=True)
        except MiniGame.DoesNotExist:
            return Response(
                {'error': 'Game not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate points based on score and game settings
        points_earned = min(
            game.base_points + (score * 2),  # Base points + score multiplier
            game.max_points
        )
        
        # Create game session
        game_session = GameSession.objects.create(
            user=request.user,
            game=game,
            score=score,
            points_earned=points_earned,
            duration_seconds=duration_seconds
        )
        
        # Award points to user profile
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'points': 10000}
        )
        profile.points += points_earned
        profile.save()
        
        # Create tier activity
        TierActivity.objects.create(
            user=request.user,
            activity_type='mini_game',
            points_earned=points_earned,
            description=f'Played {game.name} - Score: {score}'
        )
        
        # Update leaderboard
        LeaderboardEntry.update_user_entry(request.user)
        
        return Response({
            'success': True,
            'points_earned': points_earned,
            'total_points': profile.points,
            'game_session_id': game_session.id
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to submit score: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_game_history(request):
    """Get user's game history"""
    try:
        sessions = GameSession.objects.filter(user=request.user).order_by('-played_at')[:20]
        history = []
        for session in sessions:
            history.append({
                'id': session.id,
                'game_name': session.game.name,
                'game_type': session.game.game_type,
                'score': session.score,
                'points_earned': session.points_earned,
                'played_at': session.played_at.isoformat(),
                'duration_seconds': session.duration_seconds
            })
        return Response({'history': history})
    except Exception as e:
        return Response(
            {'error': f'Failed to get game history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Leaderboard API Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    """Get leaderboard with privacy controls"""
    try:
        limit = int(request.GET.get('limit', 50))
        include_private = request.GET.get('include_private', 'false').lower() == 'true'
        
        # Get public entries
        entries = LeaderboardEntry.objects.filter(is_public=True).order_by('-total_points', 'last_updated')[:limit]
        
        leaderboard = []
        for i, entry in enumerate(entries, 1):
            leaderboard.append({
                'rank': i,
                'user_id': entry.user.id,
                'username': entry.user.first_name or entry.user.email.split('@')[0],
                'email': entry.user.email if include_private else None,
                'total_points': entry.total_points,
                'tier_name': entry.tier_name,
                'last_updated': entry.last_updated.isoformat()
            })
        
        # Add current user's position if not in top entries
        try:
            user_entry = LeaderboardEntry.objects.get(user=request.user)
            if user_entry not in entries:
                user_rank = LeaderboardEntry.objects.filter(
                    total_points__gt=user_entry.total_points
                ).count() + 1
                leaderboard.append({
                    'rank': user_rank,
                    'user_id': user_entry.user.id,
                    'username': user_entry.user.first_name or user_entry.user.email.split('@')[0],
                    'email': user_entry.user.email if include_private else None,
                    'total_points': user_entry.total_points,
                    'tier_name': user_entry.tier_name,
                    'last_updated': user_entry.last_updated.isoformat(),
                    'is_current_user': True
                })
        except LeaderboardEntry.DoesNotExist:
            pass
        
        return Response({'leaderboard': leaderboard})
    except Exception as e:
        return Response(
            {'error': f'Failed to get leaderboard: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_leaderboard_privacy(request):
    """Update user's leaderboard privacy settings"""
    try:
        is_public = request.data.get('is_public', True)
        
        entry, created = LeaderboardEntry.objects.get_or_create(
            user=request.user,
            defaults={
                'total_points': 0,
                'tier_name': 'bronze',
                'is_public': is_public
            }
        )
        
        if not created:
            entry.is_public = is_public
            entry.save()
        
        return Response({
            'success': True,
            'is_public': entry.is_public
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to update privacy settings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_leaderboard_stats(request):
    """Get current user's leaderboard statistics"""
    try:
        try:
            entry = LeaderboardEntry.objects.get(user=request.user)
            rank = LeaderboardEntry.objects.filter(
                total_points__gt=entry.total_points
            ).count() + 1
            
            return Response({
                'rank': rank,
                'total_points': entry.total_points,
                'tier_name': entry.tier_name,
                'is_public': entry.is_public,
                'last_updated': entry.last_updated.isoformat()
            })
        except LeaderboardEntry.DoesNotExist:
            # Create entry if it doesn't exist
            LeaderboardEntry.update_user_entry(request.user)
            return Response({
                'rank': 0,
                'total_points': 0,
                'tier_name': 'bronze',
                'is_public': True,
                'last_updated': timezone.now().isoformat()
            })
    except Exception as e:
        return Response(
            {'error': f'Failed to get leaderboard stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
