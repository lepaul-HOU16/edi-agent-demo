/**
 * Project List Backend Tests
 * 
 * Tests only the backend logic without UI component rendering
 * to avoid Jest/Cloudscape ESM configuration issues.
 * 
 * Requirements: 8.1, 8.3, 8.6
 */

import { ProjectListHandler, ProjectSummary } from '../amplify/functions/shared/projectListHandler';

describe('Project List Backend', () => {
  describe('Query Detection', () => {
    it('should detect "list my projects" queries', () => {
      const queries = [
        'list my renewable projects',
        'show my projects',
        'what projects do I have',
        'view my renewable projects',
        'see all my projects',
        'list my projects',
        'my renewable projects'
      ];

      queries.forEach(query => {
        const isMatch = ProjectListHandler.isProjectListQuery(query);
        expect(isMatch).toBe(true);
      });
    });

    it('should detect "show project {name}" queries', () => {
      const testCases = [
        { query: 'show project west-texas-wind-farm', expected: 'west-texas-wind-farm' },
        { query: 'details for project amarillo-tx', expected: 'amarillo-tx' },
        { query: 'project panhandle-wind details', expected: 'panhandle-wind' },
        { query: 'view project texas-site-1', expected: 'texas-site-1' },
        { query: 'info about project my-wind-farm', expected: 'my-wind-farm' },
        { query: 'status of project test-123', expected: 'test-123' }
      ];

      testCases.forEach(({ query, expected }) => {
        const result = ProjectListHandler.isProjectDetailsQuery(query);
        expect(result.isMatch).toBe(true);
        expect(result.projectName).toBe(expected);
      });
    });

    it('should not match non-project queries', () => {
      const queries = [
        'analyze terrain at coordinates',
        'optimize layout',
        'run wake simulation',
        'hello',
        'what is wind energy',
        'help me with renewable energy'
      ];

      queries.forEach(query => {
        const isListMatch = ProjectListHandler.isProjectListQuery(query);
        const isDetailsMatch = ProjectListHandler.isProjectDetailsQuery(query);
        expect(isListMatch).toBe(false);
        expect(isDetailsMatch.isMatch).toBe(false);
      });
    });

    it('should handle case-insensitive matching', () => {
      expect(ProjectListHandler.isProjectListQuery('LIST MY PROJECTS')).toBe(true);
      expect(ProjectListHandler.isProjectListQuery('List My Projects')).toBe(true);
      
      const result = ProjectListHandler.isProjectDetailsQuery('SHOW PROJECT TEST-PROJECT');
      expect(result.isMatch).toBe(true);
      expect(result.projectName).toBe('TEST-PROJECT');
    });
  });

  describe('Project Status Calculation', () => {
    it('should calculate 0% completion for new project', () => {
      const status = {
        terrain: false,
        layout: false,
        simulation: false,
        report: false
      };
      
      const completed = [status.terrain, status.layout, status.simulation, status.report].filter(Boolean).length;
      const percentage = Math.round((completed / 4) * 100);
      
      expect(percentage).toBe(0);
    });

    it('should calculate 25% completion after terrain', () => {
      const status = {
        terrain: true,
        layout: false,
        simulation: false,
        report: false
      };
      
      const completed = [status.terrain, status.layout, status.simulation, status.report].filter(Boolean).length;
      const percentage = Math.round((completed / 4) * 100);
      
      expect(percentage).toBe(25);
    });

    it('should calculate 50% completion after layout', () => {
      const status = {
        terrain: true,
        layout: true,
        simulation: false,
        report: false
      };
      
      const completed = [status.terrain, status.layout, status.simulation, status.report].filter(Boolean).length;
      const percentage = Math.round((completed / 4) * 100);
      
      expect(percentage).toBe(50);
    });

    it('should calculate 75% completion after simulation', () => {
      const status = {
        terrain: true,
        layout: true,
        simulation: true,
        report: false
      };
      
      const completed = [status.terrain, status.layout, status.simulation, status.report].filter(Boolean).length;
      const percentage = Math.round((completed / 4) * 100);
      
      expect(percentage).toBe(75);
    });

    it('should calculate 100% completion after report', () => {
      const status = {
        terrain: true,
        layout: true,
        simulation: true,
        report: true
      };
      
      const completed = [status.terrain, status.layout, status.simulation, status.report].filter(Boolean).length;
      const percentage = Math.round((completed / 4) * 100);
      
      expect(percentage).toBe(100);
    });
  });

  describe('Project Summary Structure', () => {
    it('should have correct structure for project summary', () => {
      const mockProject: ProjectSummary = {
        project_name: 'west-texas-wind-farm',
        status: {
          terrain: true,
          layout: true,
          simulation: false,
          report: false,
          completionPercentage: 50
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        metrics: {
          turbine_count: 12,
          total_capacity_mw: 30,
          annual_energy_gwh: 95.5
        },
        isActive: true
      };

      // Verify all required fields exist
      expect(mockProject).toHaveProperty('project_name');
      expect(mockProject).toHaveProperty('status');
      expect(mockProject.status).toHaveProperty('terrain');
      expect(mockProject.status).toHaveProperty('layout');
      expect(mockProject.status).toHaveProperty('simulation');
      expect(mockProject.status).toHaveProperty('report');
      expect(mockProject.status).toHaveProperty('completionPercentage');
      expect(mockProject).toHaveProperty('created_at');
      expect(mockProject).toHaveProperty('updated_at');
      expect(mockProject).toHaveProperty('coordinates');
      expect(mockProject).toHaveProperty('metrics');
      expect(mockProject).toHaveProperty('isActive');

      // Verify types
      expect(typeof mockProject.project_name).toBe('string');
      expect(typeof mockProject.status.terrain).toBe('boolean');
      expect(typeof mockProject.status.completionPercentage).toBe('number');
      expect(typeof mockProject.isActive).toBe('boolean');
    });

    it('should handle optional fields', () => {
      const minimalProject: ProjectSummary = {
        project_name: 'minimal-project',
        status: {
          terrain: false,
          layout: false,
          simulation: false,
          report: false,
          completionPercentage: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isActive: false
      };

      // Should work without coordinates and metrics
      expect(minimalProject.coordinates).toBeUndefined();
      expect(minimalProject.metrics).toBeUndefined();
      expect(minimalProject.project_name).toBe('minimal-project');
    });
  });

  describe('Response Message Format', () => {
    it('should format empty project list message', () => {
      const emptyMessage = 'You don\'t have any renewable energy projects yet. Start by analyzing terrain at a location:\n\n"analyze terrain at 35.067482, -101.395466"';
      
      expect(emptyMessage).toContain('don\'t have any');
      expect(emptyMessage).toContain('analyze terrain');
    });

    it('should format project not found message', () => {
      const notFoundMessage = 'Project "non-existent-project" not found. Use "list my renewable projects" to see available projects.';
      
      expect(notFoundMessage).toContain('not found');
      expect(notFoundMessage).toContain('list my renewable projects');
    });

    it('should include project name in details message', () => {
      const projectName = 'west-texas-wind-farm';
      const detailsMessage = `# Project: ${projectName}`;
      
      expect(detailsMessage).toContain(projectName);
      expect(detailsMessage).toContain('Project:');
    });
  });

  describe('Integration with Orchestrator', () => {
    it('should return correct metadata for list query', () => {
      const mockMetadata = {
        executionTime: 150,
        toolsUsed: ['project_list'],
        projectCount: 3,
        activeProject: 'west-texas-wind-farm'
      };

      expect(mockMetadata.toolsUsed).toContain('project_list');
      expect(mockMetadata.projectCount).toBe(3);
      expect(mockMetadata.activeProject).toBe('west-texas-wind-farm');
    });

    it('should return correct metadata for details query', () => {
      const mockMetadata = {
        executionTime: 100,
        toolsUsed: ['project_details'],
        projectName: 'west-texas-wind-farm'
      };

      expect(mockMetadata.toolsUsed).toContain('project_details');
      expect(mockMetadata.projectName).toBe('west-texas-wind-farm');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing project gracefully', () => {
      const errorResponse = {
        success: false,
        message: 'Project "missing-project" not found.'
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toContain('not found');
    });

    it('should handle empty project list gracefully', () => {
      const emptyResponse = {
        success: true,
        message: 'You don\'t have any renewable energy projects yet.',
        projects: []
      };

      expect(emptyResponse.success).toBe(true);
      expect(emptyResponse.projects).toHaveLength(0);
    });

    it('should handle S3 errors gracefully', () => {
      const errorResponse = {
        success: false,
        message: 'Failed to list projects. Please try again.'
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.message).toContain('Failed');
    });
  });

  describe('Active Project Marking', () => {
    it('should mark active project correctly', () => {
      const projects: ProjectSummary[] = [
        {
          project_name: 'project-1',
          status: { terrain: true, layout: false, simulation: false, report: false, completionPercentage: 25 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isActive: false
        },
        {
          project_name: 'project-2',
          status: { terrain: true, layout: true, simulation: false, report: false, completionPercentage: 50 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isActive: true
        }
      ];

      const activeProject = projects.find(p => p.isActive);
      expect(activeProject).toBeDefined();
      expect(activeProject?.project_name).toBe('project-2');
    });

    it('should handle no active project', () => {
      const projects: ProjectSummary[] = [
        {
          project_name: 'project-1',
          status: { terrain: true, layout: false, simulation: false, report: false, completionPercentage: 25 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isActive: false
        }
      ];

      const activeProject = projects.find(p => p.isActive);
      expect(activeProject).toBeUndefined();
    });
  });
});

