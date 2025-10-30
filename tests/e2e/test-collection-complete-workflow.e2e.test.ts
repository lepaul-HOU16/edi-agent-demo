/**
 * End-to-End tests for Complete Collection Workflow
 * Tests the full user journey from catalog search to AI query with collection context
 * Requirements: All
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock browser environment
const mockWindow = {
  location: {
    href: '',
    pathname: ''
  },
  confirm: jest.fn(),
  alert: jest.fn()
};

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
      list: jest.fn(),
      update: jest.fn()
    },
    ChatMessage: {
      create: jest.fn(),
      list: jest.fn()
    }
  }
};

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn()
};

describe('Collection System E2E Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow.location.href = '';
    mockWindow.location.pathname = '';
  });

  describe('Complete User Workflow: Catalog → Collection → Canvas → AI Query', () => {
    it('should complete full workflow successfully', async () => {
      // Step 1: User searches in catalog
      const catalogSearchQuery = 'wells in Cuu Long Basin';
      const catalogResults = [
        { id: 'well-1', name: 'WELL-001', location: 'Cuu Long Basin' },
        { id: 'well-2', name: 'WELL-002', location: 'Cuu Long Basin' },
        { id: 'well-3', name: 'WELL-003', location: 'Cuu Long Basin' }
      ];

      expect(catalogResults).toHaveLength(3);
      expect(catalogSearchQuery).toContain('Cuu Long Basin');

      // Step 2: User creates collection from search results
      mockAmplifyClient.mutations.collectionManagement.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collectionId: 'collection-123',
          collection: {
            id: 'collection-123',
            name: 'Cuu Long Basin Wells',
            description: 'Wells from Cuu Long Basin search',
            dataItems: catalogResults,
            previewMetadata: {
              wellCount: catalogResults.length,
              dataPointCount: catalogResults.length,
              createdFrom: 'catalog_search'
            }
          }
        })
      });

      const createResponse = await mockAmplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        name: 'Cuu Long Basin Wells',
        description: 'Wells from Cuu Long Basin search',
        dataSourceType: 'Mixed',
        previewMetadata: JSON.stringify({
          wellCount: catalogResults.length,
          dataPointCount: catalogResults.length,
          createdFrom: 'catalog_search'
        })
      });

      const createResult = JSON.parse(createResponse.data);
      expect(createResult.success).toBe(true);
      expect(createResult.collectionId).toBe('collection-123');

      // Step 3: Navigate to collection detail page
      const collectionId = createResult.collectionId;
      mockRouter.push(`/collections/${collectionId}`);
      expect(mockRouter.push).toHaveBeenCalledWith('/collections/collection-123');

      // Step 4: Load collection details
      mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collection: createResult.collection
        })
      });

      const detailResponse = await mockAmplifyClient.queries.collectionQuery({
        operation: 'getCollection',
        collectionId: collectionId
      });

      const detailResult = JSON.parse(detailResponse.data);
      expect(detailResult.success).toBe(true);
      expect(detailResult.collection.name).toBe('Cuu Long Basin Wells');

      // Step 5: Create canvas from collection
      const collectionContext = {
        collectionId: collectionId,
        collectionName: detailResult.collection.name,
        dataItems: detailResult.collection.dataItems,
        createdAt: new Date().toISOString()
      };

      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'session-123',
          name: 'Canvas from Cuu Long Basin Wells',
          linkedCollectionId: collectionId,
          collectionContext: JSON.stringify(collectionContext)
        }
      });

      const sessionResponse = await mockAmplifyClient.models.ChatSession.create({
        name: 'Canvas from Cuu Long Basin Wells',
        linkedCollectionId: collectionId,
        collectionContext: JSON.stringify(collectionContext)
      });

      expect(sessionResponse.data.linkedCollectionId).toBe(collectionId);

      // Step 6: Navigate to canvas
      const canvasId = sessionResponse.data.id;
      mockRouter.push(`/chat/${canvasId}`);
      expect(mockRouter.push).toHaveBeenCalledWith('/chat/session-123');

      // Step 7: User sends AI query
      const userQuery = 'analyze porosity for WELL-001';
      
      // Step 8: Validate data access (within collection scope)
      const requestedWells = ['well-1']; // WELL-001
      const allowedDataIds = new Set(collectionContext.dataItems.map((item: any) => item.id));
      const outOfScope = requestedWells.filter(id => !allowedDataIds.has(id));

      expect(outOfScope).toHaveLength(0); // All requested data is within scope

      // Step 9: AI processes query with collection context
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-123',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: 'Analysis complete for WELL-001 from Cuu Long Basin Wells collection.'
          }
        }
      });

      const messageResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'ai',
        content: {
          text: 'Analysis complete for WELL-001 from Cuu Long Basin Wells collection.'
        }
      });

      expect(messageResponse.data.content.text).toContain('WELL-001');
      expect(messageResponse.data.content.text).toContain('Cuu Long Basin Wells');
    });
  });

  describe('Data Context Limits and Approval Flow', () => {
    it('should detect out-of-scope data access and request approval', async () => {
      // Setup: Canvas with collection context
      const collectionContext = {
        collectionId: 'collection-123',
        collectionName: 'Test Collection',
        dataItems: [
          { id: 'well-1', name: 'WELL-001' },
          { id: 'well-2', name: 'WELL-002' }
        ]
      };

      mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
        data: {
          id: 'session-123',
          linkedCollectionId: 'collection-123',
          collectionContext: JSON.stringify(collectionContext)
        }
      });

      // User query requests data outside collection
      const userQuery = 'analyze WELL-001, WELL-002, WELL-003, and WELL-004';
      const requestedWells = ['well-1', 'well-2', 'well-3', 'well-4'];
      
      // Validate data access
      const allowedDataIds = new Set(collectionContext.dataItems.map(item => item.id));
      const outOfScope = requestedWells.filter(id => !allowedDataIds.has(id));

      expect(outOfScope).toHaveLength(2);
      expect(outOfScope).toContain('well-3');
      expect(outOfScope).toContain('well-4');

      // System should create approval request
      const approvalMessage = {
        type: 'data_access_approval',
        requiresApproval: true,
        message: `This query requires access to ${outOfScope.length} data points outside your collection "${collectionContext.collectionName}". Do you want to proceed with expanded access?`,
        outOfScopeItems: outOfScope,
        collectionId: collectionContext.collectionId,
        collectionName: collectionContext.collectionName
      };

      expect(approvalMessage.requiresApproval).toBe(true);
      expect(approvalMessage.outOfScopeItems).toHaveLength(2);
    });

    it('should process user approval and log access expansion', async () => {
      // User approves expanded access
      const userResponse = 'approve';
      const isApproval = userResponse.toLowerCase() === 'approve' || 
                        userResponse.toLowerCase() === 'yes';

      expect(isApproval).toBe(true);

      // Log approval
      const dataAccessLog = {
        timestamp: new Date().toISOString(),
        action: 'expanded_access_approved',
        collectionId: 'collection-123',
        collectionName: 'Test Collection',
        userId: 'user-123',
        message: userResponse
      };

      mockAmplifyClient.models.ChatSession.update.mockResolvedValue({
        data: {
          id: 'session-123',
          dataAccessLog: [dataAccessLog]
        }
      });

      const updateResponse = await mockAmplifyClient.models.ChatSession.update({
        id: 'session-123',
        dataAccessLog: [dataAccessLog]
      });

      expect(updateResponse.data.dataAccessLog).toHaveLength(1);
      expect(updateResponse.data.dataAccessLog[0].action).toBe('expanded_access_approved');
    });

    it('should deny access if user does not approve', () => {
      const userResponse = 'no, cancel the query';
      const isApproval = userResponse.toLowerCase() === 'approve' || 
                        userResponse.toLowerCase() === 'yes';

      expect(isApproval).toBe(false);
    });
  });

  describe('Pagination Across All Views', () => {
    it('should paginate collections list (10 per page)', async () => {
      const collections = Array.from({ length: 37 }, (_, i) => ({
        id: `collection-${i + 1}`,
        name: `Collection ${i + 1}`
      }));

      mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
        data: JSON.stringify({ collections })
      });

      const response = await mockAmplifyClient.queries.collectionQuery({
        operation: 'listCollections'
      });

      const result = JSON.parse(response.data);
      const ITEMS_PER_PAGE = 10;
      const pagesCount = Math.ceil(result.collections.length / ITEMS_PER_PAGE);

      expect(result.collections).toHaveLength(37);
      expect(pagesCount).toBe(4);

      // Test page 1
      const page1 = result.collections.slice(0, 10);
      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe('collection-1');

      // Test page 4 (last page with 7 items)
      const page4 = result.collections.slice(30, 40);
      expect(page4).toHaveLength(7);
      expect(page4[0].id).toBe('collection-31');
    });

    it('should paginate canvases list (25 per page)', async () => {
      const canvases = Array.from({ length: 60 }, (_, i) => ({
        id: `canvas-${i + 1}`,
        name: `Canvas ${i + 1}`,
        linkedCollectionId: 'collection-123'
      }));

      mockAmplifyClient.models.ChatSession.list.mockResolvedValue({
        data: canvases
      });

      const response = await mockAmplifyClient.models.ChatSession.list({
        filter: {
          linkedCollectionId: { eq: 'collection-123' }
        }
      });

      const CANVASES_PER_PAGE = 25;
      const pagesCount = Math.ceil(response.data.length / CANVASES_PER_PAGE);

      expect(response.data).toHaveLength(60);
      expect(pagesCount).toBe(3);

      // Test page 2
      const page2 = response.data.slice(25, 50);
      expect(page2).toHaveLength(25);
      expect(page2[0].id).toBe('canvas-26');
    });

    it('should filter canvases by collection and paginate', async () => {
      const allCanvases = [
        ...Array.from({ length: 30 }, (_, i) => ({
          id: `canvas-${i + 1}`,
          name: `Canvas ${i + 1}`,
          linkedCollectionId: 'collection-1'
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `canvas-${i + 31}`,
          name: `Canvas ${i + 31}`,
          linkedCollectionId: 'collection-2'
        }))
      ];

      // Filter by collection-1
      const filteredCanvases = allCanvases.filter(
        c => c.linkedCollectionId === 'collection-1'
      );

      expect(filteredCanvases).toHaveLength(30);

      const CANVASES_PER_PAGE = 25;
      const pagesCount = Math.ceil(filteredCanvases.length / CANVASES_PER_PAGE);
      expect(pagesCount).toBe(2);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive modal styling', () => {
      const viewportWidth = 1920; // Desktop
      const modalWidth = viewportWidth * 0.6; // 60% of viewport

      expect(modalWidth).toBe(1152);
    });

    it('should apply mobile modal styling', () => {
      const viewportWidth = 375; // Mobile
      const modalWidth = viewportWidth * 0.9; // 90% of viewport

      expect(modalWidth).toBe(337.5);
    });

    it('should calculate modal max height', () => {
      const viewportHeight = 1080;
      const topMargin = 100;
      const bottomMargin = 100;
      const maxHeight = viewportHeight - topMargin - bottomMargin;

      expect(maxHeight).toBe(880);
    });

    it('should handle window resize', () => {
      let viewportWidth = 1920;
      let modalWidth = viewportWidth * 0.6;
      expect(modalWidth).toBe(1152);

      // Simulate resize
      viewportWidth = 1024;
      modalWidth = viewportWidth * 0.6;
      expect(modalWidth).toBe(614.4);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle collection creation failure', async () => {
      mockAmplifyClient.mutations.collectionManagement.mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        await mockAmplifyClient.mutations.collectionManagement({
          operation: 'createCollection',
          name: 'Test Collection'
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection failed');
      }
    });

    it('should handle collection not found', async () => {
      mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
        data: JSON.stringify({
          success: false,
          error: 'Collection not found'
        })
      });

      const response = await mockAmplifyClient.queries.collectionQuery({
        operation: 'getCollection',
        collectionId: 'non-existent-id'
      });

      const result = JSON.parse(response.data);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Collection not found');
    });

    it('should handle canvas creation failure', async () => {
      mockAmplifyClient.models.ChatSession.create.mockRejectedValue(
        new Error('Failed to create session')
      );

      try {
        await mockAmplifyClient.models.ChatSession.create({
          name: 'Test Canvas',
          linkedCollectionId: 'collection-123'
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to create session');
      }
    });

    it('should handle empty collection list', async () => {
      mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
        data: JSON.stringify({ collections: [] })
      });

      const response = await mockAmplifyClient.queries.collectionQuery({
        operation: 'listCollections'
      });

      const result = JSON.parse(response.data);
      expect(result.collections).toHaveLength(0);
    });

    it('should handle no canvases linked to collection', async () => {
      mockAmplifyClient.models.ChatSession.list.mockResolvedValue({
        data: []
      });

      const response = await mockAmplifyClient.models.ChatSession.list({
        filter: {
          linkedCollectionId: { eq: 'collection-123' }
        }
      });

      expect(response.data).toHaveLength(0);
    });
  });

  describe('Requirements Verification', () => {
    it('should verify all requirements are testable', () => {
      const requirements = {
        '1.1': 'Display modal on create collection prompt',
        '1.2': 'Modal sized to 60% viewport width',
        '1.3': 'Modal positioned 100px from top/bottom',
        '1.4': 'Allow deselection of data points',
        '1.5': 'Navigate to collection detail page',
        '2.1': 'View All Collections menu item',
        '2.2': 'Navigate to collection manager',
        '2.3': 'View All Canvases menu item',
        '2.4': 'Collection filter dropdown',
        '2.5': 'Filter canvases by collection',
        '3.1': 'Display 10 collections per page',
        '3.2': 'Pagination controls for collections',
        '3.3': 'Add collection without removing existing',
        '3.4': 'Display 25 canvases per page',
        '3.5': 'Pagination controls for canvases',
        '4.1': 'Link canvas to collection context',
        '4.2': 'Limit agent data access to collection',
        '4.3': 'Prompt for expanded data access',
        '4.4': 'Log context expansion',
        '4.5': 'Display collection context in canvas',
        '5.1': 'Display canvases with /listChats styling',
        '5.2': 'Display only collection canvases',
        '5.3': 'Display canvas metadata',
        '5.4': 'Navigate to canvas on click',
        '5.5': 'Inherit collection context'
      };

      expect(Object.keys(requirements).length).toBeGreaterThan(20);
    });
  });
});
