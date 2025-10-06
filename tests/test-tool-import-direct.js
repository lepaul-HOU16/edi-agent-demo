// Test direct import and execution of the comprehensive shale analysis tool

async function testToolImportDirect() {
  console.log('🧪 Testing direct import and execution of comprehensive shale analysis tool...');
  
  try {
    // Test 1: Import the tool
    console.log('📦 Step 1: Importing tool module...');
    const toolModule = await import('./amplify/functions/tools/comprehensiveShaleAnalysisTool.ts');
    console.log('✅ Import successful');
    
    // Test 2: Check tool structure
    console.log('\n📋 Step 2: Checking tool structure...');
    const tool = toolModule.comprehensiveShaleAnalysisTool;
    console.log('Tool exists:', !!tool);
    console.log('Tool name:', tool?.name);
    console.log('Tool has func:', typeof tool?.func);
    
    if (!tool || !tool.func) {
      console.error('❌ Tool structure is invalid');
      return;
    }
    
    // Test 3: Execute the tool directly
    console.log('\n🚀 Step 3: Executing tool directly...');
    const parameters = {
      analysisType: 'field_overview'
    };
    
    console.log('Parameters:', parameters);
    const result = await tool.func(parameters);
    console.log('✅ Tool execution completed');
    
    // Test 4: Analyze the result
    console.log('\n📋 Step 4: Analyzing tool result...');
    console.log('Result type:', typeof result);
    console.log('Result length:', result?.length || 0);
    
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        console.log('✅ Result is valid JSON');
        console.log('Parsed result structure:');
        console.log('  success:', parsed.success);
        console.log('  message:', !!parsed.message);
        console.log('  artifacts:', Array.isArray(parsed.artifacts));
        console.log('  artifacts length:', parsed.artifacts?.length || 0);
        
        if (parsed.artifacts && parsed.artifacts.length > 0) {
          console.log('\n🎯 ARTIFACTS FOUND IN TOOL RESULT!');
          parsed.artifacts.forEach((artifact, index) => {
            console.log(`\n📦 Artifact ${index + 1}:`);
            console.log('  Type:', typeof artifact);
            console.log('  Message Content Type:', artifact.messageContentType);
            console.log('  Analysis Type:', artifact.analysisType);
            console.log('  Has Executive Summary:', !!artifact.executiveSummary);
            console.log('  Keys:', Object.keys(artifact));
          });
          
          console.log('\n✅ SUCCESS: Tool is generating artifacts correctly!');
          console.log('🔍 This means the issue is in the agent processing, not the tool itself');
          return true;
        } else {
          console.log('\n❌ No artifacts in tool result');
          console.log('Full parsed result:', JSON.stringify(parsed, null, 2));
          return false;
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse tool result as JSON:', parseError.message);
        console.log('Raw result (first 500 chars):', result.substring(0, 500));
        return false;
      }
    } else {
      console.error('❌ Tool result is not a string');
      console.log('Result:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testToolImportDirect().then(success => {
  if (success) {
    console.log('\n🎉 CONCLUSION: The comprehensive shale analysis tool is working correctly!');
    console.log('🔍 The issue must be in the enhancedStrandsAgent or callMCPTool method');
  } else {
    console.log('\n❌ CONCLUSION: There is an issue with the tool itself');
  }
});
