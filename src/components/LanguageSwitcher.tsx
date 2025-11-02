import React from "react";
import { useTranslation } from "react-i18next";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage, isLoading, availableLanguages } = useI18n();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== language) {
      await changeLanguage(languageCode);
    }
  };

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === language
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage?.nativeName || currentLanguage?.name || "Language"}
          </span>
          <span className="sm:hidden">
            {currentLanguage?.code.toUpperCase() || "EN"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-sm text-muted-foreground">{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact() {
  const { language, changeLanguage, isLoading, availableLanguages } = useI18n();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== language) {
      await changeLanguage(languageCode);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 p-0"
          disabled={isLoading}
        >
          <span className="text-xs font-medium">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer text-sm"
          >
            <span>{lang.nativeName}</span>
            {language === lang.code && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Language switcher for settings page
export function LanguageSettings() {
  const { t } = useTranslation();
  const { language, changeLanguage, isLoading, availableLanguages } = useI18n();

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode !== language) {
      await changeLanguage(languageCode);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">
          {t("settings.language", "Language")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "settings.languageDescription",
            "Choose your preferred language for the interface."
          )}
        </p>
      </div>

      <div className="grid gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isLoading}
            className={`
              p-4 text-left border rounded-lg transition-colors
              ${
                language === lang.code
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-sm text-muted-foreground">{lang.name}</div>
              </div>
              {language === lang.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          {t("common.loading", "Loading...")}
        </div>
      )}
    </div>
  );
}
