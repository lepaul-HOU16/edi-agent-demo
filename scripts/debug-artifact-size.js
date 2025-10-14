/**
 * Debug script to check artifact sizes and S3 upload behavior
 * 
 * Run with: node scripts/debug-artifact-size.js
 */

// Simulate a large terrain artifact
const mockTerrainArtifact = {
  type: 'wind_farm_terrain_analysis',
  messageContentType: 'wind_farm_terrain_analysis',
  title: 'Terrain Analysis - Test Project',
  subtitle: 'Found 1000 features',
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  projectId: 'test-project-123',
  exclusionZones: [],
  metrics: {
    totalArea: 100,
    suitableArea: 80,
    excludedArea: 20
  },
  // Simulate large GeoJSON with 1000 features
  geojson: {
    type: 'FeatureCollection',
    features: Array.from({ length: 1000 }, (_, i) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-74.0060 + (i * 0.001), 40.7128 + (i * 0.001)]
      },
      properties: {
        id: i,
        name: `Feature ${i}`,
        type: 'building',
        height: Math.random() * 100
      }
    }))
  }
};

// Calculate size
const artifactJson = JSON.stringify(mockTerrainArtifact);
const artifactSize = Buffer.byteLength(artifactJson, 'utf8');

console.log('📊 Artifact Size Analysis');
console.log('========================');
console.log(`Total size: ${(artifactSize / 1024).toFixed(2)} KB`);
console.log(`Feature count: ${mockTerrainArtifact.geojson.features.length}`);
console.log(`Should use S3 (>100KB): ${artifactSize > 100 * 1024 ? 'YES' : 'NO'}`);
console.log(`Would exceed DynamoDB (>300KB): ${artifactSize > 300 * 1024 ? 'YES' : 'NO'}`);

// Simulate S3 reference
const s3Reference = {
  type: 's3_reference',
  bucket: 'amplify-storage',
  key: 'chatSessionArtifacts/test-session/terrain-analysis-123.json',
  size: artifactSize,
  contentType: 'application/json',
  originalType: 'wind_farm_terrain_analysis',
  uploadedAt: new Date().toISOString(),
  chatSessionId: 'test-session'
};

const s3ReferenceJson = JSON.stringify(s3Reference);
const s3ReferenceSize = Buffer.byteLength(s3ReferenceJson, 'utf8');

console.log('\n📦 S3 Reference Size');
console.log('===================');
console.log(`S3 reference size: ${(s3ReferenceSize / 1024).toFixed(2)} KB`);
console.log(`Size reduction: ${((1 - s3ReferenceSize / artifactSize) * 100).toFixed(1)}%`);

// Simulate message with S3 reference
const messageWithS3 = {
  role: 'ai',
  content: { text: 'Found 1000 terrain features' },
  chatSessionId: 'test-session',
  responseComplete: true,
  artifacts: [s3ReferenceJson],
  createdAt: new Date().toISOString()
};

const messageSize = Buffer.byteLength(JSON.stringify(messageWithS3), 'utf8');

console.log('\n📨 Final Message Size');
console.log('====================');
console.log(`Message with S3 reference: ${(messageSize / 1024).toFixed(2)} KB`);
console.log(`Within DynamoDB limit (<300KB): ${messageSize < 300 * 1024 ? 'YES ✅' : 'NO ❌'}`);

// Test with multiple artifacts
const messageWithMultipleArtifacts = {
  ...messageWithS3,
  artifacts: [s3ReferenceJson, s3ReferenceJson, s3ReferenceJson]
};

const multiMessageSize = Buffer.byteLength(JSON.stringify(messageWithMultipleArtifacts), 'utf8');

console.log('\n📨 Message with 3 S3 References');
console.log('==============================');
console.log(`Message size: ${(multiMessageSize / 1024).toFixed(2)} KB`);
console.log(`Within DynamoDB limit (<300KB): ${multiMessageSize < 300 * 1024 ? 'YES ✅' : 'NO ❌'}`);
