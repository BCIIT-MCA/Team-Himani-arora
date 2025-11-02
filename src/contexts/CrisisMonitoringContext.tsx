import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nlpService, type AnalysisResult } from "@/lib/nlp/nlpService";
import { useAuth } from "@/hooks/useAuth";

interface CrisisMonitoringContextType {
  isMonitoring: boolean;
  isProcessing: boolean;
  lastAnalysis: AnalysisResult | null;
  analyzeContent: (
    content: string,
    type: "post" | "comment" | "message"
  ) => Promise<AnalysisResult>;
  enableMonitoring: () => void;
  disableMonitoring: () => void;
  getInterventionRecommendations: (analysis: AnalysisResult) => string[];
}

const CrisisMonitoringContext = createContext<
  CrisisMonitoringContextType | undefined
>(undefined);

export function CrisisMonitoringProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Initialize NLP service
    const initializeService = async () => {
      try {
        await nlpService.initialize();
        console.log("Crisis monitoring initialized");
      } catch (error) {
        console.error("Failed to initialize crisis monitoring:", error);
      }
    };

    initializeService();
  }, []);

  const analyzeContent = async (
    content: string,
    type: "post" | "comment" | "message"
  ): Promise<AnalysisResult> => {
    if (!isMonitoring) {
      // Return basic analysis when monitoring is disabled
      return {
        riskLevel: "low",
        confidenceScore: 0.1,
        detectedConcerns: [],
        suggestedActions: [],
        emotionalIndicators: {
          distress: 0,
          hopelessness: 0,
          isolation: 0,
          urgency: 0,
        },
      };
    }

    setIsProcessing(true);

    try {
      // Use client-side NLP service
      const analysis = await nlpService.analyzeCrisisRisk(content);
      setLastAnalysis(analysis);

      // Also send to Edge Function for comprehensive analysis and logging
      try {
        const { data, error } = await supabase.functions.invoke(
          "crisis-analysis",
          {
            body: {
              content,
              contentType: type,
              userId: user?.id,
              postId: null, // Will be set by the calling component if applicable
            },
          }
        );

        if (error) {
          console.error("Edge function analysis failed:", error);
        } else if (data?.analysis) {
          // Use server-side analysis if available and more confident
          if (data.analysis.confidenceScore > analysis.confidenceScore) {
            setLastAnalysis(data.analysis);
            return data.analysis;
          }
        }
      } catch (edgeError) {
        console.error("Edge function not available:", edgeError);
      }

      // Handle crisis-level content
      if (analysis.riskLevel === "crisis" || analysis.riskLevel === "high") {
        await handleCrisisDetection(analysis, content, type);
      }

      return analysis;
    } catch (error) {
      console.error("Crisis analysis failed:", error);

      // Fallback to basic keyword analysis
      return {
        riskLevel: "medium",
        confidenceScore: 0.3,
        detectedConcerns: ["Unable to perform full analysis"],
        suggestedActions: ["Consider reaching out for support"],
        emotionalIndicators: {
          distress: 0.5,
          hopelessness: 0.3,
          isolation: 0.3,
          urgency: 0.4,
        },
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrisisDetection = async (
    analysis: AnalysisResult,
    content: string,
    type: string
  ) => {
    try {
      // Log crisis detection
      await supabase.from("crisis_alerts").insert({
        user_id: user?.id || "",
        content: content.substring(0, 200),
        severity: analysis.riskLevel,
        trigger_source: type,
        metadata: {
          confidence_score: analysis.confidenceScore,
          detected_concerns: analysis.detectedConcerns,
          analysis_type: type,
        },
      });

      // Notify user with supportive message
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Support Available", {
          body: "We noticed you might be going through a difficult time. Support resources are available.",
          icon: "/icons/icon-192x192.png",
          tag: "crisis-support",
        });
      }

      // Store intervention recommendations
      const recommendations = getInterventionRecommendations(analysis);

      // Could trigger additional interventions here:
      // - Show crisis support modal
      // - Connect to counselor chat
      // - Display emergency contacts
    } catch (error) {
      console.error("Failed to handle crisis detection:", error);
    }
  };

  const getInterventionRecommendations = (
    analysis: AnalysisResult
  ): string[] => {
    const recommendations: string[] = [];

    switch (analysis.riskLevel) {
      case "crisis":
        recommendations.push(
          "Immediate crisis support needed",
          "Contact emergency services if in immediate danger",
          "Call crisis hotline: 988 (US) or local equivalent",
          "Reach out to trusted person immediately",
          "Consider emergency room if unsafe"
        );
        break;

      case "high":
        recommendations.push(
          "Professional support strongly recommended",
          "Contact mental health professional within 24 hours",
          "Inform trusted friend or family member",
          "Consider crisis counseling chat or hotline",
          "Remove potential means of self-harm"
        );
        break;

      case "medium":
        recommendations.push(
          "Consider professional support",
          "Reach out to supportive friends or family",
          "Use healthy coping strategies",
          "Monitor mood and thoughts closely",
          "Consider support group participation"
        );
        break;

      case "low":
        recommendations.push(
          "Continue self-care practices",
          "Stay connected with support network",
          "Use available mental health resources",
          "Practice mindfulness and relaxation"
        );
        break;
    }

    // Add specific recommendations based on emotional indicators
    if (analysis.emotionalIndicators.isolation > 0.6) {
      recommendations.push("Focus on building social connections");
    }

    if (analysis.emotionalIndicators.hopelessness > 0.6) {
      recommendations.push("Work with therapist on hope and future planning");
    }

    if (analysis.emotionalIndicators.urgency > 0.7) {
      recommendations.push("Seek immediate support - do not wait");
    }

    return recommendations;
  };

  const enableMonitoring = () => {
    setIsMonitoring(true);
  };

  const disableMonitoring = () => {
    setIsMonitoring(false);
  };

  const value: CrisisMonitoringContextType = {
    isMonitoring,
    isProcessing,
    lastAnalysis,
    analyzeContent,
    enableMonitoring,
    disableMonitoring,
    getInterventionRecommendations,
  };

  return (
    <CrisisMonitoringContext.Provider value={value}>
      {children}
    </CrisisMonitoringContext.Provider>
  );
}

export function useCrisisMonitoring(): CrisisMonitoringContextType {
  const context = useContext(CrisisMonitoringContext);
  if (context === undefined) {
    throw new Error(
      "useCrisisMonitoring must be used within a CrisisMonitoringProvider"
    );
  }
  return context;
}

// Hook for easy content analysis in components
export function useContentAnalysis() {
  const { analyzeContent, isProcessing } = useCrisisMonitoring();

  const analyzePost = async (content: string) => {
    return await analyzeContent(content, "post");
  };

  const analyzeComment = async (content: string) => {
    return await analyzeContent(content, "comment");
  };

  const analyzeMessage = async (content: string) => {
    return await analyzeContent(content, "message");
  };

  return {
    analyzePost,
    analyzeComment,
    analyzeMessage,
    isProcessing,
  };
}

// Utility function to get risk level color
export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel) {
    case "crisis":
      return "text-red-600 bg-red-50 border-red-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
    default:
      return "text-green-600 bg-green-50 border-green-200";
  }
};

// Utility function to get risk level description
export const getRiskLevelDescription = (riskLevel: string): string => {
  switch (riskLevel) {
    case "crisis":
      return "Immediate intervention required";
    case "high":
      return "Professional support strongly recommended";
    case "medium":
      return "Monitor closely, consider professional support";
    case "low":
    default:
      return "Low concern, continue self-care";
  }
};
