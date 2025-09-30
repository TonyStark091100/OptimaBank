from django.core.management.base import BaseCommand
from accounts.models import Voucher

class Command(BaseCommand):
    help = 'Fix HTML characters in voucher titles and descriptions for PDF generation'

    def handle(self, *args, **options):
        self.stdout.write('Fixing HTML characters in vouchers...')
        
        # HTML character mappings
        html_replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
        }
        
        vouchers = Voucher.objects.all()
        fixed_count = 0
        
        for voucher in vouchers:
            updated = False
            
            # Fix title
            if voucher.title:
                original_title = voucher.title
                for char, replacement in html_replacements.items():
                    if char in voucher.title:
                        voucher.title = voucher.title.replace(char, replacement)
                        updated = True
                if updated:
                    self.stdout.write(f'Fixed title for voucher {voucher.id}: "{original_title}" -> "{voucher.title}"')
            
            # Fix description
            if voucher.description:
                original_description = voucher.description
                for char, replacement in html_replacements.items():
                    if char in voucher.description:
                        voucher.description = voucher.description.replace(char, replacement)
                        updated = True
                if updated:
                    self.stdout.write(f'Fixed description for voucher {voucher.id}')
            
            # Fix terms
            if voucher.terms:
                original_terms = voucher.terms
                for char, replacement in html_replacements.items():
                    if char in voucher.terms:
                        voucher.terms = voucher.terms.replace(char, replacement)
                        updated = True
                if updated:
                    self.stdout.write(f'Fixed terms for voucher {voucher.id}')
            
            if updated:
                voucher.save()
                fixed_count += 1
        
        if fixed_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Fixed HTML characters in {fixed_count} vouchers!')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No vouchers needed fixing.')
            )
