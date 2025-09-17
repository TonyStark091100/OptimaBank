# accounts/views.py
import os
import uuid
import random
import string
from django.http import HttpResponse, FileResponse
from django.shortcuts import render
from django.contrib.auth import get_user_model
from users.models import CustomUser
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# DRF helpers
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

# SimpleJWT - already imported above

# google auth
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Import models (you'll need to create these)
from .models import Voucher, VoucherCategory, UserProfile, Cart, CartItem, Redemption, Notification

def index(request):
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
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # For demo purposes, accept any email/password combination
        # In production, you'd validate credentials properly
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'first_name': email.split('@')[0],
                'last_name': 'User',
                'phone_number': '+1234567890'
            }
        )
        
        # Create user profile if it doesn't exist
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'points': 5000}
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

    User = get_user_model()
    # Create user with custom user model
    user, created = User.objects.get_or_create(
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

    # Create JWT tokens (SimpleJWT)
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": user.id, "email": user.email, "name": idinfo.get("name")},
            "created": created,
        }
    )

# Helper functions
def get_user_profile(user):
    profile, created = UserProfile.objects.get_or_create(user=user)
    return profile

def get_user_cart(user):
    cart, created = Cart.objects.get_or_create(user=user)
    return cart

def create_notification(user, message):
    Notification.objects.create(user=user, message=message)

# Voucher Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Enable authentication
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
@permission_classes([AllowAny])  # Allow unauthenticated access for demo
def user_profile(request):
    """Get user profile with points - demo version"""
    # For demo purposes, return a mock user profile
    return Response({
        'id': 1,
        'username': 'demo@example.com',
        'email': 'demo@example.com',
        'points': 5000,  # Demo points
        'created_at': '2024-01-01T00:00:00Z'
    })

# Cart Views
@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access for demo
def cart_detail(request):
    """Get user's cart - demo version"""
    # For demo purposes, return an empty cart
    return Response({
        'id': 1,
        'items': [],
        'total_points': 0,
        'created_at': '2024-01-01T00:00:00Z',
        'updated_at': '2024-01-01T00:00:00Z'
    })

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
        
        user_profile = get_user_profile(request.user)
        
        if user_profile.points < total_points:
            return Response(
                {'error': f'Insufficient points. You need {total_points} points but have {user_profile.points}'}, 
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
            user_profile.points -= total_points
            user_profile.save()
            
            # Update voucher quantity
            voucher.quantity_available -= quantity
            voucher.save()
            
            # Generate PDF
            pdf_url = generate_voucher_pdf(redemption)
            redemption.pdf_url = pdf_url
            redemption.completed_at = timezone.now()
            redemption.save()
            
            create_notification(request.user, f"Successfully redeemed {voucher.title} for {total_points} points")
            
            return Response({
                'message': 'Voucher redeemed successfully',
                'redemption_id': str(redemption.id),
                'coupon_code': redemption.coupon_code,
                'pdf_url': pdf_url,
                'points_remaining': user_profile.points
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
    user_profile = get_user_profile(request.user)
    
    if user_profile.points < total_points:
        return Response(
            {'error': f'Insufficient points. You need {total_points} points but have {user_profile.points}'}, 
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
            pdf_url = generate_voucher_pdf(redemption)
            redemption.pdf_url = pdf_url
            redemption.completed_at = timezone.now()
            redemption.save()
            
            redemptions.append({
                'redemption_id': str(redemption.id),
                'voucher_title': item.voucher.title,
                'coupon_code': redemption.coupon_code,
                'pdf_url': pdf_url
            })
        
        # Update user points
        user_profile.points -= total_points
        user_profile.save()
        
        # Clear cart
        cart_items.delete()
        
        create_notification(request.user, f"Successfully checked out cart for {total_points} points")
        
        return Response({
            'message': 'Cart checked out successfully',
            'redemptions': redemptions,
            'total_points_used': total_points,
            'points_remaining': user_profile.points
        }, status=status.HTTP_201_CREATED)

# Notification Views
@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access for demo
def notification_list(request):
    """Get user notifications - demo version"""
    # For demo purposes, return some sample notifications
    return Response([
        {
            'id': 1,
            'message': 'Welcome to OptimaBank Rewards! Start earning points today.',
            'read': False,
            'created_at': '2024-01-01T10:00:00Z'
        },
        {
            'id': 2,
            'message': 'New vouchers available in the Dining category!',
            'read': False,
            'created_at': '2024-01-01T11:00:00Z'
        },
        {
            'id': 3,
            'message': 'You have 5000 points available for redemption.',
            'read': True,
            'created_at': '2024-01-01T12:00:00Z'
        }
    ])

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow unauthenticated access for demo
def mark_notifications_read(request):
    """Mark all notifications as read - demo version"""
    # For demo purposes, just return success
    return Response({'message': 'All notifications marked as read'})

# PDF Generation
def generate_voucher_pdf(redemption):
    """Generate PDF for voucher redemption"""
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
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
    p.drawString(100, height - 290, f"Redeemed On: {redemption.completed_at.strftime('%Y-%m-%d %H:%M')}")
    
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
