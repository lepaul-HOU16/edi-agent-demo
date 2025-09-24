import { uploadData, downloadData, remove } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

// DynamoDB item size limit is 400KB, we'll use 300KB as safe threshold
const DYNAMODB_SIZE_LIMIT = 300 * 1024; // 300KB in bytes

export interface S3ArtifactReference {
  type: 's3_reference';
  bucket: string;
  key: string;
  size: number;
  contentType: string;
  originalType: string;
  uploadedAt: string;
  chatSessionId: string;
}

export interface ArtifactStorageResult {
  shouldUseS3: boolean;
  artifact: any; // Either original artifact or S3 reference
  sizeBytes: number;
}

/**
 * Calculate the size of an artifact when JSON stringified
 */
export const calculateArtifactSize = (artifact: any): number => {
  try {
    const jsonString = JSON.stringify(artifact);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.error('Error calculating artifact size:', error);
    return 0;
  }
};

/**
 * Determine if an artifact should be stored in S3 based on size
 */
export const shouldStoreInS3 = (artifact: any): boolean => {
  const sizeBytes = calculateArtifactSize(artifact);
  console.log(`📏 Artifact size: ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(2)} KB)`);
  return sizeBytes > DYNAMODB_SIZE_LIMIT;
};

/**
 * Generate a unique S3 key for an artifact
 */
const generateS3Key = (chatSessionId: string, artifactType: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomId = Math.random().toString(36).substring(2, 15);
  // Use the correct path format that matches amplify_outputs.json permissions
  return `chatSessionArtifacts/${chatSessionId}/${artifactType}-${timestamp}-${randomId}.json`;
};

/**
 * Upload an artifact to S3 and return a reference
 */
export const uploadArtifactToS3 = async (
  artifact: any, 
  chatSessionId: string
): Promise<S3ArtifactReference> => {
  try {
    console.log('📤 Uploading large artifact to S3...');
    
    // Calculate size and generate key
    const sizeBytes = calculateArtifactSize(artifact);
    const artifactType = artifact.type || artifact.messageContentType || 'unknown';
    const s3Key = generateS3Key(chatSessionId, artifactType);
    
    // Upload to S3 without access level to use default authenticated user permissions
    const uploadResult = await uploadData({
      key: s3Key,
      data: JSON.stringify(artifact),
      options: {
        contentType: 'application/json',
        metadata: {
          chatSessionId,
          artifactType,
          originalSize: sizeBytes.toString(),
          uploadedBy: 'edi-agent-system'
        }
      }
    }).result;
    
    console.log(`✅ Artifact uploaded to S3: ${s3Key} (${(sizeBytes / 1024).toFixed(2)} KB)`);
    
    // Create S3 reference
    const s3Reference: S3ArtifactReference = {
      type: 's3_reference',
      bucket: 'amplify-storage', // Amplify manages bucket name
      key: s3Key,
      size: sizeBytes,
      contentType: 'application/json',
      originalType: artifactType,
      uploadedAt: new Date().toISOString(),
      chatSessionId
    };
    
    return s3Reference;
  } catch (error) {
    console.error('❌ Failed to upload artifact to S3:', error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Download an artifact from S3 using a reference
 */
export const downloadArtifactFromS3 = async (
  reference: S3ArtifactReference
): Promise<any> => {
  try {
    console.log(`📥 Downloading artifact from S3: ${reference.key}`);
    
    const downloadResult = await downloadData({
      key: reference.key
    }).result;
    
    const artifactJson = await downloadResult.body.text();
    const artifact = JSON.parse(artifactJson);
    
    console.log(`✅ Artifact downloaded from S3: ${reference.key} (${(reference.size / 1024).toFixed(2)} KB)`);
    
    return artifact;
  } catch (error) {
    console.error('❌ Failed to download artifact from S3:', error);
    throw new Error(`S3 download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Optimize artifact for DynamoDB storage by reducing precision/sampling
 */
const optimizeArtifactForDynamoDB = (artifact: any): any => {
  try {
    console.log('🔧 Optimizing large artifact for DynamoDB storage...');
    console.log('🔍 Raw artifact type:', typeof artifact);
    console.log('🔍 Raw artifact (first 200 chars):', JSON.stringify(artifact).substring(0, 200));
    
    // Parse artifact if it's a JSON string
    let parsedArtifact = artifact;
    if (typeof artifact === 'string') {
      try {
        parsedArtifact = JSON.parse(artifact);
        console.log('✅ Parsed artifact from JSON string');
      } catch (parseError) {
        console.error('❌ Failed to parse artifact JSON:', parseError);
        return artifact;
      }
    }
    
    console.log('🔍 Parsed artifact keys:', Object.keys(parsedArtifact || {}));
    console.log('🔍 Parsed artifact type:', parsedArtifact?.type || parsedArtifact?.messageContentType);
    
    // Create a copy to avoid mutating the original
    const optimizedArtifact = JSON.parse(JSON.stringify(parsedArtifact));
    
    // Enhanced detection for log plot viewer artifacts
    const isLogPlotViewer = (optimizedArtifact.type === 'logPlotViewer' || 
                            optimizedArtifact.messageContentType === 'log_plot_viewer') &&
                           optimizedArtifact.logData;
    
    if (isLogPlotViewer) {
      console.log('🎯 Detected log plot viewer artifact, processing logData...');
      console.log('🔍 LogData keys:', Object.keys(optimizedArtifact.logData || {}));
      
      let dataReduced = false;
      let totalOriginalPoints = 0;
      let totalReducedPoints = 0;
      
      Object.keys(optimizedArtifact.logData).forEach(curveType => {
        const curveData = optimizedArtifact.logData[curveType];
        
        if (Array.isArray(curveData)) {
          totalOriginalPoints = Math.max(totalOriginalPoints, curveData.length);
          
          if (curveData.length > 1000) {
            // Sample every 8th data point for more aggressive size reduction
            const sampledData = curveData.filter((_, index) => index % 8 === 0);
            optimizedArtifact.logData[curveType] = sampledData;
            dataReduced = true;
            totalReducedPoints = Math.max(totalReducedPoints, sampledData.length);
            
            console.log(`🔧 Sampled ${curveType}: ${curveData.length} → ${sampledData.length} points (${((sampledData.length / curveData.length) * 100).toFixed(1)}% retained)`);
          } else {
            console.log(`📝 ${curveType}: ${curveData.length} points (no sampling needed)`);
          }
        } else {
          console.log(`⚠️ ${curveType}: Not an array (${typeof curveData})`);
        }
      });
      
        if (dataReduced) {
          // Update summary to reflect optimization
          if (optimizedArtifact.summary) {
            optimizedArtifact.summary.totalDataPoints = totalReducedPoints;
            optimizedArtifact.summary.optimized = true;
            optimizedArtifact.summary.originalDataPoints = totalOriginalPoints;
            optimizedArtifact.summary.optimization = 'Sampled every 8th point for DynamoDB compatibility';
          }
          
          // Ensure the optimized artifact can be properly serialized as JSON string for AWSJSON
          try {
            const testSerialization = JSON.stringify(optimizedArtifact);
            const testDeserialization = JSON.parse(testSerialization);
            
            // Verify the deserialized version maintains structure
            if (testDeserialization && typeof testDeserialization === 'object') {
              console.log(`✅ Artifact optimized: ${totalOriginalPoints} → ${totalReducedPoints} points (${((totalReducedPoints / totalOriginalPoints) * 100).toFixed(1)}% retention)`);
              console.log('✅ Optimized artifact serialization validated');
              
              // Return as JSON string to ensure AWSJSON compatibility
              return JSON.stringify(optimizedArtifact);
            } else {
              console.error('❌ Optimized artifact failed serialization validation');
              return JSON.stringify(parsedArtifact); // Return original as string
            }
          } catch (serializationError) {
            console.error('❌ Optimized artifact serialization error:', serializationError);
            return JSON.stringify(parsedArtifact); // Return original as string
          }
        } else {
          console.log('⚠️ No data arrays found to optimize');
        }
    } else {
      console.log('⚠️ Not a log plot viewer artifact, checking for other optimizable data...');
      
      // Try to optimize any large arrays in the artifact
      let dataReduced = false;
      
      const optimizeObject = (obj: any, path: string = '') => {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value) && value.length > 1000) {
            const sampledData = value.filter((_, index) => index % 8 === 0);
            obj[key] = sampledData;
            dataReduced = true;
            console.log(`🔧 Sampled array at ${currentPath}: ${value.length} → ${sampledData.length} items`);
          } else if (typeof value === 'object' && value !== null) {
            optimizeObject(value, currentPath);
          }
        });
      };
      
      optimizeObject(optimizedArtifact);
      
      if (dataReduced) {
        console.log('✅ Generic array optimization applied');
        return optimizedArtifact;
      }
    }
    
    // If no optimization was applied, return original as JSON string for consistency
    console.log('⚠️ No optimization applied - artifact may still be too large');
    try {
      return JSON.stringify(parsedArtifact);
    } catch (stringifyError) {
      console.error('❌ Failed to stringify original artifact:', stringifyError);
      return artifact; // Return original on error
    }
  } catch (error) {
    console.error('❌ Error optimizing artifact:', error);
    try {
      return JSON.stringify(artifact); // Return original as string on error
    } catch (stringifyError) {
      return artifact; // Final fallback
    }
  }
};

/**
 * Process artifacts for storage - route large ones to S3, keep small ones inline
 */
export const processArtifactsForStorage = async (
  artifacts: any[],
  chatSessionId: string
): Promise<ArtifactStorageResult[]> => {
  if (!artifacts || artifacts.length === 0) {
    return [];
  }
  
  console.log(`📦 Processing ${artifacts.length} artifacts for storage...`);
  
  const results: ArtifactStorageResult[] = [];
  
  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    const sizeBytes = calculateArtifactSize(artifact);
    const useS3 = shouldStoreInS3(artifact);
    
    if (useS3) {
      console.log(`📤 Artifact ${i + 1} is large (${(sizeBytes / 1024).toFixed(2)} KB), attempting S3 upload...`);
      try {
        const s3Reference = await uploadArtifactToS3(artifact, chatSessionId);
        results.push({
          shouldUseS3: true,
          artifact: s3Reference,
          sizeBytes
        });
      } catch (error) {
        console.error(`❌ S3 upload failed for artifact ${i + 1}:`, error);
        console.log(`🔧 Attempting data optimization for DynamoDB compatibility...`);
        
        // Try to optimize the artifact for DynamoDB
        const optimizedArtifact = optimizeArtifactForDynamoDB(artifact);
        const optimizedSize = calculateArtifactSize(optimizedArtifact);
        
        console.log(`📏 Optimized artifact size: ${(optimizedSize / 1024).toFixed(2)} KB`);
        
        if (optimizedSize < DYNAMODB_SIZE_LIMIT) {
          console.log(`✅ Optimization successful, using optimized artifact inline`);
          results.push({
            shouldUseS3: false,
            artifact: optimizedArtifact,
            sizeBytes: optimizedSize
          });
        } else {
          console.log(`⚠️ Artifact still too large after optimization, using as-is (may fail)`);
          // Last resort: keep original inline (may fail, but preserves data)
          results.push({
            shouldUseS3: false,
            artifact,
            sizeBytes
          });
        }
      }
    } else {
      console.log(`📝 Artifact ${i + 1} is small (${(sizeBytes / 1024).toFixed(2)} KB), keeping inline`);
      results.push({
        shouldUseS3: false,
        artifact,
        sizeBytes
      });
    }
  }
  
  console.log(`✅ Processed ${results.length} artifacts for storage`);
  return results;
};

/**
 * Retrieve artifacts - download S3 references, return inline artifacts as-is
 */
export const retrieveArtifacts = async (
  storedArtifacts: any[]
): Promise<any[]> => {
  if (!storedArtifacts || storedArtifacts.length === 0) {
    return [];
  }
  
  console.log(`📥 Retrieving ${storedArtifacts.length} artifacts...`);
  
  const retrievedArtifacts = [];
  
  for (let i = 0; i < storedArtifacts.length; i++) {
    const storedArtifact = storedArtifacts[i];
    
    if (storedArtifact && storedArtifact.type === 's3_reference') {
      console.log(`📥 Artifact ${i + 1} is S3 reference, downloading...`);
      try {
        const downloadedArtifact = await downloadArtifactFromS3(storedArtifact as S3ArtifactReference);
        retrievedArtifacts.push(downloadedArtifact);
      } catch (error) {
        console.error(`❌ Failed to download artifact ${i + 1} from S3:`, error);
        // Return a placeholder to maintain array structure
        retrievedArtifacts.push({
          type: 'error',
          message: 'Failed to load artifact from storage',
          originalReference: storedArtifact
        });
      }
    } else {
      // Inline artifact, return as-is
      retrievedArtifacts.push(storedArtifact);
    }
  }
  
  console.log(`✅ Retrieved ${retrievedArtifacts.length} artifacts`);
  return retrievedArtifacts;
};

/**
 * Clean up S3 artifacts when a message is deleted (optional cleanup)
 */
export const cleanupS3Artifacts = async (artifacts: any[]): Promise<void> => {
  if (!artifacts || artifacts.length === 0) {
    return;
  }
  
  const s3References = artifacts.filter(artifact => 
    artifact && artifact.type === 's3_reference'
  ) as S3ArtifactReference[];
  
  if (s3References.length === 0) {
    return;
  }
  
  console.log(`🗑️ Cleaning up ${s3References.length} S3 artifacts...`);
  
  for (const reference of s3References) {
    try {
      await remove({ key: reference.key });
      console.log(`✅ Deleted S3 artifact: ${reference.key}`);
    } catch (error) {
      console.error(`❌ Failed to delete S3 artifact ${reference.key}:`, error);
      // Don't throw - cleanup is best effort
    }
  }
};

/**
 * Get storage statistics for monitoring
 */
export const getStorageStats = (artifacts: any[]): {
  totalArtifacts: number;
  inlineArtifacts: number;
  s3Artifacts: number;
  totalInlineSize: number;
  estimatedS3Size: number;
} => {
  if (!artifacts || artifacts.length === 0) {
    return {
      totalArtifacts: 0,
      inlineArtifacts: 0,
      s3Artifacts: 0,
      totalInlineSize: 0,
      estimatedS3Size: 0
    };
  }
  
  let inlineArtifacts = 0;
  let s3Artifacts = 0;
  let totalInlineSize = 0;
  let estimatedS3Size = 0;
  
  artifacts.forEach(artifact => {
    if (artifact && artifact.type === 's3_reference') {
      s3Artifacts++;
      estimatedS3Size += (artifact as S3ArtifactReference).size;
    } else {
      inlineArtifacts++;
      totalInlineSize += calculateArtifactSize(artifact);
    }
  });
  
  return {
    totalArtifacts: artifacts.length,
    inlineArtifacts,
    s3Artifacts,
    totalInlineSize,
    estimatedS3Size
  };
};
