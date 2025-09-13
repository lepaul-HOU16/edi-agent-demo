const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

async function verifyWellDataLocations() {
    const s3Client = new S3Client();
    
    // User confirmed the correct bucket
    const correctBucketName = "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m";
    
    console.log(`\n=== WELL DATA VERIFICATION SCRIPT ===`);
    console.log(`Testing user-specified bucket: ${correctBucketName}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Test accessibility first
    try {
        const rootCheck = await s3Client.send(new ListObjectsV2Command({
            Bucket: correctBucketName,
            MaxKeys: 10
        }));
        
        console.log(`✅ Bucket accessible with ${rootCheck.KeyCount || 0} objects at root\n`);
    } catch (error) {
        console.log(`❌ Cannot access bucket: ${error.message}`);
        return;
    }

    // Test paths where files might exist
    const pathsToCheck = [
        'global/well-data/',
        'chatSessionArtifacts/',
        'global/',
        'well-data/',
        'wells/',
        'data/',
        ''  // Root level
    ];

    for (const path of pathsToCheck) {
        try {
            console.log(`\n--- Checking path: "${path}" ---`);
            
            const result = await s3Client.send(new ListObjectsV2Command({
                Bucket: correctBucketName,
                Prefix: path,
                MaxKeys: 50,
                Delimiter: path === '' ? '/' : undefined
            }));

            if (result.Contents && result.Contents.length > 0) {
                console.log(`✅ Found ${result.Contents.length} files:`);
                
                const lasFiles = result.Contents.filter(obj => 
                    obj.Key && obj.Key.toLowerCase().endsWith('.las')
                );
                
                if (lasFiles.length > 0) {
                    console.log(`🎯 LAS Files (${lasFiles.length}):`);
                    lasFiles.forEach(file => {
                        console.log(`   - ${file.Key} (${((file.Size || 0) / 1024).toFixed(1)}KB)`);
                    });
                } else {
                    console.log(`📁 Files found but no .las files:`);
                    result.Contents.slice(0, 10).forEach(file => {
                        console.log(`   - ${file.Key} (${((file.Size || 0) / 1024).toFixed(1)}KB)`);
                    });
                }
            } else {
                console.log(`❌ No files found in this path`);
            }

            if (result.CommonPrefixes && result.CommonPrefixes.length > 0) {
                console.log(`📁 Subdirectories:`);
                result.CommonPrefixes.forEach(prefix => {
                    console.log(`   - ${prefix.Prefix}`);
                });
            }

        } catch (error) {
            console.log(`❌ Error checking path "${path}":`, error.message);
        }
    }

    // Now let's specifically look for session-specific data
    console.log(`\n--- Checking for Session-Specific Data ---`);
    try {
        const sessionResult = await s3Client.send(new ListObjectsV2Command({
            Bucket: correctBucketName,
            Prefix: 'chatSessionArtifacts/',
            MaxKeys: 100
        }));

        if (sessionResult.Contents && sessionResult.Contents.length > 0) {
            console.log(`Found ${sessionResult.Contents.length} session files:`);
            
            // Group by session ID and look for LAS files
            const sessionGroups = {};
            let totalLasFiles = 0;
            
            sessionResult.Contents.forEach(obj => {
                if (obj.Key) {
                    const match = obj.Key.match(/sessionId=([^\/]+)/);
                    if (match) {
                        const sessionId = match[1];
                        if (!sessionGroups[sessionId]) {
                            sessionGroups[sessionId] = [];
                        }
                        sessionGroups[sessionId].push(obj);
                        
                        if (obj.Key.toLowerCase().endsWith('.las')) {
                            totalLasFiles++;
                        }
                    }
                }
            });

            console.log(`\n📊 Summary: ${totalLasFiles} total LAS files across all sessions\n`);

            Object.entries(sessionGroups).forEach(([sessionId, files]) => {
                const lasFiles = files.filter(f => f.Key && f.Key.toLowerCase().endsWith('.las'));
                if (lasFiles.length > 0) {
                    console.log(`  Session ${sessionId}: ${files.length} files (${lasFiles.length} LAS)`);
                    lasFiles.forEach(f => console.log(`    🎯 ${f.Key} (${((f.Size || 0) / 1024).toFixed(1)}KB)`));
                } else {
                    console.log(`  Session ${sessionId}: ${files.length} files (no LAS files)`);
                }
            });
        } else {
            console.log(`No session-specific files found`);
        }
    } catch (error) {
        console.log(`Error checking session data:`, error.message);
    }

    console.log(`\n=== VERIFICATION COMPLETE ===`);
    console.log(`\n🎯 CORRECT BUCKET: ${correctBucketName}\n`);
}

// Run the verification
verifyWellDataLocations().catch(console.error);
