import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

// Use the proper database types
type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: Partial<NotificationPreferences>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_PREFERENCES: Omit<
  NotificationPreferences,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  crisis_notifications: true,
  appointment_reminders: true,
  community_updates: true,
  moderation_alerts: true,
};

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] =
    useState<Partial<NotificationPreferences>>(DEFAULT_PREFERENCES);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(errorMessage);
      console.error("Error fetching notifications:", err);

      toast({
        title: "Error Loading Notifications",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_contact_method")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Map contact method preference to notification preferences
        const contactMethod = data.preferred_contact_method;
        setPreferences((prev) => ({
          ...prev,
          email: contactMethod === "email" || contactMethod === null,
          sms: contactMethod === "phone",
        }));
      }
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
    }
  }, [user]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id)
          .eq("user_id", user?.id);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to mark notification as read";
        console.error("Error marking notification as read:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user?.id, toast]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read";
      console.error("Error marking all notifications as read:", err);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", id)
          .eq("user_id", user?.id);

        if (error) throw error;

        setNotifications((prev) => prev.filter((notif) => notif.id !== id));

        toast({
          title: "Success",
          description: "Notification deleted",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete notification";
        console.error("Error deleting notification:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user?.id, toast]
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!user) return;

      try {
        const updatedPrefs = { ...preferences, ...prefs };

        // Map preferences to contact method
        let preferredContactMethod = "anonymous";
        if (updatedPrefs.email_notifications) {
          preferredContactMethod = "email";
        } else if (updatedPrefs.sms_notifications) {
          preferredContactMethod = "phone";
        }

        const { error } = await supabase
          .from("profiles")
          .update({ preferred_contact_method: preferredContactMethod })
          .eq("user_id", user.id);

        if (error) throw error;

        setPreferences(updatedPrefs);

        toast({
          title: "Success",
          description: "Notification preferences updated",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update preferences";
        console.error("Error updating preferences:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, preferences, toast]
  );

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchPreferences()]);
  }, [fetchNotifications, fetchPreferences]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);

          // Show toast for new notification if it's high priority
          if (newNotification.type === "crisis_alert") {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: "destructive",
            });
          } else if (newNotification.type === "appointment_reminder") {
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Initial load
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    refresh,
  };
};
