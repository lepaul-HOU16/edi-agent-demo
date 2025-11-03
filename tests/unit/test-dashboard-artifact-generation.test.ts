/**
 * Unit Tests for Dashboard Artifact Generation
 * 
 * Tests the generateDashboardArtifact() method to ensure:
 * - Artifact generation with multiple projects
 * - Completion percentage calculation (0%, 25%, 50%, 75%, 100%)
 * - Duplicate detection with projects at same location
 * - Duplicate detection with projects 0.5km apart
 * - Duplicate detection with projects 2km apart
 * - Active project marking
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3
 */

import { ProjectListHandler } from '../../amplify/functions/shared/projectListHandler';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock the dependencies
jest.mock('../../amplify/functions/shared/projectStore');
jest.mock('../../amplify/functions/shared/sessionContextManager');

describe('ProjectListHandler.generateDashboardArtifact', () => {
  let handler: ProjectListHandler;
  let mockProjectStore: jest.Mocked<ProjectStore>;
  let mockSessionContextManager: jest.Mocked<SessionContextManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create handler instance
    handler = new ProjectListHandler('test-bucket', 'test-table');

    // Get mocked instances
    mockProjectStore = (handler as any).projectStore;
    mockSessionContextManager = (handler as any).sessionContextManager;
  });

  describe('Multiple projects artifact generation', () => {
    
    test('should generate artifact with multiple projects', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'wind-farm-texas',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
          layout_results: { data: 'layout' },
        },
        {
          project_id: 'proj-2',
          project_name: 'wind-farm-kansas',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
          coordinates: { latitude: 38.0, longitude: -98.0 },
          terrain_results: { data: 'terrain' },
        },
        {
          project_id: 'proj-3',
          project_name: 'wind-farm-oklahoma',
          created_at: '2024-01-05T00:00:00Z',
          updated_at: '2024-01-06T00:00:00Z',
          coordinates: { latitude: 36.0, longitude: -97.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectCount).toBe(3);
      expect(result.artifacts).toHaveLength(1);
      
      const artifact = result.artifacts[0];
      expect(artifact.type).toBe('project_dashboard');
      expect(artifact.title).toBe('Renewable Energy Projects Dashboard');
      expect(artifact.data.projects).toHaveLength(3);
      expect(artifact.data.totalProjects).toBe(3);
    });

    test('should return empty artifacts for no projects', async () => {
      // Arrange
      mockProjectStore.list.mockResolvedValue([]);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectCount).toBe(0);
      expect(result.artifacts).toHaveLength(0);
      expect(result.message).toBe('You don\'t have any renewable energy projects yet.');
    });
  });

  describe('Completion percentage calculation (Requirement 5.2)', () => {
    
    test('should calculate 0% completion for project with no results', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'new-project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const projectData = result.artifacts[0].data.projects[0];
      expect(projectData.completionPercentage).toBe(0);
      expect(projectData.status).toBe('Not Started');
    });

    test('should calculate 25% completion for project with terrain only', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'terrain-only',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const projectData = result.artifacts[0].data.projects[0];
      expect(projectData.completionPercentage).toBe(25);
      expect(projectData.status).toBe('Terrain Complete');
    });

    test('should calculate 50% completion for project with terrain and layout', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'layout-complete',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
          layout_results: { data: 'layout' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const projectData = result.artifacts[0].data.projects[0];
      expect(projectData.completionPercentage).toBe(50);
      expect(projectData.status).toBe('Layout Complete');
    });

    test('should calculate 75% completion for project with terrain, layout, and simulation', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'simulation-complete',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
          layout_results: { data: 'layout' },
          simulation_results: { data: 'simulation' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const projectData = result.artifacts[0].data.projects[0];
      expect(projectData.completionPercentage).toBe(75);
      expect(projectData.status).toBe('Simulation Complete');
    });

    test('should calculate 100% completion for project with all results', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'complete-project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
          layout_results: { data: 'layout' },
          simulation_results: { data: 'simulation' },
          report_results: { data: 'report' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const projectData = result.artifacts[0].data.projects[0];
      expect(projectData.completionPercentage).toBe(100);
      expect(projectData.status).toBe('Complete');
    });
  });

  describe('Duplicate detection at same location (Requirement 2.3)', () => {
    
    test('should detect duplicates at exact same coordinates', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          terrain_results: { data: 'terrain' },
        },
        {
          project_id: 'proj-2',
          project_name: 'project-b',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 }, // Same coordinates
          terrain_results: { data: 'terrain' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // Both projects should be marked as duplicates
      expect(artifact.data.projects[0].isDuplicate).toBe(true);
      expect(artifact.data.projects[1].isDuplicate).toBe(true);
      
      // Should have one duplicate group
      expect(artifact.data.duplicateGroups).toHaveLength(1);
      expect(artifact.data.duplicateGroups[0].count).toBe(2);
      expect(artifact.data.duplicateGroups[0].projects).toHaveLength(2);
    });

    test('should detect duplicates with three projects at same location', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-2',
          project_name: 'project-b',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-3',
          project_name: 'project-c',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // All three projects should be marked as duplicates
      expect(artifact.data.projects[0].isDuplicate).toBe(true);
      expect(artifact.data.projects[1].isDuplicate).toBe(true);
      expect(artifact.data.projects[2].isDuplicate).toBe(true);
      
      // Should have one duplicate group with 3 projects
      expect(artifact.data.duplicateGroups).toHaveLength(1);
      expect(artifact.data.duplicateGroups[0].count).toBe(3);
    });
  });

  describe('Duplicate detection at 0.5km apart (Requirement 2.3)', () => {
    
    test('should detect duplicates within 0.5km radius', async () => {
      // Arrange
      // Two projects approximately 0.5km apart
      // Using Haversine formula: ~0.0045 degrees latitude ≈ 0.5km
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-north',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-2',
          project_name: 'project-south',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.0045, longitude: -101.0 }, // ~0.5km north
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // Both projects should be marked as duplicates (within 1km threshold)
      expect(artifact.data.projects[0].isDuplicate).toBe(true);
      expect(artifact.data.projects[1].isDuplicate).toBe(true);
      
      // Should have one duplicate group
      expect(artifact.data.duplicateGroups).toHaveLength(1);
      expect(artifact.data.duplicateGroups[0].count).toBe(2);
    });
  });

  describe('Duplicate detection at 2km apart (Requirement 2.3)', () => {
    
    test('should NOT detect duplicates beyond 1km radius', async () => {
      // Arrange
      // Two projects approximately 2km apart
      // Using Haversine formula: ~0.018 degrees latitude ≈ 2km
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-north',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-2',
          project_name: 'project-south',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.018, longitude: -101.0 }, // ~2km north
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // Neither project should be marked as duplicate (beyond 1km threshold)
      expect(artifact.data.projects[0].isDuplicate).toBe(false);
      expect(artifact.data.projects[1].isDuplicate).toBe(false);
      
      // Should have no duplicate groups
      expect(artifact.data.duplicateGroups).toHaveLength(0);
    });

    test('should handle multiple separate groups correctly', async () => {
      // Arrange
      const projects: ProjectData[] = [
        // Group 1: Two projects at same location
        {
          project_id: 'proj-1',
          project_name: 'texas-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-2',
          project_name: 'texas-b',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        // Group 2: Two projects at different location (2km away from group 1)
        {
          project_id: 'proj-3',
          project_name: 'kansas-a',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          coordinates: { latitude: 35.018, longitude: -101.0 },
        },
        {
          project_id: 'proj-4',
          project_name: 'kansas-b',
          created_at: '2024-01-04T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
          coordinates: { latitude: 35.018, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // All projects should be marked as duplicates
      expect(artifact.data.projects[0].isDuplicate).toBe(true);
      expect(artifact.data.projects[1].isDuplicate).toBe(true);
      expect(artifact.data.projects[2].isDuplicate).toBe(true);
      expect(artifact.data.projects[3].isDuplicate).toBe(true);
      
      // Should have two separate duplicate groups
      expect(artifact.data.duplicateGroups).toHaveLength(2);
      expect(artifact.data.duplicateGroups[0].count).toBe(2);
      expect(artifact.data.duplicateGroups[1].count).toBe(2);
    });
  });

  describe('Active project marking (Requirement 2.4)', () => {
    
    test('should mark active project correctly', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
        {
          project_id: 'proj-2',
          project_name: 'project-b',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 36.0, longitude: -102.0 },
        },
        {
          project_id: 'proj-3',
          project_name: 'project-c',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          coordinates: { latitude: 37.0, longitude: -103.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue('project-b');

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // Only project-b should be marked as active
      expect(artifact.data.projects[0].isActive).toBe(false);
      expect(artifact.data.projects[1].isActive).toBe(true);
      expect(artifact.data.projects[2].isActive).toBe(false);
      
      // Active project should be set in data
      expect(artifact.data.activeProject).toBe('project-b');
    });

    test('should handle no active project', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      
      // No project should be marked as active
      expect(artifact.data.projects[0].isActive).toBe(false);
      expect(artifact.data.activeProject).toBe(null);
    });

    test('should handle session context error gracefully', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockRejectedValue(new Error('DynamoDB error'));

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert - should still succeed with no active project
      expect(result.success).toBe(true);
      const artifact = result.artifacts[0];
      expect(artifact.data.projects[0].isActive).toBe(false);
      expect(artifact.data.activeProject).toBe(null);
    });
  });

  describe('Location formatting (Requirement 5.1)', () => {
    
    test('should format location with 4 decimal places', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      expect(artifact.data.projects[0].location).toBe('35.0675, -101.3955');
    });

    test('should handle missing coordinates', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          // No coordinates
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue(null);

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      const artifact = result.artifacts[0];
      expect(artifact.data.projects[0].location).toBe('Unknown');
    });
  });

  describe('Error handling', () => {
    
    test('should handle ProjectStore error gracefully', async () => {
      // Arrange
      mockProjectStore.list.mockRejectedValue(new Error('S3 error'));

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to load project dashboard.');
      expect(result.artifacts).toHaveLength(0);
      expect(result.projectCount).toBe(0);
    });

    test('should work without session ID', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'project-a',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);

      // Act - no session ID provided
      const result = await handler.generateDashboardArtifact();

      // Assert
      expect(result.success).toBe(true);
      expect(result.projectCount).toBe(1);
      
      // Should not call getActiveProject without session ID
      expect(mockSessionContextManager.getActiveProject).not.toHaveBeenCalled();
      
      const artifact = result.artifacts[0];
      expect(artifact.data.activeProject).toBe(null);
    });
  });

  describe('Artifact structure validation (Requirement 2.1)', () => {
    
    test('should generate correct artifact structure', async () => {
      // Arrange
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'test-project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.0, longitude: -101.0 },
          terrain_results: { data: 'terrain' },
          layout_results: { data: 'layout' },
        },
      ];

      mockProjectStore.list.mockResolvedValue(projects);
      mockSessionContextManager.getActiveProject.mockResolvedValue('test-project');

      // Act
      const result = await handler.generateDashboardArtifact('session-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.artifacts).toHaveLength(1);
      
      const artifact = result.artifacts[0];
      
      // Validate artifact structure
      expect(artifact).toHaveProperty('type');
      expect(artifact).toHaveProperty('title');
      expect(artifact).toHaveProperty('data');
      
      expect(artifact.type).toBe('project_dashboard');
      expect(artifact.title).toBe('Renewable Energy Projects Dashboard');
      
      // Validate data structure
      expect(artifact.data).toHaveProperty('projects');
      expect(artifact.data).toHaveProperty('totalProjects');
      expect(artifact.data).toHaveProperty('activeProject');
      expect(artifact.data).toHaveProperty('duplicateGroups');
      
      // Validate project structure
      const project = artifact.data.projects[0];
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('location');
      expect(project).toHaveProperty('completionPercentage');
      expect(project).toHaveProperty('lastUpdated');
      expect(project).toHaveProperty('isActive');
      expect(project).toHaveProperty('isDuplicate');
      expect(project).toHaveProperty('status');
      
      // Validate values
      expect(project.name).toBe('test-project');
      expect(project.location).toBe('35.0000, -101.0000');
      expect(project.completionPercentage).toBe(50);
      expect(project.lastUpdated).toBe('2024-01-02T00:00:00Z');
      expect(project.isActive).toBe(true);
      expect(project.isDuplicate).toBe(false);
      expect(project.status).toBe('Layout Complete');
    });
  });
});
