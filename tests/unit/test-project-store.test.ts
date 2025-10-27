/**
 * Unit tests for ProjectStore
 * 
 * Tests:
 * - Save/load/list operations
 * - Partial name matching
 * - Error handling
 * - Caching behavior
 */

import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { Readable } from 'stream';

// Mock S3 client
const s3Mock = mockClient(S3Client);

describe('ProjectStore', () => {
  let projectStore: ProjectStore;
  const testBucketName = 'test-renewable-bucket';

  beforeEach(() => {
    // Reset mocks
    s3Mock.reset();
    
    // Create new ProjectStore instance
    projectStore = new ProjectStore(testBucketName, {
      maxRetries: 1,
      initialDelayMs: 10,
      maxDelayMs: 50,
      backoffMultiplier: 2
    });
    
    // Clear cache
    projectStore.clearCache();
  });

  afterEach(() => {
    s3Mock.reset();
  });

  describe('save()', () => {
    it('should save new project to S3', async () => {
      const projectName = 'west-texas-wind-farm';
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123',
        project_name: projectName,
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        }
      };

      // Mock S3 GetObject (project doesn't exist yet)
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      
      // Mock S3 PutObject
      s3Mock.on(PutObjectCommand).resolves({});

      await projectStore.save(projectName, projectData);

      // Verify PutObject was called
      const putCalls = s3Mock.commandCalls(PutObjectCommand);
      expect(putCalls.length).toBe(1);
      expect(putCalls[0].args[0].input.Bucket).toBe(testBucketName);
      expect(putCalls[0].args[0].input.Key).toBe(`renewable/projects/${projectName}/project.json`);
      
      // Verify data structure
      const savedData = JSON.parse(putCalls[0].args[0].input.Body as string);
      expect(savedData.project_id).toBe('proj-123');
      expect(savedData.project_name).toBe(projectName);
      expect(savedData.coordinates).toEqual(projectData.coordinates);
      expect(savedData.created_at).toBeDefined();
      expect(savedData.updated_at).toBeDefined();
    });

    it('should merge with existing project data', async () => {
      const projectName = 'west-texas-wind-farm';
      const existingData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        },
        terrain_results: { features: [] }
      };

      const updateData: Partial<ProjectData> = {
        layout_results: { turbines: [] }
      };

      // Mock S3 GetObject (existing project)
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(existingData)])
      });
      
      // Mock S3 PutObject
      s3Mock.on(PutObjectCommand).resolves({});

      await projectStore.save(projectName, updateData);

      // Verify merged data
      const putCalls = s3Mock.commandCalls(PutObjectCommand);
      const savedData = JSON.parse(putCalls[0].args[0].input.Body as string);
      
      expect(savedData.project_id).toBe('proj-123');
      expect(savedData.terrain_results).toEqual({ features: [] });
      expect(savedData.layout_results).toEqual({ turbines: [] });
      expect(savedData.coordinates).toEqual(existingData.coordinates);
    });

    it('should handle S3 errors gracefully', async () => {
      const projectName = 'test-project';
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123',
        project_name: projectName
      };

      // Mock S3 GetObject failure
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      
      // Mock S3 PutObject failure
      s3Mock.on(PutObjectCommand).rejects(new Error('S3 Error'));

      await expect(projectStore.save(projectName, projectData)).rejects.toThrow('Failed to save project');
    });

    it('should update cache after save', async () => {
      const projectName = 'test-project';
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123',
        project_name: projectName
      };

      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      s3Mock.on(PutObjectCommand).resolves({});

      await projectStore.save(projectName, projectData);

      // Load from cache (should not call S3)
      s3Mock.reset();
      const loaded = await projectStore.load(projectName);
      
      expect(loaded).toBeDefined();
      expect(loaded?.project_name).toBe(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(0);
    });
  });

  describe('load()', () => {
    it('should load project from S3', async () => {
      const projectName = 'west-texas-wind-farm';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        coordinates: {
          latitude: 35.067482,
          longitude: -101.395466
        }
      };

      // Mock S3 GetObject
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });

      const loaded = await projectStore.load(projectName);

      expect(loaded).toEqual(projectData);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1);
    });

    it('should return null for non-existent project', async () => {
      const projectName = 'non-existent-project';

      // Mock S3 GetObject (not found)
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });

      const loaded = await projectStore.load(projectName);

      expect(loaded).toBeNull();
    });

    it('should use cache for repeated loads', async () => {
      const projectName = 'test-project';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      // Mock S3 GetObject
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });

      // First load (from S3)
      await projectStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1);

      // Second load (from cache)
      await projectStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1); // Still 1, not 2
    });

    it('should fallback to cache on S3 error', async () => {
      const projectName = 'test-project';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      // First load succeeds
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });
      await projectStore.load(projectName);

      // Second load fails, should use cache
      s3Mock.reset();
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 Error'));
      
      const loaded = await projectStore.load(projectName);
      expect(loaded).toEqual(projectData);
    });
  });

  describe('list()', () => {
    it('should list all projects', async () => {
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'west-texas-wind-farm',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          project_id: 'proj-2',
          project_name: 'panhandle-wind',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ];

      // Mock S3 ListObjectsV2
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'renewable/projects/west-texas-wind-farm/project.json' },
          { Key: 'renewable/projects/panhandle-wind/project.json' }
        ]
      });

      // Mock S3 GetObject for each project
      s3Mock.on(GetObjectCommand, {
        Key: 'renewable/projects/west-texas-wind-farm/project.json'
      }).resolves({
        Body: Readable.from([JSON.stringify(projects[0])])
      });

      s3Mock.on(GetObjectCommand, {
        Key: 'renewable/projects/panhandle-wind/project.json'
      }).resolves({
        Body: Readable.from([JSON.stringify(projects[1])])
      });

      const listed = await projectStore.list();

      expect(listed.length).toBe(2);
      expect(listed.map(p => p.project_name)).toContain('west-texas-wind-farm');
      expect(listed.map(p => p.project_name)).toContain('panhandle-wind');
    });

    it('should handle pagination', async () => {
      // Mock S3 ListObjectsV2 with pagination
      s3Mock.on(ListObjectsV2Command).resolvesOnce({
        Contents: [
          { Key: 'renewable/projects/project-1/project.json' }
        ],
        NextContinuationToken: 'token-123'
      }).resolvesOnce({
        Contents: [
          { Key: 'renewable/projects/project-2/project.json' }
        ]
      });

      // Mock GetObject for each project
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify({
          project_id: 'proj-1',
          project_name: 'project-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        })])
      });

      const listed = await projectStore.list();

      expect(listed.length).toBe(2);
      expect(s3Mock.commandCalls(ListObjectsV2Command).length).toBe(2);
    });

    it('should use list cache', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'renewable/projects/test-project/project.json' }
        ]
      });

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify({
          project_id: 'proj-1',
          project_name: 'test-project',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        })])
      });

      // First list
      await projectStore.list();
      const firstCallCount = s3Mock.commandCalls(ListObjectsV2Command).length;

      // Second list (should use cache)
      await projectStore.list();
      const secondCallCount = s3Mock.commandCalls(ListObjectsV2Command).length;

      expect(secondCallCount).toBe(firstCallCount); // No additional calls
    });
  });

  describe('findByPartialName()', () => {
    beforeEach(async () => {
      // Setup test projects
      const projects: ProjectData[] = [
        {
          project_id: 'proj-1',
          project_name: 'west-texas-wind-farm',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          project_id: 'proj-2',
          project_name: 'east-texas-wind-farm',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        },
        {
          project_id: 'proj-3',
          project_name: 'panhandle-wind',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z'
        }
      ];

      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: projects.map(p => ({
          Key: `renewable/projects/${p.project_name}/project.json`
        }))
      });

      projects.forEach(project => {
        s3Mock.on(GetObjectCommand, {
          Key: `renewable/projects/${project.project_name}/project.json`
        }).resolves({
          Body: Readable.from([JSON.stringify(project)])
        });
      });
    });

    it('should find exact match', async () => {
      const matches = await projectStore.findByPartialName('west-texas-wind-farm');
      
      expect(matches.length).toBe(1);
      expect(matches[0].project_name).toBe('west-texas-wind-farm');
    });

    it('should find partial match', async () => {
      const matches = await projectStore.findByPartialName('west texas');
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].project_name).toBe('west-texas-wind-farm');
    });

    it('should find multiple matches', async () => {
      const matches = await projectStore.findByPartialName('texas');
      
      expect(matches.length).toBe(2);
      expect(matches.map(m => m.project_name)).toContain('west-texas-wind-farm');
      expect(matches.map(m => m.project_name)).toContain('east-texas-wind-farm');
    });

    it('should return empty array for no matches', async () => {
      const matches = await projectStore.findByPartialName('california');
      
      expect(matches.length).toBe(0);
    });

    it('should handle fuzzy matching', async () => {
      const matches = await projectStore.findByPartialName('panhandle');
      
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].project_name).toBe('panhandle-wind');
    });
  });

  describe('delete()', () => {
    it('should delete project from S3', async () => {
      const projectName = 'test-project';

      s3Mock.on(DeleteObjectCommand).resolves({});

      await projectStore.delete(projectName);

      const deleteCalls = s3Mock.commandCalls(DeleteObjectCommand);
      expect(deleteCalls.length).toBe(1);
      expect(deleteCalls[0].args[0].input.Key).toBe(`renewable/projects/${projectName}/project.json`);
    });

    it('should remove from cache after delete', async () => {
      const projectName = 'test-project';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      // Save to cache
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      s3Mock.on(PutObjectCommand).resolves({});
      await projectStore.save(projectName, projectData);

      // Delete
      s3Mock.on(DeleteObjectCommand).resolves({});
      await projectStore.delete(projectName);

      // Try to load (should not be in cache)
      s3Mock.reset();
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      const loaded = await projectStore.load(projectName);
      
      expect(loaded).toBeNull();
    });
  });

  describe('caching behavior', () => {
    it('should respect cache TTL', async () => {
      const projectName = 'test-project';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      // Create ProjectStore with very short TTL for testing
      const shortTTLStore = new ProjectStore(testBucketName);
      (shortTTLStore as any).cacheTTL = 100; // 100ms

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });

      // First load
      await shortTTLStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second load (cache expired, should call S3 again)
      await shortTTLStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(2);
    });

    it('should provide cache statistics', () => {
      const stats = projectStore.getCacheStats();
      
      expect(stats).toHaveProperty('projectCacheSize');
      expect(stats).toHaveProperty('listCacheExists');
      expect(stats).toHaveProperty('cacheTTL');
      expect(typeof stats.projectCacheSize).toBe('number');
      expect(typeof stats.listCacheExists).toBe('boolean');
      expect(typeof stats.cacheTTL).toBe('number');
    });

    it('should clear cache', async () => {
      const projectName = 'test-project';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });

      // Load to populate cache
      await projectStore.load(projectName);
      
      let stats = projectStore.getCacheStats();
      expect(stats.projectCacheSize).toBeGreaterThan(0);

      // Clear cache
      projectStore.clearCache();
      
      stats = projectStore.getCacheStats();
      expect(stats.projectCacheSize).toBe(0);
      expect(stats.listCacheExists).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should retry on retryable errors', async () => {
      const projectName = 'test-project';
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123',
        project_name: projectName
      };

      // First attempt fails, second succeeds
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      s3Mock.on(PutObjectCommand)
        .rejectsOnce({ name: 'ServiceUnavailable' })
        .resolves({});

      await projectStore.save(projectName, projectData);

      // Should have retried
      expect(s3Mock.commandCalls(PutObjectCommand).length).toBe(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const projectName = 'test-project';
      const projectData: Partial<ProjectData> = {
        project_id: 'proj-123',
        project_name: projectName
      };

      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      s3Mock.on(PutObjectCommand).rejects({ name: 'AccessDenied' });

      await expect(projectStore.save(projectName, projectData)).rejects.toThrow();

      // Should not have retried
      expect(s3Mock.commandCalls(PutObjectCommand).length).toBe(1);
    });
  });
});
