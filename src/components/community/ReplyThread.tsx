import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Heart,
  MessageCircle,
  Send,
  Calendar,
  User,
  Shield,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ReplyWithVotes {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  upvote_count: number;
  user_vote?: "upvote" | "downvote" | null;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface ReplyThreadProps {
  postId: string;
  replies: ReplyWithVotes[];
  loading: boolean;
  onCreateReply: (
    postId: string,
    content: string,
    isAnonymous: boolean
  ) => void;
  onVoteReply: (replyId: string, voteType: "upvote" | "downvote") => void;
  onRemoveReplyVote: (replyId: string) => void;
  onModerateReply?: (
    replyId: string,
    action: "approve" | "hide" | "escalate"
  ) => void;
  onReportReply?: (replyId: string) => void;
  currentUserId?: string;
  isModerator?: boolean;
  className?: string;
}

export const ReplyThread: React.FC<ReplyThreadProps> = ({
  postId,
  replies,
  loading,
  onCreateReply,
  onVoteReply,
  onRemoveReplyVote,
  onModerateReply,
  onReportReply,
  currentUserId,
  isModerator = false,
  className,
}) => {
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUserId) return;

    setIsSubmitting(true);
    try {
      await onCreateReply(postId, replyContent.trim(), isAnonymous);
      setReplyContent("");
      setIsAnonymous(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteReply = (
    replyId: string,
    voteType: "upvote" | "downvote"
  ) => {
    const reply = replies.find((r) => r.id === replyId);
    if (reply?.user_vote === voteType) {
      onRemoveReplyVote(replyId);
    } else {
      onVoteReply(replyId, voteType);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Reply Form */}
      {currentUserId && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="text-sm font-medium">Add a Reply</h4>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your thoughts or advice..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous-reply"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                  disabled={isSubmitting}
                />
                <Label htmlFor="anonymous-reply" className="text-sm">
                  Reply anonymously
                </Label>
              </div>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Posting..." : "Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : replies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No replies yet. Be the first to share your thoughts!
              </p>
            </CardContent>
          </Card>
        ) : (
          replies.map((reply) => {
            const isOwnReply = currentUserId === reply.user_id;
            const displayName = reply.is_anonymous
              ? "Anonymous"
              : reply.profiles?.display_name || "Community Member";

            return (
              <Card key={reply.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-7 w-7">
                        {!reply.is_anonymous && (
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {reply.is_anonymous
                            ? "?"
                            : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {displayName}
                          </span>
                          {isOwnReply && !reply.is_anonymous && (
                            <User className="h-3 w-3 text-muted-foreground" />
                          )}
                          {isModerator && (
                            <Shield className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isOwnReply && onReportReply && (
                          <DropdownMenuItem
                            onClick={() => onReportReply(reply.id)}
                          >
                            <Flag className="mr-2 h-3 w-3" />
                            Report Reply
                          </DropdownMenuItem>
                        )}
                        {isModerator && onModerateReply && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                onModerateReply(reply.id, "approve")
                              }
                            >
                              <Shield className="mr-2 h-3 w-3" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onModerateReply(reply.id, "hide")}
                            >
                              <Shield className="mr-2 h-3 w-3" />
                              Hide
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onModerateReply(reply.id, "escalate")
                              }
                            >
                              <Flag className="mr-2 h-3 w-3" />
                              Escalate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </CardContent>

                <Separator />

                <CardContent className="pt-3">
                  <div className="flex items-center justify-between">
                    <Button
                      variant={
                        reply.user_vote === "upvote" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => handleVoteReply(reply.id, "upvote")}
                      className="h-7 px-2"
                      disabled={!currentUserId}
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3 mr-1",
                          reply.user_vote === "upvote" && "fill-current"
                        )}
                      />
                      <span className="text-xs">{reply.upvote_count}</span>
                    </Button>
                    {!(reply as any).is_moderated && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
