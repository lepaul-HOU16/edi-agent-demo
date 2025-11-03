/**
 * Test Project List Handler
 * 
 * Tests the project listing and details functionality
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({});

// Get orchestrator function name from environment or discover it
let ORCHESTRATOR_FUNCTION_NAME = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;

// If not set, try to discover it
if (!ORCHESTRATOR_FUNCTION_NAME) {
  const { execSync } = require('child_process');
  try {
    const result = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text',
      { encoding: 'utf-8' }
    );
    ORCHESTRATOR_FUNCTION_NAME = result.trim();
    if (!ORCHESTRATOR_FUNCTION_NAME) {
      throw new Error('No orchestrator function found');
    }
  } catch (error) {
    console.error('Failed to discover orchestrator function:', error.message);
    ORCHESTRATOR_FUNCTION_NAME = 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE';
  }
}

/**
 * Invoke orchestrator Lambda
 */
async function invokeOrchestrator(query, sessionId = 'test-session-123') {
  console.log(`\n🔍 Testing query: "${query}"`);
  console.log(`📋 Session ID: ${sessionId}`);
  
  const payload = {
    query,
    sessionId,
    userId: 'test-user-123',
    context: {}
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: ORCHESTRATOR_FUNCTION_NAME,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('\n✅ Response received:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Message length: ${result.message?.length || 0} characters`);
    console.log(`   Artifacts: ${result.artifacts?.length || 0}`);
    console.log(`   Tools used: ${result.metadata?.toolsUsed?.join(', ') || 'none'}`);
    
    if (result.metadata?.projectCount !== undefined) {
      console.log(`   Project count: ${result.metadata.projectCount}`);
    }
    
    if (result.metadata?.activeProject) {
      console.log(`   Active project: ${result.metadata.activeProject}`);
    }
    
    if (result.metadata?.projectName) {
      console.log(`   Project name: ${result.metadata.projectName}`);
    }
    
    // Show first 500 characters of message
    if (result.message) {
      console.log('\n📝 Message preview:');
      console.log(result.message.substring(0, 500));
      if (result.message.length > 500) {
        console.log(`   ... (${result.message.length - 500} more characters)`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('\n❌ Error invoking orchestrator:', error.message);
    if (error.$metadata) {
      console.error('   AWS Error:', error.$metadata);
    }
    throw error;
  }
}

/**
 * Test project list query
 */
async function testProjectListQuery() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 1: List My Projects Query');
  console.log('═══════════════════════════════════════════════════════════');
  
  const queries = [
    'list my renewable projects',
    'show my projects',
    'what projects do I have',
    'view my renewable projects'
  ];
  
  for (const query of queries) {
    try {
      const result = await invokeOrchestrator(query);
      
      // Validate response
      if (!result.success) {
        console.warn(`⚠️  Query failed: ${query}`);
        console.warn(`   Message: ${result.message}`);
      } else {
        console.log(`✅ Query succeeded: ${query}`);
        
        // Check if it was recognized as a project list query
        if (result.metadata?.toolsUsed?.includes('project_list')) {
          console.log('   ✓ Correctly identified as project list query');
        } else {
          console.warn('   ⚠️  Not identified as project list query');
          console.warn(`   Tools used: ${result.metadata?.toolsUsed?.join(', ')}`);
        }
      }
    } catch (error) {
      console.error(`❌ Test failed for query: ${query}`);
      console.error(`   Error: ${error.message}`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Test project details query
 */
async function testProjectDetailsQuery() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 2: Show Project Details Query');
  console.log('═══════════════════════════════════════════════════════════');
  
  // First, list projects to get a project name
  console.log('\n📋 First, listing projects to find a project name...');
  const listResult = await invokeOrchestrator('list my renewable projects');
  
  if (!listResult.success || !listResult.metadata?.projectCount || listResult.metadata.projectCount === 0) {
    console.log('⚠️  No projects found. Skipping project details test.');
    console.log('   Create a project first by running terrain analysis.');
    return;
  }
  
  // Extract project name from message (this is a simple approach)
  // In a real test, we'd parse the structured data
  const messageLines = listResult.message.split('\n');
  let testProjectName = null;
  
  for (const line of messageLines) {
    // Look for project names (they start with → or spaces followed by **)
    const match = line.match(/[→\s]+\*\*([a-z0-9-]+)\*\*/);
    if (match && match[1]) {
      testProjectName = match[1];
      break;
    }
  }
  
  if (!testProjectName) {
    console.log('⚠️  Could not extract project name from list. Using fallback.');
    testProjectName = 'test-project';
  }
  
  console.log(`\n🎯 Testing with project name: ${testProjectName}`);
  
  const queries = [
    `show project ${testProjectName}`,
    `details for project ${testProjectName}`,
    `view project ${testProjectName}`,
    `status of project ${testProjectName}`
  ];
  
  for (const query of queries) {
    try {
      const result = await invokeOrchestrator(query);
      
      // Validate response
      if (!result.success) {
        console.warn(`⚠️  Query failed: ${query}`);
        console.warn(`   Message: ${result.message}`);
      } else {
        console.log(`✅ Query succeeded: ${query}`);
        
        // Check if it was recognized as a project details query
        if (result.metadata?.toolsUsed?.includes('project_details')) {
          console.log('   ✓ Correctly identified as project details query');
        } else {
          console.warn('   ⚠️  Not identified as project details query');
          console.warn(`   Tools used: ${result.metadata?.toolsUsed?.join(', ')}`);
        }
        
        // Check if project name matches
        if (result.metadata?.projectName === testProjectName) {
          console.log(`   ✓ Correct project name: ${testProjectName}`);
        } else {
          console.warn(`   ⚠️  Project name mismatch: expected ${testProjectName}, got ${result.metadata?.projectName}`);
        }
      }
    } catch (error) {
      console.error(`❌ Test failed for query: ${query}`);
      console.error(`   Error: ${error.message}`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Test that non-project-list queries still work
 */
async function testNonProjectListQueries() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('TEST 3: Non-Project-List Queries (Regression Test)');
  console.log('═══════════════════════════════════════════════════════════');
  
  const queries = [
    'analyze terrain at 35.067482, -101.395466',
    'optimize layout for my project',
    'run wake simulation'
  ];
  
  for (const query of queries) {
    try {
      const result = await invokeOrchestrator(query);
      
      // These should NOT be identified as project list queries
      if (result.metadata?.toolsUsed?.includes('project_list') || 
          result.metadata?.toolsUsed?.includes('project_details')) {
        console.error(`❌ Query incorrectly identified as project list: ${query}`);
        console.error(`   Tools used: ${result.metadata?.toolsUsed?.join(', ')}`);
      } else {
        console.log(`✅ Query correctly NOT identified as project list: ${query}`);
        console.log(`   Tools used: ${result.metadata?.toolsUsed?.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Test failed for query: ${query}`);
      console.error(`   Error: ${error.message}`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 PROJECT LIST HANDLER TESTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Orchestrator Function: ${ORCHESTRATOR_FUNCTION_NAME}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Test 1: Project list queries
    await testProjectListQuery();
    
    // Test 2: Project details queries
    await testProjectDetailsQuery();
    
    // Test 3: Regression test - non-project-list queries
    await testNonProjectListQueries();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════');
    console.error('❌ TEST SUITE FAILED');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
