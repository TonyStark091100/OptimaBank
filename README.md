# OptimaBank Loyalty Rewards System

A comprehensive loyalty rewards platform built with Django REST Framework and React, featuring tiered rewards, voucher redemption, and AI-powered chatbot support.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/signup with OTP verification and Google OAuth2
- **Tiered Rewards System**: Bronze, Silver, Gold, and Platinum tiers with progressive benefits
- **Voucher Management**: Browse, redeem, and download professional PDF vouchers
- **Points System**: Earn and track points with real-time balance updates
- **Shopping Cart**: Add multiple vouchers and checkout in bulk
- **AI Chatbot**: Intelligent customer support with contextual responses
- **Profile Management**: Update personal information with secure validation

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **Biometric Support**: Fingerprint authentication for mobile devices
- **PDF Generation**: Professional voucher PDFs with images and branding
- **Real-time Updates**: Live points balance and tier progress tracking
- **Responsive Design**: Mobile-first approach with Material-UI components
- **Type Safety**: Full TypeScript implementation for frontend

## 🛠️ Tech Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production ready)
- **ReportLab** - PDF generation
- **Pillow** - Image processing
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8+
- Node.js 16+
- npm or yarn
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/optimabank-loyalty.git
cd optimabank-loyalty
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Variables
Create a `.env` file in the root directory:
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# Google OAuth2 (Required for Google Sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Settings (Required for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
```

#### Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser
```bash
python manage.py createsuperuser
```

#### Populate Sample Data
```bash
python manage.py populate_tiers
python manage.py populate_vouchers
python manage.py populate_chatbot_knowledge
```

#### Run Backend Server
```bash
python manage.py runserver
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd optimabank-loyalty
```

#### Install Dependencies
```bash
npm install
```

#### Environment Variables
Create a `.env` file in the `optimabank-loyalty` directory:
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Run Frontend Development Server
```bash
npm start
```

## 🔑 Getting API Keys & Credentials

### Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/accounts/google/login/callback/`
   - `http://localhost:3000` (for frontend)
7. Copy Client ID and Client Secret to your `.env` files

### Email Setup (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password in `EMAIL_HOST_PASSWORD`

### JWT Secret Key
Generate a secure JWT secret:
```python
import secrets
print(secrets.token_urlsafe(32))
```

## 🗄️ Database Configuration

### Development (SQLite)
The project uses SQLite by default for development. No additional setup required.

### Production (PostgreSQL)
1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE optimabank_loyalty;
CREATE USER optimabank_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE optimabank_loyalty TO optimabank_user;
```
3. Update `.env`:
```env
DATABASE_URL=postgresql://optimabank_user:your_password@localhost:5432/optimabank_loyalty
```

## 🚀 Running the Application

### Development Mode
1. Start backend server:
```bash
cd D:\OptimaBank
python manage.py runserver
```

2. Start frontend server (in new terminal):
```bash
cd D:\OptimaBank\optimabank-loyalty
npm start
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin

### Production Deployment
1. Set `DEBUG=False` in `.env`
2. Configure production database
3. Set up static file serving
4. Use a production WSGI server (Gunicorn)
5. Deploy frontend build to CDN or static hosting

## 📱 Usage Guide

### For Users
1. **Sign Up**: Create account with email verification
2. **Login**: Use email/password or Google Sign-in
3. **Browse Vouchers**: Explore available rewards
4. **Earn Points**: Use your Optima Bank card for transactions
5. **Redeem Rewards**: Add vouchers to cart and checkout
6. **Track Progress**: Monitor your tier status and points
7. **Get Help**: Use the AI chatbot for support

### For Developers
1. **API Documentation**: Available at `/api/docs/`
2. **Admin Panel**: Manage users, vouchers, and tiers
3. **Database Management**: Use Django ORM or direct SQL
4. **Customization**: Modify tiers, benefits, and voucher types

## 🧪 Testing

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
cd optimabank-loyalty
npm test
```

## 📁 Project Structure

```
OptimaBank/
├── accounts/                 # User accounts and profiles
├── backend/                  # Django project settings
├── chatbot/                  # AI chatbot functionality
├── users/                    # User authentication
├── vouchers/                 # Voucher management
├── optimabank-loyalty/       # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   └── ...
│   └── public/
├── media/                    # User uploads
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **OTP Verification**: Two-factor authentication
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Django's CSRF middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Social media integration
- [ ] Multi-language support
- [ ] Advanced AI features
- [ ] Payment gateway integration

## 🙏 Acknowledgments

- Django and Django REST Framework teams
- React and Material-UI communities
- All contributors and testers

---

**Note**: This is a development version. For production deployment, ensure all security measures are properly configured and sensitive data is secured.
