/**
 * Type definitions for Renewable Orchestrator Lambda
 */

export interface OrchestratorRequest {
  query: string;
  userId: string;
  sessionId: string;
  context?: {
    previousResults?: any;
    projectId?: string;
  };
}

export interface OrchestratorResponse {
  success: boolean;
  message: string;
  artifacts: Artifact[];
  thoughtSteps: ThoughtStep[];
  metadata: {
    executionTime: number;
    toolsUsed: string[];
    projectId?: string;
  };
}

export interface Artifact {
  type: string;
  data: any;
}

export interface ThoughtStep {
  step: number;
  action: string;
  reasoning: string;
  result?: string;
}

export interface RenewableIntent {
  type: 'terrain_analysis' | 'layout_optimization' | 'wake_simulation' | 'report_generation' | 'unknown';
  params: Record<string, any>;
  confidence: number;
}

export interface ToolResult {
  success: boolean;
  type: string;
  data: any;
  error?: string;
}
