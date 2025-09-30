from django.core.management.base import BaseCommand
from accounts.models import Voucher, UserProfile, Redemption
from users.models import CustomUser as User
from django.utils import timezone
import uuid

class Command(BaseCommand):
    help = 'Test PDF generation for all vouchers by simulating redemptions'

    def handle(self, *args, **options):
        self.stdout.write('Testing PDF generation for all vouchers...')
        
        # Get or create a test user
        test_user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'User',
                'phone_number': '1234567890',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write('Created test user for PDF testing')
        
        # Get or create user profile with enough points
        profile, created = UserProfile.objects.get_or_create(
            user=test_user,
            defaults={'points': 100000}
        )
        
        if profile.points < 100000:
            profile.points = 100000
            profile.save()
            self.stdout.write('Updated test user points to 100,000')
        
        vouchers = Voucher.objects.filter(is_active=True)
        successful_tests = 0
        failed_tests = 0
        
        self.stdout.write(f'Testing {vouchers.count()} vouchers...')
        
        for voucher in vouchers:
            try:
                self.stdout.write(f'Testing voucher ID {voucher.id}: {voucher.title}')
                
                # Create a test redemption
                redemption = Redemption.objects.create(
                    user=test_user,
                    voucher=voucher,
                    quantity=1,
                    points_used=voucher.points,
                    status='completed',
                    completed_at=timezone.now(),
                    coupon_code=f"TEST-{uuid.uuid4().hex[:8].upper()}"
                )
                
                # Test PDF generation
                from accounts.views import generate_voucher_pdf
                pdf_url = generate_voucher_pdf(redemption)
                
                if pdf_url:
                    redemption.pdf_url = pdf_url
                    redemption.save()
                    successful_tests += 1
                    self.stdout.write(f'  SUCCESS - PDF generated successfully: {pdf_url}')
                else:
                    failed_tests += 1
                    self.stdout.write(f'  FAILED - PDF generation failed')
                
                # Clean up test redemption
                redemption.delete()
                
            except Exception as e:
                failed_tests += 1
                self.stdout.write(f'  ERROR - {str(e)}')
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write('PDF GENERATION TEST SUMMARY:')
        self.stdout.write(f'Total vouchers tested: {vouchers.count()}')
        self.stdout.write(f'Successful PDF generations: {successful_tests}')
        self.stdout.write(f'Failed PDF generations: {failed_tests}')
        
        if failed_tests == 0:
            self.stdout.write(
                self.style.SUCCESS('\nSUCCESS: ALL VOUCHERS CAN GENERATE PDFs!')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'\nWARNING: {failed_tests} vouchers failed PDF generation')
            )
        
        # Test multi-voucher PDF generation
        self.stdout.write('\nTesting multi-voucher PDF generation...')
        try:
            # Create test redemptions for multiple vouchers
            test_vouchers = vouchers[:3]  # Test with first 3 vouchers
            test_redemptions = []
            
            for voucher in test_vouchers:
                redemption = Redemption.objects.create(
                    user=test_user,
                    voucher=voucher,
                    quantity=1,
                    points_used=voucher.points,
                    status='completed',
                    completed_at=timezone.now(),
                    coupon_code=f"MULTI-{uuid.uuid4().hex[:8].upper()}"
                )
                test_redemptions.append(redemption)
            
            # Test multi-voucher PDF generation
            from accounts.views import generate_multi_voucher_pdf
            multi_pdf_url = generate_multi_voucher_pdf(test_redemptions)
            
            if multi_pdf_url:
                self.stdout.write(f'SUCCESS - Multi-voucher PDF generated successfully: {multi_pdf_url}')
                
                # Update all redemptions with the PDF URL
                for redemption in test_redemptions:
                    redemption.pdf_url = multi_pdf_url
                    redemption.save()
            else:
                self.stdout.write('FAILED - Multi-voucher PDF generation failed')
            
            # Clean up test redemptions
            for redemption in test_redemptions:
                redemption.delete()
                
        except Exception as e:
            self.stdout.write(f'ERROR - Multi-voucher PDF test error: {str(e)}')
        
        self.stdout.write('\nPDF generation testing completed!')
