/**
 * Test: Consolidated Dashboard Artifact Generator
 * Verifies artifact generation with fleet metrics, AI analysis, and visualizations
 */

import { wellDataService, Well } from '../amplify/functions/shared/wellDataService';
import { wellAnalysisEngine } from '../amplify/functions/shared/wellAnalysisEngine';
import { consolidatedDashboardArtifactGenerator } from '../amplify/functions/shared/consolidatedDashboardArtifactGenerator';

async function testConsolidatedDashboardArtifact() {
  console.log('🧪 Testing Consolidated Dashboard Artifact Generator\n');

  try {
    // Step 1: Get all wells
    console.log('📊 Step 1: Retrieving all wells...');
    const wells = await wellDataService.getAllWells();
    console.log(`✅ Retrieved ${wells.length} wells\n`);

    // Step 2: Analyze noteworthy conditions
    console.log('🔍 Step 2: Analyzing noteworthy conditions...');
    const noteworthyConditions = wellAnalysisEngine.analyzeNoteworthyConditions(wells);
    console.log('✅ Noteworthy conditions analyzed:');
    console.log(`   - Critical Issues: ${noteworthyConditions.criticalIssues.length}`);
    console.log(`   - Declining Health: ${noteworthyConditions.decliningHealth.length}`);
    console.log(`   - Maintenance Overdue: ${noteworthyConditions.maintenanceOverdue.length}`);
    console.log(`   - Top Performers: ${noteworthyConditions.topPerformers.length}`);
    console.log(`   - Unusual Patterns: ${noteworthyConditions.unusualPatterns.length}\n`);

    // Step 3: Generate priority actions
    console.log('🎯 Step 3: Generating priority actions...');
    const priorityActions = wellAnalysisEngine.generatePriorityActions(wells, noteworthyConditions);
    console.log(`✅ Generated ${priorityActions.length} priority actions`);
    if (priorityActions.length > 0) {
      console.log('   Top 3 actions:');
      priorityActions.slice(0, 3).forEach((action, idx) => {
        console.log(`   ${idx + 1}. [${action.priority.toUpperCase()}] ${action.title}`);
      });
    }
    console.log('');

    // Step 4: Get comparative performance
    console.log('📈 Step 4: Analyzing comparative performance...');
    const performanceRanking = wellAnalysisEngine.getComparativePerformance(wells);
    console.log('✅ Performance ranking complete:');
    console.log(`   - Top by Health: ${performanceRanking.topByHealth.map(w => w.id).join(', ')}`);
    console.log(`   - Bottom by Health: ${performanceRanking.bottomByHealth.map(w => w.id).join(', ')}`);
    console.log(`   - Top by Production: ${performanceRanking.topByProduction.map(w => w.id).join(', ')}`);
    console.log(`   - Bottom by Production: ${performanceRanking.bottomByProduction.map(w => w.id).join(', ')}\n`);

    // Step 5: Generate consolidated dashboard artifact
    console.log('🎨 Step 5: Generating consolidated dashboard artifact...');
    const artifact = consolidatedDashboardArtifactGenerator.generateArtifact(
      wells,
      noteworthyConditions,
      priorityActions,
      performanceRanking
    );
    console.log('✅ Artifact generated successfully\n');

    // Step 6: Validate artifact structure
    console.log('✔️  Step 6: Validating artifact structure...');
    
    // Validate top-level structure
    if (artifact.messageContentType !== 'wells_equipment_dashboard') {
      throw new Error('Invalid messageContentType');
    }
    console.log('   ✅ Message content type: wells_equipment_dashboard');

    if (!artifact.title || !artifact.subtitle) {
      throw new Error('Missing title or subtitle');
    }
    console.log(`   ✅ Title: ${artifact.title}`);
    console.log(`   ✅ Subtitle: ${artifact.subtitle}`);

    // Validate dashboard structure
    const { dashboard } = artifact;
    if (!dashboard) {
      throw new Error('Missing dashboard object');
    }
    console.log('   ✅ Dashboard object present');

    // Validate summary
    console.log('\n   📊 Fleet Summary:');
    console.log(`      - Total Wells: ${dashboard.summary.totalWells}`);
    console.log(`      - Operational: ${dashboard.summary.operational}`);
    console.log(`      - Degraded: ${dashboard.summary.degraded}`);
    console.log(`      - Critical: ${dashboard.summary.critical}`);
    console.log(`      - Offline: ${dashboard.summary.offline}`);
    console.log(`      - Fleet Health Score: ${dashboard.summary.fleetHealthScore}%`);
    console.log(`      - Critical Alerts: ${dashboard.summary.criticalAlerts}`);
    console.log(`      - Wells Needing Attention: ${dashboard.summary.wellsNeedingAttention}`);
    console.log(`      - Upcoming Maintenance: ${dashboard.summary.upcomingMaintenance}`);

    if (dashboard.summary.totalWells !== wells.length) {
      throw new Error('Summary total wells mismatch');
    }
    console.log('   ✅ Summary metrics validated');

    // Validate noteworthy conditions
    if (!dashboard.noteworthyConditions) {
      throw new Error('Missing noteworthy conditions');
    }
    console.log('   ✅ Noteworthy conditions present');

    // Validate priority actions
    if (!Array.isArray(dashboard.priorityActions)) {
      throw new Error('Priority actions must be an array');
    }
    console.log(`   ✅ Priority actions: ${dashboard.priorityActions.length} items`);

    // Validate wells array
    if (!Array.isArray(dashboard.wells) || dashboard.wells.length !== wells.length) {
      throw new Error('Wells array invalid');
    }
    console.log(`   ✅ Wells array: ${dashboard.wells.length} items`);

    // Validate well summaries
    const firstWell = dashboard.wells[0];
    if (!firstWell.id || !firstWell.name || typeof firstWell.healthScore !== 'number') {
      throw new Error('Invalid well summary structure');
    }
    console.log('   ✅ Well summary structure validated');

    // Validate charts
    console.log('\n   📈 Chart Data:');
    
    if (!dashboard.charts.healthDistribution) {
      throw new Error('Missing health distribution chart');
    }
    console.log(`      - Health Distribution: ${dashboard.charts.healthDistribution.data.length} data points`);
    
    if (!dashboard.charts.statusBreakdown) {
      throw new Error('Missing status breakdown chart');
    }
    console.log(`      - Status Breakdown: ${dashboard.charts.statusBreakdown.data.length} segments`);
    
    if (!dashboard.charts.fleetTrend) {
      throw new Error('Missing fleet trend chart');
    }
    console.log(`      - Fleet Trend: ${dashboard.charts.fleetTrend.data.length} data points`);
    
    if (!dashboard.charts.alertHeatmap) {
      throw new Error('Missing alert heatmap chart');
    }
    console.log(`      - Alert Heatmap: ${dashboard.charts.alertHeatmap.data.length} data points`);
    
    console.log('   ✅ All chart data present');

    // Validate comparative performance
    console.log('\n   🏆 Comparative Performance:');
    console.log(`      - Top by Health: ${dashboard.comparativePerformance.topByHealth.length} wells`);
    console.log(`      - Bottom by Health: ${dashboard.comparativePerformance.bottomByHealth.length} wells`);
    console.log(`      - Top by Production: ${dashboard.comparativePerformance.topByProduction.length} wells`);
    console.log(`      - Bottom by Production: ${dashboard.comparativePerformance.bottomByProduction.length} wells`);
    
    if (dashboard.comparativePerformance.topByHealth.length === 0) {
      throw new Error('Missing top performers by health');
    }
    console.log('   ✅ Comparative performance validated');

    // Validate timestamp
    if (!dashboard.timestamp) {
      throw new Error('Missing timestamp');
    }
    const timestamp = new Date(dashboard.timestamp);
    if (isNaN(timestamp.getTime())) {
      throw new Error('Invalid timestamp format');
    }
    console.log(`   ✅ Timestamp: ${dashboard.timestamp}`);

    // Step 7: Test chart data structures
    console.log('\n✔️  Step 7: Validating chart data structures...');
    
    // Health distribution chart
    const healthDist = dashboard.charts.healthDistribution;
    if (healthDist.type !== 'histogram') {
      throw new Error('Health distribution must be histogram type');
    }
    if (!Array.isArray(healthDist.data) || healthDist.data.length === 0) {
      throw new Error('Health distribution data invalid');
    }
    console.log('   ✅ Health distribution chart structure valid');

    // Status breakdown chart
    const statusBreakdown = dashboard.charts.statusBreakdown;
    if (statusBreakdown.type !== 'pie') {
      throw new Error('Status breakdown must be pie type');
    }
    if (!Array.isArray(statusBreakdown.data) || statusBreakdown.data.length === 0) {
      throw new Error('Status breakdown data invalid');
    }
    // Verify percentages sum to ~100%
    const totalPercentage = statusBreakdown.data.reduce((sum: number, d: any) => sum + d.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 5) {
      throw new Error(`Status breakdown percentages don't sum to 100% (got ${totalPercentage}%)`);
    }
    console.log('   ✅ Status breakdown chart structure valid');

    // Fleet trend chart
    const fleetTrend = dashboard.charts.fleetTrend;
    if (fleetTrend.type !== 'line') {
      throw new Error('Fleet trend must be line type');
    }
    if (!Array.isArray(fleetTrend.data) || fleetTrend.data.length !== 31) {
      throw new Error('Fleet trend should have 31 days of data');
    }
    console.log('   ✅ Fleet trend chart structure valid');

    // Alert heatmap chart
    const alertHeatmap = dashboard.charts.alertHeatmap;
    if (alertHeatmap.type !== 'heatmap') {
      throw new Error('Alert heatmap must be heatmap type');
    }
    if (!Array.isArray(alertHeatmap.data) || alertHeatmap.data.length !== 31) {
      throw new Error('Alert heatmap should have 31 days of data');
    }
    console.log('   ✅ Alert heatmap chart structure valid');

    // Step 8: Display sample artifact data
    console.log('\n📋 Step 8: Sample Artifact Data:');
    console.log('\n   Noteworthy Conditions (First 2):');
    if (noteworthyConditions.criticalIssues.length > 0) {
      noteworthyConditions.criticalIssues.slice(0, 2).forEach((issue, idx) => {
        console.log(`   ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.wellName}: ${issue.title}`);
        console.log(`      ${issue.description}`);
      });
    }

    console.log('\n   Priority Actions (First 3):');
    dashboard.priorityActions.slice(0, 3).forEach((action, idx) => {
      console.log(`   ${idx + 1}. [${action.priority.toUpperCase()}] ${action.wellName}`);
      console.log(`      ${action.title}`);
      console.log(`      Est. Time: ${action.estimatedTime} | Due: ${action.dueDate}`);
    });

    console.log('\n   Top Performers:');
    dashboard.comparativePerformance.topByHealth.slice(0, 3).forEach((well, idx) => {
      console.log(`   ${idx + 1}. ${well.name} - Health: ${well.healthScore}% (${well.status})`);
    });

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(80));
    console.log('\n📊 Artifact Summary:');
    console.log(`   - Wells Monitored: ${dashboard.summary.totalWells}`);
    console.log(`   - Fleet Health: ${dashboard.summary.fleetHealthScore}%`);
    console.log(`   - Critical Issues: ${noteworthyConditions.criticalIssues.length}`);
    console.log(`   - Priority Actions: ${dashboard.priorityActions.length}`);
    console.log(`   - Chart Data Points: ${
      dashboard.charts.healthDistribution.data.length +
      dashboard.charts.statusBreakdown.data.length +
      dashboard.charts.fleetTrend.data.length +
      dashboard.charts.alertHeatmap.data.length
    }`);
    console.log(`   - Artifact Size: ${JSON.stringify(artifact).length} bytes`);
    console.log('\n✅ Consolidated Dashboard Artifact Generator is working correctly!');

    return artifact;

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run the test
testConsolidatedDashboardArtifact()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
