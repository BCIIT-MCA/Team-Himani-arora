import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

// Import translation files - simplified to avoid build issues
const enTranslations = {
  welcome: "Welcome to Solace",
  navigation: {
    home: "Home",
    community: "Community",
    resources: "Resources",
    appointments: "Appointments",
  },
};
const hiTranslations = {
  welcome: "सोलेस में आपका स्वागत है",
  navigation: {
    home: "घर",
    community: "समुदाय",
    resources: "संसाधन",
    appointments: "नियुक्तियां",
  },
};
const bnTranslations = {
  welcome: "সোলেসে স্বাগতম",
  navigation: {
    home: "হোম",
    community: "কমিউনিটি",
    resources: "রিসোর্স",
    appointments: "অ্যাপয়েন্টমেন্ট",
  },
};

const resources = {
  en: {
    translation: enTranslations,
  },
  hi: {
    translation: hiTranslations,
  },
  bn: {
    translation: bnTranslations,
  },
};

i18n
  .use(Backend) // Load translations using http backend
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,

    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],

      // Keys or params to lookup language from
      lookupQuerystring: "lng",
      lookupCookie: "i18next",
      lookupLocalStorage: "solace-language",

      // Cache user language on
      caches: ["localStorage", "cookie"],

      // Optional expire and domain for set cookie
      cookieMinutes: 10080, // 7 days
      cookieDomain: window.location.hostname,
    },

    fallbackLng: "en", // Fallback language
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Backend options for loading translations
    backend: {
      loadPath: "/locales/{{lng}}.json",
      addPath: "/locales/{{lng}}.json",
    },

    // React i18next options
    react: {
      useSuspense: false, // Disable suspense for better error handling
      bindI18n: "languageChanged",
      bindI18nStore: "",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "em", "u", "span"],
    },

    // Namespace and key separator
    ns: ["translation"],
    defaultNS: "translation",
    keySeparator: ".",
    nsSeparator: ":",

    // Pluralization
    pluralSeparator: "_",
    contextSeparator: "_",

    // Missing key handling
    saveMissing: process.env.NODE_ENV === "development",
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },

    // Post processing
    postProcess: ["interval", "pluralInterval"],
  });

// Add language change event listener for analytics
i18n.on("languageChanged", (lng) => {
  // Update HTML lang attribute
  document.documentElement.lang = lng;

  // Update document direction for RTL languages
  const rtlLanguages = ["ar", "he", "fa", "ur"];
  document.documentElement.dir = rtlLanguages.includes(lng) ? "rtl" : "ltr";

  // Add language class to body for CSS targeting
  document.body.className = document.body.className.replace(/lang-\w{2}/g, "");
  document.body.classList.add(`lang-${lng}`);

  // Track language change for analytics
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "language_change", {
      language: lng,
      previous_language: i18n.language,
    });
  }

  console.log(`Language changed to: ${lng}`);
});

// Custom formatting functions for different locales
export const formatters = {
  // Number formatting
  number: (value: number, lng: string = i18n.language) => {
    const locale = lng === "hi" ? "hi-IN" : lng === "bn" ? "bn-BD" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
  },

  // Currency formatting
  currency: (
    value: number,
    currency: string = "INR",
    lng: string = i18n.language
  ) => {
    const locale = lng === "hi" ? "hi-IN" : lng === "bn" ? "bn-BD" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value);
  },

  // Date formatting
  date: (
    value: Date | string,
    options?: Intl.DateTimeFormatOptions,
    lng: string = i18n.language
  ) => {
    const date = typeof value === "string" ? new Date(value) : value;
    const locale = lng === "hi" ? "hi-IN" : lng === "bn" ? "bn-BD" : "en-US";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  },

  // Relative time formatting
  relativeTime: (value: Date | string, lng: string = i18n.language) => {
    const date = typeof value === "string" ? new Date(value) : value;
    const locale = lng === "hi" ? "hi-IN" : lng === "bn" ? "bn-BD" : "en-US";

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
  },
};

// Helper functions for text processing
export const textHelpers = {
  // Capitalize first letter respecting language rules
  capitalize: (text: string, lng: string = i18n.language) => {
    if (!text) return text;

    // Special handling for different languages
    switch (lng) {
      case "hi":
      case "bn":
        // For Devanagari and Bengali scripts, return as-is
        return text;
      default:
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
  },

  // Truncate text with proper ellipsis
  truncate: (text: string, maxLength: number, lng: string = i18n.language) => {
    if (text.length <= maxLength) return text;

    const ellipsis = lng === "hi" ? "..." : lng === "bn" ? "..." : "...";
    return text.slice(0, maxLength - ellipsis.length) + ellipsis;
  },

  // Word count respecting language boundaries
  wordCount: (text: string, lng: string = i18n.language) => {
    if (!text) return 0;

    switch (lng) {
      case "hi":
      case "bn":
        // For scripts without clear word boundaries, count by characters/spaces
        return text.trim().split(/\s+/).length;
      default:
        return text.trim().split(/\s+/).length;
    }
  },
};

// Export the configured i18n instance
export default i18n;
