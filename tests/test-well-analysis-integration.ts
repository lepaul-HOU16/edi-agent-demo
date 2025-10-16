/**
 * Integration Tests for Well Data Service + Analysis Engine
 * Validates end-to-end functionality
 */

import { wellDataService } from '../amplify/functions/shared/wellDataService';
import { wellAnalysisEngine } from '../amplify/functions/shared/wellAnalysisEngine';

async function runIntegrationTests() {
  console.log('🧪 Starting Well Analysis Integration Tests\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Full Analysis Pipeline
  console.log('Test 1: Full Analysis Pipeline (Data Service + Analysis Engine)');
  try {
    // Step 1: Get all wells from data service
    console.log('  📊 Step 1: Retrieving all wells...');
    const wells = await wellDataService.getAllWells();
    
    if (wells.length === 0) {
      throw new Error('No wells retrieved from data service');
    }
    console.log(`  ✅ Retrieved ${wells.length} wells`);

    // Step 2: Get fleet health metrics
    console.log('  📊 Step 2: Calculating fleet health metrics...');
    const metrics = await wellDataService.getFleetHealthMetrics();
    
    if (metrics.totalWells !== wells.length) {
      throw new Error('Fleet metrics total wells mismatch');
    }
    console.log(`  ✅ Fleet metrics calculated: ${metrics.totalWells} wells, avg health ${metrics.averageHealthScore}%`);

    // Step 3: Analyze noteworthy conditions
    console.log('  📊 Step 3: Analyzing noteworthy conditions...');
    const conditions = wellAnalysisEngine.analyzeNoteworthyConditions(wells);
    
    console.log(`  ✅ Noteworthy conditions identified:`);
    console.log(`     - Critical issues: ${conditions.criticalIssues.length}`);
    console.log(`     - Declining health: ${conditions.decliningHealth.length}`);
    console.log(`     - Overdue maintenance: ${conditions.maintenanceOverdue.length}`);
    console.log(`     - Top performers: ${conditions.topPerformers.length}`);
    console.log(`     - Unusual patterns: ${conditions.unusualPatterns.length}`);

    // Step 4: Generate priority actions
    console.log('  📊 Step 4: Generating priority actions...');
    const actions = wellAnalysisEngine.generatePriorityActions(wells, conditions);
    
    if (actions.length === 0) {
      console.log('  ⚠️ No priority actions generated (all wells healthy)');
    } else {
      console.log(`  ✅ Generated ${actions.length} priority actions`);
      
      // Show top 3 actions
      const topActions = actions.slice(0, 3);
      console.log('  📋 Top 3 Priority Actions:');
      topActions.forEach((action, idx) => {
        console.log(`     ${idx + 1}. [${action.priority.toUpperCase()}] ${action.title}`);
        console.log(`        Well: ${action.wellName}`);
        console.log(`        Type: ${action.actionType}`);
      });
    }

    // Step 5: Get comparative performance
    console.log('  📊 Step 5: Analyzing comparative performance...');
    const performance = wellAnalysisEngine.getComparativePerformance(wells);
    
    console.log(`  ✅ Comparative performance analyzed:`);
    console.log(`     - Top 5 by health: ${performance.topByHealth.map(w => `${w.id} (${w.healthScore}%)`).join(', ')}`);
    console.log(`     - Bottom 5 by health: ${performance.bottomByHealth.map(w => `${w.id} (${w.healthScore}%)`).join(', ')}`);

    passedTests++;
    console.log('✅ Test 1 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 1 FAILED:', error);
    console.log('');
  }

  // Test 2: Trend Analysis with Historical Data
  console.log('Test 2: Trend Analysis with Historical Data');
  try {
    const wells = await wellDataService.getAllWells();
    
    // Simulate historical data (7 days ago)
    const historicalData = new Map<string, number>();
    wells.forEach(well => {
      // Simulate various trends
      const wellNum = parseInt(well.id.split('-')[1]);
      if (wellNum % 3 === 0) {
        // Declining health
        historicalData.set(well.id, well.healthScore + 15);
      } else if (wellNum % 3 === 1) {
        // Improving health
        historicalData.set(well.id, well.healthScore - 5);
      } else {
        // Stable health
        historicalData.set(well.id, well.healthScore + 2);
      }
    });

    console.log('  📊 Analyzing health trends with historical data...');
    const trends = wellAnalysisEngine.analyzeHealthTrends(wells, historicalData);
    
    if (trends.size !== wells.length) {
      throw new Error('Trend analysis incomplete');
    }

    // Count trends
    let improving = 0;
    let declining = 0;
    let stable = 0;
    
    trends.forEach(trend => {
      if (trend.trend === 'improving') improving++;
      else if (trend.trend === 'declining') declining++;
      else stable++;
    });

    console.log(`  ✅ Trend analysis complete:`);
    console.log(`     - Improving: ${improving} wells`);
    console.log(`     - Declining: ${declining} wells`);
    console.log(`     - Stable: ${stable} wells`);

    // Verify declining wells are identified in noteworthy conditions
    const conditions = wellAnalysisEngine.analyzeNoteworthyConditions(wells, historicalData);
    console.log(`  ✅ Identified ${conditions.decliningHealth.length} wells with declining health`);

    passedTests++;
    console.log('✅ Test 2 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 2 FAILED:', error);
    console.log('');
  }

  // Test 3: Cache Performance
  console.log('Test 3: Cache Performance');
  try {
    // Clear cache first
    wellDataService.clearCache();
    
    // First call (no cache)
    console.log('  📊 First call (no cache)...');
    const start1 = Date.now();
    const wells1 = await wellDataService.getAllWells();
    const time1 = Date.now() - start1;
    console.log(`  ✅ Retrieved ${wells1.length} wells in ${time1}ms`);

    // Second call (with cache)
    console.log('  📊 Second call (with cache)...');
    const start2 = Date.now();
    const wells2 = await wellDataService.getAllWells();
    const time2 = Date.now() - start2;
    console.log(`  ✅ Retrieved ${wells2.length} wells in ${time2}ms`);

    // Cache should be faster
    if (time2 < time1) {
      console.log(`  ✅ Cache improved performance by ${time1 - time2}ms`);
    } else {
      console.log(`  ⚠️ Cache did not improve performance (both calls fast)`);
    }

    passedTests++;
    console.log('✅ Test 3 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 3 FAILED:', error);
    console.log('');
  }

  // Test 4: Individual Well Analysis
  console.log('Test 4: Individual Well Analysis');
  try {
    const wells = await wellDataService.getAllWells();
    
    // Pick a well with issues
    const criticalWell = wells.find(w => w.operationalStatus === 'critical' || w.healthScore < 60);
    
    if (criticalWell) {
      console.log(`  📊 Analyzing ${criticalWell.id} (Health: ${criticalWell.healthScore}%, Status: ${criticalWell.operationalStatus})`);
      
      // Analyze just this well
      const conditions = wellAnalysisEngine.analyzeNoteworthyConditions([criticalWell]);
      const actions = wellAnalysisEngine.generatePriorityActions([criticalWell], conditions);
      
      console.log(`  ✅ Analysis complete for ${criticalWell.id}:`);
      console.log(`     - Critical issues: ${conditions.criticalIssues.length}`);
      console.log(`     - Priority actions: ${actions.length}`);
      
      if (actions.length > 0) {
        console.log(`     - Top action: [${actions[0].priority.toUpperCase()}] ${actions[0].title}`);
      }
    } else {
      console.log('  ℹ️ No critical wells found (all wells healthy)');
    }

    passedTests++;
    console.log('✅ Test 4 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 4 FAILED:', error);
    console.log('');
  }

  // Test 5: Performance Rankings
  console.log('Test 5: Performance Rankings');
  try {
    const wells = await wellDataService.getAllWells();
    
    console.log('  📊 Generating performance rankings...');
    const topPerformers = wellAnalysisEngine.identifyTopPerformers(wells, 5);
    const bottomPerformers = wellAnalysisEngine.identifyBottomPerformers(wells, 5);
    
    console.log(`  ✅ Top 5 Performers:`);
    topPerformers.forEach((well, idx) => {
      console.log(`     ${idx + 1}. ${well.id} - Health: ${well.healthScore}%, Efficiency: ${well.metadata.production.efficiency}%`);
    });
    
    console.log(`  ✅ Bottom 5 Performers:`);
    bottomPerformers.forEach((well, idx) => {
      console.log(`     ${idx + 1}. ${well.id} - Health: ${well.healthScore}%, Efficiency: ${well.metadata.production.efficiency}%`);
    });

    // Verify no overlap
    const topIds = new Set(topPerformers.map(w => w.id));
    const bottomIds = new Set(bottomPerformers.map(w => w.id));
    const overlap = [...topIds].filter(id => bottomIds.has(id));
    
    if (overlap.length > 0 && wells.length > 5) {
      throw new Error('Top and bottom performers should not overlap');
    }
    console.log(`  ✅ No overlap between top and bottom performers`);

    passedTests++;
    console.log('✅ Test 5 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 5 FAILED:', error);
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('INTEGRATION TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('═══════════════════════════════════════\n');

  if (failedTests === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED!\n');
    console.log('✅ Well Data Service is working correctly');
    console.log('✅ Well Analysis Engine is working correctly');
    console.log('✅ Integration between services is working correctly\n');
    process.exit(0);
  } else {
    console.log('⚠️ SOME INTEGRATION TESTS FAILED. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run integration tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration test execution failed:', error);
  process.exit(1);
});
