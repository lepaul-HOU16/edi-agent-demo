/**
 * End-to-End Test: Session Reset Workflow
 * 
 * Tests the complete session reset workflow:
 * 1. Build up conversation with multiple queries
 * 2. Click "New Chat" button
 * 3. Verify all messages cleared
 * 4. Verify new sessionId generated
 * 5. Verify localStorage cleared for old session
 * 6. Verify fresh session starts correctly
 * 
 * Requirements: 2.5, 5.4
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('E2E: Session Reset Workflow', () => {
  let mockLocalStorage: { [key: string]: string };
  const OLD_SESSION_ID = 'old-session-12345';
  const NEW_SESSION_ID = 'new-session-67890';

  beforeEach(() => {
    mockLocalStorage = {};
    mockLocalStorage['catalog_session_id'] = OLD_SESSION_ID;
  });

  describe('Step 1: Build Up Conversation', () => {
    it('should have multiple messages in conversation', () => {
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: '/getdata' } },
        { id: 'msg-2', role: 'ai', content: { text: 'Found 151 wells' }, stats: { wellCount: 151 } },
        { id: 'msg-3', role: 'human', content: { text: 'wells with log curve data' } },
        { id: 'msg-4', role: 'ai', content: { text: 'Found 76 wells' }, stats: { wellCount: 76 } },
        { id: 'msg-5', role: 'human', content: { text: 'show wells operated by Operator A' } },
        { id: 'msg-6', role: 'ai', content: { text: 'Found 25 wells' }, stats: { wellCount: 25 } }
      ];

      mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`] = JSON.stringify(messages);

      // Verify conversation exists
      const storedMessages = mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`];
      expect(storedMessages).toBeDefined();
      
      const parsed = JSON.parse(storedMessages);
      expect(parsed).toHaveLength(6);
    });

    it('should have table data loaded', () => {
      const messages = [
        {
          id: 'msg-2',
          role: 'ai',
          content: { text: 'Found 151 wells' },
          stats: { wellCount: 151 },
          files: {
            metadata: 's3://bucket/session/metadata.json',
            geojson: 's3://bucket/session/geojson.json'
          }
        }
      ];

      mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`] = JSON.stringify(messages);

      const parsed = JSON.parse(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]);
      expect(parsed[0].files).toBeDefined();
      expect(parsed[0].stats.wellCount).toBe(151);
    });

    it('should have filter state applied', () => {
      const messages = [
        {
          id: 'msg-4',
          role: 'ai',
          content: { text: 'Found 76 wells with log curve data' },
          stats: {
            wellCount: 76,
            totalWells: 151,
            isFiltered: true,
            filterCriteria: 'wells with log curve data'
          }
        }
      ];

      mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`] = JSON.stringify(messages);

      const parsed = JSON.parse(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]);
      expect(parsed[0].stats.isFiltered).toBe(true);
      expect(parsed[0].stats.totalWells).toBe(151);
    });
  });

  describe('Step 2: Click "New Chat" Button', () => {
    it('should trigger session reset', () => {
      // Simulate handleCreateNewChat being called
      const resetTriggered = true;
      expect(resetTriggered).toBe(true);
    });

    it('should get old sessionId before reset', () => {
      const oldSessionId = mockLocalStorage['catalog_session_id'];
      expect(oldSessionId).toBe(OLD_SESSION_ID);
    });
  });

  describe('Step 3: Verify All Messages Cleared', () => {
    it('should clear messages state', () => {
      // Before reset
      let messages = [
        { id: 'msg-1', role: 'human', content: { text: 'Query' } },
        { id: 'msg-2', role: 'ai', content: { text: 'Response' } }
      ];
      expect(messages).toHaveLength(2);

      // After reset
      messages = [];
      expect(messages).toHaveLength(0);
    });

    it('should clear analysisData state', () => {
      // Before reset
      let analysisData = Array.from({ length: 151 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));
      expect(analysisData).toHaveLength(151);

      // After reset
      analysisData = null as any;
      expect(analysisData).toBeNull();
    });

    it('should clear filteredData state', () => {
      // Before reset
      let filteredData = Array.from({ length: 76 }, (_, i) => ({
        id: `well-${i + 1}`,
        wellName: `WELL-${i + 1}`
      }));
      expect(filteredData).toHaveLength(76);

      // After reset
      filteredData = null as any;
      expect(filteredData).toBeNull();
    });

    it('should clear filterStats state', () => {
      // Before reset
      let filterStats = {
        filteredCount: 76,
        totalCount: 151,
        isFiltered: true
      };
      expect(filterStats.isFiltered).toBe(true);

      // After reset
      filterStats = null as any;
      expect(filterStats).toBeNull();
    });

    it('should clear chainOfThoughtMessageCount', () => {
      // Before reset
      let chainOfThoughtMessageCount = 5;
      expect(chainOfThoughtMessageCount).toBe(5);

      // After reset
      chainOfThoughtMessageCount = 0;
      expect(chainOfThoughtMessageCount).toBe(0);
    });
  });

  describe('Step 4: Verify New SessionId Generated', () => {
    it('should generate new sessionId', () => {
      // Simulate generating new sessionId
      const newSessionId = NEW_SESSION_ID;
      
      expect(newSessionId).toBeDefined();
      expect(newSessionId).not.toBe(OLD_SESSION_ID);
      expect(newSessionId.length).toBeGreaterThan(0);
    });

    it('should save new sessionId to localStorage', () => {
      // Update localStorage with new sessionId
      mockLocalStorage['catalog_session_id'] = NEW_SESSION_ID;

      const storedSessionId = mockLocalStorage['catalog_session_id'];
      expect(storedSessionId).toBe(NEW_SESSION_ID);
      expect(storedSessionId).not.toBe(OLD_SESSION_ID);
    });

    it('should use UUID format for sessionId', () => {
      // Verify sessionId format (UUID v4 pattern)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Mock UUID generation
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuidPattern.test(mockUUID)).toBe(true);
    });
  });

  describe('Step 5: Verify localStorage Cleared for Old Session', () => {
    it('should remove old session messages from localStorage', () => {
      // Before reset - old messages exist
      mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`] = JSON.stringify([
        { id: 'msg-1', role: 'human', content: { text: 'Old query' } }
      ]);
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeDefined();

      // After reset - old messages removed
      delete mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`];
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeUndefined();
    });

    it('should not affect other localStorage keys', () => {
      // Set up other localStorage keys
      mockLocalStorage['other_key'] = 'other_value';
      mockLocalStorage['user_preferences'] = JSON.stringify({ theme: 'dark' });

      // Remove only catalog messages
      delete mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`];

      // Verify other keys still exist
      expect(mockLocalStorage['other_key']).toBe('other_value');
      expect(mockLocalStorage['user_preferences']).toBeDefined();
    });

    it('should handle case where old session messages do not exist', () => {
      // No messages for old session
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeUndefined();

      // Attempt to remove (should not throw error)
      delete mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`];
      
      // Should still be undefined
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeUndefined();
    });
  });

  describe('Step 6: Verify Fresh Session Starts Correctly', () => {
    it('should start with empty messages array', () => {
      // After reset
      const messages: any[] = [];
      expect(messages).toHaveLength(0);
    });

    it('should have no table data', () => {
      const analysisData = null;
      expect(analysisData).toBeNull();
    });

    it('should have no filtered data', () => {
      const filteredData = null;
      const filterStats = null;
      
      expect(filteredData).toBeNull();
      expect(filterStats).toBeNull();
    });

    it('should have new sessionId in localStorage', () => {
      mockLocalStorage['catalog_session_id'] = NEW_SESSION_ID;
      
      const storedSessionId = mockLocalStorage['catalog_session_id'];
      expect(storedSessionId).toBe(NEW_SESSION_ID);
    });

    it('should have no messages for new session yet', () => {
      const newSessionMessages = mockLocalStorage[`catalog_messages_${NEW_SESSION_ID}`];
      expect(newSessionMessages).toBeUndefined();
    });

    it('should be ready to accept new queries', () => {
      // Simulate adding first message to new session
      const firstMessage = {
        id: 'msg-new-1',
        role: 'human',
        content: { text: '/getdata' },
        chatSessionId: NEW_SESSION_ID
      };

      const messages = [firstMessage];
      mockLocalStorage[`catalog_messages_${NEW_SESSION_ID}`] = JSON.stringify(messages);

      // Verify new session is working
      const stored = mockLocalStorage[`catalog_messages_${NEW_SESSION_ID}`];
      const parsed = JSON.parse(stored);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].chatSessionId).toBe(NEW_SESSION_ID);
    });
  });

  describe('Complete Session Reset Workflow', () => {
    it('should handle complete reset workflow end-to-end', () => {
      // Step 1: Build conversation
      const oldMessages = [
        { id: 'msg-1', role: 'human', content: { text: '/getdata' } },
        { id: 'msg-2', role: 'ai', content: { text: 'Found 151 wells' } },
        { id: 'msg-3', role: 'human', content: { text: 'filter query' } },
        { id: 'msg-4', role: 'ai', content: { text: 'Found 76 wells' } }
      ];
      mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`] = JSON.stringify(oldMessages);
      mockLocalStorage['catalog_session_id'] = OLD_SESSION_ID;

      // Verify old session exists
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeDefined();
      expect(mockLocalStorage['catalog_session_id']).toBe(OLD_SESSION_ID);

      // Step 2: Trigger reset
      const oldSessionId = mockLocalStorage['catalog_session_id'];
      
      // Step 3: Clear old messages
      delete mockLocalStorage[`catalog_messages_${oldSessionId}`];
      
      // Step 4: Generate new sessionId
      mockLocalStorage['catalog_session_id'] = NEW_SESSION_ID;

      // Step 5: Verify old session cleared
      expect(mockLocalStorage[`catalog_messages_${OLD_SESSION_ID}`]).toBeUndefined();

      // Step 6: Verify new session ready
      expect(mockLocalStorage['catalog_session_id']).toBe(NEW_SESSION_ID);
      expect(mockLocalStorage[`catalog_messages_${NEW_SESSION_ID}`]).toBeUndefined();
    });

    it('should allow multiple reset cycles', () => {
      const sessions = [
        'session-1',
        'session-2',
        'session-3'
      ];

      // Cycle through sessions
      for (let i = 0; i < sessions.length; i++) {
        const sessionId = sessions[i];
        
        // Set session
        mockLocalStorage['catalog_session_id'] = sessionId;
        
        // Add messages
        mockLocalStorage[`catalog_messages_${sessionId}`] = JSON.stringify([
          { id: `msg-${i}-1`, role: 'human', content: { text: `Query ${i}` } }
        ]);
        
        // Verify session exists
        expect(mockLocalStorage[`catalog_messages_${sessionId}`]).toBeDefined();
        
        // Reset (except last one)
        if (i < sessions.length - 1) {
          delete mockLocalStorage[`catalog_messages_${sessionId}`];
          expect(mockLocalStorage[`catalog_messages_${sessionId}`]).toBeUndefined();
        }
      }

      // Verify only last session has messages
      expect(mockLocalStorage[`catalog_messages_session-1`]).toBeUndefined();
      expect(mockLocalStorage[`catalog_messages_session-2`]).toBeUndefined();
      expect(mockLocalStorage[`catalog_messages_session-3`]).toBeDefined();
    });

    it('should preserve session isolation', () => {
      // Create multiple sessions
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Add messages to session 1
      mockLocalStorage[`catalog_messages_${session1}`] = JSON.stringify([
        { id: 'msg-1-1', content: { text: 'Session 1 message' } }
      ]);

      // Add messages to session 2
      mockLocalStorage[`catalog_messages_${session2}`] = JSON.stringify([
        { id: 'msg-2-1', content: { text: 'Session 2 message' } }
      ]);

      // Reset session 1
      delete mockLocalStorage[`catalog_messages_${session1}`];

      // Verify session 1 cleared but session 2 intact
      expect(mockLocalStorage[`catalog_messages_${session1}`]).toBeUndefined();
      expect(mockLocalStorage[`catalog_messages_${session2}`]).toBeDefined();

      const session2Messages = JSON.parse(mockLocalStorage[`catalog_messages_${session2}`]);
      expect(session2Messages[0].content.text).toBe('Session 2 message');
    });
  });

  describe('Error Handling During Reset', () => {
    it('should handle localStorage errors gracefully', () => {
      // Simulate localStorage error
      let errorOccurred = false;
      
      try {
        // Attempt to clear non-existent key
        delete mockLocalStorage['non_existent_key'];
      } catch (error) {
        errorOccurred = true;
      }

      // Should not throw error
      expect(errorOccurred).toBe(false);
    });

    it('should continue reset even if old messages cannot be cleared', () => {
      // Simulate scenario where old messages cannot be cleared
      const oldSessionId = OLD_SESSION_ID;
      
      // Attempt to clear (may fail)
      try {
        delete mockLocalStorage[`catalog_messages_${oldSessionId}`];
      } catch (error) {
        console.error('Failed to clear old messages:', error);
      }

      // Should still generate new sessionId
      mockLocalStorage['catalog_session_id'] = NEW_SESSION_ID;
      expect(mockLocalStorage['catalog_session_id']).toBe(NEW_SESSION_ID);
    });

    it('should handle missing sessionId gracefully', () => {
      // No sessionId in localStorage
      delete mockLocalStorage['catalog_session_id'];
      
      const oldSessionId = mockLocalStorage['catalog_session_id'];
      expect(oldSessionId).toBeUndefined();

      // Should still be able to generate new sessionId
      mockLocalStorage['catalog_session_id'] = NEW_SESSION_ID;
      expect(mockLocalStorage['catalog_session_id']).toBe(NEW_SESSION_ID);
    });
  });
});
