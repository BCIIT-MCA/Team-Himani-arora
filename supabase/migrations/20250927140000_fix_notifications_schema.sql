-- Migration to fix notifications schema - add channel and sent_at columns
-- This addresses Comment 1: Notifications schema mismatches break email/SMS delivery and queuing

BEGIN;

-- Add missing columns to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('in_app', 'email', 'sms')) DEFAULT 'in_app',
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Create index on sent_at for efficient querying of unsent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON public.notifications(sent_at);

-- Create index on channel for filtering notifications by delivery method
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel);

-- Create composite index for efficiently finding unsent notifications by channel
CREATE INDEX IF NOT EXISTS idx_notifications_unsent_by_channel ON public.notifications(channel, sent_at) WHERE sent_at IS NULL;

COMMIT;