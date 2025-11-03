'use client';

import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Badge,
  ProgressBar
} from '@cloudscape-design/components';
import {
  WorkflowStep,
  WorkflowState,
  ComplexityLevel,
  WorkflowCategory
} from '../../types/workflow';

/**
 * Props for ProgressIndicator component
 */
interface ProgressIndicatorProps {
  workflowState: WorkflowState;
  workflowDefinition: WorkflowStep[];
  onStepClick: (stepId: string) => void;
  showDetailed?: boolean;
}

/**
 * Visual progress indicator showing workflow completion status with navigation
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  workflowState,
  workflowDefinition,
  onStepClick,
  showDetailed = false
}) => {
  // Group steps by category
  const stepsByCategory = workflowDefinition.reduce((acc, step) => {
    if (!acc[step.category]) {
      acc[step.category] = [];
    }
    acc[step.category].push(step);
    return acc;
  }, {} as Record<WorkflowCategory, WorkflowStep[]>);

  // Calculate progress for each category
  const categoryProgress = Object.entries(stepsByCategory).map(([category, steps]) => {
    const completedSteps = steps.filter(step => 
      workflowState.completedSteps.includes(step.id)
    ).length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      category: category as WorkflowCategory,
      steps,
      completedSteps,
      totalSteps,
      progress
    };
  });

  // Get step status
  const getStepStatus = (step: WorkflowStep) => {
    if (workflowState.completedSteps.includes(step.id)) {
      return 'completed';
    }
    if (workflowState.currentStepId === step.id) {
      return 'current';
    }
    if (workflowState.availableSteps.includes(step.id)) {
      return 'available';
    }
    return 'locked';
  };

  // Get step button variant
  const getStepButtonVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'primary';
      case 'current':
        return 'primary';
      case 'available':
        return 'normal';
      case 'locked':
        return 'normal';
      default:
        return 'normal';
    }
  };

  // Get step icon
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-positive';
      case 'current':
        return 'status-in-progress';
      case 'available':
        return 'status-pending';
      case 'locked':
        return 'lock';
      default:
        return 'status-pending';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: WorkflowCategory) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get category color
  const getCategoryColor = (category: WorkflowCategory) => {
    const colors: Record<WorkflowCategory, string> = {
      [WorkflowCategory.SITE_SELECTION]: 'blue',
      [WorkflowCategory.TERRAIN_ANALYSIS]: 'green',
      [WorkflowCategory.WIND_ANALYSIS]: 'orange',
      [WorkflowCategory.LAYOUT_OPTIMIZATION]: 'purple',
      [WorkflowCategory.PERFORMANCE_ANALYSIS]: 'red',
      [WorkflowCategory.REPORTING]: 'grey'
    };
    return colors[category] || 'grey';
  };

  // Overall progress
  const overallProgress = Math.round(
    (workflowState.userProgress.completedSteps / workflowState.userProgress.totalSteps) * 100
  );

  if (showDetailed) {
    return (
      <Container>
        <SpaceBetween direction="vertical" size="l">
          <Header variant="h3">Workflow Progress</Header>
          
          {/* Overall Progress */}
          <ProgressBar
            value={overallProgress}
            label="Overall Progress"
            description={`${workflowState.userProgress.completedSteps} of ${workflowState.userProgress.totalSteps} steps completed`}
          />

          {/* Category Progress */}
          {categoryProgress.map(({ category, steps, completedSteps, totalSteps, progress }) => (
            <Container key={category}>
              <SpaceBetween direction="vertical" size="m">
                <Header
                  variant="h4"
                  actions={
                    <Badge color={getCategoryColor(category)}>
                      {completedSteps}/{totalSteps}
                    </Badge>
                  }
                >
                  {getCategoryDisplayName(category)}
                </Header>

                <ProgressBar
                  value={progress}
                  label={`${getCategoryDisplayName(category)} Progress`}
                />

                {/* Steps in Category */}
                <SpaceBetween direction="horizontal" size="s">
                  {steps.map(step => {
                    const status = getStepStatus(step);
                    return (
                      <Button
                        key={step.id}
                        variant={getStepButtonVariant(status)}
                        iconName={getStepIcon(status)}
                        disabled={status === 'locked'}
                        onClick={() => onStepClick(step.id)}
                        ariaLabel={`${step.title} - ${status}`}
                      >
                        {step.title}
                      </Button>
                    );
                  })}
                </SpaceBetween>
              </SpaceBetween>
            </Container>
          ))}
        </SpaceBetween>
      </Container>
    );
  }

  // Compact progress view
  return (
    <Container>
      <SpaceBetween direction="vertical" size="m">
        <Header
          variant="h4"
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <Badge color="blue">
                {workflowState.userProgress.currentComplexityLevel.toUpperCase()}
              </Badge>
              <Badge color="green">
                {overallProgress}% Complete
              </Badge>
            </SpaceBetween>
          }
        >
          Analysis Progress
        </Header>

        <ProgressBar
          value={overallProgress}
          label="Workflow Progress"
          description={`Step ${workflowState.userProgress.completedSteps + 1} of ${workflowState.userProgress.totalSteps}`}
        />

        {/* Quick Navigation */}
        <SpaceBetween direction="horizontal" size="s">
          {workflowState.availableSteps.slice(0, 3).map(stepId => {
            const step = workflowDefinition.find(s => s.id === stepId);
            if (!step) return null;

            const isCurrent = workflowState.currentStepId === stepId;
            return (
              <Button
                key={stepId}
                variant={isCurrent ? 'primary' : 'normal'}
                iconName={isCurrent ? 'status-in-progress' : 'status-pending'}
                onClick={() => onStepClick(stepId)}
                size="small"
              >
                {step.title}
              </Button>
            );
          })}
          {workflowState.availableSteps.length > 3 && (
            <Badge color="grey">
              +{workflowState.availableSteps.length - 3} more
            </Badge>
          )}
        </SpaceBetween>

        {/* Current Step Info */}
        {workflowState.currentStepId && (
          <Box>
            <strong>Current Step:</strong>{' '}
            {workflowDefinition.find(s => s.id === workflowState.currentStepId)?.title || workflowState.currentStepId}
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default ProgressIndicator;