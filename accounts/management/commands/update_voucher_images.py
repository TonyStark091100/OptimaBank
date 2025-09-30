from django.core.management.base import BaseCommand
from accounts.models import Voucher

class Command(BaseCommand):
    help = 'Update voucher images with more relevant and brand-specific pictures'

    def handle(self, *args, **options):
        # Define brand-specific image mappings
        voucher_image_updates = {
            # Sports & Fitness Brands
            'Nike Store Gift Card': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Adidas Apparel Voucher': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Under Armour Performance Gear': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Lululemon Yoga & Athleisure': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Fashion Brands
            'Zara Fashion Collection': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'H&M Style Essentials': 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Uniqlo Quality Basics': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Luxury Fashion Brands
            'Louis Vuitton Luxury Accessories': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Gucci Italian Luxury': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Chanel Timeless Elegance': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Hermès Artisan Craftsmanship': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Prada Modern Luxury': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Rolex Timepiece Collection': 'https://images.unsplash.com/photo-1523170335258-f5c6d7a4b332?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Tiffany & Co. Jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Beauty & Cosmetics
            'Sephora Beauty Collection': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Ulta Beauty Essentials': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'MAC Cosmetics Professional': 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'La Mer Luxury Skincare': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Tom Ford Beauty Collection': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Dior Luxury Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Electronics
            'Apple Store Gift Card': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Samsung Galaxy Store': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Best Buy Electronics': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Food & Dining
            'Starbucks Coffee Experience': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'McDonald\'s Family Meal': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Subway Fresh & Healthy': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Pizza Hut Family Feast': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Michelin Star Dining Experience': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Gordon Ramsay Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Nobu Japanese Excellence': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Travel & Hospitality
            'Uber Rides & Eats': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Airbnb Travel Experience': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Expedia Travel Package': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Four Seasons Resort Experience': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Ritz-Carlton Luxury Hotels': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Private Jet Charter': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Home & Garden
            'IKEA Home Essentials': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Home Depot DIY Projects': 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Books & Media
            'Amazon Kindle & Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Barnes & Noble Reading': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Health & Pharmacy
            'CVS Pharmacy & Health': 'https://images.unsplash.com/photo-1550572017-edd951aa0c2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Walgreens Health & Wellness': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Grocery & Essentials
            'Whole Foods Organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Trader Joe\'s Unique Finds': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Target Everything Store': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',

            # Existing vouchers that need better images
            'Fine Dining Experience': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Casual Dining Package': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Coffee Shop Monthly Pass': 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Fashion Retailer Gift Card': 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Department Store Credit': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Movie Theater Package': 'https://images.unsplash.com/photo-1489599851395-36c8a9285fbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Concert Ticket Credit': 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Weekend Hotel Stay': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Premium Spa Package': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Tech Store Voucher': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        }

        updated_count = 0
        not_found_count = 0

        for voucher_title, new_image_url in voucher_image_updates.items():
            try:
                voucher = Voucher.objects.get(title=voucher_title)
                voucher.image_url = new_image_url
                voucher.save()
                updated_count += 1
                self.stdout.write(f'Updated image for: {voucher_title}')
            except Voucher.DoesNotExist:
                not_found_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Voucher not found: {voucher_title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} voucher images!')
        )
        if not_found_count > 0:
            self.stdout.write(
                self.style.WARNING(f'{not_found_count} vouchers were not found in the database.')
            )
