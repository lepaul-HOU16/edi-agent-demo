/**
 * Test endpoint to verify renewable configuration
 */

import { NextResponse } from 'next/server';
import { getRenewableConfig } from '@/services/renewable-integration/config';

export async function GET() {
  try {
    const config = getRenewableConfig();
    
    return NextResponse.json({
      success: true,
      config: {
        enabled: config.enabled,
        hasEndpoint: !!config.agentCoreEndpoint,
        endpointLength: config.agentCoreEndpoint?.length || 0,
        hasBucket: !!config.s3Bucket,
        region: config.region
      },
      env: {
        NEXT_PUBLIC_RENEWABLE_ENABLED: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED,
        NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT?.substring(0, 50) + '...',
        NEXT_PUBLIC_RENEWABLE_S3_BUCKET: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET?.substring(0, 30) + '...',
        NEXT_PUBLIC_RENEWABLE_REGION: process.env.NEXT_PUBLIC_RENEWABLE_REGION
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
