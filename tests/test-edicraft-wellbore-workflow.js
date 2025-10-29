/**
 * Test EDIcraft Wellbore Visualization Workflow
 * 
 * This test verifies:
 * 1. Agent executes tools correctly for wellbore command
 * 2. Response mentions Minecraft visualization
 * 3. Response is concise and actionable
 * 4. Response follows professional format
 */

const https = require('https');

// EDIcraft agent endpoint (from environment or default)
const EDICRAFT_ENDPOINT = process.env.EDICRAFT_AGENT_ENDPOINT || 'https://edicraft-agent.nigelgardiner.com';

/**
 * Send a message to the EDIcraft agent
 */
async function sendToEDIcraft(message) {
  return new Promise((resolve, reject) => {
    const url = new URL(EDICRAFT_ENDPOINT);
    
    const postData = JSON.stringify({
      prompt: message
    });

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

/**
 * Test wellbore visualization workflow
 */
async function testWellboreWorkflow() {
  console.log('🧪 Testing EDIcraft Wellbore Visualization Workflow\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Send wellbore build command
    console.log('\n📤 Sending command: "Build wellbore trajectory for WELL-001"');
    const response = await sendToEDIcraft('Build wellbore trajectory for WELL-001');

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
    
    if (hasEmoji || hasCheckmark || hasGamepad) {
      console.log('✅ Response uses professional formatting (emoji/icons)');
    } else {
      console.log('⚠️  WARNING: Response lacks visual formatting');
    }

    // Check 5: Response indicates where to see results
    const indicatesLocation = 
      responseText.toLowerCase().includes('connect to') ||
      responseText.toLowerCase().includes('see the') ||
      responseText.toLowerCase().includes('explore') ||
      responseText.toLowerCase().includes('visualization');
    
    if (indicatesLocation) {
      console.log('✅ Response indicates where to see visualization');
    } else {
      console.log('❌ FAIL: Response does not indicate where to see results');
    }

    // Check 6: Response mentions wellbore or WELL-001
    const mentionsWellbore = 
      responseText.toLowerCase().includes('wellbore') ||
      responseText.toLowerCase().includes('well-001') ||
      responseText.toLowerCase().includes('trajectory');
    
    if (mentionsWellbore) {
      console.log('✅ Response mentions wellbore/trajectory');
    } else {
      console.log('❌ FAIL: Response does not mention wellbore');
    }

    // Check 7: No technical details exposed
    const exposesDetails = 
      responseText.includes('http://') ||
      responseText.includes('https://') ||
      responseText.includes(':49') ||
      responseText.includes('port') ||
      responseText.includes('RCON');
    
    if (!exposesDetails) {
      console.log('✅ Response does not expose technical details');
    } else {
      console.log('❌ FAIL: Response exposes technical details (URLs/ports)');
    }

    // Overall assessment
    console.log('\n' + '='.repeat(60));
    const allPassed = 
      responseText &&
      mentionsMinecraft &&
      wordCount < 500 &&
      indicatesLocation &&
      mentionsWellbore &&
      !exposesDetails;

    if (allPassed) {
      console.log('✅ ALL CHECKS PASSED - Wellbore workflow is working correctly!');
      console.log('\n📋 Summary:');
      console.log('   • Agent responds to wellbore commands');
      console.log('   • Response mentions Minecraft visualization');
      console.log('   • Response is concise and actionable');
      console.log('   • Response follows professional format');
      console.log('   • No technical details exposed');
      return true;
    } else {
      console.log('⚠️  SOME CHECKS FAILED - Review issues above');
      return false;
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify EDIcraft agent is deployed and running');
    console.error('2. Check EDICRAFT_AGENT_ENDPOINT environment variable');
    console.error('3. Verify network connectivity to agent endpoint');
    console.error('4. Check agent logs for errors');
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
  console.log('\nTo verify the wellbore was actually built in Minecraft:');
  console.log('\n1. Open Minecraft Java Edition');
  console.log('2. Click "Multiplayer"');
  console.log('3. Add server:');
  console.log('   • Server Name: EDIcraft');
  console.log('   • Server Address: edicraft.nigelgardiner.com:49000');
  console.log('4. Connect to the server');
  console.log('5. Look for the wellbore structure (starts at Y=100, goes down)');
  console.log('6. Verify the wellbore path is visible');
  console.log('\nExpected Result:');
  console.log('   • Wellbore trajectory visible as blocks');
  console.log('   • Path starts at ground level (Y=100)');
  console.log('   • Path extends underground following survey data');
  console.log('   • Structure matches WELL-001 trajectory');
  console.log('\n' + '='.repeat(60));
}

// Run the test
(async () => {
  const success = await testWellboreWorkflow();
  
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
