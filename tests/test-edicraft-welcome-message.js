#!/usr/bin/env node

/**
 * Test EDIcraft Agent Welcome Message Quality
 * 
 * This test verifies:
 * 1. Professional welcome message appears for initial/empty queries
 * 2. No server URLs or ports are visible
 * 3. Message is concise (under 300 words)
 * 4. Friendly, approachable tone
 * 5. Clear capability descriptions
 */

const https = require('https');

// Configuration
const EDICRAFT_AGENT_URL = process.env.EDICRAFT_AGENT_URL || 'https://edicraft-agent.nigelgardiner.com';

// Test queries that should trigger welcome message
const WELCOME_QUERIES = [
  'Hello',
  'Hi',
  'Hey',
  '',
  'What can you do?',
  'Help',
  'Welcome'
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

  // Test 1: Check for forbidden patterns (server details)
  console.log('\n📋 Test 1: Checking for exposed server details...');
  let foundForbidden = false;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(response)) {
      results.failed.push(`❌ Found forbidden pattern: ${pattern}`);
      foundForbidden = true;
    }
  }
  if (!foundForbidden) {
    results.passed.push('✅ No server URLs or ports exposed');
  }

  // Test 2: Check word count (should be under 300 words)
  console.log('\n📋 Test 2: Checking message length...');
  const wordCount = countWords(response);
  if (wordCount <= 300) {
    results.passed.push(`✅ Message is concise (${wordCount} words, under 300)`);
  } else {
    results.failed.push(`❌ Message too long (${wordCount} words, should be under 300)`);
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
  } else {
    results.failed.push(`❌ Missing required elements: ${missingElements.join(', ')}`);
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
  } else {
    results.warnings.push(`⚠️  Limited friendly tone (${friendlyCount} indicators, expected 3+)`);
  }

  // Test 5: Check structure (sections/categories)
  console.log('\n📋 Test 5: Checking message structure...');
  const hasStructure = /\*\*.*\*\*/.test(response) || /•/.test(response);
  if (hasStructure) {
    results.passed.push('✅ Clear structure with sections and bullet points');
  } else {
    results.warnings.push('⚠️  Message could benefit from more structure');
  }

  return results;
}

async function invokeEDIcraftAgent(query) {
  return new Promise((resolve, reject) => {
    const url = new URL(EDICRAFT_AGENT_URL);
    const postData = JSON.stringify({ prompt: query });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 EDIcraft Agent Welcome Message Quality Test\n');
  console.log('=' .repeat(60));

  let allPassed = true;

  // Test with first welcome query
  const testQuery = WELCOME_QUERIES[0];
  console.log(`\n🔍 Testing with query: "${testQuery}"\n`);

  try {
    const response = await invokeEDIcraftAgent(testQuery);
    
    if (response.error) {
      console.error('❌ Agent returned error:', response.error);
      process.exit(1);
    }

    const message = response.response || response.message || '';
    
    console.log('📨 Received response:');
    console.log('-'.repeat(60));
    console.log(message);
    console.log('-'.repeat(60));

    // Run quality tests
    const results = testWelcomeMessage(message);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
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
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (allPassed && results.failed.length === 0) {
      console.log('\n🎉 All tests passed! Welcome message meets quality standards.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please review the welcome message.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('\nPlease ensure:');
    console.error('1. EDIcraft agent is deployed and accessible');
    console.error('2. EDICRAFT_AGENT_URL environment variable is set correctly');
    console.error('3. Agent is responding to requests');
    process.exit(1);
  }
}

// Run tests
runTests();
