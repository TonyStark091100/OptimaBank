// src/components/EditProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Save as SaveIcon
} from '@mui/icons-material';

interface EditProfilePageProps {
  open?: boolean;
  onClose?: () => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ open = false, onClose, onShowSnackbar }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Load user data from API on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await fetch('http://127.0.0.1:8000/accounts/profile/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setUserData({
              firstName: profileData.first_name || '',
              lastName: profileData.last_name || '',
              email: profileData.email || '',
              phone: profileData.phone_number || '',
              address: profileData.address || ''
            });
          } else {
            // Fallback to localStorage if API fails
            const storedName = localStorage.getItem('userName') || '';
            const storedEmail = localStorage.getItem('userEmail') || '';
            
            const nameParts = storedName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            setUserData(prev => ({
              ...prev,
              firstName,
              lastName,
              email: storedEmail,
              phone: prev.phone || '',
              address: prev.address || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage
        const storedName = localStorage.getItem('userName') || '';
        const storedEmail = localStorage.getItem('userEmail') || '';
        
        const nameParts = storedName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setUserData(prev => ({
          ...prev,
          firstName,
          lastName,
          email: storedEmail,
          phone: prev.phone || '',
          address: prev.address || ''
        }));
      }
    };
    
    loadUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Update localStorage with the new user data
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      if (fullName) {
        localStorage.setItem('userName', fullName);
      }
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
      
      // Update backend user profile
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await fetch('http://127.0.0.1:8000/accounts/profile/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone_number: userData.phone,
              address: userData.address,
            }),
          });
          
          if (response.ok) {
            const updatedProfile = await response.json();
            console.log('Profile updated successfully:', updatedProfile);
          } else {
            console.warn('Failed to update profile on backend, but local changes saved');
          }
        }
      } catch (apiError) {
        console.warn('API update failed, but local changes saved:', apiError);
      }
      
      onShowSnackbar('Profile updated successfully!', 'success');
      if (onClose) onClose(); // Close dialog after save
    } catch (error) {
      console.error('Error saving user data:', error);
      onShowSnackbar('Error saving profile. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    if (onClose) onClose(); // Close dialog without saving
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          height: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountCircleIcon sx={{ color: '#A259FF' }} />
          <Typography variant="h5" component="h2">
            Edit Profile
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box
          sx={{
            background: '#0A0A14',
            color: 'white',
            fontFamily: '"Inter", "Roboto", sans-serif',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Main Content */}
          <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
            <Paper
              sx={{
                p: 3,
                bgcolor: 'rgba(20, 20, 30, 0.7)',
                border: '1px solid rgba(162, 89, 255, 0.3)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
          <Typography
            variant="h5"
            sx={{ color: 'white', fontWeight: 'bold', mb: 1, textAlign: 'center' }}
          >
            Edit Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center', 
              mb: 2,
              fontStyle: 'italic'
            }}
          >
            You can edit your name, phone number, and address. Email cannot be changed as it's used for authentication.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'rgba(162, 89, 255, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 60 }} />
            </Avatar>
          </Box>

          <Box 
            component="form" 
            sx={{ 
              mt: 2, 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 2,
              flexDirection: isSmallScreen ? 'column' : 'row'
            }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(162, 89, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(162, 89, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#A259FF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#A259FF',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(162, 89, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(162, 89, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#A259FF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-focused': {
                      color: '#A259FF',
                    },
                  },
                }}
              />
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={userData.email}
              disabled
              helperText="Email cannot be changed as it's used for account authentication"
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  '& fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.2)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  '&.Mui-focused': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.75rem',
                  mt: 1,
                },
              }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#A259FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#A259FF',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={userData.address}
              onChange={handleInputChange}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(162, 89, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#A259FF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#A259FF',
                  },
                },
              }}
            />

            <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)', mb: 2 }} />

            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: isSmallScreen ? 'center' : 'flex-end',
              flexDirection: isSmallScreen ? 'column' : 'row'
            }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{ 
                  color: '#A259FF', 
                  borderColor: '#A259FF', 
                  px: 4, 
                  py: 1,
                  width: isSmallScreen ? '100%' : 'auto'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                sx={{ 
                  px: 4, 
                  py: 1,
                  width: isSmallScreen ? '100%' : 'auto',
                  background: 'linear-gradient(45deg, #A259FF 30%, #8a3ffb 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #8a3ffb 30%, #A259FF 90%)',
                  }
                }}
              >
                Save Changes
              </Button>
            </Box>
            </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfilePage;
