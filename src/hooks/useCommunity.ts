import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
type Event = Database["public"]["Tables"]["events"]["Row"];
type EventRegistration =
  Database["public"]["Tables"]["event_registrations"]["Row"];

interface ForumStats {
  totalPosts: number;
  activeMembers: number;
  lastActivity: string | null;
  postsByCategory: Record<string, number>;
}

interface CommunityStats {
  totalMembers: number;
  totalPosts: number;
  totalEvents: number;
  upcomingEvents: number;
}

interface UseCommunityState {
  posts: CommunityPost[];
  events: Event[];
  userRegistrations: EventRegistration[];
  forumStats: ForumStats;
  communityStats: CommunityStats;
  loading: boolean;
  error: string | null;
}

export const useCommunity = () => {
  const [state, setState] = useState<UseCommunityState>({
    posts: [],
    events: [],
    userRegistrations: [],
    forumStats: {
      totalPosts: 0,
      activeMembers: 0,
      lastActivity: null,
      postsByCategory: {},
    },
    communityStats: {
      totalMembers: 0,
      totalPosts: 0,
      totalEvents: 0,
      upcomingEvents: 0,
    },
    loading: true,
    error: null,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCommunityPosts = useCallback(
    async (category?: string, limit: number = 50) => {
      try {
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

        const { data: posts, error } = await query;

        if (error) throw error;

        // Calculate forum stats
        const totalPosts = posts?.length || 0;
        const activeMembers = new Set(posts?.map((p) => p.user_id)).size;
        const lastActivity = posts?.[0]?.created_at || null;

        // Count posts by category
        const postsByCategory: Record<string, number> = {};
        posts?.forEach((post) => {
          postsByCategory[post.category] =
            (postsByCategory[post.category] || 0) + 1;
        });

        // Get total post count from database for accurate stats
        const { count: totalPostCount } = await supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("is_moderated", true);

        const forumStats: ForumStats = {
          totalPosts: totalPostCount || 0,
          activeMembers,
          lastActivity,
          postsByCategory,
        };

        setState((prev) => ({
          ...prev,
          posts: posts || [],
          forumStats,
        }));

        return posts || [];
      } catch (error) {
        console.error("Error fetching community posts:", error);
        toast({
          title: "Error Loading Posts",
          description: "Failed to load community posts. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    [toast, user]
  );

  const fetchEvents = useCallback(
    async (upcomingOnly: boolean = false) => {
      try {
        let query = supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .order("event_date", { ascending: true });

        if (upcomingOnly) {
          query = query.gte("event_date", new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          events: data || [],
        }));

        return data || [];
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error Loading Events",
          description: "Failed to load events. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    [toast]
  );

  const fetchUserRegistrations = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          `
          *,
          events(*)
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        userRegistrations: data || [],
      }));

      return data || [];
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      return [];
    }
  }, [user]);

  const calculateForumStats = useCallback(async () => {
    try {
      // TODO: Implement after community_posts table is created
      // For now, return mock data
      const forumStats: ForumStats = {
        totalPosts: 127,
        activeMembers: 45,
        lastActivity: new Date().toISOString(),
        postsByCategory: {
          General: 34,
          Resources: 28,
          Inspiration: 21,
          Support: 44,
        },
      };

      setState((prev) => ({
        ...prev,
        forumStats,
      }));

      return forumStats;
    } catch (error) {
      console.error("Error calculating forum stats:", error);
      return state.forumStats;
    }
  }, [state.forumStats]);

  const calculateCommunityStats = useCallback(async () => {
    try {
      // Get total members
      const { count: totalMembers, error: membersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (membersError) throw membersError;

      // Get total posts
      const { count: totalPosts, error: postsError } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("is_moderated", true);

      if (postsError) throw postsError;

      // Get total events
      const { count: totalEvents, error: eventsError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (eventsError) throw eventsError;

      // Get upcoming events
      const { count: upcomingEvents, error: upcomingError } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .gte("event_date", new Date().toISOString());

      if (upcomingError) throw upcomingError;

      const communityStats: CommunityStats = {
        totalMembers: totalMembers || 0,
        totalPosts: totalPosts || 0,
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEvents || 0,
      };

      setState((prev) => ({
        ...prev,
        communityStats,
      }));

      return communityStats;
    } catch (error) {
      console.error("Error calculating community stats:", error);
      return state.communityStats;
    }
  }, [state.communityStats]);

  const registerForEvent = useCallback(
    async (eventId: string) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to register for events.",
          variant: "destructive",
        });
        return false;
      }

      try {
        // Check if already registered
        const { data: existing, error: checkError } = await supabase
          .from("event_registrations")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existing) {
          toast({
            title: "Already Registered",
            description: "You are already registered for this event.",
            variant: "default",
          });
          return false;
        }

        // Check event capacity
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("current_attendees, max_attendees")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;

        if (
          event.max_attendees &&
          event.current_attendees >= event.max_attendees
        ) {
          toast({
            title: "Event Full",
            description: "This event has reached maximum capacity.",
            variant: "destructive",
          });
          return false;
        }

        // Register for event
        const { error: insertError } = await supabase
          .from("event_registrations")
          .insert({
            user_id: user.id,
            event_id: eventId,
          });

        if (insertError) throw insertError;

        // Create notification for event reminder
        try {
          const { data: eventData } = await supabase
            .from("events")
            .select("title, event_date")
            .eq("id", eventId)
            .single();

          if (eventData) {
            await supabase.rpc("enqueue_notification", {
              target_user: user.id,
              notification_type: "event_reminder",
              channel_hint: "in_app",
              notification_title: "Event Registration Confirmed",
              notification_message: `You've successfully registered for "${eventData.title}". We'll remind you before the event.`,
              notification_payload: {
                event_id: eventId,
                event_title: eventData.title,
                event_date: eventData.event_date,
              },
            });
          }
        } catch (notificationError) {
          console.warn(
            "Failed to create event registration notification:",
            notificationError
          );
        }

        // Update event attendee count
        const { error: updateError } = await supabase
          .from("events")
          .update({
            current_attendees: (event.current_attendees || 0) + 1,
          })
          .eq("id", eventId);

        if (updateError) throw updateError;

        toast({
          title: "Registration Successful",
          description: "You have been registered for the event.",
          variant: "default",
        });

        // Refresh data
        await Promise.all([fetchEvents(), fetchUserRegistrations()]);

        return true;
      } catch (error) {
        console.error("Error registering for event:", error);
        toast({
          title: "Registration Failed",
          description: "Failed to register for event. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchEvents, fetchUserRegistrations]
  );

  const unregisterFromEvent = useCallback(
    async (eventId: string) => {
      if (!user) return false;

      try {
        const { error: deleteError } = await supabase
          .from("event_registrations")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (deleteError) throw deleteError;

        // Update event attendee count
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("current_attendees")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;

        const { error: updateError } = await supabase
          .from("events")
          .update({
            current_attendees: Math.max(0, (event.current_attendees || 1) - 1),
          })
          .eq("id", eventId);

        if (updateError) throw updateError;

        toast({
          title: "Unregistered Successfully",
          description: "You have been removed from the event.",
          variant: "default",
        });

        // Refresh data
        await Promise.all([fetchEvents(), fetchUserRegistrations()]);

        return true;
      } catch (error) {
        console.error("Error unregistering from event:", error);
        toast({
          title: "Unregistration Failed",
          description: "Failed to unregister from event. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchEvents, fetchUserRegistrations]
  );

  const createPost = useCallback(
    async (postData: {
      title: string;
      content: string;
      category: string;
      is_anonymous?: boolean;
    }) => {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create posts.",
          variant: "destructive",
        });
        return false;
      }

      try {
        const { error } = await supabase.from("community_posts").insert({
          ...postData,
          user_id: user.id,
          is_anonymous: postData.is_anonymous || false,
        });

        if (error) throw error;

        toast({
          title: "Post Created",
          description: "Your post has been created successfully.",
          variant: "default",
        });

        // Refresh posts
        await fetchCommunityPosts();
        return true;
      } catch (error) {
        console.error("Error creating post:", error);
        toast({
          title: "Post Creation Failed",
          description: "Failed to create post. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchCommunityPosts]
  );

  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await Promise.all([
        fetchCommunityPosts(),
        fetchEvents(),
        fetchUserRegistrations(),
        calculateForumStats(),
        calculateCommunityStats(),
      ]);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load community data",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [
    fetchCommunityPosts,
    fetchEvents,
    fetchUserRegistrations,
    calculateForumStats,
    calculateCommunityStats,
  ]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Realtime subscription for community posts
  useEffect(() => {
    const channel = supabase
      .channel("community_posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          // Refresh posts when there are changes
          fetchCommunityPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCommunityPosts]);

  return {
    // State
    posts: state.posts,
    events: state.events,
    userRegistrations: state.userRegistrations,
    forumStats: state.forumStats,
    communityStats: state.communityStats,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchCommunityPosts,
    fetchEvents,
    registerForEvent,
    unregisterFromEvent,
    createPost,
    refreshData,

    // Computed values
    upcomingEvents: state.events.filter(
      (e) => new Date(e.event_date) >= new Date()
    ),
    userEventIds: state.userRegistrations.map((r) => r.event_id),
    isUserRegisteredForEvent: (eventId: string) =>
      state.userRegistrations.some((r) => r.event_id === eventId),
  };
};
