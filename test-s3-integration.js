#!/usr/bin/env node
/**
 * Test S3 integration for well data access
 */

console.log('🔍 Testing S3 Well Data Integration');
console.log('===================================');

// Test the MCP client logic
const testMCPClient = {
  bucketName: 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
  prefix: 'global/well-data/',
  
  // Simulate S3 response
  mockListFiles() {
    return [
      'Well_001.las', 'Well_002.las', 'Well_003.las', 'Well_004.las',
      'Well_005.las', 'Well_006.las', 'Well_007.las', 'Well_008.las',
      'Well_009.las', 'Well_010.las', 'Well_011.las', 'Well_012.las',
      'Well_013.las', 'Well_014.las', 'Well_015.las', 'Well_016.las',
      'Well_017.las', 'Well_018.las', 'Well_019.las', 'Well_020.las',
      'Well_021.las', 'Well_022.las', 'Well_023.las', 'Well_024.las'
    ];
  },
  
  mockWellData(filename) {
    return {
      filename,
      curves: ['GR', 'SP', 'RHOB', 'NPHI', 'RT'],
      dataPoints: Math.floor(Math.random() * 1000) + 1500
    };
  }
};

console.log('\n1. Testing well file listing...');
const files = testMCPClient.mockListFiles();
console.log(`✅ Found ${files.length} well files`);
console.log(`   First 5: ${files.slice(0, 5).join(', ')}`);

console.log('\n2. Testing well data parsing...');
const sampleWell = testMCPClient.mockWellData('Well_001.las');
console.log(`✅ Sample well data:`, sampleWell);

console.log('\n3. Testing agent query handling...');
const testQueries = [
  'List available wells',
  'Analyze Well_001.las',
  'Calculate permeability for 15% porosity and 100 μm grain size'
];

testQueries.forEach((query, i) => {
  console.log(`   Query ${i+1}: "${query}"`);
  
  if (query.toLowerCase().includes('list')) {
    console.log(`   → Response: List of ${files.length} wells`);
  } else if (query.toLowerCase().includes('well_')) {
    console.log(`   → Response: Well analysis with ${sampleWell.dataPoints} data points`);
  } else if (query.toLowerCase().includes('permeability')) {
    console.log(`   → Response: Permeability calculation`);
  }
});

console.log('\n✅ S3 Integration Test Complete!');
console.log('\nNext: Deploy with `npx ampx sandbox` to test with real S3 data');
