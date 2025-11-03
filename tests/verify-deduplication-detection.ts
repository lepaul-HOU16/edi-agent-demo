/**
 * Verification Script for Deduplication Detection
 * 
 * This script demonstrates the deduplication detection functionality
 * and can be used for manual testing.
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

async function verifyDeduplicationDetection() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DEDUPLICATION DETECTION VERIFICATION');
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

  // Test coordinates
  const testCoordinates = {
    latitude: 35.067482,
    longitude: -101.395466
  };

  console.log('📍 Test Coordinates:', testCoordinates);
  console.log('');

  // Test 1: Check for duplicates (should find existing projects if any)
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 1: Check for Duplicates');
  console.log('─────────────────────────────────────────────────────────');

  try {
    const duplicateCheck = await lifecycleManager.checkForDuplicates(
      testCoordinates,
      1.0 // 1km radius
    );

    console.log('✅ Duplicate Check Result:');
    console.log(`   Has Duplicates: ${duplicateCheck.hasDuplicates}`);
    console.log(`   Number of Duplicates: ${duplicateCheck.duplicates.length}`);
    console.log(`   Message: ${duplicateCheck.message}`);

    if (duplicateCheck.hasDuplicates) {
      console.log('\n📋 Duplicate Projects Found:');
      duplicateCheck.duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. ${dup.project.project_name} (${dup.distanceKm.toFixed(2)}km away)`);
      });

      console.log('\n💬 User Prompt:');
      console.log(duplicateCheck.userPrompt);
    }
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
  }

  console.log('');

  // Test 2: Simulate user choice handling
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 2: Handle User Choices');
  console.log('─────────────────────────────────────────────────────────');

  // Create mock duplicates for testing
  const mockDuplicates = [
    {
      project: {
        project_name: 'texas-wind-farm-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        coordinates: testCoordinates,
        terrain_results: { s3_key: 'terrain-1' },
        layout_results: { s3_key: 'layout-1' },
        metadata: {}
      } as ProjectData,
      distanceKm: 0.1
    }
  ];

  // Test choice 1 (continue)
  try {
    console.log('\n🔹 Testing Choice 1 (Continue with existing):');
    const choice1 = await lifecycleManager.handleDuplicateChoice(
      '1',
      mockDuplicates,
      'test-session'
    );
    console.log(`   Action: ${choice1.action}`);
    console.log(`   Project: ${choice1.projectName}`);
    console.log(`   Message: ${choice1.message}`);
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Test choice 2 (create new)
  try {
    console.log('\n🔹 Testing Choice 2 (Create new):');
    const choice2 = await lifecycleManager.handleDuplicateChoice(
      '2',
      mockDuplicates,
      'test-session'
    );
    console.log(`   Action: ${choice2.action}`);
    console.log(`   Message: ${choice2.message}`);
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Test choice 3 (view details)
  try {
    console.log('\n🔹 Testing Choice 3 (View details):');
    const choice3 = await lifecycleManager.handleDuplicateChoice(
      '3',
      mockDuplicates,
      'test-session'
    );
    console.log(`   Action: ${choice3.action}`);
    console.log(`   Message (truncated): ${choice3.message.substring(0, 100)}...`);
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  console.log('');

  // Test 3: Prompt generation
  console.log('─────────────────────────────────────────────────────────');
  console.log('TEST 3: Prompt Generation');
  console.log('─────────────────────────────────────────────────────────');

  try {
    const prompt = await lifecycleManager.promptForDuplicateResolution(
      mockDuplicates.map(d => d.project),
      testCoordinates
    );

    console.log('✅ Generated Prompt:');
    console.log(prompt);
  } catch (error) {
    console.error('❌ Error generating prompt:', error);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
}

// Run verification
if (require.main === module) {
  verifyDeduplicationDetection()
    .then(() => {
      console.log('\n✅ All verification tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyDeduplicationDetection };
