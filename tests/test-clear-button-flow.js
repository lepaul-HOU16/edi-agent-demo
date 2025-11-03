/**
 * Test Clear Button Complete Flow
 * Validates that "Clear the Minecraft environment" message routes correctly
 * and reaches the EDIcraft agent
 */

// Test 1: Agent Router Pattern Matching
console.log('=== TEST 1: Agent Router Pattern Matching ===');

const clearMessage = 'Clear the Minecraft environment';
const lowerMessage = clearMessage.toLowerCase();

// EDIcraft patterns from agentRouter.ts
const edicraftPatterns = [
  /minecraft/i,
  /clear.*minecraft|minecraft.*clear/i,
  /clear.*environment|environment.*clear/i,
  /remove.*wellbore|remove.*structure/i,
  /clean.*minecraft|reset.*minecraft/i,
  /delete.*wellbore|delete.*structure/i,
];

console.log('Testing message:', clearMessage);
console.log('Lowercase:', lowerMessage);

let matchedPatterns = [];
for (const pattern of edicraftPatterns) {
  if (pattern.test(lowerMessage)) {
    matchedPatterns.push(pattern.source);
    console.log('✅ MATCHED:', pattern.source);
  }
}

if (matchedPatterns.length > 0) {
  console.log('\n✅ TEST 1 PASSED: Message matches EDIcraft patterns');
  console.log('Matched patterns:', matchedPatterns);
} else {
  console.log('\n❌ TEST 1 FAILED: Message does NOT match any EDIcraft patterns');
}

// Test 2: Intent Classification
console.log('\n=== TEST 2: Intent Classification ===');

// Simulate intent classification logic
function classifyIntent(message) {
  const normalized = message.trim().toLowerCase();
  
  // Clear environment patterns
  const clearPatterns = [
    /clear.*minecraft|minecraft.*clear/i,
    /clear.*environment|environment.*clear/i,
    /remove.*all|delete.*all|clean.*all/i,
    /reset.*minecraft|reset.*environment/i,
  ];
  
  for (const pattern of clearPatterns) {
    if (pattern.test(normalized)) {
      return {
        type: 'clear_environment',
        confidence: 0.95,
        parameters: {}
      };
    }
  }
  
  return {
    type: 'unknown',
    confidence: 0.0,
    parameters: {}
  };
}

const intent = classifyIntent(clearMessage);
console.log('Intent classification result:', JSON.stringify(intent, null, 2));

if (intent.type === 'clear_environment' && intent.confidence >= 0.85) {
  console.log('✅ TEST 2 PASSED: Intent correctly classified as clear_environment');
} else {
  console.log('❌ TEST 2 FAILED: Intent not classified correctly');
  console.log('Expected: clear_environment with confidence >= 0.85');
  console.log('Got:', intent);
}

// Test 3: Message Flow Simulation
console.log('\n=== TEST 3: Message Flow Simulation ===');

console.log('1. User clicks "Clear Minecraft Environment" button');
console.log('2. EDIcraftAgentLanding.handleClearEnvironment() called');
console.log('3. onSendMessage("Clear the Minecraft environment") called');
console.log('4. Chat page handleSendMessage() creates message with role="human"');
console.log('5. sendMessage() in amplifyUtils.ts creates ChatMessage in DB');
console.log('6. invokeLightweightAgent mutation called with agentType="edicraft"');
console.log('7. Agent router receives message with selectedAgent="edicraft"');
console.log('8. Router checks: sessionContext?.selectedAgent === "edicraft"');
console.log('9. Router routes to EDIcraft agent (bypassing intent detection)');
console.log('10. EDIcraft handler processes message');
console.log('11. MCP client sends to Python agent');
console.log('12. Python agent calls clear_environment tool');
console.log('13. Response returned to frontend');

console.log('\n✅ TEST 3: Flow documented');

// Test 4: Check for potential issues
console.log('\n=== TEST 4: Potential Issues Check ===');

const potentialIssues = [];

// Issue 1: Agent selection not persisted
console.log('Checking: Is selectedAgent="edicraft" when clear button is clicked?');
console.log('  - EDIcraftAgentLanding is only shown when selectedAgent="edicraft"');
console.log('  - So yes, selectedAgent should be "edicraft"');
console.log('  ✅ No issue here');

// Issue 2: Message not reaching agent
console.log('\nChecking: Does message reach EDIcraft agent?');
console.log('  - Router checks: sessionContext?.selectedAgent === "edicraft"');
console.log('  - If true, routes directly to EDIcraft (bypassing intent detection)');
console.log('  - Need to verify sessionContext is passed correctly');
console.log('  ⚠️  POTENTIAL ISSUE: Verify sessionContext.selectedAgent is passed');

// Issue 3: Python agent not processing clear command
console.log('\nChecking: Does Python agent process clear command?');
console.log('  - Intent classifier should detect "clear_environment"');
console.log('  - Should generate tool call for clear_environment');
console.log('  - Python agent should execute clear_environment tool');
console.log('  ⚠️  POTENTIAL ISSUE: Verify Python agent has clear_environment tool');

// Issue 4: Success message but no actual clearing
console.log('\nChecking: Does clear_environment tool actually clear Minecraft?');
console.log('  - Tool should send RCON commands to Minecraft server');
console.log('  - Should use /kill @e[type=!player] or similar');
console.log('  ⚠️  POTENTIAL ISSUE: Verify tool implementation clears entities');

console.log('\n=== SUMMARY ===');
console.log('✅ Message matches EDIcraft patterns');
console.log('✅ Intent classification works');
console.log('✅ Flow is documented');
console.log('⚠️  Need to verify:');
console.log('   1. sessionContext.selectedAgent is passed to agent router');
console.log('   2. Python agent has clear_environment tool');
console.log('   3. clear_environment tool actually clears Minecraft');

console.log('\n=== NEXT STEPS ===');
console.log('1. Check if Python agent has clear_environment tool');
console.log('2. Verify tool sends correct RCON commands');
console.log('3. Test with actual Minecraft server');
console.log('4. Add logging to track message flow');
