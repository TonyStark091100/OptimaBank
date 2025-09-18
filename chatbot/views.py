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
    
    # Check for specific Optima Rewards related queries
    if any(word in user_message_lower for word in ['points', 'reward', 'balance']):
        if user_profile:
            return f"Your current points balance is {user_profile.points} points. You can redeem these points for various vouchers and rewards in our catalog."
        else:
            return "To check your points balance, please log in to your account. You can earn points with every transaction using your Optima Bank card."
    
    elif any(word in user_message_lower for word in ['voucher', 'redeem', 'coupon']):
        return "You can redeem your points for vouchers in our rewards catalog. Browse available vouchers, add them to your cart, and checkout to receive your coupon codes and PDF vouchers."
    
    elif any(word in user_message_lower for word in ['account', 'profile', 'settings']):
        return "You can manage your account settings, update your profile information, and view your transaction history in the account section of the app."
    
    elif any(word in user_message_lower for word in ['help', 'support', 'problem']):
        return "I'm here to help! You can ask me about your points balance, voucher redemption, account management, or any other Optima Rewards related questions."
    
    elif any(word in user_message_lower for word in ['login', 'signin', 'authentication']):
        return "You can log in using your email and password, or use biometric authentication if available on your device. Forgot your password? Use the 'Forgot Password' option."
    
    elif any(word in user_message_lower for word in ['security', 'privacy', 'safe']):
        return "Your data is protected with bank-level encryption and security measures. We never share your personal information with third parties without your consent."
    
    # Try to find a match in knowledge base
    best_match = find_best_response(user_message)
    if best_match:
        return best_match.answer
    
    # Default responses for common greetings
    if any(greeting in user_message_lower for greeting in ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']):
        return "Hello! I'm your Optima Rewards assistant. How can I help you today? You can ask me about your points, vouchers, account settings, or any other questions about our rewards program."
    
    elif any(word in user_message_lower for word in ['thank', 'thanks']):
        return "You're welcome! Is there anything else I can help you with regarding Optima Rewards?"
    
    elif any(word in user_message_lower for word in ['bye', 'goodbye', 'see you']):
        return "Goodbye! Feel free to come back anytime if you need help with Optima Rewards. Have a great day!"
    
    # Fallback response
    return "I understand you're asking about Optima Rewards. Could you please be more specific? I can help you with points balance, voucher redemption, account management, or general questions about our rewards program."


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_chat(request):
    """Start a new chat session."""
    session_id = generate_session_id()
    session = ChatSession.objects.create(
        user=request.user,
        session_id=session_id
    )
    
    # Add welcome message
    welcome_message = ChatMessage.objects.create(
        session=session,
        message_type='bot',
        content="Hello! I'm your Optima Rewards assistant. How can I help you today? You can ask me about your points balance, voucher redemption, account settings, or any other questions about our rewards program."
    )
    
    serializer = ChatSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Send a message to the chatbot."""
    serializer = ChatRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = serializer.validated_data['message']
    session_id = serializer.validated_data.get('session_id')
    
    # Get or create session
    if session_id:
        try:
            session = ChatSession.objects.get(session_id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        session = ChatSession.objects.create(
            user=request.user,
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
@permission_classes([IsAuthenticated])
def get_chat_history(request, session_id):
    """Get chat history for a specific session."""
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
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
@permission_classes([IsAuthenticated])
def end_chat(request, session_id):
    """End a chat session."""
    try:
        session = ChatSession.objects.get(session_id=session_id, user=request.user)
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