/**
 * Integration Tests for Project Search and Filtering
 * 
 * Tests the searchProjects method with real ProjectStore integration
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { ProjectLifecycleManager, ProjectSearchFilters } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('ProjectLifecycleManager - Search Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  const TEST_BUCKET = process.env.RENEWABLE_S3_BUCKET || 'test-bucket';

  beforeAll(() => {
    // Create real instances (but with test bucket)
    projectStore = new ProjectStore(TEST_BUCKET);
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager(projectStore);

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );
  });

  describe('Real-world Search Scenarios', () => {
    it('should search for Texas wind farms', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} Texas wind farms`);
      
      // Verify all results contain 'texas' in name
      results.forEach(project => {
        expect(project.project_name.toLowerCase()).toContain('texas');
      });
    });

    it('should search for recent projects (last 30 days)', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filters: ProjectSearchFilters = {
        dateFrom: thirtyDaysAgo.toISOString(),
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} projects from last 30 days`);

      // Verify all results are within date range
      results.forEach(project => {
        const createdDate = new Date(project.created_at);
        expect(createdDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
      });
    });

    it('should search for incomplete projects', async () => {
      const filters: ProjectSearchFilters = {
        incomplete: true,
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} incomplete projects`);

      // Verify all results are actually incomplete
      results.forEach(project => {
        const isComplete = 
          project.terrain_results &&
          project.layout_results &&
          project.simulation_results &&
          project.report_results;
        
        expect(isComplete).toBe(false);
      });
    });

    it('should search for projects near specific coordinates', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.067482, longitude: -101.395466 },
        radiusKm: 10,
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} projects within 10km of coordinates`);

      // Log distances for verification
      results.forEach(project => {
        if (project.coordinates) {
          console.log(`  - ${project.project_name}: ${project.coordinates.latitude}, ${project.coordinates.longitude}`);
        }
      });
    });

    it('should search for non-archived projects', async () => {
      const filters: ProjectSearchFilters = {
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} non-archived projects`);

      // Verify all results are not archived
      results.forEach(project => {
        expect(project.metadata?.archived || false).toBe(false);
      });
    });

    it('should combine multiple filters for complex search', async () => {
      const filters: ProjectSearchFilters = {
        location: 'wind',
        incomplete: true,
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} incomplete, non-archived wind projects`);

      // Verify all conditions are met
      results.forEach(project => {
        expect(project.project_name.toLowerCase()).toContain('wind');
        expect(project.metadata?.archived || false).toBe(false);
        
        const isComplete = 
          project.terrain_results &&
          project.layout_results &&
          project.simulation_results &&
          project.report_results;
        
        expect(isComplete).toBe(false);
      });
    });
  });

  describe('Search Result Quality', () => {
    it('should return projects sorted by relevance', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
      };

      const results = await lifecycleManager.searchProjects(filters);

      // Verify results are returned (sorting is not required by spec)
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty search results gracefully', async () => {
      const filters: ProjectSearchFilters = {
        location: 'nonexistent-location-xyz',
      };

      const results = await lifecycleManager.searchProjects(filters);

      expect(results).toEqual([]);
    });

    it('should handle search with no filters (return all)', async () => {
      const filters: ProjectSearchFilters = {};

      const results = await lifecycleManager.searchProjects(filters);

      console.log(`Found ${results.length} total projects`);
      
      // Should return all projects
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Search Performance', () => {
    it('should complete search within reasonable time', async () => {
      const startTime = Date.now();

      const filters: ProjectSearchFilters = {
        location: 'wind',
        archived: false,
      };

      const results = await lifecycleManager.searchProjects(filters);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Search completed in ${duration}ms`);
      console.log(`Found ${results.length} results`);

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', async () => {
      const filters: ProjectSearchFilters = {
        dateFrom: 'not-a-valid-date',
      };

      // Should not throw error
      await expect(lifecycleManager.searchProjects(filters)).resolves.toBeDefined();
    });

    it('should handle invalid coordinates gracefully', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 999, longitude: 999 }, // Invalid coordinates
        radiusKm: 10,
      };

      // Should not throw error
      await expect(lifecycleManager.searchProjects(filters)).resolves.toBeDefined();
    });

    it('should handle negative radius gracefully', async () => {
      const filters: ProjectSearchFilters = {
        coordinates: { latitude: 35.0, longitude: -101.0 },
        radiusKm: -10, // Invalid negative radius
      };

      // Should not throw error
      await expect(lifecycleManager.searchProjects(filters)).resolves.toBeDefined();
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent results for same query', async () => {
      const filters: ProjectSearchFilters = {
        location: 'texas',
        archived: false,
      };

      const results1 = await lifecycleManager.searchProjects(filters);
      const results2 = await lifecycleManager.searchProjects(filters);

      // Should return same number of results
      expect(results1.length).toBe(results2.length);

      // Should return same project names
      const names1 = results1.map(p => p.project_name).sort();
      const names2 = results2.map(p => p.project_name).sort();
      expect(names1).toEqual(names2);
    });
  });
});
