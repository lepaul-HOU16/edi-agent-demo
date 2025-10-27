/**
 * Test that explicit "analyze terrain" queries bypass deduplication
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function testTerrainDeduplicationBypass() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST: Terrain Analysis Deduplication Bypass');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Find orchestrator Lambda
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const listResponse = await lambdaClient.send(new ListFunctionsCommand({}));
  const orchestratorFunction = listResponse.Functions?.find(fn => 
    fn.FunctionName?.toLowerCase().includes('orchestrator')
  );
  
  if (!orchestratorFunction) {
    console.log('❌ Orchestrator Lambda not found');
    return;
  }
  
  console.log(`✅ Found orchestrator: ${orchestratorFunction.FunctionName}\n`);
  
  // Test 1: Explicit "analyze terrain" query (should bypass deduplication)
  console.log('📋 Test 1: Explicit "analyze terrain" query');
  console.log('   Query: "analyze terrain at 32.7767, -96.797"');
  console.log('   Expected: Should create NEW terrain analysis, NOT show duplicate prompt\n');
  
  const payload1 = {
    query: 'analyze terrain at 32.7767, -96.797',
    context: {},
    sessionId: `test-${Date.now()}`
  };
  
  try {
    const command1 = new InvokeCommand({
      FunctionName: orchestratorFunction.FunctionName,
      Payload: JSON.stringify(payload1)
    });
    
    const response1 = await lambdaClient.send(command1);
    const result1 = JSON.parse(new TextDecoder().decode(response1.Payload));
    
    console.log('📊 Response:');
    console.log(`   Success: ${result1.success}`);
    console.log(`   Message preview: ${result1.message?.substring(0, 150)}...`);
    console.log(`   Artifacts: ${result1.artifacts?.length || 0}`);
    
    // Check if it's showing duplicate prompt
    const isDuplicatePrompt = result1.message?.includes('found') && 
                              result1.message?.includes('projects that match');
    
    if (isDuplicatePrompt) {
      console.log('\n❌ FAIL: Query triggered duplicate detection (should bypass)');
      console.log('   This means the fix did NOT work');
    } else if (result1.artifacts && result1.artifacts.length > 0) {
      console.log('\n✅ PASS: Query created new terrain analysis');
      console.log('   Duplicate detection was bypassed correctly');
    } else {
      console.log('\n⚠️  UNCLEAR: No artifacts but also no duplicate prompt');
      console.log('   Check the full message above');
    }
    
  } catch (error) {
    console.error('❌ Error testing:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  // Test 2: Ambiguous query (should still check for duplicates)
  console.log('\n📋 Test 2: Ambiguous query without explicit "analyze"');
  console.log('   Query: "32.7767, -96.797"');
  console.log('   Expected: SHOULD show duplicate prompt (if duplicates exist)\n');
  
  const payload2 = {
    query: '32.7767, -96.797',
    context: {},
    sessionId: `test-${Date.now()}`
  };
  
  try {
    const command2 = new InvokeCommand({
      FunctionName: orchestratorFunction.FunctionName,
      Payload: JSON.stringify(payload2)
    });
    
    const response2 = await lambdaClient.send(command2);
    const result2 = JSON.parse(new TextDecoder().decode(response2.Payload));
    
    console.log('📊 Response:');
    console.log(`   Success: ${result2.success}`);
    console.log(`   Message preview: ${result2.message?.substring(0, 150)}...`);
    
    const isDuplicatePrompt = result2.message?.includes('found') && 
                              result2.message?.includes('projects that match');
    
    if (isDuplicatePrompt) {
      console.log('\n✅ PASS: Ambiguous query correctly triggered duplicate detection');
    } else {
      console.log('\n⚠️  Note: No duplicate prompt (maybe no duplicates exist at these coords)');
    }
    
  } catch (error) {
    console.error('❌ Error testing:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Test complete!');
  console.log('═══════════════════════════════════════════════════════════');
}

testTerrainDeduplicationBypass().catch(console.error);
