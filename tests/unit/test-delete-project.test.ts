/**
 * Unit tests for ProjectLifecycleManager.deleteProject()
 * 
 * Tests Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */

import { ProjectLifecycleManager, DeleteResult, ProjectLifecycleError } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/projectResolver');
jest.mock('../../amplify/functions/shared/projectNameGenerator');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectLifecycleManager - deleteProject', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockProjectResolver: jest.Mocked<ProjectResolver>;
  let mockProjectNameGenerator: jest.Mocked<ProjectNameGenerator>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  const mockProject: ProjectData = {
    project_id: 'test-id-123',
    project_name: 'test-project',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    coordinates: {
      latitude: 35.0,
      longitude: -101.0,
    },
    metadata: {},
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockProjectStore = new ProjectStore() as jest.Mocked<ProjectStore>;
    mockProjectResolver = new ProjectResolver(mockProjectStore) as jest.Mocked<ProjectResolver>;
    mockProjectNameGenerator = new ProjectNameGenerator() as jest.Mocked<ProjectNameGenerator>;
    mockSessionContextManager = new SessionContextManager() as jest.Mocked<SessionContextManager>;

    // Create lifecycle manager with mocks
    lifecycleManager = new ProjectLifecycleManager(
      mockProjectStore,
      mockProjectResolver,
      mockProjectNameGenerator,
      mockSessionContextManager
    );
  });

  describe('Requirement 2.1: Confirmation prompt', () => {
    it('should require confirmation when skipConfirmation is false', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);

      // Act
      const result = await lifecycleManager.deleteProject('test-project', false);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(ProjectLifecycleError.CONFIRMATION_REQUIRED);
      expect(result.message).toContain("Are you sure you want to delete 'test-project'?");
      expect(result.message).toContain("Type 'yes' to confirm");
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should proceed without confirmation when skipConfirmation is true', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectStore.delete).toHaveBeenCalledWith('test-project');
    });
  });

  describe('Requirement 2.2: Project existence validation', () => {
    it('should return error when project does not exist', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(null);

      // Act
      const result = await lifecycleManager.deleteProject('nonexistent-project', true);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(ProjectLifecycleError.PROJECT_NOT_FOUND);
      expect(result.message).toContain("Project 'nonexistent-project' not found");
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should validate project exists before attempting deletion', async () => {
      // Arrange
      const callOrder: string[] = [];
      mockProjectStore.load = jest.fn().mockImplementation(async () => {
        callOrder.push('load');
        return mockProject;
      });
      mockProjectStore.delete = jest.fn().mockImplementation(async () => {
        callOrder.push('delete');
      });
      mockProjectResolver.clearCache = jest.fn();

      // Act
      await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(mockProjectStore.load).toHaveBeenCalledWith('test-project');
      expect(callOrder).toEqual(['load', 'delete']);
    });
  });

  describe('Requirement 2.3: S3 deletion via ProjectStore', () => {
    it('should delete project from S3 using ProjectStore', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectStore.delete).toHaveBeenCalledWith('test-project');
      expect(mockProjectStore.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle S3 deletion errors gracefully', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('S3 error');
      expect(result.message).toContain("Failed to delete project 'test-project'");
    });
  });

  describe('Requirement 2.4: Update session context when active project deleted', () => {
    it('should clear active project from session when deleted project is active', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();
      mockSessionContextManager.getActiveProject = jest.fn().mockResolvedValue('test-project');
      mockSessionContextManager.setActiveProject = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true, sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.setActiveProject).toHaveBeenCalledWith(sessionId, '');
    });

    it('should not update session context when deleted project is not active', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();
      mockSessionContextManager.getActiveProject = jest.fn().mockResolvedValue('other-project');
      mockSessionContextManager.setActiveProject = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true, sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.setActiveProject).not.toHaveBeenCalled();
    });

    it('should not update session context when sessionId is not provided', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSessionContextManager.getActiveProject).not.toHaveBeenCalled();
      expect(mockSessionContextManager.setActiveProject).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 2.5: Clear resolver cache after deletion', () => {
    it('should clear resolver cache after successful deletion', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectResolver.clearCache).toHaveBeenCalledTimes(1);
    });

    it('should clear cache after S3 deletion completes', async () => {
      // Arrange
      const callOrder: string[] = [];
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockImplementation(async () => {
        callOrder.push('delete');
      });
      mockProjectResolver.clearCache = jest.fn().mockImplementation(() => {
        callOrder.push('clearCache');
      });

      // Act
      await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(callOrder).toEqual(['delete', 'clearCache']);
    });

    it('should not clear cache when deletion fails', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockRejectedValue(new Error('Deletion failed'));
      mockProjectResolver.clearCache = jest.fn();

      // Act
      await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(mockProjectResolver.clearCache).not.toHaveBeenCalled();
    });
  });

  describe('Requirement 2.7: In-progress project check', () => {
    it('should prevent deletion of in-progress projects', async () => {
      // Arrange
      const inProgressProject: ProjectData = {
        ...mockProject,
        metadata: {
          status: 'in_progress',
        },
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(inProgressProject);

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(ProjectLifecycleError.PROJECT_IN_PROGRESS);
      expect(result.message).toContain("Cannot delete 'test-project'");
      expect(result.message).toContain('currently being processed');
      expect(mockProjectStore.delete).not.toHaveBeenCalled();
    });

    it('should allow deletion of completed projects', async () => {
      // Arrange
      const completedProject: ProjectData = {
        ...mockProject,
        metadata: {
          status: 'completed',
        },
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(completedProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectStore.delete).toHaveBeenCalledWith('test-project');
    });

    it('should allow deletion of projects without status metadata', async () => {
      // Arrange
      const projectWithoutStatus: ProjectData = {
        ...mockProject,
        metadata: {},
      };
      mockProjectStore.load = jest.fn().mockResolvedValue(projectWithoutStatus);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProjectStore.delete).toHaveBeenCalledWith('test-project');
    });
  });

  describe('Complete deletion workflow', () => {
    it('should execute complete deletion workflow successfully', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();
      mockSessionContextManager.getActiveProject = jest.fn().mockResolvedValue('test-project');
      mockSessionContextManager.setActiveProject = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true, sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-project');
      expect(result.message).toBe("Project 'test-project' has been deleted.");
      
      // Verify execution order
      expect(mockProjectStore.load).toHaveBeenCalledWith('test-project');
      expect(mockProjectStore.delete).toHaveBeenCalledWith('test-project');
      expect(mockSessionContextManager.getActiveProject).toHaveBeenCalledWith(sessionId);
      expect(mockSessionContextManager.setActiveProject).toHaveBeenCalledWith(sessionId, '');
      expect(mockProjectResolver.clearCache).toHaveBeenCalled();
    });

    it('should return appropriate success message', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Project 'test-project' has been deleted.");
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockProjectStore.load = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error');
    });

    it('should handle session context update errors gracefully', async () => {
      // Arrange
      const sessionId = 'test-session-123';
      mockProjectStore.load = jest.fn().mockResolvedValue(mockProject);
      mockProjectStore.delete = jest.fn().mockResolvedValue(undefined);
      mockProjectResolver.clearCache = jest.fn();
      mockSessionContextManager.getActiveProject = jest.fn().mockRejectedValue(new Error('Session error'));

      // Act
      const result = await lifecycleManager.deleteProject('test-project', true, sessionId);

      // Assert - Should still succeed even if session update fails
      expect(result.success).toBe(false);
      expect(result.error).toContain('Session error');
    });
  });
});
