import React, { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

interface GlobalNotificationsProviderProps {
  children: React.ReactNode;
}

export const GlobalNotificationsProvider: React.FC<
  GlobalNotificationsProviderProps
> = ({ children }) => {
  const { user } = useAuth();
  const { refresh } = useNotifications();

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  return <>{children}</>;
};
