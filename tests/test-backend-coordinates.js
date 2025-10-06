const { handler } = require('./amplify/functions/catalogMapData/index.ts');
const AWS = require('aws-sdk');
require('dotenv').config({ path: '.env.local' });

// Mock event and context for testing
const mockEvent = {
  requestContext: {
    connectionId: 'test-connection',
    routeKey: '$default'
  },
  body: JSON.stringify({
    action: 'catalogMapData',
    data: {}
  })
};

const mockContext = {
  callbackWaitsForEmptyEventLoop: false
};

async function testCatalogMapData() {
  try {
    console.log('Testing catalogMapData function...');
    console.log('Environment variables loaded:');
    console.log('- S3_BUCKET:', process.env.S3_BUCKET || 'Not set');
    console.log('- AWS_REGION:', process.env.AWS_REGION || 'Not set');
    
    const result = await handler(mockEvent, mockContext);
    
    console.log('\n--- Function Result ---');
    console.log('Status Code:', result.statusCode);
    
    if (result.body) {
      const body = JSON.parse(result.body);
      console.log('\nResponse Body:');
      console.log('Type:', typeof body);
      console.log('Keys:', Object.keys(body));
      
      if (body.features) {
        console.log('\n--- GeoJSON Features Analysis ---');
        console.log('Total features:', body.features.length);
        
        body.features.forEach((feature, index) => {
          console.log(`\nFeature ${index + 1}:`);
          console.log('  Well Name:', feature.properties?.wellName || 'N/A');
          console.log('  Coordinates:', feature.geometry?.coordinates || 'N/A');
          console.log('  Data Source:', feature.properties?.dataSource || 'N/A');
          console.log('  Location:', feature.properties?.location || 'N/A');
          
          // Check if coordinates are in the expected range for Brunei/Malaysia
          const coords = feature.geometry?.coordinates;
          if (coords && coords.length === 2) {
            const [lon, lat] = coords;
            const isInExpectedRegion = lat >= 10 && lat <= 11 && lon >= 114 && lon <= 115;
            console.log('  In Expected Region (Brunei/Malaysia):', isInExpectedRegion);
          }
        });
      }
      
      if (body.error) {
        console.log('\nError in response:', body.error);
      }
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCatalogMapData();
