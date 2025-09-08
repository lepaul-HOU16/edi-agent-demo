import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const s3Key = url.searchParams.get('key');
    
    if (!s3Key) {
      return NextResponse.json({ error: 'Missing s3Key parameter' }, { status: 400 });
    }

    console.log(`[Debug] Checking file content for: ${s3Key}`);

    // Load configuration
    const outputs = require('@/../amplify_outputs.json');
    const bucketName = outputs.storage.bucket_name;
    const region = outputs.storage.aws_region;

    // Initialize S3 client
    const s3Client = new S3Client({ region });

    // Create S3 command to get the object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (response.Body) {
      const content = await response.Body.transformToString();
      
      return NextResponse.json({
        success: true,
        s3Key,
        contentLength: content.length,
        contentPreview: content.substring(0, 500),
        isEmpty: content.trim().length === 0,
        hasHtmlTags: content.includes('<html>') || content.includes('<!DOCTYPE'),
        hasPlotlyContent: content.includes('plotly') || content.includes('Plotly'),
        contentType: response.ContentType
      });
    } else {
      return NextResponse.json({
        error: 'No content body in S3 response',
        s3Key
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Debug] Error checking file content:', error);
    return NextResponse.json({
      error: 'Failed to check file content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
