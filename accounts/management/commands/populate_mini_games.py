"""
Management command to populate mini-games in the database.
"""

from django.core.management.base import BaseCommand
from accounts.models import MiniGame


class Command(BaseCommand):
    help = 'Populate mini-games in the database'

    def handle(self, *args, **options):
        """Create mini-games if they don't exist."""
        
        games_data = [
            {
                'name': 'Spin the Wheel',
                'game_type': 'spin_wheel',
                'description': 'Spin the wheel to win points! Higher scores earn more points.',
                'base_points': 10,
                'max_points': 50
            },
            {
                'name': 'Memory Game',
                'game_type': 'memory_game',
                'description': 'Match pairs of cards to test your memory and earn points.',
                'base_points': 15,
                'max_points': 75
            },
            {
                'name': 'Trivia Quiz',
                'game_type': 'trivia_quiz',
                'description': 'Answer trivia questions correctly to earn points.',
                'base_points': 20,
                'max_points': 100
            },
            {
                'name': 'Daily Challenge',
                'game_type': 'daily_challenge',
                'description': 'Complete daily challenges for bonus points.',
                'base_points': 25,
                'max_points': 150
            }
        ]
        
        created_count = 0
        for game_data in games_data:
            game, created = MiniGame.objects.get_or_create(
                name=game_data['name'],
                defaults=game_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created mini-game: {game.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Mini-game already exists: {game.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} mini-games')
        )
