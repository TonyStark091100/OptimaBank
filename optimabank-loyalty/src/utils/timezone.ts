// Timezone utility functions
import { useState, useEffect } from 'react';
export interface TimezoneInfo {
  timezone: string;
  offset: string;
  city: string;
  country: string;
  currentTime: Date;
  formattedTime: string;
  formattedDate: string;
}

export const getTimezoneInfo = (timezone: string): TimezoneInfo => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + (getTimezoneOffset(timezone) * 3600000));
  
  const offset = getTimezoneOffsetString(timezone);
  const city = timezone.split('/')[1]?.replace(/_/g, ' ') || timezone;
  const country = timezone.split('/')[0] || 'UTC';
  
  return {
    timezone,
    offset,
    city,
    country,
    currentTime: localTime,
    formattedTime: localTime.toLocaleTimeString('en-US', {
      hour12: true,
      timeZone: timezone
    }),
    formattedDate: localTime.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
};

export const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (local.getTime() - utc.getTime()) / (1000 * 60 * 60);
};

export const getTimezoneOffsetString = (timezone: string): string => {
  const offset = getTimezoneOffset(timezone);
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset));
  const minutes = Math.floor((Math.abs(offset) - hours) * 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getCommonTimezones = (): TimezoneInfo[] => {
  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
  
  return commonTimezones.map(tz => getTimezoneInfo(tz));
};

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const formatTimeForTimezone = (date: Date, timezone: string): string => {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRelativeTime = (date: Date, timezone: string): string => {
  const now = new Date();
  const targetTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const currentTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const diffInSeconds = Math.floor((targetTime.getTime() - currentTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

// Real-time clock hook
export const useRealtimeClock = (timezone: string, updateInterval: number = 1000) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);
    
    return () => clearInterval(interval);
  }, [updateInterval]);
  
  return {
    currentTime,
    timezoneInfo: getTimezoneInfo(timezone),
    formattedTime: formatTimeForTimezone(currentTime, timezone)
  };
};

