/**
 * Unit tests for ProjectLifecycleManager
 * 
 * Tests all core lifecycle operations including:
 * - Deduplication detection
 * - Project deletion (single and bulk)
 * - Project renaming
 * - Project merging
 * - Project archiving/unarchiving
 * - Project search and filtering
 * - Export/import functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  // Sample project data
  const sampleProject1: ProjectData = {
    project_id: 'proj-1-abc',
    project_name: 'west-texas-wind-farm',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    coordinates: {
      latitude: 35.067482,
      longitude: -101.395466,
    },
    terrain_results: { data: 'terrain' },
    layout_results: { data: 'layout' },
  };

  const sampleProject2: ProjectData = {
    project_id: 'proj-2-def',
    project_name: 'amarillo-wind-farm',
    created_at: '2025-01-02T00:00:00.000Z',
    updated_at: '2025-01-02T00:00:00.000Z',
    coordinates: {
      latitude: 35.067500,
      longitude: -101.395500,
    },
    terrain_results: { data: 'terrain' },
  };

  beforeEach(() => {
    // Create mock instances
    mockProjectStore = new ProjectStore() as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator(mockProjectStore) as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager() as jest.Mocked<SessionContextManager>;

    // Create lifecycle manager with mocks
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  // ============================================================================
  // Deduplication Tests
  // ============================================================================

  describe('detectDuplicates', () => {
    it('should detect duplicate projects within radius', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.detectDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.length).toBeGreaterThan(0);
      expect(result.message).toContain('existing project');
    });

    it('should return no duplicates when none exist', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([]);

      const result = await lifecycleManager.detectDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates.length).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockProjectStore.list = jest.fn().mockRejectedValue(new Error('S3 error'));

      await expect(
        lifecycleManager.detectDuplicates({ latitude: 35.067482, longitude: -101.395466 })
      ).rejects.toThrow('S3 error');
    });
  });

  describe('promptForDuplicateResolution', () => {
    it('should generate formatted prompt for duplicates', async () => {
      const prompt = await lifecycleManager.promptForDuplicateResolution(
        [sampleProject1],
        { latitude: 35.067482, longitude: -101.395466 }
      );

      expect(prompt).toContain('Found existing project');
      expect(prompt).toContain(sampleProject1.project_name);
      expect(prompt).toContain('Continue with existing project');
      expect(prompt).toContain('Create new project');
      expect(prompt).toContain('View existing project details');
    });

    it('should return empty string when no projects provided', async () => {
      const prompt = await lifecycleManager.promptForDuplicateResolution(
        [],
        { latitude: 35.067482, longitude: -101.395466 }
      );

      expect(prompt).toBe('');
    });
  });

  // ============================================================================
  // Deletion Tests
  // ============================================================================

  describe('deleteProject', () => {
    it('should require confirmation by default', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);

      const result = await lifecycleManager.deleteProject('west-texas-wind-farm');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Are you sure');
      expect(result.error).toBe('CONFIRMATION_REQUIRED');
    });

    it('should delete project when confirmation skipped', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      const result = await lifecycleManager.deleteProject('west-texas-wind-farm', true);

      expect(result.success).toBe(true);
      expect(result.message).toContain('has been deleted');
      expect(mockProjectStore.delete).toHaveBeenCalledWith('west-texas-wind-farm');
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should return error when project not found', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      const result = await lifecycleManager.deleteProject('nonexistent-project', true);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should handle deletion errors', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);
      mockProjectStore.delete = jest.fn().mockRejectedValue(new Error('S3 error'));

      const result = await lifecycleManager.deleteProject('west-texas-wind-farm', true);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to delete');
    });
  });

  describe('deleteBulk', () => {
    it('should require confirmation by default', async () => {
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.deleteBulk('wind-farm');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Type \'yes\' to delete all');
      expect(result.deletedCount).toBe(0);
    });

    it('should delete multiple projects when confirmed', async () => {
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      const result = await lifecycleManager.deleteBulk('wind-farm', true);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
      expect(result.deletedProjects).toContain('west-texas-wind-farm');
      expect(result.deletedProjects).toContain('amarillo-wind-farm');
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should handle partial failures', async () => {
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);
      mockProjectStore.delete = jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('S3 error'));
      mockProjectResolver.clearCache = jest.fn();

      const result = await lifecycleManager.deleteBulk('wind-farm', true);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(1);
      expect(result.failedProjects.length).toBe(1);
    });

    it('should return error when no matches found', async () => {
      mockProjectStore.findByPartialName = jest.fn().mockResolvedValue([]);

      const result = await lifecycleManager.deleteBulk('nonexistent', true);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No projects match');
    });
  });

  // ============================================================================
  // Rename Tests
  // ============================================================================

  describe('renameProject', () => {
    it('should rename project successfully', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sampleProject1)
        .mockResolvedValueOnce(null); // New name doesn't exist
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectNameGenerator.normalize = jest.fn().mockReturnValue('panhandle-wind-farm');
      mockProjectResolver.clearCache = jest.fn();

      const result = await lifecycleManager.renameProject('west-texas-wind-farm', 'Panhandle Wind Farm');

      expect(result.success).toBe(true);
      expect(result.oldName).toBe('west-texas-wind-farm');
      expect(result.newName).toBe('panhandle-wind-farm');
      expect(mockProjectStore.save).toHaveBeenCalled();
      expect(mockProjectStore.delete).toHaveBeenCalledWith('west-texas-wind-farm');
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should return error when old project not found', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      const result = await lifecycleManager.renameProject('nonexistent', 'new-name');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return error when new name already exists', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sampleProject1)
        .mockResolvedValueOnce(sampleProject2); // New name exists
      mockProjectNameGenerator.normalize = jest.fn().mockReturnValue('amarillo-wind-farm');

      const result = await lifecycleManager.renameProject('west-texas-wind-farm', 'Amarillo Wind Farm');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NAME_ALREADY_EXISTS');
    });
  });

  // ============================================================================
  // Merge Tests
  // ============================================================================

  describe('mergeProjects', () => {
    it('should merge two projects successfully', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sampleProject1)
        .mockResolvedValueOnce(sampleProject2);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      const result = await lifecycleManager.mergeProjects(
        'west-texas-wind-farm',
        'amarillo-wind-farm'
      );

      expect(result.success).toBe(true);
      expect(result.mergedProject).toBe('amarillo-wind-farm');
      expect(result.deletedProject).toBe('west-texas-wind-farm');
      expect(mockProjectStore.save).toHaveBeenCalled();
      expect(mockProjectStore.delete).toHaveBeenCalledWith('west-texas-wind-farm');
    });

    it('should return error when source project not found', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(sampleProject2);

      const result = await lifecycleManager.mergeProjects(
        'nonexistent',
        'amarillo-wind-farm'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return error when target project not found', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sampleProject1)
        .mockResolvedValueOnce(null);

      const result = await lifecycleManager.mergeProjects(
        'west-texas-wind-farm',
        'nonexistent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should return error when keepName is invalid', async () => {
      mockProjectStore.load = jest.fn()
        .mockResolvedValueOnce(sampleProject1)
        .mockResolvedValueOnce(sampleProject2);

      const result = await lifecycleManager.mergeProjects(
        'west-texas-wind-farm',
        'amarillo-wind-farm',
        'invalid-name'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('MERGE_CONFLICT');
    });
  });

  // ============================================================================
  // Archive Tests
  // ============================================================================

  describe('archiveProject', () => {
    it('should archive project successfully', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.archiveProject('west-texas-wind-farm');

      expect(result.success).toBe(true);
      expect(result.message).toContain('has been archived');
      expect(mockProjectStore.save).toHaveBeenCalled();
    });

    it('should return error when project not found', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      const result = await lifecycleManager.archiveProject('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });
  });

  describe('unarchiveProject', () => {
    it('should unarchive project successfully', async () => {
      const archivedProject = {
        ...sampleProject1,
        metadata: { archived: true, archived_at: '2025-01-01T00:00:00.000Z' },
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(archivedProject);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.unarchiveProject('west-texas-wind-farm');

      expect(result.success).toBe(true);
      expect(result.message).toContain('has been unarchived');
      expect(mockProjectStore.save).toHaveBeenCalled();
    });

    it('should return error when project not found', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      const result = await lifecycleManager.unarchiveProject('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });
  });

  describe('listArchivedProjects', () => {
    it('should return only archived projects', async () => {
      const archivedProject = {
        ...sampleProject1,
        metadata: { archived: true },
      };
      mockProjectStore.list = jest.fn().mockResolvedValue([archivedProject, sampleProject2]);

      const result = await lifecycleManager.listArchivedProjects();

      expect(result.length).toBe(1);
      expect(result[0].project_name).toBe('west-texas-wind-farm');
    });

    it('should return empty array when no archived projects', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.listArchivedProjects();

      expect(result.length).toBe(0);
    });
  });

  // ============================================================================
  // Search and Filter Tests
  // ============================================================================

  describe('searchProjects', () => {
    it('should filter by location', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.searchProjects({ location: 'texas' });

      expect(result.length).toBe(1);
      expect(result[0].project_name).toBe('west-texas-wind-farm');
    });

    it('should filter by date range', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.searchProjects({
        dateFrom: '2025-01-02T00:00:00.000Z',
      });

      expect(result.length).toBe(1);
      expect(result[0].project_name).toBe('amarillo-wind-farm');
    });

    it('should filter by incomplete status', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.searchProjects({ incomplete: true });

      // Both projects are incomplete (missing some results)
      expect(result.length).toBe(2);
      expect(result.map(p => p.project_name)).toContain('west-texas-wind-farm');
      expect(result.map(p => p.project_name)).toContain('amarillo-wind-farm');
    });

    it('should filter by archived status', async () => {
      const archivedProject = {
        ...sampleProject1,
        metadata: { archived: true },
      };
      mockProjectStore.list = jest.fn().mockResolvedValue([archivedProject, sampleProject2]);

      const result = await lifecycleManager.searchProjects({ archived: true });

      expect(result.length).toBe(1);
      expect(result[0].project_name).toBe('west-texas-wind-farm');
    });

    it('should combine multiple filters', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.searchProjects({
        location: 'wind',
        incomplete: true,
      });

      // Both projects match: both have "wind" in name and both are incomplete
      expect(result.length).toBe(2);
      expect(result.map(p => p.project_name)).toContain('west-texas-wind-farm');
      expect(result.map(p => p.project_name)).toContain('amarillo-wind-farm');
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicate groups', async () => {
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.findDuplicates(1.0);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].count).toBeGreaterThan(1);
    });

    it('should return empty array when no duplicates', async () => {
      const farProject = {
        ...sampleProject2,
        coordinates: { latitude: 40.0, longitude: -100.0 },
      };
      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, farProject]);

      const result = await lifecycleManager.findDuplicates(1.0);

      expect(result.length).toBe(0);
    });
  });

  // ============================================================================
  // Export/Import Tests
  // ============================================================================

  describe('exportProject', () => {
    it('should export project successfully', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);

      const result = await lifecycleManager.exportProject('west-texas-wind-farm');

      expect(result).not.toBeNull();
      expect(result?.version).toBe('1.0');
      expect(result?.project.project_name).toBe('west-texas-wind-farm');
      expect(result?.exportedAt).toBeDefined();
    });

    it('should throw error when project not found', async () => {
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      await expect(
        lifecycleManager.exportProject('nonexistent')
      ).rejects.toThrow('not found');
    });
  });

  describe('importProject', () => {
    it('should import project successfully', async () => {
      const exportData = {
        version: '1.0',
        exportedAt: '2025-01-01T00:00:00.000Z',
        project: sampleProject1,
        artifacts: {},
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(null);
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(mockProjectStore.save).toHaveBeenCalled();
    });

    it('should handle name conflict during import', async () => {
      const exportData = {
        version: '1.0',
        exportedAt: '2025-01-01T00:00:00.000Z',
        project: sampleProject1,
        artifacts: {},
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(sampleProject1);
      mockProjectNameGenerator.ensureUnique = jest.fn().mockResolvedValue('west-texas-wind-farm-imported');
      mockProjectStore.save = jest.fn().mockResolvedValue(undefined);

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('west-texas-wind-farm-imported');
    });

    it('should return error for unsupported version', async () => {
      const exportData = {
        version: '2.0',
        exportedAt: '2025-01-01T00:00:00.000Z',
        project: sampleProject1,
        artifacts: {},
      };

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNSUPPORTED_VERSION');
    });
  });

  // ============================================================================
  // Dashboard Tests
  // ============================================================================

  describe('generateDashboard', () => {
    it('should generate dashboard data', async () => {
      const sessionContext = {
        session_id: 'test-session',
        user_id: 'test-user',
        active_project: 'west-texas-wind-farm',
        project_history: ['west-texas-wind-farm'],
        last_updated: '2025-01-01T00:00:00.000Z',
      };

      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.generateDashboard(sessionContext);

      expect(result.totalProjects).toBe(2);
      expect(result.activeProject).toBe('west-texas-wind-farm');
      expect(result.projects.length).toBe(2);
      
      // Find the active project (sorted by updated_at, so order may vary)
      const activeProject = result.projects.find(p => p.name === 'west-texas-wind-farm');
      expect(activeProject).toBeDefined();
      expect(activeProject?.isActive).toBe(true);
    });

    it('should calculate completion percentage correctly', async () => {
      const sessionContext = {
        session_id: 'test-session',
        user_id: 'test-user',
        project_history: [],
        last_updated: '2025-01-01T00:00:00.000Z',
      };

      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1]);

      const result = await lifecycleManager.generateDashboard(sessionContext);

      expect(result.projects[0].completionPercentage).toBe(50); // 2 out of 4 steps
    });

    it('should identify duplicate projects', async () => {
      const sessionContext = {
        session_id: 'test-session',
        user_id: 'test-user',
        project_history: [],
        last_updated: '2025-01-01T00:00:00.000Z',
      };

      mockProjectStore.list = jest.fn().mockResolvedValue([sampleProject1, sampleProject2]);

      const result = await lifecycleManager.generateDashboard(sessionContext);

      const duplicateCount = result.projects.filter((p) => p.isDuplicate).length;
      expect(duplicateCount).toBeGreaterThan(0);
    });
  });
});
