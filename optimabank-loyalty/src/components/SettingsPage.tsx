import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  Button,
  Divider,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  AccountCircle as AccountCircleIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { userApi, UserProfile, leaderboardApi } from '../services/api';
import { applyTheme } from '../utils/theme';

interface SettingsPageProps {
  onBack?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Settings states
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    voucherExpiryAlerts: true,
    cartReminders: true,
    
    // Privacy Settings
    profileVisibility: 'private',
    showPoints: true,
    allowFriendRequests: false,
    
    // App Settings
    theme: 'light',
    language: 'en',
    currency: 'USD',
    autoRefresh: true,
    compactView: false,
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30
  });

  // Profile edit states
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Password change states
  const [changePassword, setChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    try {
      const profile = await userApi.getProfile();
      setUserProfile(profile);
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: '' // Phone number not available in current API response
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showSnackbar('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    // Apply theme immediately when changed
    if (setting === 'theme') {
      applyTheme(value as any);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Persist locally
      localStorage.setItem('userSettings', JSON.stringify(settings));
      // Update leaderboard privacy based on profileVisibility
      try {
        await leaderboardApi.updatePrivacy(settings.profileVisibility === 'public');
      } catch (e) {
        console.warn('Privacy update failed:', e);
      }
      showSnackbar('Settings saved successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      // In a real app, you'd update the profile via API
      showSnackbar('Profile updated successfully!', 'success');
      setEditProfile(false);
      await loadUserProfile();
    } catch (error) {
      showSnackbar('Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async () => {
    // Send reset link to user's email
    try {
      const email = profileData.email;
      if (!email) {
        showSnackbar('No email found on profile', 'error');
        return;
      }
      await userApi.requestPasswordReset(email);
      showSnackbar('Password reset link sent to your email', 'success');
      setChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to send password reset link', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.');
    if (!confirmDelete) return;
    try {
      await userApi.deleteAccount();
      // Clear auth and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      showSnackbar('Account deleted successfully', 'success');
      navigate('/login');
    } catch (e: any) {
      showSnackbar(e.message || 'Failed to delete account', 'error');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)' }}>
        <Typography sx={{ color: 'white' }}>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ bgcolor: '#A259FF' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <SettingsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Profile Section */}
        <Card sx={{ mb: 3, bgcolor: 'rgba(20, 20, 30, 0.7)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: '#A259FF',
                mr: 2
              }}>
                <AccountCircleIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {profileData.firstName} {profileData.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.email}
                </Typography>
                <Chip 
                  label={`${userProfile?.points || 0} Points`} 
                  size="small" 
                  sx={{ mt: 1, bgcolor: '#A259FF', color: 'white' }}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditProfile(true)}
                sx={{ ml: 'auto', borderColor: '#A259FF', color: '#A259FF' }}
              >
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card sx={{ mb: 3, bgcolor: 'rgba(20, 20, 30, 0.7)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1, color: '#A259FF' }} />
              Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ 
              '& .MuiListItemText-primary': { color: 'white', fontWeight: 500 },
              '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
            }}>
              <ListItem>
                <ListItemText 
                  primary="Email Notifications" 
                  secondary="Receive updates via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Push Notifications" 
                  secondary="Receive push notifications on your device"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="SMS Notifications" 
                  secondary="Receive updates via SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Marketing Emails" 
                  secondary="Receive promotional offers and updates"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.marketingEmails}
                    onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Voucher Expiry Alerts" 
                  secondary="Get notified before vouchers expire"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.voucherExpiryAlerts}
                    onChange={(e) => handleSettingChange('voucherExpiryAlerts', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Cart Reminders" 
                  secondary="Get reminded about items in your cart"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.cartReminders}
                    onChange={(e) => handleSettingChange('cartReminders', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card sx={{ mb: 3, bgcolor: 'rgba(20, 20, 30, 0.7)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1, color: '#A259FF' }} />
              Privacy & Security
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ 
              '& .MuiListItemText-primary': { color: 'white', fontWeight: 500 },
              '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
            }}>
              <ListItem>
                <ListItemText 
                  primary="Profile Visibility" 
                  secondary="Control who can see your profile"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.profileVisibility}
                      onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                      <MenuItem value="friends">Friends Only</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Show Points" 
                  secondary="Display your points publicly"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.showPoints}
                    onChange={(e) => handleSettingChange('showPoints', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Two-Factor Authentication" 
                  secondary="Add an extra layer of security"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Login Alerts" 
                  secondary="Get notified of new login attempts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.loginAlerts}
                    onChange={(e) => handleSettingChange('loginAlerts', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card sx={{ mb: 3, bgcolor: 'rgba(20, 20, 30, 0.7)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PaletteIcon sx={{ mr: 1, color: '#A259FF' }} />
              App Preferences
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ 
              '& .MuiListItemText-primary': { color: 'white', fontWeight: 500 },
              '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
            }}>
              <ListItem>
                <ListItemText 
                  primary="Theme" 
                  secondary="Choose your preferred theme"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Language" 
                  secondary="Select your preferred language"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                      <MenuItem value="de">German</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Currency" 
                  secondary="Display prices in your preferred currency"
                />
                <ListItemSecondaryAction>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={settings.currency}
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="CAD">CAD (C$)</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Auto Refresh" 
                  secondary="Automatically refresh data"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Compact View" 
                  secondary="Use compact layout for better performance"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.compactView}
                    onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card sx={{ mb: 3, bgcolor: 'rgba(20, 20, 30, 0.7)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <StorageIcon sx={{ mr: 1, color: '#A259FF' }} />
              Account Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ 
              '& .MuiListItemText-primary': { color: '#E0E0E0', fontWeight: 600 },
              '& .MuiListItemText-secondary': { color: '#B0B0B0' }
            }}>
              <ListItem component="button" onClick={() => setChangePassword(true)} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(162, 89, 255, 0.1)' } }}>
                <ListItemIcon>
                  <SecurityIcon sx={{ color: '#A259FF' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Change Password" 
                  secondary="Update your account password"
                />
              </ListItem>
              
              <ListItem component="button" onClick={handleDeleteAccount} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255, 68, 68, 0.1)' } }}>
                <ListItemIcon>
                  <DeleteIcon sx={{ color: '#ff4444' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Delete Account" 
                  secondary="Permanently delete your account"
                  sx={{ 
                    '& .MuiListItemText-primary': { color: '#FF6B6B', fontWeight: 600 }
                  }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            sx={{
              bgcolor: '#A259FF',
              '&:hover': { bgcolor: '#8B4FDB' },
              px: 4,
              py: 1.5
            }}
          >
            Save Settings
          </Button>
        </Box>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfile} onClose={() => setEditProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0A0A14', color: 'white' }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ bgcolor: '#0A0A14', color: 'white' }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0A0A14' }}>
          <Button onClick={() => setEditProfile(false)} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" sx={{ bgcolor: '#A259FF' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePassword} onClose={() => setChangePassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0A0A14', color: 'white' }}>Change Password</DialogTitle>
        <DialogContent sx={{ bgcolor: '#0A0A14', color: 'white' }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}>
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}>
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}>
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#0A0A14' }}>
          <Button onClick={() => setChangePassword(false)} sx={{ color: 'white' }}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" sx={{ bgcolor: '#A259FF' }}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
