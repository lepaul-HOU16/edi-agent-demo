/**
 * WorkflowCTAButtons Component
 * 
 * Renders contextual call-to-action buttons that guide users through the renewable energy workflow.
 * Buttons are enabled/disabled based on completed workflow steps detected from message artifacts.
 */

import React, { useMemo } from 'react';
import { Button, SpaceBetween, Box } from '@cloudscape-design/components';
import { Message } from '@/utils/types';

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
  projectId: string;
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
  projectId,
  onAction
}) => {
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

  return (
    <>
      <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
        {headerText}
      </Box>
      <SpaceBetween direction="horizontal" size="xs">
        {allButtons.map((button, index) => {
          // Check if this button has missing prerequisites
          const requiredSteps = WORKFLOW_PREREQUISITES[button.step] || [];
          const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
          
          console.log(`🔍 [WorkflowCTA] Button '${button.label}' prerequisite check:`, {
            requiredSteps,
            completedSteps,
            missingSteps,
            hasPrerequisites: missingSteps.length === 0
          });
          
          // Determine button variant
          // Primary buttons use 'primary' variant if they're the next action
          // Secondary buttons always use 'normal' variant
          const isPrimaryButton = primaryButtons.includes(button);
          const variant = (isPrimaryButton && button === nextAction && button.primary) ? 'primary' : 'normal';
          
          // Determine if button should be disabled
          // For now, we don't disable buttons - we auto-run prerequisites instead
          // But we could add a disabled state if needed
          const isEnabled = true; // Always enabled, we handle prerequisites in onClick
          
          return (
            <Button
              key={index}
              variant={variant}
              iconName={button.icon as any}
              disabled={!isEnabled}
              onClick={() => {
                console.log(`🎯 [WorkflowCTA] Button clicked: ${button.label}`);
                console.log(`🔍 [WorkflowCTA] Button step: ${button.step}`);
                console.log(`🔍 [WorkflowCTA] Required steps:`, requiredSteps);
                console.log(`🔍 [WorkflowCTA] Completed steps:`, completedSteps);
                console.log(`🔍 [WorkflowCTA] Missing steps:`, missingSteps);
                
                // SMART WORKFLOW: Auto-run missing prerequisites first
                if (missingSteps.length > 0) {
                  console.log(`⚠️ [WorkflowCTA] Missing prerequisites for ${button.step}:`, missingSteps);
                  
                  // Find the first missing prerequisite button
                  const firstMissingStep = missingSteps[0];
                  const missingButton = WORKFLOW_BUTTONS.find(b => b.step === firstMissingStep);
                  
                  if (missingButton) {
                    console.log(`🚀 [WorkflowCTA] Auto-running prerequisite: ${missingButton.label} (step: ${firstMissingStep})`);
                    const prerequisiteQuery = missingButton.action.replace('{project_id}', projectId);
                    console.log(`🚀 [WorkflowCTA] Prerequisite query: ${prerequisiteQuery}`);
                    onAction(prerequisiteQuery);
                    
                    // After prerequisite completes, the user can click the button again
                    // Or we could queue the original action, but that's more complex
                    return;
                  } else {
                    console.error(`❌ [WorkflowCTA] Could not find button for missing step: ${firstMissingStep}`);
                    // Fall through to run the requested action anyway
                  }
                }
                
                // No missing prerequisites, run the requested action
                console.log(`✅ [WorkflowCTA] All prerequisites met, running action: ${button.label}`);
                const query = button.action.replace('{project_id}', projectId);
                console.log(`🚀 [WorkflowCTA] Query: ${query}`);
                onAction(query);
              }}
            >
              {button.label}
            </Button>
          );
        })}
      </SpaceBetween>
    </>
  );
};

export default WorkflowCTAButtons;
