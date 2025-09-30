"""
Views for the chatbot app.
"""
import json
import re
import uuid
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatSession, ChatMessage, ChatbotKnowledge
from .serializers import ChatSessionSerializer, ChatMessageSerializer, ChatRequestSerializer


def generate_session_id():
    """Generate a unique session ID."""
    return str(uuid.uuid4())


def find_best_response(user_message):
    """Find the best response from knowledge base."""
    user_message_lower = user_message.lower()
    
    # Get all active knowledge entries
    knowledge_entries = ChatbotKnowledge.objects.filter(is_active=True)
    
    best_match = None
    best_score = 0
    
    for entry in knowledge_entries:
        score = 0
        
        # Check keywords
        for keyword in entry.keyword_list:
            if keyword.lower() in user_message_lower:
                score += entry.priority
        
        # Check if question keywords match
        question_words = re.findall(r'\b\w+\b', entry.question.lower())
        for word in question_words:
            if word in user_message_lower:
                score += 1
        
        # Check for exact phrase matches
        if any(phrase.lower() in user_message_lower for phrase in entry.keyword_list):
            score += entry.priority * 2
        
        if score > best_score:
            best_score = score
            best_match = entry
    
    return best_match


def generate_contextual_response(user_message, user_profile=None):
    """Generate a contextual response based on user message and profile."""
    user_message_lower = user_message.lower()
    
    # Points and Balance Queries
    if any(word in user_message_lower for word in ['points', 'point', 'balance', 'how many points', 'point balance']):
        if user_profile:
            return f"Your current points balance is {user_profile.points} points. You can redeem these points for various vouchers and rewards in our catalog. Points never expire and can be earned through card transactions, referrals, and special promotions."
        else:
            return "To check your points balance, please log in to your account. You can earn points with every transaction using your Optima Bank card. Points are earned at different rates based on your tier level and transaction type."
    
    # Earning Points
    elif any(word in user_message_lower for word in ['earn points', 'how to earn', 'earning', 'earn more', 'get points']):
        return "You can earn Optima Rewards points in several ways:\n• Card transactions: 1-5 points per $1 spent (varies by tier)\n• Referrals: 500 points for each successful referral\n• Special promotions: Bonus points during promotional periods\n• Account activities: Points for maintaining account relationships\n• Tier bonuses: Higher tiers earn more points per transaction"
    
    # Tier System
    elif any(word in user_message_lower for word in ['tier', 'bronze', 'silver', 'gold', 'platinum', 'level', 'upgrade', 'tier benefits']):
        return "Optima Rewards has 4 tiers:\n• Bronze (0-999 points): 1 point per $1, basic benefits\n• Silver (1,000-4,999 points): 2 points per $1, priority support\n• Gold (5,000-9,999 points): 3 points per $1, exclusive offers\n• Platinum (10,000+ points): 5 points per $1, VIP treatment\n\nTier benefits include higher earning rates, exclusive vouchers, priority customer service, and special promotions. Your tier is automatically updated based on your points balance."
    
    # Vouchers and Redemption
    elif any(word in user_message_lower for word in ['voucher', 'redeem', 'coupon', 'redemption', 'how to redeem', 'redeem points']):
        return "To redeem your points for vouchers:\n1. Browse our rewards catalog\n2. Select vouchers you want\n3. Add them to your cart\n4. Checkout to receive coupon codes and PDF vouchers\n\nVouchers include discounts, free items, and exclusive offers from partner merchants. You can redeem multiple vouchers at once and download them as professional PDFs."
    
    # Voucher Types and Categories
    elif any(word in user_message_lower for word in ['what vouchers', 'voucher types', 'categories', 'restaurant', 'shopping', 'travel', 'entertainment']):
        return "Our voucher categories include:\n• Dining: Restaurant discounts and free meals\n• Shopping: Retail store discounts and gift cards\n• Travel: Hotel stays, flights, and vacation packages\n• Entertainment: Movie tickets, events, and subscriptions\n• Services: Spa treatments, fitness classes, and professional services\n• Technology: Electronics, software, and digital services\n\nNew vouchers are added regularly, and some are exclusive to higher tiers."
    
    # Account and Profile Management
    elif any(word in user_message_lower for word in ['account', 'profile', 'settings', 'update profile', 'change information']):
        return "You can manage your Optima Rewards account by:\n• Updating personal information (name, phone, address)\n• Viewing transaction history and points activity\n• Managing notification preferences\n• Updating security settings\n• Viewing tier progress and benefits\n\nNote: Email cannot be changed as it's used for account authentication. Contact customer service for email changes."
    
    # Login and Authentication
    elif any(word in user_message_lower for word in ['login', 'signin', 'authentication', 'sign up', 'register', 'forgot password']):
        return "To access your Optima Rewards account:\n• Use your email and password\n• Biometric authentication (fingerprint/face ID) on mobile\n• Google Sign-in for quick access\n• Two-factor authentication with OTP for security\n\nForgot your password? Use the 'Forgot Password' option or contact customer service for assistance."
    
    # Security and Privacy
    elif any(word in user_message_lower for word in ['security', 'privacy', 'safe', 'protect', 'data', 'personal information']):
        return "Your Optima Rewards data is protected with:\n• Bank-level encryption for all transactions\n• Secure authentication protocols\n• Privacy protection - we never share personal information\n• Regular security audits and updates\n• Fraud monitoring and protection\n• Secure payment processing\n\nYour personal information is only used to provide rewards services and is never sold to third parties."
    
    # Program Rules and Terms
    elif any(word in user_message_lower for word in ['terms', 'rules', 'conditions', 'expire', 'expiration', 'validity']):
        return "Optima Rewards program details:\n• Points never expire\n• Vouchers have individual expiration dates (shown in catalog)\n• Points are non-transferable\n• Program terms may be updated with notice\n• Fraudulent activity may result in account suspension\n• Full terms available in the app settings\n\nFor specific questions about program rules, contact customer service."
    
    # Customer Support and Help
    elif any(word in user_message_lower for word in ['help', 'support', 'problem', 'issue', 'contact', 'customer service']):
        return "I'm here to help with Optima Rewards! I can assist with:\n• Points balance and earning\n• Voucher redemption\n• Tier system and benefits\n• Account management\n• Technical issues\n• Program rules and policies\n\nFor complex issues or account-specific problems, contact our customer service team at 1-800-OPTIMA-1 or through the app's support section."
    
    # Technical Issues
    elif any(word in user_message_lower for word in ['not working', 'error', 'bug', 'technical', 'app', 'website', 'download']):
        return "For technical issues with Optima Rewards:\n• Try refreshing the app or website\n• Clear your browser cache\n• Update to the latest app version\n• Check your internet connection\n• Log out and log back in\n• Restart your device\n\nIf problems persist, contact technical support with details about the issue and your device information."
    
    # Promotions and Special Offers
    elif any(word in user_message_lower for word in ['promotion', 'special offer', 'bonus', 'sale', 'discount', 'limited time']):
        return "Optima Rewards frequently offers:\n• Double points promotions\n• Bonus point events\n• Exclusive tier-specific offers\n• Limited-time voucher discounts\n• Referral bonuses\n• Seasonal specials\n\nCheck the app regularly for current promotions, or enable notifications to stay updated on new offers."
    
    # Referral Program
    elif any(word in user_message_lower for word in ['refer', 'referral', 'invite', 'friend', 'family']):
        return "Earn 500 points for each successful referral!\n• Share your unique referral link\n• Friends sign up and make their first transaction\n• You both earn bonus points\n• No limit on referrals\n• Points credited within 24-48 hours\n\nFind your referral link in the app's 'Refer Friends' section."
    
    # Mobile App Features
    elif any(word in user_message_lower for word in ['mobile app', 'app features', 'download app', 'mobile']):
        return "The Optima Rewards mobile app includes:\n• Easy points tracking and redemption\n• Biometric login for security\n• Push notifications for offers\n• QR code scanning for quick redemptions\n• Offline voucher access\n• Real-time tier progress updates\n\nDownload from the App Store or Google Play Store for the best experience."
    
    # Try to find a match in knowledge base
    best_match = find_best_response(user_message)
    if best_match:
        return best_match.answer
    
    # Default responses for common greetings
    if any(greeting in user_message_lower for greeting in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        return "Hello! I'm your Optima Rewards assistant. I can help you with:\n• Points balance and earning\n• Voucher redemption\n• Tier system and benefits\n• Account management\n• Technical support\n• Program rules and policies\n\nWhat would you like to know about Optima Rewards?"
    
    elif any(word in user_message_lower for word in ['thank', 'thanks', 'thank you']):
        return "You're welcome! I'm here to help with any Optima Rewards questions. Feel free to ask about points, vouchers, tiers, or anything else about our rewards program."
    
    elif any(word in user_message_lower for word in ['bye', 'goodbye', 'see you', 'farewell']):
        return "Goodbye! Thanks for using Optima Rewards. Come back anytime if you need help with your rewards account. Have a great day!"
    
    # Fallback response
    return "I can help you with all aspects of Optima Rewards! Ask me about:\n• Your points balance and how to earn more\n• Voucher redemption and categories\n• Tier system and benefits\n• Account settings and management\n• Technical issues or app problems\n• Program rules and policies\n• Promotions and special offers\n\nWhat specific topic would you like to know more about?"


@api_view(['POST'])
@permission_classes([])  # Allow unauthenticated access
def start_chat(request):
    """Start a new chat session."""
    session_id = generate_session_id()
    session = ChatSession.objects.create(
        user=request.user if request.user.is_authenticated else None,
        session_id=session_id
    )
    
    # Add welcome message
    welcome_message = ChatMessage.objects.create(
        session=session,
        message_type='bot',
        content="Hello! I'm your comprehensive Optima Rewards assistant. I can help you with:\n• Points balance and earning strategies\n• Voucher redemption and categories\n• Tier system and benefits\n• Account management\n• Technical support\n• Program rules and policies\n• Promotions and special offers\n• Referral program\n• Mobile app features\n\nWhat would you like to know about Optima Rewards?"
    )
    
    serializer = ChatSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([])  # Allow unauthenticated access
def send_message(request):
    """Send a message to the chatbot."""
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = serializer.validated_data['message']  # type: ignore
    session_id = serializer.validated_data.get('session_id')  # type: ignore
    
    # Get or create session
    if session_id:
        try:
            # For unauthenticated users, find session by session_id only
            if request.user.is_authenticated:
                session = ChatSession.objects.get(session_id=session_id, user=request.user)
            else:
                session = ChatSession.objects.get(session_id=session_id, user=None)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        session = ChatSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=generate_session_id()
        )
    
    # Save user message
    user_message = ChatMessage.objects.create(
        session=session,
        message_type='user',
        content=message
    )
    
    # Generate bot response
    try:
        # Get user profile for contextual responses
        user_profile = None
        if hasattr(request.user, 'userprofile'):
            user_profile = request.user.userprofile
        
        bot_response = generate_contextual_response(message, user_profile)
        
        # Save bot response
        bot_message = ChatMessage.objects.create(
            session=session,
            message_type='bot',
            content=bot_response
        )
        
        # Return both messages
        response_data = {
            'session_id': session.session_id,
            'user_message': ChatMessageSerializer(user_message).data,
            'bot_message': ChatMessageSerializer(bot_message).data
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': 'Failed to generate response'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([])  # Allow unauthenticated access
def get_chat_history(request, session_id):
    """Get chat history for a specific session."""
    try:
        # For unauthenticated users, find session by session_id only
        if request.user.is_authenticated:
            session = ChatSession.objects.get(session_id=session_id, user=request.user)
        else:
            session = ChatSession.objects.get(session_id=session_id, user=None)
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_sessions(request):
    """Get all chat sessions for the current user."""
    sessions = ChatSession.objects.filter(user=request.user, is_active=True).order_by('-updated_at')
    serializer = ChatSessionSerializer(sessions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([])  # Allow unauthenticated access
def end_chat(request, session_id):
    """End a chat session."""
    try:
        # For unauthenticated users, find session by session_id only
        if request.user.is_authenticated:
            session = ChatSession.objects.get(session_id=session_id, user=request.user)
        else:
            session = ChatSession.objects.get(session_id=session_id, user=None)
        session.is_active = False
        session.save()
        
        # Add goodbye message
        ChatMessage.objects.create(
            session=session,
            message_type='bot',
            content="Thank you for using Optima Rewards support! Feel free to start a new chat anytime you need help."
        )
        
        return Response({'message': 'Chat session ended successfully'})
    except ChatSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)