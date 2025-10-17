import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Check as CheckIcon,
  Public as PublicIcon,
  LocalOffer as PromotionIcon
} from '@mui/icons-material';
import { getUserTimezone } from '../utils/timezone';
import { useTimezone } from '../contexts/TimezoneContext';
import { promotionsApi, ActivePromotion } from '../services/api';

interface TimezoneSelectorProps {
  variant?: 'icon' | 'button' | 'chip';
  size?: 'small' | 'medium' | 'large';
  onTimezoneChange?: (timezone: string) => void;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ 
  variant = 'icon', 
  size = 'medium',
  onTimezoneChange
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { 
    selectedTimezone, 
    setTimezone, 
    timezones, 
    getCurrentPromotions
  } = useTimezone();
  const open = Boolean(anchorEl);
  const [promoByTz, setPromoByTz] = useState<Record<string, ActivePromotion>>({});
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Compute next fallback Happy Hour for a timezone (Mon–Fri, 17:00 local)
  const getNextHappyHourLocal = (timezone: string): { label: string; minutesUntil: number } => {
    const now = new Date();
    // Current local date/time in target tz
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const localDay = localNow.getDay(); // 0=Sun..6=Sat
    const localHour = localNow.getHours();
    const localMinute = localNow.getMinutes();

    // Helper to build a date at local 17:00 same timezone representation
    const buildLocal = (base: Date, addDays: number): Date => {
      const d = new Date(base);
      d.setDate(d.getDate() + addDays);
      d.setHours(17, 0, 0, 0);
      return d;
    };

    // Determine if today is weekday (Mon=1..Fri=5)
    const isWeekday = (d: number) => d >= 1 && d <= 5;

    let target: Date;
    if (isWeekday(localDay) && (localHour < 17 || (localHour === 17 && localMinute === 0))) {
      // Today at 17:00
      target = buildLocal(localNow, 0);
    } else {
      // Find next weekday
      let add = 1;
      while (true) {
        const day = new Date(localNow.getTime());
        day.setDate(day.getDate() + add);
        const d = day.getDay();
        if (isWeekday(d)) {
          target = buildLocal(localNow, add);
          break;
        }
        add += 1;
      }
    }

    // Convert both local times to epoch by formatting in that timezone and parsing
    const targetMs = new Date(target.toLocaleString('en-US', { timeZone: timezone })).getTime();
    const nowMs = localNow.getTime();
    const diffMin = Math.max(0, Math.round((targetMs - nowMs) / 60000));

    const dayLabel = (() => {
      const dayDiff = Math.round((targetMs - nowMs) / (24 * 60 * 60000));
      if (diffMin < 24 * 60 && new Date(localNow).getDate() === new Date(target).getDate()) return 'today';
      if (dayDiff === 1 || (diffMin < 48 * 60 && new Date(localNow).getDate() + 1 === new Date(target).getDate())) return 'tomorrow';
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone }).format(target);
    })();

    const timeLabel = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone }).format(target);
    return { label: `${dayLabel} ${timeLabel}`, minutesUntil: diffMin };
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTimezoneChange = (timezone: string) => {
    setTimezone(timezone);
    onTimezoneChange?.(timezone);
    handleClose();
  };

  // Load real-time promotion status for all listed timezones when menu opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadAll = async () => {
      try {
        const results = await Promise.allSettled(
          timezones.map(tz => promotionsApi.getActiveForTz(tz.timezone))
        );
        const map: Record<string, ActivePromotion> = {};
        results.forEach((res, idx) => {
          const tz = timezones[idx].timezone;
          if (res.status === 'fulfilled') {
            map[tz] = res.value;
          } else {
            map[tz] = { active: false };
          }
        });
        if (!cancelled) setPromoByTz(map);
        // Initialize countdowns
        const cd: Record<string, number> = {};
        Object.entries(map).forEach(([tz, ap]) => {
          if (ap.active && typeof ap.ends_in_seconds === 'number') {
            cd[tz] = ap.ends_in_seconds;
          }
        });
        if (!cancelled) setCountdowns(cd);
      } catch (_) {}
    };
    loadAll();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Tick countdowns every second while menu is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdowns(prev => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([k, v]) => {
          next[k] = v > 0 ? v - 1 : 0;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  const currentTimezone = timezones.find(tz => tz.timezone === selectedTimezone) || 
    timezones.find(tz => tz.timezone === getUserTimezone()) ||
    timezones[0];

  // Helper functions for timezone-specific features
  const getTimezonePromotions = (timezone: string) => {
    // Prefer backend status if available for real-time accuracy
    const ap = promoByTz[timezone];
    if (ap && ap.active) {
      return [{ id: 'backend-active', name: ap.name || 'Happy Hour', description: ap.description || '', discount: ap.discount_percentage || 0, startTime: '', endTime: '', days: [], timezones: [timezone], voucherCategories: [], isActive: true }];
    }
    // Fallback to context sample logic
    return getCurrentPromotions().filter(p => p.timezones.includes(timezone));
  };

  const getTimezoneBusinessStatus = (timezone: string) => {
    // Check if this timezone has business hours restrictions
    const businessHours = [
      { timezone: 'America/New_York', region: 'Eastern US', start: '09:00', end: '18:00' },
      { timezone: 'Europe/London', region: 'UK', start: '09:00', end: '17:00' },
      { timezone: 'Asia/Tokyo', region: 'Japan', start: '09:00', end: '18:00' }
    ];
    
    const region = businessHours.find(bh => bh.timezone === timezone);
    if (!region) return { isBusinessHours: true, nextOpen: null };
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const isBusinessHours = currentTime >= region.start && currentTime <= region.end;
    
    return { isBusinessHours, nextOpen: isBusinessHours ? null : region.start };
  };

  const getNextPromotionForTimezone = (timezone: string) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const currentDay = now.getDay();

    // Sample promotions for demonstration
    const promotions = [
      { id: 'happy-hour', name: 'Happy Hour', time: '17:00', days: [1,2,3,4,5], timezones: ['America/New_York', 'America/Chicago'] },
      { id: 'lunch-rush', name: 'Lunch Rush', time: '12:00', days: [1,2,3,4,5], timezones: ['Europe/London', 'Europe/Paris'] },
      { id: 'weekend-shopping', name: 'Weekend Shopping', time: '10:00', days: [0,6], timezones: ['Asia/Tokyo', 'Asia/Shanghai'] }
    ];

    const timezonePromotions = promotions.filter(p => p.timezones.includes(timezone));
    
    // Find next promotion for this timezone
    for (const promotion of timezonePromotions) {
      if (promotion.days.includes(currentDay) && promotion.time > currentTime) {
        return promotion;
      }
    }

    return null;
  };

  if (variant === 'chip') {
    const currentPromotions = getTimezonePromotions(selectedTimezone);
    const hasPromotions = currentPromotions.length > 0;
    
    return (
      <Badge 
        badgeContent={hasPromotions ? currentPromotions.length : 0} 
        color="error"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#FF6B6B',
            color: 'white',
            fontWeight: 'bold'
          }
        }}
      >
        <Tooltip title={hasPromotions ? `${currentPromotions.length} active promotion${currentPromotions.length > 1 ? 's' : ''}` : 'No active promotions'}>
          <Chip
            icon={<TimeIcon />}
            label={currentTimezone?.city || selectedTimezone}
            onClick={handleClick}
            variant="outlined"
            sx={{
              borderColor: hasPromotions ? '#FF6B6B' : '#A259FF',
              color: hasPromotions ? '#FF6B6B' : '#A259FF',
              '&:hover': {
                backgroundColor: hasPromotions ? 'rgba(255, 107, 107, 0.1)' : 'rgba(162, 89, 255, 0.1)',
              }
            }}
          />
        </Tooltip>
      </Badge>
    );
  }

  if (variant === 'button') {
    return (
      <Box>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(162, 89, 255, 0.1)',
            }
          }}
        >
          <TimeIcon sx={{ color: '#A259FF' }} />
          <Typography variant="body2" sx={{ color: 'white' }}>
            {currentTimezone?.city || selectedTimezone}
          </Typography>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(20, 20, 30, 0.95)',
              color: 'white',
              border: '1px solid rgba(162, 89, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              minWidth: 300,
              maxHeight: 400
            }
          }}
        >
          <MenuItem disabled>
            <ListItemIcon>
              <PublicIcon sx={{ color: '#A259FF' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Select Timezone" 
              primaryTypographyProps={{ fontWeight: 'bold' }}
            />
          </MenuItem>
          <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
          
          {timezones.map((tz) => {
            const promotions = getTimezonePromotions(tz.timezone);
            const ap = promoByTz[tz.timezone];
            const secondsLeft = countdowns[tz.timezone];
            const businessStatus = getTimezoneBusinessStatus(tz.timezone);
            const nextPromotion = getNextPromotionForTimezone(tz.timezone);
            const hasPromotions = promotions.length > 0;
            const isSelected = selectedTimezone === tz.timezone;
            
            return (
              <MenuItem
                key={tz.timezone}
                onClick={() => handleTimezoneChange(tz.timezone)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(162, 89, 255, 0.1)',
                  },
                  borderLeft: isSelected ? '3px solid #A259FF' : '3px solid transparent'
                }}
              >
                <ListItemIcon>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '1rem' }}>
                      🕐
                    </Typography>
                    {hasPromotions && (
                      <Badge 
                        badgeContent={promotions.length} 
                        color="error"
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            fontSize: '0.6rem', 
                            height: '16px', 
                            minWidth: '16px',
                            backgroundColor: '#FF6B6B'
                          } 
                        }}
                      >
                        <PromotionIcon sx={{ fontSize: '0.8rem', color: '#FF6B6B' }} />
                      </Badge>
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tz.city}
                        </Typography>
                        {!businessStatus.isBusinessHours && (
                          <Chip 
                            label="Closed" 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(255, 0, 0, 0.2)', 
                              color: '#FF6B6B',
                              fontSize: '0.6rem',
                              height: '18px'
                            }} 
                          />
                        )}
                        {hasPromotions && (
                          <Chip 
                            label="Promo" 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(255, 107, 107, 0.2)', 
                              color: '#FF6B6B',
                              fontSize: '0.6rem',
                              height: '18px'
                            }} 
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {tz.country} • {tz.offset}
                      </Typography>
                      {nextPromotion && (
                        <Typography variant="caption" sx={{ color: '#FFD700', display: 'block', mt: 0.5 }}>
                          Next: {nextPromotion.name} at {nextPromotion.time}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: '#A259FF' }}>
                      {tz.formattedTime}
                    </Typography>
                  }
                />
                {isSelected && (
                  <CheckIcon sx={{ color: '#A259FF', ml: 1 }} />
                )}
              </MenuItem>
            );
          })}
        </Menu>
      </Box>
    );
  }

  // Default icon variant
  const currentPromotions = getTimezonePromotions(selectedTimezone);
  const hasPromotions = currentPromotions.length > 0;
  
  return (
    <>
      <Badge 
        badgeContent={hasPromotions ? currentPromotions.length : 0} 
        color="error"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#FF6B6B',
            color: 'white',
            fontWeight: 'bold'
          }
        }}
      >
        <Tooltip title={hasPromotions ? `${currentPromotions.length} active promotion${currentPromotions.length > 1 ? 's' : ''} in ${currentTimezone?.city}` : `No active promotions in ${currentTimezone?.city}`}>
          <IconButton
            onClick={handleClick}
            size={size}
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
          >
            <TimeIcon />
          </IconButton>
        </Tooltip>
      </Badge>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(20, 20, 30, 0.95)',
            color: 'white',
            border: '1px solid rgba(162, 89, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: 300,
            maxHeight: 400
          }
        }}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <PublicIcon sx={{ color: '#A259FF' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Select Timezone" 
            primaryTypographyProps={{ fontWeight: 'bold' }}
          />
        </MenuItem>
        <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
        
        {timezones.map((tz) => {
          const promotions = getTimezonePromotions(tz.timezone);
          const ap = promoByTz[tz.timezone];
          const secondsLeft = countdowns[tz.timezone];
          const businessStatus = getTimezoneBusinessStatus(tz.timezone);
          const nextPromotion = getNextPromotionForTimezone(tz.timezone);
          const hasPromotions = promotions.length > 0;
          const isSelected = selectedTimezone === tz.timezone;
          
          return (
            <MenuItem
              key={tz.timezone}
              onClick={() => handleTimezoneChange(tz.timezone)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(162, 89, 255, 0.1)',
                },
                borderLeft: isSelected ? '3px solid #A259FF' : '3px solid transparent'
              }}
            >
              <ListItemIcon>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '1rem' }}>
                    🕐
                  </Typography>
                  {hasPromotions && (
                    <Badge 
                      badgeContent={promotions.length} 
                      color="error"
                      sx={{ 
                        '& .MuiBadge-badge': { 
                          fontSize: '0.6rem', 
                          height: '16px', 
                          minWidth: '16px',
                          backgroundColor: '#FF6B6B'
                        } 
                      }}
                    >
                      <PromotionIcon sx={{ fontSize: '0.8rem', color: '#FF6B6B' }} />
                    </Badge>
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tz.city}
                      </Typography>
                      {!businessStatus.isBusinessHours && (
                        <Chip 
                          label="Closed" 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'rgba(255, 0, 0, 0.2)', 
                            color: '#FF6B6B',
                            fontSize: '0.6rem',
                            height: '18px'
                          }} 
                        />
                      )}
                      {ap?.active && (
                        <Chip 
                          label={secondsLeft != null ? `Active HH • ${Math.max(0, Math.floor((secondsLeft||0)/60))}m ${Math.max(0, (secondsLeft||0)%60)}s` : 'Active HH'} 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'rgba(255, 215, 0, 0.2)', 
                            color: '#FFD700',
                            fontSize: '0.6rem',
                            height: '18px'
                          }} 
                        />
                      )}
                      {!ap?.active && hasPromotions && (
                        <Chip 
                          label="Promo" 
                          size="small" 
                          sx={{ 
                            backgroundColor: 'rgba(255, 107, 107, 0.2)', 
                            color: '#FF6B6B',
                            fontSize: '0.6rem',
                            height: '18px'
                          }} 
                        />
                      )}
                      {/* Next Happy Hour shown as yellow text below, not as a chip */}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {tz.country} • {tz.offset}
                    </Typography>
                    {(() => {
                      const next = getNextHappyHourLocal(tz.timezone);
                      return (
                        <Typography variant="caption" sx={{ color: '#FFD700', display: 'block', mt: 0.5 }}>
                          Next: Happy Hour at {next.label}
                        </Typography>
                      );
                    })()}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#A259FF' }}>
                    {tz.formattedTime}
                  </Typography>
                }
              />
              {isSelected && (
                <CheckIcon sx={{ color: '#A259FF', ml: 1 }} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default TimezoneSelector;
