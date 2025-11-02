-- Row Level Security policies for Solace Connect
-- This migration sets up comprehensive RLS policies for all tables

BEGIN;

-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychological_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PROFILES POLICIES
-- ========================================

CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ========================================
-- COUNSELORS POLICIES
-- ========================================

CREATE POLICY "Anyone can view active counselors" 
  ON public.counselors FOR SELECT 
  USING (is_active = true);

-- ========================================
-- APPOINTMENTS POLICIES
-- ========================================

CREATE POLICY "Users can view their own appointments" 
  ON public.appointments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
  ON public.appointments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
  ON public.appointments FOR UPDATE 
  USING (auth.uid() = user_id);

-- ========================================
-- ASSESSMENT POLICIES
-- ========================================

CREATE POLICY "Users can view their own assessments" 
  ON public.psychological_assessments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments" 
  ON public.psychological_assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessment results" 
  ON public.assessment_results FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessment results" 
  ON public.assessment_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- COMMUNITY POLICIES
-- ========================================

-- Peer moderators policies
CREATE POLICY "Anyone can view active moderators" 
  ON public.peer_moderators FOR SELECT 
  USING (is_active = true);

-- Community posts policies
CREATE POLICY "Anyone can view community posts" 
  ON public.community_posts FOR SELECT 
  USING (true);

CREATE POLICY "Users can create community posts" 
  ON public.community_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON public.community_posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON public.community_posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Community replies policies
CREATE POLICY "Anyone can view community replies" 
  ON public.community_replies FOR SELECT 
  USING (true);

CREATE POLICY "Users can create replies" 
  ON public.community_replies FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" 
  ON public.community_replies FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" 
  ON public.community_replies FOR DELETE 
  USING (auth.uid() = user_id);

-- Voting policies
CREATE POLICY "Users can view all votes" 
  ON public.community_votes FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own votes" 
  ON public.community_votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
  ON public.community_votes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
  ON public.community_votes FOR DELETE 
  USING (auth.uid() = user_id);

-- ========================================
-- CHAT POLICIES
-- ========================================

CREATE POLICY "Users can view their own conversations" 
  ON public.chat_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
  ON public.chat_conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
  ON public.chat_conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" 
  ON public.chat_messages FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM public.chat_conversations 
    WHERE id = conversation_id
  ));

CREATE POLICY "Users can create messages in their conversations" 
  ON public.chat_messages FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.chat_conversations 
    WHERE id = conversation_id
  ));

-- ========================================
-- CRISIS MANAGEMENT POLICIES
-- ========================================

CREATE POLICY "Users can view their own crisis alerts" 
  ON public.crisis_alerts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all crisis alerts" 
  ON public.crisis_alerts FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM public.peer_moderators 
    WHERE is_active = true
  ));

-- ========================================
-- NOTIFICATION POLICIES
-- ========================================

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification preferences" 
  ON public.notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" 
  ON public.notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
  ON public.notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- ========================================
-- RESOURCES AND EVENTS POLICIES
-- ========================================

CREATE POLICY "Anyone can view active resources" 
  ON public.resources FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Anyone can view active events" 
  ON public.events FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Users can view their own event registrations" 
  ON public.event_registrations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event registrations" 
  ON public.event_registrations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event registrations" 
  ON public.event_registrations FOR DELETE 
  USING (auth.uid() = user_id);

COMMIT;