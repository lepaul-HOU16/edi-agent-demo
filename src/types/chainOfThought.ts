/**
 * Chain of Thought Type Definitions
 * Shared types for verbose thought steps across the platform
 */

export interface VerboseThoughtStep {
  id: string;
  type: 'data_access' | 'parsing' | 'calculation' | 'validation' | 'artifact_generation' | 'completion' | 'error';
  timestamp: number;
  title: string;
  summary: string;
  details?: {
    operation?: string;
    dataPoints?: number;
    parameters?: Record<string, any>;
    source?: string;
    duration?: number;
    metrics?: Record<string, number>;
    reasoning?: string;
    error?: string;
    [key: string]: any;
  };
  status: 'in_progress' | 'complete' | 'error';
  progress?: number;
}

export interface PromptGroup {
  promptText: string;
  steps: VerboseThoughtStep[];
}

export interface ChainOfThoughtDisplayProps {
  steps?: VerboseThoughtStep[];
  promptGroups?: PromptGroup[];
  autoScroll?: boolean;
  onAutoScrollChange?: (enabled: boolean) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}
