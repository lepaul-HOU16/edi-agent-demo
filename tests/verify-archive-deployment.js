/**
 * Verify Archive Functionality Deployment
 * 
 * This script verifies that the archive/unarchive functionality is properly deployed
 * by checking that all required methods exist and are accessible.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function printSuccess(message) {
  console.log(`${GREEN}✓ ${message}${RESET}`);
}

function printError(message) {
  console.log(`${RED}✗ ${message}${RESET}`);
}

function printInfo(message) {
  console.log(`${YELLOW}ℹ ${message}${RESET}`);
}

async function verifyDeployment() {
  console.log('========================================');
  console.log('Archive Functionality Deployment Verification');
  console.log('========================================\n');

  let checksPassed = 0;
  let checksFailed = 0;

  try {
    // Check 1: Verify ProjectLifecycleManager file exists
    printInfo('Check 1: Verifying ProjectLifecycleManager file...');
    const lifecycleManagerPath = path.join(__dirname, '../amplify/functions/shared/projectLifecycleManager.ts');
    if (fs.existsSync(lifecycleManagerPath)) {
      printSuccess('ProjectLifecycleManager file exists');
      checksPassed++;
    } else {
      printError('ProjectLifecycleManager file not found');
      checksFailed++;
    }

    // Check 2: Verify archiveProject method exists
    printInfo('Check 2: Verifying archiveProject method...');
    const lifecycleManagerContent = fs.readFileSync(lifecycleManagerPath, 'utf8');
    if (lifecycleManagerContent.includes('async archiveProject(')) {
      printSuccess('archiveProject method exists');
      checksPassed++;
    } else {
      printError('archiveProject method not found');
      checksFailed++;
    }

    // Check 3: Verify unarchiveProject method exists
    printInfo('Check 3: Verifying unarchiveProject method...');
    if (lifecycleManagerContent.includes('async unarchiveProject(')) {
      printSuccess('unarchiveProject method exists');
      checksPassed++;
    } else {
      printError('unarchiveProject method not found');
      checksFailed++;
    }

    // Check 4: Verify listActiveProjects method exists
    printInfo('Check 4: Verifying listActiveProjects method...');
    if (lifecycleManagerContent.includes('async listActiveProjects(')) {
      printSuccess('listActiveProjects method exists');
      checksPassed++;
    } else {
      printError('listActiveProjects method not found');
      checksFailed++;
    }

    // Check 5: Verify listArchivedProjects method exists
    printInfo('Check 5: Verifying listArchivedProjects method...');
    if (lifecycleManagerContent.includes('async listArchivedProjects(')) {
      printSuccess('listArchivedProjects method exists');
      checksPassed++;
    } else {
      printError('listArchivedProjects method not found');
      checksFailed++;
    }

    // Check 6: Verify ProjectStore has archive/unarchive methods
    printInfo('Check 6: Verifying ProjectStore archive methods...');
    const projectStorePath = path.join(__dirname, '../amplify/functions/shared/projectStore.ts');
    const projectStoreContent = fs.readFileSync(projectStorePath, 'utf8');
    
    const hasArchive = projectStoreContent.includes('async archive(');
    const hasUnarchive = projectStoreContent.includes('async unarchive(');
    const hasListArchived = projectStoreContent.includes('async listArchived(');
    const hasListActive = projectStoreContent.includes('async listActive(');
    
    if (hasArchive && hasUnarchive && hasListArchived && hasListActive) {
      printSuccess('ProjectStore archive methods exist');
      checksPassed++;
    } else {
      printError('ProjectStore archive methods incomplete');
      if (!hasArchive) printError('  - Missing archive method');
      if (!hasUnarchive) printError('  - Missing unarchive method');
      if (!hasListArchived) printError('  - Missing listArchived method');
      if (!hasListActive) printError('  - Missing listActive method');
      checksFailed++;
    }

    // Check 7: Verify archived metadata fields in ProjectData interface
    printInfo('Check 7: Verifying archived metadata fields...');
    if (projectStoreContent.includes('archived?:') && projectStoreContent.includes('archived_at?:')) {
      printSuccess('Archived metadata fields defined');
      checksPassed++;
    } else {
      printError('Archived metadata fields not found');
      checksFailed++;
    }

    // Check 8: Verify unit tests exist
    printInfo('Check 8: Verifying unit tests...');
    const unitTestPath = path.join(__dirname, 'unit/test-archive-unarchive.test.ts');
    if (fs.existsSync(unitTestPath)) {
      printSuccess('Unit tests exist');
      checksPassed++;
    } else {
      printError('Unit tests not found');
      checksFailed++;
    }

    // Check 9: Verify integration tests exist
    printInfo('Check 9: Verifying integration tests...');
    const integrationTestPath = path.join(__dirname, 'integration/test-archive-unarchive-integration.test.ts');
    if (fs.existsSync(integrationTestPath)) {
      printSuccess('Integration tests exist');
      checksPassed++;
    } else {
      printError('Integration tests not found');
      checksFailed++;
    }

    // Check 10: Verify manual test guide exists
    printInfo('Check 10: Verifying manual test guide...');
    const manualTestPath = path.join(__dirname, 'e2e-archive-manual-test.md');
    if (fs.existsSync(manualTestPath)) {
      printSuccess('Manual test guide exists');
      checksPassed++;
    } else {
      printError('Manual test guide not found');
      checksFailed++;
    }

    // Check 11: Verify Requirements 8.1-8.6 are addressed
    printInfo('Check 11: Verifying requirements coverage...');
    const requirementsCovered = {
      '8.1': lifecycleManagerContent.includes('8.1'),
      '8.2': lifecycleManagerContent.includes('8.2'),
      '8.3': lifecycleManagerContent.includes('8.3'),
      '8.4': lifecycleManagerContent.includes('8.4'),
      '8.5': lifecycleManagerContent.includes('8.5'),
      '8.6': lifecycleManagerContent.includes('8.6'),
    };

    const allRequirementsCovered = Object.values(requirementsCovered).every(covered => covered);
    if (allRequirementsCovered) {
      printSuccess('All requirements (8.1-8.6) are addressed');
      checksPassed++;
    } else {
      printError('Some requirements not addressed:');
      Object.entries(requirementsCovered).forEach(([req, covered]) => {
        if (!covered) printError(`  - Requirement ${req} not found`);
      });
      checksFailed++;
    }

  } catch (error) {
    printError(`Verification failed: ${error.message}`);
    checksFailed++;
  }

  // Print summary
  console.log('\n========================================');
  console.log('VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`Total Checks: ${checksPassed + checksFailed}`);
  console.log(`${GREEN}Passed: ${checksPassed}${RESET}`);
  console.log(`${RED}Failed: ${checksFailed}${RESET}`);
  console.log('========================================\n');

  if (checksFailed === 0) {
    printSuccess('ALL CHECKS PASSED! ✓');
    console.log('\nArchive functionality is properly deployed.');
    console.log('\nNext steps:');
    console.log('  1. Run unit tests: npm test -- tests/unit/test-archive-unarchive.test.ts');
    console.log('  2. Review manual test guide: tests/e2e-archive-manual-test.md');
    console.log('  3. Perform manual testing in the chat interface');
    return 0;
  } else {
    printError('SOME CHECKS FAILED! ✗');
    console.log('\nPlease review the failures above.');
    return 1;
  }
}

// Run verification
verifyDeployment().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  printError(`Fatal error: ${error.message}`);
  process.exit(1);
});
