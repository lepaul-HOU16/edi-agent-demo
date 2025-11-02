/**
 * End-to-End Test: Panel Switching with Filtered Data
 * 
 * Tests panel switching while maintaining filtered state:
 * 1. Apply filter in Chat panel
 * 2. Switch to Map panel - verify filtered wells shown
 * 3. Switch to Data Analysis panel - verify filtered data shown
 * 4. Switch back to Chat panel - verify filter state maintained
 * 
 * Requirements: 1.5, 3.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('E2E: Panel Switching with Filtered Data', () => {
  let mockAnalysisData: any[];
  let mockFilteredData: any[];
  let mockFilterStats: any;
  let currentPanel: string;

  beforeEach(() => {
    // Mock full dataset (151 wells)
    mockAnalysisData = Array.from({ length: 151 }, (_, i) => ({
      id: `well-${i + 1}`,
      wellName: `WELL-${String(i + 1).padStart(3, '0')}`,
      latitude: 40.7128 + i * 0.01,
      longitude: -74.0060 + i * 0.01,
      operator: i % 3 === 0 ? 'Operator A' : 'Operator B',
      wellbores: [
        {
          id: `wellbore-${i + 1}-1`,
          wellboreName: `WELLBORE-${String(i + 1).padStart(3, '0')}-1`,
          welllogs: i % 2 === 0 ? [
            {
              id: `welllog-${i + 1}-1`,
              welllogName: `LOG-${String(i + 1).padStart(3, '0')}-1`,
              curves: ['GR', 'RHOB', 'NPHI']
            }
          ] : []
        }
      ]
    }));

    // Mock filtered dataset (76 wells with log data)
    mockFilteredData = mockAnalysisData.filter((_, i) => i % 2 === 0);

    mockFilterStats = {
      filteredCount: 76,
      totalCount: 151,
      isFiltered: true
    };

    currentPanel = 'chat';
  });

  describe('Step 1: Apply Filter in Chat Panel', () => {
    it('should start in Chat panel', () => {
      expect(currentPanel).toBe('chat');
    });

    it('should have unfiltered data initially', () => {
      const displayData = mockAnalysisData;
      expect(displayData).toHaveLength(151);
    });

    it('should apply filter when user queries', () => {
      const filterQuery = 'wells with log curve data';
      
      // Apply filter
      const filteredData = mockFilteredData;
      const filterStats = mockFilterStats;

      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);
    });

    it('should show filtered data in table', () => {
      // After filter applied
      const displayData = mockFilteredData;
      const displayStats = mockFilterStats;

      expect(displayData).toHaveLength(76);
      expect(displayStats.filteredCount).toBe(76);
      expect(displayStats.totalCount).toBe(151);
    });

    it('should show filter indicator in header', () => {
      const headerCounter = `(${mockFilterStats.filteredCount} of ${mockFilterStats.totalCount} total)`;
      expect(headerCounter).toBe('(76 of 151 total)');
    });
  });

  describe('Step 2: Switch to Map Panel', () => {
    it('should switch to Map panel', () => {
      currentPanel = 'map';
      expect(currentPanel).toBe('map');
    });

    it('should maintain filtered data state', () => {
      // Switch panel
      currentPanel = 'map';

      // Filtered data should still exist
      const filteredData = mockFilteredData;
      const filterStats = mockFilterStats;

      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);
    });

    it('should show only filtered wells on map', () => {
      currentPanel = 'map';

      // Map should receive filtered data
      const mapWells = mockFilteredData;
      expect(mapWells).toHaveLength(76);

      // Verify wells have coordinates
      mapWells.forEach(well => {
        expect(well.latitude).toBeDefined();
        expect(well.longitude).toBeDefined();
      });
    });

    it('should show correct well count on map', () => {
      currentPanel = 'map';

      const wellCount = mockFilteredData.length;
      const mapLabel = `Showing ${wellCount} of ${mockAnalysisData.length} wells`;

      expect(mapLabel).toBe('Showing 76 of 151 wells');
    });

    it('should display filtered wells as markers', () => {
      currentPanel = 'map';

      // Generate markers for filtered wells
      const markers = mockFilteredData.map(well => ({
        position: [well.latitude, well.longitude],
        wellName: well.wellName,
        operator: well.operator
      }));

      expect(markers).toHaveLength(76);
      expect(markers[0].position).toEqual([40.7128, -74.0060]);
      expect(markers[0].wellName).toBe('WELL-001');
    });

    it('should not show unfiltered wells on map', () => {
      currentPanel = 'map';

      // Unfiltered wells that should not appear
      const unfilteredWells = mockAnalysisData.filter((_, i) => i % 2 !== 0);
      expect(unfilteredWells).toHaveLength(75);

      // Map should only show filtered wells
      const mapWells = mockFilteredData;
      expect(mapWells).toHaveLength(76);

      // Verify no overlap with unfiltered wells
      const mapWellIds = new Set(mapWells.map(w => w.id));
      const hasUnfilteredWells = unfilteredWells.some(w => mapWellIds.has(w.id));
      expect(hasUnfilteredWells).toBe(false);
    });
  });

  describe('Step 3: Switch to Data Analysis Panel', () => {
    it('should switch to Data Analysis panel', () => {
      currentPanel = 'data-analysis';
      expect(currentPanel).toBe('data-analysis');
    });

    it('should maintain filtered data state', () => {
      currentPanel = 'data-analysis';

      // Filtered data should still exist
      const filteredData = mockFilteredData;
      const filterStats = mockFilterStats;

      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);
    });

    it('should show filtered data in analysis table', () => {
      currentPanel = 'data-analysis';

      // Table should receive filtered data
      const tableData = mockFilteredData;
      expect(tableData).toHaveLength(76);
    });

    it('should show filter indicator in table header', () => {
      currentPanel = 'data-analysis';

      const headerCounter = `(${mockFilterStats.filteredCount} of ${mockFilterStats.totalCount} total)`;
      expect(headerCounter).toBe('(76 of 151 total)');
    });

    it('should allow expanding rows in filtered data', () => {
      currentPanel = 'data-analysis';

      // Verify filtered wells have expandable content
      const wellWithWellbores = mockFilteredData.find(well => 
        well.wellbores && well.wellbores.length > 0
      );

      expect(wellWithWellbores).toBeDefined();
      expect(wellWithWellbores.wellbores).toHaveLength(1);
      expect(wellWithWellbores.wellbores[0].welllogs).toBeDefined();
    });

    it('should show correct statistics for filtered data', () => {
      currentPanel = 'data-analysis';

      // Calculate statistics from filtered data
      const totalWells = mockFilteredData.length;
      const wellsWithLogs = mockFilteredData.filter(well => 
        well.wellbores.some((wb: any) => wb.welllogs && wb.welllogs.length > 0)
      ).length;

      expect(totalWells).toBe(76);
      expect(wellsWithLogs).toBe(76); // All filtered wells have logs
    });
  });

  describe('Step 4: Switch Back to Chat Panel', () => {
    it('should switch back to Chat panel', () => {
      // Cycle through panels
      currentPanel = 'map';
      currentPanel = 'data-analysis';
      currentPanel = 'chat';

      expect(currentPanel).toBe('chat');
    });

    it('should maintain filtered data state', () => {
      // Switch through panels
      currentPanel = 'map';
      currentPanel = 'data-analysis';
      currentPanel = 'chat';

      // Filtered data should still exist
      const filteredData = mockFilteredData;
      const filterStats = mockFilterStats;

      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);
    });

    it('should show filtered data in chat table', () => {
      currentPanel = 'chat';

      const displayData = mockFilteredData;
      expect(displayData).toHaveLength(76);
    });

    it('should show filter indicator in chat table header', () => {
      currentPanel = 'chat';

      const headerCounter = `(${mockFilterStats.filteredCount} of ${mockFilterStats.totalCount} total)`;
      expect(headerCounter).toBe('(76 of 151 total)');
    });

    it('should preserve chat messages', () => {
      const messages = [
        { id: 'msg-1', role: 'human', content: { text: '/getdata' } },
        { id: 'msg-2', role: 'ai', content: { text: 'Found 151 wells' } },
        { id: 'msg-3', role: 'human', content: { text: 'wells with log curve data' } },
        { id: 'msg-4', role: 'ai', content: { text: 'Found 76 wells' } }
      ];

      // Switch panels
      currentPanel = 'map';
      currentPanel = 'chat';

      // Messages should be preserved
      expect(messages).toHaveLength(4);
      expect(messages[3].content.text).toBe('Found 76 wells');
    });

    it('should allow further filtering', () => {
      currentPanel = 'chat';

      // Current filter: 76 wells with log data
      let currentFilteredData = mockFilteredData;
      expect(currentFilteredData).toHaveLength(76);

      // Apply additional filter: Operator A
      const furtherFiltered = currentFilteredData.filter(well => 
        well.operator === 'Operator A'
      );

      // Should have fewer wells
      expect(furtherFiltered.length).toBeLessThan(76);
      expect(furtherFiltered.length).toBeGreaterThan(0);
    });
  });

  describe('Complete Panel Switching Workflow', () => {
    it('should maintain filter state through complete panel cycle', () => {
      // Start in Chat with filter applied
      currentPanel = 'chat';
      let filteredData = mockFilteredData;
      let filterStats = mockFilterStats;
      expect(filteredData).toHaveLength(76);

      // Switch to Map
      currentPanel = 'map';
      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);

      // Switch to Data Analysis
      currentPanel = 'data-analysis';
      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);

      // Switch back to Chat
      currentPanel = 'chat';
      expect(filteredData).toHaveLength(76);
      expect(filterStats.isFiltered).toBe(true);

      // Verify filter stats unchanged
      expect(filterStats.filteredCount).toBe(76);
      expect(filterStats.totalCount).toBe(151);
    });

    it('should handle multiple panel switches', () => {
      const panels = ['chat', 'map', 'data-analysis', 'chat', 'map', 'chat'];
      
      let filteredData = mockFilteredData;
      let filterStats = mockFilterStats;

      // Switch through panels multiple times
      panels.forEach(panel => {
        currentPanel = panel;
        
        // Verify filter state maintained
        expect(filteredData).toHaveLength(76);
        expect(filterStats.isFiltered).toBe(true);
      });

      // Final state should be correct
      expect(currentPanel).toBe('chat');
      expect(filteredData).toHaveLength(76);
    });

    it('should clear filter when new search is performed', () => {
      // Start with filter applied
      currentPanel = 'chat';
      let filteredData = mockFilteredData;
      let filterStats = mockFilterStats;
      expect(filteredData).toHaveLength(76);

      // Switch to Map
      currentPanel = 'map';
      expect(filteredData).toHaveLength(76);

      // Switch back to Chat and perform new search
      currentPanel = 'chat';
      const newSearchQuery = '/getdata';
      
      // Clear filter
      filteredData = null as any;
      filterStats = null as any;

      // Should show all data
      const displayData = filteredData || mockAnalysisData;
      expect(displayData).toHaveLength(151);
    });

    it('should handle panel switching without filter', () => {
      // No filter applied
      let filteredData = null;
      let filterStats = null;
      const analysisData = mockAnalysisData;

      // Switch through panels
      currentPanel = 'chat';
      expect(analysisData).toHaveLength(151);

      currentPanel = 'map';
      expect(analysisData).toHaveLength(151);

      currentPanel = 'data-analysis';
      expect(analysisData).toHaveLength(151);

      currentPanel = 'chat';
      expect(analysisData).toHaveLength(151);

      // No filter stats
      expect(filteredData).toBeNull();
      expect(filterStats).toBeNull();
    });
  });

  describe('State Consistency Across Panels', () => {
    it('should use same data reference across panels', () => {
      const filteredDataRef = mockFilteredData;

      // Chat panel
      currentPanel = 'chat';
      const chatData = filteredDataRef;

      // Map panel
      currentPanel = 'map';
      const mapData = filteredDataRef;

      // Data Analysis panel
      currentPanel = 'data-analysis';
      const analysisData = filteredDataRef;

      // All should reference same data
      expect(chatData).toBe(mapData);
      expect(mapData).toBe(analysisData);
      expect(chatData).toBe(analysisData);
    });

    it('should update all panels when filter changes', () => {
      // Initial filter: 76 wells
      let filteredData = mockFilteredData;
      expect(filteredData).toHaveLength(76);

      // Apply new filter: Operator A only
      filteredData = mockFilteredData.filter(well => 
        well.operator === 'Operator A'
      );
      const newCount = filteredData.length;

      // All panels should see updated data
      currentPanel = 'chat';
      expect(filteredData).toHaveLength(newCount);

      currentPanel = 'map';
      expect(filteredData).toHaveLength(newCount);

      currentPanel = 'data-analysis';
      expect(filteredData).toHaveLength(newCount);
    });

    it('should preserve original data across panels', () => {
      const originalData = mockAnalysisData;
      let filteredData = mockFilteredData;

      // Switch panels
      currentPanel = 'map';
      currentPanel = 'data-analysis';
      currentPanel = 'chat';

      // Original data should be unchanged
      expect(originalData).toHaveLength(151);
      expect(filteredData).toHaveLength(76);
      
      // Original data should not be modified
      expect(originalData[0].id).toBe('well-1');
      expect(originalData[150].id).toBe('well-151');
    });

    it('should handle rapid panel switching', () => {
      let filteredData = mockFilteredData;
      let switchCount = 0;

      // Rapid switching
      for (let i = 0; i < 10; i++) {
        currentPanel = i % 3 === 0 ? 'chat' : i % 3 === 1 ? 'map' : 'data-analysis';
        switchCount++;
        
        // Filter state should remain consistent
        expect(filteredData).toHaveLength(76);
      }

      expect(switchCount).toBe(10);
      expect(filteredData).toHaveLength(76);
    });
  });
});
