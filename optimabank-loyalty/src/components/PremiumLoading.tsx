import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  Zoom,
  Slide,
  useTheme
} from '@mui/material';
import {
  AutoAwesome,
  Diamond,
  Star,
  EmojiEvents,
  TrendingUp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumLoadingProps {
  message?: string;
  variant?: 'default' | 'points' | 'tier' | 'achievement' | 'sparkle';
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const PremiumLoading: React.FC<PremiumLoadingProps> = ({
  message = 'Loading...',
  variant = 'default',
  size = 'medium',
  fullScreen = false
}) => {
  const theme = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return { spinner: 24, icon: 16, text: 'body2' };
      case 'large':
        return { spinner: 80, icon: 40, text: 'h5' };
      default:
        return { spinner: 40, icon: 24, text: 'h6' };
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'points':
        return <TrendingUp />;
      case 'tier':
        return <Diamond />;
      case 'achievement':
        return <EmojiEvents />;
      case 'sparkle':
        return <AutoAwesome />;
      default:
        return <Star />;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'points':
        return '#4CAF50';
      case 'tier':
        return '#FFD700';
      case 'achievement':
        return '#FF6B35';
      case 'sparkle':
        return '#A259FF';
      default:
        return '#A259FF';
    }
  };

  const sizes = getSize();
  const color = getVariantColor();

  const LoadingContent = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: fullScreen ? 4 : 2
      }}
    >
      {/* Animated Spinner with Icon */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          size={sizes.spinner}
          thickness={4}
          sx={{
            color: color,
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: color
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {React.cloneElement(getVariantIcon(), { 
              sx: { fontSize: sizes.icon } 
            })}
          </motion.div>
        </Box>
      </Box>

      {/* Loading Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Typography
          variant={sizes.text as any}
          sx={{
            color: color,
            fontWeight: 600,
            textAlign: 'center',
            background: `linear-gradient(45deg, ${color}, ${color}80)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {message}
        </Typography>
      </motion.div>

      {/* Animated Dots */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: color,
                opacity: 0.7
              }}
            />
          </motion.div>
        ))}
      </Box>

      {/* Floating Particles */}
      <Box sx={{ position: 'relative', width: 100, height: 100 }}>
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.6
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </Box>
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1E103C 0%, #2D1B69 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in timeout={500}>
          <Box>
            <LoadingContent />
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        background: 'rgba(162, 89, 255, 0.05)',
        borderRadius: 2,
        border: '1px solid rgba(162, 89, 255, 0.1)'
      }}
    >
      <LoadingContent />
    </Box>
  );
};

// Specialized Loading Components
export const PointsLoading: React.FC<{ message?: string }> = ({ 
  message = 'Processing points...' 
}) => (
  <PremiumLoading 
    variant="points" 
    message={message}
  />
);

export const TierLoading: React.FC<{ message?: string }> = ({ 
  message = 'Updating tier status...' 
}) => (
  <PremiumLoading 
    variant="tier" 
    message={message}
  />
);

export const AchievementLoading: React.FC<{ message?: string }> = ({ 
  message = 'Unlocking achievement...' 
}) => (
  <PremiumLoading 
    variant="achievement" 
    message={message}
  />
);

export const SparkleLoading: React.FC<{ message?: string }> = ({ 
  message = 'Something magical is happening...' 
}) => (
  <PremiumLoading 
    variant="sparkle" 
    message={message}
  />
);

// Full Screen Loading Overlay
export const FullScreenLoading: React.FC<{ 
  message?: string; 
  variant?: 'default' | 'points' | 'tier' | 'achievement' | 'sparkle';
}> = ({ message, variant }) => (
  <PremiumLoading 
    message={message} 
    variant={variant} 
    fullScreen 
    size="large"
  />
);

// Skeleton Loading for Cards
export const CardSkeleton: React.FC<{ 
  height?: number; 
  count?: number;
}> = ({ height = 200, count = 1 }) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {[...Array(count)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
      >
        <Box
          sx={{
            width: 300,
            height: height,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200% 0' },
              '100%': { backgroundPosition: '200% 0' }
            }
          }}
        />
      </motion.div>
    ))}
  </Box>
);

// Progress Loading with Steps
export const StepProgressLoading: React.FC<{
  steps: string[];
  currentStep: number;
  message?: string;
}> = ({ steps, currentStep, message }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h6" sx={{ mb: 3, color: '#A259FF' }}>
      {message || 'Processing...'}
    </Typography>
    
    <Box sx={{ mb: 3 }}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: index <= currentStep ? 1 : 0.3,
            x: 0
          }}
          transition={{ delay: index * 0.2 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1,
              borderRadius: 1,
              bgcolor: index <= currentStep ? 'rgba(162, 89, 255, 0.1)' : 'transparent',
              mb: 1
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: index < currentStep ? '#4CAF50' : index === currentStep ? '#A259FF' : '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              {index < currentStep ? '✓' : index + 1}
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: index <= currentStep ? 'text.primary' : 'text.secondary',
                fontWeight: index === currentStep ? 600 : 400
              }}
            >
              {step}
            </Typography>
          </Box>
        </motion.div>
      ))}
    </Box>

    <Box sx={{ width: '100%', mb: 2 }}>
      <Box
        sx={{
          width: '100%',
          height: 4,
          bgcolor: 'rgba(162, 89, 255, 0.2)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #A259FF, #8B4FE6)',
            borderRadius: 2
          }}
        />
      </Box>
    </Box>

    <Typography variant="body2" color="text.secondary">
      Step {currentStep + 1} of {steps.length}
    </Typography>
  </Box>
);

export default PremiumLoading;
