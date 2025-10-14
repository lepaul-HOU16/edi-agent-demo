/**
 * Progressive Disclosure Workflow System Types
 * 
 * Defines interfaces and types for the renewable energy analysis workflow
 * that guides users through step-by-step analysis with progressive complexity.
 */

import { ReactComponentType } from 'react';

// ============================================================================
// Core Workflow Types
// ============================================================================

/**
 * Workflow step definition with prerequisites and next steps
 */
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  category: WorkflowCategory;
  component: ReactComponentType<WorkflowStepProps>;
  nextSteps: string[]; // IDs of next possible steps
  prerequisites: string[]; // IDs of required previous steps
  callToAction: CallToActionConfig;
  complexity: ComplexityLevel;
  estimatedDuration: number; // in minutes
  isOptional?: boolean;
  metadata?: WorkflowStepMetadata;
}

/**
 * Workflow categories for organizing steps
 */
export enum WorkflowCategory {
  SITE_SELECTION = 'site_selection',
  TERRAIN_ANALYSIS = 'terrain_analysis',
  WIND_ANALYSIS = 'wind_analysis',
  LAYOUT_OPTIMIZATION = 'layout_optimization',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  REPORTING = 'reporting'
}

/**
 * Complexity levels for progressive disclosure
 */
export enum ComplexityLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Workflow step metadata
 */
export interface WorkflowStepMetadata {
  requirements: string[]; // Requirement IDs from spec
  helpText?: string;
  warningText?: string;
  successCriteria?: string[];
  commonIssues?: string[];
}

/**
 * Props passed to workflow step components
 */
export interface WorkflowStepProps {
  stepId: string;
  workflowState: WorkflowState;
  onStepComplete: (stepId: string, results: WorkflowStepResults) => void;
  onAdvanceWorkflow: (nextStepId: string) => void;
  onRequestHelp: (stepId: string, context?: any) => void;
}

/**
 * Results returned from a completed workflow step
 */
export interface WorkflowStepResults {
  stepId: string;
  success: boolean;
  data: any;
  artifacts?: any[];
  nextRecommendedStep?: string;
  userNotes?: string;
}

// ============================================================================
// Call-to-Action System
// ============================================================================

/**
 * Configuration for call-to-action buttons and guidance
 */
export interface CallToActionConfig {
  position: 'bottom' | 'inline' | 'floating';
  buttons: ActionButton[];
  guidance: string;
  priority: 'high' | 'medium' | 'low';
  showProgress?: boolean;
  contextualHelp?: ContextualHelp;
}

/**
 * Action button configuration
 */
export interface ActionButton {
  id: string;
  label: string;
  action: string; // Next step ID or action type
  variant: 'primary' | 'secondary' | 'tertiary';
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

/**
 * Contextual help configuration
 */
export interface ContextualHelp {
  title: string;
  content: string;
  links?: HelpLink[];
  videoUrl?: string;
  expandable?: boolean;
}

/**
 * Help link configuration
 */
export interface HelpLink {
  label: string;
  url: string;
  external?: boolean;
}

// ============================================================================
// Workflow State Management
// ============================================================================

/**
 * Current state of the workflow
 */
export interface WorkflowState {
  currentStepId: string | null;
  completedSteps: string[];
  availableSteps: string[];
  stepResults: Record<string, WorkflowStepResults>;
  userProgress: UserProgress;
  sessionData: WorkflowSessionData;
  preferences: WorkflowPreferences;
}

/**
 * User progress tracking
 */
export interface UserProgress {
  totalSteps: number;
  completedSteps: number;
  currentComplexityLevel: ComplexityLevel;
  unlockedFeatures: string[];
  achievements: Achievement[];
  timeSpent: number; // in minutes
  lastActiveStep: string | null;
  lastActiveTime: Date;
}

/**
 * Workflow session data
 */
export interface WorkflowSessionData {
  sessionId: string;
  projectId?: string;
  coordinates?: { lat: number; lng: number };
  projectName?: string;
  analysisType?: string;
  sharedData: Record<string, any>; // Data shared between steps
}

/**
 * User workflow preferences
 */
export interface WorkflowPreferences {
  showHelpByDefault: boolean;
  autoAdvanceSteps: boolean;
  complexityPreference: ComplexityLevel;
  skipOptionalSteps: boolean;
  enableNotifications: boolean;
  preferredVisualizationTypes: string[];
}

/**
 * Achievement for gamification
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: string;
}

// ============================================================================
// Progressive Disclosure System
// ============================================================================

/**
 * Progressive disclosure configuration
 */
export interface ProgressiveDisclosureConfig {
  revealTriggers: RevealTrigger[];
  complexityGates: ComplexityGate[];
  featureUnlocks: FeatureUnlock[];
  adaptiveGuidance: AdaptiveGuidanceConfig;
}

/**
 * Trigger for revealing new features or complexity
 */
export interface RevealTrigger {
  id: string;
  type: 'step_completion' | 'user_action' | 'data_threshold' | 'time_based';
  condition: RevealCondition;
  reveals: string[]; // Feature IDs or step IDs to reveal
  priority: number;
}

/**
 * Condition for reveal triggers
 */
export interface RevealCondition {
  stepIds?: string[];
  userActions?: string[];
  dataThresholds?: Record<string, number>;
  timeThresholds?: number;
  complexityLevel?: ComplexityLevel;
  customCondition?: (state: WorkflowState) => boolean;
}

/**
 * Complexity gate for controlling feature access
 */
export interface ComplexityGate {
  id: string;
  requiredLevel: ComplexityLevel;
  features: string[];
  unlockCriteria: UnlockCriteria;
  description: string;
}

/**
 * Criteria for unlocking complexity gates
 */
export interface UnlockCriteria {
  completedSteps: string[];
  minimumSuccessRate: number;
  timeSpentMinutes: number;
  userRequest?: boolean;
}

/**
 * Feature unlock configuration
 */
export interface FeatureUnlock {
  featureId: string;
  name: string;
  description: string;
  unlockCondition: RevealCondition;
  category: string;
  complexityLevel: ComplexityLevel;
}

/**
 * Adaptive guidance configuration
 */
export interface AdaptiveGuidanceConfig {
  enabled: boolean;
  personalizeBasedOnProgress: boolean;
  suggestOptimalPath: boolean;
  highlightRecommendedActions: boolean;
  provideContextualTips: boolean;
}

// ============================================================================
// Workflow Navigation
// ============================================================================

/**
 * Navigation state for workflow progress
 */
export interface WorkflowNavigation {
  currentPath: string[];
  availablePaths: WorkflowPath[];
  recommendedPath: string[];
  userChosenPath: string[];
  branchingPoints: BranchingPoint[];
}

/**
 * Workflow path definition
 */
export interface WorkflowPath {
  id: string;
  name: string;
  description: string;
  steps: string[];
  estimatedDuration: number;
  difficulty: ComplexityLevel;
  outcomes: string[];
}

/**
 * Branching point in workflow
 */
export interface BranchingPoint {
  stepId: string;
  title: string;
  description: string;
  options: BranchingOption[];
  defaultOption?: string;
  allowMultiple?: boolean;
}

/**
 * Branching option
 */
export interface BranchingOption {
  id: string;
  label: string;
  description: string;
  nextSteps: string[];
  requirements?: string[];
  estimatedTime: number;
}

// ============================================================================
// Workflow Events
// ============================================================================

/**
 * Workflow event types
 */
export enum WorkflowEventType {
  STEP_STARTED = 'step_started',
  STEP_COMPLETED = 'step_completed',
  STEP_FAILED = 'step_failed',
  WORKFLOW_ADVANCED = 'workflow_advanced',
  FEATURE_UNLOCKED = 'feature_unlocked',
  HELP_REQUESTED = 'help_requested',
  USER_FEEDBACK = 'user_feedback',
  COMPLEXITY_CHANGED = 'complexity_changed'
}

/**
 * Workflow event
 */
export interface WorkflowEvent {
  type: WorkflowEventType;
  stepId?: string;
  timestamp: Date;
  data: any;
  userId?: string;
  sessionId: string;
}

/**
 * Workflow event handler
 */
export type WorkflowEventHandler = (event: WorkflowEvent) => void;

// ============================================================================
// Validation and Prerequisites
// ============================================================================

/**
 * Step validation result
 */
export interface StepValidationResult {
  isValid: boolean;
  missingPrerequisites: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Prerequisite checker function
 */
export type PrerequisiteChecker = (
  stepId: string,
  workflowState: WorkflowState
) => StepValidationResult;

// ============================================================================
// Export Types
// ============================================================================

export type ReactComponentType<P = {}> = React.ComponentType<P>;