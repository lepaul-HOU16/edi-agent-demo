/**
 * WorkflowCTAButtons Component
 * 
 * Renders contextual call-to-action buttons that guide users through the renewable energy workflow.
 * Buttons are enabled/disabled based on completed workflow steps.
 */

import React from 'react';
import { Button, SpaceBetween, Box } from '@cloudscape-design/components';

export interface WorkflowCTAButton {
  step: string; // The step that must be completed to enable this button
  label: string;
  action: string; // Query to send to chat
  icon: string;
  primary?: boolean;
}

interface WorkflowCTAButtonsProps {
  completedSteps: string[]; // Array of completed step names: ["terrain", "layout", "simulation"]
  projectId: string;
  onAction: (query: string) => void;
}

// Define workflow buttons with their prerequisites
const WORKFLOW_BUTTONS: WorkflowCTAButton[] = [
  {
    step: 'terrain',
    label: 'Optimize Turbine Layout',
    action: 'optimize turbine layout',
    icon: 'settings',
    primary: true
  },
  {
    step: 'layout',
    label: 'Run Wake Simulation',
    action: 'run wake simulation',
    icon: 'refresh',
    primary: true
  },
  {
    step: 'simulation',
    label: 'Generate Wind Rose',
    action: 'generate wind rose',
    icon: 'view-full',
    primary: true
  },
  {
    step: 'windrose',
    label: 'View Project Dashboard',
    action: 'show project dashboard',
    icon: 'status-info',
    primary: true
  }
];

export const WorkflowCTAButtons: React.FC<WorkflowCTAButtonsProps> = ({
  completedSteps,
  projectId,
  onAction
}) => {
  // Determine which buttons should be shown
  // Show the NEXT step button (not the completed step button)
  const getEnabledButtons = (): WorkflowCTAButton[] => {
    // Find the next step that hasn't been completed yet
    const nextButton = WORKFLOW_BUTTONS.find(button => {
      return !completedSteps.includes(button.step);
    });
    
    // Return only the next button, not all completed ones
    return nextButton ? [nextButton] : [];
  };

  const enabledButtons = getEnabledButtons();

  // Get the next recommended action (first enabled button)
  const nextAction = enabledButtons[0];
  
  // Determine header text based on whether buttons are actually enabled or just hints
  const hasCompletedSteps = completedSteps.length > 0;
  const headerText = hasCompletedSteps ? 'Next Steps' : 'Suggested Next Step';

  return (
    <>
      <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
        {headerText}
      </Box>
      <SpaceBetween direction="horizontal" size="xs">
        {enabledButtons.map((button, index) => (
          <Button
            key={index}
            variant={button === nextAction && button.primary ? 'primary' : 'normal'}
            iconName={button.icon as any}
            onClick={() => {
              // Replace {project_id} placeholder if present
              const query = button.action.replace('{project_id}', projectId);
              onAction(query);
            }}
          >
            {button.label}
          </Button>
        ))}
      </SpaceBetween>
    </>
  );
};

export default WorkflowCTAButtons;
