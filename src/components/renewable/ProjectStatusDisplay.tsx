/**
 * Project Status Display Component
 * 
 * Shows a checklist of completed steps and next step suggestion
 * for renewable energy projects.
 */

import React from 'react';
import { Box, SpaceBetween, StatusIndicator } from '@cloudscape-design/components';

export interface ProjectStatus {
  terrain: boolean;
  layout: boolean;
  simulation: boolean;
  report: boolean;
}

interface ProjectStatusDisplayProps {
  projectName: string;
  projectStatus: ProjectStatus;
  nextStep?: string;
}

export const ProjectStatusDisplay: React.FC<ProjectStatusDisplayProps> = ({
  projectName,
  projectStatus,
  nextStep
}) => {
  return (
    <Box margin={{ top: 'm', bottom: 'm' }} padding={{ vertical: 's', horizontal: 'm' }}>
      <SpaceBetween size="s">
        <Box variant="h4">Project: {projectName}</Box>
        
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Status
          </Box>
          <SpaceBetween size="xs">
            <StatusIndicator type={projectStatus.terrain ? 'success' : 'pending'}>
              Terrain Analysis
            </StatusIndicator>
            <StatusIndicator type={projectStatus.layout ? 'success' : 'pending'}>
              Layout Optimization
            </StatusIndicator>
            <StatusIndicator type={projectStatus.simulation ? 'success' : 'pending'}>
              Wake Simulation
            </StatusIndicator>
            <StatusIndicator type={projectStatus.report ? 'success' : 'pending'}>
              Report Generation
            </StatusIndicator>
          </SpaceBetween>
        </Box>
        
        {nextStep && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Next
            </Box>
            <Box variant="p">{nextStep}</Box>
          </Box>
        )}
      </SpaceBetween>
    </Box>
  );
};

export default ProjectStatusDisplay;
