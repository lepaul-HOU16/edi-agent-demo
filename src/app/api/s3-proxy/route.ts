import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// S3 client will use default credential chain
// Local: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN from env
// Deployed: IAM role credentials automatically
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1'
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const key = searchParams.get('key');

    if (!bucket || !key) {
      console.error('❌ Missing parameters:', { bucket, key });
      return NextResponse.json(
        { error: 'Missing bucket or key parameter' },
        { status: 400 }
      );
    }

    console.log(`📥 S3 Proxy: Fetching s3://${bucket}/${key}`);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToString();

    if (!body) {
      console.error('❌ Empty response from S3');
      return NextResponse.json(
        { error: 'Empty response from S3' },
        { status: 500 }
      );
    }

    console.log(`✅ S3 Proxy: Successfully fetched ${body.length} bytes`);

    // Parse and return JSON
    const data = JSON.parse(body);
    console.log(`✅ S3 Proxy: Parsed JSON with ${data.features?.length || 0} features`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ S3 proxy error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch from S3',
        code: error.code,
        details: error.name
      },
      { status: 500 }
    );
  }
}
