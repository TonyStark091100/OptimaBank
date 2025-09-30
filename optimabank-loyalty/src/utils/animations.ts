// Animation utilities and micro-interactions
import React from 'react';
import { keyframes } from '@mui/material/styles';

// Keyframe animations
export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

export const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

export const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
`;

export const wiggle = keyframes`
  0%, 7% {
    transform: rotateZ(0);
  }
  15% {
    transform: rotateZ(-15deg);
  }
  20% {
    transform: rotateZ(10deg);
  }
  25% {
    transform: rotateZ(-10deg);
  }
  30% {
    transform: rotateZ(6deg);
  }
  35% {
    transform: rotateZ(-4deg);
  }
  40%, 100% {
    transform: rotateZ(0);
  }
`;

export const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(162, 89, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(162, 89, 255, 0.8), 0 0 30px rgba(162, 89, 255, 0.6);
  }
`;

export const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Animation presets
export const animationPresets = {
  // Page transitions
  pageEnter: {
    animation: `${fadeInUp} 0.6s ease-out`,
  },
  pageExit: {
    animation: `${fadeInDown} 0.4s ease-in`,
  },
  
  // Card animations
  cardHover: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 12px 40px rgba(162, 89, 255, 0.3)',
    },
  },
  
  // Button animations
  buttonPress: {
    transition: 'all 0.2s ease-in-out',
    '&:active': {
      transform: 'scale(0.95)',
    },
  },
  
  // Loading animations
  loadingShimmer: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200px 100%',
    animation: `${shimmer} 1.5s infinite`,
  },
  
  // Success animations
  successBounce: {
    animation: `${bounce} 0.6s ease-in-out`,
  },
  
  // Error animations
  errorWiggle: {
    animation: `${wiggle} 0.5s ease-in-out`,
  },
  
  // Glow effects
  glowEffect: {
    animation: `${glow} 2s ease-in-out infinite`,
  },
  
  // Floating elements
  floating: {
    animation: `${float} 3s ease-in-out infinite`,
  },
  
  // Spinning elements
  spinning: {
    animation: `${spin} 1s linear infinite`,
  },
};

// Micro-interaction utilities
export const microInteractions = {
  // Hover effects
  hoverLift: {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  
  // Click effects
  clickScale: {
    transition: 'transform 0.1s ease-in-out',
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  
  // Focus effects
  focusGlow: {
    transition: 'all 0.2s ease-in-out',
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(162, 89, 255, 0.3)',
    },
  },
  
  // Ripple effects
  ripple: {
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      borderRadius: '50%',
      background: 'rgba(162, 89, 255, 0.3)',
      transform: 'translate(-50%, -50%)',
      transition: 'width 0.6s, height 0.6s',
    },
    '&:active::before': {
      width: '300px',
      height: '300px',
    },
  },
};

// Stagger animation utilities
export const createStaggerAnimation = (delay: number = 0.1) => ({
  animation: `${fadeInUp} 0.6s ease-out`,
  animationFillMode: 'both',
  animationDelay: `${delay}s`,
});

// Parallax effect utilities
export const createParallaxEffect = (speed: number = 0.5) => ({
  transform: `translateY(${speed * 100}px)`,
  transition: 'transform 0.1s ease-out',
});

// Intersection Observer for scroll animations
export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
};

