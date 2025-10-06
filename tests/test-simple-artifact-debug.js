// Simple artifact debug test
console.log('Artifact Debug Test');

const toolResponse = {
  success: true,
  message: 'Multi-well correlation panel created successfully',
  artifacts: [{
    messageContentType: 'comprehensive_multi_well_correlation',
    wellNames: ['WELL-001', 'WELL-002']
  }]
};

console.log('Tool response artifacts:', toolResponse.artifacts.length);
console.log('First artifact type:', toolResponse.artifacts[0].messageContentType);

// Test JSON
const jsonStr = JSON.stringify(toolResponse);
const parsed = JSON.parse(jsonStr);
console.log('After JSON roundtrip artifacts:', parsed.artifacts.length);

console.log('Artifacts survive JSON serialization:', parsed.artifacts.length > 0 ? 'YES' : 'NO');
