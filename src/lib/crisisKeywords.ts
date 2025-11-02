// Crisis detection keywords and phrases for mental health monitoring
export const CRISIS_KEYWORDS = {
  // High severity - immediate crisis indicators
  HIGH_SEVERITY: [
    "kill myself",
    "end my life",
    "want to die",
    "suicide",
    "suicidal",
    "self harm",
    "self-harm",
    "cut myself",
    "hurt myself",
    "overdose",
    "jump off",
    "hang myself",
    "no point living",
    "better off dead",
    "plan to die",
    "ending it all",
    "can't go on",
    "ready to die",
    "worthless",
    "nobody cares",
    "give up completely",
  ],

  // Medium severity - concerning indicators
  MEDIUM_SEVERITY: [
    "depressed",
    "hopeless",
    "helpless",
    "trapped",
    "burden",
    "empty inside",
    "numb",
    "can't cope",
    "falling apart",
    "breaking down",
    "lost control",
    "panic attack",
    "severe anxiety",
    "can't breathe",
    "heart racing",
    "dizzy",
    "chest pain",
    "afraid to leave",
    "isolating",
    "avoid everyone",
  ],

  // Low severity - warning signs
  LOW_SEVERITY: [
    "stressed",
    "overwhelmed",
    "anxious",
    "worried",
    "sad",
    "upset",
    "frustrated",
    "tired",
    "exhausted",
    "struggling",
    "difficult time",
    "hard to focus",
    "sleep problems",
    "appetite changes",
    "mood swings",
    "irritable",
    "lonely",
    "disconnected",
  ],
};

export type CrisisLevel = "low" | "medium" | "high";

export interface CrisisDetectionResult {
  crisisDetected: boolean;
  level?: CrisisLevel;
  triggers: string[];
  confidence: number;
}

/**
 * Detects crisis indicators in text with severity levels
 * @param text - The text to analyze for crisis keywords
 * @returns CrisisDetectionResult with detection status and details
 */
export function detectCrisisKeywords(text: string): CrisisDetectionResult {
  const normalizedText = text.toLowerCase().trim();
  const foundTriggers: string[] = [];
  let highestLevel: CrisisLevel | undefined;

  // Check high severity keywords first
  for (const keyword of CRISIS_KEYWORDS.HIGH_SEVERITY) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      foundTriggers.push(keyword);
      highestLevel = "high";
    }
  }

  // Check medium severity if no high severity found
  if (!highestLevel) {
    for (const keyword of CRISIS_KEYWORDS.MEDIUM_SEVERITY) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        foundTriggers.push(keyword);
        if (!highestLevel) highestLevel = "medium";
      }
    }
  }

  // Check low severity if no higher severity found
  if (!highestLevel) {
    for (const keyword of CRISIS_KEYWORDS.LOW_SEVERITY) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        foundTriggers.push(keyword);
        if (!highestLevel) highestLevel = "low";
      }
    }
  }

  const crisisDetected = foundTriggers.length > 0;
  const confidence = calculateConfidence(foundTriggers, normalizedText);

  return {
    crisisDetected,
    level: highestLevel,
    triggers: foundTriggers,
    confidence,
  };
}

/**
 * Calculates confidence level based on number and type of triggers found
 */
function calculateConfidence(triggers: string[], text: string): number {
  if (triggers.length === 0) return 0;

  let baseConfidence = Math.min(triggers.length * 0.3, 1.0);

  // Boost confidence for multiple high-severity keywords
  const highSeverityCount = triggers.filter((trigger) =>
    CRISIS_KEYWORDS.HIGH_SEVERITY.some(
      (keyword) => keyword.toLowerCase() === trigger.toLowerCase()
    )
  ).length;

  if (highSeverityCount > 0) {
    baseConfidence = Math.min(baseConfidence + highSeverityCount * 0.2, 1.0);
  }

  // Boost confidence for longer text with context
  if (text.length > 100 && triggers.length > 1) {
    baseConfidence = Math.min(baseConfidence + 0.1, 1.0);
  }

  return Math.round(baseConfidence * 100) / 100;
}

/**
 * Gets crisis resources based on severity level
 */
export function getCrisisResources(level: CrisisLevel) {
  const baseResources = {
    hotline: "KIRAN Mental Health Helpline: 1800-599-0019 (FREE 24/7)",
    textLine: "iCALL Crisis Support: 9152987821 (FREE)",
    emergency: "Call KIRAN 1800-599-0019 for immediate danger",
  };

  switch (level) {
    case "high":
      return {
        ...baseResources,
        message:
          "You mentioned some concerning thoughts. Please reach out for immediate support:",
        urgent: true,
      };
    case "medium":
      return {
        ...baseResources,
        message:
          "It sounds like you're going through a difficult time. Help is available:",
        urgent: false,
      };
    case "low":
      return {
        ...baseResources,
        message:
          "If you need additional support, these resources are always available:",
        urgent: false,
      };
    default:
      return baseResources;
  }
}
