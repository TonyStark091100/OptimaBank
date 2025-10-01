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
  useTheme,
  useMediaQuery,
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
  Lightbulb,
  Schedule,
  // Target,
  AutoAwesome,
  Warning,
  Rocket,
  Timeline
} from '@mui/icons-material';
import { tierApi, TierProgressData, RewardTier, TierBenefit } from '../services/api';

interface TierProgressProps {
  onTierUpgrade?: (newTier: RewardTier) => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const TierProgress: React.FC<TierProgressProps> = ({ onTierUpgrade, onShowSnackbar }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [tierData, setTierData] = useState<TierProgressData | null>(null);
  const [allTiers, setAllTiers] = useState<RewardTier[]>([]);
  const [benefitsDialogOpen, setBenefitsDialogOpen] = useState(false);
  const [selectedTierBenefits, setSelectedTierBenefits] = useState<TierBenefit[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [showPredictions, setShowPredictions] = useState(false);

  useEffect(() => {
    // Clear any existing Bronze tier upgrade notifications on component mount
    const bronzeUpgradeKey = 'tier_upgrade_seen_1'; // Assuming Bronze tier ID is 1
    if (sessionStorage.getItem(bronzeUpgradeKey)) {
      sessionStorage.removeItem(bronzeUpgradeKey);
      console.log('Cleared existing Bronze tier upgrade notification');
    }
    
    fetchTierData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTierData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in to view tier information');
        return;
      }
      
      const [tierInfo, tiers] = await Promise.all([
        tierApi.getUserTierInfo(),
        tierApi.getAllTiers(),
      ]);
      setTierData(tierInfo);
      setAllTiers(tiers);
      
      // Check if user was upgraded (only show notification once per session)
      if (tierInfo.last_tier_upgrade && onTierUpgrade) {
        const currentTierName = tierInfo.current_tier.tier_name.toLowerCase();
        
        // Skip Bronze tier notifications since users start at Bronze
        if (currentTierName === 'bronze') {
          console.log('Skipping Bronze tier upgrade notification - user already at Bronze');
          return;
        }
        
        const lastUpgradeKey = `tier_upgrade_seen_${tierInfo.current_tier.id}`;
        const hasSeenUpgrade = sessionStorage.getItem(lastUpgradeKey);
        
        // Check if this is a recent upgrade (within last 24 hours) that hasn't been seen
        const isRecentUpgrade = tierInfo.last_tier_upgrade && 
          new Date(tierInfo.last_tier_upgrade) > new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (!hasSeenUpgrade && isRecentUpgrade) {
          // Mark as seen and show the upgrade notification
          sessionStorage.setItem(lastUpgradeKey, 'true');
          console.log(`Showing tier upgrade notification for ${currentTierName} tier`);
          onTierUpgrade(tierInfo.current_tier);
        } else {
          console.log('Skipping tier upgrade notification:', {
            hasSeenUpgrade: !!hasSeenUpgrade,
            isRecentUpgrade,
            currentTier: currentTierName,
            lastUpgrade: tierInfo.last_tier_upgrade
          });
        }
      }
    } catch (err: any) {
      console.error('Tier data fetch error:', err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Please log in to view tier information');
      } else if (err.message.includes('404')) {
        setError('Tier system not available. Please try again later.');
      } else {
        setError(err.message || 'Failed to load tier information');
      }
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
      onShowSnackbar(result.message, 'success');
    } catch (err: any) {
      onShowSnackbar(`Failed to claim login bonus: ${err.message}`, 'error');
    }
  };

  const handleViewBenefits = async (tierId: number) => {
    try {
      const benefits = await tierApi.getTierBenefits(tierId);
      setSelectedTierBenefits(benefits);
      setSelectedTierId(tierId);
      setBenefitsDialogOpen(true);
    } catch (err: any) {
      onShowSnackbar(`Failed to load benefits: ${err.message}`, 'error');
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

  // Predictive Analysis Functions
  const calculatePredictions = () => {
    console.log('Calculating predictions with:', { tierData, allTiers });
    
    if (!tierData || !allTiers.length) {
      console.log('Missing data:', { tierData: !!tierData, allTiersLength: allTiers.length });
      return null;
    }

    const currentTier = tierData.current_tier;
    const currentPoints = (tierData as any).current_points || 0;
    const nextTier = allTiers.find(tier => (tier as any).points_required > currentPoints);
    
    console.log('Tier analysis:', { currentTier, currentPoints, nextTier });
    
    if (!nextTier) {
      console.log('No next tier found');
      return null;
    }

    const pointsNeeded = (nextTier as any).points_required - currentPoints;
    
    // Calculate daily point earning rate (mock data - in real app, analyze user history)
    const dailyEarningRate = 150; // Average points per day
    const daysToNextTier = Math.ceil(pointsNeeded / dailyEarningRate);
    
    // Calculate risk of losing current tier (if applicable)
    const tierMaintenanceThreshold = (currentTier as any).points_required * 0.8; // 80% of tier requirement
    const isAtRisk = currentPoints < tierMaintenanceThreshold;
    const pointsToMaintain = Math.max(0, tierMaintenanceThreshold - currentPoints);
    
    // Generate recommendations
    const recommendations = generateRecommendations(pointsNeeded, daysToNextTier, isAtRisk, pointsToMaintain);
    
    const result = {
      nextTier,
      pointsNeeded,
      daysToNextTier,
      isAtRisk,
      pointsToMaintain,
      recommendations,
      currentTier
    };
    
    console.log('Generated predictions:', result);
    return result;
  };

  const generateRecommendations = (pointsNeeded: number, daysToNextTier: number, isAtRisk: boolean, pointsToMaintain: number) => {
    const recommendations = [];

    // Quick win recommendations
    if (pointsNeeded <= 500) {
      recommendations.push({
        type: 'quick_win',
        title: 'Almost There!',
        description: `You're just ${pointsNeeded} points away from the next tier!`,
        action: 'Complete daily login to earn 100 points',
        points: 100,
        icon: <Rocket sx={{ color: '#4CAF50' }} />,
        priority: 'high'
      });
    }

    // Daily activity recommendations
    recommendations.push({
      type: 'daily_activity',
      title: 'Daily Login Streak',
      description: `Maintain your daily login streak to earn 100 points per day`,
      action: 'Login daily for consistent point earning',
      points: 100,
      icon: <Schedule sx={{ color: '#2196F3' }} />,
      priority: 'medium'
    });

    // Tier maintenance warning
    if (isAtRisk) {
      recommendations.push({
        type: 'maintenance_warning',
        title: 'Tier Maintenance Alert',
        description: `You need ${pointsToMaintain} more points to maintain your current tier`,
        action: 'Complete activities to secure your tier status',
        points: pointsToMaintain,
        icon: <Warning sx={{ color: '#FF5722' }} />,
        priority: 'high'
      });
    }

    // Time-based predictions
    if (daysToNextTier <= 30) {
      recommendations.push({
        type: 'time_prediction',
        title: 'Tier Upgrade Timeline',
        description: `At your current pace, you'll reach the next tier in ${daysToNextTier} days`,
        action: 'Stay consistent with your current activities',
        points: 0,
        icon: <Timeline sx={{ color: '#9C27B0' }} />,
        priority: 'low'
      });
    }

    // Gamification suggestions
    recommendations.push({
      type: 'gamification',
      title: 'Boost Your Progress',
      description: 'Try mini-games to earn bonus points and accelerate your tier journey',
      action: 'Play mini-games for extra points',
      points: 50,
      icon: <AutoAwesome sx={{ color: '#FF9800' }} />,
      priority: 'medium'
    });

    return recommendations;
  };

  const handleShowPredictions = () => {
    const predictionData = calculatePredictions();
    console.log('Prediction data:', predictionData);
    setPredictions(predictionData);
    setShowPredictions(true);
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
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Warning sx={{ color: '#ff6b6b', fontSize: 48, mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            {error || 'Failed to load tier information'}
          </Typography>
          <Button
            variant="contained"
            onClick={fetchTierData}
            sx={{
              background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(162, 89, 255, 0.4)'
              }
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { current_tier, next_tier, progress_percentage, points_to_next_tier } = tierData;

  return (
    <>
      <Card sx={{ 
        mb: 2, 
        background: 'rgba(34,34,50,0.98)', 
        border: '1px solid rgba(162, 89, 255, 0.3)',
        boxShadow: '0 4px 16px 0 rgba(162,89,255,0.15)',
      }}>
        <CardContent sx={{ 
          p: isMobile ? 2 : 2.5,
          ...(isMobile && {
            paddingX: 2,
            paddingY: 2
          })
        }}>
          {/* Professional Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isSmallMobile ? 'center' : 'space-between', 
            mb: 2,
            flexDirection: isSmallMobile ? 'column' : 'row',
            gap: isSmallMobile ? 2 : 0
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 1 : 1.5,
              justifyContent: isMobile ? 'center' : 'flex-start',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Typography variant="h4" sx={{ 
                fontSize: isSmallMobile ? '1.6rem' : isMobile ? '1.8rem' : '2rem', 
                filter: 'drop-shadow(0 0 8px rgba(162, 89, 255, 0.5))' 
              }}>
                {getTierIcon(current_tier.tier_name)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: isSmallMobile ? '1rem' : isMobile ? '1.1rem' : '1.25rem', 
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {current_tier.tier_name.charAt(0).toUpperCase() + current_tier.tier_name.slice(1)} Tier
                </Typography>
                <IconButton
                  onClick={() => handleViewBenefits(current_tier.id)}
                  sx={{
                    width: isMobile ? 8 : 24,
                    height: isMobile ? 8 : 24,
                    backgroundColor: 'rgba(162, 89, 255, 0.2)',
                    border: '1px solid rgba(162, 89, 255, 0.5)',
                    color: '#A259FF',
                    minWidth: isMobile ? 8 : 24,
                    minHeight: isMobile ? 8 : 24,
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
                  <Typography variant="body2" sx={{ 
                    fontSize: isMobile ? '0.4rem' : '0.8rem', 
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    !
                  </Typography>
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: isMobile ? 1 : 1.5,
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Button
                variant="contained"
                size={isMobile ? "small" : "medium"}
                onClick={handleClaimLoginBonus}
                startIcon={<Star />}
                sx={{
                  background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  px: isMobile ? 2 : 3,
                  py: isMobile ? 0.8 : 1,
                  minWidth: 'auto',
                  textTransform: 'none',
                  width: isMobile ? '100%' : 'auto',
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
              
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                onClick={handleShowPredictions}
                startIcon={<Lightbulb />}
                sx={{
                  borderColor: '#A259FF',
                  color: '#A259FF',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  px: isMobile ? 2 : 3,
                  py: isMobile ? 0.8 : 1,
                  textTransform: 'none',
                  width: isMobile ? '100%' : 'auto',
                  '&:hover': {
                    borderColor: '#8a3ffb',
                    background: 'rgba(162, 89, 255, 0.1)',
                    color: '#8a3ffb',
                  },
                }}
              >
                Smart Tips
              </Button>
            </Box>
          </Box>

          {/* Professional Progress Bar */}
          {next_tier && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: isMobile ? 'center' : 'space-between', 
                mb: 1,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 0.5 : 0,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: 600
                }}>
                  Progress to {next_tier.tier_name.charAt(0).toUpperCase() + next_tier.tier_name.slice(1)}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: getTierColor(next_tier.tier_name), 
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontWeight: 700
                }}>
                  {Math.round(progress_percentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress_percentage}
                sx={{
                  height: isMobile ? 6 : 8,
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
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: 500,
                textAlign: isMobile ? 'center' : 'left'
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
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(34,34,50,0.98) 0%, rgba(20,20,30,0.98) 100%)',
            border: '1px solid rgba(162, 89, 255, 0.4)',
            color: 'white',
            borderRadius: isMobile ? 0 : 3,
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

      {/* Predictive Recommendations Dialog */}
      <Dialog
        open={showPredictions}
        onClose={() => setShowPredictions(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)',
            color: 'white',
            borderRadius: isMobile ? 0 : 3
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ color: '#A259FF', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Smart Tier Recommendations
            </Typography>
          </Box>
          <IconButton onClick={() => setShowPredictions(false)} sx={{ color: '#ccc' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {predictions ? (
            <Box>
              {/* Tier Progress Summary */}
              <Box sx={{ 
                p: 3, 
                mb: 3, 
                bgcolor: 'rgba(162, 89, 255, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(162, 89, 255, 0.3)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#A259FF' }}>
                  Your Tier Journey
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      Current: {predictions.currentTier.tier_name.charAt(0).toUpperCase() + predictions.currentTier.tier_name.slice(1)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc' }}>
                      Next: {predictions.nextTier.tier_name.charAt(0).toUpperCase() + predictions.nextTier.tier_name.slice(1)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ color: '#A259FF', fontWeight: 'bold' }}>
                      {predictions.pointsNeeded}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      points needed
                    </Typography>
                  </Box>
                </Box>
                {predictions.daysToNextTier <= 30 && (
                  <Typography variant="body2" sx={{ color: '#4CAF50' }}>
                    🎯 Estimated time to next tier: {predictions.daysToNextTier} days
                  </Typography>
                )}
              </Box>

              {/* Recommendations */}
              <Typography variant="h6" sx={{ mb: 2, color: '#A259FF' }}>
                Personalized Recommendations
              </Typography>
              <List>
                {predictions.recommendations.map((rec: any, index: number) => (
                  <ListItem key={index} sx={{ 
                    px: 0, 
                    mb: 2,
                    bgcolor: rec.priority === 'high' ? 'rgba(255, 87, 34, 0.1)' : 'rgba(162, 89, 255, 0.05)',
                    borderRadius: 2,
                    border: rec.priority === 'high' ? '1px solid rgba(255, 87, 34, 0.3)' : '1px solid rgba(162, 89, 255, 0.2)'
                  }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {rec.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            {rec.title}
                          </Typography>
                          {rec.points > 0 && (
                            <Chip
                              label={`+${rec.points} pts`}
                              size="small"
                              sx={{
                                bgcolor: rec.priority === 'high' ? '#FF5722' : '#A259FF',
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                            {rec.description}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: '#A259FF', 
                            fontWeight: 500,
                            fontStyle: 'italic'
                          }}>
                            💡 {rec.action}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#ccc', mb: 2 }}>
                No recommendations available
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                We need more data to generate personalized recommendations for you.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setShowPredictions(false)}
            sx={{
              background: '#A259FF',
              color: 'white',
              '&:hover': { background: '#8B4FE6' }
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TierProgress;
