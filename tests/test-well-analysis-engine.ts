/**
 * Tests for Well Analysis Engine
 * Validates AI-powered analysis functionality
 */

import { WellAnalysisEngine } from '../amplify/functions/shared/wellAnalysisEngine';
import { Well } from '../amplify/functions/shared/wellDataService';

// Test data
const mockWells: Well[] = [
  // Critical well with multiple issues
  {
    id: 'WELL-001',
    name: 'Production Well 001',
    type: 'well',
    location: 'Field A - Sector 1',
    operationalStatus: 'critical',
    healthScore: 45,
    lastMaintenanceDate: '2024-11-15',
    nextMaintenanceDate: '2024-12-15',
    sensors: [
      {
        type: 'pressure',
        currentValue: 3400,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 },
        status: 'critical',
        lastUpdated: new Date().toISOString(),
        trend: 'increasing'
      },
      {
        type: 'temperature',
        currentValue: 240,
        unit: '°F',
        normalRange: { min: 150, max: 200 },
        alertThreshold: { warning: 210, critical: 230 },
        status: 'critical',
        lastUpdated: new Date().toISOString(),
        trend: 'increasing'
      }
    ],
    alerts: [
      {
        id: 'ALERT-001',
        severity: 'critical',
        message: 'Pressure exceeds critical threshold',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        relatedSensor: 'pressure'
      }
    ],
    metadata: {
      field: 'Field A',
      operator: 'Energy Corp',
      installDate: '2023-01-15',
      depth: 8000,
      production: {
        currentRate: 350,
        averageRate: 400,
        cumulativeProduction: 292000,
        efficiency: 45
      }
    }
  },
  // Degraded well with declining health
  {
    id: 'WELL-002',
    name: 'Production Well 002',
    type: 'well',
    location: 'Field A - Sector 1',
    operationalStatus: 'degraded',
    healthScore: 68,
    lastMaintenanceDate: '2024-10-01',
    nextMaintenanceDate: '2025-01-01',
    sensors: [
      {
        type: 'pressure',
        currentValue: 2800,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 },
        status: 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      },
      {
        type: 'flow_rate',
        currentValue: 380,
        unit: 'BPD',
        normalRange: { min: 400, max: 500 },
        alertThreshold: { warning: 350, critical: 300 },
        status: 'warning',
        lastUpdated: new Date().toISOString(),
        trend: 'decreasing'
      }
    ],
    alerts: [
      {
        id: 'ALERT-002',
        severity: 'warning',
        message: 'Flow rate below normal range',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        relatedSensor: 'flow_rate'
      }
    ],
    metadata: {
      field: 'Field A',
      operator: 'Energy Corp',
      installDate: '2023-02-15',
      depth: 8100,
      production: {
        currentRate: 380,
        averageRate: 420,
        cumulativeProduction: 306600,
        efficiency: 68
      }
    }
  },
  // Top performer well
  {
    id: 'WELL-003',
    name: 'Production Well 003',
    type: 'well',
    location: 'Field A - Sector 1',
    operationalStatus: 'operational',
    healthScore: 95,
    lastMaintenanceDate: '2024-12-01',
    nextMaintenanceDate: '2025-03-01',
    sensors: [
      {
        type: 'pressure',
        currentValue: 2750,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 },
        status: 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      },
      {
        type: 'temperature',
        currentValue: 175,
        unit: '°F',
        normalRange: { min: 150, max: 200 },
        alertThreshold: { warning: 210, critical: 230 },
        status: 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      },
      {
        type: 'flow_rate',
        currentValue: 480,
        unit: 'BPD',
        normalRange: { min: 400, max: 500 },
        alertThreshold: { warning: 350, critical: 300 },
        status: 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      }
    ],
    alerts: [],
    metadata: {
      field: 'Field A',
      operator: 'Energy Corp',
      installDate: '2023-03-15',
      depth: 8200,
      production: {
        currentRate: 480,
        averageRate: 475,
        cumulativeProduction: 346700,
        efficiency: 95
      }
    }
  },
  // Well with overdue maintenance
  {
    id: 'WELL-004',
    name: 'Production Well 004',
    type: 'well',
    location: 'Field A - Sector 2',
    operationalStatus: 'operational',
    healthScore: 78,
    lastMaintenanceDate: '2024-09-01',
    nextMaintenanceDate: '2024-12-01', // 2 weeks overdue
    sensors: [
      {
        type: 'pressure',
        currentValue: 2900,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 },
        status: 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      }
    ],
    alerts: [],
    metadata: {
      field: 'Field A',
      operator: 'Energy Corp',
      installDate: '2023-04-15',
      depth: 8300,
      production: {
        currentRate: 420,
        averageRate: 430,
        cumulativeProduction: 313900,
        efficiency: 78
      }
    }
  }
];

// Historical health data for trend analysis
const historicalHealthData = new Map<string, number>([
  ['WELL-001', 60], // Declined from 60 to 45 (-15 points)
  ['WELL-002', 82], // Declined from 82 to 68 (-14 points)
  ['WELL-003', 93], // Improved from 93 to 95 (+2 points)
  ['WELL-004', 80]  // Declined from 80 to 78 (-2 points)
]);

async function runTests() {
  console.log('🧪 Starting Well Analysis Engine Tests\n');

  const engine = new WellAnalysisEngine();
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Analyze Noteworthy Conditions
  console.log('Test 1: Analyze Noteworthy Conditions');
  try {
    const conditions = engine.analyzeNoteworthyConditions(mockWells, historicalHealthData);

    // Verify critical issues identified
    if (conditions.criticalIssues.length === 0) {
      throw new Error('Expected to find critical issues');
    }
    console.log(`  ✅ Found ${conditions.criticalIssues.length} critical issues`);

    // Verify declining health identified
    if (conditions.decliningHealth.length === 0) {
      throw new Error('Expected to find declining health trends');
    }
    console.log(`  ✅ Found ${conditions.decliningHealth.length} declining health trends`);

    // Verify overdue maintenance identified
    if (conditions.maintenanceOverdue.length === 0) {
      throw new Error('Expected to find overdue maintenance');
    }
    console.log(`  ✅ Found ${conditions.maintenanceOverdue.length} overdue maintenance items`);

    // Verify top performers identified
    if (conditions.topPerformers.length === 0) {
      throw new Error('Expected to find top performers');
    }
    console.log(`  ✅ Found ${conditions.topPerformers.length} top performers`);

    // Verify WELL-001 is in critical issues (has critical status and alerts)
    const well001Critical = conditions.criticalIssues.find(i => i.wellId === 'WELL-001');
    if (!well001Critical) {
      throw new Error('WELL-001 should be identified as critical');
    }
    console.log(`  ✅ WELL-001 correctly identified as critical`);

    // Verify WELL-003 is in top performers (health score 95, operational)
    const well003TopPerformer = conditions.topPerformers.find(i => i.wellId === 'WELL-003');
    if (!well003TopPerformer) {
      throw new Error('WELL-003 should be identified as top performer');
    }
    console.log(`  ✅ WELL-003 correctly identified as top performer`);

    passedTests++;
    console.log('✅ Test 1 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 1 FAILED:', error);
    console.log('');
  }

  // Test 2: Generate Priority Actions
  console.log('Test 2: Generate Priority Actions');
  try {
    const conditions = engine.analyzeNoteworthyConditions(mockWells, historicalHealthData);
    const actions = engine.generatePriorityActions(mockWells, conditions);

    if (actions.length === 0) {
      throw new Error('Expected to generate priority actions');
    }
    console.log(`  ✅ Generated ${actions.length} priority actions`);

    // Verify actions have required fields
    for (const action of actions) {
      if (!action.id || !action.wellId || !action.priority || !action.title) {
        throw new Error('Action missing required fields');
      }
    }
    console.log(`  ✅ All actions have required fields`);

    // Verify urgent actions exist for critical issues
    const urgentActions = actions.filter(a => a.priority === 'urgent');
    if (urgentActions.length === 0) {
      throw new Error('Expected urgent actions for critical issues');
    }
    console.log(`  ✅ Found ${urgentActions.length} urgent actions`);

    // Verify actions are sorted by priority
    const priorities = actions.map(a => a.priority);
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    let lastPriorityIndex = -1;
    for (const priority of priorities) {
      const currentIndex = priorityOrder.indexOf(priority);
      if (currentIndex < lastPriorityIndex) {
        throw new Error('Actions not properly sorted by priority');
      }
      lastPriorityIndex = currentIndex;
    }
    console.log(`  ✅ Actions properly sorted by priority`);

    passedTests++;
    console.log('✅ Test 2 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 2 FAILED:', error);
    console.log('');
  }

  // Test 3: Identify Top Performers
  console.log('Test 3: Identify Top Performers');
  try {
    const topPerformers = engine.identifyTopPerformers(mockWells, 2);

    if (topPerformers.length !== 2) {
      throw new Error(`Expected 2 top performers, got ${topPerformers.length}`);
    }
    console.log(`  ✅ Identified ${topPerformers.length} top performers`);

    // Verify WELL-003 is first (highest health score)
    if (topPerformers[0].id !== 'WELL-003') {
      throw new Error('WELL-003 should be the top performer');
    }
    console.log(`  ✅ WELL-003 is the top performer (health: ${topPerformers[0].healthScore})`);

    // Verify sorted by health score descending
    for (let i = 1; i < topPerformers.length; i++) {
      if (topPerformers[i].healthScore > topPerformers[i - 1].healthScore) {
        throw new Error('Top performers not sorted correctly');
      }
    }
    console.log(`  ✅ Top performers sorted correctly by health score`);

    passedTests++;
    console.log('✅ Test 3 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 3 FAILED:', error);
    console.log('');
  }

  // Test 4: Identify Bottom Performers
  console.log('Test 4: Identify Bottom Performers');
  try {
    const bottomPerformers = engine.identifyBottomPerformers(mockWells, 2);

    if (bottomPerformers.length !== 2) {
      throw new Error(`Expected 2 bottom performers, got ${bottomPerformers.length}`);
    }
    console.log(`  ✅ Identified ${bottomPerformers.length} bottom performers`);

    // Verify WELL-001 is first (lowest health score)
    if (bottomPerformers[0].id !== 'WELL-001') {
      throw new Error('WELL-001 should be the bottom performer');
    }
    console.log(`  ✅ WELL-001 is the bottom performer (health: ${bottomPerformers[0].healthScore})`);

    // Verify sorted by health score ascending
    for (let i = 1; i < bottomPerformers.length; i++) {
      if (bottomPerformers[i].healthScore < bottomPerformers[i - 1].healthScore) {
        throw new Error('Bottom performers not sorted correctly');
      }
    }
    console.log(`  ✅ Bottom performers sorted correctly by health score`);

    passedTests++;
    console.log('✅ Test 4 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 4 FAILED:', error);
    console.log('');
  }

  // Test 5: Analyze Health Trends
  console.log('Test 5: Analyze Health Trends');
  try {
    const trends = engine.analyzeHealthTrends(mockWells, historicalHealthData);

    if (trends.size !== mockWells.length) {
      throw new Error(`Expected trends for ${mockWells.length} wells, got ${trends.size}`);
    }
    console.log(`  ✅ Analyzed trends for ${trends.size} wells`);

    // Verify WELL-001 shows declining trend
    const well001Trend = trends.get('WELL-001');
    if (!well001Trend || well001Trend.trend !== 'declining') {
      throw new Error('WELL-001 should show declining trend');
    }
    console.log(`  ✅ WELL-001 shows declining trend (change: ${well001Trend.change})`);

    // Verify WELL-003 shows stable/improving trend
    const well003Trend = trends.get('WELL-003');
    if (!well003Trend || well003Trend.trend === 'declining') {
      throw new Error('WELL-003 should not show declining trend');
    }
    console.log(`  ✅ WELL-003 shows ${well003Trend.trend} trend (change: ${well003Trend.change})`);

    passedTests++;
    console.log('✅ Test 5 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 5 FAILED:', error);
    console.log('');
  }

  // Test 6: Get Comparative Performance
  console.log('Test 6: Get Comparative Performance');
  try {
    const performance = engine.getComparativePerformance(mockWells);

    // Verify all rankings exist
    if (!performance.topByHealth || !performance.bottomByHealth || 
        !performance.topByProduction || !performance.bottomByProduction) {
      throw new Error('Missing performance rankings');
    }
    console.log(`  ✅ All performance rankings generated`);

    // Verify top by health
    if (performance.topByHealth.length === 0) {
      throw new Error('Expected top performers by health');
    }
    console.log(`  ✅ Top by health: ${performance.topByHealth.length} wells`);

    // Verify bottom by health
    if (performance.bottomByHealth.length === 0) {
      throw new Error('Expected bottom performers by health');
    }
    console.log(`  ✅ Bottom by health: ${performance.bottomByHealth.length} wells`);

    // Verify top by production
    if (performance.topByProduction.length === 0) {
      throw new Error('Expected top performers by production');
    }
    console.log(`  ✅ Top by production: ${performance.topByProduction.length} wells`);

    // Verify bottom by production
    if (performance.bottomByProduction.length === 0) {
      throw new Error('Expected bottom performers by production');
    }
    console.log(`  ✅ Bottom by production: ${performance.bottomByProduction.length} wells`);

    passedTests++;
    console.log('✅ Test 6 PASSED\n');
  } catch (error) {
    failedTests++;
    console.error('❌ Test 6 FAILED:', error);
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('═══════════════════════════════════════\n');

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED! Well Analysis Engine is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️ SOME TESTS FAILED. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
