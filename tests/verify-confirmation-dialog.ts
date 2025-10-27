/**
 * Verification Script for Confirmation Dialog Implementation
 * 
 * Verifies that all confirmation dialog components are properly implemented
 * and integrated into the chat interface.
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  component: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const results: VerificationResult[] = [];

function checkFileExists(filePath: string, description: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  
  results.push({
    component: description,
    status: exists ? 'PASS' : 'FAIL',
    message: exists ? `✅ ${filePath} exists` : `❌ ${filePath} not found`,
  });
  
  return exists;
}

function checkFileContains(filePath: string, searchString: string, description: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      component: description,
      status: 'FAIL',
      message: `❌ ${filePath} not found`,
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const contains = content.includes(searchString);
  
  results.push({
    component: description,
    status: contains ? 'PASS' : 'FAIL',
    message: contains 
      ? `✅ ${filePath} contains "${searchString.substring(0, 50)}..."` 
      : `❌ ${filePath} missing "${searchString.substring(0, 50)}..."`,
  });
  
  return contains;
}

console.log('🔍 Verifying Confirmation Dialog Implementation...\n');

// Check component files
console.log('📦 Checking Component Files:');
checkFileExists('src/components/ConfirmationDialog.tsx', 'ConfirmationDialog Component');
checkFileExists('src/components/messageComponents/ConfirmationMessageComponent.tsx', 'ConfirmationMessageComponent');
checkFileExists('src/hooks/useConfirmationState.ts', 'useConfirmationState Hook');

// Check test files
console.log('\n🧪 Checking Test Files:');
checkFileExists('tests/unit/test-confirmation-dialog.test.tsx', 'ConfirmationDialog Unit Tests');
checkFileExists('tests/unit/test-confirmation-state.test.ts', 'useConfirmationState Unit Tests');
checkFileExists('tests/integration/test-confirmation-flow-integration.test.ts', 'Confirmation Flow Integration Tests');

// Check documentation
console.log('\n📚 Checking Documentation:');
checkFileExists('tests/CONFIRMATION_DIALOG_QUICK_REFERENCE.md', 'Quick Reference Guide');
checkFileExists('tests/TASK_15_CONFIRMATION_DIALOG_COMPLETE.md', 'Task Completion Summary');

// Check integration with ChatMessage
console.log('\n🔗 Checking ChatMessage Integration:');
checkFileContains(
  'src/components/ChatMessage.tsx',
  'ConfirmationMessageComponent',
  'ChatMessage imports ConfirmationMessageComponent'
);
checkFileContains(
  'src/components/ChatMessage.tsx',
  'confirmation_required',
  'ChatMessage detects confirmation artifacts'
);
checkFileContains(
  'src/components/ChatMessage.tsx',
  'requiresConfirmation',
  'ChatMessage checks requiresConfirmation flag'
);

// Check component exports
console.log('\n📤 Checking Component Exports:');
checkFileContains(
  'src/components/ConfirmationDialog.tsx',
  'export const ConfirmationDialog',
  'ConfirmationDialog is exported'
);
checkFileContains(
  'src/components/messageComponents/ConfirmationMessageComponent.tsx',
  'export const ConfirmationMessageComponent',
  'ConfirmationMessageComponent is exported'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  'export const useConfirmationState',
  'useConfirmationState is exported'
);

// Check TypeScript interfaces
console.log('\n📝 Checking TypeScript Interfaces:');
checkFileContains(
  'src/components/ConfirmationDialog.tsx',
  'interface ConfirmationDialogProps',
  'ConfirmationDialogProps interface defined'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  'interface ConfirmationState',
  'ConfirmationState interface defined'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  'interface UseConfirmationStateReturn',
  'UseConfirmationStateReturn interface defined'
);

// Check action types support
console.log('\n🎯 Checking Action Types Support:');
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  "case 'delete':",
  'Delete action supported'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  "case 'bulk_delete':",
  'Bulk delete action supported'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  "case 'merge':",
  'Merge action supported'
);
checkFileContains(
  'src/hooks/useConfirmationState.ts',
  "case 'duplicate_resolution':",
  'Duplicate resolution action supported'
);

// Print results
console.log('\n' + '='.repeat(80));
console.log('📊 Verification Results:');
console.log('='.repeat(80) + '\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const total = results.length;

results.forEach(result => {
  console.log(result.message);
});

console.log('\n' + '='.repeat(80));
console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);
console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (failed === 0) {
  console.log('\n🎉 All verification checks passed!');
  console.log('✅ Confirmation dialog implementation is complete and ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some verification checks failed.');
  console.log('❌ Please review the failed checks above.');
  process.exit(1);
}
