import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Heart,
  Flag,
  Shield,
  CheckCircle,
  X,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_id: string;
  type:
    | "post_liked"
    | "reply_received"
    | "post_moderated"
    | "appointment_reminder"
    | "crisis_alert"
    | "community_update";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: {
    post_id?: string;
    reply_id?: string;
    appointment_id?: string;
    moderator_id?: string;
    action?: string;
  };
}

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  community_updates: boolean;
  appointment_reminders: boolean;
  moderation_alerts: boolean;
  crisis_notifications: boolean;
}

interface NotificationUIProps {
  notifications: Notification[];
  preferences: NotificationPreferences;
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onUpdatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  onNavigateToPost?: (postId: string) => void;
  onNavigateToAppointment?: (appointmentId: string) => void;
  className?: string;
}

export const NotificationUI: React.FC<NotificationUIProps> = ({
  notifications,
  preferences,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdatePreferences,
  onNavigateToPost,
  onNavigateToAppointment,
  className,
}) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "post_liked":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "reply_received":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "post_moderated":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case "appointment_reminder":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "crisis_alert":
        return <Flag className="h-4 w-4 text-red-600" />;
      case "community_update":
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return "border-l-gray-200";

    switch (type) {
      case "post_liked":
        return "border-l-red-500";
      case "reply_received":
        return "border-l-blue-500";
      case "post_moderated":
        return "border-l-yellow-500";
      case "appointment_reminder":
        return "border-l-green-500";
      case "crisis_alert":
        return "border-l-red-600";
      case "community_update":
        return "border-l-purple-500";
      default:
        return "border-l-gray-300";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.post_id && onNavigateToPost) {
      onNavigateToPost(notification.data.post_id);
    } else if (notification.data?.appointment_id && onNavigateToAppointment) {
      onNavigateToAppointment(notification.data.appointment_id);
    }
  };

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const updatedPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(updatedPreferences);
    onUpdatePreferences({ [key]: value });
  };

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll see updates about your posts, replies, and appointments
                  here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications)
                .sort(
                  ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
                )
                .map(([date, dateNotifications]) => (
                  <div key={date} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-2">
                      {new Date(date).toLocaleDateString() ===
                      new Date().toLocaleDateString()
                        ? "Today"
                        : new Date(date).toLocaleDateString() ===
                          new Date(Date.now() - 86400000).toLocaleDateString()
                        ? "Yesterday"
                        : new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                    </h3>
                    {dateNotifications
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((notification) => (
                        <Card
                          key={notification.id}
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md border-l-4",
                            getNotificationColor(
                              notification.type,
                              notification.read
                            ),
                            !notification.read && "bg-muted/30"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4
                                      className={cn(
                                        "text-sm font-medium",
                                        !notification.read && "font-semibold"
                                      )}
                                    >
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatDistanceToNow(
                                      new Date(notification.created_at),
                                      { addSuffix: true }
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="email-notifications"
                          className="text-sm font-medium"
                        >
                          Email Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={localPreferences.email_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("email_notifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="sms-notifications"
                          className="text-sm font-medium"
                        >
                          SMS Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive important alerts via SMS
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={localPreferences.sms_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("sms_notifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {localPreferences.push_notifications ? (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <Label
                          htmlFor="push-notifications"
                          className="text-sm font-medium"
                        >
                          Push Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receive push notifications in the app
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={localPreferences.push_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("push_notifications", checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="community-updates"
                          className="text-sm font-medium"
                        >
                          Community Updates
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Likes, replies, and community interactions
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="community-updates"
                      checked={localPreferences.community_updates}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("community_updates", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="appointment-reminders"
                          className="text-sm font-medium"
                        >
                          Appointment Reminders
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Reminders for upcoming therapy sessions
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="appointment-reminders"
                      checked={localPreferences.appointment_reminders}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("appointment_reminders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label
                          htmlFor="moderation-alerts"
                          className="text-sm font-medium"
                        >
                          Moderation Alerts
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Updates about content moderation
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="moderation-alerts"
                      checked={localPreferences.moderation_alerts}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("moderation_alerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Flag className="h-4 w-4 text-red-500" />
                      <div>
                        <Label
                          htmlFor="crisis-notifications"
                          className="text-sm font-medium"
                        >
                          Crisis Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Important safety and crisis support alerts
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="crisis-notifications"
                      checked={localPreferences.crisis_notifications}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange("crisis_notifications", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
