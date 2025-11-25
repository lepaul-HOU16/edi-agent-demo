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
    project_name?: string;  // Explicit project name to use (takes precedence over resolution)
    duplicateCheckResult?: {
      hasDuplicates: boolean;
      duplicates: Array<{
        project: any;
        distanceKm: number;
      }>;
      userPrompt: string;
      message: string;
    };
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
    errorCategory?: 'MISSING_PROJECT_DATA' | 'PARAMETER_ERROR' | 'AMBIGUOUS_REFERENCE' | 'RENEWABLE_WORKFLOW_ERROR' | 'MISSING_PREREQUISITE';
    errorTitle?: string;
    missingData?: string;
    requiredAction?: string;
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
    // Duplicate detection metadata
    requiresUserChoice?: boolean;
    duplicateProjects?: Array<{
      name: string;
      distance: number;
    }>;
    duplicateCheckResult?: {
      hasDuplicates: boolean;
      duplicates: Array<{
        project: any;
        distanceKm: number;
      }>;
      userPrompt: string;
      message: string;
    };
    createNew?: boolean;
    // Lifecycle operation metadata
    lifecycleOperation?: string;
    deletedCount?: number;
    deletedProjects?: string[];
    failedProjects?: Array<{ name: string; error: string }>;
    oldName?: string;
    newName?: string;
    mergedProject?: string;
    archivedProjects?: any[];
    exportData?: any;
    searchCriteria?: any;
    projects?: any[];
    duplicateGroups?: any[];
    fallbackUsed?: boolean;  // Indicates if fallback data was used due to backend unavailability
    fallbackReason?: string;  // Reason for fallback (e.g., 'Strands Agent timeout/throttling')
    fallbackFailed?: boolean;  // Indicates if fallback also failed
    // Async invocation polling configuration
    polling?: {
      enabled: boolean;
      interval: number;  // milliseconds between polls
      maxAttempts: number;  // maximum number of polling attempts
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
  type: 'terrain_analysis' | 'layout_optimization' | 'wake_simulation' | 'wind_rose' | 'wind_rose_analysis' | 'report_generation' | 'compare_scenarios' | 'delete_project' | 'rename_project' | 'merge_projects' | 'archive_project' | 'export_project' | 'search_projects' | 'project_dashboard' | 'unknown';
  params: Record<string, any>;
  confidence: number;
}

export interface ToolResult {
  success: boolean;
  type: string;
  data: any;
  error?: string;
}
