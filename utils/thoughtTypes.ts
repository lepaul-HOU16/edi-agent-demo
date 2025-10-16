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

// Animation configuration removed - using simple Cloudscape components instead
