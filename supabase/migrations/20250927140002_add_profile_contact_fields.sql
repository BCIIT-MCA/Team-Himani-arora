-- Migration to add missing profile fields for contact preferences
-- This addresses Comment 3: Profiles schema does not have fields used by new code

BEGIN;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'sms', 'both')) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS crisis_contact_phone TEXT;

-- Create index on preferred_contact_method for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_contact_method ON public.profiles(preferred_contact_method);

COMMIT;