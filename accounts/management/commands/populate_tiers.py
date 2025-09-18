from django.core.management.base import BaseCommand
from accounts.models import RewardTier, TierBenefit


class Command(BaseCommand):
    help = 'Populates the tiered rewards system with initial tiers and benefits.'

    def handle(self, *args, **kwargs):
        # Create reward tiers
        tiers_data = [
            {
                'tier_name': 'bronze',
                'tier_level': 1,
                'min_points': 0,
                'color': '#CD7F32',
                'icon': '🥉',
                'benefits': ['Basic rewards', 'Standard support'],
                'exclusive_offers': False,
                'premium_support': False,
            },
            {
                'tier_name': 'silver',
                'tier_level': 2,
                'min_points': 1000,
                'color': '#C0C0C0',
                'icon': '🥈',
                'benefits': ['Enhanced rewards', 'Priority support', '5% bonus points'],
                'exclusive_offers': True,
                'premium_support': False,
            },
            {
                'tier_name': 'gold',
                'tier_level': 3,
                'min_points': 5000,
                'color': '#FFD700',
                'icon': '🥇',
                'benefits': ['Premium rewards', 'VIP support', '10% bonus points', 'Early access'],
                'exclusive_offers': True,
                'premium_support': True,
            },
            {
                'tier_name': 'platinum',
                'tier_level': 4,
                'min_points': 15000,
                'color': '#E5E4E2',
                'icon': '💎',
                'benefits': ['Ultimate rewards', 'Concierge support', '15% bonus points', 'Exclusive events'],
                'exclusive_offers': True,
                'premium_support': True,
            },
        ]

        created_tiers = 0
        for tier_data in tiers_data:
            tier, created = RewardTier.objects.get_or_create(
                tier_name=tier_data['tier_name'],
                defaults=tier_data
            )
            if created:
                created_tiers += 1
                self.stdout.write(f"Created {tier.get_tier_name_display()} tier")

        # Create tier benefits
        benefits_data = [
            # Bronze tier benefits
            {
                'tier_name': 'bronze',
                'benefits': [
                    {
                        'benefit_name': 'Basic Rewards Access',
                        'description': 'Access to basic reward vouchers and standard redemption options.',
                        'benefit_type': 'discount',
                    },
                    {
                        'benefit_name': 'Standard Support',
                        'description': 'Standard customer support via email and chat.',
                        'benefit_type': 'premium_support',
                    },
                    {
                        'benefit_name': 'Monthly Newsletter',
                        'description': 'Receive monthly updates about new rewards and offers.',
                        'benefit_type': 'early_access',
                    },
                ]
            },
            # Silver tier benefits
            {
                'tier_name': 'silver',
                'benefits': [
                    {
                        'benefit_name': 'Enhanced Rewards Access',
                        'description': 'Access to premium reward vouchers with better discounts.',
                        'benefit_type': 'discount',
                    },
                    {
                        'benefit_name': 'Priority Support',
                        'description': 'Priority customer support with faster response times.',
                        'benefit_type': 'premium_support',
                    },
                    {
                        'benefit_name': '5% Bonus Points',
                        'description': 'Earn 5% bonus points on all transactions.',
                        'benefit_type': 'bonus_points',
                    },
                    {
                        'benefit_name': 'Exclusive Silver Offers',
                        'description': 'Access to exclusive offers available only to Silver tier members.',
                        'benefit_type': 'exclusive_offer',
                    },
                ]
            },
            # Gold tier benefits
            {
                'tier_name': 'gold',
                'benefits': [
                    {
                        'benefit_name': 'Premium Rewards Access',
                        'description': 'Access to luxury reward vouchers with maximum discounts.',
                        'benefit_type': 'discount',
                    },
                    {
                        'benefit_name': 'VIP Support',
                        'description': 'VIP customer support with dedicated account manager.',
                        'benefit_type': 'premium_support',
                    },
                    {
                        'benefit_name': '10% Bonus Points',
                        'description': 'Earn 10% bonus points on all transactions.',
                        'benefit_type': 'bonus_points',
                    },
                    {
                        'benefit_name': 'Early Access',
                        'description': 'Early access to new rewards and limited-time offers.',
                        'benefit_type': 'early_access',
                    },
                    {
                        'benefit_name': 'Exclusive Gold Events',
                        'description': 'Invitation to exclusive events and experiences.',
                        'benefit_type': 'exclusive_offer',
                    },
                ]
            },
            # Platinum tier benefits
            {
                'tier_name': 'platinum',
                'benefits': [
                    {
                        'benefit_name': 'Ultimate Rewards Access',
                        'description': 'Access to all reward vouchers including ultra-premium options.',
                        'benefit_type': 'discount',
                    },
                    {
                        'benefit_name': 'Concierge Support',
                        'description': '24/7 concierge support with personal assistant.',
                        'benefit_type': 'premium_support',
                    },
                    {
                        'benefit_name': '15% Bonus Points',
                        'description': 'Earn 15% bonus points on all transactions.',
                        'benefit_type': 'bonus_points',
                    },
                    {
                        'benefit_name': 'Exclusive Platinum Events',
                        'description': 'Access to ultra-exclusive events and luxury experiences.',
                        'benefit_type': 'exclusive_offer',
                    },
                    {
                        'benefit_name': 'Free Shipping',
                        'description': 'Free shipping on all physical rewards.',
                        'benefit_type': 'free_shipping',
                    },
                    {
                        'benefit_name': 'Custom Rewards',
                        'description': 'Ability to request custom rewards tailored to your preferences.',
                        'benefit_type': 'exclusive_offer',
                    },
                ]
            },
        ]

        created_benefits = 0
        for tier_benefits in benefits_data:
            try:
                tier = RewardTier.objects.get(tier_name=tier_benefits['tier_name'])
                for benefit_data in tier_benefits['benefits']:
                    benefit, created = TierBenefit.objects.get_or_create(
                        tier=tier,
                        benefit_name=benefit_data['benefit_name'],
                        defaults=benefit_data
                    )
                    if created:
                        created_benefits += 1
            except RewardTier.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"Tier {tier_benefits['tier_name']} not found, skipping benefits")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated tiered rewards system. '
                f'Created {created_tiers} tiers and {created_benefits} benefits.'
            )
        )
