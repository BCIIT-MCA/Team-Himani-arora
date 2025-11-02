import React from "react";
import { useCrisisMonitoring } from "@/hooks/useCrisisMonitoring";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Heart,
  Shield,
  Clock,
  User,
  MessageSquare,
  TrendingUp,
  Activity,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CrisisAlert {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  detectedAt: string;
  status:
    | "pending"
    | "acknowledged"
    | "contacted"
    | "resolved"
    | "false_positive";
  triggers: string[];
  suggestedActions: string[];
  assignedTo?: string;
  notes?: string;
  context?: {
    previousAlerts?: number;
    recentActivity?: string;
    supportConnections?: number;
  };
}

interface CrisisMonitoringDashboardProps {
  onViewAlert: (alertId: string) => void;
  onUpdateAlertStatus: (
    alertId: string,
    status: CrisisAlert["status"],
    notes?: string
  ) => void;
  onAssignAlert: (alertId: string, assigneeId: string) => void;
}

const riskLevelColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  acknowledged: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  false_positive: "bg-gray-100 text-gray-800",
};

export function CrisisMonitoringDashboard({
  onViewAlert,
  onUpdateAlertStatus,
  onAssignAlert,
}: CrisisMonitoringDashboardProps) {
  const {
    activeAlerts,
    recentAlerts,
    crisisMetrics,
    isMonitoring,
    loading,
    error,
    startMonitoring,
    stopMonitoring,
    refreshAlerts,
  } = useCrisisMonitoring();

  const priorityAlerts = activeAlerts
    .filter(
      (alert) => alert.riskLevel === "critical" || alert.riskLevel === "high"
    )
    .sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });

  const handleQuickAction = (
    alertId: string,
    action: "acknowledge" | "contact" | "resolve"
  ) => {
    const statusMap = {
      acknowledge: "acknowledged" as const,
      contact: "contacted" as const,
      resolve: "resolved" as const,
    };
    onUpdateAlertStatus(alertId, statusMap[action]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="text-lg">Loading crisis monitoring...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load crisis monitoring data: {error}
          <Button onClick={refreshAlerts} className="ml-4" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Crisis Monitoring Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time monitoring and response to mental health crises
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={isMonitoring ? "default" : "outline"}
            className="mr-2"
          >
            <Activity className="h-3 w-3 mr-1" />
            {isMonitoring ? "Active" : "Inactive"}
          </Badge>
          {isMonitoring ? (
            <Button onClick={stopMonitoring} variant="outline">
              Stop Monitoring
            </Button>
          ) : (
            <Button onClick={startMonitoring}>Start Monitoring</Button>
          )}
          <Button onClick={refreshAlerts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {crisisMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-red-600">
                    {activeAlerts.length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">
                    {crisisMetrics.avgResponseTime}m
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Resolution Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {crisisMetrics.resolutionRate}%
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
                  <p className="text-sm text-muted-foreground">Weekly Trend</p>
                  <p className="text-2xl font-bold">
                    {crisisMetrics.weeklyTrend > 0 ? "+" : ""}
                    {crisisMetrics.weeklyTrend}%
                  </p>
                </div>
                <TrendingUp
                  className={`h-8 w-8 ${
                    crisisMetrics.weeklyTrend > 0
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Priority Alerts */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Priority Alerts</span>
            {priorityAlerts.length > 0 && (
              <Badge variant="destructive">{priorityAlerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            High and critical risk alerts requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {priorityAlerts.length > 0 ? (
              <div className="space-y-4">
                {priorityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 space-y-3 ${
                      riskLevelColors[alert.riskLevel]
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              alert.riskLevel === "critical"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-sm">
                              User:{" "}
                              {alert.userName || `#${alert.userId.slice(-6)}`}
                            </h4>
                            <Badge className={riskLevelColors[alert.riskLevel]}>
                              {alert.riskLevel.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {(alert.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>

                          <div className="bg-white/50 rounded p-2 mb-2">
                            <p className="text-sm line-clamp-2">
                              {alert.content}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {alert.triggers.map((trigger, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {trigger}
                              </Badge>
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Detected{" "}
                            {formatDistanceToNow(new Date(alert.detectedAt), {
                              addSuffix: true,
                            })}
                            {alert.context?.previousAlerts && (
                              <span className="ml-2">
                                • {alert.context.previousAlerts} previous alerts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge className={statusColors[alert.status]}>
                        {alert.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {alert.suggestedActions.length > 0 && (
                      <div className="bg-white/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">
                          Suggested Actions:
                        </p>
                        <ul className="text-xs space-y-1">
                          {alert.suggestedActions
                            .slice(0, 2)
                            .map((action, i) => (
                              <li
                                key={i}
                                className="flex items-center space-x-1"
                              >
                                <ArrowRight className="h-3 w-3" />
                                <span>{action}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-current/20">
                      <div className="flex items-center space-x-1 text-xs">
                        {alert.assignedTo && (
                          <span>Assigned to: {alert.assignedTo}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewAlert(alert.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        {alert.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleQuickAction(alert.id, "acknowledge")
                            }
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === "acknowledged" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleQuickAction(alert.id, "contact")
                            }
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No priority alerts at this time</p>
                <p className="text-sm mt-1">
                  Community appears to be in good health
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Crisis Activity</span>
          </CardTitle>
          <CardDescription>
            Latest alerts and interventions across all risk levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? (
              recentAlerts.slice(0, 10).map((alert, index) => (
                <div key={alert.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.riskLevel === "critical"
                              ? "text-red-500"
                              : alert.riskLevel === "high"
                              ? "text-orange-500"
                              : alert.riskLevel === "medium"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {alert.riskLevel.charAt(0).toUpperCase() +
                            alert.riskLevel.slice(1)}{" "}
                          risk alert
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          User: {alert.userName || `#${alert.userId.slice(-6)}`}{" "}
                          • {alert.triggers.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[alert.status]}>
                        {alert.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.detectedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {index < recentAlerts.slice(0, 10).length - 1 && (
                    <Separator />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent crisis activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
