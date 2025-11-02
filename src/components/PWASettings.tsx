import React, { useEffect, useState } from "react";
import { usePWA } from "@/contexts/PWAContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  HardDrive,
  Clock,
  Shield,
} from "lucide-react";

export function PWASettings() {
  const {
    isInstalled,
    isInstallable,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp,
  } = usePWA();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    // Check notification permission
    const checkNotifications = () => {
      if ("Notification" in window) {
        setNotificationsEnabled(Notification.permission === "granted");
      }
    };

    // Get cache information
    const getCacheInfo = async () => {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          setCacheSize(
            `${(used / 1024 / 1024).toFixed(1)} MB of ${(
              quota /
              1024 /
              1024
            ).toFixed(0)} MB`
          );
        } catch (error) {
          console.error("Failed to get storage estimate:", error);
        }
      }
    };

    // Get last update time
    const getLastUpdate = () => {
      const lastUpdateTime = localStorage.getItem("solace-last-update");
      if (lastUpdateTime) {
        const date = new Date(lastUpdateTime);
        setLastUpdate(
          date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })
        );
      }
    };

    checkNotifications();
    getCacheInfo();
    getLastUpdate();

    // Check background sync capability
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      setBackgroundSync(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === "granted");

        if (permission === "granted") {
          // Register for push notifications
          if ("serviceWorker" in navigator) {
            const registration =
              await navigator.serviceWorker.getRegistration();
            if (registration) {
              // Subscribe to push notifications
              // This would typically involve server-side setup
              console.log("Push notifications enabled");
            }
          }
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
      }
    }
  };

  const clearCache = async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );

        // Refresh cache size
        if ("storage" in navigator && "estimate" in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          setCacheSize(
            `${(used / 1024 / 1024).toFixed(1)} MB of ${(
              quota /
              1024 /
              1024
            ).toFixed(0)} MB`
          );
        }

        // Show success message
        if (notificationsEnabled) {
          new Notification("Cache Cleared", {
            body: "App cache has been cleared successfully.",
            icon: "/icons/icon-192x192.png",
          });
        }
      } catch (error) {
        console.error("Failed to clear cache:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">App Settings</h2>
        <p className="text-muted-foreground">
          Manage your Progressive Web App experience
        </p>
      </div>

      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Installation</span>
          </CardTitle>
          <CardDescription>
            Install Solace as a native app for the best experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium">
                  {isInstalled ? "App Installed" : "Web Version"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isInstalled
                    ? "You have the full app experience"
                    : "Running in browser mode"}
                </p>
              </div>
              <Badge variant={isInstalled ? "default" : "secondary"}>
                {isInstalled ? "Installed" : "Browser"}
              </Badge>
            </div>
            {isInstallable && !isInstalled && (
              <Button onClick={installApp}>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
            <span>Connection</span>
          </CardTitle>
          <CardDescription>
            Your current connection status and offline capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium">{isOnline ? "Online" : "Offline"}</p>
                <p className="text-sm text-muted-foreground">
                  {isOnline
                    ? "All features available"
                    : "Limited offline functionality"}
                </p>
              </div>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Updates</span>
          </CardTitle>
          <CardDescription>
            Keep your app up to date with the latest features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium">
                  {isUpdateAvailable ? "Update Available" : "Up to Date"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lastUpdate
                    ? `Last updated: ${lastUpdate}`
                    : "No update history"}
                </p>
              </div>
              {isUpdateAvailable && (
                <Badge variant="default">New Version</Badge>
              )}
            </div>
            {isUpdateAvailable && (
              <Button onClick={updateApp}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Receive important updates and reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified about crisis alerts and community updates
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={requestNotificationPermission}
            />
          </div>
        </CardContent>
      </Card>

      {/* Background Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Background Sync</span>
          </CardTitle>
          <CardDescription>
            Sync data when connection is restored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Automatic Sync</p>
              <p className="text-sm text-muted-foreground">
                {backgroundSync
                  ? "Your data will sync automatically when online"
                  : "Background sync not supported on this device"}
              </p>
            </div>
            <Badge variant={backgroundSync ? "default" : "secondary"}>
              {backgroundSync ? "Enabled" : "Not Available"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Storage</span>
          </CardTitle>
          <CardDescription>Manage app data and cache</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cache Size</p>
                <p className="text-sm text-muted-foreground">
                  {cacheSize || "Calculating..."}
                </p>
              </div>
              <Button variant="outline" onClick={clearCache}>
                Clear Cache
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Privacy Note</p>
                  <p className="text-xs text-muted-foreground">
                    Clearing cache will remove offline content but won't affect
                    your account data or posts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
