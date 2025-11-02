/**
 * Shared types for Supabase Edge Functions
 * This file provides type definitions for Deno runtime environment
 */

// Common response types for edge functions
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Crisis detection types
export interface CrisisKeyword {
  keyword: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
}

export interface CrisisAlert {
  user_id: string;
  severity: "low" | "medium" | "high" | "critical";
  content: string;
  trigger_source:
    | "post_content"
    | "user_report"
    | "keyword_detection"
    | "moderator_escalation";
  metadata?: Record<string, any>;
}

// Analytics types
export interface DateRange {
  start: string;
  end: string;
}

export interface AnalyticsRequest {
  type: string;
  dateRange?: DateRange;
}

// AI Chat types
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CrisisDetectionResult {
  crisisDetected: boolean;
  level?: string;
  triggers: string[];
}
