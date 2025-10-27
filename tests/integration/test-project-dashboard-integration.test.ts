/**
 * Integration Tests for Project Dashboard Generation
 * 
 * Tests the complete flow from orchestrator intent detection to dashboard generation
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Project Dashboard Integration Tests', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let sessionContextManager: SessionContextManager;
  const testSessionId = 'test-session-dashboard';

  beforeEach(() => {
    // Initialize components
    projectStore = new ProjectStore('test-bucket');
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager('test-table');
    
    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );
  });

  describe('Dashboard Generation', () => {
    it('should generate dashboard with project data', async () => {
      // Mock project data
      const mockProjects = [
        {
          project_name: 'test-project-1',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain-1' },
          layout_results: { s3_key: 'layout-1' },
          simulation_results: { s3_key: 'simulation-1' },
          report_results: { s3_key: 'report-1' },
          metadata: {}
        },
        {
          project_name: 'test-project-2',
          coordinates: { latitude: 35.001, longitude: -101.001 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain-2' },
          metadata: {}
        }
      ];

      // Mock projectStore.list
      jest.spyOn(projectStore, 'list').mockResolvedValue(mockProjects as any);

      // Mock session context
      const mockSessionContext = {
        session_id: testSessionId,
        active_project: 'test-project-1',
        project_history: ['test-project-1', 'test-project-2'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      jest.spyOn(sessionContextManager, 'getContext').mockResolvedValue(mockSessionContext as any);

      // Generate dashboard
      const dashboard = await lifecycleManager.generateDashboard(mockSessionContext as any);

      // Verify dashboard structure
      expect(dashboard).toBeDefined();
      expect(dashboard.projects).toHaveLength(2);
      expect(dashboard.totalProjects).toBe(2);
      expect(dashboard.activeProject).toBe('test-project-1');

      // Verify project data
      const project1 = dashboard.projects.find(p => p.name === 'test-project-1');
      expect(project1).toBeDefined();
      expect(project1?.completionPercentage).toBe(100); // All steps complete
      expect(project1?.isActive).toBe(true);
      expect(project1?.status).toBe('Complete');

      const project2 = dashboard.projects.find(p => p.name === 'test-project-2');
      expect(project2).toBeDefined();
      expect(project2?.completionPercentage).toBe(25); // Only terrain complete
      expect(project2?.isActive).toBe(false);
      expect(project2?.status).toBe('Terrain Complete');
    });

    it('should detect duplicate projects in dashboard', async () => {
      // Mock duplicate projects (same coordinates)
      const mockProjects = [
        {
          project_name: 'amarillo-1',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain-1' },
          metadata: {}
        },
        {
          project_name: 'amarillo-2',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain-2' },
          metadata: {}
        }
      ];

      jest.spyOn(projectStore, 'list').mockResolvedValue(mockProjects as any);

      const mockSessionContext = {
        session_id: testSessionId,
        active_project: null,
        project_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dashboard = await lifecycleManager.generateDashboard(mockSessionContext as any);

      // Verify duplicates detected
      expect(dashboard.duplicateGroups).toHaveLength(1);
      expect(dashboard.duplicateGroups[0].count).toBe(2);
      expect(dashboard.duplicateGroups[0].projects).toHaveLength(2);

      // Verify projects marked as duplicates
      const project1 = dashboard.projects.find(p => p.name === 'amarillo-1');
      const project2 = dashboard.projects.find(p => p.name === 'amarillo-2');
      expect(project1?.isDuplicate).toBe(true);
      expect(project2?.isDuplicate).toBe(true);
    });

    it('should handle empty project list', async () => {
      jest.spyOn(projectStore, 'list').mockResolvedValue([]);

      const mockSessionContext = {
        session_id: testSessionId,
        active_project: null,
        project_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dashboard = await lifecycleManager.generateDashboard(mockSessionContext as any);

      expect(dashboard.projects).toHaveLength(0);
      expect(dashboard.totalProjects).toBe(0);
      expect(dashboard.activeProject).toBeNull();
      expect(dashboard.duplicateGroups).toHaveLength(0);
    });

    it('should calculate completion percentage correctly', async () => {
      const mockProjects = [
        {
          project_name: 'no-steps',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        },
        {
          project_name: 'one-step',
          coordinates: { latitude: 36.0, longitude: -102.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain' },
          metadata: {}
        },
        {
          project_name: 'two-steps',
          coordinates: { latitude: 37.0, longitude: -103.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain' },
          layout_results: { s3_key: 'layout' },
          metadata: {}
        },
        {
          project_name: 'three-steps',
          coordinates: { latitude: 38.0, longitude: -104.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain' },
          layout_results: { s3_key: 'layout' },
          simulation_results: { s3_key: 'simulation' },
          metadata: {}
        }
      ];

      jest.spyOn(projectStore, 'list').mockResolvedValue(mockProjects as any);

      const mockSessionContext = {
        session_id: testSessionId,
        active_project: null,
        project_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dashboard = await lifecycleManager.generateDashboard(mockSessionContext as any);

      const noSteps = dashboard.projects.find(p => p.name === 'no-steps');
      const oneStep = dashboard.projects.find(p => p.name === 'one-step');
      const twoSteps = dashboard.projects.find(p => p.name === 'two-steps');
      const threeSteps = dashboard.projects.find(p => p.name === 'three-steps');

      expect(noSteps?.completionPercentage).toBe(0);
      expect(oneStep?.completionPercentage).toBe(25);
      expect(twoSteps?.completionPercentage).toBe(50);
      expect(threeSteps?.completionPercentage).toBe(75);
    });
  });

  describe('Dashboard Artifact Generation', () => {
    it('should create proper artifact structure', async () => {
      const mockProjects = [
        {
          project_name: 'test-project',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terrain_results: { s3_key: 'terrain' },
          metadata: {}
        }
      ];

      jest.spyOn(projectStore, 'list').mockResolvedValue(mockProjects as any);

      const mockSessionContext = {
        session_id: testSessionId,
        active_project: 'test-project',
        project_history: ['test-project'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dashboard = await lifecycleManager.generateDashboard(mockSessionContext as any);

      // Verify artifact can be created
      const artifact = {
        type: 'project_dashboard',
        messageContentType: 'project_dashboard',
        data: dashboard,
        metadata: {
          generated_at: new Date().toISOString(),
          total_projects: dashboard.totalProjects,
          active_project: dashboard.activeProject,
          duplicate_count: dashboard.duplicateGroups.length
        }
      };

      expect(artifact.type).toBe('project_dashboard');
      expect(artifact.data).toBeDefined();
      expect(artifact.data.projects).toHaveLength(1);
      expect(artifact.metadata.total_projects).toBe(1);
      expect(artifact.metadata.active_project).toBe('test-project');
    });
  });
});
