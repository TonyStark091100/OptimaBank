from django.core.management.base import BaseCommand
from accounts.models import VoucherCategory, Voucher

class Command(BaseCommand):
    help = 'Populate the database with real-world brand vouchers'

    def handle(self, *args, **options):
        # Create additional categories for brands if they don't exist
        brand_categories_data = [
            {'name': 'Sports & Fitness', 'icon': 'fitness_center'},
            {'name': 'Beauty & Cosmetics', 'icon': 'face'},
            {'name': 'Automotive', 'icon': 'directions_car'},
            {'name': 'Home & Garden', 'icon': 'home'},
            {'name': 'Books & Media', 'icon': 'book'},
            {'name': 'Health & Pharmacy', 'icon': 'local_pharmacy'},
        ]

        for cat_data in brand_categories_data:
            category, created = VoucherCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'icon': cat_data['icon']}
            )
            if created:
                self.stdout.write(f'Created category: {category.name}')

        # Create real-world brand vouchers
        brand_vouchers_data = [
            # Sports & Fitness Brands
            {
                'title': 'Nike Store Gift Card',
                'category': 'Sports & Fitness',
                'points': 2000,
                'original_points': 2800,
                'discount_percentage': 29,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$150 Nike gift card for athletic wear, shoes, and accessories',
                'terms': 'Valid for 365 days. Redeemable online and at Nike stores. Cannot be exchanged for cash. Non-transferable.',
                'quantity_available': 20,
                'featured': True
            },
            {
                'title': 'Adidas Apparel Voucher',
                'category': 'Sports & Fitness',
                'points': 1800,
                'original_points': 2500,
                'discount_percentage': 28,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$125 Adidas voucher for sports apparel and footwear',
                'terms': 'Valid for 180 days. Excludes limited edition items. Cannot be combined with other discounts.',
                'quantity_available': 25,
                'featured': False
            },
            {
                'title': 'Under Armour Performance Gear',
                'category': 'Sports & Fitness',
                'points': 1500,
                'original_points': 2000,
                'discount_percentage': 25,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$100 Under Armour credit for athletic performance gear',
                'terms': 'Valid for 90 days. Online and in-store redemption. No cash value.',
                'quantity_available': 18,
                'featured': False
            },
            {
                'title': 'Lululemon Yoga & Athleisure',
                'category': 'Sports & Fitness',
                'points': 2200,
                'original_points': 3000,
                'discount_percentage': 27,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$165 Lululemon voucher for premium yoga and athleisure wear',
                'terms': 'Valid for 120 days. Premium quality guarantee. Size exchanges available within 30 days.',
                'quantity_available': 12,
                'featured': True
            },

            # Fashion & Luxury Brands
            {
                'title': 'Zara Fashion Collection',
                'category': 'Fashion',
                'points': 1200,
                'original_points': 1600,
                'discount_percentage': 25,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$90 Zara voucher for trendy fashion and accessories',
                'terms': 'Valid for 60 days. Fast fashion collections. Online and store redemption.',
                'quantity_available': 30,
                'featured': False
            },
            {
                'title': 'H&M Style Essentials',
                'category': 'Fashion',
                'points': 1000,
                'original_points': 1400,
                'discount_percentage': 29,
                'rating': 4.4,
                'image_url': 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$75 H&M voucher for affordable fashion and basics',
                'terms': 'Valid for 90 days. Sustainable fashion options available. Student discounts apply.',
                'quantity_available': 35,
                'featured': False
            },
            {
                'title': 'Uniqlo Quality Basics',
                'category': 'Fashion',
                'points': 1400,
                'original_points': 1900,
                'discount_percentage': 26,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$105 Uniqlo voucher for quality basics and casual wear',
                'terms': 'Valid for 120 days. Quality guarantee. Online and physical store redemption.',
                'quantity_available': 28,
                'featured': False
            },

            # Beauty & Cosmetics Brands
            {
                'title': 'Sephora Beauty Collection',
                'category': 'Beauty & Cosmetics',
                'points': 2500,
                'original_points': 3500,
                'discount_percentage': 29,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$175 Sephora gift card for premium beauty products',
                'terms': 'Valid for 365 days. Beauty advisor consultations included. Exclusive products available.',
                'quantity_available': 15,
                'featured': True
            },
            {
                'title': 'Ulta Beauty Essentials',
                'category': 'Beauty & Cosmetics',
                'points': 1800,
                'original_points': 2400,
                'discount_percentage': 25,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$125 Ulta Beauty voucher for cosmetics and skincare',
                'terms': 'Valid for 180 days. Salon services available. Loyalty points program included.',
                'quantity_available': 22,
                'featured': False
            },
            {
                'title': 'MAC Cosmetics Professional',
                'category': 'Beauty & Cosmetics',
                'points': 2000,
                'original_points': 2700,
                'discount_percentage': 26,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$140 MAC Cosmetics voucher for professional makeup',
                'terms': 'Valid for 240 days. Professional makeup consultations included. Limited edition collections.',
                'quantity_available': 18,
                'featured': True
            },

            # Electronics & Technology
            {
                'title': 'Apple Store Gift Card',
                'category': 'Electronics',
                'points': 4000,
                'original_points': 5500,
                'discount_percentage': 27,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$250 Apple gift card for iPhones, iPads, and accessories',
                'terms': 'Valid for 365 days. AppleCare+ available. Online and retail store redemption.',
                'quantity_available': 8,
                'featured': True
            },
            {
                'title': 'Samsung Galaxy Store',
                'category': 'Electronics',
                'points': 3500,
                'original_points': 4800,
                'discount_percentage': 27,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$220 Samsung voucher for Galaxy phones and tablets',
                'terms': 'Valid for 300 days. Warranty included. Trade-in program available.',
                'quantity_available': 12,
                'featured': True
            },
            {
                'title': 'Best Buy Electronics',
                'category': 'Electronics',
                'points': 3000,
                'original_points': 4200,
                'discount_percentage': 29,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$190 Best Buy gift card for electronics and appliances',
                'terms': 'Valid for 180 days. Geek Squad services available. Extended warranties offered.',
                'quantity_available': 20,
                'featured': False
            },

            # Food & Dining Brands
            {
                'title': 'Starbucks Coffee Experience',
                'category': 'Dining',
                'points': 800,
                'original_points': 1100,
                'discount_percentage': 27,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$55 Starbucks gift card for premium coffee and snacks',
                'terms': 'Valid for 365 days. Mobile app integration. Rewards program included.',
                'quantity_available': 40,
                'featured': False
            },
            {
                'title': 'McDonald\'s Family Meal',
                'category': 'Dining',
                'points': 600,
                'original_points': 850,
                'discount_percentage': 29,
                'rating': 4.3,
                'image_url': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$40 McDonald\'s voucher for family meals and treats',
                'terms': 'Valid for 90 days. Drive-thru and dine-in available. Mobile ordering supported.',
                'quantity_available': 50,
                'featured': False
            },
            {
                'title': 'Subway Fresh & Healthy',
                'category': 'Dining',
                'points': 700,
                'original_points': 950,
                'discount_percentage': 26,
                'rating': 4.4,
                'image_url': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$48 Subway voucher for fresh sandwiches and salads',
                'terms': 'Valid for 120 days. Customizable options. Fresh ingredients daily.',
                'quantity_available': 35,
                'featured': False
            },
            {
                'title': 'Pizza Hut Family Feast',
                'category': 'Dining',
                'points': 900,
                'original_points': 1200,
                'discount_percentage': 25,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$65 Pizza Hut voucher for family pizza meals',
                'terms': 'Valid for 90 days. Delivery and carryout available. Online ordering supported.',
                'quantity_available': 30,
                'featured': False
            },

            # Travel & Hospitality
            {
                'title': 'Uber Rides & Eats',
                'category': 'Travel',
                'points': 1500,
                'original_points': 2000,
                'discount_percentage': 25,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$100 Uber credit for rides and food delivery',
                'terms': 'Valid for 180 days. Available in most cities. Safety features included.',
                'quantity_available': 25,
                'featured': False
            },
            {
                'title': 'Airbnb Travel Experience',
                'category': 'Travel',
                'points': 3500,
                'original_points': 4800,
                'discount_percentage': 27,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$225 Airbnb voucher for unique accommodations',
                'terms': 'Valid for 365 days. Booking fees included. Host protection program.',
                'quantity_available': 15,
                'featured': True
            },
            {
                'title': 'Expedia Travel Package',
                'category': 'Travel',
                'points': 4000,
                'original_points': 5500,
                'discount_percentage': 27,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$250 Expedia voucher for flights, hotels, and packages',
                'terms': 'Valid for 365 days. Price guarantee. 24/7 customer support.',
                'quantity_available': 10,
                'featured': True
            },

            # Home & Garden
            {
                'title': 'IKEA Home Essentials',
                'category': 'Home & Garden',
                'points': 2000,
                'original_points': 2800,
                'discount_percentage': 29,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$140 IKEA voucher for furniture and home accessories',
                'terms': 'Valid for 180 days. Assembly services available. Flat-pack guarantee.',
                'quantity_available': 20,
                'featured': False
            },
            {
                'title': 'Home Depot DIY Projects',
                'category': 'Home & Garden',
                'points': 2500,
                'original_points': 3500,
                'discount_percentage': 29,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$175 Home Depot gift card for tools and materials',
                'terms': 'Valid for 365 days. Tool rental available. Project consultations included.',
                'quantity_available': 18,
                'featured': False
            },

            # Books & Media
            {
                'title': 'Amazon Kindle & Books',
                'category': 'Books & Media',
                'points': 1200,
                'original_points': 1600,
                'discount_percentage': 25,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$80 Amazon gift card for books, Kindle, and digital content',
                'terms': 'Valid for 365 days. Prime membership benefits. Digital and physical books.',
                'quantity_available': 30,
                'featured': False
            },
            {
                'title': 'Barnes & Noble Reading',
                'category': 'Books & Media',
                'points': 1000,
                'original_points': 1350,
                'discount_percentage': 26,
                'rating': 4.5,
                'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$68 Barnes & Noble gift card for books and magazines',
                'terms': 'Valid for 180 days. In-store events included. Educator discounts available.',
                'quantity_available': 25,
                'featured': False
            },

            # Health & Pharmacy
            {
                'title': 'CVS Pharmacy & Health',
                'category': 'Health & Pharmacy',
                'points': 800,
                'original_points': 1100,
                'discount_percentage': 27,
                'rating': 4.4,
                'image_url': 'https://images.unsplash.com/photo-1550572017-edd951aa0c2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$55 CVS gift card for pharmacy and health products',
                'terms': 'Valid for 365 days. Prescription services available. Health screenings included.',
                'quantity_available': 35,
                'featured': False
            },
            {
                'title': 'Walgreens Health & Wellness',
                'category': 'Health & Pharmacy',
                'points': 900,
                'original_points': 1200,
                'discount_percentage': 25,
                'rating': 4.3,
                'image_url': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$60 Walgreens voucher for health and wellness products',
                'terms': 'Valid for 180 days. Photo services available. Flu shots included.',
                'quantity_available': 32,
                'featured': False
            },

            # Grocery & Essentials
            {
                'title': 'Whole Foods Organic',
                'category': 'Groceries',
                'points': 1500,
                'original_points': 2000,
                'discount_percentage': 25,
                'rating': 4.7,
                'image_url': 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$100 Whole Foods voucher for organic groceries',
                'terms': 'Valid for 120 days. Organic guarantee. Prepared foods included.',
                'quantity_available': 20,
                'featured': False
            },
            {
                'title': 'Trader Joe\'s Unique Finds',
                'category': 'Groceries',
                'points': 1200,
                'original_points': 1600,
                'discount_percentage': 25,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$80 Trader Joe\'s voucher for unique food products',
                'terms': 'Valid for 180 days. Seasonal products available. No artificial preservatives.',
                'quantity_available': 25,
                'featured': False
            },
            {
                'title': 'Target Everything Store',
                'category': 'Shopping',
                'points': 1800,
                'original_points': 2400,
                'discount_percentage': 25,
                'rating': 4.6,
                'image_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$120 Target gift card for everyday essentials',
                'terms': 'Valid for 365 days. Drive-up services available. RedCard benefits included.',
                'quantity_available': 30,
                'featured': False
            },
        ]

        created_count = 0
        for voucher_data in brand_vouchers_data:
            try:
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
                    created_count += 1
                    self.stdout.write(f'Created brand voucher: {voucher.title}')
                else:
                    self.stdout.write(f'Brand voucher already exists: {voucher.title}')
            except VoucherCategory.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Category "{voucher_data["category"]}" not found for voucher: {voucher_data["title"]}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} real-world brand vouchers!')
        )
