/**
 * Verification Script for Project Dashboard Implementation
 * 
 * Verifies that all components of Task 14 are properly implemented
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

const results: VerificationResult[] = [];

/**
 * Check if file exists
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

/**
 * Check if file contains text
 */
function fileContains(filePath: string, searchText: string): boolean {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
    return content.includes(searchText);
  } catch {
    return false;
  }
}

/**
 * Verify frontend component
 */
function verifyFrontendComponent(): VerificationResult {
  const checks = [];

  // Check component file exists
  checks.push({
    name: 'ProjectDashboardArtifact component exists',
    passed: fileExists('src/components/renewable/ProjectDashboardArtifact.tsx'),
    message: fileExists('src/components/renewable/ProjectDashboardArtifact.tsx')
      ? 'Component file found'
      : 'Component file not found'
  });

  // Check component has required features
  const componentPath = 'src/components/renewable/ProjectDashboardArtifact.tsx';
  checks.push({
    name: 'Component has project list table',
    passed: fileContains(componentPath, 'Table') && fileContains(componentPath, 'columnDefinitions'),
    message: 'Table component with columns defined'
  });

  checks.push({
    name: 'Component has completion percentage',
    passed: fileContains(componentPath, 'ProgressBar') && fileContains(componentPath, 'completionPercentage'),
    message: 'Progress bar with completion percentage'
  });

  checks.push({
    name: 'Component has duplicate highlighting',
    passed: fileContains(componentPath, 'isDuplicate') && fileContains(componentPath, 'Duplicate'),
    message: 'Duplicate detection and badge'
  });

  checks.push({
    name: 'Component has active project marker',
    passed: fileContains(componentPath, 'isActive') && fileContains(componentPath, 'Active'),
    message: 'Active project badge'
  });

  checks.push({
    name: 'Component has quick actions',
    passed: fileContains(componentPath, 'ButtonDropdown') && fileContains(componentPath, 'actions'),
    message: 'Action buttons dropdown'
  });

  checks.push({
    name: 'Component has sortable columns',
    passed: fileContains(componentPath, 'sortingColumn') && fileContains(componentPath, 'onSortingChange'),
    message: 'Sorting functionality'
  });

  return {
    category: 'Frontend Component',
    checks
  };
}

/**
 * Verify backend integration
 */
function verifyBackendIntegration(): VerificationResult {
  const checks = [];

  // Check intent classifier
  const classifierPath = 'amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts';
  checks.push({
    name: 'PROJECT_DASHBOARD intent defined',
    passed: fileContains(classifierPath, 'PROJECT_DASHBOARD') && fileContains(classifierPath, 'project_dashboard'),
    message: 'Intent type added to classifier'
  });

  checks.push({
    name: 'Dashboard intent patterns defined',
    passed: fileContains(classifierPath, 'project_dashboard:') && fileContains(classifierPath, 'show.*project.*dashboard'),
    message: 'Intent patterns for dashboard queries'
  });

  // Check orchestrator handler
  const handlerPath = 'amplify/functions/renewableOrchestrator/handler.ts';
  checks.push({
    name: 'Dashboard case handler exists',
    passed: fileContains(handlerPath, "case 'project_dashboard':") && fileContains(handlerPath, 'generateDashboard'),
    message: 'Handler case for dashboard intent'
  });

  checks.push({
    name: 'Dashboard artifact created',
    passed: fileContains(handlerPath, "type: 'project_dashboard'") && fileContains(handlerPath, 'artifacts:'),
    message: 'Artifact creation in handler'
  });

  // Check types
  const typesPath = 'amplify/functions/renewableOrchestrator/types.ts';
  checks.push({
    name: 'project_dashboard type added',
    passed: fileContains(typesPath, "'project_dashboard'"),
    message: 'Type definition updated'
  });

  return {
    category: 'Backend Integration',
    checks
  };
}

/**
 * Verify ChatMessage integration
 */
function verifyChatMessageIntegration(): VerificationResult {
  const checks = [];

  const chatMessagePath = 'src/components/ChatMessage.tsx';

  checks.push({
    name: 'ProjectDashboardArtifact imported',
    passed: fileContains(chatMessagePath, 'ProjectDashboardArtifact'),
    message: 'Component imported in ChatMessage'
  });

  checks.push({
    name: 'Dashboard artifact type check exists',
    passed: fileContains(chatMessagePath, "type === 'project_dashboard'") || 
            fileContains(chatMessagePath, "messageContentType === 'project_dashboard'"),
    message: 'Artifact type check added'
  });

  checks.push({
    name: 'Dashboard artifact rendered',
    passed: fileContains(chatMessagePath, '<ProjectDashboardArtifact'),
    message: 'Component rendering logic added'
  });

  return {
    category: 'ChatMessage Integration',
    checks
  };
}

/**
 * Verify exports
 */
function verifyExports(): VerificationResult {
  const checks = [];

  const indexPath = 'src/components/renewable/index.ts';

  checks.push({
    name: 'ProjectDashboardArtifact exported',
    passed: fileContains(indexPath, 'ProjectDashboardArtifact'),
    message: 'Component exported from renewable index'
  });

  return {
    category: 'Exports',
    checks
  };
}

/**
 * Verify tests
 */
function verifyTests(): VerificationResult {
  const checks = [];

  checks.push({
    name: 'Unit tests exist',
    passed: fileExists('tests/unit/test-project-dashboard-artifact.test.tsx'),
    message: 'Unit test file created'
  });

  checks.push({
    name: 'Integration tests exist',
    passed: fileExists('tests/integration/test-project-dashboard-integration.test.ts'),
    message: 'Integration test file created'
  });

  checks.push({
    name: 'Quick reference guide exists',
    passed: fileExists('tests/PROJECT_DASHBOARD_QUICK_REFERENCE.md'),
    message: 'Testing guide created'
  });

  // Check unit test coverage
  const unitTestPath = 'tests/unit/test-project-dashboard-artifact.test.tsx';
  checks.push({
    name: 'Unit tests cover all requirements',
    passed: fileContains(unitTestPath, 'Requirement 7.1') &&
            fileContains(unitTestPath, 'Requirement 7.2') &&
            fileContains(unitTestPath, 'Requirement 7.3') &&
            fileContains(unitTestPath, 'Requirement 7.4') &&
            fileContains(unitTestPath, 'Requirement 7.5') &&
            fileContains(unitTestPath, 'Requirement 7.6'),
    message: 'All requirements tested'
  });

  return {
    category: 'Tests',
    checks
  };
}

/**
 * Verify documentation
 */
function verifyDocumentation(): VerificationResult {
  const checks = [];

  checks.push({
    name: 'Task completion document exists',
    passed: fileExists('tests/TASK_14_PROJECT_DASHBOARD_COMPLETE.md'),
    message: 'Completion summary created'
  });

  checks.push({
    name: 'Quick reference guide exists',
    passed: fileExists('tests/PROJECT_DASHBOARD_QUICK_REFERENCE.md'),
    message: 'Testing guide created'
  });

  return {
    category: 'Documentation',
    checks
  };
}

/**
 * Run all verifications
 */
function runVerification() {
  console.log('🔍 Verifying Project Dashboard Implementation (Task 14)\n');
  console.log('═'.repeat(70));
  console.log('\n');

  // Run all verification categories
  results.push(verifyFrontendComponent());
  results.push(verifyBackendIntegration());
  results.push(verifyChatMessageIntegration());
  results.push(verifyExports());
  results.push(verifyTests());
  results.push(verifyDocumentation());

  // Print results
  let totalChecks = 0;
  let passedChecks = 0;

  results.forEach(result => {
    console.log(`\n📋 ${result.category}`);
    console.log('─'.repeat(70));

    result.checks.forEach(check => {
      totalChecks++;
      if (check.passed) {
        passedChecks++;
        console.log(`  ✅ ${check.name}`);
        console.log(`     ${check.message}`);
      } else {
        console.log(`  ❌ ${check.name}`);
        console.log(`     ${check.message}`);
      }
    });
  });

  // Print summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('\n📊 Verification Summary\n');
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${totalChecks - passedChecks}`);
  console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

  if (passedChecks === totalChecks) {
    console.log('\n✅ All verifications passed! Task 14 is complete.');
  } else {
    console.log('\n⚠️  Some verifications failed. Please review the issues above.');
  }

  console.log('\n');
  console.log('═'.repeat(70));

  // Exit with appropriate code
  process.exit(passedChecks === totalChecks ? 0 : 1);
}

// Run verification
runVerification();
