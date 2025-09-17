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
} from "@mui/material";
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
  onLogin: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSwitchToSignUp: () => void;
  onGoogleSignIn: (credentialResponse: CredentialResponse) => void;
  onBiometricSignIn: () => Promise<boolean>;
  onRequestOtp: (email: string) => Promise<void>;
  onVerifyOtp: (email: string, otp: string) => Promise<void>;
};

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
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const mobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    setIsMobileDevice(mobile);

    // Check WebAuthn support
    const webauthnSupported = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    setBiometricSupported(webauthnSupported);
  }, []);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Initial usage data for the line chart
  const [usageData, setUsageData] = useState<UsageData[]>([
    { month: "Jan", users: 65 },
    { month: "Feb", users: 72 },
    { month: "Mar", users: 68 },
    { month: "Apr", users: 75 },
    { month: "May", users: 80 },
    { month: "Jun", users: 85 },
  ]);

  useEffect(() => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const interval = setInterval(() => {
      setUsageData((prevData) => {
        const nextIndex = prevData.length;
        const nextMonth = monthNames[nextIndex % 12];
        const lastValue = prevData[prevData.length - 1]?.users ?? 50;
        const nextValue = Math.max(0, lastValue + (Math.floor(Math.random() * 11) - 3));

        const updated = [...prevData, { month: nextMonth, users: nextValue }];
        if (updated.length > 12) updated.shift();
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
      navigate("/main", { state: { showSnackbar: true } });
    } catch (err) {
      console.error(err);
      alert("Invalid OTP, try again!");
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await onBiometricSignIn();
      if (success) {
        navigate("/main", { state: { showSnackbar: true } });
      } else {
        alert("Biometric authentication failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Biometric authentication error");
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
              Track monthly active user growth on our responsive web platform
            </Typography>
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
                  await onLogin(e);
                  // 2️⃣ Request OTP after login success
                  await handleOtpRequest();
                } catch (error: any) {
                  alert(error?.message || "Login failed. Please check your credentials.");
                }
              }}
            >
              <Stack spacing={2}>
                <TextField
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
                            sx={{ color: "#A259FF" }}
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
        <DialogTitle>Enter OTP</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="One-Time Password" type="text" fullWidth value={otp} onChange={(e) => setOtp(e.target.value)} />
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