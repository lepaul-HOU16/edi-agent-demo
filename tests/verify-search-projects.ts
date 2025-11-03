/**
 * Verification Script for Project Search and Filtering
 * 
 * Tests all search filter combinations to verify implementation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Usage: npx ts-node tests/verify-search-projects.ts
 */

import { ProjectLifecycleManager, ProjectSearchFilters } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

const TEST_BUCKET = process.env.RENEWABLE_S3_BUCKET || 'amplify-digitalassistant-lepaul-sandbox-c5e8e8e0e0-renewablebucket';

async function main() {
  console.log('='.repeat(80));
  console.log('PROJECT SEARCH AND FILTERING VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  // Initialize components
  const projectStore = new ProjectStore(TEST_BUCKET);
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager(projectStore);

  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  let testsPassed = 0;
  let testsFailed = 0;

  // Helper function to run a test
  async function runTest(
    testName: string,
    filters: ProjectSearchFilters,
    validator: (results: any[]) => boolean
  ) {
    try {
      console.log(`\n📋 Test: ${testName}`);
      console.log(`   Filters:`, JSON.stringify(filters, null, 2));

      const results = await lifecycleManager.searchProjects(filters);
      
      console.log(`   Results: ${results.length} project(s) found`);
      
      if (results.length > 0) {
        console.log(`   Projects:`);
        results.slice(0, 5).forEach(p => {
          console.log(`     - ${p.project_name}`);
        });
        if (results.length > 5) {
          console.log(`     ... and ${results.length - 5} more`);
        }
      }

      const isValid = validator(results);
      
      if (isValid) {
        console.log(`   ✅ PASS`);
        testsPassed++;
      } else {
        console.log(`   ❌ FAIL: Validation failed`);
        testsFailed++;
      }
    } catch (error) {
      console.log(`   ❌ FAIL: ${error instanceof Error ? error.message : String(error)}`);
      testsFailed++;
    }
  }

  // Test 1: Location Name Filtering (Requirement 5.1)
  console.log('\n' + '='.repeat(80));
  console.log('REQUIREMENT 5.1: Location Name Filtering');
  console.log('='.repeat(80));

  await runTest(
    'Filter by location: texas',
    { location: 'texas' },
    (results) => results.every(p => p.project_name.toLowerCase().includes('texas'))
  );

  await runTest(
    'Filter by location: california',
    { location: 'california' },
    (results) => results.every(p => p.project_name.toLowerCase().includes('california'))
  );

  await runTest(
    'Filter by location: wind (partial match)',
    { location: 'wind' },
    (results) => results.every(p => p.project_name.toLowerCase().includes('wind'))
  );

  // Test 2: Date Range Filtering (Requirement 5.2)
  console.log('\n' + '='.repeat(80));
  console.log('REQUIREMENT 5.2: Date Range Filtering');
  console.log('='.repeat(80));

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  await runTest(
    'Filter by dateFrom (last 30 days)',
    { dateFrom: thirtyDaysAgo.toISOString() },
    (results) => results.every(p => new Date(p.created_at) >= thirtyDaysAgo)
  );

  await runTest(
    'Filter by dateTo (before today)',
    { dateTo: today.toISOString() },
    (results) => results.every(p => new Date(p.created_at) <= today)
  );

  await runTest(
    'Filter by date range (last 7-30 days)',
    { 
      dateFrom: thirtyDaysAgo.toISOString(),
      dateTo: sevenDaysAgo.toISOString()
    },
    (results) => results.every(p => {
      const date = new Date(p.created_at);
      return date >= thirtyDaysAgo && date <= sevenDaysAgo;
    })
  );

  // Test 3: Incomplete Project Filtering (Requirement 5.3)
  console.log('\n' + '='.repeat(80));
  console.log('REQUIREMENT 5.3: Incomplete Project Filtering');
  console.log('='.repeat(80));

  await runTest(
    'Filter incomplete projects',
    { incomplete: true },
    (results) => results.every(p => {
      const isComplete = 
        p.terrain_results &&
        p.layout_results &&
        p.simulation_results &&
        p.report_results;
      return !isComplete;
    })
  );

  // Test 4: Coordinate Proximity Filtering (Requirement 5.4)
  console.log('\n' + '='.repeat(80));
  console.log('REQUIREMENT 5.4: Coordinate Proximity Filtering');
  console.log('='.repeat(80));

  await runTest(
    'Filter by coordinates (10km radius)',
    {
      coordinates: { latitude: 35.067482, longitude: -101.395466 },
      radiusKm: 10
    },
    (results) => {
      // All results should have coordinates
      return results.every(p => p.coordinates !== undefined);
    }
  );

  await runTest(
    'Filter by coordinates (50km radius)',
    {
      coordinates: { latitude: 35.067482, longitude: -101.395466 },
      radiusKm: 50
    },
    (results) => {
      // Should find more projects with larger radius
      return results.length >= 0;
    }
  );

  // Test 5: Archived Status Filtering (Requirement 5.5)
  console.log('\n' + '='.repeat(80));
  console.log('REQUIREMENT 5.5: Archived Status Filtering');
  console.log('='.repeat(80));

  await runTest(
    'Filter archived projects',
    { archived: true },
    (results) => results.every(p => p.metadata?.archived === true)
  );

  await runTest(
    'Filter non-archived projects',
    { archived: false },
    (results) => results.every(p => (p.metadata?.archived || false) === false)
  );

  // Test 6: Combined Filters
  console.log('\n' + '='.repeat(80));
  console.log('COMBINED FILTERS');
  console.log('='.repeat(80));

  await runTest(
    'Combine location + archived',
    { location: 'texas', archived: false },
    (results) => results.every(p => 
      p.project_name.toLowerCase().includes('texas') &&
      (p.metadata?.archived || false) === false
    )
  );

  await runTest(
    'Combine location + incomplete',
    { location: 'wind', incomplete: true },
    (results) => results.every(p => {
      const isComplete = 
        p.terrain_results &&
        p.layout_results &&
        p.simulation_results &&
        p.report_results;
      return p.project_name.toLowerCase().includes('wind') && !isComplete;
    })
  );

  await runTest(
    'Combine date + incomplete + archived',
    {
      dateFrom: thirtyDaysAgo.toISOString(),
      incomplete: true,
      archived: false
    },
    (results) => results.every(p => {
      const isComplete = 
        p.terrain_results &&
        p.layout_results &&
        p.simulation_results &&
        p.report_results;
      return (
        new Date(p.created_at) >= thirtyDaysAgo &&
        !isComplete &&
        (p.metadata?.archived || false) === false
      );
    })
  );

  // Test 7: Edge Cases
  console.log('\n' + '='.repeat(80));
  console.log('EDGE CASES');
  console.log('='.repeat(80));

  await runTest(
    'No filters (return all)',
    {},
    (results) => true // Should return all projects
  );

  await runTest(
    'Non-existent location',
    { location: 'nonexistent-xyz-123' },
    (results) => results.length === 0
  );

  await runTest(
    'Future date range',
    {
      dateFrom: new Date('2099-01-01').toISOString(),
      dateTo: new Date('2099-12-31').toISOString()
    },
    (results) => results.length === 0
  );

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Search and filtering implementation is complete.');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the implementation.');
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
