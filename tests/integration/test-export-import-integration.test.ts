/**
 * Integration tests for export/import functionality
 * 
 * Tests the complete export/import workflow including:
 * - Export with all data
 * - Import with validation
 * - Name conflict handling
 * - Version validation
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Export/Import Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  beforeEach(() => {
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
  });

  afterEach(() => {
    projectStore.clearCache();
  });

  describe('Export functionality', () => {
    it('should export project with all data and artifact S3 keys', async () => {
      // Create a test project
      await projectStore.save('test-export-project', {
        project_id: 'proj-test-export',
        project_name: 'test-export-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 35.0,
          longitude: -101.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/test-export-project/terrain.json',
          data: 'terrain data',
        },
        layout_results: {
          s3_key: 'renewable/projects/test-export-project/layout.json',
          data: 'layout data',
        },
        metadata: {
          turbine_count: 50,
          total_capacity_mw: 150,
        },
      });

      // Export the project
      const exportData = await lifecycleManager.exportProject('test-export-project');

      // Verify export data
      expect(exportData).not.toBeNull();
      expect(exportData!.version).toBe('1.0');
      expect(exportData!.exportedAt).toBeDefined();
      expect(exportData!.project.project_name).toBe('test-export-project');
      expect(exportData!.project.coordinates).toEqual({
        latitude: 35.0,
        longitude: -101.0,
      });
      expect(exportData!.artifacts.terrain).toBe('renewable/projects/test-export-project/terrain.json');
      expect(exportData!.artifacts.layout).toBe('renewable/projects/test-export-project/layout.json');
    });

    it('should throw error when exporting non-existent project', async () => {
      await expect(
        lifecycleManager.exportProject('nonexistent-project')
      ).rejects.toThrow('not found');
    });
  });

  describe('Import functionality', () => {
    it('should import project successfully', async () => {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-test-import',
          project_name: 'test-import-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          coordinates: {
            latitude: 36.0,
            longitude: -102.0,
          },
          metadata: {
            turbine_count: 30,
          },
        },
        artifacts: {
          terrain: 'renewable/projects/test-import-project/terrain.json',
        },
      };

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('test-import-project');
      expect(result.message).toContain('imported');

      // Verify imported project exists
      const imported = await projectStore.load('test-import-project');
      expect(imported).not.toBeNull();
      expect(imported!.project_name).toBe('test-import-project');
      expect(imported!.metadata?.imported_at).toBeDefined();
    });

    it('should handle name conflict during import', async () => {
      // Create existing project
      await projectStore.save('existing-project', {
        project_id: 'proj-existing',
        project_name: 'existing-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Try to import with same name
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-import-conflict',
          project_name: 'existing-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        artifacts: {},
      };

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(true);
      expect(result.projectName).toContain('imported');
      expect(result.projectName).not.toBe('existing-project');
    });

    it('should reject unsupported export version', async () => {
      const exportData = {
        version: '2.0', // Unsupported
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-test-version',
          project_name: 'test-version-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        artifacts: {},
      };

      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported export version');
      expect(result.message).toContain('2.0');
    });
  });

  describe('End-to-end export/import workflow', () => {
    it('should export and re-import project successfully', async () => {
      // Create original project
      await projectStore.save('original-project', {
        project_id: 'proj-original',
        project_name: 'original-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 37.0,
          longitude: -103.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/original-project/terrain.json',
        },
        metadata: {
          turbine_count: 40,
          total_capacity_mw: 120,
        },
      });

      // Export the project
      const exportData = await lifecycleManager.exportProject('original-project');
      expect(exportData).not.toBeNull();

      // Delete original project (clear cache to simulate deletion)
      projectStore.clearCache();

      // Re-import the project
      const result = await lifecycleManager.importProject(exportData!);
      expect(result.success).toBe(true);

      // Verify re-imported project
      const reimported = await projectStore.load(result.projectName);
      expect(reimported).not.toBeNull();
      expect(reimported!.coordinates).toEqual({
        latitude: 37.0,
        longitude: -103.0,
      });
      expect(reimported!.metadata?.turbine_count).toBe(40);
      expect(reimported!.metadata?.total_capacity_mw).toBe(120);
      expect(reimported!.metadata?.imported_at).toBeDefined();
    });

    it('should preserve all data during export/import cycle', async () => {
      // Create project with complete data
      const originalData = {
        project_id: 'proj-complete',
        project_name: 'complete-project',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
        coordinates: {
          latitude: 38.0,
          longitude: -104.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/complete-project/terrain.json',
          features: 151,
        },
        layout_results: {
          s3_key: 'renewable/projects/complete-project/layout.json',
          turbines: 50,
        },
        simulation_results: {
          s3_key: 'renewable/projects/complete-project/simulation.json',
          energy: 450,
        },
        report_results: {
          s3_key: 'renewable/projects/complete-project/report.pdf',
        },
        metadata: {
          turbine_count: 50,
          total_capacity_mw: 150,
          annual_energy_gwh: 450,
        },
      };

      await projectStore.save('complete-project', originalData);

      // Export
      const exportData = await lifecycleManager.exportProject('complete-project');

      // Import with different name
      exportData!.project.project_name = 'imported-complete-project';
      const result = await lifecycleManager.importProject(exportData!);

      expect(result.success).toBe(true);

      // Verify all data preserved
      const imported = await projectStore.load(result.projectName);
      expect(imported).not.toBeNull();
      expect(imported!.coordinates).toEqual(originalData.coordinates);
      expect(imported!.terrain_results).toEqual(originalData.terrain_results);
      expect(imported!.layout_results).toEqual(originalData.layout_results);
      expect(imported!.simulation_results).toEqual(originalData.simulation_results);
      expect(imported!.report_results).toEqual(originalData.report_results);
      expect(imported!.metadata?.turbine_count).toBe(originalData.metadata.turbine_count);
      expect(imported!.metadata?.total_capacity_mw).toBe(originalData.metadata.total_capacity_mw);
      expect(imported!.metadata?.annual_energy_gwh).toBe(originalData.metadata.annual_energy_gwh);
    });
  });

  describe('Artifact S3 keys', () => {
    it('should include all artifact S3 keys in export', async () => {
      await projectStore.save('artifacts-project', {
        project_id: 'proj-artifacts',
        project_name: 'artifacts-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        terrain_results: {
          s3_key: 'renewable/projects/artifacts-project/terrain.json',
        },
        layout_results: {
          s3_key: 'renewable/projects/artifacts-project/layout.json',
        },
        simulation_results: {
          s3_key: 'renewable/projects/artifacts-project/simulation.json',
        },
        report_results: {
          s3_key: 'renewable/projects/artifacts-project/report.pdf',
        },
      });

      const exportData = await lifecycleManager.exportProject('artifacts-project');

      expect(exportData!.artifacts.terrain).toBe('renewable/projects/artifacts-project/terrain.json');
      expect(exportData!.artifacts.layout).toBe('renewable/projects/artifacts-project/layout.json');
      expect(exportData!.artifacts.simulation).toBe('renewable/projects/artifacts-project/simulation.json');
      expect(exportData!.artifacts.report).toBe('renewable/projects/artifacts-project/report.pdf');
    });

    it('should handle missing artifact S3 keys gracefully', async () => {
      await projectStore.save('partial-artifacts-project', {
        project_id: 'proj-partial',
        project_name: 'partial-artifacts-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        terrain_results: {
          s3_key: 'renewable/projects/partial-artifacts-project/terrain.json',
        },
        // No other results
      });

      const exportData = await lifecycleManager.exportProject('partial-artifacts-project');

      expect(exportData!.artifacts.terrain).toBe('renewable/projects/partial-artifacts-project/terrain.json');
      expect(exportData!.artifacts.layout).toBeUndefined();
      expect(exportData!.artifacts.simulation).toBeUndefined();
      expect(exportData!.artifacts.report).toBeUndefined();
    });
  });
});
