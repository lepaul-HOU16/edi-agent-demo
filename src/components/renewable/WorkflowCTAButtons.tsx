/**
 * WorkflowCTAButtons Component
 * 
 * Renders contextual call-to-action buttons that guide users through the renewable energy workflow.
 * Buttons are enabled/disabled based on completed workflow steps detected from message artifacts.
 */

import React, { useMemo } from 'react';
import { Button, SpaceBetween, Box, Alert, Popover, StatusIndicator } from '@cloudscape-design/components';
import { Message } from '@/utils/types';
import { useProjectContext } from '@/contexts/ProjectContext';

export interface WorkflowCTAButton {
  step: string; // The step that must be completed to enable this button
  label: string;
  action: string; // Query to send to chat
  icon: string;
  primary?: boolean;
}

interface WorkflowCTAButtonsProps {
  messages?: Message[]; // Full message history to check for artifacts (preferred)
  completedSteps?: string[]; // Legacy: Array of completed step names (deprecated)
  projectId?: string; // Legacy: Direct project ID (deprecated, use ProjectContext instead)
  onAction: (query: string) => void;
}

// Define primary workflow buttons
// The 'step' field represents the prerequisite that must be completed to show this button
const WORKFLOW_BUTTONS: WorkflowCTAButton[] = [
  {
    step: 'terrain',  // Show this button AFTER terrain is complete
    label: 'Generate Turbine Layout',  // Changed from "Optimize Turbine Layout"
    action: 'generate turbine layout for {project_id}',  // Changed action to match
    icon: 'settings',
    primary: true
  },
  {
    step: 'layout',  // Show this button AFTER layout is complete
    label: 'Run Wake Simulation',
    action: 'run wake simulation for {project_id}',
    icon: 'refresh',
    primary: true
  },
  {
    step: 'simulation',  // Show this button AFTER simulation is complete
    label: 'Generate Wind Rose',
    action: 'generate wind rose for {project_id}',
    icon: 'view-full',
    primary: true
  },
  {
    step: 'windrose',  // Show this button AFTER windrose is complete
    label: 'Financial Analysis',  // Changed from "Generate Report"
    action: 'analyze project economics for {project_id}',  // Changed action to match
    icon: 'calculator',  // Changed icon to match financial analysis
    primary: true
  },
  {
    step: 'financial',  // NEW: Show this button AFTER financial analysis is complete
    label: 'Generate Report',  // Moved from windrose step
    action: 'generate report for {project_id}',
    icon: 'status-info',
    primary: true
  }
];

// Define secondary workflow buttons (alternative actions)
// These are always available after certain steps, but not part of the main workflow
const SECONDARY_BUTTONS: WorkflowCTAButton[] = [
  {
    step: 'layout',  // Available after layout is complete
    label: 'Compare Scenarios',
    action: 'compare scenarios for {project_id}',
    icon: 'compare',
    primary: false  // Secondary buttons are not primary
  }
  // Removed "Optimize Layout" button as requested
];

// Define prerequisite steps for each workflow step
const WORKFLOW_PREREQUISITES: Record<string, string[]> = {
  'terrain': [], // No prerequisites
  'layout': ['terrain'], // Requires terrain
  'simulation': ['terrain', 'layout'], // Requires terrain AND layout
  'windrose': ['terrain', 'layout', 'simulation'], // Requires all previous steps
  'financial': ['terrain', 'layout', 'simulation', 'windrose'], // Requires all previous steps including windrose
  'report': ['terrain', 'layout', 'simulation', 'windrose', 'financial'] // Requires all steps
};

// Map artifact types to workflow steps
const ARTIFACT_TYPE_TO_STEP: Record<string, string> = {
  'wind_farm_terrain_analysis': 'terrain',
  'wind_farm_layout': 'layout',
  'turbine_layout': 'layout',
  'wake_analysis': 'simulation',
  'wake_simulation': 'simulation',
  'wind_rose': 'windrose',
  'wind_rose_analysis': 'windrose',
  'financial_analysis': 'financial',
  'wind_farm_report': 'report'
};

/**
 * Check if prerequisites are met for a given workflow step
 * Returns an object with validation results and helpful messages
 */
const checkPrerequisites = (
  step: string,
  completedSteps: string[]
): {
  met: boolean;
  missing: string[];
  message: string;
  suggestion: string;
} => {
  const requiredSteps = WORKFLOW_PREREQUISITES[step] || [];
  const missingSteps = requiredSteps.filter(s => !completedSteps.includes(s));
  
  console.log(`🔍 [WorkflowCTA] Prerequisite check for step '${step}':`, {
    requiredSteps,
    completedSteps,
    missingSteps,
    met: missingSteps.length === 0
  });
  
  if (missingSteps.length === 0) {
    return {
      met: true,
      missing: [],
      message: 'All prerequisites met',
      suggestion: ''
    };
  }
  
  // Generate human-readable messages for missing prerequisites
  const stepNames: Record<string, string> = {
    'terrain': 'terrain analysis',
    'layout': 'turbine layout',
    'simulation': 'wake simulation',
    'windrose': 'wind rose analysis',
    'financial': 'financial analysis'
  };
  
  const missingNames = missingSteps.map(s => stepNames[s] || s);
  const message = missingSteps.length === 1
    ? `Missing prerequisite: ${missingNames[0]}`
    : `Missing prerequisites: ${missingNames.join(', ')}`;
  
  // Generate suggestion for the first missing step
  const firstMissing = missingSteps[0];
  const suggestions: Record<string, string> = {
    'terrain': 'Start by analyzing terrain at a location',
    'layout': 'Generate a turbine layout first',
    'simulation': 'Run a wake simulation first',
    'windrose': 'Generate a wind rose analysis first',
    'financial': 'Complete financial analysis first'
  };
  
  const suggestion = suggestions[firstMissing] || `Complete ${stepNames[firstMissing] || firstMissing} first`;
  
  return {
    met: false,
    missing: missingSteps,
    message,
    suggestion
  };
};

/**
 * Detect completed workflow steps from message artifacts
 * Checks actual artifact types in message history, not just step names
 */
const detectCompletedSteps = (messages: Message[]): string[] => {
  console.log('🔍 [WorkflowCTA] Detecting completed steps from message history');
  console.log('🔍 [WorkflowCTA] Total messages:', messages.length);
  
  const completedSteps = new Set<string>();
  
  // Iterate through all messages to find artifacts
  messages.forEach((message, index) => {
    // Check if message has artifacts
    const artifacts = (message as any).artifacts;
    
    if (artifacts && Array.isArray(artifacts)) {
      console.log(`🔍 [WorkflowCTA] Message ${index} has ${artifacts.length} artifacts`);
      
      artifacts.forEach((artifact: any) => {
        // Parse artifact if it's a string
        let parsedArtifact = artifact;
        if (typeof artifact === 'string') {
          try {
            parsedArtifact = JSON.parse(artifact);
          } catch (e) {
            console.warn('⚠️ [WorkflowCTA] Failed to parse artifact:', e);
            return;
          }
        }
        
        // Check artifact type
        const artifactType = parsedArtifact?.messageContentType || 
                           parsedArtifact?.data?.messageContentType || 
                           parsedArtifact?.type;
        
        if (artifactType) {
          console.log(`🔍 [WorkflowCTA] Found artifact type: ${artifactType}`);
          
          // Map artifact type to workflow step
          const step = ARTIFACT_TYPE_TO_STEP[artifactType];
          if (step) {
            completedSteps.add(step);
            console.log(`✅ [WorkflowCTA] Marked step '${step}' as complete (artifact: ${artifactType})`);
          } else {
            console.log(`⚠️ [WorkflowCTA] Unknown artifact type: ${artifactType}`);
          }
        }
      });
    }
  });
  
  const completedArray = Array.from(completedSteps);
  console.log('✅ [WorkflowCTA] Completed steps:', completedArray);
  
  return completedArray;
};

export const WorkflowCTAButtons: React.FC<WorkflowCTAButtonsProps> = ({
  messages,
  completedSteps: legacyCompletedSteps,
  projectId: legacyProjectId,
  onAction
}) => {
  // Get active project from context
  const { activeProject } = useProjectContext();
  
  // Use activeProject from context, fall back to legacy projectId prop
  const projectId = activeProject?.projectId || legacyProjectId;
  const projectName = activeProject?.projectName;
  
  console.log('🎯 [WorkflowCTA] Active project from context:', activeProject);
  console.log('🎯 [WorkflowCTA] Using project ID:', projectId);
  console.log('🎯 [WorkflowCTA] Using project name:', projectName);
  
  // Detect completed steps from message artifacts (preferred method)
  // Fall back to legacy completedSteps prop if messages not provided
  const completedSteps = useMemo(() => {
    if (messages && messages.length > 0) {
      console.log('🔍 [WorkflowCTA] Using messages array to detect completed steps');
      return detectCompletedSteps(messages);
    } else if (legacyCompletedSteps) {
      console.log('⚠️ [WorkflowCTA] Using legacy completedSteps prop (deprecated)');
      console.log('🔍 [WorkflowCTA] Legacy completed steps:', legacyCompletedSteps);
      return legacyCompletedSteps;
    } else {
      console.log('⚠️ [WorkflowCTA] No messages or completedSteps provided, assuming no steps complete');
      return [];
    }
  }, [messages, legacyCompletedSteps]);
  // Determine which primary buttons should be shown
  // Show the button for the LAST completed step (which represents the next action)
  const getPrimaryButtons = (): WorkflowCTAButton[] => {
    console.log('🔍 [WorkflowCTA] Getting primary buttons');
    console.log('🔍 [WorkflowCTA] Completed steps:', completedSteps);
    
    // If terrain is complete, show the button with step='terrain' (which is "Generate Turbine Layout")
    // If layout is complete, show the button with step='layout' (which is "Run Wake Simulation")
    // etc.
    
    // Find the button that matches the last completed step
    const lastCompletedStep = completedSteps[completedSteps.length - 1];
    console.log('🔍 [WorkflowCTA] Last completed step:', lastCompletedStep);
    
    const nextButton = WORKFLOW_BUTTONS.find(button => button.step === lastCompletedStep);
    
    if (nextButton) {
      console.log('✅ [WorkflowCTA] Next button:', nextButton.label);
    } else {
      console.log('⚠️ [WorkflowCTA] No next button found');
    }
    
    // Return only the next button
    return nextButton ? [nextButton] : [];
  };

  // Determine which secondary buttons should be shown
  // Show secondary buttons for all completed steps that have them
  // BUT hide buttons for steps that are already in the primary workflow and completed
  const getSecondaryButtons = (): WorkflowCTAButton[] => {
    console.log('🔍 [WorkflowCTA] Getting secondary buttons');
    
    const buttons = SECONDARY_BUTTONS.filter(button => {
      const isAvailable = completedSteps.includes(button.step);
      
      // HIDE "Optimize Layout" if layout is already complete
      // This prevents showing redundant actions
      if (button.label === 'Optimize Layout' && completedSteps.includes('layout')) {
        console.log(`🔍 [WorkflowCTA] Hiding '${button.label}' - step already complete`);
        return false;
      }
      
      console.log(`🔍 [WorkflowCTA] Secondary button '${button.label}' available:`, isAvailable);
      return isAvailable;
    });
    
    console.log('✅ [WorkflowCTA] Secondary buttons:', buttons.map(b => b.label));
    return buttons;
  };

  const primaryButtons = getPrimaryButtons();
  // DISABLED: Secondary buttons removed for cleaner workflow
  // const secondaryButtons = getSecondaryButtons();
  const allButtons = [...primaryButtons]; // Only show primary buttons

  console.log('🔍 [WorkflowCTA] Total buttons to render:', allButtons.length);

  // Get the next recommended action (first primary button)
  const nextAction = primaryButtons[0];
  
  // Determine header text based on whether buttons are actually enabled or just hints
  const hasCompletedSteps = completedSteps.length > 0;
  const headerText = hasCompletedSteps ? 'Next Steps' : 'Suggested Next Step';

  // If no active project is set, show a warning
  if (!activeProject && !legacyProjectId) {
    console.log('⚠️ [WorkflowCTA] No active project set');
    return (
      <Alert type="warning" header="No Active Project">
        Please start by analyzing terrain at a location to create a project, or continue an existing project from the dashboard.
      </Alert>
    );
  }

  // Check if any buttons have missing prerequisites
  const buttonsWithMissingPrereqs = allButtons.filter(button => {
    const check = checkPrerequisites(button.step, completedSteps);
    return !check.met;
  });
  
  const hasAnyMissingPrereqs = buttonsWithMissingPrereqs.length > 0;
  const firstButtonWithMissingPrereqs = buttonsWithMissingPrereqs[0];
  const firstPrereqCheck = firstButtonWithMissingPrereqs 
    ? checkPrerequisites(firstButtonWithMissingPrereqs.step, completedSteps)
    : null;

  return (
    <>
      {/* Display active project name */}
      {activeProject && (
        <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
          Active Project: <strong>{activeProject.projectName}</strong>
          {activeProject.location && ` (${activeProject.location})`}
        </Box>
      )}
      
      <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
        {headerText}
      </Box>
      
      {/* Show alert if prerequisites are missing */}
      {hasAnyMissingPrereqs && firstPrereqCheck && (
        <Alert
          type="info"
          header="Prerequisites Required"
        >
          {firstPrereqCheck.suggestion}
        </Alert>
      )}
      
      <SpaceBetween direction="horizontal" size="xs">
        {allButtons.map((button, index) => {
          // Check prerequisites for this button
          const prerequisiteCheck = checkPrerequisites(button.step, completedSteps);
          
          // Determine button variant
          // Primary buttons use 'primary' variant if they're the next action
          // Secondary buttons always use 'normal' variant
          const isPrimaryButton = primaryButtons.includes(button);
          const variant = (isPrimaryButton && button === nextAction && button.primary) ? 'primary' : 'normal';
          
          // Disable buttons when no active project is set OR prerequisites are not met
          const isEnabled = !!projectId && prerequisiteCheck.met;
          
          // Generate the full action query with project context
          const fullAction = button.action
            .replace('{project_id}', projectId || 'unknown')
            .replace('{project_name}', projectName || 'unknown');
          
          // Create tooltip showing full action with project name or prerequisite message
          const tooltipContent = !projectId 
            ? 'No active project selected'
            : !prerequisiteCheck.met
            ? (
                <Box>
                  <Box variant="p" margin={{ bottom: 'xs' }}>
                    <StatusIndicator type="warning">
                      {prerequisiteCheck.message}
                    </StatusIndicator>
                  </Box>
                  <Box variant="small">
                    {prerequisiteCheck.suggestion}
                  </Box>
                </Box>
              )
            : `${button.label} for ${activeProject?.projectName || projectId}`;
          
          const buttonElement = (
            <Button
              key={index}
              variant={variant}
              iconName={button.icon as any}
              disabled={!isEnabled}
              ariaLabel={typeof tooltipContent === 'string' ? tooltipContent : button.label}
              onClick={() => {
                if (!projectId) {
                  console.error('❌ [WorkflowCTA] No project ID available');
                  return;
                }
                
                if (!prerequisiteCheck.met) {
                  console.error('❌ [WorkflowCTA] Prerequisites not met for', button.label);
                  console.error('❌ [WorkflowCTA] Missing:', prerequisiteCheck.missing);
                  return;
                }
                
                console.log(`🎯 [WorkflowCTA] Button clicked: ${button.label}`);
                console.log(`🎯 [WorkflowCTA] Project context:`, activeProject);
                console.log(`✅ [WorkflowCTA] All prerequisites met`);
                console.log(`🚀 [WorkflowCTA] Full action query: ${fullAction}`);
                
                onAction(fullAction);
              }}
            >
              {button.label}
            </Button>
          );
          
          // Wrap button in Popover if prerequisites are not met or no project
          if (!isEnabled) {
            return (
              <Popover
                key={index}
                dismissButton={false}
                position="top"
                size="small"
                triggerType="custom"
                content={tooltipContent}
              >
                {buttonElement}
              </Popover>
            );
          }
          
          return buttonElement;
        })}
      </SpaceBetween>
    </>
  );
};

export default WorkflowCTAButtons;
