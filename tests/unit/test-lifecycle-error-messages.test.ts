/**
 * Unit tests for lifecycle error message templates
 * 
 * Tests error message formatting, user-friendly messages, and suggested actions
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import {
  ERROR_MESSAGES,
  LifecycleErrorFormatter,
  ProjectLifecycleError,
  ProjectSearchFilters,
  DuplicateGroup,
} from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectData } from '../../amplify/functions/shared/projectStore';
import { Coordinates } from '../../amplify/functions/shared/proximityDetector';

describe('Lifecycle Error Message Templates', () => {
  describe('ERROR_MESSAGES constants', () => {
    it('should format PROJECT_NOT_FOUND message', () => {
      const message = ERROR_MESSAGES.PROJECT_NOT_FOUND('test-project');
      expect(message).toContain('test-project');
      expect(message).toContain('not found');
      expect(message).toContain('list projects');
    });

    it('should format NAME_ALREADY_EXISTS message', () => {
      const message = ERROR_MESSAGES.NAME_ALREADY_EXISTS('duplicate-name');
      expect(message).toContain('duplicate-name');
      expect(message).toContain('already exists');
      expect(message).toContain('different name');
    });

    it('should format PROJECT_IN_PROGRESS message', () => {
      const message = ERROR_MESSAGES.PROJECT_IN_PROGRESS('active-project');
      expect(message).toContain('active-project');
      expect(message).toContain('currently being processed');
      expect(message).toContain('wait');
    });

    it('should format CONFIRMATION_REQUIRED message', () => {
      const message = ERROR_MESSAGES.CONFIRMATION_REQUIRED('delete', 'test-project');
      expect(message).toContain('delete');
      expect(message).toContain('test-project');
      expect(message).toContain('yes');
    });

    it('should format NO_PROJECTS_FOUND message', () => {
      const message = ERROR_MESSAGES.NO_PROJECTS_FOUND('location: Texas');
      expect(message).toContain('No projects found');
      expect(message).toContain('location: Texas');
    });

    it('should format INVALID_DATE_RANGE message', () => {
      const message = ERROR_MESSAGES.INVALID_DATE_RANGE('2024-01-01', '2023-01-01');
      expect(message).toContain('Invalid date range');
      expect(message).toContain('2024-01-01');
      expect(message).toContain('2023-01-01');
    });

    it('should format INVALID_SEARCH_RADIUS message', () => {
      const message = ERROR_MESSAGES.INVALID_SEARCH_RADIUS(150);
      expect(message).toContain('Invalid search radius');
      expect(message).toContain('150');
      expect(message).toContain('0.1 and 100');
    });

    it('should format NO_LOCATION_MATCH message', () => {
      const message = ERROR_MESSAGES.NO_LOCATION_MATCH('California');
      expect(message).toContain('No projects found');
      expect(message).toContain('California');
    });

    it('should format NO_INCOMPLETE_PROJECTS message', () => {
      const message = ERROR_MESSAGES.NO_INCOMPLETE_PROJECTS();
      expect(message).toContain('No incomplete projects');
      expect(message).toContain('completed');
    });

    it('should format NO_ARCHIVED_PROJECTS message', () => {
      const message = ERROR_MESSAGES.NO_ARCHIVED_PROJECTS();
      expect(message).toContain('No archived projects');
    });
  });

  describe('LifecycleErrorFormatter', () => {
    describe('formatProjectNotFound', () => {
      it('should format error with available projects', () => {
        const availableProjects = ['project-1', 'project-2', 'project-3'];
        const message = LifecycleErrorFormatter.formatProjectNotFound(
          'missing-project',
          availableProjects
        );

        expect(message).toContain('missing-project');
        expect(message).toContain('not found');
        expect(message).toContain('Available projects');
        expect(message).toContain('project-1');
        expect(message).toContain('list projects');
      });

      it('should format error with no available projects', () => {
        const message = LifecycleErrorFormatter.formatProjectNotFound('missing-project', []);

        expect(message).toContain('missing-project');
        expect(message).toContain('No projects exist');
        expect(message).toContain('Create a project');
        expect(message).toContain('analyze terrain');
      });

      it('should limit displayed projects to 5', () => {
        const availableProjects = Array.from({ length: 10 }, (_, i) => `project-${i}`);
        const message = LifecycleErrorFormatter.formatProjectNotFound(
          'missing-project',
          availableProjects
        );

        expect(message).toContain('and 5 more');
      });
    });

    describe('formatSearchResults', () => {
      const mockProject: ProjectData = {
        project_name: 'test-project',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        coordinates: { latitude: 35.0, longitude: -101.0 },
        terrain_results: { s3_key: 'terrain.json' },
        layout_results: { s3_key: 'layout.json' },
        metadata: {},
      };

      it('should format search results with projects', () => {
        const filters: ProjectSearchFilters = {
          location: 'Texas',
        };

        const message = LifecycleErrorFormatter.formatSearchResults([mockProject], filters);

        expect(message).toContain('Found 1 project');
        expect(message).toContain('test-project');
        expect(message).toContain('Location: Texas');
        expect(message).toContain('50% complete');
      });

      it('should format search results with multiple filters', () => {
        const filters: ProjectSearchFilters = {
          location: 'Texas',
          dateFrom: '2024-01-01',
          incomplete: true,
        };

        const message = LifecycleErrorFormatter.formatSearchResults([mockProject], filters);

        expect(message).toContain('Location: Texas');
        expect(message).toContain('From: 2024-01-01');
        expect(message).toContain('Status: Incomplete');
      });

      it('should format no results message', () => {
        const filters: ProjectSearchFilters = {
          location: 'California',
        };

        const message = LifecycleErrorFormatter.formatSearchResults([], filters);

        expect(message).toContain('No projects found');
        expect(message).toContain('Location: California');
        expect(message).toContain('Suggestions');
      });
    });

    describe('formatNoSearchResults', () => {
      it('should format no results with suggestions', () => {
        const filters: ProjectSearchFilters = {
          location: 'Texas',
          incomplete: true,
        };

        const message = LifecycleErrorFormatter.formatNoSearchResults(filters);

        expect(message).toContain('No projects found');
        expect(message).toContain('Your search');
        expect(message).toContain('Location: Texas');
        expect(message).toContain('Status: Incomplete only');
        expect(message).toContain('Suggestions');
        expect(message).toContain('broader search');
      });

      it('should include coordinate search in message', () => {
        const filters: ProjectSearchFilters = {
          coordinates: { latitude: 35.0, longitude: -101.0 },
          radiusKm: 5,
        };

        const message = LifecycleErrorFormatter.formatNoSearchResults(filters);

        expect(message).toContain('Near: 35, -101');
        expect(message).toContain('5km');
      });
    });

    describe('formatDuplicateGroups', () => {
      it('should format no duplicates message', () => {
        const message = LifecycleErrorFormatter.formatDuplicateGroups([]);

        expect(message).toContain('No duplicate projects');
        expect(message).toContain('unique locations');
      });

      it('should format duplicate groups with actions', () => {
        const mockProject1: ProjectData = {
          project_name: 'project-1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { s3_key: 'terrain.json' },
          metadata: {},
        };

        const mockProject2: ProjectData = {
          project_name: 'project-2',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
          coordinates: { latitude: 35.001, longitude: -101.001 },
          layout_results: { s3_key: 'layout.json' },
          metadata: {},
        };

        const groups: DuplicateGroup[] = [
          {
            centerCoordinates: { latitude: 35.0005, longitude: -101.0005 },
            projects: [mockProject1, mockProject2],
            count: 2,
            radiusKm: 1.0,
          },
        ];

        const message = LifecycleErrorFormatter.formatDuplicateGroups(groups);

        expect(message).toContain('Found 1 group');
        expect(message).toContain('project-1');
        expect(message).toContain('project-2');
        expect(message).toContain('Actions');
        expect(message).toContain('merge projects');
        expect(message).toContain('delete project');
      });
    });

    describe('formatDeleteConfirmation', () => {
      it('should format deletion confirmation with project details', () => {
        const mockProject: ProjectData = {
          project_name: 'test-project',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { s3_key: 'terrain.json' },
          layout_results: { s3_key: 'layout.json' },
          simulation_results: { s3_key: 'simulation.json' },
          metadata: {},
        };

        const message = LifecycleErrorFormatter.formatDeleteConfirmation(mockProject);

        expect(message).toContain('Confirm Deletion');
        expect(message).toContain('test-project');
        expect(message).toContain('75% complete');
        expect(message).toContain('permanently remove');
        expect(message).toContain('Terrain analysis data');
        expect(message).toContain('Layout optimization data');
        expect(message).toContain('Wake simulation results');
        expect(message).toContain("Type 'yes' to confirm");
      });
    });

    describe('formatBulkDeleteConfirmation', () => {
      it('should format bulk deletion confirmation', () => {
        const mockProjects: ProjectData[] = [
          {
            project_name: 'project-1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            terrain_results: { s3_key: 'terrain.json' },
            metadata: {},
          },
          {
            project_name: 'project-2',
            created_at: '2024-01-15T11:00:00Z',
            updated_at: '2024-01-15T11:00:00Z',
            layout_results: { s3_key: 'layout.json' },
            metadata: {},
          },
        ];

        const message = LifecycleErrorFormatter.formatBulkDeleteConfirmation(
          mockProjects,
          'project-*'
        );

        expect(message).toContain('Confirm Bulk Deletion');
        expect(message).toContain('2 project(s)');
        expect(message).toContain('project-*');
        expect(message).toContain('project-1');
        expect(message).toContain('project-2');
        expect(message).toContain('cannot be undone');
      });
    });

    describe('formatMergeConfirmation', () => {
      it('should format merge confirmation with project comparison', () => {
        const sourceProject: ProjectData = {
          project_name: 'source-project',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          terrain_results: { s3_key: 'terrain.json' },
          layout_results: { s3_key: 'layout.json' },
          metadata: {},
        };

        const targetProject: ProjectData = {
          project_name: 'target-project',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
          simulation_results: { s3_key: 'simulation.json' },
          report_results: { s3_key: 'report.json' },
          metadata: {},
        };

        const message = LifecycleErrorFormatter.formatMergeConfirmation(
          sourceProject,
          targetProject
        );

        expect(message).toContain('Confirm Project Merge');
        expect(message).toContain('source-project');
        expect(message).toContain('target-project');
        expect(message).toContain('Source Project (will be deleted)');
        expect(message).toContain('Target Project (will be kept)');
        expect(message).toContain('Which name would you like to keep');
      });
    });

    describe('formatArchiveSuggestion', () => {
      it('should format archive suggestion for old projects', () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

        const oldProjects: ProjectData[] = [
          {
            project_name: 'old-project-1',
            created_at: oldDate.toISOString(),
            updated_at: oldDate.toISOString(),
            metadata: {},
          },
          {
            project_name: 'old-project-2',
            created_at: oldDate.toISOString(),
            updated_at: oldDate.toISOString(),
            metadata: {},
          },
        ];

        const message = LifecycleErrorFormatter.formatArchiveSuggestion(oldProjects);

        expect(message).toContain('Suggestion');
        expect(message).toContain('2 project(s)');
        expect(message).toContain('older than 30 days');
        expect(message).toContain('old-project-1');
        expect(message).toContain('days old');
        expect(message).toContain('archive project');
      });

      it('should return empty string for no old projects', () => {
        const message = LifecycleErrorFormatter.formatArchiveSuggestion([]);
        expect(message).toBe('');
      });
    });

    describe('formatValidationError', () => {
      it('should format INVALID_COORDINATES error', () => {
        const message = LifecycleErrorFormatter.formatValidationError(
          ProjectLifecycleError.INVALID_COORDINATES,
          { coordinates: '100, 200' }
        );

        expect(message).toContain('Invalid coordinates');
        expect(message).toContain('100, 200');
        expect(message).toContain('Latitude: -90 to 90');
        expect(message).toContain('Longitude: -180 to 180');
      });

      it('should format INVALID_PROJECT_NAME error', () => {
        const message = LifecycleErrorFormatter.formatValidationError(
          ProjectLifecycleError.INVALID_PROJECT_NAME,
          { name: 'Invalid Name!' }
        );

        expect(message).toContain('Invalid project name');
        expect(message).toContain('Invalid Name!');
        expect(message).toContain('Lowercase letters only');
        expect(message).toContain('hyphens');
      });

      it('should format INVALID_SEARCH_RADIUS error', () => {
        const message = LifecycleErrorFormatter.formatValidationError(
          ProjectLifecycleError.INVALID_SEARCH_RADIUS,
          { radius: 150 }
        );

        expect(message).toContain('Invalid search radius');
        expect(message).toContain('150');
        expect(message).toContain('Minimum: 0.1 km');
        expect(message).toContain('Maximum: 100 km');
      });
    });
  });

  describe('Error message context and suggestions', () => {
    it('should include actionable suggestions in all error messages', () => {
      const testCases = [
        ERROR_MESSAGES.PROJECT_NOT_FOUND('test'),
        ERROR_MESSAGES.NO_PROJECTS_FOUND('criteria'),
        ERROR_MESSAGES.NO_LOCATION_MATCH('Texas'),
      ];

      testCases.forEach((message) => {
        // Each message should provide context about what went wrong
        expect(message.length).toBeGreaterThan(20);
        // Messages should be user-friendly (not technical error codes)
        expect(message).not.toMatch(/ERROR_\d+/);
      });
    });

    it('should provide next steps in formatted messages', () => {
      const availableProjects = ['project-1', 'project-2'];
      const message = LifecycleErrorFormatter.formatProjectNotFound(
        'missing',
        availableProjects
      );

      expect(message).toContain('Suggestions');
      expect(message).toMatch(/•/); // Bullet points for suggestions
    });
  });
});
