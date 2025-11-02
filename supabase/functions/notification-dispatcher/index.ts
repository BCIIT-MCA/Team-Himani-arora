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

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL =
  Deno.env.get("SENDGRID_FROM_EMAIL") ?? "no-reply@mindcompanion.app";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");

const DEFAULT_BATCH_SIZE = 25;

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  channel: "in_app" | "email" | "sms";
  title: string;
  message: string;
  data: Record<string, unknown>;
  created_at: string;
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

  const profile: UserContactProfile = {
    email,
    phone,
    preferred_contact_method:
      profileResult.data?.preferred_contact_method ?? null,
  };

  userCache.set(userId, profile);
  return profile;
}

async function markNotificationAsSent(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to mark notification as sent", id, error);
  }
}

async function sendEmail(recipient: string, subject: string, body: string) {
  if (!SENDGRID_API_KEY) {
    throw new Error("Missing SENDGRID_API_KEY environment variable");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: recipient }],
          subject,
        },
      ],
      from: { email: SENDGRID_FROM_EMAIL },
      content: [
        { type: "text/plain", value: body },
        { type: "text/html", value: `<p>${body.replace(/\n/g, "<br/>")}</p>` },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SendGrid error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
}

async function sendSms(recipient: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error("Missing Twilio environment variables");
  }

  const payload = new URLSearchParams({
    From: TWILIO_FROM_NUMBER,
    To: recipient,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(
          `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Twilio error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
}

async function processNotification(record: NotificationRecord) {
  if (record.channel === "in_app") {
    await markNotificationAsSent(record.id);
    return { status: "skipped", reason: "in-app notification" };
  }

  const contactProfile = await getUserContactProfile(record.user_id);

  if (!contactProfile) {
    return { status: "failed", reason: "Missing user profile" };
  }

  if (record.channel === "email") {
    if (!contactProfile.email) {
      return { status: "failed", reason: "User missing email" };
    }

    await sendEmail(contactProfile.email, record.title, record.message);
    await markNotificationAsSent(record.id);
    return { status: "sent" };
  }

  if (record.channel === "sms") {
    if (!contactProfile.phone) {
      return { status: "failed", reason: "User missing phone" };
    }

    await sendSms(contactProfile.phone, `${record.title}\n${record.message}`);
    await markNotificationAsSent(record.id);
    return { status: "sent" };
  }

  return { status: "failed", reason: "Unsupported channel" };
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

  let limit = DEFAULT_BATCH_SIZE;
  let dryRun = false;

  try {
    const body = await req.json();
    limit =
      typeof body.limit === "number"
        ? Math.min(Math.max(body.limit, 1), 100)
        : DEFAULT_BATCH_SIZE;
    dryRun = Boolean(body.dryRun);
  } catch (_error) {
    // Ignore parsing errors; use defaults.
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, channel, title, message, data, created_at")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch pending notifications", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch notifications" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const results = [] as Array<{ id: string; status: string; reason?: string }>;

  for (const notification of notifications ?? []) {
    try {
      if (dryRun) {
        results.push({ id: notification.id, status: "dry-run" });
        continue;
      }

      const outcome = await processNotification(
        notification as NotificationRecord
      );
      results.push({ id: notification.id, ...outcome });
    } catch (dispatchError) {
      console.error(
        "Notification dispatch failed",
        notification.id,
        dispatchError
      );
      results.push({
        id: notification.id,
        status: "failed",
        reason: (dispatchError as Error).message,
      });
    }
  }

  return new Response(
    JSON.stringify({
      processed: notifications?.length ?? 0,
      results,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
