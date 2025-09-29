import { AgentRouter } from './agentRouter';
import { AppSyncResolverEvent } from 'aws-lambda';

type LightweightAgentResponse = {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
  sourceAttribution?: any[];
  agentUsed?: string;
  debug?: any;
};

export const handler = async (event: AppSyncResolverEvent<any>, context: any): Promise<LightweightAgentResponse> => {
  console.log('=== ENHANCED MULTI-AGENT ROUTER INVOKED ===');
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
    
    // Initialize the multi-agent router
    const router = new AgentRouter(event.arguments.foundationModelId, s3Bucket);
    const response = await router.routeQuery(event.arguments.message);
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

    // Return the enhanced response with all new capabilities
    const finalResponse = {
      success: response.success,
      message: response.message || 'No response generated',
      artifacts: response.artifacts || [],
      thoughtSteps: response.thoughtSteps || [], // Pass through thought steps from agent
      sourceAttribution: response.sourceAttribution || [], // Pass through source attribution
      agentUsed: response.agentUsed || 'unknown' // Track which agent was used
    };

    console.log('🏁 HANDLER: Enhanced multi-agent response structure:', {
      success: finalResponse.success,
      messageLength: finalResponse.message?.length || 0,
      artifactCount: finalResponse.artifacts?.length || 0,
      thoughtStepCount: finalResponse.thoughtSteps?.length || 0,
      sourceCount: finalResponse.sourceAttribution?.length || 0,
      agentUsed: finalResponse.agentUsed,
      finalArtifactsType: typeof finalResponse.artifacts,
      finalArtifactsIsArray: Array.isArray(finalResponse.artifacts)
    });

    // CRITICAL: Test final response serialization with new fields
    try {
      const testSerialization = JSON.stringify(finalResponse);
      const testDeserialization = JSON.parse(testSerialization);
      console.log('✅ HANDLER: Enhanced response serializes correctly');
      console.log('🎯 HANDLER: Serialized counts:', {
        artifacts: testDeserialization.artifacts?.length || 0,
        thoughtSteps: testDeserialization.thoughtSteps?.length || 0,
        sources: testDeserialization.sourceAttribution?.length || 0
      });
      
      if (testDeserialization.artifacts && testDeserialization.artifacts.length > 0) {
        console.log('🎉 HANDLER: Artifacts preserved in serialization!');
        console.log('🔍 HANDLER: First serialized artifact keys:', Object.keys(testDeserialization.artifacts[0] || {}));
      }
      
      if (testDeserialization.thoughtSteps && testDeserialization.thoughtSteps.length > 0) {
        console.log('🧠 HANDLER: Thought steps preserved in serialization!');
      }
      
      if (testDeserialization.sourceAttribution && testDeserialization.sourceAttribution.length > 0) {
        console.log('📚 HANDLER: Source attribution preserved in serialization!');
      }
      
    } catch (finalSerializationError) {
      console.error('❌ HANDLER: Enhanced response serialization failed:', finalSerializationError);
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
