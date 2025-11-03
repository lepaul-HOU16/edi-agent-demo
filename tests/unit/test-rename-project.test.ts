/**
 * Unit Tests for Project Rename Functionality
 * 
 * Tests Requirements 3.1-3.6:
 * - 3.1: Update project name in project index
 * - 3.2: Preserve all project data and history
 * - 3.3: Update S3 path from old to new
 * - 3.4: Check if new name already exists
 * - 3.5: Respond with success message
 * - 3.6: Update active project context with new name
 */

import { ProjectLifecycleManager, RenameResult } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - Rename Project', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  const mockProject: ProjectData = {
    project_id: 'proj-123',
    project_name: 'old-project-name',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    coordinates: {
      latitude: 35.0,
      longitude: -101.0,
    },
    terrain_results: { data: 'terrain' },
    layout_results: { data: 'layout' },
    metadata: {
      turbine_count: 50,
    },
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

  describe('Requirement 3.1: Validate old project exists and new name available', () => {
    it('should return error if old project does not exist', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(null);

      // Act
      const result = await lifecycleManager.renameProject('non-existent-project', 'new-name');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
      expect(result.message).toContain('not found');
      expect(mockProjectStore.load).toHaveBeenCalledWith('non-existent-project');
    });

    it('should return error if new name already exists', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject) // Old project exists
        .mockResolvedValueOnce({ ...mockProject, project_name: 'new-name' }); // New name exists
      mockProjectNameGenerator.normalize.mockReturnValue('new-name');

      // Act
      const result = await lifecycleManager.renameProject('old-project-name', 'new-name');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('NAME_ALREADY_EXISTS');
      expect(result.message).toContain('already exists');
      expect(mockProjectStore.load).toHaveBeenCalledTimes(2);
    });

    it('should normalize new project name', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject) // Old project exists
        .mockResolvedValueOnce(null); // New name doesn't exist
      mockProjectNameGenerator.normalize.mockReturnValue('normalized-new-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'New Name With Spaces');

      // Assert
      expect(mockProjectNameGenerator.normalize).toHaveBeenCalledWith('New Name With Spaces');
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'normalized-new-name',
        expect.objectContaining({
          project_name: 'normalized-new-name',
        })
      );
    });
  });

  describe('Requirement 3.2: Preserve all project data and history', () => {
    it('should preserve all project data when renaming', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'new-project-name',
        expect.objectContaining({
          project_id: mockProject.project_id,
          coordinates: mockProject.coordinates,
          terrain_results: mockProject.terrain_results,
          layout_results: mockProject.layout_results,
          metadata: mockProject.metadata,
        })
      );
    });

    it('should update the updated_at timestamp', async () => {
      // Arrange
      const beforeRename = new Date().toISOString();
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'new-project-name',
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      );

      const savedProject = mockProjectStore.save.mock.calls[0][1] as ProjectData;
      expect(new Date(savedProject.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeRename).getTime()
      );
    });
  });

  describe('Requirement 3.3: Update S3 path (save new, delete old)', () => {
    it('should save project with new name and delete old project', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(mockProjectStore.save).toHaveBeenCalledWith(
        'new-project-name',
        expect.any(Object)
      );
      expect(mockProjectStore.delete).toHaveBeenCalledWith('old-project-name');
      
      // Verify order: save before delete
      const saveCallOrder = mockProjectStore.save.mock.invocationCallOrder[0];
      const deleteCallOrder = mockProjectStore.delete.mock.invocationCallOrder[0];
      expect(saveCallOrder).toBeLessThan(deleteCallOrder);
    });

    it('should handle S3 errors gracefully', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockProjectStore.delete).not.toHaveBeenCalled(); // Should not delete if save fails
    });
  });

  describe('Requirement 3.4: Check if new name already exists', () => {
    it('should return error with appropriate message if name exists', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce({ ...mockProject, project_name: 'existing-name' });
      mockProjectNameGenerator.normalize.mockReturnValue('existing-name');

      // Act
      const result = await lifecycleManager.renameProject('old-project-name', 'existing-name');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('NAME_ALREADY_EXISTS');
      expect(result.message).toContain('existing-name');
      expect(result.message).toContain('already exists');
      expect(result.message).toContain('choose a different name');
    });
  });

  describe('Requirement 3.5: Respond with success message', () => {
    it('should return success result with appropriate message', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      const result = await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(result.success).toBe(true);
      expect(result.oldName).toBe('old-project-name');
      expect(result.newName).toBe('new-project-name');
      expect(result.message).toContain('renamed from');
      expect(result.message).toContain('old-project-name');
      expect(result.message).toContain('new-project-name');
    });
  });

  describe('Requirement 3.6: Update active project context with new name', () => {
    it('should update active project in session context if it was the renamed project', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();
      mockSessionContextManager.getActiveProject.mockResolvedValue('old-project-name');
      mockSessionContextManager.setActiveProject.mockResolvedValue();
      mockSessionContextManager.getContext.mockResolvedValue({
        session_id: sessionId,
        user_id: 'user-123',
        active_project: 'old-project-name',
        project_history: ['old-project-name', 'other-project'],
        last_updated: '2025-01-01T00:00:00Z',
      });
      mockSessionContextManager.addToHistory.mockResolvedValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name', sessionId);

      // Assert
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.setActiveProject).toHaveBeenCalledWith(
        sessionId,
        'new-project-name'
      );
    });

    it('should not update session context if renamed project was not active', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();
      mockSessionContextManager.getActiveProject.mockResolvedValue('different-project');

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name', sessionId);

      // Assert
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.setActiveProject).not.toHaveBeenCalled();
    });

    it('should update project history in session context', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();
      mockSessionContextManager.getActiveProject.mockResolvedValue('old-project-name');
      mockSessionContextManager.setActiveProject.mockResolvedValue();
      mockSessionContextManager.getContext.mockResolvedValue({
        session_id: sessionId,
        user_id: 'user-123',
        active_project: 'old-project-name',
        project_history: ['old-project-name', 'other-project'],
        last_updated: '2025-01-01T00:00:00Z',
      });
      mockSessionContextManager.addToHistory.mockResolvedValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name', sessionId);

      // Assert
      expect(mockSessionContextManager.getContext).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.addToHistory).toHaveBeenCalledWith(
        sessionId,
        'new-project-name'
      );
    });

    it('should work without session ID (no context update)', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      const result = await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionContextManager.getActiveProject).not.toHaveBeenCalled();
      expect(mockSessionContextManager.setActiveProject).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 3.6: Clear resolver cache after rename', () => {
    it('should clear resolver cache after successful rename', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'new-project-name');

      // Assert
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should not clear cache if rename fails', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(null); // Project not found

      // Act
      await lifecycleManager.renameProject('non-existent', 'new-name');

      // Assert
      expect(mockProjectResolver.clearCache).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty project name', async () => {
      // Arrange
      mockProjectStore.load.mockResolvedValue(null);

      // Act
      const result = await lifecycleManager.renameProject('', 'new-name');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle special characters in new name', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      await lifecycleManager.renameProject('old-project-name', 'New Project Name!!!');

      // Assert
      expect(mockProjectNameGenerator.normalize).toHaveBeenCalledWith('New Project Name!!!');
    });

    it('should handle concurrent rename attempts gracefully', async () => {
      // Arrange
      mockProjectStore.load
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(null);
      mockProjectNameGenerator.normalize.mockReturnValue('new-project-name');
      mockProjectStore.save.mockResolvedValue();
      mockProjectStore.delete.mockResolvedValue();
      mockProjectResolver.clearCache.mockReturnValue();

      // Act
      const result1Promise = lifecycleManager.renameProject('old-project-name', 'new-name-1');
      const result2Promise = lifecycleManager.renameProject('old-project-name', 'new-name-2');

      const [result1, result2] = await Promise.all([result1Promise, result2Promise]);

      // Assert - At least one should succeed
      expect(result1.success || result2.success).toBe(true);
    });
  });
});
