import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityReply = Database["public"]["Tables"]["community_replies"]["Row"];

// Extended types for posts and replies with vote counts
interface PostWithVotes extends CommunityPost {
  upvote_count: number;
  downvote_count: number;
  reply_count: number;
  user_vote?: "upvote" | "downvote" | null;
}

interface ReplyWithVotes extends CommunityReply {
  upvote_count: number;
  user_vote?: "upvote" | "downvote" | null;
}

// Vote data structure using database type
type Vote = Database["public"]["Tables"]["community_votes"]["Row"];

interface UseCommunityInteractionsReturn {
  // Posts
  posts: PostWithVotes[];
  loadingPosts: boolean;
  fetchPosts: (category?: string, limit?: number) => Promise<PostWithVotes[]>;
  createPost: (data: {
    title: string;
    content: string;
    category: string;
    is_anonymous?: boolean;
  }) => Promise<void>;

  // Replies
  replies: Record<string, ReplyWithVotes[]>; // Keyed by post_id
  loadingReplies: Record<string, boolean>;
  fetchReplies: (postId: string) => Promise<ReplyWithVotes[]>;
  createReply: (
    postId: string,
    content: string,
    isAnonymous?: boolean
  ) => Promise<void>;

  // Voting
  vote: (
    targetId: string,
    voteType: "upvote" | "downvote",
    targetType: "post" | "reply"
  ) => Promise<void>;
  removeVote: (targetId: string, targetType: "post" | "reply") => Promise<void>;

  // Utility
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCommunityInteractions = (): UseCommunityInteractionsReturn => {
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [replies, setReplies] = useState<Record<string, ReplyWithVotes[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(
    async (category?: string, limit: number = 50): Promise<PostWithVotes[]> => {
      try {
        setLoadingPosts(true);
        setError(null);

        let query = supabase
          .from("community_posts_with_profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        if (user) {
          query = query.or(`is_moderated.eq.true,user_id.eq.${user.id}`);
        } else {
          query = query.eq("is_moderated", true);
        }

        const { data: postsData, error: postsError } = await query;
        if (postsError) throw postsError;

        // Fetch vote counts and user votes for these posts
        const postIds = postsData?.map((post) => post.id) || [];

        let userVotes: Vote[] = [];
        if (user && postIds.length > 0) {
          const { data: voteData, error: voteError } = await supabase
            .from("community_votes")
            .select("*")
            .eq("user_id", user.id)
            .in("post_id", postIds);

          if (voteError) console.warn("Failed to fetch user votes:", voteError);
          else userVotes = voteData || [];
        }

        // Combine posts with vote data
        const postsWithVotes: PostWithVotes[] = (postsData || []).map(
          (post) => {
            const userVote = userVotes.find((v) => v.post_id === post.id);
            const voteType = userVote?.vote_type;
            return {
              ...post,
              upvote_count: (post as any).upvote_count || 0,
              downvote_count: (post as any).downvote_count || 0,
              reply_count: (post as any).reply_count || 0,
              user_vote:
                voteType === "upvote" || voteType === "downvote"
                  ? voteType
                  : null,
            };
          }
        );

        setPosts(postsWithVotes);
        return postsWithVotes;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch posts";
        setError(errorMessage);
        console.error("Error fetching posts:", err);

        toast({
          title: "Error Loading Posts",
          description: errorMessage,
          variant: "destructive",
        });
        return [];
      } finally {
        setLoadingPosts(false);
      }
    },
    [user, toast]
  );

  const fetchReplies = useCallback(
    async (postId: string): Promise<ReplyWithVotes[]> => {
      try {
        setLoadingReplies((prev) => ({ ...prev, [postId]: true }));

        const { data: repliesData, error: repliesError } = await supabase
          .from("community_replies")
          .select(
            `
          *,
          profiles!community_replies_user_id_fkey(display_name)
        `
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (repliesError) throw repliesError;

        // Fetch user votes for these replies
        const replyIds = repliesData?.map((reply) => reply.id) || [];

        let userVotes: Vote[] = [];
        if (user && replyIds.length > 0) {
          const { data: voteData, error: voteError } = await supabase
            .from("community_votes")
            .select("*")
            .eq("user_id", user.id)
            .in("reply_id", replyIds);

          if (voteError)
            console.warn("Failed to fetch user votes for replies:", voteError);
          else userVotes = voteData || [];
        }

        // Combine replies with vote data
        const repliesWithVotes: ReplyWithVotes[] = (repliesData || []).map(
          (reply) => {
            const userVote = userVotes.find((v) => v.reply_id === reply.id);
            const voteType = userVote?.vote_type;
            return {
              ...reply,
              upvote_count: (reply as any).upvote_count || 0,
              user_vote:
                voteType === "upvote" || voteType === "downvote"
                  ? voteType
                  : null,
            };
          }
        );

        setReplies((prev) => ({ ...prev, [postId]: repliesWithVotes }));
        return repliesWithVotes;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch replies";
        console.error("Error fetching replies:", err);

        toast({
          title: "Error Loading Replies",
          description: errorMessage,
          variant: "destructive",
        });
        return [];
      } finally {
        setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [user, toast]
  );

  const createPost = useCallback(
    async (data: {
      title: string;
      content: string;
      category: string;
      is_anonymous?: boolean;
    }) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a post",
          variant: "destructive",
        });
        return;
      }

      try {
        const { error } = await supabase.from("community_posts").insert({
          user_id: user.id,
          title: data.title,
          content: data.content,
          category: data.category,
          is_anonymous: data.is_anonymous || false,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your post has been submitted for moderation",
        });

        // Refresh posts to show the new one
        await fetchPosts();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create post";
        console.error("Error creating post:", err);

        toast({
          title: "Error Creating Post",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, toast, fetchPosts]
  );

  const createReply = useCallback(
    async (postId: string, content: string, isAnonymous = false) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to reply",
          variant: "destructive",
        });
        return;
      }

      try {
        const { error } = await supabase.from("community_replies").insert({
          post_id: postId,
          user_id: user.id,
          content,
          is_anonymous: isAnonymous,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your reply has been posted",
        });

        // Refresh replies for this post
        await fetchReplies(postId);

        // Refresh posts to update reply count
        await fetchPosts();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create reply";
        console.error("Error creating reply:", err);

        toast({
          title: "Error Creating Reply",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, toast, fetchReplies, fetchPosts]
  );

  const vote = useCallback(
    async (
      targetId: string,
      voteType: "upvote" | "downvote",
      targetType: "post" | "reply"
    ) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to vote",
          variant: "destructive",
        });
        return;
      }

      try {
        const voteData = {
          user_id: user.id,
          vote_type: voteType,
          ...(targetType === "post"
            ? { post_id: targetId }
            : { reply_id: targetId }),
        };

        // Delete existing vote first to avoid partial unique index issues
        const { error: deleteError } = await supabase
          .from("community_votes")
          .delete()
          .eq("user_id", user.id)
          .eq(targetType === "post" ? "post_id" : "reply_id", targetId);

        if (deleteError) throw deleteError;

        // Insert new vote
        const { error: insertError } = await supabase
          .from("community_votes")
          .insert(voteData);

        if (insertError) throw insertError;

        // Update local state optimistically
        if (targetType === "post") {
          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === targetId) {
                const currentVote = post.user_vote;
                let upvoteChange = 0;
                let downvoteChange = 0;

                if (currentVote === voteType) {
                  // Same vote - no change needed (upsert handles this)
                  return post;
                } else if (
                  currentVote === "upvote" &&
                  voteType === "downvote"
                ) {
                  upvoteChange = -1;
                  downvoteChange = 1;
                } else if (
                  currentVote === "downvote" &&
                  voteType === "upvote"
                ) {
                  upvoteChange = 1;
                  downvoteChange = -1;
                } else if (!currentVote && voteType === "upvote") {
                  upvoteChange = 1;
                } else if (!currentVote && voteType === "downvote") {
                  downvoteChange = 1;
                }

                return {
                  ...post,
                  upvote_count: Math.max(0, post.upvote_count + upvoteChange),
                  downvote_count: Math.max(
                    0,
                    post.downvote_count + downvoteChange
                  ),
                  user_vote: voteType,
                };
              }
              return post;
            })
          );
        } else {
          // Update replies
          setReplies((prev) => {
            const newReplies = { ...prev };
            Object.keys(newReplies).forEach((postId) => {
              newReplies[postId] = newReplies[postId].map((reply) => {
                if (reply.id === targetId) {
                  const currentVote = reply.user_vote;
                  let upvoteChange = 0;

                  if (currentVote === voteType) {
                    return reply;
                  } else if (
                    currentVote === "upvote" &&
                    voteType === "downvote"
                  ) {
                    upvoteChange = -1;
                  } else if (
                    currentVote === "downvote" &&
                    voteType === "upvote"
                  ) {
                    upvoteChange = 1;
                  } else if (!currentVote && voteType === "upvote") {
                    upvoteChange = 1;
                  }

                  return {
                    ...reply,
                    upvote_count: Math.max(
                      0,
                      reply.upvote_count + upvoteChange
                    ),
                    user_vote: voteType,
                  };
                }
                return reply;
              });
            });
            return newReplies;
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to vote";
        console.error("Error voting:", err);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [user, toast]
  );

  const removeVote = useCallback(
    async (targetId: string, targetType: "post" | "reply") => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("community_votes")
          .delete()
          .eq("user_id", user.id)
          .eq(targetType === "post" ? "post_id" : "reply_id", targetId);

        if (error) throw error;

        // Update local state
        if (targetType === "post") {
          setPosts((prev) =>
            prev.map((post) => {
              if (post.id === targetId) {
                const currentVote = post.user_vote;
                let upvoteChange = 0;
                let downvoteChange = 0;

                if (currentVote === "upvote") {
                  upvoteChange = -1;
                } else if (currentVote === "downvote") {
                  downvoteChange = -1;
                }

                return {
                  ...post,
                  upvote_count: Math.max(0, post.upvote_count + upvoteChange),
                  downvote_count: Math.max(
                    0,
                    post.downvote_count + downvoteChange
                  ),
                  user_vote: null,
                };
              }
              return post;
            })
          );
        } else {
          setReplies((prev) => {
            const newReplies = { ...prev };
            Object.keys(newReplies).forEach((postId) => {
              newReplies[postId] = newReplies[postId].map((reply) => {
                if (reply.id === targetId && reply.user_vote === "upvote") {
                  return {
                    ...reply,
                    upvote_count: Math.max(0, reply.upvote_count - 1),
                    user_vote: null,
                  };
                }
                return reply;
              });
            });
            return newReplies;
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove vote";
        console.error("Error removing vote:", err);
      }
    },
    [user]
  );

  const refresh = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  // Subscribe to realtime updates
  useEffect(() => {
    const postsChannel = supabase
      .channel("community_posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const repliesChannel = supabase
      .channel("community_replies_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_replies" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReply = payload.new as CommunityReply;
            fetchReplies(newReply.post_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [fetchPosts, fetchReplies]);

  return {
    posts,
    loadingPosts,
    fetchPosts,
    createPost,
    replies,
    loadingReplies,
    fetchReplies,
    createReply,
    vote,
    removeVote,
    error,
    refresh,
  };
};
