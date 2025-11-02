// Edge function for enhanced AI crisis detection
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  content: string;
  contentType: "post" | "comment" | "message";
  userId?: string;
  postId?: string;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { content, contentType, userId, postId }: AnalysisRequest =
      await req.json();

    if (!content || !contentType) {
      throw new Error("Content and contentType are required");
    }

    // Enhanced crisis detection analysis
    const analysis = await performCrisisAnalysis(content);

    // Log analysis for monitoring and improvement
    await logAnalysis(supabaseClient, {
      content,
      contentType,
      userId,
      postId,
      analysis,
    });

    // If crisis level detected, trigger immediate intervention
    if (analysis.riskLevel === "crisis" || analysis.requiresIntervention) {
      await triggerCrisisIntervention(supabaseClient, {
        userId,
        postId,
        analysis,
        content: contentType === "post" ? content.substring(0, 200) : content,
      });
    }

    // Store analysis result for trends and follow-up
    await storeAnalysisResult(supabaseClient, {
      userId,
      postId,
      contentType,
      analysis,
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Crisis analysis error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        // Provide fallback basic analysis
        analysis: await basicCrisisAnalysis(
          await req.json().then((body) => body.content || "")
        ),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 to ensure client gets fallback analysis
      }
    );
  }
});

async function performCrisisAnalysis(
  content: string
): Promise<CrisisAnalysisResult> {
  const keywordAnalysis = analyzeKeywords(content);
  const emotionalAnalysis = analyzeEmotionalContent(content);
  const contextualAnalysis = analyzeContextualCues(content);

  // Calculate overall risk level
  const riskLevel = calculateRiskLevel(
    keywordAnalysis,
    emotionalAnalysis,
    contextualAnalysis
  );

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(
    keywordAnalysis,
    emotionalAnalysis,
    contextualAnalysis
  );

  // Determine if immediate intervention is required
  const requiresIntervention =
    riskLevel === "crisis" ||
    (riskLevel === "high" && confidenceScore > 0.8) ||
    keywordAnalysis.immediateDangerIndicators.length > 0;

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(
    riskLevel,
    emotionalAnalysis,
    contextualAnalysis
  );

  // Get recommended resources
  const recommendedResources = getRecommendedResources(
    riskLevel,
    emotionalAnalysis
  );

  return {
    riskLevel,
    confidenceScore,
    detectedConcerns: [
      ...keywordAnalysis.detectedConcerns,
      ...emotionalAnalysis.detectedConcerns,
      ...contextualAnalysis.detectedConcerns,
    ],
    suggestedActions,
    emotionalIndicators: emotionalAnalysis.indicators,
    requiresIntervention,
    recommendedResources,
  };
}

function analyzeKeywords(content: string) {
  const text = content.toLowerCase();

  // Immediate danger indicators
  const immediateDangerKeywords = [
    "suicide",
    "kill myself",
    "end it all",
    "not worth living",
    "better off dead",
    "take my own life",
    "want to die",
    "planning to hurt myself",
    "tonight is the night",
    "goodbye forever",
  ];

  // High-risk indicators
  const highRiskKeywords = [
    "hopeless",
    "worthless",
    "burden to everyone",
    "trapped",
    "can't go on",
    "no way out",
    "unbearable pain",
    "empty inside",
    "nobody cares",
    "failed at everything",
    "giving up",
  ];

  // Medium-risk indicators
  const mediumRiskKeywords = [
    "depressed",
    "overwhelmed",
    "exhausted",
    "struggling",
    "anxious",
    "worried sick",
    "stressed out",
    "breaking down",
    "losing control",
    "can't cope",
    "falling apart",
  ];

  const detectedConcerns: string[] = [];
  const immediateDangerIndicators: string[] = [];
  let riskScore = 0;

  // Check immediate danger
  immediateDangerKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      immediateDangerIndicators.push(keyword);
      detectedConcerns.push(`Immediate danger indicator: ${keyword}`);
      riskScore += 10; // High weight for immediate danger
    }
  });

  // Check high-risk keywords
  highRiskKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      detectedConcerns.push(`High-risk indicator: ${keyword}`);
      riskScore += 5;
    }
  });

  // Check medium-risk keywords
  mediumRiskKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      detectedConcerns.push(`Medium-risk indicator: ${keyword}`);
      riskScore += 2;
    }
  });

  return {
    riskScore,
    detectedConcerns,
    immediateDangerIndicators,
    hasImmediateDanger: immediateDangerIndicators.length > 0,
  };
}

function analyzeEmotionalContent(content: string) {
  const text = content.toLowerCase();

  // Emotional intensity indicators
  const distressWords = [
    "pain",
    "hurt",
    "suffering",
    "agony",
    "torment",
    "anguish",
    "devastating",
    "crushing",
    "unbearable",
    "excruciating",
  ];

  const hopelessnessWords = [
    "hopeless",
    "pointless",
    "meaningless",
    "futile",
    "useless",
    "no future",
    "no hope",
    "never get better",
    "permanent",
    "forever",
  ];

  const isolationWords = [
    "alone",
    "lonely",
    "isolated",
    "abandoned",
    "rejected",
    "nobody understands",
    "all by myself",
    "disconnected",
    "outcast",
  ];

  const urgencyWords = [
    "now",
    "today",
    "tonight",
    "immediately",
    "can't wait",
    "right now",
    "this moment",
    "before it's too late",
    "urgent",
  ];

  const calculateEmotionalScore = (words: string[]): number => {
    let score = 0;
    let matchCount = 0;

    words.forEach((word) => {
      if (text.includes(word)) {
        matchCount++;
        // Weight longer, more specific phrases higher
        score += word.split(" ").length;
      }
    });

    return Math.min(score / (words.length * 2), 1); // Normalize to 0-1
  };

  const indicators = {
    distress: calculateEmotionalScore(distressWords),
    hopelessness: calculateEmotionalScore(hopelessnessWords),
    isolation: calculateEmotionalScore(isolationWords),
    urgency: calculateEmotionalScore(urgencyWords),
  };

  const detectedConcerns: string[] = [];

  if (indicators.distress > 0.3)
    detectedConcerns.push("High emotional distress detected");
  if (indicators.hopelessness > 0.3)
    detectedConcerns.push("Hopelessness indicators present");
  if (indicators.isolation > 0.3)
    detectedConcerns.push("Social isolation concerns");
  if (indicators.urgency > 0.3)
    detectedConcerns.push("Urgency in emotional state");

  return {
    indicators,
    detectedConcerns,
    overallEmotionalIntensity:
      (indicators.distress +
        indicators.hopelessness +
        indicators.isolation +
        indicators.urgency) /
      4,
  };
}

function analyzeContextualCues(content: string) {
  const text = content.toLowerCase();
  const detectedConcerns: string[] = [];
  let contextScore = 0;

  // Time-based indicators
  const timeIndicators = [
    "late at night",
    "can't sleep",
    "3am",
    "insomnia",
    "lying awake",
  ];
  timeIndicators.forEach((indicator) => {
    if (text.includes(indicator)) {
      detectedConcerns.push("Distressed state during vulnerable hours");
      contextScore += 2;
    }
  });

  // Social context indicators
  const socialIndicators = [
    "nobody to talk to",
    "all my friends",
    "family doesn't",
    "relationship ended",
  ];
  socialIndicators.forEach((indicator) => {
    if (text.includes(indicator)) {
      detectedConcerns.push("Social support concerns");
      contextScore += 1;
    }
  });

  // Recent life events
  const lifeEventIndicators = [
    "lost my job",
    "breakup",
    "death in family",
    "diagnosed with",
    "financial problems",
  ];
  lifeEventIndicators.forEach((indicator) => {
    if (text.includes(indicator)) {
      detectedConcerns.push("Recent significant life stressor");
      contextScore += 3;
    }
  });

  return {
    contextScore,
    detectedConcerns,
    hasRecentStressors: contextScore > 3,
  };
}

function calculateRiskLevel(
  keywordAnalysis: any,
  emotionalAnalysis: any,
  contextualAnalysis: any
): "low" | "medium" | "high" | "crisis" {
  // Immediate crisis if danger indicators present
  if (keywordAnalysis.hasImmediateDanger) {
    return "crisis";
  }

  // Calculate weighted score
  const totalScore =
    keywordAnalysis.riskScore * 0.4 +
    emotionalAnalysis.overallEmotionalIntensity * 30 * 0.4 +
    contextualAnalysis.contextScore * 0.2;

  if (totalScore >= 25) return "crisis";
  if (totalScore >= 15) return "high";
  if (totalScore >= 8) return "medium";
  return "low";
}

function calculateConfidenceScore(
  keywordAnalysis: any,
  emotionalAnalysis: any,
  contextualAnalysis: any
): number {
  // Higher confidence when multiple indicators align
  const indicatorCount =
    keywordAnalysis.detectedConcerns.length +
    emotionalAnalysis.detectedConcerns.length +
    contextualAnalysis.detectedConcerns.length;

  const baseConfidence = Math.min(indicatorCount / 10, 0.9);

  // Boost confidence for immediate danger indicators
  if (keywordAnalysis.hasImmediateDanger) {
    return Math.min(baseConfidence + 0.3, 1.0);
  }

  return baseConfidence;
}

function generateSuggestedActions(
  riskLevel: string,
  emotionalAnalysis: any,
  contextualAnalysis: any
): string[] {
  const actions: string[] = [];

  switch (riskLevel) {
    case "crisis":
      actions.push(
        "Immediate professional intervention required",
        "Contact KIRAN crisis hotline: 1800-599-0019 (FREE 24/7) or iCALL 9152987821",
        "Reach out to trusted person immediately",
        "Go to nearest emergency room if in immediate danger",
        "Remove any means of self-harm from immediate environment"
      );
      break;

    case "high":
      actions.push(
        "Prioritize professional mental health support",
        "Contact crisis counselor or therapist within 24 hours",
        "Inform trusted friend or family member of current state",
        "Consider safety planning with mental health professional",
        "Join immediate support group or online crisis chat"
      );
      break;

    case "medium":
      actions.push(
        "Schedule appointment with mental health professional",
        "Reach out to supportive community members",
        "Implement daily self-care routine",
        "Consider joining support group",
        "Monitor emotional state closely"
      );
      break;

    case "low":
      actions.push(
        "Continue engaging with supportive community",
        "Maintain healthy coping strategies",
        "Consider preventive mental health resources",
        "Stay connected with social support network"
      );
      break;
  }

  // Add specific actions based on emotional indicators
  if (emotionalAnalysis.indicators.isolation > 0.5) {
    actions.push("Focus on rebuilding social connections");
  }

  if (emotionalAnalysis.indicators.hopelessness > 0.5) {
    actions.push("Work on identifying future goals and meaning");
  }

  if (contextualAnalysis.hasRecentStressors) {
    actions.push("Address recent life stressors with professional support");
  }

  return actions;
}

function getRecommendedResources(
  riskLevel: string,
  emotionalAnalysis: any
): string[] {
  const resources: string[] = [];

  // Universal resources
  resources.push(
    "National Suicide Prevention Lifeline: 988",
    "Crisis Text Line: Text HOME to 741741",
    "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres"
  );

  switch (riskLevel) {
    case "crisis":
    case "high":
      resources.push(
        "SAMHSA National Helpline: 1-800-662-4357",
        "National Alliance on Mental Illness (NAMI): 1-800-950-6264",
        "Local emergency services: 911 (US) or local equivalent"
      );
      break;

    case "medium":
      resources.push(
        "Psychology Today Therapist Directory",
        "BetterHelp Online Therapy",
        "Local community mental health centers"
      );
      break;

    case "low":
      resources.push(
        "Mental Health America resources",
        "Mindfulness and meditation apps",
        "Local support groups and community resources"
      );
      break;
  }

  if (emotionalAnalysis.indicators.isolation > 0.4) {
    resources.push(
      "Local community centers and volunteer opportunities",
      "7 Cups online emotional support",
      "Meetup groups for shared interests"
    );
  }

  return resources;
}

async function basicCrisisAnalysis(
  content: string
): Promise<CrisisAnalysisResult> {
  // Fallback analysis when main analysis fails
  const text = content.toLowerCase();
  const crisisWords = ["suicide", "kill myself", "want to die", "end it all"];
  const hasCrisisWords = crisisWords.some((word) => text.includes(word));

  return {
    riskLevel: hasCrisisWords ? "high" : "medium",
    confidenceScore: 0.5,
    detectedConcerns: hasCrisisWords
      ? ["Crisis keywords detected"]
      : ["General distress detected"],
    suggestedActions: [
      "Contact mental health professional",
      "Reach out to trusted person",
    ],
    emotionalIndicators: {
      distress: 0.5,
      hopelessness: 0.3,
      isolation: 0.3,
      urgency: 0.4,
    },
    requiresIntervention: hasCrisisWords,
    recommendedResources: [
      "National Suicide Prevention Lifeline: 988",
      "Crisis Text Line: Text HOME to 741741",
    ],
  };
}

async function logAnalysis(supabaseClient: any, data: any) {
  try {
    await supabaseClient.from("crisis_analysis_logs").insert({
      content_type: data.contentType,
      user_id: data.userId,
      post_id: data.postId,
      risk_level: data.analysis.riskLevel,
      confidence_score: data.analysis.confidenceScore,
      detected_concerns: data.analysis.detectedConcerns,
      requires_intervention: data.analysis.requiresIntervention,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log analysis:", error);
  }
}

async function triggerCrisisIntervention(supabaseClient: any, data: any) {
  try {
    // Create crisis intervention record
    await supabaseClient.from("crisis_interventions").insert({
      user_id: data.userId,
      post_id: data.postId,
      risk_level: data.analysis.riskLevel,
      confidence_score: data.analysis.confidenceScore,
      content_preview: data.content,
      suggested_actions: data.analysis.suggestedActions,
      recommended_resources: data.analysis.recommendedResources,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    // Notify moderators and crisis response team
    await supabaseClient.from("notifications").insert({
      recipient_id: "crisis-team", // Special identifier for crisis team
      type: "crisis_alert",
      title: "Crisis Intervention Required",
      message: `High-risk content detected from user ${data.userId}`,
      data: {
        userId: data.userId,
        postId: data.postId,
        riskLevel: data.analysis.riskLevel,
        confidenceScore: data.analysis.confidenceScore,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to trigger crisis intervention:", error);
  }
}

async function storeAnalysisResult(supabaseClient: any, data: any) {
  try {
    await supabaseClient.from("content_analysis_results").insert({
      user_id: data.userId,
      post_id: data.postId,
      content_type: data.contentType,
      risk_level: data.analysis.riskLevel,
      confidence_score: data.analysis.confidenceScore,
      emotional_indicators: data.analysis.emotionalIndicators,
      requires_intervention: data.analysis.requiresIntervention,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to store analysis result:", error);
  }
}
