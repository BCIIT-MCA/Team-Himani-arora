import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { validateChatMessage } from "@/lib/validation";
import { CrisisAlert, useCrisisAlert } from "@/components/crisis-alert";
import { INDIAN_STUDENT_CRISIS_CONTACTS } from "@/lib/constants";

interface CrisisAnalysisResult {
  riskLevel: "low" | "medium" | "high" | "crisis";
  confidenceScore: number;
  detectedConcerns: string[];
  suggestedActions: string[];
  emotionalIndicators: {
    distress: number;
    hopelessness: number;
    isolation: number;
    urgency: number;
  };
  requiresIntervention: boolean;
  recommendedResources: string[];
}
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  MessageCircle,
  Send,
  Heart,
  Phone,
  AlertTriangle,
  LogOut,
  Menu,
  Plus,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(
    null
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { activeAlert, showAlert, dismissAlert } = useCrisisAlert();

  // Quick response suggestions for Indian students
  const quickResponses = [
    "I'm stressed about board exams",
    "Family pressure about my career choice",
    "Feeling anxious about entrance exams",
    "Having relationship problems at college",
    "Academic stress is overwhelming me",
    "I feel isolated in my hostel",
    "Worried about job placement",
    "Parents don't understand me",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) {
      console.warn("No user available for loading conversations");
      return;
    }

    setLoadingConversations(true);
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Loading Error",
        description:
          "Failed to load conversation history. Please try refreshing.",
        variant: "destructive",
      });
    } else {
      setConversations(data || []);
    }
    setLoadingConversations(false);
  };

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user?.id,
        title: "New Conversation",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
    } else {
      setCurrentConversation(data.id);
      setMessages([]);
      loadConversations();

      // Add welcome message
      const welcomeMessage = {
        id: "welcome",
        role: "assistant" as const,
        content:
          "Hi! I'm here to listen and support you. Everything we discuss is confidential. How are you feeling today?",
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setCurrentConversation(conversationId);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      // Type assertion to ensure role matches our Message interface
      const typedMessages = (data || []).map((msg) => ({
        ...msg,
        role: msg.role as "user" | "assistant" | "system",
      }));
      setMessages(typedMessages);
    }
    setShowSidebar(false);
  };

  const sendMessage = async (messageContent: string, retryCount = 0) => {
    if (!messageContent.trim() || loading) return;

    // Validate chat message
    const validationResult = validateChatMessage(messageContent);
    if (!validationResult.success) {
      toast({
        title: "Validation Error",
        description:
          validationResult.errors?.[0]?.message ||
          "Please enter a valid message",
        variant: "destructive",
      });
      return;
    }

    // Crisis detection will be handled by the AI function

    // Create conversation if none exists
    let conversationId = currentConversation;
    if (!conversationId) {
      try {
        const { data, error } = await supabase
          .from("chat_conversations")
          .insert({
            user_id: user?.id,
            title: messageContent.slice(0, 50),
          })
          .select()
          .single();

        if (error) throw error;

        conversationId = data.id;
        setCurrentConversation(conversationId);
        loadConversations();
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast({
          title: "Connection Error",
          description:
            "Failed to create conversation. Please check your connection and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    let userMessageSaved = false;

    try {
      // Save user message first
      const { error: userMessageError } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          role: "user",
          content: messageContent,
        });

      if (userMessageError) throw userMessageError;
      userMessageSaved = true;

      // Prepare conversation history for context (include current user message)
      const conversationHistory = [...messages.slice(-5), userMessage].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      // Call AI function with enhanced parameters including user info
      const { data: functionData, error: functionError } =
        await supabase.functions.invoke("ai", {
          body: {
            message: messageContent,
            conversationHistory: conversationHistory,
            userId: user?.id,
            userLanguage: user?.user_metadata?.preferred_language || "en",
          },
        });

      if (functionError) {
        // Handle specific error types
        if (
          functionError.message?.includes("rate limit") ||
          functionError.message?.includes("429")
        ) {
          throw new Error("AI_RATE_LIMIT");
        }
        if (
          functionError.message?.includes("quota") ||
          functionError.message?.includes("503")
        ) {
          throw new Error("AI_QUOTA_EXCEEDED");
        }
        throw new Error(functionError.message || "Failed to get AI response");
      }

      const {
        response: aiResponse,
        crisisDetected,
        crisisLevel,
        triggers,
        advancedCrisisAnalysis,
      } = functionData || {};

      if (aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save assistant message
        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: aiResponse,
        });

        // Handle crisis detection using unified results from AI function
        if (crisisDetected) {
          const crisisLevelForAlert = crisisLevel || "medium";
          const crisisTriggersForAlert = triggers || [];

          // Show crisis alert
          showAlert(crisisLevelForAlert, crisisTriggersForAlert);

          // Insert system crisis message
          const crisisMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "system",
            content: getCrisisMessage(crisisLevelForAlert),
            created_at: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, crisisMessage]);

          await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            role: "system",
            content: crisisMessage.content,
          });
        }

        // Update conversation timestamp and title if it's the first message
        const updateData: any = { updated_at: new Date().toISOString() };
        if (messages.length === 0) {
          updateData.title = messageContent.slice(0, 50);
        }

        await supabase
          .from("chat_conversations")
          .update(updateData)
          .eq("id", conversationId);
      } else {
        throw new Error("No response received from AI service");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Rollback optimistic update on failure
      if (!userMessageSaved) {
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
        setInput(messageContent); // Restore input
      }

      // Handle specific error types with appropriate user messages
      let errorMessage = "Failed to send message. Please try again.";
      let canRetry = true;

      if (error.message === "AI_RATE_LIMIT") {
        errorMessage =
          "AI service is temporarily busy. Please wait a moment and try again.";
        canRetry = true;
      } else if (error.message === "AI_QUOTA_EXCEEDED") {
        errorMessage = "AI service quota exceeded. Please try again later.";
        canRetry = false;
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network connection issue. Please check your internet and try again.";
        canRetry = true;
      }

      toast({
        title: "Message Error",
        description: errorMessage,
        variant: "destructive",
        action:
          canRetry && retryCount < 2 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage(messageContent, retryCount + 1)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          ) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCrisisMessage = (level: string): string => {
    switch (level) {
      case "high":
        return "🆘 I'm concerned about what you've shared. Please reach out for immediate support: Call KIRAN Mental Health Helpline at 1800-599-0019 (free, 24/7) or iCALL at 9152987821. You don't have to go through this alone.";
      case "medium":
        return "💙 It sounds like you're going through a difficult time. Remember that help is available: KIRAN Helpline (1800-599-0019) is free and available 24/7. I encourage you to talk to a counselor or trusted person.";
      case "low":
        return "💚 I hear that you're struggling. If you need additional support beyond our conversation, resources like KIRAN Helpline (1800-599-0019) and student counseling services are always available.";
      default:
        return "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickResponse = (response: string) => {
    sendMessage(response);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">
              Loading your session...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-wellness flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-heading mb-2">
              Please sign in to continue
            </h2>
            <p className="text-muted-foreground mb-4">
              Access your personalized AI support companion
            </p>
            <Link to="/auth">
              <Button className="bg-gradient-hero hover:opacity-90">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-wellness">
        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border/30 transition-transform lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="font-heading font-semibold">Chat History</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="lg:hidden"
            >
              ✕
            </Button>
          </div>

          <div className="p-4">
            <Button
              onClick={createNewConversation}
              className="w-full bg-gradient-hero hover:opacity-90 mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>

            <div className="space-y-2">
              {loadingConversations ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="medium" />
                </div>
              ) : (
                conversations.map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant={
                      currentConversation === conversation.id
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start text-left"
                    onClick={() => loadConversation(conversation.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{conversation.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(conversation.updated_at).toLocaleDateString(
                          "en-IN",
                          { timeZone: "Asia/Kolkata" }
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <Button variant="outline" onClick={signOut} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-card border-b border-border/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center breathing">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="font-heading font-semibold">
                      AI Support Companion
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Here to listen and support you
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Button */}
              <Button
                variant="outline"
                className="border-accent text-accent-foreground hover:bg-accent/10"
              >
                <Phone className="w-4 h-4 mr-2" />
                Emergency: 1800-599-0019
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !currentConversation && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-primary/50 mx-auto mb-4 breathing" />
                <h2 className="font-heading text-xl mb-2">
                  Welcome to Your Safe Space
                </h2>
                <p className="text-muted-foreground mb-6">
                  Start a conversation whenever you need support. Everything is
                  confidential.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {quickResponses.map((response, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto p-4 hover:bg-primary/5"
                      onClick={() => handleQuickResponse(response)}
                    >
                      "{response}"
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === "user" ? "order-2" : "order-1"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gradient-hero text-white"
                        : "bg-card border border-border/30 shadow-wellness"
                    }`}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString(
                        "en-IN",
                        { timeZone: "Asia/Kolkata", hour12: false }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/30 rounded-2xl p-4 shadow-wellness">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="small" />
                    <span className="text-muted-foreground">
                      AI is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Crisis Alert */}
          {activeAlert && (
            <div className="px-4">
              <CrisisAlert
                level={activeAlert.level}
                triggers={activeAlert.triggers}
                onDismiss={dismissAlert}
              />
            </div>
          )}

          {/* Input Area */}
          <div className="bg-card border-t border-border/30 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share what's on your mind..."
                disabled={loading}
                className="flex-1 border-border/50 focus:border-primary"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-hero hover:opacity-90 shadow-soft px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Crisis? Call KIRAN 1800-599-0019 or iCALL 9152987821 immediately
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatInterface;
