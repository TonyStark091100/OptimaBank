import React from "react";
import { Box, Button, Typography, Paper, Link } from "@mui/material";
import { motion } from "framer-motion";
import logo from "../logo.png";
import rewardIllustration from "../reward.png";

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const features = ["Earn points daily", "Exclusive offers", "Instant rewards"];

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted, onLogin }) => (
  <Box
    minHeight="100vh" // Changed from 80vh to 100vh to use full viewport height
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    sx={{
      background: "linear-gradient(120deg, #181824 70%, #A259FF 100%)",
      color: "white",
      padding: "20px 0", // Added padding to create space at top and bottom
    }}
  >
    <Paper
      elevation={5}
      sx={{
        p: 6,
        borderRadius: 4,
        background: "rgba(34,34,50,0.98)",
        color: "white",
        minWidth: 390,
        maxWidth: 440,
        textAlign: "center",
        boxShadow: "0 8px 32px 0 rgba(162,89,255,0.20)",
        marginBottom: 4, // Added margin at the bottom
      }}
    >
      {/* Logo */}
      <img
        src={logo}
        alt="OptimaBank Logo"
        style={{
          width: 76,
          height: 76,
          marginBottom: 32,
          background:
            "radial-gradient(circle at 50% 50%, #A259FF 60%, transparent 100%)",
          borderRadius: "50%",
        }}
      />

      {/* Title */}
      <Typography
        variant="h1"
        gutterBottom
        sx={{ fontSize: "2rem", fontWeight: 700, color: "white" }}
      >
        Welcome to OPTIMA REWARDS
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body1"
        sx={{ mb: 4, color: "white", opacity: 0.85 }}
      >
        Earn points with every transaction and unlock amazing rewards
      </Typography>

      {/* Reward Illustration */}
      <img
        src={rewardIllustration}
        alt="Rewards Illustration"
        style={{
          width: "60%",
          maxWidth: 160,
          margin: "0 auto 20px",
          display: "block",
        }}
      />

      {/* Animated Key Features */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.4, duration: 0.6 }}
          >
            <Typography variant="body1" sx={{ mb: 1, color: "white" }}>
              ✔ {feature}
            </Typography>
          </motion.div>
        ))}
      </Box>

      {/* Get Started Button */}
      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{
          px: 6,
          py: 1.5,
          fontWeight: 600,
          borderRadius: 3,
          fontSize: "1.1rem",
          mb: 2,
          backgroundColor: "#A259FF",
          "&:hover": {
            backgroundColor: "#8a3ffb",
          },
          color: "white",
        }}
        onClick={onGetStarted}
      >
        Get Started
      </Button>

      {/* Already a member? Login link */}
      <Typography variant="body2" sx={{ mt: 2, color: "white" }}>
        Already a member?{" "}
        <Link
          component="button"
          onClick={onLogin}
          sx={{ color: "#A259FF", fontWeight: 600 }}
        >
          Login
        </Link>
      </Typography>
    </Paper>
  </Box>
);

export default WelcomePage;