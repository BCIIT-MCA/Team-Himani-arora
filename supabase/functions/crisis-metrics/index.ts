import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate crisis metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get active alerts count
    const { count: activeAlertsCount } = await supabaseClient
      .from("crisis_alerts")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "acknowledged", "contacted"]);

    // Get total alerts this week
    const { count: thisWeekAlerts } = await supabaseClient
      .from("crisis_alerts")
      .select("*", { count: "exact", head: true })
      .gte("detected_at", oneWeekAgo.toISOString());

    // Get total alerts last week
    const { count: lastWeekAlerts } = await supabaseClient
      .from("crisis_alerts")
      .select("*", { count: "exact", head: true })
      .gte("detected_at", twoWeeksAgo.toISOString())
      .lt("detected_at", oneWeekAgo.toISOString());

    // Calculate weekly trend
    const weeklyTrend =
      lastWeekAlerts > 0
        ? ((thisWeekAlerts - lastWeekAlerts) / lastWeekAlerts) * 100
        : 0;

    // Calculate average response time
    const { data: resolvedAlerts } = await supabaseClient
      .from("crisis_alerts")
      .select("detected_at, updated_at")
      .eq("status", "resolved")
      .gte("detected_at", oneWeekAgo.toISOString());

    let avgResponseTime = 0;
    if (resolvedAlerts && resolvedAlerts.length > 0) {
      const responseTimes = resolvedAlerts.map((alert) => {
        const detected = new Date(alert.detected_at);
        const resolved = new Date(alert.updated_at);
        return (resolved.getTime() - detected.getTime()) / (1000 * 60); // minutes
      });
      avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );
    }

    // Calculate resolution rate
    const { count: totalAlertsThisWeek } = await supabaseClient
      .from("crisis_alerts")
      .select("*", { count: "exact", head: true })
      .gte("detected_at", oneWeekAgo.toISOString());

    const { count: resolvedAlertsThisWeek } = await supabaseClient
      .from("crisis_alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte("detected_at", oneWeekAgo.toISOString());

    const resolutionRate =
      totalAlertsThisWeek > 0
        ? Math.round((resolvedAlertsThisWeek / totalAlertsThisWeek) * 100)
        : 0;

    const metrics = {
      totalAlerts: thisWeekAlerts || 0,
      activeAlerts: activeAlertsCount || 0,
      avgResponseTime,
      resolutionRate,
      weeklyTrend: Math.round(weeklyTrend),
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in crisis-metrics function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
