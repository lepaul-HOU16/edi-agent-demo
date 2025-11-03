/**
 * Integration tests for ProjectLifecycleManager.deleteProject()
 * 
 * Tests the complete deletion workflow with real dependencies
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('ProjectLifecycleManager - deleteProject Integration', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  const testBucket = process.env.RENEWABLE_S3_BUCKET || 'test-bucket';
  const testSessionTable = process.env.SESSION_CONTEXT_TABLE || 'test-session-table';

  beforeEach(() => {
    // Create real instances (will use in-memory cache if AWS not configured)
    projectStore = new ProjectStore(testBucket);
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator();
    sessionContextManager = new SessionContextManager(testSessionTable);

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    // Clear caches
    projectResolver.clearCache();
    sessionContextManager.clearCache();
  });

  afterEach(() => {
    // Clean up caches
    projectResolver.clearCache();
    sessionContextManager.clearCache();
  });

  describe('Complete deletion workflow', () => {
    it('should delete project and update all related systems', async () => {
      // Arrange - Create a test project
      const testProject: ProjectData = {
        project_id: 'integration-test-id',
        project_name: 'integration-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.0,
          longitude: -101.0,
        },
        metadata: {
          status: 'completed',
        },
      };

      // Save project
      await projectStore.save(testProject.project_name, testProject);

      // Set as active project in session
      const sessionId = 'integration-test-session';
      await sessionContextManager.setActiveProject(sessionId, testProject.project_name);

      // Verify project exists
      const loadedProject = await projectStore.load(testProject.project_name);
      expect(loadedProject).toBeTruthy();
      expect(loadedProject?.project_name).toBe(testProject.project_name);

      // Verify active project is set
      const activeProject = await sessionContextManager.getActiveProject(sessionId);
      expect(activeProject).toBe(testProject.project_name);

      // Act - Delete project
      const result = await lifecycleManager.deleteProject(
        testProject.project_name,
        true, // skip confirmation
        sessionId
      );

      // Assert - Verify deletion result
      expect(result.success).toBe(true);
      expect(result.projectName).toBe(testProject.project_name);
      expect(result.message).toContain('has been deleted');

      // Verify project no longer exists
      const deletedProject = await projectStore.load(testProject.project_name);
      expect(deletedProject).toBeNull();

      // Verify active project was cleared
      const clearedActiveProject = await sessionContextManager.getActiveProject(sessionId);
      expect(clearedActiveProject).toBe('');
    });

    it('should handle deletion without session context', async () => {
      // Arrange
      const testProject: ProjectData = {
        project_id: 'no-session-test-id',
        project_name: 'no-session-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 36.0,
          longitude: -102.0,
        },
      };

      await projectStore.save(testProject.project_name, testProject);

      // Act - Delete without session ID
      const result = await lifecycleManager.deleteProject(
        testProject.project_name,
        true
      );

      // Assert
      expect(result.success).toBe(true);
      const deletedProject = await projectStore.load(testProject.project_name);
      expect(deletedProject).toBeNull();
    });
  });

  describe('Confirmation workflow', () => {
    it('should require confirmation before deletion', async () => {
      // Arrange
      const testProject: ProjectData = {
        project_id: 'confirm-test-id',
        project_name: 'confirm-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(testProject.project_name, testProject);

      // Act - First call without confirmation
      const confirmResult = await lifecycleManager.deleteProject(
        testProject.project_name,
        false // require confirmation
      );

      // Assert - Should return confirmation prompt
      expect(confirmResult.success).toBe(false);
      expect(confirmResult.message).toContain('Are you sure');
      expect(confirmResult.message).toContain("Type 'yes' to confirm");

      // Verify project still exists
      const stillExists = await projectStore.load(testProject.project_name);
      expect(stillExists).toBeTruthy();

      // Act - Second call with confirmation
      const deleteResult = await lifecycleManager.deleteProject(
        testProject.project_name,
        true // skip confirmation
      );

      // Assert - Should delete successfully
      expect(deleteResult.success).toBe(true);
      const nowDeleted = await projectStore.load(testProject.project_name);
      expect(nowDeleted).toBeNull();
    });
  });

  describe('In-progress project protection', () => {
    it('should prevent deletion of in-progress projects', async () => {
      // Arrange
      const inProgressProject: ProjectData = {
        project_id: 'in-progress-test-id',
        project_name: 'in-progress-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          status: 'in_progress',
        },
      };

      await projectStore.save(inProgressProject.project_name, inProgressProject);

      // Act
      const result = await lifecycleManager.deleteProject(
        inProgressProject.project_name,
        true
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('currently being processed');

      // Verify project still exists
      const stillExists = await projectStore.load(inProgressProject.project_name);
      expect(stillExists).toBeTruthy();
    });
  });

  describe('Session context management', () => {
    it('should only clear active project if it matches deleted project', async () => {
      // Arrange
      const project1: ProjectData = {
        project_id: 'session-test-1',
        project_name: 'session-test-project-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const project2: ProjectData = {
        project_id: 'session-test-2',
        project_name: 'session-test-project-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project1.project_name, project1);
      await projectStore.save(project2.project_name, project2);

      const sessionId = 'session-context-test';
      await sessionContextManager.setActiveProject(sessionId, project1.project_name);

      // Act - Delete project2 (not active)
      const result = await lifecycleManager.deleteProject(
        project2.project_name,
        true,
        sessionId
      );

      // Assert
      expect(result.success).toBe(true);

      // Verify project1 is still active
      const activeProject = await sessionContextManager.getActiveProject(sessionId);
      expect(activeProject).toBe(project1.project_name);

      // Clean up
      await lifecycleManager.deleteProject(project1.project_name, true, sessionId);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate resolver cache after deletion', async () => {
      // Arrange
      const testProject: ProjectData = {
        project_id: 'cache-test-id',
        project_name: 'cache-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(testProject.project_name, testProject);

      // Resolve project to populate cache
      const resolved = await projectResolver.resolve(testProject.project_name);
      expect(resolved).toBe(testProject.project_name);

      // Act - Delete project
      const result = await lifecycleManager.deleteProject(
        testProject.project_name,
        true
      );

      // Assert
      expect(result.success).toBe(true);

      // Verify cache was cleared - resolver should not find deleted project
      const resolvedAfterDelete = await projectResolver.resolve(testProject.project_name);
      expect(resolvedAfterDelete).toBeNull();
    });
  });

  describe('Error scenarios', () => {
    it('should handle non-existent project gracefully', async () => {
      // Act
      const result = await lifecycleManager.deleteProject(
        'non-existent-project',
        true
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle multiple deletion attempts', async () => {
      // Arrange
      const testProject: ProjectData = {
        project_id: 'multi-delete-test-id',
        project_name: 'multi-delete-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(testProject.project_name, testProject);

      // Act - First deletion
      const result1 = await lifecycleManager.deleteProject(
        testProject.project_name,
        true
      );

      // Assert - First deletion succeeds
      expect(result1.success).toBe(true);

      // Act - Second deletion attempt
      const result2 = await lifecycleManager.deleteProject(
        testProject.project_name,
        true
      );

      // Assert - Second deletion fails (project not found)
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('not found');
    });
  });
});
