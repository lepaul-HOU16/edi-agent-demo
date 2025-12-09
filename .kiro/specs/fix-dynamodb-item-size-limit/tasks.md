# Implementation Plan

- [x] 1. S3 proxy endpoint already exists
  - S3 proxy Lambda at `cdk/lambda-functions/api-s3-proxy/handler.ts` ✅
  - API Gateway route `/api/s3-proxy` configured ✅
  - Handles GET requests with bucket/key parameters ✅
  - Returns signed URLs or direct JSON data ✅
  - _Requirements: 1.3_

- [x] 2. Add S3 storage function to porosity tool
  - Create `storeLogDataInS3` function in comprehensivePorosityAnalysisTool.ts
  - Use writeFile from s3Utils (already imported)
  - Key format: `porosity-data/{sessionId}/{wellName}.json`
  - Return S3 reference: { bucket, key, region, sizeBytes }
  - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3_

- [x] 3. Extract sessionId from tool execution context
  - Add sessionId parameter to tool inputSchema
  - Pass sessionId from agent when calling tool
  - Use sessionId in S3 key generation
  - _Requirements: 1.4, 4.2_

- [x] 4. Modify porosity tool to store logData in S3
  - Call storeLogDataInS3 after generating logData
  - Replace logData with logDataS3 reference in WellPorosityAnalysis interface
  - Keep curveMetadata in artifact (small, needed for UI)
  - Update artifact generation to use S3 reference
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 5. Add artifact size validation
  - Create validateArtifactSize function
  - Check size before returning from tool
  - Log warning if > 350KB (safety margin)
  - Throw error if > 400KB
  - _Requirements: 2.3_

- [x] 6. Add error handling for S3 storage failures
  - Wrap S3 storage in try-catch
  - Return artifact without log data if S3 fails
  - Include error message in artifact
  - Log detailed error for debugging
  - _Requirements: 2.5_

- [x] 7. Update S3 proxy to handle porosity data requests
  - Modify handler to accept direct JSON return (not just signed URLs)
  - Add validation for `porosity-data/` prefix
  - Return JSON data directly for porosity requests
  - Add appropriate cache headers
  - _Requirements: 1.3_

- [x] 8. Update frontend porosity display component
  - Add state: logData, loading, error
  - Detect logDataS3 reference in artifact
  - Fetch from S3 using `/api/s3-proxy?bucket=X&key=Y`
  - Show loading spinner while fetching
  - Show error alert if fetch fails
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [-] 9. Add fallback for embedded logData
  - Check for embedded logData if logDataS3 missing
  - Use embedded data directly (backward compatibility)
  - Log which data source is being used
  - _Requirements: 3.1_

- [ ] 10. Add caching for fetched S3 data
  - Cache fetched log data in component state
  - Use useEffect with artifact dependency
  - Avoid redundant S3 requests
  - Clear cache when artifact changes
  - _Requirements: 3.5_

- [ ] 11. Deploy backend changes
  - Deploy with `cd cdk && npm run deploy`
  - Verify S3 storage working in CloudWatch logs
  - Check S3 bucket for porosity-data/ files
  - Verify artifact sizes are under 400KB
  - _Requirements: All backend requirements_

- [ ] 12. Test on localhost with WELL-004
  - Start dev server: `npm run dev`
  - Run porosity analysis on WELL-004
  - Verify log data stored in S3
  - Verify artifact under 400KB
  - Verify frontend fetches and displays correctly
  - Check loading states and error handling
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
