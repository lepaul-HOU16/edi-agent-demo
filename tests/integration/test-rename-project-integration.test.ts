/**
 * Integration Tests for Project Rename Functionality
 * 
 * Tests the complete rename workflow including:
 * - ProjectLifecycleManager
 * - ProjectStore (S3 operations)
 * - ProjectResolver (cache management)
 * - SessionContextManager (context updates)
 * - ProjectNameGenerator (name normalization)
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Project Rename Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  const testSessionId = 'test-session-' + Date.now();

  beforeEach(() => {
    // Create real instances (will use in-memory cache if S3 not configured)
    projectStore = new ProjectStore();
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager();

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    // Clear caches
    projectStore.clearCache();
    projectResolver.clearCache();
    sessionContextManager.clearCache();
  });

  afterEach(() => {
    // Clean up
    projectStore.clearCache();
    projectResolver.clearCache();
    sessionContextManager.clearCache();
  });

  describe('Complete Rename Workflow', () => {
    it('should rename project and update all related systems', async () => {
      // Arrange - Create a project
      const originalProject: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'original-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

      await projectStore.save(originalProject.project_name, originalProject);

      // Set as active project in session
      await sessionContextManager.setActiveProject(testSessionId, originalProject.project_name);
      await sessionContextManager.addToHistory(testSessionId, originalProject.project_name);

      // Act - Rename the project
      const result = await lifecycleManager.renameProject(
        'original-test-project',
        'renamed-test-project',
        testSessionId
      );

      // Assert - Verify rename succeeded
      expect(result.success).toBe(true);
      expect(result.oldName).toBe('original-test-project');
      expect(result.newName).toBe('renamed-test-project');

      // Verify old project is gone
      const oldProject = await projectStore.load('original-test-project');
      expect(oldProject).toBeNull();

      // Verify new project exists with all data
      const newProject = await projectStore.load('renamed-test-project');
      expect(newProject).not.toBeNull();
      expect(newProject?.project_name).toBe('renamed-test-project');
      expect(newProject?.project_id).toBe(originalProject.project_id);
      expect(newProject?.coordinates).toEqual(originalProject.coordinates);
      expect(newProject?.terrain_results).toEqual(originalProject.terrain_results);
      expect(newProject?.layout_results).toEqual(originalProject.layout_results);
      expect(newProject?.metadata).toEqual(originalProject.metadata);

      // Verify session context updated
      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe('renamed-test-project');

      // Verify project history updated
      const context = await sessionContextManager.getContext(testSessionId);
      expect(context.project_history).toContain('renamed-test-project');
    });

    it('should handle rename with name normalization', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);

      // Act - Rename with spaces and capitals
      const result = await lifecycleManager.renameProject(
        'test-project',
        'New Project Name With Spaces'
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.newName).toMatch(/^[a-z0-9\-]+$/); // Should be normalized to kebab-case

      // Verify normalized name exists
      const renamedProject = await projectStore.load(result.newName);
      expect(renamedProject).not.toBeNull();
      expect(renamedProject?.project_name).toBe(result.newName);
    });

    it('should prevent rename to existing project name', async () => {
      // Arrange - Create two projects
      const project1: ProjectData = {
        project_id: 'proj-1-' + Date.now(),
        project_name: 'project-one',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const project2: ProjectData = {
        project_id: 'proj-2-' + Date.now(),
        project_name: 'project-two',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project1.project_name, project1);
      await projectStore.save(project2.project_name, project2);

      // Act - Try to rename project-one to project-two
      const result = await lifecycleManager.renameProject('project-one', 'project-two');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('NAME_ALREADY_EXISTS');

      // Verify original projects unchanged
      const p1 = await projectStore.load('project-one');
      const p2 = await projectStore.load('project-two');
      expect(p1?.project_name).toBe('project-one');
      expect(p2?.project_name).toBe('project-two');
    });

    it('should handle rename of non-existent project', async () => {
      // Act
      const result = await lifecycleManager.renameProject(
        'non-existent-project',
        'new-name'
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('PROJECT_NOT_FOUND');

      // Verify new name was not created
      const newProject = await projectStore.load('new-name');
      expect(newProject).toBeNull();
    });
  });

  describe('Session Context Integration', () => {
    it('should update active project when renamed', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'active-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);
      await sessionContextManager.setActiveProject(testSessionId, 'active-project');

      // Act
      const result = await lifecycleManager.renameProject(
        'active-project',
        'renamed-active-project',
        testSessionId
      );

      // Assert
      expect(result.success).toBe(true);

      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe('renamed-active-project');
    });

    it('should not update session if project was not active', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'inactive-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);
      await sessionContextManager.setActiveProject(testSessionId, 'different-project');

      // Act
      const result = await lifecycleManager.renameProject(
        'inactive-project',
        'renamed-inactive-project',
        testSessionId
      );

      // Assert
      expect(result.success).toBe(true);

      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe('different-project'); // Should remain unchanged
    });

    it('should update project history', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'history-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);
      await sessionContextManager.addToHistory(testSessionId, 'history-project');

      // Act
      const result = await lifecycleManager.renameProject(
        'history-project',
        'renamed-history-project',
        testSessionId
      );

      // Assert
      expect(result.success).toBe(true);

      const context = await sessionContextManager.getContext(testSessionId);
      expect(context.project_history).toContain('renamed-history-project');
    });
  });

  describe('Resolver Cache Integration', () => {
    it('should clear resolver cache after rename', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'cache-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);

      // Prime the resolver cache
      await projectResolver.resolve('cache-test-project', {
        session_id: testSessionId,
        user_id: 'test-user',
        project_history: [],
        last_updated: new Date().toISOString(),
      });

      // Act
      const result = await lifecycleManager.renameProject(
        'cache-test-project',
        'renamed-cache-test-project'
      );

      // Assert
      expect(result.success).toBe(true);

      // Verify resolver can find the renamed project
      const resolveResult = await projectResolver.resolve('renamed-cache-test-project', {
        session_id: testSessionId,
        user_id: 'test-user',
        project_history: [],
        last_updated: new Date().toISOString(),
      });

      expect(resolveResult.projectName).toBe('renamed-cache-test-project');
    });
  });

  describe('Data Preservation', () => {
    it('should preserve all project data fields', async () => {
      // Arrange
      const complexProject: ProjectData = {
        project_id: 'proj-complex-' + Date.now(),
        project_name: 'complex-project',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466,
        },
        terrain_results: {
          features: [{ type: 'road' }, { type: 'building' }],
          analysis: 'complete',
        },
        layout_results: {
          turbines: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
          capacity: 100,
        },
        simulation_results: {
          annual_energy: 250,
          capacity_factor: 0.35,
        },
        report_results: {
          pdf_url: 's3://bucket/report.pdf',
          generated_at: '2025-01-02T00:00:00Z',
        },
        metadata: {
          turbine_count: 50,
          total_capacity_mw: 100,
          annual_energy_gwh: 250,
          custom_field: 'custom_value',
        },
      };

      await projectStore.save(complexProject.project_name, complexProject);

      // Act
      const result = await lifecycleManager.renameProject(
        'complex-project',
        'renamed-complex-project'
      );

      // Assert
      expect(result.success).toBe(true);

      const renamedProject = await projectStore.load('renamed-complex-project');
      expect(renamedProject).not.toBeNull();

      // Verify all fields preserved
      expect(renamedProject?.project_id).toBe(complexProject.project_id);
      expect(renamedProject?.created_at).toBe(complexProject.created_at);
      expect(renamedProject?.coordinates).toEqual(complexProject.coordinates);
      expect(renamedProject?.terrain_results).toEqual(complexProject.terrain_results);
      expect(renamedProject?.layout_results).toEqual(complexProject.layout_results);
      expect(renamedProject?.simulation_results).toEqual(complexProject.simulation_results);
      expect(renamedProject?.report_results).toEqual(complexProject.report_results);
      expect(renamedProject?.metadata).toEqual(complexProject.metadata);

      // Verify updated_at was updated
      expect(renamedProject?.updated_at).not.toBe(complexProject.updated_at);
      expect(new Date(renamedProject!.updated_at).getTime()).toBeGreaterThan(
        new Date(complexProject.updated_at).getTime()
      );
    });
  });

  describe('Error Recovery', () => {
    it('should not delete old project if save fails', async () => {
      // This test would require mocking S3 errors, which is complex in integration tests
      // Skipping for now, covered in unit tests
    });

    it('should handle multiple renames in sequence', async () => {
      // Arrange
      const project: ProjectData = {
        project_id: 'proj-test-' + Date.now(),
        project_name: 'original-name',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save(project.project_name, project);

      // Act - Rename multiple times
      const result1 = await lifecycleManager.renameProject('original-name', 'name-v2');
      expect(result1.success).toBe(true);

      const result2 = await lifecycleManager.renameProject('name-v2', 'name-v3');
      expect(result2.success).toBe(true);

      const result3 = await lifecycleManager.renameProject('name-v3', 'final-name');
      expect(result3.success).toBe(true);

      // Assert
      const finalProject = await projectStore.load('final-name');
      expect(finalProject).not.toBeNull();
      expect(finalProject?.project_id).toBe(project.project_id);

      // Verify intermediate names don't exist
      expect(await projectStore.load('original-name')).toBeNull();
      expect(await projectStore.load('name-v2')).toBeNull();
      expect(await projectStore.load('name-v3')).toBeNull();
    });
  });
});
