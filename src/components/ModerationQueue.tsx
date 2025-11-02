import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ModerationAction {
  id: string;
  type: "warning" | "timeout" | "ban" | "content_removal" | "post_lock";
  targetType: "user" | "post" | "comment";
  targetId: string;
  moderatorId: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "completed" | "appealed" | "overturned";
  createdAt: string;
  expiresAt?: string;
  metadata?: {
    originalContent?: string;
    appealReason?: string;
    previousActions?: number;
    autoDetected?: boolean;
  };
}

interface ModerationQueueProps {
  actions: ModerationAction[];
  onActionTaken: (
    actionId: string,
    decision: "approve" | "reject" | "escalate"
  ) => void;
  onViewDetails: (actionId: string) => void;
  loading?: boolean;
}

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  appealed: "bg-purple-100 text-purple-800",
  overturned: "bg-gray-100 text-gray-800",
};

const typeIcons = {
  warning: AlertTriangle,
  timeout: Clock,
  ban: Shield,
  content_removal: XCircle,
  post_lock: Flag,
};

export function ModerationQueue({
  actions,
  onActionTaken,
  onViewDetails,
  loading = false,
}: ModerationQueueProps) {
  const pendingActions = actions.filter(
    (action) => action.status === "pending"
  );
  const recentActions = actions
    .filter((action) => action.status !== "pending")
    .slice(0, 10);

  const getActionIcon = (type: ModerationAction["type"]) => {
    const Icon = typeIcons[type];
    return <Icon className="h-4 w-4" />;
  };

  const formatActionTitle = (action: ModerationAction) => {
    const typeLabels = {
      warning: "Warning Issued",
      timeout: "User Timeout",
      ban: "User Ban",
      content_removal: "Content Removed",
      post_lock: "Post Locked",
    };
    return typeLabels[action.type];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Actions Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Pending Moderation Actions</span>
            {pendingActions.length > 0 && (
              <Badge variant="secondary">{pendingActions.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve moderation actions that require manual review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {pendingActions.length > 0 ? (
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">
                            {formatActionTitle(action)}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.reason}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(action.createdAt),
                                  { addSuffix: true }
                                )}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>
                                Target: {action.targetType} #
                                {action.targetId.slice(-6)}
                              </span>
                            </span>
                            {action.metadata?.autoDetected && (
                              <Badge variant="outline" className="text-xs">
                                Auto-detected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={severityColors[action.severity]}>
                          {action.severity}
                        </Badge>
                      </div>
                    </div>

                    {action.metadata?.originalContent && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Original Content:
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {action.metadata.originalContent}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {action.metadata?.previousActions && (
                          <span>
                            {action.metadata.previousActions} previous actions
                          </span>
                        )}
                        {action.expiresAt && (
                          <span>
                            Expires{" "}
                            {formatDistanceToNow(new Date(action.expiresAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(action.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onActionTaken(action.id, "reject")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onActionTaken(action.id, "approve")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending moderation actions</p>
                <p className="text-sm mt-1">All clear! Check back later.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Actions History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Actions</span>
          </CardTitle>
          <CardDescription>
            History of recently processed moderation actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActions.length > 0 ? (
              recentActions.map((action, index) => (
                <div key={action.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {formatActionTitle(action)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[action.status]}>
                        {action.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={severityColors[action.severity]}
                      >
                        {action.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(action.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {index < recentActions.length - 1 && <Separator />}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent actions to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingActions.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    actions.filter(
                      (a) =>
                        a.status === "completed" &&
                        new Date(a.createdAt).toDateString() ===
                          new Date().toDateString()
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appeals</p>
                <p className="text-2xl font-bold text-purple-600">
                  {actions.filter((a) => a.status === "appealed").length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    actions.filter(
                      (a) => a.severity === "critical" && a.status === "pending"
                    ).length
                  }
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
