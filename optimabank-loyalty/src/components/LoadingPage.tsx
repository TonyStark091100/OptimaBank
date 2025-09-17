import React, { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";
import logo from "../logo.png";

interface LoadingPageProps {
  onLoadingComplete: () => void;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ onLoadingComplete }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // show text after 1.5s
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1500);

    // auto-complete after 3s
    const completeTimer = setTimeout(() => {
      onLoadingComplete();
    }, 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete]);

  return (
    <Box
      minHeight="100vh"
      width="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: "linear-gradient(120deg, #181824 70%, #A259FF 100%)",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          py: 6,
          px: 5,
          borderRadius: 5,
          background: "rgba(34,34,50,0.98)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 340,
        }}
      >
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

        {/* Animated loading dots */}
        <Box display="flex" justifyContent="center" mb={3}>
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              initial={{ opacity: 0.3, y: 0 }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: dot * 0.2,
              }}
              style={{
                width: 10,
                height: 10,
                margin: "0 6px",
                backgroundColor: "#A259FF",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
          ))}
        </Box>

        {/* Text appears later */}
        {showText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Montserrat, sans-serif", color: "#E0E0E0" }}
            >
              Setting up your rewards...
            </Typography>
          </motion.div>
        )}
      </Paper>
    </Box>
  );
};

export default LoadingPage;
