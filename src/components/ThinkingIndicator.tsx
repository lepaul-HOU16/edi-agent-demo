/**
 * Unified Thinking Indicator Component
 * 
 * Replaces all waiting/processing message types with a single, elegant indicator:
 * - "Processing data..."
 * - "Analyzing request..."
 * - "Thinking:"
 * 
 * Features:
 * - Purple gradient background
 * - Centered "Thinking" text (no colon)
 * - Animated bouncing dots
 * - Subtle pulse animation
 * - Auto-dismisses when response arrives
 */

import React from 'react';

interface ThinkingIndicatorProps {
  /** Legacy props for backward compatibility - all ignored now */
  context?: string;
  step?: string;
  progress?: number;
  estimatedTime?: string;
  isVisible?: boolean;
  currentThoughtStep?: any;
  /** Optional custom text (defaults to "Thinking") */
  text?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ 
  text = 'Thinking'
}) => {
  return (
    <div style={{ margin: '12px 0' }}>
      <div className="thinking-indicator">
        <span className="thinking-text">{text}</span>
        <div className="thinking-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      
      <style jsx>{`
        .thinking-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }
        
        .thinking-text {
          font-size: 16px;
          font-weight: 500;
          color: white;
          letter-spacing: 0.5px;
          margin-right: 12px;
        }
        
        .thinking-dots {
          display: flex;
          gap: 6px;
        }
        
        .dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite;
        }
        
        .dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          40% {
            transform: translateY(-8px);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default ThinkingIndicator;
