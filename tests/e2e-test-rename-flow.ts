/**
 * End-to-End Test for Rename Flow
 * 
 * Tests the complete rename workflow from user perspective:
 * - Creating a project
 * - Renaming it with valid name
 * - Attempting to rename to existing name
 * - Verifying S3 path updates
 * - Verifying session context updates
 * - Verifying project history updates
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function logStep(message: string) {
  log(`\n${message}`, colors.cyan);
}

async function runE2ETest() {
  log('\n=== End-to-End Rename Flow Test ===\n', colors.cyan);

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

  const testSessionId = 'e2e-test-session-' + Date.now();
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ========================================================================
    // Scenario 1: Create and rename a project
    // ========================================================================
    logStep('--- Scenario 1: Create and Rename Project ---');

    // Step 1.1: Create a project
    logInfo('Creating test project...');
    const project1: ProjectData = {
      project_id: 'e2e-proj-1-' + Date.now(),
      project_name: 'e2e-original-project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: {
        latitude: 35.0,
        longitude: -101.0,
      },
      terrain_results: {
        features: [{ type: 'road' }, { type: 'building' }],
        analysis_complete: true,
      },
      layout_results: {
        turbines: [{ x: 0, y: 0 }],
        capacity: 50,
      },
      metadata: {
        turbine_count: 25,
        test_data: 'important_value',
      },
    };

    await projectStore.save(project1.project_name, project1);
    logSuccess('Project created: e2e-original-project');
    testsPassed++;

    // Step 1.2: Set as active project
    logInfo('Setting as active project...');
    await sessionContextManager.setActiveProject(testSessionId, 'e2e-original-project');
    await sessionContextManager.addToHistory(testSessionId, 'e2e-original-project');
    logSuccess('Project set as active');
    testsPassed++;

    // Step 1.3: Rename the project
    logInfo('Renaming project to e2e-renamed-project...');
    const renameResult = await lifecycleManager.renameProject(
      'e2e-original-project',
      'e2e-renamed-project',
      testSessionId
    );

    if (renameResult.success) {
      logSuccess(`Rename succeeded: ${renameResult.message}`);
      testsPassed++;
    } else {
      logError(`Rename failed: ${renameResult.message}`);
      testsFailed++;
    }

    // Step 1.4: Verify old project is gone (Requirement 3.3)
    logInfo('Verifying old project deleted...');
    const oldProject = await projectStore.load('e2e-original-project');
    if (!oldProject) {
      logSuccess('Old project successfully deleted');
      testsPassed++;
    } else {
      logError('Old project still exists!');
      testsFailed++;
    }

    // Step 1.5: Verify new project exists with all data (Requirements 3.2, 3.3)
    logInfo('Verifying new project exists with all data...');
    const newProject = await projectStore.load('e2e-renamed-project');
    
    if (newProject) {
      let dataIntact = true;
      
      if (newProject.project_id !== project1.project_id) {
        logError('Project ID changed!');
        dataIntact = false;
      }
      
      if (JSON.stringify(newProject.coordinates) !== JSON.stringify(project1.coordinates)) {
        logError('Coordinates changed!');
        dataIntact = false;
      }
      
      if (JSON.stringify(newProject.terrain_results) !== JSON.stringify(project1.terrain_results)) {
        logError('Terrain results changed!');
        dataIntact = false;
      }
      
      if (JSON.stringify(newProject.layout_results) !== JSON.stringify(project1.layout_results)) {
        logError('Layout results changed!');
        dataIntact = false;
      }
      
      if (JSON.stringify(newProject.metadata) !== JSON.stringify(project1.metadata)) {
        logError('Metadata changed!');
        dataIntact = false;
      }
      
      if (dataIntact) {
        logSuccess('All project data preserved');
        testsPassed++;
      } else {
        testsFailed++;
      }
    } else {
      logError('New project not found!');
      testsFailed++;
    }

    // Step 1.6: Verify session context updated (Requirement 3.6)
    logInfo('Verifying session context updated...');
    const activeProject = await sessionContextManager.getActiveProject(testSessionId);
    const context = await sessionContextManager.getContext(testSessionId);

    if (activeProject === 'e2e-renamed-project') {
      logSuccess('Active project updated correctly');
      testsPassed++;
    } else {
      logError(`Active project is ${activeProject}, expected e2e-renamed-project`);
      testsFailed++;
    }

    if (context.project_history.includes('e2e-renamed-project')) {
      logSuccess('Project history updated correctly');
      testsPassed++;
    } else {
      logError('Project history not updated');
      testsFailed++;
    }

    // ========================================================================
    // Scenario 2: Attempt to rename to existing name
    // ========================================================================
    logStep('--- Scenario 2: Prevent Rename to Existing Name ---');

    // Step 2.1: Create another project
    logInfo('Creating second project...');
    const project2: ProjectData = {
      project_id: 'e2e-proj-2-' + Date.now(),
      project_name: 'e2e-another-project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(project2.project_name, project2);
    logSuccess('Second project created: e2e-another-project');
    testsPassed++;

    // Step 2.2: Try to rename first project to second project's name
    logInfo('Attempting to rename to existing name...');
    const duplicateRenameResult = await lifecycleManager.renameProject(
      'e2e-renamed-project',
      'e2e-another-project'
    );

    if (!duplicateRenameResult.success && duplicateRenameResult.error === 'NAME_ALREADY_EXISTS') {
      logSuccess('Duplicate name correctly prevented');
      logInfo(`  Error message: ${duplicateRenameResult.message}`);
      testsPassed++;
    } else {
      logError('Duplicate name was not prevented!');
      testsFailed++;
    }

    // Step 2.3: Verify original project unchanged
    logInfo('Verifying original project unchanged...');
    const unchangedProject = await projectStore.load('e2e-renamed-project');
    if (unchangedProject && unchangedProject.project_name === 'e2e-renamed-project') {
      logSuccess('Original project unchanged');
      testsPassed++;
    } else {
      logError('Original project was modified!');
      testsFailed++;
    }

    // ========================================================================
    // Scenario 3: Rename with name normalization
    // ========================================================================
    logStep('--- Scenario 3: Name Normalization ---');

    // Step 3.1: Create a project
    logInfo('Creating project for normalization test...');
    const project3: ProjectData = {
      project_id: 'e2e-proj-3-' + Date.now(),
      project_name: 'e2e-normalize-test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await projectStore.save(project3.project_name, project3);
    logSuccess('Project created: e2e-normalize-test');
    testsPassed++;

    // Step 3.2: Rename with spaces and capitals
    logInfo('Renaming with "New Project Name With Spaces"...');
    const normalizeResult = await lifecycleManager.renameProject(
      'e2e-normalize-test',
      'New Project Name With Spaces'
    );

    if (normalizeResult.success) {
      logSuccess(`Rename succeeded with normalized name: ${normalizeResult.newName}`);
      
      // Verify normalized name is kebab-case
      if (/^[a-z0-9\-]+$/.test(normalizeResult.newName)) {
        logSuccess('Name correctly normalized to kebab-case');
        testsPassed++;
      } else {
        logError('Name not properly normalized');
        testsFailed++;
      }
      
      // Verify project exists with normalized name
      const normalizedProject = await projectStore.load(normalizeResult.newName);
      if (normalizedProject) {
        logSuccess('Project accessible with normalized name');
        testsPassed++;
      } else {
        logError('Project not found with normalized name');
        testsFailed++;
      }
    } else {
      logError(`Normalization rename failed: ${normalizeResult.message}`);
      testsFailed++;
    }

    // ========================================================================
    // Scenario 4: Rename non-existent project
    // ========================================================================
    logStep('--- Scenario 4: Error Handling ---');

    // Step 4.1: Try to rename non-existent project
    logInfo('Attempting to rename non-existent project...');
    const nonExistentResult = await lifecycleManager.renameProject(
      'e2e-does-not-exist',
      'e2e-new-name'
    );

    if (!nonExistentResult.success && nonExistentResult.error === 'PROJECT_NOT_FOUND') {
      logSuccess('Non-existent project error handled correctly');
      logInfo(`  Error message: ${nonExistentResult.message}`);
      testsPassed++;
    } else {
      logError('Non-existent project error not handled correctly');
      testsFailed++;
    }

    // ========================================================================
    // Scenario 5: Multiple sequential renames
    // ========================================================================
    logStep('--- Scenario 5: Sequential Renames ---');

    // Step 5.1: Create a project
    logInfo('Creating project for sequential renames...');
    const project5: ProjectData = {
      project_id: 'e2e-proj-5-' + Date.now(),
      project_name: 'e2e-sequential-v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        original_id: 'test-123',
      },
    };

    await projectStore.save(project5.project_name, project5);
    logSuccess('Project created: e2e-sequential-v1');
    testsPassed++;

    // Step 5.2: Rename multiple times
    logInfo('Performing sequential renames...');
    
    const rename1 = await lifecycleManager.renameProject('e2e-sequential-v1', 'e2e-sequential-v2');
    if (!rename1.success) {
      logError('First rename failed');
      testsFailed++;
    }
    
    const rename2 = await lifecycleManager.renameProject('e2e-sequential-v2', 'e2e-sequential-v3');
    if (!rename2.success) {
      logError('Second rename failed');
      testsFailed++;
    }
    
    const rename3 = await lifecycleManager.renameProject('e2e-sequential-v3', 'e2e-sequential-final');
    if (!rename3.success) {
      logError('Third rename failed');
      testsFailed++;
    }

    if (rename1.success && rename2.success && rename3.success) {
      logSuccess('All sequential renames succeeded');
      testsPassed++;
      
      // Verify final project exists with original data
      const finalProject = await projectStore.load('e2e-sequential-final');
      if (finalProject && finalProject.metadata?.original_id === 'test-123') {
        logSuccess('Final project has original data intact');
        testsPassed++;
      } else {
        logError('Final project data corrupted');
        testsFailed++;
      }
      
      // Verify intermediate names don't exist
      const v1Exists = await projectStore.load('e2e-sequential-v1');
      const v2Exists = await projectStore.load('e2e-sequential-v2');
      const v3Exists = await projectStore.load('e2e-sequential-v3');
      
      if (!v1Exists && !v2Exists && !v3Exists) {
        logSuccess('Intermediate names properly cleaned up');
        testsPassed++;
      } else {
        logError('Intermediate names still exist');
        testsFailed++;
      }
    }

    // ========================================================================
    // Cleanup
    // ========================================================================
    logStep('--- Cleanup ---');
    
    try {
      await projectStore.delete('e2e-renamed-project');
      await projectStore.delete('e2e-another-project');
      await projectStore.delete(normalizeResult.newName);
      await projectStore.delete('e2e-sequential-final');
      logSuccess('Test projects cleaned up');
    } catch (error) {
      logInfo('Cleanup had some issues (may be expected in cache-only mode)');
    }

    // ========================================================================
    // Summary
    // ========================================================================
    logStep('=== Test Summary ===');
    log(`\nTests Passed: ${testsPassed}`, colors.green);
    log(`Tests Failed: ${testsFailed}`, colors.red);
    log(`Total Tests: ${testsPassed + testsFailed}\n`);

    if (testsFailed === 0) {
      logSuccess('All E2E tests passed! ✓');
      log('\nRequirements Verified:', colors.cyan);
      log('  ✓ 3.1: Update project name in project index');
      log('  ✓ 3.2: Preserve all project data and history');
      log('  ✓ 3.3: Update S3 path from old to new');
      log('  ✓ 3.4: Check if new name already exists');
      log('  ✓ 3.5: Respond with success message');
      log('  ✓ 3.6: Update active project context with new name\n');
      process.exit(0);
    } else {
      logError(`${testsFailed} test(s) failed`);
      process.exit(1);
    }

  } catch (error) {
    logError(`\nE2E test failed with error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runE2ETest();
