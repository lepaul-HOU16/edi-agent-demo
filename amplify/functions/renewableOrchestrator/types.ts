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
    projectName?: string;
    requestId?: string;
    validationErrors?: string[];
    ambiguousProjects?: string[];
    matchCount?: number;
    projectCount?: number;  // For project list queries
    activeProject?: string;  // For project list queries
    errorCategory?: 'MISSING_PROJECT_DATA' | 'PARAMETER_ERROR' | 'AMBIGUOUS_REFERENCE';
    projectStatus?: {
      terrain: boolean;
      layout: boolean;
      simulation: boolean;
      report: boolean;
    };
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
  actions?: ActionButton[];  // Contextual action buttons for this artifact
}

export interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}

export interface ThoughtStep {
  step: number;
  action: string;
  reasoning: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error';
  timestamp: string;
  duration?: number;  // milliseconds
  error?: {
    message: string;
    suggestion?: string;
  };
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
