'use client';

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  Modal,
  ExpandableSection,
  Badge,
  Link
} from '@cloudscape-design/components';
import {
  WorkflowStep,
  WorkflowState,
  ActionButton,
  CallToActionConfig
} from '../../types/workflow';

/**
 * Props for CallToActionPanel component
 */
interface CallToActionPanelProps {
  step: WorkflowStep;
  workflowState: WorkflowState;
  onAdvanceWorkflow: (nextStepId: string) => void;
  onRequestHelp: (stepId: string, context?: any) => void;
  className?: string;
}

/**
 * Call-to-action panel positioned at bottom of visualizations with contextual guidance
 */
export const CallToActionPanel: React.FC<CallToActionPanelProps> = ({
  step,
  workflowState,
  onAdvanceWorkflow,
  onRequestHelp,
  className
}) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionButton | null>(null);
  const [showGuidanceDetails, setShowGuidanceDetails] = useState(false);

  // Check if step is completed
  const isStepCompleted = workflowState.completedSteps.includes(step.id);

  // Get available next steps
  const getAvailableNextSteps = () => {
    return step.nextSteps.filter(stepId => 
      workflowState.availableSteps.includes(stepId) || 
      workflowState.completedSteps.includes(stepId)
    );
  };

  // Handle action button click
  const handleActionClick = (actionButton: ActionButton) => {
    if (actionButton.disabled) {
      return;
    }

    if (actionButton.requiresConfirmation) {
      setPendingAction(actionButton);
      setShowConfirmationModal(true);
      return;
    }

    executeAction(actionButton);
  };

  // Execute the action
  const executeAction = (actionButton: ActionButton) => {
    const { action } = actionButton;

    // Check if action is a step ID
    const targetStep = workflowState.availableSteps.find(stepId => stepId === action) ||
                      workflowState.completedSteps.find(stepId => stepId === action);

    if (targetStep) {
      onAdvanceWorkflow(action);
      return;
    }

    // Handle special actions
    switch (action) {
      case 'request_help':
        onRequestHelp(step.id, { source: 'call_to_action' });
        break;
      case 'show_guidance':
        setShowGuidanceDetails(true);
        break;
      case 'export_results':
        // TODO: Implement export functionality
        console.log('Export results for step:', step.id);
        break;
      case 'save_progress':
        // TODO: Implement save functionality
        console.log('Save progress for step:', step.id);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  // Confirm action execution
  const confirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
      setPendingAction(null);
    }
    setShowConfirmationModal(false);
  };

  // Get button variant based on priority and type
  const getButtonVariant = (actionButton: ActionButton) => {
    if (actionButton.disabled) return 'normal';
    
    switch (actionButton.variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'normal';
      case 'tertiary':
        return 'link';
      default:
        return 'normal';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'grey';
    }
  };

  // Filter and sort action buttons
  const sortedButtons = [...step.callToAction.buttons]
    .filter(button => !button.disabled || button.variant === 'primary')
    .sort((a, b) => {
      // Primary buttons first
      if (a.variant === 'primary' && b.variant !== 'primary') return -1;
      if (b.variant === 'primary' && a.variant !== 'primary') return 1;
      
      // Then by button order
      return 0;
    });

  const availableNextSteps = getAvailableNextSteps();

  // Don't render if no actions available
  if (sortedButtons.length === 0 && availableNextSteps.length === 0) {
    return null;
  }

  return (
    <>
      <Container 
        className={`call-to-action-panel ${step.callToAction.position === 'bottom' ? 'bottom-positioned' : ''} ${className || ''}`}
      >
        <SpaceBetween direction="vertical" size="m">
          {/* Header with Priority Badge */}
          <Header
            variant="h3"
            actions={
              <Badge color={getPriorityColor(step.callToAction.priority)}>
                {step.callToAction.priority.toUpperCase()} PRIORITY
              </Badge>
            }
          >
            Next Steps
          </Header>

          {/* Guidance Message */}
          <Alert 
            type={step.callToAction.priority === 'high' ? 'info' : 'success'}
            header="Guidance"
            action={
              step.callToAction.contextualHelp && (
                <Button
                  iconName="status-info"
                  variant="link"
                  onClick={() => setShowGuidanceDetails(!showGuidanceDetails)}
                >
                  {showGuidanceDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              )
            }
          >
            <SpaceBetween direction="vertical" size="s">
              <Box>{step.callToAction.guidance}</Box>
              
              {showGuidanceDetails && step.callToAction.contextualHelp && (
                <ExpandableSection 
                  header={step.callToAction.contextualHelp.title}
                  defaultExpanded={step.callToAction.contextualHelp.expandable !== false}
                >
                  <SpaceBetween direction="vertical" size="s">
                    <Box>{step.callToAction.contextualHelp.content}</Box>
                    
                    {step.callToAction.contextualHelp.links && (
                      <SpaceBetween direction="horizontal" size="s">
                        {step.callToAction.contextualHelp.links.map((link, index) => (
                          <Link 
                            key={index} 
                            href={link.url} 
                            external={link.external}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </SpaceBetween>
                    )}
                    
                    {step.callToAction.contextualHelp.videoUrl && (
                      <Link 
                        href={step.callToAction.contextualHelp.videoUrl} 
                        external
                      >
                        📹 Watch Tutorial Video
                      </Link>
                    )}
                  </SpaceBetween>
                </ExpandableSection>
              )}
            </SpaceBetween>
          </Alert>

          {/* Action Buttons */}
          <SpaceBetween direction="horizontal" size="s">
            {sortedButtons.map((actionButton, index) => (
              <Button
                key={index}
                variant={getButtonVariant(actionButton)}
                iconName={actionButton.icon}
                disabled={actionButton.disabled}
                onClick={() => handleActionClick(actionButton)}
                ariaLabel={actionButton.tooltip || actionButton.label}
              >
                {actionButton.label}
              </Button>
            ))}
            
            {/* Help Button */}
            <Button
              iconName="status-info"
              variant="link"
              onClick={() => onRequestHelp(step.id, { source: 'call_to_action' })}
            >
              Need Help?
            </Button>
          </SpaceBetween>

          {/* Progress Indicator */}
          {step.callToAction.showProgress && (
            <Box>
              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                <Box>
                  <strong>Progress:</strong>
                </Box>
                <Badge color={isStepCompleted ? 'green' : 'blue'}>
                  {isStepCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                </Badge>
                <Box>
                  Step {workflowState.userProgress.completedSteps + 1} of {workflowState.userProgress.totalSteps}
                </Box>
              </SpaceBetween>
            </Box>
          )}

          {/* Available Next Steps Preview */}
          {availableNextSteps.length > 0 && isStepCompleted && (
            <Alert type="success" header="Ready for Next Step">
              <SpaceBetween direction="vertical" size="s">
                <Box>You can now proceed to:</Box>
                <SpaceBetween direction="horizontal" size="s">
                  {availableNextSteps.slice(0, 2).map(stepId => {
                    const nextStep = workflowState.availableSteps.includes(stepId) ||
                                   workflowState.completedSteps.includes(stepId);
                    if (!nextStep) return null;

                    return (
                      <Button
                        key={stepId}
                        variant="primary"
                        size="small"
                        onClick={() => onAdvanceWorkflow(stepId)}
                      >
                        {stepId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Button>
                    );
                  })}
                  {availableNextSteps.length > 2 && (
                    <Badge color="blue">
                      +{availableNextSteps.length - 2} more options
                    </Badge>
                  )}
                </SpaceBetween>
              </SpaceBetween>
            </Alert>
          )}
        </SpaceBetween>
      </Container>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        onDismiss={() => setShowConfirmationModal(false)}
        header="Confirm Action"
        footer={
          <SpaceBetween direction="horizontal" size="s">
            <Button 
              variant="link" 
              onClick={() => setShowConfirmationModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </SpaceBetween>
        }
      >
        {pendingAction && (
          <SpaceBetween direction="vertical" size="s">
            <Box>
              Are you sure you want to <strong>{pendingAction.label.toLowerCase()}</strong>?
            </Box>
            {pendingAction.confirmationMessage && (
              <Alert type="warning">
                {pendingAction.confirmationMessage}
              </Alert>
            )}
          </SpaceBetween>
        )}
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .call-to-action-panel.bottom-positioned {
          position: sticky;
          bottom: 20px;
          z-index: 100;
          margin-top: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          background: white;
        }
        
        .call-to-action-panel {
          border: 2px solid #0073bb;
          border-radius: 8px;
          background: #f9f9f9;
        }
      `}</style>
    </>
  );
};

export default CallToActionPanel;