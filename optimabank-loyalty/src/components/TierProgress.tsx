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
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
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
      setSelectedTierId(tierId);
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
        mb: 2, 
        background: 'rgba(34,34,50,0.98)', 
        border: '1px solid rgba(162, 89, 255, 0.3)',
        boxShadow: '0 4px 16px 0 rgba(162,89,255,0.15)',
      }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Professional Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" sx={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px rgba(162, 89, 255, 0.5))' }}>
                {getTierIcon(current_tier.tier_name)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: '1.25rem', 
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {current_tier.tier_name.charAt(0).toUpperCase() + current_tier.tier_name.slice(1)} Tier
                </Typography>
                <IconButton
                  onClick={() => handleViewBenefits(current_tier.id)}
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: 'rgba(162, 89, 255, 0.2)',
                    border: '1px solid rgba(162, 89, 255, 0.5)',
                    color: '#A259FF',
                    '&:hover': {
                      backgroundColor: 'rgba(162, 89, 255, 0.3)',
                      border: '1px solid #A259FF',
                      transform: 'scale(1.1)',
                      boxShadow: '0 2px 8px rgba(162, 89, 255, 0.4)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 1px 4px rgba(162, 89, 255, 0.2)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    !
                  </Typography>
                </IconButton>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              size="medium"
              onClick={handleClaimLoginBonus}
              sx={{
                background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                borderRadius: 2,
                fontWeight: 700,
                fontSize: '0.9rem',
                px: 3,
                py: 1,
                minWidth: 'auto',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(162, 89, 255, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                  boxShadow: '0 6px 16px rgba(162, 89, 255, 0.6)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Daily Bonus
            </Button>
          </Box>

          {/* Professional Progress Bar */}
          {next_tier && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}>
                  Progress to {next_tier.tier_name.charAt(0).toUpperCase() + next_tier.tier_name.slice(1)}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: getTierColor(next_tier.tier_name), 
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}>
                  {Math.round(progress_percentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress_percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${getTierColor(current_tier.tier_name)} 0%, ${getTierColor(next_tier.tier_name)} 100%)`,
                    borderRadius: 4,
                    boxShadow: '0 2px 4px rgba(162, 89, 255, 0.3)',
                  },
                }}
              />
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mt: 0.8, 
                display: 'block', 
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                {points_to_next_tier.toLocaleString()} points to next tier
              </Typography>
            </Box>
          )}


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
            background: 'linear-gradient(135deg, rgba(34,34,50,0.98) 0%, rgba(20,20,30,0.98) 100%)',
            border: '1px solid rgba(162, 89, 255, 0.4)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(162,89,255,0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          borderBottom: '1px solid rgba(162, 89, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(162, 89, 255, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2
        }}>
          <Typography variant="h4" sx={{ fontSize: '2rem', mr: 1 }}>
            {selectedTierId ? getTierIcon(allTiers.find(t => t.id === selectedTierId)?.tier_name || current_tier.tier_name) : getTierIcon(current_tier.tier_name)}
          </Typography>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              {(() => {
                if (selectedTierId) {
                  const selectedTier = allTiers.find(t => t.id === selectedTierId);
                  const tierName = selectedTier?.tier_name || current_tier.tier_name;
                  return tierName.charAt(0).toUpperCase() + tierName.slice(1);
                }
                return current_tier.tier_name.charAt(0).toUpperCase() + current_tier.tier_name.slice(1);
              })()} Tier Benefits
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Click on any tier below to view their benefits
            </Typography>
          </Box>
          <IconButton
            onClick={() => {
              setBenefitsDialogOpen(false);
              setSelectedTierId(null);
            }}
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16, 
              color: 'white',
              backgroundColor: 'rgba(162, 89, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(162, 89, 255, 0.3)',
              }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Tier Selector */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
            {allTiers.map((tier) => (
              <Box
                key={tier.id}
                onClick={() => handleViewBenefits(tier.id)}
                sx={{
                  minWidth: 60,
                  height: 50,
                  background: tier.id === (selectedTierId || current_tier.id)
                    ? `linear-gradient(135deg, ${getTierColor(tier.tier_name)}30 0%, ${getTierColor(tier.tier_name)}15 100%)`
                    : 'rgba(20, 20, 30, 0.7)',
                  border: tier.id === (selectedTierId || current_tier.id)
                    ? `2px solid ${getTierColor(tier.tier_name)}`
                    : '1px solid rgba(162, 89, 255, 0.3)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: `2px solid ${getTierColor(tier.tier_name)}`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 20px ${getTierColor(tier.tier_name)}30`,
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.2 }}>
                  {getTierIcon(tier.tier_name)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: 'white', 
                  fontWeight: 600, 
                  fontSize: '0.7rem', 
                  lineHeight: 1,
                  textAlign: 'center'
                }}>
                  {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)}
                </Typography>
              </Box>
            ))}
          </Box>

          <List>
            {selectedTierBenefits.map((benefit) => (
              <ListItem key={benefit.id} sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon sx={{ color: '#A259FF', minWidth: 40 }}>
                  {getBenefitIcon(benefit.benefit_type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
                      {benefit.benefit_name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}>
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
            onClick={() => {
              setBenefitsDialogOpen(false);
              setSelectedTierId(null);
            }}
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
