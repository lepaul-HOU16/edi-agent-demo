/**
 * Integration test for equipment status query
 * Tests the complete flow from query to artifact structure
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testIntegration() {
  console.log('🧪 Equipment Status Integration Test\n');
  console.log('='.repeat(80));
  
  const router = new AgentRouter();
  
  const testCases = [
    {
      query: 'show me equipment status for well001',
      expectedEquipmentId: 'WELL-001',
      expectedName: 'Production Well 001'
    },
    {
      query: 'equipment status for PUMP-001',
      expectedEquipmentId: 'PUMP-001',
      expectedName: 'Primary Cooling Pump'
    },
    {
      query: 'check status for COMP-123',
      expectedEquipmentId: 'COMP-123',
      expectedName: 'Main Air Compressor'
    }
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase.query}"`);
    console.log('-'.repeat(80));
    
    try {
      const result = await router.routeQuery(testCase.query);
      
      // Validate routing
      if (result.agentUsed !== 'maintenance') {
        console.log(`❌ FAIL: Wrong agent (${result.agentUsed})`);
        allPassed = false;
        continue;
      }
      
      // Validate success
      if (!result.success) {
        console.log(`❌ FAIL: Request failed - ${result.message}`);
        allPassed = false;
        continue;
      }
      
      // Validate artifact structure
      const artifact = result.artifacts?.[0];
      if (!artifact) {
        console.log('❌ FAIL: No artifact returned');
        allPassed = false;
        continue;
      }
      
      if (artifact.messageContentType !== 'equipment_health') {
        console.log(`❌ FAIL: Wrong artifact type (${artifact.messageContentType})`);
        allPassed = false;
        continue;
      }
      
      // Validate equipmentHealth structure (matches frontend component)
      const health = artifact.equipmentHealth;
      if (!health) {
        console.log('❌ FAIL: Missing equipmentHealth property');
        allPassed = false;
        continue;
      }
      
      // Validate required fields
      const requiredFields = [
        'equipmentId',
        'equipmentName',
        'healthScore',
        'operationalStatus',
        'lastMaintenanceDate'
      ];
      
      const missingFields = requiredFields.filter(field => health[field] === undefined);
      if (missingFields.length > 0) {
        console.log(`❌ FAIL: Missing fields: ${missingFields.join(', ')}`);
        allPassed = false;
        continue;
      }
      
      // Validate expected values
      if (health.equipmentId !== testCase.expectedEquipmentId) {
        console.log(`❌ FAIL: Wrong equipment ID (${health.equipmentId})`);
        allPassed = false;
        continue;
      }
      
      if (health.equipmentName !== testCase.expectedName) {
        console.log(`❌ FAIL: Wrong equipment name (${health.equipmentName})`);
        allPassed = false;
        continue;
      }
      
      // Validate health score range
      if (typeof health.healthScore !== 'number' || health.healthScore < 0 || health.healthScore > 100) {
        console.log(`❌ FAIL: Invalid health score (${health.healthScore})`);
        allPassed = false;
        continue;
      }
      
      // Validate operational status
      const validStatuses = ['operational', 'degraded', 'failed', 'maintenance'];
      if (!validStatuses.includes(health.operationalStatus)) {
        console.log(`❌ FAIL: Invalid operational status (${health.operationalStatus})`);
        allPassed = false;
        continue;
      }
      
      // Validate metrics structure
      if (health.metrics) {
        console.log('  ✅ Has metrics:', Object.keys(health.metrics).join(', '));
      }
      
      // Validate alerts structure
      if (health.alerts && health.alerts.length > 0) {
        console.log(`  ✅ Has ${health.alerts.length} alert(s)`);
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        const invalidAlerts = health.alerts.filter((a: any) => 
          !validSeverities.includes(a.severity) || !a.message
        );
        if (invalidAlerts.length > 0) {
          console.log('  ❌ FAIL: Invalid alert structure');
          allPassed = false;
          continue;
        }
      }
      
      // Validate recommendations structure
      if (health.recommendations && health.recommendations.length > 0) {
        console.log(`  ✅ Has ${health.recommendations.length} recommendation(s)`);
      }
      
      console.log(`✅ PASS: ${testCase.expectedName}`);
      console.log(`  Equipment ID: ${health.equipmentId}`);
      console.log(`  Health Score: ${health.healthScore}/100`);
      console.log(`  Status: ${health.operationalStatus}`);
      
    } catch (error) {
      console.log(`❌ FAIL: Exception - ${error}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('🎉 All integration tests passed!');
    console.log('✅ Equipment status queries work end-to-end');
    console.log('✅ Artifact structure matches frontend component');
    console.log('✅ Ready for deployment');
  } else {
    console.log('❌ Some tests failed - review output above');
  }
  console.log('='.repeat(80));
}

// Run test
testIntegration().catch(console.error);
