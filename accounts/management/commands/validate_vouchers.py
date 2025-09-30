from django.core.management.base import BaseCommand
from accounts.models import Voucher

class Command(BaseCommand):
    help = 'Validate all vouchers for PDF generation compatibility'

    def handle(self, *args, **options):
        self.stdout.write('Validating vouchers for PDF generation...')
        
        vouchers = Voucher.objects.all()
        issues_found = 0
        
        for voucher in vouchers:
            issues = []
            
            # Check required fields
            if not voucher.title:
                issues.append("Missing title")
            if not voucher.description:
                issues.append("Missing description")
            if not voucher.terms:
                issues.append("Missing terms")
            if voucher.points <= 0:
                issues.append("Invalid points value")
            if voucher.quantity_available < 0:
                issues.append("Negative quantity available")
            
            # Check for problematic characters in text fields (but allow HTML entities)
            problematic_chars = ['<', '>']
            # Check for unescaped & characters (not part of HTML entities)
            if voucher.title and ('<' in voucher.title or '>' in voucher.title):
                issues.append("Title contains HTML characters")
            elif voucher.title and '&' in voucher.title:
                # Check if it's properly escaped HTML entities
                unescaped_ampersands = voucher.title.replace('&amp;', '').replace('&#x27;', '').replace('&quot;', '').replace('&lt;', '').replace('&gt;', '')
                if '&' in unescaped_ampersands:
                    issues.append("Title contains unescaped ampersands")
            
            if voucher.description and ('<' in voucher.description or '>' in voucher.description):
                issues.append("Description contains HTML characters")
            elif voucher.description and '&' in voucher.description:
                unescaped_ampersands = voucher.description.replace('&amp;', '').replace('&#x27;', '').replace('&quot;', '').replace('&lt;', '').replace('&gt;', '')
                if '&' in unescaped_ampersands:
                    issues.append("Description contains unescaped ampersands")
            
            if voucher.terms and ('<' in voucher.terms or '>' in voucher.terms):
                issues.append("Terms contain HTML characters")
            elif voucher.terms and '&' in voucher.terms:
                unescaped_ampersands = voucher.terms.replace('&amp;', '').replace('&#x27;', '').replace('&quot;', '').replace('&lt;', '').replace('&gt;', '')
                if '&' in unescaped_ampersands:
                    issues.append("Terms contain unescaped ampersands")
            
            if issues:
                issues_found += 1
                self.stdout.write(
                    self.style.WARNING(f'Voucher ID {voucher.id} ({voucher.title}): {", ".join(issues)}')
                )
            else:
                self.stdout.write(f'OK - Voucher ID {voucher.id} ({voucher.title})')
        
        if issues_found == 0:
            self.stdout.write(
                self.style.SUCCESS('All vouchers are valid for PDF generation!')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'Found issues with {issues_found} vouchers. These may cause PDF generation failures.')
            )
