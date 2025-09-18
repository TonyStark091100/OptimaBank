import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Star,
  TrendingUp,
  CardGiftcard as Gift,
  Support,
  Close,
  CheckCircle,
  Diamond,
  EmojiEvents,
} from '@mui/icons-material';
import { tierApi, TierProgressData, RewardTier, TierBenefit } from '../services/api';

interface TierProgressProps {
  onTierUpgrade?: (newTier: RewardTier) => void;
}

const TierProgress: React.FC<TierProgressProps> = ({ onTierUpgrade }) => {
  const [tierData, setTierData] = useState<TierProgressData | null>(null);
  const [allTiers, setAllTiers] = useState<RewardTier[]>([]);
  const [benefitsDialogOpen, setBenefitsDialogOpen] = useState(false);
  const [selectedTierBenefits, setSelectedTierBenefits] = useState<TierBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTierData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTierData = async () => {
    try {
      setLoading(true);
      const [tierInfo, tiers] = await Promise.all([
        tierApi.getUserTierInfo(),
        tierApi.getAllTiers(),
      ]);
      setTierData(tierInfo);
      setAllTiers(tiers);
      
      // Check if user was upgraded
      if (tierInfo.last_tier_upgrade && onTierUpgrade) {
        onTierUpgrade(tierInfo.current_tier);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimLoginBonus = async () => {
    try {
      const result = await tierApi.simulateLoginActivity();
      // Refresh tier data after claiming bonus
      await fetchTierData();
      
      // Show success message
      alert(result.message);
    } catch (err: any) {
      alert(`Failed to claim login bonus: ${err.message}`);
    }
  };

  const handleViewBenefits = async (tierId: number) => {
    try {
      const benefits = await tierApi.getTierBenefits(tierId);
      setSelectedTierBenefits(benefits);
      setBenefitsDialogOpen(true);
    } catch (err: any) {
      alert(`Failed to load benefits: ${err.message}`);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze':
        return '🥉';
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      default:
        return '⭐';
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      default:
        return '#A259FF';
    }
  };

  const getBenefitIcon = (benefitType: string) => {
    switch (benefitType) {
      case 'discount':
        return <Gift />;
      case 'premium_support':
        return <Support />;
      case 'bonus_points':
        return <TrendingUp />;
      case 'exclusive_offer':
        return <Star />;
      case 'early_access':
        return <EmojiEvents />;
      case 'free_shipping':
        return <Diamond />;
      default:
        return <CheckCircle />;
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3, background: 'rgba(34,34,50,0.98)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
            Loading tier information...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error || !tierData) {
    return (
      <Card sx={{ mb: 3, background: 'rgba(34,34,50,0.98)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
            {error || 'Failed to load tier information'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { current_tier, next_tier, progress_percentage, points_to_next_tier, total_points_earned } = tierData;

  return (
    <>
      <Card sx={{ 
        mb: 3, 
        background: 'rgba(34,34,50,0.98)', 
        border: '1px solid rgba(162, 89, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(162,89,255,0.25)',
      }}>
        <CardContent>
          {/* Current Tier Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ fontSize: '2.5rem' }}>
                {getTierIcon(current_tier.tier_name)}
              </Typography>
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                  {current_tier.tier_name.charAt(0).toUpperCase() + current_tier.tier_name.slice(1)} Tier
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {total_points_earned.toLocaleString()} total points earned
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              onClick={handleClaimLoginBonus}
              sx={{
                background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                }
              }}
            >
              Claim Daily Bonus
            </Button>
          </Box>

          {/* Progress Bar */}
          {next_tier && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Progress to {next_tier.tier_name.charAt(0).toUpperCase() + next_tier.tier_name.slice(1)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {Math.round(progress_percentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress_percentage}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${getTierColor(current_tier.tier_name)} 0%, ${getTierColor(next_tier.tier_name)} 100%)`,
                    borderRadius: 6,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1, display: 'block' }}>
                {points_to_next_tier.toLocaleString()} points to next tier
              </Typography>
            </Box>
          )}

          {/* Current Tier Benefits */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              Current Benefits
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {current_tier.benefits.map((benefit, index) => (
                <Chip
                  key={index}
                  label={benefit}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(162, 89, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(162, 89, 255, 0.3)',
                  }}
                />
              ))}
              {current_tier.exclusive_offers && (
                <Chip
                  label="Exclusive Offers"
                  size="small"
                  icon={<Star />}
                  sx={{
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    color: '#FFD700',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                  }}
                />
              )}
              {current_tier.premium_support && (
                <Chip
                  label="Premium Support"
                  size="small"
                  icon={<Support />}
                  sx={{
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    color: '#00FF00',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                  }}
                />
              )}
            </Box>
          </Box>

          {/* All Tiers Overview */}
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              All Tiers
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {allTiers.map((tier) => (
                <Card
                  key={tier.id}
                  sx={{
                    minWidth: 120,
                    background: tier.id === current_tier.id 
                      ? `linear-gradient(135deg, ${getTierColor(tier.tier_name)}20 0%, ${getTierColor(tier.tier_name)}10 100%)`
                      : 'rgba(20, 20, 30, 0.7)',
                    border: tier.id === current_tier.id 
                      ? `2px solid ${getTierColor(tier.tier_name)}`
                      : '1px solid rgba(162, 89, 255, 0.3)',
                    cursor: 'pointer',
                    '&:hover': {
                      border: `2px solid ${getTierColor(tier.tier_name)}`,
                    }
                  }}
                  onClick={() => handleViewBenefits(tier.id)}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {getTierIcon(tier.tier_name)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {tier.min_points.toLocaleString()} pts
                    </Typography>
                    {tier.id === current_tier.id && (
                      <Chip
                        label="Current"
                        size="small"
                        sx={{
                          mt: 1,
                          backgroundColor: getTierColor(tier.tier_name),
                          color: 'white',
                          fontSize: '0.7rem',
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Benefits Dialog */}
      <Dialog
        open={benefitsDialogOpen}
        onClose={() => setBenefitsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(34,34,50,0.98)',
            border: '1px solid rgba(162, 89, 255, 0.3)',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(162, 89, 255, 0.3)' }}>
          Tier Benefits
          <IconButton
            onClick={() => setBenefitsDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedTierBenefits.map((benefit) => (
              <ListItem key={benefit.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ color: '#A259FF' }}>
                  {getBenefitIcon(benefit.benefit_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {benefit.benefit_name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {benefit.description}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(162, 89, 255, 0.3)' }}>
          <Button
            onClick={() => setBenefitsDialogOpen(false)}
            sx={{ color: '#A259FF' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TierProgress;
