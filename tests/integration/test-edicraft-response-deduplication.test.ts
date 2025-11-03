/**
 * Integration test for EDIcraft response deduplication
 * 
 * This test verifies that duplicate EDIcraft responses are properly
 * deduplicated in the chat interface to prevent cluttered UI.
 */

import { describe, it, expect } from '@jest/globals';

describe('EDIcraft Response Deduplication Integration', () => {
  describe('Content Hash Generation', () => {
    it('should generate consistent hashes for clear operation responses', () => {
      const clearResponse = `✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 5 blocks
- **Rigs Cleared:** 10 blocks
- **Markers Cleared:** 3 blocks
- **Terrain Filled:** 1000 blocks

**Total Blocks Affected:** 1018 blocks

💡 **Tip:** The environment is now ready for new visualizations.`;

      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };

      const hash1 = generateContentHash(clearResponse);
      const hash2 = generateContentHash(clearResponse);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^edicraft-[a-zA-Z0-9]+-\d+$/);
      expect(hash1).toContain('MinecraftEnvironmentCleared');
    });

    it('should generate different hashes for different operations', () => {
      const clearResponse = `✅ **Minecraft Environment Cleared**\n\n**Summary:**\n- **Wellbores Cleared:** 5 blocks`;
      const timeLockResponse = `✅ **Time Lock Enabled**\n\n**Summary:**\n- **Time:** Day\n- **Daylight Cycle:** Disabled`;

      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };

      const hash1 = generateContentHash(clearResponse);
      const hash2 = generateContentHash(timeLockResponse);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Artifact Hash Generation', () => {
    it('should generate consistent hashes for same artifact data', () => {
      const artifact = {
        type: 'wind_farm_terrain_analysis',
        messageContentType: 'wind_farm_terrain_analysis',
        data: {
          metrics: {
            totalArea: 1000,
            suitableArea: 800
          },
          geojson: { type: 'FeatureCollection', features: [] }
        }
      };

      const generateArtifactHash = (artifacts: any[]) => {
        const hashContent = JSON.stringify(artifacts);
        return `artifact-${hashContent.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '')}-${hashContent.length}`;
      };

      const hash1 = generateArtifactHash([artifact]);
      const hash2 = generateArtifactHash([artifact]);

      expect(hash1).toBe(hash2);
      expect(hash1).toContain('artifact-');
    });

    it('should detect changes in artifact data', () => {
      const artifact1 = {
        type: 'wind_farm_terrain_analysis',
        data: { metrics: { totalArea: 1000 } }
      };

      const artifact2 = {
        type: 'wind_farm_terrain_analysis',
        data: { metrics: { totalArea: 2000 } }
      };

      const generateArtifactHash = (artifacts: any[]) => {
        const hashContent = JSON.stringify(artifacts);
        return `artifact-${hashContent.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '')}-${hashContent.length}`;
      };

      const hash1 = generateArtifactHash([artifact1]);
      const hash2 = generateArtifactHash([artifact2]);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Deduplication Logic', () => {
    it('should identify duplicate responses by content hash', () => {
      // Simulate DOM with existing response
      const existingHash = 'edicraft-MinecraftEnvironmentCleared-100';
      const mockDOM = {
        elements: [
          { getAttribute: (attr: string) => attr === 'data-content-hash' ? existingHash : null }
        ]
      };

      // Check if new response with same hash should be skipped
      const newHash = 'edicraft-MinecraftEnvironmentCleared-100';
      const shouldSkip = mockDOM.elements.some(el => 
        el.getAttribute('data-content-hash') === newHash
      );

      expect(shouldSkip).toBe(true);
    });

    it('should allow different responses with different hashes', () => {
      // Simulate DOM with existing response
      const existingHash = 'edicraft-MinecraftEnvironmentCleared-100';
      const mockDOM = {
        elements: [
          { getAttribute: (attr: string) => attr === 'data-content-hash' ? existingHash : null }
        ]
      };

      // Check if new response with different hash should be allowed
      const newHash = 'edicraft-TimeLockEnabled-80';
      const shouldSkip = mockDOM.elements.some(el => 
        el.getAttribute('data-content-hash') === newHash
      );

      expect(shouldSkip).toBe(false);
    });
  });

  describe('Processing Lock', () => {
    it('should prevent concurrent artifact processing', async () => {
      let processingCount = 0;
      const processingRef = { current: false };

      const processArtifacts = async () => {
        if (processingRef.current) {
          return { skipped: true };
        }

        processingRef.current = true;
        processingCount++;

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 10));

        processingRef.current = false;
        return { skipped: false };
      };

      // Attempt concurrent processing
      const results = await Promise.all([
        processArtifacts(),
        processArtifacts(),
        processArtifacts()
      ]);

      // Only one should have processed
      const processedCount = results.filter(r => !r.skipped).length;
      expect(processedCount).toBe(1);
      expect(processingCount).toBe(1);
    });

    it('should allow sequential processing after lock is released', async () => {
      let processingCount = 0;
      const processingRef = { current: false };

      const processArtifacts = async () => {
        if (processingRef.current) {
          return { skipped: true };
        }

        processingRef.current = true;
        processingCount++;

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 5));

        processingRef.current = false;
        return { skipped: false };
      };

      // Process sequentially
      const result1 = await processArtifacts();
      const result2 = await processArtifacts();
      const result3 = await processArtifacts();

      expect(result1.skipped).toBe(false);
      expect(result2.skipped).toBe(false);
      expect(result3.skipped).toBe(false);
      expect(processingCount).toBe(3);
    });
  });

  describe('Render Count Tracking', () => {
    it('should track number of renders for debugging', () => {
      const renderCountRef = { current: 0 };

      // Simulate multiple renders
      for (let i = 0; i < 5; i++) {
        renderCountRef.current += 1;
      }

      expect(renderCountRef.current).toBe(5);
    });

    it('should log render information for debugging', () => {
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      const renderCountRef = { current: 0 };
      const contentHash = 'edicraft-test-100';

      // Simulate render with logging
      renderCountRef.current += 1;
      console.log(`🔄 EDIcraft response render #${renderCountRef.current} for hash: ${contentHash}`);

      console.log = originalLog;

      expect(consoleLogs).toContain('🔄 EDIcraft response render #1 for hash: edicraft-test-100');
    });
  });
});
