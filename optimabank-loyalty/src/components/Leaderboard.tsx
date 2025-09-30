import React, { useState, useEffect } from 'react';
import { leaderboardApi, LeaderboardEntry as ApiLeaderboardEntry } from '../services/api';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  // useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  EmojiEvents,
  Visibility,
  VisibilityOff,
  Refresh,
  Person,
  Star,
  Diamond
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Using LeaderboardEntry from API

interface LeaderboardProps {
  open?: boolean;
  onClose?: () => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ open = false, onClose, onShowSnackbar }) => {
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leaderboardData, setLeaderboardData] = useState<ApiLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public');
  const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [showPrivateUsers, setShowPrivateUsers] = useState(false);

  // Load leaderboard data from backend
  useEffect(() => {
    loadLeaderboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      // setError(null);
      const data = await leaderboardApi.getLeaderboard(50, showPrivateUsers);
      setLeaderboardData(data);
    } catch (err) {
      // setError('Failed to load leaderboard');
      onShowSnackbar('Failed to load leaderboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  // const loadUserStats = async () => {
  //   try {
  //     const stats = await leaderboardApi.getUserStats();
  //     setUserStats(stats);
  //   } catch (err) {
  //     console.error('Failed to load user stats:', err);
  //   }
  // };

  // const handlePrivacyToggle = async (isPublic: boolean) => {
  //   try {
  //     await leaderboardApi.updatePrivacy(isPublic);
  //     setPrivacyMode(isPublic ? 'public' : 'private');
  //     onShowSnackbar(
  //       `Privacy setting updated to ${isPublic ? 'public' : 'private'}`,
  //       'success'
  //     );
  //     // Reload leaderboard to reflect changes
  //     loadLeaderboard();
  //   } catch (err) {
  //     onShowSnackbar('Failed to update privacy settings', 'error');
  //   }
  // };

  // Mock data - replace with API calls
  const mockLeaderboardData: ApiLeaderboardEntry[] = [
    {
      rank: 1,
      user_id: 1,
      username: 'Alex Johnson',
      email: 'alex@example.com',
      total_points: 125000,
      tier_name: 'Platinum',
      last_updated: '2025-09-29T14:00:00Z',
      is_current_user: false
    },
    {
      rank: 2,
      user_id: 2,
      username: 'Sarah Chen',
      email: 'sarah@example.com',
      total_points: 98000,
      tier_name: 'Gold',
      last_updated: '2025-09-29T15:00:00Z',
      is_current_user: true
    },
    {
      rank: 3,
      user_id: 3,
      username: 'Mike Wilson',
      email: 'mike@example.com',
      total_points: 87000,
      tier_name: 'Gold',
      last_updated: '2025-09-29T13:00:00Z',
      is_current_user: false
    },
    {
      rank: 4,
      user_id: 4,
      username: 'Emma Davis',
      email: 'emma@example.com',
      total_points: 75000,
      tier_name: 'Silver',
      last_updated: '2025-09-29T11:00:00Z',
      is_current_user: false
    },
    {
      rank: 5,
      user_id: 5,
      username: 'David Brown',
      email: 'david@example.com',
      total_points: 62000,
      tier_name: 'Silver',
      last_updated: '2025-09-28T10:00:00Z',
      is_current_user: false
    }
  ];

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe, showPrivateUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredData = mockLeaderboardData;
      
      // Filter by privacy settings
      // Note: Privacy filtering would be handled by the API
      // if (!showPrivateUsers) {
      //   filteredData = filteredData.filter(entry => !entry.isPrivate);
      // }
      
      // Filter by timeframe (mock implementation)
      if (timeframe === 'monthly') {
        filteredData = filteredData.map(entry => ({
          ...entry,
          total_points: Math.floor(entry.total_points * 0.3) // Simulate monthly points
        }));
      } else if (timeframe === 'weekly') {
        filteredData = filteredData.map(entry => ({
          ...entry,
          total_points: Math.floor(entry.total_points * 0.1) // Simulate weekly points
        }));
      }
      
      // Sort by points
      filteredData.sort((a, b) => b.total_points - a.total_points);
      
      // Update ranks
      filteredData = filteredData.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      
      setLeaderboardData(filteredData);
    } catch (error) {
      onShowSnackbar('Failed to load leaderboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return <Diamond sx={{ color: '#E5E4E2', fontSize: 20 }} />;
      case 'gold':
        return <Star sx={{ color: '#FFD700', fontSize: 20 }} />;
      case 'silver':
        return <Star sx={{ color: '#C0C0C0', fontSize: 20 }} />;
      default:
        return <Person sx={{ color: '#CD7F32', fontSize: 20 }} />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  const formatPoints = (points: number) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <EmojiEvents sx={{ color: '#FFD700', fontSize: 24 }} />;
      case 2:
        return <EmojiEvents sx={{ color: '#C0C0C0', fontSize: 24 }} />;
      case 3:
        return <EmojiEvents sx={{ color: '#CD7F32', fontSize: 24 }} />;
      default:
        return null;
    }
  };

  const handleTogglePrivateUsers = () => {
    setShowPrivateUsers(!showPrivateUsers);
  };

  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: 'all' | 'monthly' | 'weekly'
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  const handlePrivacyModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'public' | 'private'
  ) => {
    if (newMode !== null) {
      setPrivacyMode(newMode);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Leaderboard</DialogTitle>
        <DialogContent>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress sx={{ flexGrow: 1, mr: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading leaderboard...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0A0A14 0%, #1A1A2E 50%, #16213E 100%)',
          border: '1px solid rgba(162, 89, 255, 0.3)',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            background: 'rgba(162, 89, 255, 0.2)',
            border: '1px solid rgba(162, 89, 255, 0.3)'
          }}>
            <EmojiEvents sx={{ color: '#FFD700', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Leaderboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Top performers and rankings
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        overflow: 'auto', 
        maxHeight: '70vh',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(162, 89, 255, 0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(135deg, #A259FF 0%, #8a3ffb 100%)',
          borderRadius: '4px',
          '&:hover': {
            background: 'linear-gradient(135deg, #9147e6 0%, #7a36d9 100%)',
          }
        },
        '&::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
        // Firefox scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: '#A259FF rgba(162, 89, 255, 0.1)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Premium Header Controls */}
          <Box sx={{ 
            p: 3, 
            background: 'rgba(162, 89, 255, 0.05)',
            borderBottom: '1px solid rgba(162, 89, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  Top {leaderboardData.length} Players
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton 
                onClick={fetchLeaderboardData} 
                size="small"
                sx={{ 
                  color: '#A259FF',
                  '&:hover': { 
                    background: 'rgba(162, 89, 255, 0.1)',
                    transform: 'rotate(180deg)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                <Refresh />
              </IconButton>
              
              <ToggleButtonGroup
                value={timeframe}
                exclusive
                onChange={handleTimeframeChange}
                size="small"
                sx={{ 
                  height: 36,
                  '& .MuiToggleButton-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(162, 89, 255, 0.3)',
                    '&.Mui-selected': {
                      background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                      }
                    },
                    '&:hover': {
                      background: 'rgba(162, 89, 255, 0.1)',
                      borderColor: 'rgba(162, 89, 255, 0.5)',
                    }
                  }
                }}
              >
                <ToggleButton value="all">All Time</ToggleButton>
                <ToggleButton value="monthly">Monthly</ToggleButton>
                <ToggleButton value="weekly">Weekly</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Privacy Controls */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            p: 2,
            bgcolor: 'rgba(162, 89, 255, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(162, 89, 255, 0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Show private users:
              </Typography>
              <Tooltip title={showPrivateUsers ? "Hide private users" : "Show private users"}>
                <IconButton onClick={handleTogglePrivateUsers} size="small">
                  {showPrivateUsers ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <ToggleButtonGroup
              value={privacyMode}
              exclusive
              onChange={handlePrivacyModeChange}
              size="small"
              sx={{ height: 32 }}
            >
              <ToggleButton value="public">Public</ToggleButton>
              <ToggleButton value="private">Private</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Premium Leaderboard List */}
          <Box sx={{ p: 3 }}>
            <AnimatePresence>
              {leaderboardData.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 3,
                      background: entry.is_current_user 
                        ? 'linear-gradient(135deg, rgba(162, 89, 255, 0.15) 0%, rgba(138, 63, 251, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      border: entry.is_current_user 
                        ? '2px solid rgba(162, 89, 255, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: entry.is_current_user 
                          ? '0 20px 40px rgba(162, 89, 255, 0.3)'
                          : '0 20px 40px rgba(0, 0, 0, 0.2)',
                        border: entry.is_current_user 
                          ? '2px solid rgba(162, 89, 255, 0.6)'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: entry.rank <= 3 
                          ? `linear-gradient(90deg, ${getTierColor(entry.tier_name)} 0%, transparent 100%)`
                          : 'transparent',
                      }
                    }}
                  >
                    {/* Premium Content Layout */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                      {/* Rank Badge */}
                      <Box sx={{ 
                        minWidth: 60, 
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {entry.rank <= 3 ? (
                          <Box sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${getTierColor(entry.tier_name)} 0%, ${getTierColor(entry.tier_name)}CC 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: -2,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${getTierColor(entry.tier_name)} 0%, transparent 100%)`,
                              opacity: 0.5,
                              zIndex: -1
                            }
                          }}>
                            {getRankIcon(entry.rank) || (
                              <Typography variant="h6" sx={{ 
                                fontWeight: 700, 
                                color: 'white',
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                              }}>
                                #{entry.rank}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="h5" sx={{ 
                            fontWeight: 700,
                            color: 'rgba(255, 255, 255, 0.6)',
                            textAlign: 'center'
                          }}>
                            #{entry.rank}
                          </Typography>
                        )}
                      </Box>

                      {/* Avatar */}
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{ 
                            width: 56, 
                            height: 56,
                            border: `3px solid ${getTierColor(entry.tier_name)}`,
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                            background: `linear-gradient(135deg, ${getTierColor(entry.tier_name)} 0%, ${getTierColor(entry.tier_name)}CC 100%)`,
                            fontSize: '1.5rem',
                            fontWeight: 700
                          }}
                        >
                          {entry.username.charAt(0).toUpperCase()}
                        </Avatar>
                        {entry.is_current_user && (
                          <Box sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: 'white', 
                              fontWeight: 700,
                              fontSize: '0.6rem'
                            }}>
                              YOU
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* User Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: entry.is_current_user ? '#A259FF' : 'white',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {entry.username}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={getTierIcon(entry.tier_name)}
                            label={entry.tier_name}
                            size="small"
                            sx={{
                              background: `linear-gradient(135deg, ${getTierColor(entry.tier_name)}20 0%, ${getTierColor(entry.tier_name)}10 100%)`,
                              color: getTierColor(entry.tier_name),
                              border: `1px solid ${getTierColor(entry.tier_name)}40`,
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: getTierColor(entry.tier_name)
                              }
                            }}
                          />
                          
                          <Typography variant="body2" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                            {formatPoints(entry.total_points)} pts
                          </Typography>
                        </Box>
                      </Box>

                      {/* Points Display */}
                      <Box sx={{ 
                        textAlign: 'right',
                        minWidth: 120
                      }}>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          color: entry.is_current_user ? '#A259FF' : 'white',
                          mb: 0.5,
                          background: entry.is_current_user 
                            ? 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)'
                            : 'linear-gradient(45deg, #FFD700 30%, #FFA500 90%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {formatPoints(entry.total_points)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          textTransform: 'uppercase',
                          letterSpacing: 1
                        }}>
                          Points
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {/* Premium Footer Stats */}
          <Box sx={{ 
            mt: 3, 
            p: 3, 
            background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(138, 63, 251, 0.05) 100%)',
            borderTop: '1px solid rgba(162, 89, 255, 0.2)',
            borderRadius: '0 0 12px 12px',
            textAlign: 'center'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {leaderboardData.length} {privacyMode === 'public' ? 'public' : 'total'} players
                </Typography>
              </Box>
              
              <Box sx={{ 
                width: '1px', 
                height: '20px', 
                background: 'rgba(255, 255, 255, 0.3)' 
              }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Refresh sx={{ color: '#A259FF', fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Updated: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </DialogContent>
      <DialogActions sx={{ 
        p: 3, 
        background: 'rgba(162, 89, 255, 0.05)',
        borderTop: '1px solid rgba(162, 89, 255, 0.2)'
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(162, 89, 255, 0.4)'
            }
          }}
        >
          Close Leaderboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Leaderboard;
