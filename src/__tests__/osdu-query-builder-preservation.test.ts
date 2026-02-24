/**
 * Preservation Property Tests — NLP OSDU Path and Toggle State Unchanged
 *
 * These tests capture the BASELINE behavior that MUST be preserved after the
 * query builder bugfix. They verify existing patterns in the UNFIXED code.
 *
 * All tests MUST PASS on unfixed code — they confirm behavior to preserve.
 * After the fix (tasks 3.1–3.5), these tests MUST STILL PASS — no regressions.
 *
 * Observations on UNFIXED code:
 * - handleChatSearch detects "osdu" keyword and calls searchOSDU(prompt, 1000) from catalog.ts
 * - showQueryBuilder state toggles in CatalogPage and flows to CatalogChatBoxCloudscape via props
 * - OSDU results go through GeoJSON conversion → map update → json-table-data table → context saving
 * - Closing query builder sets showQueryBuilder to false without affecting chat or map state
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Source file reading helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..', '..');

const readSource = (relativePath: string): string => {
  const fullPath = path.join(ROOT, relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
};

// ---------------------------------------------------------------------------
// Generators for property-based tests
// ---------------------------------------------------------------------------

/** NLP queries that contain "osdu" keyword — these trigger the NLP OSDU path */
const osduNlpQueryArb = fc.tuple(
  fc.constantFrom(
    'show me', 'find', 'search for', 'get', 'list', 'display', 'fetch'
  ),
  fc.constantFrom(
    'OSDU wells', 'osdu wells', 'OSDU data', 'osdu records',
    'OSDU wellbores', 'osdu logs', 'OSDU seismic data'
  ),
  fc.option(
    fc.constantFrom(
      ' in North Sea', ' near Brunei', ' by Shell', ' deeper than 3000m',
      ' with operator BP', ''
    ),
    { nil: '' }
  )
).map(([verb, target, suffix]) => `${verb} ${target}${suffix}`);

/** Toggle state values */
const toggleStateArb = fc.boolean();

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('Preservation — NLP OSDU Path and Toggle State Unchanged', () => {
  let catalogPageSource: string;
  let chatBoxSource: string;
  let catalogApiSource: string;

  beforeAll(() => {
    catalogPageSource = readSource('src/pages/CatalogPage.tsx');
    chatBoxSource = readSource('src/components/CatalogChatBoxCloudscape.tsx');
    catalogApiSource = readSource('src/lib/api/catalog.ts');
  });

  /**
   * **Validates: Requirements 3.1, 3.5**
   *
   * Property: For all NLP queries containing "osdu" keyword, handleChatSearch
   * continues to call searchOSDU(prompt, 1000) from catalog.ts — not affected
   * by query builder changes.
   *
   * This verifies the NLP OSDU detection and API call path is intact.
   */
  it('Property 1: NLP OSDU path calls searchOSDU(prompt, 1000) from catalog.ts for all osdu queries', () => {
    fc.assert(
      fc.property(osduNlpQueryArb, (query) => {
        // The query must contain "osdu" (our generator guarantees this)
        const lowerQuery = query.toLowerCase();
        if (!lowerQuery.includes('osdu')) return true; // skip non-osdu (shouldn't happen)

        // 1. Verify CatalogPage imports searchOSDU from catalog.ts
        const importsSearchOSDUFromCatalog =
          catalogPageSource.includes("from '@/lib/api/catalog'") &&
          catalogPageSource.includes('searchOSDU');

        if (!importsSearchOSDUFromCatalog) return false;

        // 2. Verify handleChatSearch detects OSDU intent via lowerPrompt.includes('osdu')
        const hasOsduDetection = catalogPageSource.includes("lowerPrompt.includes('osdu')");
        if (!hasOsduDetection) return false;

        // 3. Verify handleChatSearch calls searchOSDU(prompt, 1000)
        const callsSearchOSDUWithPrompt = catalogPageSource.includes('searchOSDU(prompt, 1000)');
        if (!callsSearchOSDUWithPrompt) return false;

        // 4. Verify catalog.ts exports searchOSDU with (query, maxResults) signature
        const catalogHasSearchOSDU = catalogApiSource.includes('searchOSDU');
        if (!catalogHasSearchOSDU) return false;

        return true;
      }),
      { numRuns: 1 },
    );
  });

  /**
   * **Validates: Requirement 3.2**
   *
   * Property: For all toggle interactions, showQueryBuilder state continues
   * to propagate correctly through the component tree:
   * CatalogPage defines state → passes as prop → CatalogChatBoxCloudscape receives it.
   */
  it('Property 2: showQueryBuilder state propagates from CatalogPage to CatalogChatBoxCloudscape', () => {
    fc.assert(
      fc.property(toggleStateArb, (_toggleValue) => {
        // 1. CatalogPage defines showQueryBuilder state
        const definesState = catalogPageSource.includes(
          'const [showQueryBuilder, setShowQueryBuilder] = useState(false)'
        );
        if (!definesState) return false;

        // 2. CatalogPage passes showQueryBuilder as prop to CatalogChatBoxCloudscape
        const passesAsProp = catalogPageSource.includes('showQueryBuilder={showQueryBuilder}');
        if (!passesAsProp) return false;

        // 3. CatalogChatBoxCloudscape accepts showQueryBuilder in its params
        const acceptsProp = chatBoxSource.includes('showQueryBuilder?: boolean');
        if (!acceptsProp) return false;

        // 4. CatalogChatBoxCloudscape destructures showQueryBuilder from params
        const destructuresProp = chatBoxSource.includes('showQueryBuilder') &&
          chatBoxSource.includes('params');
        if (!destructuresProp) return false;

        // 5. CatalogChatBoxCloudscape uses showQueryBuilder to conditionally render
        const usesForConditionalRender = chatBoxSource.includes('{showQueryBuilder && (');
        if (!usesForConditionalRender) return false;

        return true;
      }),
      { numRuns: 1 },
    );
  });

  /**
   * **Validates: Requirement 3.3**
   *
   * Property: For all OSDU search results, the result pipeline produces
   * identical output: GeoJSON conversion → map update → json-table-data table → context saving.
   *
   * We verify the NLP OSDU path in handleChatSearch contains all pipeline stages.
   */
  it('Property 3: OSDU result pipeline (GeoJSON, map, table, context) is intact in handleChatSearch', () => {
    fc.assert(
      fc.property(osduNlpQueryArb, (_query) => {
        // Extract the NLP OSDU block from handleChatSearch
        // It starts with the OSDU detection and ends before the catalog search fallback
        const osduBlockStart = catalogPageSource.indexOf('OSDU QUERY DETECTED');
        const osduBlockEnd = catalogPageSource.indexOf('Call catalog search REST API');
        if (osduBlockStart === -1 || osduBlockEnd === -1) return false;

        const osduBlock = catalogPageSource.substring(osduBlockStart, osduBlockEnd);

        // 1. GeoJSON conversion: creates FeatureCollection with Point geometries
        const hasGeoJSONConversion = osduBlock.includes('FeatureCollection') &&
          osduBlock.includes('Point') &&
          osduBlock.includes('coordinates');
        if (!hasGeoJSONConversion) return false;

        // 2. Map update: calls setMapState and updateMapData
        const hasMapUpdate = osduBlock.includes('setMapState') &&
          osduBlock.includes('updateMapData');
        if (!hasMapUpdate) return false;

        // 3. Table data in chat: uses json-table-data format
        const hasTableData = osduBlock.includes('json-table-data');
        if (!hasTableData) return false;

        // 4. Analysis data saving: calls setAnalysisData
        const hasAnalysisDataSave = osduBlock.includes('setAnalysisData');
        if (!hasAnalysisDataSave) return false;

        return true;
      }),
      { numRuns: 1 },
    );
  });

  /**
   * **Validates: Requirement 3.4**
   *
   * Property: Closing the query builder sets showQueryBuilder to false
   * without affecting chat messages or map state.
   *
   * We verify the close handler only calls setShowQueryBuilder(false) and
   * does NOT touch messages or map state.
   */
  it('Property 4: Close query builder sets showQueryBuilder=false without affecting chat/map', () => {
    fc.assert(
      fc.property(toggleStateArb, (_toggle) => {
        // 1. handleCloseQueryBuilder exists and calls setShowQueryBuilder(false)
        const hasCloseHandler = catalogPageSource.includes('handleCloseQueryBuilder') &&
          catalogPageSource.includes("setShowQueryBuilder(false)");
        if (!hasCloseHandler) return false;

        // 2. Extract the close handler body
        const closeHandlerMatch = catalogPageSource.match(
          /const handleCloseQueryBuilder[\s\S]*?\}, \[\]\);/
        );
        if (!closeHandlerMatch) return false;

        const closeBody = closeHandlerMatch[0];

        // 3. Close handler should NOT modify messages
        const touchesMessages = closeBody.includes('setMessages');
        if (touchesMessages) return false;

        // 4. Close handler should NOT modify map state
        const touchesMapState = closeBody.includes('setMapState') ||
          closeBody.includes('updateMapData') ||
          closeBody.includes('clearMap');
        if (touchesMapState) return false;

        // 5. Close handler should NOT modify analysis data
        const touchesAnalysis = closeBody.includes('setAnalysisData');
        if (touchesAnalysis) return false;

        return true;
      }),
      { numRuns: 1 },
    );
  });

  // -------------------------------------------------------------------------
  // Concrete Verification Tests
  // -------------------------------------------------------------------------

  describe('Concrete preservation checks', () => {
    /**
     * Validates: Requirement 3.5
     * The NLP OSDU path import chain is correct: searchOSDU from catalog.ts
     */
    it('CatalogPage imports searchOSDU from @/lib/api/catalog (not osdu.ts)', () => {
      // Must import from catalog.ts
      expect(catalogPageSource).toContain("import { searchCatalog, searchOSDU } from '@/lib/api/catalog'");

      // The NLP path must use searchOSDU(prompt, 1000)
      expect(catalogPageSource).toContain('searchOSDU(prompt, 1000)');
    });

    /**
     * Validates: Requirement 3.5
     * handleChatSearch detects OSDU intent via keyword check
     */
    it('handleChatSearch detects OSDU queries via lowerPrompt.includes(osdu)', () => {
      expect(catalogPageSource).toContain("const isOSDUQuery = lowerPrompt.includes('osdu')");
      expect(catalogPageSource).toContain('if (isOSDUQuery)');
    });

    /**
     * Validates: Requirement 3.2
     * showQueryBuilder state is defined and passed as prop
     */
    it('showQueryBuilder state flows from CatalogPage to CatalogChatBoxCloudscape', () => {
      // State definition
      expect(catalogPageSource).toContain(
        'const [showQueryBuilder, setShowQueryBuilder] = useState(false)'
      );

      // Prop passing
      expect(catalogPageSource).toContain('showQueryBuilder={showQueryBuilder}');

      // Prop receiving
      expect(chatBoxSource).toContain('showQueryBuilder?: boolean');
    });

    /**
     * Validates: Requirement 3.3
     * NLP OSDU path produces GeoJSON with correct structure
     */
    it('NLP OSDU path converts results to GeoJSON FeatureCollection with Point geometries', () => {
      // The NLP OSDU block creates a GeoJSON FeatureCollection
      const osduBlockStart = catalogPageSource.indexOf('OSDU QUERY DETECTED');
      const osduBlockEnd = catalogPageSource.indexOf('Call catalog search REST API');
      const osduBlock = catalogPageSource.substring(osduBlockStart, osduBlockEnd);

      expect(osduBlock).toContain('type: "FeatureCollection"');
      expect(osduBlock).toContain('type: "Feature"');
      expect(osduBlock).toContain('type: "Point"');
      expect(osduBlock).toContain("dataSource: 'OSDU'");
    });

    /**
     * Validates: Requirement 3.3
     * NLP OSDU path displays results as json-table-data in chat
     */
    it('NLP OSDU path formats results as json-table-data for chat display', () => {
      const osduBlockStart = catalogPageSource.indexOf('OSDU QUERY DETECTED');
      const osduBlockEnd = catalogPageSource.indexOf('Call catalog search REST API');
      const osduBlock = catalogPageSource.substring(osduBlockStart, osduBlockEnd);

      expect(osduBlock).toContain('json-table-data');
      expect(osduBlock).toContain('JSON.stringify(tableItems');
    });

    /**
     * Validates: Requirement 3.4
     * handleCloseQueryBuilder only sets showQueryBuilder to false
     */
    it('handleCloseQueryBuilder only sets showQueryBuilder=false, no side effects', () => {
      const closeMatch = catalogPageSource.match(
        /const handleCloseQueryBuilder[\s\S]*?\}, \[\]\);/
      );
      expect(closeMatch).not.toBeNull();

      const closeBody = closeMatch![0];
      expect(closeBody).toContain('setShowQueryBuilder(false)');
      expect(closeBody).not.toContain('setMessages');
      expect(closeBody).not.toContain('setMapState');
      expect(closeBody).not.toContain('setAnalysisData');
    });

    /**
     * Validates: Requirement 3.2
     * The toggle button in CatalogPage toggles showQueryBuilder
     */
    it('CatalogPage has toggle button that flips showQueryBuilder state', () => {
      expect(catalogPageSource).toContain('setShowQueryBuilder(!showQueryBuilder)');
    });

    /**
     * Validates: Requirement 3.1
     * catalog.ts exports searchOSDU function
     */
    it('catalog.ts exports searchOSDU function', () => {
      expect(catalogApiSource).toContain('searchOSDU');
    });
  });
});
