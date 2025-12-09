/**
 * Diagnose Petrophysics Backend Issue
 * Check if backend deployment worked and MCP is returning logData
 */

const https = require('https');

// Test the deployed Lambda directly
async function testLambda() {
  console.log('🔍 Testing deployed Lambda function...\n');
  
  // This would need AWS SDK to invoke Lambda directly
  // For now, let's check CloudWatch logs
  
  console.log('📋 STEPS TO DIAGNOSE:');
  console.log('');
  console.log('1. Check if backend deployment succeeded:');
  console.log('   cd cdk && npm run deploy');
  console.log('   Look for: "✅ ChatLambdaFunction deployed"');
  console.log('');
  console.log('2. Check CloudWatch logs for the NEW request:');
  console.log('   aws logs tail /aws/lambda/ChatLambdaFunction --follow --no-cli-pager');
  console.log('   Look for: "📈 LOG DATA STRUCTURE:" and "hasLogData: true"');
  console.log('');
  console.log('3. Check browser console for the NEW message:');
  console.log('   Open F12 Developer Tools');
  console.log('   Look for: "🎨 data.logData:" with actual data');
  console.log('   Look for: "⚠️ No logData found in artifact" (should NOT appear)');
  console.log('');
  console.log('4. Check if MCP server is running:');
  console.log('   The petrophysical-analysis MCP server must be active');
  console.log('   Check: Is the MCP server returning logData in its response?');
  console.log('');
  console.log('5. Verify artifact structure in DynamoDB:');
  console.log('   Check the stored message artifact');
  console.log('   Does it have logData field at top level?');
  console.log('');
}

testLambda();

console.log('🔍 DIAGNOSTIC CHECKLIST:\n');
console.log('□ Backend deployed successfully (cd cdk && npm run deploy)');
console.log('□ CloudWatch shows "hasLogData: true" for NEW request');
console.log('□ Browser console shows data.logData with curve arrays');
console.log('□ MCP server is returning logData in response');
console.log('□ Artifact in DynamoDB has logData field');
console.log('');
console.log('If ALL of these are true and it still doesn\'t work:');
console.log('Then we have a frontend rendering issue, not a backend issue.');
console.log('');
console.log('If ANY of these are false:');
console.log('That\'s where the problem is.');
