/**
 * Test Maintenance Prompts Structure
 * 
 * This test verifies the code structure without requiring authentication:
 * 1. Maintenance prompts are defined correctly
 * 2. Each prompt has required properties
 * 3. agentType is set to 'maintenance'
 * 4. Expected artifact types are defined
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Maintenance Prompts Structure\n');
console.log('=' .repeat(80));

// Read the chat page file
const chatPagePath = path.join(__dirname, '../src/app/chat/[chatSessionId]/page.tsx');
const chatPageContent = fs.readFileSync(chatPagePath, 'utf8');

// Test 1: Verify maintenance prompts exist
console.log('\n✓ Test 1: Verify maintenance prompts exist in code');
const maintenancePromptNames = [
  'Equipment Health Assessment',
  'Failure Prediction Analysis',
  'Preventive Maintenance Planning',
  'Inspection Schedule Generation',
  'Asset Lifecycle Analysis'
];

let allPromptsFound = true;
for (const promptName of maintenancePromptNames) {
  if (chatPageContent.includes(promptName)) {
    console.log(`  ✅ Found: ${promptName}`);
  } else {
    console.error(`  ❌ Missing: ${promptName}`);
    allPromptsFound = false;
  }
}

if (allPromptsFound) {
  console.log('  ✅ All 5 maintenance prompts found in code');
} else {
  console.error('  ❌ Some maintenance prompts are missing');
}

// Test 2: Verify agentType property
console.log('\n✓ Test 2: Verify agentType property');
const agentTypeMatches = chatPageContent.match(/agentType:\s*'maintenance'/g);
if (agentTypeMatches && agentTypeMatches.length >= 5) {
  console.log(`  ✅ Found ${agentTypeMatches.length} prompts with agentType: 'maintenance'`);
} else {
  console.error(`  ❌ Expected at least 5 prompts with agentType: 'maintenance', found ${agentTypeMatches ? agentTypeMatches.length : 0}`);
  allPromptsFound = false;
}

// Test 3: Verify auto-selection logic
console.log('\n✓ Test 3: Verify auto-selection logic in onSelectionChange');
if (chatPageContent.includes('Auto-select agent if prompt has agentType specified')) {
  console.log('  ✅ Auto-selection comment found');
} else {
  console.warn('  ⚠️  Auto-selection comment not found (may be removed)');
}

if (chatPageContent.includes('selectedPrompt') && chatPageContent.includes('agentType')) {
  console.log('  ✅ Auto-selection logic checks for agentType');
} else {
  console.error('  ❌ Auto-selection logic missing');
  allPromptsFound = false;
}

if (chatPageContent.includes('setSelectedAgent(agentType)')) {
  console.log('  ✅ Auto-selection calls setSelectedAgent');
} else {
  console.error('  ❌ Auto-selection does not call setSelectedAgent');
  allPromptsFound = false;
}

if (chatPageContent.includes("sessionStorage.setItem('selectedAgent', agentType)")) {
  console.log('  ✅ Auto-selection persists to sessionStorage');
} else {
  console.error('  ❌ Auto-selection does not persist to sessionStorage');
  allPromptsFound = false;
}

// Test 4: Verify prompt structure
console.log('\n✓ Test 4: Verify prompt structure');
const requiredFields = ['name:', 'description:', 'prompt:', 'agentType:'];
let allFieldsPresent = true;

for (const field of requiredFields) {
  const fieldCount = (chatPageContent.match(new RegExp(field, 'g')) || []).length;
  if (fieldCount >= 5) {
    console.log(`  ✅ Field '${field}' found in sufficient prompts (${fieldCount})`);
  } else {
    console.error(`  ❌ Field '${field}' found in insufficient prompts (${fieldCount})`);
    allFieldsPresent = false;
  }
}

// Test 5: Verify specific prompt content
console.log('\n✓ Test 5: Verify specific prompt content');
const promptChecks = [
  { name: 'Equipment Health Assessment', keyword: 'PUMP-001' },
  { name: 'Failure Prediction Analysis', keyword: 'COMPRESSOR-001' },
  { name: 'Preventive Maintenance Planning', keyword: 'TURBINE-001' },
  { name: 'Inspection Schedule Generation', keyword: 'MOTOR-001' },
  { name: 'Asset Lifecycle Analysis', keyword: 'lifecycle' }
];

let allContentValid = true;
for (const check of promptChecks) {
  if (chatPageContent.includes(check.keyword)) {
    console.log(`  ✅ ${check.name} contains '${check.keyword}'`);
  } else {
    console.error(`  ❌ ${check.name} missing '${check.keyword}'`);
    allContentValid = false;
  }
}

// Test 6: Verify no TypeScript syntax errors in the section
console.log('\n✓ Test 6: Verify basic syntax');
const syntaxChecks = [
  { pattern: /agentType:\s*'maintenance',/g, name: 'agentType syntax' },
  { pattern: /name:\s*'[^']+',/g, name: 'name property syntax' },
  { pattern: /description:\s*'[^']+',/g, name: 'description property syntax' },
  { pattern: /prompt:\s*'[^']+',/g, name: 'prompt property syntax' }
];

let syntaxValid = true;
for (const check of syntaxChecks) {
  const matches = chatPageContent.match(check.pattern);
  if (matches && matches.length > 0) {
    console.log(`  ✅ ${check.name} appears valid`);
  } else {
    console.warn(`  ⚠️  ${check.name} may have issues`);
  }
}

// Final summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(80));

const allTestsPassed = allPromptsFound && allFieldsPresent && allContentValid;

if (allTestsPassed) {
  console.log('✅ ALL STRUCTURE TESTS PASSED');
  console.log('\nMaintenance prompts are correctly integrated into the code.');
  console.log('Next step: Test in the UI to verify functionality.');
} else {
  console.log('❌ SOME STRUCTURE TESTS FAILED');
  console.log('\nPlease review the errors above and fix the code.');
}

console.log('='.repeat(80) + '\n');

process.exit(allTestsPassed ? 0 : 1);
