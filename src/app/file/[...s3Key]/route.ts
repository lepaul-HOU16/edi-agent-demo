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
    
    // Get the file extension to determine content type
    const fileExtension = s3KeyDecoded.split('.').pop()?.toLowerCase();
    
    // Create headers with appropriate content type for HTML files
    const headers: Record<string, string> = {
      ...Object.fromEntries(fileResponse.headers),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Ensure HTML files have the correct content type
    if (fileExtension === 'html') {
      headers['Content-Type'] = 'text/html; charset=utf-8';
      console.log('Setting Content-Type for HTML file:', headers['Content-Type']);
    }
    
    // Create a new response with the file content and headers
    const response = new NextResponse(fileResponse.body, {
      status: fileResponse.status,
      statusText: fileResponse.statusText,
      headers: headers,
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
