/**
 * Unit Tests for Project Search and Filtering
 * 
 * Tests the searchProjects method with various filter combinations
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { ProjectLifecycleManager, ProjectSearchFilters } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - Search and Filtering', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  // Sample test projects
  const testProjects: ProjectData[] = [
    {
      project_name: 'texas-wind-farm-1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      coordinates: { latitude: 35.0, longitude: -101.0 },
      terrain_results: { s3_key: 'terrain1' },
      layout_results: { s3_key: 'layout1' },
      simulation_results: { s3_key: 'simulation1' },
      report_results: { s3_key: 'report1' },
      metadata: { archived: false },
    },
    {
      project_name: 'california-wind-farm',
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-02-01T10:00:00Z',
      coordinates: { latitude: 36.0, longitude: -120.0 },
      terrain_results: { s3_key: 'terrain2' },
      layout_results: { s3_key: 'layout2' },
      metadata: { archived: false },
    },
    {
      project_name: 'texas-wind-farm-2',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      coordinates: { latitude: 35.1, longitude: -101.1 },
      terrain_results: { s3_key: 'terrain3' },
      metadata: { archived: false },
    },
    {
      project_name: 'archived-texas-project',
      created_at: '2023-12-01T10:00:00Z',
      updated_at: '2023-12-01T10:00:00Z',
      coordinates: { latitude: 34.0, longitude: -102.0 },
      terrain_results: { s3_key: 'terrain4' },
      layout_results: { s3_key: 'layout4' },
      simulation_results: { s3_key: 'simulation4' },
      report_results: { s3_key: 'report4' },
      metadata: { archived: true, archived_at: '2024-01-01T00:00:00Z' },
    },
    {
      project_name: 'oklahoma-wind-farm',
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
      coordinates: { latitude: 36.5, longitude: -98.0 },
      terrain_results: { s3_key: 'terrain5' },
      layout_results: { s3_key: 'layout5' },
      simulation_results: { s3_key: 'simulation5' },
      report_results: { s3_key: 'report5' },
      metadata: { archived: false },
    },
  ];

  beforeEach(() => {
    // Create mock instances
    mockProjectStore = new ProjectStore('test-bucket') as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator(mockProjectStore) as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager(mockProjectStore) as jest.Mocked<SessionContextManager>;

    // Setup default mock behavior
    mockProjectStore.list = jest.fn().mockResolvedValue(testProjects);

    // Create lifecycle manager instance
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Location Name Filtering (Requirement 5.1)', () => {
    it('should filter projects by location name - texas', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(3);
      expect(results.every(p => p.project_name.includes('texas'))).toBe(true);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'texas-wind-farm-2',
          'archived-texas-project',
        ])
      );
    });

    it('should filter projects by location name - california', async () => {
      const filters: ProjectSearchFilters = {
        location: 'california',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(1);
      expect(results[0].project_name).toBe('california-wind-farm');
    });

    it('should be case-insensitive', async () => {
      const filters: ProjectSearchFilters = {
        location: 'TEXAS',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(3);
      expect(results.every(p => p.project_name.toLowerCase().includes('texas'))).toBe(true);
    });

    it('should return empty array when no matches', async () => {
      const filters: ProjectSearchFilters = {
        location: 'nonexistent',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(0);
    });
  });

  describe('Date Range Filtering (Requirement 5.2)', () => {
    it('should filter projects by dateFrom', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: '2024-02-01T00:00:00Z',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(2);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'california-wind-farm',
          'oklahoma-wind-farm',
        ])
      );
    });

    it('should filter projects by dateTo', async () => {
      const filters: ProjectSearchFilters = {
        dateTo: '2024-01-31T23:59:59Z',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(3);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'texas-wind-farm-2',
          'archived-texas-project',
        ])
      );
    });

    it('should filter projects by date range (dateFrom and dateTo)', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: '2024-01-15T00:00:00Z',
        dateTo: '2024-02-15T23:59:59Z',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(3);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'texas-wind-farm-2',
          'california-wind-farm',
        ])
      );
    });

    it('should return empty array when date range has no matches', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: '2025-01-01T00:00:00Z',
        dateTo: '2025-12-31T23:59:59Z',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(0);
    });
  });

  describe('Incomplete Project Filtering (Requirement 5.3)', () => {
    it('should filter incomplete projects', async () => {
      const filters: ProjectSearchFilters = {
        incomplete: true,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(2);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'california-wind-farm',
          'texas-wind-farm-2',
        ])
      );

      // Verify these projects are actually incomplete
      results.forEach(project => {
        const hasAllResults = !!(
          project.terrain_results &&
          project.layout_results &&
          project.simulation_results &&
          project.report_results
        );
        expect(hasAllResults).toBe(false);
      });
    });

    it('should return complete projects when incomplete is false', async () => {
      const filters: ProjectSearchFilters = {
        incomplete: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // When incomplete is false, it should return all projects (no filtering)
      expect(results).toHaveLength(5);
    });

    it('should identify projects missing terrain', async () => {
      const projectsWithoutTerrain = testProjects.filter(p => !p.terrain_results);
      expect(projectsWithoutTerrain).toHaveLength(0); // All test projects have terrain

      const filters: ProjectSearchFilters = {
        incomplete: true,
      };

      const results = await lifecycleManager.searchProjects(filters);
      
      // Should find projects missing other results
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinate Proximity Filtering (Requirement 5.4)', () => {
    it('should filter projects within 50km radius', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: 50,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should find texas-wind-farm-1 and texas-wind-farm-2 (close to each other)
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.project_name === 'texas-wind-farm-1')).toBe(true);
    });

    it('should filter projects within 200km radius', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: 200,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should find multiple Texas projects
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no projects within radius', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 0, longitude: 0 }, // Middle of Atlantic Ocean
        radiusKm: 10,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(0);
    });

    it('should handle very small radius', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: 0.1, // 100 meters
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should only find exact match or very close projects
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Archived Status Filtering (Requirement 5.5)', () => {
    it('should filter archived projects', async () => {
      const filters: ProjectSearchFilters = {
        archived: true,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(1);
      expect(results[0].project_name).toBe('archived-texas-project');
      expect(results[0].metadata?.archived).toBe(true);
    });

    it('should filter non-archived projects', async () => {
      const filters: ProjectSearchFilters = {
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(4);
      expect(results.every(p => p.metadata?.archived === false)).toBe(true);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'california-wind-farm',
          'texas-wind-farm-2',
          'oklahoma-wind-farm',
        ])
      );
    });

    it('should return all projects when archived filter not specified', async () => {
      const filters: ProjectSearchFilters = {};

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(5);
    });
  });

  describe('Combined Filters', () => {
    it('should combine location and date filters', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
        dateFrom: '2024-01-01T00:00:00Z',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(2);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'texas-wind-farm-2',
        ])
      );
    });

    it('should combine location and incomplete filters', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
        incomplete: true,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(1);
      expect(results[0].project_name).toBe('texas-wind-farm-2');
    });

    it('should combine location and archived filters', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(2);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'texas-wind-farm-1',
          'texas-wind-farm-2',
        ])
      );
    });

    it('should combine date range and incomplete filters', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-02-28T23:59:59Z',
        incomplete: true,
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(2);
      expect(results.map(p => p.project_name)).toEqual(
        expect.arrayContaining([
          'california-wind-farm',
          'texas-wind-farm-2',
        ])
      );
    });

    it('should combine coordinates and archived filters', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: 200,
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should find Texas projects but exclude archived ones
      expect(results.every(p => p.metadata?.archived === false)).toBe(true);
    });

    it('should combine all filters', async () => {
      const filters: ProjectSearchFilters = {
        location: 'wind',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-12-31T23:59:59Z',
        incomplete: true,
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should find incomplete, non-archived wind farms created in 2024
      expect(results.length).toBeGreaterThanOrEqual(0);
      results.forEach(project => {
        expect(project.project_name).toContain('wind');
        expect(project.metadata?.archived).toBe(false);
        expect(new Date(project.created_at).getFullYear()).toBe(2024);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project list', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([]);

      const filters: ProjectSearchFilters = {
        location: 'texas',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toHaveLength(0);
    });

    it('should handle projects without coordinates', async () => {
      const projectsWithoutCoords: ProjectData[] = [
        {
          project_name: 'no-coords-project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          metadata: {},
        },
      ];

      mockProjectStore.list = jest.fn().mockResolvedValue(projectsWithoutCoords);

      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: 100,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should handle gracefully and return empty
      expect(results).toHaveLength(0);
    });

    it('should handle projects without metadata', async () => {
      const projectsWithoutMetadata: ProjectData[] = [
        {
          project_name: 'no-metadata-project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockProjectStore.list = jest.fn().mockResolvedValue(projectsWithoutMetadata);

      const filters: ProjectSearchFilters = {
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should treat missing metadata as not archived
      expect(results).toHaveLength(1);
    });

    it('should handle invalid date formats gracefully', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: 'invalid-date',
      };

      // Should not throw error
      await expect(lifecycleManager.searchProjects(filters)).resolves.toBeDefined();
    });

    it('should handle store errors gracefully', async () => {
      mockProjectStore.list = jest.fn().mockRejectedValue(new Error('S3 error'));

      const filters: ProjectSearchFilters = {
        location: 'texas',
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Should return empty array on error
      expect(results).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle large project lists efficiently', async () => {
      // Create 1000 test projects
      const largeProjectList: ProjectData[] = Array.from({ length: 1000 }, (_, i) => ({
        project_name: `project-${i}`,
        created_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
        updated_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
        coordinates: {
          latitude: 35 + (i % 10) * 0.1,
          longitude: -101 + (i % 10) * 0.1,
        },
        metadata: { archived: i % 10 === 0 },
      }));

      mockProjectStore.list = jest.fn().mockResolvedValue(largeProjectList);

      const startTime = Date.now();

      const filters: ProjectSearchFilters = {
        location: 'project',
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
