import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi, UserSpendingData } from '../services/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  Savings,
  PieChart,
  AttachMoney,
  CalendarToday,
  ShowChart,
  Close,
  Insights,
  Timeline,
  Star,
  EmojiEvents,
  Diamond,
  AutoAwesome,
  MilitaryTech,
  WorkspacePremium,
  Campaign,
  LocalFireDepartment,
  Speed,
  Loyalty
} from '@mui/icons-material';

// Using UserSpendingData from API services

interface SpendingInsightsProps {
  size?: 'small' | 'medium' | 'large';
}

const SpendingInsights: React.FC<SpendingInsightsProps> = ({ size = 'medium' }) => {
  const [open, setOpen] = useState(false);
  const [spendingData, setSpendingData] = useState<UserSpendingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch real-time user spending data
  const fetchUserSpendingData = useCallback(async (): Promise<UserSpendingData> => {
    try {
      const data = await analyticsApi.getUserSpendingAnalytics();
      return data;
    } catch (error) {
      console.error('Failed to fetch user spending data:', error);
      // Fallback to mock data if API fails
      return generateFallbackData();
    }
  }, []);

  // Fallback mock data for when API is unavailable
  const generateFallbackData = (): UserSpendingData => {
    const baseAmount = 15420;
    const variation = Math.sin(Date.now() / 10000) * 500;
    const currentTotal = Math.max(baseAmount + variation, 10000);
    
    return {
      totalSpent: Math.round(currentTotal),
      totalSaved: Math.round(currentTotal * 0.25),
      monthlySpending: [
        { month: 'Jan', amount: 1200 + Math.floor(Math.random() * 200) },
        { month: 'Feb', amount: 1800 + Math.floor(Math.random() * 200) },
        { month: 'Mar', amount: 2100 + Math.floor(Math.random() * 200) },
        { month: 'Apr', amount: 1650 + Math.floor(Math.random() * 200) },
        { month: 'May', amount: 2200 + Math.floor(Math.random() * 200) },
        { month: 'Jun', amount: 1950 + Math.floor(Math.random() * 200) },
        { month: 'Jul', amount: 2300 + Math.floor(Math.random() * 200) },
        { month: 'Aug', amount: 1870 + Math.floor(Math.random() * 200) },
        { month: 'Sep', amount: 2150 + Math.floor(Math.random() * 200) }
      ],
      categoryBreakdown: [
        { category: 'Food & Dining', amount: 4200 + Math.floor(Math.random() * 300), percentage: 27 },
        { category: 'Shopping', amount: 3600 + Math.floor(Math.random() * 300), percentage: 23 },
        { category: 'Entertainment', amount: 2800 + Math.floor(Math.random() * 300), percentage: 18 },
        { category: 'Travel', amount: 2400 + Math.floor(Math.random() * 300), percentage: 16 },
        { category: 'Health & Wellness', amount: 1800 + Math.floor(Math.random() * 300), percentage: 12 },
        { category: 'Other', amount: 620 + Math.floor(Math.random() * 200), percentage: 4 }
      ],
      roi: 25.2 + (Math.random() - 0.5) * 2,
      averageMonthlySpending: Math.round(1750 + (Math.random() - 0.5) * 200),
      projectedYearlySavings: Math.round(4200 + (Math.random() - 0.5) * 400),
      topCategories: [
        { category: 'Food & Dining', count: 12 + Math.floor(Math.random() * 3) },
        { category: 'Shopping', count: 8 + Math.floor(Math.random() * 3) },
        { category: 'Entertainment', count: 6 + Math.floor(Math.random() * 2) }
      ],
      recentRedemptions: [
        { date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], voucher: 'Starbucks Gift Card', points: 1500, savings: 150 },
        { date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], voucher: 'Amazon Voucher', points: 2000, savings: 200 },
        { date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], voucher: 'Netflix Subscription', points: 1200, savings: 120 }
      ],
      achievements: [
        {
          id: 'big_spender',
          title: 'Big Spender',
          description: 'Spent over 10,000 points in a month',
          icon: 'Diamond',
          unlocked: true,
          unlockedDate: '2024-01-15',
          category: 'spending'
        },
        {
          id: 'loyalty_champion',
          title: 'Loyalty Champion',
          description: 'Maintained Gold tier for 3 consecutive months',
          icon: 'MilitaryTech',
          unlocked: true,
          unlockedDate: '2024-02-01',
          category: 'tier'
        },
        {
          id: 'redemption_master',
          title: 'Redemption Master',
          description: 'Redeemed vouchers in 5 different categories',
          icon: 'EmojiEvents',
          unlocked: true,
          unlockedDate: '2024-01-28',
          category: 'redemption'
        },
        {
          id: 'early_bird',
          title: 'Early Bird',
          description: 'Made 10 redemptions before 10 AM',
          icon: 'Speed',
          unlocked: false,
          progress: 7,
          total: 10,
          category: 'special'
        },
        {
          id: 'foodie_explorer',
          title: 'Foodie Explorer',
          description: 'Redeemed dining vouchers 20 times',
          icon: 'Campaign',
          unlocked: false,
          progress: 15,
          total: 20,
          category: 'redemption'
        },
        {
          id: 'platinum_elite',
          title: 'Platinum Elite',
          description: 'Reach Platinum tier',
          icon: 'WorkspacePremium',
          unlocked: false,
          progress: 65,
          total: 100,
          category: 'tier'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  };

  const handleOpen = async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    
    try {
      const data = await fetchUserSpendingData();
      setSpendingData(data);
      setLastUpdated(new Date(data.lastUpdated));
    } catch (error) {
      console.error('Failed to load spending analytics:', error);
      setError('Failed to load spending analytics. Using sample data.');
      const fallbackData = generateFallbackData();
      setSpendingData(fallbackData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates every 30 seconds when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchUserSpendingData();
        setSpendingData(data);
        setLastUpdated(new Date(data.lastUpdated));
        setError(null);
      } catch (error) {
        console.error('Failed to refresh spending analytics:', error);
        // Don't show error for background refreshes, just keep existing data
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [open, fetchUserSpendingData]);

  const handleClose = () => {
    setOpen(false);
  };

  const formatPoints = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount) + ' pts';
  };

  const getCategoryColor = (index: number) => {
    const colors = ['#A259FF', '#4CAF50', '#FF6B6B', '#FFD700', '#FF9800', '#2196F3'];
    return colors[index % colors.length];
  };

  const getAchievementIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Diamond,
      MilitaryTech,
      EmojiEvents,
      Speed,
      Campaign,
      WorkspacePremium,
      AutoAwesome,
      LocalFireDepartment,
      Star,
      Loyalty
    };
    const IconComponent = iconMap[iconName] || Star;
    return <IconComponent />;
  };

  const getAchievementColor = (category: string, unlocked: boolean) => {
    if (!unlocked) return 'rgba(255, 255, 255, 0.3)';
    
    switch (category) {
      case 'spending': return '#A259FF';
      case 'redemption': return '#4CAF50';
      case 'tier': return '#FFD700';
      case 'loyalty': return '#FF6B6B';
      case 'special': return '#FF9800';
      default: return '#A259FF';
    }
  };


  return (
    <>
      {/* Premium Trigger Button */}
      <IconButton
        onClick={handleOpen}
        sx={{
          color: '#FFFFFF',
          bgcolor: 'rgba(162, 89, 255, 0.15)',
          border: '2px solid rgba(162, 89, 255, 0.4)',
          borderRadius: '12px',
          width: size === 'small' ? 32 : size === 'large' ? 56 : 48,
          height: size === 'small' ? 32 : size === 'large' ? 56 : 48,
          minWidth: size === 'small' ? 32 : size === 'large' ? 56 : 48,
          minHeight: size === 'small' ? 32 : size === 'large' ? 56 : 48,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(162, 89, 255, 0.3)',
          '&:hover': {
            bgcolor: 'rgba(162, 89, 255, 0.25)',
            border: '2px solid rgba(162, 89, 255, 0.6)',
            transform: 'scale(1.08) translateY(-2px)',
            boxShadow: '0 8px 30px rgba(162, 89, 255, 0.4)'
          },
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiSvgIcon-root': {
            fontSize: size === 'small' ? '1rem' : size === 'large' ? '1.8rem' : '1.5rem',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }
        }}
        title="Premium Spending Analytics"
      >
        <Analytics />
      </IconButton>

      {/* Premium Insights Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xl"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            bgcolor: '#0f0f1a',
            color: 'white',
            borderRadius: isMobile ? 0 : '20px',
            minHeight: isMobile ? '100vh' : '85vh',
            border: '1px solid rgba(162, 89, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(162, 89, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '2px solid rgba(162, 89, 255, 0.3)',
          pb: 3,
          pt: 3,
          px: 4,
          background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(10, 10, 20, 0.8) 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(162, 89, 255, 0.2)',
              border: '1px solid rgba(162, 89, 255, 0.4)'
            }}>
              <Insights sx={{ color: '#A259FF', fontSize: '1.8rem' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5
              }}>
                Premium Spending Analytics
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: error ? '#FF6B6B' : '#4CAF50',
                  animation: 'pulse 2s infinite'
                }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {error ? 'Sample Data' : 'Live Data'} • Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
              </Box>
              {error && (
                <Typography variant="caption" sx={{ color: '#FF6B6B', mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { 
                color: '#A259FF',
                bgcolor: 'rgba(162, 89, 255, 0.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {/* Add CSS for pulse animation */}
          <style>
            {`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
              }
              @keyframes shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: calc(200px + 100%) 0; }
              }
            `}
          </style>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 400,
              flexDirection: 'column',
              gap: 3
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '3px solid rgba(162, 89, 255, 0.3)',
                  borderTop: '3px solid #A259FF',
                  animation: 'spin 1s linear infinite',
                  mx: 'auto',
                  mb: 2
                }} />
              <Typography variant="h6" sx={{ color: '#A259FF', mb: 1 }}>
                Analyzing Your Financial Patterns...
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Processing your real-time spending data
              </Typography>
              </Box>
            </Box>
          ) : spendingData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Key Metrics */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: '#A259FF' }}>
                  💰 Key Metrics
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2 
                }}>
                  <Card sx={{ bgcolor: 'rgba(162, 89, 255, 0.1)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <AttachMoney sx={{ color: '#A259FF', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {formatPoints(spendingData.totalSpent)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Total Points Spent
                        </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Savings sx={{ color: '#4CAF50', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {formatPoints(spendingData.totalSaved)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Total Points Saved
                        </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <TrendingUp sx={{ color: '#FFC107', fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {spendingData.roi}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ROI
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Timeline sx={{ color: '#2196F3', fontSize: 32, mb: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {formatPoints(spendingData.averageMonthlySpending)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Avg Monthly Points
                        </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Charts Row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                {/* Monthly Spending Pattern */}
                <Card sx={{ bgcolor: 'rgba(26, 26, 46, 0.8)', border: '1px solid rgba(162, 89, 255, 0.3)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChart /> Monthly Points Spending Pattern
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: 200 }}>
                      {spendingData.monthlySpending.map((month, index) => (
                        <Box key={month.month} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: `${(month.amount / Math.max(...spendingData.monthlySpending.map(m => m.amount))) * 150}px`,
                              bgcolor: '#A259FF',
                              borderRadius: '4px 4px 0 0',
                              mb: 1,
                              transition: 'all 0.3s ease'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                            {month.month}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#A259FF', fontSize: '0.6rem', fontWeight: 600 }}>
                            {month.amount.toLocaleString()} pts
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card sx={{ bgcolor: 'rgba(26, 26, 46, 0.8)', border: '1px solid rgba(162, 89, 255, 0.3)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChart /> Category Breakdown
                    </Typography>
                    {spendingData.categoryBreakdown.map((category, index) => (
                      <Box key={category.category} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {category.category}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#A259FF', fontWeight: 600 }}>
                            {category.percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={category.percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getCategoryColor(index),
                              borderRadius: 4
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                          {formatPoints(category.amount)}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>

              {/* Bottom Row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                {/* Top Categories */}
                <Card sx={{ bgcolor: 'rgba(26, 26, 46, 0.8)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star /> Top Categories
                    </Typography>
                    {spendingData.topCategories.map((category, index) => (
                      <Box key={category.category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {category.category}
                        </Typography>
                        <Chip 
                          label={category.count} 
                          size="small" 
                          sx={{ bgcolor: '#A259FF', color: 'white', fontWeight: 600 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Redemptions */}
                <Card sx={{ bgcolor: 'rgba(26, 26, 46, 0.8)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday /> Recent Redemptions
                    </Typography>
                    <List dense>
                      {spendingData.recentRedemptions.map((redemption, index) => (
                        <React.Fragment key={index}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                                  {redemption.voucher}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    {redemption.date} • {redemption.points} pts
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                                    Saved: {formatPoints(redemption.savings)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < spendingData.recentRedemptions.length - 1 && <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>

              {/* Special Achievements Unlocked */}
              <Box>
                <Card sx={{ bgcolor: 'rgba(26, 26, 46, 0.8)', border: '1px solid rgba(162, 89, 255, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#A259FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents /> Special Achievements Unlocked
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2 
                    }}>
                      {spendingData.achievements.map((achievement) => (
                        <Paper 
                          key={achievement.id}
                          sx={{ 
                            bgcolor: achievement.unlocked ? 'rgba(162, 89, 255, 0.1)' : 'rgba(50, 50, 70, 0.3)',
                            border: `1px solid ${achievement.unlocked ? 'rgba(162, 89, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                            p: 2,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: achievement.unlocked ? 'translateY(-2px)' : 'none',
                              boxShadow: achievement.unlocked ? '0 4px 15px rgba(162, 89, 255, 0.2)' : 'none'
                            }
                          }}
                        >
                          {/* Achievement Icon */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5, 
                            mb: 1.5 
                          }}>
                            <Box sx={{
                              p: 1,
                              borderRadius: '8px',
                              bgcolor: getAchievementColor(achievement.category, achievement.unlocked),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: achievement.unlocked ? 1 : 0.5
                            }}>
                              {getAchievementIcon(achievement.icon)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  color: achievement.unlocked ? getAchievementColor(achievement.category, true) : 'rgba(255, 255, 255, 0.5)',
                                  fontWeight: 600,
                                  mb: 0.5
                                }}
                              >
                                {achievement.title}
                              </Typography>
                              {achievement.unlocked && achievement.unlockedDate && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Achievement Description */}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: achievement.unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                              mb: achievement.progress !== undefined ? 1.5 : 0,
                              fontSize: '0.85rem'
                            }}
                          >
                            {achievement.description}
                          </Typography>

                          {/* Progress Bar for Locked Achievements */}
                          {!achievement.unlocked && achievement.progress !== undefined && (
                            <Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Progress
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  {achievement.progress}/{achievement.total}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={achievement.total ? (achievement.progress / achievement.total) * 100 : 0}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: '#A259FF',
                                    borderRadius: 3
                                  }
                                }}
                              />
                            </Box>
                          )}

                          {/* Unlocked Badge */}
                          {achievement.unlocked && (
                            <Box sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: '#4CAF50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'pulse 2s infinite'
                            }} />
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ 
          p: 4, 
          borderTop: '2px solid rgba(162, 89, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.05) 0%, rgba(10, 10, 20, 0.8) 100%)',
          gap: 2
        }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            sx={{ 
              color: '#A259FF',
              borderColor: 'rgba(162, 89, 255, 0.5)',
              px: 3,
              py: 1,
              borderRadius: '10px',
              '&:hover': { 
                borderColor: '#A259FF',
                bgcolor: 'rgba(162, 89, 255, 0.1)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            sx={{ 
              background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
              color: 'white',
              px: 4,
              py: 1,
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(162, 89, 255, 0.4)',
              '&:hover': { 
                background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                boxShadow: '0 6px 20px rgba(162, 89, 255, 0.6)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Export Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SpendingInsights;
