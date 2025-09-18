"""
Django management command to update all existing users to have 6000 points.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Update all existing users to have 6000 points'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        User = get_user_model()
        dry_run = options['dry_run']
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        
        self.stdout.write(f'Found {total_users} users in the system')
        
        updated_count = 0
        created_count = 0
        
        for user in users:
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'points': 6000}
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'Created profile for {user.email} with 6000 points')
            elif profile.points != 6000:
                if not dry_run:
                    profile.points = 6000
                    profile.save()
                    updated_count += 1
                    self.stdout.write(f'Updated {user.email} from {profile.points} to 6000 points')
                else:
                    self.stdout.write(f'Would update {user.email} from {profile.points} to 6000 points')
            else:
                self.stdout.write(f'{user.email} already has 6000 points')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would create {created_count} profiles and update {updated_count} users'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {created_count} profiles and updated {updated_count} users to 6000 points'
                )
            )
