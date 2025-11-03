import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Message, DetectedEmotion, EmotionType, MoodTrend, EmotionData } from '../../types/emotion.types';
import EmotionBadge from './EmotionBadge';



// Emotion types with styling
const EMOTIONS: Record<string, EmotionData> = {
  JOY: { name: 'joy', color: 'bg-green-500', icon: '😊', label: 'Joyful' },
  SADNESS: { name: 'sadness', color: 'bg-blue-500', icon: '😢', label: 'Sad' },
  ANXIETY: { name: 'anxiety', color: 'bg-yellow-500', icon: '😰', label: 'Anxious' },
  ANGER: { name: 'anger', color: 'bg-red-500', icon: '😠', label: 'Angry' },
  NEUTRAL: { name: 'neutral', color: 'bg-gray-500', icon: '😐', label: 'Neutral' }
};

// Mock emotion detection
const detectEmotion = (text: string): DetectedEmotion => {
  const lowerText = text.toLowerCase();
  
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

// Mock supportive responses
const generateResponse = (emotion: EmotionType): string => {
  const responses: Record<EmotionType, string> = {
    joy: "That's wonderful to hear! I'm glad you're feeling positive. 😊 What's bringing you joy today?",
    sadness: "I hear you, and it's okay to feel this way. 💙 Would you like to talk about what's making you feel down?",
    anxiety: "It sounds like you're dealing with a lot right now. Remember, it's okay to take things one step at a time. I'm here to listen. 🤗",
    anger: "I can sense your frustration. It's completely valid to feel this way. Would you like to talk about what's bothering you?",
    neutral: "I'm here to listen and support you. How are you feeling today?"
  };
  
  return responses[emotion] || responses.neutral;
};



// Main Chat Component
const EmotionChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to listen and support you. How are you feeling today?",
      sender: 'bot',
      emotion: null,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Get last 5 user emotions for trend
  const getEmotionHistory = (): DetectedEmotion[] => {
    return messages
      .filter(m => m.sender === 'user' && m.emotion)
      .slice(-5)
      .map(m => m.emotion) as DetectedEmotion[];
  };

  // Calculate mood trend
  const getMoodTrend = (): MoodTrend => {
    const history = getEmotionHistory();
    if (history.length < 2) return 'neutral';
    
    const emotionScores: Record<EmotionType, number> = {
      joy: 100,
      neutral: 50,
      anxiety: 30,
      sadness: 20,
      anger: 10
    };
    
    const recentScores = history.slice(-3).map(e => emotionScores[e.emotion] || 50);
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const firstAvg = emotionScores[history[0].emotion] || 50;
    
    if (avg > firstAvg + 10) return 'improving';
    if (avg < firstAvg - 10) return 'worsening';
    return 'stable';
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      emotion: detectEmotion(input),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: generateResponse(userMessage.emotion!.emotion),
        sender: 'bot',
        emotion: null,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);

  };

  const emotionHistory = getEmotionHistory();
  const moodTrend = getMoodTrend();
  const currentEmotion = emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1] : null;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Emotion-Aware Support Chat</h1>
              <p className="text-sm text-gray-500">Real-time mood tracking & empathetic responses</p>
            </div>
          </div>
          
          {/* Current Emotion Display */}
          {currentEmotion && (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Current Mood:</span>
              <EmotionBadge emotion={currentEmotion} intensity={currentEmotion.intensity} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl w-full mx-auto gap-4 p-4 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.sender === 'user' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-2 shadow-sm`}>
                  <p className="text-sm">{message.text}</p>
                  {message.emotion && (
                    <div className="mt-2 pt-2 border-t border-purple-400">
                      <EmotionBadge emotion={message.emotion} intensity={message.emotion.intensity} />
                    </div>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Share how you're feeling..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSend}
                className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Emotion History Sidebar */}
        <div className="w-80 space-y-4">
          {/* Mood Trend */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Mood Trend
            </h3>
            
            <div className="flex items-center justify-center py-4">
              {moodTrend === 'improving' && (
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Improving</p>
                </div>
              )}
              {moodTrend === 'worsening' && (
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-red-600">Needs Attention</p>
                </div>
              )}
              {(moodTrend === 'stable' || moodTrend === 'neutral') && (
                <div className="text-center">
                  <Minus className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-600">Stable</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Emotions */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Recent Emotions</h3>
            
            {emotionHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Start chatting to track emotions</p>
            ) : (
              <div className="space-y-2">
                {emotionHistory.slice().reverse().map((emotion, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <EmotionBadge emotion={emotion} />
                    <span className="text-xs text-gray-400">
                      {emotionHistory.length - idx} msg ago
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2 text-sm">💡 Feature Highlights</h4>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>✓ Real-time emotion detection</li>
              <li>✓ Contextual mood tracking</li>
              <li>✓ Empathetic AI responses</li>
              <li>✓ Trend analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionChat;