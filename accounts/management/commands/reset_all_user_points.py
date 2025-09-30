"""
Management command to reset all users to exactly 10,000 points.
This ensures all existing users have the same starting point balance.
"""

from django.core.management.base import BaseCommand
from accounts.models import UserProfile, TierActivity
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset all users to exactly 10,000 points'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS('Starting user points reset...')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        
        if total_users == 0:
            self.stdout.write(
                self.style.WARNING('No users found in the database')
            )
            return
        
        self.stdout.write(f'Found {total_users} users to process')
        
        updated_count = 0
        created_count = 0
        
        for user in users:
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'points': 10000}
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'  Created profile for {user.email} with 10,000 points')
            else:
                # Check if points need to be reset
                if profile.points != 10000:
                    old_points = profile.points
                    if not dry_run:
                        profile.points = 10000
                        profile.save()
                    updated_count += 1
                    self.stdout.write(
                        f'  {"Would reset" if dry_run else "Reset"} {user.email}: '
                        f'{old_points} -> 10,000 points'
                    )
                else:
                    self.stdout.write(f'  {user.email} already has 10,000 points')
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(
            self.style.SUCCESS(f'Summary:')
        )
        self.stdout.write(f'  Total users processed: {total_users}')
        self.stdout.write(f'  New profiles created: {created_count}')
        self.stdout.write(f'  Profiles updated: {updated_count}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('This was a dry run. Use without --dry-run to apply changes.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('All users now have exactly 10,000 points!')
            )
