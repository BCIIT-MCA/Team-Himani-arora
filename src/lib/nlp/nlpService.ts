import * as tf from "@tensorflow/tfjs";

interface AnalysisResult {
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
}

interface ToxicityResult {
  toxicity: number;
  identity_attack: number;
  insult: number;
  profanity: number;
  threat: number;
  sexually_explicit: number;
  flirtation: number;
}

class NLPService {
  private model: tf.LayersModel | null = null;
  private readonly perspectiveApi: any;

  constructor() {
    // Initialize Perspective API (will be configured with environment variables)
    this.perspectiveApi = null;
  }

  async initialize() {
    try {
      // Load TensorFlow.js model for emotional analysis
      // In production, you would load a pre-trained model
      this.model = await this.createSimpleEmotionModel();
      console.log("NLP Service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize NLP service:", error);
    }
  }

  private async createSimpleEmotionModel(): Promise<tf.LayersModel> {
    // Create a simple model for demonstration
    // In production, you would load a pre-trained model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [100], // Simplified feature vector
          units: 64,
          activation: "relu",
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: "relu",
        }),
        tf.layers.dense({
          units: 4, // distress, hopelessness, isolation, urgency
          activation: "sigmoid",
        }),
      ],
    });

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  async analyzeCrisisRisk(text: string): Promise<AnalysisResult> {
    try {
      // Combine multiple analysis methods
      const keywordAnalysis = this.analyzeKeywords(text);
      const emotionalAnalysis = await this.analyzeEmotionalContent(text);
      const toxicityAnalysis = await this.analyzeToxicity(text);

      // Calculate overall risk level
      const riskLevel = this.calculateRiskLevel(
        keywordAnalysis,
        emotionalAnalysis,
        toxicityAnalysis
      );

      // Generate suggested actions based on analysis
      const suggestedActions = this.generateSuggestedActions(riskLevel, {
        ...keywordAnalysis,
        ...emotionalAnalysis,
      });

      return {
        riskLevel,
        confidenceScore: this.calculateConfidenceScore(
          keywordAnalysis,
          emotionalAnalysis,
          toxicityAnalysis
        ),
        detectedConcerns: keywordAnalysis.detectedConcerns,
        suggestedActions,
        emotionalIndicators: emotionalAnalysis,
      };
    } catch (error) {
      console.error("Error analyzing crisis risk:", error);

      // Fallback to basic keyword analysis
      const fallbackAnalysis = this.analyzeKeywords(text);
      return {
        riskLevel: fallbackAnalysis.riskLevel,
        confidenceScore: 0.5,
        detectedConcerns: fallbackAnalysis.detectedConcerns,
        suggestedActions: ["Contact mental health professional"],
        emotionalIndicators: {
          distress: 0.5,
          hopelessness: 0.3,
          isolation: 0.2,
          urgency: 0.4,
        },
      };
    }
  }

  private analyzeKeywords(text: string) {
    const crisisKeywords = {
      high: [
        "suicide",
        "kill myself",
        "end it all",
        "not worth living",
        "better off dead",
        "take my own life",
        "want to die",
      ],
      medium: [
        "hopeless",
        "worthless",
        "burden",
        "trapped",
        "empty",
        "numb",
        "overwhelmed",
        "desperate",
        "exhausted",
      ],
      low: [
        "sad",
        "depressed",
        "anxious",
        "worried",
        "stressed",
        "struggling",
        "difficult",
        "hard time",
        "upset",
      ],
    };

    const lowerText = text.toLowerCase();
    const detectedConcerns: string[] = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    // Check for high-risk keywords
    crisisKeywords.high.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        highRiskCount++;
        detectedConcerns.push(`High-risk indicator: ${keyword}`);
      }
    });

    // Check for medium-risk keywords
    crisisKeywords.medium.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        mediumRiskCount++;
        detectedConcerns.push(`Medium-risk indicator: ${keyword}`);
      }
    });

    // Check for low-risk keywords
    crisisKeywords.low.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        lowRiskCount++;
        detectedConcerns.push(`Low-risk indicator: ${keyword}`);
      }
    });

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "crisis" = "low";

    if (highRiskCount > 0) {
      riskLevel = "crisis";
    } else if (
      mediumRiskCount >= 2 ||
      (mediumRiskCount >= 1 && lowRiskCount >= 2)
    ) {
      riskLevel = "high";
    } else if (mediumRiskCount >= 1 || lowRiskCount >= 3) {
      riskLevel = "medium";
    }

    return {
      riskLevel,
      detectedConcerns,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    };
  }

  private async analyzeEmotionalContent(text: string) {
    if (!this.model) {
      // Fallback emotional analysis without ML model
      return this.basicEmotionalAnalysis(text);
    }

    try {
      // Convert text to feature vector (simplified)
      const features = this.textToFeatureVector(text);
      const tensor = tf.tensor2d([features]);

      const predictions = this.model.predict(tensor) as tf.Tensor;
      const scores = await predictions.data();

      tensor.dispose();
      predictions.dispose();

      return {
        distress: scores[0],
        hopelessness: scores[1],
        isolation: scores[2],
        urgency: scores[3],
      };
    } catch (error) {
      console.error("Error in ML emotional analysis:", error);
      return this.basicEmotionalAnalysis(text);
    }
  }

  private basicEmotionalAnalysis(text: string) {
    const lowerText = text.toLowerCase();

    const distressWords = ["pain", "hurt", "suffering", "agony", "torment"];
    const hopelessnessWords = [
      "hopeless",
      "pointless",
      "useless",
      "meaningless",
    ];
    const isolationWords = [
      "alone",
      "lonely",
      "isolated",
      "abandoned",
      "rejected",
    ];
    const urgencyWords = [
      "now",
      "today",
      "tonight",
      "immediately",
      "can't wait",
    ];

    const calculateScore = (words: string[]) => {
      const matches = words.filter((word) => lowerText.includes(word)).length;
      return Math.min(matches / words.length, 1);
    };

    return {
      distress: calculateScore(distressWords),
      hopelessness: calculateScore(hopelessnessWords),
      isolation: calculateScore(isolationWords),
      urgency: calculateScore(urgencyWords),
    };
  }

  private async analyzeToxicity(text: string): Promise<ToxicityResult> {
    // Placeholder for Perspective API integration
    // In production, you would call the actual Perspective API
    return {
      toxicity: 0.1,
      identity_attack: 0.05,
      insult: 0.05,
      profanity: 0.02,
      threat: 0.03,
      sexually_explicit: 0.01,
      flirtation: 0.01,
    };
  }

  private textToFeatureVector(text: string): number[] {
    // Simplified feature extraction
    // In production, you would use proper NLP preprocessing
    const features = new Array(100).fill(0);

    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word, index) => {
      if (index < 100) {
        features[index] = word.length / 10; // Normalized word length
      }
    });

    return features;
  }

  private calculateRiskLevel(
    keywordAnalysis: any,
    emotionalAnalysis: any,
    toxicityAnalysis: ToxicityResult
  ): "low" | "medium" | "high" | "crisis" {
    // Weighted scoring system
    let totalScore = 0;

    // Keyword analysis weight (40%)
    const keywordScore =
      keywordAnalysis.riskLevel === "crisis"
        ? 1
        : keywordAnalysis.riskLevel === "high"
        ? 0.8
        : keywordAnalysis.riskLevel === "medium"
        ? 0.5
        : 0.2;
    totalScore += keywordScore * 0.4;

    // Emotional indicators weight (40%)
    const emotionalScore =
      (emotionalAnalysis.distress +
        emotionalAnalysis.hopelessness +
        emotionalAnalysis.urgency) /
      3;
    totalScore += emotionalScore * 0.4;

    // Toxicity weight (20%)
    totalScore += toxicityAnalysis.toxicity * 0.2;

    // Determine final risk level
    if (totalScore >= 0.8 || keywordAnalysis.riskLevel === "crisis") {
      return "crisis";
    } else if (totalScore >= 0.6) {
      return "high";
    } else if (totalScore >= 0.4) {
      return "medium";
    } else {
      return "low";
    }
  }

  private calculateConfidenceScore(
    keywordAnalysis: any,
    emotionalAnalysis: any,
    toxicityAnalysis: ToxicityResult
  ): number {
    // Calculate confidence based on consistency of indicators
    const scores = [
      keywordAnalysis.riskLevel === "crisis"
        ? 1
        : keywordAnalysis.riskLevel === "high"
        ? 0.8
        : keywordAnalysis.riskLevel === "medium"
        ? 0.5
        : 0.2,

      (emotionalAnalysis.distress +
        emotionalAnalysis.hopelessness +
        emotionalAnalysis.urgency) /
        3,

      toxicityAnalysis.toxicity,
    ];

    // Calculate variance to determine confidence
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance =
      scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    // Lower variance = higher confidence
    return Math.max(0.1, 1 - variance);
  }

  private generateSuggestedActions(
    riskLevel: "low" | "medium" | "high" | "crisis",
    analysis: any
  ): string[] {
    const actions: string[] = [];

    switch (riskLevel) {
      case "crisis":
        actions.push(
          "Immediate intervention required - contact crisis hotline",
          "Connect with emergency mental health services",
          "Reach out to trusted friends or family members",
          "Consider contacting emergency services if in immediate danger"
        );
        break;

      case "high":
        actions.push(
          "Prioritize professional mental health support",
          "Contact a crisis counselor or therapist",
          "Reach out to supportive community members",
          "Consider joining a support group"
        );
        break;

      case "medium":
        actions.push(
          "Consider speaking with a mental health professional",
          "Connect with supportive community members",
          "Explore self-care and coping strategies",
          "Monitor emotional well-being closely"
        );
        break;

      case "low":
        actions.push(
          "Continue engaging with supportive community",
          "Practice self-care and mindfulness",
          "Consider preventive mental health resources"
        );
        break;
    }

    // Add specific actions based on emotional indicators
    if (analysis.isolation > 0.6) {
      actions.push("Focus on building social connections");
    }

    if (analysis.hopelessness > 0.6) {
      actions.push("Explore goal-setting and future planning activities");
    }

    return actions;
  }

  // Public method to check if service is ready
  isReady(): boolean {
    return this.model !== null;
  }

  // Method to analyze batch content (for moderation)
  async analyzeBatchContent(texts: string[]): Promise<AnalysisResult[]> {
    const results = await Promise.all(
      texts.map((text) => this.analyzeCrisisRisk(text))
    );
    return results;
  }
}

// Export singleton instance
export const nlpService = new NLPService();

// Export types
export type { AnalysisResult, ToxicityResult };
