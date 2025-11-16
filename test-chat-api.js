const https = require('https');

const API_URL = 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com';
const MOCK_TOKEN = 'mock-dev-token-12345';

// Test data
const testMessage = {
  message: 'Hello, test message',
  chatSessionId: 'test-session-' + Date.now(),
};

console.log('Testing chat API...');
console.log('API URL:', API_URL);
console.log('Test message:', testMessage);

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
  console.log('\n=== RESPONSE ===');
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== BODY ===');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('\n✅ Chat API is working!');
        console.log('Response text:', parsed.response?.text?.substring(0, 100));
        console.log('Artifacts:', parsed.response?.artifacts?.length || 0);
      } else {
        console.log('\n❌ Chat API returned error');
        console.log('Error:', parsed.error);
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.error('Parse error:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request error:', error);
});

req.write(postData);
req.end();
