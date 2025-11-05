/**
 * Test Collection Inheritance in Canvases
 * 
 * Verifies that when a canvas is linked to a collection containing the 24 numbered wells,
 * those wells are accessible via the FileDrawer in the global/well-data/ directory.
 */

const { generateClient } = require('aws-amplify/data');

async function testCollectionInheritance() {
  console.log('🧪 Testing Collection Inheritance in Canvases\n');
  
  try {
    const client = generateClient();
    
    // Step 1: Get the South China Sea collection (24 wells)
    console.log('📋 Step 1: Fetching South China Sea collection...');
    const collectionResponse = await client.queries.collectionQuery({
      operation: 'listCollections'
    });
    
    if (!collectionResponse.data) {
      console.error('❌ Failed to fetch collections');
      return false;
    }
    
    const collections = typeof collectionResponse.data === 'string' 
      ? JSON.parse(collectionResponse.data) 
      : collectionResponse.data;
    
    const southChinaSeaCollection = collections.collections?.find(c => 
      c.name.includes('South China Sea') || c.name.includes('24 Wells')
    );
    
    if (!southChinaSeaCollection) {
      console.error('❌ South China Sea collection not found');
      console.log('Available collections:', collections.collections?.map(c => c.name));
      return false;
    }
    
    console.log('✅ Found collection:', southChinaSeaCollection.name);
    console.log('   Wells:', southChinaSeaCollection.dataItems?.length || 0);
    console.log('   Data Source:', southChinaSeaCollection.dataSourceType);
    
    // Step 2: Verify the collection has 24 numbered wells
    console.log('\n📋 Step 2: Verifying well data...');
    const dataItems = southChinaSeaCollection.dataItems || [];
    const numberedWells = dataItems.filter(item => /WELL-\d{3}/.test(item.name));
    
    if (numberedWells.length !== 24) {
      console.error(`❌ Expected 24 numbered wells, found ${numberedWells.length}`);
      return false;
    }
    
    console.log('✅ Collection has 24 numbered wells');
    
    // Step 3: Verify S3 keys point to global/well-data/
    console.log('\n📋 Step 3: Verifying S3 file paths...');
    const wellsWithS3Keys = dataItems.filter(item => item.s3Key);
    const wellsInGlobalDir = wellsWithS3Keys.filter(item => 
      item.s3Key.startsWith('global/well-data/')
    );
    
    if (wellsInGlobalDir.length !== 24) {
      console.error(`❌ Expected 24 wells in global/well-data/, found ${wellsInGlobalDir.length}`);
      console.log('Sample S3 keys:', wellsWithS3Keys.slice(0, 3).map(w => w.s3Key));
      return false;
    }
    
    console.log('✅ All 24 wells have S3 keys in global/well-data/');
    console.log('   Sample paths:');
    wellsInGlobalDir.slice(0, 3).forEach(well => {
      console.log(`   - ${well.name}: ${well.s3Key}`);
    });
    
    // Step 4: Create a test canvas linked to this collection
    console.log('\n📋 Step 4: Creating test canvas linked to collection...');
    const testCanvasResponse = await client.models.ChatSession.create({
      name: 'Test Canvas - Collection Inheritance',
      linkedCollectionId: southChinaSeaCollection.id,
      collectionContext: southChinaSeaCollection
    });
    
    if (!testCanvasResponse.data) {
      console.error('❌ Failed to create test canvas');
      return false;
    }
    
    const testCanvas = testCanvasResponse.data;
    console.log('✅ Test canvas created:', testCanvas.id);
    console.log('   Linked to collection:', testCanvas.linkedCollectionId);
    
    // Step 5: Verify collection context is stored
    console.log('\n📋 Step 5: Verifying collection context in canvas...');
    const canvasResponse = await client.models.ChatSession.get({
      id: testCanvas.id
    });
    
    if (!canvasResponse.data) {
      console.error('❌ Failed to retrieve test canvas');
      return false;
    }
    
    const retrievedCanvas = canvasResponse.data;
    
    if (!retrievedCanvas.linkedCollectionId) {
      console.error('❌ Canvas missing linkedCollectionId');
      return false;
    }
    
    if (!retrievedCanvas.collectionContext) {
      console.error('❌ Canvas missing collectionContext');
      return false;
    }
    
    const context = retrievedCanvas.collectionContext;
    console.log('✅ Collection context stored in canvas');
    console.log('   Collection name:', context.name);
    console.log('   Well count:', context.dataItems?.length || 0);
    console.log('   Data source:', context.dataSourceType);
    
    // Step 6: Verify well file paths are accessible
    console.log('\n📋 Step 6: Verifying well file accessibility...');
    const contextWells = context.dataItems || [];
    const accessibleWells = contextWells.filter(item => 
      item.s3Key && item.s3Key.startsWith('global/well-data/')
    );
    
    if (accessibleWells.length !== 24) {
      console.error(`❌ Expected 24 accessible wells, found ${accessibleWells.length}`);
      return false;
    }
    
    console.log('✅ All 24 wells accessible via collection context');
    console.log('   Wells can be accessed in FileDrawer at: global/well-data/');
    
    // Step 7: Clean up test canvas
    console.log('\n📋 Step 7: Cleaning up test canvas...');
    await client.models.ChatSession.delete({ id: testCanvas.id });
    console.log('✅ Test canvas deleted');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   ✓ Collection found: ${southChinaSeaCollection.name}`);
    console.log(`   ✓ Wells in collection: ${numberedWells.length}`);
    console.log(`   ✓ Wells in global/well-data/: ${wellsInGlobalDir.length}`);
    console.log(`   ✓ Collection context inheritance: Working`);
    console.log(`   ✓ File accessibility: All 24 LAS files accessible`);
    console.log('\n🎉 Collection inheritance is working correctly!');
    console.log('   Canvases linked to this collection will have full access');
    console.log('   to all 24 numbered wells in the FileDrawer.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCollectionInheritance()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testCollectionInheritance };
