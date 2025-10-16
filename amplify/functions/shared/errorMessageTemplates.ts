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
