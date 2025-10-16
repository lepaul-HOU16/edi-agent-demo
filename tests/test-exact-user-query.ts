/**
 * Test: Exact User Query
 * Tests the exact query the user reported: "show me equipment status for all my wells"
 */

import { AgentRouter } from '../amplify/functions/agents/agentRouter';

async function testExactUserQuery() {
  console.log('🧪 Testing Exact User Query\n');
  console.log('Query: "show me equipment status for all my wells"\n');

  const router = new AgentRouter();

  try {
    const result = await router.routeQuery(
      'show me equipment status for all my wells',
      [],
      {
        chatSessionId: 'test-session',
        userId: 'test-user',
        selectedAgent: 'auto'
      }
    );

    console.log('📊 Results:');
    console.log('─'.repeat(60));
    console.log(`Agent Used: ${result.agentUsed}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage:\n${result.message}`);
    console.log(`\nArtifacts: ${result.artifacts?.length || 0}`);
    
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('\n📦 Artifact Details:');
      result.artifacts.forEach((artifact, index) => {
        console.log(`\n  Artifact ${index + 1}:`);
        console.log(`    Type: ${artifact.messageContentType}`);
        console.log(`    Title: ${artifact.title}`);
        console.log(`    Subtitle: ${artifact.subtitle}`);
        if (artifact.equipmentHealth) {
          console.log(`    Equipment ID: ${artifact.equipmentHealth.equipmentId}`);
          console.log(`    Equipment Name: ${artifact.equipmentHealth.equipmentName}`);
          console.log(`    Health Score: ${artifact.equipmentHealth.healthScore}/100`);
          console.log(`    Status: ${artifact.equipmentHealth.operationalStatus}`);
          console.log(`    Last Maintenance: ${artifact.equipmentHealth.lastMaintenanceDate}`);
          console.log(`    Next Maintenance: ${artifact.equipmentHealth.nextMaintenanceDate}`);
          
          if (artifact.equipmentHealth.metrics) {
            console.log(`    Metrics:`);
            console.log(`      Temperature: ${artifact.equipmentHealth.metrics.temperature}°F`);
            console.log(`      Pressure: ${artifact.equipmentHealth.metrics.pressure} PSI`);
            console.log(`      Efficiency: ${artifact.equipmentHealth.metrics.efficiency}%`);
          }
          
          if (artifact.equipmentHealth.alerts && artifact.equipmentHealth.alerts.length > 0) {
            console.log(`    Alerts: ${artifact.equipmentHealth.alerts.length}`);
            artifact.equipmentHealth.alerts.forEach((alert: any) => {
              console.log(`      - [${alert.severity}] ${alert.message}`);
            });
          }
        }
      });
    }

    if (result.thoughtSteps && result.thoughtSteps.length > 0) {
      console.log('\n💭 Thought Steps:');
      result.thoughtSteps.forEach((step, index) => {
        console.log(`\n  Step ${index + 1}: ${step.title}`);
        console.log(`    Summary: ${step.summary}`);
        if (step.details) {
          console.log(`    Details: ${step.details}`);
        }
      });
    }

    console.log('\n' + '─'.repeat(60));

    // Validation
    const validations = [
      {
        name: 'Correct agent used',
        pass: result.agentUsed === 'maintenance',
        expected: 'maintenance',
        actual: result.agentUsed
      },
      {
        name: 'Success status',
        pass: result.success === true,
        expected: true,
        actual: result.success
      },
      {
        name: 'Artifacts generated',
        pass: result.artifacts && result.artifacts.length > 0,
        expected: '> 0',
        actual: result.artifacts?.length || 0
      },
      {
        name: 'Correct artifact type',
        pass: result.artifacts?.[0]?.messageContentType === 'equipment_health',
        expected: 'equipment_health',
        actual: result.artifacts?.[0]?.messageContentType
      },
      {
        name: 'Equipment health data present',
        pass: !!result.artifacts?.[0]?.equipmentHealth,
        expected: 'present',
        actual: result.artifacts?.[0]?.equipmentHealth ? 'present' : 'missing'
      },
      {
        name: 'Not generic welcome message',
        pass: !result.message.includes('Welcome! I\'m here to help'),
        expected: 'specific response',
        actual: result.message.includes('Welcome') ? 'generic welcome' : 'specific response'
      }
    ];

    console.log('\n✅ Validation Results:');
    let allPassed = true;
    validations.forEach(v => {
      const status = v.pass ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status}: ${v.name}`);
      if (!v.pass) {
        console.log(`    Expected: ${v.expected}`);
        console.log(`    Actual: ${v.actual}`);
        allPassed = false;
      }
    });

    if (allPassed) {
      console.log('\n🎉 SUCCESS! The exact user query now works correctly!');
      console.log('\nThe user will now see:');
      console.log('  - Equipment status for all wells');
      console.log('  - Health scores and operational status');
      console.log('  - Maintenance dates');
      console.log('  - Sensor metrics');
      console.log('  - Interactive equipment health artifacts');
      console.log('\nInstead of the generic welcome message.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some validations failed. Please review above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testExactUserQuery();
