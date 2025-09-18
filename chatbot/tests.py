"""
Tests for the chatbot app.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from .models import ChatSession, ChatMessage, ChatbotKnowledge

User = get_user_model()


class ChatbotModelTests(TestCase):
    """Test chatbot models."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            phone_number='+1234567890'
        )
    
    def test_chat_session_creation(self):
        """Test creating a chat session."""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.session_id, 'test-session-123')
        self.assertTrue(session.is_active)
    
    def test_chat_message_creation(self):
        """Test creating chat messages."""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        user_message = ChatMessage.objects.create(
            session=session,
            message_type='user',
            content='Hello, chatbot!'
        )
        
        bot_message = ChatMessage.objects.create(
            session=session,
            message_type='bot',
            content='Hello! How can I help you?'
        )
        
        self.assertEqual(user_message.content, 'Hello, chatbot!')
        self.assertEqual(bot_message.content, 'Hello! How can I help you?')
        self.assertEqual(session.messages.count(), 2)
    
    def test_chatbot_knowledge_creation(self):
        """Test creating chatbot knowledge entries."""
        knowledge = ChatbotKnowledge.objects.create(
            category='general',
            question='What is Optima Rewards?',
            answer='Optima Rewards is our loyalty program.',
            keywords='optima, rewards, loyalty',
            priority=10
        )
        
        self.assertEqual(knowledge.category, 'general')
        self.assertEqual(knowledge.question, 'What is Optima Rewards?')
        self.assertEqual(len(knowledge.keyword_list), 3)


class ChatbotAPITests(APITestCase):
    """Test chatbot API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            phone_number='+1234567890'
        )
        self.token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_start_chat(self):
        """Test starting a new chat session."""
        url = reverse('start_chat')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('session_id', response.data)
        self.assertIn('messages', response.data)
        self.assertEqual(len(response.data['messages']), 1)  # Welcome message
    
    def test_send_message(self):
        """Test sending a message to the chatbot."""
        # First start a chat session
        start_url = reverse('start_chat')
        start_response = self.client.post(start_url)
        session_id = start_response.data['session_id']
        
        # Send a message
        send_url = reverse('send_message')
        data = {
            'message': 'Hello, how are you?',
            'session_id': session_id
        }
        response = self.client.post(send_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_message', response.data)
        self.assertIn('bot_message', response.data)
        self.assertEqual(response.data['user_message']['content'], 'Hello, how are you?')
    
    def test_get_chat_history(self):
        """Test retrieving chat history."""
        # Start a chat and send a message
        start_url = reverse('start_chat')
        start_response = self.client.post(start_url)
        session_id = start_response.data['session_id']
        
        send_url = reverse('send_message')
        data = {
            'message': 'Test message',
            'session_id': session_id
        }
        self.client.post(send_url, data, format='json')
        
        # Get chat history
        history_url = reverse('get_chat_history', kwargs={'session_id': session_id})
        response = self.client.get(history_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('messages', response.data)
        self.assertEqual(len(response.data['messages']), 3)  # Welcome + user + bot messages
    
    def test_get_user_sessions(self):
        """Test getting all user sessions."""
        # Create a session
        start_url = reverse('start_chat')
        self.client.post(start_url)
        
        # Get all sessions
        sessions_url = reverse('get_user_sessions')
        response = self.client.get(sessions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
    
    def test_end_chat(self):
        """Test ending a chat session."""
        # Start a chat
        start_url = reverse('start_chat')
        start_response = self.client.post(start_url)
        session_id = start_response.data['session_id']
        
        # End the chat
        end_url = reverse('end_chat', kwargs={'session_id': session_id})
        response = self.client.post(end_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify session is no longer active
        session = ChatSession.objects.get(session_id=session_id)
        self.assertFalse(session.is_active)