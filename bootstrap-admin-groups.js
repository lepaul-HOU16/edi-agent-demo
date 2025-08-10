#!/usr/bin/env node

/**
 * Bootstrap Admin Groups Script
 * 
 * This script helps create the initial admin groups and entitlements
 * for cmgabri@amazon.com to have full OSDU access
 */

console.log('🚀 OSDU Admin Groups Bootstrap');
console.log('==============================');
console.log('');

const adminEmail = 'cmgabri@amazon.com';
const dataPartition = 'osdu';

// Define the admin groups to create
const adminGroups = [
  {
    name: 'service.schema.admin',
    email: `service.schema.admin@${dataPartition}.dataservices.energy`,
    description: 'Schema Service Administrators - Full access to schema operations',
    members: [adminEmail],
    services: ['schema'],
    actions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.storage.admin',
    email: `service.storage.admin@${dataPartition}.dataservices.energy`,
    description: 'Storage Service Administrators - Full access to storage operations',
    members: [adminEmail],
    services: ['storage'],
    actions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.search.admin',
    email: `service.search.admin@${dataPartition}.dataservices.energy`,
    description: 'Search Service Administrators - Full access to search operations',
    members: [adminEmail],
    services: ['search'],
    actions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.legal.admin',
    email: `service.legal.admin@${dataPartition}.dataservices.energy`,
    description: 'Legal Service Administrators - Full access to legal tag operations',
    members: [adminEmail],
    services: ['legal'],
    actions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.entitlements.admin',
    email: `service.entitlements.admin@${dataPartition}.dataservices.energy`,
    description: 'Entitlements Service Administrators - Full access to entitlements and groups',
    members: [adminEmail],
    services: ['entitlements'],
    actions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'data.default.owners',
    email: `data.default.owners@${dataPartition}.dataservices.energy`,
    description: 'Default Data Owners - Can create, read, update, and delete data records',
    members: [adminEmail],
    services: ['storage', 'search'],
    actions: ['READ', 'WRITE', 'DELETE']
  }
];

console.log('📋 Groups to Create:');
console.log('');

adminGroups.forEach((group, index) => {
  console.log(`${index + 1}. ${group.name}`);
  console.log(`   📧 Email: ${group.email}`);
  console.log(`   📝 Description: ${group.description}`);
  console.log(`   👥 Members: ${group.members.join(', ')}`);
  console.log(`   🔧 Services: ${group.services.join(', ')}`);
  console.log(`   🔐 Actions: ${group.actions.join(', ')}`);
  console.log('');
});

console.log('🛠️  Manual Setup Instructions:');
console.log('');
console.log('Since this is a Node.js script without browser authentication,');
console.log('you\'ll need to create these groups manually through the UI:');
console.log('');

console.log('1. 🌐 Go to the Entitlements page in your OSDU frontend');
console.log('2. 🏗️  Create each group using the details above');
console.log('3. 👤 Add yourself (cmgabri@amazon.com) as a member to each group');
console.log('4. 🔗 Create entitlements that map groups to service permissions');
console.log('');

console.log('📝 Group Creation Template:');
console.log('');
console.log('For each group above, use this template in the UI:');
console.log('');
console.log('Group Name: [name from above]');
console.log('Group Email: [email from above]');
console.log('Description: [description from above]');
console.log('Initial Members: cmgabri@amazon.com');
console.log('');

console.log('🔗 Entitlement Creation Template:');
console.log('');
console.log('After creating groups, create entitlements:');
console.log('');
console.log('Entitlement Name: [service].admin.access');
console.log('Group Email: [group email from above]');
console.log('Actions: [actions from above]');
console.log('Conditions: service = [service name]');
console.log('');

console.log('✅ Verification Steps:');
console.log('');
console.log('After creating all groups and entitlements:');
console.log('1. 🔄 Log out and log back in to refresh your tokens');
console.log('2. 🧪 Test the API test page - all services should work');
console.log('3. 📊 Try listing schemas - should work without permission errors');
console.log('4. 💾 Try creating/reading storage records - should work');
console.log('5. 🔍 Try search operations - should work');
console.log('');

console.log('🚨 Important Notes:');
console.log('');
console.log('- Use EXACT email formats shown (including @osdu.dataservices.energy)');
console.log('- Add yourself to ALL admin groups');
console.log('- Create entitlements that map groups to services');
console.log('- Test one service at a time after setup');
console.log('- If issues persist, check backend logs for specific errors');
console.log('');

console.log('🎯 Expected Outcome:');
console.log('');
console.log('After completing this setup:');
console.log('✅ Schema service: Full access to list/create/update schemas');
console.log('✅ Storage service: Full access to create/read/update/delete records');
console.log('✅ Search service: Full access to search operations');
console.log('✅ Legal service: Full access to legal tag operations');
console.log('✅ Entitlements service: Full access to manage groups and entitlements');
console.log('');

console.log('🔧 If you need programmatic setup, you can use the OSDU APIs');
console.log('directly once you have initial entitlements admin access.');
console.log('');

console.log('Ready to bootstrap your OSDU admin access! 🚀');