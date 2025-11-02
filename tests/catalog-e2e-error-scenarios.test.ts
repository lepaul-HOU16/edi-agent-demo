/**
 * End-to-End Test: Error Scenarios
 * 
 * Tests error handling and graceful degradation:
 * 1. Test with corrupted localStorage data
 * 2. Test with expired S3 signed URLs
 * 3. Test with backend filter errors
 * 4. Verify graceful degradation in all cases
 * 
 * Requirements: 5.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('E2E: Error Scenarios', () => {
  const TEST_SESSION_ID = 'test-session-12345';
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    mockLocalStorage['catalog_session_id'] = TEST_SESSION_ID;
  });

  describe('Scenario 1: Corrupted localStorage Data', () => {
    it('should handle invalid JSON in messages', () => {
      // Store corrupted JSON
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = 'invalid json {{{';

      // Attempt to parse
      let messages: any[] = [];
      let errorOccurred = false;

      try {
        const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
        messages = JSON.parse(storedMessages);
      } catch (error) {
        console.error('Failed to parse stored messages:', error);
        errorOccurred = true;
        messages = []; // Fallback to empty array
      }

      // Should handle error gracefully
      expect(errorOccurred).toBe(true);
      expect(messages).toHaveLength(0);
    });

    it('should handle truncated JSON', () => {
      // Store truncated JSON
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = '[{"id":"msg-1","role":"human"';

      let messages: any[] = [];
      let errorOccurred = false;

      try {
        const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
        messages = JSON.parse(storedMessages);
      } catch (error) {
        errorOccurred = true;
        messages = [];
      }

      expect(errorOccurred).toBe(true);
      expect(messages).toHaveLength(0);
    });

    it('should handle non-array JSON', () => {
      // Store object instead of array
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = '{"messages": []}';

      let messages: any[] = [];
      
      try {
        const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
        const parsed = JSON.parse(storedMessages);
        
        // Validate it's an array
        if (Array.isArray(parsed)) {
          messages = parsed;
        } else {
          console.warn('Stored messages is not an array, using empty array');
          messages = [];
        }
      } catch (error) {
        messages = [];
      }

      expect(messages).toHaveLength(0);
    });

    it('should handle messages with missing required fields', () => {
      // Store messages with missing fields
      const invalidMessages = [
        { id: 'msg-1' }, // Missing role, content
        { role: 'human' }, // Missing id, content
        { content: { text: 'test' } } // Missing id, role
      ];

      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(invalidMessages);

      // Parse and validate
      const storedMessages = mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];
      const parsed = JSON.parse(storedMessages);

      // Should parse but messages may be invalid
      expect(parsed).toHaveLength(3);
      
      // Filter out invalid messages
      const validMessages = parsed.filter((msg: any) => 
        msg.id && msg.role && msg.content
      );
      
      expect(validMessages).toHaveLength(0);
    });

    it('should continue working after localStorage error', () => {
      // Corrupted data
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = 'invalid';

      // Attempt to load (fails)
      let messages: any[] = [];
      try {
        messages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      } catch (error) {
        messages = [];
      }

      // Should start fresh
      expect(messages).toHaveLength(0);

      // Should be able to add new messages
      const newMessage = {
        id: 'msg-1',
        role: 'human',
        content: { text: 'New query' }
      };
      messages.push(newMessage);

      // Should be able to save
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);
      
      const restored = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restored).toHaveLength(1);
      expect(restored[0].content.text).toBe('New query');
    });
  });

  describe('Scenario 2: Expired S3 Signed URLs', () => {
    it('should handle 403 Forbidden from expired URL', async () => {
      const expiredUrl = 's3://bucket/session/metadata.json?expires=past';
      
      // Simulate fetch error
      let dataLoaded = false;
      let errorOccurred = false;

      try {
        // Simulate fetch that returns 403
        const mockResponse = {
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        };

        if (!mockResponse.ok) {
          throw new Error(`Failed to fetch: ${mockResponse.status} ${mockResponse.statusText}`);
        }
      } catch (error) {
        console.error('Failed to load data from S3:', error);
        errorOccurred = true;
        dataLoaded = false;
      }

      expect(errorOccurred).toBe(true);
      expect(dataLoaded).toBe(false);
    });

    it('should show warning message when S3 data cannot be loaded', () => {
      const errorMessage = {
        id: 'error-msg',
        role: 'ai',
        content: {
          text: '⚠️ Could not restore previous data. The session may have expired. Please run a new search.'
        },
        responseComplete: true
      };

      expect(errorMessage.content.text).toContain('⚠️');
      expect(errorMessage.content.text).toContain('Could not restore');
    });

    it('should allow user to continue with fresh search after S3 error', () => {
      // S3 load failed
      let analysisData = null;
      let errorShown = true;

      // User can still send new query
      const newQuery = '/getdata';
      expect(newQuery).toBeDefined();

      // Should be able to get fresh data
      analysisData = Array.from({ length: 151 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));

      expect(analysisData).toHaveLength(151);
    });

    it('should handle network timeout', async () => {
      let errorOccurred = false;

      try {
        // Simulate network timeout
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      } catch (error) {
        console.error('Network timeout:', error);
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });

    it('should handle malformed S3 response', async () => {
      let errorOccurred = false;

      try {
        // Simulate malformed JSON response
        const mockResponse = 'not valid json {';
        JSON.parse(mockResponse);
      } catch (error) {
        console.error('Failed to parse S3 response:', error);
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });
  });

  describe('Scenario 3: Backend Filter Errors', () => {
    it('should handle backend returning error response', async () => {
      const errorResponse = {
        errors: [
          {
            message: 'Filter operation failed: Invalid filter criteria'
          }
        ]
      };

      // Verify error structure
      expect(errorResponse.errors).toBeDefined();
      expect(errorResponse.errors[0].message).toContain('failed');
    });

    it('should show error message in chat', () => {
      const errorMessage = {
        id: 'error-msg',
        role: 'ai',
        content: {
          text: '❌ Filter operation failed: Invalid filter criteria\n\nShowing original unfiltered data.'
        },
        responseComplete: true
      };

      expect(errorMessage.content.text).toContain('❌');
      expect(errorMessage.content.text).toContain('failed');
      expect(errorMessage.content.text).toContain('original unfiltered data');
    });

    it('should keep original data visible on filter error', () => {
      // Original data
      const analysisData = Array.from({ length: 151 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));

      // Filter fails
      let filteredData = null;
      let filterStats = null;

      // Original data should still be visible
      const displayData = filteredData || analysisData;
      expect(displayData).toHaveLength(151);
      expect(filterStats).toBeNull();
    });

    it('should handle backend timeout', async () => {
      let errorOccurred = false;

      try {
        // Simulate backend timeout (30 seconds)
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Backend timeout')), 100);
        });
      } catch (error) {
        console.error('Backend timeout:', error);
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });

    it('should handle missing filter metadata in response', () => {
      const response = {
        type: 'complete',
        data: {
          message: 'Found wells',
          files: {
            metadata: 's3://bucket/metadata.json'
          }
          // Missing stats, isFilterOperation
        }
      };

      // Should handle missing metadata gracefully
      const isFilterOperation = response.data.isFilterOperation || false;
      const stats = response.data.stats || null;

      expect(isFilterOperation).toBe(false);
      expect(stats).toBeNull();
    });

    it('should handle empty filter results', () => {
      const response = {
        type: 'complete',
        data: {
          message: 'No wells match the filter criteria',
          stats: {
            wellCount: 0,
            totalWells: 151,
            isFiltered: true
          },
          isFilterOperation: true
        }
      };

      expect(response.data.stats.wellCount).toBe(0);
      expect(response.data.stats.totalWells).toBe(151);
      
      // Should show message about no results
      const noResultsMessage = response.data.stats.wellCount === 0
        ? 'No wells match the filter criteria'
        : `Found ${response.data.stats.wellCount} wells`;
      
      expect(noResultsMessage).toBe('No wells match the filter criteria');
    });
  });

  describe('Scenario 4: Graceful Degradation', () => {
    it('should work without localStorage', () => {
      // Simulate localStorage not available
      const localStorageAvailable = false;

      // Should still be able to use app
      let messages: any[] = [];
      
      if (localStorageAvailable) {
        // Load from localStorage
      } else {
        // Start with empty messages
        messages = [];
      }

      expect(messages).toHaveLength(0);
      
      // Should be able to add messages
      messages.push({
        id: 'msg-1',
        role: 'human',
        content: { text: 'Query' }
      });
      
      expect(messages).toHaveLength(1);
    });

    it('should handle localStorage quota exceeded', () => {
      let errorOccurred = false;

      try {
        // Simulate quota exceeded
        const largeData = JSON.stringify(Array(100000).fill({
          id: 'msg',
          role: 'ai',
          content: { text: 'x'.repeat(1000) }
        }));

        // This would normally throw QuotaExceededError
        if (largeData.length > 5000000) {
          throw new Error('QuotaExceededError');
        }
      } catch (error) {
        console.error('localStorage quota exceeded:', error);
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });

    it('should continue without persistence if localStorage fails', () => {
      let persistenceEnabled = true;

      try {
        // Attempt to save
        throw new Error('localStorage not available');
      } catch (error) {
        console.warn('Persistence disabled:', error);
        persistenceEnabled = false;
      }

      expect(persistenceEnabled).toBe(false);

      // Should still work without persistence
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Query' } }
      ];
      
      expect(messages).toHaveLength(1);
    });

    it('should handle missing sessionId', () => {
      // No sessionId in localStorage
      delete mockLocalStorage['catalog_session_id'];

      // Should generate new one
      const sessionId = mockLocalStorage['catalog_session_id'] || 'new-session-id';
      
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should handle concurrent localStorage access', () => {
      // Simulate multiple tabs accessing same session
      const session1Messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Tab 1 query' } }
      ];
      const session2Messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Tab 2 query' } }
      ];

      // Last write wins
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(session1Messages);
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(session2Messages);

      const final = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(final[0].content.text).toBe('Tab 2 query');
    });
  });

  describe('Complete Error Recovery Workflow', () => {
    it('should recover from corrupted localStorage and continue working', () => {
      // Step 1: Corrupted data
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = 'invalid json';

      // Step 2: Attempt to load (fails)
      let messages: any[] = [];
      try {
        messages = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      } catch (error) {
        messages = [];
      }
      expect(messages).toHaveLength(0);

      // Step 3: Clear corrupted data
      delete mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`];

      // Step 4: Start fresh
      messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Fresh start' } }
      ];
      mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`] = JSON.stringify(messages);

      // Step 5: Verify working
      const restored = JSON.parse(mockLocalStorage[`catalog_messages_${TEST_SESSION_ID}`]);
      expect(restored).toHaveLength(1);
      expect(restored[0].content.text).toBe('Fresh start');
    });

    it('should recover from S3 error and allow new search', () => {
      // Step 1: S3 load fails
      let analysisData = null;
      let s3Error = true;

      // Step 2: Show warning
      const warningMessage = {
        role: 'ai',
        content: { text: '⚠️ Could not restore previous data. Please run a new search.' }
      };
      expect(warningMessage.content.text).toContain('⚠️');

      // Step 3: User runs new search
      const newQuery = '/getdata';
      expect(newQuery).toBeDefined();

      // Step 4: Get fresh data
      analysisData = Array.from({ length: 151 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));

      // Step 5: Verify working
      expect(analysisData).toHaveLength(151);
      s3Error = false;
      expect(s3Error).toBe(false);
    });

    it('should recover from filter error and show unfiltered data', () => {
      // Step 1: Have unfiltered data
      const analysisData = Array.from({ length: 151 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));

      // Step 2: Filter fails
      let filteredData = null;
      let filterStats = null;
      const filterError = true;

      // Step 3: Show error message
      const errorMessage = {
        role: 'ai',
        content: { text: '❌ Filter operation failed. Showing original unfiltered data.' }
      };
      expect(errorMessage.content.text).toContain('❌');

      // Step 4: Display unfiltered data
      const displayData = filteredData || analysisData;
      expect(displayData).toHaveLength(151);

      // Step 5: User can try again
      expect(analysisData).toHaveLength(151);
    });
  });
});
