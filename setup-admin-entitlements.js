#!/usr/bin/env node

/**
 * OSDU Admin Entitlements Setup Guide
 * 
 * This script provides guidance for setting up admin permissions
 * for cmgabri@amazon.com to access all OSDU services
 */

console.log('🔐 OSDU Admin Entitlements Setup');
console.log('================================');
console.log('');

const adminEmail = 'cmgabri@amazon.com';
const dataPartition = 'osdu';

console.log('👤 Admin User:', adminEmail);
console.log('🏢 Data Partition:', dataPartition);
console.log('');

console.log('🎯 Required Admin Groups to Create:');
console.log('');

const adminGroups = [
  {
    name: 'service.schema.admin',
    email: `service.schema.admin@${dataPartition}.dataservices.energy`,
    description: 'Schema Service Administrators',
    permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.storage.admin', 
    email: `service.storage.admin@${dataPartition}.dataservices.energy`,
    description: 'Storage Service Administrators',
    permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.search.admin',
    email: `service.search.admin@${dataPartition}.dataservices.energy`, 
    description: 'Search Service Administrators',
    permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.legal.admin',
    email: `service.legal.admin@${dataPartition}.dataservices.energy`,
    description: 'Legal Service Administrators', 
    permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'service.entitlements.admin',
    email: `service.entitlements.admin@${dataPartition}.dataservices.energy`,
    description: 'Entitlements Service Administrators',
    permissions: ['READ', 'WRITE', 'DELETE', 'ADMIN']
  },
  {
    name: 'data.default.owners',
    email: `data.default.owners@${dataPartition}.dataservices.energy`,
    description: 'Default Data Owners',
    permissions: ['READ', 'WRITE', 'DELETE']
  },
  {
    name: 'data.default.viewers', 
    email: `data.default.viewers@${dataPartition}.dataservices.energy`,
    description: 'Default Data Viewers',
    permissions: ['READ']
  }
];

adminGroups.forEach((group, index) => {
  console.log(`${index + 1}. ${group.name}`);
  console.log(`   Email: ${group.email}`);
  console.log(`   Description: ${group.description}`);
  console.log(`   Permissions: ${group.permissions.join(', ')}`);
  console.log('');
});

console.log('📋 Step-by-Step Setup Process:');
console.log('');

console.log('1. 🏗️  Create Admin Groups');
console.log('   - Go to the Entitlements page in the UI');
console.log('   - Create each admin group listed above');
console.log('   - Use the exact email formats shown');
console.log('');

console.log('2. 👤 Add Yourself to Admin Groups');
console.log('   - Add cmgabri@amazon.com as a member to ALL admin groups');
console.log('   - This gives you admin access to all services');
console.log('');

console.log('3. 🔧 Create Service Entitlements');
console.log('   - Create entitlements that grant admin groups access to services');
console.log('   - Map each service to its corresponding admin group');
console.log('');

console.log('4. ✅ Verify Access');
console.log('   - Test schema service access');
console.log('   - Test storage record creation/reading');
console.log('   - Test search functionality');
console.log('');

console.log('🚀 Quick Start Commands (via UI):');
console.log('');

console.log('Create Schema Admin Group:');
console.log('  Name: service.schema.admin');
console.log('  Email: service.schema.admin@osdu.dataservices.energy');
console.log('  Members: [cmgabri@amazon.com]');
console.log('  Description: Schema Service Administrators');
console.log('');

console.log('Create Storage Admin Group:');
console.log('  Name: service.storage.admin');
console.log('  Email: service.storage.admin@osdu.dataservices.energy');
console.log('  Members: [cmgabri@amazon.com]');
console.log('  Description: Storage Service Administrators');
console.log('');

console.log('Create Entitlements Admin Group:');
console.log('  Name: service.entitlements.admin');
console.log('  Email: service.entitlements.admin@osdu.dataservices.energy');
console.log('  Members: [cmgabri@amazon.com]');
console.log('  Description: Entitlements Service Administrators');
console.log('');

console.log('💡 Pro Tips:');
console.log('');
console.log('- Use consistent naming: service.{servicename}.admin');
console.log('- Email format: {groupname}@{datapartition}.dataservices.energy');
console.log('- Always add yourself as the first member');
console.log('- Create both admin and user groups for each service');
console.log('- Test permissions after each group creation');
console.log('');

console.log('🔍 Troubleshooting:');
console.log('');
console.log('If you still get permission errors after setup:');
console.log('1. Check group membership (are you actually in the groups?)');
console.log('2. Check entitlement mappings (do groups have service access?)');
console.log('3. Check data partition consistency (all using "osdu"?)');
console.log('4. Try logging out and back in to refresh tokens');
console.log('5. Check backend logs for specific permission errors');
console.log('');

console.log('✨ After setup, you should have full admin access to all OSDU services!');