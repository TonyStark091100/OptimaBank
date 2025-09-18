"""
Management command to populate chatbot knowledge base with Optima Rewards information.
"""
from django.core.management.base import BaseCommand
from chatbot.models import ChatbotKnowledge


class Command(BaseCommand):
    help = 'Populate chatbot knowledge base with Optima Rewards information'

    def handle(self, *args, **options):
        knowledge_entries = [
            # General Information
            {
                'category': 'general',
                'question': 'What is Optima Rewards?',
                'answer': 'Optima Rewards is our loyalty program that allows you to earn points with every transaction using your Optima Bank card. You can redeem these points for vouchers, discounts, and exclusive offers.',
                'keywords': 'optima rewards, loyalty program, points, earn',
                'priority': 10
            },
            {
                'category': 'general',
                'question': 'How do I get started with Optima Rewards?',
                'answer': 'Simply sign up for an account, link your Optima Bank card, and start earning points with every purchase. You can view your points balance and redeem rewards through our mobile app or website.',
                'keywords': 'get started, sign up, account, link card',
                'priority': 9
            },
            
            # Account Management
            {
                'category': 'account',
                'question': 'How do I create an account?',
                'answer': 'To create an account, click on the "Sign Up" button on the welcome page. Fill in your personal details including your name, email address, phone number, and create a secure password. You can also sign up using your Google or Apple account.',
                'keywords': 'create account, sign up, register, new user',
                'priority': 10
            },
            {
                'category': 'account',
                'question': 'How do I reset my password?',
                'answer': 'If you\'ve forgotten your password, click on "Forgot Password" on the login page. You\'ll receive an email with instructions to reset your password. Follow the link in the email to create a new password.',
                'keywords': 'reset password, forgot password, change password',
                'priority': 9
            },
            {
                'category': 'account',
                'question': 'How do I update my profile?',
                'answer': 'You can update your profile information by going to the Settings page in the app. From there, you can modify your personal details, contact information, and preferences.',
                'keywords': 'update profile, edit profile, change information, settings',
                'priority': 8
            },
            
            # Rewards & Points
            {
                'category': 'rewards',
                'question': 'How do I earn rewards points?',
                'answer': 'You earn points with every transaction made using your Optima Bank card. Each dollar spent earns you 1 point. Certain categories may offer bonus points. You can check your points balance in the rewards section of the app.',
                'keywords': 'earn points, earn rewards, points balance, transaction',
                'priority': 10
            },
            {
                'category': 'rewards',
                'question': 'How many points do I have?',
                'answer': 'You can check your current points balance in the rewards section of the app or by asking me directly. Your points are updated in real-time with each transaction.',
                'keywords': 'points balance, how many points, current points, check balance',
                'priority': 9
            },
            {
                'category': 'rewards',
                'question': 'Do my points expire?',
                'answer': 'Your points do not expire as long as your account remains active. However, points may be forfeited if your account is closed or inactive for an extended period.',
                'keywords': 'points expire, expiration, points validity, account inactive',
                'priority': 7
            },
            
            # Vouchers & Redemption
            {
                'category': 'vouchers',
                'question': 'How do I redeem my rewards?',
                'answer': 'To redeem rewards, navigate to the rewards section and browse available vouchers. Select the reward you want and follow the redemption process. Some rewards may be instant while others might take 24-48 hours to process.',
                'keywords': 'redeem rewards, redeem vouchers, redemption process',
                'priority': 10
            },
            {
                'category': 'vouchers',
                'question': 'What vouchers are available?',
                'answer': 'We offer a wide variety of vouchers including dining, shopping, entertainment, travel, and more. Browse our catalog to see all available options and their point requirements.',
                'keywords': 'available vouchers, voucher catalog, what vouchers, voucher types',
                'priority': 9
            },
            {
                'category': 'vouchers',
                'question': 'How do I use my voucher?',
                'answer': 'After redemption, you\'ll receive a coupon code and PDF voucher. Present the coupon code at the merchant or use the PDF voucher as specified in the terms and conditions.',
                'keywords': 'use voucher, coupon code, PDF voucher, how to use',
                'priority': 8
            },
            {
                'category': 'vouchers',
                'question': 'Can I return or exchange vouchers?',
                'answer': 'Voucher returns and exchanges are subject to the terms and conditions of each specific voucher. Please check the voucher details before redemption, as most vouchers are non-refundable.',
                'keywords': 'return voucher, exchange voucher, refund, voucher policy',
                'priority': 6
            },
            
            # Technical Support
            {
                'category': 'technical',
                'question': 'The app is not working properly',
                'answer': 'Try closing and reopening the app, or restart your device. If the problem persists, please contact our technical support team at support@optimabank.com or call 1-800-OPTIMA-1.',
                'keywords': 'app not working, technical issues, bug, error, problem',
                'priority': 8
            },
            {
                'category': 'technical',
                'question': 'I can\'t log in to my account',
                'answer': 'Make sure you\'re using the correct email and password. If you\'ve forgotten your password, use the "Forgot Password" option. For persistent login issues, contact our support team.',
                'keywords': 'can\'t log in, login issues, authentication problem, access denied',
                'priority': 9
            },
            {
                'category': 'technical',
                'question': 'What is biometric authentication?',
                'answer': 'Biometric authentication allows you to log in using your fingerprint or facial recognition instead of a password. This feature is available on supported mobile devices and provides a secure, convenient way to access your account.',
                'keywords': 'biometric authentication, fingerprint, facial recognition, touch ID, face ID',
                'priority': 7
            },
            
            # Security & Privacy
            {
                'category': 'security',
                'question': 'Is my personal information secure?',
                'answer': 'Yes, we use bank-level encryption and security measures to protect your personal and financial information. We never share your data with third parties without your consent.',
                'keywords': 'security, privacy, data protection, personal information, safe',
                'priority': 10
            },
            {
                'category': 'security',
                'question': 'How do I report suspicious activity?',
                'answer': 'If you notice any suspicious activity on your account, please contact us immediately at support@optimabank.com or call 1-800-OPTIMA-1. We take security seriously and will investigate any concerns.',
                'keywords': 'suspicious activity, fraud, security breach, report, unauthorized access',
                'priority': 9
            },
        ]

        created_count = 0
        for entry_data in knowledge_entries:
            entry, created = ChatbotKnowledge.objects.get_or_create(
                question=entry_data['question'],
                defaults=entry_data
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated chatbot knowledge base. Created {created_count} new entries.'
            )
        )
