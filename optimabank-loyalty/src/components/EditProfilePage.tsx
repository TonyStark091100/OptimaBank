// src/components/EditProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Avatar,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountCircleIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import logo from '../logo.png';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName') || '';
      const storedEmail = localStorage.getItem('userEmail') || '';
      
      // Parse the stored name to get first and last name
      const nameParts = storedName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setUserData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: storedEmail,
        phone: prev.phone || '+1 (555) 123-4567', // Keep default if not set
        address: prev.address || '123 Main Street, City, State 12345' // Keep default if not set
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      // Update localStorage with the new user data
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      if (fullName) {
        localStorage.setItem('userName', fullName);
      }
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
      
      // In real use-case, send updated data to API here
      alert('Profile updated successfully!');
      navigate(-1); // Go back after save
    } catch (error) {
      console.error('Error saving user data:', error);
      alert('Error saving profile. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back without saving
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0A0A14',
        color: 'white',
        overflow: 'hidden',
        fontFamily: '"Inter", "Roboto", sans-serif'
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{ bgcolor: '#0A0A14', boxShadow: '0 4px 20px rgba(162, 89, 255, 0.2)' }}
      >
        <Toolbar>
          <IconButton edge="start" sx={{ color: '#A259FF', mr: 2 }} onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src={logo}
              alt="Optima Logo"
              sx={{ width: 40, height: 40, mr: 2, objectFit: 'contain' }}
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
                fontSize: '1.5rem'
              }}
            >
              OPTIMA REWARDS
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 4,
            bgcolor: 'rgba(20, 20, 30, 0.7)',
            border: '1px solid rgba(162, 89, 255, 0.3)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Typography
            variant="h4"
            sx={{ color: 'white', fontWeight: 'bold', mb: 3, textAlign: 'center' }}
          >
            Edit Profile
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'rgba(162, 89, 255, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 80 }} />
            </Avatar>
          </Box>

          <Box component="form" sx={{ mt: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
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
              onChange={handleInputChange}
              sx={{ 
                mb: 3,
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
              label="Phone Number"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              sx={{ 
                mb: 3,
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
              rows={3}
              value={userData.address}
              onChange={handleInputChange}
              sx={{ 
                mb: 4,
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

            <Divider sx={{ bgcolor: 'rgba(162, 89, 255, 0.3)', mb: 3 }} />

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
      </Container>
    </Box>
  );
};

export default EditProfilePage;
