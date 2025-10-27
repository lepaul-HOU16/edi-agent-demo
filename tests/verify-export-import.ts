/**
 * Verification script for export/import functionality
 * 
 * Tests:
 * - Export project with all data
 * - Import project with validation
 * - Handle name conflicts during import
 * - Validate export format version
 * - Include artifact S3 keys in export
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

async function verifyExportImport() {
  console.log('='.repeat(80));
  console.log('EXPORT/IMPORT FUNCTIONALITY VERIFICATION');
  console.log('='.repeat(80));

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

  let allTestsPassed = true;

  // Test 1: Export project with all data
  console.log('\n📦 Test 1: Export project with all data');
  console.log('-'.repeat(80));
  try {
    // Create a test project
    await projectStore.save('test-export-project', {
      project_id: 'proj-test-export',
      project_name: 'test-export-project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      coordinates: {
        latitude: 35.0,
        longitude: -101.0,
      },
      terrain_results: {
        s3_key: 'renewable/projects/test-export-project/terrain.json',
        data: 'terrain data',
      },
      layout_results: {
        s3_key: 'renewable/projects/test-export-project/layout.json',
        data: 'layout data',
      },
      metadata: {
        turbine_count: 50,
        total_capacity_mw: 150,
      },
    });

    const exportData = await lifecycleManager.exportProject('test-export-project');

    if (!exportData) {
      console.log('❌ FAILED: Export returned null');
      allTestsPassed = false;
    } else if (exportData.version !== '1.0') {
      console.log(`❌ FAILED: Invalid version: ${exportData.version}`);
      allTestsPassed = false;
    } else if (!exportData.project) {
      console.log('❌ FAILED: Missing project data');
      allTestsPassed = false;
    } else if (!exportData.artifacts) {
      console.log('❌ FAILED: Missing artifacts');
      allTestsPassed = false;
    } else if (exportData.artifacts.terrain !== 'renewable/projects/test-export-project/terrain.json') {
      console.log('❌ FAILED: Incorrect terrain artifact S3 key');
      allTestsPassed = false;
    } else {
      console.log('✅ PASSED: Export includes all data and artifact S3 keys');
      console.log(`   Version: ${exportData.version}`);
      console.log(`   Project: ${exportData.project.project_name}`);
      console.log(`   Coordinates: ${exportData.project.coordinates?.latitude}, ${exportData.project.coordinates?.longitude}`);
      console.log(`   Artifacts: terrain=${!!exportData.artifacts.terrain}, layout=${!!exportData.artifacts.layout}`);
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    allTestsPassed = false;
  }

  // Test 2: Import project successfully
  console.log('\n📥 Test 2: Import project successfully');
  console.log('-'.repeat(80));
  try {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        project_id: 'proj-test-import',
        project_name: 'test-import-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 36.0,
          longitude: -102.0,
        },
        metadata: {
          turbine_count: 30,
        },
      },
      artifacts: {
        terrain: 'renewable/projects/test-import-project/terrain.json',
      },
    };

    const result = await lifecycleManager.importProject(exportData);

    if (!result.success) {
      console.log(`❌ FAILED: ${result.message}`);
      allTestsPassed = false;
    } else if (result.projectName !== 'test-import-project') {
      console.log(`❌ FAILED: Incorrect project name: ${result.projectName}`);
      allTestsPassed = false;
    } else {
      console.log('✅ PASSED: Import successful');
      console.log(`   Project name: ${result.projectName}`);
      console.log(`   Message: ${result.message}`);

      // Verify imported project exists
      const imported = await projectStore.load('test-import-project');
      if (!imported) {
        console.log('❌ FAILED: Imported project not found in store');
        allTestsPassed = false;
      } else if (!imported.metadata?.imported_at) {
        console.log('❌ FAILED: Missing imported_at timestamp');
        allTestsPassed = false;
      } else {
        console.log('✅ PASSED: Imported project verified in store');
        console.log(`   Imported at: ${imported.metadata.imported_at}`);
      }
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    allTestsPassed = false;
  }

  // Test 3: Handle name conflicts during import
  console.log('\n🔄 Test 3: Handle name conflicts during import');
  console.log('-'.repeat(80));
  try {
    // Import the same project again (should create with -imported suffix)
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        project_id: 'proj-test-import-2',
        project_name: 'test-import-project', // Same name as before
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: 36.0,
          longitude: -102.0,
        },
      },
      artifacts: {},
    };

    const result = await lifecycleManager.importProject(exportData);

    if (!result.success) {
      console.log(`❌ FAILED: ${result.message}`);
      allTestsPassed = false;
    } else if (!result.projectName.includes('imported')) {
      console.log(`❌ FAILED: Name conflict not handled: ${result.projectName}`);
      allTestsPassed = false;
    } else {
      console.log('✅ PASSED: Name conflict handled correctly');
      console.log(`   Original name: test-import-project`);
      console.log(`   Imported as: ${result.projectName}`);
      console.log(`   Message: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    allTestsPassed = false;
  }

  // Test 4: Validate export format version
  console.log('\n🔍 Test 4: Validate export format version');
  console.log('-'.repeat(80));
  try {
    const exportData = {
      version: '2.0', // Unsupported version
      exportedAt: new Date().toISOString(),
      project: {
        project_id: 'proj-test-version',
        project_name: 'test-version-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      artifacts: {},
    };

    const result = await lifecycleManager.importProject(exportData);

    if (result.success) {
      console.log('❌ FAILED: Should reject unsupported version');
      allTestsPassed = false;
    } else if (!result.message.includes('Unsupported export version')) {
      console.log(`❌ FAILED: Wrong error message: ${result.message}`);
      allTestsPassed = false;
    } else {
      console.log('✅ PASSED: Unsupported version rejected');
      console.log(`   Message: ${result.message}`);
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    allTestsPassed = false;
  }

  // Test 5: Export non-existent project
  console.log('\n❓ Test 5: Export non-existent project');
  console.log('-'.repeat(80));
  try {
    await lifecycleManager.exportProject('nonexistent-project');
    console.log('❌ FAILED: Should throw error for non-existent project');
    allTestsPassed = false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      console.log('✅ PASSED: Non-existent project error thrown');
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`❌ FAILED: Wrong error: ${error instanceof Error ? error.message : String(error)}`);
      allTestsPassed = false;
    }
  }

  // Cleanup
  console.log('\n🧹 Cleanup');
  console.log('-'.repeat(80));
  try {
    await projectStore.delete('test-export-project');
    await projectStore.delete('test-import-project');
    // Try to delete the imported project with suffix
    try {
      await projectStore.delete('test-import-project-imported');
    } catch (e) {
      // Ignore if doesn't exist
    }
    console.log('✅ Test projects cleaned up');
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\nExport/Import functionality is working correctly:');
    console.log('  ✓ Export includes all project data and artifact S3 keys');
    console.log('  ✓ Import creates new project with validation');
    console.log('  ✓ Name conflicts handled with -imported suffix');
    console.log('  ✓ Export format version validated');
    console.log('  ✓ Error handling for non-existent projects');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nPlease review the failures above.');
  }
  console.log('='.repeat(80));

  return allTestsPassed;
}

// Run verification
verifyExportImport()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });
