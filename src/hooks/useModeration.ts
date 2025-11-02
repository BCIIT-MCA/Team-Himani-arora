import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PeerModerator = Database["public"]["Tables"]["peer_moderators"]["Row"];
type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityReply = Database["public"]["Tables"]["community_replies"]["Row"];

type ModerationAction = Database["public"]["Tables"]["moderation_audit"]["Row"];

interface PendingContent {
  posts: CommunityPost[];
  replies: CommunityReply[];
}

interface UseModerationReturn {
  // Moderator status
  isModerator: boolean;
  moderatorInfo: PeerModerator | null;
  loadingModeratorStatus: boolean;

  // Pending content
  pendingContent: PendingContent;
  loadingPendingContent: boolean;
  fetchPendingContent: () => Promise<void>;

  // Moderation actions
  moderatePost: (
    postId: string,
    action: "approve" | "hide" | "escalate",
    reason?: string
  ) => Promise<void>;
  moderateReply: (
    replyId: string,
    action: "approve" | "hide" | "escalate",
    reason?: string
  ) => Promise<void>;

  // Action history
  moderationHistory: ModerationAction[];
  loadingHistory: boolean;
  fetchModerationHistory: () => Promise<void>;

  // Utility
  error: string | null;
  refresh: () => Promise<void>;
}

export const useModeration = (): UseModerationReturn => {
  const [isModerator, setIsModerator] = useState(false);
  const [moderatorInfo, setModeratorInfo] = useState<PeerModerator | null>(
    null
  );
  const [loadingModeratorStatus, setLoadingModeratorStatus] = useState(true);
  const [pendingContent, setPendingContent] = useState<PendingContent>({
    posts: [],
    replies: [],
  });
  const [loadingPendingContent, setLoadingPendingContent] = useState(false);
  const [moderationHistory, setModerationHistory] = useState<
    ModerationAction[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const checkModeratorStatus = useCallback(async () => {
    if (!user) {
      setIsModerator(false);
      setModeratorInfo(null);
      setLoadingModeratorStatus(false);
      return;
    }

    try {
      setLoadingModeratorStatus(true);

      const { data, error } = await supabase
        .from("peer_moderators")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      const isUserModerator = !!data;
      setIsModerator(isUserModerator);
      setModeratorInfo(data);
    } catch (err) {
      console.error("Error checking moderator status:", err);
      setIsModerator(false);
      setModeratorInfo(null);
    } finally {
      setLoadingModeratorStatus(false);
    }
  }, [user]);

  const fetchPendingContent = useCallback(async () => {
    if (!isModerator) return;

    try {
      setLoadingPendingContent(true);
      setError(null);

      // Fetch pending posts
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(
          `
          *,
          profiles!community_posts_user_id_fkey(display_name)
        `
        )
        .eq("is_moderated", false)
        .order("created_at", { ascending: true });

      if (postsError) throw postsError;

      // Fetch pending replies
      const { data: repliesData, error: repliesError } = await supabase
        .from("community_replies")
        .select("*")
        .eq("is_moderated", false)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      setPendingContent({
        posts: postsData || [],
        replies: repliesData || [],
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch pending content";
      setError(errorMessage);
      console.error("Error fetching pending content:", err);

      toast({
        title: "Error Loading Pending Content",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingPendingContent(false);
    }
  }, [isModerator, toast]);

  const moderatePost = useCallback(
    async (
      postId: string,
      action: "approve" | "hide" | "escalate",
      reason?: string
    ) => {
      if (!user || !isModerator) {
        toast({
          title: "Authorization Required",
          description: "You must be a moderator to perform this action",
          variant: "destructive",
        });
        return;
      }

      try {
        // Record the moderation action
        const { error: actionError } = await supabase
          .from("moderation_audit")
          .insert({
            moderator_id: moderatorInfo!.id,
            action_type: "post_review",
            target_type: "post",
            target_id: postId,
            action_details: { action },
            notes: reason,
          });

        if (actionError) throw actionError;

        // Update the post status
        if (action === "approve") {
          const { error: updateError } = await supabase
            .from("community_posts")
            .update({
              is_moderated: true,
              moderated_by: moderatorInfo?.id,
            })
            .eq("id", postId);

          if (updateError) throw updateError;
        } else if (action === "hide") {
          // For hiding, we might want to keep the post but mark it as hidden
          // For now, we'll just mark it as moderated but not approved
          const { error: updateError } = await supabase
            .from("community_posts")
            .update({
              is_moderated: true,
              moderated_by: moderatorInfo?.id,
            })
            .eq("id", postId);

          if (updateError) throw updateError;
        }

        toast({
          title: "Success",
          description: `Post ${action}d successfully`,
        });

        // Remove from pending content
        setPendingContent((prev) => ({
          ...prev,
          posts: prev.posts.filter((post) => post.id !== postId),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${action} post`;
        console.error(`Error ${action}ing post:`, err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, isModerator, moderatorInfo?.id, toast]
  );

  const moderateReply = useCallback(
    async (
      replyId: string,
      action: "approve" | "hide" | "escalate",
      reason?: string
    ) => {
      if (!user || !isModerator) {
        toast({
          title: "Authorization Required",
          description: "You must be a moderator to perform this action",
          variant: "destructive",
        });
        return;
      }

      try {
        // Record the moderation action
        const { error: actionError } = await supabase
          .from("moderation_audit")
          .insert({
            moderator_id: moderatorInfo!.id,
            action_type: "reply_review",
            target_type: "reply",
            target_id: replyId,
            action_details: { action },
            notes: reason,
          });

        if (actionError) throw actionError;

        // Update the reply status
        if (action === "approve") {
          const { error: updateError } = await supabase
            .from("community_replies")
            .update({
              is_moderated: true,
              moderated_by: moderatorInfo?.id,
            })
            .eq("id", replyId);

          if (updateError) throw updateError;
        } else if (action === "hide") {
          const { error: updateError } = await supabase
            .from("community_replies")
            .update({
              is_moderated: true,
              moderated_by: moderatorInfo?.id,
            })
            .eq("id", replyId);

          if (updateError) throw updateError;
        }

        toast({
          title: "Success",
          description: `Reply ${action}d successfully`,
        });

        // Remove from pending content
        setPendingContent((prev) => ({
          ...prev,
          replies: prev.replies.filter((reply) => reply.id !== replyId),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to ${action} reply`;
        console.error(`Error ${action}ing reply:`, err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, isModerator, moderatorInfo?.id, toast]
  );

  const fetchModerationHistory = useCallback(async () => {
    if (!user || !isModerator) return;

    try {
      setLoadingHistory(true);

      const { data, error } = await supabase
        .from("moderation_audit")
        .select("*")
        .eq("moderator_id", moderatorInfo!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setModerationHistory(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch moderation history";
      console.error("Error fetching moderation history:", err);

      toast({
        title: "Error Loading History",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  }, [user, isModerator, toast]);

  const refresh = useCallback(async () => {
    await Promise.all([
      checkModeratorStatus(),
      fetchPendingContent(),
      fetchModerationHistory(),
    ]);
  }, [checkModeratorStatus, fetchPendingContent, fetchModerationHistory]);

  // Subscribe to realtime updates for pending content
  useEffect(() => {
    if (!isModerator) return;

    const postsChannel = supabase
      .channel("moderation_posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
          filter: "is_moderated=eq.false",
        },
        () => {
          fetchPendingContent();
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel("moderation_replies")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_replies",
          filter: "is_moderated=eq.false",
        },
        () => {
          fetchPendingContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [isModerator, fetchPendingContent]);

  // Initial load
  useEffect(() => {
    checkModeratorStatus();
  }, [checkModeratorStatus]);

  useEffect(() => {
    if (isModerator) {
      fetchPendingContent();
      fetchModerationHistory();
    }
  }, [isModerator, fetchPendingContent, fetchModerationHistory]);

  return {
    isModerator,
    moderatorInfo,
    loadingModeratorStatus,
    pendingContent,
    loadingPendingContent,
    fetchPendingContent,
    moderatePost,
    moderateReply,
    moderationHistory,
    loadingHistory,
    fetchModerationHistory,
    error,
    refresh,
  };
};
