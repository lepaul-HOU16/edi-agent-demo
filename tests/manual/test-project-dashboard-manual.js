#!/usr/bin/env node

/**
 * Project Dashboard Manual Test Script
 * 
 * This script helps populate test data and provides guidance for manual testing
 * of the project dashboard feature.
 * 
 * Tests:
 * - Dashboard display with multiple projects
 * - Sorting by name, date, location, completion
 * - Action buttons (view, continue, rename, delete)
 * - Duplicate detection with projects at same coordinates
 * - Active project marker
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Get Projects table name
async function getProjectsTableName() {
  const { execSync } = require('child_process');
  try {
    const result = execSync(
      'aws dynamodb list-tables --query "TableNames[?contains(@, \'Projects\')]" --output text',
      { encoding: 'utf-8' }
    );
    const tables = result.trim().split(/\s+/);
    // Find the table that looks like the Projects table
    const projectsTable = tables.find(t => t.includes('Projects') && !t.includes('Backup'));
    if (!projectsTable) {
      throw new Error('Could not find Projects table');
    }
    return projectsTable;
  } catch (error) {
    throw new Error(`Could not find Projects table: ${error.message}`);
  }
}

// Test project data with varying completion levels
const TEST_PROJECTS = [
  {
    project_name: 'texas-panhandle-wind-farm',
    coordinates: { latitude: 35.067482, longitude: -101.395466 },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    terrain_results: { features: 151, suitability_score: 0.85 },
    layout_results: { turbine_count: 50, total_capacity_mw: 150 },
    simulation_results: { aep_gwh: 450, capacity_factor: 0.35 },
    report_results: { report_url: 's3://bucket/reports/texas-panhandle.html' },
    status: 'complete'
  },
  {
    project_name: 'oklahoma-plains-site',
    coordinates: { latitude: 36.123456, longitude: -97.654321 },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    terrain_results: { features: 143, suitability_score: 0.78 },
    layout_results: { turbine_count: 40, total_capacity_mw: 120 },
    simulation_results: { aep_gwh: 380, capacity_factor: 0.32 },
    status: 'simulation_complete'
  },
  {
    project_name: 'kansas-wind-corridor',
    coordinates: { latitude: 37.789012, longitude: -99.123456 },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    terrain_results: { features: 167, suitability_score: 0.92 },
    layout_results: { turbine_count: 60, total_capacity_mw: 180 },
    status: 'layout_complete'
  },
  {
    project_name: 'nebraska-highlands',
    coordinates: { latitude: 41.234567, longitude: -100.987654 },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    terrain_results: { features: 128, suitability_score: 0.71 },
    status: 'terrain_complete'
  },
  {
    project_name: 'iowa-farmland-project',
    coordinates: { latitude: 42.345678, longitude: -93.876543 },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    status: 'not_started'
  },
  {
    project_name: 'texas-panhandle-duplicate',
    coordinates: { latitude: 35.067482, longitude: -101.395466 }, // Same as first project
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    terrain_results: { features: 151, suitability_score: 0.85 },
    status: 'terrain_complete'
  },
  {
    project_name: 'south-dakota-prairie',
    coordinates: { latitude: 43.567890, longitude: -100.234567 },
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    terrain_results: { features: 139, suitability_score: 0.68 },
    layout_results: { turbine_count: 35, total_capacity_mw: 105 },
    simulation_results: { aep_gwh: 320, capacity_factor: 0.31 },
    report_results: { report_url: 's3://bucket/reports/south-dakota.html' },
    status: 'complete'
  }
];

// Create test projects
async function createTestProjects() {
  logStep('1', 'Creating Test Projects');
  
  const tableName = await getProjectsTableName();
  logInfo(`Using table: ${tableName}`);
  
  let created = 0;
  let failed = 0;
  
  for (const project of TEST_PROJECTS) {
    try {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: project
      }));
      logSuccess(`Created: ${project.project_name}`);
      created++;
    } catch (error) {
      logError(`Failed to create ${project.project_name}: ${error.message}`);
      failed++;
    }
  }
  
  log(`\nCreated ${created} projects, ${failed} failed`, created > 0 ? 'green' : 'red');
  return created > 0;
}

// List existing projects
async function listExistingProjects() {
  logStep('2', 'Listing Existing Projects');
  
  const tableName = await getProjectsTableName();
  
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    if (!result.Items || result.Items.length === 0) {
      logWarning('No projects found in database');
      return [];
    }
    
    logSuccess(`Found ${result.Items.length} projects:`);
    result.Items.forEach((project, index) => {
      log(`  ${index + 1}. ${project.project_name} (${project.status || 'unknown'})`, 'blue');
    });
    
    return result.Items;
  } catch (error) {
    logError(`Failed to list projects: ${error.message}`);
    return [];
  }
}

// Clean up test projects
async function cleanupTestProjects() {
  logStep('Cleanup', 'Removing Test Projects');
  
  const tableName = await getProjectsTableName();
  
  let deleted = 0;
  let failed = 0;
  
  for (const project of TEST_PROJECTS) {
    try {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { project_name: project.project_name }
      }));
      logSuccess(`Deleted: ${project.project_name}`);
      deleted++;
    } catch (error) {
      logError(`Failed to delete ${project.project_name}: ${error.message}`);
      failed++;
    }
  }
  
  log(`\nDeleted ${deleted} projects, ${failed} failed`, deleted > 0 ? 'green' : 'red');
}

// Print manual test instructions
function printManualTestInstructions() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Manual Test Instructions                                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n📋 Test Scenario 1: Dashboard Display', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Open the chat interface');
  log('2. Send query: "show my project dashboard"');
  log('3. Verify dashboard artifact renders');
  log('4. Check that all 7 test projects are displayed');
  log('5. Verify project cards show:');
  log('   - Project name');
  log('   - Location (coordinates)');
  log('   - Completion percentage');
  log('   - Last updated timestamp');
  log('   - Status label');
  log('   - Active project marker (if applicable)');
  
  log('\n📋 Test Scenario 2: Sorting', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Click "Sort by Name" button');
  log('   ✓ Projects should be alphabetically ordered');
  log('2. Click "Sort by Date" button');
  log('   ✓ Projects should be ordered by last updated (newest first)');
  log('3. Click "Sort by Location" button');
  log('   ✓ Projects should be ordered by latitude');
  log('4. Click "Sort by Completion" button');
  log('   ✓ Projects should be ordered by completion % (highest first)');
  
  log('\n📋 Test Scenario 3: Action Buttons', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Find "texas-panhandle-wind-farm" (100% complete)');
  log('2. Click "View" button');
  log('   ✓ Should send query: "show project texas-panhandle-wind-farm"');
  log('   ✓ Should display project details');
  log('3. Find "kansas-wind-corridor" (50% complete)');
  log('4. Click "Continue" button');
  log('   ✓ Should send query: "continue with project kansas-wind-corridor"');
  log('   ✓ Should suggest next step (run simulation)');
  log('5. Find "iowa-farmland-project" (0% complete)');
  log('6. Click "Rename" button');
  log('   ✓ Should prompt for new name');
  log('7. Click "Delete" button');
  log('   ✓ Should show confirmation dialog');
  log('   ✓ Should delete project after confirmation');
  
  log('\n📋 Test Scenario 4: Duplicate Detection', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Look for "texas-panhandle-wind-farm" and "texas-panhandle-duplicate"');
  log('2. Both should have warning badges indicating duplicates');
  log('3. Hover over warning badge');
  log('   ✓ Should show tooltip: "Duplicate location detected"');
  log('4. Check duplicate groups section at bottom of dashboard');
  log('   ✓ Should show: "2 projects at 35.0675, -101.3955"');
  log('   ✓ Should list both project names');
  
  log('\n📋 Test Scenario 5: Active Project Marker', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Send query: "continue with project oklahoma-plains-site"');
  log('2. Send query: "show my project dashboard"');
  log('3. Verify "oklahoma-plains-site" has green "Active" badge');
  log('4. Verify only ONE project is marked as active');
  log('5. Send query: "continue with project kansas-wind-corridor"');
  log('6. Send query: "show my project dashboard"');
  log('7. Verify "kansas-wind-corridor" is now marked as active');
  log('8. Verify "oklahoma-plains-site" is no longer active');
  
  log('\n📋 Test Scenario 6: Completion Percentage', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('Expected completion percentages:');
  log('  • texas-panhandle-wind-farm: 100% (all 4 steps complete)');
  log('  • oklahoma-plains-site: 75% (3 of 4 steps complete)');
  log('  • kansas-wind-corridor: 50% (2 of 4 steps complete)');
  log('  • nebraska-highlands: 25% (1 of 4 steps complete)');
  log('  • iowa-farmland-project: 0% (no steps complete)');
  log('  • texas-panhandle-duplicate: 25% (1 of 4 steps complete)');
  log('  • south-dakota-prairie: 100% (all 4 steps complete)');
  
  log('\n📋 Test Scenario 7: Status Labels', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('Expected status labels:');
  log('  • texas-panhandle-wind-farm: "Complete"');
  log('  • oklahoma-plains-site: "Simulation Complete"');
  log('  • kansas-wind-corridor: "Layout Complete"');
  log('  • nebraska-highlands: "Terrain Complete"');
  log('  • iowa-farmland-project: "Not Started"');
  log('  • texas-panhandle-duplicate: "Terrain Complete"');
  log('  • south-dakota-prairie: "Complete"');
  
  log('\n📋 Test Scenario 8: Location Formatting', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('Verify locations are formatted correctly:');
  log('  • texas-panhandle-wind-farm: "35.0675, -101.3955"');
  log('  • oklahoma-plains-site: "36.1235, -97.6543"');
  log('  • kansas-wind-corridor: "37.7890, -99.1235"');
  log('  • nebraska-highlands: "41.2346, -100.9877"');
  log('  • iowa-farmland-project: "42.3457, -93.8765"');
  
  log('\n📋 Test Scenario 9: Backward Compatibility', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Send query: "list my projects"');
  log('   ✓ Should return TEXT response (not artifact)');
  log('   ✓ Should list all projects in markdown format');
  log('2. Send query: "show project texas-panhandle-wind-farm"');
  log('   ✓ Should return TEXT response with project details');
  log('   ✓ Should NOT render dashboard artifact');
  
  log('\n📋 Test Scenario 10: Performance', 'magenta');
  log('─'.repeat(60), 'cyan');
  log('1. Send query: "show my project dashboard"');
  log('2. Measure response time');
  log('   ✓ Should complete in < 2 seconds');
  log('3. Check browser console for errors');
  log('   ✓ Should have zero errors');
  log('4. Check network tab');
  log('   ✓ Dashboard artifact should be < 100KB');
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Success Criteria                                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n✅ Must Pass:', 'green');
  log('  □ Dashboard displays all 7 projects');
  log('  □ Sorting works for all 4 sort options');
  log('  □ All action buttons work correctly');
  log('  □ Duplicate detection identifies 2 duplicates');
  log('  □ Active project marker shows correctly');
  log('  □ Completion percentages are accurate');
  log('  □ Status labels are correct');
  log('  □ Backward compatibility maintained');
  
  log('\n⚠️  Should Pass:', 'yellow');
  log('  □ Response time < 2 seconds');
  log('  □ Zero console errors');
  log('  □ Smooth UI interactions');
  log('  □ Tooltips display correctly');
  
  log('\n📸 Screenshots to Capture:', 'blue');
  log('  1. Dashboard with all projects displayed');
  log('  2. Dashboard sorted by completion (descending)');
  log('  3. Duplicate warning badges visible');
  log('  4. Active project marker visible');
  log('  5. Action buttons for different project states');
  log('  6. Confirmation dialog for delete action');
  
  log('\n🔧 Troubleshooting:', 'yellow');
  log('  • If dashboard doesn\'t render:');
  log('    - Check browser console for errors');
  log('    - Verify ProjectDashboardArtifact component exists');
  log('    - Check artifact type is "project_dashboard"');
  log('  • If projects don\'t appear:');
  log('    - Verify projects exist in DynamoDB');
  log('    - Check ProjectStore.list() returns data');
  log('    - Verify S3 permissions');
  log('  • If sorting doesn\'t work:');
  log('    - Check ProjectDashboardArtifact component');
  log('    - Verify sort functions are implemented');
  log('    - Check state updates correctly');
  log('  • If duplicates not detected:');
  log('    - Verify Haversine distance calculation');
  log('    - Check 1km radius threshold');
  log('    - Verify coordinates are valid');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Project Dashboard Manual Test Script                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    switch (command) {
      case 'setup':
        await createTestProjects();
        log('\n✅ Test data created successfully!', 'green');
        log('\nNext steps:', 'cyan');
        log('1. Run: node tests/manual/test-project-dashboard-manual.js instructions');
        log('2. Follow the manual test scenarios');
        log('3. Document your test results');
        break;
        
      case 'list':
        await listExistingProjects();
        break;
        
      case 'cleanup':
        await cleanupTestProjects();
        log('\n✅ Test data cleaned up successfully!', 'green');
        break;
        
      case 'instructions':
        printManualTestInstructions();
        break;
        
      case 'help':
      default:
        log('\nUsage:', 'cyan');
        log('  node tests/manual/test-project-dashboard-manual.js <command>');
        log('\nCommands:', 'cyan');
        log('  setup        - Create 7 test projects with varying completion');
        log('  list         - List all existing projects in database');
        log('  cleanup      - Remove all test projects');
        log('  instructions - Display manual test instructions');
        log('  help         - Show this help message');
        log('\nExample workflow:', 'cyan');
        log('  1. node tests/manual/test-project-dashboard-manual.js setup');
        log('  2. node tests/manual/test-project-dashboard-manual.js instructions');
        log('  3. Follow the manual test scenarios in the UI');
        log('  4. node tests/manual/test-project-dashboard-manual.js cleanup');
        break;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createTestProjects,
  listExistingProjects,
  cleanupTestProjects,
  printManualTestInstructions
};
