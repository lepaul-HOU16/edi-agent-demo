/**
 * Chain of Thought Types - Structured thinking process for AI agents
 * Enables transparent, educational, and trust-building AI interactions
 */

export interface ThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 'execution' | 'validation' | 'completion' | 'error';
  timestamp: number;
  title: string;
  summary: string;
  details?: string;
  confidence?: number;
  duration?: number;
  status: 'thinking' | 'complete' | 'error';
  context?: {
    wellName?: string;
    analysisType?: string;
    method?: string;
    parameters?: Record<string, any>;
  };
}

export interface ThinkingState {
  isActive: boolean;
  currentStep?: ThoughtStep;
  allSteps: ThoughtStep[];
  mainChatContext: string;
  estimatedCompletion?: Date;
  progress: number; // 0-100
}

export interface ThinkingMessage {
  id: string;
  role: 'thinking';
  context: string;
  step: string;
  progress: number;
  isVisible: boolean;
  timestamp: Date;
  thoughtSteps: ThoughtStep[];
}

// Helper functions for creating thought steps
export const createThoughtStep = (
  type: ThoughtStep['type'],
  title: string,
  summary: string,
  context?: ThoughtStep['context']
): ThoughtStep => ({
  id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: Date.now(),
  title,
  summary,
  status: 'thinking',
  context
});

export const completeThoughtStep = (step: ThoughtStep, details?: string): ThoughtStep => ({
  ...step,
  status: 'complete',
  duration: Date.now() - step.timestamp,
  details
});

export const getThinkingContextFromStep = (step: ThoughtStep): string => {
  const { context } = step;
  
  switch (step.type) {
    case 'intent_detection':
      return `🧠 Analyzing ${context?.analysisType || 'request'}...`;
    case 'parameter_extraction':
      return `🎯 Identifying parameters for ${context?.wellName || 'analysis'}...`;
    case 'tool_selection':
      return `🔧 Preparing ${context?.analysisType || 'calculation'} tools...`;
    case 'execution':
      return `⚡ Processing ${context?.wellName || 'data'}...`;
    case 'validation':
      return `✓ Validating ${context?.analysisType || 'results'}...`;
    case 'completion':
      return `🎉 Analysis complete!`;
    case 'error':
      return `❌ Error occurred`;
    default:
      return '🤔 Processing...';
  }
};

// Animation configuration for ThinkingIndicator
export const getAnimationIntensity = (type: ThoughtStep['type']) => {
  switch (type) {
    case 'intent_detection':
      return { duration: '2s', scale: { min: 1, max: 1.03 }, opacity: { min: 0.7, max: 1 } };
    case 'parameter_extraction':
      return { duration: '2.2s', scale: { min: 1, max: 1.025 }, opacity: { min: 0.75, max: 1 } };
    case 'tool_selection':
      return { duration: '2.5s', scale: { min: 1, max: 1.02 }, opacity: { min: 0.8, max: 1 } };
    case 'execution':
      return { duration: '1.8s', scale: { min: 1, max: 1.04 }, opacity: { min: 0.65, max: 1 } };
    case 'validation':
      return { duration: '2.3s', scale: { min: 1, max: 1.025 }, opacity: { min: 0.75, max: 1 } };
    case 'completion':
      return { duration: '3s', scale: { min: 1, max: 1.01 }, opacity: { min: 0.9, max: 1 } };
    case 'error':
      return { duration: '2s', scale: { min: 1, max: 1.02 }, opacity: { min: 0.8, max: 1 } };
    default:
      return { duration: '2.5s', scale: { min: 1, max: 1.02 }, opacity: { min: 0.8, max: 1 } };
  }
};
