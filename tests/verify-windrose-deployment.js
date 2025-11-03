/**
 * Verify Wind Rose Deployment
 * 
 * Checks if all required Lambda functions are deployed and configured
 */

const { LambdaClient, ListFunctionsCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

async function checkLambdaExists(functionNamePattern) {
  try {
    const command = new ListFunctionsCommand({});
    const response = await lambdaClient.send(command);
    
    const matchingFunctions = response.Functions.filter(f => 
      f.FunctionName.includes(functionNamePattern)
    );
    
    return matchingFunctions;
  } catch (error) {
    console.error(`Error checking Lambda: ${error.message}`);
    return [];
  }
}

async function checkEnvironmentVariables(functionName) {
  try {
    const command = new GetFunctionCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(command);
    return response.Configuration.Environment?.Variables || {};
  } catch (error) {
    console.error(`Error getting environment variables: ${error.message}`);
    return {};
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 WIND ROSE DEPLOYMENT VERIFICATION');
  console.log('='.repeat(60));
  
  // Check orchestrator
  console.log('\n📡 Checking Renewable Orchestrator...');
  const orchestrators = await checkLambdaExists('renewableOrchestrator');
  
  if (orchestrators.length > 0) {
    console.log(`✅ Found ${orchestrators.length} orchestrator(s):`);
    orchestrators.forEach(f => {
      console.log(`   - ${f.FunctionName}`);
      console.log(`     Runtime: ${f.Runtime}`);
      console.log(`     Memory: ${f.MemorySize}MB`);
      console.log(`     Timeout: ${f.Timeout}s`);
    });
    
    // Check environment variables
    const envVars = await checkEnvironmentVariables(orchestrators[0].FunctionName);
    console.log('\n   Environment Variables:');
    
    const requiredVars = [
      'RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME',
      'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
      'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
    ];
    
    requiredVars.forEach(varName => {
      if (envVars[varName]) {
        console.log(`   ✅ ${varName}: ${envVars[varName]}`);
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
      }
    });
  } else {
    console.log('❌ Orchestrator not found');
  }
  
  // Check windrose tool Lambda
  console.log('\n🌬️  Checking Wind Rose Tool Lambda...');
  const windroseLambdas = await checkLambdaExists('windrose');
  
  if (windroseLambdas.length > 0) {
    console.log(`✅ Found ${windroseLambdas.length} windrose Lambda(s):`);
    windroseLambdas.forEach(f => {
      console.log(`   - ${f.FunctionName}`);
      console.log(`     Runtime: ${f.Runtime}`);
      console.log(`     Memory: ${f.MemorySize}MB`);
      console.log(`     Timeout: ${f.Timeout}s`);
    });
  } else {
    console.log('❌ Wind Rose Lambda not found');
  }
  
  // Check terrain tool Lambda
  console.log('\n🗺️  Checking Terrain Tool Lambda...');
  const terrainLambdas = await checkLambdaExists('terrain');
  
  if (terrainLambdas.length > 0) {
    console.log(`✅ Found ${terrainLambdas.length} terrain Lambda(s):`);
    terrainLambdas.forEach(f => {
      console.log(`   - ${f.FunctionName}`);
    });
  } else {
    console.log('⚠️  Terrain Lambda not found (optional for wind rose test)');
  }
  
  // Check layout tool Lambda
  console.log('\n📐 Checking Layout Tool Lambda...');
  const layoutLambdas = await checkLambdaExists('layout');
  
  if (layoutLambdas.length > 0) {
    console.log(`✅ Found ${layoutLambdas.length} layout Lambda(s):`);
    layoutLambdas.forEach(f => {
      console.log(`   - ${f.FunctionName}`);
    });
  } else {
    console.log('⚠️  Layout Lambda not found (optional for wind rose test)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT STATUS SUMMARY');
  console.log('='.repeat(60));
  
  const deploymentStatus = {
    'Orchestrator Deployed': orchestrators.length > 0,
    'Wind Rose Lambda Deployed': windroseLambdas.length > 0,
    'Orchestrator Has Windrose Env Var': orchestrators.length > 0 && 
      (await checkEnvironmentVariables(orchestrators[0].FunctionName)).RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME !== undefined
  };
  
  Object.entries(deploymentStatus).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
  
  const readyForTesting = Object.values(deploymentStatus).every(v => v);
  
  if (readyForTesting) {
    console.log('\n🎉 READY FOR TESTING!');
    console.log('\nYou can now test the wind rose flow with:');
    console.log('export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=' + orchestrators[0].FunctionName);
    console.log('node tests/test-windrose-complete-flow.js');
  } else {
    console.log('\n⚠️  DEPLOYMENT INCOMPLETE');
    console.log('\nTo deploy, run:');
    console.log('npx ampx sandbox');
  }
}

main().catch(console.error);
