import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  HeartOff,
  MessageCircle,
  MoreHorizontal,
  Calendar,
  User,
  Shield,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PostWithVotes {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  is_anonymous: boolean;
  is_moderated: boolean;
  created_at: string;
  updated_at: string;
  upvote_count: number;
  downvote_count: number;
  reply_count: number;
  user_vote?: "upvote" | "downvote" | null;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface PostCardProps {
  post: PostWithVotes;
  onVote: (postId: string, voteType: "upvote" | "downvote") => void;
  onRemoveVote: (postId: string) => void;
  onReply: (postId: string) => void;
  onModerate?: (
    postId: string,
    action: "approve" | "hide" | "escalate"
  ) => void;
  onReport?: (postId: string) => void;
  currentUserId?: string;
  isModerator?: boolean;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onVote,
  onRemoveVote,
  onReply,
  onModerate,
  onReport,
  currentUserId,
  isModerator = false,
  className,
}) => {
  const isOwnPost = currentUserId === post.user_id;
  const displayName = post.is_anonymous
    ? "Anonymous"
    : post.profiles?.display_name || "Community Member";

  const handleVote = (voteType: "upvote" | "downvote") => {
    if (post.user_vote === voteType) {
      onRemoveVote(post.id);
    } else {
      onVote(post.id, voteType);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      General: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Resources:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Support:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Inspiration:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Academic:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      Career: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    };
    return colors[category as keyof typeof colors] || colors["General"];
  };

  return (
    <Card className={cn("w-full hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              {!post.is_anonymous && (
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
                />
              )}
              <AvatarFallback>
                {post.is_anonymous ? "?" : displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{displayName}</span>
                {isOwnPost && !post.is_anonymous && (
                  <User className="h-3 w-3 text-muted-foreground" />
                )}
                {isModerator && <Shield className="h-3 w-3 text-blue-500" />}
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(post.category)}>
              {post.category}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isOwnPost && onReport && (
                  <DropdownMenuItem onClick={() => onReport(post.id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Report Post
                  </DropdownMenuItem>
                )}
                {isModerator && onModerate && !post.is_moderated && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onModerate(post.id, "approve")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onModerate(post.id, "hide")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Hide
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onModerate(post.id, "escalate")}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Escalate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-3 whitespace-pre-wrap">
          {post.content}
        </p>
      </CardContent>

      <Separator />

      <CardFooter className="pt-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            {/* Voting */}
            <div className="flex items-center space-x-1">
              <Button
                variant={post.user_vote === "upvote" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleVote("upvote")}
                className="h-8 px-2"
                disabled={!currentUserId}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 mr-1",
                    post.user_vote === "upvote" && "fill-current"
                  )}
                />
                <span className="text-xs">{post.upvote_count}</span>
              </Button>
              <Button
                variant={post.user_vote === "downvote" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleVote("downvote")}
                className="h-8 px-2"
                disabled={!currentUserId}
              >
                <HeartOff
                  className={cn(
                    "h-4 w-4 mr-1",
                    post.user_vote === "downvote" && "fill-current"
                  )}
                />
                <span className="text-xs">{post.downvote_count}</span>
              </Button>
            </div>

            {/* Reply Count */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(post.id)}
              className="h-8 px-2"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.reply_count}</span>
            </Button>
          </div>

          {!post.is_moderated && (
            <Badge variant="secondary" className="text-xs">
              Pending Moderation
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
