# Implementation Plan

- [x] 1. Add artifact serialization functions to s3ArtifactStorage.ts
  - Create `serializeArtifactsForGraphQL()` function that converts artifacts to JSON strings
  - Create `deserializeArtifactsFromGraphQL()` function that parses JSON strings back to objects
  - Add validation to ensure artifacts can be serialized and deserialized correctly
  - Handle edge cases: already-stringified artifacts, null/undefined values, circular references
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 2. Update optimizeArtifactForDynamoDB to return JSON string
  - Modify function signature to return `string` instead of `any`
  - Ensure all code paths return JSON.stringify() result
  - Add validation that optimized artifact can be parsed back
  - Update error handling to log serialization failures
  - _Requirements: 1.4, 1.5, 5.1_

- [x] 3. Update processArtifactsForStorage to handle JSON strings
  - Modify `ArtifactStorageResult` interface to use `artifact: string`
  - Ensure S3 references are serialized to JSON strings
  - Ensure inline artifacts are serialized to JSON strings
  - Update fallback logic to produce JSON strings
  - _Requirements: 1.1, 1.5, 3.2, 3.3_

- [x] 4. Update sendMessage in amplifyUtils.ts to serialize artifacts
  - Call `serializeArtifactsForGraphQL()` after `processArtifactsForStorage()`
  - Pass serialized artifacts to GraphQL mutation
  - Add logging to show artifact serialization success
  - Add error handling for serialization failures
  - _Requirements: 1.1, 1.2, 5.2_

- [x] 5. Fix IAM permissions for S3 uploads in amplify/backend.ts
  - Import aws_iam from aws-cdk-lib
  - Add PolicyStatement for s3:PutObject, s3:GetObject, s3:DeleteObject
  - Target chatSessionArtifacts/* path in storage bucket
  - Apply to authenticatedUserIamRole
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Add frontend deserialization for retrieved artifacts
  - Create `useDeserializedArtifacts` hook in src/hooks/
  - Use `deserializeArtifactsFromGraphQL()` to parse artifacts
  - Add memoization to avoid re-parsing on every render
  - Handle errors gracefully with placeholder artifacts
  - _Requirements: 1.3, 2.3, 2.4_

- [x] 7. Update artifact-consuming components to use deserialization hook
  - Update ChatMessage.tsx to use `useDeserializedArtifacts`
  - Update TerrainMapArtifact.tsx if needed
  - Update other artifact components as needed
  - Verify components receive JavaScript objects, not JSON strings
  - _Requirements: 2.3, 2.4_

- [ ] 8. Write unit tests for serialization functions
  - Test `serializeArtifactsForGraphQL()` with various artifact types
  - Test `deserializeArtifactsFromGraphQL()` with JSON strings
  - Test handling of already-stringified/parsed artifacts
  - Test error handling for invalid inputs
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 9. Write integration tests for artifact storage flow
  - Test end-to-end artifact creation, storage, and retrieval
  - Test renewable energy terrain analysis with 60 features
  - Test S3 upload flow (when permissions are fixed)
  - Test backward compatibility with existing features
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.4, 4.4_

- [ ] 10. Deploy and validate renewable energy terrain analysis
  - Deploy backend changes (IAM permissions)
  - Deploy frontend changes (serialization)
  - Test terrain analysis: "Analyze terrain for wind farm at 35.067482, -101.395466"
  - Verify artifacts are saved without GraphQL errors
  - Verify terrain map displays 60 features correctly
  - _Requirements: 1.1, 1.2, 1.3, 4.4, 5.4_

- [ ] 11. Validate existing features still work
  - Test petrophysical analysis (porosity calculation)
  - Test log plot viewer
  - Test multi-well correlation
  - Test shale volume analysis
  - Verify no regressions in existing functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
