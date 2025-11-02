import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Flag,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PendingContent {
  id: string;
  type: "post" | "reply";
  content: string;
  user_id: string;
  created_at: string;
  category?: string;
  is_anonymous: boolean;
  reported_count?: number;
  profiles?: {
    display_name: string | null;
  } | null;
}

interface ModerationAction {
  id: string;
  moderator_id: string;
  content_type: "post" | "reply";
  content_id: string;
  action: "approve" | "hide" | "escalate";
  reason?: string;
  created_at: string;
  moderator_profiles?: {
    display_name: string | null;
  } | null;
}

interface ModerationPanelProps {
  pendingContent: PendingContent[];
  moderationHistory: ModerationAction[];
  loading: boolean;
  onModerateContent: (
    contentId: string,
    contentType: "post" | "reply",
    action: "approve" | "hide" | "escalate",
    reason?: string
  ) => void;
  currentUserId?: string;
  className?: string;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({
  pendingContent,
  moderationHistory,
  loading,
  onModerateContent,
  currentUserId,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "posts" | "replies" | "reported"
  >("all");
  const [actionFilter, setActionFilter] = useState<
    "all" | "approve" | "hide" | "escalate"
  >("all");

  const filteredPendingContent = pendingContent.filter((content) => {
    const matchesSearch = content.content
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterBy === "all" ||
      filterBy === content.type + "s" ||
      (filterBy === "reported" && (content.reported_count || 0) > 0);

    return matchesSearch && matchesFilter;
  });

  const filteredHistory = moderationHistory.filter((action) => {
    const matchesAction =
      actionFilter === "all" || actionFilter === action.action;
    return matchesAction;
  });

  const handleModerateContent = (
    content: PendingContent,
    action: "approve" | "hide" | "escalate"
  ) => {
    onModerateContent(content.id, content.type, action);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "hide":
        return <EyeOff className="h-4 w-4 text-red-500" />;
      case "escalate":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "approve":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "hide":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "escalate":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Moderation Panel</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{pendingContent.length} pending</Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Content</TabsTrigger>
          <TabsTrigger value="history">Moderation History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={filterBy}
                  onValueChange={(value: any) => setFilterBy(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="posts">Posts Only</SelectItem>
                    <SelectItem value="replies">Replies Only</SelectItem>
                    <SelectItem value="reported">Reported Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pending Content */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredPendingContent.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {pendingContent.length === 0
                      ? "No content pending moderation"
                      : "No content matches your filters"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPendingContent.map((content) => {
                const displayName = content.is_anonymous
                  ? "Anonymous User"
                  : content.profiles?.display_name || "Community Member";

                return (
                  <Card key={content.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            {!content.is_anonymous && (
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {content.is_anonymous
                                ? "?"
                                : displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {displayName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {content.type === "post" ? (
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                ) : (
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                )}
                                {content.type}
                              </Badge>
                              {content.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {content.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(content.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                              {(content.reported_count || 0) > 0 && (
                                <>
                                  <Flag className="h-3 w-3 text-red-500" />
                                  <span className="text-red-600">
                                    {content.reported_count} reports
                                  </span>
                                </>
                              )}
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
                            <DropdownMenuItem
                              onClick={() =>
                                handleModerateContent(content, "approve")
                              }
                            >
                              <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleModerateContent(content, "hide")
                              }
                            >
                              <EyeOff className="mr-2 h-3 w-3 text-red-500" />
                              Hide
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleModerateContent(content, "escalate")
                              }
                            >
                              <AlertTriangle className="mr-2 h-3 w-3 text-yellow-500" />
                              Escalate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md">
                        {content.content}
                      </p>

                      <Separator />

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleModerateContent(content, "approve")
                          }
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleModerateContent(content, "hide")}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleModerateContent(content, "escalate")
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Escalate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* History Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Action Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={actionFilter}
                onValueChange={(value: any) => setActionFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="approve">Approved</SelectItem>
                  <SelectItem value="hide">Hidden</SelectItem>
                  <SelectItem value="escalate">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Moderation History */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {moderationHistory.length === 0
                      ? "No moderation history yet"
                      : "No actions match your filter"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredHistory.map((action) => {
                const moderatorName =
                  action.moderator_profiles?.display_name ||
                  "Unknown Moderator";

                return (
                  <Card key={action.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getActionIcon(action.action)}
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {moderatorName}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  getActionColor(action.action)
                                )}
                              >
                                {action.action}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {action.content_type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(action.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                            {action.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reason: {action.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
