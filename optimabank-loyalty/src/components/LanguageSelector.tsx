import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useLanguage, availableLanguages, Language } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'icon' | 'button' | 'chip';
  size?: 'small' | 'medium' | 'large';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'icon', 
  size = 'medium' 
}) => {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('LanguageSelector: Clicked on language selector');
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang: Language) => {
    console.log('LanguageSelector: Attempting to change language to:', lang);
    console.log('LanguageSelector: Current language:', language);
    setLanguage(lang);
    handleClose();
    console.log('LanguageSelector: Language change function completed');
  };

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  if (variant === 'chip') {
    return (
      <Chip
        icon={<LanguageIcon />}
        label={currentLanguage?.name}
        onClick={handleClick}
        variant="outlined"
        sx={{
          borderColor: '#A259FF',
          color: '#A259FF',
          '&:hover': {
            backgroundColor: 'rgba(162, 89, 255, 0.1)',
          }
        }}
      />
    );
  }

  if (variant === 'button') {
    return (
      <Box>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            p: 1,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(162, 89, 255, 0.1)',
            }
          }}
        >
          <LanguageIcon sx={{ color: '#A259FF' }} />
          <Typography variant="body2" sx={{ color: 'white' }}>
            {currentLanguage?.name}
          </Typography>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(20, 20, 30, 0.95)',
              color: 'white',
              border: '1px solid rgba(162, 89, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              minWidth: 200
            }
          }}
        >
          {availableLanguages.map((lang) => (
            <MenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(162, 89, 255, 0.1)',
                }
              }}
            >
              <ListItemIcon>
                <Typography sx={{ fontSize: '1.2rem' }}>
                  {lang.flag}
                </Typography>
              </ListItemIcon>
              <ListItemText primary={lang.name} />
              {language === lang.code && (
                <CheckIcon sx={{ color: '#A259FF', ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Default icon variant
  return (
    <>
      <IconButton
        onClick={handleClick}
        size={size}
        sx={{
          color: '#A259FF',
          '&:hover': {
            backgroundColor: 'rgba(162, 89, 255, 0.1)',
          }
        }}
      >
        <LanguageIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(20, 20, 30, 0.95)',
            color: 'white',
            border: '1px solid rgba(162, 89, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: 200
          }
        }}
      >
        {availableLanguages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(162, 89, 255, 0.1)',
              }
            }}
          >
            <ListItemIcon>
              <Typography sx={{ fontSize: '1.2rem' }}>
                {lang.flag}
              </Typography>
            </ListItemIcon>
            <ListItemText primary={lang.name} />
            {language === lang.code && (
              <CheckIcon sx={{ color: '#A259FF', ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
