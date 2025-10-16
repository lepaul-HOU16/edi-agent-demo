/**
 * Test equipment status query routing and response
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testEquipmentStatusQuery() {
  console.log('🧪 Testing Equipment Status Query Fix\n');
  
  const router = new AgentRouter();
  
  // Test query
  const query = 'show me equipment status for well001';
  console.log('📝 Query:', query);
  console.log('');
  
  try {
    const result = await router.routeQuery(query);
    
    console.log('✅ Result received');
    console.log('Agent used:', result.agentUsed);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Artifacts:', result.artifacts?.length || 0);
    
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('\n📊 Artifact Details:');
      result.artifacts.forEach((artifact, index) => {
        console.log(`\nArtifact ${index + 1}:`);
        console.log('  Type:', artifact.messageContentType);
        console.log('  Title:', artifact.title);
        console.log('  Equipment ID:', artifact.equipmentHealth?.equipmentId);
        console.log('  Equipment Name:', artifact.equipmentHealth?.equipmentName);
        console.log('  Health Score:', artifact.equipmentHealth?.healthScore);
        console.log('  Status:', artifact.equipmentHealth?.operationalStatus);
        console.log('  Metrics:', artifact.equipmentHealth?.metrics);
        console.log('  Alerts:', artifact.equipmentHealth?.alerts?.length || 0);
        console.log('  Recommendations:', artifact.equipmentHealth?.recommendations?.length || 0);
      });
    }
    
    if (result.thoughtSteps && result.thoughtSteps.length > 0) {
      console.log('\n💭 Thought Steps:');
      result.thoughtSteps.forEach((step, index) => {
        console.log(`\nStep ${index + 1}:`);
        console.log('  Title:', step.title);
        console.log('  Summary:', step.summary);
        console.log('  Status:', step.status);
      });
    }
    
    // Validation
    console.log('\n🔍 Validation:');
    const checks = {
      'Routes to maintenance agent': result.agentUsed === 'maintenance',
      'Returns success': result.success === true,
      'Has artifacts': result.artifacts && result.artifacts.length > 0,
      'Artifact is equipment_health': result.artifacts?.[0]?.messageContentType === 'equipment_health',
      'Has equipmentHealth data': result.artifacts?.[0]?.equipmentHealth?.equipmentId === 'WELL-001',
      'Has health score': typeof result.artifacts?.[0]?.equipmentHealth?.healthScore === 'number',
      'Has metrics': result.artifacts?.[0]?.equipmentHealth?.metrics !== undefined,
      'Has thought steps': result.thoughtSteps && result.thoughtSteps.length > 0
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
      if (!passed) allPassed = false;
    }
    
    if (allPassed) {
      console.log('\n🎉 All checks passed!');
    } else {
      console.log('\n⚠️ Some checks failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}

// Run test
testEquipmentStatusQuery().catch(console.error);
