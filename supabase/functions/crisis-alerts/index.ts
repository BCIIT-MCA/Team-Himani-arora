/// <reference path="../_shared/deno-types.d.ts" />

// @ts-ignore - Deno import, not Node.js
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore - ESM import, not Node.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { CrisisAlert, CrisisKeyword } from "../_shared/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Deno environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Crisis keywords with severity levels
const CRISIS_KEYWORDS: CrisisKeyword[] = [
  // Critical keywords
  { keyword: "suicide", severity: "critical", category: "self_harm" },
  { keyword: "kill myself", severity: "critical", category: "self_harm" },
  { keyword: "end my life", severity: "critical", category: "self_harm" },
  { keyword: "self harm", severity: "critical", category: "self_harm" },
  { keyword: "cut myself", severity: "critical", category: "self_harm" },
  { keyword: "overdose", severity: "critical", category: "self_harm" },
  { keyword: "jump off", severity: "critical", category: "self_harm" },

  // High severity keywords
  { keyword: "want to die", severity: "high", category: "suicidal_ideation" },
  {
    keyword: "better off dead",
    severity: "high",
    category: "suicidal_ideation",
  },
  { keyword: "can't go on", severity: "high", category: "severe_distress" },
  { keyword: "give up", severity: "high", category: "severe_distress" },
  { keyword: "no point", severity: "high", category: "severe_distress" },
  { keyword: "hopeless", severity: "high", category: "severe_distress" },

  // Medium severity keywords
  { keyword: "depressed", severity: "medium", category: "mental_health" },
  { keyword: "anxious", severity: "medium", category: "mental_health" },
  { keyword: "panic attack", severity: "medium", category: "mental_health" },
  { keyword: "breakdown", severity: "medium", category: "mental_health" },
  { keyword: "can't cope", severity: "medium", category: "distress" },
  { keyword: "overwhelmed", severity: "medium", category: "distress" },

  // Low severity keywords
  { keyword: "sad", severity: "low", category: "mood" },
  { keyword: "stressed", severity: "low", category: "mood" },
  { keyword: "worried", severity: "low", category: "mood" },
  { keyword: "tired", severity: "low", category: "mood" },
];

const detectCrisisKeywords = (content: string): CrisisKeyword[] => {
  const lowerContent = content.toLowerCase();
  return CRISIS_KEYWORDS.filter((keyword) =>
    lowerContent.includes(keyword.keyword.toLowerCase())
  );
};

const determineSeverity = (
  detectedKeywords: CrisisKeyword[]
): "low" | "medium" | "high" | "critical" => {
  if (detectedKeywords.some((k) => k.severity === "critical"))
    return "critical";
  if (detectedKeywords.some((k) => k.severity === "high")) return "high";
  if (detectedKeywords.some((k) => k.severity === "medium")) return "medium";
  return "low";
};

const createCrisisAlert = async (alert: CrisisAlert): Promise<void> => {
  const { error } = await supabase.from("crisis_alerts").insert([
    {
      user_id: alert.user_id,
      severity: alert.severity,
      content: alert.content,
      trigger_source: alert.trigger_source,
      metadata: alert.metadata,
      created_at: new Date().toISOString(),
      is_resolved: false,
    },
  ]);

  if (error) {
    console.error("Error creating crisis alert:", error);
    throw error;
  }
};

const sendCrisisNotifications = async (alert: CrisisAlert): Promise<void> => {
  // Get user contact preferences
  const { data: userProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, phone")
    .eq("id", alert.user_id)
    .single();

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    // Continue with basic notification even if profile fetch fails
  }

  // Get notification preferences
  const { data: preferences, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", alert.user_id)
    .single();

  if (prefsError && prefsError.code !== "PGRST116") {
    // Not found error is okay
    console.error("Error fetching notification preferences:", prefsError);
  }

  const notificationPrefs = preferences || {
    email_notifications: true,
    sms_notifications: true,
    crisis_notifications: true,
  };

  // Don't send if user has disabled crisis notifications
  if (!notificationPrefs.crisis_notifications) {
    console.log("User has disabled crisis notifications");
    return;
  }

  // Prepare notification content based on severity
  let title: string;
  let message: string;
  let urgency: "low" | "normal" | "high" = "normal";

  switch (alert.severity) {
    case "critical":
      title = "Immediate Support Available";
      message =
        "We noticed you might be going through a difficult time. Immediate professional help is available. Crisis Hotline: KIRAN 1800-599-0019 (FREE 24/7)";
      urgency = "high";
      break;
    case "high":
      title = "Support Resources Available";
      message =
        "It sounds like you're struggling. You're not alone - support is available 24/7. Would you like to connect with crisis resources?";
      urgency = "high";
      break;
    case "medium":
      title = "Community Support";
      message =
        "We're here for you. Consider reaching out to our community moderators or exploring our mental health resources.";
      urgency = "normal";
      break;
    case "low":
      title = "Wellness Check";
      message =
        "Remember that it's okay to not be okay. Our community and resources are here whenever you need support.";
      urgency = "low";
      break;
    default:
      title = "Support Available";
      message =
        "We're here for you. Support resources are available whenever you need them.";
      urgency = "normal";
      break;
  }

  // Create notification in database
  const { error: notificationError } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: alert.user_id,
        type: "crisis_alert",
        title,
        message,
        data: {
          alert_id: alert.metadata?.alert_id || null,
          severity: alert.severity,
          resources: {
            crisis_hotline: "1800-599-0019",
            text_line: "9152987821",
            chat_url: "https://www.vandrevalafoundation.com/",
          },
        },
        created_at: new Date().toISOString(),
        read: false,
      },
    ]);

  if (notificationError) {
    console.error("Error creating crisis notification:", notificationError);
  }

  // For critical alerts, also notify moderators immediately
  if (alert.severity === "critical") {
    await notifyModerators(
      alert,
      userProfile || { display_name: "Unknown User" }
    );
  }
};

const notifyModerators = async (
  alert: CrisisAlert,
  userProfile: any
): Promise<void> => {
  // Get all active moderators
  const { data: moderators, error: modError } = await supabase
    .from("peer_moderators")
    .select(
      "user_id, profiles!peer_moderators_user_id_fkey(display_name, email)"
    )
    .eq("is_active", true);

  if (modError) {
    console.error("Error fetching moderators:", modError);
    return;
  }

  // Send notification to all moderators
  const moderatorNotifications =
    moderators?.map((mod: any) => ({
      user_id: mod.user_id,
      type: "crisis_alert" as const,
      title: "Critical Crisis Alert",
      message: `A community member (${
        userProfile.display_name || "Anonymous"
      }) has triggered a critical crisis alert. Immediate intervention may be required.`,
      data: {
        alert_user_id: alert.user_id,
        severity: alert.severity,
        trigger_source: alert.trigger_source,
        requires_immediate_action: true,
      },
      created_at: new Date().toISOString(),
      read: false,
    })) || [];

  if (moderatorNotifications.length > 0) {
    const { error: modNotifError } = await supabase
      .from("notifications")
      .insert(moderatorNotifications);

    if (modNotifError) {
      console.error("Error creating moderator notifications:", modNotifError);
    }
  }
};

const processCrisisDetection = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content, user_id, source_type, source_id } = await req.json();

    if (!content || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content, user_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Detect crisis keywords in content
    const detectedKeywords = detectCrisisKeywords(content);

    if (detectedKeywords.length === 0) {
      return new Response(
        JSON.stringify({
          crisis_detected: false,
          message: "No crisis indicators detected",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const severity = determineSeverity(detectedKeywords);

    // Create crisis alert
    const alert: CrisisAlert = {
      user_id,
      severity,
      content: content.substring(0, 500), // Limit content length for privacy
      trigger_source: "keyword_detection",
      metadata: {
        source_type,
        source_id,
        detected_keywords: detectedKeywords.map((k) => ({
          keyword: k.keyword,
          severity: k.severity,
          category: k.category,
        })),
        keyword_count: detectedKeywords.length,
        processed_at: new Date().toISOString(),
      },
    };

    // Save alert to database
    await createCrisisAlert(alert);

    // Send appropriate notifications
    await sendCrisisNotifications(alert);

    // Log for monitoring
    console.log(
      `Crisis alert created for user ${user_id} with severity ${severity}`
    );

    return new Response(
      JSON.stringify({
        crisis_detected: true,
        severity,
        alert_created: true,
        keywords_detected: detectedKeywords.length,
        support_message:
          severity === "critical"
            ? "Immediate help is available. Crisis Hotline: KIRAN 1800-599-0019 (FREE 24/7)"
            : "Support resources are available 24/7",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in crisis detection:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(processCrisisDetection);
