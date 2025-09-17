import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css"; // Ensure Montserrat font is imported here

// ✅ Custom dark theme
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#181824", // deep charcoal
      paper: "#222232",   // slightly lighter for cards
    },
    primary: {
      main: "#A259FF", // purple accent
      contrastText: "#fff",
    },
    secondary: {
      main: "#fff",
      contrastText: "#181824",
    },
    text: {
      primary: "#fff",
      secondary: "#E0E0E0",
    },
    divider: "#353545",
  },
  typography: {
    fontFamily: "Montserrat, Arial, sans-serif",
    h1: { fontWeight: 700, fontSize: "2.6rem", letterSpacing: "1px" },
    h2: { fontWeight: 600, fontSize: "2rem" },
    h3: { fontWeight: 600, fontSize: "1.4rem" },
    body1: { fontSize: "1.05rem" },
    button: { fontWeight: 600, textTransform: "none" },
  },
});

// ✅ Put your Google Client ID here or in .env
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* App handles routing internally; no props required here */}
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
