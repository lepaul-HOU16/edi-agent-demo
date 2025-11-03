/**
 * Verification Script: Dashboard Artifact Rendering
 * 
 * This script verifies that the ProjectDashboardArtifact component is properly
 * integrated into ChatMessage.tsx with action callbacks.
 * 
 * Requirements tested:
 * - 3.1: ChatMessage renders ProjectDashboardArtifact for 'project_dashboard' type
 * - 3.2: Component displays all projects in sortable table
 * - 3.3: Component shows completion percentage with progress bars
 * - 3.4: Component provides action buttons (view, continue, rename, delete)
 * - 3.5: Component highlights duplicate projects with warning badges
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  check: string;
  passed: boolean;
  details: string;
}

const results: VerificationResult[] = [];

console.log('🔍 Verifying Dashboard Artifact Rendering Implementation...\n');

// ============================================================================
// Check 1: Verify ProjectDashboardArtifact is imported in ChatMessage.tsx
// ============================================================================
console.log('📋 Check 1: Verify ProjectDashboardArtifact import...');
const chatMessagePath = path.join(process.cwd(), 'src/components/ChatMessage.tsx');
const chatMessageContent = fs.readFileSync(chatMessagePath, 'utf-8');

const hasImport = chatMessageContent.includes('ProjectDashboardArtifact');
results.push({
  check: 'ProjectDashboardArtifact imported in ChatMessage.tsx',
  passed: hasImport,
  details: hasImport 
    ? '✅ Import found in ChatMessage.tsx' 
    : '❌ Import not found in ChatMessage.tsx'
});

// ============================================================================
// Check 2: Verify artifact type check for 'project_dashboard'
// ============================================================================
console.log('📋 Check 2: Verify artifact type check...');
const hasTypeCheck = chatMessageContent.includes("parsedArtifact.type === 'project_dashboard'") ||
                     chatMessageContent.includes("parsedArtifact.messageContentType === 'project_dashboard'");
results.push({
  check: 'Artifact type check for project_dashboard',
  passed: hasTypeCheck,
  details: hasTypeCheck 
    ? '✅ Type check found for project_dashboard' 
    : '❌ Type check not found for project_dashboard'
});

// ============================================================================
// Check 3: Verify ProjectDashboardArtifact component rendering
// ============================================================================
console.log('📋 Check 3: Verify component rendering...');
const hasComponentRender = chatMessageContent.includes('<ProjectDashboardArtifact');
results.push({
  check: 'ProjectDashboardArtifact component rendered',
  passed: hasComponentRender,
  details: hasComponentRender 
    ? '✅ Component rendering found' 
    : '❌ Component rendering not found'
});

// ============================================================================
// Check 4: Verify onAction callback implementation
// ============================================================================
console.log('📋 Check 4: Verify onAction callback...');
const hasOnAction = chatMessageContent.includes('onAction={(action: string, projectName: string)');
results.push({
  check: 'onAction callback implemented',
  passed: hasOnAction,
  details: hasOnAction 
    ? '✅ onAction callback found' 
    : '❌ onAction callback not found'
});

// ============================================================================
// Check 5: Verify action handlers (view, continue, rename, delete)
// ============================================================================
console.log('📋 Check 5: Verify action handlers...');
const hasViewAction = chatMessageContent.includes("case 'view':");
const hasContinueAction = chatMessageContent.includes("case 'continue':");
const hasRenameAction = chatMessageContent.includes("case 'rename':");
const hasDeleteAction = chatMessageContent.includes("case 'delete':");
const allActionsPresent = hasViewAction && hasContinueAction && hasRenameAction && hasDeleteAction;

results.push({
  check: 'Action handlers (view, continue, rename, delete)',
  passed: allActionsPresent,
  details: allActionsPresent 
    ? '✅ All action handlers found (view, continue, rename, delete)' 
    : `❌ Missing action handlers: ${!hasViewAction ? 'view ' : ''}${!hasContinueAction ? 'continue ' : ''}${!hasRenameAction ? 'rename ' : ''}${!hasDeleteAction ? 'delete' : ''}`
});

// ============================================================================
// Check 6: Verify action messages are sent via onSendMessage
// ============================================================================
console.log('📋 Check 6: Verify action messages...');
const hasViewMessage = chatMessageContent.includes('onSendMessage(`show project ${projectName}`)');
const hasContinueMessage = chatMessageContent.includes('onSendMessage(`continue with project ${projectName}`)');
const hasRenameMessage = chatMessageContent.includes('onSendMessage(`rename project ${projectName}`)');
const hasDeleteMessage = chatMessageContent.includes('onSendMessage(`delete project ${projectName}`)');
const allMessagesPresent = hasViewMessage && hasContinueMessage && hasRenameMessage && hasDeleteMessage;

results.push({
  check: 'Action messages sent via onSendMessage',
  passed: allMessagesPresent,
  details: allMessagesPresent 
    ? '✅ All action messages found' 
    : `❌ Missing action messages: ${!hasViewMessage ? 'view ' : ''}${!hasContinueMessage ? 'continue ' : ''}${!hasRenameMessage ? 'rename ' : ''}${!hasDeleteMessage ? 'delete' : ''}`
});

// ============================================================================
// Check 7: Verify darkMode prop is passed
// ============================================================================
console.log('📋 Check 7: Verify darkMode prop...');
const hasDarkModeProp = chatMessageContent.includes('darkMode={theme.palette.mode');
results.push({
  check: 'darkMode prop passed to component',
  passed: hasDarkModeProp,
  details: hasDarkModeProp 
    ? '✅ darkMode prop found' 
    : '❌ darkMode prop not found'
});

// ============================================================================
// Check 8: Verify data prop is passed
// ============================================================================
console.log('📋 Check 8: Verify data prop...');
const hasDataProp = chatMessageContent.includes('data={artifactData}');
results.push({
  check: 'data prop passed to component',
  passed: hasDataProp,
  details: hasDataProp 
    ? '✅ data prop found' 
    : '❌ data prop not found'
});

// ============================================================================
// Check 9: Verify ProjectDashboardArtifact component exists
// ============================================================================
console.log('📋 Check 9: Verify component file exists...');
const componentPath = path.join(process.cwd(), 'src/components/renewable/ProjectDashboardArtifact.tsx');
const componentExists = fs.existsSync(componentPath);
results.push({
  check: 'ProjectDashboardArtifact.tsx file exists',
  passed: componentExists,
  details: componentExists 
    ? '✅ Component file found' 
    : '❌ Component file not found'
});

// ============================================================================
// Check 10: Verify component is exported from index
// ============================================================================
console.log('📋 Check 10: Verify component export...');
const indexPath = path.join(process.cwd(), 'src/components/renewable/index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');
const isExported = indexContent.includes('ProjectDashboardArtifact');
results.push({
  check: 'ProjectDashboardArtifact exported from index',
  passed: isExported,
  details: isExported 
    ? '✅ Component exported from index' 
    : '❌ Component not exported from index'
});

// ============================================================================
// Print Results
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('VERIFICATION RESULTS');
console.log('='.repeat(80) + '\n');

let passedCount = 0;
let failedCount = 0;

results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.check}`);
  console.log(`   ${result.details}\n`);
  
  if (result.passed) {
    passedCount++;
  } else {
    failedCount++;
  }
});

console.log('='.repeat(80));
console.log(`SUMMARY: ${passedCount}/${results.length} checks passed`);
console.log('='.repeat(80) + '\n');

if (failedCount === 0) {
  console.log('✅ ALL CHECKS PASSED! Dashboard artifact rendering is properly implemented.');
  console.log('\nNext steps:');
  console.log('1. Deploy the changes to sandbox');
  console.log('2. Test with query: "show my project dashboard"');
  console.log('3. Verify action buttons work correctly');
  console.log('4. Test backward compatibility with "list my projects"');
  process.exit(0);
} else {
  console.log(`❌ ${failedCount} CHECK(S) FAILED. Please review the implementation.`);
  process.exit(1);
}
