import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Box, Snackbar, Alert } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { authApi } from "./services/api";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TimezoneProvider } from "./contexts/TimezoneContext";
import { suppressResizeObserverErrors, addResizeObserverCSSFix } from "./utils/resizeObserverFix";

import LoadingPage from "./components/LoadingPage";
import WelcomePage from "./components/WelcomePage";
import SignUpPage from "./components/SignUpPage";
import LoginPage from "./components/LoginPage";
import NewsletterPage from "./components/NewsletterSection";
import MainPage from "./components/HomePage";
import HelpPage from "./components/HelpPage"; 
import EditProfilePage from "./components/EditProfilePage";
import BiometricSetupPopup from "./components/BiometricSetupPopup";

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showBiometricPopup, setShowBiometricPopup] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Fix ResizeObserver loop error
  useEffect(() => {
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleResizeObserverError);
    
    return () => {
      window.removeEventListener('error', handleResizeObserverError);
    };
  }, []);

  const handleLoadingComplete = () => setLoading(false);

  // Snackbar handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Logout handler
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('biometricEnabled');
    localStorage.removeItem('biometricCredId');
    localStorage.removeItem('biometricChoice');
    
    // Clear any session storage
    sessionStorage.clear();
    
    // Show success message
    showSnackbar('Logged out successfully', 'success');
    
    // Redirect to login page
    navigate('/login');
  };

  // Device detection for biometric popup
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || "";
      const mobile = /iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const tablet = /iPad|Android.*Tablet|Windows.*Touch|Kindle|Silk|PlayBook/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth;
      const isSmallScreen = screenWidth <= 1024;
      
      const isMobileOrTablet = mobile || tablet || (hasTouch && isSmallScreen);
      setIsMobileOrTablet(isMobileOrTablet);
    };

    detectDevice();
  }, []);

  // Check if biometric popup should be shown
  const shouldShowBiometricPopup = () => {
    console.log('Checking biometric popup conditions:', {
      isMobileOrTablet,
      biometricChoice: localStorage.getItem('biometricChoice'),
      webauthnSupported: !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function"),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    });
    
    // Show on mobile/tablet devices OR in mobile simulator
    const isMobileSimulator = window.innerWidth <= 768 || ('ontouchstart' in window);
    if (!isMobileOrTablet && !isMobileSimulator) {
      console.log('Not mobile device or simulator');
      return false;
    }
    
    // Check if user has already made a choice
    const biometricChoice = localStorage.getItem('biometricChoice');
    if (biometricChoice !== null) {
      console.log('User already made biometric choice:', biometricChoice);
      return false;
    }
    
    // Check if WebAuthn is supported (or simulate it for testing)
    const webauthnSupported = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    if (!webauthnSupported) {
      console.log('WebAuthn not supported, but showing popup anyway for testing');
      // For testing purposes, show popup even without WebAuthn support
    }
    
    console.log('Showing biometric popup');
    return true;
  };

  // Biometric popup handlers
  const handleBiometricPopupEnable = async () => {
    await handleEnableBiometric();
    localStorage.setItem('biometricChoice', 'enabled');
    setShowBiometricPopup(false);
    navigate("/main");
  };

  const handleBiometricPopupDecline = () => {
    localStorage.setItem('biometricChoice', 'declined');
    setShowBiometricPopup(false);
    navigate("/main");
  };

  const handleBiometricPopupClose = () => {
    setShowBiometricPopup(false);
    navigate("/main");
  };

  // ------------------------
  // Biometric Registration
  // ------------------------
  const handleEnableBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        showSnackbar("Your browser/device does not support WebAuthn.", 'error');
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKey: any = {
        challenge,
        rp: { name: "My Web App" },
        user: {
          id: new TextEncoder().encode("user-id-123"),
          name: "user@example.com",
          displayName: "User Example",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
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

      if (credential) {
        const rawId = new Uint8Array(credential.rawId as ArrayBuffer);
        const rawIdString = String.fromCharCode.apply(null, Array.from(rawId));
        const credId = btoa(rawIdString);

        localStorage.setItem("biometricEnabled", "true");
        localStorage.setItem("biometricCredId", credId);

        showSnackbar("Biometric login enabled successfully!", 'success');
      } else {
        showSnackbar("Biometric setup was cancelled.", 'warning');
      }
    } catch (err: any) {
      console.error("Biometric setup failed:", err);
      showSnackbar("Failed to enable biometric login.", 'error');
    }
  };

  // ------------------------
  // Google Auth
  // ------------------------
  const handleGoogleSignUp = async (credentialResponse: CredentialResponse) => {
    console.log("Google signup success:", credentialResponse);
    const token = credentialResponse?.credential;
    if (!token) {
      showSnackbar("Google signup failed (no token).", 'error');
      return;
    }
    
    try {
      // Use the signup API with Google credential
      const response = await authApi.googleAuth(token, 'signup');
      
      // Store user data from API response
      if (response.user) {
        const fullName = response.user.name || `${response.user.first_name} ${response.user.last_name}`.trim();
        localStorage.setItem('userName', fullName || response.user.email.split('@')[0]);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userPoints', response.user.points?.toString() || '0');
        
        showSnackbar(`Welcome to Optima Rewards! Your account has been created successfully. You have ${response.user.points || 10000} points to get started!`, 'success');
      }
      
    } catch (error: any) {
      console.error('Error with Google signup:', error);
      
      // Handle specific error types
      if (error.errorType === 'account_exists') {
        showSnackbar(`Account already exists with this email address. Please use the login option instead.`, 'warning');
        // Optionally redirect to login page
        navigate("/login");
        return;
      }
      
      showSnackbar(`Google signup failed: ${error.message || 'Please try again.'}`, 'error');
      return;
    }
    
    // Verify tokens are stored before navigating
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error('No access token found after Google signup');
      showSnackbar("Google signup failed - no access token. Please try again.", 'error');
      return;
    }
    
    console.log('Google signup successful, tokens stored');
    
    // Navigate directly to main page - biometric popup will be handled after OTP verification
    navigate("/main");
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    console.log("Google login success:", credentialResponse);
    const token = credentialResponse?.credential;
    if (!token) {
      showSnackbar("Google login failed (no token).", 'error');
      return;
    }
    
    try {
      // Use the login API with Google credential
      const response = await authApi.googleAuth(token, 'login');
      
      // Store user data from API response
      if (response.user) {
        const fullName = response.user.name || `${response.user.first_name} ${response.user.last_name}`.trim();
        localStorage.setItem('userName', fullName || response.user.email.split('@')[0]);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userPoints', response.user.points?.toString() || '0');
        
        showSnackbar('Welcome back!');
      }
      
    } catch (error: any) {
      console.error('Error with Google login:', error);
      
      // Handle specific error types
      if (error.errorType === 'account_not_found') {
        showSnackbar(`No account found with this email address. Please sign up first.`, 'warning');
        // Optionally redirect to signup page
        navigate("/signup");
        return;
      }
      
      showSnackbar(`Google login failed: ${error.message || 'Please try again.'}`, 'error');
      return;
    }
    
    // Verify tokens are stored before navigating
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error('No access token found after Google login');
      showSnackbar("Google login failed - no access token. Please try again.", 'error');
      return;
    }
    
    console.log('Google login successful, tokens stored');
    navigate("/main");
  };

  // ------------------------
  // OTP API Calls
  // ------------------------
  const requestOtp = async (email: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/users/request-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request OTP");
      showSnackbar(data.message, 'success');
    } catch (err: any) {
      showSnackbar(err.message, 'error');
    }
  };

  const verifyOtp = async (email: string, otp: string, skipNavigation = false) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/users/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      showSnackbar(data.message, 'success');
      
      // If we have a stored password, it means this is a login flow
      const tempPassword = localStorage.getItem('tempPassword');
      if (tempPassword && !skipNavigation) {
        // Clear the temporary password
        localStorage.removeItem('tempPassword');
        
        // Login the user with stored credentials (tokens are stored automatically by authApi.login)
        try {
          const loginResponse = await authApi.login(email, tempPassword);
          
          // Update user data from login response
          if (loginResponse.user) {
            localStorage.setItem('userName', `${loginResponse.user.first_name} ${loginResponse.user.last_name}`);
            localStorage.setItem('userEmail', loginResponse.user.email);
            localStorage.setItem('userPoints', loginResponse.user.points?.toString() || '0');
          }
          
          // Store password for biometric authentication (only if biometric is enabled)
          const biometricEnabled = localStorage.getItem("biometricEnabled") === "true";
          if (biometricEnabled) {
            localStorage.setItem('userPassword', tempPassword);
          }
          
          // Verify tokens are stored
          const accessToken = localStorage.getItem('access_token');
          const refreshToken = localStorage.getItem('refresh_token');
          console.log('Tokens stored after OTP verification:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
          
          if (!accessToken) {
            console.error('No access token found after login');
            showSnackbar("Login failed - no access token. Please try again.", 'error');
            return;
          }
          
          console.log("Login successful after OTP verification");
        } catch (loginErr) {
          console.error("Login error after OTP verification:", loginErr);
          showSnackbar("Login failed after OTP verification. Please try again.", 'error');
          return;
        }
      }
      
      if (!skipNavigation) {
        // Check if this is a signup flow (no tempPassword means it's signup, not login)
        if (!tempPassword) {
          // This is a signup flow - check if we should show biometric popup
          if (shouldShowBiometricPopup()) {
            setShowBiometricPopup(true);
            // Don't navigate immediately, let user handle biometric setup
            return;
          }
        }
        
        // Navigate to main page
        setTimeout(() => {
          navigate("/main");
        }, 100);
      }
    } catch (err: any) {
      showSnackbar(err.message, 'error');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.8 }}
        >
          <LoadingPage onLoadingComplete={handleLoadingComplete} />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Routes>
            {/* Welcome + Newsletter */}
            <Route
              path="/"
              element={
                <div style={{ width: "100%", overflowX: "hidden", overflowY: "visible" }}>
                  <div
                    style={{
                      minHeight: "90vh",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "80px",
                    }}
                  >
                    <Box sx={{ width: "100%", height: "100%" }}>
                      <WelcomePage
                        onGetStarted={() => navigate("/signup")}
                        onLogin={() => navigate("/login")}
                      />
                    </Box>

                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -30,
                        color: "#A259FF",
                        cursor: "pointer",
                        animation: "bounce 2s infinite",
                        "@keyframes bounce": {
                          "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
                          "40%": { transform: "translateY(-12px)" },
                          "60%": { transform: "translateY(-6px)" },
                        },
                      }}
                      onClick={() =>
                        window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
                      }
                    >
                      <KeyboardArrowDownIcon fontSize="large" />
                    </Box>
                  </div>

                  <div style={{ minHeight: "100vh" }}>
                    <NewsletterPage />
                  </div>
                </div>
              }
            />

            {/* Sign Up */}
            <Route
              path="/signup"
              element={
                <SignUpPage
                  onShowSnackbar={showSnackbar}
                  onSignUp={async (formData, skipNavigation = false) => {
                    try {
                      const firstName = (formData?.firstName || "").toString().trim();
                      const lastName = (formData?.lastName || "").toString().trim();
                      const email = (formData?.email || "").toString().trim();
                      const phone = (formData?.phone || "").toString().trim();
                      const password = (formData?.password || "demo_password").toString().trim();
                      
                      if (!email) {
                        throw new Error("Email is required");
                      }
                      
                      if (!firstName || !lastName) {
                        throw new Error("First name and last name are required");
                      }
                      
                      if (!phone) {
                        throw new Error("Phone number is required");
                      }
                      
                      // Use the real signup API
                      await authApi.signup({
                        email,
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phone,
                        password: password
                      });
                      
                      // Store user data from form data (no login yet)
                      const fullName = `${firstName} ${lastName}`.trim() || (email ? email.split('@')[0] : 'User');
                      localStorage.setItem('userName', fullName);
                      localStorage.setItem('userEmail', email);
                      
                      // Store password for biometric authentication (only if biometric is enabled)
                      const biometricEnabled = localStorage.getItem("biometricEnabled") === "true";
                      if (biometricEnabled) {
                        localStorage.setItem('userPassword', password);
                      }
                      
                      if (!skipNavigation) {
                        showSnackbar("Signed up successfully!", 'success');
                        console.log("SignUp formData:", formData);
                        navigate("/main");
                      }
                      
                    } catch (error: any) {
                      console.error('Signup error:', error);
                      throw new Error(`Signup failed: ${error.message || 'Please try again.'}`);
                    }
                  }}
                  onSwitchToLogin={() => navigate("/login")}
                  onGoogleSignUp={handleGoogleSignUp}
                  onEnableBiometric={handleEnableBiometric}
                  onRequestOtp={requestOtp}
                  onVerifyOtp={verifyOtp}
                />
              }
            />

            {/* Login */}
            <Route
              path="/login"
              element={
                <LoginPage
                  onShowSnackbar={showSnackbar}
                  onLogin={async (email: string, password: string) => {
                    try {
                      console.log('Attempting login with:', { email, password: '***' });
                      
                      // Call the real login API (this stores tokens automatically)
                      const response = await authApi.login(email, password);
                      console.log('Login response:', response);
                      
                      // Store user data from API response
                      if (response.user) {
                        localStorage.setItem('userName', `${response.user.first_name} ${response.user.last_name}`);
                        localStorage.setItem('userEmail', response.user.email);
                        localStorage.setItem('userPoints', response.user.points?.toString() || '0');
                      }
                      
                      // Store password temporarily for OTP verification
                      localStorage.setItem('tempPassword', password);
                      
                      // Store password for biometric authentication (only if biometric is enabled)
                      const biometricEnabled = localStorage.getItem("biometricEnabled") === "true";
                      if (biometricEnabled) {
                        localStorage.setItem('userPassword', password);
                      }
                      
                      // Verify tokens are stored
                      const accessToken = localStorage.getItem('access_token');
                      const refreshToken = localStorage.getItem('refresh_token');
                      console.log('Tokens stored:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
                      
                      console.log("Login successful, OTP will be requested");
                      // Don't navigate yet - let the OTP flow handle navigation
                    } catch (error: any) {
                      console.error('Login error details:', error);
                      console.error('Error message:', error.message);
                      console.error('Error response:', error.response);
                      throw new Error(`Login failed: ${error.message || 'Please check your credentials and try again.'}`);
                    }
                  }}
                  onRequestOtp={requestOtp}
                  onVerifyOtp={verifyOtp}
                  onSwitchToSignUp={() => navigate("/signup")}
                  onGoogleSignIn={handleGoogleLogin}
                  onBiometricSignIn={async () => {
                    try {
                      const enabled = localStorage.getItem("biometricEnabled") === "true";
                      const credId = localStorage.getItem("biometricCredId");

                      if (!enabled || !credId) {
                        showSnackbar("Biometric login not enabled. Please enable it during signup.", 'warning');
                        return false;
                      }

                      // Check if we have stored user credentials
                      const storedEmail = localStorage.getItem('userEmail');
                      const storedPassword = localStorage.getItem('userPassword');
                      
                      if (!storedEmail || !storedPassword) {
                        showSnackbar("No stored credentials found. Please login with email/password first to enable biometric login.", 'warning');
                        return false;
                      }

                      const idBytes = Uint8Array.from(atob(credId), (c) =>
                        c.charCodeAt(0)
                      );

                      const challenge = new Uint8Array(32);
                      window.crypto.getRandomValues(challenge);

                      const publicKey: PublicKeyCredentialRequestOptions = {
                        challenge,
                        allowCredentials: [
                          {
                            id: idBytes,
                            type: "public-key",
                          },
                        ],
                        timeout: 60000,
                        userVerification: "required",
                      };

                      const assertion = (await navigator.credentials.get({
                        publicKey,
                      })) as PublicKeyCredential | null;

                      if (assertion) {
                        // Biometric authentication successful, now login with stored credentials
                        try {
                          const response = await authApi.login(storedEmail, storedPassword);
                          
                          // Store user data from API response
                          if (response.user) {
                            localStorage.setItem('userName', `${response.user.first_name} ${response.user.last_name}`);
                            localStorage.setItem('userEmail', response.user.email);
                            localStorage.setItem('userPoints', response.user.points?.toString() || '0');
                          }
                          
                          return true;
                        } catch (loginError: any) {
                          console.error('Biometric login API error:', loginError);
                          showSnackbar(`Login failed: ${loginError.message || 'Please try again.'}`, 'error');
                          return false;
                        }
                      }

                      showSnackbar("Biometric authentication cancelled.", 'warning');
                      return false;
                    } catch (err) {
                      console.error("Biometric login failed:", err);
                      showSnackbar("Biometric authentication failed.", 'error');
                      return false;
                    }
                  }}
                />
              }
            />

            {/* Main (Home) */}
            <Route path="/main" element={<MainPage onShowSnackbar={showSnackbar} onLogout={handleLogout} />} />

            {/* Help Page */}
            <Route path="/help" element={<HelpPage />} />

            {/* ✅ Edit Page */}
            <Route path="/edit" element={<EditProfilePage onShowSnackbar={showSnackbar} />} />
          </Routes>
        </motion.div>
      )}
      
      {/* Biometric Setup Popup */}
      <BiometricSetupPopup
        open={showBiometricPopup}
        onClose={handleBiometricPopupClose}
        onEnable={handleBiometricPopupEnable}
        onDecline={handleBiometricPopupDecline}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "59629112789-huo85fv2fpcpba1jqqdic5vlq43m4p5n.apps.googleusercontent.com";
  
  // Global error handler for ResizeObserver
  useEffect(() => {
    // Apply ResizeObserver fixes
    suppressResizeObserverErrors();
    addResizeObserverCSSFix();
    
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        args[0].includes('ResizeObserver loop completed with undelivered notifications')
      ) {
        return; // Suppress ResizeObserver errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
  
  return (
    <LanguageProvider>
      <TimezoneProvider>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <AppInner />
      </Router>
    </GoogleOAuthProvider>
      </TimezoneProvider>
    </LanguageProvider>
  );
};

export default App;
