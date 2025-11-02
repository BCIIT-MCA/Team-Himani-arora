import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface I18nContextType {
  language: string;
  changeLanguage: (lng: string) => void;
  isLoading: boolean;
  availableLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const availableLanguages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Load saved language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        // Check for user's saved preference first
        if (user?.user_metadata?.preferred_language) {
          const savedLanguage = user.user_metadata.preferred_language;
          if (savedLanguage !== i18n.language) {
            setIsLoading(true);
            await i18n.changeLanguage(savedLanguage);
            setIsLoading(false);
          }
          return;
        }

        // Check localStorage for anonymous users
        const savedLanguage = localStorage.getItem("solace-language");
        if (savedLanguage && savedLanguage !== i18n.language) {
          setIsLoading(true);
          await i18n.changeLanguage(savedLanguage);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load language preference:", error);
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, [user, i18n]);

  const changeLanguage = async (lng: string) => {
    try {
      setIsLoading(true);
      await i18n.changeLanguage(lng);

      // Save preference locally
      localStorage.setItem("solace-language", lng);

      // Save to user profile if authenticated
      if (user) {
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase.auth.updateUser({
            data: { preferred_language: lng },
          });
        } catch (error) {
          console.error(
            "Failed to save language preference to profile:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Failed to change language:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: I18nContextType = {
    language: i18n.language,
    changeLanguage,
    isLoading,
    availableLanguages,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// Language detection utilities
export const detectUserLanguage = (): string => {
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang");
  if (urlLang && availableLanguages.some((lang) => lang.code === urlLang)) {
    return urlLang;
  }

  // Check localStorage
  const savedLang = localStorage.getItem("solace-language");
  if (savedLang && availableLanguages.some((lang) => lang.code === savedLang)) {
    return savedLang;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (availableLanguages.some((lang) => lang.code === browserLang)) {
    return browserLang;
  }

  // Default to English
  return "en";
};

// RTL language support
export const isRTLLanguage = (language: string): boolean => {
  const rtlLanguages = ["ar", "he", "fa", "ur"];
  return rtlLanguages.includes(language);
};

// Number formatting for different locales
export const formatNumber = (number: number, language: string): string => {
  const locale =
    language === "hi" ? "hi-IN" : language === "bn" ? "bn-BD" : "en-US";

  return new Intl.NumberFormat(locale).format(number);
};

// Date formatting for different locales
export const formatDate = (
  date: Date,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale =
    language === "hi" ? "hi-IN" : language === "bn" ? "bn-BD" : "en-US";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
};

// Relative time formatting
export const formatRelativeTime = (date: Date, language: string): string => {
  const locale =
    language === "hi" ? "hi-IN" : language === "bn" ? "bn-BD" : "en-US";

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, "second");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, "minute");
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, "hour");
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, "day");
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, "month");
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return rtf.format(diffInYears, "year");
};

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string,
  language: string
): string => {
  const locale =
    language === "hi" ? "hi-IN" : language === "bn" ? "bn-BD" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Text direction utilities
export const getTextDirection = (language: string): "ltr" | "rtl" => {
  return isRTLLanguage(language) ? "rtl" : "ltr";
};

// Language-specific CSS class
export const getLanguageClass = (language: string): string => {
  return `lang-${language} ${getTextDirection(language)}`;
};
