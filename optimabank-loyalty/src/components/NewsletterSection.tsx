import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { motion } from "framer-motion";

const NewsletterSection: React.FC = () => {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: "center",
        background: "linear-gradient(135deg, #181824 70%, #A259FF 100%)",
        color: "white",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 700, fontFamily: "Montserrat, sans-serif" }}
        >
          Stay Updated!
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <Typography
          variant="body1"
          sx={{ mb: 4, opacity: 0.85, fontFamily: "Montserrat, sans-serif" }}
        >
          Subscribe to our newsletter and never miss the latest updates and
          rewards.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Enter your email"
            InputProps={{
              sx: {
                color: "#fff",
                fontFamily: "Montserrat, sans-serif",
                bgcolor: "#1e1e2f",
                borderRadius: 2,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#444",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#A259FF",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#A259FF",
                  borderWidth: "2px",
                },
              },
            }}
            InputLabelProps={{
              sx: {
                color: "#aaa",
                fontFamily: "Montserrat, sans-serif",
                "&.Mui-focused": {
                  color: "#A259FF",
                },
              },
            }}
            sx={{
              width: "280px",
            }}
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#A259FF",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              borderRadius: 2,
              fontFamily: "Montserrat, sans-serif",
              "&:hover": { backgroundColor: "#8a3ffb" },
            }}
          >
            Subscribe
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default NewsletterSection;
