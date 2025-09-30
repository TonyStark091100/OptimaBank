from django.core.management.base import BaseCommand
from accounts.models import Voucher

class Command(BaseCommand):
    help = 'Update specific brand vouchers with more accurate and brand-specific images'

    def handle(self, *args, **options):
        # More specific brand images
        specific_brand_images = {
            # Sports brands with more specific images
            'Nike Store Gift Card': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Adidas Apparel Voucher': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Food brands with more specific images
            'Starbucks Coffee Experience': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'McDonald\'s Family Meal': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Subway Fresh & Healthy': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Pizza Hut Family Feast': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Electronics with more specific images
            'Apple Store Gift Card': 'https://images.unsplash.com/photo-1529612700005-e35377bf1415?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Samsung Galaxy Store': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Beauty with more specific images
            'Sephora Beauty Collection': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Ulta Beauty Essentials': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Travel with more specific images
            'Uber Rides & Eats': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Airbnb Travel Experience': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Private Jet Charter': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Luxury items with more specific images
            'Rolex Timepiece Collection': 'https://images.unsplash.com/photo-1523170335258-f5c6d7a4b332?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Tiffany & Co. Jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Home & Garden with more specific images
            'IKEA Home Essentials': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Home Depot DIY Projects': 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Books & Media with more specific images
            'Amazon Kindle & Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Barnes & Noble Reading': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Health & Pharmacy with more specific images
            'CVS Pharmacy & Health': 'https://images.unsplash.com/photo-1550572017-edd951aa0c2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Walgreens Health & Wellness': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            
            # Grocery with more specific images
            'Whole Foods Organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Trader Joe\'s Unique Finds': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
            'Target Everything Store': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        }

        updated_count = 0
        not_found_count = 0

        for voucher_title, new_image_url in specific_brand_images.items():
            try:
                voucher = Voucher.objects.get(title=voucher_title)
                old_image = voucher.image_url
                voucher.image_url = new_image_url
                voucher.save()
                updated_count += 1
                self.stdout.write(f'Updated specific image for: {voucher_title}')
            except Voucher.DoesNotExist:
                not_found_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Voucher not found: {voucher_title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} specific brand images!')
        )
        if not_found_count > 0:
            self.stdout.write(
                self.style.WARNING(f'{not_found_count} vouchers were not found in the database.')
            )
