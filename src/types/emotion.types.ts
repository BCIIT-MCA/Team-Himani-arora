// Emotion type definitions

export type EmotionType = 'joy' | 'sadness' | 'anxiety' | 'anger' | 'neutral';

export interface EmotionData {
  name: EmotionType;
  color: string;
  icon: string;
  label: string;
}

export interface DetectedEmotion {
  emotion: EmotionType;
  data: EmotionData;
  intensity: number;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  emotion: DetectedEmotion | null;
  timestamp: Date;
}

export type MoodTrend = 'improving' | 'worsening' | 'stable' | 'neutral';

export interface EmotionResponse {
  text: string;
  emotion: EmotionType;
}