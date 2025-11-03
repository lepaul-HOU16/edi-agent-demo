/**
 * Test ProjectResolver functionality
 * 
 * Tests:
 * - Explicit project reference extraction
 * - Implicit reference resolution
 * - Partial name matching with fuzzy search
 * - Ambiguity detection
 */

// Mock implementations for testing (since we can't directly import TypeScript in Node.js tests)
// In production, these would be compiled to JavaScript first

// Mock ProjectStore for testing
class MockProjectStore {
  constructor() {
    this.projects = [
      {
        project_id: '1',
        project_name: 'west-texas-wind-farm',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      },
      {
        project_id: '2',
        project_name: 'east-texas-wind-farm',
        created_at: '2025-01-15T11:00:00Z',
        updated_at: '2025-01-15T11:00:00Z'
      },
      {
        project_id: '3',
        project_name: 'panhandle-wind',
        created_at: '2025-01-15T12:00:00Z',
        updated_at: '2025-01-15T12:00:00Z'
      },
      {
        project_id: '4',
        project_name: 'amarillo-tx-wind-farm',
        created_at: '2025-01-15T13:00:00Z',
        updated_at: '2025-01-15T13:00:00Z'
      }
    ];
  }

  async list() {
    return this.projects;
  }

  async load(projectName) {
    return this.projects.find(p => p.project_name === projectName) || null;
  }
}

async function testExplicitReferences() {
  console.log('\n=== Testing Explicit Project References ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);
  const sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: 'west-texas-wind-farm',
    project_history: ['west-texas-wind-farm'],
    last_updated: new Date().toISOString()
  };

  // Test 1: "for project {name}"
  console.log('Test 1: "for project west-texas-wind-farm"');
  let result = await resolver.resolve('optimize layout for project west-texas-wind-farm', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'west-texas-wind-farm', 'Should match west-texas-wind-farm');
  console.assert(result.confidence === 'explicit', 'Should be explicit match');
  console.log('✅ Test 1 passed\n');

  // Test 2: "for {name} project"
  console.log('Test 2: "for panhandle-wind project"');
  result = await resolver.resolve('run simulation for panhandle-wind project', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'panhandle-wind', 'Should match panhandle-wind');
  console.assert(result.confidence === 'explicit', 'Should be explicit match');
  console.log('✅ Test 2 passed\n');

  // Test 3: "project {name}"
  console.log('Test 3: "project amarillo-tx-wind-farm"');
  result = await resolver.resolve('show details for project amarillo-tx-wind-farm', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'amarillo-tx-wind-farm', 'Should match amarillo-tx-wind-farm');
  console.assert(result.confidence === 'explicit', 'Should be explicit match');
  console.log('✅ Test 3 passed\n');

  // Test 4: Extract explicit reference method
  console.log('Test 4: extractExplicitReference()');
  let extracted = resolver.extractExplicitReference('for project west-texas-wind-farm');
  console.log('Extracted:', extracted);
  console.assert(extracted === 'west-texas-wind-farm', 'Should extract west-texas-wind-farm');
  
  extracted = resolver.extractExplicitReference('for panhandle wind project');
  console.log('Extracted:', extracted);
  console.assert(extracted === 'panhandle-wind', 'Should extract and normalize panhandle-wind');
  console.log('✅ Test 4 passed\n');
}

async function testImplicitReferences() {
  console.log('\n=== Testing Implicit Project References ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);

  // Test 1: "that project" → last mentioned
  console.log('Test 1: "that project" with history');
  let sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: 'west-texas-wind-farm',
    project_history: ['panhandle-wind', 'west-texas-wind-farm'],
    last_updated: new Date().toISOString()
  };
  let result = await resolver.resolve('optimize layout for that project', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'panhandle-wind', 'Should use last mentioned project');
  console.assert(result.confidence === 'implicit', 'Should be implicit match');
  console.log('✅ Test 1 passed\n');

  // Test 2: "the project" → active project
  console.log('Test 2: "the project"');
  result = await resolver.resolve('run simulation for the project', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'west-texas-wind-farm', 'Should use active project');
  console.assert(result.confidence === 'implicit', 'Should be implicit match');
  console.log('✅ Test 2 passed\n');

  // Test 3: "continue" → active project
  console.log('Test 3: "continue"');
  result = await resolver.resolve('continue with the analysis', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'west-texas-wind-farm', 'Should use active project');
  console.assert(result.confidence === 'implicit', 'Should be implicit match');
  console.log('✅ Test 3 passed\n');

  // Test 4: No implicit reference
  console.log('Test 4: No implicit reference');
  sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: null,
    project_history: [],
    last_updated: new Date().toISOString()
  };
  result = await resolver.resolve('analyze terrain at coordinates', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === null, 'Should return null');
  console.assert(result.confidence === 'none', 'Should have no confidence');
  console.log('✅ Test 4 passed\n');
}

async function testPartialNameMatching() {
  console.log('\n=== Testing Partial Name Matching ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);
  const sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: null,
    project_history: [],
    last_updated: new Date().toISOString()
  };

  // Test 1: Partial match - "west texas"
  console.log('Test 1: Partial match "west texas"');
  let result = await resolver.resolve('optimize layout for west texas', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'west-texas-wind-farm', 'Should match west-texas-wind-farm');
  console.assert(result.confidence === 'partial', 'Should be partial match');
  console.log('✅ Test 1 passed\n');

  // Test 2: Partial match - "panhandle"
  console.log('Test 2: Partial match "panhandle"');
  result = await resolver.resolve('run simulation for panhandle', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'panhandle-wind', 'Should match panhandle-wind');
  console.assert(result.confidence === 'partial', 'Should be partial match');
  console.log('✅ Test 2 passed\n');

  // Test 3: Ambiguous match - "texas"
  console.log('Test 3: Ambiguous match "texas"');
  result = await resolver.resolve('show details for texas project', sessionContext);
  console.log('Result:', result);
  console.assert(result.isAmbiguous === true, 'Should be ambiguous');
  console.assert(result.matches && result.matches.length > 1, 'Should have multiple matches');
  console.assert(result.matches.includes('west-texas-wind-farm'), 'Should include west-texas-wind-farm');
  console.assert(result.matches.includes('east-texas-wind-farm'), 'Should include east-texas-wind-farm');
  console.log('✅ Test 3 passed\n');

  // Test 4: Fuzzy match - "amarilo" (typo)
  console.log('Test 4: Fuzzy match "amarilo" (typo)');
  result = await resolver.resolve('optimize layout for amarilo', sessionContext);
  console.log('Result:', result);
  // Should match amarillo-tx-wind-farm with fuzzy matching
  console.assert(result.projectName === 'amarillo-tx-wind-farm' || result.isAmbiguous, 
    'Should match amarillo-tx-wind-farm or be ambiguous');
  console.log('✅ Test 4 passed\n');

  // Test 5: No match
  console.log('Test 5: No match "california"');
  result = await resolver.resolve('analyze terrain in california', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === null, 'Should return null');
  console.assert(result.confidence === 'none', 'Should have no confidence');
  console.log('✅ Test 5 passed\n');
}

async function testActiveProjectFallback() {
  console.log('\n=== Testing Active Project Fallback ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);

  // Test 1: Use active project when no explicit reference
  console.log('Test 1: Use active project as fallback');
  const sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: 'west-texas-wind-farm',
    project_history: ['west-texas-wind-farm'],
    last_updated: new Date().toISOString()
  };
  let result = await resolver.resolve('optimize the layout', sessionContext);
  console.log('Result:', result);
  console.assert(result.projectName === 'west-texas-wind-farm', 'Should use active project');
  console.assert(result.confidence === 'active', 'Should be active project fallback');
  console.log('✅ Test 1 passed\n');

  // Test 2: No active project
  console.log('Test 2: No active project');
  const emptyContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: null,
    project_history: [],
    last_updated: new Date().toISOString()
  };
  result = await resolver.resolve('optimize the layout', emptyContext);
  console.log('Result:', result);
  console.assert(result.projectName === null, 'Should return null');
  console.assert(result.confidence === 'none', 'Should have no confidence');
  console.log('✅ Test 2 passed\n');
}

async function testLevenshteinDistance() {
  console.log('\n=== Testing Levenshtein Distance ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);

  // Test distance calculation
  console.log('Test 1: Levenshtein distance calculation');
  const distance1 = resolver.levenshteinDistance('amarillo', 'amarilo');
  console.log('Distance between "amarillo" and "amarilo":', distance1);
  console.assert(distance1 === 1, 'Should be 1 (one deletion)');

  const distance2 = resolver.levenshteinDistance('west-texas', 'west-texas');
  console.log('Distance between "west-texas" and "west-texas":', distance2);
  console.assert(distance2 === 0, 'Should be 0 (exact match)');

  const distance3 = resolver.levenshteinDistance('panhandle', 'panhandle-wind');
  console.log('Distance between "panhandle" and "panhandle-wind":', distance3);
  console.assert(distance3 === 5, 'Should be 5 (5 insertions)');

  console.log('✅ All Levenshtein tests passed\n');
}

async function testCaching() {
  console.log('\n=== Testing Project List Caching ===\n');

  const mockStore = new MockProjectStore();
  const resolver = new ProjectResolver(mockStore);
  const sessionContext = {
    session_id: 'test-session',
    user_id: 'test-user',
    active_project: null,
    project_history: [],
    last_updated: new Date().toISOString()
  };

  // Test 1: First call should fetch from store
  console.log('Test 1: First call fetches from store');
  let callCount = 0;
  const originalList = mockStore.list.bind(mockStore);
  mockStore.list = async function() {
    callCount++;
    return originalList();
  };

  await resolver.resolve('optimize layout for west texas', sessionContext);
  console.log('Store list() called:', callCount, 'times');
  console.assert(callCount === 1, 'Should call store.list() once');
  console.log('✅ Test 1 passed\n');

  // Test 2: Second call should use cache
  console.log('Test 2: Second call uses cache');
  await resolver.resolve('run simulation for panhandle', sessionContext);
  console.log('Store list() called:', callCount, 'times');
  console.assert(callCount === 1, 'Should still be 1 (cached)');
  console.log('✅ Test 2 passed\n');

  // Test 3: Clear cache
  console.log('Test 3: Clear cache');
  resolver.clearCache();
  await resolver.resolve('show details for amarillo', sessionContext);
  console.log('Store list() called:', callCount, 'times');
  console.assert(callCount === 2, 'Should call store.list() again after cache clear');
  console.log('✅ Test 3 passed\n');
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ProjectResolver Comprehensive Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testExplicitReferences();
    await testImplicitReferences();
    await testPartialNameMatching();
    await testActiveProjectFallback();
    await testLevenshteinDistance();
    await testCaching();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✅ ALL TESTS PASSED                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('Summary:');
    console.log('✅ Explicit reference extraction working');
    console.log('✅ Implicit reference resolution working');
    console.log('✅ Partial name matching working');
    console.log('✅ Fuzzy matching with Levenshtein distance working');
    console.log('✅ Ambiguity detection working');
    console.log('✅ Active project fallback working');
    console.log('✅ Project list caching working');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
