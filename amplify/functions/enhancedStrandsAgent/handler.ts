/**
 * Enhanced Strands Agent Handler
 * AWS Lambda handler for the enhanced petrophysical analysis agent
 * Requirements: 2.1, 2.2, 2.8, 4.1, 6.7, 7.3
 */

import { EnhancedStrandsAgent } from '../agents/enhancedStrandsAgent';
import { AppSyncResolverEvent } from 'aws-lambda';

type EnhancedAgentResponse = {
  success: boolean;
  message: string;
  workflow?: any;
  correlationAnalysis?: any;
  methodology?: any;
  auditTrail?: any;
  artifacts?: any[];
  debug?: any;
};

export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<EnhancedAgentResponse> => {
  console.log('=== ENHANCED STRANDS AGENT WITH PETROPHYSICAL EXPERTISE INVOKED ===');
  
  try {
    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");

    const s3Bucket = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
    console.log('Processing enhanced message:', event.arguments.message);
    
    const agent = new EnhancedStrandsAgent(event.arguments.foundationModelId, s3Bucket);
    const response = await agent.processMessage(event.arguments.message);
    console.log('Enhanced agent response:', response);

    // Return comprehensive response with all workflow data
    return {
      success: response.success,
      message: response.message || 'No response generated',
      workflow: response.workflow,
      correlationAnalysis: response.correlationAnalysis,
      methodology: response.methodology,
      auditTrail: response.auditTrail,
      artifacts: response.artifacts || []
    };

  } catch (error) {
    console.error('=== ENHANCED HANDLER ERROR ===', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      artifacts: []
    };
  }
};