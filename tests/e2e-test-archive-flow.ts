/**
 * E2E Test for Archive Functionality
 * 
 * Tests Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 * 
 * This test verifies the complete archive/unarchive workflow:
 * 1. Create a test project
 * 2. Archive the project
 * 3. Verify archived projects hidden from default list
 * 4. Verify active project cleared when archiving
 * 5. List archived projects explicitly
 * 6. Unarchive the project
 * 7. Verify project restored to active list
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

// Test configuration
const TEST_PROJECT_NAME = 'test-archive-project';
const TEST_SESSION_ID = 'test-session-archive';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function printSuccess(message: string) {
  console.log(`${GREEN}✓ ${message}${RESET}`);
}

function printError(message: string) {
  console.log(`${RED}✗ ${message}${RESET}`);
}

function printInfo(message: string) {
  console.log(`${YELLOW}ℹ ${message}${RESET}`);
}

async function runTest() {
  console.log('========================================');
  console.log('E2E Archive Functionality Test');
  console.log('========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Initialize services
    printInfo('Initializing services...');
    const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();
    
    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );
    printSuccess('Services initialized\n');

    // Clean up any existing test project
    printInfo('Cleaning up existing test project...');
    try {
      await projectStore.delete(TEST_PROJECT_NAME);
    } catch (error) {
      // Ignore if doesn't exist
    }
    printSuccess('Cleanup complete\n');

    // Test 1: Create a test project
    printInfo('Test 1: Creating test project...');
    const testProject: ProjectData = {
      project_id: 'test-proj-archive-123',
      project_name: TEST_PROJECT_NAME,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: {
        latitude: 35.0,
        longitude: -101.0,
      },
      terrain_results: { data: 'test terrain' },
      layout_results: { data: 'test layout' },
    };

    await projectStore.save(TEST_PROJECT_NAME, testProject);
    
    // Verify project was created
    const createdProject = await projectStore.load(TEST_PROJECT_NAME);
    if (createdProject && createdProject.project_name === TEST_PROJECT_NAME) {
      printSuccess('Test 1 PASSED: Project created successfully\n');
      testsPassed++;
    } else {
      printError('Test 1 FAILED: Project not created\n');
      testsFailed++;
    }

    // Test 2: Set as active project
    printInfo('Test 2: Setting project as active...');
    await sessionContextManager.setActiveProject(TEST_SESSION_ID, TEST_PROJECT_NAME);
    
    const activeProject = await sessionContextManager.getActiveProject(TEST_SESSION_ID);
    if (activeProject === TEST_PROJECT_NAME) {
      printSuccess('Test 2 PASSED: Project set as active\n');
      testsPassed++;
    } else {
      printError('Test 2 FAILED: Project not set as active\n');
      testsFailed++;
    }

    // Test 3: Verify project in active list
    printInfo('Test 3: Verifying project in active list...');
    let activeProjects = await lifecycleManager.listActiveProjects();
    const foundInActive = activeProjects.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (foundInActive) {
      printSuccess('Test 3 PASSED: Project found in active list\n');
      testsPassed++;
    } else {
      printError('Test 3 FAILED: Project not found in active list\n');
      testsFailed++;
    }

    // Test 4: Archive the project (Requirement 8.1)
    printInfo('Test 4: Archiving project...');
    const archiveResult = await lifecycleManager.archiveProject(TEST_PROJECT_NAME, TEST_SESSION_ID);
    
    if (archiveResult.success) {
      printSuccess('Test 4 PASSED: Project archived successfully\n');
      testsPassed++;
    } else {
      printError(`Test 4 FAILED: ${archiveResult.message}\n`);
      testsFailed++;
    }

    // Test 5: Verify active project cleared (Requirement 8.5)
    printInfo('Test 5: Verifying active project cleared...');
    const activeAfterArchive = await sessionContextManager.getActiveProject(TEST_SESSION_ID);
    
    if (activeAfterArchive === '' || activeAfterArchive === null) {
      printSuccess('Test 5 PASSED: Active project cleared when archiving\n');
      testsPassed++;
    } else {
      printError(`Test 5 FAILED: Active project not cleared (still: ${activeAfterArchive})\n`);
      testsFailed++;
    }

    // Test 6: Verify archived project hidden from default list (Requirement 8.2)
    printInfo('Test 6: Verifying archived project hidden from active list...');
    activeProjects = await lifecycleManager.listActiveProjects();
    const stillInActive = activeProjects.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (!stillInActive) {
      printSuccess('Test 6 PASSED: Archived project hidden from active list\n');
      testsPassed++;
    } else {
      printError('Test 6 FAILED: Archived project still in active list\n');
      testsFailed++;
    }

    // Test 7: List archived projects explicitly (Requirement 8.3)
    printInfo('Test 7: Listing archived projects...');
    const archivedProjects = await lifecycleManager.listArchivedProjects();
    const foundInArchived = archivedProjects.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (foundInArchived) {
      printSuccess('Test 7 PASSED: Project found in archived list\n');
      testsPassed++;
    } else {
      printError('Test 7 FAILED: Project not found in archived list\n');
      testsFailed++;
    }

    // Test 8: Verify archived flag set
    printInfo('Test 8: Verifying archived flag...');
    const archivedProject = await projectStore.load(TEST_PROJECT_NAME);
    
    if (archivedProject?.metadata?.archived === true && archivedProject?.metadata?.archived_at) {
      printSuccess('Test 8 PASSED: Archived flag and timestamp set correctly\n');
      testsPassed++;
    } else {
      printError('Test 8 FAILED: Archived flag or timestamp not set\n');
      testsFailed++;
    }

    // Test 9: Verify project still accessible by name (Requirement 8.6)
    printInfo('Test 9: Verifying archived project accessible by name...');
    const loadedArchived = await projectStore.load(TEST_PROJECT_NAME);
    
    if (loadedArchived && loadedArchived.project_name === TEST_PROJECT_NAME) {
      printSuccess('Test 9 PASSED: Archived project accessible by explicit name\n');
      testsPassed++;
    } else {
      printError('Test 9 FAILED: Archived project not accessible\n');
      testsFailed++;
    }

    // Test 10: Search with archived filter
    printInfo('Test 10: Testing search with archived filter...');
    const searchActive = await lifecycleManager.searchProjects({ archived: false });
    const searchArchived = await lifecycleManager.searchProjects({ archived: true });
    
    const notInActiveSearch = !searchActive.some(p => p.project_name === TEST_PROJECT_NAME);
    const inArchivedSearch = searchArchived.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (notInActiveSearch && inArchivedSearch) {
      printSuccess('Test 10 PASSED: Search filters work correctly\n');
      testsPassed++;
    } else {
      printError('Test 10 FAILED: Search filters not working\n');
      testsFailed++;
    }

    // Test 11: Unarchive the project (Requirement 8.4)
    printInfo('Test 11: Unarchiving project...');
    const unarchiveResult = await lifecycleManager.unarchiveProject(TEST_PROJECT_NAME);
    
    if (unarchiveResult.success) {
      printSuccess('Test 11 PASSED: Project unarchived successfully\n');
      testsPassed++;
    } else {
      printError(`Test 11 FAILED: ${unarchiveResult.message}\n`);
      testsFailed++;
    }

    // Test 12: Verify project back in active list
    printInfo('Test 12: Verifying project restored to active list...');
    activeProjects = await lifecycleManager.listActiveProjects();
    const backInActive = activeProjects.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (backInActive) {
      printSuccess('Test 12 PASSED: Project restored to active list\n');
      testsPassed++;
    } else {
      printError('Test 12 FAILED: Project not restored to active list\n');
      testsFailed++;
    }

    // Test 13: Verify archived flag removed
    printInfo('Test 13: Verifying archived flag removed...');
    const unarchivedProject = await projectStore.load(TEST_PROJECT_NAME);
    
    if (unarchivedProject?.metadata?.archived === false) {
      printSuccess('Test 13 PASSED: Archived flag removed\n');
      testsPassed++;
    } else {
      printError('Test 13 FAILED: Archived flag not removed\n');
      testsFailed++;
    }

    // Test 14: Verify not in archived list anymore
    printInfo('Test 14: Verifying project removed from archived list...');
    const archivedAfterUnarchive = await lifecycleManager.listArchivedProjects();
    const stillInArchivedList = archivedAfterUnarchive.some(p => p.project_name === TEST_PROJECT_NAME);
    
    if (!stillInArchivedList) {
      printSuccess('Test 14 PASSED: Project removed from archived list\n');
      testsPassed++;
    } else {
      printError('Test 14 FAILED: Project still in archived list\n');
      testsFailed++;
    }

    // Cleanup
    printInfo('Cleaning up test project...');
    await projectStore.delete(TEST_PROJECT_NAME);
    printSuccess('Cleanup complete\n');

  } catch (error) {
    printError(`Test execution failed: ${error instanceof Error ? error.message : String(error)}\n`);
    testsFailed++;
  }

  // Print summary
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`${GREEN}Passed: ${testsPassed}${RESET}`);
  console.log(`${RED}Failed: ${testsFailed}${RESET}`);
  console.log('========================================\n');

  if (testsFailed === 0) {
    printSuccess('ALL TESTS PASSED! ✓');
    console.log('\nArchive functionality is working correctly.');
    console.log('Requirements verified:');
    console.log('  • 8.1: Archive project');
    console.log('  • 8.2: Archived projects hidden from default list');
    console.log('  • 8.3: List archived projects explicitly');
    console.log('  • 8.4: Unarchive project');
    console.log('  • 8.5: Active project cleared when archiving');
    console.log('  • 8.6: Archived projects accessible by explicit name');
    process.exit(0);
  } else {
    printError('SOME TESTS FAILED! ✗');
    console.log('\nPlease review the failures above.');
    process.exit(1);
  }
}

// Run the test
runTest().catch((error) => {
  printError(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
