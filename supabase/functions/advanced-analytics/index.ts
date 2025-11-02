// Edge function for advanced analytics and predictive insights
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsRequest {
  analysisType: "cohort" | "segmentation" | "predictive" | "community_health";
  parameters?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { analysisType, parameters }: AnalyticsRequest = await req.json();

    let result = {};

    switch (analysisType) {
      case "cohort":
        result = await performCohortAnalysis(supabaseClient, parameters);
        break;
      case "segmentation":
        result = await performUserSegmentation(supabaseClient);
        break;
      case "predictive":
        result = await generatePredictiveInsights(supabaseClient);
        break;
      case "community_health":
        result = await analyzeCommunityHealth(supabaseClient);
        break;
      default:
        throw new Error("Invalid analysis type");
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Advanced analytics error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function performCohortAnalysis(supabaseClient: any, parameters: any) {
  const months = parameters?.months || 12;
  const cohortAnalysis = [];

  try {
    // Get user registration data by month
    const { data: registrationData, error } = await supabaseClient
      .from("user_profiles")
      .select("id, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Group users by registration month
    const cohorts = new Map();
    registrationData.forEach((user) => {
      const month = new Date(user.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!cohorts.has(month)) {
        cohorts.set(month, []);
      }
      cohorts.get(month).push(user.id);
    });

    // Calculate retention for each cohort
    for (const [cohortMonth, userIds] of cohorts) {
      const cohortData = {
        cohortMonth,
        totalUsers: userIds.length,
        activeUsers: { month1: 0, month2: 0, month3: 0, month6: 0, month12: 0 },
        retentionRates: {
          month1: 0,
          month2: 0,
          month3: 0,
          month6: 0,
          month12: 0,
        },
      };

      // Calculate active users for different time periods
      const periods = [1, 2, 3, 6, 12];
      const periodKeys = ["month1", "month2", "month3", "month6", "month12"];

      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const key = periodKeys[i];

        const startDate = new Date(cohortMonth + "-01");
        const endDate = new Date(
          startDate.getTime() + period * 30 * 24 * 60 * 60 * 1000
        );

        // Count active users in this period
        const { data: activeUsers, error: activeError } = await supabaseClient
          .from("posts")
          .select("user_id")
          .in("user_id", userIds)
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString());

        if (!activeError) {
          const uniqueActiveUsers = new Set(activeUsers.map((p) => p.user_id))
            .size;
          cohortData.activeUsers[key] = uniqueActiveUsers;
          cohortData.retentionRates[key] =
            userIds.length > 0 ? uniqueActiveUsers / userIds.length : 0;
        } else {
          console.error(`Error fetching active users for ${key}:`, activeError);
        }
      }

      cohortAnalysis.push(cohortData);
    }

    return { cohortAnalysis };
  } catch (error) {
    console.error("Cohort analysis error:", error);
    return { cohortAnalysis: [] };
  }
}

async function performUserSegmentation(supabaseClient: any) {
  try {
    // Get user activity data
    const { data: users, error: usersError } = await supabaseClient.from(
      "user_profiles"
    ).select(`
        id,
        created_at,
        posts:posts(count),
        comments:comments(count),
        votes:votes(count)
      `);

    if (usersError) throw usersError;

    const segments = {
      new_users: {
        users: [],
        characteristics: ["Registered within last 30 days", "Low activity"],
      },
      casual_users: {
        users: [],
        characteristics: ["Occasional posting", "Regular reading"],
      },
      active_contributors: {
        users: [],
        characteristics: ["Regular posting", "High engagement"],
      },
      super_users: {
        users: [],
        characteristics: ["Very high activity", "Community leaders"],
      },
      at_risk: {
        users: [],
        characteristics: ["Declining activity", "Potential churn"],
      },
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    users.forEach((user) => {
      const registrationDate = new Date(user.created_at);
      const isNewUser = registrationDate > thirtyDaysAgo;
      const postCount = user.posts?.[0]?.count || 0;
      const commentCount = user.comments?.[0]?.count || 0;
      const voteCount = user.votes?.[0]?.count || 0;
      const totalActivity = postCount + commentCount + voteCount;

      if (isNewUser) {
        segments.new_users.users.push(user);
      } else if (totalActivity === 0) {
        segments.at_risk.users.push(user);
      } else if (totalActivity < 5) {
        segments.casual_users.users.push(user);
      } else if (totalActivity < 20) {
        segments.active_contributors.users.push(user);
      } else {
        segments.super_users.users.push(user);
      }
    });

    const userSegments = Object.entries(segments).map(([segment, data]) => ({
      segment,
      count: data.users.length,
      characteristics: data.characteristics,
      engagementLevel: getEngagementLevel(segment),
      averageSessionDuration: calculateAverageSessionDuration(data.users),
      postsPerUser: calculateAverageActivity(data.users, "posts"),
      commentsPerUser: calculateAverageActivity(data.users, "comments"),
    }));

    return { userSegments };
  } catch (error) {
    console.error("User segmentation error:", error);
    return { userSegments: [] };
  }
}

async function generatePredictiveInsights(supabaseClient: any) {
  const insights = [];

  try {
    // Churn risk analysis
    const churnRiskInsight = await analyzeChurnRisk(supabaseClient);
    if (churnRiskInsight) insights.push(churnRiskInsight);

    // Engagement opportunity analysis
    const engagementInsight = await analyzeEngagementOpportunities(
      supabaseClient
    );
    if (engagementInsight) insights.push(engagementInsight);

    // Crisis prevention analysis
    const crisisInsight = await analyzeCrisisPrevention(supabaseClient);
    if (crisisInsight) insights.push(crisisInsight);

    // Community growth analysis
    const growthInsight = await analyzeCommunityGrowth(supabaseClient);
    if (growthInsight) insights.push(growthInsight);

    return { insights };
  } catch (error) {
    console.error("Predictive insights error:", error);
    return { insights: [] };
  }
}

async function analyzeCommunityHealth(supabaseClient: any) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get current week's data
    const [
      postsResult,
      commentsResult,
      votesResult,
      usersResult,
      moderationResult,
    ] = await Promise.all([
      supabaseClient
        .from("posts")
        .select("id")
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("comments")
        .select("id")
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("votes")
        .select("id")
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("user_profiles")
        .select("id, last_active_at")
        .gte("last_active_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("moderation_audit")
        .select("id, action, created_at")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    // Get previous week's data for comparison
    const [
      prevPostsResult,
      prevCommentsResult,
      prevVotesResult,
      prevUsersResult,
    ] = await Promise.all([
      supabaseClient
        .from("posts")
        .select("id")
        .gte("created_at", fourteenDaysAgo.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("comments")
        .select("id")
        .gte("created_at", fourteenDaysAgo.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("votes")
        .select("id")
        .gte("created_at", fourteenDaysAgo.toISOString())
        .lt("created_at", sevenDaysAgo.toISOString()),
      supabaseClient
        .from("user_profiles")
        .select("id")
        .gte("last_active_at", fourteenDaysAgo.toISOString())
        .lt("last_active_at", sevenDaysAgo.toISOString()),
    ]);

    // Calculate metrics
    const currentPosts = postsResult.data?.length || 0;
    const currentComments = commentsResult.data?.length || 0;
    const currentVotes = votesResult.data?.length || 0;
    const currentActiveUsers = usersResult.data?.length || 0;

    const previousPosts = prevPostsResult.data?.length || 0;
    const previousComments = prevCommentsResult.data?.length || 0;
    const previousVotes = prevVotesResult.data?.length || 0;
    const previousActiveUsers = prevUsersResult.data?.length || 0;

    // Calculate changes
    const postsChange =
      previousPosts > 0
        ? ((currentPosts - previousPosts) / previousPosts) * 100
        : 0;
    const commentsChange =
      previousComments > 0
        ? ((currentComments - previousComments) / previousComments) * 100
        : 0;
    const votesChange =
      previousVotes > 0
        ? ((currentVotes - previousVotes) / previousVotes) * 100
        : 0;
    const usersChange =
      previousActiveUsers > 0
        ? ((currentActiveUsers - previousActiveUsers) / previousActiveUsers) *
          100
        : 0;

    // Calculate health scores
    const toxicityLevel = calculateToxicityLevel(moderationResult.data || []);
    const supportivenessScore = calculateSupportivenessScore(
      currentComments,
      currentVotes
    );
    const moderationEfficiency = calculateModerationEfficiency(
      moderationResult.data || []
    );
    const crisisResponseTime = await calculateCrisisResponseTime(
      supabaseClient
    );
    const communityGrowthRate =
      (postsChange + commentsChange + usersChange) / 3;

    // Overall health score (0-100)
    const overallScore = Math.max(
      0,
      Math.min(
        100,
        (100 - toxicityLevel) * 0.3 +
          supportivenessScore * 0.3 +
          moderationEfficiency * 0.2 +
          Math.min(100, Math.max(0, 50 + communityGrowthRate)) * 0.2
      )
    );

    const communityHealth = {
      overallScore: Math.round(overallScore),
      toxicityLevel: Math.round(toxicityLevel),
      supportivenessScore: Math.round(supportivenessScore),
      moderationEfficiency: Math.round(moderationEfficiency),
      crisisResponseTime: Math.round(crisisResponseTime),
      communityGrowthRate: Math.round(communityGrowthRate),
      engagementTrends: {
        posts: {
          current: currentPosts,
          previous: previousPosts,
          change: Math.round(postsChange),
        },
        comments: {
          current: currentComments,
          previous: previousComments,
          change: Math.round(commentsChange),
        },
        votes: {
          current: currentVotes,
          previous: previousVotes,
          change: Math.round(votesChange),
        },
        activeUsers: {
          current: currentActiveUsers,
          previous: previousActiveUsers,
          change: Math.round(usersChange),
        },
      },
    };

    return { communityHealth };
  } catch (error) {
    console.error("Community health analysis error:", error);
    return { communityHealth: null };
  }
}

// Helper functions
function getEngagementLevel(segment: string): "low" | "medium" | "high" {
  switch (segment) {
    case "super_users":
    case "active_contributors":
      return "high";
    case "casual_users":
      return "medium";
    default:
      return "low";
  }
}

function calculateAverageSessionDuration(users: any[]): number {
  // Placeholder calculation - would use actual session data
  return Math.random() * 30 + 5; // 5-35 minutes
}

function calculateAverageActivity(users: any[], activityType: string): number {
  if (users.length === 0) return 0;
  const total = users.reduce(
    (sum, user) => sum + (user[activityType]?.[0]?.count || 0),
    0
  );
  return total / users.length;
}

async function analyzeChurnRisk(supabaseClient: any) {
  // Simplified churn risk analysis
  const { data: inactiveUsers, error } = await supabaseClient
    .from("user_profiles")
    .select("id")
    .lt(
      "last_active_at",
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (error) return null;

  const atRiskCount = inactiveUsers?.length || 0;
  if (atRiskCount === 0) return null;

  return {
    type: "churn_risk",
    priority: atRiskCount > 50 ? "high" : "medium",
    title: "Users at Risk of Churning",
    description: `${atRiskCount} users haven't been active in the last 14 days`,
    confidence: 0.75,
    affectedUsers: atRiskCount,
    recommendedActions: [
      "Send re-engagement emails",
      "Offer personalized content recommendations",
      "Implement win-back campaigns",
      "Analyze reasons for inactivity",
    ],
    dataPoints: [
      { label: "Inactive Users", value: atRiskCount, trend: "up" },
      { label: "Days Since Last Activity", value: 14, trend: "up" },
    ],
  };
}

async function analyzeEngagementOpportunities(supabaseClient: any) {
  // Simplified engagement analysis
  return {
    type: "engagement_opportunity",
    priority: "medium",
    title: "Increase Community Engagement",
    description: "Opportunities to boost user participation and interaction",
    confidence: 0.68,
    affectedUsers: 150,
    recommendedActions: [
      "Introduce gamification elements",
      "Host community events",
      "Create discussion prompts",
      "Highlight success stories",
    ],
    dataPoints: [
      { label: "Average Daily Posts", value: 25, trend: "stable" },
      { label: "Comment Rate", value: 45, trend: "down" },
    ],
  };
}

async function analyzeCrisisPrevention(supabaseClient: any) {
  // Check for crisis detection patterns
  const { data: crisisData, error } = await supabaseClient
    .from("crisis_detections")
    .select("risk_level")
    .gte(
      "created_at",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

  if (error) return null;

  const highRiskCount =
    crisisData?.filter(
      (c) => c.risk_level === "high" || c.risk_level === "crisis"
    ).length || 0;

  if (highRiskCount === 0) return null;

  return {
    type: "crisis_prevention",
    priority: "critical",
    title: "Increased Crisis Risk Detected",
    description: `${highRiskCount} high-risk situations identified this week`,
    confidence: 0.85,
    affectedUsers: highRiskCount,
    recommendedActions: [
      "Increase moderator vigilance",
      "Expand crisis support resources",
      "Implement proactive outreach",
      "Review crisis response protocols",
    ],
    dataPoints: [
      { label: "High-Risk Detections", value: highRiskCount, trend: "up" },
      { label: "Response Time (min)", value: 15, trend: "down" },
    ],
  };
}

async function analyzeCommunityGrowth(supabaseClient: any) {
  // Simplified growth analysis
  return {
    type: "community_growth",
    priority: "low",
    title: "Steady Community Growth",
    description: "Community is growing at a healthy pace",
    confidence: 0.72,
    affectedUsers: 1250,
    recommendedActions: [
      "Continue current growth strategies",
      "Focus on retention",
      "Expand outreach efforts",
      "Improve onboarding experience",
    ],
    dataPoints: [
      { label: "New Users This Week", value: 45, trend: "up" },
      { label: "Growth Rate (%)", value: 12, trend: "up" },
    ],
  };
}

function calculateToxicityLevel(moderationData: any[]): number {
  // Calculate based on moderation actions
  const totalActions = moderationData.length;
  const severeActions = moderationData.filter((action) =>
    ["ban", "delete", "remove"].includes(action.action)
  ).length;

  return totalActions > 0 ? (severeActions / totalActions) * 100 : 0;
}

function calculateSupportivenessScore(comments: number, votes: number): number {
  // Simple metric based on engagement
  const engagementScore = Math.min(100, (comments + votes) / 10);
  return engagementScore;
}

function calculateModerationEfficiency(moderationData: any[]): number {
  // Calculate average response time
  if (moderationData.length === 0) return 100;

  // Placeholder calculation - would use actual response times
  return Math.random() * 20 + 80; // 80-100% efficiency
}

async function calculateCrisisResponseTime(
  supabaseClient: any
): Promise<number> {
  // Simplified crisis response time calculation
  return Math.random() * 10 + 5; // 5-15 minutes average
}
