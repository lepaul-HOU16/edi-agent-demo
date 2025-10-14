/**
 * Renewable Energy Workflow Definition
 * 
 * Defines the complete renewable energy analysis workflow with progressive disclosure
 */

import {
  WorkflowStep,
  WorkflowCategory,
  ComplexityLevel,
  CallToActionConfig
} from '../types/workflow';
import { CallToActionService } from '../services/workflow/CallToActionService';

// Import workflow step components
import SiteSelectionStep from '../components/renewable/workflow-steps/SiteSelectionStep';
// Note: Other step components would be imported here as they are implemented

/**
 * Complete renewable energy workflow definition
 */
export const renewableWorkflowDefinition: WorkflowStep[] = [
  // ============================================================================
  // Site Selection Phase
  // ============================================================================
  {
    id: 'site_selection',
    title: 'Site Selection',
    description: 'Select and validate the geographic location for renewable energy analysis',
    category: WorkflowCategory.SITE_SELECTION,
    component: SiteSelectionStep,
    nextSteps: ['terrain_analysis', 'wind_resource_assessment'],
    prerequisites: [],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Select Site Location',
      'complete_site_selection',
      'Choose the geographic coordinates for your renewable energy project. This will be the foundation for all subsequent analysis.'
    ),
    complexity: ComplexityLevel.BASIC,
    estimatedDuration: 5,
    isOptional: false,
    metadata: {
      requirements: ['8.1', '8.2', '10.1', '10.2'],
      helpText: 'Start by entering the latitude and longitude coordinates of your proposed site. You can use mapping tools or GPS coordinates.',
      successCriteria: [
        'Valid coordinates entered',
        'Project name specified',
        'Site location validated'
      ],
      commonIssues: [
        'Invalid coordinate format - use decimal degrees',
        'Coordinates outside valid range (-90 to 90 for latitude, -180 to 180 for longitude)',
        'Missing project name'
      ]
    }
  },

  // ============================================================================
  // Terrain Analysis Phase
  // ============================================================================
  {
    id: 'terrain_analysis',
    title: 'Terrain Analysis',
    description: 'Analyze terrain features, topography, and site constraints using OpenStreetMap data',
    category: WorkflowCategory.TERRAIN_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be TerrainAnalysisStep
    nextSteps: ['wind_analysis', 'layout_optimization'],
    prerequisites: ['site_selection'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Analyze Terrain',
      'complete_terrain_analysis',
      'Examine the terrain features and constraints at your selected site. This analysis will identify exclusion zones and optimal areas for turbine placement.'
    ),
    complexity: ComplexityLevel.BASIC,
    estimatedDuration: 10,
    isOptional: false,
    metadata: {
      requirements: ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6'],
      helpText: 'This step retrieves real terrain data from OpenStreetMap and analyzes features like buildings, roads, water bodies, and elevation.',
      successCriteria: [
        'Terrain data retrieved successfully',
        'Feature classification completed',
        'Exclusion zones identified',
        'Terrain visualization generated'
      ],
      commonIssues: [
        'No terrain data available for remote locations',
        'Network connectivity issues with OpenStreetMap',
        'Large datasets may take time to process'
      ]
    }
  },

  // ============================================================================
  // Wind Analysis Phase
  // ============================================================================
  {
    id: 'wind_resource_assessment',
    title: 'Wind Resource Assessment',
    description: 'Assess wind resource potential and seasonal patterns',
    category: WorkflowCategory.WIND_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be WindAnalysisStep
    nextSteps: ['wind_rose_analysis', 'layout_optimization'],
    prerequisites: ['site_selection'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Assess Wind Resource',
      'complete_wind_assessment',
      'Evaluate the wind resource potential at your site including average wind speeds, seasonal patterns, and energy production estimates.'
    ),
    complexity: ComplexityLevel.BASIC,
    estimatedDuration: 8,
    isOptional: false,
    metadata: {
      requirements: ['9.1', '9.5'],
      helpText: 'Wind resource assessment provides the foundation for energy production estimates and turbine selection.',
      successCriteria: [
        'Wind data retrieved',
        'Average wind speeds calculated',
        'Seasonal patterns identified',
        'Energy potential estimated'
      ]
    }
  },

  {
    id: 'wind_rose_analysis',
    title: 'Wind Rose Analysis',
    description: 'Create detailed wind rose diagrams showing wind speed and direction distributions',
    category: WorkflowCategory.WIND_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be WindRoseStep
    nextSteps: ['wake_analysis', 'layout_optimization'],
    prerequisites: ['wind_resource_assessment'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Generate Wind Rose',
      'complete_wind_rose',
      'Create interactive wind rose diagrams to understand prevailing wind directions and optimize turbine orientation.'
    ),
    complexity: ComplexityLevel.INTERMEDIATE,
    estimatedDuration: 12,
    isOptional: false,
    metadata: {
      requirements: ['9.1', '9.5', '10.2', '10.3'],
      helpText: 'Wind rose analysis helps optimize turbine layout by understanding directional wind patterns.',
      successCriteria: [
        'Wind rose diagram generated',
        'Directional analysis completed',
        'Seasonal variations identified',
        'Optimization recommendations provided'
      ]
    }
  },

  // ============================================================================
  // Layout Optimization Phase
  // ============================================================================
  {
    id: 'layout_optimization',
    title: 'Layout Optimization',
    description: 'Optimize turbine placement for maximum energy yield while respecting constraints',
    category: WorkflowCategory.LAYOUT_OPTIMIZATION,
    component: SiteSelectionStep, // Placeholder - would be LayoutOptimizationStep
    nextSteps: ['wake_analysis', 'performance_analysis'],
    prerequisites: ['terrain_analysis'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Optimize Layout',
      'complete_layout_optimization',
      'Use advanced algorithms to find the optimal turbine placement that maximizes energy production while respecting terrain constraints.'
    ),
    complexity: ComplexityLevel.INTERMEDIATE,
    estimatedDuration: 15,
    isOptional: false,
    metadata: {
      requirements: ['9.3', '9.5', '7.1', '7.2', '7.3', '7.4'],
      helpText: 'Layout optimization balances energy production, wake losses, and site constraints to find the best turbine arrangement.',
      successCriteria: [
        'Optimization algorithm completed',
        'Turbine positions determined',
        'Energy yield calculated',
        'Constraint compliance verified'
      ]
    }
  },

  // ============================================================================
  // Performance Analysis Phase
  // ============================================================================
  {
    id: 'wake_analysis',
    title: 'Wake Analysis',
    description: 'Analyze wake effects and turbine interactions for performance optimization',
    category: WorkflowCategory.PERFORMANCE_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be WakeAnalysisStep
    nextSteps: ['performance_analysis', 'site_suitability_assessment'],
    prerequisites: ['layout_optimization'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Analyze Wake Effects',
      'complete_wake_analysis',
      'Examine how turbines affect each other through wake effects and optimize spacing for maximum efficiency.'
    ),
    complexity: ComplexityLevel.ADVANCED,
    estimatedDuration: 18,
    isOptional: false,
    metadata: {
      requirements: ['9.2', '9.5', '10.2', '10.3'],
      helpText: 'Wake analysis models how upstream turbines affect downstream turbines, crucial for optimizing energy production.',
      successCriteria: [
        'Wake modeling completed',
        'Turbine interactions analyzed',
        'Wake losses calculated',
        'Optimization recommendations generated'
      ]
    }
  },

  {
    id: 'performance_analysis',
    title: 'Performance Analysis',
    description: 'Comprehensive performance analysis including energy yield and capacity factors',
    category: WorkflowCategory.PERFORMANCE_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be PerformanceAnalysisStep
    nextSteps: ['site_suitability_assessment', 'comprehensive_reporting'],
    prerequisites: ['layout_optimization'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Analyze Performance',
      'complete_performance_analysis',
      'Calculate detailed performance metrics including annual energy production, capacity factors, and economic projections.'
    ),
    complexity: ComplexityLevel.ADVANCED,
    estimatedDuration: 20,
    isOptional: false,
    metadata: {
      requirements: ['9.2', '9.5', '7.1', '7.2'],
      helpText: 'Performance analysis provides detailed energy production forecasts and economic viability assessments.',
      successCriteria: [
        'Energy production calculated',
        'Capacity factors determined',
        'Performance metrics generated',
        'Economic analysis completed'
      ]
    }
  },

  // ============================================================================
  // Site Suitability Assessment
  // ============================================================================
  {
    id: 'site_suitability_assessment',
    title: 'Site Suitability Assessment',
    description: 'Comprehensive site assessment with professional scoring methodology',
    category: WorkflowCategory.PERFORMANCE_ANALYSIS,
    component: SiteSelectionStep, // Placeholder - would be SuitabilityAssessmentStep
    nextSteps: ['comprehensive_reporting'],
    prerequisites: ['terrain_analysis', 'wind_resource_assessment'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Assess Site Suitability',
      'complete_suitability_assessment',
      'Generate a comprehensive site suitability score based on wind resource, terrain, environmental, and economic factors.'
    ),
    complexity: ComplexityLevel.EXPERT,
    estimatedDuration: 25,
    isOptional: false,
    metadata: {
      requirements: ['9.4', '9.5', '6.1', '6.2', '6.3', '6.4', '6.5', '7.5'],
      helpText: 'Site suitability assessment provides a professional-grade evaluation of the site\'s potential for renewable energy development.',
      successCriteria: [
        'Suitability scoring completed',
        'Risk factors identified',
        'Development recommendations generated',
        'Comparative analysis available'
      ]
    }
  },

  // ============================================================================
  // Reporting Phase
  // ============================================================================
  {
    id: 'comprehensive_reporting',
    title: 'Comprehensive Reporting',
    description: 'Generate professional reports with executive summaries and detailed analysis',
    category: WorkflowCategory.REPORTING,
    component: SiteSelectionStep, // Placeholder - would be ReportingStep
    nextSteps: [],
    prerequisites: ['performance_analysis', 'site_suitability_assessment'],
    callToAction: CallToActionService.createSimpleCallToAction(
      'Generate Report',
      'complete_reporting',
      'Create comprehensive professional reports suitable for stakeholder presentations and decision-making.'
    ),
    complexity: ComplexityLevel.INTERMEDIATE,
    estimatedDuration: 10,
    isOptional: false,
    metadata: {
      requirements: ['12.1', '12.2', '12.3', '12.4', '12.5'],
      helpText: 'Generate professional reports that summarize all analysis results with executive summaries and detailed technical appendices.',
      successCriteria: [
        'Executive summary generated',
        'Technical report completed',
        'Visualizations included',
        'Export formats available'
      ]
    }
  }
];

/**
 * Get workflow step by ID
 */
export function getWorkflowStep(stepId: string): WorkflowStep | undefined {
  return renewableWorkflowDefinition.find(step => step.id === stepId);
}

/**
 * Get workflow steps by category
 */
export function getWorkflowStepsByCategory(category: WorkflowCategory): WorkflowStep[] {
  return renewableWorkflowDefinition.filter(step => step.category === category);
}

/**
 * Get workflow steps by complexity level
 */
export function getWorkflowStepsByComplexity(complexity: ComplexityLevel): WorkflowStep[] {
  return renewableWorkflowDefinition.filter(step => step.complexity === complexity);
}

/**
 * Get initial workflow step
 */
export function getInitialWorkflowStep(): WorkflowStep {
  return renewableWorkflowDefinition[0]; // site_selection
}

/**
 * Validate workflow definition
 */
export function validateWorkflowDefinition(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplicate IDs
  const stepIds = renewableWorkflowDefinition.map(step => step.id);
  const duplicateIds = stepIds.filter((id, index) => stepIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate step IDs found: ${duplicateIds.join(', ')}`);
  }
  
  // Check for invalid prerequisites
  for (const step of renewableWorkflowDefinition) {
    for (const prereqId of step.prerequisites) {
      if (!stepIds.includes(prereqId)) {
        errors.push(`Step ${step.id} has invalid prerequisite: ${prereqId}`);
      }
    }
    
    for (const nextStepId of step.nextSteps) {
      if (!stepIds.includes(nextStepId)) {
        warnings.push(`Step ${step.id} has invalid next step: ${nextStepId}`);
      }
    }
  }
  
  // Check for circular dependencies
  // TODO: Implement circular dependency detection
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default renewableWorkflowDefinition;