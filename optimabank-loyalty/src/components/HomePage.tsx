// src/components/HomePage.tsx
import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  AppBar,
  Toolbar,
  Avatar,
  InputBase,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  voucherApi, 
  userApi, 
  cartApi, 
  redemptionApi, 
  notificationApi,
  downloadPdfBlob,
  Voucher,
  VoucherCategory,
  UserProfile,
  Cart,
  Notification
} from '../services/api';
import SettingsPage from './SettingsPage';
import TierProgress from './TierProgress';
import SpendingInsights from './SpendingInsights';
import TimezoneSelector from './TimezoneSelector';
import TimezonePromotions from './TimezonePromotions';
import MiniGames from './MiniGames';
import Leaderboard from './Leaderboard';
import EditProfilePage from './EditProfilePage';
import { useRealtimeClock, getUserTimezone } from '../utils/timezone';
import { animationPresets, microInteractions, createStaggerAnimation } from '../utils/animations';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountCircleIcon,
  EmojiEvents,
  Close,
  Person as PersonIcon,
  SportsEsports as GameControllerIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Loyalty as LoyaltyIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as LocalOfferIcon,
  CardGiftcard as GiftIcon,
  Restaurant as RestaurantIcon,
  ShoppingBag as ShoppingIcon,
  Movie as MovieIcon,
  Flight as FlightIcon,
  Spa as SpaIcon,
  Favorite as FavoriteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Laptop as LaptopIcon,
  LocalGroceryStore as GroceryIcon
} from '@mui/icons-material';
import logo from '../logo.png';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Icon mapping for voucher categories
const categoryIcons: Record<string, React.ReactElement> = {
  'All Vouchers': <LocalOfferIcon />,
  'Dining': <RestaurantIcon />,
  'Shopping': <ShoppingIcon />,
  'Entertainment': <MovieIcon />,
  'Travel': <FlightIcon />,
  'Wellness': <SpaIcon />,
  'Gifts': <GiftIcon />,
  'Fashion': <ShoppingIcon />,
  'Electronics': <LaptopIcon />,
  'Groceries': <GroceryIcon />
};

// Data will be loaded from APIs

interface HomePageProps {
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  onLogout?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onShowSnackbar, onLogout }) => {
  // const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  
  // Mobile-specific state
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  
  // Personalized recommendations state
  const [showPersonalized, setShowPersonalized] = useState(true);
  
  // Timezone state
  const [currentTimezone, setCurrentTimezone] = useState<string>(getUserTimezone());
  const { timezoneInfo, formattedTime } = useRealtimeClock(currentTimezone);
  
  // Mini-games and Leaderboard state
  const [miniGamesOpen, setMiniGamesOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // UI State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [cartAnchorEl, setCartAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Vouchers');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [userName, setUserName] = useState<string>('User');
  const [showSettingsPage, setShowSettingsPage] = useState(false);

  // API Data State
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherCategories, setVoucherCategories] = useState<VoucherCategory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('HomePage mounted - checking authentication');
    console.log('Token found:', !!token);
    console.log('Refresh token found:', !!refreshToken);
    console.log('User name:', userName);
    console.log('User email:', userEmail);
    
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      console.log('No access token found, redirecting to login');
      // navigate('/login');
      return;
    }
    
    console.log('User is authenticated, proceeding with data load');
  }, []);

  // Test token validity
  const testTokenValidity = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/profile/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Token validation response status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Retry function for failed API calls
  const retryApiCall = async (apiCall: () => Promise<any>, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        console.log(`API call attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const open = Boolean(anchorEl);
  const cartOpen = Boolean(cartAnchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);

  // Load data from APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is authenticated before making API calls
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.log('No access token found, skipping data load');
          setLoading(false);
          return;
        }

        console.log('Loading data with token:', token.substring(0, 20) + '...');
        
        // Test token validity first
        const isTokenValid = await testTokenValidity(token);
        if (!isTokenValid) {
          console.error('Token is invalid, redirecting to login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // navigate('/login');
          return;
        }
        
        console.log('Token is valid, proceeding with data load');

        // Load all data in parallel with retry mechanism
        const [vouchersData, categoriesData, profileData, cartData, notificationsData] = await Promise.all([
          retryApiCall(() => voucherApi.getVouchers()).catch(err => {
            console.error('Error fetching vouchers after retries:', err);
            throw new Error('Failed to fetch vouchers');
          }),
          retryApiCall(() => voucherApi.getCategories()).catch(err => {
            console.error('Error fetching categories after retries:', err);
            throw new Error('Failed to fetch categories');
          }),
          retryApiCall(() => userApi.getProfile()).catch(err => {
            console.error('Error fetching profile after retries:', err);
            throw new Error('Failed to fetch profile');
          }),
          retryApiCall(() => cartApi.getCart()).catch(err => {
            console.error('Error fetching cart after retries:', err);
            throw new Error('Failed to fetch cart');
          }),
          retryApiCall(() => notificationApi.getNotifications()).catch(err => {
            console.error('Error fetching notifications after retries:', err);
            throw new Error('Failed to fetch notifications');
          })
        ]);

        setVouchers(vouchersData);
        setVoucherCategories(categoriesData);
        setUserProfile(profileData);
        setCart(cartData);
        setUserNotifications(notificationsData);
        
        // Debug: Log categories data
        console.log('Categories loaded:', categoriesData);

        console.log('Data loaded successfully');

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setSnackbarMessage('Failed to load data. Please try again.');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    const featuredVouchers = vouchers.filter(v => v.featured);
    if (featuredVouchers.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % featuredVouchers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [vouchers]);

  // Filter vouchers based on category and search query
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesCategory = activeCategory === 'All Vouchers' || voucher.category === activeCategory;
    const matchesSearch = voucher.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          voucher.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Generate personalized recommendations
  const generatePersonalizedRecommendations = () => {
    if (!userProfile || !vouchers.length) return [];

    const userPoints = userProfile.points;
    const userTier = (userProfile as any).tier || 'bronze';
    
    // Algorithm for personalized recommendations
    const recommendations = vouchers
      .filter(voucher => {
        // Filter by affordability (within 150% of user's points)
        const isAffordable = voucher.points <= userPoints * 1.5;
        
        // Filter by tier appropriateness
        const tierMultiplier = userTier === 'platinum' ? 1.2 : userTier === 'gold' ? 1.1 : 1.0;
        const isTierAppropriate = voucher.points <= 5000 * tierMultiplier;
        
        return isAffordable && isTierAppropriate;
      })
      .sort((a, b) => {
        // Sort by relevance score
        const scoreA = calculateRelevanceScore(a, userProfile);
        const scoreB = calculateRelevanceScore(b, userProfile);
        return scoreB - scoreA;
      })
      .slice(0, 6); // Top 6 recommendations

    return recommendations;
  };

  const calculateRelevanceScore = (voucher: Voucher, profile: any) => {
    let score = 0;
    
    // Points-based scoring (closer to user's points = higher score)
    const pointsDiff = Math.abs(voucher.points - profile.points);
    score += Math.max(0, 100 - pointsDiff / 100);
    
    // Featured vouchers get bonus
    if (voucher.featured) score += 50;
    
    // Category preferences (mock - in real app, analyze user history)
    const preferredCategories = ['Dining', 'Shopping', 'Entertainment'];
    if (preferredCategories.includes(voucher.category)) score += 30;
    
    // Discount-based scoring
    const discountValue = parseFloat(voucher.discount.replace(/[^\d.]/g, ''));
    score += discountValue * 2;
    
    return score;
  };

  // Get featured vouchers for banner
  const featuredVouchers = vouchers.filter(v => v.featured);
  const currentBannerVoucher = featuredVouchers[currentBannerIndex];

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  
  const handleCartMenuOpen = (event: React.MouseEvent<HTMLElement>) => setCartAnchorEl(event.currentTarget);
  const handleCartMenuClose = () => setCartAnchorEl(null);

  const handleNotificationsMenuOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
    // Mark all notifications as read when opening
    try {
      await notificationApi.markAsRead();
      setUserNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };
  const handleNotificationsMenuClose = () => setNotificationsAnchorEl(null);

  const handleEditProfile = () => {
    handleProfileMenuClose();
    setEditProfileOpen(true);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    setLogoutConfirmOpen(true);
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    setShowSettingsPage(true);
  };

  const handleBackFromSettings = () => {
    setShowSettingsPage(false);
  };

  const handleTermsOpen = (voucher: any) => {
    setSelectedVoucher(voucher);
    setTermsDialogOpen(true);
  };

  const handleTermsClose = () => {
    setTermsDialogOpen(false);
    setSelectedVoucher(null);
  };

  const handleAddToCart = async (voucher: Voucher) => {
    try {
      await cartApi.addToCart(voucher.id, 1);
      setSnackbarMessage(`${voucher.title} added to cart!`);
      setSnackbarOpen(true);
      
      // Refresh cart data
      const updatedCart = await cartApi.getCart();
      setCart(updatedCart);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to add to cart');
      setSnackbarOpen(true);
    }
  };

  const handleRedeemNow = async (voucher: Voucher) => {
    try {
      console.log('Starting voucher redemption for:', voucher.title);
      
      // Check if user has enough points
      if (userProfile && userProfile.points < voucher.points) {
        setSnackbarMessage(`Insufficient points. You need ${voucher.points} points but have ${userProfile.points}.`);
        setSnackbarOpen(true);
        return;
      }
      
      // Check authentication
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSnackbarMessage('Please log in to redeem vouchers.');
        setSnackbarOpen(true);
        return;
      }
      
      const result = await redemptionApi.redeemVoucher(voucher.id, 1);
      console.log('Redemption result:', result);
      
      // Check different possible response structures
      let redemptionId = null;
      
      if (result.redemptions && result.redemptions.length > 0) {
        redemptionId = result.redemptions[0].id;
      } else if (result.redemption_id) {
        redemptionId = result.redemption_id;
      } else if (result.id) {
        redemptionId = result.id;
      } else {
        console.warn('No redemption ID found in response:', result);
        // Still show success message even without PDF
        setSnackbarMessage(`Successfully redeemed ${voucher.title}!`);
        setSnackbarOpen(true);
        
        // Refresh user profile and vouchers
        const [updatedProfile, updatedVouchers] = await Promise.all([
          userApi.getProfile(),
          voucherApi.getVouchers()
        ]);
        setUserProfile(updatedProfile);
        setVouchers(updatedVouchers);
        return;
      }
      
      if (redemptionId) {
        try {
        const filename = `${voucher.title.replace(/[^a-zA-Z0-9]/g, '_')}_voucher.pdf`;
        await downloadPdfBlob(redemptionId, filename);
          setSnackbarMessage(`Successfully redeemed ${voucher.title}! PDF downloaded to your Downloads folder.`);
        } catch (pdfError) {
          console.error('PDF download error:', pdfError);
          setSnackbarMessage(`Successfully redeemed ${voucher.title}! (PDF download failed)`);
        }
      } else {
        setSnackbarMessage(`Successfully redeemed ${voucher.title}!`);
      }
      
      setSnackbarOpen(true);
      
      // Refresh user profile and vouchers
      const [updatedProfile, updatedVouchers] = await Promise.all([
        userApi.getProfile(),
        voucherApi.getVouchers()
      ]);
      setUserProfile(updatedProfile);
      setVouchers(updatedVouchers);
      
    } catch (err) {
      console.error('Error redeeming voucher:', err);
      
      let errorMessage = 'Failed to redeem voucher';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle specific error cases
        if (errorMessage.includes('Network error')) {
          errorMessage = 'Network error: Unable to connect to server. Please check your internet connection and try again.';
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } else if (errorMessage.includes('Insufficient points')) {
          errorMessage = `Insufficient points. You need ${voucher.points} points to redeem this voucher.`;
        } else if (errorMessage.includes('Insufficient quantity')) {
          errorMessage = 'This voucher is currently out of stock.';
        }
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    try {
      if (newQuantity < 1) {
        await cartApi.removeFromCart(id);
      } else {
        await cartApi.updateCartItem(id, newQuantity);
      }
      
      // Refresh cart data
      const updatedCart = await cartApi.getCart();
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating cart item:', err);
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to update cart item');
      setSnackbarOpen(true);
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await cartApi.removeFromCart(id);
      
      // Refresh cart data
      const updatedCart = await cartApi.getCart();
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing cart item:', err);
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to remove cart item');
      setSnackbarOpen(true);
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await redemptionApi.checkoutCart();
      
      // Handle PDF download based on whether it's single or multiple vouchers
      if (result.is_multi_voucher && result.pdf_url && result.redemptions && result.redemptions.length > 0) {
        // Multiple vouchers - download the single combined PDF
        const filename = `Multi_Voucher_Redemption_${new Date().toISOString().split('T')[0]}.pdf`;
        try {
          const redemptionId = result.redemptions[0].redemption_id || result.redemptions[0].id;
          await downloadPdfBlob(redemptionId, filename);
          setSnackbarMessage(`Successfully checked out cart! Combined PDF with ${result.redemptions.length} vouchers downloaded to your Downloads folder.`);
        } catch (error) {
          console.error('Failed to download combined PDF:', error);
          setSnackbarMessage('Cart checked out successfully, but PDF download failed. You can download it from your redemptions.');
        }
      } else if (result.redemptions && result.redemptions.length > 0) {
        // Single voucher - download individual PDF
        const redemption = result.redemptions[0];
          const filename = `${redemption.voucher_title.replace(/[^a-zA-Z0-9]/g, '_')}_voucher.pdf`;
          const redemptionId = redemption.redemption_id || redemption.id;
          
            try {
              await downloadPdfBlob(redemptionId, filename);
          setSnackbarMessage(`Successfully checked out cart! PDF downloaded to your Downloads folder.`);
            } catch (error) {
              console.error(`Failed to download PDF for ${redemption.voucher_title}:`, error);
          setSnackbarMessage('Cart checked out successfully, but PDF download failed. You can download it from your redemptions.');
            }
      } else {
        setSnackbarMessage('Cart checked out successfully!');
      }
      
      setSnackbarOpen(true);
      
      // Refresh data
      const [updatedProfile, updatedCart, updatedVouchers] = await Promise.all([
        userApi.getProfile(),
        cartApi.getCart(),
        voucherApi.getVouchers()
      ]);
      setUserProfile(updatedProfile);
      setCart(updatedCart);
      setVouchers(updatedVouchers);
      
    } catch (err) {
      console.error('Error checking out cart:', err);
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to checkout cart');
      setSnackbarOpen(true);
    }
    
    handleCartMenuClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % featuredVouchers.length);
  };

  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + featuredVouchers.length) % featuredVouchers.length);
  };

  // Mobile swipe handlers
  const handleSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX === null) return;
    
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDistance = swipeStartX - swipeEndX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        handleNextBanner(); // Swipe left - next
      } else {
        handlePrevBanner(); // Swipe right - previous
      }
    }
    
    setSwipeStartX(null);
  };

  // Computed values
  const totalCartItems = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  const cartTotalPoints = cart?.total_points || 0;
  const unreadNotifications = userNotifications.filter(n => !n.read).length;
  const userPoints = userProfile?.points || 0;
  // Load user name from storage on mount and keep in sync if storage changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userName');
      if (stored && stored.trim().length > 0) setUserName(stored);
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'userName' && e.newValue) setUserName(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Inter", "Roboto", sans-serif'
        }}
      >
        <Typography variant="h4" sx={{ color: '#A259FF' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Inter", "Roboto", sans-serif'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#ff6b6b', mb: 2 }}>
            Error Loading Data
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setError(null);
              setLoading(true);
              // Reload data
              const loadData = async () => {
                try {
                  const token = localStorage.getItem('access_token');
                  if (!token) {
                    // navigate('/login');
                    return;
                  }

                  const [vouchersData, categoriesData, profileData, cartData, notificationsData] = await Promise.all([
                    retryApiCall(() => voucherApi.getVouchers()),
                    retryApiCall(() => voucherApi.getCategories()),
                    retryApiCall(() => userApi.getProfile()),
                    retryApiCall(() => cartApi.getCart()),
                    retryApiCall(() => notificationApi.getNotifications())
                  ]);

                  setVouchers(vouchersData);
                  setVoucherCategories(categoriesData);
                  setUserProfile(profileData);
                  setCart(cartData);
                  setUserNotifications(notificationsData);
                } catch (err) {
                  console.error('Error reloading data:', err);
                  setError(err instanceof Error ? err.message : 'Failed to load data');
                } finally {
                  setLoading(false);
                }
              };
              loadData();
            }}
            sx={{
              background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
              '&:hover': { background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)' },
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  // Show Settings page if requested
  if (showSettingsPage) {
    return <SettingsPage onBack={handleBackFromSettings} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)',
        color: 'white',
        overflow: isSmallScreen ? 'visible' : 'hidden',
        fontFamily: '"Inter", "Roboto", sans-serif'
      }}
    >
      {/* Header / AppBar */}
      <AppBar position="static" sx={{ 
        bgcolor: '#0A0A14', 
        boxShadow: '0 4px 20px rgba(162, 89, 255, 0.2)',
      }}>
        <Toolbar sx={{ 
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: isSmallScreen ? 'stretch' : 'center',
          py: isSmallScreen ? 1 : 0,
          gap: isSmallScreen ? 2 : 0
        }}>
          {/* Logo and Title */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1,
            justifyContent: isSmallScreen ? 'center' : 'flex-start'
          }}>
            <Box 
              component="img" 
              src={logo} 
              alt="Optima Logo" 
              sx={{ 
                width: isSmallScreen ? 32 : 40, 
                height: isSmallScreen ? 32 : 40, 
                mr: 2, 
                objectFit: 'contain',
                bgcolor: 'rgba(162, 89, 255, 0.1)',
                borderRadius: '8px',
                padding: 0.5,
                border: '1px solid rgba(162, 89, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: isSmallScreen ? '1.2rem' : '1.5rem'
              }}
            >
              OPTIMA REWARDS
            </Typography>
            
            {/* Real-time Clock */}
            {!isSmallScreen && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                ml: 3,
                p: 1.5,
                bgcolor: 'rgba(162, 89, 255, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(162, 89, 255, 0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <Typography variant="h6" sx={{ color: '#A259FF', fontWeight: 'bold', fontSize: '1rem' }}>
                  {formattedTime}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                  {timezoneInfo.city} • {timezoneInfo.offset}
            </Typography>
              </Box>
            )}
          </Box>

          {/* Mobile Layout - Stack vertically */}
          {isSmallScreen ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2, 
              width: '100%' 
            }}>
              {/* User Points and Action Buttons Row */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LoyaltyIcon sx={{ color: '#A259FF', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {userPoints.toLocaleString()} pts
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5,
                  flexWrap: 'nowrap',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  marginLeft: -1,
                  paddingLeft: 1,
                  '&::-webkit-scrollbar': { 
                    display: 'none'
                  }
                }}>
                  {/* Spending Insights */}
                  <SpendingInsights size="small" />
                  
                  {/* Timezone Selector */}
                  <TimezoneSelector 
                    variant="icon" 
                    size="small" 
                    onTimezoneChange={setCurrentTimezone}
                  />
                  
                  {/* Mini Games */}
                  <IconButton 
                    onClick={() => setMiniGamesOpen(true)}
                    sx={{
                      color: '#FFFFFF',
                      bgcolor: 'rgba(162, 89, 255, 0.15)',
                      border: '2px solid rgba(162, 89, 255, 0.4)',
                      borderRadius: '12px',
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
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
                        fontSize: '1rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }
                    }}
                  >
                    <GameControllerIcon />
                  </IconButton>
                  
                  {/* Leaderboard */}
                  <IconButton 
                    onClick={() => setLeaderboardOpen(true)}
                    sx={{
                      color: '#FFFFFF',
                      bgcolor: 'rgba(162, 89, 255, 0.15)',
                      border: '2px solid rgba(162, 89, 255, 0.4)',
                      borderRadius: '12px',
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
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
                        fontSize: '1rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }
                    }}
                  >
                    <EmojiEvents />
                  </IconButton>
                  
                  {/* Cart */}
                  <IconButton 
                    onClick={handleCartMenuOpen}
                    sx={{
                      color: '#FFFFFF',
                      bgcolor: 'rgba(162, 89, 255, 0.15)',
                      border: '2px solid rgba(162, 89, 255, 0.4)',
                      borderRadius: '12px',
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
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
                        fontSize: '1rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }
                    }}
                  >
                    <Badge badgeContent={totalCartItems} color="error">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                  
                  {/* Notifications */}
                  <IconButton 
                    onClick={handleNotificationsMenuOpen}
                    sx={{
                      color: '#FFFFFF',
                      bgcolor: 'rgba(162, 89, 255, 0.15)',
                      border: '2px solid rgba(162, 89, 255, 0.4)',
                      borderRadius: '12px',
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
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
                        fontSize: '1rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }
                    }}
                  >
                    <Badge badgeContent={unreadNotifications} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  
                  {/* Profile */}
                  <IconButton 
                    sx={{ 
                      color: '#A259FF',
                      width: 30,
                      height: 30,
                      minWidth: 30,
                      minHeight: 30,
                      marginLeft: -0.5,
                      marginRight: 0.5
                    }} 
                    onClick={handleProfileMenuOpen}
                    size="small"
                  >
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24, 
                      minWidth: 24,
                      minHeight: 24,
                      bgcolor: 'rgba(162, 89, 255, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }} src="https://via.placeholder.com/40">
                      <AccountCircleIcon sx={{ fontSize: '0.9rem' }} />
                    </Avatar>
                  </IconButton>
                </Box>
              </Box>

              {/* Search Bar */}
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  bgcolor: 'rgba(162, 89, 255, 0.15)',
                  border: '1px solid rgba(162, 89, 255, 0.4)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <IconButton 
                  sx={{ 
                    p: '10px', 
                    color: '#FFFFFF',
                    bgcolor: 'rgba(162, 89, 255, 0.1)',
                    border: '1px solid rgba(162, 89, 255, 0.3)',
                    borderRadius: '8px',
                    '&:hover': {
                      bgcolor: 'rgba(162, 89, 255, 0.2)',
                      border: '1px solid rgba(162, 89, 255, 0.5)'
                    },
                    transition: 'all 0.3s ease'
                  }} 
                  aria-label="search"
                >
                  <SearchIcon />
                </IconButton>
                <InputBase 
                  sx={{ 
                    ml: 1, 
                    flex: 1, 
                    color: 'white',
                    fontSize: '0.9rem',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }} 
                  placeholder="Search vouchers..." 
                  inputProps={{ 'aria-label': 'search vouchers' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Paper>
            </Box>
          ) : (
            /* Desktop Layout - Horizontal */
            <>
          {/* User Points Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <LoyaltyIcon sx={{ color: '#A259FF', mr: 1 }} />
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
              {userPoints.toLocaleString()} pts
            </Typography>
          </Box>

          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
                  width: 300,
              mr: 2,
              bgcolor: 'rgba(162, 89, 255, 0.15)',
              border: '1px solid rgba(162, 89, 255, 0.4)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <IconButton 
              sx={{ 
                p: '10px', 
                color: '#FFFFFF',
                bgcolor: 'rgba(162, 89, 255, 0.1)',
                border: '1px solid rgba(162, 89, 255, 0.3)',
                borderRadius: '8px',
                '&:hover': {
                  bgcolor: 'rgba(162, 89, 255, 0.2)',
                  border: '1px solid rgba(162, 89, 255, 0.5)'
                },
                transition: 'all 0.3s ease'
              }} 
              aria-label="search"
            >
              <SearchIcon />
            </IconButton>
            <InputBase 
              sx={{ 
                ml: 1, 
                flex: 1, 
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }} 
              placeholder="Search vouchers..." 
              inputProps={{ 'aria-label': 'search vouchers' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              onClick={handleCartMenuOpen}
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(162, 89, 255, 0.15)',
                border: '2px solid rgba(162, 89, 255, 0.4)',
                borderRadius: '12px',
                width: 48,
                height: 48,
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
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }
              }}
            >
              <Badge badgeContent={totalCartItems} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            <IconButton 
              onClick={handleNotificationsMenuOpen}
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(162, 89, 255, 0.15)',
                border: '2px solid rgba(162, 89, 255, 0.4)',
                borderRadius: '12px',
                width: 48,
                height: 48,
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
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }
              }}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <SpendingInsights />
            
            <TimezoneSelector 
              variant="icon" 
              size="medium" 
              onTimezoneChange={setCurrentTimezone}
            />
            <IconButton 
              onClick={() => setMiniGamesOpen(true)}
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(162, 89, 255, 0.15)',
                border: '2px solid rgba(162, 89, 255, 0.4)',
                borderRadius: '12px',
                width: 48,
                height: 48,
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
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }
              }}
            >
              <GameControllerIcon />
            </IconButton>
            <IconButton 
              onClick={() => setLeaderboardOpen(true)}
              sx={{
                color: '#FFFFFF',
                bgcolor: 'rgba(162, 89, 255, 0.15)',
                border: '2px solid rgba(162, 89, 255, 0.4)',
                borderRadius: '12px',
                width: 48,
                height: 48,
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
                  fontSize: '1.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }
              }}
            >
              <EmojiEvents />
            </IconButton>

            <IconButton 
              sx={{ color: '#A259FF', mx: 1 }} 
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'rgba(162, 89, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }} src="https://via.placeholder.com/40">
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

            {/* Notifications Menu */}
            <Menu
              anchorEl={notificationsAnchorEl}
              open={notificationsOpen}
              onClose={handleNotificationsMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: '#0A0A14',
                  border: '1px solid rgba(162, 89, 255, 0.4)',
                  color: 'white',
                  mt: 1.5,
                  width: 350,
                  maxWidth: '100%',
                  backdropFilter: 'blur(10px)',
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#A259FF', mb: 2 }}>Notifications</Typography>
                
                {userNotifications.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 3 }}>
                    No notifications
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {userNotifications.map((notification) => (
                        <Box key={notification.id} sx={{ 
                          mb: 2, 
                          p: 2, 
                          borderRadius: 1, 
                          bgcolor: notification.read ? 'rgba(162, 89, 255, 0.1)' : 'rgba(162, 89, 255, 0.2)',
                          border: notification.read ? '1px solid rgba(162, 89, 255, 0.2)' : '1px solid rgba(162, 89, 255, 0.4)'
                        }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: notification.read ? 'normal' : 'bold' }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5, display: 'block' }}>
                            {(() => {
                              const date = new Date(notification.created_at);
                              console.log('Notification date debug:', {
                                raw: notification.created_at,
                                parsed: date,
                                localString: date.toLocaleString('en-US', { 
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              });
                              return date.toLocaleString('en-US', { 
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              });
                            })()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
                    
                    <Button 
                      fullWidth 
                      variant="outlined"
                      onClick={handleNotificationsMenuClose}
                      sx={{
                        color: '#A259FF',
                        borderColor: '#A259FF',
                        '&:hover': { borderColor: '#8a3ffb', backgroundColor: 'rgba(162, 89, 255, 0.1)' },
                      }}
                    >
                      Close
                    </Button>
                  </>
                )}
              </Box>
            </Menu>

            {/* Profile Menu */}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: '#0A0A14',
                  border: '1px solid rgba(162, 89, 255, 0.4)',
                  color: 'white',
                  mt: 1.5,
                  backdropFilter: 'blur(10px)',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1,
                    '&:hover': { bgcolor: 'rgba(162, 89, 255, 0.15)' }
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileMenuClose}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 2, 
                  bgcolor: 'rgba(162, 89, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }} src="https://via.placeholder.com/40" />
                <Box>
                  <Typography variant="body1" sx={{ color: 'white' }}>{userName}</Typography>
                  <Typography variant="body2" sx={{ color: '#A259FF', fontWeight: 'bold' }}>
                    {userPoints.toLocaleString()} points
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
              <MenuItem onClick={handleEditProfile}><EditIcon sx={{ mr: 2, color: '#A259FF', fontSize: 20 }} />Edit Profile</MenuItem>
              <MenuItem onClick={handleSettings}><SettingsIcon sx={{ mr: 2, color: '#A259FF', fontSize: 20 }} />Settings</MenuItem>
              <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
              <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 2, color: '#A259FF', fontSize: 20 }} />Logout</MenuItem>
            </Menu>

            {/* Cart Menu */}
            <Menu
              anchorEl={cartAnchorEl}
              open={cartOpen}
              onClose={handleCartMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: '#0A0A14',
                  border: '1px solid rgba(162, 89, 255, 0.4)',
                  color: 'white',
                  mt: 1.5,
                  width: 350,
                  maxWidth: '100%',
                  backdropFilter: 'blur(10px)',
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ color: '#A259FF', mb: 2 }}>Cart</Typography>
                
                {cart?.items.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 3 }}>
                    Cart is empty
                  </Typography>
                ) : (
                  <>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {cart?.items.map((item) => (
                        <Box key={item.id} sx={{ mb: 2, p: 1, borderRadius: 1, bgcolor: 'rgba(162, 89, 255, 0.1)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>{item.voucher.title}</Typography>
                            <IconButton size="small" onClick={() => handleRemoveItem(item.id)} sx={{ color: '#ff6b6b' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" sx={{ color: '#A259FF' }}>{item.voucher.points} pts</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                sx={{ color: '#A259FF' }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography variant="body2" sx={{ color: 'white', mx: 1 }}>{item.quantity}</Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                sx={{ color: '#A259FF' }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(162, 89, 255, 0.3)' }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ color: 'white' }}>Total Points:</Typography>
                      <Typography variant="body1" sx={{ color: '#A259FF', fontWeight: 'bold' }}>{cartTotalPoints} pts</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Your Points:</Typography>
                      <Typography variant="body2" sx={{ color: userPoints >= cartTotalPoints ? '#4caf50' : '#f44336' }}>
                        {userPoints} pts
                      </Typography>
                    </Box>
                    
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={handleCheckout}
                      disabled={userPoints < cartTotalPoints}
                      sx={{ 
                        background: userPoints >= cartTotalPoints 
                          ? 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)' 
                          : 'rgba(162, 89, 255, 0.3)',
                        borderRadius: 2, 
                        fontWeight: 600,
                      }}
                    >
                      {userPoints >= cartTotalPoints ? 'Redeem Now' : 'Not Enough Points'}
                    </Button>
                  </>
                )}
              </Box>
            </Menu>

      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: isSmallMobile ? 2 : 4,
          px: isSmallMobile ? 1 : 2,
          overflow: isSmallScreen ? 'visible' : 'auto',
          // Ensure content is fully scrollable on mobile
          ...(isSmallScreen && {
            minHeight: '100vh',
            paddingBottom: '200px' // Extra space at bottom for mobile
          })
        }}
      >
        {/* Tier Progress Component */}
        <TierProgress 
          onTierUpgrade={(newTier) => {
          setSnackbarMessage(`🎉 Congratulations! You've been upgraded to ${newTier.tier_name.charAt(0).toUpperCase() + newTier.tier_name.slice(1)} tier!`);
          setSnackbarOpen(true);
          }}
          onShowSnackbar={onShowSnackbar}
        />
        
        {/* Timezone-Specific Promotions */}
        <TimezonePromotions variant="compact" />
        
        {/* Hero Banner with New Arrivals */}
        <Paper 
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
          sx={{ 
          position: 'relative', 
          height: isSmallScreen ? 300 : 400, 
          mb: 4, 
          borderRadius: 3, 
          overflow: 'hidden', 
          backgroundImage: currentBannerVoucher ? `linear-gradient(rgba(10, 10, 20, 0.7), rgba(10, 10, 20, 0.7)), url(${currentBannerVoucher.image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(162, 89, 255, 0.4)',
            backdropFilter: 'blur(5px)',
            cursor: isSmallScreen ? 'grab' : 'default',
            '&:active': {
              cursor: isSmallScreen ? 'grabbing' : 'default',
            }
        }}>
          {/* Navigation Arrows - Hidden on mobile */}
          {!isSmallScreen && (
            <>
          <IconButton 
            onClick={handlePrevBanner}
            sx={{ 
              position: 'absolute', 
              left: 16, 
              color: 'white', 
              bgcolor: 'rgba(162, 89, 255, 0.3)',
              '&:hover': { bgcolor: 'rgba(162, 89, 255, 0.5)' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <IconButton 
            onClick={handleNextBanner}
            sx={{ 
              position: 'absolute', 
              right: 16, 
              color: 'white', 
              bgcolor: 'rgba(162, 89, 255, 0.3)',
              '&:hover': { bgcolor: 'rgba(162, 89, 255, 0.5)' }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
            </>
          )}

          {/* Banner Content */}
          {currentBannerVoucher && (
            <Box sx={{ 
              textAlign: 'center', 
              p: isSmallScreen ? 2 : 4, 
              maxWidth: 800,
              mx: 'auto'
            }}>
              <Chip 
                label="NEW ARRIVAL" 
                sx={{ 
                  bgcolor: '#A259FF', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  mb: 2,
                  fontSize: isSmallScreen ? '0.8rem' : '0.9rem'
                }} 
              />
              <Typography 
                variant={isSmallScreen ? "h4" : "h3"} 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  mb: 2,
                  fontSize: isSmallScreen ? '1.5rem' : '2.5rem'
                }}
              >
                {currentBannerVoucher.title}
              </Typography>
              <Typography 
                variant={isSmallScreen ? "body1" : "h6"} 
                sx={{ 
                  color: '#A259FF', 
                  fontWeight: 'bold', 
                  mb: 2,
                  fontSize: isSmallScreen ? '1rem' : '1.25rem'
                }}
              >
                {currentBannerVoucher.points} points • {currentBannerVoucher.discount}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  mb: 3,
                  fontSize: isSmallScreen ? '0.9rem' : '1rem',
                  px: isSmallScreen ? 1 : 0
                }}
              >
                {currentBannerVoucher.description}
              </Typography>
              <Button
                variant="contained"
                size={isSmallScreen ? "medium" : "large"}
                onClick={() => handleRedeemNow(currentBannerVoucher)}
                sx={{
                  background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                  borderRadius: 3,
                  px: isSmallScreen ? 3 : 4,
                  py: isSmallScreen ? 1 : 1.5,
                  fontWeight: 600,
                  fontSize: isSmallScreen ? '1rem' : '1.1rem',
                  ...microInteractions.clickScale,
                  ...microInteractions.ripple,
                  '&:hover': { 
                    background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 25px rgba(162, 89, 255, 0.4)',
                  },
                }}
              >
                Redeem Now
              </Button>
            </Box>
          )}

          {/* Banner Indicators */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 16, 
            display: 'flex', 
            gap: 1,
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            {featuredVouchers.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: isSmallScreen ? 8 : 10,
                  height: isSmallScreen ? 8 : 10,
                  borderRadius: '50%',
                  bgcolor: index === currentBannerIndex ? '#A259FF' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentBannerIndex(index)}
              />
            ))}
          </Box>
        </Paper>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            Premium Rewards
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Redeem your loyalty points for exclusive rewards and experiences
          </Typography>
        </Box>

        {/* Smart Tips - Personalized Recommendations Section */}
        {showPersonalized && userProfile && (
          <Box sx={{ 
            mb: isSmallScreen ? 2 : 4,
            width: '100%',
            overflow: 'visible',
            position: 'relative',
            zIndex: 100,
            // Ensure full visibility on mobile
            ...(isSmallScreen && {
              marginBottom: '20px',
              paddingBottom: '20px',
              minHeight: 'auto',
              height: 'auto'
            })
          }}>
            <Paper sx={{ 
              bgcolor: 'rgba(20, 20, 30, 0.7)', 
              p: isSmallScreen ? 4 : 3, 
              borderRadius: 3,
              border: '1px solid rgba(162, 89, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(20, 20, 30, 0.7) 100%)',
              ...animationPresets.pageEnter,
              ...microInteractions.hoverLift,
              width: '100%',
              minHeight: 'auto',
              // Mobile-specific styling
              ...(isSmallScreen && {
                marginBottom: '10px',
                paddingBottom: '10px',
                position: 'relative',
                zIndex: 100,
                overflow: 'visible',
                height: 'auto'
              })
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ color: '#A259FF', fontWeight: 600 }}>
                    🎯 Personalized for You
                  </Typography>
                  <Chip 
                    label="AI Powered" 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(162, 89, 255, 0.2)', 
                      color: '#A259FF',
                      fontSize: '0.7rem'
                    }} 
                  />
                </Box>
                <IconButton 
                  onClick={() => setShowPersonalized(false)}
                  sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  <Close />
                </IconButton>
              </Box>
              
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                Based on your tier, points, and preferences, here are vouchers we think you'll love:
              </Typography>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: isSmallScreen ? 4 : 2,
                width: '100%',
                overflow: 'visible',
                // Mobile-specific styling
                ...(isSmallScreen && {
                  marginBottom: '40px',
                  paddingBottom: '40px',
                  minHeight: 'auto',
                  height: 'auto'
                })
              }}>
                {generatePersonalizedRecommendations().map((voucher, index) => (
                  <Card 
                    key={voucher.id} 
                    sx={{ 
                      position: 'relative',
                      borderRadius: 2,
                      border: '1px solid rgba(162, 89, 255, 0.2)',
                      overflow: 'hidden',
                      ...createStaggerAnimation(index * 0.1),
                      ...animationPresets.cardHover,
                      ...microInteractions.hoverLift,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(162, 89, 255, 0.3)',
                        border: '1px solid rgba(162, 89, 255, 0.5)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: voucher.image_url ? 
                          `linear-gradient(rgba(30, 30, 50, 0.7), rgba(30, 30, 50, 0.7)), url(${voucher.image_url})` :
                          'linear-gradient(rgba(30, 30, 50, 0.9), rgba(30, 30, 50, 0.9))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        zIndex: 0,
                        opacity: 0.5,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover::before': {
                        opacity: 0.6
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      p: 2, 
                      position: 'relative', 
                      zIndex: 1,
                      background: 'rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(2px)'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                          {voucher.title}
                        </Typography>
                        <Chip 
                          label="Recommended" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#4CAF50', 
                            color: 'white',
                            fontSize: '0.6rem',
                            height: 20
                          }} 
                        />
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, fontSize: '0.85rem' }}>
                        {voucher.description.length > 80 ? `${voucher.description.substring(0, 80)}...` : voucher.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#A259FF', fontWeight: 'bold' }}>
                          {voucher.points} pts
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                          {voucher.discount}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleRedeemNow(voucher)}
                          sx={{
                            flex: 1,
                            background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                            fontSize: '0.8rem',
                            py: 0.5,
                            ...microInteractions.clickScale,
                            ...microInteractions.ripple,
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 15px rgba(162, 89, 255, 0.4)'
                            }
                          }}
                        >
                          Redeem
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddToCart(voucher)}
                          sx={{
                            borderColor: '#A259FF',
                            color: '#A259FF',
                            fontSize: '0.8rem',
                            py: 0.5,
                            ...microInteractions.clickScale,
                            ...microInteractions.ripple,
                            '&:hover': {
                              borderColor: '#8a3ffb',
                              background: 'rgba(162, 89, 255, 0.1)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {/* Category Tabs */}
        <Paper sx={{ 
          p: isSmallScreen ? 1 : 2, 
          mb: 3, 
          mt: isSmallScreen ? 1 : 0,
          bgcolor: 'rgba(20, 20, 30, 0.7)', 
          border: '1px solid rgba(162, 89, 255, 0.3)', 
          borderRadius: 2,
          backdropFilter: 'blur(10px)'
        }}>
          <Tabs
            value={activeCategory}
            onChange={(e, newValue) => setActiveCategory(newValue)}
            variant="scrollable"
            scrollButtons={isSmallScreen ? true : "auto"}
            sx={{
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                minHeight: isSmallScreen ? 48 : 60,
                fontSize: isSmallScreen ? '0.8rem' : '1rem',
                px: isSmallScreen ? 1 : 2,
                minWidth: isSmallScreen ? 'auto' : 'auto',
                flexShrink: 0,
                '&.Mui-selected': { color: '#A259FF' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#A259FF' },
              // Make scroll buttons visible for mobile
              ...(isSmallScreen && {
                '& .MuiTabs-scrollButtons': {
                  color: '#A259FF',
                  width: 32,
                  height: 32,
                  display: 'flex !important',
                  visibility: 'visible !important',
                  opacity: 1,
                  '&.Mui-disabled': {
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }
              })
            }}
          >
            {/* All Vouchers tab */}
            <Tab 
              key="All Vouchers" 
              label={isSmallScreen ? "All" : "All Vouchers"} 
              value="All Vouchers"
              icon={isSmallScreen ? undefined : categoryIcons['All Vouchers']}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  fontSize: isSmallScreen ? '1rem' : '1.2rem'
                }
              }}
            />
            {(voucherCategories.length > 0 ? voucherCategories : [
              { name: 'Dining' },
              { name: 'Shopping' },
              { name: 'Entertainment' },
              { name: 'Travel' },
              { name: 'Health' },
              { name: 'Fashion' }
            ]).map(category => (
              <Tab 
                key={category.name} 
                label={isSmallScreen ? category.name.split(' ')[0] : category.name} 
                value={category.name}
                icon={isSmallScreen ? undefined : (categoryIcons[category.name] || <LocalOfferIcon />)}
                iconPosition="start"
                sx={{
                  '& .MuiTab-iconWrapper': {
                    fontSize: isSmallScreen ? '1rem' : '1.2rem'
                  }
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Stats Section */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: isSmallScreen ? 2 : 3,
          mb: 4
        }}>
          <Box>
            <Paper sx={{ 
              p: isSmallScreen ? 2 : 3, 
              textAlign: 'center', 
              bgcolor: 'rgba(20, 20, 30, 0.7)', 
              border: '1px solid rgba(162, 89, 255, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <LoyaltyIcon sx={{ fontSize: isSmallScreen ? 30 : 40, color: '#A259FF', mb: 1 }} />
              <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold' }}>
                {userPoints.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? '0.8rem' : '1rem' }}>
                Available Points
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ 
              p: isSmallScreen ? 2 : 3, 
              textAlign: 'center', 
              bgcolor: 'rgba(20, 20, 30, 0.7)', 
              border: '1px solid rgba(162, 89, 255, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <LocalOfferIcon sx={{ fontSize: isSmallScreen ? 30 : 40, color: '#A259FF', mb: 1 }} />
              <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold' }}>
                {vouchers.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? '0.8rem' : '1rem' }}>
                Available Vouchers
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ 
              p: isSmallScreen ? 2 : 3, 
              textAlign: 'center', 
              bgcolor: 'rgba(20, 20, 30, 0.7)', 
              border: '1px solid rgba(162, 89, 255, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <FavoriteIcon sx={{ fontSize: isSmallScreen ? 30 : 40, color: '#A259FF', mb: 1 }} />
              <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold' }}>
                98%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? '0.8rem' : '1rem' }}>
                Customer Satisfaction
              </Typography>
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ 
              p: isSmallScreen ? 2 : 3, 
              textAlign: 'center', 
              bgcolor: 'rgba(20, 20, 30, 0.7)', 
              border: '1px solid rgba(162, 89, 255, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}>
              <TrendingUpIcon sx={{ fontSize: isSmallScreen ? 30 : 40, color: '#A259FF', mb: 1 }} />
              <Typography variant={isSmallScreen ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold' }}>
                12K+
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isSmallScreen ? '0.8rem' : '1rem' }}>
                Monthly Redemptions
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Voucher Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          {filteredVouchers.map((voucher, index) => (
            <Box 
              key={voucher.id}
              sx={{
                ...createStaggerAnimation(index * 0.1),
                ...animationPresets.cardHover,
                ...microInteractions.hoverLift
              }}
            >
              <Card sx={{ 
                bgcolor: 'rgba(20, 20, 30, 0.7)', 
                border: '1px solid rgba(162, 89, 255, 0.3)', 
                borderRadius: 2, 
                transition: 'all 0.3s ease', 
                backdropFilter: 'blur(10px)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 10px 20px rgba(162, 89, 255, 0.2)', 
                  borderColor: 'rgba(162, 89, 255, 0.5)' 
                } 
              }}>
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  <Box 
                    component="img" 
                    src={voucher.image_url} 
                    alt={voucher.title} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60';
                    }}
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      backgroundColor: 'rgba(162, 89, 255, 0.1)'
                    }} 
                  />
                  <Chip label={voucher.category} size="small" sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    left: 10, 
                    bgcolor: 'rgba(162, 89, 255, 0.8)', 
                    color: 'white',
                    fontWeight: 600
                  }} />
                  <Chip label={voucher.discount} size="small" sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    bgcolor: 'rgba(255, 215, 0, 0.9)', 
                    color: '#1a1a2e',
                    fontWeight: 600
                  }} />
                  {voucher.featured && (
                    <Chip label="FEATURED" size="small" sx={{ 
                      position: 'absolute', 
                      bottom: 10, 
                      left: 10, 
                      bgcolor: '#ff6b6b', 
                      color: 'white',
                      fontWeight: 600
                    }} />
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>{voucher.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, flexGrow: 1 }}>
                    {voucher.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="body1" sx={{ color: '#A259FF', fontWeight: 'bold' }}>{voucher.points} pts</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textDecoration: 'line-through' }}>
                        {voucher.original_points} pts
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ color: '#FFD700', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{voucher.rating}</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    gap: 1 
                  }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleTermsOpen(voucher)}
                      sx={{
                        color: '#A259FF',
                        borderColor: '#A259FF',
                        '&:hover': { borderColor: '#8a3ffb', backgroundColor: 'rgba(162, 89, 255, 0.1)' },
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        py: isMobile ? 1.5 : 1
                      }}
                    >
                      View Terms
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleAddToCart(voucher)}
                      sx={{
                        background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                        '&:hover': { background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)' },
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        py: isMobile ? 1.5 : 1
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant={isMobile ? "outlined" : "text"}
                    onClick={() => handleRedeemNow(voucher)}
                    disabled={userPoints < voucher.points}
                    sx={{
                      mt: 1,
                      color: userPoints >= voucher.points ? '#A259FF' : 'rgba(255, 255, 255, 0.3)',
                      borderColor: isMobile && userPoints >= voucher.points ? '#A259FF' : 'transparent',
                      '&:hover': { 
                        backgroundColor: userPoints >= voucher.points ? 'rgba(162, 89, 255, 0.1)' : 'transparent',
                        borderColor: isMobile && userPoints >= voucher.points ? '#8a3ffb' : 'transparent'
                      },
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      py: isMobile ? 1.5 : 1
                    }}
                  >
                    {userPoints >= voucher.points ? 'Redeem Now' : 'Not Enough Points'}
                  </Button>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {filteredVouchers.length === 0 && (
          <Paper sx={{ 
            p: 4, 
            mt: 3, 
            bgcolor: 'rgba(20, 20, 30, 0.7)', 
            border: '1px solid rgba(162, 89, 255, 0.3)', 
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              No vouchers found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Try adjusting your search or filter criteria
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Terms and Conditions Dialog */}
      <Dialog open={termsDialogOpen} onClose={handleTermsClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0A0A14', color: 'white' }}>
          Terms and Conditions - {selectedVoucher?.title}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#0A0A14', color: 'white' }}>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {selectedVoucher?.terms}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            Quantity Available: {selectedVoucher?.quantity_available}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: '#A259FF', fontWeight: 'bold' }}>
            Cost: {selectedVoucher?.points} points
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0A0A14' }}>
          <Button onClick={handleTermsClose} sx={{ color: '#A259FF' }}>
            Close
          </Button>
          <Button 
            onClick={() => {
              selectedVoucher && handleAddToCart(selectedVoucher);
              handleTermsClose();
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
              '&:hover': { background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)' },
            }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Snackbar-like UI */}
      <Snackbar
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null}
      >
        <Paper sx={{
          bgcolor: '#0A0A14',
          color: 'white',
          border: '1px solid #A259FF',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body1">Are you sure you want to log out?</Typography>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setLogoutConfirmOpen(false)}
              sx={{ color: '#A259FF', borderColor: '#A259FF' }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => { 
                setLogoutConfirmOpen(false); 
                if (onLogout) {
                  onLogout();
                } else {
                  // Fallback: clear tokens and show message
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('userName');
                  localStorage.removeItem('userEmail');
                  localStorage.removeItem('biometricEnabled');
                  localStorage.removeItem('biometricCredId');
                  setSnackbarMessage('Logged out successfully'); 
                  setSnackbarOpen(true);
                }
              }}
              sx={{ background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)' }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Snackbar>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          sx={{ 
            width: '100%',
            bgcolor: '#0A0A14',
            color: 'white',
            border: '1px solid #A259FF',
            '& .MuiAlert-icon': { color: '#A259FF' }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>


      {/* Mini-Games Dialog */}
      <MiniGames
        open={miniGamesOpen}
        onClose={() => setMiniGamesOpen(false)}
        onGameComplete={() => {}}
        onShowSnackbar={onShowSnackbar}
      />

      {/* Leaderboard Dialog */}
      <Leaderboard
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        onShowSnackbar={onShowSnackbar}
      />

      {/* Edit Profile Dialog */}
      <EditProfilePage
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onShowSnackbar={onShowSnackbar}
      />
    </Box>
  );
};

export default HomePage;