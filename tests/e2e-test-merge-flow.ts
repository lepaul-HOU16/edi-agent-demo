/**
 * End-to-End Test for Project Merge Operations
 * 
 * Task 22: Deploy and test merge operations
 * Requirements: 4.2, 4.3, 4.4
 * 
 * This script tests:
 * - Merging two projects
 * - Data combination logic
 * - Name selection
 * - Deletion of source project
 * - Projects with different completion levels
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

// Configuration
const BUCKET_NAME = process.env.RENEWABLE_S3_BUCKET || '';
const TEST_SESSION_ID = 'test-merge-session-' + Date.now();

// Test project names
const PROJECT_A = 'test-merge-project-a-' + Date.now();
const PROJECT_B = 'test-merge-project-b-' + Date.now();
const PROJECT_C = 'test-merge-project-c-' + Date.now();
const PROJECT_D = 'test-merge-project-d-' + Date.now();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logTest(testName: string) {
  log(`\n▶ ${testName}`, 'blue');
}

function logSuccess(message: string) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`  ⚠ ${message}`, 'yellow');
}

// Initialize services
let projectStore: ProjectStore;
let projectResolver: ProjectResolver;
let projectNameGenerator: ProjectNameGenerator;
let sessionContextManager: SessionContextManager;
let lifecycleManager: ProjectLifecycleManager;

async function initializeServices() {
  logSection('Initializing Services');
  
  if (!BUCKET_NAME) {
    logError('RENEWABLE_S3_BUCKET environment variable not set');
    process.exit(1);
  }
  
  log(`Using S3 bucket: ${BUCKET_NAME}`);
  
  projectStore = new ProjectStore(BUCKET_NAME);
  projectResolver = new ProjectResolver(projectStore);
  projectNameGenerator = new ProjectNameGenerator();
  sessionContextManager = new SessionContextManager(projectStore);
  lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );
  
  logSuccess('Services initialized');
}

// Helper function to create test project
async function createTestProject(
  name: string,
  completionLevel: {
    terrain?: boolean;
    layout?: boolean;
    simulation?: boolean;
    report?: boolean;
  }
): Promise<ProjectData> {
  const project: ProjectData = {
    project_name: name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coordinates: {
      latitude: 35.067482 + Math.random() * 0.001,
      longitude: -101.395466 + Math.random() * 0.001,
    },
    terrain_results: completionLevel.terrain
      ? { s3_key: `terrain-${name}`, data: 'terrain data' }
      : undefined,
    layout_results: completionLevel.layout
      ? { s3_key: `layout-${name}`, data: 'layout data' }
      : undefined,
    simulation_results: completionLevel.simulation
      ? { s3_key: `simulation-${name}`, data: 'simulation data' }
      : undefined,
    report_results: completionLevel.report
      ? { s3_key: `report-${name}`, data: 'report data' }
      : undefined,
    metadata: {
      test: true,
      completionLevel: Object.keys(completionLevel).filter(
        (k) => completionLevel[k as keyof typeof completionLevel]
      ),
    },
  };
  
  await projectStore.save(name, project);
  return project;
}

// Helper function to cleanup test projects
async function cleanupTestProjects() {
  const testProjects = [PROJECT_A, PROJECT_B, PROJECT_C, PROJECT_D];
  
  for (const projectName of testProjects) {
    try {
      await projectStore.delete(projectName);
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}

// Test 1: Merge two projects with complementary data
async function testMergeComplementaryProjects() {
  logTest('Test 1: Merge two projects with complementary data (Requirement 4.2, 4.3)');
  
  try {
    // Create project A with terrain and layout
    log('Creating project A with terrain and layout...');
    const projectA = await createTestProject(PROJECT_A, {
      terrain: true,
      layout: true,
    });
    logSuccess(`Created ${PROJECT_A}`);
    
    // Create project B with simulation and report
    log('Creating project B with simulation and report...');
    const projectB = await createTestProject(PROJECT_B, {
      simulation: true,
      report: true,
    });
    logSuccess(`Created ${PROJECT_B}`);
    
    // Merge projects (keep project B name)
    log(`Merging ${PROJECT_A} into ${PROJECT_B}...`);
    const mergeResult = await lifecycleManager.mergeProjects(
      PROJECT_A,
      PROJECT_B,
      PROJECT_B
    );
    
    if (!mergeResult.success) {
      logError(`Merge failed: ${mergeResult.message}`);
      return false;
    }
    
    logSuccess(`Merge successful: ${mergeResult.message}`);
    
    // Verify merged project has all data
    log('Verifying merged project data...');
    const mergedProject = await projectStore.load(PROJECT_B);
    
    if (!mergedProject) {
      logError('Merged project not found');
      return false;
    }
    
    // Check that all data is present
    const checks = [
      { name: 'Terrain data', value: mergedProject.terrain_results },
      { name: 'Layout data', value: mergedProject.layout_results },
      { name: 'Simulation data', value: mergedProject.simulation_results },
      { name: 'Report data', value: mergedProject.report_results },
    ];
    
    let allChecksPass = true;
    for (const check of checks) {
      if (check.value) {
        logSuccess(`${check.name} present`);
      } else {
        logError(`${check.name} missing`);
        allChecksPass = false;
      }
    }
    
    // Verify source project was deleted
    log('Verifying source project was deleted...');
    const deletedProject = await projectStore.load(PROJECT_A);
    
    if (deletedProject) {
      logError('Source project still exists (should be deleted)');
      allChecksPass = false;
    } else {
      logSuccess('Source project deleted successfully');
    }
    
    // Verify merged project name
    if (mergedProject.project_name === PROJECT_B) {
      logSuccess(`Merged project has correct name: ${PROJECT_B}`);
    } else {
      logError(`Merged project has wrong name: ${mergedProject.project_name}`);
      allChecksPass = false;
    }
    
    return allChecksPass;
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Test 2: Merge with different name selection
async function testMergeWithNameSelection() {
  logTest('Test 2: Merge with name selection (Requirement 4.4)');
  
  try {
    // Create project C with terrain
    log('Creating project C with terrain...');
    await createTestProject(PROJECT_C, { terrain: true });
    logSuccess(`Created ${PROJECT_C}`);
    
    // Create project D with layout
    log('Creating project D with layout...');
    await createTestProject(PROJECT_D, { layout: true });
    logSuccess(`Created ${PROJECT_D}`);
    
    // Merge projects keeping project C name (source name)
    log(`Merging ${PROJECT_C} and ${PROJECT_D}, keeping ${PROJECT_C}...`);
    const mergeResult = await lifecycleManager.mergeProjects(
      PROJECT_C,
      PROJECT_D,
      PROJECT_C
    );
    
    if (!mergeResult.success) {
      logError(`Merge failed: ${mergeResult.message}`);
      return false;
    }
    
    logSuccess(`Merge successful: ${mergeResult.message}`);
    
    // Verify correct project was kept
    if (mergeResult.mergedProject === PROJECT_C) {
      logSuccess(`Correct project kept: ${PROJECT_C}`);
    } else {
      logError(`Wrong project kept: ${mergeResult.mergedProject}`);
      return false;
    }
    
    // Verify correct project was deleted
    if (mergeResult.deletedProject === PROJECT_D) {
      logSuccess(`Correct project deleted: ${PROJECT_D}`);
    } else {
      logError(`Wrong project deleted: ${mergeResult.deletedProject}`);
      return false;
    }
    
    // Verify merged project exists
    const mergedProject = await projectStore.load(PROJECT_C);
    if (!mergedProject) {
      logError('Merged project not found');
      return false;
    }
    
    logSuccess('Merged project exists');
    
    // Verify deleted project doesn't exist
    const deletedProject = await projectStore.load(PROJECT_D);
    if (deletedProject) {
      logError('Deleted project still exists');
      return false;
    }
    
    logSuccess('Deleted project removed');
    
    // Verify data combination
    if (mergedProject.terrain_results && mergedProject.layout_results) {
      logSuccess('Both terrain and layout data present in merged project');
      return true;
    } else {
      logError('Data not properly combined');
      return false;
    }
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Test 3: Merge projects with different completion levels
async function testMergeDifferentCompletionLevels() {
  logTest('Test 3: Merge projects with different completion levels (Requirement 4.3)');
  
  try {
    const projectE = 'test-merge-project-e-' + Date.now();
    const projectF = 'test-merge-project-f-' + Date.now();
    
    // Create project E with only terrain (25% complete)
    log('Creating project E with 25% completion (terrain only)...');
    await createTestProject(projectE, { terrain: true });
    logSuccess(`Created ${projectE} (25% complete)`);
    
    // Create project F with terrain, layout, and simulation (75% complete)
    log('Creating project F with 75% completion (terrain, layout, simulation)...');
    await createTestProject(projectF, {
      terrain: true,
      layout: true,
      simulation: true,
    });
    logSuccess(`Created ${projectF} (75% complete)`);
    
    // Merge projects
    log(`Merging ${projectE} into ${projectF}...`);
    const mergeResult = await lifecycleManager.mergeProjects(projectE, projectF);
    
    if (!mergeResult.success) {
      logError(`Merge failed: ${mergeResult.message}`);
      await projectStore.delete(projectE);
      await projectStore.delete(projectF);
      return false;
    }
    
    logSuccess(`Merge successful: ${mergeResult.message}`);
    
    // Verify merged project has most complete data
    const mergedProject = await projectStore.load(projectF);
    
    if (!mergedProject) {
      logError('Merged project not found');
      await projectStore.delete(projectE);
      return false;
    }
    
    // Should have terrain, layout, and simulation from project F
    const completionChecks = [
      { name: 'Terrain', present: !!mergedProject.terrain_results },
      { name: 'Layout', present: !!mergedProject.layout_results },
      { name: 'Simulation', present: !!mergedProject.simulation_results },
    ];
    
    let allPresent = true;
    for (const check of completionChecks) {
      if (check.present) {
        logSuccess(`${check.name} data present`);
      } else {
        logError(`${check.name} data missing`);
        allPresent = false;
      }
    }
    
    // Cleanup
    await projectStore.delete(projectF);
    
    return allPresent;
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Test 4: Error handling - merge non-existent projects
async function testMergeNonExistentProjects() {
  logTest('Test 4: Error handling - merge non-existent projects');
  
  try {
    const nonExistent1 = 'non-existent-project-1';
    const nonExistent2 = 'non-existent-project-2';
    
    log(`Attempting to merge non-existent projects...`);
    const mergeResult = await lifecycleManager.mergeProjects(
      nonExistent1,
      nonExistent2
    );
    
    if (mergeResult.success) {
      logError('Merge should have failed but succeeded');
      return false;
    }
    
    if (mergeResult.error === 'PROJECT_NOT_FOUND') {
      logSuccess('Correctly returned PROJECT_NOT_FOUND error');
      return true;
    } else {
      logError(`Wrong error type: ${mergeResult.error}`);
      return false;
    }
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Test 5: Error handling - invalid keepName
async function testMergeInvalidKeepName() {
  logTest('Test 5: Error handling - invalid keepName (Requirement 4.4)');
  
  try {
    const projectG = 'test-merge-project-g-' + Date.now();
    const projectH = 'test-merge-project-h-' + Date.now();
    
    // Create test projects
    await createTestProject(projectG, { terrain: true });
    await createTestProject(projectH, { layout: true });
    
    log(`Attempting to merge with invalid keepName...`);
    const mergeResult = await lifecycleManager.mergeProjects(
      projectG,
      projectH,
      'invalid-project-name'
    );
    
    // Cleanup
    await projectStore.delete(projectG);
    await projectStore.delete(projectH);
    
    if (mergeResult.success) {
      logError('Merge should have failed but succeeded');
      return false;
    }
    
    if (mergeResult.error === 'MERGE_CONFLICT') {
      logSuccess('Correctly returned MERGE_CONFLICT error');
      return true;
    } else {
      logError(`Wrong error type: ${mergeResult.error}`);
      return false;
    }
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Test 6: Verify metadata merging
async function testMetadataMerging() {
  logTest('Test 6: Verify metadata merging (Requirement 4.3)');
  
  try {
    const projectI = 'test-merge-project-i-' + Date.now();
    const projectJ = 'test-merge-project-j-' + Date.now();
    
    // Create project I with specific metadata
    const projectIData: ProjectData = {
      project_name: projectI,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: { latitude: 35.0, longitude: -101.0 },
      terrain_results: { s3_key: 'terrain-i' },
      metadata: {
        source: 'project-i',
        quality: 'high',
        test: true,
      },
    };
    await projectStore.save(projectI, projectIData);
    
    // Create project J with different metadata
    const projectJData: ProjectData = {
      project_name: projectJ,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: { latitude: 35.0, longitude: -101.0 },
      layout_results: { s3_key: 'layout-j' },
      metadata: {
        target: 'project-j',
        status: 'complete',
        test: true,
      },
    };
    await projectStore.save(projectJ, projectJData);
    
    // Merge projects
    log(`Merging ${projectI} into ${projectJ}...`);
    const mergeResult = await lifecycleManager.mergeProjects(projectI, projectJ);
    
    if (!mergeResult.success) {
      logError(`Merge failed: ${mergeResult.message}`);
      await projectStore.delete(projectI);
      await projectStore.delete(projectJ);
      return false;
    }
    
    // Verify merged metadata
    const mergedProject = await projectStore.load(projectJ);
    
    if (!mergedProject) {
      logError('Merged project not found');
      await projectStore.delete(projectI);
      return false;
    }
    
    // Check that metadata from both projects is present
    const metadataChecks = [
      { name: 'source (from I)', value: mergedProject.metadata?.source },
      { name: 'quality (from I)', value: mergedProject.metadata?.quality },
      { name: 'target (from J)', value: mergedProject.metadata?.target },
      { name: 'status (from J)', value: mergedProject.metadata?.status },
    ];
    
    let allPresent = true;
    for (const check of metadataChecks) {
      if (check.value) {
        logSuccess(`Metadata ${check.name} present: ${check.value}`);
      } else {
        logError(`Metadata ${check.name} missing`);
        allPresent = false;
      }
    }
    
    // Cleanup
    await projectStore.delete(projectJ);
    
    return allPresent;
  } catch (error) {
    logError(`Test failed with error: ${error}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  logSection('Task 22: Deploy and Test Merge Operations');
  log('Requirements: 4.2, 4.3, 4.4');
  
  await initializeServices();
  
  // Cleanup any existing test projects
  log('\nCleaning up any existing test projects...');
  await cleanupTestProjects();
  
  const tests = [
    { name: 'Merge complementary projects', fn: testMergeComplementaryProjects },
    { name: 'Merge with name selection', fn: testMergeWithNameSelection },
    { name: 'Merge different completion levels', fn: testMergeDifferentCompletionLevels },
    { name: 'Error: non-existent projects', fn: testMergeNonExistentProjects },
    { name: 'Error: invalid keepName', fn: testMergeInvalidKeepName },
    { name: 'Metadata merging', fn: testMetadataMerging },
  ];
  
  const results: { name: string; passed: boolean }[] = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Cleanup
  logSection('Cleanup');
  log('Cleaning up test projects...');
  await cleanupTestProjects();
  logSuccess('Cleanup complete');
  
  // Summary
  logSection('Test Summary');
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  
  results.forEach((result) => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  if (failed === 0) {
    log(`\n✓ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`\n✗ Some tests failed: ${passed} passed, ${failed} failed (${total} total)`, 'red');
  }
  console.log('='.repeat(80) + '\n');
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  logError(`Fatal error: ${error}`);
  process.exit(1);
});
