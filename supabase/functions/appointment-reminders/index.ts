// @ts-nocheck
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

const supabase = createClient(supabaseUrl ?? "", supabaseServiceRoleKey ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEFAULT_LOOKAHEAD_MINUTES = 60 * 24; // 24 hours
const MAX_LOOKAHEAD_MINUTES = 60 * 24 * 7; // 7 days

interface AppointmentRecord {
  id: string;
  user_id: string;
  counselor_id: string;
  appointment_date: string;
  duration_minutes: number;
  type: string;
  status: string;
  counselors?: {
    name: string | null;
    contact_method: string | null;
  } | null;
}

interface UserContactProfile {
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
}

const userCache = new Map<string, UserContactProfile>();

async function getUserContactProfile(
  userId: string
): Promise<UserContactProfile | null> {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  const [userResult, profileResult] = await Promise.all([
    supabase.auth.admin.getUserById(userId),
    supabase
      .from("profiles")
      .select("preferred_contact_method, crisis_contact_phone")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (userResult.error) {
    console.error("Failed to fetch auth user", userResult.error);
    return null;
  }

  const email = userResult.data.user?.email ?? null;
  const phone =
    profileResult.data?.crisis_contact_phone?.trim?.().length > 0
      ? profileResult.data.crisis_contact_phone.trim()
      : null;

  const contact: UserContactProfile = {
    email,
    phone,
    preferred_contact_method:
      profileResult.data?.preferred_contact_method ?? null,
  };

  userCache.set(userId, contact);
  return contact;
}

function getNotificationChannels(
  contact: UserContactProfile
): Array<"in_app" | "email" | "sms"> {
  const channels: Array<"in_app" | "email" | "sms"> = ["in_app"];

  switch (contact.preferred_contact_method) {
    case "email":
      if (contact.email) channels.push("email");
      break;
    case "phone":
      if (contact.phone) channels.push("sms");
      break;
    case "anonymous":
      break;
    default:
      if (contact.email) channels.push("email");
      else if (contact.phone) channels.push("sms");
      break;
  }

  return channels;
}

async function notificationExists(
  userId: string,
  appointmentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "appointment_reminder")
    .filter("payload->>appointment_id", "eq", appointmentId)
    .limit(1);

  if (error) {
    console.error("Failed to check existing notifications", error);
    return true;
  }

  return (data ?? []).length > 0;
}

async function createNotification(
  userId: string,
  channel: "in_app" | "email" | "sms",
  appointment: AppointmentRecord,
  contactProfile: UserContactProfile
) {
  const appointmentDate = new Date(appointment.appointment_date);
  const formattedDate = appointmentDate.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const counselorName = appointment.counselors?.name ?? "your counselor";

  const title =
    channel === "sms"
      ? `Reminder: Counseling session on ${formattedDate}`
      : `Upcoming appointment with ${counselorName}`;

  const baseMessage = `Hi there! This is a reminder about your ${
    appointment.type ?? "counseling"
  } session with ${counselorName} scheduled for ${formattedDate}.`;

  const message =
    channel === "sms"
      ? `${baseMessage} Reply STOP to opt out.`
      : `${baseMessage}\n\nIf you need to reschedule or cancel, please visit the appointments section in MindCompanion.`;

  const payload = {
    appointment_id: appointment.id,
    appointment_date: appointment.appointment_date,
    counselor_id: appointment.counselor_id,
    counselor_name: appointment.counselors?.name ?? null,
    contact_method: appointment.counselors?.contact_method ?? null,
    duration_minutes: appointment.duration_minutes,
  };

  const { error } = await supabase.rpc("enqueue_notification", {
    target_user: userId,
    notification_type: "appointment_reminder",
    channel_hint: channel,
    notification_title: title,
    notification_message: message,
    notification_data: payload,
  });

  if (error) {
    throw error;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let lookAheadMinutes = DEFAULT_LOOKAHEAD_MINUTES;
  let dryRun = false;

  try {
    const payload = await req.json();
    if (typeof payload.lookAheadMinutes === "number") {
      lookAheadMinutes = Math.min(
        Math.max(5, payload.lookAheadMinutes),
        MAX_LOOKAHEAD_MINUTES
      );
    }
    dryRun = Boolean(payload.dryRun);
  } catch (_error) {
    // ignore parse errors and use defaults
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + lookAheadMinutes * 60 * 1000);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, user_id, counselor_id, appointment_date, duration_minutes, type, status, counselors(name, contact_method)"
    )
    .eq("status", "scheduled")
    .gte("appointment_date", now.toISOString())
    .lte("appointment_date", windowEnd.toISOString())
    .order("appointment_date", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Failed to fetch appointments", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch appointments" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const results: Array<{
    appointmentId: string;
    created: number;
    skipped?: string;
  }> = [];

  for (const appointment of appointments ?? []) {
    try {
      const alreadyNotified = await notificationExists(
        appointment.user_id,
        appointment.id
      );
      if (alreadyNotified) {
        results.push({
          appointmentId: appointment.id,
          created: 0,
          skipped: "already-notified",
        });
        continue;
      }

      const contactProfile = await getUserContactProfile(appointment.user_id);
      if (!contactProfile) {
        results.push({
          appointmentId: appointment.id,
          created: 0,
          skipped: "missing-contact",
        });
        continue;
      }

      const channels = getNotificationChannels(contactProfile);

      if (dryRun) {
        results.push({
          appointmentId: appointment.id,
          created: channels.length,
        });
        continue;
      }

      for (const channel of channels) {
        await createNotification(
          appointment.user_id,
          channel,
          appointment,
          contactProfile
        );
      }

      results.push({ appointmentId: appointment.id, created: channels.length });
    } catch (dispatchError) {
      console.error(
        "Failed to enqueue reminder",
        appointment.id,
        dispatchError
      );
      results.push({
        appointmentId: appointment.id,
        created: 0,
        skipped: (dispatchError as Error).message ?? "error",
      });
    }
  }

  return new Response(
    JSON.stringify({
      processed: appointments?.length ?? 0,
      results,
      windowStart: now.toISOString(),
      windowEnd: windowEnd.toISOString(),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
