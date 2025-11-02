-- Migration to create enqueue_notification RPC function
-- This addresses Comment 2: Missing RPC enqueue_notification used by appointment reminders

BEGIN;

-- Create the enqueue_notification function
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  target_user uuid,
  notification_type text,
  channel_hint text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Insert the notification record
  INSERT INTO public.notifications (
    user_id,
    type,
    channel,
    title,
    message,
    data
  ) VALUES (
    target_user,
    notification_type,
    channel_hint::text,
    notification_title,
    notification_message,
    notification_data
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.enqueue_notification TO authenticated;

-- Grant execute permission to service role (for edge functions)
GRANT EXECUTE ON FUNCTION public.enqueue_notification TO service_role;

COMMIT;