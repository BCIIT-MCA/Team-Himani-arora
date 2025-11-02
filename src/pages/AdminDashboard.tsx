import React from "react";
import Navigation from "@/components/Navigation";
import { AdvancedAnalyticsDashboard } from "@/components/AdvancedAnalyticsDashboard";
import { ModerationQueue } from "@/components/ModerationQueue";
import { CrisisMonitoringDashboard } from "@/components/CrisisMonitoringDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  Settings,
  Download,
  RefreshCw,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserManagement from "@/components/UserManagement";

const AdminDashboard = () => {
  const { user, isAdmin, userRole, loading: authLoading } = useAuth();
  const {
    appointmentTrends,
    appointmentStatus,
    popularTimeSlots,
    counselorUtilization,
    systemUsage,
    communityEngagement,
    loading,
    error,
    refreshAnalytics,
  } = useAnalytics();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeConversations: 0,
    totalAppointments: 0,
    completedAssessments: 0,
  });
  const [assessmentData, setAssessmentData] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch active conversations
      const { count: conversationCount } = await supabase
        .from("chat_conversations")
        .select("*", { count: "exact", head: true });

      // Fetch appointments
      const { count: appointmentCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true });

      // Fetch assessments
      const { count: assessmentCount } = await supabase
        .from("psychological_assessments")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: userCount || 0,
        activeConversations: conversationCount || 0,
        totalAppointments: appointmentCount || 0,
        completedAssessments: assessmentCount || 0,
      });

      // Fetch assessment severity distribution
      const { data: assessments } = await supabase
        .from("psychological_assessments")
        .select("severity_level, assessment_type");

      if (assessments) {
        const severityStats = assessments.reduce((acc, assessment) => {
          const severity = assessment.severity_level || "Unknown";
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {});

        setAssessmentData(
          Object.entries(severityStats).map(([severity, count]) => ({
            name: severity,
            value: count,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Checking authentication status...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Please sign in to access the admin dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Insufficient Permissions</CardTitle>
              <CardDescription>
                You need administrator privileges to access this dashboard. Your
                current role: {userRole || "student"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact the system
                administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-20 pb-8 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-heading font-bold text-white mb-4">
            Student Wellness Dashboard
          </h1>
          <p className="text-xl text-white/90">
            Anonymous analytics for student mental health support program - Free
            services across Indian educational institutions
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group hover:shadow-elegant transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Students Registered
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  All services completely FREE
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-elegant transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Student Chat Sessions
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeConversations}
                </div>
                <p className="text-xs text-muted-foreground">
                  24/7 confidential support
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-elegant transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Free Counseling Sessions
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground">
                  No cost to students ever
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-elegant transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Student Wellness Assessments
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.completedAssessments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Early intervention support
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
              <TabsTrigger value="advanced-analytics">
                Advanced Analytics
              </TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="crisis">Crisis Monitoring</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Trends</CardTitle>
                    <CardDescription>
                      Monthly appointment bookings over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={appointmentTrends.map((trend) => ({
                          date: trend.month,
                          appointments: trend.total,
                          completed: trend.completed,
                          scheduled: trend.scheduled,
                          cancelled: trend.cancelled,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="appointments"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="#00C49F"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="scheduled"
                          stroke="#FFBB28"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="cancelled"
                          stroke="#FF8042"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Usage</CardTitle>
                    <CardDescription>
                      Platform engagement metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">AI Chat Sessions</span>
                        <Badge variant="secondary">
                          {systemUsage.chatSessions.toLocaleString("en-IN")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Assessments Completed</span>
                        <Badge variant="secondary">
                          {systemUsage.assessmentsCompleted.toLocaleString(
                            "en-IN"
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Community Posts</span>
                        <Badge variant="secondary">
                          {systemUsage.communityPosts.toLocaleString("en-IN")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Event Registrations</span>
                        <Badge variant="secondary">
                          {systemUsage.eventRegistrations.toLocaleString(
                            "en-IN"
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Severity Distribution</CardTitle>
                    <CardDescription>
                      Distribution of mental health assessment severity levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={assessmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assessmentData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Types</CardTitle>
                    <CardDescription>
                      Most commonly used screening tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PHQ-9 (Depression)</span>
                        <Badge variant="outline">67%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">GAD-7 (Anxiety)</span>
                        <Badge variant="outline">58%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">GHQ-12 (General Health)</span>
                        <Badge variant="outline">34%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PSS-4 (Stress)</span>
                        <Badge variant="outline">29%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Completed</span>
                        </div>
                        <Badge variant="secondary">
                          {appointmentStatus.completed}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Scheduled</span>
                        </div>
                        <Badge variant="secondary">
                          {appointmentStatus.scheduled}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">Cancelled</span>
                        </div>
                        <Badge variant="secondary">
                          {appointmentStatus.cancelled}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm">No Show</span>
                        </div>
                        <Badge variant="secondary">
                          {appointmentStatus.no_show}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Popular Time Slots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {popularTimeSlots.slice(0, 5).map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{slot.time}</span>
                          <Badge variant="outline">{slot.count} bookings</Badge>
                        </div>
                      ))}
                      {popularTimeSlots.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No time slot data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Counselor Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {counselorUtilization.map((counselor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{counselor.name}</span>
                          <Badge variant="secondary">
                            {counselor.utilization}%
                          </Badge>
                        </div>
                      ))}
                      {counselorUtilization.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No counselor data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="community" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Engagement</CardTitle>
                    <CardDescription>
                      Peer support platform activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Posts</span>
                        <Badge variant="secondary">
                          {communityEngagement.totalPosts}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Events</span>
                        <Badge variant="secondary">
                          {communityEngagement.totalEvents}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Event Fill Rate</span>
                        <Badge variant="secondary">
                          {communityEngagement.eventFillRate}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg. Attendees/Event</span>
                        <Badge variant="outline">
                          {communityEngagement.averageAttendeesPerEvent}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Moderation</CardTitle>
                    <CardDescription>Community safety metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Posts Requiring Review</span>
                        <Badge variant="destructive">3</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-Approved Posts</span>
                        <Badge variant="secondary">156</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Community Reports</span>
                        <Badge variant="secondary">2</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Crisis Flags</span>
                        <Badge variant="destructive">1</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Analytics Tab */}
            <TabsContent value="advanced-analytics">
              <AdvancedAnalyticsDashboard />
            </TabsContent>

            {/* Moderation Tab */}
            <TabsContent value="moderation">
              <ModerationQueue
                actions={[]} // TODO: Replace with real moderation data
                onActionTaken={(actionId, decision) => {
                  console.log(`Moderation action ${actionId}: ${decision}`);
                  // TODO: Implement moderation action handler
                }}
                onViewDetails={(actionId) => {
                  console.log(`View moderation details: ${actionId}`);
                  // TODO: Implement view details handler
                }}
              />
            </TabsContent>

            {/* Crisis Monitoring Tab */}
            <TabsContent value="crisis">
              <CrisisMonitoringDashboard
                onViewAlert={(alertId) => {
                  console.log(`View crisis alert: ${alertId}`);
                  // TODO: Implement view alert handler
                }}
                onUpdateAlertStatus={(alertId, status, notes) => {
                  console.log(
                    `Update crisis alert ${alertId} to ${status}`,
                    notes
                  );
                  // TODO: Implement update status handler
                }}
                onAssignAlert={(alertId, assigneeId) => {
                  console.log(
                    `Assign crisis alert ${alertId} to ${assigneeId}`
                  );
                  // TODO: Implement assignment handler
                }}
              />
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
