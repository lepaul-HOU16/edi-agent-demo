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
  console.log('Event arguments:', JSON.stringify(event.arguments, null, 2));
  console.log('Event identity:', JSON.stringify(event.identity, null, 2));
  
  try {
    // Try to get userId from multiple sources with fallback
    let userId = event.arguments.userId;
    
    if (!userId && event.identity) {
      if ('sub' in event.identity) {
        userId = event.identity.sub;
      } else if ('cognitoIdentityId' in event.identity) {
        userId = (event.identity as any).cognitoIdentityId;
      } else if ('username' in event.identity) {
        userId = (event.identity as any).username;
      }
    }
    
    // If still no userId, use a fallback but log the issue
    if (!userId) {
      console.warn('No userId found, using anonymous fallback');
      userId = 'anonymous-user-' + Date.now();
    }
    
    console.log('Using userId:', userId);

    const s3Bucket = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
    console.log('Processing message:', event.arguments.message);
    console.log('Foundation Model ID:', event.arguments.foundationModelId);
    
    const agent = new EnhancedStrandsAgent(event.arguments.foundationModelId, s3Bucket);
    const response = await agent.processMessage(event.arguments.message);
    console.log('🔍 HANDLER: Agent response received:', {
      success: response.success,
      messageLength: response.message?.length || 0,
      artifactCount: response.artifacts?.length || 0,
      hasArtifacts: Array.isArray(response.artifacts),
      artifactTypes: response.artifacts?.map((a: any) => a.messageContentType || 'unknown') || []
    });

    // ENHANCED: Deep artifact analysis and serialization testing
    if (response.artifacts && response.artifacts.length > 0) {
      console.log('🎯 HANDLER: Artifacts being returned:', response.artifacts.length);
      console.log('🔍 HANDLER: First artifact structure:', {
        hasMessageContentType: !!response.artifacts[0]?.messageContentType,
        hasAnalysisType: !!response.artifacts[0]?.analysisType,
        keys: Object.keys(response.artifacts[0] || {})
      });
      
      // Test JSON serialization of artifacts
      try {
        const serializedArtifacts = JSON.stringify(response.artifacts);
        const deserializedArtifacts = JSON.parse(serializedArtifacts);
        console.log('✅ HANDLER: Artifacts survive JSON serialization');
        console.log('🔍 HANDLER: Deserialized artifact count:', deserializedArtifacts.length);
      } catch (serializationError) {
        console.error('❌ HANDLER: Artifact serialization failed:', serializationError);
        console.error('🔍 HANDLER: Non-serializable artifact detected');
        // Filter out non-serializable properties
        response.artifacts = response.artifacts.map(artifact => {
          try {
            JSON.stringify(artifact);
            return artifact;
          } catch {
            console.warn('⚠️ HANDLER: Removing non-serializable artifact');
            return null;
          }
        }).filter(Boolean);
      }
    } else {
      console.log('⚠️ HANDLER: No artifacts in agent response');
    }

    // Return the response with artifacts and thought steps for visualization
    const finalResponse = {
      success: response.success,
      message: response.message || 'No response generated',
      artifacts: response.artifacts || [],
      thoughtSteps: response.thoughtSteps || [] // Pass through thought steps from agent
    };

    console.log('🏁 HANDLER: Final response structure:', {
      success: finalResponse.success,
      messageLength: finalResponse.message?.length || 0,
      artifactCount: finalResponse.artifacts?.length || 0,
      finalArtifactsType: typeof finalResponse.artifacts,
      finalArtifactsIsArray: Array.isArray(finalResponse.artifacts)
    });

    // CRITICAL: Test final response serialization
    try {
      const testSerialization = JSON.stringify(finalResponse);
      const testDeserialization = JSON.parse(testSerialization);
      console.log('✅ HANDLER: Final response serializes correctly');
      console.log('🎯 HANDLER: Serialized artifact count:', testDeserialization.artifacts?.length || 0);
      
      if (testDeserialization.artifacts && testDeserialization.artifacts.length > 0) {
        console.log('🎉 HANDLER: Artifacts preserved in serialization!');
        console.log('🔍 HANDLER: First serialized artifact keys:', Object.keys(testDeserialization.artifacts[0] || {}));
      } else {
        console.log('💥 HANDLER: ARTIFACTS LOST DURING SERIALIZATION!');
      }
    } catch (finalSerializationError) {
      console.error('❌ HANDLER: Final response serialization failed:', finalSerializationError);
    }

    return finalResponse;

  } catch (error) {
    console.error('=== HANDLER ERROR ===', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      artifacts: []
    };
  }
};
