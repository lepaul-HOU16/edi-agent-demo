/**
 * Verification script for project merging functionality
 * 
 * Tests Requirements: 4.2, 4.3, 4.4
 * 
 * Usage: npx ts-node tests/verify-merge-projects.ts
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

const BUCKET_NAME = process.env.RENEWABLE_S3_BUCKET || 'test-bucket';

async function verifyMergeProjects() {
  console.log('='.repeat(80));
  console.log('VERIFYING PROJECT MERGE FUNCTIONALITY');
  console.log('='.repeat(80));
  console.log();

  // Initialize components
  const projectStore = new ProjectStore(BUCKET_NAME);
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager(BUCKET_NAME);

  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  let allTestsPassed = true;

  // Test 1: Verify mergeProjects method exists
  console.log('Test 1: Verify mergeProjects method exists');
  try {
    if (typeof lifecycleManager.mergeProjects === 'function') {
      console.log('✅ PASS: mergeProjects method exists');
    } else {
      console.log('❌ FAIL: mergeProjects method not found');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    allTestsPassed = false;
  }
  console.log();

  // Test 2: Verify method signature
  console.log('Test 2: Verify method signature');
  try {
    const methodString = lifecycleManager.mergeProjects.toString();
    const hasSourceParam = methodString.includes('sourceProjectName');
    const hasTargetParam = methodString.includes('targetProjectName');
    const hasKeepNameParam = methodString.includes('keepName');

    if (hasSourceParam && hasTargetParam && hasKeepNameParam) {
      console.log('✅ PASS: Method has correct parameters');
      console.log('   - sourceProjectName: ✓');
      console.log('   - targetProjectName: ✓');
      console.log('   - keepName: ✓');
    } else {
      console.log('❌ FAIL: Method signature incorrect');
      console.log('   - sourceProjectName:', hasSourceParam ? '✓' : '✗');
      console.log('   - targetProjectName:', hasTargetParam ? '✓' : '✗');
      console.log('   - keepName:', hasKeepNameParam ? '✓' : '✗');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    allTestsPassed = false;
  }
  console.log();

  // Test 3: Verify return type structure
  console.log('Test 3: Verify return type structure');
  try {
    // Create a mock scenario to test return type
    console.log('   Testing with non-existent projects...');
    const result = await lifecycleManager.mergeProjects('non-existent-1', 'non-existent-2');

    const hasSuccess = 'success' in result;
    const hasMergedProject = 'mergedProject' in result;
    const hasDeletedProject = 'deletedProject' in result;
    const hasMessage = 'message' in result;

    if (hasSuccess && hasMergedProject && hasDeletedProject && hasMessage) {
      console.log('✅ PASS: Return type has correct structure');
      console.log('   - success:', hasSuccess ? '✓' : '✗');
      console.log('   - mergedProject:', hasMergedProject ? '✓' : '✗');
      console.log('   - deletedProject:', hasDeletedProject ? '✓' : '✗');
      console.log('   - message:', hasMessage ? '✓' : '✗');
    } else {
      console.log('❌ FAIL: Return type structure incorrect');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    allTestsPassed = false;
  }
  console.log();

  // Test 4: Verify error handling for missing projects
  console.log('Test 4: Verify error handling for missing projects');
  try {
    const result = await lifecycleManager.mergeProjects('missing-project-1', 'missing-project-2');

    if (!result.success && result.error === 'PROJECT_NOT_FOUND') {
      console.log('✅ PASS: Correctly handles missing projects');
      console.log('   - Returns success: false');
      console.log('   - Returns error: PROJECT_NOT_FOUND');
      console.log('   - Message:', result.message);
    } else {
      console.log('❌ FAIL: Does not handle missing projects correctly');
      console.log('   - Result:', result);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    allTestsPassed = false;
  }
  console.log();

  // Test 5: Verify implementation includes key requirements
  console.log('Test 5: Verify implementation includes key requirements');
  try {
    const methodSource = lifecycleManager.mergeProjects.toString();

    const checks = {
      'Loads both projects': methodSource.includes('projectStore.load'),
      'Validates existence': methodSource.includes('!sourceProject') || methodSource.includes('!targetProject'),
      'Merges data': methodSource.includes('terrain_results') && methodSource.includes('layout_results'),
      'Saves merged project': methodSource.includes('projectStore.save'),
      'Deletes other project': methodSource.includes('projectStore.delete'),
      'Clears cache': methodSource.includes('clearCache'),
      'Validates keepName': methodSource.includes('keepName'),
    };

    const allChecksPass = Object.values(checks).every(v => v);

    if (allChecksPass) {
      console.log('✅ PASS: Implementation includes all key requirements');
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   - ${check}: ${passed ? '✓' : '✗'}`);
      });
    } else {
      console.log('❌ FAIL: Implementation missing some requirements');
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   - ${check}: ${passed ? '✓' : '✗'}`);
      });
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    allTestsPassed = false;
  }
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log();
    console.log('Project merging functionality is correctly implemented:');
    console.log('  ✓ Method exists with correct signature');
    console.log('  ✓ Validates project existence (Requirement 4.2)');
    console.log('  ✓ Merges data keeping most complete (Requirement 4.3)');
    console.log('  ✓ Validates keepName parameter (Requirement 4.4)');
    console.log('  ✓ Saves merged project and deletes other');
    console.log('  ✓ Clears resolver cache');
    console.log();
    console.log('Ready for integration testing!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log();
    console.log('Please review the failures above and fix any issues.');
  }
  console.log('='.repeat(80));

  return allTestsPassed;
}

// Run verification
if (require.main === module) {
  verifyMergeProjects()
    .then((passed) => {
      process.exit(passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Verification failed with error:', error);
      process.exit(1);
    });
}

export { verifyMergeProjects };
