import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  MessageCircle,
  Heart,
  Flag,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PostCard } from "../components/community/PostCard";
import { ReplyThread } from "../components/community/ReplyThread";
import { useCommunityInteractions } from "../hooks/useCommunityInteractions";
import { useModeration } from "../hooks/useModeration";
import { useToast } from "@/hooks/use-toast";

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  const { posts, replies, loadingPosts, createReply, vote, removeVote } =
    useCommunityInteractions();

  const { isModerator, moderatePost, moderateReply } = useModeration();

  useEffect(() => {
    if (postId && posts.length > 0) {
      const foundPost = posts.find((p) => p.id === postId);
      setPost(foundPost || null);
      setLoading(false);
    }
  }, [postId, posts]);

  const postReplies = postId ? replies[postId] || [] : [];

  const handleCreateReply = async (
    postId: string,
    content: string,
    isAnonymous: boolean
  ) => {
    try {
      await createReply(postId, content, isAnonymous);
      toast({
        title: "Success",
        description: "Reply posted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    }
  };

  const handleVotePost = (postId: string, voteType: "upvote" | "downvote") => {
    const currentPost = posts.find((p) => p.id === postId);
    if (currentPost?.user_vote === voteType) {
      removeVote(postId, "post");
    } else {
      vote(postId, voteType, "post");
    }
  };

  const handleVoteReply = (
    replyId: string,
    voteType: "upvote" | "downvote"
  ) => {
    const currentReply = postReplies.find((r) => r.id === replyId);
    if (currentReply?.user_vote === voteType) {
      removeVote(replyId, "reply");
    } else {
      vote(replyId, voteType, "reply");
    }
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
    // Implementation would depend on your reporting system
    toast({
      title: "Report Submitted",
      description: "Post reported to moderators",
    });
  };

  const handleReportReply = (replyId: string) => {
    // Implementation would depend on your reporting system
    toast({
      title: "Report Submitted",
      description: "Reply reported to moderators",
    });
  };

  if (loading || loadingPosts) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Post Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/community")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/community")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Post Discussion</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Post */}
        <PostCard
          post={post}
          onVote={handleVotePost}
          onRemoveVote={(postId) => removeVote(postId, "post")}
          onReply={() => {}} // Not needed on detail page since we have the reply form below
          onModerate={isModerator ? handleModeratePost : undefined}
          onReport={handleReportPost}
          isModerator={isModerator}
        />

        {/* Replies Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Replies ({postReplies.length})
                </h2>
              </div>
              {postReplies.length > 0 && (
                <Badge variant="secondary">
                  {postReplies.filter((r) => !r.user_vote).length} new
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ReplyThread
              postId={postId!}
              replies={postReplies}
              loading={loadingPosts}
              onCreateReply={handleCreateReply}
              onVoteReply={handleVoteReply}
              onRemoveReplyVote={(replyId) => removeVote(replyId, "reply")}
              onModerateReply={isModerator ? handleModerateReply : undefined}
              onReportReply={handleReportReply}
              isModerator={isModerator}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
