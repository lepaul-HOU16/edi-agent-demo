#!/usr/bin/env node

/**
 * Test script to verify MCP server integration
 */

const https = require('https');

// Configuration - update these with your actual values
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://your-mcp-server-url.com/mcp';
const MCP_API_KEY = process.env.MCP_API_KEY || 'your-mcp-api-key';

console.log('=== MCP Integration Test ===');
console.log('MCP Server URL:', MCP_SERVER_URL);
console.log('MCP API Key configured:', !!MCP_API_KEY);

async function testMCPServer() {
  try {
    console.log('\n1. Testing MCP server connection...');
    
    // Test 1: List available tools
    const toolsResponse = await callMCPServer({
      jsonrpc: '2.0',
      id: '1',
      method: 'tools/list'
    });
    
    console.log('Tools list response:', JSON.stringify(toolsResponse, null, 2));
    
    if (toolsResponse.result && toolsResponse.result.tools) {
      console.log(`✅ Found ${toolsResponse.result.tools.length} available tools`);
      toolsResponse.result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      console.log('❌ No tools found in response');
    }
    
    // Test 2: Call list_wells tool
    console.log('\n2. Testing list_wells tool...');
    const wellsResponse = await callMCPServer({
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/call',
      params: {
        name: 'list_wells',
        arguments: {}
      }
    });
    
    console.log('Wells list response:', JSON.stringify(wellsResponse, null, 2));
    
    if (wellsResponse.result && wellsResponse.result.content) {
      const wellsData = JSON.parse(wellsResponse.result.content[0].text);
      if (wellsData.wells) {
        console.log(`✅ Found ${wellsData.wells.length} wells`);
        wellsData.wells.forEach(well => {
          console.log(`  - ${well}`);
        });
      } else {
        console.log('❌ No wells found');
      }
    } else {
      console.log('❌ Invalid response format');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

async function callMCPServer(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MCP_API_KEY,
        'accept': 'application/json',
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
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
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

// Run the test
testMCPServer().then(() => {
  console.log('\n=== Test Complete ===');
}).catch((error) => {
  console.error('\n=== Test Failed ===');
  console.error(error);
  process.exit(1);
});
