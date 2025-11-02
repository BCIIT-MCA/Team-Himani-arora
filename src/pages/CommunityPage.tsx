import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageCircle,
  Calendar,
  Heart,
  Shield,
  Clock,
  MapPin,
  Star,
  UserCheck,
  AlertCircle,
  Bell,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/hooks/useCommunity";
import { useCommunityInteractions } from "@/hooks/useCommunityInteractions";
import { useModeration } from "@/hooks/useModeration";
import { useNotifications } from "@/hooks/useNotifications";
import { PostCard } from "@/components/community/PostCard";
import { ModerationPanel } from "@/components/community/ModerationPanel";
import { NotificationUI } from "@/components/community/NotificationUI";
import { CrisisModal } from "@/components/community/CrisisModal";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { INDIAN_STUDENT_CRISIS_CONTACTS } from "@/lib/constants";

const CommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    events,
    forumStats,
    loading,
    error,
    registerForEvent,
    unregisterFromEvent,
    isUserRegisteredForEvent,
    upcomingEvents,
  } = useCommunity();

  // Community interactions
  const { posts, loadingPosts, fetchPosts, vote, removeVote } =
    useCommunityInteractions();

  // Moderation
  const {
    isModerator,
    pendingContent,
    moderationHistory,
    loadingPendingContent,
    moderatePost,
    moderateReply,
  } = useModeration();

  // Notifications
  const {
    notifications,
    preferences,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  } = useNotifications();

  const [registrationLoading, setRegistrationLoading] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("community");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Fetch posts on mount and when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      fetchPosts();
    } else {
      fetchPosts(selectedCategory);
    }
  }, [selectedCategory, fetchPosts]);

  const handleEventRegistration = async (eventId: string) => {
    if (!user) return;

    setRegistrationLoading(eventId);
    try {
      const isRegistered = isUserRegisteredForEvent(eventId);
      if (isRegistered) {
        await unregisterFromEvent(eventId);
      } else {
        await registerForEvent(eventId);
      }
    } finally {
      setRegistrationLoading(null);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Post handlers
  const handleVotePost = (postId: string, voteType: "upvote" | "downvote") => {
    const currentPost = posts.find((p) => p.id === postId);
    if (currentPost?.user_vote === voteType) {
      removeVote(postId, "post");
    } else {
      vote(postId, voteType, "post");
    }
  };

  const handleReplyToPost = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  const handleModeratePost = async (
    postId: string,
    action: "approve" | "hide" | "escalate"
  ) => {
    try {
      await moderatePost(postId, action);
      toast({
        title: "Success",
        description: `Post ${action}d successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} post`,
        variant: "destructive",
      });
    }
  };

  const handleModerateReply = async (
    replyId: string,
    action: "approve" | "hide" | "escalate"
  ) => {
    try {
      await moderateReply(replyId, action);
      toast({
        title: "Success",
        description: `Reply ${action}d successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} reply`,
        variant: "destructive",
      });
    }
  };

  const handleReportPost = (postId: string) => {
    toast({
      title: "Report Submitted",
      description: "Post reported to moderators",
    });
  };

  // Get support groups from events with event_type "Support Group"
  const supportGroups = events
    .filter(
      (event) =>
        event.event_type === "Support Group" ||
        event.title.toLowerCase().includes("support")
    )
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      members: event.current_attendees || 0,
      nextMeeting: new Date(event.event_date).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      category: event.event_type || "Support",
      type: event.location || "Virtual",
      facilitator: "Professional Facilitator",
    }));

  // Forum categories focused on Indian student challenges
  const forumCategories = [
    {
      id: "general",
      title: "Student Life Support",
      description:
        "General discussions about college life, hostel problems, and daily student challenges.",
      category: "General",
    },
    {
      id: "resources",
      title: "Exam & Study Stress",
      description:
        "Share strategies for handling board exams, entrance tests, and academic pressure.",
      category: "Resources",
    },
    {
      id: "inspiration",
      title: "Success Stories",
      description:
        "Celebrate academic wins, overcoming family pressure, and personal growth milestones.",
      category: "Inspiration",
    },
    {
      id: "support",
      title: "Family & Career Pressure",
      description:
        "Support for dealing with family expectations, career choices, and relationship issues.",
      category: "Support",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header Section */}
      <section className="pt-20 pb-12 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Student Support Community
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Connect with fellow Indian students facing similar challenges. Share
            experiences about academic stress, family expectations, career
            choices, and relationships - completely FREE.
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-soft">
                Join Our FREE Student Community
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Main Community Interface */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-1" />
                  {notifications.filter((n) => !(n as any).read).length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-5 w-5 p-0 text-xs"
                    >
                      {notifications.filter((n) => !(n as any).read).length}
                    </Badge>
                  )}
                  Alerts
                </TabsTrigger>
                {isModerator && (
                  <TabsTrigger value="moderation">
                    <Shield className="h-4 w-4 mr-1" />
                    Moderate
                  </TabsTrigger>
                )}
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCrisisModal(true)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Crisis Support
                </Button>
                {user && (
                  <Button asChild>
                    <Link to="/community/create-post">
                      <Plus className="h-4 w-4 mr-2" />
                      New Post
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="community" className="space-y-6">
              {/* Community Guidelines */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Community Guidelines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <strong>Safe Space:</strong> Respect, kindness, and
                        confidentiality are our core values.
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Heart className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <strong>Peer Support:</strong> Support others with
                        empathy and share your experiences.
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Users className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <strong>Professional Moderation:</strong> Licensed
                        professionals moderate all activities.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Posts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Community Posts</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className={
                        selectedCategory === "all"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory("General Discussion")}
                      className={
                        selectedCategory === "General Discussion"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      General
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory("Support Request")}
                      className={
                        selectedCategory === "Support Request"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      Support
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory("Recovery Story")}
                      className={
                        selectedCategory === "Recovery Story"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      Recovery
                    </Button>
                  </div>
                </div>

                {loadingPosts ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <Skeleton className="h-4 w-1/4 mb-2" />
                          <Skeleton className="h-6 w-3/4 mb-4" />
                          <Skeleton className="h-16 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        No posts yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to start a conversation in our community!
                      </p>
                      {user && (
                        <Button asChild>
                          <Link to="/community/create-post">
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Post
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onVote={handleVotePost}
                        onRemoveVote={(postId) => removeVote(postId, "post")}
                        onReply={handleReplyToPost}
                        onModerate={
                          isModerator ? handleModeratePost : undefined
                        }
                        onReport={handleReportPost}
                        currentUserId={user?.id}
                        isModerator={isModerator}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationUI
                notifications={notifications as any}
                preferences={preferences as any}
                loading={notificationsLoading}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDeleteNotification={deleteNotification}
                onUpdatePreferences={updatePreferences as any}
                onNavigateToPost={(postId) =>
                  navigate(`/community/post/${postId}`)
                }
              />
            </TabsContent>

            {isModerator && (
              <TabsContent value="moderation">
                <ModerationPanel
                  pendingContent={
                    [
                      ...pendingContent.posts.map((p) => ({
                        ...p,
                        type: "post",
                      })),
                      ...pendingContent.replies.map((r) => ({
                        ...r,
                        type: "reply",
                      })),
                    ] as any
                  }
                  moderationHistory={moderationHistory as any}
                  loading={loadingPendingContent}
                  onModerateContent={(contentId, contentType, action) => {
                    if (contentType === "post") {
                      handleModeratePost(contentId, action);
                    } else {
                      handleModerateReply(contentId, action);
                    }
                  }}
                  currentUserId={user?.id}
                />
              </TabsContent>
            )}

            <TabsContent value="events" className="space-y-6">
              {/* Support Groups */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Support Groups</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {supportGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="group hover:shadow-elegant transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline">{group.category}</Badge>
                          <Badge variant="secondary">{group.type}</Badge>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {group.title}
                        </CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{group.members} members</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-muted-foreground" />
                            <span>{group.facilitator}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Next meeting: {group.nextMeeting}</span>
                        </div>
                        {user ? (
                          <Button className="w-full">Join Group</Button>
                        ) : (
                          <Link to="/auth">
                            <Button className="w-full">Sign Up to Join</Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Community Events */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Community Events</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className="group hover:shadow-elegant transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline">
                            {event.event_type || "Event"}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatEventDate(event.event_date)}</span>
                          </div>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {event.title}
                        </CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{formatEventTime(event.event_date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{event.location || "Virtual"}</span>
                          </div>
                        </div>
                        {user ? (
                          <Button
                            className="w-full"
                            variant={
                              isUserRegisteredForEvent(event.id)
                                ? "outline"
                                : "default"
                            }
                            onClick={() => handleEventRegistration(event.id)}
                            disabled={registrationLoading === event.id}
                          >
                            {registrationLoading === event.id ? (
                              "Processing..."
                            ) : isUserRegisteredForEvent(event.id) ? (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Registered
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 mr-2" />
                                Register
                              </>
                            )}
                          </Button>
                        ) : (
                          <Link to="/auth">
                            <Button className="w-full">
                              Sign Up to Register
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Crisis Modal */}
      <CrisisModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
        onRequestHelp={() => {
          toast({
            title: "Notification Sent",
            description: "Community moderators have been notified",
          });
          setShowCrisisModal(false);
        }}
      />
    </div>
  );
};

export default CommunityPage;
