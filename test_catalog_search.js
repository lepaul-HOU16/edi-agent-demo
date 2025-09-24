const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env.local' });

// Test the catalog search function logic directly
async function testCatalogSearch() {
    const S3_BUCKET = process.env.STORAGE_BUCKET_NAME;
    const S3_PREFIX = 'global/well-data/';
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    
    console.log('🧪 Testing catalog search function locally...');
    console.log(`Testing query: "show me my wells"`);
    
    try {
        // Test the S3 fetch that should happen when user asks for "my wells"
        console.log(`\n📁 Fetching LAS files from S3 bucket: ${S3_BUCKET}, prefix: ${S3_PREFIX}`);
        
        const listCommand = new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: S3_PREFIX,
            MaxKeys: 50
        });
        
        const response = await s3Client.send(listCommand);
        const lasFiles = response.Contents?.filter(obj => obj.Key?.endsWith('.las')) || [];
        
        console.log(`✅ Found ${lasFiles.length} LAS files in S3`);
        
        if (lasFiles.length === 0) {
            console.log('❌ No LAS files found - this explains why "show me my wells" returns nothing');
            return;
        }
        
        // Simulate the coordinate generation and GeoJSON creation
        const malaysianCoordinates = [
            [101.7, 3.1], [102.2, 4.5], [103.8, 1.3], [100.3, 5.4], [104.1, 2.1],
            [101.1, 2.9], [102.9, 3.7], [100.7, 6.2], [103.3, 1.8], [101.5, 4.1],
            [102.7, 5.1], [100.9, 3.5], [103.9, 2.6], [101.9, 5.8], [102.1, 1.5],
            [100.5, 4.7], [103.1, 3.3], [101.3, 2.4], [102.5, 4.9], [100.1, 5.9],
            [103.7, 1.7], [101.7, 3.8], [102.3, 2.2], [100.8, 6.1]
        ];
        
        const userWellsFeatures = lasFiles.map((file, index) => {
            const fileName = file.Key?.replace(S3_PREFIX, '') || `Well-${index + 1}`;
            const wellName = fileName.replace('.las', '').replace(/_/g, ' ');
            const coordinates = malaysianCoordinates[index] || [101.5 + (index * 0.1), 3.0 + (index * 0.1)];
            
            const fileSizeMB = (file.Size || 0) / (1024 * 1024);
            const estimatedDepth = Math.floor(2000 + (fileSizeMB * 500));
            
            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: coordinates
                },
                properties: {
                    name: wellName,
                    type: "My Wells", 
                    depth: `${estimatedDepth}m (est.)`,
                    location: "Malaysia",
                    operator: "My Company",
                    category: "personal",
                    fileName: fileName,
                    fileSize: `${fileSizeMB.toFixed(2)} MB`,
                    s3Key: file.Key,
                    dataSource: "Personal LAS Files",
                    latitude: coordinates[1]?.toFixed(6),
                    longitude: coordinates[0]?.toFixed(6)
                }
            };
        });
        
        const geoJsonResult = {
            type: "FeatureCollection",
            metadata: {
                type: "wells",
                searchQuery: "show me my wells",
                source: "Personal LAS Files",
                recordCount: userWellsFeatures.length,
                region: 'malaysia',
                queryType: 'myWells',
                timestamp: new Date().toISOString()
            },
            features: userWellsFeatures
        };
        
        console.log(`\n📊 Generated GeoJSON response:`);
        console.log(`- Features count: ${geoJsonResult.features.length}`);
        console.log(`- Metadata: ${JSON.stringify(geoJsonResult.metadata, null, 2)}`);
        
        console.log(`\n🗺️ Sample well features:`);
        geoJsonResult.features.slice(0, 3).forEach((feature, index) => {
            console.log(`  ${index + 1}. ${feature.properties.name} at [${feature.geometry.coordinates.join(', ')}]`);
        });
        
        console.log(`\n✅ The catalog search function SHOULD return ${geoJsonResult.features.length} wells for "show me my wells"`);
        console.log(`🔍 If it's not working in the UI, the issue might be:`);
        console.log(`   - Lambda function not deployed with latest changes`);
        console.log(`   - Frontend not calling the function correctly`);
        console.log(`   - Authentication/permissions issue`);
        console.log(`   - Environment variables not set in Lambda`);
        
    } catch (error) {
        console.error('❌ Error in catalog search test:', error);
        console.log('\n🔧 This error would cause "show me my wells" to fail');
    }
}

testCatalogSearch().catch(console.error);
