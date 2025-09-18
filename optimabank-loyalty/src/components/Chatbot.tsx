import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { chatbotApi, ChatMessage, ChatSession } from '../services/api';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session when component opens
  useEffect(() => {
    if (isOpen && !session) {
      initializeChat();
    }
  }, [isOpen, session]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newSession = await chatbotApi.startChat();
      setSession(newSession);
      setMessages(newSession.messages || []);
    } catch (err) {
      setError('Failed to start chat session. Please try again.');
      console.error('Error starting chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !session) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatbotApi.sendMessage(userMessage, session.session_id);
      
      // Update messages with both user and bot messages
      setMessages(prev => [...prev, response.user_message, response.bot_message]);
      
      // Update session if needed
      if (response.session_id !== session.session_id) {
        const updatedSession = await chatbotApi.getChatHistory(response.session_id);
        setSession(updatedSession);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: isSmallScreen ? 'calc(100vw - 40px)' : 400,
        height: isSmallScreen ? 'calc(100vh - 40px)' : 600,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(34,34,50,0.98)',
          color: 'white',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(162,89,255,0.25)',
          border: '1px solid rgba(162, 89, 255, 0.3)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'rgba(162, 89, 255, 0.1)',
            borderBottom: '1px solid rgba(162, 89, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon sx={{ color: '#A259FF' }} />
            <Typography variant="h6" fontWeight={600} sx={{ color: 'white' }}>
              Optima Rewards Assistant
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: '#A259FF',
              '&:hover': {
                backgroundColor: 'rgba(162, 89, 255, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {messages.map((message, index) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.message_type === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              {message.message_type === 'bot' && (
                <Avatar
                  sx={{
                    backgroundColor: '#A259FF',
                    width: 32,
                    height: 32,
                  }}
                >
                  <BotIcon sx={{ fontSize: 20 }} />
                </Avatar>
              )}
              
              <Box
                sx={{
                  maxWidth: '80%',
                  backgroundColor: message.message_type === 'user' 
                    ? '#A259FF' 
                    : 'rgba(20, 20, 30, 0.7)',
                  borderRadius: 2,
                  p: 1.5,
                  position: 'relative',
                  border: message.message_type === 'bot' ? '1px solid rgba(162, 89, 255, 0.3)' : 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5, color: 'white' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.7rem',
                  }}
                >
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Box>

              {message.message_type === 'user' && (
                <Avatar
                  sx={{
                    backgroundColor: '#666',
                    width: 32,
                    height: 32,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 20 }} />
                </Avatar>
              )}
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  backgroundColor: '#A259FF',
                  width: 32,
                  height: 32,
                }}
              >
                <BotIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box
                sx={{
                  backgroundColor: 'rgba(20, 20, 30, 0.7)',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  border: '1px solid rgba(162, 89, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CircularProgress size={16} sx={{ color: '#A259FF' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Typing...
                </Typography>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)' }} />

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            background: 'rgba(162, 89, 255, 0.05)',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            backdropFilter: 'blur(10px)',
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about Optima Rewards..."
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(20, 20, 30, 0.7)',
                color: 'white',
                borderRadius: 2,
                border: '1px solid rgba(162, 89, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                '& fieldset': {
                  borderColor: 'rgba(162, 89, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(162, 89, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#A259FF',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              },
            }}
          />
          <IconButton
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{
              background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
              color: 'white',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(162, 89, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(162, 89, 255, 0.3)',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chatbot;
