#!/usr/bin/env node
/**
 * Verification script for Task 13: Integrate deduplication into terrain analysis flow
 * 
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * This script verifies that:
 * 1. Duplicate detection works before terrain analysis
 * 2. User prompts are generated correctly
 * 3. User choices are handled properly
 * 4. Session context is updated correctly
 */

import { ProjectStore } from '../amplify/functions/shared/projectStore';
import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TASK 13 VERIFICATION: Deduplication in Terrain Analysis');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Initialize components
  const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager(process.env.SESSION_CONTEXT_TABLE);
  
  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  const testSessionId = `verify-session-${Date.now()}`;
  const testProjectName = `verify-terrain-${Date.now()}`;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Create a project at test coordinates
    console.log('📝 Test 1: Creating test project at coordinates...');
    await projectStore.save(testProjectName, {
      project_id: `proj-${Date.now()}`,
      project_name: testProjectName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: TEST_COORDINATES,
      terrain_results: { test: 'data' }
    });
    console.log(`✅ Test 1 PASSED: Created project ${testProjectName}\n`);
    testsPassed++;

    // Test 2: Check for duplicates (Requirement 1.1)
    console.log('📝 Test 2: Checking for duplicate projects...');
    const duplicateCheck = await lifecycleManager.checkForDuplicates(
      TEST_COORDINATES,
      1.0
    );
    
    if (duplicateCheck.hasDuplicates) {
      console.log(`✅ Test 2 PASSED: Detected ${duplicateCheck.duplicates.length} duplicate(s)`);
      console.log(`   - Found project: ${duplicateCheck.duplicates[0].project.project_name}`);
      console.log(`   - Distance: ${duplicateCheck.duplicates[0].distanceKm.toFixed(3)}km\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 2 FAILED: No duplicates detected\n');
      testsFailed++;
    }

    // Test 3: Verify user prompt generation (Requirement 1.2)
    console.log('📝 Test 3: Verifying user prompt generation...');
    if (duplicateCheck.userPrompt) {
      const hasOptions = 
        duplicateCheck.userPrompt.includes('1. Continue with existing project') &&
        duplicateCheck.userPrompt.includes('2. Create new project') &&
        duplicateCheck.userPrompt.includes('3. View existing project details');
      
      if (hasOptions) {
        console.log('✅ Test 3 PASSED: User prompt contains all options');
        console.log(`   Prompt preview: ${duplicateCheck.userPrompt.substring(0, 100)}...\n`);
        testsPassed++;
      } else {
        console.log('❌ Test 3 FAILED: User prompt missing options\n');
        testsFailed++;
      }
    } else {
      console.log('❌ Test 3 FAILED: No user prompt generated\n');
      testsFailed++;
    }

    // Test 4: Handle choice 1 - Continue with existing (Requirement 1.3)
    console.log('📝 Test 4: Testing choice 1 (Continue with existing)...');
    const choice1Result = await lifecycleManager.handleDuplicateChoice(
      '1',
      duplicateCheck.duplicates,
      testSessionId
    );
    
    if (choice1Result.action === 'continue' && choice1Result.projectName === testProjectName) {
      console.log('✅ Test 4 PASSED: Choice 1 handled correctly');
      console.log(`   - Action: ${choice1Result.action}`);
      console.log(`   - Project: ${choice1Result.projectName}\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 4 FAILED: Choice 1 not handled correctly\n');
      testsFailed++;
    }

    // Test 5: Verify session context update (Requirement 1.4)
    console.log('📝 Test 5: Verifying session context update...');
    const activeProject = await sessionContextManager.getActiveProject(testSessionId);
    const context = await sessionContextManager.getContext(testSessionId);
    
    if (activeProject === testProjectName && context.project_history.includes(testProjectName)) {
      console.log('✅ Test 5 PASSED: Session context updated correctly');
      console.log(`   - Active project: ${activeProject}`);
      console.log(`   - In history: ${context.project_history.includes(testProjectName)}\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 5 FAILED: Session context not updated correctly\n');
      testsFailed++;
    }

    // Test 6: Handle choice 2 - Create new (Requirement 1.3)
    console.log('📝 Test 6: Testing choice 2 (Create new project)...');
    const choice2Result = await lifecycleManager.handleDuplicateChoice(
      '2',
      duplicateCheck.duplicates,
      testSessionId
    );
    
    if (choice2Result.action === 'create_new') {
      console.log('✅ Test 6 PASSED: Choice 2 handled correctly');
      console.log(`   - Action: ${choice2Result.action}\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 6 FAILED: Choice 2 not handled correctly\n');
      testsFailed++;
    }

    // Test 7: Handle choice 3 - View details (Requirement 1.3)
    console.log('📝 Test 7: Testing choice 3 (View details)...');
    const choice3Result = await lifecycleManager.handleDuplicateChoice(
      '3',
      duplicateCheck.duplicates,
      testSessionId
    );
    
    if (choice3Result.action === 'view_details' && choice3Result.message.includes('Project Details')) {
      console.log('✅ Test 7 PASSED: Choice 3 handled correctly');
      console.log(`   - Action: ${choice3Result.action}`);
      console.log(`   - Shows details: ${choice3Result.message.includes('Completion')}\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 7 FAILED: Choice 3 not handled correctly\n');
      testsFailed++;
    }

    // Test 8: Verify no duplicates outside radius
    console.log('📝 Test 8: Verifying radius filtering...');
    const farCoordinates = {
      latitude: TEST_COORDINATES.latitude + 0.1, // ~11km away
      longitude: TEST_COORDINATES.longitude + 0.1
    };
    
    const farCheck = await lifecycleManager.checkForDuplicates(
      farCoordinates,
      1.0
    );
    
    const foundTestProject = farCheck.duplicates.some(
      d => d.project.project_name === testProjectName
    );
    
    if (!foundTestProject) {
      console.log('✅ Test 8 PASSED: Projects outside radius not detected');
      console.log(`   - Test project not found at 11km distance\n`);
      testsPassed++;
    } else {
      console.log('❌ Test 8 FAILED: Project detected outside radius\n');
      testsFailed++;
    }

  } catch (error) {
    console.error('❌ ERROR during verification:', error);
    testsFailed++;
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    try {
      await projectStore.delete(testProjectName);
      console.log(`✅ Deleted test project: ${testProjectName}\n`);
    } catch (error) {
      console.error('⚠️  Failed to cleanup test project:', error);
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Task 13 implementation is complete.\n');
    console.log('✅ Requirements verified:');
    console.log('   - 1.1: Duplicate detection before terrain analysis');
    console.log('   - 1.2: User prompt generation with options');
    console.log('   - 1.3: User choice handling (continue/create/view)');
    console.log('   - 1.4: Session context updates\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the implementation.\n');
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
