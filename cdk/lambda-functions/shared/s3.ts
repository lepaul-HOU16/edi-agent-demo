/**
 * S3 helper utilities
 */

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Create S3 client
const s3Client = new S3Client({});

/**
 * Get object from S3
 */
export async function getObject(bucket: string, key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) {
      throw new Error('Empty response body');
    }

    return body;
  } catch (error) {
    console.error('S3 getObject error:', error);
    throw error;
  }
}

/**
 * Put object to S3
 */
export async function putObject(bucket: string, key: string, body: string | Buffer, contentType?: string): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/json',
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 putObject error:', error);
    throw error;
  }
}

/**
 * Delete object from S3
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 deleteObject error:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for S3 object
 */
export async function getPresignedUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 getPresignedUrl error:', error);
    throw error;
  }
}
