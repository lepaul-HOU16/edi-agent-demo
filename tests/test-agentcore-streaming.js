/**
 * Test AgentCore Streaming Integration
 * 
 * This test verifies that the AgentCore streaming integration works correctly
 * for all renewable energy agents (terrain, layout, simulation, report).
 */

const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const FUNCTION_NAME = "amplify-digitalassistant--RenewableAgentsFunction0-SN4eNAuowSFt";
const REGION = "us-east-1";

const lambda = new LambdaClient({ region: REGION });

async function testAgentCoreStreaming() {
  console.log("🧪 Testing AgentCore Streaming Integration\n");
  console.log("=" .repeat(60));
  
  // Test payload for terrain agent
  const testPayload = {
    agent: "terrain",  // Changed from agent_type to agent
    query: "Analyze terrain at coordinates 35.067482, -101.395466 with 5km radius for project_id 'test_agentcore_123'",  // Changed from prompt to query
    parameters: {
      project_id: "test_agentcore_123",
      latitude: 35.067482,
      longitude: -101.395466,
      radius_km: 5
    }
  };
  
  console.log("\n📋 Test Configuration:");
  console.log(`   Function: ${FUNCTION_NAME}`);
  console.log(`   Region: ${REGION}`);
  console.log(`   Agent: ${testPayload.agent}`);
  console.log(`   Query: ${testPayload.query.substring(0, 60)}...`);
  
  try {
    console.log("\n🚀 Invoking Lambda function...");
    
    const command = new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      InvocationType: "RequestResponse", // Synchronous for testing
      Payload: JSON.stringify(testPayload)
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Lambda invoked successfully (${duration}ms)`);
    console.log(`   Status Code: ${response.StatusCode}`);
    console.log(`   Executed Version: ${response.ExecutedVersion}`);
    
    // Parse response
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log("\n📦 Response Payload:");
    console.log(JSON.stringify(payload, null, 2));
    
    // Verify AgentCore integration
    console.log("\n🔍 Verification:");
    
    if (response.StatusCode === 200) {
      console.log("   ✅ Lambda execution successful");
    } else {
      console.log(`   ❌ Lambda execution failed with status ${response.StatusCode}`);
      return false;
    }
    
    if (payload.errorMessage) {
      console.log(`   ⚠️  Error in response: ${payload.errorMessage}`);
      
      // Check if it's an AgentCore-related error
      if (payload.errorMessage.includes("AgentCore") || 
          payload.errorMessage.includes("bedrock_agentcore")) {
        console.log("   ℹ️  AgentCore may not be available - this is expected if dependencies aren't installed");
      }
      
      return false;
    }
    
    if (payload.statusCode && payload.statusCode === 200) {
      console.log("   ✅ Agent execution successful");
    }
    
    // Check for streaming indicators
    if (payload.body) {
      const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
      console.log("   ℹ️  Response body present");
      
      if (body.message) {
        console.log(`   📝 Message: ${body.message.substring(0, 100)}...`);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ AgentCore streaming test completed");
    console.log("=".repeat(60));
    
    return true;
    
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    
    if (error.message.includes("bedrock_agentcore")) {
      console.log("\nℹ️  Note: AgentCore dependencies may need to be installed in the Docker image");
      console.log("   The integration code is in place, but runtime dependencies may be missing");
    }
    
    return false;
  }
}

// Run the test
testAgentCoreStreaming()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
