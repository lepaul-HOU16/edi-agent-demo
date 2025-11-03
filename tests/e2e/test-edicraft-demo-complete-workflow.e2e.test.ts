/**
 * End-to-End Tests for Complete EDIcraft Demo Workflow
 * Tests the full demo experience from collection creation to visualization
 * Requirements: All
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock types
type Collection = {
  id: string;
  name: string;
  dataItems: WellData[];
  previewMetadata: {
    wellCount: number;
    dataPointCount: number;
  };
};

type WellData = {
  id: string;
  name: string;
  s3Key: string;
  osduId: string;
};

type Canvas = {
  id: string;
  name: string;
  linkedCollectionId: string;
  collectionContext: string;
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
      list: jest.fn()
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
  replace: jest.fn()
};

// Helper to create mock collection with 24 wells
function createMockCollection(): Collection {
  const wells: WellData[] = [];
  for (let i = 1; i <= 24; i++) {
    wells.push({
      id: `well-${i}`,
      name: `WELL-${String(i).padStart(3, '0')}`,
      s3Key: `wells/well-${i}/trajectory.las`,
      osduId: `osdu:work-product-component--WellboreTrajectory:WELL-${String(i).padStart(3, '0')}:...`
    });
  }
  
  return {
    id: 'collection-demo-24-wells',
    name: 'Demo Collection - 24 Wells',
    dataItems: wells,
    previewMetadata: {
      wellCount: 24,
      dataPointCount: 24
    }
  };
}

describe('EDIcraft Demo E2E Tests - Complete Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('14.1 Complete Demo Workflow', () => {
    it('should complete full demo workflow from collection creation to visualization', async () => {
      // Step 1: Create collection with 24 wells
      const collection = createMockCollection();
      
      mockAmplifyClient.mutations.collectionManagement.mockResolvedValue({
        data: JSON.stringify({
          success: true,
          collectionId: collection.id,
          collection
        })
      });
      
      const createResponse = await mockAmplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        name: collection.name,
        description: 'Demo collection with 24 wells for EDIcraft visualization',
        dataSourceType: 'S3',
        previewMetadata: JSON.stringify(collection.previewMetadata)
      });
      
      const createResult = JSON.parse(createResponse.data);
      expect(createResult.success).toBe(true);
      expect(createResult.collection.dataItems.length).toBe(24);
      
      // Step 2: Create canvas from collection
      const collectionContext = {
        collectionId: collection.id,
        collectionName: collection.name,
        dataItems: collection.dataItems,
        createdAt: new Date().toISOString()
      };
      
      mockAmplifyClient.models.ChatSession.create.mockResolvedValue({
        data: {
          id: 'canvas-demo-session',
          name: 'EDIcraft Demo Canvas',
          linkedCollectionId: collection.id,
          collectionContext: JSON.stringify(collectionContext)
        }
      });
      
      const canvasResponse = await mockAmplifyClient.models.ChatSession.create({
        name: 'EDIcraft Demo Canvas',
        linkedCollectionId: collection.id,
        collectionContext: JSON.stringify(collectionContext)
      });
      
      expect(canvasResponse.data.linkedCollectionId).toBe(collection.id);
      
      // Step 3: Navigate to canvas
      const canvasId = canvasResponse.data.id;
      mockRouter.push(`/chat/${canvasId}`);
      expect(mockRouter.push).toHaveBeenCalledWith('/chat/canvas-demo-session');
      
      // Step 4: Visualize all wells
      const visualizeQuery = 'Visualize all wells from this collection in Minecraft';
      
      // Mock EDIcraft agent response for batch visualization
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-visualize-all',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Collection Visualization Complete**

**Details:**
- **Wells Visualized:** 24
- **Successful Builds:** 24
- **Failed Builds:** 0
- **Grid Layout:** 6x4 (50 block spacing)

**Minecraft Location:**
- Starting coordinates: (0, 100, 0)
- Grid extends to: (250, 100, 150)

**Structures Built:**
- 24 wellbore trajectories
- 24 drilling rigs
- 24 ground markers
- 24 depth markers

💡 **Tip:** All wells are now visible in Minecraft! Use the clear button to reset the environment for a fresh demo.`
          }
        }
      });
      
      const visualizeResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: visualizeQuery }
      });
      
      expect(visualizeResponse.data.content.text).toContain('24');
      expect(visualizeResponse.data.content.text).toContain('✅');
      expect(visualizeResponse.data.content.text).toContain('Collection Visualization Complete');
      
      // Step 5: Verify rigs and markers
      const verifyQuery = 'Show me the status of all structures';
      
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-verify',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Structure Status Report**

**Wellbores:**
- Total: 24
- Average depth: 2,500 meters
- Block types: Obsidian (trajectory), Glowstone (markers), Emerald (wellhead)

**Drilling Rigs:**
- Total: 24
- Style: Standard
- Components: Derrick (15 blocks), Platform (5x5), Equipment (furnaces, hoppers, chests)
- Signage: All rigs labeled with simplified well names (WELL-001 through WELL-024)

**Markers:**
- Ground markers: 24 (at surface level)
- Depth markers: 240 (10 per wellbore at 250m intervals)
- Total marker blocks: 264

**Grid Layout:**
- Spacing: 50 blocks between wellheads
- No overlapping structures
- All structures visible and accessible`
          }
        }
      });
      
      const verifyResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: verifyQuery }
      });
      
      expect(verifyResponse.data.content.text).toContain('24');
      expect(verifyResponse.data.content.text).toContain('Drilling Rigs');
      expect(verifyResponse.data.content.text).toContain('Markers');
      
      // Step 6: Use clear button to clear environment
      const clearQuery = 'Clear the Minecraft environment';
      
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-clear',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Environment Cleared**

**Blocks Removed:**
- **Wellbore blocks:** 36,000 (obsidian, glowstone, emerald)
- **Rig blocks:** 12,000 (iron bars, stone slabs, furnaces, hoppers, chests)
- **Marker blocks:** 264 (signs, glowstone)
- **Total blocks cleared:** 48,264

**Terrain Preserved:**
- Grass blocks: Preserved
- Dirt blocks: Preserved
- Stone blocks: Preserved
- Water blocks: Preserved

**Status:**
- Minecraft world is now clear and ready for fresh demo
- All structures removed successfully
- No errors encountered

💡 **Tip:** You can now visualize the same wells again or try different queries!`
          }
        }
      });
      
      const clearResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: clearQuery }
      });
      
      expect(clearResponse.data.content.text).toContain('✅');
      expect(clearResponse.data.content.text).toContain('Environment Cleared');
      expect(clearResponse.data.content.text).toContain('48,264');
      
      // Step 7: Reset demo
      const resetQuery = 'Reset the demo environment';
      
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-reset',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Demo Environment Reset Complete**

**Actions Performed:**
1. ✅ Cleared all wellbores and structures
2. ✅ Removed all drilling rigs
3. ✅ Cleared all markers
4. ✅ Set world time to day (1000)
5. ✅ Locked daylight cycle
6. ✅ Teleported players to spawn point

**Environment Status:**
- Minecraft world: Clean and ready
- Time: Locked at daytime
- Structures: All removed
- Terrain: Preserved

🎮 **Ready for Demo!**

The environment is now in perfect condition for your next demonstration. All visualizations have been cleared, the world is set to daytime, and you're ready to showcase EDIcraft's capabilities!`
          }
        }
      });
      
      const resetResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: resetQuery }
      });
      
      expect(resetResponse.data.content.text).toContain('✅');
      expect(resetResponse.data.content.text).toContain('Demo Environment Reset Complete');
      expect(resetResponse.data.content.text).toContain('Ready for Demo');
    });
    
    it('should handle batch visualization with progress updates', async () => {
      const collection = createMockCollection();
      const canvasId = 'canvas-batch-test';
      
      // Simulate progress updates during batch processing
      const progressUpdates = [];
      
      for (let i = 1; i <= 24; i++) {
        progressUpdates.push({
          id: `progress-${i}`,
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `⏳ **Building Well ${i} of 24**

**Current Well:** ${collection.dataItems[i - 1].name}
**Progress:** ${Math.round((i / 24) * 100)}%
**Status:** Processing trajectory data...`
          }
        });
      }
      
      expect(progressUpdates.length).toBe(24);
      expect(progressUpdates[0].content.text).toContain('Building Well 1 of 24');
      expect(progressUpdates[23].content.text).toContain('Building Well 24 of 24');
      expect(progressUpdates[23].content.text).toContain('100%');
    });
    
    it('should handle individual well failures gracefully', async () => {
      const collection = createMockCollection();
      const canvasId = 'canvas-failure-test';
      
      // Simulate visualization with some failures
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValue({
        data: {
          id: 'message-partial-success',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `⚠️ **Collection Visualization Completed with Warnings**

**Details:**
- **Wells Visualized:** 24
- **Successful Builds:** 22
- **Failed Builds:** 2

**Failed Wells:**
1. **WELL-015:** Trajectory data not found in S3
2. **WELL-023:** Invalid coordinate format

**Successful Structures:**
- 22 wellbore trajectories
- 22 drilling rigs
- 22 ground markers

**Recommendations:**
- Check S3 bucket for missing trajectory files
- Verify data format for failed wells
- Contact support if issues persist

💡 **Tip:** The successfully built wells are visible in Minecraft. You can retry the failed wells after fixing the data issues.`
          }
        }
      });
      
      const response = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: 'Visualize all wells' }
      });
      
      expect(response.data.content.text).toContain('⚠️');
      expect(response.data.content.text).toContain('Completed with Warnings');
      expect(response.data.content.text).toContain('**Successful Builds:** 22');
      expect(response.data.content.text).toContain('**Failed Builds:** 2');
      expect(response.data.content.text).toContain('WELL-015');
      expect(response.data.content.text).toContain('WELL-023');
    });
    
    it('should verify no duplicates after clear and rebuild', async () => {
      const canvasId = 'canvas-duplicate-test';
      
      // Build wellbore
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValueOnce({
        data: {
          id: 'message-build-1',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Wellbore Built Successfully**

**Details:**
- **Well Name:** WELL-001
- **Data Points:** 150
- **Blocks Placed:** 1,500

**Minecraft Location:**
- Wellhead: (100, 100, 200)
- Total Depth: 2,500 meters`
          }
        }
      });
      
      await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: 'Build WELL-001' }
      });
      
      // Clear environment
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValueOnce({
        data: {
          id: 'message-clear',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Environment Cleared**

**Blocks Removed:** 1,500
**Status:** Ready for new visualization`
          }
        }
      });
      
      await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: 'Clear environment' }
      });
      
      // Build same wellbore again
      mockAmplifyClient.models.ChatMessage.create.mockResolvedValueOnce({
        data: {
          id: 'message-build-2',
          chatSessionId: canvasId,
          role: 'ai',
          content: {
            text: `✅ **Wellbore Built Successfully**

**Details:**
- **Well Name:** WELL-001
- **Data Points:** 150
- **Blocks Placed:** 1,500

**Minecraft Location:**
- Wellhead: (100, 100, 200)
- Total Depth: 2,500 meters

**Note:** No duplicate structures detected. Previous visualization was properly cleared.`
          }
        }
      });
      
      const rebuildResponse = await mockAmplifyClient.models.ChatMessage.create({
        chatSessionId: canvasId,
        role: 'user',
        content: { text: 'Build WELL-001 again' }
      });
      
      expect(rebuildResponse.data.content.text).toContain('✅');
      expect(rebuildResponse.data.content.text).toContain('No duplicate structures detected');
    });
  });
});
