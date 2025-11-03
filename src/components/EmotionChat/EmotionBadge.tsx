import React from 'react';
import type { DetectedEmotion } from '../../types/emotion.types';

interface EmotionBadgeProps {
  emotion: DetectedEmotion | null;
  intensity?: number;
  size?: 'sm' | 'md' | 'lg';
}

const EmotionBadge: React.FC<EmotionBadgeProps> = ({ 
  emotion, 
  intensity, 
  size = 'sm' 
}) => {
  if (!emotion || !emotion.data) return null;

  const { data } = emotion;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <div className="flex items-center gap-2">
      <span 
        className={`${data.color} text-white rounded-full ${sizeClasses[size]} font-medium inline-flex items-center gap-1`}
      >
        <span className="text-base">{data.icon}</span>
        <span>{data.label}</span>
      </span>
      
      {intensity && (
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${data.color} transition-all duration-300`}
              style={{ width: `${intensity}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionBadge;