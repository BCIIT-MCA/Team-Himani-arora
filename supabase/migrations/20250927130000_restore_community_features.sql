-- Restore community interactions and notification infrastructure
-- This recreates functionality from the deleted migration files

BEGIN;

-- ========================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New vote added
    IF NEW.post_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE public.community_posts 
        SET upvote_count = upvote_count + 1 
        WHERE id = NEW.post_id;
      ELSE
        UPDATE public.community_posts 
        SET downvote_count = downvote_count + 1 
        WHERE id = NEW.post_id;
      END IF;
    ELSIF NEW.reply_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE public.community_replies 
        SET upvote_count = upvote_count + 1 
        WHERE id = NEW.reply_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote type changed
    IF OLD.post_id IS NOT NULL THEN
      -- Remove old vote
      IF OLD.vote_type = 'upvote' THEN
        UPDATE public.community_posts 
        SET upvote_count = upvote_count - 1 
        WHERE id = OLD.post_id;
      ELSE
        UPDATE public.community_posts 
        SET downvote_count = downvote_count - 1 
        WHERE id = OLD.post_id;
      END IF;
      -- Add new vote
      IF NEW.vote_type = 'upvote' THEN
        UPDATE public.community_posts 
        SET upvote_count = upvote_count + 1 
        WHERE id = NEW.post_id;
      ELSE
        UPDATE public.community_posts 
        SET downvote_count = downvote_count + 1 
        WHERE id = NEW.post_id;
      END IF;
    ELSIF OLD.reply_id IS NOT NULL THEN
      -- Only upvotes for replies
      UPDATE public.community_replies 
      SET upvote_count = upvote_count - 1 
      WHERE id = OLD.reply_id;
      IF NEW.vote_type = 'upvote' THEN
        UPDATE public.community_replies 
        SET upvote_count = upvote_count + 1 
        WHERE id = NEW.reply_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Vote removed
    IF OLD.post_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE public.community_posts 
        SET upvote_count = upvote_count - 1 
        WHERE id = OLD.post_id;
      ELSE
        UPDATE public.community_posts 
        SET downvote_count = downvote_count - 1 
        WHERE id = OLD.post_id;
      END IF;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE public.community_replies 
      SET upvote_count = upvote_count - 1 
      WHERE id = OLD.reply_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update reply counts
CREATE OR REPLACE FUNCTION update_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger for vote count updates
DROP TRIGGER IF EXISTS community_votes_trigger ON public.community_votes;
CREATE TRIGGER community_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.community_votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- Trigger for reply count updates
DROP TRIGGER IF EXISTS community_replies_count_trigger ON public.community_replies;
CREATE TRIGGER community_replies_count_trigger
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION update_reply_counts();

-- ========================================
-- NOTIFICATION SYSTEM ENHANCEMENTS
-- ========================================

-- Function to create notifications for forum interactions
CREATE OR REPLACE FUNCTION create_forum_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New reply notification
    IF TG_TABLE_NAME = 'community_replies' THEN
      SELECT user_id, title INTO post_author_id, post_title
      FROM public.community_posts 
      WHERE id = NEW.post_id;
      
      -- Don't notify if replying to own post
      IF post_author_id != NEW.user_id THEN
        notification_type := 'forum_reply';
        notification_title := 'New Reply to Your Post';
        notification_message := 'Someone replied to your post "' || post_title || '"';
        
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          post_author_id,
          notification_type,
          notification_title,
          notification_message,
          jsonb_build_object(
            'post_id', NEW.post_id,
            'reply_id', NEW.id,
            'replier_id', NEW.user_id
          )
        );
      END IF;
    END IF;
    
    -- New vote notification
    IF TG_TABLE_NAME = 'community_votes' AND NEW.vote_type = 'upvote' THEN
      IF NEW.post_id IS NOT NULL THEN
        SELECT user_id, title INTO post_author_id, post_title
        FROM public.community_posts 
        WHERE id = NEW.post_id;
        
        -- Don't notify if voting on own post
        IF post_author_id != NEW.user_id THEN
          notification_type := 'post_upvote';
          notification_title := 'Your Post Was Upvoted';
          notification_message := 'Someone upvoted your post "' || post_title || '"';
          
          INSERT INTO public.notifications (user_id, type, title, message, data)
          VALUES (
            post_author_id,
            notification_type,
            notification_title,
            notification_message,
            jsonb_build_object(
              'post_id', NEW.post_id,
              'voter_id', NEW.user_id
            )
          );
        END IF;
      ELSIF NEW.reply_id IS NOT NULL THEN
        SELECT user_id INTO post_author_id
        FROM public.community_replies 
        WHERE id = NEW.reply_id;
        
        -- Don't notify if voting on own reply
        IF post_author_id != NEW.user_id THEN
          notification_type := 'reply_upvote';
          notification_title := 'Your Reply Was Upvoted';
          notification_message := 'Someone upvoted your reply';
          
          INSERT INTO public.notifications (user_id, type, title, message, data)
          VALUES (
            post_author_id,
            notification_type,
            notification_title,
            notification_message,
            jsonb_build_object(
              'reply_id', NEW.reply_id,
              'voter_id', NEW.user_id
            )
          );
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for notifications
DROP TRIGGER IF EXISTS forum_reply_notification_trigger ON public.community_replies;
CREATE TRIGGER forum_reply_notification_trigger
  AFTER INSERT ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION create_forum_notification();

DROP TRIGGER IF EXISTS forum_vote_notification_trigger ON public.community_votes;
CREATE TRIGGER forum_vote_notification_trigger
  AFTER INSERT ON public.community_votes
  FOR EACH ROW EXECUTE FUNCTION create_forum_notification();

-- ========================================
-- CRISIS DETECTION SYSTEM
-- ========================================

-- Function to detect crisis keywords in content
CREATE OR REPLACE FUNCTION detect_crisis_content()
RETURNS TRIGGER AS $$
DECLARE
  crisis_keywords TEXT[] := ARRAY[
    'suicide', 'kill myself', 'end my life', 'want to die', 'suicidal',
    'self harm', 'self-harm', 'cut myself', 'hurt myself', 'overdose',
    'jump off', 'hang myself', 'no point living', 'better off dead',
    'plan to die', 'ending it all', 'cant go on', 'ready to die'
  ];
  keyword TEXT;
  content_lower TEXT;
  severity_level TEXT := 'low';
  triggers_found TEXT[] := '{}';
BEGIN
  -- Check both posts and replies
  IF TG_TABLE_NAME = 'community_posts' THEN
    content_lower := lower(NEW.content || ' ' || NEW.title);
  ELSIF TG_TABLE_NAME = 'community_replies' THEN
    content_lower := lower(NEW.content);
  ELSIF TG_TABLE_NAME = 'chat_messages' THEN
    content_lower := lower(NEW.content);
  ELSE
    RETURN NEW;
  END IF;

  -- Check for crisis keywords
  FOREACH keyword IN ARRAY crisis_keywords
  LOOP
    IF position(keyword IN content_lower) > 0 THEN
      triggers_found := array_append(triggers_found, keyword);
      -- Determine severity based on specific keywords
      IF keyword IN ('suicide', 'kill myself', 'end my life', 'overdose', 'hang myself', 'jump off') THEN
        severity_level := 'critical';
      ELSIF keyword IN ('want to die', 'suicidal', 'self harm', 'self-harm', 'cut myself', 'hurt myself') THEN
        IF severity_level != 'critical' THEN
          severity_level := 'high';
        END IF;
      ELSIF keyword IN ('no point living', 'better off dead', 'plan to die', 'ending it all') THEN
        IF severity_level NOT IN ('critical', 'high') THEN
          severity_level := 'medium';
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- If crisis keywords found, create alert
  IF array_length(triggers_found, 1) > 0 THEN
    INSERT INTO public.crisis_alerts (
      user_id,
      severity,
      content,
      trigger_source,
      metadata
    ) VALUES (
      NEW.user_id,
      severity_level,
      left(content_lower, 500), -- Limit content for privacy
      CASE 
        WHEN TG_TABLE_NAME = 'community_posts' THEN 'post_content'
        WHEN TG_TABLE_NAME = 'community_replies' THEN 'post_content'
        WHEN TG_TABLE_NAME = 'chat_messages' THEN 'chat_message'
        ELSE 'unknown'
      END,
      jsonb_build_object(
        'source_table', TG_TABLE_NAME,
        'source_id', NEW.id,
        'detected_keywords', triggers_found,
        'keyword_count', array_length(triggers_found, 1)
      )
    );

    -- Create immediate notification for critical alerts
    IF severity_level = 'critical' THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        NEW.user_id,
        'crisis_alert',
        'Immediate Support Available',
        'We noticed you might be going through a difficult time. Immediate help is available. Crisis Hotline: 988',
        jsonb_build_object(
          'severity', severity_level,
          'resources', jsonb_build_object(
            'crisis_hotline', '988',
            'text_line', '741741',
            'chat_url', 'https://suicidepreventionlifeline.org/chat/'
          )
        )
      );
    END IF;

    -- Update the record to indicate crisis detection
    IF TG_TABLE_NAME = 'chat_messages' THEN
      NEW.crisis_detected := true;
      NEW.crisis_level := severity_level;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for crisis detection
DROP TRIGGER IF EXISTS crisis_detection_posts_trigger ON public.community_posts;
CREATE TRIGGER crisis_detection_posts_trigger
  BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION detect_crisis_content();

DROP TRIGGER IF EXISTS crisis_detection_replies_trigger ON public.community_replies;
CREATE TRIGGER crisis_detection_replies_trigger
  BEFORE INSERT OR UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION detect_crisis_content();

DROP TRIGGER IF EXISTS crisis_detection_chat_trigger ON public.chat_messages;
CREATE TRIGGER crisis_detection_chat_trigger
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION detect_crisis_content();

-- ========================================
-- MODERATION AUDIT SYSTEM
-- ========================================

-- Create moderation audit table
CREATE TABLE IF NOT EXISTS public.moderation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES public.peer_moderators(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('post_review', 'reply_review', 'crisis_response', 'user_warning', 'content_removal')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'reply', 'user', 'crisis_alert')),
  target_id UUID NOT NULL,
  action_details JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on moderation audit
ALTER TABLE public.moderation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view all moderation audits" 
  ON public.moderation_audit FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM public.peer_moderators WHERE is_active = true
  ));

CREATE POLICY "Moderators can create moderation audits" 
  ON public.moderation_audit FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.peer_moderators WHERE is_active = true
  ));

-- ========================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ========================================

-- Enable realtime for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crisis_alerts;

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON public.crisis_alerts(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_unresolved ON public.crisis_alerts(user_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_community_posts_category_created ON public.community_posts(category, created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_moderator ON public.moderation_audit(moderator_id, created_at);

COMMIT;