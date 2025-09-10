import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from 'fs';
import path from "path";
import fs from "fs";
import outputs from '../amplify_outputs.json';

const s3Client = new S3Client({ region: outputs.storage.aws_region });

const uploadLasFileToS3 = async (filePath: string, bucketName: string, s3Key: string) => {
    console.log(`Uploading ${filePath} to s3://${bucketName}/${s3Key}`);
    
    const fileStream = createReadStream(filePath);
    
    const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'text/plain'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Successfully uploaded ${path.basename(filePath)}`);
};

const main = async () => {
    const storageBucketName = outputs.storage.bucket_name;
    const scriptsDir = __dirname;
    
    // Find all LAS files in the scripts directory
    const lasFiles = fs.readdirSync(scriptsDir)
        .filter(file => file.endsWith('.las'))
        .map(file => path.join(scriptsDir, file));
    
    if (lasFiles.length === 0) {
        console.log("No LAS files found in scripts directory");
        return;
    }
    
    console.log(`Found ${lasFiles.length} LAS files to upload:`);
    lasFiles.forEach(file => console.log(`  - ${path.basename(file)}`));
    
    // Upload each LAS file to the global/well-data directory
    for (const lasFile of lasFiles) {
        const fileName = path.basename(lasFile);
        const s3Key = `global/well-data/${fileName}`;
        
        try {
            await uploadLasFileToS3(lasFile, storageBucketName, s3Key);
        } catch (error) {
            console.error(`❌ Error uploading ${fileName}:`, error);
        }
    }
    
    console.log("\n🎯 Upload complete! Your wells should now be visible to the agent.");
    console.log("The agent should be able to find them using:");
    console.log("  - searchFiles({\"filePattern\": \".*\\.las$\"})");  
    console.log("  - listFiles(\"global/well-data\")");
};

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
