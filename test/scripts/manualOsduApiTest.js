#!/usr/bin/env node

/**
 * Manual OSDU API Service Test
 * 
 * This script provides manual testing capabilities for the OSDU API service
 * with real authentication tokens. Use this for manual validation of:
 * 1. Token retrieval from updated authentication
 * 2. API calls to Schema, Entitlements, and Legal services
 * 3. Error handling and connectivity
 * 
 * Note: This requires a running application with valid authentication
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 OSDU API Service Manual Test Tool');
console.log('=====================================\n');

console.log('This tool helps you manually test the OSDU API service integration.');
console.log('You can test various scenarios and API endpoints.\n');

const testScenarios = [
  {
    id: '1',
    name: 'Test Token Retrieval',
    description: 'Test that the service can retrieve authentication tokens',
    code: `
// Test token retrieval
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing token retrieval...');
  const headers = await osduApi.getAuthHeaders();
  console.log('✅ Token retrieval successful');
  console.log('Headers:', JSON.stringify(headers, null, 2));
} catch (error) {
  console.error('❌ Token retrieval failed:', error.message);
}
`
  },
  {
    id: '2',
    name: 'Test Schema Service',
    description: 'Test API calls to the Schema service',
    code: `
// Test Schema service
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing Schema service...');
  const schemas = await osduApi.getSchemas();
  console.log('✅ Schema service call successful');
  console.log('Number of schemas:', schemas?.getSchemas?.items?.length || 0);
  if (schemas?.getSchemas?.items?.length > 0) {
    console.log('First schema:', JSON.stringify(schemas.getSchemas.items[0], null, 2));
  }
} catch (error) {
  console.error('❌ Schema service call failed:', error.message);
}
`
  },
  {
    id: '3',
    name: 'Test Entitlements Service',
    description: 'Test API calls to the Entitlements service',
    code: `
// Test Entitlements service
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing Entitlements service...');
  const entitlements = await osduApi.getEntitlements();
  console.log('✅ Entitlements service call successful');
  console.log('Number of entitlements:', entitlements?.listEntitlements?.items?.length || 0);
  if (entitlements?.listEntitlements?.items?.length > 0) {
    console.log('First entitlement:', JSON.stringify(entitlements.listEntitlements.items[0], null, 2));
  }
} catch (error) {
  console.error('❌ Entitlements service call failed:', error.message);
}
`
  },
  {
    id: '4',
    name: 'Test Legal Tagging Service',
    description: 'Test API calls to the Legal Tagging service',
    code: `
// Test Legal Tagging service
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing Legal Tagging service...');
  const legalTags = await osduApi.getLegalTags();
  console.log('✅ Legal Tagging service call successful');
  console.log('Number of legal tags:', legalTags?.getLegalTags?.items?.length || 0);
  if (legalTags?.getLegalTags?.items?.length > 0) {
    console.log('First legal tag:', JSON.stringify(legalTags.getLegalTags.items[0], null, 2));
  }
} catch (error) {
  console.error('❌ Legal Tagging service call failed:', error.message);
}
`
  },
  {
    id: '5',
    name: 'Test Service Connectivity',
    description: 'Test connectivity to all OSDU services',
    code: `
// Test service connectivity
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing service connectivity...');
  const connectivity = await osduApi.testConnectivity();
  console.log('✅ Service connectivity test completed');
  console.log('Connectivity results:');
  
  for (const [service, result] of Object.entries(connectivity)) {
    const status = result.status === 'connected' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'not_configured' ? '⚠️' : '❓';
    console.log(\`  \${status} \${service}: \${result.status}\`);
    if (result.error) {
      console.log(\`    Error: \${result.error}\`);
    }
  }
} catch (error) {
  console.error('❌ Service connectivity test failed:', error.message);
}
`
  },
  {
    id: '6',
    name: 'Test Service Health',
    description: 'Test overall service health status',
    code: `
// Test service health
import osduApi from '../src/services/osduApiService.js';

try {
  console.log('Testing service health...');
  const health = await osduApi.getServiceHealth();
  console.log('✅ Service health check completed');
  console.log('Overall health:', health.overall);
  console.log('Timestamp:', health.timestamp);
  console.log('Service details:');
  
  for (const [service, result] of Object.entries(health.services)) {
    const status = result.status === 'connected' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'not_configured' ? '⚠️' : '❓';
    console.log(\`  \${status} \${service}: \${result.status}\`);
  }
} catch (error) {
  console.error('❌ Service health check failed:', error.message);
}
`
  }
];

function showMenu() {
  console.log('\nAvailable Test Scenarios:');
  console.log('========================');
  
  testScenarios.forEach(scenario => {
    console.log(`${scenario.id}. ${scenario.name}`);
    console.log(`   ${scenario.description}\n`);
  });
  
  console.log('0. Exit\n');
}

function showTestCode(scenarioId) {
  const scenario = testScenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    console.log('❌ Invalid scenario ID');
    return;
  }
  
  console.log(`\n📋 Test Code for: ${scenario.name}`);
  console.log('='.repeat(50));
  console.log(scenario.code);
  console.log('='.repeat(50));
  
  console.log('\n💡 To run this test:');
  console.log('1. Start your frontend application (npm run dev)');
  console.log('2. Ensure you are authenticated in the application');
  console.log('3. Open browser developer console');
  console.log('4. Copy and paste the above code');
  console.log('5. Press Enter to execute\n');
}

function promptUser() {
  showMenu();
  
  rl.question('Select a test scenario (0-6): ', (answer) => {
    const choice = answer.trim();
    
    if (choice === '0') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }
    
    if (testScenarios.find(s => s.id === choice)) {
      showTestCode(choice);
      
      rl.question('\nPress Enter to return to menu...', () => {
        promptUser();
      });
    } else {
      console.log('❌ Invalid choice. Please select a number from 0-6.');
      promptUser();
    }
  });
}

// Start the interactive menu
promptUser();