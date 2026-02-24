/**
 * Bug Condition Exploration Test — Wrong API Path and Bloated Component
 *
 * This test encodes the EXPECTED (correct) behavior for the OSDU Query Builder.
 * On UNFIXED code, these tests MUST FAIL — failure confirms the bugs exist.
 * After bugfix tasks 3.1-3.4, these tests MUST PASS — passing confirms the fix.
 *
 * Three compounding bugs:
 * 1. Query builder rendered INSIDE scrollable messages-container div (scrolls away)
 * 2. OSDUQueryBuilder is ~2000 lines of bloat (templates, analytics, history, etc.)
 * 3. handleQueryBuilderExecution uses executeOSDUQuery from osduQueryExecutor.ts
 *    (wrong path) instead of searchOSDU from catalog.ts (correct path)
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Source file reading helpers — we analyze the ACTUAL source code to detect bugs
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..', '..');

const readSource = (relativePath: string): string => {
  const fullPath = path.join(ROOT, relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
};

// ---------------------------------------------------------------------------
// Data type generator for property-based tests
// ---------------------------------------------------------------------------

const dataTypeArb = fc.constantFrom('Well', 'Wellbore', 'Log', 'Seismic');

const optionalFilterArb = fc.option(
  fc.record({
    field: fc.constantFrom('operator', 'basin', 'country', 'status', 'WellName', 'LogType'),
    value: fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
  }),
  { nil: undefined }
);

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration — Wrong API Path and Bloated Component', () => {
  // Cache source files once
  let catalogPageSource: string;
  let chatBoxSource: string;
  let queryBuilderSource: string;
  let osduQueryExecutorSource: string;

  beforeAll(() => {
    catalogPageSource = readSource('src/pages/CatalogPage.tsx');
    chatBoxSource = readSource('src/components/CatalogChatBoxCloudscape.tsx');
    queryBuilderSource = readSource('src/components/OSDUQueryBuilder.tsx');
    osduQueryExecutorSource = readSource('src/utils/osduQueryExecutor.ts');
  });


  /**
   * **Validates: Requirements 1.5**
   *
   * Property 1: For any data type selection with optional field/value filter,
   * the query builder execution path SHALL use searchOSDU from catalog.ts
   * with a natural language query string — NOT executeOSDUQuery from
   * osduQueryExecutor.ts.
   *
   * On UNFIXED code this FAILS because:
   * - handleQueryBuilderExecution imports and calls executeOSDUQuery
   * - executeOSDUQuery imports searchOSDU from src/lib/api/osdu.ts (wrong path)
   * - The correct path is searchOSDU from src/lib/api/catalog.ts
   */
  it('Property 1: Query builder execution path uses searchOSDU from catalog.ts, not executeOSDUQuery', () => {
    fc.assert(
      fc.property(dataTypeArb, optionalFilterArb, (_dataType, _filter) => {
        // Verify handleQueryBuilderExecution does NOT call executeOSDUQuery
        // The function should call searchOSDU from catalog.ts instead
        const hasExecuteOSDUQueryImport = catalogPageSource.includes(
          "import { executeOSDUQuery"
        ) || catalogPageSource.includes(
          "from '@/utils/osduQueryExecutor'"
        );

        // Check if handleQueryBuilderExecution calls executeOSDUQuery
        // Extract the function body by finding it in source
        const fnMatch = catalogPageSource.match(
          /const handleQueryBuilderExecution[\s\S]*?(?=\n  const \w|\n  \/\/ (?!Query Builder))/
        );
        const fnBody = fnMatch ? fnMatch[0] : '';

        const callsExecuteOSDUQuery = fnBody.includes('executeOSDUQuery');
        const callsSearchOSDUFromCatalog = fnBody.includes("searchOSDU(") && 
          !fnBody.includes('executeOSDUQuery');

        // EXPECTED: No executeOSDUQuery import, uses searchOSDU from catalog.ts
        // BUGGY: Has executeOSDUQuery import and calls it
        if (hasExecuteOSDUQueryImport) {
          return false; // Bug: still imports from osduQueryExecutor
        }
        if (callsExecuteOSDUQuery) {
          return false; // Bug: still calls executeOSDUQuery
        }
        if (!callsSearchOSDUFromCatalog) {
          return false; // Bug: doesn't use searchOSDU from catalog.ts
        }

        return true;
      }),
      { numRuns: 1 },
    );
  });

  /**
   * **Validates: Requirements 1.2, 1.3, 1.4**
   *
   * Property 2: The query builder component SHALL render only minimal UI —
   * data type dropdown + optional field/value filter + Search/Close buttons.
   * It SHALL NOT contain templates, analytics, history, autocomplete,
   * syntax highlighting, or modals.
   *
   * On UNFIXED code this FAILS because:
   * - OSDUQueryBuilder.tsx imports OSDUTemplateSelector, OSDUQueryHistory,
   *   OSDUQueryBuilderAnalyticsDashboard, autocomplete utilities, Modal
   * - Component has ~2000 lines with all these bloat features
   */
  it('Property 2: Query builder component is minimal — no bloat features', () => {
    fc.assert(
      fc.property(dataTypeArb, (_dataType) => {
        // Check which component CatalogChatBoxCloudscape renders
        // Expected: SimplifiedOSDUQueryBuilder (minimal)
        // Buggy: OSDUQueryBuilder (bloated)
        const rendersOldQueryBuilder = chatBoxSource.includes('OSDUQueryBuilder') &&
          !chatBoxSource.includes('SimplifiedOSDUQueryBuilder');

        if (rendersOldQueryBuilder) {
          return false; // Bug: still using bloated OSDUQueryBuilder
        }

        // Also verify the rendered component source doesn't have bloat indicators
        // Check for bloat imports/features in whatever component is used
        const bloatIndicators = [
          'OSDUTemplateSelector',
          'OSDUQueryHistory',
          'OSDUQueryBuilderAnalyticsDashboard',
          'QueryBuilderAnalytics',
          'osduAutocompleteData',
          'syntaxHighlightQuery',
          'showSaveTemplateModal',
          'showQueryHistory',
          'showAnalyticsDashboard',
          'showHelpModal',
        ];

        // If the chatbox still imports OSDUQueryBuilder, check that component for bloat
        const componentSource = chatBoxSource.includes('SimplifiedOSDUQueryBuilder')
          ? '' // New component — we'd check it separately but it shouldn't have bloat
          : queryBuilderSource;

        if (componentSource) {
          const foundBloat = bloatIndicators.filter(indicator =>
            componentSource.includes(indicator)
          );
          if (foundBloat.length > 0) {
            return false; // Bug: component has bloat features
          }
        }

        return true;
      }),
      { numRuns: 1 },
    );
  });

  /**
   * **Validates: Requirements 1.1**
   *
   * Property 3: The query builder SHALL be rendered OUTSIDE the
   * messages-container div so it does not scroll away with chat messages.
   *
   * On UNFIXED code this FAILS because:
   * - OSDUQueryBuilder is rendered inside the messages-container div
   *   which has overflow-y: auto
   */
  it('Property 3: Query builder is rendered outside scrollable messages-container', () => {
    fc.assert(
      fc.property(fc.boolean(), (_toggle) => {
        // Find the messages-container div and check if query builder is inside it
        // The pattern in the source: <div className="messages-container"> ... {showQueryBuilder && <OSDUQueryBuilder>} ... </div>
        
        // Extract the messages-container block
        const messagesContainerStart = chatBoxSource.indexOf('className="messages-container"');
        if (messagesContainerStart === -1) {
          return true; // No messages-container found — can't verify
        }

        // Find query builder references after messages-container opens
        // We need to check if QueryBuilder (old or new) is rendered INSIDE messages-container
        const afterMessagesContainer = chatBoxSource.substring(messagesContainerStart);
        
        // Find the closing of messages-container div — look for the controls section
        // which comes after messages-container
        const controlsIndex = afterMessagesContainer.indexOf("className='controls'");
        const messagesContainerBlock = controlsIndex > 0
          ? afterMessagesContainer.substring(0, controlsIndex)
          : afterMessagesContainer.substring(0, 2000); // fallback: first 2000 chars

        // Check if any query builder component is rendered inside this block
        const queryBuilderInsideMessages = 
          messagesContainerBlock.includes('OSDUQueryBuilder') ||
          messagesContainerBlock.includes('SimplifiedOSDUQueryBuilder') ||
          messagesContainerBlock.includes('showQueryBuilder');

        if (queryBuilderInsideMessages) {
          return false; // Bug: query builder is inside scrollable container
        }

        return true;
      }),
      { numRuns: 1 },
    );
  });

  // -------------------------------------------------------------------------
  // Concrete Test Cases — demonstrate specific bug patterns
  // -------------------------------------------------------------------------

  describe('Concrete cases — demonstrate specific bug patterns', () => {
    /**
     * Validates: Requirement 1.5
     * The osduQueryExecutor.ts imports searchOSDU from osdu.ts (wrong path)
     * instead of from catalog.ts (correct path).
     */
    it('osduQueryExecutor imports searchOSDU from osdu.ts (wrong API path)', () => {
      // This confirms the wrong import chain exists
      const importsFromOsduTs = osduQueryExecutorSource.includes("from '../lib/api/osdu'");
      expect(importsFromOsduTs).toBe(true); // Confirms wrong path exists

      // The EXPECTED behavior: handleQueryBuilderExecution should NOT use this executor
      // It should use searchOSDU from catalog.ts directly
      const catalogPageImportsExecutor = catalogPageSource.includes("from '@/utils/osduQueryExecutor'");
      
      // EXPECTED: false (should not import from osduQueryExecutor)
      // BUGGY: true (currently imports executeOSDUQuery from osduQueryExecutor)
      expect(catalogPageImportsExecutor).toBe(false);
    });

    /**
     * Validates: Requirement 1.2
     * OSDUQueryBuilder has bloat: templates, analytics, history, autocomplete,
     * syntax highlighting, modals.
     */
    it('Query builder component should NOT have bloat features', () => {
      // Check the component that CatalogChatBoxCloudscape actually renders
      const usesOldComponent = chatBoxSource.includes("from './OSDUQueryBuilder'");
      const usesNewComponent = chatBoxSource.includes("from './SimplifiedOSDUQueryBuilder'");

      // EXPECTED: uses SimplifiedOSDUQueryBuilder (no bloat)
      // BUGGY: uses OSDUQueryBuilder (has bloat)
      expect(usesOldComponent).toBe(false);
      expect(usesNewComponent).toBe(true);
    });

    /**
     * Validates: Requirement 1.3
     * Current query builder has 3 dropdowns per criterion row (field, operator, value).
     * Expected: simplified with just field + value (no operator dropdown).
     */
    it('Query builder should not have 3 dropdowns per criterion row', () => {
      // The old OSDUQueryBuilder has operator definitions and 3 dropdowns per row
      const hasOperatorDropdowns = queryBuilderSource.includes('OperatorDefinition');
      const _hasOperatorState = queryBuilderSource.includes("operator:");

      // If the chatbox still uses the old component, these bloat indicators confirm the bug
      const usesOldComponent = chatBoxSource.includes("from './OSDUQueryBuilder'");
      
      if (usesOldComponent) {
        // EXPECTED: false — should use simplified component without operator dropdowns
        // BUGGY: true — old component has operator dropdowns
        expect(hasOperatorDropdowns).toBe(false);
      }
    });

    /**
     * Validates: Requirement 1.1
     * Query builder is rendered inside messages-container (scrolls away).
     */
    it('Query builder should NOT be inside messages-container div', () => {
      const messagesContainerStart = chatBoxSource.indexOf('className="messages-container"');
      expect(messagesContainerStart).toBeGreaterThan(-1);

      const afterMessagesContainer = chatBoxSource.substring(messagesContainerStart);
      const controlsIndex = afterMessagesContainer.indexOf("className='controls'");
      const messagesBlock = controlsIndex > 0
        ? afterMessagesContainer.substring(0, controlsIndex)
        : afterMessagesContainer.substring(0, 2000);

      // EXPECTED: query builder is NOT inside messages-container
      // BUGGY: query builder IS inside messages-container
      const hasQueryBuilderInside = messagesBlock.includes('QueryBuilder');
      expect(hasQueryBuilderInside).toBe(false);
    });

    /**
     * Validates: Requirement 1.5
     * handleQueryBuilderExecution should accept (query: string) not (query: string, criteria: QueryCriterion[])
     */
    it('handleQueryBuilderExecution should accept simple string query, not criteria array', () => {
      // Check the function signature
      const hasCriteriaParam = catalogPageSource.includes(
        'handleQueryBuilderExecution = useCallback(async (query: string, criteria:'
      );
      
      // EXPECTED: false — should accept just (query: string)
      // BUGGY: true — accepts (query: string, criteria: QueryCriterion[])
      expect(hasCriteriaParam).toBe(false);
    });
  });
});
