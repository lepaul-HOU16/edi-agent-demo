/**
 * Error Message Templates for Renewable Energy Workflows
 * 
 * Provides user-friendly error messages with context-specific guidance
 * for missing project data and workflow issues.
 */

export interface ErrorContext {
  projectId?: string;
  projectName?: string;
  missingData: string;
  requiredOperation: string;
  hasProjectContext?: boolean;
}

export interface ErrorMessage {
  message: string;
  suggestion: string;
  nextSteps: string[];
  errorCategory: 'MISSING_PROJECT_DATA' | 'PARAMETER_ERROR' | 'AMBIGUOUS_REFERENCE';
}

/**
 * Error message templates for missing project data
 */
export class ErrorMessageTemplates {
  
  /**
   * Generate error message for missing coordinates
   * Used when layout optimization is attempted without terrain analysis
   */
  static missingCoordinates(context: ErrorContext): ErrorMessage {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    return {
      message: `No coordinates found for ${projectRef}. Coordinates are required to optimize the turbine layout.`,
      suggestion: `Run terrain analysis first to establish project coordinates, or provide explicit latitude/longitude parameters.`,
      nextSteps: [
        `Analyze terrain: "analyze terrain at [latitude], [longitude]"`,
        `Or provide coordinates: "optimize layout at [latitude], [longitude] with [N] turbines"`,
        context.projectName ? `View project status: "show project ${context.projectName}"` : ''
      ].filter(Boolean),
      errorCategory: 'MISSING_PROJECT_DATA'
    };
  }

  /**
   * Generate error message for missing layout
   * Used when wake simulation is attempted without layout optimization
   */
  static missingLayout(context: ErrorContext): ErrorMessage {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    return {
      message: `No turbine layout found for ${projectRef}. A layout is required to run wake simulation.`,
      suggestion: `Run layout optimization first to establish turbine positions, or provide explicit layout data.`,
      nextSteps: [
        `Optimize layout: "optimize layout for ${projectRef}"`,
        `Or provide layout: "run wake simulation with layout [layout_data]"`,
        context.projectName ? `View project status: "show project ${context.projectName}"` : ''
      ].filter(Boolean),
      errorCategory: 'MISSING_PROJECT_DATA'
    };
  }

  /**
   * Generate error message for missing analysis results
   * Used when report generation is attempted without complete analysis
   */
  static missingAnalysisResults(context: ErrorContext): ErrorMessage {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    return {
      message: `No analysis results found for ${projectRef}. Complete analysis data is required to generate a report.`,
      suggestion: `Complete the full analysis workflow: terrain analysis → layout optimization → wake simulation → report generation.`,
      nextSteps: [
        `Start with terrain: "analyze terrain at [latitude], [longitude]"`,
        `Then optimize layout: "optimize layout for ${projectRef}"`,
        `Run simulation: "run wake simulation for ${projectRef}"`,
        `Finally generate report: "generate report for ${projectRef}"`
      ],
      errorCategory: 'MISSING_PROJECT_DATA'
    };
  }

  /**
   * Generate error message for missing terrain results
   * Used when layout optimization needs terrain data
   */
  static missingTerrainResults(context: ErrorContext): ErrorMessage {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    return {
      message: `No terrain analysis found for ${projectRef}. Terrain data helps optimize turbine placement.`,
      suggestion: `Run terrain analysis first to identify suitable areas and constraints.`,
      nextSteps: [
        `Analyze terrain: "analyze terrain at [latitude], [longitude]"`,
        `Then optimize layout: "optimize layout for ${projectRef}"`,
        context.projectName ? `View project status: "show project ${context.projectName}"` : ''
      ].filter(Boolean),
      errorCategory: 'MISSING_PROJECT_DATA'
    };
  }

  /**
   * Generate error message for missing simulation results
   * Used when report generation needs performance data
   */
  static missingSimulationResults(context: ErrorContext): ErrorMessage {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    return {
      message: `No wake simulation results found for ${projectRef}. Performance data is required for the report.`,
      suggestion: `Run wake simulation first to calculate energy production and wake losses.`,
      nextSteps: [
        `Run simulation: "run wake simulation for ${projectRef}"`,
        `Then generate report: "generate report for ${projectRef}"`,
        context.projectName ? `View project status: "show project ${context.projectName}"` : ''
      ].filter(Boolean),
      errorCategory: 'MISSING_PROJECT_DATA'
    };
  }

  /**
   * Generate comprehensive error message based on missing data type
   */
  static generateErrorMessage(missingData: string, context: ErrorContext): ErrorMessage {
    switch (missingData) {
      case 'coordinates':
        return this.missingCoordinates(context);
      
      case 'layout':
      case 'layout_results':
        return this.missingLayout(context);
      
      case 'terrain_results':
        return this.missingTerrainResults(context);
      
      case 'simulation_results':
        return this.missingSimulationResults(context);
      
      case 'analysis_results':
      case 'all':
        return this.missingAnalysisResults(context);
      
      default:
        // Generic missing data error
        const projectRef = context.projectName || context.projectId || 'this project';
        return {
          message: `Missing required data (${missingData}) for ${projectRef}.`,
          suggestion: `Complete the previous steps in the workflow before proceeding.`,
          nextSteps: [
            `Check project status: "show project ${projectRef}"`,
            `View all projects: "list my renewable projects"`
          ],
          errorCategory: 'MISSING_PROJECT_DATA'
        };
    }
  }

  /**
   * Format error message for API response
   */
  static formatForResponse(errorMessage: ErrorMessage, context: ErrorContext): any {
    return {
      success: false,
      error: errorMessage.message,
      errorCategory: errorMessage.errorCategory,
      details: {
        projectId: context.projectId,
        projectName: context.projectName,
        missingData: context.missingData,
        requiredOperation: context.requiredOperation,
        hasProjectContext: context.hasProjectContext,
        suggestion: errorMessage.suggestion,
        nextSteps: errorMessage.nextSteps
      }
    };
  }

  /**
   * Format error message for user display (conversational)
   */
  static formatForUser(errorMessage: ErrorMessage, context: ErrorContext): string {
    const projectRef = context.projectName || context.projectId || 'this project';
    
    let message = `${errorMessage.message}\n\n`;
    message += `💡 ${errorMessage.suggestion}\n\n`;
    message += `**Next steps:**\n`;
    errorMessage.nextSteps.forEach((step, index) => {
      message += `${index + 1}. ${step}\n`;
    });
    
    return message;
  }

  /**
   * Generate error message for ambiguous project references
   * Used when multiple projects match a partial name
   */
  static ambiguousProjectReference(matches: string[], query: string): ErrorMessage {
    const matchList = matches.map((name, index) => `${index + 1}. ${name}`).join('\n');
    
    return {
      message: `Multiple projects match your query "${query}". Please specify which project you mean.`,
      suggestion: `Use a more specific project name or reference the full project name.`,
      nextSteps: [
        `Matching projects:\n${matchList}`,
        `Specify project: "optimize layout for [specific-project-name]"`,
        `View all projects: "list my renewable projects"`
      ],
      errorCategory: 'AMBIGUOUS_REFERENCE'
    };
  }

  /**
   * Format ambiguous reference error for API response
   */
  static formatAmbiguousReferenceForResponse(matches: string[], query: string): any {
    const errorMessage = this.ambiguousProjectReference(matches, query);
    
    return {
      success: false,
      error: errorMessage.message,
      errorCategory: errorMessage.errorCategory,
      details: {
        query,
        matches,
        matchCount: matches.length,
        suggestion: errorMessage.suggestion,
        nextSteps: errorMessage.nextSteps
      }
    };
  }

  /**
   * Format ambiguous reference error for user display
   */
  static formatAmbiguousReferenceForUser(matches: string[], query: string): string {
    let message = `I found ${matches.length} projects that match "${query}":\n\n`;
    
    matches.forEach((name, index) => {
      message += `${index + 1}. **${name}**\n`;
    });
    
    message += `\n💡 Please specify which project you mean by using the full project name.\n\n`;
    message += `**Examples:**\n`;
    message += `- "optimize layout for ${matches[0]}"\n`;
    message += `- "run wake simulation for ${matches[1] || matches[0]}"\n`;
    message += `- "show project ${matches[0]}"\n`;
    
    return message;
  }

  /**
   * Format missing context error with intent-specific guidance
   * Used when validation fails due to missing project context
   */
  static formatMissingContextError(
    intentType: string,
    missingParams: string[],
    activeProject?: string
  ): string {
    const suggestions: Record<string, string> = {
      layout_optimization: 
        "To optimize layout, either:\n" +
        "• Provide coordinates: 'optimize layout at 35.067482, -101.395466'\n" +
        "• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'",
      
      wake_simulation:
        "To run wake simulation, first:\n" +
        "• Create a layout: 'optimize layout'\n" +
        "• Or specify a project: 'run wake simulation for project-name'",
      
      report_generation:
        "To generate a report, first:\n" +
        "• Complete terrain analysis and layout optimization\n" +
        "• Or specify a project: 'generate report for project-name'"
    };
    
    let message = `Missing required information: ${missingParams.join(', ')}.\n\n`;
    message += suggestions[intentType] || 'Please provide the required parameters.';
    
    if (activeProject) {
      message += `\n\nActive project: ${activeProject}`;
    }
    
    return message;
  }

  /**
   * Generate workflow status message
   * Shows what's complete and what's needed
   */
  static generateWorkflowStatus(projectName: string, projectData: any): string {
    const hasTerrain = !!projectData?.terrain_results;
    const hasLayout = !!projectData?.layout_results;
    const hasSimulation = !!projectData?.simulation_results;
    const hasReport = !!projectData?.report_results;
    
    let status = `**Project Status: ${projectName}**\n\n`;
    status += `${hasTerrain ? '✅' : '⬜'} Terrain Analysis\n`;
    status += `${hasLayout ? '✅' : '⬜'} Layout Optimization\n`;
    status += `${hasSimulation ? '✅' : '⬜'} Wake Simulation\n`;
    status += `${hasReport ? '✅' : '⬜'} Report Generation\n\n`;
    
    // Determine next step
    if (!hasTerrain) {
      status += `**Next:** Analyze terrain to identify suitable areas\n`;
      status += `Try: "analyze terrain at [latitude], [longitude]"`;
    } else if (!hasLayout) {
      status += `**Next:** Optimize turbine layout\n`;
      status += `Try: "optimize layout for ${projectName}"`;
    } else if (!hasSimulation) {
      status += `**Next:** Run wake simulation\n`;
      status += `Try: "run wake simulation for ${projectName}"`;
    } else if (!hasReport) {
      status += `**Next:** Generate comprehensive report\n`;
      status += `Try: "generate report for ${projectName}"`;
    } else {
      status += `**Status:** All analysis complete! ✨\n`;
      status += `View report: "show report for ${projectName}"`;
    }
    
    return status;
  }
}

/**
 * Renewable-specific error message templates
 * Provides actionable error messages with CTA buttons for workflow issues
 */
export interface RenewableErrorTemplate {
  title: string;
  message: string;
  action?: string;
  nextSteps?: string[];
}

export const RENEWABLE_ERROR_MESSAGES = {
  /**
   * Layout data not found - wake simulation requires layout
   */
  LAYOUT_MISSING: {
    title: "Layout Data Not Found",
    message: "Please run layout optimization before wake simulation.",
    action: "Optimize Turbine Layout",
    nextSteps: [
      "Run layout optimization first",
      "Or provide explicit layout data in your query"
    ]
  },
  
  /**
   * Terrain data not found - layout optimization needs terrain
   */
  TERRAIN_MISSING: {
    title: "Terrain Data Not Found",
    message: "Please run terrain analysis before layout optimization.",
    action: "Analyze Terrain",
    nextSteps: [
      "Run terrain analysis first to identify suitable areas",
      "Or provide explicit coordinates in your query"
    ]
  },
  
  /**
   * Lambda timeout - analysis taking too long
   */
  LAMBDA_TIMEOUT: {
    title: "Analysis Taking Longer Than Expected",
    message: "The analysis is still processing. Please try again in a moment.",
    action: "Retry",
    nextSteps: [
      "Wait a moment and try your query again",
      "The system may be under heavy load",
      "If this persists, try a smaller analysis area"
    ]
  },
  
  /**
   * S3 retrieval failed - cannot access stored data
   */
  S3_RETRIEVAL_FAILED: {
    title: "Unable to Retrieve Analysis Data",
    message: "There was an error accessing your analysis results. Please contact support if this persists.",
    nextSteps: [
      "Try your query again",
      "If the error persists, the data may be corrupted",
      "Contact support with your project name"
    ]
  },
  
  /**
   * Missing required parameters
   */
  PARAMETER_MISSING: (params: string[]): RenewableErrorTemplate => ({
    title: "Missing Required Parameters",
    message: `The following parameters are required: ${params.join(", ")}`,
    nextSteps: [
      `Please provide: ${params.join(", ")}`,
      "Example: 'analyze terrain at 35.067482, -101.395466'",
      "Or reference an existing project by name"
    ]
  }),
  
  /**
   * Analysis results missing - report generation needs complete workflow
   */
  ANALYSIS_RESULTS_MISSING: {
    title: "Incomplete Analysis Data",
    message: "Complete analysis data is required to generate a report.",
    action: "Complete Workflow",
    nextSteps: [
      "Complete the full workflow:",
      "1. Terrain analysis",
      "2. Layout optimization",
      "3. Wake simulation",
      "4. Report generation"
    ]
  },
  
  /**
   * Project not found
   */
  PROJECT_NOT_FOUND: (projectName: string): RenewableErrorTemplate => ({
    title: "Project Not Found",
    message: `Could not find project "${projectName}".`,
    action: "List Projects",
    nextSteps: [
      "Check the project name spelling",
      "List all projects: 'list my renewable projects'",
      "Or start a new analysis with terrain analysis"
    ]
  }),
  
  /**
   * Lambda invocation failed
   */
  LAMBDA_INVOCATION_FAILED: (toolType: string, error: string): RenewableErrorTemplate => ({
    title: "Analysis Tool Error",
    message: `The ${toolType} tool encountered an error: ${error}`,
    action: "Retry",
    nextSteps: [
      "Try your query again",
      "If the error persists, check your parameters",
      "Contact support if the issue continues"
    ]
  }),
  
  /**
   * Deployment issue - Lambda not configured
   */
  DEPLOYMENT_ISSUE: (toolType: string): RenewableErrorTemplate => ({
    title: "Tool Not Available",
    message: `The ${toolType} tool is not currently deployed.`,
    nextSteps: [
      "The system administrator needs to deploy the tool",
      "Run: npx ampx sandbox",
      "Contact support if you need immediate assistance"
    ]
  })
};

/**
 * Helper functions for renewable error messages
 */
export class RenewableErrorFormatter {
  /**
   * Format renewable error for user display
   */
  static formatForUser(template: RenewableErrorTemplate, projectName?: string): string {
    let message = `**${template.title}**\n\n`;
    message += `${template.message}\n\n`;
    
    if (template.nextSteps && template.nextSteps.length > 0) {
      message += `**What to do next:**\n`;
      template.nextSteps.forEach((step, index) => {
        message += `${index + 1}. ${step}\n`;
      });
    }
    
    if (projectName) {
      message += `\n**Current project:** ${projectName}\n`;
    }
    
    return message;
  }
  
  /**
   * Format renewable error for API response
   */
  static formatForResponse(
    template: RenewableErrorTemplate,
    context: {
      projectName?: string;
      projectId?: string;
      intentType?: string;
      error?: any;
    }
  ): any {
    return {
      success: false,
      error: template.message,
      errorTitle: template.title,
      errorCategory: 'RENEWABLE_WORKFLOW_ERROR',
      details: {
        projectName: context.projectName,
        projectId: context.projectId,
        intentType: context.intentType,
        action: template.action,
        nextSteps: template.nextSteps,
        originalError: context.error instanceof Error ? context.error.message : context.error
      }
    };
  }
  
  /**
   * Detect error type from error message or exception
   */
  static detectErrorType(error: any, intentType?: string): keyof typeof RENEWABLE_ERROR_MESSAGES | null {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLower = errorMessage.toLowerCase();
    
    // Check for specific error patterns (order matters - most specific first)
    if (errorLower.includes('layout') && errorLower.includes('not found')) {
      return 'LAYOUT_MISSING';
    }
    
    if (errorLower.includes('terrain') && errorLower.includes('not found')) {
      return 'TERRAIN_MISSING';
    }
    
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'LAMBDA_TIMEOUT';
    }
    
    if (errorLower.includes('s3') || errorLower.includes('bucket') || errorLower.includes('key')) {
      return 'S3_RETRIEVAL_FAILED';
    }
    
    if (errorLower.includes('project') && errorLower.includes('not found')) {
      return 'PROJECT_NOT_FOUND';
    }
    
    // Check deployment issues before generic Lambda errors
    if (errorLower.includes('not configured') || 
        errorLower.includes('not deployed') ||
        errorLower.includes('function not found')) {
      return 'DEPLOYMENT_ISSUE';
    }
    
    // Generic Lambda invocation errors (check last)
    if (errorLower.includes('lambda') || errorLower.includes('invocation')) {
      return 'LAMBDA_INVOCATION_FAILED';
    }
    
    return null;
  }
  
  /**
   * Generate error message with context
   */
  static generateErrorMessage(
    error: any,
    context: {
      intentType?: string;
      projectName?: string;
      projectId?: string;
      missingParams?: string[];
    }
  ): { template: RenewableErrorTemplate; formatted: string } {
    // Detect error type
    const errorType = this.detectErrorType(error, context.intentType);
    
    let template: RenewableErrorTemplate;
    
    if (errorType && errorType in RENEWABLE_ERROR_MESSAGES) {
      const templateOrFunction = RENEWABLE_ERROR_MESSAGES[errorType];
      
      // Handle function templates
      if (typeof templateOrFunction === 'function') {
        if (errorType === 'PARAMETER_MISSING' && context.missingParams) {
          const missingParams = Array.isArray(context.missingParams) ? context.missingParams : [context.missingParams];
          template = (templateOrFunction as (params: string[]) => RenewableErrorTemplate)(missingParams);
        } else if (errorType === 'PROJECT_NOT_FOUND' && context.projectName) {
          template = (RENEWABLE_ERROR_MESSAGES.PROJECT_NOT_FOUND as any)(context.projectName);
        } else if (errorType === 'LAMBDA_INVOCATION_FAILED' && context.intentType) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          template = (RENEWABLE_ERROR_MESSAGES.LAMBDA_INVOCATION_FAILED as any)(context.intentType, errorMessage);
        } else if (errorType === 'DEPLOYMENT_ISSUE' && context.intentType) {
          template = (RENEWABLE_ERROR_MESSAGES.DEPLOYMENT_ISSUE as any)(context.intentType);
        } else {
          // Fallback for function templates without proper context
          template = {
            title: "Error",
            message: error instanceof Error ? error.message : String(error),
            nextSteps: ["Please try again", "Contact support if the issue persists"]
          };
        }
      } else {
        template = templateOrFunction;
      }
    } else {
      // Generic error template
      template = {
        title: "Unexpected Error",
        message: error instanceof Error ? error.message : String(error),
        nextSteps: [
          "Please try your query again",
          "If the error persists, contact support",
          "Include your project name and the query you tried"
        ]
      };
    }
    
    const formatted = this.formatForUser(template, context.projectName);
    
    return { template, formatted };
  }
}
