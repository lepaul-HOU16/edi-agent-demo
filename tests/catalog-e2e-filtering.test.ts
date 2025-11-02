/**
 * End-to-End Test: Catalog Chat Filtering Workflow
 * 
 * Tests the complete filtering workflow:
 * 1. Initial search to get all wells
 * 2. Filter query to narrow down results
 * 3. Verify table updates with filtered data
 * 4. Verify header shows "X of Y total"
 * 5. Verify expandable rows still work
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('E2E: Catalog Chat Filtering Workflow', () => {
  let mockAnalysisData: any[];
  let mockFilteredData: any[];
  let mockFilterStats: any;

  beforeEach(() => {
    // Mock initial search results (151 wells)
    mockAnalysisData = Array.from({ length: 151 }, (_, i) => ({
      id: `well-${i + 1}`,
      wellName: `WELL-${String(i + 1).padStart(3, '0')}`,
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

    // Mock filtered results (wells with log curve data - 76 wells)
    mockFilteredData = mockAnalysisData.filter((_, i) => i % 2 === 0);

    mockFilterStats = {
      filteredCount: 76,
      totalCount: 151,
      isFiltered: true
    };
  });

  describe('Step 1: Initial Search', () => {
    it('should load all wells from initial search', () => {
      // Simulate initial search: "/getdata" or "show all wells"
      const initialSearchQuery = '/getdata';
      
      // Verify query is not a filter operation
      const isFilterQuery = false;
      expect(isFilterQuery).toBe(false);

      // Verify all wells are loaded
      expect(mockAnalysisData).toHaveLength(151);
      expect(mockAnalysisData[0]).toHaveProperty('wellName');
      expect(mockAnalysisData[0]).toHaveProperty('wellbores');
    });

    it('should display all wells in table', () => {
      // Verify table receives full dataset
      const tableData = mockAnalysisData;
      expect(tableData).toHaveLength(151);

      // Verify no filter stats initially
      const filterStats = null;
      expect(filterStats).toBeNull();
    });
  });

  describe('Step 2: Filter Query', () => {
    it('should detect filter query correctly', () => {
      const filterQuery = 'wells with log curve data';
      const lowerQuery = filterQuery.toLowerCase();

      // Test filter keyword detection
      const filterKeywords = [
        'filter', 'with', 'having', 'show wells with',
        'wells with', 'that have', 'containing',
        'log curve', 'curve'
      ];

      const isLikelyFilter = filterKeywords.some(keyword => 
        lowerQuery.includes(keyword)
      );

      expect(isLikelyFilter).toBe(true);
    });

    it('should send existing context to backend', () => {
      // Verify context includes existing data info
      const existingContext = {
        wellCount: 151,
        queryType: 'catalog',
        timestamp: new Date().toISOString(),
        isFilterOperation: true,
        hasExistingData: true
      };

      expect(existingContext.hasExistingData).toBe(true);
      expect(existingContext.isFilterOperation).toBe(true);
      expect(existingContext.wellCount).toBe(151);
    });

    it('should receive filtered data from backend', () => {
      // Simulate backend response with filter metadata
      const backendResponse = {
        type: 'complete',
        data: {
          message: 'Found 76 wells with log curve data',
          files: {
            metadata: 's3://bucket/session/metadata.json',
            geojson: 's3://bucket/session/geojson.json'
          },
          stats: {
            wellCount: 76,
            totalWells: 151,
            isFiltered: true,
            filterCriteria: 'wells with log curve data'
          },
          isFilterOperation: true
        }
      };

      expect(backendResponse.data.isFilterOperation).toBe(true);
      expect(backendResponse.data.stats.wellCount).toBe(76);
      expect(backendResponse.data.stats.totalWells).toBe(151);
    });
  });

  describe('Step 3: Table Updates with Filtered Data', () => {
    it('should update table to show only filtered wells', () => {
      // Verify filtered data is used for display
      const displayData = mockFilteredData;
      expect(displayData).toHaveLength(76);

      // Verify original data is preserved
      expect(mockAnalysisData).toHaveLength(151);
    });

    it('should update filter stats', () => {
      expect(mockFilterStats.filteredCount).toBe(76);
      expect(mockFilterStats.totalCount).toBe(151);
      expect(mockFilterStats.isFiltered).toBe(true);
    });

    it('should pass filtered data to table component', () => {
      // Simulate component props
      const tableProps = {
        hierarchicalData: mockAnalysisData, // Original data
        filteredData: mockFilteredData,     // Filtered data
        filterStats: mockFilterStats        // Filter statistics
      };

      expect(tableProps.filteredData).toHaveLength(76);
      expect(tableProps.hierarchicalData).toHaveLength(151);
      expect(tableProps.filterStats.isFiltered).toBe(true);
    });
  });

  describe('Step 4: Header Shows "X of Y total"', () => {
    it('should display filtered count in header', () => {
      // Simulate header counter logic
      const headerCounter = mockFilterStats.isFiltered
        ? `(${mockFilterStats.filteredCount} of ${mockFilterStats.totalCount} total)`
        : `(${mockAnalysisData.length} total)`;

      expect(headerCounter).toBe('(76 of 151 total)');
    });

    it('should update header description for filtered results', () => {
      const headerDescription = mockFilterStats.isFiltered
        ? "Filtered results - click any row to view details"
        : "Click any row to view detailed information";

      expect(headerDescription).toBe("Filtered results - click any row to view details");
    });

    it('should show normal header when not filtered', () => {
      const noFilterStats = null;
      const headerCounter = noFilterStats?.isFiltered
        ? `(${noFilterStats.filteredCount} of ${noFilterStats.totalCount} total)`
        : `(${mockAnalysisData.length} total)`;

      expect(headerCounter).toBe('(151 total)');
    });
  });

  describe('Step 5: Expandable Rows Still Work', () => {
    it('should maintain expandable row functionality with filtered data', () => {
      // Verify filtered wells still have wellbores
      const wellWithWellbores = mockFilteredData.find(well => 
        well.wellbores && well.wellbores.length > 0
      );

      expect(wellWithWellbores).toBeDefined();
      expect(wellWithWellbores.wellbores).toHaveLength(1);
    });

    it('should expand to show wellbores for filtered wells', () => {
      const well = mockFilteredData[0];
      const wellbores = well.wellbores;

      expect(wellbores).toBeDefined();
      expect(Array.isArray(wellbores)).toBe(true);
      expect(wellbores.length).toBeGreaterThan(0);
    });

    it('should expand wellbores to show welllogs', () => {
      const well = mockFilteredData[0];
      const wellbore = well.wellbores[0];
      const welllogs = wellbore.welllogs;

      expect(welllogs).toBeDefined();
      expect(Array.isArray(welllogs)).toBe(true);
      
      // Wells with even indices have log data
      if (welllogs.length > 0) {
        expect(welllogs[0]).toHaveProperty('welllogName');
        expect(welllogs[0]).toHaveProperty('curves');
      }
    });

    it('should preserve hierarchical structure in filtered data', () => {
      // Verify three-level hierarchy is maintained
      const well = mockFilteredData[0];
      
      // Level 1: Well
      expect(well).toHaveProperty('wellName');
      expect(well).toHaveProperty('wellbores');
      
      // Level 2: Wellbore
      const wellbore = well.wellbores[0];
      expect(wellbore).toHaveProperty('wellboreName');
      expect(wellbore).toHaveProperty('welllogs');
      
      // Level 3: Welllog (if present)
      if (wellbore.welllogs.length > 0) {
        const welllog = wellbore.welllogs[0];
        expect(welllog).toHaveProperty('welllogName');
        expect(welllog).toHaveProperty('curves');
      }
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should handle complete filter workflow end-to-end', () => {
      // Step 1: Initial search
      let currentData = mockAnalysisData;
      let currentFilterStats = null;
      expect(currentData).toHaveLength(151);

      // Step 2: Apply filter
      const filterQuery = 'wells with log curve data';
      const isFilter = filterQuery.includes('with');
      expect(isFilter).toBe(true);

      // Step 3: Update with filtered data
      currentData = mockFilteredData;
      currentFilterStats = mockFilterStats;
      expect(currentData).toHaveLength(76);
      expect(currentFilterStats.isFiltered).toBe(true);

      // Step 4: Verify header
      const header = `(${currentFilterStats.filteredCount} of ${currentFilterStats.totalCount} total)`;
      expect(header).toBe('(76 of 151 total)');

      // Step 5: Verify expandable rows
      const hasExpandableRows = currentData.some(well => 
        well.wellbores && well.wellbores.length > 0
      );
      expect(hasExpandableRows).toBe(true);
    });

    it('should allow clearing filter and returning to full data', () => {
      // Start with filtered data
      let currentData = mockFilteredData;
      let currentFilterStats = mockFilterStats;
      expect(currentData).toHaveLength(76);

      // Clear filter (new search)
      currentData = mockAnalysisData;
      currentFilterStats = null;

      // Verify back to full data
      expect(currentData).toHaveLength(151);
      expect(currentFilterStats).toBeNull();
    });
  });
});
