import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppointmentTrend {
  month: string;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
}

interface AppointmentStatus {
  scheduled: number;
  completed: number;
  cancelled: number;
  no_show: number;
}

interface PopularTimeSlot {
  time: string;
  count: number;
}

interface CounselorUtilization {
  name: string;
  utilization: number;
  totalAppointments: number;
  completedAppointments: number;
}

interface SystemUsage {
  chatSessions: number;
  assessmentsCompleted: number;
  communityPosts: number;
  eventRegistrations: number;
}

interface CommunityEngagement {
  totalPosts: number;
  postsByCategory: Record<string, number>;
  totalEvents: number;
  eventFillRate: number;
  averageAttendeesPerEvent: number;
}

interface DashboardOverview {
  appointmentTrends: AppointmentTrend[];
  appointmentStatus: AppointmentStatus;
  systemUsage: SystemUsage;
  communityEngagement: CommunityEngagement;
}

interface UseAnalyticsState {
  appointmentTrends: AppointmentTrend[];
  appointmentStatus: AppointmentStatus;
  popularTimeSlots: PopularTimeSlot[];
  counselorUtilization: CounselorUtilization[];
  systemUsage: SystemUsage;
  communityEngagement: CommunityEngagement;
  dashboardOverview: DashboardOverview | null;
  loading: boolean;
  error: string | null;
}

export const useAnalytics = () => {
  const [state, setState] = useState<UseAnalyticsState>({
    appointmentTrends: [],
    appointmentStatus: {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
    popularTimeSlots: [],
    counselorUtilization: [],
    systemUsage: {
      chatSessions: 0,
      assessmentsCompleted: 0,
      communityPosts: 0,
      eventRegistrations: 0,
    },
    communityEngagement: {
      totalPosts: 0,
      postsByCategory: {},
      totalEvents: 0,
      eventFillRate: 0,
      averageAttendeesPerEvent: 0,
    },
    dashboardOverview: null,
    loading: true,
    error: null,
  });

  const { toast } = useToast();

  const callAnalyticsFunction = useCallback(
    async (type: string, dateRange?: { start: string; end: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke("analytics", {
          body: { type, dateRange },
        });

        if (error) {
          throw error;
        }

        return data;
      } catch (error) {
        console.error(`Error calling analytics function for ${type}:`, error);
        throw error;
      }
    },
    []
  );

  const fetchAppointmentTrends = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction(
          "appointment_trends",
          dateRange
        );
        setState((prev) => ({
          ...prev,
          appointmentTrends: data || [],
        }));
        return data;
      } catch (error) {
        console.error("Error fetching appointment trends:", error);
        toast({
          title: "Error Loading Trends",
          description: "Failed to load appointment trends.",
          variant: "destructive",
        });
        return [];
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchAppointmentStatus = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction(
          "appointment_status",
          dateRange
        );
        setState((prev) => ({
          ...prev,
          appointmentStatus: data || prev.appointmentStatus,
        }));
        return data;
      } catch (error) {
        console.error("Error fetching appointment status:", error);
        toast({
          title: "Error Loading Status",
          description: "Failed to load appointment status.",
          variant: "destructive",
        });
        return null;
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchPopularTimeSlots = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction(
          "popular_time_slots",
          dateRange
        );
        setState((prev) => ({
          ...prev,
          popularTimeSlots: data || [],
        }));
        return data;
      } catch (error) {
        console.error("Error fetching popular time slots:", error);
        toast({
          title: "Error Loading Time Slots",
          description: "Failed to load popular time slots.",
          variant: "destructive",
        });
        return [];
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchCounselorUtilization = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction(
          "counselor_utilization",
          dateRange
        );
        setState((prev) => ({
          ...prev,
          counselorUtilization: data || [],
        }));
        return data;
      } catch (error) {
        console.error("Error fetching counselor utilization:", error);
        toast({
          title: "Error Loading Utilization",
          description: "Failed to load counselor utilization.",
          variant: "destructive",
        });
        return [];
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchSystemUsage = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction("system_usage", dateRange);
        setState((prev) => ({
          ...prev,
          systemUsage: data || prev.systemUsage,
        }));
        return data;
      } catch (error) {
        console.error("Error fetching system usage:", error);
        toast({
          title: "Error Loading Usage",
          description: "Failed to load system usage metrics.",
          variant: "destructive",
        });
        return null;
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchCommunityEngagement = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        const data = await callAnalyticsFunction(
          "community_engagement",
          dateRange
        );
        setState((prev) => ({
          ...prev,
          communityEngagement: data || prev.communityEngagement,
        }));
        return data;
      } catch (error) {
        console.error("Error fetching community engagement:", error);
        toast({
          title: "Error Loading Engagement",
          description: "Failed to load community engagement metrics.",
          variant: "destructive",
        });
        return null;
      }
    },
    [callAnalyticsFunction, toast]
  );

  const fetchDashboardOverview = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const data = await callAnalyticsFunction(
          "dashboard_overview",
          dateRange
        );

        setState((prev) => ({
          ...prev,
          dashboardOverview: data,
          appointmentTrends: data?.appointmentTrends || [],
          appointmentStatus: data?.appointmentStatus || prev.appointmentStatus,
          systemUsage: data?.systemUsage || prev.systemUsage,
          communityEngagement:
            data?.communityEngagement || prev.communityEngagement,
          loading: false,
        }));

        return data;
      } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load dashboard data",
          loading: false,
        }));

        toast({
          title: "Error Loading Dashboard",
          description: "Failed to load dashboard overview.",
          variant: "destructive",
        });
        return null;
      }
    },
    [callAnalyticsFunction, toast]
  );

  const refreshAnalytics = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await Promise.all([
          fetchAppointmentTrends(dateRange),
          fetchAppointmentStatus(dateRange),
          fetchPopularTimeSlots(dateRange),
          fetchCounselorUtilization(dateRange),
          fetchSystemUsage(dateRange),
          fetchCommunityEngagement(dateRange),
        ]);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to refresh analytics",
        }));
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [
      fetchAppointmentTrends,
      fetchAppointmentStatus,
      fetchPopularTimeSlots,
      fetchCounselorUtilization,
      fetchSystemUsage,
      fetchCommunityEngagement,
    ]
  );

  const getDateRangePresets = useCallback(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      last7Days: {
        start: sevenDaysAgo.toISOString(),
        end: now.toISOString(),
      },
      last30Days: {
        start: thirtyDaysAgo.toISOString(),
        end: now.toISOString(),
      },
      last90Days: {
        start: ninetyDaysAgo.toISOString(),
        end: now.toISOString(),
      },
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardOverview();
  }, [fetchDashboardOverview]);

  return {
    // State
    appointmentTrends: state.appointmentTrends,
    appointmentStatus: state.appointmentStatus,
    popularTimeSlots: state.popularTimeSlots,
    counselorUtilization: state.counselorUtilization,
    systemUsage: state.systemUsage,
    communityEngagement: state.communityEngagement,
    dashboardOverview: state.dashboardOverview,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchAppointmentTrends,
    fetchAppointmentStatus,
    fetchPopularTimeSlots,
    fetchCounselorUtilization,
    fetchSystemUsage,
    fetchCommunityEngagement,
    fetchDashboardOverview,
    refreshAnalytics,

    // Utilities
    dateRangePresets: getDateRangePresets(),
  };
};
