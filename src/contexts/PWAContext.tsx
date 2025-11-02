import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  showInstallPrompt: boolean;
  hideInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Check if app is already installed
  useEffect(() => {
    const checkInstallation = () => {
      // Check if running as PWA
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");
      setIsInstalled(isPWA);
    };

    checkInstallation();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstallation);

    return () => mediaQuery.removeEventListener("change", checkInstallation);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Show install prompt if user hasn't dismissed it
      const promptDismissed = localStorage.getItem(
        "solace-install-prompt-dismissed"
      );
      if (!promptDismissed && !isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);

      // Track installation
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "pwa_install", {
          method: "browser_prompt",
        });
      }
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallPromptHandler
      );
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, [isInstalled]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show notification when coming back online
      if (
        "serviceWorker" in navigator &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(
          t("common.connectionRestored", "Connection restored"),
          {
            body: t("common.backOnline", "You are back online"),
            icon: "/icons/icon-192x192.png",
            tag: "connection-status",
          }
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Show notification when going offline
      if (
        "serviceWorker" in navigator &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(t("common.connectionLost", "Connection lost"), {
          body: t("common.workingOffline", "Working in offline mode"),
          icon: "/icons/icon-192x192.png",
          tag: "connection-status",
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [t]);

  // Handle service worker updates
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Service worker has been updated
        setIsUpdateAvailable(true);
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SW_UPDATE_AVAILABLE") {
          setIsUpdateAvailable(true);
        }
      });
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setShowInstallPrompt(false);

        // Track successful installation
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "pwa_install_accepted", {
            method: "user_prompt",
          });
        }
      } else {
        // Track installation dismissal
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "pwa_install_dismissed", {
            method: "user_prompt",
          });
        }
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Failed to install app:", error);
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          // Send message to service worker to skip waiting
          registration.waiting.postMessage({ type: "SKIP_WAITING" });

          // Reload the page to use the new service worker
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to update app:", error);
      }
    }
  }, []);

  const hideInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    // Remember that user dismissed the prompt
    localStorage.setItem("solace-install-prompt-dismissed", "true");

    // Track prompt dismissal
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "pwa_install_prompt_dismissed");
    }
  }, []);

  const value: PWAContextType = {
    isInstalled,
    isInstallable,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp,
    showInstallPrompt,
    hideInstallPrompt,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA(): PWAContextType {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

// Component for install prompt
export function InstallPrompt() {
  const { t } = useTranslation();
  const { showInstallPrompt, installApp, hideInstallPrompt, isInstallable } =
    usePWA();

  if (!showInstallPrompt || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t("pwa.installPrompt.title", "Install Solace")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "pwa.installPrompt.description",
                "Get the full app experience with offline access and notifications."
              )}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={installApp}
                className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors"
              >
                {t("pwa.installPrompt.install", "Install")}
              </button>
              <button
                onClick={hideInstallPrompt}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {t("common.dismiss", "Dismiss")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for update notification
export function UpdateNotification() {
  const { t } = useTranslation();
  const { isUpdateAvailable, updateApp } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShow(true);
    }
  }, [isUpdateAvailable]);

  if (!show || !isUpdateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    await updateApp();
    setShow(false);
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t("pwa.updateNotification.title", "Update Available")}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t(
                "pwa.updateNotification.description",
                "A new version of Solace is available with improvements and bug fixes."
              )}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleUpdate}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
              >
                {t("pwa.updateNotification.update", "Update Now")}
              </button>
              <button
                onClick={() => setShow(false)}
                className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors"
              >
                {t("common.later", "Later")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m8-12h-6m-8 0h6"
          />
        </svg>
        <span>
          {t(
            "pwa.offline.message",
            "You are offline. Some features may be limited."
          )}
        </span>
      </div>
    </div>
  );
}
