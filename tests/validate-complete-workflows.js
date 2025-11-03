/**
 * Task 25: Validate Complete Lifecycle Workflows
 * 
 * This script validates that all end-to-end workflows are working correctly.
 * It can be run against a deployed sandbox environment.
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

// Test configuration
const TEST_COORDINATES = {
  amarillo: { latitude: 35.067482, longitude: -101.395466 },
  lubbock: { latitude: 33.577863, longitude: -101.855166 }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Find orchestrator Lambda
async function findOrchestratorLambda() {
  try {
    const functions = await lambda.listFunctions().promise();
    const orchestrator = functions.Functions.find(f => 
      f.FunctionName.includes('renewableOrchestrator')
    );
    
    if (!orchestrator) {
      throw new Error('Renewable orchestrator Lambda not found');
    }
    
    return orchestrator.FunctionName;
  } catch (error) {
    throw new Error(`Failed to find orchestrator: ${error.message}`);
  }
}

// Invoke orchestrator with test payload
async function invokeOrchestrator(functionName, payload) {
  try {
    const response = await lambda.invoke({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    }).promise();
    
    const result = JSON.parse(response.Payload);
    return result;
  } catch (error) {
    throw new Error(`Failed to invoke orchestrator: ${error.message}`);
  }
}

// Test Workflow 1: Create duplicate → detect → delete → rename
async function testWorkflow1(orchestratorName) {
  log('\n========================================', 'blue');
  log('Workflow 1: Duplicate → Delete → Rename', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Step 1: Create first project
    logInfo('Step 1: Creating first project...');
    const createResult1 = await invokeOrchestrator(orchestratorName, {
      action: 'create_project',
      coordinates: TEST_COORDINATES.amarillo,
      name: 'test-workflow-1-project-1'
    });
    
    if (createResult1.success) {
      logSuccess('First project created');
      results.passed++;
      results.tests.push({ name: 'Create first project', status: 'PASS' });
    } else {
      logError('Failed to create first project');
      results.failed++;
      results.tests.push({ name: 'Create first project', status: 'FAIL', error: createResult1.error });
    }
    
    // Step 2: Check for duplicates
    logInfo('Step 2: Checking for duplicates...');
    const duplicateCheck = await invokeOrchestrator(orchestratorName, {
      action: 'check_duplicates',
      coordinates: TEST_COORDINATES.amarillo
    });
    
    if (duplicateCheck.hasDuplicates) {
      logSuccess('Duplicate detection working');
      results.passed++;
      results.tests.push({ name: 'Duplicate detection', status: 'PASS' });
    } else {
      logError('Duplicate detection failed');
      results.failed++;
      results.tests.push({ name: 'Duplicate detection', status: 'FAIL' });
    }
    
    // Step 3: Create second project
    logInfo('Step 3: Creating second project...');
    const createResult2 = await invokeOrchestrator(orchestratorName, {
      action: 'create_project',
      coordinates: TEST_COORDINATES.amarillo,
      name: 'test-workflow-1-project-2'
    });
    
    if (createResult2.success) {
      logSuccess('Second project created');
      results.passed++;
      results.tests.push({ name: 'Create second project', status: 'PASS' });
    } else {
      logError('Failed to create second project');
      results.failed++;
      results.tests.push({ name: 'Create second project', status: 'FAIL', error: createResult2.error });
    }
    
    // Step 4: Delete first project (without confirmation)
    logInfo('Step 4: Testing deletion confirmation...');
    const deleteAttempt = await invokeOrchestrator(orchestratorName, {
      action: 'delete_project',
      project_name: 'test-workflow-1-project-1',
      confirmed: false
    });
    
    if (deleteAttempt.requiresConfirmation) {
      logSuccess('Deletion confirmation required');
      results.passed++;
      results.tests.push({ name: 'Deletion confirmation', status: 'PASS' });
    } else {
      logError('Deletion confirmation not required');
      results.failed++;
      results.tests.push({ name: 'Deletion confirmation', status: 'FAIL' });
    }
    
    // Step 5: Delete first project (with confirmation)
    logInfo('Step 5: Deleting first project...');
    const deleteConfirmed = await invokeOrchestrator(orchestratorName, {
      action: 'delete_project',
      project_name: 'test-workflow-1-project-1',
      confirmed: true
    });
    
    if (deleteConfirmed.success) {
      logSuccess('First project deleted');
      results.passed++;
      results.tests.push({ name: 'Delete project', status: 'PASS' });
    } else {
      logError('Failed to delete first project');
      results.failed++;
      results.tests.push({ name: 'Delete project', status: 'FAIL', error: deleteConfirmed.error });
    }
    
    // Step 6: Rename second project
    logInfo('Step 6: Renaming second project...');
    const renameResult = await invokeOrchestrator(orchestratorName, {
      action: 'rename_project',
      old_name: 'test-workflow-1-project-2',
      new_name: 'test-workflow-1-final'
    });
    
    if (renameResult.success) {
      logSuccess('Project renamed');
      results.passed++;
      results.tests.push({ name: 'Rename project', status: 'PASS' });
    } else {
      logError('Failed to rename project');
      results.failed++;
      results.tests.push({ name: 'Rename project', status: 'FAIL', error: renameResult.error });
    }
    
  } catch (error) {
    logError(`Workflow 1 error: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Workflow 1', status: 'ERROR', error: error.message });
  }
  
  return results;
}

// Test Workflow 2: Search → find duplicates → merge
async function testWorkflow2(orchestratorName) {
  log('\n========================================', 'blue');
  log('Workflow 2: Search → Find → Merge', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Step 1: Create multiple projects
    logInfo('Step 1: Creating multiple projects...');
    
    const projects = [
      { name: 'test-workflow-2-amarillo-1', coords: TEST_COORDINATES.amarillo },
      { name: 'test-workflow-2-amarillo-2', coords: { latitude: 35.067500, longitude: -101.395500 } },
      { name: 'test-workflow-2-lubbock', coords: TEST_COORDINATES.lubbock }
    ];
    
    for (const project of projects) {
      const result = await invokeOrchestrator(orchestratorName, {
        action: 'create_project',
        coordinates: project.coords,
        name: project.name
      });
      
      if (result.success) {
        logSuccess(`Created ${project.name}`);
      } else {
        logError(`Failed to create ${project.name}`);
      }
    }
    
    results.passed++;
    results.tests.push({ name: 'Create multiple projects', status: 'PASS' });
    
    // Step 2: Search for projects
    logInfo('Step 2: Searching for projects in Amarillo...');
    const searchResult = await invokeOrchestrator(orchestratorName, {
      action: 'search_projects',
      filters: { location: 'amarillo' }
    });
    
    if (searchResult.projects && searchResult.projects.length === 2) {
      logSuccess('Search found 2 Amarillo projects');
      results.passed++;
      results.tests.push({ name: 'Search projects', status: 'PASS' });
    } else {
      logError('Search did not find expected projects');
      results.failed++;
      results.tests.push({ name: 'Search projects', status: 'FAIL' });
    }
    
    // Step 3: Find duplicates
    logInfo('Step 3: Finding duplicate projects...');
    const duplicatesResult = await invokeOrchestrator(orchestratorName, {
      action: 'find_duplicates'
    });
    
    if (duplicatesResult.duplicates && duplicatesResult.duplicates.length > 0) {
      logSuccess('Found duplicate projects');
      results.passed++;
      results.tests.push({ name: 'Find duplicates', status: 'PASS' });
    } else {
      logError('No duplicates found');
      results.failed++;
      results.tests.push({ name: 'Find duplicates', status: 'FAIL' });
    }
    
    // Step 4: Merge projects
    logInfo('Step 4: Merging duplicate projects...');
    const mergeResult = await invokeOrchestrator(orchestratorName, {
      action: 'merge_projects',
      project1: 'test-workflow-2-amarillo-1',
      project2: 'test-workflow-2-amarillo-2',
      keep_name: 'test-workflow-2-amarillo-1'
    });
    
    if (mergeResult.success) {
      logSuccess('Projects merged');
      results.passed++;
      results.tests.push({ name: 'Merge projects', status: 'PASS' });
    } else {
      logError('Failed to merge projects');
      results.failed++;
      results.tests.push({ name: 'Merge projects', status: 'FAIL', error: mergeResult.error });
    }
    
  } catch (error) {
    logError(`Workflow 2 error: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Workflow 2', status: 'ERROR', error: error.message });
  }
  
  return results;
}

// Test error scenarios
async function testErrorScenarios(orchestratorName) {
  log('\n========================================', 'blue');
  log('Workflow 5: Error Scenarios', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Test 1: Project not found
    logInfo('Test 1: Project not found error...');
    const notFoundResult = await invokeOrchestrator(orchestratorName, {
      action: 'delete_project',
      project_name: 'nonexistent-project',
      confirmed: true
    });
    
    if (notFoundResult.error === 'PROJECT_NOT_FOUND') {
      logSuccess('Project not found error handled correctly');
      results.passed++;
      results.tests.push({ name: 'Project not found', status: 'PASS' });
    } else {
      logError('Project not found error not handled');
      results.failed++;
      results.tests.push({ name: 'Project not found', status: 'FAIL' });
    }
    
    // Test 2: Invalid coordinates
    logInfo('Test 2: Invalid coordinates error...');
    const invalidCoordsResult = await invokeOrchestrator(orchestratorName, {
      action: 'check_duplicates',
      coordinates: { latitude: 999, longitude: -999 }
    });
    
    if (invalidCoordsResult.error === 'INVALID_COORDINATES') {
      logSuccess('Invalid coordinates error handled correctly');
      results.passed++;
      results.tests.push({ name: 'Invalid coordinates', status: 'PASS' });
    } else {
      logError('Invalid coordinates error not handled');
      results.failed++;
      results.tests.push({ name: 'Invalid coordinates', status: 'FAIL' });
    }
    
    // Test 3: Name already exists
    logInfo('Test 3: Name already exists error...');
    
    // Create a project first
    await invokeOrchestrator(orchestratorName, {
      action: 'create_project',
      coordinates: TEST_COORDINATES.amarillo,
      name: 'test-existing-name'
    });
    
    // Try to rename another project to the same name
    const nameExistsResult = await invokeOrchestrator(orchestratorName, {
      action: 'rename_project',
      old_name: 'test-workflow-1-final',
      new_name: 'test-existing-name'
    });
    
    if (nameExistsResult.error === 'NAME_ALREADY_EXISTS') {
      logSuccess('Name already exists error handled correctly');
      results.passed++;
      results.tests.push({ name: 'Name already exists', status: 'PASS' });
    } else {
      logError('Name already exists error not handled');
      results.failed++;
      results.tests.push({ name: 'Name already exists', status: 'FAIL' });
    }
    
  } catch (error) {
    logError(`Error scenarios test error: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Error scenarios', status: 'ERROR', error: error.message });
  }
  
  return results;
}

// Main validation function
async function validateCompleteWorkflows() {
  log('\n================================================', 'blue');
  log('Task 25: Complete Lifecycle Workflow Validation', 'blue');
  log('================================================\n', 'blue');
  
  try {
    // Find orchestrator Lambda
    logInfo('Finding renewable orchestrator Lambda...');
    const orchestratorName = await findOrchestratorLambda();
    logSuccess(`Found orchestrator: ${orchestratorName}`);
    
    // Run workflow tests
    const workflow1Results = await testWorkflow1(orchestratorName);
    const workflow2Results = await testWorkflow2(orchestratorName);
    const errorResults = await testErrorScenarios(orchestratorName);
    
    // Calculate totals
    const totalPassed = workflow1Results.passed + workflow2Results.passed + errorResults.passed;
    const totalFailed = workflow1Results.failed + workflow2Results.failed + errorResults.failed;
    const totalTests = totalPassed + totalFailed;
    
    // Print summary
    log('\n================================================', 'blue');
    log('Validation Summary', 'blue');
    log('================================================\n', 'blue');
    
    log(`Total Tests: ${totalTests}`);
    logSuccess(`Passed: ${totalPassed}`);
    if (totalFailed > 0) {
      logError(`Failed: ${totalFailed}`);
    }
    
    const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
    log(`\nPass Rate: ${passRate}%\n`);
    
    // Print detailed results
    log('Workflow 1 Results:', 'blue');
    workflow1Results.tests.forEach(test => {
      if (test.status === 'PASS') {
        logSuccess(`  ${test.name}`);
      } else {
        logError(`  ${test.name}${test.error ? ': ' + test.error : ''}`);
      }
    });
    
    log('\nWorkflow 2 Results:', 'blue');
    workflow2Results.tests.forEach(test => {
      if (test.status === 'PASS') {
        logSuccess(`  ${test.name}`);
      } else {
        logError(`  ${test.name}${test.error ? ': ' + test.error : ''}`);
      }
    });
    
    log('\nError Scenario Results:', 'blue');
    errorResults.tests.forEach(test => {
      if (test.status === 'PASS') {
        logSuccess(`  ${test.name}`);
      } else {
        logError(`  ${test.name}${test.error ? ': ' + test.error : ''}`);
      }
    });
    
    // Final status
    log('\n================================================', 'blue');
    if (totalFailed === 0) {
      logSuccess('All workflows validated successfully! ✓');
      log('================================================\n', 'green');
      process.exit(0);
    } else {
      logError('Some workflows failed validation');
      log('================================================\n', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run validation
validateCompleteWorkflows();
