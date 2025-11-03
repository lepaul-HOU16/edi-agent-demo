/**
 * Test Enhanced Equipment Status Handler
 * Tests Task 4: Enhance Equipment Status Handler
 * 
 * Verifies:
 * - Integration with Well Data Service
 * - handleAllWellsStatus() function
 * - Detection of "all wells" vs "all equipment" queries
 * - AI analysis engine integration
 * - Consolidated dashboard artifact generation
 */

import { handleEquipmentStatus } from '../amplify/functions/maintenanceAgent/handlers/equipmentStatusHandler';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Detect "all wells" query
 */
async function testAllWellsQueryDetection() {
  console.log('\n🧪 Test 1: Detect "all wells" query');
  
  try {
    const queries = [
      'show me all wells',
      'status of all my wells',
      'all wells status',
      'show all wells equipment status'
    ];
    
    for (const query of queries) {
      const result = await handleEquipmentStatus(query);
      
      if (!result.success) {
        results.push({
          testName: 'All Wells Query Detection',
          passed: false,
          message: `Query "${query}" failed: ${result.message}`,
          details: result
        });
        return;
      }
      
      // Check if consolidated dashboard artifact is generated
      const hasDashboardArtifact = result.artifacts.some(
        a => a.messageContentType === 'wells_equipment_dashboard'
      );
      
      if (!hasDashboardArtifact) {
        results.push({
          testName: 'All Wells Query Detection',
          passed: false,
          message: `Query "${query}" did not generate dashboard artifact`,
          details: result.artifacts
        });
        return;
      }
    }
    
    results.push({
      testName: 'All Wells Query Detection',
      passed: true,
      message: 'All "all wells" queries correctly detected and routed'
    });
    
  } catch (error) {
    results.push({
      testName: 'All Wells Query Detection',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Test 2: Detect "all equipment" query (non-wells)
 */
async function testAllEquipmentQueryDetection() {
  console.log('\n🧪 Test 2: Detect "all equipment" query');
  
  try {
    const queries = [
      'show me all equipment',
      'status of all equipment',
      'all equipment status'
    ];
    
    for (const query of queries) {
      const result = await handleEquipmentStatus(query);
      
      if (!result.success) {
        results.push({
          testName: 'All Equipment Query Detection',
          passed: false,
          message: `Query "${query}" failed: ${result.message}`,
          details: result
        });
        return;
      }
      
      // Check if multiple equipment_health artifacts are generated (not dashboard)
      const hasEquipmentArtifacts = result.artifacts.some(
        a => a.messageContentType === 'equipment_health'
      );
      
      const hasDashboardArtifact = result.artifacts.some(
        a => a.messageContentType === 'wells_equipment_dashboard'
      );
      
      if (hasDashboardArtifact) {
        results.push({
          testName: 'All Equipment Query Detection',
          passed: false,
          message: `Query "${query}" incorrectly generated dashboard artifact`,
          details: result.artifacts
        });
        return;
      }
      
      if (!hasEquipmentArtifacts) {
        results.push({
          testName: 'All Equipment Query Detection',
          passed: false,
          message: `Query "${query}" did not generate equipment artifacts`,
          details: result.artifacts
        });
        return;
      }
    }
    
    results.push({
      testName: 'All Equipment Query Detection',
      passed: true,
      message: 'All "all equipment" queries correctly detected and routed'
    });
    
  } catch (error) {
    results.push({
      testName: 'All Equipment Query Detection',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Test 3: Consolidated dashboard artifact structure
 */
async function testConsolidatedDashboardArtifact() {
  console.log('\n🧪 Test 3: Consolidated dashboard artifact structure');
  
  try {
    const result = await handleEquipmentStatus('show me all wells status');
    
    if (!result.success) {
      results.push({
        testName: 'Consolidated Dashboard Artifact',
        passed: false,
        message: `Query failed: ${result.message}`,
        details: result
      });
      return;
    }
    
    const dashboardArtifact = result.artifacts.find(
      a => a.messageContentType === 'wells_equipment_dashboard'
    );
    
    if (!dashboardArtifact) {
      results.push({
        testName: 'Consolidated Dashboard Artifact',
        passed: false,
        message: 'No dashboard artifact found',
        details: result.artifacts
      });
      return;
    }
    
    // Verify artifact structure
    const requiredFields = [
      'title',
      'subtitle',
      'dashboard'
    ];
    
    for (const field of requiredFields) {
      if (!(field in dashboardArtifact)) {
        results.push({
          testName: 'Consolidated Dashboard Artifact',
          passed: false,
          message: `Missing required field: ${field}`,
          details: dashboardArtifact
        });
        return;
      }
    }
    
    // Verify dashboard structure
    const dashboard = dashboardArtifact.dashboard;
    const requiredDashboardFields = [
      'summary',
      'noteworthyConditions',
      'priorityActions',
      'wells',
      'charts',
      'comparativePerformance',
      'timestamp'
    ];
    
    for (const field of requiredDashboardFields) {
      if (!(field in dashboard)) {
        results.push({
          testName: 'Consolidated Dashboard Artifact',
          passed: false,
          message: `Missing required dashboard field: ${field}`,
          details: dashboard
        });
        return;
      }
    }
    
    // Verify summary structure
    const summary = dashboard.summary;
    const requiredSummaryFields = [
      'totalWells',
      'operational',
      'degraded',
      'critical',
      'fleetHealthScore',
      'criticalAlerts',
      'wellsNeedingAttention',
      'upcomingMaintenance'
    ];
    
    for (const field of requiredSummaryFields) {
      if (!(field in summary)) {
        results.push({
          testName: 'Consolidated Dashboard Artifact',
          passed: false,
          message: `Missing required summary field: ${field}`,
          details: summary
        });
        return;
      }
    }
    
    // Verify noteworthy conditions structure
    const noteworthyConditions = dashboard.noteworthyConditions;
    const requiredConditionFields = [
      'criticalIssues',
      'decliningHealth',
      'maintenanceOverdue',
      'topPerformers',
      'unusualPatterns'
    ];
    
    for (const field of requiredConditionFields) {
      if (!(field in noteworthyConditions)) {
        results.push({
          testName: 'Consolidated Dashboard Artifact',
          passed: false,
          message: `Missing required noteworthy condition field: ${field}`,
          details: noteworthyConditions
        });
        return;
      }
    }
    
    results.push({
      testName: 'Consolidated Dashboard Artifact',
      passed: true,
      message: 'Dashboard artifact has correct structure',
      details: {
        totalWells: summary.totalWells,
        fleetHealthScore: summary.fleetHealthScore,
        criticalIssues: noteworthyConditions.criticalIssues.length,
        priorityActions: dashboard.priorityActions.length
      }
    });
    
  } catch (error) {
    results.push({
      testName: 'Consolidated Dashboard Artifact',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Test 4: AI analysis integration
 */
async function testAIAnalysisIntegration() {
  console.log('\n🧪 Test 4: AI analysis integration');
  
  try {
    const result = await handleEquipmentStatus('show me all wells status');
    
    if (!result.success) {
      results.push({
        testName: 'AI Analysis Integration',
        passed: false,
        message: `Query failed: ${result.message}`,
        details: result
      });
      return;
    }
    
    const dashboardArtifact = result.artifacts.find(
      a => a.messageContentType === 'wells_equipment_dashboard'
    );
    
    if (!dashboardArtifact) {
      results.push({
        testName: 'AI Analysis Integration',
        passed: false,
        message: 'No dashboard artifact found',
        details: result.artifacts
      });
      return;
    }
    
    const { noteworthyConditions, priorityActions } = dashboardArtifact.dashboard;
    
    // Verify AI analysis generated insights
    const hasNoteworthyConditions = 
      noteworthyConditions.criticalIssues.length > 0 ||
      noteworthyConditions.decliningHealth.length > 0 ||
      noteworthyConditions.maintenanceOverdue.length > 0 ||
      noteworthyConditions.topPerformers.length > 0 ||
      noteworthyConditions.unusualPatterns.length > 0;
    
    if (!hasNoteworthyConditions) {
      results.push({
        testName: 'AI Analysis Integration',
        passed: false,
        message: 'AI analysis did not generate any noteworthy conditions',
        details: noteworthyConditions
      });
      return;
    }
    
    // Verify priority actions were generated
    if (!Array.isArray(priorityActions) || priorityActions.length === 0) {
      results.push({
        testName: 'AI Analysis Integration',
        passed: false,
        message: 'AI analysis did not generate priority actions',
        details: priorityActions
      });
      return;
    }
    
    // Verify priority action structure
    const firstAction = priorityActions[0];
    const requiredActionFields = [
      'id',
      'wellId',
      'wellName',
      'priority',
      'title',
      'description',
      'actionType'
    ];
    
    for (const field of requiredActionFields) {
      if (!(field in firstAction)) {
        results.push({
          testName: 'AI Analysis Integration',
          passed: false,
          message: `Priority action missing required field: ${field}`,
          details: firstAction
        });
        return;
      }
    }
    
    results.push({
      testName: 'AI Analysis Integration',
      passed: true,
      message: 'AI analysis successfully integrated',
      details: {
        criticalIssues: noteworthyConditions.criticalIssues.length,
        decliningHealth: noteworthyConditions.decliningHealth.length,
        maintenanceOverdue: noteworthyConditions.maintenanceOverdue.length,
        topPerformers: noteworthyConditions.topPerformers.length,
        unusualPatterns: noteworthyConditions.unusualPatterns.length,
        priorityActions: priorityActions.length
      }
    });
    
  } catch (error) {
    results.push({
      testName: 'AI Analysis Integration',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Test 5: Chart data generation
 */
async function testChartDataGeneration() {
  console.log('\n🧪 Test 5: Chart data generation');
  
  try {
    const result = await handleEquipmentStatus('show me all wells status');
    
    if (!result.success) {
      results.push({
        testName: 'Chart Data Generation',
        passed: false,
        message: `Query failed: ${result.message}`,
        details: result
      });
      return;
    }
    
    const dashboardArtifact = result.artifacts.find(
      a => a.messageContentType === 'wells_equipment_dashboard'
    );
    
    if (!dashboardArtifact) {
      results.push({
        testName: 'Chart Data Generation',
        passed: false,
        message: 'No dashboard artifact found',
        details: result.artifacts
      });
      return;
    }
    
    const { charts } = dashboardArtifact.dashboard;
    
    // Verify chart data structure
    const requiredCharts = [
      'healthDistribution',
      'statusBreakdown',
      'fleetTrend',
      'alertHeatmap'
    ];
    
    for (const chart of requiredCharts) {
      if (!(chart in charts)) {
        results.push({
          testName: 'Chart Data Generation',
          passed: false,
          message: `Missing required chart: ${chart}`,
          details: charts
        });
        return;
      }
    }
    
    // Verify health distribution structure
    const healthDist = charts.healthDistribution;
    const requiredBuckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    for (const bucket of requiredBuckets) {
      if (!(bucket in healthDist)) {
        results.push({
          testName: 'Chart Data Generation',
          passed: false,
          message: `Health distribution missing bucket: ${bucket}`,
          details: healthDist
        });
        return;
      }
    }
    
    // Verify status breakdown structure
    const statusBreakdown = charts.statusBreakdown;
    const requiredStatuses = ['operational', 'degraded', 'critical', 'offline'];
    for (const status of requiredStatuses) {
      if (!(status in statusBreakdown)) {
        results.push({
          testName: 'Chart Data Generation',
          passed: false,
          message: `Status breakdown missing status: ${status}`,
          details: statusBreakdown
        });
        return;
      }
    }
    
    // Verify fleet trend is an array
    if (!Array.isArray(charts.fleetTrend)) {
      results.push({
        testName: 'Chart Data Generation',
        passed: false,
        message: 'Fleet trend is not an array',
        details: charts.fleetTrend
      });
      return;
    }
    
    // Verify alert heatmap is an array
    if (!Array.isArray(charts.alertHeatmap)) {
      results.push({
        testName: 'Chart Data Generation',
        passed: false,
        message: 'Alert heatmap is not an array',
        details: charts.alertHeatmap
      });
      return;
    }
    
    results.push({
      testName: 'Chart Data Generation',
      passed: true,
      message: 'Chart data successfully generated',
      details: {
        healthDistribution: healthDist,
        statusBreakdown: statusBreakdown,
        fleetTrendDays: charts.fleetTrend.length,
        alertHeatmapDays: charts.alertHeatmap.length
      }
    });
    
  } catch (error) {
    results.push({
      testName: 'Chart Data Generation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Test 6: Comparative performance data
 */
async function testComparativePerformance() {
  console.log('\n🧪 Test 6: Comparative performance data');
  
  try {
    const result = await handleEquipmentStatus('show me all wells status');
    
    if (!result.success) {
      results.push({
        testName: 'Comparative Performance',
        passed: false,
        message: `Query failed: ${result.message}`,
        details: result
      });
      return;
    }
    
    const dashboardArtifact = result.artifacts.find(
      a => a.messageContentType === 'wells_equipment_dashboard'
    );
    
    if (!dashboardArtifact) {
      results.push({
        testName: 'Comparative Performance',
        passed: false,
        message: 'No dashboard artifact found',
        details: result.artifacts
      });
      return;
    }
    
    const { comparativePerformance } = dashboardArtifact.dashboard;
    
    // Verify comparative performance structure
    const requiredFields = [
      'topByHealth',
      'bottomByHealth',
      'topByProduction',
      'bottomByProduction'
    ];
    
    for (const field of requiredFields) {
      if (!(field in comparativePerformance)) {
        results.push({
          testName: 'Comparative Performance',
          passed: false,
          message: `Missing required field: ${field}`,
          details: comparativePerformance
        });
        return;
      }
      
      if (!Array.isArray(comparativePerformance[field])) {
        results.push({
          testName: 'Comparative Performance',
          passed: false,
          message: `Field ${field} is not an array`,
          details: comparativePerformance[field]
        });
        return;
      }
    }
    
    results.push({
      testName: 'Comparative Performance',
      passed: true,
      message: 'Comparative performance data successfully generated',
      details: {
        topByHealth: comparativePerformance.topByHealth.length,
        bottomByHealth: comparativePerformance.bottomByHealth.length,
        topByProduction: comparativePerformance.topByProduction.length,
        bottomByProduction: comparativePerformance.bottomByProduction.length
      }
    });
    
  } catch (error) {
    results.push({
      testName: 'Comparative Performance',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    });
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Enhanced Equipment Status Handler Tests\n');
  console.log('=' .repeat(60));
  
  await testAllWellsQueryDetection();
  await testAllEquipmentQueryDetection();
  await testConsolidatedDashboardArtifact();
  await testAIAnalysisIntegration();
  await testChartDataGeneration();
  await testComparativePerformance();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}: ${result.message}`);
    if (result.details && !result.passed) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / results.length) * 100)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Task 4 implementation is complete.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.\n');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
