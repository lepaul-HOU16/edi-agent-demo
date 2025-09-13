#!/usr/bin/env npx tsx

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from 'fs';
import * as path from 'path';

function getS3Client() {
    return new S3Client();
}

function getBucketName() {
    try {
        const outputs = require('../amplify_outputs.json');
        const bucketName = outputs.storage.bucket_name;
        if (!bucketName) {
            throw new Error("bucket_name not found in amplify_outputs.json");
        }
        return bucketName;
    } catch (error) {
        const envBucketName = process.env.STORAGE_BUCKET_NAME;
        if (!envBucketName) {
            throw new Error("STORAGE_BUCKET_NAME is not set and amplify_outputs.json is not accessible");
        }
        return envBucketName;
    }
}

async function uploadWellContext() {
    try {
        const s3Client = getS3Client();
        const bucketName = getBucketName();
        
        // Read the local well context file
        const localPath = path.join(__dirname, '../global/well-data/well-context.json');
        console.log(`Reading well context from: ${localPath}`);
        
        if (!fs.existsSync(localPath)) {
            throw new Error(`Well context file not found at: ${localPath}`);
        }
        
        const wellContextData = fs.readFileSync(localPath, 'utf8');
        
        // Upload to S3
        const s3Key = 'global/well-data/well-context.json';
        console.log(`Uploading to S3 bucket: ${bucketName}, key: ${s3Key}`);
        
        const putObjectCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: wellContextData,
            ContentType: 'application/json'
        });
        
        const response = await s3Client.send(putObjectCommand);
        console.log('Successfully uploaded well context to S3:', response);
        
        // Verify the upload
        const { GetObjectCommand } = require("@aws-sdk/client-s3");
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key
        });
        
        const verifyResponse = await s3Client.send(getObjectCommand);
        const uploadedData = await verifyResponse.Body?.transformToString();
        
        if (uploadedData) {
            const parsedData = JSON.parse(uploadedData);
            console.log(`Verification successful: Found ${parsedData.wellDatabase?.activeWells?.length || 0} wells in uploaded data`);
        }
        
    } catch (error) {
        console.error('Error uploading well context:', error);
        process.exit(1);
    }
}

// Run the upload
uploadWellContext();