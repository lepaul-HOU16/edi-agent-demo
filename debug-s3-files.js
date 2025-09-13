// Quick script to check S3 files
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function checkS3Files() {
    try {
        // Get bucket name from amplify outputs
        const outputs = require('./amplify_outputs.json');
        const bucketName = outputs.storage.bucket_name;
        
        console.log('Bucket name:', bucketName);
        
        const s3Client = new S3Client();
        
        // Check global directory
        const globalCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/',
            MaxKeys: 100
        });
        
        const globalResponse = await s3Client.send(globalCommand);
        console.log('\nGlobal directory contents:');
        (globalResponse.Contents || []).forEach(item => {
            console.log(`  ${item.Key} (${item.Size} bytes)`);
        });
        
        // Check well-data specifically
        const wellDataCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/well-data/',
            MaxKeys: 100
        });
        
        const wellDataResponse = await s3Client.send(wellDataCommand);
        console.log('\nWell-data directory contents:');
        (wellDataResponse.Contents || []).forEach(item => {
            console.log(`  ${item.Key} (${item.Size} bytes)`);
        });
        
        const lasFiles = (wellDataResponse.Contents || [])
            .filter(item => item.Key && item.Key.toLowerCase().endsWith('.las'))
            .map(item => item.Key.replace('global/well-data/', ''));
            
        console.log('\nLAS files found:', lasFiles);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkS3Files();