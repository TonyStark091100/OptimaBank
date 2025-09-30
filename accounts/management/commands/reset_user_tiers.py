"""
Management command to reset all users' tier system.
This will reset users to Bronze tier and clear their tier activity history.
"""

from django.core.management.base import BaseCommand
from accounts.models import UserProfile, TierActivity, UserTier, RewardTier, Notification
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset all users tier system to Bronze tier with clean slate'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes',
        )
        parser.add_argument(
            '--keep-points',
            action='store_true',
            help='Keep current points but reset tier system',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        keep_points = options['keep_points']
        
        self.stdout.write(
            self.style.SUCCESS('Starting user tier system reset...')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        # Get Bronze tier (level 1)
        bronze_tier = RewardTier.objects.filter(tier_level=1).first()
        if not bronze_tier:
            self.stdout.write(
                self.style.ERROR('Bronze tier not found! Please run populate_tiers first.')
            )
            return
        
        # Get all users
        users = User.objects.all()
        total_users = users.count()
        
        if total_users == 0:
            self.stdout.write(
                self.style.WARNING('No users found in the database')
            )
            return
        
        self.stdout.write(f'Found {total_users} users to process')
        self.stdout.write(f'Target tier: {bronze_tier.get_tier_name_display()} (Level {bronze_tier.tier_level})')
        
        updated_tiers = 0
        cleared_activities = 0
        reset_profiles = 0
        
        for user in users:
            self.stdout.write(f'\nProcessing {user.email}:')
            
            # 1. Reset user profile points if not keeping them
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'points': 10000}
            )
            
            if not keep_points and not created:
                old_points = profile.points
                if not dry_run:
                    profile.points = 10000
                    profile.save()
                reset_profiles += 1
                self.stdout.write(f'  Reset profile points: {old_points} -> 10,000')
            
            # 2. Clear all tier activities for this user
            user_activities = TierActivity.objects.filter(user=user)
            activity_count = user_activities.count()
            
            if activity_count > 0:
                if not dry_run:
                    user_activities.delete()
                cleared_activities += activity_count
                self.stdout.write(f'  Cleared {activity_count} tier activities')
            
            # 3. Reset user tier to Bronze
            user_tier, created = UserTier.objects.get_or_create(
                user=user,
                defaults={
                    'current_tier': bronze_tier,
                    'total_points_earned': 0,
                    'tier_points': 0,
                    'tier_start_date': timezone.now(),
                    'last_tier_upgrade': timezone.now()
                }
            )
            
            if not created:
                old_tier = user_tier.current_tier
                old_total = user_tier.total_points_earned
                
                if not dry_run:
                    user_tier.current_tier = bronze_tier
                    user_tier.total_points_earned = 0
                    user_tier.tier_points = 0
                    user_tier.tier_start_date = timezone.now()
                    user_tier.last_tier_upgrade = timezone.now()
                    user_tier.save()
                
                updated_tiers += 1
                self.stdout.write(
                    f'  Reset tier: {old_tier.get_tier_name_display()} -> {bronze_tier.get_tier_name_display()}'
                )
                self.stdout.write(f'  Reset total points: {old_total} -> 0')
            else:
                self.stdout.write(f'  Created new tier record for Bronze tier')
            
            # 4. Create welcome bonus activity for existing users
            if not keep_points:
                if not dry_run:
                    TierActivity.objects.create(
                        user=user,
                        activity_type='welcome_bonus',
                        points_earned=10000,
                        description='Welcome bonus - Tier system reset'
                    )
                self.stdout.write(f'  Created welcome bonus activity (+10,000 points)')
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS('Tier System Reset Summary:')
        )
        self.stdout.write(f'  Total users processed: {total_users}')
        self.stdout.write(f'  User tiers reset: {updated_tiers}')
        self.stdout.write(f'  Tier activities cleared: {cleared_activities}')
        if not keep_points:
            self.stdout.write(f'  User profiles reset: {reset_profiles}')
        
        self.stdout.write(f'  All users now start at: {bronze_tier.get_tier_name_display()}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('This was a dry run. Use without --dry-run to apply changes.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('Tier system reset complete! All users start fresh at Bronze tier.')
            )
