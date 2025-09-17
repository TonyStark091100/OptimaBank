from django.core.management.base import BaseCommand
from accounts.models import VoucherCategory, Voucher

class Command(BaseCommand):
    help = 'Populate the database with sample vouchers and categories'

    def handle(self, *args, **options):
        # Create categories
        categories_data = [
            {'name': 'Dining', 'icon': 'restaurant'},
            {'name': 'Shopping', 'icon': 'shopping_bag'},
            {'name': 'Entertainment', 'icon': 'movie'},
            {'name': 'Travel', 'icon': 'flight'},
            {'name': 'Wellness', 'icon': 'spa'},
            {'name': 'Gifts', 'icon': 'card_giftcard'},
            {'name': 'Fashion', 'icon': 'checkroom'},
            {'name': 'Electronics', 'icon': 'laptop'},
            {'name': 'Groceries', 'icon': 'local_grocery_store'},
        ]

        for cat_data in categories_data:
            category, created = VoucherCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'icon': cat_data['icon']}
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')

        # Create sample vouchers
        vouchers_data = [
            {
                'title': 'Fine Dining Experience',
                'category': 'Dining',
                'points': 2500,
                'original_points': 3500,
                'discount_percentage': 29,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': 'Gourmet dinner for two at premium restaurants',
                'terms': 'Valid for 45 days. Reservation required 48 hours in advance. Includes appetizer, main course, and dessert. Alcohol not included. Dress code may apply.',
                'quantity_available': 15,
                'featured': True
            },
            {
                'title': 'Casual Dining Package',
                'category': 'Dining',
                'points': 1200,
                'original_points': 1800,
                'discount_percentage': 33,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$50 credit at popular casual dining restaurants',
                'terms': 'Valid for 60 days. Not applicable on holidays. Maximum party size of 6. Tax and gratuity not included.',
                'quantity_available': 25,
                'featured': False
            },
            {
                'title': 'Coffee Shop Monthly Pass',
                'category': 'Dining',
                'points': 800,
                'original_points': 1200,
                'discount_percentage': 33,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '30 days of premium coffee beverages',
                'terms': 'Valid for one month from redemption date. One beverage per day. Excludes limited edition drinks. Non-transferable.',
                'quantity_available': 30,
                'featured': False
            },
            {
                'title': 'Fashion Retailer Gift Card',
                'category': 'Shopping',
                'points': 1200,
                'original_points': 1800,
                'discount_percentage': 33,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$100 gift card for popular fashion brands',
                'terms': 'Redeemable at participating stores. Valid for 90 days. Non-transferable. No cash value. Balance cannot be reloaded.',
                'quantity_available': 30,
                'featured': True
            },
            {
                'title': 'Department Store Credit',
                'category': 'Shopping',
                'points': 1500,
                'original_points': 2200,
                'discount_percentage': 32,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$125 shopping credit at major department stores',
                'terms': 'Valid for 60 days. Excludes clearance items. Cannot be used for gift cards. Original receipt required for returns.',
                'quantity_available': 20,
                'featured': False
            },
            {
                'title': 'Movie Theater Package',
                'category': 'Entertainment',
                'points': 800,
                'original_points': 1200,
                'discount_percentage': 33,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1489599851395-36c8a9285fbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '2 tickets with popcorn and drinks at major cinemas',
                'terms': 'Valid for 60 days. Subject to availability. Excludes premium screenings. 3D glasses not included. No refunds for missed shows.',
                'quantity_available': 25,
                'featured': False
            },
            {
                'title': 'Concert Ticket Credit',
                'category': 'Entertainment',
                'points': 2000,
                'original_points': 3000,
                'discount_percentage': 33,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$150 towards concert tickets of your choice',
                'terms': 'Valid for 90 days. Subject to ticket availability. Service fees not included. Non-transferable. No cash value.',
                'quantity_available': 15,
                'featured': True
            },
            {
                'title': 'Weekend Hotel Stay',
                'category': 'Travel',
                'points': 5000,
                'original_points': 7500,
                'discount_percentage': 33,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '2-night stay at luxury hotels nationwide',
                'terms': 'Advanced booking required. Blackout dates apply. Limited availability. 14-day cancellation notice required. Room upgrades not included.',
                'quantity_available': 8,
                'featured': True
            },
            {
                'title': 'Premium Spa Package',
                'category': 'Wellness',
                'points': 1800,
                'original_points': 2500,
                'discount_percentage': 28,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': 'Full spa day for one including massage and facial',
                'terms': 'Booking required 7 days in advance. Valid for 6 months. Non-refundable. 24-hour cancellation notice required. Upgrade options available.',
                'quantity_available': 12,
                'featured': False
            },
            {
                'title': 'Tech Store Voucher',
                'category': 'Electronics',
                'points': 3500,
                'original_points': 5000,
                'discount_percentage': 30,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$200 credit towards electronics and gadgets',
                'terms': 'Valid at participating electronics retailers. Excludes Apple products. Cannot be combined with other offers. 30-day return policy applies.',
                'quantity_available': 10,
                'featured': True
            }
        ]

        for voucher_data in vouchers_data:
            category = VoucherCategory.objects.get(name=voucher_data['category'])
            voucher, created = Voucher.objects.get_or_create(
                title=voucher_data['title'],
                defaults={
                    'category': category,
                    'points': voucher_data['points'],
                    'original_points': voucher_data['original_points'],
                    'discount_percentage': voucher_data['discount_percentage'],
                    'rating': voucher_data['rating'],
                    'image_url': voucher_data['image_url'],
                    'description': voucher_data['description'],
                    'terms': voucher_data['terms'],
                    'quantity_available': voucher_data['quantity_available'],
                    'featured': voucher_data['featured']
                }
            )
            if created:
                self.stdout.write(f'Created voucher: {voucher.title}')

        self.stdout.write(
            self.style.SUCCESS('Successfully populated database with sample data!')
        )
