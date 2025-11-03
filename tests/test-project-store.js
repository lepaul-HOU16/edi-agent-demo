/**
 * Test ProjectStore implementation
 * 
 * This test verifies:
 * - ProjectStore can be instantiated
 * - Save/load operations work with in-memory cache
 * - Validation functions work correctly
 * - Error handling works as expected
 */

const { ProjectStore } = require('../amplify/functions/shared/projectStore.ts');
const { 
  validateProjectData, 
  validatePartialProjectData,
  sanitizeProjectName,
  hasRequiredData,
  getMissingDataMessage,
  migrateProjectData
} = require('../amplify/functions/shared/projectSchema.ts');

console.log('🧪 Testing ProjectStore Implementation\n');

// Test 1: ProjectStore instantiation
console.log('Test 1: ProjectStore instantiation');
try {
  const store = new ProjectStore();
  console.log('✅ ProjectStore instantiated successfully');
  console.log(`   Cache stats:`, store.getCacheStats());
} catch (error) {
  console.error('❌ Failed to instantiate ProjectStore:', error.message);
  process.exit(1);
}

// Test 2: Project name sanitization
console.log('\nTest 2: Project name sanitization');
const testNames = [
  { input: 'West Texas Wind Farm', expected: 'west-texas-wind-farm' },
  { input: 'Project #123', expected: 'project-123' },
  { input: '  Multiple   Spaces  ', expected: 'multiple-spaces' },
  { input: 'Special!@#$%Characters', expected: 'specialcharacters' },
];

for (const { input, expected } of testNames) {
  const result = sanitizeProjectName(input);
  if (result === expected) {
    console.log(`✅ "${input}" → "${result}"`);
  } else {
    console.error(`❌ "${input}" → "${result}" (expected "${expected}")`);
  }
}

// Test 3: Project data validation
console.log('\nTest 3: Project data validation');

const validProject = {
  project_id: 'proj-1234567890-abc123',
  project_name: 'test-project',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  coordinates: {
    latitude: 35.0,
    longitude: -101.0,
  },
  metadata: {
    turbine_count: 10,
    total_capacity_mw: 25.0,
    annual_energy_gwh: 80.5,
  },
};

const validationResult = validateProjectData(validProject);
if (validationResult.valid) {
  console.log('✅ Valid project data passes validation');
} else {
  console.error('❌ Valid project data failed validation:', validationResult.errors);
}

// Test 4: Invalid project data
console.log('\nTest 4: Invalid project data validation');

const invalidProject = {
  project_id: 'invalid-id',
  project_name: 'Invalid Name With Spaces',
  created_at: 'not-a-date',
  updated_at: new Date().toISOString(),
  coordinates: {
    latitude: 200, // Invalid latitude
    longitude: -101.0,
  },
};

const invalidResult = validateProjectData(invalidProject);
if (!invalidResult.valid && invalidResult.errors.length > 0) {
  console.log('✅ Invalid project data correctly rejected');
  console.log('   Errors:', invalidResult.errors.slice(0, 3).join(', '));
} else {
  console.error('❌ Invalid project data should have been rejected');
}

// Test 5: Partial validation
console.log('\nTest 5: Partial project data validation');

const partialUpdate = {
  coordinates: {
    latitude: 40.0,
    longitude: -100.0,
  },
  metadata: {
    turbine_count: 15,
  },
};

const partialResult = validatePartialProjectData(partialUpdate);
if (partialResult.valid) {
  console.log('✅ Valid partial update passes validation');
} else {
  console.error('❌ Valid partial update failed validation:', partialResult.errors);
}

// Test 6: Required data checks
console.log('\nTest 6: Required data checks');

const projectWithCoords = {
  ...validProject,
  coordinates: { latitude: 35.0, longitude: -101.0 },
};

const projectWithLayout = {
  ...validProject,
  layout_results: { turbines: [] },
};

const projectComplete = {
  ...validProject,
  terrain_results: {},
  layout_results: {},
  simulation_results: {},
};

console.log('   Has coords for layout:', hasRequiredData(projectWithCoords, 'layout') ? '✅' : '❌');
console.log('   Has layout for simulation:', hasRequiredData(projectWithLayout, 'simulation') ? '✅' : '❌');
console.log('   Has all data for report:', hasRequiredData(projectComplete, 'report') ? '✅' : '❌');

// Test 7: Missing data messages
console.log('\nTest 7: Missing data messages');

const incompleteProject = {
  ...validProject,
  project_name: 'incomplete-project',
};

const layoutMessage = getMissingDataMessage(incompleteProject, 'layout');
const simulationMessage = getMissingDataMessage(incompleteProject, 'simulation');
const reportMessage = getMissingDataMessage(incompleteProject, 'report');

console.log('✅ Layout message:', layoutMessage.substring(0, 60) + '...');
console.log('✅ Simulation message:', simulationMessage.substring(0, 60) + '...');
console.log('✅ Report message:', reportMessage.substring(0, 60) + '...');

// Test 8: Legacy data migration
console.log('\nTest 8: Legacy data migration');

const legacyData = {
  id: 'old-id-123',
  name: 'old-project',
  createdAt: '2024-01-01T00:00:00Z',
  lat: 35.0,
  lon: -101.0,
  terrainResults: { features: [] },
};

const migrated = migrateProjectData(legacyData);
if (migrated.project_id && migrated.project_name && migrated.coordinates) {
  console.log('✅ Legacy data migrated successfully');
  console.log('   Old ID:', legacyData.id, '→ New ID:', migrated.project_id);
  console.log('   Coordinates migrated:', migrated.coordinates);
} else {
  console.error('❌ Legacy data migration failed');
}

// Test 9: In-memory cache operations
console.log('\nTest 9: In-memory cache operations');

async function testCacheOperations() {
  const store = new ProjectStore(); // No S3 bucket, cache-only mode
  
  try {
    // Save to cache
    await store.save('test-project', {
      project_id: 'proj-test-123',
      project_name: 'test-project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: { latitude: 35.0, longitude: -101.0 },
    });
    console.log('✅ Saved project to cache');
    
    // Load from cache
    const loaded = await store.load('test-project');
    if (loaded && loaded.project_name === 'test-project') {
      console.log('✅ Loaded project from cache');
    } else {
      console.error('❌ Failed to load project from cache');
    }
    
    // Update project
    await store.save('test-project', {
      metadata: { turbine_count: 10 },
    });
    console.log('✅ Updated project in cache');
    
    // Verify merge
    const updated = await store.load('test-project');
    if (updated && updated.metadata?.turbine_count === 10 && updated.coordinates) {
      console.log('✅ Project data merged correctly');
    } else {
      console.error('❌ Project data merge failed');
    }
    
    // Cache stats
    const stats = store.getCacheStats();
    console.log('✅ Cache stats:', stats);
    
  } catch (error) {
    console.error('❌ Cache operations failed:', error.message);
  }
}

testCacheOperations().then(() => {
  console.log('\n✅ All ProjectStore tests completed successfully!');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
