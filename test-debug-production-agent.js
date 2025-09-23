/**
 * Quick diagnostic test to see what's actually happening in production
 */

const axios = require('axios');

const GRAPHQL_ENDPOINT = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';

async function testProductionAgent() {
  console.log('🔍 === PRODUCTION AGENT DIAGNOSTIC ===');
  
  const mutation = `
    mutation SendChatMessage($input: SendChatMessageInput!) {
      sendChatMessage(input: $input) {
        id
        role
        content
        artifacts
        responseComplete
      }
    }
  `;
  
  // Test prompt #1 (well data discovery)
  const testPrompt = 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.';
  
  try {
    console.log('📝 Testing production agent with prompt #1...');
    console.log('💬 Prompt preview:', testPrompt.substring(0, 100) + '...');
    
    const response = await axios.post(GRAPHQL_ENDPOINT, {
      query: mutation,
      variables: {
        input: {
          chatSessionId: `debug-test-${Date.now()}`,
          content: testPrompt,
          role: 'user'
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result = response.data.data?.sendChatMessage;
    
    if (!result) {
      console.log('❌ No response from production agent');
      return;
    }
    
    const content = result.content || '';
    const artifacts = result.artifacts || [];
    
    console.log('📄 Response Length:', content.length);
    console.log('🎯 Artifact Count:', artifacts.length);
    console.log('📝 Response Preview:', content.substring(0, 300) + '...');
    
    // Check for the generic fallback response
    if (content.includes("I'd be happy to help you with your analysis!")) {
      console.log('❌ ISSUE: Still getting generic fallback response');
      console.log('💡 This means intent detection is not working');
      console.log('🔧 Possible causes:');
      console.log('  1. Lambda not deployed with new code');
      console.log('  2. Intent patterns not matching');
      console.log('  3. Agent routing to wrong handler');
    } else {
      console.log('✅ No generic fallback - intent detection may be working');
    }
    
    // Check artifacts
    if (artifacts.length === 0) {
      console.log('❌ ISSUE: No artifacts returned');
      console.log('💡 This means MCP tools are not generating artifacts');
      console.log('🔧 Possible causes:');
      console.log('  1. MCP tools not found or failing');
      console.log('  2. Tool import issues in Lambda');
      console.log('  3. S3 access problems');
    } else {
      console.log('✅ Artifacts found:', artifacts.length);
      artifacts.forEach((artifact, i) => {
        console.log(`📦 Artifact ${i + 1}: ${artifact?.messageContentType || 'UNKNOWN TYPE'}`);
      });
    }
    
    // Check for specific keywords that indicate intent routing
    const intentKeywords = {
      'well_data_discovery': ['Dataset Analysis Summary', 'Total Wells Analyzed', 'Log Curve Inventory'],
      'multi_well_correlation': ['Multi-well correlation', 'geological correlation'],
      'shale_analysis_workflow': ['shale analysis', 'Larionov method'],
      'porosity_analysis_workflow': ['porosity analysis', 'density-neutron'],
      'calculate_porosity': ['porosity calculation', 'professional methodology']
    };
    
    let detectedIntent = 'unknown';
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()))) {
        detectedIntent = intent;
        break;
      }
    }
    
    console.log('🎯 Detected Intent from Response:', detectedIntent);
    
    if (detectedIntent === 'well_data_discovery') {
      console.log('✅ Intent detection working correctly');
    } else {
      console.log('❌ Intent detection NOT working - expected well_data_discovery');
    }
    
    // Final diagnosis
    console.log('\n🔍 === DIAGNOSIS ===');
    if (content.includes("I'd be happy to help you with your analysis!")) {
      console.log('❌ PRIMARY ISSUE: Intent detection completely broken');
      console.log('💡 SOLUTION: Need to deploy enhanced agent code');
    } else if (artifacts.length === 0) {
      console.log('❌ PRIMARY ISSUE: MCP tools not generating artifacts');
      console.log('💡 SOLUTION: Fix MCP tool deployment or S3 access');
    } else if (detectedIntent !== 'well_data_discovery') {
      console.log('❌ PRIMARY ISSUE: Wrong intent routing');
      console.log('💡 SOLUTION: Fix intent patterns or handler routing');
    } else {
      console.log('✅ Agent appears to be working - may need artifact validation');
    }
    
  } catch (error) {
    console.error('💥 ERROR:', error.message);
    console.log('🔧 Possible causes:');
    console.log('  1. GraphQL endpoint issues');
    console.log('  2. Lambda function errors');
    console.log('  3. Network connectivity problems');
  }
}

testProductionAgent().catch(console.error);
