const https = require('https');

const API_URL = 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com';
const MOCK_TOKEN = 'mock-dev-token-12345';

// Test petrophysics query
const testMessage = {
  message: 'Calculate porosity for WELL-001',
  chatSessionId: 'test-session-petro-' + Date.now(),
};

console.log('Testing petrophysics query...');
console.log('Query:', testMessage.message);

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'hbt1j807qf.execute-api.us-east-1.amazonaws.com',
  path: '/api/chat/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${MOCK_TOKEN}`,
  },
};

const req = https.request(options, (res) => {
  console.log('\nStatus:', res.statusCode);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n=== RESPONSE ===');
      console.log('Success:', parsed.success);
      console.log('Agent used:', parsed.data?.agentUsed);
      console.log('Message:', parsed.message?.substring(0, 200));
      console.log('Artifacts:', parsed.response?.artifacts?.length || 0);
      console.log('Thought steps:', parsed.data?.thoughtSteps?.length || 0);
      
      if (parsed.data?.thoughtSteps) {
        console.log('\n=== THOUGHT STEPS ===');
        parsed.data.thoughtSteps.forEach((step, i) => {
          console.log(`${i + 1}. ${step.title} - ${step.status}`);
          if (step.details) console.log(`   ${step.details}`);
        });
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();
