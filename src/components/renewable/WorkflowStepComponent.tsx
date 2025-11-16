
import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Alert,
  Badge,
  ProgressBar,
  Button
} from '@cloudscape-design/components';
import {
  WorkflowStep,
  WorkflowState,
  WorkflowStepResults,
  WorkflowStepProps,
  ComplexityLevel
} from '../../types/workflow';

/**
 * Props for WorkflowStepComponent
 */
interface WorkflowStepComponentProps {
  step: WorkflowStep;
  workflowState: WorkflowState;
  onStepComplete: (stepId: string, results: WorkflowStepResults) => void;
  onAdvanceWorkflow: (nextStepId: string) => void;
  onRequestHelp: (stepId: string, context?: any) => void;
}

/**
 * Wrapper component that renders individual workflow steps with consistent layout
 * and progress tracking.
 */
export const WorkflowStepComponent: React.FC<WorkflowStepComponentProps> = ({
  step,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow,
  onRequestHelp
}) => {
  const [stepProgress, setStepProgress] = useState(0);
  const [stepStartTime] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);

  // Check if step is already completed
  useEffect(() => {
    const completed = workflowState.completedSteps.includes(step.id);
    setIsCompleted(completed);
    if (completed) {
      setStepProgress(100);
    }
  }, [workflowState.completedSteps, step.id]);

  // Handle step completion
  const handleStepComplete = (results: WorkflowStepResults) => {
    setIsCompleted(true);
    setStepProgress(100);
    onStepComplete(step.id, results);
  };

  // Create props for the step component
  const stepProps: WorkflowStepProps = {
    stepId: step.id,
    workflowState,
    onStepComplete: handleStepComplete,
    onAdvanceWorkflow,
    onRequestHelp
  };

  // Get complexity badge variant
  const getComplexityVariant = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case ComplexityLevel.BASIC:
        return 'green';
      case ComplexityLevel.INTERMEDIATE:
        return 'blue';
      case ComplexityLevel.ADVANCED:
        return 'orange';
      case ComplexityLevel.EXPERT:
        return 'red';
      default:
        return 'grey';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      site_selection: 'blue',
      terrain_analysis: 'green',
      wind_analysis: 'orange',
      layout_optimization: 'purple',
      performance_analysis: 'red',
      reporting: 'grey'
    };
    return colors[category] || 'grey';
  };

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        {/* Step Header */}
        <Header
          variant="h2"
          description={step.description}
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <Badge color={getCategoryColor(step.category)}>
                {step.category.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge color={getComplexityVariant(step.complexity)}>
                {step.complexity.toUpperCase()}
              </Badge>
              {step.isOptional && (
                <Badge color="grey">OPTIONAL</Badge>
              )}
              {isCompleted && (
                <Badge color="green">COMPLETED</Badge>
              )}
            </SpaceBetween>
          }
        >
          {step.title}
        </Header>

        {/* Step Progress */}
        {!isCompleted && (
          <ProgressBar
            value={stepProgress}
            label="Step Progress"
            description={`Estimated time: ${step.estimatedDuration} minutes`}
          />
        )}

        {/* Prerequisites Check */}
        {step.prerequisites.length > 0 && (
          <Alert
            type={workflowState.completedSteps.some(id => step.prerequisites.includes(id)) ? "success" : "warning"}
            header="Prerequisites"
          >
            <SpaceBetween direction="vertical" size="xs">
              {step.prerequisites.map(prereqId => {
                const isCompleted = workflowState.completedSteps.includes(prereqId);
                return (
                  <Box key={prereqId}>
                    {isCompleted ? '✅' : '⏳'} {prereqId}
                  </Box>
                );
              })}
            </SpaceBetween>
          </Alert>
        )}

        {/* Help Text */}
        {step.metadata?.helpText && (
          <Alert type="info" header="Getting Started">
            {step.metadata.helpText}
          </Alert>
        )}

        {/* Warning Text */}
        {step.metadata?.warningText && (
          <Alert type="warning" header="Important Notice">
            {step.metadata.warningText}
          </Alert>
        )}

        {/* Step Component */}
        <Box>
          <step.component {...stepProps} />
        </Box>

        {/* Success Criteria */}
        {step.metadata?.successCriteria && step.metadata.successCriteria.length > 0 && (
          <Alert type="info" header="Success Criteria">
            <SpaceBetween direction="vertical" size="xs">
              {step.metadata.successCriteria.map((criteria, index) => (
                <Box key={index}>• {criteria}</Box>
              ))}
            </SpaceBetween>
          </Alert>
        )}

        {/* Common Issues */}
        {step.metadata?.commonIssues && step.metadata.commonIssues.length > 0 && (
          <Alert type="warning" header="Common Issues" dismissible>
            <SpaceBetween direction="vertical" size="xs">
              {step.metadata.commonIssues.map((issue, index) => (
                <Box key={index}>• {issue}</Box>
              ))}
            </SpaceBetween>
          </Alert>
        )}

        {/* Step Results Display */}
        {isCompleted && workflowState.stepResults[step.id] && (
          <Alert type="success" header="Step Completed">
            <SpaceBetween direction="vertical" size="s">
              <Box>
                <strong>Completion Time:</strong> {new Date(workflowState.stepResults[step.id].data?.completedAt || Date.now()).toLocaleString()}
              </Box>
              {workflowState.stepResults[step.id].userNotes && (
                <Box>
                  <strong>Notes:</strong> {workflowState.stepResults[step.id].userNotes}
                </Box>
              )}
              {workflowState.stepResults[step.id].nextRecommendedStep && (
                <Box>
                  <strong>Recommended Next Step:</strong> {workflowState.stepResults[step.id].nextRecommendedStep}
                </Box>
              )}
            </SpaceBetween>
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default WorkflowStepComponent;