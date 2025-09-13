const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

async function findCorrectBucket() {
    const s3Client = new S3Client();
    
    console.log(`\n=== FINDING CORRECT S3 BUCKET ===`);
    console.log(`Current incorrect bucket: amplify-ediagentdemo-lepaul-storage-storage-93232f9`);
    console.log(`Looking for Amplify buckets...\n`);

    try {
        const result = await s3Client.send(new ListBucketsCommand({}));
        
        if (result.Buckets && result.Buckets.length > 0) {
            console.log(`Found ${result.Buckets.length} S3 buckets:`);
            
            // Look for Amplify-related buckets
            const amplifyBuckets = result.Buckets.filter(bucket => 
                bucket.Name && (
                    bucket.Name.includes('amplify') || 
                    bucket.Name.includes('workshop') ||
                    bucket.Name.includes('edi') ||
                    bucket.Name.includes('lepaul') ||
                    bucket.Name.includes('storage')
                )
            );
            
            if (amplifyBuckets.length > 0) {
                console.log(`\n🎯 AMPLIFY-RELATED BUCKETS:`);
                amplifyBuckets.forEach(bucket => {
                    console.log(`   ✅ ${bucket.Name} (created: ${bucket.CreationDate})`);
                });
            }

            console.log(`\n📋 ALL BUCKETS:`);
            result.Buckets.forEach(bucket => {
                console.log(`   - ${bucket.Name} (created: ${bucket.CreationDate})`);
            });

        } else {
            console.log(`❌ No S3 buckets found`);
        }

    } catch (error) {
        console.log(`❌ Error listing buckets:`, error.message);
        console.log(`This might be due to AWS credentials or permissions`);
    }

    console.log(`\n=== BUCKET SEARCH COMPLETE ===\n`);
}

// Run the search
findCorrectBucket().catch(console.error);
