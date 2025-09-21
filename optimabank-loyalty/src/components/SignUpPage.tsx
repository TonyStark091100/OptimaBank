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
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { isMobile, isTablet } from "react-device-detect";
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
};

const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignUp,
  onSwitchToLogin,
  onGoogleSignUp,
  onEnableBiometric,
  onRequestOtp,
  onVerifyOtp,
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

  // Snackbar for biometric question (stays until user chooses)
  const [biometricSnackbarOpen, setBiometricSnackbarOpen] = useState(false);

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
      alert("Please fill in all required fields");
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
      alert(`Failed to create account or send OTP: ${err.message || 'Please try again'}`);
    }
  };

  // Verify OTP → Complete signup process
  const handleVerifyOtpHandler = async () => {
    try {
      if (!formData.email || !formData.password) {
        alert("Email and password are required");
        return;
      }
      
      // Verify the OTP (skip navigation, we'll handle it ourselves)
      await onVerifyOtp(formData.email, otp, true);

      // After OTP verification, login the user
      try {
        const response = await fetch("http://localhost:8000/accounts/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password 
          }),
        });
        
        if (response.ok) {
          const loginData = await response.json();
          
          // Store tokens
          if (loginData.access) {
            localStorage.setItem('access_token', loginData.access);
          }
          if (loginData.refresh) {
            localStorage.setItem('refresh_token', loginData.refresh);
          }
          
          // Update user data from login response
          if (loginData.user) {
            localStorage.setItem('userName', `${loginData.user.first_name} ${loginData.user.last_name}`);
            localStorage.setItem('userEmail', loginData.user.email);
          }
          
          console.log("Login successful after OTP verification");
        } else {
          console.error("Login failed after OTP verification");
        }
      } catch (loginErr) {
        console.error("Login error after OTP verification:", loginErr);
      }

      // only ask if on mobile/tablet and user hasn't made a biometric decision before
      const alreadyDecided = localStorage.getItem("biometricChoiceMade") === "true";
      if ((isMobile || isTablet) && !alreadyDecided) {
        setBiometricSnackbarOpen(true); // will stay open until user presses Yes/No
      } else {
        navigate("/main");
      }
    } catch (err) {
      console.error(err);
      alert("Invalid OTP, try again!");
    }
  };

  // Helper: register biometric credential (frontend/demo)
  const registerBiometricClientSide = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("Biometric/WebAuthn not supported on this device/browser.");
        return false;
      }

      // NOTE: In production you SHOULD fetch these options from your backend:
      // - server-generated challenge (ArrayBuffer)
      // - user.id (server-known stable identifier)
      // and then send the attestation response back to the server for verification.
      //
      // This function performs a client-side demo registration and stores credential ID in localStorage.

      // generate a challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // user id should be stable per user — here we use the user's email for demo
      const userId = formData.email ? new TextEncoder().encode(formData.email) : new Uint8Array(16);

      const publicKey: any = {
        challenge: challenge.buffer,
        rp: { name: "Optima Bank", id: window.location.hostname },
        user: {
          id: userId.buffer,
          name: formData.email || "unknown",
          displayName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || (formData.email || "User"),
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;

      if (!credential) {
        alert("Biometric registration was cancelled.");
        return false;
      }

      // convert ArrayBuffer rawId -> Uint8Array -> base64 safely
      const rawIdBuf = credential.rawId as ArrayBuffer;
      const rawIdArr = new Uint8Array(rawIdBuf);
      const rawIdStr = String.fromCharCode.apply(null, Array.from(rawIdArr));
      const credIdBase64 = btoa(rawIdStr);

      // store locally (demo); in production send this to backend
      localStorage.setItem("biometricEnabled", "true");
      localStorage.setItem("biometricCredId", credIdBase64);
      localStorage.setItem("biometricChoiceMade", "true");

      // notify parent (App.tsx) that biometric has been enabled (parent may also have its own logic)
      try {
        onEnableBiometric();
      } catch (e) {
        // ignore if parent doesn't need it
      }

      return true;
    } catch (err) {
      console.error("Biometric registration error:", err);
      alert("Failed to register biometric. Try again or use normal login.");
      return false;
    }
  };

  // When user chooses Yes on snackbar
  const handleBiometricYes = async () => {
    // keep snackbar until this completes; once done, navigate away
    await registerBiometricClientSide(); // Removed the unused 'ok' variable
    setBiometricSnackbarOpen(false);
    // navigate to main regardless (after successful signup)
    navigate("/main");
  };

  // When user chooses No on snackbar — record choice so we never ask again
  const handleBiometricNo = () => {
    localStorage.setItem("biometricChoiceMade", "true");
    localStorage.setItem("biometricEnabled", "false");
    setBiometricSnackbarOpen(false);
    navigate("/main");
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
                  alert("Google login failed");
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

      {/* Biometric Snackbar (persistent until user chooses) */}
      <Snackbar
        open={biometricSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="Enable biometric login for faster, secure access?"
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={handleBiometricYes} sx={{ color: "#A259FF" }}>
              Yes
            </Button>
            <Button size="small" onClick={handleBiometricNo} sx={{ color: "#fff" }}>
              No
            </Button>
          </Stack>
        }
        // don't auto-hide; keep until user explicitly clicks Yes or No
        onClose={() => {
          /* intentionally empty to keep snackbar open until button press */
        }}
      />
    </Box>
  );
};

export default SignUpPage;