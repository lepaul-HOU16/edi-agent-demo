/**
 * Prerequisite Validation Service
 * 
 * Handles step prerequisite checking, validation, and completion criteria
 */

import {
  WorkflowState,
  WorkflowStep,
  StepValidationResult,
  PrerequisiteChecker,
  ComplexityLevel,
  WorkflowCategory
} from '../../types/workflow';

/**
 * Service for validating workflow step prerequisites and completion criteria
 */
export class PrerequisiteValidationService {
  private customValidators: Map<string, PrerequisiteChecker> = new Map();

  /**
   * Register a custom prerequisite validator for a specific step
   */
  registerValidator(stepId: string, validator: PrerequisiteChecker): void {
    this.customValidators.set(stepId, validator);
  }

  /**
   * Validate if a step can be started based on prerequisites
   */
  validateStepPrerequisites(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    // Use custom validator if available
    if (this.customValidators.has(step.id)) {
      const customValidator = this.customValidators.get(step.id)!;
      return customValidator(step.id, workflowState);
    }

    // Default validation logic
    return this.performDefaultValidation(step, workflowState);
  }

  /**
   * Perform default prerequisite validation
   */
  private performDefaultValidation(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check basic prerequisites
    const missingPrerequisites = step.prerequisites.filter(
      prereqId => !workflowState.completedSteps.includes(prereqId)
    );

    if (missingPrerequisites.length > 0) {
      result.isValid = false;
      result.missingPrerequisites = missingPrerequisites;
      result.recommendations.push(
        `Complete the following steps first: ${missingPrerequisites.join(', ')}`
      );
    }

    // Check complexity level requirements
    const complexityValidation = this.validateComplexityLevel(step, workflowState);
    if (!complexityValidation.isValid) {
      result.warnings.push(...complexityValidation.warnings);
      result.recommendations.push(...complexityValidation.recommendations);
    }

    // Check category-specific requirements
    const categoryValidation = this.validateCategoryRequirements(step, workflowState);
    if (!categoryValidation.isValid) {
      result.warnings.push(...categoryValidation.warnings);
      result.recommendations.push(...categoryValidation.recommendations);
    }

    // Check data requirements
    const dataValidation = this.validateDataRequirements(step, workflowState);
    if (!dataValidation.isValid) {
      result.warnings.push(...dataValidation.warnings);
      result.recommendations.push(...dataValidation.recommendations);
    }

    return result;
  }

  /**
   * Validate complexity level requirements
   */
  private validateComplexityLevel(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    const userLevel = workflowState.userProgress.currentComplexityLevel;
    const stepLevel = step.complexity;

    const levelOrder = [
      ComplexityLevel.BASIC,
      ComplexityLevel.INTERMEDIATE,
      ComplexityLevel.ADVANCED,
      ComplexityLevel.EXPERT
    ];

    const userIndex = levelOrder.indexOf(userLevel);
    const stepIndex = levelOrder.indexOf(stepLevel);

    if (stepIndex > userIndex) {
      result.isValid = false;
      result.warnings.push(
        `This step requires ${stepLevel} complexity level (you are at ${userLevel})`
      );
      result.recommendations.push(
        'Complete more basic steps to unlock higher complexity levels'
      );
    } else if (stepIndex < userIndex - 1) {
      result.warnings.push(
        'This step is below your current complexity level - it may be completed quickly'
      );
    }

    return result;
  }

  /**
   * Validate category-specific requirements
   */
  private validateCategoryRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    switch (step.category) {
      case WorkflowCategory.TERRAIN_ANALYSIS:
        return this.validateTerrainAnalysisRequirements(step, workflowState);
      
      case WorkflowCategory.WIND_ANALYSIS:
        return this.validateWindAnalysisRequirements(step, workflowState);
      
      case WorkflowCategory.LAYOUT_OPTIMIZATION:
        return this.validateLayoutOptimizationRequirements(step, workflowState);
      
      case WorkflowCategory.PERFORMANCE_ANALYSIS:
        return this.validatePerformanceAnalysisRequirements(step, workflowState);
      
      case WorkflowCategory.REPORTING:
        return this.validateReportingRequirements(step, workflowState);
      
      default:
        return result;
    }
  }

  /**
   * Validate terrain analysis specific requirements
   */
  private validateTerrainAnalysisRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check if site coordinates are available
    if (!workflowState.sessionData.coordinates) {
      result.warnings.push('Site coordinates not specified');
      result.recommendations.push('Select a site location before terrain analysis');
    }

    // Check if site selection is completed
    const hasSiteSelection = workflowState.completedSteps.some(stepId => 
      stepId.includes('site_selection') || stepId.includes('site_coordinates')
    );

    if (!hasSiteSelection) {
      result.warnings.push('Site selection not completed');
      result.recommendations.push('Complete site selection before detailed terrain analysis');
    }

    return result;
  }

  /**
   * Validate wind analysis specific requirements
   */
  private validateWindAnalysisRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check if terrain analysis is completed
    const hasTerrainAnalysis = workflowState.completedSteps.some(stepId => 
      stepId.includes('terrain')
    );

    if (!hasTerrainAnalysis) {
      result.warnings.push('Terrain analysis recommended before wind analysis');
      result.recommendations.push('Complete terrain analysis to understand site constraints');
    }

    return result;
  }

  /**
   * Validate layout optimization specific requirements
   */
  private validateLayoutOptimizationRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check if wind analysis is completed
    const hasWindAnalysis = workflowState.completedSteps.some(stepId => 
      stepId.includes('wind')
    );

    if (!hasWindAnalysis) {
      result.warnings.push('Wind analysis recommended before layout optimization');
      result.recommendations.push('Complete wind analysis to optimize turbine placement');
    }

    // Check if terrain constraints are available
    const hasTerrainData = workflowState.sessionData.sharedData.terrain_constraints ||
                          workflowState.sessionData.sharedData.exclusion_zones;

    if (!hasTerrainData) {
      result.warnings.push('Terrain constraints not available');
      result.recommendations.push('Complete terrain analysis to identify layout constraints');
    }

    return result;
  }

  /**
   * Validate performance analysis specific requirements
   */
  private validatePerformanceAnalysisRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check if layout optimization is completed
    const hasLayoutOptimization = workflowState.completedSteps.some(stepId => 
      stepId.includes('layout')
    );

    if (!hasLayoutOptimization) {
      result.warnings.push('Layout optimization recommended before performance analysis');
      result.recommendations.push('Complete layout optimization to analyze turbine performance');
    }

    return result;
  }

  /**
   * Validate reporting specific requirements
   */
  private validateReportingRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check if core analysis steps are completed
    const coreSteps = ['terrain_analysis', 'wind_analysis', 'layout_optimization'];
    const completedCoreSteps = coreSteps.filter(stepId => 
      workflowState.completedSteps.some(completed => completed.includes(stepId))
    );

    if (completedCoreSteps.length < 2) {
      result.warnings.push('Limited analysis data available for comprehensive reporting');
      result.recommendations.push('Complete more analysis steps for a comprehensive report');
    }

    return result;
  }

  /**
   * Validate data requirements
   */
  private validateDataRequirements(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check for required shared data based on step requirements
    if (step.metadata?.requirements) {
      for (const requirement of step.metadata.requirements) {
        if (requirement.includes('coordinates') && !workflowState.sessionData.coordinates) {
          result.warnings.push('Site coordinates required');
          result.recommendations.push('Specify site coordinates in project settings');
        }

        if (requirement.includes('terrain') && !workflowState.sessionData.sharedData.terrain_data) {
          result.warnings.push('Terrain data not available');
          result.recommendations.push('Complete terrain analysis to generate required data');
        }

        if (requirement.includes('wind') && !workflowState.sessionData.sharedData.wind_data) {
          result.warnings.push('Wind data not available');
          result.recommendations.push('Complete wind analysis to generate required data');
        }
      }
    }

    return result;
  }

  /**
   * Check if step completion criteria are met
   */
  validateStepCompletion(
    step: WorkflowStep,
    workflowState: WorkflowState,
    stepResults?: any
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Check success criteria if defined
    if (step.metadata?.successCriteria) {
      for (const criteria of step.metadata.successCriteria) {
        const isMetResult = this.evaluateSuccessCriteria(criteria, stepResults, workflowState);
        if (!isMetResult.isValid) {
          result.isValid = false;
          result.warnings.push(...isMetResult.warnings);
          result.recommendations.push(...isMetResult.recommendations);
        }
      }
    }

    return result;
  }

  /**
   * Evaluate individual success criteria
   */
  private evaluateSuccessCriteria(
    criteria: string,
    stepResults: any,
    workflowState: WorkflowState
  ): StepValidationResult {
    const result: StepValidationResult = {
      isValid: true,
      missingPrerequisites: [],
      warnings: [],
      recommendations: []
    };

    // Simple criteria evaluation - can be extended for more complex logic
    if (criteria.includes('visualization') && !stepResults?.visualizations) {
      result.isValid = false;
      result.warnings.push('Visualization not generated');
      result.recommendations.push('Ensure visualization is created before completing step');
    }

    if (criteria.includes('data') && !stepResults?.data) {
      result.isValid = false;
      result.warnings.push('Required data not generated');
      result.recommendations.push('Ensure all required data is generated');
    }

    if (criteria.includes('analysis') && !stepResults?.analysis) {
      result.isValid = false;
      result.warnings.push('Analysis not completed');
      result.recommendations.push('Complete the analysis before proceeding');
    }

    return result;
  }

  /**
   * Get all available next steps based on current workflow state
   */
  getAvailableNextSteps(
    workflowDefinition: WorkflowStep[],
    workflowState: WorkflowState
  ): WorkflowStep[] {
    return workflowDefinition.filter(step => {
      // Skip already completed steps
      if (workflowState.completedSteps.includes(step.id)) {
        return false;
      }

      // Check if prerequisites are met
      const validation = this.validateStepPrerequisites(step, workflowState);
      return validation.isValid || validation.warnings.length === 0; // Allow steps with warnings
    });
  }

  /**
   * Get recommended next step based on workflow logic
   */
  getRecommendedNextStep(
    workflowDefinition: WorkflowStep[],
    workflowState: WorkflowState
  ): WorkflowStep | null {
    const availableSteps = this.getAvailableNextSteps(workflowDefinition, workflowState);
    
    if (availableSteps.length === 0) {
      return null;
    }

    // Prioritize by category order and complexity
    const categoryOrder = [
      WorkflowCategory.SITE_SELECTION,
      WorkflowCategory.TERRAIN_ANALYSIS,
      WorkflowCategory.WIND_ANALYSIS,
      WorkflowCategory.LAYOUT_OPTIMIZATION,
      WorkflowCategory.PERFORMANCE_ANALYSIS,
      WorkflowCategory.REPORTING
    ];

    // Sort by category priority, then by complexity
    availableSteps.sort((a, b) => {
      const aCategoryIndex = categoryOrder.indexOf(a.category);
      const bCategoryIndex = categoryOrder.indexOf(b.category);
      
      if (aCategoryIndex !== bCategoryIndex) {
        return aCategoryIndex - bCategoryIndex;
      }

      // If same category, prefer lower complexity first
      const complexityOrder = [
        ComplexityLevel.BASIC,
        ComplexityLevel.INTERMEDIATE,
        ComplexityLevel.ADVANCED,
        ComplexityLevel.EXPERT
      ];

      return complexityOrder.indexOf(a.complexity) - complexityOrder.indexOf(b.complexity);
    });

    return availableSteps[0];
  }
}

export default PrerequisiteValidationService;