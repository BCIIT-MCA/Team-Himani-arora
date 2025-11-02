-- Seed admin and counselor users
-- Run this after the roles migration

BEGIN;

-- ========================================
-- CREATE SAMPLE ADMIN USERS
-- ========================================

-- Note: These users need to be created in Supabase Auth first
-- Then their profiles will be updated with admin roles

-- Sample admin emails and roles (you'll need to create these accounts first)
-- admin@wellnessspace.com - Super Admin
-- counselor1@wellnessspace.com - Counselor
-- counselor2@wellnessspace.com - Counselor
-- moderator@wellnessspace.com - Admin

-- ========================================
-- COUNSELOR ACCOUNT SETUP INSTRUCTIONS
-- ========================================

/*
To create admin/counselor accounts:

1. Create accounts in Supabase Auth Dashboard:
   - Go to Authentication > Users in Supabase Dashboard
   - Click "Create User"
   - Add emails like:
     * admin@wellnessspace.com (password: AdminPass123!)
     * dr.ananya@wellnessspace.com (password: CounselorPass123!)
     * dr.rajesh@wellnessspace.com (password: CounselorPass123!)

2. Get the user IDs from Supabase Auth Dashboard

3. Update the profiles table with roles:
*/

-- Example: Update specific user to admin role (replace with actual user ID)
-- NOTE: Use 'id' column, not 'user_id' - the profiles table uses id as primary key
-- UPDATE public.profiles 
-- SET role = 'super_admin' 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- Example: Update specific user to counselor role
-- UPDATE public.profiles 
-- SET role = 'counselor' 
-- WHERE id = 'YOUR_COUNSELOR_USER_ID_HERE';

-- ========================================
-- LINK COUNSELORS TO EXISTING COUNSELOR RECORDS
-- ========================================

-- After creating counselor user accounts, link them to existing counselor records
-- Example:
-- INSERT INTO public.counselor_users (id, counselor_id)
-- VALUES ('YOUR_COUNSELOR_USER_ID', 'EXISTING_COUNSELOR_RECORD_ID');

COMMIT;