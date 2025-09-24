#!/usr/bin/env node

/**
 * Test artifacts flow locally without authentication
 * Tests the comprehensive shale analysis tool and agent directly
 */

async function testArtifactsFlow() {
  console.log('🧪 Testing Artifacts Flow Locally');
  console.log('==================================');

  try {
    // Test 1: Direct tool import and execution
    console.log('📦 Step 1: Testing direct tool import...');
    
    const { comprehensiveShaleAnalysisTool } = await import('./amplify/functions/tools/comprehensiveShaleAnalysisTool.ts');
    
    console.log('✅ Tool imported successfully');
    console.log('🔍 Tool name:', comprehensiveShaleAnalysisTool.name);
    console.log('🔍 Tool function type:', typeof comprehensiveShaleAnalysisTool.func);

    // Test 2: Execute tool with minimal parameters
    console.log('\n📋 Step 2: Testing direct tool execution...');
    
    const toolParameters = {
      analysisType: 'field_overview',
      generatePlots: false // Disable plots to avoid S3 dependencies
    };
    
    console.log('🔄 Calling tool with parameters:', toolParameters);
    
    const toolResult = await comprehensiveShaleAnalysisTool.func(toolParameters);
    
    console.log('📤 Tool execution completed');
    console.log('📤 Raw result type:', typeof toolResult);
    
    // Parse if string
    let parsedResult;
    if (typeof toolResult === 'string') {
      try {
        parsedResult = JSON.parse(toolResult);
        console.log('✅ Successfully parsed JSON result');
      } catch (e) {
        console.log('❌ Failed to parse result as JSON:', e.message);
        parsedResult = { error: 'Failed to parse result', rawResult: toolResult };
      }
    } else {
      parsedResult = toolResult;
    }
    
    // Test 3: Validate response structure
    console.log('\n🔍 Step 3: Validating response structure...');
    
    console.log('Response structure:');
    console.log('- success:', parsedResult.success);
    console.log('- message type:', typeof parsedResult.message);
    console.log('- message length:', parsedResult.message?.length || 0);
    console.log('- artifacts type:', typeof parsedResult.artifacts);
    console.log('- artifacts is array:', Array.isArray(parsedResult.artifacts));
    console.log('- artifacts length:', parsedResult.artifacts?.length || 0);
    
    if (parsedResult.success && parsedResult.message && Array.isArray(parsedResult.artifacts)) {
      console.log('✅ Response structure validation PASSED');
      
      if (parsedResult.artifacts.length > 0) {
        console.log('\n📋 Step 4: Examining artifacts...');
        parsedResult.artifacts.forEach((artifact, index) => {
          console.log(`Artifact ${index + 1}:`, typeof artifact);
          if (typeof artifact === 'object' && artifact !== null) {
            if (artifact.messageContentType) {
              console.log(`  - Content Type: ${artifact.messageContentType}`);
            }
            if (artifact.analysisType) {
              console.log(`  - Analysis Type: ${artifact.analysisType}`);
            }
            if (artifact.executiveSummary) {
              console.log(`  - Has Executive Summary: Yes`);
              console.log(`  - Summary Title: ${artifact.executiveSummary.title || 'N/A'}`);
            }
          }
        });
        console.log('✅ Artifacts examination completed');
      } else {
        console.log('⚠️  No artifacts found in response');
      }
    } else {
      console.log('❌ Response structure validation FAILED');
      console.log('Missing or invalid:');
      if (!parsedResult.success) console.log('  - success field');
      if (!parsedResult.message) console.log('  - message field');
      if (!Array.isArray(parsedResult.artifacts)) console.log('  - artifacts array');
    }
    
    // Test 4: Test Enhanced Strands Agent workflow
    console.log('\n🤖 Step 5: Testing Enhanced Strands Agent workflow...');
    
    const { EnhancedStrandsAgent } = await import('./amplify/functions/agents/enhancedStrandsAgent.ts');
    
    const agent = new EnhancedStrandsAgent();
    const testMessage = 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.';
    
    console.log('🔄 Testing agent message processing...');
    console.log('📝 Test message:', testMessage.substring(0, 100) + '...');
    
    const agentResult = await agent.processMessage(testMessage);
    
    console.log('📤 Agent execution completed');
    console.log('📋 Agent Response Structure:');
    console.log('- success:', agentResult.success);
    console.log('- message type:', typeof agentResult.message);
    console.log('- message length:', agentResult.message?.length || 0);
    console.log('- artifacts type:', typeof agentResult.artifacts);
    console.log('- artifacts is array:', Array.isArray(agentResult.artifacts));
    console.log('- artifacts length:', agentResult.artifacts?.length || 0);
    
    if (agentResult.success && agentResult.message && Array.isArray(agentResult.artifacts) && agentResult.artifacts.length > 0) {
      console.log('✅ AGENT ARTIFACTS FLOW VALIDATION PASSED');
      console.log('🎉 The fix successfully preserves artifacts through the agent workflow!');
    } else {
      console.log('❌ AGENT ARTIFACTS FLOW VALIDATION FAILED');
      console.log('The agent is not properly preserving artifacts from tools');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testArtifactsFlow()
  .then(() => {
    console.log('\n🏁 Artifacts flow test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  });
