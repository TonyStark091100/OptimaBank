from django.core.management.base import BaseCommand
from accounts.models import VoucherCategory, Voucher

class Command(BaseCommand):
    help = 'Populate the database with luxury brand vouchers'

    def handle(self, *args, **options):
        # Create luxury categories if they don't exist
        luxury_categories_data = [
            {'name': 'Luxury Fashion', 'icon': 'diamond'},
            {'name': 'Premium Dining', 'icon': 'restaurant_menu'},
            {'name': 'Luxury Travel', 'icon': 'business_class'},
            {'name': 'High-End Beauty', 'icon': 'face_retouching_natural'},
        ]

        for cat_data in luxury_categories_data:
            category, created = VoucherCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'icon': cat_data['icon']}
            )
            if created:
                self.stdout.write(f'Created luxury category: {category.name}')

        # Create luxury brand vouchers
        luxury_vouchers_data = [
            # Luxury Fashion Brands
            {
                'title': 'Louis Vuitton Luxury Accessories',
                'category': 'Luxury Fashion',
                'points': 15000,
                'original_points': 20000,
                'discount_percentage': 25,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$1000 Louis Vuitton voucher for luxury handbags and accessories',
                'terms': 'Valid for 365 days. Exclusive collections available. Personal shopping assistant included.',
                'quantity_available': 3,
                'featured': True
            },
            {
                'title': 'Gucci Italian Luxury',
                'category': 'Luxury Fashion',
                'points': 12000,
                'original_points': 16000,
                'discount_percentage': 25,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$800 Gucci voucher for luxury fashion and accessories',
                'terms': 'Valid for 365 days. Made in Italy guarantee. VIP customer service.',
                'quantity_available': 5,
                'featured': True
            },
            {
                'title': 'Chanel Timeless Elegance',
                'category': 'Luxury Fashion',
                'points': 18000,
                'original_points': 24000,
                'discount_percentage': 25,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$1200 Chanel voucher for iconic fashion and beauty',
                'terms': 'Valid for 365 days. Limited edition collections. Personal styling consultation.',
                'quantity_available': 2,
                'featured': True
            },
            {
                'title': 'Hermès Artisan Craftsmanship',
                'category': 'Luxury Fashion',
                'points': 25000,
                'original_points': 33000,
                'discount_percentage': 24,
                'rating': 5.0,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$1650 Hermès voucher for artisanal luxury goods',
                'terms': 'Valid for 365 days. Handcrafted guarantee. Exclusive access to limited collections.',
                'quantity_available': 1,
                'featured': True
            },
            {
                'title': 'Prada Modern Luxury',
                'category': 'Luxury Fashion',
                'points': 10000,
                'original_points': 13500,
                'discount_percentage': 26,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$675 Prada voucher for contemporary luxury fashion',
                'terms': 'Valid for 365 days. Innovative design guarantee. VIP shopping experience.',
                'quantity_available': 4,
                'featured': True
            },

            # Premium Dining
            {
                'title': 'Michelin Star Dining Experience',
                'category': 'Premium Dining',
                'points': 8000,
                'original_points': 11000,
                'discount_percentage': 27,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$550 fine dining experience at Michelin-starred restaurants',
                'terms': 'Valid for 180 days. Chef\'s tasting menu included. Wine pairing available. Reservation assistance.',
                'quantity_available': 6,
                'featured': True
            },
            {
                'title': 'Gordon Ramsay Restaurant',
                'category': 'Premium Dining',
                'points': 6000,
                'original_points': 8000,
                'discount_percentage': 25,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$400 dining experience at Gordon Ramsay restaurants',
                'terms': 'Valid for 120 days. Signature dishes included. Meet the chef opportunities.',
                'quantity_available': 8,
                'featured': True
            },
            {
                'title': 'Nobu Japanese Excellence',
                'category': 'Premium Dining',
                'points': 5000,
                'original_points': 7000,
                'discount_percentage': 29,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$350 Nobu voucher for authentic Japanese cuisine',
                'terms': 'Valid for 150 days. Omakase menu available. Sake pairing included.',
                'quantity_available': 10,
                'featured': True
            },

            # Luxury Travel
            {
                'title': 'Four Seasons Resort Experience',
                'category': 'Luxury Travel',
                'points': 20000,
                'original_points': 28000,
                'discount_percentage': 29,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$1400 luxury resort stay at Four Seasons properties',
                'terms': 'Valid for 365 days. Spa services included. Concierge assistance. Room upgrades available.',
                'quantity_available': 4,
                'featured': True
            },
            {
                'title': 'Ritz-Carlton Luxury Hotels',
                'category': 'Luxury Travel',
                'points': 18000,
                'original_points': 25000,
                'discount_percentage': 28,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$1250 luxury hotel experience at Ritz-Carlton',
                'terms': 'Valid for 365 days. Club level access. Personal butler service. Airport transfers included.',
                'quantity_available': 5,
                'featured': True
            },
            {
                'title': 'Private Jet Charter',
                'category': 'Luxury Travel',
                'points': 50000,
                'original_points': 70000,
                'discount_percentage': 29,
                'rating': 5.0,
                'image_url': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$3500 private jet charter for luxury travel',
                'terms': 'Valid for 365 days. VIP terminal access. Catering included. Flexible scheduling.',
                'quantity_available': 1,
                'featured': True
            },

            # High-End Beauty
            {
                'title': 'La Mer Luxury Skincare',
                'category': 'High-End Beauty',
                'points': 6000,
                'original_points': 8000,
                'discount_percentage': 25,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$400 La Mer voucher for luxury skincare products',
                'terms': 'Valid for 365 days. Personal skincare consultation. Exclusive products available.',
                'quantity_available': 8,
                'featured': True
            },
            {
                'title': 'Tom Ford Beauty Collection',
                'category': 'High-End Beauty',
                'points': 4000,
                'original_points': 5500,
                'discount_percentage': 27,
                'rating': 4.8,
                'image_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$275 Tom Ford Beauty voucher for luxury cosmetics',
                'terms': 'Valid for 365 days. Personal makeup artist consultation. Limited edition collections.',
                'quantity_available': 12,
                'featured': True
            },
            {
                'title': 'Dior Luxury Beauty',
                'category': 'High-End Beauty',
                'points': 5000,
                'original_points': 6800,
                'discount_percentage': 26,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$340 Dior voucher for luxury beauty and fragrance',
                'terms': 'Valid for 365 days. Personalized fragrance consultation. Exclusive beauty treatments.',
                'quantity_available': 10,
                'featured': True
            },

            # Additional Premium Brands
            {
                'title': 'Rolex Timepiece Collection',
                'category': 'Luxury Fashion',
                'points': 80000,
                'original_points': 110000,
                'discount_percentage': 27,
                'rating': 5.0,
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$5500 Rolex voucher for luxury timepieces',
                'terms': 'Valid for 365 days. Authorized dealer guarantee. Lifetime service included.',
                'quantity_available': 1,
                'featured': True
            },
            {
                'title': 'Tiffany & Co. Jewelry',
                'category': 'Luxury Fashion',
                'points': 12000,
                'original_points': 16000,
                'discount_percentage': 25,
                'rating': 4.9,
                'image_url': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                'description': '$800 Tiffany & Co. voucher for luxury jewelry',
                'terms': 'Valid for 365 days. Blue box guarantee. Personal jewelry consultation.',
                'quantity_available': 3,
                'featured': True
            },
        ]

        created_count = 0
        for voucher_data in luxury_vouchers_data:
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
                    self.stdout.write(f'Created luxury voucher: {voucher.title}')
                else:
                    self.stdout.write(f'Luxury voucher already exists: {voucher.title}')
            except VoucherCategory.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Category "{voucher_data["category"]}" not found for voucher: {voucher_data["title"]}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} luxury brand vouchers!')
        )
