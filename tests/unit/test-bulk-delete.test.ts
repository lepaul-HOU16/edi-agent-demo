/**
 * Unit tests for bulk project deletion
 * 
 * Tests Requirements: 2.6, 4.1, 4.2, 4.5, 4.6
 */

import { ProjectLifecycleManager, BulkDeleteResult } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - Bulk Delete', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  // Sample test projects
  const testProjects: ProjectData[] = [
    {
      project_id: 'proj-1',
      project_name: 'texas-wind-farm-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      coordinates: { latitude: 35.0, longitude: -101.0 },
    },
    {
      project_id: 'proj-2',
      project_name: 'texas-wind-farm-2',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      coordinates: { latitude: 35.1, longitude: -101.1 },
    },
    {
      project_id: 'proj-3',
      project_name: 'texas-wind-farm-3',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
      coordinates: { latitude: 35.2, longitude: -101.2 },
    },
    {
      project_id: 'proj-4',
      project_name: 'california-solar-1',
      created_at: '2025-01-04T00:00:00Z',
      updated_at: '2025-01-04T00:00:00Z',
      coordinates: { latitude: 36.0, longitude: -120.0 },
    },
  ];

  beforeEach(() => {
    // Create mock instances
    mockProjectStore = new ProjectStore() as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator() as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager(mockProjectStore) as jest.Mocked<SessionContextManager>;

    // Create lifecycle manager with mocks
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );

    // Setup default mock behaviors
    mockProjectResolver.clearCache = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Pattern Matching', () => {
    it('should find projects matching pattern', async () => {
      // Requirement 2.6: Pattern matching
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);

      const result = await lifecycleManager.deleteBulk('texas', false);

      expect(mockProjectStore.findByPartialName).toHaveBeenCalledWith('texas');
      expect(result.success).toBe(false); // Should require confirmation
      expect(result.message).toContain('Found 3 project(s)');
      expect(result.message).toContain('texas-wind-farm-1');
      expect(result.message).toContain('texas-wind-farm-2');
      expect(result.message).toContain('texas-wind-farm-3');
    });

    it('should handle no matches gracefully', async () => {
      // Requirement 4.6: Handle edge cases
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([]);

      const result = await lifecycleManager.deleteBulk('nonexistent', false);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.deletedProjects).toEqual([]);
      expect(result.failedProjects).toEqual([]);
      expect(result.message).toContain('No projects match pattern');
    });

    it('should match partial names correctly', async () => {
      // Requirement 4.1: Fuzzy matching
      const windProjects = testProjects.filter(p => p.project_name.includes('wind'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(windProjects);

      const result = await lifecycleManager.deleteBulk('wind', false);

      expect(result.message).toContain('Found 3 project(s)');
    });
  });

  describe('Confirmation Flow', () => {
    it('should require confirmation by default', async () => {
      // Requirement 2.6: Confirmation before bulk deletion
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);

      const result = await lifecycleManager.deleteBulk('texas', false);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.message).toContain('Type \'yes\' to delete all');
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should display project list in confirmation message', async () => {
      // Requirement 2.6: List matching projects
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);

      const result = await lifecycleManager.deleteBulk('texas', false);

      expect(result.message).toContain('texas-wind-farm-1');
      expect(result.message).toContain('texas-wind-farm-2');
      expect(result.message).toContain('texas-wind-farm-3');
      expect(result.message).toContain('Found 3 project(s)');
    });

    it('should skip confirmation when explicitly requested', async () => {
      // Requirement 2.6: Allow skipping confirmation
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(mockProjectStore.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Batch Deletion with Promise.allSettled', () => {
    it('should delete all matching projects successfully', async () => {
      // Requirement 4.2: Batch deletion
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(result.deletedProjects).toEqual([
        'texas-wind-farm-1',
        'texas-wind-farm-2',
        'texas-wind-farm-3',
      ]);
      expect(result.failedProjects).toEqual([]);
      expect(result.message).toContain('Successfully deleted 3 project(s)');
    });

    it('should use Promise.allSettled for parallel deletion', async () => {
      // Requirement 4.2: Use Promise.allSettled
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      
      let deleteCallCount = 0;
      mockProjectStore.delete = jest.fn().mockImplementation(() => {
        deleteCallCount++;
        return Promise.resolve();
      });

      await lifecycleManager.deleteBulk('texas', true);

      // All deletes should be called (Promise.allSettled doesn't stop on first failure)
      expect(mockProjectStore.delete).toHaveBeenCalledTimes(3);
    });

    it('should clear resolver cache after deletion', async () => {
      // Requirement 4.5: Clear caches
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      await lifecycleManager.deleteBulk('texas', true);

      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });
  });

  describe('Partial Failure Handling', () => {
    it('should handle partial failures gracefully', async () => {
      // Requirement 4.6: Handle partial failures
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      
      // First two succeed, third fails
      mockProjectStore.delete = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('S3 error'));

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(false); // Not fully successful
      expect(result.deletedCount).toBe(2);
      expect(result.deletedProjects).toEqual([
        'texas-wind-farm-1',
        'texas-wind-farm-2',
      ]);
      expect(result.failedProjects).toHaveLength(1);
      expect(result.failedProjects[0].name).toBe('texas-wind-farm-3');
      expect(result.failedProjects[0].error).toContain('S3 error');
      expect(result.message).toContain('Deleted 2 project(s)');
      expect(result.message).toContain('Failed to delete 1 project(s)');
    });

    it('should continue deleting even if some fail', async () => {
      // Requirement 4.6: Continue on failure
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      
      // First fails, rest succeed
      mockProjectStore.delete = jest.fn()
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.deletedCount).toBe(2);
      expect(result.failedProjects).toHaveLength(1);
      expect(mockProjectStore.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle all failures gracefully', async () => {
      // Requirement 4.6: Handle complete failure
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn().mockRejectedValue(new Error('S3 unavailable'));

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.failedProjects).toHaveLength(3);
      expect(result.message).toContain('Failed to delete 3 project(s)');
    });

    it('should include error details for failed deletions', async () => {
      // Requirement 4.6: Detailed error reporting
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      
      mockProjectStore.delete = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Access denied'))
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.failedProjects).toHaveLength(2);
      expect(result.failedProjects[0].error).toBe('Access denied');
      expect(result.failedProjects[1].error).toBe('Not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single project match', async () => {
      // Requirement 4.6: Edge case handling
      const solarProjects = testProjects.filter(p => p.project_name.includes('solar'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(solarProjects);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.deleteBulk('solar', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(result.deletedProjects).toEqual(['california-solar-1']);
    });

    it('should handle empty pattern', async () => {
      // Requirement 4.6: Edge case handling
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([]);

      const result = await lifecycleManager.deleteBulk('', false);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No projects match');
    });

    it('should handle store errors gracefully', async () => {
      // Requirement 4.6: Error handling
      mockProjectStore.findByPartialName = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.message).toContain('Bulk delete failed');
      expect(result.message).toContain('Database connection failed');
    });

    it('should handle non-Error exceptions', async () => {
      // Requirement 4.6: Robust error handling
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce('String error');

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.failedProjects[0].error).toBe('String error');
    });
  });

  describe('Integration with Requirements', () => {
    it('should satisfy Requirement 2.6: Bulk deletion with pattern', async () => {
      // Requirement 2.6: "delete all projects matching {pattern}"
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
    });

    it('should satisfy Requirement 4.1: Find duplicates by pattern', async () => {
      // Requirement 4.1: Pattern-based project discovery
      const windProjects = testProjects.filter(p => p.project_name.includes('wind'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(windProjects);

      await lifecycleManager.deleteBulk('wind', false);

      expect(mockProjectStore.findByPartialName).toHaveBeenCalledWith('wind');
    });

    it('should satisfy Requirement 4.2: Confirmation before bulk operations', async () => {
      // Requirement 4.2: User confirmation for bulk operations
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(testProjects);

      const result = await lifecycleManager.deleteBulk('farm', false);

      expect(result.message).toContain('Type \'yes\' to delete all');
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should satisfy Requirement 4.5: Dry run capability', async () => {
      // Requirement 4.5: Show what would be deleted without deleting
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);

      const result = await lifecycleManager.deleteBulk('texas', false);

      // Dry run shows projects but doesn't delete
      expect(result.message).toContain('texas-wind-farm-1');
      expect(result.message).toContain('texas-wind-farm-2');
      expect(result.message).toContain('texas-wind-farm-3');
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should satisfy Requirement 4.6: Graceful partial failure handling', async () => {
      // Requirement 4.6: Handle partial failures without stopping
      const texasProjects = testProjects.filter(p => p.project_name.includes('texas'));
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue(texasProjects);
      mockProjectStore.delete = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      const result = await lifecycleManager.deleteBulk('texas', true);

      expect(result.deletedCount).toBe(2);
      expect(result.failedProjects).toHaveLength(1);
      expect(result.message).toContain('Deleted 2 project(s)');
      expect(result.message).toContain('Failed to delete 1 project(s)');
    });
  });
});
