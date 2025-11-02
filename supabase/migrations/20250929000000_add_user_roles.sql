-- Add user roles system
-- This migration adds role-based access control

BEGIN;

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

-- Add constraint to ensure valid roles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check' 
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('student', 'counselor', 'admin', 'super_admin'));
    END IF;
END $$;-- Create index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing profiles to have student role (default)
UPDATE public.profiles SET role = 'student' WHERE role IS NULL;

-- Create admin users table for tracking admin-specific data
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  permissions JSONB NOT NULL DEFAULT '{}',
  department TEXT,
  institution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create counselor users table for linking counselors to auth users
CREATE TABLE IF NOT EXISTS public.counselor_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  counselor_id UUID NOT NULL REFERENCES public.counselors(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselor_users ENABLE ROW LEVEL SECURITY;

-- Admin users can only see their own admin data
CREATE POLICY "Users can view own admin data" ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

-- Only admins can insert admin data
CREATE POLICY "Only admins can insert admin data" ON public.admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Counselor users can see their own counselor mapping
CREATE POLICY "Users can view own counselor data" ON public.counselor_users
  FOR SELECT USING (auth.uid() = id);

-- Only admins can manage counselor user mappings
CREATE POLICY "Only admins can manage counselor users" ON public.counselor_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ========================================
-- FUNCTIONS FOR ROLE MANAGEMENT
-- ========================================

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has counselor role
CREATE OR REPLACE FUNCTION public.is_counselor(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'counselor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;