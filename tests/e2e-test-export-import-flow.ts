/**
 * End-to-End Test: Export/Import Flow
 * 
 * Tests the complete export/import workflow including:
 * - Export project with all data
 * - Import project with validation
 * - Handle name conflicts
 * - Validate version
 * - Preserve data integrity
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';
import { ExportData } from '../amplify/functions/shared/projectLifecycleManager';

describe('E2E: Export/Import Flow', () => {
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

  describe('Requirement 9.1: Export project with all data', () => {
    it('should export project with complete data and artifact S3 keys', async () => {
      // Create a complete project
      const projectData = {
        project_id: 'proj-export-complete',
        project_name: 'export-complete-project',
        created_at: '2025-01-15T10:00:00.000Z',
        updated_at: '2025-01-20T14:30:00.000Z',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466,
        },
        terrain_results: {
          s3_key: 'renewable/projects/export-complete-project/terrain.json',
          features: 151,
          analysis_complete: true,
        },
        layout_results: {
          s3_key: 'renewable/projects/export-complete-project/layout.json',
          turbines: 50,
          capacity_mw: 150,
        },
        simulation_results: {
          s3_key: 'renewable/projects/export-complete-project/simulation.json',
          annual_energy_gwh: 450,
          capacity_factor: 0.35,
        },
        report_results: {
          s3_key: 'renewable/projects/export-complete-project/report.pdf',
          generated_at: '2025-01-20T14:30:00.000Z',
        },
        metadata: {
          turbine_count: 50,
          total_capacity_mw: 150,
          annual_energy_gwh: 450,
          project_type: 'wind_farm',
        },
      };

      await projectStore.save('export-complete-project', projectData);

      // Export the project
      const exportData = await lifecycleManager.exportProject('export-complete-project');

      // Verify export structure (Requirement 9.1)
      expect(exportData).not.toBeNull();
      expect(exportData!.version).toBe('1.0');
      expect(exportData!.exportedAt).toBeDefined();
      expect(new Date(exportData!.exportedAt).getTime()).toBeLessThanOrEqual(Date.now());

      // Verify project data included (Requirement 9.3)
      expect(exportData!.project.project_name).toBe('export-complete-project');
      expect(exportData!.project.coordinates).toEqual({
        latitude: 35.067482,
        longitude: -101.395466,
      });
      expect(exportData!.project.terrain_results).toEqual(projectData.terrain_results);
      expect(exportData!.project.layout_results).toEqual(projectData.layout_results);
      expect(exportData!.project.simulation_results).toEqual(projectData.simulation_results);
      expect(exportData!.project.report_results).toEqual(projectData.report_results);
      expect(exportData!.project.metadata).toEqual(projectData.metadata);

      // Verify artifact S3 keys included (Requirement 9.3)
      expect(exportData!.artifacts.terrain).toBe('renewable/projects/export-complete-project/terrain.json');
      expect(exportData!.artifacts.layout).toBe('renewable/projects/export-complete-project/layout.json');
      expect(exportData!.artifacts.simulation).toBe('renewable/projects/export-complete-project/simulation.json');
      expect(exportData!.artifacts.report).toBe('renewable/projects/export-complete-project/report.pdf');
    });

    it('should export project with partial data gracefully', async () => {
      // Create project with only terrain analysis
      const projectData = {
        project_id: 'proj-export-partial',
        project_name: 'export-partial-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 36.0,
          longitude: -102.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/export-partial-project/terrain.json',
          features: 151,
        },
        // No layout, simulation, or report
        metadata: {
          project_type: 'wind_farm',
        },
      };

      await projectStore.save('export-partial-project', projectData);

      // Export the project
      const exportData = await lifecycleManager.exportProject('export-partial-project');

      // Verify export succeeds with partial data
      expect(exportData).not.toBeNull();
      expect(exportData!.artifacts.terrain).toBe('renewable/projects/export-partial-project/terrain.json');
      expect(exportData!.artifacts.layout).toBeUndefined();
      expect(exportData!.artifacts.simulation).toBeUndefined();
      expect(exportData!.artifacts.report).toBeUndefined();
    });

    it('should throw error when exporting non-existent project', async () => {
      await expect(
        lifecycleManager.exportProject('nonexistent-project')
      ).rejects.toThrow('not found');
    });
  });

  describe('Requirement 9.2: Import project from export data', () => {
    it('should import project successfully', async () => {
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-import-test',
          project_name: 'import-test-project',
          created_at: '2025-01-15T10:00:00.000Z',
          updated_at: '2025-01-20T14:30:00.000Z',
          coordinates: {
            latitude: 37.0,
            longitude: -103.0,
          },
          terrain_results: {
            s3_key: 'renewable/projects/import-test-project/terrain.json',
          },
          metadata: {
            turbine_count: 40,
            total_capacity_mw: 120,
          },
        },
        artifacts: {
          terrain: 'renewable/projects/import-test-project/terrain.json',
        },
      };

      // Import the project (Requirement 9.2)
      const result = await lifecycleManager.importProject(exportData);

      // Verify import success
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('import-test-project');
      expect(result.message).toContain('imported');

      // Verify imported project exists
      const imported = await projectStore.load('import-test-project');
      expect(imported).not.toBeNull();
      expect(imported!.project_name).toBe('import-test-project');
      expect(imported!.coordinates).toEqual({
        latitude: 37.0,
        longitude: -103.0,
      });
      expect(imported!.terrain_results).toEqual(exportData.project.terrain_results);
      expect(imported!.metadata?.turbine_count).toBe(40);
      expect(imported!.metadata?.total_capacity_mw).toBe(120);
      expect(imported!.metadata?.imported_at).toBeDefined();
    });
  });

  describe('Requirement 9.4: Validate data format and check for conflicts', () => {
    it('should validate export format version', async () => {
      const exportData: ExportData = {
        version: '2.0', // Unsupported version
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-version-test',
          project_name: 'version-test-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        artifacts: {},
      };

      // Import should fail (Requirement 9.4)
      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported export version');
      expect(result.message).toContain('2.0');
    });
  });

  describe('Requirement 9.5: Handle name conflicts during import', () => {
    it('should handle name conflict by appending -imported suffix', async () => {
      // Create existing project
      await projectStore.save('existing-project', {
        project_id: 'proj-existing',
        project_name: 'existing-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 38.0,
          longitude: -104.0,
        },
      });

      // Try to import with same name
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-import-conflict',
          project_name: 'existing-project', // Same name
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          coordinates: {
            latitude: 39.0,
            longitude: -105.0,
          },
        },
        artifacts: {},
      };

      // Import should succeed with modified name (Requirement 9.5)
      const result = await lifecycleManager.importProject(exportData);

      expect(result.success).toBe(true);
      expect(result.projectName).toContain('imported');
      expect(result.projectName).not.toBe('existing-project');

      // Verify both projects exist
      const original = await projectStore.load('existing-project');
      const imported = await projectStore.load(result.projectName);

      expect(original).not.toBeNull();
      expect(imported).not.toBeNull();
      expect(original!.coordinates?.latitude).toBe(38.0);
      expect(imported!.coordinates?.latitude).toBe(39.0);
    });
  });

  describe('Complete export/import cycle', () => {
    it('should preserve all data through export/import cycle', async () => {
      // Create original project with complete data
      const originalData = {
        project_id: 'proj-cycle-test',
        project_name: 'cycle-test-project',
        created_at: '2025-01-10T08:00:00.000Z',
        updated_at: '2025-01-20T16:00:00.000Z',
        coordinates: {
          latitude: 40.0,
          longitude: -106.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/cycle-test-project/terrain.json',
          features: 151,
          analysis_complete: true,
        },
        layout_results: {
          s3_key: 'renewable/projects/cycle-test-project/layout.json',
          turbines: 60,
          capacity_mw: 180,
        },
        simulation_results: {
          s3_key: 'renewable/projects/cycle-test-project/simulation.json',
          annual_energy_gwh: 540,
          capacity_factor: 0.34,
        },
        report_results: {
          s3_key: 'renewable/projects/cycle-test-project/report.pdf',
        },
        metadata: {
          turbine_count: 60,
          total_capacity_mw: 180,
          annual_energy_gwh: 540,
          project_type: 'wind_farm',
          custom_field: 'test_value',
        },
      };

      await projectStore.save('cycle-test-project', originalData);

      // Export the project
      const exportData = await lifecycleManager.exportProject('cycle-test-project');
      expect(exportData).not.toBeNull();

      // Modify name for import
      exportData!.project.project_name = 'cycle-test-project-reimported';

      // Import the project
      const result = await lifecycleManager.importProject(exportData!);
      expect(result.success).toBe(true);

      // Verify all data preserved
      const reimported = await projectStore.load(result.projectName);
      expect(reimported).not.toBeNull();

      // Check coordinates
      expect(reimported!.coordinates).toEqual(originalData.coordinates);

      // Check all analysis results
      expect(reimported!.terrain_results).toEqual(originalData.terrain_results);
      expect(reimported!.layout_results).toEqual(originalData.layout_results);
      expect(reimported!.simulation_results).toEqual(originalData.simulation_results);
      expect(reimported!.report_results).toEqual(originalData.report_results);

      // Check metadata
      expect(reimported!.metadata?.turbine_count).toBe(originalData.metadata.turbine_count);
      expect(reimported!.metadata?.total_capacity_mw).toBe(originalData.metadata.total_capacity_mw);
      expect(reimported!.metadata?.annual_energy_gwh).toBe(originalData.metadata.annual_energy_gwh);
      expect(reimported!.metadata?.project_type).toBe(originalData.metadata.project_type);
      expect(reimported!.metadata?.custom_field).toBe(originalData.metadata.custom_field);

      // Check imported_at timestamp added
      expect(reimported!.metadata?.imported_at).toBeDefined();
    });

    it('should allow imported project to be exported again', async () => {
      // Create and export original project
      await projectStore.save('re-export-test', {
        project_id: 'proj-re-export',
        project_name: 're-export-test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 41.0,
          longitude: -107.0,
        },
        terrain_results: {
          s3_key: 'renewable/projects/re-export-test/terrain.json',
        },
      });

      const exportData1 = await lifecycleManager.exportProject('re-export-test');
      expect(exportData1).not.toBeNull();

      // Import the project
      exportData1!.project.project_name = 're-export-test-imported';
      const importResult = await lifecycleManager.importProject(exportData1!);
      expect(importResult.success).toBe(true);

      // Export the imported project
      const exportData2 = await lifecycleManager.exportProject(importResult.projectName);
      expect(exportData2).not.toBeNull();
      expect(exportData2!.project.project_name).toBe(importResult.projectName);
      expect(exportData2!.project.metadata?.imported_at).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid export data gracefully', async () => {
      const invalidExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        // Missing project field
        artifacts: {},
      } as any;

      const result = await lifecycleManager.importProject(invalidExportData);
      expect(result.success).toBe(false);
    });

    it('should handle missing artifact S3 keys gracefully', async () => {
      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
          project_id: 'proj-no-artifacts',
          project_name: 'no-artifacts-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // No results fields
        },
        artifacts: {}, // Empty artifacts
      };

      const result = await lifecycleManager.importProject(exportData);
      expect(result.success).toBe(true);

      const imported = await projectStore.load(result.projectName);
      expect(imported).not.toBeNull();
      expect(imported!.terrain_results).toBeUndefined();
      expect(imported!.layout_results).toBeUndefined();
    });
  });
});
