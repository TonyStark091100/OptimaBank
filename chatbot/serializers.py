"""
Serializers for the chatbot app.
"""
from rest_framework import serializers
from .models import ChatSession, ChatMessage, ChatbotKnowledge


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'message_type', 'content', 'timestamp', 'is_read']
        read_only_fields = ['id', 'timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions."""
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'is_active', 'messages']
        read_only_fields = ['id', 'session_id', 'created_at', 'updated_at']


class ChatbotKnowledgeSerializer(serializers.ModelSerializer):
    """Serializer for chatbot knowledge base."""
    
    class Meta:
        model = ChatbotKnowledge
        fields = ['id', 'category', 'question', 'answer', 'keywords', 'priority', 'is_active']
        read_only_fields = ['id']


class ChatRequestSerializer(serializers.Serializer):
    """Serializer for chat requests."""
    message = serializers.CharField(max_length=1000)
    session_id = serializers.CharField(max_length=100, required=False)
