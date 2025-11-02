import React from "react";
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Heart,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function AdvancedAnalyticsDashboard() {
  const {
    cohortData,
    userSegments,
    predictiveInsights,
    communityHealth,
    derivedMetrics,
    loading,
    error,
    refreshAllAnalytics,
    exportAnalyticsData,
  } = useAdvancedAnalytics();

  React.useEffect(() => {
    refreshAllAnalytics();
  }, [refreshAllAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-lg">Loading advanced analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load analytics: {error}</span>
            </div>
            <Button onClick={refreshAllAnalytics} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Student Wellness Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Deep insights into student wellness, academic stress patterns, and
            free service utilization
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportAnalyticsData("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={refreshAllAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {derivedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Retention Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {derivedMetrics.avgRetentionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    High Engagement
                  </p>
                  <p className="text-2xl font-bold">
                    {derivedMetrics.highEngagementPercentage.toFixed(1)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Critical Insights
                  </p>
                  <p className="text-2xl font-bold">
                    {derivedMetrics.criticalInsights}
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
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold">
                    {derivedMetrics.communityHealthScore}/100
                  </p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {derivedMetrics.totalActiveUsers.toLocaleString("en-IN")}
                  </p>
                </div>
                <Users className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="insights">Predictive Insights</TabsTrigger>
          <TabsTrigger value="health">Community Health</TabsTrigger>
        </TabsList>

        {/* Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>User Retention by Cohort</span>
              </CardTitle>
              <CardDescription>
                Track how different user cohorts retain over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cohortData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cohortData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cohortMonth" />
                      <YAxis
                        tickFormatter={(value) =>
                          `${(value * 100).toFixed(0)}%`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${(Number(value) * 100).toFixed(1)}%`,
                          "Retention Rate",
                        ]}
                        labelFormatter={(label) => `Cohort: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="retentionRates.month1"
                        stroke="#6366f1"
                        name="Month 1"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="retentionRates.month3"
                        stroke="#8b5cf6"
                        name="Month 3"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="retentionRates.month6"
                        stroke="#ec4899"
                        name="Month 6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  No cohort data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Segments */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>User Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userSegments.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={userSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ segment, percent }) =>
                            `${segment} (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {userSegments.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No segment data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSegments.map((segment, index) => (
                    <div
                      key={segment.segment}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {segment.segment.replace("_", " ")}
                        </h4>
                        <Badge
                          variant={
                            segment.engagementLevel === "high"
                              ? "default"
                              : segment.engagementLevel === "medium"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {segment.engagementLevel} engagement
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {segment.count.toLocaleString("en-IN")} users
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Avg: {segment.postsPerUser.toFixed(1)} posts,{" "}
                        {segment.commentsPerUser.toFixed(1)} comments per user
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {predictiveInsights.map((insight, index) => (
              <Card
                key={index}
                className={`border-l-4 ${
                  insight.priority === "critical"
                    ? "border-l-red-500"
                    : insight.priority === "high"
                    ? "border-l-orange-500"
                    : insight.priority === "medium"
                    ? "border-l-yellow-500"
                    : "border-l-green-500"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5" />
                      <span>{insight.title}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          insight.priority === "critical"
                            ? "destructive"
                            : insight.priority === "high"
                            ? "default"
                            : insight.priority === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {insight.priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Recommended Actions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {insight.recommendedActions.map(
                          (action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Metrics:</h4>
                      <div className="space-y-2">
                        {insight.dataPoints.map((point, pointIndex) => (
                          <div
                            key={pointIndex}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{point.label}:</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {point.value.toLocaleString("en-IN")}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  point.trend === "up"
                                    ? "text-green-600"
                                    : point.trend === "down"
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }
                              >
                                {point.trend}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {predictiveInsights.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No predictive insights available at this time.</p>
                  <p className="text-sm mt-2">
                    Check back later for AI-generated recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Community Health */}
        <TabsContent value="health" className="space-y-4">
          {communityHealth ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Overall Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-indigo-600">
                      {communityHealth.overallScore}/100
                    </div>
                    <Progress
                      value={communityHealth.overallScore}
                      className="mb-4"
                    />
                    <p className="text-sm text-muted-foreground">
                      {communityHealth.overallScore >= 80
                        ? "Excellent"
                        : communityHealth.overallScore >= 60
                        ? "Good"
                        : communityHealth.overallScore >= 40
                        ? "Fair"
                        : "Needs Attention"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {communityHealth.supportivenessScore}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supportiveness
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {communityHealth.moderationEfficiency}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Moderation
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {communityHealth.crisisResponseTime}m
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Response Time
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {communityHealth.communityGrowthRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Growth Rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(communityHealth.engagementTrends).map(
                      ([key, trend]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Current: {trend.current.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                trend.change > 0
                                  ? "default"
                                  : trend.change < 0
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {trend.change > 0 ? "+" : ""}
                              {trend.change}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              vs previous period
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Community health data is being calculated.</p>
                <p className="text-sm mt-2">
                  Please check back in a few minutes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
