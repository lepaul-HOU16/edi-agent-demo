/**
 * API Route: Wind Data
 * 
 * Proxies requests to the renewable tools Lambda function
 */

import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: process.env.RENEWABLE_TOOLS_FUNCTION_NAME || 'renewableTools',
      Payload: JSON.stringify(body),
    });
    
    const response = await lambda.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    return NextResponse.json(JSON.parse(result.body));
    
  } catch (error: any) {
    console.error('Error calling renewable tools:', error);
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
