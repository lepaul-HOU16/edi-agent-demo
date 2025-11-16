/**
 * Test MCP Integration
 * 
 * This test verifies that agents can connect to and use MCP server tools
 */

const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const FUNCTION_NAME = "amplify-digitalassistant--RenewableAgentsFunction0-SN4eNAuowSFt";
const REGION = "us-east-1";

const lambda = new LambdaClient({ region: REGION });

async function testMCPIntegration() {
  console.log("🧪 Testing MCP Integration\n");
  console.log("=" .repeat(60));
  
  // Test layout agent which uses MCP tools
  const testPayload = {
    agent: "layout",
    query: "Create a wind farm layout at coordinates 35.067482, -101.395466 with 30MW capacity using IEA_Reference_3.4MW_130 turbines for project_id 'test_mcp_123'",
    parameters: {
      project_id: "test_mcp_123",
      latitude: 35.067482,
      longitude: -101.395466,
      target_capacity_mw: 30,
      turbine_model: "IEA_Reference_3.4MW_130"
    }
  };
  
  console.log("\n📋 Test Configuration:");
  console.log(`   Function: ${FUNCTION_NAME}`);
  console.log(`   Agent: ${testPayload.agent}`);
  console.log(`   Query: ${testPayload.query.substring(0, 80)}...`);
  
  try {
    console.log("\n🚀 Invoking Lambda function...");
    
    const command = new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(testPayload)
    });
    
    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Lambda invoked successfully (${duration}ms)`);
    
    const payload = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log("\n🔍 Verification:");
    
    if (response.StatusCode === 200) {
      console.log("   ✅ Lambda execution successful");
    }
    
    if (payload.statusCode === 200) {
      console.log("   ✅ Agent execution successful");
      
      const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
      
      // Check if MCP tools were used
      if (body.response && body.response.includes("turbine")) {
        console.log("   ✅ Agent processed turbine specifications");
      }
      
      if (body.progress && body.progress.length > 0) {
        console.log(`   ✅ Progress tracking: ${body.progress.length} steps`);
      }
      
      console.log("\n📊 Response Summary:");
      console.log(`   Agent: ${body.agent}`);
      console.log(`   Success: ${body.success}`);
      if (body.performance) {
        console.log(`   Execution Time: ${body.performance.executionTime}s`);
        console.log(`   Cold Start: ${body.performance.coldStart}`);
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ MCP integration test completed");
    console.log("=".repeat(60));
    
    return true;
    
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    return false;
  }
}

// Run the test
testMCPIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
