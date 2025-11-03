/**
 * Progressive Disclosure Service
 * 
 * Manages progressive complexity revelation, feature unlocking, and adaptive guidance
 * based on user progress and workflow state.
 */

import {
  WorkflowState,
  WorkflowStep,
  ComplexityLevel,
  ProgressiveDisclosureConfig,
  RevealTrigger,
  ComplexityGate,
  FeatureUnlock,
  RevealCondition,
  UnlockCriteria,
  AdaptiveGuidanceConfig,
  Achievement
} from '../../types/workflow';

/**
 * Service for managing progressive disclosure and complexity revelation
 */
export class ProgressiveDisclosureService {
  private config: ProgressiveDisclosureConfig;

  constructor(config?: Partial<ProgressiveDisclosureConfig>) {
    this.config = {
      revealTriggers: [],
      complexityGates: [],
      featureUnlocks: [],
      adaptiveGuidance: {
        enabled: true,
        personalizeBasedOnProgress: true,
        suggestOptimalPath: true,
        highlightRecommendedActions: true,
        provideContextualTips: true
      },
      ...config
    };

    this.initializeDefaultConfiguration();
  }

  /**
   * Initialize default progressive disclosure configuration
   */
  private initializeDefaultConfiguration(): void {
    // Default complexity gates
    this.config.complexityGates = [
      {
        id: 'intermediate_gate',
        requiredLevel: ComplexityLevel.INTERMEDIATE,
        features: ['advanced_terrain_analysis', 'custom_wind_data', 'detailed_wake_modeling'],
        unlockCriteria: {
          completedSteps: ['site_selection', 'basic_terrain_analysis', 'wind_resource_assessment'],
          minimumSuccessRate: 0.8,
          timeSpentMinutes: 30,
          userRequest: false
        },
        description: 'Unlock intermediate analysis features with more customization options'
      },
      {
        id: 'advanced_gate',
        requiredLevel: ComplexityLevel.ADVANCED,
        features: ['optimization_algorithms', 'sensitivity_analysis', 'multi_scenario_comparison'],
        unlockCriteria: {
          completedSteps: ['terrain_analysis', 'wind_analysis', 'layout_optimization'],
          minimumSuccessRate: 0.85,
          timeSpentMinutes: 60,
          userRequest: false
        },
        description: 'Access advanced optimization and analysis capabilities'
      },
      {
        id: 'expert_gate',
        requiredLevel: ComplexityLevel.EXPERT,
        features: ['custom_algorithms', 'api_integration', 'batch_processing'],
        unlockCriteria: {
          completedSteps: ['advanced_layout_optimization', 'performance_analysis', 'comprehensive_reporting'],
          minimumSuccessRate: 0.9,
          timeSpentMinutes: 120,
          userRequest: true
        },
        description: 'Expert-level features for power users and professionals'
      }
    ];

    // Default reveal triggers
    this.config.revealTriggers = [
      {
        id: 'terrain_completion_trigger',
        type: 'step_completion',
        condition: {
          stepIds: ['terrain_analysis']
        },
        reveals: ['wind_analysis_options', 'layout_preview'],
        priority: 1
      },
      {
        id: 'wind_analysis_trigger',
        type: 'step_completion',
        condition: {
          stepIds: ['wind_analysis']
        },
        reveals: ['wake_modeling_options', 'turbine_selection'],
        priority: 1
      },
      {
        id: 'layout_optimization_trigger',
        type: 'step_completion',
        condition: {
          stepIds: ['layout_optimization']
        },
        reveals: ['performance_prediction', 'economic_analysis'],
        priority: 1
      },
      {
        id: 'experience_trigger',
        type: 'time_based',
        condition: {
          timeThresholds: 45 // 45 minutes
        },
        reveals: ['advanced_features_preview', 'complexity_upgrade_option'],
        priority: 2
      }
    ];

    // Default feature unlocks
    this.config.featureUnlocks = [
      {
        featureId: 'advanced_terrain_analysis',
        name: 'Advanced Terrain Analysis',
        description: 'Detailed topographic analysis with custom elevation models',
        unlockCondition: {
          stepIds: ['terrain_analysis'],
          complexityLevel: ComplexityLevel.INTERMEDIATE
        },
        category: 'terrain',
        complexityLevel: ComplexityLevel.INTERMEDIATE
      },
      {
        featureId: 'wake_modeling_options',
        name: 'Wake Modeling Options',
        description: 'Multiple wake models and validation options',
        unlockCondition: {
          stepIds: ['wind_analysis'],
          complexityLevel: ComplexityLevel.INTERMEDIATE
        },
        category: 'analysis',
        complexityLevel: ComplexityLevel.INTERMEDIATE
      },
      {
        featureId: 'optimization_algorithms',
        name: 'Optimization Algorithms',
        description: 'Advanced genetic algorithms and multi-objective optimization',
        unlockCondition: {
          stepIds: ['layout_optimization'],
          complexityLevel: ComplexityLevel.ADVANCED
        },
        category: 'optimization',
        complexityLevel: ComplexityLevel.ADVANCED
      }
    ];
  }

  /**
   * Evaluate current workflow state and determine what should be revealed
   */
  evaluateDisclosure(workflowState: WorkflowState): {
    newFeatures: string[];
    complexityUpgrade: ComplexityLevel | null;
    achievements: Achievement[];
    recommendations: string[];
  } {
    const newFeatures: string[] = [];
    let complexityUpgrade: ComplexityLevel | null = null;
    const achievements: Achievement[] = [];
    const recommendations: string[] = [];

    // Check reveal triggers
    for (const trigger of this.config.revealTriggers) {
      if (this.evaluateRevealCondition(trigger.condition, workflowState)) {
        newFeatures.push(...trigger.reveals);
      }
    }

    // Check complexity gates
    const availableUpgrade = this.checkComplexityUpgrade(workflowState);
    if (availableUpgrade) {
      complexityUpgrade = availableUpgrade;
    }

    // Check for new achievements
    const newAchievements = this.checkAchievements(workflowState);
    achievements.push(...newAchievements);

    // Generate recommendations
    const adaptiveRecommendations = this.generateRecommendations(workflowState);
    recommendations.push(...adaptiveRecommendations);

    return {
      newFeatures: [...new Set(newFeatures)], // Remove duplicates
      complexityUpgrade,
      achievements,
      recommendations
    };
  }

  /**
   * Check if user is eligible for complexity level upgrade
   */
  checkComplexityUpgrade(workflowState: WorkflowState): ComplexityLevel | null {
    const currentLevel = workflowState.userProgress.currentComplexityLevel;
    const currentIndex = Object.values(ComplexityLevel).indexOf(currentLevel);
    
    if (currentIndex >= Object.values(ComplexityLevel).length - 1) {
      return null; // Already at highest level
    }

    const nextLevel = Object.values(ComplexityLevel)[currentIndex + 1];
    const gate = this.config.complexityGates.find(g => g.requiredLevel === nextLevel);
    
    if (!gate) return null;

    if (this.evaluateUnlockCriteria(gate.unlockCriteria, workflowState)) {
      return nextLevel;
    }

    return null;
  }

  /**
   * Evaluate reveal condition
   */
  private evaluateRevealCondition(condition: RevealCondition, workflowState: WorkflowState): boolean {
    // Check step completion
    if (condition.stepIds) {
      const hasRequiredSteps = condition.stepIds.every(stepId => 
        workflowState.completedSteps.includes(stepId)
      );
      if (!hasRequiredSteps) return false;
    }

    // Check time thresholds
    if (condition.timeThresholds) {
      if (workflowState.userProgress.timeSpent < condition.timeThresholds) {
        return false;
      }
    }

    // Check complexity level
    if (condition.complexityLevel) {
      const currentIndex = Object.values(ComplexityLevel).indexOf(workflowState.userProgress.currentComplexityLevel);
      const requiredIndex = Object.values(ComplexityLevel).indexOf(condition.complexityLevel);
      if (currentIndex < requiredIndex) return false;
    }

    // Check custom condition
    if (condition.customCondition) {
      return condition.customCondition(workflowState);
    }

    return true;
  }

  /**
   * Evaluate unlock criteria
   */
  private evaluateUnlockCriteria(criteria: UnlockCriteria, workflowState: WorkflowState): boolean {
    // Check completed steps
    const hasRequiredSteps = criteria.completedSteps.every(stepId => 
      workflowState.completedSteps.includes(stepId)
    );
    if (!hasRequiredSteps) return false;

    // Check success rate (simplified - assume all completed steps were successful)
    const successRate = workflowState.completedSteps.length > 0 ? 1.0 : 0.0;
    if (successRate < criteria.minimumSuccessRate) return false;

    // Check time spent
    if (workflowState.userProgress.timeSpent < criteria.timeSpentMinutes) return false;

    // If user request is required, this would be handled separately
    // For now, assume it's satisfied if not explicitly required
    
    return true;
  }

  /**
   * Check for new achievements
   */
  private checkAchievements(workflowState: WorkflowState): Achievement[] {
    const achievements: Achievement[] = [];
    const existingAchievementIds = workflowState.userProgress.achievements.map(a => a.id);

    // First step achievement
    if (workflowState.completedSteps.length === 1 && !existingAchievementIds.includes('first_step')) {
      achievements.push({
        id: 'first_step',
        title: 'Getting Started',
        description: 'Completed your first analysis step',
        icon: 'status-positive',
        unlockedAt: new Date(),
        category: 'progress'
      });
    }

    // Speed achievement
    if (workflowState.completedSteps.length >= 3 && 
        workflowState.userProgress.timeSpent <= 20 && 
        !existingAchievementIds.includes('speed_demon')) {
      achievements.push({
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Completed 3 steps in under 20 minutes',
        icon: 'notification',
        unlockedAt: new Date(),
        category: 'efficiency'
      });
    }

    // Thoroughness achievement
    if (workflowState.completedSteps.length >= 5 && 
        !existingAchievementIds.includes('thorough_analyst')) {
      achievements.push({
        id: 'thorough_analyst',
        title: 'Thorough Analyst',
        description: 'Completed comprehensive analysis workflow',
        icon: 'status-info',
        unlockedAt: new Date(),
        category: 'completeness'
      });
    }

    return achievements;
  }

  /**
   * Generate adaptive recommendations
   */
  private generateRecommendations(workflowState: WorkflowState): string[] {
    const recommendations: string[] = [];

    if (!this.config.adaptiveGuidance.enabled) {
      return recommendations;
    }

    // Progress-based recommendations
    if (this.config.adaptiveGuidance.personalizeBasedOnProgress) {
      const completionRate = workflowState.userProgress.completedSteps / workflowState.userProgress.totalSteps;
      
      if (completionRate < 0.3) {
        recommendations.push('Focus on completing the foundational analysis steps first');
      } else if (completionRate < 0.7) {
        recommendations.push('You\'re making great progress! Consider exploring advanced features');
      } else {
        recommendations.push('You\'re almost done! Complete the remaining steps for a comprehensive analysis');
      }
    }

    // Optimal path suggestions
    if (this.config.adaptiveGuidance.suggestOptimalPath) {
      const timePerStep = workflowState.userProgress.timeSpent / Math.max(workflowState.completedSteps.length, 1);
      
      if (timePerStep > 15) {
        recommendations.push('Consider using the guided mode for faster completion');
      } else if (timePerStep < 5) {
        recommendations.push('You might benefit from exploring advanced options in each step');
      }
    }

    // Contextual tips
    if (this.config.adaptiveGuidance.provideContextualTips) {
      if (workflowState.userProgress.currentComplexityLevel === ComplexityLevel.BASIC) {
        recommendations.push('Tip: Use the help panels for detailed guidance on each step');
      } else if (workflowState.userProgress.currentComplexityLevel === ComplexityLevel.ADVANCED) {
        recommendations.push('Tip: Try the sensitivity analysis features for more robust results');
      }
    }

    return recommendations;
  }

  /**
   * Get available features for current complexity level
   */
  getAvailableFeatures(workflowState: WorkflowState): string[] {
    const currentLevel = workflowState.userProgress.currentComplexityLevel;
    const availableFeatures: string[] = [];

    // Add features from unlocked complexity gates
    for (const gate of this.config.complexityGates) {
      const gateIndex = Object.values(ComplexityLevel).indexOf(gate.requiredLevel);
      const currentIndex = Object.values(ComplexityLevel).indexOf(currentLevel);
      
      if (currentIndex >= gateIndex) {
        availableFeatures.push(...gate.features);
      }
    }

    // Add individually unlocked features
    for (const featureUnlock of this.config.featureUnlocks) {
      if (this.evaluateRevealCondition(featureUnlock.unlockCondition, workflowState)) {
        availableFeatures.push(featureUnlock.featureId);
      }
    }

    return [...new Set(availableFeatures)];
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(featureId: string, workflowState: WorkflowState): boolean {
    const availableFeatures = this.getAvailableFeatures(workflowState);
    return availableFeatures.includes(featureId);
  }

  /**
   * Get feature unlock requirements
   */
  getFeatureUnlockRequirements(featureId: string): FeatureUnlock | null {
    return this.config.featureUnlocks.find(unlock => unlock.featureId === featureId) || null;
  }

  /**
   * Get next complexity level requirements
   */
  getNextComplexityRequirements(workflowState: WorkflowState): ComplexityGate | null {
    const currentLevel = workflowState.userProgress.currentComplexityLevel;
    const currentIndex = Object.values(ComplexityLevel).indexOf(currentLevel);
    
    if (currentIndex >= Object.values(ComplexityLevel).length - 1) {
      return null; // Already at highest level
    }

    const nextLevel = Object.values(ComplexityLevel)[currentIndex + 1];
    return this.config.complexityGates.find(gate => gate.requiredLevel === nextLevel) || null;
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<ProgressiveDisclosureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to default configuration
   */
  resetConfiguration(): void {
    this.config = {
      revealTriggers: [],
      complexityGates: [],
      featureUnlocks: [],
      adaptiveGuidance: {
        enabled: true,
        personalizeBasedOnProgress: true,
        suggestOptimalPath: true,
        highlightRecommendedActions: true,
        provideContextualTips: true
      }
    };
    this.initializeDefaultConfiguration();
  }
}

export default ProgressiveDisclosureService;