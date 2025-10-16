/**
 * Dashboard Artifact Component
 * Renders consolidated dashboard views based on dashboard type
 */

import React from 'react';
import { Box, Alert } from '@cloudscape-design/components';
import WindResourceDashboard from './WindResourceDashboard';
import PerformanceAnalysisDashboard from './PerformanceAnalysisDashboard';
import WakeAnalysisDashboard from './WakeAnalysisDashboard';

interface DashboardArtifactProps {
  data: {
    dashboardType: 'wind_resource' | 'performance_analysis' | 'wake_analysis';
    projectId: string;
    data: any;
    metadata?: {
      generated_at?: string;
      version?: string;
    };
  };
  darkMode?: boolean;
}

const DashboardArtifact: React.FC<DashboardArtifactProps> = ({
  data,
  darkMode = true
}) => {
  const { dashboardType, projectId, data: dashboardData } = data;

  // Validate dashboard data
  if (!dashboardData) {
    return (
      <Box padding="l">
        <Alert type="error" header="Dashboard Data Missing">
          No dashboard data available for this project.
        </Alert>
      </Box>
    );
  }

  // Render appropriate dashboard based on type
  switch (dashboardType) {
    case 'wind_resource':
      return (
        <WindResourceDashboard
          data={dashboardData}
          projectId={projectId}
          darkMode={darkMode}
        />
      );

    case 'performance_analysis':
      return (
        <PerformanceAnalysisDashboard
          data={dashboardData}
          projectId={projectId}
          darkMode={darkMode}
        />
      );

    case 'wake_analysis':
      return (
        <WakeAnalysisDashboard
          data={dashboardData}
          projectId={projectId}
          darkMode={darkMode}
        />
      );

    default:
      return (
        <Box padding="l">
          <Alert type="warning" header="Unknown Dashboard Type">
            Dashboard type "{dashboardType}" is not recognized.
          </Alert>
        </Box>
      );
  }
};

export default DashboardArtifact;
