import { z } from "zod";

// Base schema for assessment responses (0-3 scale)
const assessmentResponseSchema = z.object({
  value: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 3, {
      message: "Response must be a number between 0 and 3",
    }),
});

// PHQ-9 Depression Assessment Schema
export const phq9Schema = z.object({
  responses: z
    .record(z.string(), z.string())
    .refine(
      (responses) => {
        const keys = Object.keys(responses);
        return (
          keys.length === 9 &&
          keys.every((key) =>
            ["0", "1", "2", "3", "4", "5", "6", "7", "8"].includes(key)
          )
        );
      },
      {
        message: "All 9 PHQ-9 questions must be answered",
      }
    )
    .transform((responses) => {
      const transformed: Record<string, number> = {};
      for (const [key, value] of Object.entries(responses)) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 3) {
          throw new Error(`Invalid response for question ${key}: must be 0-3`);
        }
        transformed[key] = numValue;
      }
      return transformed;
    }),
  additionalNotes: z
    .string()
    .max(1000, "Additional notes must be less than 1000 characters")
    .transform((val) => val.trim())
    .optional(),
});

// GAD-7 Anxiety Assessment Schema
export const gad7Schema = z.object({
  responses: z
    .record(z.string(), z.string())
    .refine(
      (responses) => {
        const keys = Object.keys(responses);
        return (
          keys.length === 7 &&
          keys.every((key) => ["0", "1", "2", "3", "4", "5", "6"].includes(key))
        );
      },
      {
        message: "All 7 GAD-7 questions must be answered",
      }
    )
    .transform((responses) => {
      const transformed: Record<string, number> = {};
      for (const [key, value] of Object.entries(responses)) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 3) {
          throw new Error(`Invalid response for question ${key}: must be 0-3`);
        }
        transformed[key] = numValue;
      }
      return transformed;
    }),
  additionalNotes: z
    .string()
    .max(1000, "Additional notes must be less than 1000 characters")
    .transform((val) => val.trim())
    .optional(),
});

// GHQ-12 General Health Questionnaire Schema
export const ghq12Schema = z.object({
  responses: z
    .record(z.string(), z.string())
    .refine(
      (responses) => {
        const keys = Object.keys(responses);
        return (
          keys.length === 12 &&
          keys.every((key) =>
            [
              "0",
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
            ].includes(key)
          )
        );
      },
      {
        message: "All 12 GHQ-12 questions must be answered",
      }
    )
    .transform((responses) => {
      const transformed: Record<string, number> = {};
      for (const [key, value] of Object.entries(responses)) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 3) {
          throw new Error(`Invalid response for question ${key}: must be 0-3`);
        }
        transformed[key] = numValue;
      }
      return transformed;
    }),
  additionalNotes: z
    .string()
    .max(1000, "Additional notes must be less than 1000 characters")
    .transform((val) => val.trim())
    .optional(),
});

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: "Message cannot be empty after trimming whitespace",
    }),
});

// Validation functions for easy use in components
export const validatePHQ9 = (data: unknown) => {
  try {
    return { success: true, data: phq9Schema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: "unknown", message: "Validation failed" }],
    };
  }
};

export const validateGAD7 = (data: unknown) => {
  try {
    return { success: true, data: gad7Schema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: "unknown", message: "Validation failed" }],
    };
  }
};

export const validateGHQ12 = (data: unknown) => {
  try {
    return { success: true, data: ghq12Schema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: "unknown", message: "Validation failed" }],
    };
  }
};

export const validateChatMessage = (message: string) => {
  try {
    return {
      success: true,
      data: chatMessageSchema.parse({ message }).message,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: "message", message: "Message validation failed" }],
    };
  }
};

// Utility function to sanitize text input (prevent XSS)
export const sanitizeTextInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

// Assessment scoring utilities with validation
export const calculateAssessmentScore = (
  responses: Record<string, number>,
  expectedQuestionCount: number
): { score: number; isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate response count
  const responseCount = Object.keys(responses).length;
  if (responseCount !== expectedQuestionCount) {
    errors.push(
      `Expected ${expectedQuestionCount} questions, got ${responseCount}`
    );
  }

  // Validate response values
  const validatedResponses: number[] = [];
  for (const [key, value] of Object.entries(responses)) {
    if (typeof value !== "number" || isNaN(value) || value < 0 || value > 3) {
      errors.push(`Invalid response for question ${key}: ${value}`);
    } else {
      validatedResponses.push(value);
    }
  }

  if (errors.length > 0) {
    return { score: 0, isValid: false, errors };
  }

  const score = validatedResponses.reduce((sum, val) => sum + val, 0);
  return { score, isValid: true, errors: [] };
};

// Type exports for use in components
export type ValidationResult<T> = {
  success: boolean;
  data: T | null;
  errors: Array<{ field: string; message: string }> | null;
};

export type PHQ9Data = z.infer<typeof phq9Schema>;
export type GAD7Data = z.infer<typeof gad7Schema>;
export type GHQ12Data = z.infer<typeof ghq12Schema>;
