import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TimezoneInfo, getTimezoneInfo, getUserTimezone, getCommonTimezones } from '../utils/timezone';

// Promotion types
export interface TimezonePromotion {
  id: string;
  name: string;
  description: string;
  discount: number;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  days: number[];    // 0-6 (Sunday-Saturday)
  timezones: string[];
  voucherCategories: string[];
  isActive: boolean;
}

// Business hours for different regions
export interface RegionalBusinessHours {
  timezone: string;
  region: string;
  businessHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  weekendHours?: {
    start: string;
    end: string;
  };
}

// Regional voucher availability
export interface RegionalVoucher {
  voucherId: string;
  title: string;
  timezones: string[];
  availabilityStart?: string; // HH:MM format
  availabilityEnd?: string;   // HH:MM format
  isRegional: boolean;
}

interface TimezoneContextType {
  selectedTimezone: string;
  timezoneInfo: TimezoneInfo;
  timezones: TimezoneInfo[];
  activePromotions: TimezonePromotion[];
  regionalVouchers: RegionalVoucher[];
  businessHours: RegionalBusinessHours[];
  setTimezone: (timezone: string) => void;
  getCurrentPromotions: () => TimezonePromotion[];
  getRegionalVouchers: () => RegionalVoucher[];
  isBusinessHours: () => boolean;
  getNextPromotion: () => TimezonePromotion | null;
  getTimeUntilNextPromotion: () => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Sample promotions data
const TIMEZONE_PROMOTIONS: TimezonePromotion[] = [
  {
    id: 'happy-hour-us',
    name: 'Happy Hour Special',
    description: '50% off all dining vouchers',
    discount: 50,
    startTime: '17:00',
    endTime: '19:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
    voucherCategories: ['dining', 'restaurant'],
    isActive: false
  },
  {
    id: 'lunch-rush-europe',
    name: 'Lunch Rush Deal',
    description: '30% off lunch vouchers',
    discount: 30,
    startTime: '12:00',
    endTime: '14:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
    timezones: ['Europe/London', 'Europe/Paris', 'Europe/Berlin'],
    voucherCategories: ['dining', 'lunch'],
    isActive: false
  },
  {
    id: 'weekend-shopping-asia',
    name: 'Weekend Shopping Spree',
    description: '25% off retail vouchers',
    discount: 25,
    startTime: '10:00',
    endTime: '18:00',
    days: [0, 6], // Saturday and Sunday
    timezones: ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai'],
    voucherCategories: ['shopping', 'retail'],
    isActive: false
  },
  {
    id: 'morning-coffee-global',
    name: 'Morning Coffee Boost',
    description: '20% off coffee vouchers',
    discount: 20,
    startTime: '07:00',
    endTime: '10:00',
    days: [1, 2, 3, 4, 5], // Monday to Friday
    timezones: ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'],
    voucherCategories: ['coffee', 'beverage'],
    isActive: false
  }
];

// Sample business hours data
const REGIONAL_BUSINESS_HOURS: RegionalBusinessHours[] = [
  {
    timezone: 'America/New_York',
    region: 'Eastern US',
    businessHours: { start: '09:00', end: '18:00' },
    weekendHours: { start: '10:00', end: '16:00' }
  },
  {
    timezone: 'Europe/London',
    region: 'UK',
    businessHours: { start: '09:00', end: '17:00' },
    weekendHours: { start: '10:00', end: '15:00' }
  },
  {
    timezone: 'Asia/Tokyo',
    region: 'Japan',
    businessHours: { start: '09:00', end: '18:00' },
    weekendHours: { start: '10:00', end: '17:00' }
  },
  {
    timezone: 'Australia/Sydney',
    region: 'Australia',
    businessHours: { start: '08:30', end: '17:30' },
    weekendHours: { start: '09:00', end: '16:00' }
  }
];

// Sample regional vouchers
const REGIONAL_VOUCHERS: RegionalVoucher[] = [
  {
    voucherId: 'local-restaurant-ny',
    title: 'NYC Local Eateries',
    timezones: ['America/New_York'],
    availabilityStart: '11:00',
    availabilityEnd: '22:00',
    isRegional: true
  },
  {
    voucherId: 'london-pubs',
    title: 'London Pub Experience',
    timezones: ['Europe/London'],
    availabilityStart: '17:00',
    availabilityEnd: '23:00',
    isRegional: true
  },
  {
    voucherId: 'tokyo-ramen',
    title: 'Tokyo Ramen Tours',
    timezones: ['Asia/Tokyo'],
    availabilityStart: '12:00',
    availabilityEnd: '21:00',
    isRegional: true
  }
];

export const TimezoneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getUserTimezone());
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo>(getTimezoneInfo(selectedTimezone));
  const [timezones] = useState<TimezoneInfo[]>(getCommonTimezones());
  const [activePromotions, setActivePromotions] = useState<TimezonePromotion[]>([]);

  // Update timezone info when selected timezone changes
  useEffect(() => {
    setTimezoneInfo(getTimezoneInfo(selectedTimezone));
    updateActivePromotions();
  }, [selectedTimezone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update promotions every minute
  useEffect(() => {
    const interval = setInterval(updateActivePromotions, 60000);
    updateActivePromotions(); // Initial update
    return () => clearInterval(interval);
  }, [selectedTimezone]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateActivePromotions = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: selectedTimezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const currentDay = now.getDay();

    const active = TIMEZONE_PROMOTIONS.filter(promotion => {
      // Check if timezone matches
      if (!promotion.timezones.includes(selectedTimezone)) return false;
      
      // Check if current day is included
      if (!promotion.days.includes(currentDay)) return false;
      
      // Check if current time is within promotion hours
      const isActiveTime = currentTime >= promotion.startTime && currentTime <= promotion.endTime;
      
      return isActiveTime;
    });

    setActivePromotions(active);
  };

  const setTimezone = (timezone: string) => {
    setSelectedTimezone(timezone);
    localStorage.setItem('selectedTimezone', timezone);
  };

  const getCurrentPromotions = (): TimezonePromotion[] => {
    return activePromotions;
  };

  const getRegionalVouchers = (): RegionalVoucher[] => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: selectedTimezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    return REGIONAL_VOUCHERS.filter(voucher => {
      if (!voucher.isRegional) return true; // Global vouchers always available
      
      // Check if timezone matches
      if (!voucher.timezones.includes(selectedTimezone)) return false;
      
      // Check availability hours if specified
      if (voucher.availabilityStart && voucher.availabilityEnd) {
        return currentTime >= voucher.availabilityStart && currentTime <= voucher.availabilityEnd;
      }
      
      return true;
    });
  };

  const isBusinessHours = (): boolean => {
    const businessHours = REGIONAL_BUSINESS_HOURS.find(bh => bh.timezone === selectedTimezone);
    if (!businessHours) return true; // Default to available if no specific hours

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: selectedTimezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const currentDay = now.getDay();

    // Weekend hours
    if (currentDay === 0 || currentDay === 6) {
      if (businessHours.weekendHours) {
        return currentTime >= businessHours.weekendHours.start && 
               currentTime <= businessHours.weekendHours.end;
      }
      return false;
    }

    // Weekday hours
    return currentTime >= businessHours.businessHours.start && 
           currentTime <= businessHours.businessHours.end;
  };

  const getNextPromotion = (): TimezonePromotion | null => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: selectedTimezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const currentDay = now.getDay();

    // Find next promotion for current timezone
    const upcomingPromotions = TIMEZONE_PROMOTIONS
      .filter(p => p.timezones.includes(selectedTimezone))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check today's remaining promotions
    for (const promotion of upcomingPromotions) {
      if (promotion.days.includes(currentDay) && promotion.startTime > currentTime) {
        return promotion;
      }
    }

    // Check tomorrow's first promotion
    const tomorrow = (currentDay + 1) % 7;
    for (const promotion of upcomingPromotions) {
      if (promotion.days.includes(tomorrow)) {
        return promotion;
      }
    }

    return null;
  };

  const getTimeUntilNextPromotion = (): string => {
    const nextPromotion = getNextPromotion();
    if (!nextPromotion) return '';

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: selectedTimezone, 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const currentDay = now.getDay();

    // Calculate time until next promotion
    let targetDate = new Date();
    
    if (nextPromotion.days.includes(currentDay) && nextPromotion.startTime > currentTime) {
      // Today
      const [hours, minutes] = nextPromotion.startTime.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    } else {
      // Tomorrow
      targetDate.setDate(targetDate.getDate() + 1);
      const [hours, minutes] = nextPromotion.startTime.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
    }

    const timeDiff = targetDate.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const value: TimezoneContextType = {
    selectedTimezone,
    timezoneInfo,
    timezones,
    activePromotions,
    regionalVouchers: REGIONAL_VOUCHERS,
    businessHours: REGIONAL_BUSINESS_HOURS,
    setTimezone,
    getCurrentPromotions,
    getRegionalVouchers,
    isBusinessHours,
    getNextPromotion,
    getTimeUntilNextPromotion
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
