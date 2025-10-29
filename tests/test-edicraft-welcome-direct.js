#!/usr/bin/env node

/**
 * Direct Test of EDIcraft Agent Welcome Message
 * 
 * This test directly invokes the Bedrock AgentCore agent to test the welcome message.
 * It bypasses the Lambda handler and tests the agent's system prompt directly.
 */

const { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } = require('@aws-sdk/client-bedrock-agentcore');

// Configuration from environment
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID || '';
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID';
const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

// Test queries that should trigger welcome message
const WELCOME_QUERIES = [
  'Hello',
  'Hi',
  'Hey',
  'What can you do?',
  'Help'
];

// Patterns that should NOT appear in welcome message
const FORBIDDEN_PATTERNS = [
  /https?:\/\/[^\s]+/i,  // URLs
  /:\d{4,5}/,             // Port numbers
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,  // IP addresses
  /edicraft\.nigelgardiner\.com/i,
  /osdu\.vavourak\.people\.aws\.dev/i,
  /partition/i,
  /rcon/i,
  /password/i,
  /authentication/i,
  /endpoint/i
];

// Required elements in welcome message
const REQUIRED_ELEMENTS = [
  /EDIcraft/i,
  /Minecraft/i,
  /wellbore/i,
  /horizon/i,
  /OSDU/i,
  /visualiz/i,
  /🎮|⛏️|🔍|🌍/  // Emoji indicators
];

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function testWelcomeMessage(response) {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  console.log('\n' + '='.repeat(60));
  console.log('📋 RUNNING QUALITY TESTS');
  console.log('='.repeat(60));

  // Test 1: Check for forbidden patterns (server details)
  console.log('\n📋 Test 1: Checking for exposed server details...');
  let foundForbidden = false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(response)) {
      results.failed.push(`❌ Found forbidden pattern: ${pattern}`);
      foundForbidden = true;
      console.log(`   ❌ Found forbidden pattern: ${pattern}`);
    }
  }
  if (!foundForbidden) {
    results.passed.push('✅ No server URLs or ports exposed');
    console.log('   ✅ No server URLs or ports exposed');
  }

  // Test 2: Check word count (should be under 300 words)
  console.log('\n📋 Test 2: Checking message length...');
  const wordCount = countWords(response);
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
  for (const pattern of REQUIRED_ELEMENTS) {
    if (!pattern.test(response)) {
      missingElements.push(pattern.toString());
    }
  }
  if (missingElements.length === 0) {
    results.passed.push('✅ All required elements present (EDIcraft, Minecraft, capabilities)');
    console.log('   ✅ All required elements present');
  } else {
    results.failed.push(`❌ Missing required elements: ${missingElements.join(', ')}`);
    console.log(`   ❌ Missing required elements: ${missingElements.join(', ')}`);
  }

  // Test 4: Check tone (friendly indicators)
  console.log('\n📋 Test 4: Checking tone and approachability...');
  const friendlyIndicators = [
    /Hello|Hi|Welcome/i,
    /ready/i,
    /help/i,
    /explore/i,
    /🎮|⛏️|🔍|🌍/
  ];
  let friendlyCount = 0;
  for (const indicator of friendlyIndicators) {
    if (indicator.test(response)) {
      friendlyCount++;
    }
  }
  if (friendlyCount >= 3) {
    results.passed.push(`✅ Friendly, approachable tone (${friendlyCount} friendly indicators)`);
    console.log(`   ✅ Friendly, approachable tone (${friendlyCount} indicators)`);
  } else {
    results.warnings.push(`⚠️  Limited friendly tone (${friendlyCount} indicators, expected 3+)`);
    console.log(`   ⚠️  Limited friendly tone (${friendlyCount} indicators)`);
  }

  // Test 5: Check structure (sections/categories)
  console.log('\n📋 Test 5: Checking message structure...');
  const hasStructure = /\*\*.*\*\*/.test(response) || /•/.test(response);
  if (hasStructure) {
    results.passed.push('✅ Clear structure with sections and bullet points');
    console.log('   ✅ Clear structure with sections and bullet points');
  } else {
    results.warnings.push('⚠️  Message could benefit from more structure');
    console.log('   ⚠️  Message could benefit from more structure');
  }

  return results;
}

async function invokeBedrockAgent(message) {
  const client = new BedrockAgentCoreClient({ region: BEDROCK_REGION });
  const sessionId = `test-session-${Date.now()}`;

  console.log(`\n🔍 Invoking Bedrock AgentCore...`);
  console.log(`   Agent ID: ${BEDROCK_AGENT_ID}`);
  console.log(`   Alias ID: ${BEDROCK_AGENT_ALIAS_ID}`);
  console.log(`   Region: ${BEDROCK_REGION}`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   Message: "${message}"`);

  const command = new InvokeAgentRuntimeCommand({
    agentId: BEDROCK_AGENT_ID,
    agentAliasId: BEDROCK_AGENT_ALIAS_ID,
    sessionId: sessionId,
    inputText: message
  });

  try {
    const response = await client.send(command);
    
    // Parse the streaming response
    let fullResponse = '';
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk && event.chunk.bytes) {
          const chunk = new TextDecoder().decode(event.chunk.bytes);
          fullResponse += chunk;
        }
      }
    }

    return fullResponse;
  } catch (error) {
    throw new Error(`Failed to invoke agent: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 EDIcraft Agent Welcome Message Quality Test');
  console.log('='.repeat(60));

  // Validate configuration
  if (!BEDROCK_AGENT_ID) {
    console.error('\n❌ ERROR: BEDROCK_AGENT_ID environment variable not set');
    console.error('\nPlease set the following environment variables:');
    console.error('  export BEDROCK_AGENT_ID=your-agent-id');
    console.error('  export BEDROCK_AGENT_ALIAS_ID=TSTALIASID');
    console.error('  export BEDROCK_REGION=us-east-1');
    console.error('\nOr source your .env.local file:');
    console.error('  source .env.local');
    process.exit(1);
  }

  let allPassed = true;

  // Test with first welcome query
  const testQuery = WELCOME_QUERIES[0];
  console.log(`\n🔍 Testing with query: "${testQuery}"`);

  try {
    const response = await invokeBedrockAgent(testQuery);
    
    if (!response || response.trim() === '') {
      console.error('\n❌ Agent returned empty response');
      process.exit(1);
    }

    console.log('\n📨 Received response:');
    console.log('-'.repeat(60));
    console.log(response);
    console.log('-'.repeat(60));

    // Run quality tests
    const results = testWelcomeMessage(response);

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
      allPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (allPassed && results.failed.length === 0) {
      console.log('\n🎉 All tests passed! Welcome message meets quality standards.');
      console.log('\n✅ Task 3 Complete: Welcome message quality verified');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the welcome message.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. Bedrock AgentCore agent is deployed');
    console.error('2. BEDROCK_AGENT_ID is correct');
    console.error('3. AWS credentials are configured');
    console.error('4. You have permissions to invoke Bedrock agents');
    console.error('\nDeployment guide: edicraft-agent/DEPLOYMENT_GUIDE.md');
    process.exit(1);
  }
}

// Run tests
runTests();
