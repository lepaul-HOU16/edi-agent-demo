/**
 * Project Dashboard Artifact Component
 * 
 * Displays a comprehensive dashboard of all renewable energy projects with:
 * - Project list with status indicators
 * - Completion percentage calculation
 * - Duplicate project highlighting
 * - Active project marker
 * - Quick action buttons (view, continue, delete, rename)
 * - Sortable columns
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  Box,
  SpaceBetween,
  Badge,
  Button,
  Header,
  Link,
  Alert,
  Container,
  ColumnLayout,
  ButtonDropdown,
  Icon
} from '@cloudscape-design/components';

// ============================================================================
// Type Definitions
// ============================================================================

interface ProjectDashboardData {
  projects: Array<{
    name: string;
    location: string;
    completionPercentage: number;
    lastUpdated: string;
    isActive: boolean;
    isDuplicate: boolean;
    status: string;
  }>;
  totalProjects: number;
  activeProject: string | null;
  duplicateGroups: Array<{
    location: string;
    count: number;
    projects: Array<{
      project_name: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    }>;
  }>;
}

interface ProjectDashboardArtifactProps {
  data: ProjectDashboardData;
  darkMode?: boolean;
  onAction?: (action: string, projectName: string) => void;
}

// ============================================================================
// Component
// ============================================================================

const ProjectDashboardArtifact: React.FC<ProjectDashboardArtifactProps> = ({
  data,
  darkMode = true,
  onAction
}) => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [sortingColumn, setSortingColumn] = useState<any>({ sortingField: 'lastUpdated' });
  const [sortingDescending, setSortingDescending] = useState(true);

  /**
   * Handle bulk delete action
   */
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    const projectNames = selectedItems.map(item => item.name);
    console.log(`[ProjectDashboardArtifact] Bulk delete requested for: ${projectNames.join(', ')}`);
    
    if (onAction) {
      onAction('bulk-delete', JSON.stringify(projectNames));
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Format timestamp to human-readable format
   * Requirement: 7.1 - Display last updated
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
   * Handle action button click
   * Requirement: 7.5 - Provide quick actions
   */
  const handleAction = (action: string, projectName: string) => {
    console.log(`[ProjectDashboardArtifact] Action: ${action} on project: ${projectName}`);
    if (onAction) {
      onAction(action, projectName);
    }
  };

  // ============================================================================
  // Table Configuration
  // ============================================================================

  /**
   * Table column definitions
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   */
  const columnDefinitions = [
    {
      id: 'name',
      header: 'Project Name',
      cell: (item: any) => (
        <SpaceBetween direction="horizontal" size="xs">
          {/* Requirement 7.4 - Show active project marker */}
          {item.isActive && (
            <Badge color="green">
              <Icon name="status-positive" /> Active
            </Badge>
          )}
          {/* Requirement 7.3 - Highlight duplicate projects */}
          {item.isDuplicate && (
            <Badge color="red">
              <Icon name="status-warning" /> Duplicate
            </Badge>
          )}
          <Link
            variant="primary"
            onFollow={() => handleAction('view', item.name)}
          >
            {item.name}
          </Link>
        </SpaceBetween>
      ),
      sortingField: 'name',
      isRowHeader: true,
      minWidth: 250
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item: any) => item.location,
      sortingField: 'location',
      minWidth: 180
    },
    {
      id: 'completion',
      header: 'Completion',
      cell: (item: any) => (
        <Box textAlign="center">
          {/* Donut chart representation using CSS */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(
              ${item.completionPercentage === 100 ? '#037f0c' : 
                item.completionPercentage >= 75 ? '#0972d3' : 
                item.completionPercentage >= 50 ? '#ff9900' : '#d91515'} 
              ${item.completionPercentage * 3.6}deg, 
              #414d5c ${item.completionPercentage * 3.6}deg
            )`,
            position: 'relative'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: darkMode ? '#0f1b2a' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: darkMode ? '#ffffff' : '#000000'
            }}>
              {item.completionPercentage}%
            </div>
          </div>
        </Box>
      ),
      sortingField: 'completionPercentage',
      minWidth: 120
    },
    {
      id: 'lastUpdated',
      header: 'Last Updated',
      cell: (item: any) => (
        <Box fontSize="body-s">
          {formatTimestamp(item.lastUpdated)}
        </Box>
      ),
      sortingField: 'lastUpdated',
      minWidth: 130
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: any) => (
        /* Requirement 7.5 - Provide quick actions */
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            iconName="view-full"
            onClick={() => handleAction('view', item.name)}
            variant="inline-icon"
            ariaLabel={`View ${item.name}`}
          />
          <Button
            iconName="arrow-right"
            onClick={() => handleAction('continue', item.name)}
            variant="inline-icon"
            ariaLabel={`Continue ${item.name}`}
          />
          <Button
            iconName="remove"
            onClick={() => handleAction('delete', item.name)}
            variant="inline-icon"
            ariaLabel={`Delete ${item.name}`}
          />
        </SpaceBetween>
      ),
      minWidth: 120
    }
  ];

  /**
   * Sort projects based on current sorting configuration
   * Requirement: 7.6 - Sortable by name, date, location, completion status
   */
  const sortedProjects = useMemo(() => {
    if (!data.projects) return [];

    const sorted = [...data.projects];
    const field = sortingColumn.sortingField;

    sorted.sort((a: any, b: any) => {
      let aValue = a[field];
      let bValue = b[field];

      // Handle date sorting
      if (field === 'lastUpdated') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortingDescending ? 1 : -1;
      if (aValue > bValue) return sortingDescending ? -1 : 1;
      return 0;
    });

    return sorted;
  }, [data.projects, sortingColumn, sortingDescending]);

  // ============================================================================
  // Summary Statistics
  // ============================================================================

  const statistics = useMemo(() => {
    if (!data.projects) return { total: 0, complete: 0, inProgress: 0, duplicates: 0 };

    return {
      total: data.totalProjects,
      complete: data.projects.filter(p => p.completionPercentage === 100).length,
      inProgress: data.projects.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100).length,
      duplicates: data.projects.filter(p => p.isDuplicate).length
    };
  }, [data.projects, data.totalProjects]);

  // ============================================================================
  // Render
  // ============================================================================

  if (!data || !data.projects) {
    return (
      <Container>
        <Alert type="info" header="No Projects">
          No renewable energy projects found. Start by analyzing terrain at a location.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="project-dashboard-wrapper">
      <style>{`
        /* Scoped styles for project dashboard only */
        .project-dashboard-wrapper .awsui_container_14iqq_1pcv4_93 {
          background-color: transparent !important;
        }
        .project-dashboard-wrapper [class*="awsui_header"] {
          background-color: transparent !important;
        }
        .project-dashboard-wrapper [class*="awsui_root"] {
          background-color: transparent !important;
        }
        /* Prevent horizontal scroll on table only */
        .project-dashboard-wrapper table {
          table-layout: fixed !important;
          width: 100% !important;
        }
        .project-dashboard-wrapper [class*="awsui_wrapper"] {
          overflow-x: hidden !important;
        }
      `}</style>
      <SpaceBetween size="l">
        {/* Summary Statistics */}
        <Container
        header={
          <Header
            variant="h2"
            description="Overview of all renewable energy projects"
          >
            Project Dashboard
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total Projects</Box>
            <Box variant="awsui-value-large">{statistics.total}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Complete</Box>
            <Box variant="awsui-value-large" color="text-status-success">
              {statistics.complete}
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">In Progress</Box>
            <Box variant="awsui-value-large" color="text-status-info">
              {statistics.inProgress}
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Duplicates</Box>
            <Box variant="awsui-value-large" color="text-status-error">
              {statistics.duplicates}
            </Box>
          </div>
        </ColumnLayout>
      </Container>

      {/* Active Project Indicator */}
      {data.activeProject && (
        <Alert type="success" header="Active Project">
          Currently working on: <strong>{data.activeProject}</strong>
        </Alert>
      )}

      {/* Duplicate Groups Warning */}
      {data.duplicateGroups && data.duplicateGroups.length > 0 && (
        <Alert
          type="warning"
          header={`${data.duplicateGroups.length} Duplicate Group${data.duplicateGroups.length > 1 ? 's' : ''} Found`}
        >
          <SpaceBetween size="xs">
            <Box>
              Multiple projects exist at the same location. Consider merging or deleting duplicates.
            </Box>
            {data.duplicateGroups.map((group, index) => (
              <Box key={index} fontSize="body-s">
                • {group.location}: {group.count} projects
              </Box>
            ))}
          </SpaceBetween>
        </Alert>
      )}

      {/* Projects Table */}
      <Table
        columnDefinitions={columnDefinitions}
        items={sortedProjects}
        loadingText="Loading projects"
        sortingColumn={sortingColumn}
        sortingDescending={sortingDescending}
        onSortingChange={(event) => {
          setSortingColumn(event.detail.sortingColumn);
          setSortingDescending(event.detail.isDescending || false);
        }}
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
        selectionType="multi"
        trackBy="name"
        variant="container"
        stickyHeader={false}
        stripedRows={true}
        empty={
          <Box textAlign="center" color="inherit">
            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
              No projects found
            </Box>
          </Box>
        }
        header={
          <Header
            counter={selectedItems.length > 0 ? `(${selectedItems.length}/${sortedProjects.length} selected)` : `(${sortedProjects.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                {selectedItems.length > 0 && (
                  <Button
                    iconName="remove"
                    onClick={handleBulkDelete}
                    variant="normal"
                  >
                    Delete {selectedItems.length} project{selectedItems.length > 1 ? 's' : ''}
                  </Button>
                )}
                <Button
                  iconName="refresh"
                  onClick={() => handleAction('refresh', '')}
                >
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  iconName="add-plus"
                  onClick={() => handleAction('create', '')}
                >
                  New Project
                </Button>
              </SpaceBetween>
            }
          >
            Projects
          </Header>
        }
      />
    </SpaceBetween>
    </div>
  );
};

export default ProjectDashboardArtifact;
