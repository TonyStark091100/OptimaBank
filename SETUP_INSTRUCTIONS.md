# 🏦 OptimaBank Loyalty System - Setup Instructions

## 📋 Overview
This is a full-stack loyalty rewards system built with Django REST Framework (Backend) and React TypeScript (Frontend). Users can earn points, redeem vouchers, and download professional PDF vouchers.

## 🛠️ Tech Stack
- **Backend**: Django 4.2, Django REST Framework, SQLite
- **Frontend**: React 18, TypeScript, Material-UI
- **Authentication**: JWT, Google OAuth2, OTP
- **PDF Generation**: ReportLab
- **Database**: SQLite (Development) / PostgreSQL (Production)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/TonyStark1109/OptimaBank.git
cd OptimaBank
```

### 2. Backend Setup (Django)

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Environment Variables Setup
Create a `.env` file in the root directory with the following variables:

```env
# Django Settings
DJANGO_SECRET_KEY=your-django-secret-key-here
DEBUG=True

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

#### Database Setup
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Populate sample data
python manage.py populate_tiers
python manage.py populate_vouchers
python manage.py populate_chatbot_knowledge
```

#### Start Django Server
```bash
python manage.py runserver
```
Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup (React)

#### Install Node Dependencies
```bash
cd optimabank-loyalty
npm install
```

#### Start React Development Server
```bash
npm start
```
Frontend will be available at: `http://localhost:3000`

## 🔑 How to Get Required API Keys & Credentials

### 1. Google OAuth2 Setup

#### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

#### Step 2: Create OAuth2 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://localhost:8000` (for Django admin)
5. Copy the **Client ID** and **Client Secret**

#### Step 3: Add to .env file
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### 2. Gmail App Password Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Other (Custom name)**
3. Enter "OptimaBank Django" as the name
4. Copy the generated 16-character password

#### Step 3: Add to .env file
```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
```

### 3. Django Secret Key

#### Generate a new secret key:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or use this online generator: [Django Secret Key Generator](https://djecrety.ir/)

## 🗄️ Database Configuration

### Development (SQLite)
The project uses SQLite by default for development. No additional setup required.

### Production (PostgreSQL)
For production, update `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'optima_bank',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

## 📁 Project Structure

```
OptimaBank/
├── accounts/                 # Voucher management, cart, redemptions
├── users/                   # User authentication, OTP
├── chatbot/                 # AI chatbot functionality
├── vouchers/                # Voucher models
├── backend/                 # Django settings, URLs
├── optimabank-loyalty/      # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   └── services/        # API services
│   └── public/
├── media/                   # Generated PDFs, uploads
├── .env                     # Environment variables (NOT in git)
└── .gitignore              # Git ignore rules
```

## 🔧 Available Management Commands

```bash
# Populate reward tiers
python manage.py populate_tiers

# Populate sample vouchers
python manage.py populate_vouchers

# Populate chatbot knowledge base
python manage.py populate_chatbot_knowledge

# Update user points
python manage.py update_user_points
```

## 🌐 API Endpoints

### Authentication
- `POST /users/register/` - User registration
- `POST /users/login/` - User login
- `POST /users/google-auth/` - Google OAuth login
- `POST /users/request-otp/` - Request OTP
- `POST /users/verify-otp/` - Verify OTP

### Vouchers & Redemptions
- `GET /accounts/vouchers/` - List vouchers
- `POST /accounts/redemptions/` - Redeem voucher
- `GET /accounts/redemptions/{id}/serve/` - Download PDF

### User Profile
- `GET /accounts/profile/` - Get user profile
- `PUT /accounts/profile/` - Update profile

## 🚨 Important Security Notes

### Environment Variables
- **NEVER** commit `.env` file to version control
- Use different credentials for development and production
- Rotate API keys regularly

### Database
- Use strong passwords for production databases
- Enable SSL for production database connections
- Regular backups recommended

### Google OAuth2
- Restrict OAuth2 credentials to specific domains in production
- Monitor API usage in Google Cloud Console
- Use different OAuth2 apps for development and production

## 🐛 Troubleshooting

### Common Issues

#### 1. Google OAuth Not Working
- Check if Google+ API is enabled
- Verify redirect URIs match exactly
- Ensure client ID and secret are correct

#### 2. Email Not Sending
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail account
- Test with a simple email first

#### 3. PDF Generation Fails
- Check if ReportLab is installed
- Verify image URLs are accessible
- Check Django media settings

#### 4. Database Migration Issues
```bash
python manage.py makemigrations
python manage.py migrate
```

## 📞 Support

For issues and questions:
1. Check this documentation first
2. Review Django and React logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## 🎯 Features Overview

- ✅ User authentication (Email/Password + Google OAuth)
- ✅ OTP verification system
- ✅ Points-based loyalty system
- ✅ Tiered rewards program
- ✅ Voucher redemption with PDF generation
- ✅ Shopping cart functionality
- ✅ AI-powered chatbot
- ✅ Professional PDF vouchers with images
- ✅ Responsive web design
- ✅ Real-time notifications

---

**Happy Coding! 🚀**
