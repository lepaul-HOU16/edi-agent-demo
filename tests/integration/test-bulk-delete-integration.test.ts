/**
 * Integration tests for bulk project deletion
 * 
 * Tests the complete flow of bulk deletion including:
 * - Pattern matching with ProjectStore
 * - Batch deletion with S3
 * - Cache invalidation
 * - Error recovery
 * 
 * Requirements: 2.6, 4.1, 4.2, 4.5, 4.6
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Bulk Delete Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  // Test projects
  const testProjects: ProjectData[] = [
    {
      project_id: 'proj-test-1',
      project_name: 'amarillo-wind-farm-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      coordinates: { latitude: 35.067482, longitude: -101.395466 },
    },
    {
      project_id: 'proj-test-2',
      project_name: 'amarillo-wind-farm-2',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      coordinates: { latitude: 35.067482, longitude: -101.395466 },
    },
    {
      project_id: 'proj-test-3',
      project_name: 'amarillo-wind-farm-3',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
      coordinates: { latitude: 35.067482, longitude: -101.395466 },
    },
    {
      project_id: 'proj-test-4',
      project_name: 'lubbock-solar-1',
      created_at: '2025-01-04T00:00:00Z',
      updated_at: '2025-01-04T00:00:00Z',
      coordinates: { latitude: 33.5779, longitude: -101.8552 },
    },
  ];

  beforeAll(async () => {
    // Initialize real instances (using in-memory cache for testing)
    projectStore = new ProjectStore('test-bucket');
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator();
    sessionContextManager = new SessionContextManager(projectStore);

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    // Populate test data
    for (const project of testProjects) {
      await projectStore.save(project.project_name, project);
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const project of testProjects) {
      try {
        await projectStore.delete(project.project_name);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  beforeEach(() => {
    // Clear caches before each test
    projectStore.clearCache();
    projectResolver.clearCache();
  });

  describe('Pattern Matching Integration', () => {
    it('should find and list projects matching pattern', async () => {
      const result = await lifecycleManager.deleteBulk('amarillo', false);

      expect(result.success).toBe(false); // Requires confirmation
      expect(result.message).toContain('Found 3 project(s)');
      expect(result.message).toContain('amarillo-wind-farm-1');
      expect(result.message).toContain('amarillo-wind-farm-2');
      expect(result.message).toContain('amarillo-wind-farm-3');
    });

    it('should use fuzzy matching from ProjectStore', async () => {
      const result = await lifecycleManager.deleteBulk('wind', false);

      expect(result.message).toContain('Found 3 project(s)');
      expect(result.message).toContain('amarillo-wind-farm');
    });

    it('should handle partial name matches', async () => {
      const result = await lifecycleManager.deleteBulk('farm-2', false);

      expect(result.message).toContain('amarillo-wind-farm-2');
    });
  });

  describe('Confirmation Flow Integration', () => {
    it('should require confirmation and not delete', async () => {
      const beforeList = await projectStore.list();
      const beforeCount = beforeList.length;

      const result = await lifecycleManager.deleteBulk('amarillo', false);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);

      const afterList = await projectStore.list();
      expect(afterList.length).toBe(beforeCount); // No projects deleted
    });

    it('should delete when confirmation is skipped', async () => {
      // Create temporary test projects
      const tempProjects = [
        {
          project_id: 'temp-1',
          project_name: 'temp-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'temp-2',
          project_name: 'temp-test-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const project of tempProjects) {
        await projectStore.save(project.project_name, project);
      }

      const result = await lifecycleManager.deleteBulk('temp-test', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(result.deletedProjects).toContain('temp-test-1');
      expect(result.deletedProjects).toContain('temp-test-2');

      // Verify projects are actually deleted
      const project1 = await projectStore.load('temp-test-1');
      const project2 = await projectStore.load('temp-test-2');
      expect(project1).toBeNull();
      expect(project2).toBeNull();
    });
  });

  describe('Batch Deletion Integration', () => {
    it('should delete multiple projects in parallel', async () => {
      // Create test projects for deletion
      const batchProjects = [
        {
          project_id: 'batch-1',
          project_name: 'batch-delete-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'batch-2',
          project_name: 'batch-delete-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'batch-3',
          project_name: 'batch-delete-3',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const project of batchProjects) {
        await projectStore.save(project.project_name, project);
      }

      const startTime = Date.now();
      const result = await lifecycleManager.deleteBulk('batch-delete', true);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);

      // Verify all projects are deleted
      for (const project of batchProjects) {
        const loaded = await projectStore.load(project.project_name);
        expect(loaded).toBeNull();
      }

      // Parallel deletion should be faster than sequential
      // (This is a rough check - actual timing may vary)
      console.log(`Batch deletion took ${duration}ms`);
    });

    it('should clear caches after bulk deletion', async () => {
      // Create test projects
      const cacheProjects = [
        {
          project_id: 'cache-1',
          project_name: 'cache-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'cache-2',
          project_name: 'cache-test-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const project of cacheProjects) {
        await projectStore.save(project.project_name, project);
      }

      // Load projects to populate cache
      await projectStore.load('cache-test-1');
      await projectStore.load('cache-test-2');

      // Delete projects
      await lifecycleManager.deleteBulk('cache-test', true);

      // Verify cache is cleared by checking list
      const list = await projectStore.list();
      const cacheTestProjects = list.filter(p => p.project_name.startsWith('cache-test'));
      expect(cacheTestProjects.length).toBe(0);
    });
  });

  describe('Partial Failure Handling Integration', () => {
    it('should handle mixed success and failure', async () => {
      // Create test projects
      const mixedProjects = [
        {
          project_id: 'mixed-1',
          project_name: 'mixed-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'mixed-2',
          project_name: 'mixed-test-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Only save the first project (second will fail to delete)
      await projectStore.save(mixedProjects[0].project_name, mixedProjects[0]);

      // Mock findByPartialName to return both projects
      const originalFind = projectStore.findByPartialName.bind(projectStore);
      projectStore.findByPartialName = jest.fn().mockResolvedValue(mixedProjects);

      const result = await lifecycleManager.deleteBulk('mixed-test', true);

      // Restore original method
      projectStore.findByPartialName = originalFind;

      // Should have partial success
      expect(result.success).toBe(false); // Not fully successful
      expect(result.deletedCount).toBeGreaterThan(0);
      expect(result.failedProjects.length).toBeGreaterThan(0);
      expect(result.message).toContain('Deleted');
      expect(result.message).toContain('Failed to delete');
    });

    it('should continue deleting after failures', async () => {
      // Create test projects
      const continueProjects = [
        {
          project_id: 'continue-1',
          project_name: 'continue-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'continue-2',
          project_name: 'continue-test-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'continue-3',
          project_name: 'continue-test-3',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Save first and third projects (second will fail)
      await projectStore.save(continueProjects[0].project_name, continueProjects[0]);
      await projectStore.save(continueProjects[2].project_name, continueProjects[2]);

      // Mock findByPartialName to return all three
      const originalFind = projectStore.findByPartialName.bind(projectStore);
      projectStore.findByPartialName = jest.fn().mockResolvedValue(continueProjects);

      const result = await lifecycleManager.deleteBulk('continue-test', true);

      // Restore original method
      projectStore.findByPartialName = originalFind;

      // Should delete the two that exist
      expect(result.deletedCount).toBeGreaterThanOrEqual(2);
      expect(result.failedProjects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases Integration', () => {
    it('should handle empty result set', async () => {
      const result = await lifecycleManager.deleteBulk('nonexistent-pattern-xyz', false);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.message).toContain('No projects match');
    });

    it('should handle single project deletion via bulk', async () => {
      // Create single test project
      const singleProject = {
        project_id: 'single-1',
        project_name: 'unique-single-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(singleProject.project_name, singleProject);

      const result = await lifecycleManager.deleteBulk('unique-single', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(result.deletedProjects).toContain('unique-single-project');

      // Verify deletion
      const loaded = await projectStore.load('unique-single-project');
      expect(loaded).toBeNull();
    });

    it('should handle very long project lists', async () => {
      // Create many test projects
      const manyProjects = [];
      for (let i = 0; i < 20; i++) {
        const project = {
          project_id: `many-${i}`,
          project_name: `many-test-project-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        manyProjects.push(project);
        await projectStore.save(project.project_name, project);
      }

      const result = await lifecycleManager.deleteBulk('many-test-project', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(20);
      expect(result.deletedProjects.length).toBe(20);

      // Verify all deleted
      for (const project of manyProjects) {
        const loaded = await projectStore.load(project.project_name);
        expect(loaded).toBeNull();
      }
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle duplicate cleanup scenario', async () => {
      // Scenario: User has 10 duplicate projects at same location
      const duplicates = [];
      for (let i = 1; i <= 10; i++) {
        const project = {
          project_id: `dup-${i}`,
          project_name: `texas-wind-farm-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
        };
        duplicates.push(project);
        await projectStore.save(project.project_name, project);
      }

      // User wants to delete all but one
      const result = await lifecycleManager.deleteBulk('texas-wind-farm', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBeGreaterThanOrEqual(10);

      // Clean up
      for (const project of duplicates) {
        try {
          await projectStore.delete(project.project_name);
        } catch (error) {
          // Already deleted
        }
      }
    });

    it('should handle test project cleanup scenario', async () => {
      // Scenario: User wants to delete all test projects
      const testProjs = [
        {
          project_id: 'test-1',
          project_name: 'test-project-alpha',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'test-2',
          project_name: 'test-project-beta',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'test-3',
          project_name: 'test-project-gamma',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const project of testProjs) {
        await projectStore.save(project.project_name, project);
      }

      const result = await lifecycleManager.deleteBulk('test-project', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
    });
  });
});
