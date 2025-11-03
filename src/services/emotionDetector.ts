import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmotionData, DetectedEmotion, EmotionType } from "../types/emotion.types";

// Get API key from environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

// Initialize Gemini
let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Emotion definitions
export const EMOTIONS: Record<string, EmotionData> = {
  JOY: { name: 'joy', color: 'bg-green-500', icon: '😊', label: 'Joyful' },
  SADNESS: { name: 'sadness', color: 'bg-blue-500', icon: '😢', label: 'Sad' },
  ANXIETY: { name: 'anxiety', color: 'bg-yellow-500', icon: '😰', label: 'Anxious' },
  ANGER: { name: 'anger', color: 'bg-red-500', icon: '😠', label: 'Angry' },
  NEUTRAL: { name: 'neutral', color: 'bg-gray-500', icon: '😐', label: 'Neutral' }
};

// Quick emotion detection
export const detectEmotion = async (text: string): Promise<DetectedEmotion> => {
  // Mock response for demo (no API key needed)
  if (!genAI || !API_KEY) {
    return mockEmotionDetection(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this message's emotion. Reply ONLY with ONE word: joy, sadness, anxiety, anger, or neutral.

Message: "${text}"

Reply with only the emotion word:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emotionText = response.text().toLowerCase().trim();
    
    // Match to our emotions
    for (const [key, value] of Object.entries(EMOTIONS)) {
      if (emotionText.includes(value.name)) {
        return {
          emotion: value.name as EmotionType,
          data: value,
          intensity: calculateIntensity(text)
        };
      }
    }
    
    return {
      emotion: EMOTIONS.NEUTRAL.name as EmotionType,
      data: EMOTIONS.NEUTRAL,
      intensity: 50
    };
    
  } catch (error) {
    console.error("Detection error:", error);
    return mockEmotionDetection(text);
  }
};

// Mock detection for testing without API
const mockEmotionDetection = (text: string): DetectedEmotion => {
  const lowerText = text.toLowerCase();
  
  // Simple keyword matching
  if (lowerText.match(/happy|great|awesome|amazing|excellent|wonderful|love|good/)) {
    return { emotion: 'joy', data: EMOTIONS.JOY, intensity: 80 };
  }
  if (lowerText.match(/sad|depressed|down|unhappy|terrible|awful|cry|upset/)) {
    return { emotion: 'sadness', data: EMOTIONS.SADNESS, intensity: 75 };
  }
  if (lowerText.match(/worried|anxious|nervous|stress|overwhelm|panic|fear|scared/)) {
    return { emotion: 'anxiety', data: EMOTIONS.ANXIETY, intensity: 70 };
  }
  if (lowerText.match(/angry|mad|furious|annoyed|hate|irritated|frustrated/)) {
    return { emotion: 'anger', data: EMOTIONS.ANGER, intensity: 85 };
  }
  
  return { emotion: 'neutral', data: EMOTIONS.NEUTRAL, intensity: 50 };
};

// Calculate emotion intensity (0-100)
const calculateIntensity = (text: string): number => {
  const hasExclamation = (text.match(/!/g) || []).length;
  const hasCapitals = (text.match(/[A-Z]/g) || []).length;
  const length = text.length;
  
  let intensity = 50;
  intensity += hasExclamation * 10;
  intensity += (hasCapitals / length) * 20;
  
  return Math.min(100, Math.max(30, intensity));
};

// Generate supportive response
export const generateResponse = async (message: string, emotion: EmotionType): Promise<string> => {
  if (!genAI || !API_KEY) {
    return getMockResponse(emotion);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You're a supportive mental health chatbot. User feels ${emotion}. 

User: "${message}"

Write 1-2 supportive sentences:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Response error:", error);
    return getMockResponse(emotion);
  }
};

// Mock responses
const getMockResponse = (emotion: EmotionType): string => {
  const responses: Record<EmotionType, string> = {
    joy: "That's wonderful to hear! I'm glad you're feeling positive. 😊 What's bringing you joy today?",
    sadness: "I hear you, and it's okay to feel this way. 💙 Would you like to talk about what's making you feel down?",
    anxiety: "It sounds like you're dealing with a lot right now. Remember, it's okay to take things one step at a time. I'm here to listen. 🤗",
    anger: "I can sense your frustration. It's completely valid to feel this way. Would you like to talk about what's bothering you?",
    neutral: "I'm here to listen and support you. How are you feeling today?"
  };
  
  return responses[emotion] || responses.neutral;
};