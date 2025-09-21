import React, { useState, useEffect } from "react";
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
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from "@mui/material";
import { analyticsApi, RealtimeChartData, RealtimeMetrics, LiveUserCount } from '../services/api';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import logo from "../logo.png";

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToSignUp: () => void;
  onGoogleSignIn: (credentialResponse: CredentialResponse) => void;
  onBiometricSignIn: () => Promise<boolean>;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, otp: string, skipNavigation?: boolean) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UsageData {
  month: string;
  users: number;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onSwitchToSignUp,
  onGoogleSignIn,
  onBiometricSignIn,
  onRequestOtp,
  onVerifyOtp,
}) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP popup states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");

  // Check if device is mobile and supports biometric authentication
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    // Detect mobile device with more comprehensive detection
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const mobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Additional check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Consider it mobile if it matches mobile user agent OR has touch capability
    const isMobile = mobile || (hasTouch && window.innerWidth <= 768);
    setIsMobileDevice(isMobile);

    // Check WebAuthn support
    const webauthnSupported = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    setBiometricSupported(webauthnSupported);
    
    // Log for debugging
    console.log('Device Detection:', {
      userAgent,
      mobile,
      hasTouch,
      isMobile,
      webauthnSupported,
      screenWidth: window.innerWidth
    });
  }, []);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Real-time analytics data
  const [realtimeData, setRealtimeData] = useState<RealtimeChartData[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [liveUserCount, setLiveUserCount] = useState<LiveUserCount | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Fetch real-time analytics data
  const fetchRealtimeAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analyticsData = await analyticsApi.getRealtimeAnalytics();
      setRealtimeData(analyticsData.chart_data);
      setRealtimeMetrics(analyticsData.metrics);
      setAnalyticsError(null);
    } catch (error: any) {
      console.error('Failed to fetch real-time analytics:', error);
      setAnalyticsError(error.message);
      // Fallback to mock data
      setRealtimeData([
        { hour: "09:00", users: 45, timestamp: new Date().toISOString() },
        { hour: "10:00", users: 52, timestamp: new Date().toISOString() },
        { hour: "11:00", users: 48, timestamp: new Date().toISOString() },
        { hour: "12:00", users: 61, timestamp: new Date().toISOString() },
        { hour: "13:00", users: 58, timestamp: new Date().toISOString() },
        { hour: "14:00", users: 55, timestamp: new Date().toISOString() },
      ]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch live user count
  const fetchLiveUserCount = async () => {
    try {
      const userCount = await analyticsApi.getLiveUserCount();
      setLiveUserCount(userCount);
    } catch (error: any) {
      console.error('Failed to fetch live user count:', error);
      // Fallback to mock data
      setLiveUserCount({
        active_users: 25,
        total_users: 150,
        online_users: 18,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Set up real-time data fetching
  useEffect(() => {
    // Initial fetch
    fetchRealtimeAnalytics();
    fetchLiveUserCount();

    // Set up intervals for real-time updates
    const analyticsInterval = setInterval(fetchRealtimeAnalytics, 10000); // Every 10 seconds
    const userCountInterval = setInterval(fetchLiveUserCount, 5000); // Every 5 seconds

    return () => {
      clearInterval(analyticsInterval);
      clearInterval(userCountInterval);
    };
  }, []);

  // Convert real-time data to chart format
  const usageData = realtimeData.map(data => ({
    month: data.hour,
    users: data.users
  }));

  // ✅ handle OTP using props from App.tsx
  const handleOtpRequest = async () => {
    if (!email) return alert("Please enter your email first");
    try {
      await onRequestOtp(email);
      setOtpDialogOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP");
    }
  };

  const handleOtpVerify = async () => {
    try {
      await onVerifyOtp(email, otp);
      setOtpDialogOpen(false);
      // Navigation will be handled by the verifyOtp function
    } catch (err) {
      console.error(err);
      alert("Invalid OTP, try again!");
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Check if biometric is enabled
      const enabled = localStorage.getItem("biometricEnabled") === "true";
      if (!enabled) {
        alert("Biometric authentication is not enabled. Please enable it during signup or contact support.");
        return;
      }

      const success = await onBiometricSignIn();
      if (success) {
        navigate("/main", { state: { showSnackbar: true } });
      } else {
        alert("Biometric authentication failed. Please try again or use your password.");
      }
    } catch (err: any) {
      console.error('Biometric login error:', err);
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        alert("Biometric authentication was cancelled or not allowed. Please try again.");
      } else if (err.name === 'NotSupportedError') {
        alert("Biometric authentication is not supported on this device.");
      } else if (err.name === 'SecurityError') {
        alert("Security error during biometric authentication. Please try again.");
      } else {
        alert(`Biometric authentication error: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%", background: "linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)", justifyContent: "center", alignItems: "center", p: 2 }}>
      <Box sx={{ display: "flex", width: "100%", maxWidth: 1000, minHeight: 600, borderRadius: 2, overflow: "hidden", boxShadow: "0 10px 40px rgba(162, 89, 255, 0.2)" }}>
        {/* Left Pane - Chart */}
        {!isSmallScreen && (
          <Box sx={{ width: "50%", background: "linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)", display: "flex", alignItems: "center", justifyContent: "center", p: 4, flexDirection: "column", textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: "white", mb: 3 }}>
              Optima Reward Usage
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "#CCCCDD", maxWidth: 400 }}>
              Track real-time user activity and platform metrics
            </Typography>
            
            {/* Real-time Metrics Display */}
            {liveUserCount && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Card sx={{ 
                  background: 'rgba(162, 89, 255, 0.1)', 
                  border: '1px solid rgba(162, 89, 255, 0.3)',
                  minWidth: 120
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#A259FF', fontWeight: 'bold' }}>
                      {liveUserCount.online_users}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Online Now
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ 
                  background: 'rgba(0, 255, 0, 0.1)', 
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  minWidth: 120
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#00FF00', fontWeight: 'bold' }}>
                      {liveUserCount.active_users}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Active Today
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ 
                  background: 'rgba(255, 215, 0, 0.1)', 
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  minWidth: 120
                }}>
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                      {liveUserCount.total_users}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Total Users
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Tier Distribution */}
            {realtimeMetrics && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  Tier Distribution
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(realtimeMetrics.tier_distribution).map(([tier, count]) => (
                    <Chip
                      key={tier}
                      label={`${tier.charAt(0).toUpperCase() + tier.slice(1)}: ${count}`}
                      size="small"
                      sx={{
                        backgroundColor: tier === 'bronze' ? 'rgba(205, 127, 50, 0.2)' :
                                        tier === 'silver' ? 'rgba(192, 192, 192, 0.2)' :
                                        tier === 'gold' ? 'rgba(255, 215, 0, 0.2)' :
                                        'rgba(229, 228, 226, 0.2)',
                        color: 'white',
                        border: `1px solid ${
                          tier === 'bronze' ? 'rgba(205, 127, 50, 0.3)' :
                          tier === 'silver' ? 'rgba(192, 192, 192, 0.3)' :
                          tier === 'gold' ? 'rgba(255, 215, 0, 0.3)' :
                          'rgba(229, 228, 226, 0.3)'
                        }`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Loading indicator */}
            {analyticsLoading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#A259FF',
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Updating real-time data...
                </Typography>
              </Box>
            )}

            {/* Error indicator */}
            {analyticsError && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                  ⚠️ Using fallback data: {analyticsError}
                </Typography>
              </Box>
            )}

            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#CCCCDD" />
                  <YAxis stroke="#CCCCDD" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#A259FF" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, color: "#AAAACC", maxWidth: 400 }}>
              Monthly usage trend continues to rise, showing consistent engagement with Optima Rewards.
            </Typography>
          </Box>
        )}

        {/* Right Pane - Login Form */}
        <Box sx={{ width: isSmallScreen ? "100%" : "50%", backgroundColor: "#181824", display: "flex", alignItems: "center", justifyContent: "center", p: isSmallScreen ? 2 : 4 }}>
          <Paper elevation={6} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4, background: "rgba(34,34,50,0.98)", color: "white", width: "100%", maxWidth: 400, position: "relative", textAlign: "center", boxShadow: "0 8px 32px 0 rgba(162,89,255,0.25)" }}>
            {/* Back + Help buttons */}
            <Box sx={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
              <IconButton onClick={() => navigate(-1)} sx={{ color: "#A259FF", backgroundColor: "rgba(162, 89, 255, 0.1)", "&:hover": { backgroundColor: "rgba(162, 89, 255, 0.2)" } }}>
                <ArrowBackIcon />
              </IconButton>
              <IconButton onClick={() => navigate("/help")} sx={{ color: "#A259FF", backgroundColor: "rgba(162, 89, 255, 0.1)", "&:hover": { backgroundColor: "rgba(162, 89, 255, 0.2)" } }}>
                <HelpOutlineIcon />
              </IconButton>
            </Box>

            {/* Logo */}
            <Box sx={{ mt: 3, mb: 2, display: "flex", justifyContent: "center" }}>
              <Box component="img" src={logo} alt="Optima Bank" sx={{ width: 70, height: 70, objectFit: "contain", background: "radial-gradient(circle at 50% 50%, #A259FF 60%, transparent 100%)", borderRadius: "50%", p: 1 }} />
            </Box>

            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Welcome Back!
            </Typography>

            {/* Google OAuth */}
            <Stack direction="column" spacing={2}>
              <GoogleLogin
                onSuccess={onGoogleSignIn}
                onError={() => { alert("Google login failed"); }}
                useOneTap
              />
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: "#bbb" }}>or</Typography>
            </Divider>

            {/* Email + Password Form */}
            <Box
              component="form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // 1️⃣ First attempt login
                  await onLogin(email, password);
                  // 2️⃣ Request OTP after login success
                  await handleOtpRequest();
                } catch (error: any) {
                  alert(error?.message || "Login failed. Please check your credentials.");
                }
              }}
            >
              <Stack spacing={2}>
                <TextField
                  name="email"
                  label="Email Address *"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {/* Show biometric icon only on mobile devices with biometric support */}
                        {isMobileDevice && biometricSupported && (
                          <IconButton
                            onClick={handleBiometricLogin}
                            edge="end"
                            sx={{ 
                              color: "#A259FF",
                              backgroundColor: "rgba(162, 89, 255, 0.1)",
                              borderRadius: "50%",
                              "&:hover": {
                                backgroundColor: "rgba(162, 89, 255, 0.2)",
                              }
                            }}
                            title="Use biometric authentication"
                          >
                            <FingerprintIcon />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "#444" },
                      "&:hover fieldset": { borderColor: "#A259FF" },
                      "&.Mui-focused fieldset": { borderColor: "#A259FF" },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#bbb",
                      "&.Mui-focused": { color: "#A259FF" },
                    },
                  }}
                />
                <TextField
                  name="password"
                  label="Password *"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      "& fieldset": { borderColor: "#444" },
                      "&:hover fieldset": { borderColor: "#A259FF" },
                      "&.Mui-focused fieldset": { borderColor: "#A259FF" },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#bbb",
                      "&.Mui-focused": { color: "#A259FF" },
                    },
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ color: "#A259FF", "&.Mui-checked": { color: "#A259FF" } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: "#bbb" }}>Remember me</Typography>}
                  />
                  <Button
                    type="button"
                    sx={{ textTransform: "none", color: "#A259FF", fontWeight: 600, "&:hover": { backgroundColor: "transparent", color: "#8a3ffb" } }}
                  >
                    Forgot Password?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ mt: 2, py: 1, fontWeight: 600, borderRadius: 3, backgroundColor: "#A259FF", "&:hover": { backgroundColor: "#8a3ffb" } }}
                >
                  Login
                </Button>
              </Stack>
            </Box>

            <Typography variant="body2" sx={{ mt: 3, color: "#aaa" }}>
              Don't have an account?
              <Button
                onClick={onSwitchToSignUp}
                sx={{ ml: 1, textTransform: "none", fontWeight: 600, color: "#A259FF", "&:hover": { backgroundColor: "transparent", color: "#8a3ffb" } }}
              >
                Sign Up Here
              </Button>
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)}>
        <DialogTitle>Verify Your Login</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "rgba(0, 0, 0, 0.7)" }}>
            Enter the 6-digit OTP sent to {email}
          </Typography>
          <TextField 
            autoFocus 
            margin="dense" 
            label="One-Time Password" 
            type="text" 
            fullWidth 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleOtpVerify} variant="contained">Verify</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;