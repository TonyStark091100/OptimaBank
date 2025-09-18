"""
URL configuration for the chatbot app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('start/', views.start_chat, name='start_chat'),
    path('send/', views.send_message, name='send_message'),
    path('sessions/', views.get_user_sessions, name='get_user_sessions'),
    path('sessions/<str:session_id>/', views.get_chat_history, name='get_chat_history'),
    path('sessions/<str:session_id>/end/', views.end_chat, name='end_chat'),
]
