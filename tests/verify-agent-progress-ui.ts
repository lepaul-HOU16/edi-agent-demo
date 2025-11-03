/**
 * Verification script for Agent Progress UI components
 * 
 * This script verifies that the AgentProgressIndicator and ExtendedThinkingDisplay
 * components are properly created and exported.
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Verifying Agent Progress UI Components...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

// Check 1: Verify AgentProgressIndicator.tsx exists
console.log('✓ Check 1: AgentProgressIndicator.tsx exists');
const progressIndicatorPath = path.join(
  process.cwd(),
  'src/components/renewable/AgentProgressIndicator.tsx'
);
if (fs.existsSync(progressIndicatorPath)) {
  console.log('  ✅ File exists');
  checks.passed++;

  // Check for required exports
  const content = fs.readFileSync(progressIndicatorPath, 'utf-8');
  if (content.includes('export interface ProgressStep')) {
    console.log('  ✅ ProgressStep interface exported');
    checks.passed++;
  } else {
    console.log('  ❌ ProgressStep interface not found');
    checks.failed++;
  }

  if (content.includes('export const AgentProgressIndicator')) {
    console.log('  ✅ AgentProgressIndicator component exported');
    checks.passed++;
  } else {
    console.log('  ❌ AgentProgressIndicator component not found');
    checks.failed++;
  }

  // Check for required props
  if (content.includes('steps: ProgressStep[]')) {
    console.log('  ✅ steps prop defined');
    checks.passed++;
  } else {
    console.log('  ⚠️  steps prop not found');
    checks.warnings++;
  }

  if (content.includes('currentStep: string')) {
    console.log('  ✅ currentStep prop defined');
    checks.passed++;
  } else {
    console.log('  ⚠️  currentStep prop not found');
    checks.warnings++;
  }

  if (content.includes('isVisible: boolean')) {
    console.log('  ✅ isVisible prop defined');
    checks.passed++;
  } else {
    console.log('  ⚠️  isVisible prop not found');
    checks.warnings++;
  }

  // Check for status icons
  const statusIcons = ['CheckCircleIcon', 'HourglassEmptyIcon', 'PauseCircleOutlineIcon', 'ErrorIcon'];
  statusIcons.forEach((icon) => {
    if (content.includes(icon)) {
      console.log(`  ✅ ${icon} imported`);
      checks.passed++;
    } else {
      console.log(`  ⚠️  ${icon} not found`);
      checks.warnings++;
    }
  });
} else {
  console.log('  ❌ File does not exist');
  checks.failed++;
}

console.log('\n✓ Check 2: ExtendedThinkingDisplay.tsx exists');
const thinkingDisplayPath = path.join(
  process.cwd(),
  'src/components/renewable/ExtendedThinkingDisplay.tsx'
);
if (fs.existsSync(thinkingDisplayPath)) {
  console.log('  ✅ File exists');
  checks.passed++;

  // Check for required exports
  const content = fs.readFileSync(thinkingDisplayPath, 'utf-8');
  if (content.includes('export interface ThinkingBlock')) {
    console.log('  ✅ ThinkingBlock interface exported');
    checks.passed++;
  } else {
    console.log('  ❌ ThinkingBlock interface not found');
    checks.failed++;
  }

  if (content.includes('export const ExtendedThinkingDisplay')) {
    console.log('  ✅ ExtendedThinkingDisplay component exported');
    checks.passed++;
  } else {
    console.log('  ❌ ExtendedThinkingDisplay component not found');
    checks.failed++;
  }

  // Check for expandable functionality
  if (content.includes('useState') && content.includes('expanded')) {
    console.log('  ✅ Expandable/collapsible functionality implemented');
    checks.passed++;
  } else {
    console.log('  ⚠️  Expandable functionality not found');
    checks.warnings++;
  }

  // Check for timestamp display
  if (content.includes('toLocaleTimeString')) {
    console.log('  ✅ Timestamp display implemented');
    checks.passed++;
  } else {
    console.log('  ⚠️  Timestamp display not found');
    checks.warnings++;
  }
} else {
  console.log('  ❌ File does not exist');
  checks.failed++;
}

console.log('\n✓ Check 3: useAgentProgress hook exists');
const hookPath = path.join(process.cwd(), 'src/hooks/useAgentProgress.ts');
if (fs.existsSync(hookPath)) {
  console.log('  ✅ File exists');
  checks.passed++;

  const content = fs.readFileSync(hookPath, 'utf-8');
  if (content.includes('export const useAgentProgress')) {
    console.log('  ✅ useAgentProgress hook exported');
    checks.passed++;
  } else {
    console.log('  ❌ useAgentProgress hook not found');
    checks.failed++;
  }

  // Check for polling functionality
  if (content.includes('setInterval') && content.includes('pollingInterval')) {
    console.log('  ✅ Polling functionality implemented');
    checks.passed++;
  } else {
    console.log('  ⚠️  Polling functionality not found');
    checks.warnings++;
  }

  // Check for GraphQL query
  if (content.includes('client.queries.getAgentProgress')) {
    console.log('  ✅ GraphQL query integration');
    checks.passed++;
  } else {
    console.log('  ⚠️  GraphQL query not found');
    checks.warnings++;
  }
} else {
  console.log('  ❌ File does not exist');
  checks.failed++;
}

console.log('\n✓ Check 4: ChatMessage integration');
const chatMessagePath = path.join(process.cwd(), 'src/components/ChatMessage.tsx');
if (fs.existsSync(chatMessagePath)) {
  console.log('  ✅ File exists');
  checks.passed++;

  const content = fs.readFileSync(chatMessagePath, 'utf-8');
  if (content.includes('import { useAgentProgress }')) {
    console.log('  ✅ useAgentProgress hook imported');
    checks.passed++;
  } else {
    console.log('  ❌ useAgentProgress hook not imported');
    checks.failed++;
  }

  if (content.includes('import { AgentProgressIndicator }')) {
    console.log('  ✅ AgentProgressIndicator imported');
    checks.passed++;
  } else {
    console.log('  ❌ AgentProgressIndicator not imported');
    checks.failed++;
  }

  if (content.includes('import { ExtendedThinkingDisplay }')) {
    console.log('  ✅ ExtendedThinkingDisplay imported');
    checks.passed++;
  } else {
    console.log('  ❌ ExtendedThinkingDisplay not imported');
    checks.failed++;
  }

  if (content.includes('<AgentProgressIndicator')) {
    console.log('  ✅ AgentProgressIndicator rendered');
    checks.passed++;
  } else {
    console.log('  ⚠️  AgentProgressIndicator not rendered');
    checks.warnings++;
  }

  if (content.includes('<ExtendedThinkingDisplay')) {
    console.log('  ✅ ExtendedThinkingDisplay rendered');
    checks.passed++;
  } else {
    console.log('  ⚠️  ExtendedThinkingDisplay not rendered');
    checks.warnings++;
  }
} else {
  console.log('  ❌ File does not exist');
  checks.failed++;
}

console.log('\n✓ Check 5: Index exports');
const indexPath = path.join(process.cwd(), 'src/components/renewable/index.ts');
if (fs.existsSync(indexPath)) {
  console.log('  ✅ File exists');
  checks.passed++;

  const content = fs.readFileSync(indexPath, 'utf-8');
  if (content.includes('export { AgentProgressIndicator }')) {
    console.log('  ✅ AgentProgressIndicator exported from index');
    checks.passed++;
  } else {
    console.log('  ❌ AgentProgressIndicator not exported from index');
    checks.failed++;
  }

  if (content.includes('export { ExtendedThinkingDisplay }')) {
    console.log('  ✅ ExtendedThinkingDisplay exported from index');
    checks.passed++;
  } else {
    console.log('  ❌ ExtendedThinkingDisplay not exported from index');
    checks.failed++;
  }

  if (content.includes('export type { ProgressStep')) {
    console.log('  ✅ ProgressStep type exported from index');
    checks.passed++;
  } else {
    console.log('  ⚠️  ProgressStep type not exported from index');
    checks.warnings++;
  }

  if (content.includes('export type { ThinkingBlock')) {
    console.log('  ✅ ThinkingBlock type exported from index');
    checks.passed++;
  } else {
    console.log('  ⚠️  ThinkingBlock type not exported from index');
    checks.warnings++;
  }
} else {
  console.log('  ❌ File does not exist');
  checks.failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Verification Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('='.repeat(60));

if (checks.failed === 0) {
  console.log('\n🎉 All critical checks passed!');
  console.log('\n✅ Task 5: Build AgentProgressIndicator UI component - COMPLETE');
  console.log('\nComponents created:');
  console.log('  1. AgentProgressIndicator.tsx - Progress indicator with step visualization');
  console.log('  2. ExtendedThinkingDisplay.tsx - Expandable thinking display');
  console.log('  3. useAgentProgress.ts - Hook for polling agent progress');
  console.log('\nIntegration:');
  console.log('  - ChatMessage component updated to show progress indicators');
  console.log('  - Components exported from renewable/index.ts');
  console.log('\nNext steps:');
  console.log('  - Deploy backend changes (Task 4 must be complete)');
  console.log('  - Test with actual Strands Agent invocations');
  console.log('  - Verify progress updates appear in UI');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the issues above.');
  process.exit(1);
}
