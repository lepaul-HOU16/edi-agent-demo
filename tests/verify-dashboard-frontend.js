#!/usr/bin/env node

/**
 * Dashboard Frontend Verification Script
 * 
 * Verifies that the ProjectDashboardArtifact component is properly integrated
 * in the frontend code.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContains(filePath, searchString) {
  if (!checkFileExists(filePath)) {
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes(searchString);
}

function checkMultipleStrings(filePath, searchStrings) {
  if (!checkFileExists(filePath)) {
    return searchStrings.map(() => false);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return searchStrings.map(str => content.includes(str));
}

async function main() {
  logSection('🎨 PROJECT DASHBOARD FRONTEND VERIFICATION');
  
  const checks = [];
  
  // Check 1: ProjectDashboardArtifact component exists
  logSection('CHECK 1: Component File Exists');
  const componentPath = 'src/components/renewable/ProjectDashboardArtifact.tsx';
  const componentExists = checkFileExists(componentPath);
  
  if (componentExists) {
    log(`✅ Component file exists: ${componentPath}`, 'green');
    checks.push(true);
  } else {
    log(`❌ Component file missing: ${componentPath}`, 'red');
    checks.push(false);
  }
  
  // Check 2: Component is exported from index
  logSection('CHECK 2: Component Export');
  const indexPath = 'src/components/renewable/index.ts';
  const exportExists = checkFileContains(indexPath, 'ProjectDashboardArtifact');
  
  if (exportExists) {
    log(`✅ Component exported from: ${indexPath}`, 'green');
    checks.push(true);
  } else {
    log(`❌ Component not exported from: ${indexPath}`, 'red');
    log(`   Add: export { ProjectDashboardArtifact } from './ProjectDashboardArtifact';`, 'yellow');
    checks.push(false);
  }
  
  // Check 3: Component imported in ChatMessage
  logSection('CHECK 3: Component Import in ChatMessage');
  const chatMessagePath = 'src/components/ChatMessage.tsx';
  const importChecks = checkMultipleStrings(chatMessagePath, [
    'ProjectDashboardArtifact',
    'from \'./renewable\''
  ]);
  
  if (importChecks.every(Boolean)) {
    log(`✅ Component imported in: ${chatMessagePath}`, 'green');
    checks.push(true);
  } else {
    log(`❌ Component not properly imported in: ${chatMessagePath}`, 'red');
    log(`   Add: import { ProjectDashboardArtifact } from './renewable';`, 'yellow');
    checks.push(false);
  }
  
  // Check 4: Artifact type handling
  logSection('CHECK 4: Artifact Type Handling');
  const artifactHandling = checkMultipleStrings(chatMessagePath, [
    'project_dashboard',
    'ProjectDashboardArtifact',
    'onAction'
  ]);
  
  if (artifactHandling.every(Boolean)) {
    log(`✅ Artifact type 'project_dashboard' handled in ChatMessage`, 'green');
    checks.push(true);
  } else {
    log(`❌ Artifact type 'project_dashboard' not properly handled`, 'red');
    log(`   Missing: project_dashboard type check or ProjectDashboardArtifact rendering`, 'yellow');
    checks.push(false);
  }
  
  // Check 5: Action button handlers
  logSection('CHECK 5: Action Button Handlers');
  const actionHandlers = checkMultipleStrings(chatMessagePath, [
    'case \'view\'',
    'case \'continue\'',
    'case \'rename\'',
    'case \'delete\''
  ]);
  
  const allHandlersPresent = actionHandlers.filter(Boolean).length >= 3;
  
  if (allHandlersPresent) {
    log(`✅ Action button handlers implemented (${actionHandlers.filter(Boolean).length}/4)`, 'green');
    checks.push(true);
  } else {
    log(`❌ Action button handlers incomplete (${actionHandlers.filter(Boolean).length}/4)`, 'red');
    log(`   Missing handlers for: view, continue, rename, or delete`, 'yellow');
    checks.push(false);
  }
  
  // Check 6: Backend handler exists
  logSection('CHECK 6: Backend Handler');
  const handlerPath = 'amplify/functions/shared/projectListHandler.ts';
  const handlerChecks = checkMultipleStrings(handlerPath, [
    'isProjectDashboardQuery',
    'generateDashboardArtifact',
    'detectDuplicates'
  ]);
  
  if (handlerChecks.every(Boolean)) {
    log(`✅ Backend handler methods present in: ${handlerPath}`, 'green');
    checks.push(true);
  } else {
    log(`❌ Backend handler methods incomplete in: ${handlerPath}`, 'red');
    checks.push(false);
  }
  
  // Check 7: Orchestrator integration
  logSection('CHECK 7: Orchestrator Integration');
  const orchestratorPath = 'amplify/functions/renewableOrchestrator/handler.ts';
  const orchestratorChecks = checkMultipleStrings(orchestratorPath, [
    'isProjectDashboardQuery',
    'generateDashboardArtifact',
    'project_dashboard'
  ]);
  
  if (orchestratorChecks.every(Boolean)) {
    log(`✅ Orchestrator routes dashboard queries in: ${orchestratorPath}`, 'green');
    checks.push(true);
  } else {
    log(`❌ Orchestrator dashboard routing incomplete in: ${orchestratorPath}`, 'red');
    checks.push(false);
  }
  
  // Summary
  logSection('📊 VERIFICATION SUMMARY');
  
  const totalChecks = checks.length;
  const passedChecks = checks.filter(Boolean).length;
  
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${passedChecks}`, passedChecks === totalChecks ? 'green' : 'yellow');
  log(`Failed: ${totalChecks - passedChecks}`, totalChecks === passedChecks ? 'green' : 'red');
  
  if (passedChecks === totalChecks) {
    log('\n✅ ALL FRONTEND CHECKS PASSED!', 'green');
    log('🎉 Project dashboard is properly integrated in the frontend!', 'green');
    log('\n📝 Next Steps:', 'cyan');
    log('   1. Start development server: npm run dev', 'blue');
    log('   2. Open browser to http://localhost:3000', 'blue');
    log('   3. Test query: "show my project dashboard"', 'blue');
    log('   4. Verify dashboard renders with action buttons', 'blue');
    log('   5. Check browser console for errors', 'blue');
    log('\n📖 See tests/DASHBOARD_BROWSER_TEST_GUIDE.md for detailed testing', 'cyan');
    process.exit(0);
  } else {
    log('\n⚠️  SOME FRONTEND CHECKS FAILED', 'yellow');
    log('Please fix the issues above before testing in browser.', 'yellow');
    process.exit(1);
  }
}

// Run verification
main();
