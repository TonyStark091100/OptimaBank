import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Import language files
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';
import msTranslations from '../locales/ms.json';
import taTranslations from '../locales/ta.json';
import zhTranslations from '../locales/zh.json';

export type Language = 'en' | 'es' | 'fr' | 'ms' | 'ta' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const translations = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  ms: msTranslations,
  ta: taTranslations,
  zh: zhTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const availableLanguages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'ms' as Language, name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ta' as Language, name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('optima-language') as Language;
    const initialLanguage = savedLanguage && ['en', 'es', 'fr', 'ms', 'ta', 'zh'].includes(savedLanguage) ? savedLanguage : 'en';
    console.log('LanguageProvider: Initializing with language:', initialLanguage);
    console.log('LanguageProvider: Saved language from localStorage:', savedLanguage);
    return initialLanguage;
  });

  const setLanguage = (lang: Language) => {
    console.log('LanguageContext: Setting language to:', lang);
    console.log('LanguageContext: Current language before change:', language);
    setLanguageState(lang);
    localStorage.setItem('optima-language', lang);
    console.log('LanguageContext: Language saved to localStorage:', localStorage.getItem('optima-language'));
  };

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    console.log(`Translation function called: key="${key}", language="${language}"`);
    const keys = key.split('.');
    let value: any = translations[language];
    
    console.log(`Available translations for ${language}:`, translations[language]);
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            console.log(`Translation not found for key: ${key}`);
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      console.log(`Translation value is not a string for key: ${key}, value:`, value);
      return key;
    }

    console.log(`Translation result: "${value}" for key: "${key}"`);

    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  }, [language]);

  // Set document language and direction
  useEffect(() => {
    document.documentElement.lang = language;
    
    // Set text direction - Tamil and Chinese are LTR, but we might want to handle RTL languages in the future
    const rtlLanguages = ['ar', 'he', 'fa', 'ur']; // Arabic, Hebrew, Persian, Urdu
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr';
    
    // Set font family for better rendering of specific languages
    if (language === 'ta') {
      document.body.style.fontFamily = '"Noto Sans Tamil", "Tahoma", sans-serif';
    } else if (language === 'zh') {
      document.body.style.fontFamily = '"Noto Sans SC", "Microsoft YaHei", "SimSun", sans-serif';
    } else if (language === 'ms') {
      document.body.style.fontFamily = '"Noto Sans", "Arial", sans-serif';
    } else {
      document.body.style.fontFamily = 'inherit';
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook for easy translation
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};
