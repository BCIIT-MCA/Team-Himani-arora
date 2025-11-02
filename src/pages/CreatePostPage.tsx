import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Send } from "lucide-react";
import { useCommunityInteractions } from "@/hooks/useCommunityInteractions";
import { useToast } from "@/hooks/use-toast";

export const CreatePostPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPost } = useCommunityInteractions();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isAnonymous: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your post.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: "general",
        is_anonymous: formData.isAnonymous,
      });

      toast({
        title: "Post Created",
        description: "Your post has been published to the community.",
      });

      navigate("/community");
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error Creating Post",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/community")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Button>
        </div>

        {/* Create Post Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Create New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Post Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title for your post"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={200}
                />
                <p className="text-sm text-slate-600">
                  {formData.title.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts, experiences, or questions with the community..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={10}
                  maxLength={5000}
                />
                <p className="text-sm text-slate-600">
                  {formData.content.length}/5000 characters
                </p>
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isAnonymous: checked }))
                  }
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Post anonymously
                </Label>
              </div>

              {formData.isAnonymous && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  Your post will be published without showing your name or
                  profile information. Anonymous posts help create a safe space
                  for sharing sensitive topics.
                </p>
              )}

              {/* Guidelines */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Community Guidelines
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be respectful and supportive of others</li>
                  <li>• Share experiences that might help someone else</li>
                  <li>• Use trigger warnings for sensitive content</li>
                  <li>• Report any concerning posts to moderators</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/community")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.title.trim() ||
                    !formData.content.trim()
                  }
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
