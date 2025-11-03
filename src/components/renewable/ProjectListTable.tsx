/**
 * Project List Table Component
 * 
 * Displays renewable energy projects in a table format with:
 * - Status indicators (✓/✗)
 * - Key metrics (turbines, capacity, AEP)
 * - Click to view details
 * - Active project marker
 * 
 * Requirements: 8.4, 8.5
 */

'use client';

import React from 'react';
import {
  Table,
  Box,
  SpaceBetween,
  Badge,
  StatusIndicator,
  Button,
  Header,
  Link
} from '@cloudscape-design/components';

export interface ProjectSummary {
  project_name: string;
  status: {
    terrain: boolean;
    layout: boolean;
    simulation: boolean;
    report: boolean;
    completionPercentage: number;
  };
  created_at: string;
  updated_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metrics?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
  isActive: boolean;
}

interface ProjectListTableProps {
  projects: ProjectSummary[];
  activeProject?: string;
  onProjectClick?: (projectName: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ProjectListTable: React.FC<ProjectListTableProps> = ({
  projects,
  activeProject,
  onProjectClick,
  onRefresh,
  loading = false
}) => {
  /**
   * Format timestamp to human-readable format
   */
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return isoString;
    }
  };

  /**
   * Render status indicator for a step
   */
  const renderStatusIndicator = (completed: boolean) => {
    return completed ? (
      <StatusIndicator type="success">✓</StatusIndicator>
    ) : (
      <StatusIndicator type="stopped">✗</StatusIndicator>
    );
  };

  /**
   * Render completion badge
   */
  const renderCompletionBadge = (percentage: number) => {
    if (percentage === 100) {
      return <Badge color="green">Complete</Badge>;
    } else if (percentage >= 75) {
      return <Badge color="blue">{percentage}%</Badge>;
    } else if (percentage >= 50) {
      return <Badge color="grey">{percentage}%</Badge>;
    } else if (percentage > 0) {
      return <Badge>{percentage}%</Badge>;
    } else {
      return <Badge>New</Badge>;
    }
  };

  /**
   * Column definitions for the table
   */
  const columnDefinitions = [
    {
      id: 'project_name',
      header: 'Project Name',
      cell: (item: ProjectSummary) => (
        <Box>
          <SpaceBetween direction="horizontal" size="xs">
            {item.isActive && <Badge color="blue">Active</Badge>}
            <Link
              onFollow={(e) => {
                e.preventDefault();
                if (onProjectClick) {
                  onProjectClick(item.project_name);
                }
              }}
              fontSize="body-m"
            >
              {item.project_name}
            </Link>
          </SpaceBetween>
        </Box>
      ),
      sortingField: 'project_name',
      width: 250
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: ProjectSummary) => (
        <SpaceBetween direction="horizontal" size="xs">
          {renderStatusIndicator(item.status.terrain)}
          {renderStatusIndicator(item.status.layout)}
          {renderStatusIndicator(item.status.simulation)}
          {renderStatusIndicator(item.status.report)}
        </SpaceBetween>
      ),
      width: 150
    },
    {
      id: 'completion',
      header: 'Progress',
      cell: (item: ProjectSummary) => renderCompletionBadge(item.status.completionPercentage),
      sortingField: 'status.completionPercentage',
      width: 100
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item: ProjectSummary) => (
        item.coordinates ? (
          <Box fontSize="body-s" color="text-body-secondary">
            {item.coordinates.latitude.toFixed(4)}, {item.coordinates.longitude.toFixed(4)}
          </Box>
        ) : (
          <Box fontSize="body-s" color="text-status-inactive">
            Not set
          </Box>
        )
      ),
      width: 150
    },
    {
      id: 'metrics',
      header: 'Metrics',
      cell: (item: ProjectSummary) => {
        if (!item.metrics) {
          return (
            <Box fontSize="body-s" color="text-status-inactive">
              No data
            </Box>
          );
        }

        const parts: string[] = [];
        if (item.metrics.turbine_count) {
          parts.push(`${item.metrics.turbine_count} turbines`);
        }
        if (item.metrics.total_capacity_mw) {
          parts.push(`${item.metrics.total_capacity_mw} MW`);
        }
        if (item.metrics.annual_energy_gwh) {
          parts.push(`${item.metrics.annual_energy_gwh.toFixed(1)} GWh/yr`);
        }

        return (
          <Box fontSize="body-s">
            {parts.length > 0 ? parts.join(' • ') : 'No data'}
          </Box>
        );
      },
      width: 200
    },
    {
      id: 'updated',
      header: 'Last Updated',
      cell: (item: ProjectSummary) => (
        <Box fontSize="body-s" color="text-body-secondary">
          {formatTimestamp(item.updated_at)}
        </Box>
      ),
      sortingField: 'updated_at',
      width: 120
    }
  ];

  /**
   * Empty state
   */
  const emptyState = (
    <Box textAlign="center" color="inherit">
      <SpaceBetween size="m">
        <Box variant="strong" fontSize="heading-m" color="inherit">
          No projects yet
        </Box>
        <Box variant="p" color="inherit">
          Start by analyzing terrain at a location to create your first renewable energy project.
        </Box>
        <Box>
          <Button variant="primary">
            Create New Project
          </Button>
        </Box>
      </SpaceBetween>
    </Box>
  );

  /**
   * Loading state
   */
  if (loading) {
    return (
      <Table
        columnDefinitions={columnDefinitions}
        items={[]}
        loading={true}
        loadingText="Loading projects..."
        empty={emptyState}
        header={
          <Header
            variant="h2"
            description="View and manage your renewable energy projects"
          >
            Renewable Energy Projects
          </Header>
        }
      />
    );
  }

  return (
    <Table
      columnDefinitions={columnDefinitions}
      items={projects}
      sortingDisabled={false}
      empty={emptyState}
      header={
        <Header
          variant="h2"
          description="View and manage your renewable energy projects"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {onRefresh && (
                <Button
                  iconName="refresh"
                  onClick={onRefresh}
                  ariaLabel="Refresh project list"
                >
                  Refresh
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Renewable Energy Projects
        </Header>
      }
      // Pagination can be added later if needed
      // For now, show all projects in a single view
    />
  );
};

/**
 * Project Details Panel Component
 * 
 * Displays detailed information about a single project
 */
interface ProjectDetailsProps {
  projectName: string;
  projectData: {
    project_id: string;
    status: {
      terrain: boolean;
      layout: boolean;
      simulation: boolean;
      report: boolean;
      completionPercentage: number;
    };
    created_at: string;
    updated_at: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    metadata?: {
      turbine_count?: number;
      total_capacity_mw?: number;
      annual_energy_gwh?: number;
    };
  };
  onClose?: () => void;
}

export const ProjectDetailsPanel: React.FC<ProjectDetailsProps> = ({
  projectName,
  projectData,
  onClose
}) => {
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return isoString;
    }
  };

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          onClose && (
            <Button onClick={onClose} iconName="close">
              Close
            </Button>
          )
        }
      >
        {projectName}
      </Header>

      {/* Status Section */}
      <Box>
        <Header variant="h2">Analysis Status</Header>
        <SpaceBetween size="s">
          <Box>
            <SpaceBetween direction="horizontal" size="m">
              <Box>
                {projectData.status.terrain ? (
                  <StatusIndicator type="success">Terrain Analysis Complete</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Terrain Analysis Pending</StatusIndicator>
                )}
              </Box>
              <Box>
                {projectData.status.layout ? (
                  <StatusIndicator type="success">Layout Optimization Complete</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Layout Optimization Pending</StatusIndicator>
                )}
              </Box>
            </SpaceBetween>
          </Box>
          <Box>
            <SpaceBetween direction="horizontal" size="m">
              <Box>
                {projectData.status.simulation ? (
                  <StatusIndicator type="success">Wake Simulation Complete</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Wake Simulation Pending</StatusIndicator>
                )}
              </Box>
              <Box>
                {projectData.status.report ? (
                  <StatusIndicator type="success">Report Generation Complete</StatusIndicator>
                ) : (
                  <StatusIndicator type="stopped">Report Generation Pending</StatusIndicator>
                )}
              </Box>
            </SpaceBetween>
          </Box>
          <Box>
            <Badge color={projectData.status.completionPercentage === 100 ? 'green' : 'blue'}>
              {projectData.status.completionPercentage}% Complete
            </Badge>
          </Box>
        </SpaceBetween>
      </Box>

      {/* Location Section */}
      {projectData.coordinates && (
        <Box>
          <Header variant="h2">Location</Header>
          <SpaceBetween size="xs">
            <Box>
              <Box variant="awsui-key-label">Latitude</Box>
              <Box>{projectData.coordinates.latitude.toFixed(6)}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Longitude</Box>
              <Box>{projectData.coordinates.longitude.toFixed(6)}</Box>
            </Box>
          </SpaceBetween>
        </Box>
      )}

      {/* Metrics Section */}
      {projectData.metadata && (
        <Box>
          <Header variant="h2">Project Metrics</Header>
          <SpaceBetween size="s">
            {projectData.metadata.turbine_count && (
              <Box>
                <Box variant="awsui-key-label">Number of Turbines</Box>
                <Box variant="h3">{projectData.metadata.turbine_count}</Box>
              </Box>
            )}
            {projectData.metadata.total_capacity_mw && (
              <Box>
                <Box variant="awsui-key-label">Total Capacity</Box>
                <Box variant="h3">{projectData.metadata.total_capacity_mw} MW</Box>
              </Box>
            )}
            {projectData.metadata.annual_energy_gwh && (
              <Box>
                <Box variant="awsui-key-label">Annual Energy Production</Box>
                <Box variant="h3">{projectData.metadata.annual_energy_gwh.toFixed(2)} GWh</Box>
              </Box>
            )}
          </SpaceBetween>
        </Box>
      )}

      {/* Timeline Section */}
      <Box>
        <Header variant="h2">Timeline</Header>
        <SpaceBetween size="xs">
          <Box>
            <Box variant="awsui-key-label">Created</Box>
            <Box>{formatTimestamp(projectData.created_at)}</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Last Updated</Box>
            <Box>{formatTimestamp(projectData.updated_at)}</Box>
          </Box>
        </SpaceBetween>
      </Box>
    </SpaceBetween>
  );
};
