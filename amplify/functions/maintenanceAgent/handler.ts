/**
 * Maintenance Agent Handler
 * AWS Lambda handler for the maintenance planning and equipment monitoring agent
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { MaintenanceStrandsAgent } from './maintenanceStrandsAgent.js';
import { AppSyncResolverEvent } from 'aws-lambda';

type MaintenanceAgentResponse = {
  success: boolean;
  message: string;
  workflow?: any;
  auditTrail?: any;
  artifacts?: any[];
  thoughtSteps?: any[];
  debug?: any;
};

export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<MaintenanceAgentResponse> => {
  console.log('=== MAINTENANCE AGENT INVOKED ===');
  
  try {
    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");

    const s3Bucket = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
    console.log('Processing maintenance message:', event.arguments.message);
    
    const agent = new MaintenanceStrandsAgent(event.arguments.foundationModelId, s3Bucket);
    const response = await agent.processMessage(event.arguments.message);
    console.log('Maintenance agent response:', response);

    // Return comprehensive response with all workflow data
    return {
      success: response.success,
      message: response.message || 'No response generated',
      workflow: response.workflow,
      auditTrail: response.auditTrail,
      artifacts: response.artifacts || [],
      thoughtSteps: response.thoughtSteps || []
    };

  } catch (error) {
    console.error('=== MAINTENANCE HANDLER ERROR ===', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      artifacts: [],
      thoughtSteps: []
    };
  }
};
