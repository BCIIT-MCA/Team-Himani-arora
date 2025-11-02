-- Migration to create SQL views for community posts and replies with profiles
-- This addresses Comments 8 and 14: Forums join profiles via non-existent FK; nested profile data may not load

BEGIN;

-- Create view for community posts with profile information
CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
SELECT 
  cp.*,
  p.display_name,
  p.avatar_url
FROM public.community_posts cp
LEFT JOIN public.profiles p ON p.id = cp.user_id;

-- Create view for community replies with profile information  
CREATE OR REPLACE VIEW public.community_replies_with_profiles AS
SELECT 
  cr.*,
  p.display_name,
  p.avatar_url
FROM public.community_replies cr
LEFT JOIN public.profiles p ON p.id = cr.user_id;

-- Grant select permissions to authenticated users
GRANT SELECT ON public.community_posts_with_profiles TO authenticated;
GRANT SELECT ON public.community_replies_with_profiles TO authenticated;

-- Grant select permissions to service role (for edge functions)
GRANT SELECT ON public.community_posts_with_profiles TO service_role;
GRANT SELECT ON public.community_replies_with_profiles TO service_role;

COMMIT;