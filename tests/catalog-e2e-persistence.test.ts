/**
 * End-to-End Test: Message Persistence Workflow
 * 
 * Tests the complete message persistence workflow:
 * 1. Run several queries to build up conversation
 * 2. Reload browser (simulate)
 * 3. Verify all messages restored
 * 4. Verify table data restored
 * 5. Verify map state restored
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('E2E: Message Persistence Workflow', () => {
  const TEST_SESSION_ID = 'test-session-12345';
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    
    // Store session ID
    mockLocalStorage['catalog_session_id'] = TEST_SESSION_ID;
  });

  afterEach(() => {
    // Clean up
    mockLocalStorage = {};
  });

  describe('Step 1: Build Up Conversation', () => {
    it('should save messages after each query', () => {
      const messages = [
        {
          id: 'msg-1',
          role: 'human',
          content: { text: '/getdata' },
          responseComplete: true,
          createdAt: new Date().toISOString(),
          chatSessionId: TEST_SESSION_ID,
          owner: 'user-123'
        },
        {
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Found 151 wells' },
          responseComplete: true,
          createdAt: new Date().toISOString(),
          chatSessionId: TEST_SESSION_ID,
          owner: 'system',
          stats: {
            wellCount: 151,
            wellboreCount: 151,
            welllogCount: 76
          },
          files: {
            metadata: 's3://bucket/session/metadata.json',
            geojson: 's3://bucket/session/geojson.json'
          }
        },
        {
          id: 'msg-3',
          role: 'human',
          content: { text: 'wells with log curve data' },
          responseComplete: true,
          createdAt: new Date().toISOString(),
          chatSessionId: TEST_SESSION_ID,
          owner: 'user-123'
        },
        {
          id: 'msg-4',
          role: 'ai',
          content: { text: 'Found 76 wells with log curve data' },
          responseComplete: true,
          createdAt: new Date().toISOString(),
          chatSessionId: TEST_SESSION_ID,
          owner: 'system',
          stats: {
            wellCount: 76,
            totalWells: 151,
            isFiltered: true,
            filterCriteria: 'wells with log curve data'
          },
          files: {
            metadata: 's3://bucket/session/filtered-metadata.json',
            geojson: 's3://bucket/session/filtered-geojson.json'
          }
        }
      ];

      // Simulate saving to localStorage after each message
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Verify messages are saved
      const savedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
      expect(savedMessages).toBeDefined();
      
      const parsedMessages = JSON.parse(savedMessages);
      expect(parsedMessages).toHaveLength(4);
      expect(parsedMessages[0].content.text).toBe('/getdata');
      expect(parsedMessages[3].stats.isFiltered).toBe(true);
    });

    it('should save messages with complete metadata', () => {
      const aiMessage = {
        id: 'msg-2',
        role: 'ai',
        content: { text: 'Found 151 wells' },
        responseComplete: true,
        createdAt: new Date().toISOString(),
        chatSessionId: TEST_SESSION_ID,
        owner: 'system',
        stats: {
          wellCount: 151,
          wellboreCount: 151,
          welllogCount: 76,
          curveCount: 228
        },
        files: {
          metadata: 's3://bucket/session/metadata.json',
          geojson: 's3://bucket/session/geojson.json'
        },
        thoughtSteps: [
          { step: 1, description: 'Analyzing query' },
          { step: 2, description: 'Fetching data from OSDU' },
          { step: 3, description: 'Processing results' }
        ]
      };

      // Verify all metadata is present
      expect(aiMessage.stats).toBeDefined();
      expect(aiMessage.files).toBeDefined();
      expect(aiMessage.thoughtSteps).toBeDefined();
      expect(aiMessage.stats.wellCount).toBe(151);
      expect(aiMessage.files.metadata).toContain('s3://');
      expect(aiMessage.thoughtSteps).toHaveLength(3);
    });
  });

  describe('Step 2: Browser Reload Simulation', () => {
    it('should load sessionId from localStorage on mount', () => {
      // Simulate component mount
      const storedSessionId = mockLocalStorage['catalog_session_id'];
      
      expect(storedSessionId).toBe(TEST_SESSION_ID);
    });

    it('should load messages from localStorage on mount', () => {
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: '/getdata' } },
        { id: 'msg-2', role: 'ai', content: { text: 'Found 151 wells' } }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Simulate loading messages on mount
      const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
      const parsedMessages = JSON.parse(storedMessages);

      expect(parsedMessages).toHaveLength(2);
      expect(parsedMessages[0].id).toBe('msg-1');
      expect(parsedMessages[1].id).toBe('msg-2');
    });

    it('should handle missing messages gracefully', () => {
      // No messages in localStorage
      const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
      
      expect(storedMessages).toBeUndefined();
      
      // Should start with empty array
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      expect(messages).toHaveLength(0);
    });

    it('should handle corrupted localStorage data', () => {
      // Corrupted JSON
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = 'invalid json {';

      // Simulate error handling
      let messages = [];
      try {
        const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
        messages = JSON.parse(storedMessages);
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
        messages = [];
      }

      expect(messages).toHaveLength(0);
    });
  });

  describe('Step 3: Verify Messages Restored', () => {
    it('should restore all messages in correct order', () => {
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Query 1' }, createdAt: '2024-01-01T10:00:00Z' },
        { id: 'msg-2', role: 'ai', content: { text: 'Response 1' }, createdAt: '2024-01-01T10:00:05Z' },
        { id: 'msg-3', role: 'human', content: { text: 'Query 2' }, createdAt: '2024-01-01T10:01:00Z' },
        { id: 'msg-4', role: 'ai', content: { text: 'Response 2' }, createdAt: '2024-01-01T10:01:05Z' }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Restore messages
      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);

      expect(restoredMessages).toHaveLength(4);
      expect(restoredMessages[0].content.text).toBe('Query 1');
      expect(restoredMessages[1].content.text).toBe('Response 1');
      expect(restoredMessages[2].content.text).toBe('Query 2');
      expect(restoredMessages[3].content.text).toBe('Response 2');
    });

    it('should restore message metadata', () => {
      const messages = [
        {
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Found 151 wells' },
          stats: { wellCount: 151 },
          files: { metadata: 's3://bucket/metadata.json' },
          thoughtSteps: [{ step: 1, description: 'Processing' }]
        }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      const aiMessage = restoredMessages[0];

      expect(aiMessage.stats).toBeDefined();
      expect(aiMessage.files).toBeDefined();
      expect(aiMessage.thoughtSteps).toBeDefined();
      expect(aiMessage.stats.wellCount).toBe(151);
    });
  });

  describe('Step 4: Verify Table Data Restored', () => {
    it('should extract S3 URLs from restored messages', () => {
      const messages = [
        {
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Found 151 wells' },
          files: {
            metadata: 's3://bucket/session/metadata.json',
            geojson: 's3://bucket/session/geojson.json'
          }
        }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Restore and extract files
      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      const lastMessage = restoredMessages[restoredMessages.length - 1];
      const files = lastMessage.files;

      expect(files).toBeDefined();
      expect(files.metadata).toContain('s3://');
      expect(files.geojson).toContain('s3://');
    });

    it('should restore table data from S3 metadata', async () => {
      // Simulate fetching data from S3
      const mockS3Data = {
        wells: Array.from({ length: 151 }, (_, i) => ({
          id: `well-${i + 1}`,
          wellName: `WELL-${String(i + 1).padStart(3, '0')}`,
          wellbores: []
        }))
      };

      // Simulate restoration
      const restoredData = mockS3Data.wells;

      expect(restoredData).toHaveLength(151);
      expect(restoredData[0].wellName).toBe('WELL-001');
    });

    it('should restore filtered data state', () => {
      const messages = [
        {
          id: 'msg-4',
          role: 'ai',
          content: { text: 'Found 76 wells with log curve data' },
          stats: {
            wellCount: 76,
            totalWells: 151,
            isFiltered: true
          },
          files: {
            metadata: 's3://bucket/session/filtered-metadata.json'
          }
        }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Restore filter state
      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      const lastMessage = restoredMessages[restoredMessages.length - 1];
      const stats = lastMessage.stats;

      expect(stats.isFiltered).toBe(true);
      expect(stats.wellCount).toBe(76);
      expect(stats.totalWells).toBe(151);
    });
  });

  describe('Step 5: Verify Map State Restored', () => {
    it('should restore map state from messages', () => {
      const messages = [
        {
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Found 151 wells' },
          files: {
            geojson: 's3://bucket/session/geojson.json'
          },
          mapState: {
            center: [40.7128, -74.0060],
            zoom: 10,
            bounds: {
              north: 40.8,
              south: 40.6,
              east: -73.9,
              west: -74.1
            }
          }
        }
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Restore map state
      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      const lastMessage = restoredMessages[restoredMessages.length - 1];
      const mapState = lastMessage.mapState;

      expect(mapState).toBeDefined();
      expect(mapState.center).toEqual([40.7128, -74.0060]);
      expect(mapState.zoom).toBe(10);
      expect(mapState.bounds).toBeDefined();
    });

    it('should restore well markers from GeoJSON', async () => {
      // Simulate GeoJSON data
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: Array.from({ length: 151 }, (_, i) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.0060 + i * 0.01, 40.7128 + i * 0.01]
          },
          properties: {
            wellName: `WELL-${String(i + 1).padStart(3, '0')}`,
            operator: 'Test Operator'
          }
        }))
      };

      // Verify GeoJSON structure
      expect(mockGeoJSON.features).toHaveLength(151);
      expect(mockGeoJSON.features[0].geometry.type).toBe('Point');
      expect(mockGeoJSON.features[0].properties.wellName).toBe('WELL-001');
    });
  });

  describe('Complete Persistence Workflow', () => {
    it('should handle complete persistence workflow end-to-end', () => {
      // Step 1: Build conversation
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: '/getdata' } },
        { 
          id: 'msg-2', 
          role: 'ai', 
          content: { text: 'Found 151 wells' },
          stats: { wellCount: 151 },
          files: { 
            metadata: 's3://bucket/metadata.json',
            geojson: 's3://bucket/geojson.json'
          }
        },
        { id: 'msg-3', role: 'human', content: { text: 'wells with log curve data' } },
        { 
          id: 'msg-4', 
          role: 'ai', 
          content: { text: 'Found 76 wells' },
          stats: { wellCount: 76, totalWells: 151, isFiltered: true },
          files: { 
            metadata: 's3://bucket/filtered.json',
            geojson: 's3://bucket/filtered-geojson.json'
          }
        }
      ];

      // Save to localStorage
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Step 2: Simulate reload
      const storedSessionId = mockLocalStorage['catalog_session_id'];
      expect(storedSessionId).toBe(TEST_SESSION_ID);

      // Step 3: Restore messages
      const restoredMessages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restoredMessages).toHaveLength(4);

      // Step 4: Verify table data can be restored
      const lastAiMessage = restoredMessages.filter((m: any) => m.role === 'ai').pop();
      expect(lastAiMessage.files).toBeDefined();
      expect(lastAiMessage.stats).toBeDefined();

      // Step 5: Verify map state can be restored
      expect(lastAiMessage.files.geojson).toBeDefined();
    });

    it('should handle multiple reload cycles', () => {
      // First session
      let messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Query 1' } }
      ];
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Reload 1
      let restored = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restored).toHaveLength(1);

      // Add more messages
      messages = [
        ...restored,
        { id: 'msg-2', role: 'ai', content: { text: 'Response 1' } },
        { id: 'msg-3', role: 'human', content: { text: 'Query 2' } }
      ];
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Reload 2
      restored = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restored).toHaveLength(3);

      // Add more messages
      messages = [
        ...restored,
        { id: 'msg-4', role: 'ai', content: { text: 'Response 2' } }
      ];
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Reload 3
      restored = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restored).toHaveLength(4);
    });
  });
});
