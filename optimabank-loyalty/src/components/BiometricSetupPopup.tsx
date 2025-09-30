import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Fingerprint,
  Close,
  CheckCircle,
  Error
} from '@mui/icons-material';

interface BiometricSetupPopupProps {
  open: boolean;
  onClose: () => void;
  onEnable: () => Promise<void>;
  onDecline: () => void;
}

const BiometricSetupPopup: React.FC<BiometricSetupPopupProps> = ({
  open,
  onClose,
  onEnable,
  onDecline
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEnable = async () => {
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      await onEnable();
      setStatus('success');
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to enable biometric authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)',
          border: '1px solid rgba(162, 89, 255, 0.3)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Fingerprint sx={{ color: '#A259FF', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Enable Biometric Login
          </Typography>
        </Box>
        {!isLoading && (
          <IconButton 
            onClick={handleClose}
            sx={{ color: '#ccc', '&:hover': { color: 'white' } }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#CCCCDD' }}>
            Would you like to enable biometric authentication for faster and more secure login?
          </Typography>
          
          <Box sx={{ 
            background: 'rgba(162, 89, 255, 0.1)', 
            borderRadius: 2, 
            p: 2, 
            mb: 2,
            border: '1px solid rgba(162, 89, 255, 0.2)'
          }}>
            <Typography variant="body2" sx={{ color: '#A259FF', fontWeight: 500 }}>
              ✅ Use your fingerprint or face ID to login instantly
            </Typography>
            <Typography variant="body2" sx={{ color: '#A259FF', fontWeight: 500 }}>
              🔒 More secure than passwords
            </Typography>
            <Typography variant="body2" sx={{ color: '#A259FF', fontWeight: 500 }}>
              ⚡ Faster login experience
            </Typography>
          </Box>

          {status === 'success' && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                color: '#4CAF50'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle />
                Biometric authentication enabled successfully!
              </Box>
            </Alert>
          )}

          {status === 'error' && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#F44336'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Error />
                {errorMessage}
              </Box>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button
          onClick={handleDecline}
          disabled={isLoading}
          sx={{
            color: '#ccc',
            borderColor: '#555',
            '&:hover': {
              borderColor: '#777',
              background: 'rgba(255, 255, 255, 0.05)'
            }
          }}
          variant="outlined"
        >
          Maybe Later
        </Button>
        
        <Button
          onClick={handleEnable}
          disabled={isLoading}
          sx={{
            background: '#A259FF',
            color: 'white',
            '&:hover': {
              background: '#8B4FE6'
            },
            '&:disabled': {
              background: '#666'
            }
          }}
          variant="contained"
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'white' }} />
              Setting up...
            </Box>
          ) : (
            'Enable Biometric'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BiometricSetupPopup;
