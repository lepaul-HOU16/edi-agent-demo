'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ProgressBar,
  Alert,
  Button,
  Modal,
  Tabs,
  TabsProps
} from '@cloudscape-design/components';
import {
  WorkflowStep,
  WorkflowState,
  WorkflowEventType,
  WorkflowEvent,
  WorkflowStepResults,
  ComplexityLevel,
  UserProgress,
  WorkflowNavigation,
  StepValidationResult
} from '../../types/workflow';
import { WorkflowStepComponent } from './WorkflowStepComponent';
import { CallToActionPanel } from './CallToActionPanel';
import { ProgressIndicator } from './ProgressIndicator';
import { WorkflowHelpPanel } from './WorkflowHelpPanel';

/**
 * Props for WorkflowOrchestrator component
 */
interface WorkflowOrchestratorProps {
  workflowDefinition: WorkflowStep[];
  initialStepId?: string;
  projectId?: string;
  coordinates?: { lat: number; lng: number };
  onWorkflowComplete?: (results: Record<string, WorkflowStepResults>) => void;
  onWorkflowEvent?: (event: WorkflowEvent) => void;
  className?: string;
}

/**
 * Main workflow orchestrator component that manages the renewable energy analysis workflow
 * with progressive disclosure and step-by-step guidance.
 */
export const WorkflowOrchestrator: React.FC<WorkflowOrchestratorProps> = ({
  workflowDefinition,
  initialStepId,
  projectId,
  coordinates,
  onWorkflowComplete,
  onWorkflowEvent,
  className
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [workflowState, setWorkflowState] = useState<WorkflowState>(() => ({
    currentStepId: initialStepId || null,
    completedSteps: [],
    availableSteps: workflowDefinition
      .filter(step => step.prerequisites.length === 0)
      .map(step => step.id),
    stepResults: {},
    userProgress: {
      totalSteps: workflowDefinition.length,
      completedSteps: 0,
      currentComplexityLevel: ComplexityLevel.BASIC,
      unlockedFeatures: [],
      achievements: [],
      timeSpent: 0,
      lastActiveStep: null,
      lastActiveTime: new Date()
    },
    sessionData: {
      sessionId: `workflow_${Date.now()}`,
      projectId,
      coordinates,
      projectName: `Renewable Analysis ${new Date().toLocaleDateString()}`,
      analysisType: 'comprehensive',
      sharedData: {}
    },
    preferences: {
      showHelpByDefault: true,
      autoAdvanceSteps: false,
      complexityPreference: ComplexityLevel.BASIC,
      skipOptionalSteps: false,
      enableNotifications: true,
      preferredVisualizationTypes: []
    }
  }));

  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentStepStartTime, setCurrentStepStartTime] = useState<Date | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const currentStep = useMemo(() => {
    if (!workflowState.currentStepId) return null;
    return workflowDefinition.find(step => step.id === workflowState.currentStepId) || null;
  }, [workflowState.currentStepId, workflowDefinition]);

  const workflowNavigation = useMemo<WorkflowNavigation>(() => {
    const completedPath = workflowState.completedSteps;
    const currentPath = workflowState.currentStepId 
      ? [...completedPath, workflowState.currentStepId]
      : completedPath;

    return {
      currentPath,
      availablePaths: [], // TODO: Implement path calculation
      recommendedPath: [], // TODO: Implement recommendation logic
      userChosenPath: currentPath,
      branchingPoints: [] // TODO: Implement branching points
    };
  }, [workflowState.completedSteps, workflowState.currentStepId]);

  const progressPercentage = useMemo(() => {
    return Math.round((workflowState.userProgress.completedSteps / workflowState.userProgress.totalSteps) * 100);
  }, [workflowState.userProgress.completedSteps, workflowState.userProgress.totalSteps]);

  // ============================================================================
  // Event Handling
  // ============================================================================

  const emitWorkflowEvent = useCallback((type: WorkflowEventType, data: any, stepId?: string) => {
    const event: WorkflowEvent = {
      type,
      stepId,
      timestamp: new Date(),
      data,
      sessionId: workflowState.sessionData.sessionId
    };

    onWorkflowEvent?.(event);
  }, [onWorkflowEvent, workflowState.sessionData.sessionId]);

  // ============================================================================
  // Step Validation
  // ============================================================================

  const validateStepPrerequisites = useCallback((stepId: string): StepValidationResult => {
    const step = workflowDefinition.find(s => s.id === stepId);
    if (!step) {
      return {
        isValid: false,
        missingPrerequisites: [],
        warnings: [`Step ${stepId} not found`],
        recommendations: []
      };
    }

    const missingPrerequisites = step.prerequisites.filter(
      prereqId => !workflowState.completedSteps.includes(prereqId)
    );

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check complexity level
    if (step.complexity > workflowState.userProgress.currentComplexityLevel) {
      warnings.push(`This step requires ${step.complexity} complexity level`);
      recommendations.push('Complete more basic steps to unlock advanced features');
    }

    return {
      isValid: missingPrerequisites.length === 0,
      missingPrerequisites,
      warnings,
      recommendations
    };
  }, [workflowDefinition, workflowState.completedSteps, workflowState.userProgress.currentComplexityLevel]);

  // ============================================================================
  // Step Management
  // ============================================================================

  const startStep = useCallback((stepId: string) => {
    const validation = validateStepPrerequisites(stepId);
    if (!validation.isValid) {
      console.warn('Cannot start step due to missing prerequisites:', validation);
      return;
    }

    setWorkflowState(prev => ({
      ...prev,
      currentStepId: stepId,
      userProgress: {
        ...prev.userProgress,
        lastActiveStep: stepId,
        lastActiveTime: new Date()
      }
    }));

    setCurrentStepStartTime(new Date());
    emitWorkflowEvent(WorkflowEventType.STEP_STARTED, { stepId });
  }, [validateStepPrerequisites, emitWorkflowEvent]);

  const completeStep = useCallback((stepId: string, results: WorkflowStepResults) => {
    const stepDuration = currentStepStartTime 
      ? (new Date().getTime() - currentStepStartTime.getTime()) / (1000 * 60)
      : 0;

    setWorkflowState(prev => {
      const newCompletedSteps = [...prev.completedSteps];
      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId);
      }

      // Calculate newly available steps
      const newAvailableSteps = workflowDefinition
        .filter(step => 
          !newCompletedSteps.includes(step.id) &&
          step.prerequisites.every(prereq => newCompletedSteps.includes(prereq))
        )
        .map(step => step.id);

      // Update shared data
      const newSharedData = { ...prev.sessionData.sharedData };
      if (results.data) {
        newSharedData[stepId] = results.data;
      }

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        availableSteps: newAvailableSteps,
        stepResults: {
          ...prev.stepResults,
          [stepId]: results
        },
        userProgress: {
          ...prev.userProgress,
          completedSteps: newCompletedSteps.length,
          timeSpent: prev.userProgress.timeSpent + stepDuration
        },
        sessionData: {
          ...prev.sessionData,
          sharedData: newSharedData
        }
      };
    });

    emitWorkflowEvent(WorkflowEventType.STEP_COMPLETED, { stepId, results, duration: stepDuration });

    // Check if workflow is complete
    const allRequiredSteps = workflowDefinition.filter(step => !step.isOptional);
    const completedRequiredSteps = allRequiredSteps.filter(step => 
      workflowState.completedSteps.includes(step.id) || step.id === stepId
    );

    if (completedRequiredSteps.length === allRequiredSteps.length) {
      onWorkflowComplete?.(workflowState.stepResults);
    }
  }, [currentStepStartTime, workflowDefinition, workflowState.completedSteps, workflowState.stepResults, emitWorkflowEvent, onWorkflowComplete]);

  const advanceWorkflow = useCallback((nextStepId: string) => {
    const validation = validateStepPrerequisites(nextStepId);
    if (!validation.isValid) {
      console.warn('Cannot advance to step due to missing prerequisites:', validation);
      return;
    }

    startStep(nextStepId);
    emitWorkflowEvent(WorkflowEventType.WORKFLOW_ADVANCED, { 
      fromStep: workflowState.currentStepId,
      toStep: nextStepId 
    });
  }, [validateStepPrerequisites, startStep, emitWorkflowEvent, workflowState.currentStepId]);

  const requestHelp = useCallback((stepId: string, context?: any) => {
    setShowHelpPanel(true);
    emitWorkflowEvent(WorkflowEventType.HELP_REQUESTED, { stepId, context });
  }, [emitWorkflowEvent]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    // Auto-start first available step if no current step
    if (!workflowState.currentStepId && workflowState.availableSteps.length > 0) {
      startStep(workflowState.availableSteps[0]);
    }
  }, [workflowState.currentStepId, workflowState.availableSteps, startStep]);

  // ============================================================================
  // Render
  // ============================================================================

  const tabs: TabsProps.Tab[] = [
    {
      id: 'workflow',
      label: 'Analysis Workflow',
      content: (
        <SpaceBetween direction="vertical" size="l">
          {/* Progress Indicator */}
          <ProgressIndicator
            workflowState={workflowState}
            workflowDefinition={workflowDefinition}
            onStepClick={startStep}
          />

          {/* Current Step Component */}
          {currentStep && (
            <WorkflowStepComponent
              step={currentStep}
              workflowState={workflowState}
              onStepComplete={completeStep}
              onAdvanceWorkflow={advanceWorkflow}
              onRequestHelp={requestHelp}
            />
          )}

          {/* Call-to-Action Panel */}
          {currentStep && (
            <CallToActionPanel
              step={currentStep}
              workflowState={workflowState}
              onAdvanceWorkflow={advanceWorkflow}
              onRequestHelp={requestHelp}
            />
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'progress',
      label: 'Progress Overview',
      content: (
        <Container>
          <SpaceBetween direction="vertical" size="m">
            <Header variant="h3">Workflow Progress</Header>
            <ProgressBar
              value={progressPercentage}
              label="Overall Progress"
              description={`${workflowState.userProgress.completedSteps} of ${workflowState.userProgress.totalSteps} steps completed`}
            />
            <Box>
              <strong>Time Spent:</strong> {Math.round(workflowState.userProgress.timeSpent)} minutes
            </Box>
            <Box>
              <strong>Current Complexity Level:</strong> {workflowState.userProgress.currentComplexityLevel}
            </Box>
          </SpaceBetween>
        </Container>
      )
    }
  ];

  return (
    <div className={className}>
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header
            variant="h1"
            actions={
              <SpaceBetween direction="horizontal" size="s">
                <Button
                  iconName="status-info"
                  onClick={() => setShowHelpPanel(true)}
                >
                  Help
                </Button>
                <Button
                  iconName="timeline-events"
                  onClick={() => setShowProgressModal(true)}
                >
                  Progress
                </Button>
              </SpaceBetween>
            }
          >
            Renewable Energy Analysis Workflow
          </Header>

          {/* Main Workflow Tabs */}
          <Tabs tabs={tabs} />
        </SpaceBetween>
      </Container>

      {/* Help Panel Modal */}
      <Modal
        visible={showHelpPanel}
        onDismiss={() => setShowHelpPanel(false)}
        header="Workflow Help"
        size="large"
      >
        <WorkflowHelpPanel
          currentStep={currentStep}
          workflowState={workflowState}
          workflowDefinition={workflowDefinition}
        />
      </Modal>

      {/* Progress Modal */}
      <Modal
        visible={showProgressModal}
        onDismiss={() => setShowProgressModal(false)}
        header="Detailed Progress"
        size="medium"
      >
        <SpaceBetween direction="vertical" size="m">
          <ProgressBar
            value={progressPercentage}
            label="Overall Progress"
          />
          <Box>
            <strong>Completed Steps:</strong>
            <ul>
              {workflowState.completedSteps.map(stepId => {
                const step = workflowDefinition.find(s => s.id === stepId);
                return (
                  <li key={stepId}>
                    {step?.title || stepId}
                  </li>
                );
              })}
            </ul>
          </Box>
        </SpaceBetween>
      </Modal>
    </div>
  );
};

export default WorkflowOrchestrator;