/**
 * Integration Tests for Archive/Unarchive Functionality
 * 
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Archive/Unarchive Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  beforeEach(() => {
    // Create real instances (using in-memory storage for tests)
    projectStore = new ProjectStore(''); // Empty bucket name for in-memory mode
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager();

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    // Clear cache before each test
    projectStore.clearCache();
  });

  describe('Complete Archive/Unarchive Workflow', () => {
    it('should archive and unarchive a project successfully (Requirements 8.1, 8.4)', async () => {
      // Step 1: Create a project
      const projectData: ProjectData = {
        project_id: 'proj-123-abc',
        project_name: 'test-wind-farm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.0,
          longitude: -101.0,
        },
        terrain_results: { data: 'terrain' },
      };

      await projectStore.save('test-wind-farm', projectData);

      // Step 2: Verify project is active
      let activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].project_name).toBe('test-wind-farm');

      let archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(0);

      // Step 3: Archive the project
      const archiveResult = await lifecycleManager.archiveProject('test-wind-farm');
      expect(archiveResult.success).toBe(true);

      // Step 4: Verify project is archived
      activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(0);

      archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(1);
      expect(archivedProjects[0].project_name).toBe('test-wind-farm');
      expect(archivedProjects[0].metadata?.archived).toBe(true);
      expect(archivedProjects[0].metadata?.archived_at).toBeDefined();

      // Step 5: Unarchive the project
      const unarchiveResult = await lifecycleManager.unarchiveProject('test-wind-farm');
      expect(unarchiveResult.success).toBe(true);

      // Step 6: Verify project is active again
      activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(1);
      expect(activeProjects[0].project_name).toBe('test-wind-farm');
      expect(activeProjects[0].metadata?.archived).toBe(false);

      archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(0);
    });

    it('should clear active project when archiving (Requirement 8.5)', async () => {
      // Step 1: Create a project
      const projectData: ProjectData = {
        project_id: 'proj-123-abc',
        project_name: 'test-wind-farm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.0,
          longitude: -101.0,
        },
      };

      await projectStore.save('test-wind-farm', projectData);

      // Step 2: Set as active project
      const sessionId = 'session-123';
      await sessionContextManager.setActiveProject(sessionId, 'test-wind-farm');

      // Verify it's active
      let activeProject = await sessionContextManager.getActiveProject(sessionId);
      expect(activeProject).toBe('test-wind-farm');

      // Step 3: Archive the project
      const archiveResult = await lifecycleManager.archiveProject('test-wind-farm', sessionId);
      expect(archiveResult.success).toBe(true);

      // Step 4: Verify active project was cleared
      activeProject = await sessionContextManager.getActiveProject(sessionId);
      expect(activeProject).toBe('');
    });

    it('should filter archived projects from default listings (Requirement 8.2)', async () => {
      // Step 1: Create multiple projects
      const projects = [
        {
          project_id: 'proj-1',
          project_name: 'active-project-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'proj-2',
          project_name: 'active-project-2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          project_id: 'proj-3',
          project_name: 'to-be-archived',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const project of projects) {
        await projectStore.save(project.project_name, project);
      }

      // Step 2: Verify all projects are active
      let activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(3);

      // Step 3: Archive one project
      await lifecycleManager.archiveProject('to-be-archived');

      // Step 4: Verify archived project is filtered from active list
      activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(2);
      expect(activeProjects.map((p) => p.project_name)).toEqual([
        'active-project-1',
        'active-project-2',
      ]);

      // Step 5: Verify archived project appears in archived list
      const archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(1);
      expect(archivedProjects[0].project_name).toBe('to-be-archived');
    });

    it('should allow explicit access to archived projects (Requirement 8.6)', async () => {
      // Step 1: Create and archive a project
      const projectData: ProjectData = {
        project_id: 'proj-123-abc',
        project_name: 'archived-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.0,
          longitude: -101.0,
        },
      };

      await projectStore.save('archived-project', projectData);
      await lifecycleManager.archiveProject('archived-project');

      // Step 2: Verify project is not in active list
      const activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(0);

      // Step 3: Verify project can still be accessed by name
      const loadedProject = await projectStore.load('archived-project');
      expect(loadedProject).not.toBeNull();
      expect(loadedProject?.project_name).toBe('archived-project');
      expect(loadedProject?.metadata?.archived).toBe(true);

      // Step 4: Verify project appears in archived list
      const archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(1);
      expect(archivedProjects[0].project_name).toBe('archived-project');
    });

    it('should handle search with archived filter (Requirements 8.2, 8.3)', async () => {
      // Step 1: Create mixed projects
      const activeProject: ProjectData = {
        project_id: 'proj-1',
        project_name: 'texas-wind-farm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: { latitude: 35.0, longitude: -101.0 },
      };

      const archivedProject: ProjectData = {
        project_id: 'proj-2',
        project_name: 'texas-solar-farm',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: { latitude: 35.1, longitude: -101.1 },
      };

      await projectStore.save('texas-wind-farm', activeProject);
      await projectStore.save('texas-solar-farm', archivedProject);
      await lifecycleManager.archiveProject('texas-solar-farm');

      // Step 2: Search for active projects in Texas
      const activeResults = await lifecycleManager.searchProjects({
        location: 'texas',
        archived: false,
      });

      expect(activeResults).toHaveLength(1);
      expect(activeResults[0].project_name).toBe('texas-wind-farm');

      // Step 3: Search for archived projects in Texas
      const archivedResults = await lifecycleManager.searchProjects({
        location: 'texas',
        archived: true,
      });

      expect(archivedResults).toHaveLength(1);
      expect(archivedResults[0].project_name).toBe('texas-solar-farm');

      // Step 4: Search for all projects in Texas (no archived filter)
      const allResults = await lifecycleManager.searchProjects({
        location: 'texas',
      });

      expect(allResults).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle archiving already archived project', async () => {
      // Step 1: Create and archive a project
      const projectData: ProjectData = {
        project_id: 'proj-123-abc',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save('test-project', projectData);
      await lifecycleManager.archiveProject('test-project');

      // Step 2: Archive again
      const result = await lifecycleManager.archiveProject('test-project');

      // Should succeed (idempotent operation)
      expect(result.success).toBe(true);

      // Verify still archived
      const archivedProjects = await lifecycleManager.listArchivedProjects();
      expect(archivedProjects).toHaveLength(1);
    });

    it('should handle unarchiving already active project', async () => {
      // Step 1: Create an active project
      const projectData: ProjectData = {
        project_id: 'proj-123-abc',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save('test-project', projectData);

      // Step 2: Unarchive (already active)
      const result = await lifecycleManager.unarchiveProject('test-project');

      // Should succeed (idempotent operation)
      expect(result.success).toBe(true);

      // Verify still active
      const activeProjects = await lifecycleManager.listActiveProjects();
      expect(activeProjects).toHaveLength(1);
    });

    it('should handle archiving non-existent project', async () => {
      // Act
      const result = await lifecycleManager.archiveProject('nonexistent-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });

    it('should handle unarchiving non-existent project', async () => {
      // Act
      const result = await lifecycleManager.unarchiveProject('nonexistent-project');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');
    });
  });
});
