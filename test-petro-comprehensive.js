const https = require('https');

const API_URL = 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com';
const MOCK_TOKEN = 'mock-dev-token-12345';

async function testQuery(message) {
  return new Promise((resolve, reject) => {
    const testMessage = {
      message,
      chatSessionId: 'test-session-' + Date.now(),
    };

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
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  const tests = [
    'Calculate porosity for WELL-002',
    'Calculate shale volume for WELL-001',
    'Calculate water saturation for WELL-003',
  ];

  for (const query of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${query}`);
    console.log('='.repeat(60));
    
    try {
      const result = await testQuery(query);
      console.log('✅ Success:', result.success);
      console.log('📊 Agent:', result.data?.agentUsed);
      console.log('💬 Message:', result.message?.substring(0, 100));
      console.log('📦 Artifacts:', result.response?.artifacts?.length || 0);
      
      if (result.response?.artifacts?.[0]) {
        const artifact = result.response.artifacts[0];
        console.log('📈 Artifact type:', artifact.messageContentType);
        if (artifact.results?.statistics) {
          console.log('📊 Mean:', artifact.results.statistics.mean?.toFixed(3));
          console.log('📊 Count:', artifact.results.statistics.count);
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('All tests complete!');
  console.log('='.repeat(60));
}

runTests();
