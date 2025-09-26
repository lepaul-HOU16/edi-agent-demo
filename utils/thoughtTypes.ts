/**
 * Chain of Thought Types - Structured thinking process for AI agents
 * Enables transparent, educational, and trust-building AI interactions
 */

export interface ThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 'execution' | 'validation' | 'completion';
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
    default:
      return '🤔 Processing...';
  }
};

// Animation configuration
export interface AnimationConfig {
  duration: string;
  scale: { min: number; max: number };
  opacity: { min: number; max: number };
}

export const getAnimationIntensity = (step: ThoughtStep['type']): AnimationConfig => {
  switch (step) {
    case 'intent_detection':
      return {
        duration: '8s', // Much slower: was 6s
        scale: { min: 1, max: 1.002 }, // Ultra subtle: was 1.003
        opacity: { min: 0.95, max: 1 } // Ultra subtle: was 0.92-1
      };
    case 'parameter_extraction':
      return {
        duration: '7.5s', // Much slower: was 5.5s
        scale: { min: 1, max: 1.0025 }, // Ultra subtle: was 1.005
        opacity: { min: 0.94, max: 1 } // Ultra subtle: was 0.9-1
      };
    case 'execution':
      return {
        duration: '7s', // Much slower: was 5s
        scale: { min: 1, max: 1.003 }, // Ultra subtle: was 1.006
        opacity: { min: 0.93, max: 1 } // Ultra subtle: was 0.88-1
      };
    default:
      return {
        duration: '7.5s', // Much slower: was 5.5s
        scale: { min: 1, max: 1.0025 }, // Ultra subtle: was 1.004
        opacity: { min: 0.94, max: 1 } // Ultra subtle: was 0.9-1
      };
  }
};
