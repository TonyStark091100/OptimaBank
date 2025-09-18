from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Updates all existing user profiles to 10,000 points.'

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        self.stdout.write(f'Found {users.count()} users in the system')

        updated_count = 0
        created_count = 0

        for user in users:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                profile.points = 10000
                profile.save()
                self.stdout.write(f'Created profile for {user.email} with {profile.points} points')
                created_count += 1
            elif profile.points != 10000:
                self.stdout.write(f'Updated {user.email} from {profile.points} to 10,000 points')
                profile.points = 10000
                profile.save()
                updated_count += 1
            else:
                self.stdout.write(f'{user.email} already has {profile.points} points')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {created_count} profiles and updated {updated_count} users to 10,000 points'
        ))
