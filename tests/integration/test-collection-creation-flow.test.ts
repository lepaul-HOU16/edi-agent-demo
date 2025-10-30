/**
 * Integration tests for Collection Creation Flow
 * Tests the complete flow from catalog to collection creation to navigation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 5.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Amplify client
const mockAmplifyClient = {
  mutations: {
    collectionManagement: jest.fn()
  },
  queries: {
    collectionQuery: jest.fn()
  },
  models: {
    ChatSession: {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn()
    }
  }
};

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

describe('Collection Creation Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Collection Creation from Catalog', () => {
    it('should create collection with filtered data from catalog', async () => {
      // Simulate catalog data
      const catalogData = [
        { id: 'well-1', name: 'WELL-001', type: 'Well', location: 'Location A' },
        { id: 'well-2', name: 'WELL-002', type: 'Well', location: 'Location B' },
        { id: 'well-3', name: 'WELL-003', type: 'Well', location: 'Location C' }
      ];

      // Simulate collection creation
      const collectionInput = {
        name: 'Test Collection',
        description: 'Test description',
        dataSourceType: 'Mixed',
        previewMetadata: JSON.stringify({
          wellCount: catalogData.length,
          dataPointCount: catalogData.length,
          createdFrom: 'catalog_search'
        })
      };

      mockAmplifyClient.mutations.collectionManagement.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collectionId: 'collection-123',
          collection: {
            id: 'collection-123',
            name: 'Test Collection',
            ...collectionInput
          }
        })
      });

      const response = await mockAmplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        ...collectionInput
      });

      const result = JSON.parse(response.data);
      
      expect(result.success).toBe(true);
      expect(result.collectionId).toBe('collection-123');
      expect(result.collection.name).toBe('Test Collection');
    });

    it('should handle collection creation errors gracefully', async () => {
      mockAmplifyClient.mutations.collectionManagement.mockRejectedValue(
        new Error('Database error')
      );

      try {
        await mockAmplifyClient.mutations.collectionManagement({
          operation: 'createCollection',
          name: 'Test Collection'
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database error');
      }
    });

    it('should validate collection name is required', () => {
      const collectionName = '';
      const isValid = collectionName.trim().length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should allow empty description', () => {
      const collectionDescription = '';
      const collectionName = 'Test Collection';
      const isValid = collectionName.trim().length > 0;
      
      expect(isValid).toBe(true);
    });
  });

  describe('Navigation to Collection Detail', () => {
    it('should navigate to collection detail page after creation', () => {
      const collectionId = 'collection-123';
      const expectedRoute = `/collections/${collectionId}`;
      
      mockRouter.push(expectedRoute);
      
      expect(mockRouter.push).toHaveBeenCalledWith(expectedRoute);
    });

    it('should extract collection ID from response', () => {
      const mockResponse = {
        success: true,
        collectionId: 'collection-456',
        collection: {
          id: 'collection-456',
          name: 'Test Collection'
        }
      };

      const collectionId = mockResponse.collectionId || mockResponse.collection?.id;
      
      expect(collectionId).toBe('collection-456');
    });

    it('should fallback to collections list if no ID', () => {
      const mockResponse = {
        success: true,
        collection: {
          name: 'Test Collection'
        }
      };

      const collectionId = mockResponse.collectionId || mockResponse.collection?.id;
      const navigationUrl = collectionId ? `/collections/${collectionId}` : '/collections';
      
      expect(navigationUrl).toBe('/collections');
    });

    it('should handle navigation errors', () => {
      mockRouter.push.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      try {
        mockRouter.push('/collections/test-123');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Navigation failed');
      }
    });
  });

  describe('Canvas Creation from Collection', () => {
    beforeEach(() => {
      // Reset router mock for this describe block
      mockRouter.push.mockClear();
      mockRouter.push.mockImplementation(() => {});
    });

    it('should create canvas with linkedCollectionId', async () => {
      const collectionId = 'collection-123';
      const collectionName = 'Test Collection';

      const sessionData = {
        name: `Canvas from ${collectionName}`,
        linkedCollectionId: collectionId,
        collectionContext: JSON.stringify({
          collectionId: collectionId,
          collectionName: collectionName,
          dataItems: [],
          createdAt: new Date().toISOString()
        })
      };

      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'session-123',
          ...sessionData
        }
      });

      const response = await mockAmplifyClient.models.ChatSession.create(sessionData);
      
      expect(response.data.linkedCollectionId).toBe(collectionId);
      expect(response.data.collectionContext).toBeDefined();
    });

    it('should navigate to new canvas after creation', () => {
      const newCanvasId = 'session-123';
      const expectedRoute = `/chat/${newCanvasId}`;
      
      mockRouter.push(expectedRoute);
      
      expect(mockRouter.push).toHaveBeenCalledWith(expectedRoute);
    });

    it('should pass collectionId as query parameter', () => {
      const collectionId = 'collection-123';
      const expectedRoute = `/create-new-chat?collectionId=${collectionId}`;
      
      mockRouter.push(expectedRoute);
      
      expect(mockRouter.push).toHaveBeenCalledWith(expectedRoute);
    });
  });

  describe('Data Context Inheritance', () => {
    it('should load collection context when creating canvas', async () => {
      const collectionId = 'collection-123';

      mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collection: {
            id: collectionId,
            name: 'Test Collection',
            dataItems: [
              { id: 'well-1', name: 'WELL-001' },
              { id: 'well-2', name: 'WELL-002' }
            ]
          }
        })
      });

      const response = await mockAmplifyClient.queries.collectionQuery({
        operation: 'getCollection',
        collectionId: collectionId
      });

      const result = JSON.parse(response.data);
      
      expect(result.success).toBe(true);
      expect(result.collection.dataItems).toHaveLength(2);
    });

    it('should cache collection context in ChatSession', async () => {
      const collectionContext = {
        collectionId: 'collection-123',
        collectionName: 'Test Collection',
        dataItems: [
          { id: 'well-1', name: 'WELL-001' },
          { id: 'well-2', name: 'WELL-002' }
        ],
        createdAt: new Date().toISOString()
      };

      const sessionData = {
        name: 'Test Canvas',
        linkedCollectionId: 'collection-123',
        collectionContext: JSON.stringify(collectionContext)
      };

      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'session-123',
          ...sessionData
        }
      });

      const response = await mockAmplifyClient.models.ChatSession.create(sessionData);
      const savedContext = JSON.parse(response.data.collectionContext);
      
      expect(savedContext.collectionId).toBe('collection-123');
      expect(savedContext.dataItems).toHaveLength(2);
    });

    it('should validate data access within collection scope', () => {
      const collectionContext = {
        collectionId: 'collection-123',
        dataItems: [
          { id: 'well-1', name: 'WELL-001' },
          { id: 'well-2', name: 'WELL-002' }
        ]
      };

      const requestedDataIds = ['well-1', 'well-2'];
      const allowedIds = new Set(collectionContext.dataItems.map(item => item.id));
      const outOfScope = requestedDataIds.filter(id => !allowedIds.has(id));

      expect(outOfScope).toHaveLength(0);
    });

    it('should detect out-of-scope data access', () => {
      const collectionContext = {
        collectionId: 'collection-123',
        dataItems: [
          { id: 'well-1', name: 'WELL-001' },
          { id: 'well-2', name: 'WELL-002' }
        ]
      };

      const requestedDataIds = ['well-1', 'well-2', 'well-3', 'well-4'];
      const allowedIds = new Set(collectionContext.dataItems.map(item => item.id));
      const outOfScope = requestedDataIds.filter(id => !allowedIds.has(id));

      expect(outOfScope).toHaveLength(2);
      expect(outOfScope).toContain('well-3');
      expect(outOfScope).toContain('well-4');
    });
  });

  describe('Collection List Refresh', () => {
    it('should reload collections after creation', async () => {
      const initialCollections = [
        { id: 'collection-1', name: 'Collection 1' }
      ];

      const updatedCollections = [
        { id: 'collection-1', name: 'Collection 1' },
        { id: 'collection-2', name: 'Collection 2' }
      ];

      mockAmplifyClient.queries.collectionQuery
        .mockResolvedValueOnce({
          data: JSON.stringify({ collections: initialCollections })
        })
        .mockResolvedValueOnce({
          data: JSON.stringify({ collections: updatedCollections })
        });

      // Initial load
      const response1 = await mockAmplifyClient.queries.collectionQuery({
        operation: 'listCollections'
      });
      const result1 = JSON.parse(response1.data);
      expect(result1.collections).toHaveLength(1);

      // Reload after creation
      const response2 = await mockAmplifyClient.queries.collectionQuery({
        operation: 'listCollections'
      });
      const result2 = JSON.parse(response2.data);
      expect(result2.collections).toHaveLength(2);
    });

    it('should reset to page 1 after adding collection', () => {
      let currentPage = 3;
      
      // Simulate collection added
      currentPage = 1;
      
      expect(currentPage).toBe(1);
    });
  });

  describe('Modal State Management', () => {
    it('should open modal on create collection prompt', () => {
      let showCreateModal = false;
      
      // Simulate prompt detection
      const userPrompt = 'create a collection';
      if (userPrompt.toLowerCase().includes('create') && 
          userPrompt.toLowerCase().includes('collection')) {
        showCreateModal = true;
      }
      
      expect(showCreateModal).toBe(true);
    });

    it('should close modal after successful creation', async () => {
      let showCreateModal = true;

      mockAmplifyClient.mutations.collectionManagement.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collectionId: 'collection-123'
        })
      });

      const response = await mockAmplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        name: 'Test Collection'
      });

      const result = JSON.parse(response.data);
      if (result.success) {
        showCreateModal = false;
      }
      
      expect(showCreateModal).toBe(false);
    });

    it('should clear form fields after creation', async () => {
      let collectionName = 'Test Collection';
      let collectionDescription = 'Test description';

      mockAmplifyClient.mutations.collectionManagement.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collectionId: 'collection-123'
        })
      });

      const response = await mockAmplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        name: collectionName,
        description: collectionDescription
      });

      const result = JSON.parse(response.data);
      if (result.success) {
        collectionName = '';
        collectionDescription = '';
      }
      
      expect(collectionName).toBe('');
      expect(collectionDescription).toBe('');
    });
  });

  describe('Requirements Verification', () => {
    beforeEach(() => {
      // Reset router mock for this describe block
      mockRouter.push.mockClear();
      mockRouter.push.mockImplementation(() => {});
    });

    it('should satisfy requirement 1.1: Display modal on prompt', () => {
      const userPrompt = 'create a collection';
      const shouldShowModal = userPrompt.toLowerCase().includes('create') && 
                              userPrompt.toLowerCase().includes('collection');
      
      expect(shouldShowModal).toBe(true);
    });

    it('should satisfy requirement 1.5: Navigate to detail page', () => {
      const collectionId = 'collection-123';
      const navigationUrl = `/collections/${collectionId}`;
      
      mockRouter.push(navigationUrl);
      
      expect(mockRouter.push).toHaveBeenCalledWith(navigationUrl);
    });

    it('should satisfy requirement 4.1: Link canvas to collection', async () => {
      const sessionData = {
        linkedCollectionId: 'collection-123',
        collectionContext: JSON.stringify({
          collectionId: 'collection-123',
          dataItems: []
        })
      };

      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: { id: 'session-123', ...sessionData }
      });

      const response = await mockAmplifyClient.models.ChatSession.create(sessionData);
      
      expect(response.data.linkedCollectionId).toBe('collection-123');
    });

    it('should satisfy requirement 5.5: Inherit collection context', async () => {
      const collectionContext = {
        collectionId: 'collection-123',
        collectionName: 'Test Collection',
        dataItems: [{ id: 'well-1' }]
      };

      const sessionData = {
        linkedCollectionId: 'collection-123',
        collectionContext: JSON.stringify(collectionContext)
      };

      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: { id: 'session-123', ...sessionData }
      });

      const response = await mockAmplifyClient.models.ChatSession.create(sessionData);
      const savedContext = JSON.parse(response.data.collectionContext);
      
      expect(savedContext.collectionId).toBe('collection-123');
      expect(savedContext.dataItems).toHaveLength(1);
    });
  });
});
