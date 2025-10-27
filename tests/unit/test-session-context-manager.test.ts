/**
 * Unit tests for SessionContextManager
 * 
 * Tests:
 * - Context creation
 * - Active project tracking
 * - Project history
 * - DynamoDB operations
 */

import { SessionContextManager, SessionContext } from '../../amplify/functions/shared/sessionContextManager';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

// Mock DynamoDB client
const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('SessionContextManager', () => {
  let manager: SessionContextManager;
  const testTableName = 'TestSessionContextTable';
  const testSessionId = 'session-123';

  beforeEach(() => {
    dynamoMock.reset();
    manager = new SessionContextManager(testTableName);
    manager.clearCache();
  });

  afterEach(() => {
    dynamoMock.reset();
  });

  describe('getContext()', () => {
    it('should load existing context from DynamoDB', async () => {
      const existingContext: SessionContext = {
        session_id: testSessionId,
        user_id: 'user-456',
        active_project: 'west-texas-wind-farm',
        project_history: ['west-texas-wind-farm', 'panhandle-wind'],
        last_updated: '2025-01-15T10:00:00Z',
        ttl: Math.floor(Date.now() / 1000) + 604800
      };

      dynamoMock.on(GetCommand).resolves({
        Item: existingContext
      });

      const context = await manager.getContext(testSessionId);

      expect(context).toEqual(existingContext);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1);
    });

    it('should create new context if not found', async () => {
      dynamoMock.on(GetCommand).resolves({});
      dynamoMock.on(PutCommand).resolves({});

      const context = await manager.getContext(testSessionId);

      expect(context.session_id).toBe(testSessionId);
      expect(context.user_id).toBe('default');
      expect(context.project_history).toEqual([]);
      expect(context.last_updated).toBeDefined();
      expect(context.ttl).toBeDefined();
    });

    it('should use cache for repeated calls', async () => {
      const existingContext: SessionContext = {
        session_id: testSessionId,
        user_id: 'user-456',
        active_project: 'west-texas-wind-farm',
        project_history: [],
        last_updated: '2025-01-15T10:00:00Z'
      };

      dynamoMock.on(GetCommand).resolves({
        Item: existingContext
      });

      // First call
      await manager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1);

      // Second call (should use cache)
      await manager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1); // Still 1
    });

    it('should fallback to cache on DynamoDB error', async () => {
      const existingContext: SessionContext = {
        session_id: testSessionId,
        user_id: 'user-456',
        active_project: 'west-texas-wind-farm',
        project_history: [],
        last_updated: '2025-01-15T10:00:00Z'
      };

      // First call succeeds
      dynamoMock.on(GetCommand).resolves({
        Item: existingContext
      });
      await manager.getContext(testSessionId);

      // Second call fails, should use cache
      dynamoMock.reset();
      dynamoMock.on(GetCommand).rejects(new Error('DynamoDB Error'));
      
      const context = await manager.getContext(testSessionId);
      expect(context).toEqual(existingContext);
    });

    it('should create session-only context on DynamoDB error with no cache', async () => {
      dynamoMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

      const context = await manager.getContext(testSessionId);

      expect(context.session_id).toBe(testSessionId);
      expect(context.project_history).toEqual([]);
    });
  });

  describe('setActiveProject()', () => {
    it('should set active project in DynamoDB', async () => {
      const projectName = 'west-texas-wind-farm';

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          active_project: projectName,
          project_history: [],
          last_updated: new Date().toISOString()
        }
      });

      await manager.setActiveProject(testSessionId, projectName);

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      expect(updateCalls.length).toBe(1);
      expect(updateCalls[0].args[0].input.ExpressionAttributeValues[':project']).toBe(projectName);
    });

    it('should update cache after setting active project', async () => {
      const projectName = 'west-texas-wind-farm';

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          active_project: projectName,
          project_history: [],
          last_updated: new Date().toISOString()
        }
      });

      await manager.setActiveProject(testSessionId, projectName);

      // Get from cache (should not call DynamoDB)
      dynamoMock.reset();
      dynamoMock.on(GetCommand).resolves({});
      
      const activeProject = await manager.getActiveProject(testSessionId);
      expect(activeProject).toBe(projectName);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(0);
    });

    it('should fallback to cache-only update on DynamoDB error', async () => {
      const projectName = 'west-texas-wind-farm';

      // First, populate cache
      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });
      await manager.getContext(testSessionId);

      // Now update fails
      dynamoMock.on(UpdateCommand).rejects(new Error('DynamoDB Error'));

      await manager.setActiveProject(testSessionId, projectName);

      // Should still be in cache
      const activeProject = await manager.getActiveProject(testSessionId);
      expect(activeProject).toBe(projectName);
    });
  });

  describe('getActiveProject()', () => {
    it('should return active project', async () => {
      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          active_project: 'west-texas-wind-farm',
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      const activeProject = await manager.getActiveProject(testSessionId);
      expect(activeProject).toBe('west-texas-wind-farm');
    });

    it('should return null if no active project', async () => {
      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      const activeProject = await manager.getActiveProject(testSessionId);
      expect(activeProject).toBeNull();
    });
  });

  describe('addToHistory()', () => {
    it('should add project to history', async () => {
      const projectName = 'west-texas-wind-farm';

      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [projectName],
          last_updated: new Date().toISOString()
        }
      });

      await manager.addToHistory(testSessionId, projectName);

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      expect(updateCalls.length).toBe(1);
      expect(updateCalls[0].args[0].input.ExpressionAttributeValues[':history']).toContain(projectName);
    });

    it('should add project to front of history', async () => {
      const existingHistory = ['panhandle-wind', 'amarillo-tx-wind-farm'];
      const newProject = 'west-texas-wind-farm';

      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: existingHistory,
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [newProject, ...existingHistory],
          last_updated: new Date().toISOString()
        }
      });

      await manager.addToHistory(testSessionId, newProject);

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      const history = updateCalls[0].args[0].input.ExpressionAttributeValues[':history'];
      expect(history[0]).toBe(newProject);
    });

    it('should remove duplicate if project already in history', async () => {
      const existingHistory = ['panhandle-wind', 'west-texas-wind-farm', 'amarillo-tx-wind-farm'];
      const projectName = 'west-texas-wind-farm';

      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: existingHistory,
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [projectName, 'panhandle-wind', 'amarillo-tx-wind-farm'],
          last_updated: new Date().toISOString()
        }
      });

      await manager.addToHistory(testSessionId, projectName);

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      const history = updateCalls[0].args[0].input.ExpressionAttributeValues[':history'];
      
      // Should only appear once, at the front
      expect(history.filter((p: string) => p === projectName).length).toBe(1);
      expect(history[0]).toBe(projectName);
    });

    it('should limit history to max size', async () => {
      const existingHistory = Array.from({ length: 10 }, (_, i) => `project-${i}`);
      const newProject = 'new-project';

      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: existingHistory,
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [newProject, ...existingHistory.slice(0, 9)],
          last_updated: new Date().toISOString()
        }
      });

      await manager.addToHistory(testSessionId, newProject);

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      const history = updateCalls[0].args[0].input.ExpressionAttributeValues[':history'];
      
      expect(history.length).toBe(10); // Max size
      expect(history[0]).toBe(newProject);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for specific session', async () => {
      const context: SessionContext = {
        session_id: testSessionId,
        user_id: 'user-456',
        project_history: [],
        last_updated: '2025-01-15T10:00:00Z'
      };

      dynamoMock.on(GetCommand).resolves({
        Item: context
      });

      // Load to populate cache
      await manager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1);

      // Invalidate cache
      manager.invalidateCache(testSessionId);

      // Next load should call DynamoDB again
      await manager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(2);
    });

    it('should clear all caches', () => {
      manager.clearCache();
      
      const stats = manager.getCacheStats();
      expect(stats.cacheSize).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = manager.getCacheStats();
      
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheTTL');
      expect(stats).toHaveProperty('sessionTTL');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.cacheTTL).toBe('number');
      expect(typeof stats.sessionTTL).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle ResourceNotFoundException', async () => {
      dynamoMock.on(GetCommand).rejects({
        name: 'ResourceNotFoundException',
        message: 'Table not found'
      });

      const context = await manager.getContext(testSessionId);
      
      // Should create new context despite error
      expect(context.session_id).toBe(testSessionId);
    });

    it('should handle AccessDeniedException', async () => {
      dynamoMock.on(GetCommand).rejects({
        name: 'AccessDeniedException',
        message: 'Access denied'
      });

      const context = await manager.getContext(testSessionId);
      
      // Should create new context despite error
      expect(context.session_id).toBe(testSessionId);
    });

    it('should handle ProvisionedThroughputExceededException', async () => {
      dynamoMock.on(GetCommand).rejects({
        name: 'ProvisionedThroughputExceededException',
        message: 'Throughput exceeded'
      });

      const context = await manager.getContext(testSessionId);
      
      // Should create new context despite error
      expect(context.session_id).toBe(testSessionId);
    });
  });

  describe('TTL management', () => {
    it('should set TTL on new context', async () => {
      dynamoMock.on(GetCommand).resolves({});
      dynamoMock.on(PutCommand).resolves({});

      const context = await manager.getContext(testSessionId);

      expect(context.ttl).toBeDefined();
      expect(context.ttl).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should update TTL on setActiveProject', async () => {
      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          active_project: 'test-project',
          project_history: [],
          last_updated: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + 604800
        }
      });

      await manager.setActiveProject(testSessionId, 'test-project');

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      expect(updateCalls[0].args[0].input.ExpressionAttributeValues[':ttl']).toBeDefined();
    });

    it('should update TTL on addToHistory', async () => {
      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: 'user-456',
          project_history: ['test-project'],
          last_updated: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + 604800
        }
      });

      await manager.addToHistory(testSessionId, 'test-project');

      const updateCalls = dynamoMock.commandCalls(UpdateCommand);
      expect(updateCalls[0].args[0].input.ExpressionAttributeValues[':ttl']).toBeDefined();
    });
  });
});
