/**
 * Verification script for Task 4: Single Project Deletion
 * 
 * This script verifies that all requirements for single project deletion
 * have been implemented correctly.
 * 
 * Requirements verified:
 * - 2.1: Confirmation prompt before deletion
 * - 2.2: Project existence validation
 * - 2.3: S3 deletion via ProjectStore
 * - 2.4: Update session context when active project deleted
 * - 2.5: Clear resolver cache after deletion
 * - 2.7: In-progress project check
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

async function verifyDeleteProject() {
  console.log('='.repeat(80));
  console.log('TASK 4: Single Project Deletion - Verification');
  console.log('='.repeat(80));
  console.log();

  // Initialize components
  const projectStore = new ProjectStore();
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager();

  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  let allPassed = true;

  // Test 1: Confirmation prompt (Requirement 2.1)
  console.log('Test 1: Confirmation prompt (Requirement 2.1)');
  console.log('-'.repeat(80));
  try {
    const testProject: ProjectData = {
      project_id: 'verify-test-1',
      project_name: 'verify-test-project-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(testProject.project_name, testProject);

    const result = await lifecycleManager.deleteProject(testProject.project_name, false);
    
    if (!result.success && result.message.includes('Are you sure')) {
      console.log('✅ PASS: Confirmation prompt displayed correctly');
    } else {
      console.log('❌ FAIL: Confirmation prompt not displayed');
      allPassed = false;
    }

    // Clean up
    await lifecycleManager.deleteProject(testProject.project_name, true);
  } catch (error) {
    console.log('❌ FAIL: Error in confirmation test:', error);
    allPassed = false;
  }
  console.log();

  // Test 2: Project existence validation (Requirement 2.2)
  console.log('Test 2: Project existence validation (Requirement 2.2)');
  console.log('-'.repeat(80));
  try {
    const result = await lifecycleManager.deleteProject('nonexistent-project', true);
    
    if (!result.success && result.message.includes('not found')) {
      console.log('✅ PASS: Non-existent project validation works');
    } else {
      console.log('❌ FAIL: Non-existent project validation failed');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error in existence validation test:', error);
    allPassed = false;
  }
  console.log();

  // Test 3: S3 deletion (Requirement 2.3)
  console.log('Test 3: S3 deletion via ProjectStore (Requirement 2.3)');
  console.log('-'.repeat(80));
  try {
    const testProject: ProjectData = {
      project_id: 'verify-test-3',
      project_name: 'verify-test-project-3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(testProject.project_name, testProject);
    
    // Verify project exists
    const beforeDelete = await projectStore.load(testProject.project_name);
    if (!beforeDelete) {
      console.log('❌ FAIL: Project not saved correctly');
      allPassed = false;
    } else {
      // Delete project
      const result = await lifecycleManager.deleteProject(testProject.project_name, true);
      
      // Verify project deleted
      const afterDelete = await projectStore.load(testProject.project_name);
      
      if (result.success && !afterDelete) {
        console.log('✅ PASS: Project deleted from S3 successfully');
      } else {
        console.log('❌ FAIL: Project not deleted from S3');
        allPassed = false;
      }
    }
  } catch (error) {
    console.log('❌ FAIL: Error in S3 deletion test:', error);
    allPassed = false;
  }
  console.log();

  // Test 4: Session context update (Requirement 2.4)
  console.log('Test 4: Update session context when active project deleted (Requirement 2.4)');
  console.log('-'.repeat(80));
  try {
    const testProject: ProjectData = {
      project_id: 'verify-test-4',
      project_name: 'verify-test-project-4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(testProject.project_name, testProject);
    
    const sessionId = 'verify-session-4';
    await sessionContextManager.setActiveProject(sessionId, testProject.project_name);
    
    // Verify active project is set
    const beforeDelete = await sessionContextManager.getActiveProject(sessionId);
    if (beforeDelete !== testProject.project_name) {
      console.log('❌ FAIL: Active project not set correctly');
      allPassed = false;
    } else {
      // Delete project
      await lifecycleManager.deleteProject(testProject.project_name, true, sessionId);
      
      // Verify active project cleared
      const afterDelete = await sessionContextManager.getActiveProject(sessionId);
      
      if (afterDelete === '') {
        console.log('✅ PASS: Active project cleared from session context');
      } else {
        console.log('❌ FAIL: Active project not cleared from session context');
        allPassed = false;
      }
    }
  } catch (error) {
    console.log('❌ FAIL: Error in session context test:', error);
    allPassed = false;
  }
  console.log();

  // Test 5: Cache invalidation (Requirement 2.5)
  console.log('Test 5: Clear resolver cache after deletion (Requirement 2.5)');
  console.log('-'.repeat(80));
  try {
    const testProject: ProjectData = {
      project_id: 'verify-test-5',
      project_name: 'verify-test-project-5',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(testProject.project_name, testProject);
    
    const sessionContext = {
      session_id: 'verify-session-5',
      user_id: 'test-user',
      project_history: [],
      last_updated: new Date().toISOString(),
    };
    
    // Resolve to populate cache
    await projectResolver.resolve(testProject.project_name, sessionContext);
    
    // Delete project
    await lifecycleManager.deleteProject(testProject.project_name, true);
    
    // Try to resolve again - should not find deleted project
    const afterDelete = await projectResolver.resolve(testProject.project_name, sessionContext);
    
    if (!afterDelete) {
      console.log('✅ PASS: Resolver cache cleared after deletion');
    } else {
      console.log('❌ FAIL: Resolver cache not cleared');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error in cache invalidation test:', error);
    allPassed = false;
  }
  console.log();

  // Test 6: In-progress project check (Requirement 2.7)
  console.log('Test 6: In-progress project check (Requirement 2.7)');
  console.log('-'.repeat(80));
  try {
    const testProject: ProjectData = {
      project_id: 'verify-test-6',
      project_name: 'verify-test-project-6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        status: 'in_progress',
      },
    };

    await projectStore.save(testProject.project_name, testProject);
    
    const result = await lifecycleManager.deleteProject(testProject.project_name, true);
    
    if (!result.success && result.message.includes('currently being processed')) {
      console.log('✅ PASS: In-progress project deletion prevented');
      
      // Clean up - update status and delete
      testProject.metadata!.status = 'completed';
      await projectStore.save(testProject.project_name, testProject);
      await lifecycleManager.deleteProject(testProject.project_name, true);
    } else {
      console.log('❌ FAIL: In-progress project deletion not prevented');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ FAIL: Error in in-progress check test:', error);
    allPassed = false;
  }
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log();
    console.log('Task 4: Single Project Deletion is COMPLETE');
    console.log();
    console.log('Implemented features:');
    console.log('  ✓ Confirmation prompt before deletion (Requirement 2.1)');
    console.log('  ✓ Project existence validation (Requirement 2.2)');
    console.log('  ✓ S3 deletion via ProjectStore (Requirement 2.3)');
    console.log('  ✓ Session context update when active project deleted (Requirement 2.4)');
    console.log('  ✓ Resolver cache clearing after deletion (Requirement 2.5)');
    console.log('  ✓ In-progress project check (Requirement 2.7)');
    console.log();
    console.log('Next steps:');
    console.log('  - Run integration tests: npm test -- tests/integration/test-delete-project-integration.test.ts');
    console.log('  - Test in deployed environment');
    console.log('  - Move to Task 5: Implement bulk project deletion');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log();
    console.log('Please review the failed tests above and fix any issues.');
  }
  console.log('='.repeat(80));

  process.exit(allPassed ? 0 : 1);
}

// Run verification
verifyDeleteProject().catch((error) => {
  console.error('Verification failed with error:', error);
  process.exit(1);
});
