#!/usr/bin/env node

/**
 * Test script to verify project deletion persists across sessions
 * 
 * This simulates:
 * 1. Creating a project
 * 2. Listing projects (should see it)
 * 3. Deleting the project
 * 4. Listing projects again (should NOT see it)
 * 5. Clearing cache and listing (should still NOT see it)
 */

const { ProjectStore } = require('../amplify/functions/shared/projectStore.ts');
const { ProjectLifecycleManager } = require('../amplify/functions/shared/projectLifecycleManager.ts');
const { ProjectResolver } = require('../amplify/functions/shared/projectResolver.ts');
const { ProjectNameGenerator } = require('../amplify/functions/shared/projectNameGenerator.ts');
const { SessionContextManager } = require('../amplify/functions/shared/sessionContextManager.ts');

async function testDeletionPersistence() {
  console.log('========================================');
  console.log('Project Deletion Persistence Test');
  console.log('========================================\n');

  const bucketName = process.env.RENEWABLE_S3_BUCKET || 'test-bucket';
  const testProjectName = `test-deletion-${Date.now()}`;

  console.log(`Test project name: ${testProjectName}`);
  console.log(`S3 bucket: ${bucketName}\n`);

  // Initialize components
  const projectStore = new ProjectStore(bucketName);
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager();
  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  try {
    // Step 1: Create a test project
    console.log('Step 1: Creating test project...');
    await projectStore.save(testProjectName, {
      project_id: `test-${Date.now()}`,
      project_name: testProjectName,
      status: 'completed',
      coordinates: {
        latitude: 35.0,
        longitude: -101.0
      },
      metadata: {
        test: true
      }
    });
    console.log('✅ Project created\n');

    // Step 2: List projects (should see it)
    console.log('Step 2: Listing projects (should see test project)...');
    let projects = await projectStore.list();
    const foundBefore = projects.find(p => p.project_name === testProjectName);
    if (foundBefore) {
      console.log(`✅ Found project: ${testProjectName}`);
      console.log(`   Total projects: ${projects.length}\n`);
    } else {
      console.log(`❌ Project NOT found (expected to find it)`);
      console.log(`   Total projects: ${projects.length}\n`);
      throw new Error('Project not found after creation');
    }

    // Step 3: Delete the project
    console.log('Step 3: Deleting project via ProjectLifecycleManager...');
    const deleteResult = await lifecycleManager.deleteProject(testProjectName, true);
    if (deleteResult.success) {
      console.log('✅ Project deleted successfully');
      console.log(`   Message: ${deleteResult.message}\n`);
    } else {
      console.log(`❌ Deletion failed: ${deleteResult.message}\n`);
      throw new Error('Deletion failed');
    }

    // Step 4: List projects again (should NOT see it)
    console.log('Step 4: Listing projects (should NOT see test project)...');
    projects = await projectStore.list();
    const foundAfter = projects.find(p => p.project_name === testProjectName);
    if (!foundAfter) {
      console.log(`✅ Project NOT found (correct - it was deleted)`);
      console.log(`   Total projects: ${projects.length}\n`);
    } else {
      console.log(`❌ Project STILL FOUND (incorrect - should be deleted)`);
      console.log(`   Total projects: ${projects.length}\n`);
      throw new Error('Project still exists after deletion');
    }

    // Step 5: Clear cache and list again (should still NOT see it)
    console.log('Step 5: Clearing cache and listing again...');
    projectStore.clearCache();
    projects = await projectStore.list();
    const foundAfterCacheClear = projects.find(p => p.project_name === testProjectName);
    if (!foundAfterCacheClear) {
      console.log(`✅ Project NOT found after cache clear (correct)`);
      console.log(`   Total projects: ${projects.length}\n`);
    } else {
      console.log(`❌ Project FOUND after cache clear (incorrect)`);
      console.log(`   This means the project.json file still exists in S3!\n`);
      throw new Error('Project still exists in S3 after deletion');
    }

    // Step 6: Verify cache statistics
    console.log('Step 6: Checking cache statistics...');
    const cacheStats = projectStore.getCacheStats();
    console.log(`   Project cache size: ${cacheStats.projectCacheSize}`);
    console.log(`   List cache exists: ${cacheStats.listCacheExists}`);
    console.log(`   Cache TTL: ${cacheStats.cacheTTL}ms\n`);

    console.log('========================================');
    console.log('✅ ALL TESTS PASSED');
    console.log('========================================\n');
    console.log('Project deletion persists correctly:');
    console.log('  ✅ Project deleted from S3');
    console.log('  ✅ Cache invalidated immediately');
    console.log('  ✅ Project not found in subsequent queries');
    console.log('  ✅ Project not found after cache clear');
    console.log('\nDeletion is working correctly!\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ TEST FAILED');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    // Cleanup: Try to delete test project if it still exists
    try {
      console.log('\nCleaning up test project...');
      await lifecycleManager.deleteProject(testProjectName, true);
      console.log('✅ Cleanup successful\n');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed (project may not exist)\n');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDeletionPersistence().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { testDeletionPersistence };
