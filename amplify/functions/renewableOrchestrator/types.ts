/**
 * Type definitions for Renewable Orchestrator Lambda
 */

export interface OrchestratorRequest {
  query: string;
  userId?: string;  // Optional - only required for async mode
  sessionId?: string;  // Optional - only required for async mode
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
  responseComplete?: boolean;  // Signal to frontend that response is complete
  metadata: {
    executionTime: number;
    toolsUsed: string[];
    projectId?: string;
    requestId?: string;
    validationErrors?: string[];
    parameterValidation?: {
      missingRequired: string[];
      invalidValues: string[];
    };
    timings?: {
      validation: number;
      intentDetection: number;
      toolInvocation: number;
      resultFormatting: number;
      total: number;
    };
    error?: {
      type: string;
      message: string;
      remediationSteps: string[];
    };
    health?: {
      functionName: string;
      version: string;
      region: string;
      toolsConfigured: {
        terrain: boolean;
        layout: boolean;
        simulation: boolean;
        report: boolean;
      };
      toolFunctionNames: {
        terrain: string;
        layout: string;
        simulation: string;
        report: string;
      };
    };
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
  type: 'terrain_analysis' | 'layout_optimization' | 'wake_simulation' | 'wind_rose' | 'wind_rose_analysis' | 'report_generation' | 'unknown';
  params: Record<string, any>;
  confidence: number;
}

export interface ToolResult {
  success: boolean;
  type: string;
  data: any;
  error?: string;
}
