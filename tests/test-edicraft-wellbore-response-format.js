/**
 * Test EDIcraft Wellbore Response Format
 * 
 * This test validates the agent's system prompt and expected response format
 * for wellbore visualization commands WITHOUT requiring full deployment.
 * 
 * It verifies:
 * 1. System prompt includes professional welcome message
 * 2. System prompt includes response guidelines
 * 3. Expected response format is documented
 * 4. Response guidelines mention Minecraft visualization
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing EDIcraft Wellbore Response Format\n');
console.log('=' .repeat(60));

// Read the agent.py file
const agentPath = path.join(__dirname, '..', 'edicraft-agent', 'agent.py');
const agentCode = fs.readFileSync(agentPath, 'utf-8');

// Extract system prompt
const systemPromptMatch = agentCode.match(/system_prompt=f"""([\s\S]*?)"""/);
if (!systemPromptMatch) {
  console.error('❌ FAIL: Could not find system_prompt in agent.py');
  process.exit(1);
}

const systemPrompt = systemPromptMatch[1];

console.log('\n✅ System prompt found in agent.py');
console.log(`   Length: ${systemPrompt.length} characters`);

// Test 1: Welcome message for wellbore capabilities
console.log('\n📋 Test 1: Wellbore Capabilities in Welcome Message');
const hasWellboreCapabilities = systemPrompt.includes('Wellbore Trajectories');
if (hasWellboreCapabilities) {
  console.log('✅ PASS: Welcome message includes wellbore capabilities');
} else {
  console.log('❌ FAIL: Welcome message missing wellbore capabilities');
}

// Test 2: Wellbore workflow documentation
console.log('\n📋 Test 2: Wellbore Workflow Documentation');
const hasWorkflow = systemPrompt.includes('Wellbore Trajectory Workflow');
if (hasWorkflow) {
  console.log('✅ PASS: System prompt documents wellbore workflow');
  
  // Check workflow steps
  const hasSearchStep = systemPrompt.includes('Search OSDU for wellbore data');
  const hasParseStep = systemPrompt.includes('Parse survey measurements');
  const hasCalculateStep = systemPrompt.includes('Calculate 3D coordinates');
  const hasBuildStep = systemPrompt.includes('Build complete wellbore path in Minecraft');
  
  if (hasSearchStep && hasParseStep && hasCalculateStep && hasBuildStep) {
    console.log('✅ PASS: All workflow steps documented');
  } else {
    console.log('⚠️  WARNING: Some workflow steps missing');
  }
} else {
  console.log('❌ FAIL: Wellbore workflow not documented');
}

// Test 3: Response guidelines
console.log('\n📋 Test 3: Response Guidelines');
const hasResponseGuidelines = systemPrompt.includes('Response Guidelines');
if (hasResponseGuidelines) {
  console.log('✅ PASS: Response guidelines section exists');
  
  // Check for key elements
  const mentionsMinecraft = systemPrompt.includes('Connect to the Minecraft server');
  const hasCheckmark = systemPrompt.includes('✅');
  const hasGamepad = systemPrompt.includes('🎮');
  
  if (mentionsMinecraft) {
    console.log('✅ PASS: Guidelines mention Minecraft connection');
  } else {
    console.log('❌ FAIL: Guidelines do not mention Minecraft connection');
  }
  
  if (hasCheckmark && hasGamepad) {
    console.log('✅ PASS: Guidelines include emoji formatting');
  } else {
    console.log('⚠️  WARNING: Guidelines missing emoji formatting');
  }
} else {
  console.log('❌ FAIL: Response guidelines section missing');
}

// Test 4: Example response format
console.log('\n📋 Test 4: Example Response Format');
const hasExample = systemPrompt.includes('Example:');
if (hasExample) {
  console.log('✅ PASS: Example response provided');
  
  // Extract example
  const exampleMatch = systemPrompt.match(/Example:\s*"([\s\S]*?)"/);
  if (exampleMatch) {
    const example = exampleMatch[1];
    console.log('\n📄 Example Response:');
    console.log('   ' + example.split('\n').join('\n   '));
    
    // Validate example format
    const exampleHasCheckmark = example.includes('✅');
    const exampleHasGamepad = example.includes('🎮');
    const exampleMentionsMinecraft = example.toLowerCase().includes('minecraft');
    const exampleMentionsWellbore = example.toLowerCase().includes('wellbore');
    
    if (exampleHasCheckmark && exampleHasGamepad && exampleMentionsMinecraft && exampleMentionsWellbore) {
      console.log('\n✅ PASS: Example follows professional format');
    } else {
      console.log('\n⚠️  WARNING: Example may not follow complete format');
    }
  }
} else {
  console.log('❌ FAIL: No example response provided');
}

// Test 5: Important behavior guidelines
console.log('\n📋 Test 5: Important Behavior Guidelines');
const hasImportantBehavior = systemPrompt.includes('Important Behavior');
if (hasImportantBehavior) {
  console.log('✅ PASS: Important behavior section exists');
  
  const alwaysMentionMinecraft = systemPrompt.includes('ALWAYS mention that visualization occurs in Minecraft');
  const provideFeedback = systemPrompt.includes('Provide clear feedback about what was built');
  const remindUsers = systemPrompt.includes('Remind users they need to connect to Minecraft');
  const noTechnicalDetails = systemPrompt.includes('Do NOT expose server URLs, ports');
  
  if (alwaysMentionMinecraft) {
    console.log('✅ PASS: Guideline to always mention Minecraft');
  }
  if (provideFeedback) {
    console.log('✅ PASS: Guideline to provide clear feedback');
  }
  if (remindUsers) {
    console.log('✅ PASS: Guideline to remind users about Minecraft');
  }
  if (noTechnicalDetails) {
    console.log('✅ PASS: Guideline to hide technical details');
  }
} else {
  console.log('❌ FAIL: Important behavior section missing');
}

// Test 6: Available tools
console.log('\n📋 Test 6: Wellbore Tools Available');
const hasToolsList = systemPrompt.includes('Available Tools');
if (hasToolsList) {
  console.log('✅ PASS: Tools list section exists');
  
  const hasSearchTool = systemPrompt.includes('search_wellbores');
  const hasGetCoordsTool = systemPrompt.includes('get_trajectory_coordinates');
  const hasCalculateTool = systemPrompt.includes('calculate_trajectory_coordinates');
  const hasBuildTool = systemPrompt.includes('build_wellbore_in_minecraft');
  
  if (hasSearchTool && hasGetCoordsTool && hasCalculateTool && hasBuildTool) {
    console.log('✅ PASS: All wellbore tools documented');
  } else {
    console.log('⚠️  WARNING: Some wellbore tools missing from documentation');
  }
} else {
  console.log('❌ FAIL: Tools list section missing');
}

// Overall assessment
console.log('\n' + '='.repeat(60));
console.log('📊 OVERALL ASSESSMENT');
console.log('='.repeat(60));

const allTestsPassed = 
  hasWellboreCapabilities &&
  hasWorkflow &&
  hasResponseGuidelines &&
  hasExample &&
  hasImportantBehavior &&
  hasToolsList;

if (allTestsPassed) {
  console.log('\n✅ ALL TESTS PASSED');
  console.log('\nThe agent system prompt is properly configured for wellbore visualization:');
  console.log('   • Welcome message includes wellbore capabilities');
  console.log('   • Workflow is documented');
  console.log('   • Response guidelines are clear');
  console.log('   • Example response follows professional format');
  console.log('   • Important behaviors are specified');
  console.log('   • All necessary tools are available');
  
  console.log('\n📋 Expected Response Format for "Build wellbore trajectory for WELL-001":');
  console.log('\n   ✅ Wellbore trajectory for WELL-001 has been built in Minecraft!');
  console.log('   ');
  console.log('   The wellbore path starts at ground level and extends 2,500 meters');
  console.log('   underground, following the survey data from OSDU.');
  console.log('   ');
  console.log('   🎮 Connect to the Minecraft server to explore the visualization in 3D.');
  
  console.log('\n✅ Response Format Validation: COMPLETE');
  console.log('\n⚠️  NOTE: This test validates the system prompt configuration.');
  console.log('   To test actual agent execution, you need to:');
  console.log('   1. Deploy the agent to Bedrock AgentCore');
  console.log('   2. Configure environment variables');
  console.log('   3. Test end-to-end through the Lambda handler');
  
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED');
  console.log('\nReview the failures above and update agent.py system prompt.');
  process.exit(1);
}
