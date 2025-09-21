// src/components/HomePage.tsx
import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import {
  voucherApi, 
  userApi, 
  cartApi, 
  redemptionApi, 
  notificationApi,
  downloadPdf,
  downloadPdfBlob,
  Voucher,
  VoucherCategory,
  UserProfile,
  Cart,
  Notification
} from '../services/api';
import SettingsPage from './SettingsPage';
import TierProgress from './TierProgress';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountCircleIcon,
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

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

  const open = Boolean(anchorEl);
  const cartOpen = Boolean(cartAnchorEl);
  const notificationsOpen = Boolean(notificationsAnchorEl);

  // Load data from APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel
        const [vouchersData, categoriesData, profileData, cartData, notificationsData] = await Promise.all([
          voucherApi.getVouchers(),
          voucherApi.getCategories(),
          userApi.getProfile(),
          cartApi.getCart(),
          notificationApi.getNotifications()
        ]);

        setVouchers(vouchersData);
        setVoucherCategories(categoriesData);
        setUserProfile(profileData);
        setCart(cartData);
        setUserNotifications(notificationsData);

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
    navigate('/edit');
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
      const result = await redemptionApi.redeemVoucher(voucher.id, 1);
      
      // Check different possible response structures
      let redemptionId = null;
      
      if (result.redemptions && result.redemptions.length > 0) {
        redemptionId = result.redemptions[0].id;
      } else if (result.redemption_id) {
        redemptionId = result.redemption_id;
      } else {
        throw new Error('No redemption ID found in response');
      }
      
      if (redemptionId) {
        const filename = `${voucher.title.replace(/[^a-zA-Z0-9]/g, '_')}_voucher.pdf`;
        await downloadPdfBlob(redemptionId, filename);
      }
      
      setSnackbarMessage(`Successfully redeemed ${voucher.title}! PDF downloaded to your Downloads folder.`);
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
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to redeem voucher');
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
      
      // Download all PDFs using blob method
      if (result.redemptions && result.redemptions.length > 0) {
        for (let i = 0; i < result.redemptions.length; i++) {
          const redemption = result.redemptions[i];
          const filename = `${redemption.voucher_title.replace(/[^a-zA-Z0-9]/g, '_')}_voucher.pdf`;
          
          // Use redemption_id for cart checkout (different from single redemption)
          const redemptionId = redemption.redemption_id || redemption.id;
          
          // Add delay between downloads to prevent browser blocking
          setTimeout(async () => {
            try {
              await downloadPdfBlob(redemptionId, filename);
            } catch (error) {
              console.error(`Failed to download PDF for ${redemption.voucher_title}:`, error);
            }
          }, i * 500);
        }
      }
      
      setSnackbarMessage(`Successfully checked out cart! ${result.redemptions?.length || 0} PDFs downloaded to your Downloads folder.`);
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
            onClick={() => window.location.reload()}
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
        overflow: 'hidden',
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
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    sx={{ color: '#A259FF' }} 
                    onClick={handleCartMenuOpen}
                    size="small"
                  >
                    <Badge badgeContent={totalCartItems} color="error">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                  <IconButton 
                    sx={{ color: '#A259FF' }} 
                    onClick={handleNotificationsMenuOpen}
                    size="small"
                  >
                    <Badge badgeContent={unreadNotifications} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  <IconButton 
                    sx={{ color: '#A259FF' }} 
                    onClick={handleProfileMenuOpen}
                    size="small"
                  >
                    <Avatar sx={{ 
                      width: 28, 
                      height: 28, 
                      bgcolor: 'rgba(162, 89, 255, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }} src="https://via.placeholder.com/40">
                      <AccountCircleIcon />
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
                <IconButton sx={{ p: '10px', color: '#A259FF' }} aria-label="search">
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
            <IconButton sx={{ p: '10px', color: '#A259FF' }} aria-label="search">
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

          <Box sx={{ display: 'flex' }}>
            <IconButton 
              sx={{ color: '#A259FF', mx: 1 }} 
              onClick={handleCartMenuOpen}
            >
              <Badge badgeContent={totalCartItems} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            <IconButton 
              sx={{ color: '#A259FF', mx: 1 }} 
              onClick={handleNotificationsMenuOpen}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
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
                            {new Date(notification.created_at).toLocaleDateString()}
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
                <Typography variant="h6" sx={{ color: '#A259FF', mb: 2 }}>Your Cart</Typography>
                
                {cart?.items.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 3 }}>
                    Your cart is empty
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Tier Progress Component */}
        <TierProgress onTierUpgrade={(newTier) => {
          setSnackbarMessage(`🎉 Congratulations! You've been upgraded to ${newTier.tier_name.charAt(0).toUpperCase() + newTier.tier_name.slice(1)} tier!`);
          setSnackbarOpen(true);
        }} />
        
        {/* Hero Banner with New Arrivals */}
        <Paper sx={{ 
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
          backdropFilter: 'blur(5px)'
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
                  '&:hover': { background: 'linear-gradient(45deg, #9147e6 30%, #7a36d9 90%)' },
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

        {/* Category Tabs */}
        <Paper sx={{ 
          p: isSmallScreen ? 1 : 2, 
          mb: 3, 
          bgcolor: 'rgba(20, 20, 30, 0.7)', 
          border: '1px solid rgba(162, 89, 255, 0.3)', 
          borderRadius: 2,
          backdropFilter: 'blur(10px)'
        }}>
          <Tabs
            value={activeCategory}
            onChange={(e, newValue) => setActiveCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                minHeight: isSmallScreen ? 48 : 60,
                fontSize: isSmallScreen ? '0.8rem' : '1rem',
                px: isSmallScreen ? 1 : 2,
                '&.Mui-selected': { color: '#A259FF' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#A259FF' }
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
            {voucherCategories.map(category => (
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
          {filteredVouchers.map((voucher) => (
            <Box key={voucher.id}>
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
                  <Box component="img" src={voucher.image_url} alt={voucher.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleTermsOpen(voucher)}
                      sx={{
                        color: '#A259FF',
                        borderColor: '#A259FF',
                        '&:hover': { borderColor: '#8a3ffb', backgroundColor: 'rgba(162, 89, 255, 0.1)' },
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
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="text"
                    onClick={() => handleRedeemNow(voucher)}
                    disabled={userPoints < voucher.points}
                    sx={{
                      mt: 1,
                      color: userPoints >= voucher.points ? '#A259FF' : 'rgba(255, 255, 255, 0.3)',
                      '&:hover': { 
                        backgroundColor: userPoints >= voucher.points ? 'rgba(162, 89, 255, 0.1)' : 'transparent' 
                      },
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
              onClick={() => { setLogoutConfirmOpen(false); navigate('/login'); setSnackbarMessage('Logged out successfully'); setSnackbarOpen(true); }}
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
    </Box>
  );
};

export default HomePage;