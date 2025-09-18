"""
Django models for the chatbot app.
Defines chat sessions, messages, and chatbot knowledge base.
"""
import uuid
from django.db import models
from django.conf import settings


class ChatSession(models.Model):
    """Model representing a chat session between user and chatbot."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Chat Session {self.session_id}"


class ChatMessage(models.Model):
    """Model representing individual messages in a chat session."""
    MESSAGE_TYPES = [
        ('user', 'User'),
        ('bot', 'Bot'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.message_type.title()} message in {self.session.session_id}"


class ChatbotKnowledge(models.Model):
    """Model representing chatbot knowledge base entries."""
    CATEGORIES = [
        ('general', 'General Information'),
        ('account', 'Account Management'),
        ('rewards', 'Rewards & Points'),
        ('vouchers', 'Vouchers & Redemption'),
        ('technical', 'Technical Support'),
        ('security', 'Security & Privacy'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORIES)
    question = models.TextField()
    answer = models.TextField()
    keywords = models.TextField(help_text="Comma-separated keywords for matching")
    priority = models.IntegerField(default=1, help_text="Higher priority = more likely to be selected")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category.title()}: {self.question[:50]}..."

    @property
    def keyword_list(self):
        """Return keywords as a list."""
        return [keyword.strip() for keyword in self.keywords.split(',') if keyword.strip()]