import { NextResponse } from 'next/server';
import outputs from '@/../amplify_outputs.json';
import { getUrl } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';

interface PageProps {
  params: {
    s3Key: string[];
  };
}

// Set cache control headers to prevent caching large files
export const dynamic = 'force-dynamic'; // Disable static optimization

export async function GET(request: Request, { params }: PageProps) {
  try {
    // return NextResponse.json({hello: "world"})
    const s3Key = params.s3Key.join('/');
    const s3KeyDecoded = s3Key.split('/').map((item: string) => decodeURIComponent(item)).join('/');

    // Configure Amplify with storage configuration
    Amplify.configure(outputs, { ssr: true })

    // Get a signed URL using Amplify Storage
    const { url: signedUrl } = await getUrl({ path: s3KeyDecoded });

    console.log('Signed URL: ', signedUrl)

    const fileResponse = await fetch(signedUrl);
    
    // Create a new response with the file content and no-cache headers
    const response = new NextResponse(fileResponse.body, {
      status: fileResponse.status,
      statusText: fileResponse.statusText,
      headers: {
        ...Object.fromEntries(fileResponse.headers),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    return response;

    // // Redirect to the signed URL for direct file access
    // return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    );
  }
}
