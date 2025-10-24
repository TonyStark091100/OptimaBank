import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
 
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import illustration from "../illustration.png";
import logo from "../logo.png";

type SignUpPageProps = {
  onSignUp: (formData: any, skipNavigation?: boolean) => void;
  onSwitchToLogin: () => void;
  onGoogleSignUp: (credentialResponse: CredentialResponse) => void;
  onEnableBiometric: () => void;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, otp: string, skipNavigation?: boolean) => Promise<void>;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
};

const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignUp,
  onSwitchToLogin,
  onGoogleSignUp,
  onEnableBiometric,
  onRequestOtp,
  onVerifyOtp,
  onShowSnackbar,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [formData, setFormData] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Request OTP - First create user, then send OTP
  const handleRequestOtpHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.phone || !formData.password) {
      onShowSnackbar("Please fill in all required fields", 'warning');
      return;
    }
    
    try {
      // First create the user account (skip navigation)
      await onSignUp(formData, true);
      
      // Then request OTP for the newly created user
      await onRequestOtp(formData.email);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      onShowSnackbar(`Failed to create account or send OTP: ${err.message || 'Please try again'}`, 'error');
    }
  };

  // Verify OTP → Complete signup process
  const handleVerifyOtpHandler = async () => {
    try {
      if (!formData.email || !formData.password) {
        onShowSnackbar("Email and password are required", 'warning');
        return;
      }
      
      // Verify the OTP (skip navigation, we'll handle it ourselves)
      await onVerifyOtp(formData.email, otp, true);

      // After OTP verification, login the user using authApi
      try {
        // Import authApi (it should be available from the parent)
        const { authApi } = await import('../services/api');
        
        // Use the proper login API
        await authApi.login(formData.email, formData.password);
        
        // Tokens are already stored by authApi.login
        console.log("Login successful after OTP verification");
        
        // Verify tokens are stored
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          console.error('No access token found after login');
          onShowSnackbar("Login failed - no access token. Please try again.", 'error');
          return;
        }
        
        console.log('Tokens verified after signup login');
      } catch (loginErr) {
        console.error("Login error after OTP verification:", loginErr);
        onShowSnackbar("Login failed after OTP verification. Please try again.", 'error');
        return;
      }

      // Navigate to main page - biometric popup will be handled by App.tsx after OTP verification
      navigate("/main");
    } catch (err) {
      console.error(err);
      onShowSnackbar("Invalid OTP, try again!", 'error');
    }
  };

  


  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
        display: "flex",
        width: "100%",
        maxWidth: 1000,
        minHeight: 600,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(162, 89, 255, 0.2)",
        }}
      >
        {/* Left Pane - Hidden on small screens */}
        {!isSmallScreen && (
          <Box
            sx={{
              width: "50%",
              background: "linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              flexDirection: "column",
              textAlign: "center",
            }}
          >
            <Box
              component="img"
              src={illustration}
              alt="Optima Reward"
              sx={{
                width: "100%",
                maxWidth: 320,
                mb: 3,
              }}
            />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Welcome to Optima Rewards
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 400, color: "#CCCCDD" }}>
              Unlock exclusive benefits, earn rewards, and enjoy a smarter banking
              experience with Optima Bank. Join us today and start your journey
              towards better financial freedom.
            </Typography>
          </Box>
        )}

        {/* Right Pane */}
        <Box
          sx={{
            width: isSmallScreen ? "100%" : "50%",
            backgroundColor: "#181824",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: isSmallScreen ? 2 : 4,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              background: "rgba(34,34,50,0.98)",
              color: "white",
              width: "100%",
              maxWidth: 400,
              position: "relative",
              textAlign: "center",
              boxShadow: "0 8px 32px 0 rgba(162,89,255,0.25)",
            }}
          >
            {/* Back + Help buttons */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  color: "#A259FF",
                  backgroundColor: "rgba(162, 89, 255, 0.1)",
                  "&:hover": { backgroundColor: "rgba(162, 89, 255, 0.2)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate("/help")}
                sx={{
                  color: "#A259FF",
                  backgroundColor: "rgba(162, 89, 255, 0.1)",
                  "&:hover": { backgroundColor: "rgba(162, 89, 255, 0.2)" },
                }}
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>

            {/* Logo */}
            <Box sx={{ mt: 3, mb: 2, display: "flex", justifyContent: "center" }}>
              <Box
                component="img"
                src={logo}
                alt="Optima Logo"
                sx={{
                  width: 70,
                  height: 70,
                  background: "radial-gradient(circle at 50% 50%, #A259FF 60%, transparent 100%)",
                  borderRadius: "50%",
                  p: 1,
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Create Your Account
            </Typography>

            {/* Google Sign-Up */}
            <Stack direction="column" spacing={2}>
              <GoogleLogin
                onSuccess={(credentialResponse: CredentialResponse) => {
                  console.log("Google credential:", credentialResponse);
                  onGoogleSignUp(credentialResponse);
                }}
                onError={() => {
                  console.log("Google login failed");
                  onShowSnackbar("Google login failed", 'error');
                }}
              />
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: "#bbb" }}>
                or
              </Typography>
            </Divider>

            {/* Sign Up Form */}
            <Box component="form" onSubmit={handleRequestOtpHandler}>
              <Stack spacing={2}>
                <TextField 
                  name="firstName" 
                  label="First Name" 
                  value={formData.firstName || ''}
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small" 
                />
                <TextField 
                  name="lastName" 
                  label="Last Name" 
                  value={formData.lastName || ''}
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small" 
                />
                <TextField 
                  name="email" 
                  label="Email Address" 
                  type="email" 
                  value={formData.email || ''}
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small" 
                />
                <TextField 
                  name="phone" 
                  label="Phone Number" 
                  type="tel" 
                  value={formData.phone || ''}
                  onChange={handleChange} 
                  fullWidth 
                  required 
                  size="small" 
                />
                <TextField
                  name="password"
                  label="Create Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword} edge="end" sx={{ color: "#A259FF" }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    mt: 2,
                    py: 1,
                    fontWeight: 600,
                    borderRadius: 3,
                    backgroundColor: "#A259FF",
                    "&:hover": { backgroundColor: "#8a3ffb" },
                  }}
                >
                  Create Account & Send OTP
                </Button>
              </Stack>
            </Box>

            {/* Switch to login */}
            <Typography variant="body2" sx={{ mt: 3, color: "#aaa" }}>
              Already have an account?
              <Button
                onClick={onSwitchToLogin}
                sx={{
                  ml: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#A259FF",
                  "&:hover": { backgroundColor: "transparent", color: "#8a3ffb" },
                }}
              >
                Login Here
              </Button>
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* OTP Prompt */}
      {otpSent && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center", width: 400, backgroundColor: "rgba(34,34,50,0.98)", color: "white" }}>
            <Typography variant="h6" gutterBottom>
              Verify Your Account
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "rgba(255, 255, 255, 0.7)" }}>
              Enter the 6-digit OTP sent to {formData.email}
            </Typography>
            <TextField
              label="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
              sx={{ input: { color: "white" }, mb: 3 }}
            />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" sx={{ backgroundColor: "#A259FF" }} onClick={handleVerifyOtpHandler}>
                Verify
              </Button>
              <Button variant="outlined" sx={{ borderColor: "#A259FF", color: "#A259FF" }} onClick={() => setOtpSent(false)}>
                Cancel
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}

    </Box>
  );
};

export default SignUpPage;