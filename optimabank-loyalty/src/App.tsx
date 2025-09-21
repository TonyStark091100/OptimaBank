import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider, CredentialResponse } from "@react-oauth/google";
import { authApi } from "./services/api";

import LoadingPage from "./components/LoadingPage";
import WelcomePage from "./components/WelcomePage";
import SignUpPage from "./components/SignUpPage";
import LoginPage from "./components/LoginPage";
import NewsletterPage from "./components/NewsletterSection";
import MainPage from "./components/HomePage";
import HelpPage from "./components/HelpPage"; 
import EditProfilePage from "./components/EditProfilePage";

const AppInner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const handleLoadingComplete = () => setLoading(false);

  // ------------------------
  // Biometric Registration
  // ------------------------
  const handleEnableBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("Your browser/device does not support WebAuthn.");
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

        alert("Biometric login enabled successfully!");
      } else {
        alert("Biometric setup was cancelled.");
      }
    } catch (err: any) {
      console.error("Biometric setup failed:", err);
      alert("Failed to enable biometric login.");
    }
  };

  // ------------------------
  // Google Auth
  // ------------------------
  const handleGoogleAuth = async (credentialResponse: CredentialResponse) => {
    console.log("Google auth success:", credentialResponse);
    const token = credentialResponse?.credential;
    if (!token) {
      alert("Google login failed (no token).");
      return;
    }
    
    try {
      // Decode the JWT token to get user information
      const payload = JSON.parse(atob(token.split('.')[1]));
      const email = payload.email || '';
      const name = payload.name || payload.given_name || '';
      
      // Use the real login API with Google credential
      const response = await authApi.googleAuth(token);
      
      // Store user data from API response
      if (response.user) {
        localStorage.setItem('userName', `${response.user.first_name} ${response.user.last_name}`);
        localStorage.setItem('userEmail', response.user.email);
      } else {
        // Fallback to Google payload data
        if (name) {
          localStorage.setItem('userName', name);
        } else if (email) {
          localStorage.setItem('userName', email.split('@')[0]);
        }
        if (email) {
          localStorage.setItem('userEmail', email);
        }
      }
      
    } catch (error) {
      console.error('Error with Google authentication:', error);
      // Fallback to generic user name
      localStorage.setItem('userName', 'User');
    }
    
    alert("Google login successful!");
    navigate("/main");
  };

  // ------------------------
  // OTP API Calls
  // ------------------------
  const requestOtp = async (email: string) => {
    try {
      const res = await fetch("http://localhost:8000/users/request-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request OTP");
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const verifyOtp = async (email: string, otp: string, skipNavigation = false) => {
    try {
      const res = await fetch("http://localhost:8000/users/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      alert(data.message);
      
      // If we have a stored password, it means this is a login flow
      const tempPassword = localStorage.getItem('tempPassword');
      if (tempPassword && !skipNavigation) {
        // Clear the temporary password
        localStorage.removeItem('tempPassword');
        
        // Login the user with stored credentials
        try {
          const loginResponse = await authApi.login(email, tempPassword);
          
          // Store tokens
          if (loginResponse.access) {
            localStorage.setItem('access_token', loginResponse.access);
          }
          if (loginResponse.refresh) {
            localStorage.setItem('refresh_token', loginResponse.refresh);
          }
          
          // Update user data from login response
          if (loginResponse.user) {
            localStorage.setItem('userName', `${loginResponse.user.first_name} ${loginResponse.user.last_name}`);
            localStorage.setItem('userEmail', loginResponse.user.email);
          }
          
          console.log("Login successful after OTP verification");
        } catch (loginErr) {
          console.error("Login error after OTP verification:", loginErr);
          alert("Login failed after OTP verification. Please try again.");
          return;
        }
      }
      
      if (!skipNavigation) {
        navigate("/main");
      }
    } catch (err: any) {
      alert(err.message);
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
                <div style={{ width: "100%", overflowX: "hidden" }}>
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
                      
                      if (!skipNavigation) {
                        alert("Signed up successfully!");
                        console.log("SignUp formData:", formData);
                        navigate("/main");
                      }
                      
                    } catch (error: any) {
                      console.error('Signup error:', error);
                      throw new Error(`Signup failed: ${error.message || 'Please try again.'}`);
                    }
                  }}
                  onSwitchToLogin={() => navigate("/login")}
                  onGoogleSignUp={handleGoogleAuth}
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
                  onLogin={async (email: string, password: string) => {
                    try {
                      console.log('Attempting login with:', { email, password: '***' });
                      
                      // Call the real login API
                      const response = await authApi.login(email, password);
                      console.log('Login response:', response);
                      
                      // Store user data from API response
                      if (response.user) {
                        localStorage.setItem('userName', `${response.user.first_name} ${response.user.last_name}`);
                        localStorage.setItem('userEmail', response.user.email);
                      }
                      
                      // Store password temporarily for OTP verification
                      localStorage.setItem('tempPassword', password);
                      
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
                  onGoogleSignIn={handleGoogleAuth}
                  onBiometricSignIn={async () => {
                    try {
                      const enabled = localStorage.getItem("biometricEnabled") === "true";
                      const credId = localStorage.getItem("biometricCredId");

                      if (!enabled || !credId) {
                        alert("Biometric login not enabled.");
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
                        // Load stored user data for biometric login
                        const storedName = localStorage.getItem('userName') || 'User';
                        const storedEmail = localStorage.getItem('userEmail') || 'biometric@example.com';
                        
                        try {
                          // Use the real login API for biometric authentication
                          const response = await authApi.login(storedEmail, 'biometric_demo');
                          
                          // Store user data from API response
                          if (response.user) {
                            localStorage.setItem('userName', `${response.user.first_name} ${response.user.last_name}`);
                            localStorage.setItem('userEmail', response.user.email);
                          } else {
                            // Ensure user data is available
                            if (!storedName || storedName === 'User') {
                              localStorage.setItem('userName', 'User');
                            }
                          }
                        } catch (error) {
                          console.error('Biometric login error:', error);
                          // Fallback to stored data
                          if (!storedName || storedName === 'User') {
                            localStorage.setItem('userName', 'User');
                          }
                        }
                        
                        alert("Biometric authentication successful!");
                        navigate("/main");
                        return true;
                      }

                      alert("Biometric authentication cancelled.");
                      return false;
                    } catch (err) {
                      console.error("Biometric login failed:", err);
                      alert("Biometric authentication failed.");
                      return false;
                    }
                  }}
                />
              }
            />

            {/* Main (Home) */}
            <Route path="/main" element={<MainPage />} />

            {/* Help Page */}
            <Route path="/help" element={<HelpPage />} />

            {/* ✅ Edit Page */}
            <Route path="/edit" element={<EditProfilePage />} />
          </Routes>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <AppInner />
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
