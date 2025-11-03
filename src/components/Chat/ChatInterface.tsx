import React, { useState, useEffect } from 'react';
import { analyzeEmotion, EmotionAnalysis } from '@/services/emotionDetection';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  emotion?: EmotionAnalysis;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsAnalyzing(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    try {
      const emotion = await analyzeEmotion(inputMessage);
      newMessage.emotion = emotion;
      
      // Add bot response based on emotional analysis
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateResponse(emotion),
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage, botMessage]);
    } catch (error) {
      console.error('Error analyzing message:', error);
    } finally {
      setIsAnalyzing(false);
      setInputMessage('');
    }
  };

  const generateResponse = (emotion: EmotionAnalysis) => {
    // Generate appropriate response based on emotional analysis
    if (emotion.emotionalState.anxiety > 0.7) {
      return "I notice you're feeling anxious. Would you like to talk about what's causing this anxiety?";
    }
    return "I'm here to listen and support you. How can I help?";
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <Card key={message.id} className={`p-4 ${message.sender === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-secondary/10'} max-w-[80%]`}>
            <p>{message.text}</p>
            {message.emotion && message.sender === 'user' && (
              <div className="mt-2 text-sm">
                <Badge variant="outline" className="mr-2">
                  {message.emotion.primaryEmotion}
                </Badge>
                {message.emotion.emotionalState.anxiety > 0.7 && (
                  <Badge variant="destructive">High Anxiety</Badge>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isAnalyzing}
        />
        <Button onClick={handleSendMessage} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};
