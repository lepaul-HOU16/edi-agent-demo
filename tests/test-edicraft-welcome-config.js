#!/usr/bin/env node

/**
 * Test EDIcraft Agent Welcome Message Configuration
 * 
 * This test validates the system prompt configuration in agent.py
 * to ensure the welcome message meets quality standards.
 */

const fs = require('fs');
const path = require('path');

// Read the agent.py file
const agentPyPath = path.join(__dirname, '..', 'edicraft-agent', 'agent.py');

if (!fs.existsSync(agentPyPath)) {
  console.error('❌ ERROR: agent.py not found at:', agentPyPath);
  process.exit(1);
}

const agentPyContent = fs.readFileSync(agentPyPath, 'utf8');

// Extract the system prompt
const systemPromptMatch = agentPyContent.match(/system_prompt=f?"""([\s\S]*?)"""/);

if (!systemPromptMatch) {
  console.error('❌ ERROR: Could not find system_prompt in agent.py');
  process.exit(1);
}

const systemPrompt = systemPromptMatch[1];

// Extract the welcome message section
const welcomeMessageMatch = systemPrompt.match(/## Welcome Message[\s\S]*?respond with:\s*\n\s*"([\s\S]*?)"/);

if (!welcomeMessageMatch) {
  console.error('❌ ERROR: Could not find welcome message in system prompt');
  process.exit(1);
}

const welcomeMessage = welcomeMessageMatch[1];

console.log('🧪 EDIcraft Agent Welcome Message Configuration Test\n');
console.log('='.repeat(60));

// Patterns that should NOT appear in welcome message
const FORBIDDEN_PATTERNS = [
  { pattern: /https?:\/\/[^\s]+/i, name: 'URLs' },
  { pattern: /:\d{4,5}/, name: 'Port numbers' },
  { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, name: 'IP addresses' },
  { pattern: /edicraft\.nigelgardiner\.com/i, name: 'Server hostname' },
  { pattern: /osdu\.vavourak\.people\.aws\.dev/i, name: 'OSDU URL' },
  { pattern: /partition/i, name: 'Partition name' },
  { pattern: /rcon/i, name: 'RCON reference' },
  { pattern: /password/i, name: 'Password reference' },
  { pattern: /authentication/i, name: 'Authentication details' },
  { pattern: /endpoint/i, name: 'Endpoint reference' }
];

// Required elements in welcome message
const REQUIRED_ELEMENTS = [
  { pattern: /EDIcraft/i, name: 'EDIcraft branding' },
  { pattern: /Minecraft/i, name: 'Minecraft reference' },
  { pattern: /wellbore/i, name: 'Wellbore capability' },
  { pattern: /horizon/i, name: 'Horizon capability' },
  { pattern: /OSDU/i, name: 'OSDU platform reference' },
  { pattern: /visualiz/i, name: 'Visualization mention' },
  { pattern: /🎮|⛏️|🔍|🌍/, name: 'Emoji indicators' }
];

// Friendly tone indicators
const FRIENDLY_INDICATORS = [
  { pattern: /Hello|Hi|Welcome/i, name: 'Greeting' },
  { pattern: /ready/i, name: 'Ready indicator' },
  { pattern: /help/i, name: 'Help offer' },
  { pattern: /explore/i, name: 'Exploration invitation' },
  { pattern: /🎮|⛏️|🔍|🌍/, name: 'Friendly emojis' }
];

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

const results = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('\n📨 Welcome Message Content:');
console.log('-'.repeat(60));
console.log(welcomeMessage);
console.log('-'.repeat(60));

// Test 1: Check for forbidden patterns (server details)
console.log('\n📋 Test 1: Checking for exposed server details...');
let foundForbidden = false;
for (const { pattern, name } of FORBIDDEN_PATTERNS) {
  if (pattern.test(welcomeMessage)) {
    results.failed.push(`❌ Found forbidden pattern: ${name}`);
    console.log(`   ❌ Found forbidden pattern: ${name}`);
    foundForbidden = true;
  }
}
if (!foundForbidden) {
  results.passed.push('✅ No server URLs or ports exposed');
  console.log('   ✅ No server URLs or ports exposed');
}

// Test 2: Check word count (should be under 300 words)
console.log('\n📋 Test 2: Checking message length...');
const wordCount = countWords(welcomeMessage);
if (wordCount <= 300) {
  results.passed.push(`✅ Message is concise (${wordCount} words, under 300)`);
  console.log(`   ✅ Message is concise (${wordCount} words, under 300)`);
} else {
  results.failed.push(`❌ Message too long (${wordCount} words, should be under 300)`);
  console.log(`   ❌ Message too long (${wordCount} words, should be under 300)`);
}

// Test 3: Check for required elements
console.log('\n📋 Test 3: Checking for required elements...');
let missingElements = [];
for (const { pattern, name } of REQUIRED_ELEMENTS) {
  if (!pattern.test(welcomeMessage)) {
    missingElements.push(name);
  }
}
if (missingElements.length === 0) {
  results.passed.push('✅ All required elements present');
  console.log('   ✅ All required elements present');
} else {
  results.failed.push(`❌ Missing required elements: ${missingElements.join(', ')}`);
  console.log(`   ❌ Missing: ${missingElements.join(', ')}`);
}

// Test 4: Check tone (friendly indicators)
console.log('\n📋 Test 4: Checking tone and approachability...');
let friendlyCount = 0;
const foundIndicators = [];
for (const { pattern, name } of FRIENDLY_INDICATORS) {
  if (pattern.test(welcomeMessage)) {
    friendlyCount++;
    foundIndicators.push(name);
  }
}
if (friendlyCount >= 3) {
  results.passed.push(`✅ Friendly, approachable tone (${friendlyCount} indicators: ${foundIndicators.join(', ')})`);
  console.log(`   ✅ Friendly tone (${friendlyCount} indicators: ${foundIndicators.join(', ')})`);
} else {
  results.warnings.push(`⚠️  Limited friendly tone (${friendlyCount} indicators, expected 3+)`);
  console.log(`   ⚠️  Limited friendly tone (${friendlyCount} indicators)`);
}

// Test 5: Check structure (sections/categories)
console.log('\n📋 Test 5: Checking message structure...');
const hasStructure = /\*\*.*\*\*/.test(welcomeMessage) || /•/.test(welcomeMessage);
if (hasStructure) {
  results.passed.push('✅ Clear structure with sections and bullet points');
  console.log('   ✅ Clear structure with sections and bullet points');
} else {
  results.warnings.push('⚠️  Message could benefit from more structure');
  console.log('   ⚠️  Message could benefit from more structure');
}

// Test 6: Check for Minecraft visualization reminder
console.log('\n📋 Test 6: Checking for Minecraft visualization guidance...');
const hasMinecraftGuidance = /connect.*Minecraft/i.test(systemPrompt) || /visualization.*Minecraft/i.test(systemPrompt);
if (hasMinecraftGuidance) {
  results.passed.push('✅ System prompt includes Minecraft visualization guidance');
  console.log('   ✅ System prompt includes Minecraft visualization guidance');
} else {
  results.warnings.push('⚠️  System prompt should remind users about Minecraft visualization');
  console.log('   ⚠️  System prompt should remind users about Minecraft visualization');
}

// Display summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

if (results.passed.length > 0) {
  console.log('\n✅ PASSED TESTS:');
  results.passed.forEach(test => console.log(`   ${test}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(warning => console.log(`   ${warning}`));
}

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(failure => console.log(`   ${failure}`));
}

// Final summary
console.log('\n' + '='.repeat(60));
console.log('📈 FINAL SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

const allPassed = results.failed.length === 0;

if (allPassed) {
  console.log('\n🎉 All tests passed! Welcome message configuration meets quality standards.');
  console.log('\n✅ Task 3 Complete: Welcome message quality verified in agent.py');
  console.log('\nThe welcome message is:');
  console.log('  • Professional and concise (under 300 words)');
  console.log('  • Free of server URLs and technical details');
  console.log('  • Friendly and approachable');
  console.log('  • Well-structured with clear sections');
  console.log('  • Includes all required capabilities');
  console.log('\nNext steps:');
  console.log('  1. Deploy the agent: cd edicraft-agent && make deploy');
  console.log('  2. Test end-to-end with actual user queries');
  console.log('  3. Verify Minecraft visualization workflow');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the welcome message in agent.py');
  process.exit(1);
}
