/**
 * Unit Tests for Deduplication Detection
 * 
 * Tests the checkForDuplicates method and duplicate resolution logic
 * in ProjectLifecycleManager.
 */

import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn()
    }))
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn()
}));

describe('ProjectLifecycleManager - Deduplication Detection', () => {
  let lifecycleManager: ProjectLifecycleManager;
  let projectStore: ProjectStore;
  let projectResolver: ProjectResolver;
  let projectNameGenerator: ProjectNameGenerator;
  let sessionContextManager: SessionContextManager;

  beforeEach(() => {
    // Initialize components
    projectStore = new ProjectStore('test-bucket');
    projectResolver = new ProjectResolver(projectStore);
    projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager('test-table');

    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );
  });

  describe('checkForDuplicates', () => {
    it('should detect no duplicates when no projects exist', async () => {
      // Mock empty project list
      jest.spyOn(projectStore, 'list').mockResolvedValue([]);

      const result = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toHaveLength(0);
      expect(result.userPrompt).toBe('');
      expect(result.message).toBe('No existing projects found at this location');
    });

    it('should detect duplicates within 1km radius', async () => {
      // Mock project list with one project at same location
      const existingProject: ProjectData = {
        project_name: 'texas-wind-farm-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        terrain_results: { s3_key: 'terrain-1' },
        metadata: {}
      };

      jest.spyOn(projectStore, 'list').mockResolvedValue([existingProject]);

      const result = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].project.project_name).toBe('texas-wind-farm-1');
      expect(result.duplicates[0].distanceKm).toBeLessThan(0.01); // Very close
      expect(result.userPrompt).toContain('Found existing project(s)');
      expect(result.userPrompt).toContain('texas-wind-farm-1');
      expect(result.userPrompt).toContain('Would you like to:');
    });

    it('should detect multiple duplicates and sort by distance', async () => {
      // Mock project list with multiple projects at different distances
      const projects: ProjectData[] = [
        {
          project_name: 'texas-wind-farm-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: {
            latitude: 35.067482,
            longitude: -101.395466
          },
          metadata: {}
        },
        {
          project_name: 'texas-wind-farm-2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: {
            latitude: 35.068,
            longitude: -101.396
          },
          metadata: {}
        },
        {
          project_name: 'texas-wind-farm-3',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          coordinates: {
            latitude: 35.070,
            longitude: -101.400
          },
          metadata: {}
        }
      ];

      jest.spyOn(projectStore, 'list').mockResolvedValue(projects);

      const result = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.length).toBeGreaterThan(0);
      
      // Check that results are sorted by distance (closest first)
      for (let i = 0; i < result.duplicates.length - 1; i++) {
        expect(result.duplicates[i].distanceKm).toBeLessThanOrEqual(
          result.duplicates[i + 1].distanceKm
        );
      }
    });

    it('should not detect projects outside radius', async () => {
      // Mock project list with project far away (>1km)
      const farProject: ProjectData = {
        project_name: 'texas-wind-farm-far',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: {
          latitude: 35.080,
          longitude: -101.410
        },
        metadata: {}
      };

      jest.spyOn(projectStore, 'list').mockResolvedValue([farProject]);

      const result = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should use custom radius when provided', async () => {
      // Mock project list with project 2km away
      const project: ProjectData = {
        project_name: 'texas-wind-farm-2km',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: {
          latitude: 35.085,
          longitude: -101.415
        },
        metadata: {}
      };

      jest.spyOn(projectStore, 'list').mockResolvedValue([project]);

      // Should not find with 1km radius
      const result1km = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        1.0
      );
      expect(result1km.hasDuplicates).toBe(false);

      // Should find with 5km radius
      const result5km = await lifecycleManager.checkForDuplicates(
        { latitude: 35.067482, longitude: -101.395466 },
        5.0
      );
      expect(result5km.hasDuplicates).toBe(true);
    });
  });

  describe('handleDuplicateChoice', () => {
    const mockDuplicates = [
      {
        project: {
          project_name: 'texas-wind-farm-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          terrain_results: { s3_key: 'terrain-1' },
          metadata: {}
        } as ProjectData,
        distanceKm: 0.1
      },
      {
        project: {
          project_name: 'texas-wind-farm-2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.068, longitude: -101.396 },
          layout_results: { s3_key: 'layout-1' },
          metadata: {}
        } as ProjectData,
        distanceKm: 0.5
      }
    ];

    it('should handle choice 1 (continue with existing)', async () => {
      jest.spyOn(sessionContextManager, 'setActiveProject').mockResolvedValue();
      jest.spyOn(sessionContextManager, 'addToHistory').mockResolvedValue();

      const result = await lifecycleManager.handleDuplicateChoice(
        '1',
        mockDuplicates,
        'test-session'
      );

      expect(result.action).toBe('continue');
      expect(result.projectName).toBe('texas-wind-farm-1');
      expect(result.message).toContain('Continuing with existing project');
      expect(sessionContextManager.setActiveProject).toHaveBeenCalledWith(
        'test-session',
        'texas-wind-farm-1'
      );
    });

    it('should handle choice 2 (create new)', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '2',
        mockDuplicates,
        'test-session'
      );

      expect(result.action).toBe('create_new');
      expect(result.projectName).toBeUndefined();
      expect(result.message).toContain('Creating new project');
    });

    it('should handle choice 3 (view details)', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '3',
        mockDuplicates,
        'test-session'
      );

      expect(result.action).toBe('view_details');
      expect(result.message).toContain('Project Details');
      expect(result.message).toContain('texas-wind-farm-1');
      expect(result.message).toContain('texas-wind-farm-2');
      expect(result.message).toContain('Completion:');
    });

    it('should handle invalid choice by defaulting to create new', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '5',
        mockDuplicates,
        'test-session'
      );

      expect(result.action).toBe('create_new');
      expect(result.message).toContain('Invalid choice');
    });

    it('should handle whitespace in choice', async () => {
      jest.spyOn(sessionContextManager, 'setActiveProject').mockResolvedValue();
      jest.spyOn(sessionContextManager, 'addToHistory').mockResolvedValue();

      const result = await lifecycleManager.handleDuplicateChoice(
        '  1  ',
        mockDuplicates,
        'test-session'
      );

      expect(result.action).toBe('continue');
      expect(result.projectName).toBe('texas-wind-farm-1');
    });
  });

  describe('promptForDuplicateResolution', () => {
    it('should return empty string for no projects', async () => {
      const prompt = await lifecycleManager.promptForDuplicateResolution(
        [],
        { latitude: 35.067482, longitude: -101.395466 }
      );

      expect(prompt).toBe('');
    });

    it('should generate formatted prompt for single project', async () => {
      const projects: ProjectData[] = [
        {
          project_name: 'texas-wind-farm-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          metadata: {}
        }
      ];

      const prompt = await lifecycleManager.promptForDuplicateResolution(
        projects,
        { latitude: 35.067482, longitude: -101.395466 }
      );

      expect(prompt).toContain('Found existing project(s)');
      expect(prompt).toContain('1. texas-wind-farm-1');
      expect(prompt).toContain('Would you like to:');
      expect(prompt).toContain('1. Continue with existing project');
      expect(prompt).toContain('2. Create new project');
      expect(prompt).toContain('3. View existing project details');
    });

    it('should generate formatted prompt for multiple projects', async () => {
      const projects: ProjectData[] = [
        {
          project_name: 'texas-wind-farm-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          coordinates: { latitude: 35.067482, longitude: -101.395466 },
          metadata: {}
        },
        {
          project_name: 'texas-wind-farm-2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          coordinates: { latitude: 35.068, longitude: -101.396 },
          metadata: {}
        }
      ];

      const prompt = await lifecycleManager.promptForDuplicateResolution(
        projects,
        { latitude: 35.067482, longitude: -101.395466 }
      );

      expect(prompt).toContain('1. texas-wind-farm-1');
      expect(prompt).toContain('2. texas-wind-farm-2');
      expect(prompt).toContain('km away');
    });
  });
});
