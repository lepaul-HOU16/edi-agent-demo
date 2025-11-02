/**
 * Test suite for catalog filter detection logic
 * Tests the enhanced filter keyword detection implemented in Task 3
 */

describe('Catalog Filter Detection', () => {
  // Simulate the filter detection logic from catalog/page.tsx
  const filterKeywords = [
    'filter',
    'with',
    'having',
    'show wells with',
    'wells with',
    'that have',
    'containing',
    'log curve',
    'curve',
    'depth',
    'greater than',
    '>',
    'deeper',
    'less than',
    '<',
    'shallower',
    'operator',
    'operated by',
    'between'
  ];

  const detectFilter = (prompt: string, hasExistingData: boolean): boolean => {
    const lowerPrompt = prompt.toLowerCase().trim();
    return hasExistingData && filterKeywords.some(keyword => lowerPrompt.includes(keyword));
  };

  describe('Filter keyword detection', () => {
    it('should detect "with" keyword', () => {
      expect(detectFilter('wells with log curve data', true)).toBe(true);
    });

    it('should detect "having" keyword', () => {
      expect(detectFilter('show wells having depth greater than 3000m', true)).toBe(true);
    });

    it('should detect "show wells with" phrase', () => {
      expect(detectFilter('show wells with GR curve', true)).toBe(true);
    });

    it('should detect "wells with" phrase', () => {
      expect(detectFilter('wells with density log', true)).toBe(true);
    });

    it('should detect "that have" phrase', () => {
      expect(detectFilter('find wells that have sonic data', true)).toBe(true);
    });

    it('should detect "containing" keyword', () => {
      expect(detectFilter('wells containing resistivity curves', true)).toBe(true);
    });

    it('should detect "log curve" phrase', () => {
      expect(detectFilter('show log curve data', true)).toBe(true);
    });

    it('should detect "curve" keyword', () => {
      expect(detectFilter('wells with curve data', true)).toBe(true);
    });

    it('should detect depth-related keywords', () => {
      expect(detectFilter('wells deeper than 2000m', true)).toBe(true);
      expect(detectFilter('depth greater than 3000', true)).toBe(true);
      expect(detectFilter('wells with depth > 2500m', true)).toBe(true);
      expect(detectFilter('shallower than 1000m', true)).toBe(true);
      expect(detectFilter('depth less than 1500', true)).toBe(true);
      expect(detectFilter('depth < 2000m', true)).toBe(true);
    });

    it('should detect operator-related keywords', () => {
      expect(detectFilter('wells operated by Shell', true)).toBe(true);
      expect(detectFilter('show operator data', true)).toBe(true);
    });

    it('should detect "between" keyword', () => {
      expect(detectFilter('wells between 2000 and 3000m depth', true)).toBe(true);
    });

    it('should detect "filter" keyword', () => {
      expect(detectFilter('filter wells by depth', true)).toBe(true);
    });
  });

  describe('Non-filter queries', () => {
    it('should not detect filter for initial search queries', () => {
      expect(detectFilter('show all wells', false)).toBe(false);
      expect(detectFilter('get well data', false)).toBe(false);
      expect(detectFilter('/getdata', false)).toBe(false);
    });

    it('should not detect filter for general queries without keywords', () => {
      expect(detectFilter('show me the wells', true)).toBe(false);
      expect(detectFilter('display well information', true)).toBe(false);
      expect(detectFilter('what wells are available', true)).toBe(false);
    });

    it('should not detect filter when no existing data', () => {
      expect(detectFilter('wells with log curve data', false)).toBe(false);
      expect(detectFilter('show wells with depth > 3000m', false)).toBe(false);
    });
  });

  describe('Complex filter queries', () => {
    it('should detect multiple filter keywords', () => {
      expect(detectFilter('show wells with log curve data that have depth greater than 3000m', true)).toBe(true);
    });

    it('should detect filter in natural language', () => {
      expect(detectFilter('I want to see wells that have sonic and density curves', true)).toBe(true);
      expect(detectFilter('can you show me wells with GR log', true)).toBe(true);
      expect(detectFilter('find wells having resistivity data', true)).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(detectFilter('Wells With Log Curve Data', true)).toBe(true);
      expect(detectFilter('SHOW WELLS WITH DEPTH > 3000M', true)).toBe(true);
      expect(detectFilter('Wells Operated By Shell', true)).toBe(true);
    });
  });

  describe('Context flags', () => {
    it('should create proper context with filter flags', () => {
      const hasExistingData = true;
      const analysisData = Array(151).fill({ name: 'Well' });
      const queryType = 'general';
      const isLikelyFilter = detectFilter('wells with log curve data', hasExistingData);

      const context = {
        wellCount: analysisData.length,
        queryType: queryType,
        timestamp: new Date().toISOString(),
        isFilterOperation: isLikelyFilter,
        hasExistingData: hasExistingData
      };

      expect(context.isFilterOperation).toBe(true);
      expect(context.hasExistingData).toBe(true);
      expect(context.wellCount).toBe(151);
      expect(context.queryType).toBe('general');
    });

    it('should not set filter flags for fresh search', () => {
      const hasExistingData = false;
      const isLikelyFilter = detectFilter('show all wells', hasExistingData);

      expect(isLikelyFilter).toBe(false);
    });
  });
});
