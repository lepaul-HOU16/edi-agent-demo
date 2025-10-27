/**
 * Unit Tests for Project Dashboard Artifact Component
 * 
 * Tests the ProjectDashboardArtifact component rendering and functionality
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDashboardArtifact from '../../src/components/renewable/ProjectDashboardArtifact';

describe('ProjectDashboardArtifact', () => {
  const mockDashboardData = {
    projects: [
      {
        name: 'west-texas-wind-farm',
        location: 'West Texas',
        completionPercentage: 100,
        lastUpdated: new Date().toISOString(),
        isActive: true,
        isDuplicate: false,
        status: 'Complete'
      },
      {
        name: 'amarillo-wind-project',
        location: 'Amarillo',
        completionPercentage: 75,
        lastUpdated: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        isActive: false,
        isDuplicate: true,
        status: 'Simulation Complete'
      },
      {
        name: 'amarillo-wind-project-2',
        location: 'Amarillo',
        completionPercentage: 50,
        lastUpdated: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isActive: false,
        isDuplicate: true,
        status: 'Layout Complete'
      }
    ],
    totalProjects: 3,
    activeProject: 'west-texas-wind-farm',
    duplicateGroups: [
      {
        location: 'Amarillo, TX',
        count: 2,
        projects: [
          {
            project_name: 'amarillo-wind-project',
            coordinates: { latitude: 35.067482, longitude: -101.395466 }
          },
          {
            project_name: 'amarillo-wind-project-2',
            coordinates: { latitude: 35.067482, longitude: -101.395466 }
          }
        ]
      }
    ]
  };

  describe('Requirement 7.1: Display project list with status indicators', () => {
    it('should render project names', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('west-texas-wind-farm')).toBeInTheDocument();
      expect(screen.getByText('amarillo-wind-project')).toBeInTheDocument();
      expect(screen.getByText('amarillo-wind-project-2')).toBeInTheDocument();
    });

    it('should display location for each project', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('West Texas')).toBeInTheDocument();
      expect(screen.getAllByText('Amarillo')).toHaveLength(2);
    });

    it('should show last updated timestamps', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('2 days ago')).toBeInTheDocument();
    });
  });

  describe('Requirement 7.2: Show completion percentage', () => {
    it('should display completion percentage for each project', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show status labels', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('✓ Complete')).toBeInTheDocument();
      expect(screen.getByText('⚡ Simulation Complete')).toBeInTheDocument();
      expect(screen.getByText('📐 Layout Complete')).toBeInTheDocument();
    });
  });

  describe('Requirement 7.3: Highlight duplicate projects', () => {
    it('should show duplicate badge for duplicate projects', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      const duplicateBadges = screen.getAllByText('Duplicate');
      expect(duplicateBadges).toHaveLength(2);
    });

    it('should display duplicate groups warning', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText(/1 Duplicate Group Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Amarillo, TX: 2 projects/i)).toBeInTheDocument();
    });
  });

  describe('Requirement 7.4: Show active project marker', () => {
    it('should display active badge for active project', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show active project alert', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText(/Currently working on:/i)).toBeInTheDocument();
      expect(screen.getByText('west-texas-wind-farm')).toBeInTheDocument();
    });
  });

  describe('Requirement 7.5: Provide quick actions', () => {
    it('should render action buttons for each project', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      const actionButtons = screen.getAllByLabelText('Project actions');
      expect(actionButtons).toHaveLength(3);
    });
  });

  describe('Requirement 7.6: Display summary statistics', () => {
    it('should show total projects count', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show complete projects count', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show in progress projects count', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show duplicates count', () => {
      render(<ProjectDashboardArtifact data={mockDashboardData} />);
      
      expect(screen.getByText('Duplicates')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project list', () => {
      const emptyData = {
        projects: [],
        totalProjects: 0,
        activeProject: null,
        duplicateGroups: []
      };

      render(<ProjectDashboardArtifact data={emptyData} />);
      
      expect(screen.getByText(/No renewable energy projects found/i)).toBeInTheDocument();
    });

    it('should handle no active project', () => {
      const noActiveData = {
        ...mockDashboardData,
        activeProject: null
      };

      render(<ProjectDashboardArtifact data={noActiveData} />);
      
      expect(screen.queryByText(/Currently working on:/i)).not.toBeInTheDocument();
    });

    it('should handle no duplicates', () => {
      const noDuplicatesData = {
        ...mockDashboardData,
        projects: mockDashboardData.projects.map(p => ({ ...p, isDuplicate: false })),
        duplicateGroups: []
      };

      render(<ProjectDashboardArtifact data={noDuplicatesData} />);
      
      expect(screen.queryByText(/Duplicate Group/i)).not.toBeInTheDocument();
    });
  });
});
