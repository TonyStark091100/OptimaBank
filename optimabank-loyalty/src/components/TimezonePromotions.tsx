import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  LocalOffer as PromotionIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useTimezone } from '../contexts/TimezoneContext';
import { promotionsApi, ActivePromotion } from '../services/api';

interface TimezonePromotionsProps {
  variant?: 'compact' | 'expanded';
}

const TimezonePromotions: React.FC<TimezonePromotionsProps> = ({ variant = 'compact' }) => {
  const { 
    timezoneInfo, 
    getCurrentPromotions, 
    isBusinessHours,
    getNextPromotion,
    getTimeUntilNextPromotion
  } = useTimezone();
  const [backendPromotion, setBackendPromotion] = React.useState<ActivePromotion | null>(null);
  const [endsIn, setEndsIn] = React.useState<number | null>(null);

  // Poll backend active promotion every 30s
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const promo = await promotionsApi.getActive();
        if (mounted) {
          setBackendPromotion(promo);
          setEndsIn(promo?.active ? (promo.ends_in_seconds ?? null) : null);
        }
      } catch (e) {
        // ignore fetch errors and keep UI graceful
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Local countdown tick per second when active
  React.useEffect(() => {
    if (!backendPromotion?.active || endsIn == null) return;
    const tick = setInterval(() => setEndsIn((s) => (s == null || s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(tick);
  }, [backendPromotion?.active, endsIn]);
  
  const [expanded, setExpanded] = React.useState(false);
  const currentPromotions = getCurrentPromotions();
  const nextPromotion = getNextPromotion();
  const timeUntilNext = getTimeUntilNextPromotion();
  const businessHoursActive = isBusinessHours();

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const getPromotionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dining':
      case 'restaurant':
        return '🍽️';
      case 'shopping':
      case 'retail':
        return '🛍️';
      case 'coffee':
      case 'beverage':
        return '☕';
      case 'lunch':
        return '🥗';
      default:
        return '🎯';
    }
  };

  const getPromotionColor = (discount: number) => {
    if (discount >= 50) return '#FF6B6B';
    if (discount >= 30) return '#FFA726';
    if (discount >= 20) return '#66BB6A';
    return '#A259FF';
  };

  if (variant === 'compact') {
    return (
      <Card sx={{ 
        background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%)',
        border: '1px solid rgba(162, 89, 255, 0.3)',
        borderRadius: 2,
        mb: 2
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PromotionIcon sx={{ color: '#A259FF', fontSize: 20 }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Timezone Promotions
              </Typography>
              <Chip 
                label={timezoneInfo.city} 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(162, 89, 255, 0.2)', 
                  color: '#A259FF',
                  fontSize: '0.7rem'
                }} 
              />
            </Box>
            <IconButton 
              onClick={handleExpand}
              sx={{ color: '#A259FF' }}
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {backendPromotion?.active ? (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                Active now: {backendPromotion.name} • {backendPromotion.discount_percentage}% OFF
              </Typography>
              {typeof endsIn === 'number' && (
                <Typography variant="caption" sx={{ color: '#FFD700' }}>
                  Ends in {Math.max(0, Math.floor(endsIn / 60))}m {Math.max(0, endsIn % 60)}s
                </Typography>
              )}
            </Box>
          ) : currentPromotions.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                {currentPromotions.length} active promotion{currentPromotions.length > 1 ? 's' : ''} in your timezone
              </Typography>
              
              <Collapse in={expanded}>
                <List sx={{ mt: 1 }}>
                  {currentPromotions.map((promotion, index) => (
                    <React.Fragment key={promotion.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Typography sx={{ fontSize: '1.2rem' }}>
                            {getPromotionIcon(promotion.voucherCategories[0])}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                                {promotion.name}
                              </Typography>
                              <Chip 
                                label={`${promotion.discount}% OFF`} 
                                size="small" 
                                sx={{ 
                                  backgroundColor: getPromotionColor(promotion.discount),
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  height: '20px'
                                }} 
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {promotion.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < currentPromotions.length - 1 && (
                        <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.2)', my: 0.5 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Collapse>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                No active promotions right now
              </Typography>
              
              {nextPromotion && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#FFD700' }}>
                    Next: {nextPromotion.name} in {timeUntilNext}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Business Hours Status */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ 
                color: businessHoursActive ? '#66BB6A' : '#FF6B6B', 
                fontSize: 16 
              }} />
              <Typography variant="caption" sx={{ 
                color: businessHoursActive ? '#66BB6A' : '#FF6B6B',
                fontWeight: 600
              }}>
                {businessHoursActive ? 'Business Hours Active' : 'Outside Business Hours'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mt: 0.5 }}>
              Local time: {timezoneInfo.formattedTime}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Expanded variant
  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.15) 0%, rgba(255, 107, 107, 0.15) 100%)',
      border: '1px solid rgba(162, 89, 255, 0.3)',
      borderRadius: 2,
      mb: 3
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PromotionIcon sx={{ color: '#A259FF', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              Timezone-Specific Promotions
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {timezoneInfo.city} • {timezoneInfo.formattedTime}
            </Typography>
          </Box>
        </Box>

        {/* Active Promotions */}
        {backendPromotion?.active ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              🎉 Active Promotion
            </Typography>
            <Card sx={{ 
              mb: 2, 
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              <ListItem>
                <ListItemIcon>
                  <Typography sx={{ fontSize: '1.5rem' }}>🎯</Typography>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {backendPromotion.name}
                      </Typography>
                      {backendPromotion.discount_percentage != null && (
                        <Chip 
                          label={`${backendPromotion.discount_percentage}% OFF`} 
                          sx={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {backendPromotion.description && (
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                          {backendPromotion.description}
                        </Typography>
                      )}
                      {typeof endsIn === 'number' && (
                        <Chip 
                          icon={<ScheduleIcon />}
                          label={`Ends in ${Math.max(0, Math.floor(endsIn / 60))}m ${Math.max(0, endsIn % 60)}s`} 
                          size="small" 
                          sx={{ backgroundColor: 'rgba(162, 89, 255, 0.2)', color: '#A259FF' }} 
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          </Box>
        ) : currentPromotions.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              🎉 Active Promotions ({currentPromotions.length})
            </Typography>
            <List>
              {currentPromotions.map((promotion) => (
                <Card key={promotion.id} sx={{ 
                  mb: 2, 
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.3)'
                }}>
                  <ListItem>
                    <ListItemIcon>
                      <Typography sx={{ fontSize: '1.5rem' }}>
                        {getPromotionIcon(promotion.voucherCategories[0])}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            {promotion.name}
                          </Typography>
                          <Chip 
                            label={`${promotion.discount}% OFF`} 
                            sx={{ 
                              backgroundColor: getPromotionColor(promotion.discount),
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
                            {promotion.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip 
                              icon={<ScheduleIcon />}
                              label={`${promotion.startTime} - ${promotion.endTime}`} 
                              size="small" 
                              sx={{ backgroundColor: 'rgba(162, 89, 255, 0.2)', color: '#A259FF' }} 
                            />
                            <Chip 
                              label={promotion.voucherCategories.join(', ')} 
                              size="small" 
                              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }} 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Card>
              ))}
            </List>
          </Box>
        ) : (
          <Box sx={{ mb: 3, textAlign: 'center', py: 3 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
              No Active Promotions
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Check back later for exciting deals!
            </Typography>
          </Box>
        )}

        {/* Next Promotion */}
        {nextPromotion && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              ⏰ Coming Up Next
            </Typography>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <ListItem>
                <ListItemIcon>
                  <TimerIcon sx={{ color: '#FFD700', fontSize: 28 }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                      {nextPromotion.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Starts in {timeUntilNext} • {nextPromotion.description}
                    </Typography>
                  }
                />
              </ListItem>
            </Card>
          </Box>
        )}

        {/* Business Hours Status */}
        <Box sx={{ 
          p: 2, 
          backgroundColor: businessHoursActive ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 107, 107, 0.1)',
          border: `1px solid ${businessHoursActive ? 'rgba(102, 187, 106, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
          borderRadius: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon sx={{ 
              color: businessHoursActive ? '#66BB6A' : '#FF6B6B', 
              fontSize: 24 
            }} />
            <Box>
              <Typography variant="h6" sx={{ 
                color: businessHoursActive ? '#66BB6A' : '#FF6B6B',
                fontWeight: 600
              }}>
                {businessHoursActive ? 'Business Hours Active' : 'Outside Business Hours'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Local time: {timezoneInfo.formattedTime}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimezonePromotions;
