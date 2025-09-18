# Optima Rewards Chatbot

## Overview

The Optima Rewards Chatbot is an intelligent AI assistant designed to help users with questions about the Optima Rewards loyalty program. It provides instant support for account management, points balance inquiries, voucher redemption, and general program information.

## Features

### 🤖 Intelligent Responses
- Context-aware responses based on user queries
- Knowledge base with 17+ pre-configured Q&A pairs
- Dynamic response generation for user-specific information (e.g., points balance)
- Natural language processing for better understanding

### 💬 Real-time Chat Interface
- Modern, responsive chat UI built with Material-UI
- Real-time message exchange
- Typing indicators and loading states
- Mobile-friendly design

### 🔐 Secure Integration
- JWT-based authentication
- User session management
- Secure API endpoints
- Data privacy protection

### 📱 Seamless Integration
- Integrated with the existing Help page
- "Start Live Chat" button triggers the chatbot
- Consistent with Optima Bank's design system
- No additional setup required for users

## Technical Architecture

### Backend (Django)
- **Models**: `ChatSession`, `ChatMessage`, `ChatbotKnowledge`
- **API Endpoints**: RESTful API for chat operations
- **Authentication**: JWT token-based authentication
- **Database**: PostgreSQL with optimized queries

### Frontend (React + TypeScript)
- **Component**: `Chatbot.tsx` - Main chat interface
- **Integration**: `HelpPage.tsx` - Help page integration
- **API Service**: `api.ts` - Chatbot API functions
- **Styling**: Material-UI with custom Optima Bank theme

## API Endpoints

### Chat Operations
- `POST /chatbot/start/` - Start a new chat session
- `POST /chatbot/send/` - Send a message to the chatbot
- `GET /chatbot/sessions/` - Get all user chat sessions
- `GET /chatbot/sessions/{session_id}/` - Get chat history
- `POST /chatbot/sessions/{session_id}/end/` - End a chat session

### Authentication Required
All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

## Usage

### For Users
1. Navigate to the Help page
2. Click "Start Live Chat" button
3. Chat window opens with welcome message
4. Type your questions about Optima Rewards
5. Receive instant, helpful responses
6. Close chat when done

### For Developers
1. The chatbot automatically starts when the chat window opens
2. Messages are sent via the `/chatbot/send/` endpoint
3. Responses are generated using the knowledge base and contextual logic
4. Chat history is preserved per session

## Knowledge Base

The chatbot includes comprehensive knowledge about:

### General Information
- What is Optima Rewards
- How to get started
- Program benefits

### Account Management
- Creating accounts
- Password reset
- Profile updates
- Login issues

### Rewards & Points
- Earning points
- Points balance
- Points expiration
- Transaction tracking

### Vouchers & Redemption
- Available vouchers
- Redemption process
- Using vouchers
- Return/exchange policies

### Technical Support
- App troubleshooting
- Login problems
- Biometric authentication
- Performance issues

### Security & Privacy
- Data protection
- Security measures
- Reporting suspicious activity
- Privacy policies

## Customization

### Adding New Knowledge
1. Access Django admin panel
2. Navigate to Chatbot Knowledge
3. Add new entries with:
   - Category (general, account, rewards, etc.)
   - Question
   - Answer
   - Keywords (comma-separated)
   - Priority (higher = more likely to be selected)

### Modifying Responses
Edit the `generate_contextual_response()` function in `chatbot/views.py` to:
- Add new response patterns
- Modify existing responses
- Update contextual logic

## Testing

### Backend Tests
```bash
python manage.py test chatbot
```

Tests cover:
- Model creation and relationships
- API endpoint functionality
- Authentication requirements
- Session management
- Message handling

### Frontend Tests
```bash
cd optimabank-loyalty
npm test
```

### Build Verification
```bash
npm run build
```

## Deployment

### Backend
1. Ensure Django server is running
2. Run migrations: `python manage.py migrate`
3. Populate knowledge base: `python manage.py populate_chatbot_knowledge`
4. Start server: `python manage.py runserver`

### Frontend
1. Build React app: `npm run build`
2. Serve static files or deploy to hosting platform

## Monitoring

### Admin Panel
- Monitor chat sessions
- View message statistics
- Manage knowledge base
- Track user interactions

### Logs
- Chat session creation/deletion
- Message sending/receiving
- Error handling
- Performance metrics

## Security Considerations

- All API endpoints require authentication
- User sessions are isolated
- No sensitive data stored in chat messages
- JWT tokens expire automatically
- Input validation and sanitization

## Performance

- Optimized database queries
- Efficient message storage
- Real-time response generation
- Minimal memory footprint
- Fast API response times

## Future Enhancements

### Planned Features
- Multi-language support
- Voice message support
- File attachment handling
- Advanced analytics
- Integration with external AI services

### Scalability
- Horizontal scaling support
- Database optimization
- Caching implementation
- Load balancing ready

## Support

For technical support or questions about the chatbot implementation:
- Check the test suite for functionality verification
- Review the API documentation
- Monitor the Django admin panel for issues
- Check server logs for error details

## Contributing

When contributing to the chatbot:
1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test thoroughly before deployment
5. Ensure backward compatibility

---

**Note**: This chatbot is specifically designed for Optima Rewards and includes domain-specific knowledge. For general chatbot implementations, consider using this as a reference for structure and integration patterns.
