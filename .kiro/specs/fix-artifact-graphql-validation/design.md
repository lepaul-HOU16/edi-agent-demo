# Design Document

## Overview

This design addresses the critical artifact storage regression where renewable energy terrain analysis artifacts fail to save due to GraphQL validation errors. The solution involves proper JSON serialization of artifacts before passing them to GraphQL mutations, while maintaining backward compatibility with existing features.

## Architecture

### Current Flow (Broken)
```
Agent generates artifacts (JS objects)
  ↓
processArtifactsForStorage() attempts S3 upload
  ↓ (S3 fails due to IAM permissions)
optimizeArtifactForDynamoDB() returns JS object
  ↓
GraphQL mutation receives JS objects in array
  ↓
❌ GraphQL validation fails: "Variable 'artifacts' has an invalid value"
```

### Fixed Flow
```
Agent generates artifacts (JS objects)
  ↓
processArtifactsForStorage() attempts S3 upload
  ↓ (S3 fails due to IAM permissions)
optimizeArtifactForDynamoDB() returns JSON string
  ↓
serializeArtifactsForGraphQL() ensures all artifacts are JSON strings
  ↓
GraphQL mutation receives JSON strings in array
  ↓
✅ GraphQL validation succeeds
  ↓
Frontend retrieves artifacts
  ↓
deserializeArtifactsFromGraphQL() converts JSON strings back to JS objects
  ↓
Components receive JS objects (backward compatible)
```

## Components and Interfaces

### 1. Artifact Serialization Layer

**Location:** `utils/s3ArtifactStorage.ts`

**New Functions:**

```typescript
/**
 * Serialize artifacts to JSON strings for GraphQL AWSJSON type
 * Ensures all artifacts are valid JSON strings before GraphQL mutation
 */
export const serializeArtifactsForGraphQL = (artifacts: any[]): string[] => {
  // Convert each artifact to JSON string
  // Handle already-stringified artifacts
  // Validate JSON structure
  // Return array of JSON strings
}

/**
 * Deserialize artifacts from JSON strings after GraphQL query
 * Converts JSON strings back to JavaScript objects for components
 */
export const deserializeArtifactsFromGraphQL = (artifacts: any[]): any[] => {
  // Parse each JSON string to object
  // Handle already-parsed artifacts (backward compatibility)
  // Validate object structure
  // Return array of JavaScript objects
}
```

### 2. Updated Optimization Function

**Location:** `utils/s3ArtifactStorage.ts`

**Changes to `optimizeArtifactForDynamoDB()`:**

```typescript
const optimizeArtifactForDynamoDB = (artifact: any): string => {
  // ALWAYS return JSON string, never JavaScript object
  // Parse input if it's already a string
  // Apply optimization (sampling, precision reduction)
  // Validate serialization
  // Return JSON string
}
```

### 3. Updated Storage Processing

**Location:** `utils/s3ArtifactStorage.ts`

**Changes to `processArtifactsForStorage()`:**

```typescript
export const processArtifactsForStorage = async (
  artifacts: any[],
  chatSessionId: string
): Promise<ArtifactStorageResult[]> => {
  // Process each artifact
  // For S3: upload and return reference (as JSON string)
  // For inline: optimize and return JSON string
  // Ensure all results are JSON strings
  // Return array of JSON strings
}
```

### 4. Updated Message Creation

**Location:** `utils/amplifyUtils.ts`

**Changes to `sendMessage()`:**

```typescript
// After processArtifactsForStorage()
const processedArtifacts = storageResults.map(result => result.artifact);

// NEW: Serialize artifacts for GraphQL
const serializedArtifacts = serializeArtifactsForGraphQL(processedArtifacts);

const aiMessage: Schema['ChatMessage']['createType'] = {
  // ... other fields
  artifacts: serializedArtifacts.length > 0 ? serializedArtifacts : undefined,
};
```

### 5. Frontend Artifact Retrieval

**Location:** `src/components/ChatMessage.tsx` or similar

**New Hook:**

```typescript
/**
 * Hook to automatically deserialize artifacts when messages are loaded
 */
const useDeserializedArtifacts = (message: Message) => {
  return useMemo(() => {
    if (!message.artifacts || message.artifacts.length === 0) {
      return [];
    }
    return deserializeArtifactsFromGraphQL(message.artifacts);
  }, [message.artifacts]);
};
```

## Data Models

### Artifact Storage Result

```typescript
export interface ArtifactStorageResult {
  shouldUseS3: boolean;
  artifact: string; // CHANGED: Always JSON string, not any
  sizeBytes: number;
}
```

### S3 Artifact Reference

```typescript
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
// When stored in GraphQL, this is JSON.stringify(S3ArtifactReference)
```

## Error Handling

### 1. Serialization Errors

```typescript
try {
  const jsonString = JSON.stringify(artifact);
  // Validate it can be parsed back
  JSON.parse(jsonString);
  return jsonString;
} catch (error) {
  console.error('❌ Artifact serialization failed:', {
    artifactType: artifact?.type || artifact?.messageContentType,
    error: error.message
  });
  throw new Error(`Artifact serialization failed: ${error.message}`);
}
```

### 2. GraphQL Validation Errors

```typescript
if (errors && errors.length > 0) {
  console.error('❌ GraphQL validation errors:', {
    errors: errors.map(e => e.message),
    artifactCount: artifacts?.length,
    artifactSizes: artifacts?.map(a => calculateArtifactSize(a))
  });
  throw new Error(`GraphQL validation failed: ${errors[0].message}`);
}
```

### 3. Deserialization Errors

```typescript
try {
  return JSON.parse(artifactString);
} catch (error) {
  console.error('❌ Artifact deserialization failed:', {
    artifactPreview: artifactString.substring(0, 100),
    error: error.message
  });
  // Return error placeholder to maintain array structure
  return {
    type: 'error',
    message: 'Failed to parse artifact',
    originalData: artifactString
  };
}
```

## IAM Permissions Fix

### Current Issue

```
User: arn:aws:sts::484907533441:assumed-role/amplify-digitalassistant--amplifyAuthauthenticatedU-CpmUTNFjVufV/CognitoIdentityCredentials 
is not authorized to perform: s3:PutObject 
on resource: "arn:aws:s3:::amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/public/chatSessionArtifacts/..."
```

### Solution

**Location:** `amplify/backend.ts`

```typescript
import { aws_iam as iam } from 'aws-cdk-lib';

// Add S3 permissions to authenticated user role
backend.auth.resources.authenticatedUserIamRole.addToPolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      's3:PutObject',
      's3:GetObject',
      's3:DeleteObject'
    ],
    resources: [
      `${backend.storage.resources.bucket.bucketArn}/chatSessionArtifacts/*`
    ]
  })
);
```

## Testing Strategy

### Unit Tests

1. **Serialization Tests** (`utils/__tests__/s3ArtifactStorage.test.ts`)
   - Test `serializeArtifactsForGraphQL()` with various artifact types
   - Test handling of already-stringified artifacts
   - Test error handling for non-serializable objects

2. **Deserialization Tests**
   - Test `deserializeArtifactsFromGraphQL()` with JSON strings
   - Test handling of already-parsed objects (backward compatibility)
   - Test error handling for invalid JSON

3. **Optimization Tests**
   - Test `optimizeArtifactForDynamoDB()` returns JSON string
   - Test optimization reduces size below 300KB threshold
   - Test optimized artifacts can be parsed back to objects

### Integration Tests

1. **End-to-End Artifact Flow** (`tests/integration/artifact-storage.test.ts`)
   - Create message with large artifacts
   - Verify artifacts are serialized correctly
   - Verify GraphQL mutation succeeds
   - Retrieve message and verify artifacts are deserialized
   - Verify components receive JavaScript objects

2. **Renewable Energy Terrain Analysis** (`tests/integration/renewable-terrain.test.ts`)
   - Request terrain analysis for coordinates
   - Verify 60 terrain features are generated
   - Verify artifacts are saved to database
   - Verify terrain map is displayed correctly

3. **S3 Upload Flow** (when permissions are fixed)
   - Create message with very large artifact (>300KB)
   - Verify S3 upload succeeds
   - Verify S3 reference is stored in database
   - Retrieve message and verify artifact is downloaded from S3

### Manual Testing

1. **Renewable Energy Workflow**
   - Navigate to chat interface
   - Enter: "Analyze terrain for wind farm at 35.067482, -101.395466"
   - Verify: Terrain analysis completes successfully
   - Verify: Terrain map with 60 features is displayed
   - Verify: No GraphQL validation errors in console

2. **Existing Features**
   - Test petrophysical analysis (porosity, shale volume)
   - Test log plot viewer
   - Test multi-well correlation
   - Verify: All existing features continue to work

## Migration Strategy

### Phase 1: Fix Serialization (Immediate)
1. Add `serializeArtifactsForGraphQL()` function
2. Add `deserializeArtifactsFromGraphQL()` function
3. Update `optimizeArtifactForDynamoDB()` to return JSON string
4. Update `sendMessage()` to serialize artifacts before GraphQL mutation
5. Deploy and test renewable energy terrain analysis

### Phase 2: Fix IAM Permissions (Next)
1. Update `amplify/backend.ts` with S3 permissions
2. Deploy backend changes
3. Test S3 upload flow
4. Verify large artifacts are stored in S3

### Phase 3: Add Frontend Deserialization (Final)
1. Create `useDeserializedArtifacts` hook
2. Update components to use hook
3. Test all artifact types
4. Verify backward compatibility

## Rollback Plan

If the fix causes issues:

1. **Immediate Rollback:**
   - Revert `utils/s3ArtifactStorage.ts` changes
   - Revert `utils/amplifyUtils.ts` changes
   - Deploy previous version

2. **Partial Rollback:**
   - Keep serialization functions but don't use them
   - Add feature flag to enable/disable new serialization
   - Test in sandbox before production

3. **Data Recovery:**
   - Existing messages are not affected (already in database)
   - New messages will fail gracefully with error message
   - No data loss occurs

## Performance Considerations

### Serialization Overhead

- JSON.stringify() is fast for most artifacts (<1ms)
- Large artifacts (>1MB) may take 5-10ms to serialize
- Caching serialized artifacts is not necessary (one-time operation)

### Deserialization Overhead

- JSON.parse() is fast for most artifacts (<1ms)
- Use `useMemo()` to avoid re-parsing on every render
- Consider lazy loading for very large artifact arrays

### Memory Usage

- Serialized artifacts use slightly more memory (JSON string + object)
- Temporary during mutation, garbage collected after
- No significant impact on overall memory usage

## Security Considerations

### S3 Permissions

- Limit permissions to `chatSessionArtifacts/*` path only
- Use authenticated user role (no public access)
- Consider adding bucket policies for additional security

### Artifact Validation

- Validate artifact structure before serialization
- Sanitize artifact data to prevent XSS
- Limit artifact size to prevent DoS

### Error Messages

- Don't expose sensitive information in error messages
- Log detailed errors server-side only
- Show user-friendly messages in UI

## Success Metrics

### Functional Metrics

- ✅ Renewable energy terrain analysis completes successfully
- ✅ Artifacts are saved to database without GraphQL errors
- ✅ Terrain map displays 60 features correctly
- ✅ Existing features (petrophysical analysis) continue to work

### Performance Metrics

- Artifact serialization time: <10ms for 95th percentile
- GraphQL mutation time: <500ms for 95th percentile
- Frontend deserialization time: <5ms for 95th percentile
- No increase in memory usage (within 5% of baseline)

### Error Metrics

- GraphQL validation errors: 0 (down from 100%)
- S3 upload errors: <5% (after IAM fix)
- Artifact serialization errors: <0.1%
- User-facing errors: <1%
