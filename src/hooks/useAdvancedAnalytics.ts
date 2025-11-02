import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CohortAnalysisData {
  cohortMonth: string;
  totalUsers: number;
  activeUsers: {
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
  retentionRates: {
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
}

interface UserSegment {
  segment: string;
  count: number;
  characteristics: string[];
  engagementLevel: "low" | "medium" | "high";
  averageSessionDuration: number;
  postsPerUser: number;
  commentsPerUser: number;
}

interface PredictiveInsight {
  type:
    | "churn_risk"
    | "engagement_opportunity"
    | "crisis_prevention"
    | "community_growth";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  affectedUsers: number;
  recommendedActions: string[];
  dataPoints: {
    label: string;
    value: number;
    trend: "up" | "down" | "stable";
  }[];
}

interface CommunityHealthMetrics {
  overallScore: number;
  toxicityLevel: number;
  supportivenessScore: number;
  moderationEfficiency: number;
  crisisResponseTime: number;
  communityGrowthRate: number;
  engagementTrends: {
    posts: { current: number; previous: number; change: number };
    comments: { current: number; previous: number; change: number };
    votes: { current: number; previous: number; change: number };
    activeUsers: { current: number; previous: number; change: number };
  };
}

export function useAdvancedAnalytics() {
  const [cohortData, setCohortData] = useState<CohortAnalysisData[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<
    PredictiveInsight[]
  >([]);
  const [communityHealth, setCommunityHealth] =
    useState<CommunityHealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCohortAnalysis = useCallback(async (months: number = 12) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "advanced-analytics",
        {
          body: {
            analysisType: "cohort",
            parameters: { months },
          },
        }
      );

      if (error) throw error;
      setCohortData(data.cohortAnalysis || []);
    } catch (err: any) {
      console.error("Failed to fetch cohort analysis:", err);
      setError(err.message || "Failed to fetch cohort analysis");
    }
  }, []);

  const fetchUserSegmentation = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "advanced-analytics",
        {
          body: {
            analysisType: "segmentation",
          },
        }
      );

      if (error) throw error;
      setUserSegments(data.userSegments || []);
    } catch (err: any) {
      console.error("Failed to fetch user segmentation:", err);
      setError(err.message || "Failed to fetch user segmentation");
    }
  }, []);

  const fetchPredictiveInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "advanced-analytics",
        {
          body: {
            analysisType: "predictive",
          },
        }
      );

      if (error) throw error;
      setPredictiveInsights(data.insights || []);
    } catch (err: any) {
      console.error("Failed to fetch predictive insights:", err);
      setError(err.message || "Failed to fetch predictive insights");
    }
  }, []);

  const fetchCommunityHealth = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "advanced-analytics",
        {
          body: {
            analysisType: "community_health",
          },
        }
      );

      if (error) throw error;
      setCommunityHealth(data.communityHealth || null);
    } catch (err: any) {
      console.error("Failed to fetch community health:", err);
      setError(err.message || "Failed to fetch community health");
    }
  }, []);

  const refreshAllAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCohortAnalysis(),
        fetchUserSegmentation(),
        fetchPredictiveInsights(),
        fetchCommunityHealth(),
      ]);
    } catch (err: any) {
      console.error("Failed to refresh analytics:", err);
      setError(err.message || "Failed to refresh analytics");
    } finally {
      setLoading(false);
    }
  }, [
    fetchCohortAnalysis,
    fetchUserSegmentation,
    fetchPredictiveInsights,
    fetchCommunityHealth,
  ]);

  // Calculate derived metrics
  const getDerivedMetrics = useCallback(() => {
    if (!cohortData.length || !userSegments.length || !communityHealth) {
      return null;
    }

    // Average retention rate across all cohorts
    const avgRetentionRate =
      cohortData.reduce(
        (sum, cohort) => sum + cohort.retentionRates.month1,
        0
      ) / cohortData.length;

    // High-engagement user percentage
    const highEngagementUsers = userSegments
      .filter((segment) => segment.engagementLevel === "high")
      .reduce((sum, segment) => sum + segment.count, 0);

    const totalUsers = userSegments.reduce(
      (sum, segment) => sum + segment.count,
      0
    );
    const highEngagementPercentage =
      totalUsers > 0 ? (highEngagementUsers / totalUsers) * 100 : 0;

    // Critical insights count
    const criticalInsights = predictiveInsights.filter(
      (insight) => insight.priority === "critical"
    ).length;

    return {
      avgRetentionRate: avgRetentionRate * 100,
      highEngagementPercentage,
      criticalInsights,
      communityHealthScore: communityHealth.overallScore,
      totalActiveUsers: totalUsers,
    };
  }, [cohortData, userSegments, predictiveInsights, communityHealth]);

  // Export data functionality
  const exportAnalyticsData = useCallback(
    async (format: "csv" | "json" = "json") => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "export-analytics",
          {
            body: {
              format,
              includeData: {
                cohortAnalysis: cohortData,
                userSegments,
                predictiveInsights,
                communityHealth,
              },
            },
          }
        );

        if (error) throw error;

        // Download the file
        const blob = new Blob([data.content], {
          type: format === "csv" ? "text/csv" : "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `solace-analytics-${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error("Failed to export analytics data:", err);
        throw new Error(err.message || "Failed to export data");
      }
    },
    [cohortData, userSegments, predictiveInsights, communityHealth]
  );

  // Real-time analytics updates
  useEffect(() => {
    // Subscribe to real-time analytics updates
    const subscription = supabase
      .channel("analytics-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "analytics_cache",
        },
        (payload) => {
          console.log("Analytics update received:", payload);
          // Refresh specific analytics based on the update
          const newRecord = payload.new as any;
          if (newRecord?.analysis_type === "community_health") {
            fetchCommunityHealth();
          } else if (newRecord?.analysis_type === "predictive") {
            fetchPredictiveInsights();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCommunityHealth, fetchPredictiveInsights]);

  return {
    // Data
    cohortData,
    userSegments,
    predictiveInsights,
    communityHealth,
    derivedMetrics: getDerivedMetrics(),

    // State
    loading,
    error,

    // Actions
    fetchCohortAnalysis,
    fetchUserSegmentation,
    fetchPredictiveInsights,
    fetchCommunityHealth,
    refreshAllAnalytics,
    exportAnalyticsData,

    // Utility functions
    clearError: () => setError(null),
  };
}

// Hook for real-time community metrics
export function useCommunityMetrics() {
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    postsToday: 0,
    commentsToday: 0,
    crisisAlertsToday: 0,
    responseTime: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "real-time-metrics"
        );
        if (error) throw error;
        setMetrics(data);
      } catch (error) {
        console.error("Failed to fetch real-time metrics:", error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up interval for updates
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

// Hook for A/B testing analytics
export function useABTestAnalytics() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const createTest = useCallback(
    async (testConfig: {
      name: string;
      description: string;
      variants: Array<{ name: string; weight: number; config: any }>;
      targetMetric: string;
      duration: number;
    }) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "ab-test-manager",
          {
            body: {
              action: "create",
              testConfig,
            },
          }
        );

        if (error) throw error;

        // Refresh test list
        await fetchTests();
        return data.testId;
      } catch (error) {
        console.error("Failed to create A/B test:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTests = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "ab-test-manager",
        {
          body: { action: "list" },
        }
      );

      if (error) throw error;
      setTests(data.tests || []);
    } catch (error) {
      console.error("Failed to fetch A/B tests:", error);
    }
  }, []);

  const analyzeTest = useCallback(async (testId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "ab-test-manager",
        {
          body: {
            action: "analyze",
            testId,
          },
        }
      );

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error("Failed to analyze A/B test:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return {
    tests,
    loading,
    createTest,
    analyzeTest,
    refreshTests: fetchTests,
  };
}
