#!/usr/bin/env node

/**
 * Debug script to investigate the actual well data in S3
 */

const https = require('https');
const http = require('http');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp';
const MCP_API_KEY = process.env.MCP_API_KEY || 'TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg';

async function debugWellData() {
  console.log('=== Debugging Well Data ===');
  console.log('MCP Server URL:', MCP_SERVER_URL);
  console.log('API Key configured:', !!MCP_API_KEY);
  
  try {
    // First, get detailed well info
    console.log('\n1. Getting detailed well info...');
    const wellInfoResponse = await callMCPServer({
      jsonrpc: '2.0',
      id: '1',
      method: 'tools/call',
      params: {
        name: 'get_well_info',
        arguments: {
          wellName: 'SANDSTONE_RESERVOIR_001'
        }
      }
    });
    
    if (wellInfoResponse.result) {
      const result = JSON.parse(wellInfoResponse.result.content[0].text);
      if (result.success) {
        console.log('✅ Well Info Retrieved:');
        console.log('   Well Name:', result.wellName);
        console.log('   Available Curves:', result.availableCurves);
        console.log('   Curve Info:', JSON.stringify(result.curveInfo, null, 2));
        console.log('   Well Info:', JSON.stringify(result.wellInfo, null, 2));
      } else {
        console.log('❌ Well info failed:', result.error);
        return;
      }
    }

    // Now try to get raw curve data
    console.log('\n2. Getting raw curve data...');
    const curveDataResponse = await callMCPServer({
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/call',
      params: {
        name: 'get_curve_data',
        arguments: {
          wellName: 'SANDSTONE_RESERVOIR_001',
          curves: ['DEPT', 'RHOB', 'NPHI']
        }
      }
    });
    
    if (curveDataResponse.result) {
      const result = JSON.parse(curveDataResponse.result.content[0].text);
      if (result.success) {
        console.log('✅ Curve Data Retrieved:');
        console.log('   Well Name:', result.wellName);
        console.log('   Curves:', Object.keys(result.curves));
        
        // Show first few data points for each curve
        Object.entries(result.curves).forEach(([curveName, data]) => {
          console.log(`   ${curveName}: ${data.length} points, first 5: [${data.slice(0, 5).join(', ')}]`);
        });
      } else {
        console.log('❌ Curve data failed:', result.error);
      }
    }

    // Try a simple porosity calculation with debug info
    console.log('\n3. Testing porosity calculation with debug...');
    const porosityResponse = await callMCPServer({
      jsonrpc: '2.0',
      id: '3',
      method: 'tools/call',
      params: {
        name: 'calculate_porosity',
        arguments: {
          wellName: 'SANDSTONE_RESERVOIR_001',
          method: 'density',
          parameters: {
            matrixDensity: 2.65,
            fluidDensity: 1.0
          }
        }
      }
    });
    
    if (porosityResponse.result) {
      const result = JSON.parse(porosityResponse.result.content[0].text);
      console.log('Porosity Calculation Result:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function callMCPServer(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MCP_API_KEY,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
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

// Run the debug
debugWellData().then(() => {
  console.log('\n=== Debug Complete ===');
}).catch((error) => {
  console.error('\n=== Debug Failed ===');
  console.error('Error:', error.message);
  process.exit(1);
});