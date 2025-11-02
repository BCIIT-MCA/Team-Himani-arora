import React, { useState } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "crisis_alert":
        return "🚨";
      case "forum_reply":
        return "💬";
      case "post_upvote":
      case "reply_upvote":
        return "👍";
      case "appointment_reminder":
        return "📅";
      case "assessment_reminder":
        return "📋";
      case "event_reminder":
        return "🎯";
      case "moderator_alert":
        return "🛡️";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "crisis_alert":
        return "bg-red-100 border-red-200 text-red-800";
      case "moderator_alert":
        return "bg-yellow-100 border-yellow-200 text-yellow-800";
      case "forum_reply":
      case "post_upvote":
      case "reply_upvote":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "appointment_reminder":
      case "assessment_reminder":
      case "event_reminder":
        return "bg-green-100 border-green-200 text-green-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-slate-100"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                You have {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-slate-500">
                    Loading notifications...
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Bell className="h-12 w-12 text-slate-300 mb-3" />
                  <div className="text-sm text-slate-500 text-center">
                    No notifications yet
                  </div>
                  <div className="text-xs text-slate-400 text-center mt-1">
                    We'll notify you when something important happens
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notification.read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(
                                    notification.type
                                  )}`}
                                >
                                  {notification.type.replace("_", " ")}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {formatDistanceToNow(
                                    new Date(notification.created_at),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                  className="p-1 h-auto"
                                  title="Mark as read"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteNotification(notification.id)
                                }
                                className="p-1 h-auto text-slate-400 hover:text-red-500"
                                title="Delete notification"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
