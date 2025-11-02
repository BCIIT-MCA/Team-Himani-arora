/// <reference path="../_shared/deno-types.d.ts" />

// @ts-ignore - Deno import, not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM import, not Node.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { AnalyticsRequest, DateRange } from "../_shared/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, dateRange }: AnalyticsRequest = await req.json();

    let result;

    switch (type) {
      case "appointment_trends":
        result = await getAppointmentTrends(supabaseClient, dateRange);
        break;
      case "appointment_status":
        result = await getAppointmentStatusBreakdown(supabaseClient, dateRange);
        break;
      case "popular_time_slots":
        result = await getPopularTimeSlots(supabaseClient, dateRange);
        break;
      case "counselor_utilization":
        result = await getCounselorUtilization(supabaseClient, dateRange);
        break;
      case "system_usage":
        result = await getSystemUsageMetrics(supabaseClient, dateRange);
        break;
      case "community_engagement":
        result = await getCommunityEngagement(supabaseClient, dateRange);
        break;
      case "dashboard_overview":
        result = await getDashboardOverview(supabaseClient, dateRange);
        break;
      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function getAppointmentTrends(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("created_at, status")
    .gte(
      "created_at",
      dateRange?.start ||
        new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte("created_at", dateRange?.end || new Date().toISOString());

  if (error) {
    console.error("Error fetching appointment trends:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Group by month and count appointments
  const trends = data.reduce((acc: any, appointment: any) => {
    const month = new Date(appointment.created_at).toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = {
        month,
        total: 0,
        completed: 0,
        scheduled: 0,
        cancelled: 0,
        no_show: 0,
      };
    }
    acc[month].total++;
    // Safely increment status counts
    if (appointment.status && acc[month].hasOwnProperty(appointment.status)) {
      acc[month][appointment.status]++;
    }
    return acc;
  }, {});

  return Object.values(trends).sort((a: any, b: any) =>
    a.month.localeCompare(b.month)
  );
}

async function getAppointmentStatusBreakdown(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("status")
    .gte(
      "created_at",
      dateRange?.start ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte("created_at", dateRange?.end || new Date().toISOString());

  if (error) {
    console.error("Error fetching appointment status breakdown:", error);
    return {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };
  }

  if (!data || data.length === 0) {
    return {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    };
  }

  const statusCounts = data.reduce((acc: any, appointment: any) => {
    if (appointment.status) {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    }
    return acc;
  }, {});

  return {
    scheduled: statusCounts.scheduled || 0,
    completed: statusCounts.completed || 0,
    cancelled: statusCounts.cancelled || 0,
    no_show: statusCounts.no_show || 0,
  };
}

async function getPopularTimeSlots(supabaseClient: any, dateRange?: DateRange) {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("appointment_time")
    .eq("status", "completed")
    .gte(
      "created_at",
      dateRange?.start ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    )
    .lte("created_at", dateRange?.end || new Date().toISOString());

  if (error) {
    console.error("Error fetching popular time slots:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const timeCounts = data.reduce((acc: any, appointment: any) => {
    if (appointment.appointment_time) {
      const time = appointment.appointment_time;
      acc[time] = (acc[time] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(timeCounts)
    .map(([time, count]) => ({ time, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);
}

async function getCounselorUtilization(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const { data: counselors, error: counselorsError } = await supabaseClient
    .from("counselors")
    .select("id, name");

  if (counselorsError) throw counselorsError;

  const utilizationData = await Promise.all(
    counselors.map(async (counselor: any) => {
      const { data: appointments, error } = await supabaseClient
        .from("appointments")
        .select("id, status")
        .eq("counselor_id", counselor.id)
        .gte(
          "created_at",
          dateRange?.start ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .lte("created_at", dateRange?.end || new Date().toISOString());

      if (error) {
        console.warn(
          `Error fetching appointments for counselor ${counselor.id}:`,
          error
        );
        return {
          name: counselor.name,
          utilization: 0,
          totalAppointments: 0,
          completedAppointments: 0,
        };
      }

      const totalSlots = 40; // Assume 40 available slots per month per counselor
      const bookedSlots = appointments?.length || 0;
      const utilization =
        totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

      return {
        name: counselor.name,
        utilization,
        totalAppointments: bookedSlots,
        completedAppointments:
          appointments?.filter((apt: any) => apt.status === "completed")
            .length || 0,
      };
    })
  );

  return utilizationData;
}

async function getSystemUsageMetrics(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const dateFilter = {
    gte:
      dateRange?.start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lte: dateRange?.end || new Date().toISOString(),
  };

  // Get chat conversations count
  const { data: chatData, error: chatError } = await supabaseClient
    .from("chat_conversations")
    .select("id")
    .gte("created_at", dateFilter.gte)
    .lte("created_at", dateFilter.lte);

  if (chatError) {
    console.warn("Chat conversations query failed:", chatError);
    // Continue with empty data instead of throwing
  }

  // Get assessments count
  const { data: assessmentData, error: assessmentError } = await supabaseClient
    .from("assessment_results")
    .select("id")
    .gte("created_at", dateFilter.gte)
    .lte("created_at", dateFilter.lte);

  if (assessmentError) {
    console.warn("Assessment results query failed:", assessmentError);
  }

  // Get community posts count
  const { data: postsData, error: postsError } = await supabaseClient
    .from("community_posts")
    .select("id")
    .gte("created_at", dateFilter.gte)
    .lte("created_at", dateFilter.lte);

  if (postsError) {
    console.warn("Community posts query failed:", postsError);
  }

  // Get event registrations count
  const { data: registrationData, error: registrationError } =
    await supabaseClient
      .from("event_registrations")
      .select("id")
      .gte("registered_at", dateFilter.gte)
      .lte("registered_at", dateFilter.lte);

  if (registrationError) {
    console.warn("Event registrations query failed:", registrationError);
  }

  return {
    chatSessions: chatData?.length || 0,
    assessmentsCompleted: assessmentData?.length || 0,
    communityPosts: postsData?.length || 0,
    eventRegistrations: registrationData?.length || 0,
  };
}

async function getCommunityEngagement(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const dateFilter = {
    gte:
      dateRange?.start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lte: dateRange?.end || new Date().toISOString(),
  };

  // Get posts by category
  const { data: postsData, error: postsError } = await supabaseClient
    .from("community_posts")
    .select("category, created_at")
    .gte("created_at", dateFilter.gte)
    .lte("created_at", dateFilter.lte);

  if (postsError) {
    console.error("Error fetching community posts:", postsError);
  }

  // Get events data
  const { data: eventsData, error: eventsError } = await supabaseClient
    .from("events")
    .select("id, current_attendees, max_attendees")
    .gte("created_at", dateFilter.gte)
    .lte("created_at", dateFilter.lte);

  if (eventsError) {
    console.error("Error fetching events data:", eventsError);
  }

  // Calculate engagement metrics with safe defaults
  const safePostsData = postsData || [];
  const safeEventsData = eventsData || [];

  const postsByCategory = safePostsData.reduce((acc: any, post: any) => {
    if (post.category) {
      acc[post.category] = (acc[post.category] || 0) + 1;
    }
    return acc;
  }, {});

  const totalEventCapacity = safeEventsData.reduce(
    (sum: number, event: any) => sum + (event.max_attendees || 0),
    0
  );
  const totalEventAttendees = safeEventsData.reduce(
    (sum: number, event: any) => sum + (event.current_attendees || 0),
    0
  );
  const eventFillRate =
    totalEventCapacity > 0
      ? Math.round((totalEventAttendees / totalEventCapacity) * 100)
      : 0;

  return {
    totalPosts: safePostsData.length,
    postsByCategory,
    totalEvents: safeEventsData.length,
    eventFillRate,
    averageAttendeesPerEvent:
      safeEventsData.length > 0
        ? Math.round(totalEventAttendees / safeEventsData.length)
        : 0,
  };
}

async function getDashboardOverview(
  supabaseClient: any,
  dateRange?: DateRange
) {
  const [
    appointmentTrends,
    appointmentStatus,
    systemUsage,
    communityEngagement,
  ] = await Promise.all([
    getAppointmentTrends(supabaseClient, dateRange),
    getAppointmentStatusBreakdown(supabaseClient, dateRange),
    getSystemUsageMetrics(supabaseClient, dateRange),
    getCommunityEngagement(supabaseClient, dateRange),
  ]);

  return {
    appointmentTrends,
    appointmentStatus,
    systemUsage,
    communityEngagement,
  };
}
