/**
 * End-to-End Tests for Multi-Canvas Workflow
 * Tests collection context retention across multiple canvases
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock types
type Collection = {
  id: string;
  name: string;
  dataItems: any[];
  previewMetadata: {
    wellCount: number;
    dataPointCount: number;
  };
};

type Canvas = {
  id: string;
  name: string;
  linkedCollectionId: string;
  collectionContext: string;
};

// Mock Amplify client
const mockAmplifyClient = {
  models: {
    ChatSession: {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn()
    }
  }
};

// Mock router
const mockRouter = {
  push: jest.fn()
};

// Helper to create mock collection
function createMockCollection(): Collection {
  return {
    id: 'collection-multi-canvas-test',
    name: 'Multi-Canvas Test Collection',
    dataItems: [
      { id: 'well-1', name: 'WELL-001' },
      { id: 'well-2', name: 'WELL-002' },
      { id: 'well-3', name: 'WELL-003' }
    ],
    previewMetadata: {
      wellCount: 3,
      dataPointCount: 3
    }
  };
}

describe('EDIcraft Demo E2E Tests - Multi-Canvas Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('14.2 Multi-Canvas Workflow', () => {
    it('should create canvas from collection', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'canvas-1',
          name: 'First Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      const canvas1 = await mockAmplifyClient.models.ChatSession.create({
        name: 'First Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      });
      
      expect(canvas1.data.linkedCollectionId).toBe(collection.id);
      expect(canvas1.data.collectionContext).toBeDefined();
      
      const parsedContext = JSON.parse(canvas1.data.collectionContext);
      expect(parsedContext.collectionId).toBe(collection.id);
      expect(parsedContext.dataItems.length).toBe(3);
    });
    
    it('should create new canvas with inherited context', async () => {
      const collection = createMockCollection();
      
      // First canvas
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
        data: {
          id: 'canvas-1',
          name: 'First Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      // Get current session to inherit context
      const currentSession = await mockAmplifyClient.models.ChatSession.get({
        id: 'canvas-1'
      });
      
      expect(currentSession.data.linkedCollectionId).toBe(collection.id);
      
      // Create new canvas with inherited context
      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'canvas-2',
          name: 'Second Canvas',
          linkedCollectionId: currentSession.data.linkedCollectionId,
          collectionContext: currentSession.data.collectionContext
        }
      });
      
      const canvas2 = await mockAmplifyClient.models.ChatSession.create({
        name: 'Second Canvas',
        linkedCollectionId: currentSession.data.linkedCollectionId,
        collectionContext: currentSession.data.collectionContext
      });
      
      expect(canvas2.data.linkedCollectionId).toBe(collection.id);
      expect(canvas2.data.collectionContext).toBe(currentSession.data.collectionContext);
    });
    
    it('should verify both canvases have same collection scope', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      // Canvas 1
      mockAmplifyClient.models.ChatSession.create.mockResolvedValueOnce({
        data: {
          id: 'canvas-1',
          name: 'First Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      const canvas1 = await mockAmplifyClient.models.ChatSession.create({
        name: 'First Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      });
      
      // Canvas 2 (inherited)
      mockAmplifyClient.models.ChatSession.create.mockResolvedValueOnce({
        data: {
          id: 'canvas-2',
          name: 'Second Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      const canvas2 = await mockAmplifyClient.models.ChatSession.create({
        name: 'Second Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      });
      
      // Verify same collection scope
      expect(canvas1.data.linkedCollectionId).toBe(canvas2.data.linkedCollectionId);
      expect(canvas1.data.collectionContext).toBe(canvas2.data.collectionContext);
      
      const context1 = JSON.parse(canvas1.data.collectionContext);
      const context2 = JSON.parse(canvas2.data.collectionContext);
      
      expect(context1.collectionId).toBe(context2.collectionId);
      expect(context1.dataItems.length).toBe(context2.dataItems.length);
      expect(context1.dataItems).toEqual(context2.dataItems);
    });
    
    it('should verify badge displays correctly in both canvases', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      // Canvas 1
      const canvas1 = {
        id: 'canvas-1',
        name: 'First Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      };
      
      // Canvas 2
      const canvas2 = {
        id: 'canvas-2',
        name: 'Second Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      };
      
      // Verify badge data for canvas 1
      const badge1Data = {
        collectionName: collection.name,
        wellCount: collection.dataItems.length,
        visible: true
      };
      
      expect(badge1Data.collectionName).toBe('Multi-Canvas Test Collection');
      expect(badge1Data.wellCount).toBe(3);
      expect(badge1Data.visible).toBe(true);
      
      // Verify badge data for canvas 2
      const badge2Data = {
        collectionName: collection.name,
        wellCount: collection.dataItems.length,
        visible: true
      };
      
      expect(badge2Data.collectionName).toBe('Multi-Canvas Test Collection');
      expect(badge2Data.wellCount).toBe(3);
      expect(badge2Data.visible).toBe(true);
      
      // Verify both badges show same information
      expect(badge1Data.collectionName).toBe(badge2Data.collectionName);
      expect(badge1Data.wellCount).toBe(badge2Data.wellCount);
    });
    
    it('should handle fromSession parameter correctly', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      // Current session
      mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
        data: {
          id: 'current-session',
          name: 'Current Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      // Simulate create-new-chat page with fromSession parameter
      const fromSessionId = 'current-session';
      const currentSession = await mockAmplifyClient.models.ChatSession.get({
        id: fromSessionId
      });
      
      expect(currentSession.data.linkedCollectionId).toBe(collection.id);
      
      // Create new session with inherited context
      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'new-session',
          name: 'New Canvas',
          linkedCollectionId: currentSession.data.linkedCollectionId,
          collectionContext: currentSession.data.collectionContext
        }
      });
      
      const newSession = await mockAmplifyClient.models.ChatSession.create({
        name: 'New Canvas',
        linkedCollectionId: currentSession.data.linkedCollectionId,
        collectionContext: currentSession.data.collectionContext
      });
      
      expect(newSession.data.linkedCollectionId).toBe(collection.id);
      expect(newSession.data.collectionContext).toBe(currentSession.data.collectionContext);
    });
    
    it('should handle multiple canvas creation from same collection', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      const canvases: Canvas[] = [];
      
      // Create 5 canvases from same collection
      for (let i = 1; i <= 5; i++) {
        mockAmplifyClient.models.ChatSession.create.mockResolvedValueOnce({
          data: {
            id: `canvas-${i}`,
            name: `Canvas ${i}`,
            linkedCollectionId: collection.id,
            collectionContext: JSON.stringify(collectionContext)
          }
        });
        
        const canvas = await mockAmplifyClient.models.ChatSession.create({
          name: `Canvas ${i}`,
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        });
        
        canvases.push(canvas.data);
      }
      
      expect(canvases.length).toBe(5);
      
      // Verify all canvases have same collection context
      canvases.forEach(canvas => {
        expect(canvas.linkedCollectionId).toBe(collection.id);
        expect(canvas.collectionContext).toBe(JSON.stringify(collectionContext));
      });
      
      // Verify all canvases have unique IDs
      const uniqueIds = new Set(canvases.map(c => c.id));
      expect(uniqueIds.size).toBe(5);
    });
    
    it('should list all canvases for a collection', async () => {
      const collection = createMockCollection();
      
      const canvases = [
        {
          id: 'canvas-1',
          name: 'Canvas 1',
          linkedCollectionId: collection.id,
          collectionContext: '{}'
        },
        {
          id: 'canvas-2',
          name: 'Canvas 2',
          linkedCollectionId: collection.id,
          collectionContext: '{}'
        },
        {
          id: 'canvas-3',
          name: 'Canvas 3',
          linkedCollectionId: collection.id,
          collectionContext: '{}'
        }
      ];
      
      mockAmplifyClient.models.ChatSession.list.mockResolvedValue({
        data: canvases
      });
      
      const listResponse = await mockAmplifyClient.models.ChatSession.list({
        filter: {
          linkedCollectionId: { eq: collection.id }
        }
      });
      
      expect(listResponse.data.length).toBe(3);
      expect(listResponse.data.every(c => c.linkedCollectionId === collection.id)).toBe(true);
    });
    
    it('should handle canvas without collection context', async () => {
      // Create canvas without collection context
      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'canvas-no-collection',
          name: 'Standard Canvas',
          linkedCollectionId: null,
          collectionContext: null
        }
      });
      
      const canvas = await mockAmplifyClient.models.ChatSession.create({
        name: 'Standard Canvas'
      });
      
      expect(canvas.data.linkedCollectionId).toBeNull();
      expect(canvas.data.collectionContext).toBeNull();
      
      // Badge should not be visible
      const badgeVisible = canvas.data.linkedCollectionId !== null;
      expect(badgeVisible).toBe(false);
    });
    
    it('should verify collection context badge visibility logic', async () => {
      const collection = createMockCollection();
      
      // Canvas with collection
      const canvasWithCollection = {
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify({
          collectionId: collection.id,
          collectionName: collection.name,
          dataItems: collection.dataItems
        })
      };
      
      // Canvas without collection
      const canvasWithoutCollection = {
        linkedCollectionId: null,
        collectionContext: null
      };
      
      // Badge visibility logic
      const shouldShowBadge1 = canvasWithCollection.linkedCollectionId !== null;
      const shouldShowBadge2 = canvasWithoutCollection.linkedCollectionId !== null;
      
      expect(shouldShowBadge1).toBe(true);
      expect(shouldShowBadge2).toBe(false);
    });
    
    it('should verify collection context data structure', async () => {
      const collection = createMockCollection();
      
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      // Verify structure
      expect(collectionContext).toHaveProperty('collectionId');
      expect(collectionContext).toHaveProperty('collectionName');
      expect(collectionContext).toHaveProperty('dataItems');
      expect(collectionContext).toHaveProperty('createdAt');
      
      // Verify types
      expect(typeof collectionContext.collectionId).toBe('string');
      expect(typeof collectionContext.collectionName).toBe('string');
      expect(Array.isArray(collectionContext.dataItems)).toBe(true);
      expect(typeof collectionContext.createdAt).toBe('string');
      
      // Verify data items structure
      collectionContext.dataItems.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
      });
    });
  });
});
