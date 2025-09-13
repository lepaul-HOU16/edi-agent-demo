// Simple test to verify agent's tools can access files
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

async function testAgentFileAccess() {
    console.log(`\n=== TESTING AGENT FILE ACCESS ===`);
    console.log(`Testing if the agent's tools can now access the well data...`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Simulate what the S3 tools will do
    const s3Client = new S3Client();
    
    // Load bucket name exactly like the S3 tools do
    let bucketName;
    try {
        const outputs = require('./amplify_outputs.json');
        bucketName = outputs.storage.bucket_name;
        console.log(`✅ Loaded bucket from amplify_outputs.json: ${bucketName}`);
    } catch (error) {
        bucketName = process.env.STORAGE_BUCKET_NAME;
        console.log(`⚠️  Fallback to env var: ${bucketName}`);
    }

    // Test global/well-data/ access (what listFiles("global/well-data") would do)
    console.log(`\n--- Testing listFiles("global/well-data") equivalent ---`);
    try {
        const listResult = await s3Client.send(new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/well-data/',
            Delimiter: '/' // This simulates the S3 tools behavior
        }));

        console.log(`✅ listFiles would return:`);
        console.log(`   Files: ${(listResult.Contents || []).filter(item => 
            item.Key !== 'global/well-data/' && !item.Key.endsWith('/')
        ).length}`);
        
        const lasFiles = (listResult.Contents || []).filter(item => 
            item.Key && item.Key.toLowerCase().endsWith('.las')
        );
        
        console.log(`   LAS files: ${lasFiles.length}`);
        lasFiles.slice(0, 5).forEach(file => {
            console.log(`      - ${file.Key.replace('global/well-data/', '')}`);
        });
        if (lasFiles.length > 5) {
            console.log(`      - ... and ${lasFiles.length - 5} more`);
        }

    } catch (error) {
        console.log(`❌ listFiles would fail: ${error.message}`);
    }

    // Test specific file access (what readFile would do) 
    console.log(`\n--- Testing readFile("global/well-data/WELL-001.las") equivalent ---`);
    try {
        const { GetObjectCommand } = require("@aws-sdk/client-s3");
        
        const readResult = await s3Client.send(new GetObjectCommand({
            Bucket: bucketName,
            Key: 'global/well-data/WELL-001.las',
            Range: 'bytes=0-1023' // Read first 1KB like readFile does
        }));

        console.log(`✅ readFile would succeed - file exists and is readable`);
        console.log(`   Content-Length: ${readResult.ContentLength} bytes`);
        
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            console.log(`❌ readFile would fail: File not found`);
        } else {
            console.log(`❌ readFile would fail: ${error.message}`);
        }
    }

    // Test search functionality
    console.log(`\n--- Testing searchFiles(".*\.las$") equivalent ---`);
    try {
        const searchResult = await s3Client.send(new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/well-data/',
            MaxKeys: 1000
        }));

        const allLasFiles = (searchResult.Contents || []).filter(item => 
            item.Key && item.Key.toLowerCase().endsWith('.las')
        );
        
        console.log(`✅ searchFiles would return ${allLasFiles.length} LAS files`);

    } catch (error) {
        console.log(`❌ searchFiles would fail: ${error.message}`);
    }

    console.log(`\n=== TEST COMPLETE ===`);
    console.log(`\nExpected Agent Behavior:`);
    console.log(`- Question: "How many wells do I have?"`);
    console.log(`- Agent should use listFiles("global/well-data") or searchFiles`);
    console.log(`- Should detect ${lasFiles?.length || '27'} LAS files`);
    console.log(`- Should respond: "You have ${lasFiles?.length || '27'} wells"`);
    console.log(`\nIf agent still says "no files", the tools are working but`);
    console.log(`the agent isn't using them. May need basic context hint.`);
}

testAgentFileAccess().catch(console.error);
