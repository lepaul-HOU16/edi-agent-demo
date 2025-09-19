const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env.local' });

// Test script to verify what's actually in the S3 bucket
async function testS3WellCount() {
    try {
        const s3Client = new S3Client({ region: process.env.AWS_REGION });
        const bucketName = process.env.STORAGE_BUCKET_NAME;
        const prefix = 'global/well-data/';
        
        console.log('🔍 Checking S3 bucket for LAS files...');
        console.log(`Bucket: ${bucketName}`);
        console.log(`Prefix: ${prefix}`);
        
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            MaxKeys: 100 // Increase to ensure we get all files
        });
        
        const response = await s3Client.send(listCommand);
        const allFiles = response.Contents || [];
        const lasFiles = allFiles.filter(obj => obj.Key?.endsWith('.las'));
        
        console.log(`\n📊 Results:`);
        console.log(`Total files in ${prefix}: ${allFiles.length}`);
        console.log(`LAS files found: ${lasFiles.length}`);
        
        if (lasFiles.length > 0) {
            console.log(`\n📋 LAS Files in S3:`);
            lasFiles.forEach((file, index) => {
                const fileName = file.Key?.replace(prefix, '') || `Unknown-${index}`;
                const sizeKB = ((file.Size || 0) / 1024).toFixed(2);
                const lastModified = file.LastModified?.toISOString().split('T')[0] || 'Unknown';
                console.log(`  ${index + 1}. ${fileName} (${sizeKB} KB, ${lastModified})`);
            });
        } else {
            console.log(`\n⚠️  No LAS files found in S3!`);
            console.log(`\n🔧 Troubleshooting:`);
            console.log(`1. Check if files were uploaded to the correct prefix: ${prefix}`);
            console.log(`2. Verify bucket permissions`);
            console.log(`3. Run the upload script: npm run upload-las-files`);
        }
        
        // Test what the catalog functions would return
        console.log(`\n🎯 Expected catalog agent response:`);
        console.log(`The catalog agent should return ${lasFiles.length} wells`);
        
        return lasFiles.length;
        
    } catch (error) {
        console.error('❌ Error checking S3:', error.message);
        
        if (error.message.includes('NoSuchBucket')) {
            console.log('\n💡 Bucket does not exist. Make sure Amplify is deployed.');
        } else if (error.message.includes('AccessDenied')) {
            console.log('\n💡 Access denied. Check AWS credentials and permissions.');
        }
        
        return 0;
    }
}

// Main execution
testS3WellCount()
    .then(count => {
        console.log(`\n🏁 Test complete. Found ${count} LAS files in S3.`);
        if (count !== 27) {
            console.log(`\n⚠️  Expected 27 LAS files, but found ${count}.`);
            console.log(`If you expect 27 files, you may need to:`);
            console.log(`1. Upload more LAS files to S3`);
            console.log(`2. Check if files are in a different location`);
            console.log(`3. Verify the files were uploaded with .las extension`);
        } else {
            console.log(`\n✅ Perfect! Found exactly 27 LAS files as expected.`);
        }
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
