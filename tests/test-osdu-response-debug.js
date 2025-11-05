/**
 * OSDU Response Debug Test
 * Tests the OSDU proxy Lambda to diagnose response parsing issues
 */

const https = require('https');

// Test configuration
const OSDU_API_URL = process.env.OSDU_API_URL || 'https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search';
const OSDU_API_KEY = process.env.OSDU_API_KEY;

console.log('🔍 OSDU Response Debug Test');
console.log('================================\n');

if (!OSDU_API_KEY) {
  console.error('❌ OSDU_API_KEY environment variable not set');
  console.log('Please set OSDU_API_KEY in your .env.local file');
  process.exit(1);
}

// Test query
const testQuery = 'show me osdu wells';

console.log('📤 Sending test query to OSDU API...');
console.log('Query:', testQuery);
console.log('URL:', OSDU_API_URL);
console.log('');

// Parse URL
const url = new URL(OSDU_API_URL);

const postData = JSON.stringify({
  query: testQuery,
  dataPartition: 'osdu',
  maxResults: 10
});

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-api-key': OSDU_API_KEY
  }
};

const req = https.request(options, (res) => {
  console.log('📥 Response received');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Raw Response Data:');
    console.log('Length:', data.length, 'bytes');
    console.log('');
    
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Response parsed successfully');
      console.log('');
      console.log('Response Structure:');
      console.log('  Keys:', Object.keys(parsed));
      console.log('  Has response:', !!parsed.response);
      console.log('  Has answer:', !!parsed.answer);
      console.log('  Has records:', !!parsed.records);
      console.log('  Has reasoningSteps:', !!parsed.reasoningSteps);
      console.log('  Has metadata:', !!parsed.metadata);
      console.log('  Has sessionId:', !!parsed.sessionId);
      console.log('');
      
      if (parsed.response) {
        console.log('Response field (first 200 chars):');
        console.log(parsed.response.substring(0, 200));
        console.log('');
      }
      
      if (parsed.reasoningSteps && Array.isArray(parsed.reasoningSteps)) {
        console.log('Reasoning Steps:', parsed.reasoningSteps.length);
        parsed.reasoningSteps.forEach((step, i) => {
          console.log(`  Step ${i + 1}:`, step.type);
          if (step.type === 'tool_result' && step.result?.body?.records) {
            console.log(`    Records found:`, step.result.body.records.length);
            console.log(`    Metadata:`, step.result.body.metadata);
          }
        });
        console.log('');
      }
      
      if (parsed.records && Array.isArray(parsed.records)) {
        console.log('Top-level records:', parsed.records.length);
        console.log('');
      }
      
      console.log('Full Response (formatted):');
      console.log(JSON.stringify(parsed, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to parse response as JSON');
      console.error('Error:', error.message);
      console.log('');
      console.log('Raw data (first 500 chars):');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
