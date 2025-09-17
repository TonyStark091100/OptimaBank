import React from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContactSupportIcon from "@mui/icons-material/ContactSupport";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatIcon from "@mui/icons-material/Chat";

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "To create an account, click on the 'Sign Up' button on the welcome page. Fill in your personal details including your name, email address, phone number, and create a secure password. You can also sign up using your Google or Apple account."
    },
    {
      question: "How do I reset my password?",
      answer: "If you've forgotten your password, click on 'Forgot Password' on the login page. You'll receive an email with instructions to reset your password. Follow the link in the email to create a new password."
    },
    {
      question: "How do I earn rewards points?",
      answer: "You earn points with every transaction made using your Optima Bank card. Each dollar spent earns you 1 point. Certain categories may offer bonus points. You can check your points balance in the rewards section of the app."
    },
    {
      question: "How do I redeem my rewards?",
      answer: "To redeem rewards, navigate to the rewards section and browse available rewards. Select the reward you want and follow the redemption process. Some rewards may be instant while others might take 24-48 hours to process."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use bank-level encryption and security measures to protect your personal and financial information. We never share your data with third parties without your consent."
    },
    {
      question: "What is biometric authentication?",
      answer: "Biometric authentication allows you to log in using your fingerprint or facial recognition instead of a password. This feature is available on supported mobile devices and provides a secure, convenient way to access your account."
    }
  ];

  return (
    <Box 
      sx={{ 
        display: "flex", 
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #0A0A14 0%, #1A102E 100%)",
        justifyContent: "center",
        alignItems: "center",
        p: isSmallScreen ? 2 : 4,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: isSmallScreen ? 3 : 4,
          borderRadius: 4,
          background: "rgba(34,34,50,0.98)",
          color: "white",
          width: "100%",
          maxWidth: 800,
          position: "relative",
          boxShadow: "0 8px 32px 0 rgba(162,89,255,0.25)",
        }}
      >
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            color: "#A259FF",
            mb: 3,
            "&:hover": {
              backgroundColor: "rgba(162, 89, 255, 0.1)",
            }
          }}
        >
          Back
        </Button>

        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <ContactSupportIcon sx={{ fontSize: 32, color: "#A259FF", mr: 2 }} />
          <Typography variant="h4" fontWeight={700}>
            Help & Support
          </Typography>
        </Box>

        {/* Contact Information */}
        <Typography variant="h6" sx={{ mb: 2, color: "#A259FF" }}>
          Contact Us
        </Typography>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <EmailIcon sx={{ color: "#A259FF", mr: 2 }} />
            <Typography>Email: support@optimabank.com</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <PhoneIcon sx={{ color: "#A259FF", mr: 2 }} />
            <Typography>Phone: 1-800-OPTIMA-1 (1-800-678-4621)</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ChatIcon sx={{ color: "#A259FF", mr: 2 }} />
            <Typography>Live Chat: Available 24/7 in the app</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, bgcolor: "#444" }} />

        {/* FAQ Section */}
        <Typography variant="h6" sx={{ mb: 3, color: "#A259FF" }}>
          Frequently Asked Questions
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {faqItems.map((item, index) => (
            <Accordion 
              key={index}
              sx={{ 
                backgroundColor: "rgba(50,50,70,0.5)", 
                color: "white",
                mb: 1,
                "&:before": {
                  backgroundColor: "#444"
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#A259FF" }} />}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    fontWeight: 600,
                  }
                }}
              >
                {item.question}
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#CCCCDD" }}>
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ my: 3, bgcolor: "#444" }} />

        {/* Additional Help */}
        <Typography variant="h6" sx={{ mb: 2, color: "#A259FF" }}>
          Need More Help?
        </Typography>
        <Typography sx={{ mb: 3, color: "#CCCCDD" }}>
          If you didn't find the answer to your question, our customer support team is available 24/7 to assist you with any issues or concerns.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            sx={{
              color: "#A259FF",
              borderColor: "#A259FF",
              "&:hover": {
                backgroundColor: "rgba(162, 89, 255, 0.1)",
                borderColor: "#8a3ffb",
              }
            }}
          >
            Send Email
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhoneIcon />}
            sx={{
              color: "#A259FF",
              borderColor: "#A259FF",
              "&:hover": {
                backgroundColor: "rgba(162, 89, 255, 0.1)",
                borderColor: "#8a3ffb",
              }
            }}
          >
            Call Support
          </Button>
          <Button
            variant="contained"
            startIcon={<ChatIcon />}
            sx={{
              backgroundColor: "#A259FF",
              "&:hover": {
                backgroundColor: "#8a3ffb",
              }
            }}
          >
            Start Live Chat
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

// Add this export statement to make it a module
export default HelpPage;