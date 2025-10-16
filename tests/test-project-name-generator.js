/**
 * Test suite for ProjectNameGenerator
 * 
 * Tests:
 * - Location extraction from queries
 * - Reverse geocoding with AWS Location Service
 * - Name normalization to kebab-case
 * - Uniqueness checking
 */

const { ProjectNameGenerator } = require('../amplify/functions/shared/projectNameGenerator.ts');
const { ProjectStore } = require('../amplify/functions/shared/projectStore.ts');

// Mock ProjectStore for testing
class MockProjectStore {
  constructor(existingProjects = []) {
    this.projects = existingProjects;
  }

  async list() {
    return this.projects;
  }

  async load(projectName) {
    return this.projects.find(p => p.project_name === projectName) || null;
  }

  async save(projectName, data) {
    const existing = this.projects.find(p => p.project_name === projectName);
    if (existing) {
      Object.assign(existing, data);
    } else {
      this.projects.push({ project_name: projectName, ...data });
    }
  }
}

async function testLocationExtraction() {
  console.log('\n=== Testing Location Extraction ===\n');
  
  const mockStore = new MockProjectStore();
  const generator = new ProjectNameGenerator(mockStore, 'test-place-index');

  const testCases = [
    {
      query: 'analyze terrain in West Texas',
      expected: 'west-texas-wind-farm',
      description: 'Extract "in {location}"'
    },
    {
      query: 'wind farm at Amarillo',
      expected: 'amarillo-wind-farm',
      description: 'Extract "at {location}"'
    },
    {
      query: 'Panhandle Wind wind farm analysis',
      expected: 'panhandle-wind-wind-farm',
      description: 'Extract "{location} wind farm"'
    },
    {
      query: 'create project Panhandle Wind',
      expected: 'panhandle-wind-wind-farm',
      description: 'Extract "create project {name}"'
    },
    {
      query: 'analyze terrain for North Texas area',
      expected: 'north-texas-wind-farm',
      description: 'Extract "for {location}"'
    },
    {
      query: 'site near Oklahoma City',
      expected: 'oklahoma-city-wind-farm',
      description: 'Extract "near {location}"'
    },
    {
      query: 'West Texas terrain analysis',
      expected: 'west-texas-wind-farm',
      description: 'Extract location at start'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await generator.generateFromQuery(testCase.query);
      
      if (result === testCase.expected) {
        console.log(`✅ PASS: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);
        console.log(`   Result: "${result}"\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got: "${result}"\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\nLocation Extraction: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testNameNormalization() {
  console.log('\n=== Testing Name Normalization ===\n');
  
  const mockStore = new MockProjectStore();
  const generator = new ProjectNameGenerator(mockStore, 'test-place-index');

  const testCases = [
    {
      input: 'West Texas',
      expected: 'west-texas-wind-farm',
      description: 'Lowercase and hyphenate'
    },
    {
      input: 'Amarillo, TX',
      expected: 'amarillo-tx-wind-farm',
      description: 'Remove special characters'
    },
    {
      input: 'North   Texas',
      expected: 'north-texas-wind-farm',
      description: 'Handle multiple spaces'
    },
    {
      input: 'Oklahoma_City',
      expected: 'oklahoma-city-wind-farm',
      description: 'Replace underscores'
    },
    {
      input: '  Panhandle  ',
      expected: 'panhandle-wind-farm',
      description: 'Trim whitespace'
    },
    {
      input: 'West-Texas',
      expected: 'west-texas-wind-farm',
      description: 'Preserve existing hyphens'
    },
    {
      input: 'Site #123',
      expected: 'site-123-wind-farm',
      description: 'Remove special chars, keep numbers'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = generator.normalize(testCase.input);
      
      if (result === testCase.expected) {
        console.log(`✅ PASS: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Result: "${result}"\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got: "${result}"\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.description}`);
      console.log(`   Input: "${testCase.input}"`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\nName Normalization: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testUniqueness() {
  console.log('\n=== Testing Uniqueness Checking ===\n');
  
  // Create mock store with existing projects
  const existingProjects = [
    { project_name: 'west-texas-wind-farm' },
    { project_name: 'west-texas-wind-farm-2' },
    { project_name: 'amarillo-wind-farm' }
  ];
  
  const mockStore = new MockProjectStore(existingProjects);
  const generator = new ProjectNameGenerator(mockStore, 'test-place-index');

  const testCases = [
    {
      baseName: 'west-texas-wind-farm',
      expected: 'west-texas-wind-farm-3',
      description: 'Append number for existing name'
    },
    {
      baseName: 'amarillo-wind-farm',
      expected: 'amarillo-wind-farm-2',
      description: 'Append -2 for first conflict'
    },
    {
      baseName: 'new-site-wind-farm',
      expected: 'new-site-wind-farm',
      description: 'Keep unique name unchanged'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await generator.ensureUnique(testCase.baseName);
      
      if (result === testCase.expected) {
        console.log(`✅ PASS: ${testCase.description}`);
        console.log(`   Base: "${testCase.baseName}"`);
        console.log(`   Result: "${result}"\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description}`);
        console.log(`   Base: "${testCase.baseName}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got: "${result}"\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.description}`);
      console.log(`   Base: "${testCase.baseName}"`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\nUniqueness Checking: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testCoordinateFallback() {
  console.log('\n=== Testing Coordinate Fallback ===\n');
  
  const mockStore = new MockProjectStore();
  const generator = new ProjectNameGenerator(mockStore, 'test-place-index');

  const testCases = [
    {
      query: 'analyze terrain',
      coordinates: { lat: 35.067482, lon: -101.395466 },
      description: 'Generate from coordinates when no location in query'
    },
    {
      query: 'wind farm analysis',
      coordinates: { lat: 40.7128, lon: -74.0060 },
      description: 'Use coordinates for generic query'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await generator.generateFromQuery(testCase.query, testCase.coordinates);
      
      // Result should be either a geocoded name or coordinate-based fallback
      const isValid = result.includes('wind-farm') || result.includes('site-');
      
      if (isValid) {
        console.log(`✅ PASS: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);
        console.log(`   Coordinates: (${testCase.coordinates.lat}, ${testCase.coordinates.lon})`);
        console.log(`   Result: "${result}"\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.description}`);
        console.log(`   Query: "${testCase.query}"`);
        console.log(`   Result: "${result}" (invalid format)\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.description}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\nCoordinate Fallback: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     ProjectNameGenerator Test Suite                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    locationExtraction: await testLocationExtraction(),
    nameNormalization: await testNameNormalization(),
    uniqueness: await testUniqueness(),
    coordinateFallback: await testCoordinateFallback()
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Test Summary                                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const allPassed = Object.values(results).every(r => r === true);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}`);
  });

  console.log('\n' + (allPassed ? 
    '✅ All tests passed!' : 
    '❌ Some tests failed. Review output above.'));

  return allPassed;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testLocationExtraction,
  testNameNormalization,
  testUniqueness,
  testCoordinateFallback,
  runAllTests
};
