/**
 * Test EDIcraft Horizon Surface Visualization via Bedrock AgentCore
 * 
 * This test verifies:
 * 1. Agent processes horizon surface data correctly
 * 2. Response indicates where to see results
 * 3. Response quality and clarity
 * 4. Response follows professional format
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
require('dotenv').config({ path: '.env.local' });

// Configuration from environment
const BEDROCK_AGENT_ID = process.env.BEDROCK_AGENT_ID;
const BEDROCK_AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID;
const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';

/**
 * Send a message to the EDIcraft agent via Bedrock
 */
async function sendToEDIcraft(message) {
  const client = new BedrockAgentRuntimeClient({ region: BEDROCK_REGION });
  
  const command = new InvokeAgentCommand({
    agentId: BEDROCK_AGENT_ID,
    agentAliasId: BEDROCK_AGENT_ALIAS_ID,
    sessionId: `test-horizon-${Date.now()}`,
    inputText: message,
  });

  try {
    const response = await client.send(command);
    
    // Parse the streaming response
    let fullResponse = '';
    for await (const event of response.completion) {
      if (event.chunk && event.chunk.bytes) {
        const chunk = new TextDecoder().decode(event.chunk.bytes);
        fullResponse += chunk;
      }
    }
    
    return { response: fullResponse };
  } catch (error) {
    throw new Error(`Bedrock invocation failed: ${error.message}`);
  }
}

/**
 * Test horizon surface visualization workflow
 */
async function testHorizonWorkflow() {
  console.log('🧪 Testing EDIcraft Horizon Surface Visualization Workflow\n');
  console.log('=' .repeat(60));
  console.log(`Using Bedrock Agent: ${BEDROCK_AGENT_ID}`);
  console.log(`Agent Alias: ${BEDROCK_AGENT_ALIAS_ID}`);
  console.log(`Region: ${BEDROCK_REGION}`);
  console.log('=' .repeat(60));

  try {
    // Test 1: Send horizon visualization command
    console.log('\n📤 Sending command: "Visualize horizon surface in Minecraft"');
    const response = await sendToEDIcraft('Visualize horizon surface in Minecraft');

    console.log('\n📥 Response received:');
    console.log(JSON.stringify(response, null, 2));

    // Test 2: Verify response structure
    console.log('\n✅ Verification Results:');
    
    const responseText = response.response || response.message || '';
    
    // Check 1: Response exists
    if (!responseText) {
      console.log('❌ FAIL: No response text received');
      return false;
    }
    console.log('✅ Response text exists');

    // Check 2: Response mentions Minecraft
    const mentionsMinecraft = responseText.toLowerCase().includes('minecraft');
    if (mentionsMinecraft) {
      console.log('✅ Response mentions Minecraft visualization');
    } else {
      console.log('❌ FAIL: Response does not mention Minecraft');
    }

    // Check 3: Response is concise (under 500 words)
    const wordCount = responseText.split(/\s+/).length;
    if (wordCount < 500) {
      console.log(`✅ Response is concise (${wordCount} words)`);
    } else {
      console.log(`⚠️  WARNING: Response is verbose (${wordCount} words)`);
    }

    // Check 4: Response is actionable (contains emoji or clear formatting)
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(responseText);
    const hasCheckmark = responseText.includes('✅');
    const hasGamepad = responseText.includes('🎮');
    const hasEarth = responseText.includes('🌍');
    
    if (hasEmoji || hasCheckmark || hasGamepad || hasEarth) {
      console.log('✅ Response uses professional formatting (emoji/icons)');
    } else {
      console.log('⚠️  WARNING: Response lacks visual formatting');
    }

    // Check 5: Response indicates where to see results
    const indicatesLocation = 
      responseText.toLowerCase().includes('connect to') ||
      responseText.toLowerCase().includes('see the') ||
      responseText.toLowerCase().includes('explore') ||
      responseText.toLowerCase().includes('visualization') ||
      responseText.toLowerCase().includes('in minecraft');
    
    if (indicatesLocation) {
      console.log('✅ Response indicates where to see visualization');
    } else {
      console.log('❌ FAIL: Response does not indicate where to see results');
    }

    // Check 6: Response mentions horizon or surface
    const mentionsHorizon = 
      responseText.toLowerCase().includes('horizon') ||
      responseText.toLowerCase().includes('surface') ||
      responseText.toLowerCase().includes('geological');
    
    if (mentionsHorizon) {
      console.log('✅ Response mentions horizon/surface');
    } else {
      console.log('❌ FAIL: Response does not mention horizon/surface');
    }

    // Check 7: No technical details exposed
    const exposesDetails = 
      responseText.includes('http://') ||
      responseText.includes('https://') ||
      responseText.includes(':49') ||
      responseText.includes('port') ||
      responseText.includes('RCON') ||
      responseText.includes('osdu.vavourak');
    
    if (!exposesDetails) {
      console.log('✅ Response does not expose technical details');
    } else {
      console.log('❌ FAIL: Response exposes technical details (URLs/ports)');
    }

    // Check 8: Response quality - clear and professional
    const hasClearStructure = 
      (hasCheckmark || hasEmoji) &&
      (responseText.includes('\n') || responseText.length > 50);
    
    if (hasClearStructure) {
      console.log('✅ Response has clear structure and professional tone');
    } else {
      console.log('⚠️  WARNING: Response structure could be improved');
    }

    // Check 9: Response mentions data processing (optional but good)
    const mentionsProcessing = 
      responseText.toLowerCase().includes('process') ||
      responseText.toLowerCase().includes('coordinate') ||
      responseText.toLowerCase().includes('data') ||
      responseText.toLowerCase().includes('point');
    
    if (mentionsProcessing) {
      console.log('✅ Response mentions data processing (good detail)');
    } else {
      console.log('ℹ️  INFO: Response does not mention data processing');
    }

    // Overall assessment
    console.log('\n' + '='.repeat(60));
    const criticalPassed = 
      responseText &&
      mentionsMinecraft &&
      indicatesLocation &&
      mentionsHorizon &&
      !exposesDetails;

    const qualityPassed = 
      wordCount < 500 &&
      (hasEmoji || hasCheckmark || hasGamepad || hasEarth) &&
      hasClearStructure;

    if (criticalPassed && qualityPassed) {
      console.log('✅ ALL CHECKS PASSED - Horizon workflow is working correctly!');
      console.log('\n📋 Summary:');
      console.log('   • Agent responds to horizon surface commands');
      console.log('   • Response mentions Minecraft visualization');
      console.log('   • Response indicates where to see results');
      console.log('   • Response is concise and clear');
      console.log('   • Response follows professional format');
      console.log('   • No technical details exposed');
      return true;
    } else if (criticalPassed) {
      console.log('⚠️  CRITICAL CHECKS PASSED - Some quality improvements possible');
      console.log('\n📋 Summary:');
      console.log('   • Core functionality working');
      console.log('   • Response quality could be enhanced');
      return true;
    } else {
      console.log('❌ CRITICAL CHECKS FAILED - Review issues above');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify AWS credentials are configured');
    console.error('2. Check BEDROCK_AGENT_ID in .env.local');
    console.error('3. Check BEDROCK_AGENT_ALIAS_ID in .env.local');
    console.error('4. Verify agent is deployed in Bedrock AgentCore');
    console.error('5. Check IAM permissions for bedrock-agent-runtime:InvokeAgent');
    return false;
  }
}

/**
 * Display Minecraft connection instructions
 */
function displayMinecraftInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 MINECRAFT VERIFICATION STEPS');
  console.log('='.repeat(60));
  console.log('\nTo verify the horizon surface was actually built in Minecraft:');
  console.log('\n1. Open Minecraft Java Edition');
  console.log('2. Click "Multiplayer"');
  console.log('3. Add server:');
  console.log('   • Server Name: EDIcraft');
  console.log('   • Server Address: edicraft.nigelgardiner.com:49000');
  console.log('4. Connect to the server');
  console.log('5. Look for the horizon surface (underground, Y<100)');
  console.log('6. Verify the surface structure is visible');
  console.log('\nExpected Result:');
  console.log('   • Horizon surface visible as solid blocks underground');
  console.log('   • Surface follows geological horizon data from OSDU');
  console.log('   • Structure may contain thousands of coordinate points');
  console.log('   • Surface represents subsurface geological layer');
  console.log('\nTips:');
  console.log('   • Use /tp command to navigate to surface location');
  console.log('   • Surface may be large - explore the area');
  console.log('   • Look for patterns matching geological data');
  console.log('\n' + '='.repeat(60));
}

// Run the test
(async () => {
  // Verify configuration
  if (!BEDROCK_AGENT_ID || !BEDROCK_AGENT_ALIAS_ID) {
    console.error('❌ ERROR: Missing Bedrock agent configuration');
    console.error('Please set BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID in .env.local');
    process.exit(1);
  }

  const success = await testHorizonWorkflow();
  
  if (success) {
    displayMinecraftInstructions();
    console.log('\n✅ Test completed successfully!');
    console.log('\n⚠️  IMPORTANT: Manual verification required in Minecraft');
    console.log('   Follow the instructions above to verify the structure was built.');
    process.exit(0);
  } else {
    console.log('\n❌ Test failed - see errors above');
    process.exit(1);
  }
})();
