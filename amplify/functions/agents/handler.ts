import { EnhancedStrandsAgent } from './enhancedStrandsAgent';
import { AppSyncResolverEvent } from 'aws-lambda';

type LightweightAgentResponse = {
  success: boolean;
  message: string;
  artifacts: any[];
  debug?: any;
};

export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<LightweightAgentResponse> => {
  console.log('=== FULL STRANDS AGENT WITH S3 INTEGRATION INVOKED ===');
  
  try {
    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");

    const s3Bucket = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
    console.log('Processing message:', event.arguments.message);
    
    const agent = new EnhancedStrandsAgent(event.arguments.foundationModelId, s3Bucket);
    const response = await agent.processMessage(event.arguments.message);
    console.log('Agent response:', response);

    // Return the response with artifacts for visualization
    return {
      success: response.success,
      message: response.message || 'No response generated',
      artifacts: response.artifacts || []
    };

  } catch (error) {
    console.error('=== HANDLER ERROR ===', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      artifacts: []
    };
  }
};
