/**
 * Unit tests for ProjectStore new fields (archived, status, imported_at)
 */

import { ProjectStore, ProjectData, ProjectStatus } from '../../amplify/functions/shared/projectStore';
import { 
  validateProjectData, 
  validatePartialProjectData,
  isProjectArchived,
  isProjectInProgress,
  isProjectImported,
  getProjectCompletionPercentage,
  getProjectStatusDisplay,
  getArchivedStatusDisplay
} from '../../amplify/functions/shared/projectSchema';

describe('ProjectStore New Fields', () => {
  let projectStore: ProjectStore;
  const testProjectName = 'test-project-new-fields';

  beforeEach(() => {
    // Use in-memory cache only for testing
    projectStore = new ProjectStore('');
    projectStore.clearCache();
  });

  describe('Status Field', () => {
    it('should set default status to not_started for new projects', async () => {
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      };

      await projectStore.save(testProjectName, projectData);
      const loaded = await projectStore.load(testProjectName);

      expect(loaded).not.toBeNull();
      expect(loaded?.status).toBe('not_started');
    });

    it('should allow setting status to in_progress', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
        status: 'in_progress',
      });

      const loaded = await projectStore.load(testProjectName);
      expect(loaded?.status).toBe('in_progress');
    });

    it('should allow updating status', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
        status: 'not_started',
      });

      await projectStore.updateStatus(testProjectName, 'in_progress');
      let loaded = await projectStore.load(testProjectName);
      expect(loaded?.status).toBe('in_progress');

      await projectStore.updateStatus(testProjectName, 'completed');
      loaded = await projectStore.load(testProjectName);
      expect(loaded?.status).toBe('completed');
    });

    it('should check if project is in progress', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
        status: 'in_progress',
      });

      const inProgress = await projectStore.isInProgress(testProjectName);
      expect(inProgress).toBe(true);
    });
  });

  describe('Archived Field', () => {
    it('should not be archived by default', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      const loaded = await projectStore.load(testProjectName);
      expect(loaded?.metadata?.archived).toBeUndefined();
    });

    it('should archive a project', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      await projectStore.archive(testProjectName);
      const loaded = await projectStore.load(testProjectName);

      expect(loaded?.metadata?.archived).toBe(true);
      expect(loaded?.metadata?.archived_at).toBeDefined();
      expect(new Date(loaded!.metadata!.archived_at!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should unarchive a project', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      await projectStore.archive(testProjectName);
      await projectStore.unarchive(testProjectName);
      const loaded = await projectStore.load(testProjectName);

      expect(loaded?.metadata?.archived).toBe(false);
      expect(loaded?.metadata?.archived_at).toBeUndefined();
    });

    it('should check if project is archived', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      await projectStore.archive(testProjectName);
      const archived = await projectStore.isArchived(testProjectName);
      expect(archived).toBe(true);
    });

    it('should list archived projects', async () => {
      // Note: This test requires S3 to work properly
      // With in-memory cache only, list() returns empty array
      // We'll just verify the method exists and doesn't throw
      const archived = await projectStore.listArchived();
      expect(Array.isArray(archived)).toBe(true);
    });

    it('should list active projects', async () => {
      // Note: This test requires S3 to work properly
      // With in-memory cache only, list() returns empty array
      // We'll just verify the method exists and doesn't throw
      const active = await projectStore.listActive();
      expect(Array.isArray(active)).toBe(true);
    });
  });

  describe('Imported Field', () => {
    it('should not have imported_at by default', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      const loaded = await projectStore.load(testProjectName);
      expect(loaded?.metadata?.imported_at).toBeUndefined();
    });

    it('should mark project as imported', async () => {
      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
      });

      await projectStore.markAsImported(testProjectName);
      const loaded = await projectStore.load(testProjectName);

      expect(loaded?.metadata?.imported_at).toBeDefined();
      expect(new Date(loaded!.metadata!.imported_at!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should allow setting imported_at during save', async () => {
      const importedAt = new Date('2024-01-15T10:00:00Z').toISOString();

      await projectStore.save(testProjectName, {
        project_id: 'proj-123-test',
        project_name: testProjectName,
        metadata: {
          imported_at: importedAt,
        },
      });

      const loaded = await projectStore.load(testProjectName);
      expect(loaded?.metadata?.imported_at).toBe(importedAt);
    });
  });

  describe('Schema Validation', () => {
    it('should validate status field', () => {
      const validData: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'in_progress',
      };

      const result = validateProjectData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid status', () => {
      const invalidData: any = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'invalid_status',
      };

      const result = validateProjectData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('status'))).toBe(true);
    });

    it('should validate archived field', () => {
      const validData: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          archived: true,
          archived_at: new Date().toISOString(),
        },
      };

      const result = validateProjectData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid archived_at', () => {
      const invalidData: any = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          archived: true,
          archived_at: 'not-a-date',
        },
      };

      const result = validateProjectData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('archived_at'))).toBe(true);
    });

    it('should validate imported_at field', () => {
      const validData: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          imported_at: new Date().toISOString(),
        },
      };

      const result = validateProjectData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Helper Functions', () => {
    it('should check if project is archived', () => {
      const archivedProject: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          archived: true,
        },
      };

      expect(isProjectArchived(archivedProject)).toBe(true);
    });

    it('should check if project is in progress', () => {
      const inProgressProject: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'in_progress',
      };

      expect(isProjectInProgress(inProgressProject)).toBe(true);
    });

    it('should check if project was imported', () => {
      const importedProject: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          imported_at: new Date().toISOString(),
        },
      };

      expect(isProjectImported(importedProject)).toBe(true);
    });

    it('should calculate project completion percentage', () => {
      const project: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        terrain_results: {},
        layout_results: {},
      };

      expect(getProjectCompletionPercentage(project)).toBe(50);
    });

    it('should get project status display', () => {
      const project: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'in_progress',
      };

      expect(getProjectStatusDisplay(project)).toBe('In Progress');
    });

    it('should get archived status display', () => {
      const project: ProjectData = {
        project_id: 'proj-123-test',
        project_name: 'test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          archived: true,
          archived_at: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
      };

      const display = getArchivedStatusDisplay(project);
      expect(display).toContain('Archived');
    });
  });
});
