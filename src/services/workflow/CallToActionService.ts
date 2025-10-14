/**
 * Call-to-Action Service
 * 
 * Manages call-to-action configurations and contextual guidance for workflow steps
 */

import {
  CallToActionConfig,
  ActionButton,
  ContextualHelp,
  WorkflowStep,
  WorkflowState,
  ComplexityLevel,
  WorkflowCategory
} from '../../types/workflow';

/**
 * Service for managing call-to-action configurations
 */
export class CallToActionService {
  /**
   * Generate contextual call-to-action configuration based on step and workflow state
   */
  static generateCallToAction(
    step: WorkflowStep,
    workflowState: WorkflowState,
    availableNextSteps: string[] = []
  ): CallToActionConfig {
    const isCompleted = workflowState.completedSteps.includes(step.id);
    const buttons = this.generateActionButtons(step, workflowState, availableNextSteps, isCompleted);
    const guidance = this.generateGuidanceMessage(step, workflowState, isCompleted);
    const contextualHelp = this.generateContextualHelp(step, workflowState);

    return {
      position: 'bottom',
      buttons,
      guidance,
      priority: this.determinePriority(step, workflowState),
      showProgress: true,
      contextualHelp
    };
  }

  /**
   * Generate action buttons based on step context
   */
  private static generateActionButtons(
    step: WorkflowStep,
    workflowState: WorkflowState,
    availableNextSteps: string[],
    isCompleted: boolean
  ): ActionButton[] {
    const buttons: ActionButton[] = [];

    if (!isCompleted) {
      // Primary action for current step
      buttons.push({
        id: 'complete_step',
        label: this.getCompletionButtonLabel(step.category),
        action: 'complete_current_step',
        variant: 'primary',
        icon: 'status-positive',
        tooltip: `Complete ${step.title}`
      });

      // Help action
      buttons.push({
        id: 'get_help',
        label: 'Get Help',
        action: 'request_help',
        variant: 'secondary',
        icon: 'status-info',
        tooltip: 'Get help with this step'
      });
    } else {
      // Next step actions
      const primaryNextSteps = availableNextSteps.slice(0, 2);
      primaryNextSteps.forEach((stepId, index) => {
        buttons.push({
          id: `next_step_${stepId}`,
          label: this.getNextStepLabel(stepId),
          action: stepId,
          variant: index === 0 ? 'primary' : 'secondary',
          icon: 'arrow-right',
          tooltip: `Proceed to ${this.getNextStepLabel(stepId)}`
        });
      });

      // Export/Save actions for completed steps
      if (this.shouldShowExportAction(step.category)) {
        buttons.push({
          id: 'export_results',
          label: 'Export Results',
          action: 'export_results',
          variant: 'tertiary',
          icon: 'download',
          tooltip: 'Export analysis results'
        });
      }
    }

    // Advanced options for higher complexity levels
    if (workflowState.userProgress.currentComplexityLevel !== ComplexityLevel.BASIC) {
      buttons.push({
        id: 'advanced_options',
        label: 'Advanced Options',
        action: 'show_advanced_options',
        variant: 'tertiary',
        icon: 'settings',
        tooltip: 'Access advanced configuration options'
      });
    }

    return buttons;
  }

  /**
   * Generate contextual guidance message
   */
  private static generateGuidanceMessage(
    step: WorkflowStep,
    workflowState: WorkflowState,
    isCompleted: boolean
  ): string {
    if (isCompleted) {
      return this.getCompletedStepGuidance(step, workflowState);
    }

    return this.getActiveStepGuidance(step, workflowState);
  }

  /**
   * Generate contextual help configuration
   */
  private static generateContextualHelp(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): ContextualHelp {
    const baseHelp = step.callToAction?.contextualHelp;
    
    return {
      title: baseHelp?.title || `${step.title} Help`,
      content: baseHelp?.content || this.getDefaultHelpContent(step),
      links: [
        ...(baseHelp?.links || []),
        ...this.getContextualLinks(step, workflowState)
      ],
      videoUrl: baseHelp?.videoUrl,
      expandable: true
    };
  }

  /**
   * Determine call-to-action priority
   */
  private static determinePriority(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): 'high' | 'medium' | 'low' {
    // High priority for critical path steps
    const criticalCategories = [
      WorkflowCategory.SITE_SELECTION,
      WorkflowCategory.TERRAIN_ANALYSIS
    ];

    if (criticalCategories.includes(step.category)) {
      return 'high';
    }

    // Medium priority for analysis steps
    const analysisCategories = [
      WorkflowCategory.WIND_ANALYSIS,
      WorkflowCategory.LAYOUT_OPTIMIZATION,
      WorkflowCategory.PERFORMANCE_ANALYSIS
    ];

    if (analysisCategories.includes(step.category)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get completion button label based on category
   */
  private static getCompletionButtonLabel(category: WorkflowCategory): string {
    switch (category) {
      case WorkflowCategory.SITE_SELECTION:
        return 'Select Site';
      case WorkflowCategory.TERRAIN_ANALYSIS:
        return 'Analyze Terrain';
      case WorkflowCategory.WIND_ANALYSIS:
        return 'Analyze Wind';
      case WorkflowCategory.LAYOUT_OPTIMIZATION:
        return 'Optimize Layout';
      case WorkflowCategory.PERFORMANCE_ANALYSIS:
        return 'Analyze Performance';
      case WorkflowCategory.REPORTING:
        return 'Generate Report';
      default:
        return 'Complete Step';
    }
  }

  /**
   * Get next step label from step ID
   */
  private static getNextStepLabel(stepId: string): string {
    return stepId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Check if export action should be shown
   */
  private static shouldShowExportAction(category: WorkflowCategory): boolean {
    return [
      WorkflowCategory.TERRAIN_ANALYSIS,
      WorkflowCategory.WIND_ANALYSIS,
      WorkflowCategory.LAYOUT_OPTIMIZATION,
      WorkflowCategory.PERFORMANCE_ANALYSIS,
      WorkflowCategory.REPORTING
    ].includes(category);
  }

  /**
   * Get guidance for completed steps
   */
  private static getCompletedStepGuidance(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): string {
    const nextStepsCount = step.nextSteps.filter(stepId => 
      workflowState.availableSteps.includes(stepId)
    ).length;

    if (nextStepsCount === 0) {
      return `Great job completing ${step.title}! You've finished this analysis path.`;
    }

    if (nextStepsCount === 1) {
      return `Excellent! You've completed ${step.title}. Ready to move to the next step?`;
    }

    return `Well done! You've completed ${step.title}. You now have ${nextStepsCount} analysis options available.`;
  }

  /**
   * Get guidance for active steps
   */
  private static getActiveStepGuidance(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): string {
    const complexityGuidance = this.getComplexityGuidance(step.complexity, workflowState);
    const timeGuidance = `This step typically takes ${step.estimatedDuration} minutes to complete.`;
    
    return `${complexityGuidance} ${timeGuidance}`;
  }

  /**
   * Get complexity-specific guidance
   */
  private static getComplexityGuidance(
    stepComplexity: ComplexityLevel,
    workflowState: WorkflowState
  ): string {
    const userLevel = workflowState.userProgress.currentComplexityLevel;

    if (stepComplexity === userLevel) {
      return "This step matches your current experience level.";
    }

    if (stepComplexity < userLevel) {
      return "This is a foundational step that will be quick to complete.";
    }

    return "This step introduces more advanced concepts - take your time and use the help resources.";
  }

  /**
   * Get default help content for step
   */
  private static getDefaultHelpContent(step: WorkflowStep): string {
    return step.metadata?.helpText || 
           step.description || 
           `This step involves ${step.title.toLowerCase()}. Use the available tools and visualizations to complete your analysis.`;
  }

  /**
   * Get contextual links based on step and workflow state
   */
  private static getContextualLinks(
    step: WorkflowStep,
    workflowState: WorkflowState
  ): Array<{ label: string; url: string; external?: boolean }> {
    const links = [];

    // Add category-specific help links
    switch (step.category) {
      case WorkflowCategory.TERRAIN_ANALYSIS:
        links.push({
          label: 'Terrain Analysis Guide',
          url: '/help/terrain-analysis',
          external: false
        });
        break;
      case WorkflowCategory.WIND_ANALYSIS:
        links.push({
          label: 'Wind Resource Assessment',
          url: '/help/wind-analysis',
          external: false
        });
        break;
      case WorkflowCategory.LAYOUT_OPTIMIZATION:
        links.push({
          label: 'Layout Optimization Best Practices',
          url: '/help/layout-optimization',
          external: false
        });
        break;
    }

    // Add complexity-specific links
    if (workflowState.userProgress.currentComplexityLevel === ComplexityLevel.BASIC) {
      links.push({
        label: 'Getting Started Guide',
        url: '/help/getting-started',
        external: false
      });
    }

    return links;
  }

  /**
   * Create a simple call-to-action configuration
   */
  static createSimpleCallToAction(
    primaryLabel: string,
    primaryAction: string,
    guidance: string
  ): CallToActionConfig {
    return {
      position: 'bottom',
      buttons: [
        {
          id: 'primary_action',
          label: primaryLabel,
          action: primaryAction,
          variant: 'primary',
          icon: 'arrow-right'
        },
        {
          id: 'help_action',
          label: 'Get Help',
          action: 'request_help',
          variant: 'secondary',
          icon: 'status-info'
        }
      ],
      guidance,
      priority: 'medium',
      showProgress: true
    };
  }

  /**
   * Create a completion call-to-action configuration
   */
  static createCompletionCallToAction(
    nextSteps: string[],
    guidance: string = "Great job! Choose your next step:"
  ): CallToActionConfig {
    const buttons: ActionButton[] = nextSteps.slice(0, 3).map((stepId, index) => ({
      id: `next_${stepId}`,
      label: this.getNextStepLabel(stepId),
      action: stepId,
      variant: index === 0 ? 'primary' : 'secondary',
      icon: 'arrow-right'
    }));

    return {
      position: 'bottom',
      buttons,
      guidance,
      priority: 'high',
      showProgress: true
    };
  }
}

export default CallToActionService;