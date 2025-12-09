# Design Document

## Overview

This design addresses the DynamoDB 400KB item size limit by offloading large log curve data arrays to S3 storage. The porosity analysis tool will store numerical arrays in S3 and return S3 references in the artifact, while the frontend will fetch this data asynchronously for visualization.

## Architecture

### Current Flow (Broken)
```
Porosity Tool → Generate logData arrays (1000+ points × 7 curves)
              → Create artifact with embedded arrays (~500KB)
              → Store in DynamoDB → ❌ ERROR: Item size exceeded
```

### New Flow (Fixed)
```
Porosity Tool → Generate logData arrays
              → Store arrays in S3 (s3://bucket/porosity-data/sessionId/wellName.json)
              → Create artifact with S3 reference
              → Store in DynamoDB (< 50KB) → ✅ SUCCESS
              
Frontend      → Receive artifact with S3 reference
              → Fetch logData from S3 asynchronously
              → Render visualization with fetched data
```

## Components and Interfaces

### Backend: Porosity Analysis Tool

**Modified Interface:**
```typescript
interface WellPorosityAnalysis {
  wellName: string;
  depthRange: [number, number];
  porosityStats: { ... };
  reservoirIntervals: ReservoirInterval[];
  lithologyAnalysis: LithologyAnalysis;
  highPorosityZones: HighPorosityZone[];
  reservoirQuality: string;
  completionRecommendations: string[];
  dataQuality: { ... };
  
  // CHANGED: logData now optional, replaced by S3 reference
  logData?: {
    DEPT: number[];
    RHOB: number[];
    NPHI: number[];
    PHID: number[];
    PHIN: number[];
    PHIE: number[];
    GR?: number[];
  };
  
  // NEW: S3 reference for log data
  logDataS3?: {
    bucket: string;
    key: string;
    region: string;
    sizeBytes: number;
  };
  
  curveMetadata: { ... };
}
```

**Storage Function:**
```typescript
async function storeLogDataInS3(
  sessionId: string,
  wellName: string,
  logData: LogData
): Promise<S3Reference> {
  const key = `porosity-data/${sessionId}/${wellName}.json`;
  const content = JSON.stringify(logData);
  
  await writeFile(key, content, 'application/json');
  
  return {
    bucket: S3_BUCKET,
    key,
    region: process.env.AWS_REGION || 'us-east-1',
    sizeBytes: Buffer.byteLength(content, 'utf8')
  };
}
```

### Frontend: Porosity Display Component

**S3 Data Fetcher:**
```typescript
async function fetchLogDataFromS3(
  s3Reference: S3Reference
): Promise<LogData> {
  const url = `/api/s3-proxy?bucket=${s3Reference.bucket}&key=${s3Reference.key}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch log data: ${response.statusText}`);
  }
  
  return await response.json();
}
```

**Component Logic:**
```typescript
const CloudscapePorosityDisplay = ({ artifact }) => {
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (artifact.logDataS3) {
      setLoading(true);
      fetchLogDataFromS3(artifact.logDataS3)
        .then(data => {
          setLogData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else if (artifact.logData) {
      // Fallback for old artifacts with embedded data
      setLogData(artifact.logData);
    }
  }, [artifact]);
  
  if (loading) return <Spinner />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!logData) return <Alert type="info">No log data available</Alert>;
  
  return <PorosityVisualization logData={logData} />;
};
```

### API: S3 Proxy Endpoint

**New Lambda Function:**
```typescript
// cdk/lambda-functions/s3-proxy/handler.ts
export async function handler(event: APIGatewayProxyEvent) {
  const { bucket, key } = event.queryStringParameters || {};
  
  if (!bucket || !key) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing bucket or key parameter' })
    };
  }
  
  // Validate key starts with allowed prefix
  if (!key.startsWith('porosity-data/')) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Access denied' })
    };
  }
  
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    const content = await response.Body.transformToString();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
      body: content
    };
  } catch (error) {
    console.error('S3 proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from S3' })
    };
  }
}
```

## Data Models

### S3 Reference
```typescript
interface S3Reference {
  bucket: string;      // S3 bucket name
  key: string;         // S3 object key
  region: string;      // AWS region
  sizeBytes: number;   // Size of stored data
}
```

### Log Data (Stored in S3)
```typescript
interface LogData {
  DEPT: number[];      // Depth values
  RHOB: number[];      // Bulk density
  NPHI: number[];      // Neutron porosity
  PHID: number[];      // Calculated density porosity
  PHIN: number[];      // Calculated neutron porosity
  PHIE: number[];      // Calculated effective porosity
  GR?: number[];       // Gamma ray (optional)
}
```

### S3 Key Structure
```
porosity-data/
  {sessionId}/
    {wellName}.json
    
Example:
porosity-data/abc123-def456/WELL-004.json
porosity-data/abc123-def456/WELL-001.json
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: S3 storage prevents DynamoDB size errors
*For any* porosity analysis result with log data, storing the log data in S3 and replacing it with an S3 reference should result in an artifact size under 400KB
**Validates: Requirements 1.1, 2.3**

### Property 2: S3 reference round trip
*For any* log data stored in S3, fetching it using the S3 reference should return data equivalent to the original log data
**Validates: Requirements 1.2, 1.3**

### Property 3: Consistent S3 key naming
*For any* sessionId and wellName, the generated S3 key should follow the format `porosity-data/{sessionId}/{wellName}.json`
**Validates: Requirements 1.4, 4.2, 4.3**

### Property 4: Frontend handles both data formats
*For any* artifact, whether it contains embedded logData or an S3 reference, the frontend should successfully render the porosity visualization
**Validates: Requirements 3.1, 3.2**

### Property 5: S3 fetch error handling
*For any* S3 fetch failure, the frontend should display a clear error message without crashing
**Validates: Requirements 2.5, 3.4**

## Error Handling

### Backend Errors

**S3 Storage Failure:**
```typescript
try {
  const s3Ref = await storeLogDataInS3(sessionId, wellName, logData);
  return { ...analysis, logDataS3: s3Ref };
} catch (error) {
  console.error('Failed to store log data in S3:', error);
  // Fallback: return without log data
  return {
    ...analysis,
    logData: undefined,
    logDataS3: undefined,
    error: 'Log data storage failed - visualization unavailable'
  };
}
```

**DynamoDB Size Validation:**
```typescript
function validateArtifactSize(artifact: any): void {
  const size = Buffer.byteLength(JSON.stringify(artifact), 'utf8');
  const MAX_SIZE = 350 * 1024; // 350KB (safety margin)
  
  if (size > MAX_SIZE) {
    console.error('Artifact exceeds DynamoDB size limit:', {
      size,
      maxSize: MAX_SIZE,
      artifact: JSON.stringify(artifact).substring(0, 500)
    });
    throw new Error(`Artifact size ${size} exceeds limit ${MAX_SIZE}`);
  }
}
```

### Frontend Errors

**S3 Fetch Timeout:**
```typescript
const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - please try again');
    }
    throw error;
  }
};
```

**Network Errors:**
```typescript
try {
  const data = await fetchLogDataFromS3(s3Reference);
  setLogData(data);
} catch (error) {
  if (error.message.includes('NetworkError')) {
    setError('Network error - check your connection');
  } else if (error.message.includes('404')) {
    setError('Log data not found - it may have been deleted');
  } else {
    setError(`Failed to load log data: ${error.message}`);
  }
}
```

## Testing Strategy

### Unit Tests

**Backend:**
- Test S3 key generation with various sessionIds and wellNames
- Test artifact size validation with different data sizes
- Test S3 storage function with mock S3 client
- Test error handling when S3 storage fails

**Frontend:**
- Test S3 data fetching with mock fetch responses
- Test loading state transitions
- Test error state rendering
- Test fallback to embedded logData

### Integration Tests

- Test end-to-end flow: porosity tool → S3 storage → DynamoDB → frontend fetch
- Test with real WELL-004 data that previously failed
- Test with multiple wells in single analysis
- Test S3 proxy endpoint with valid and invalid keys

### Property-Based Tests

**Property 1: S3 storage size reduction**
```typescript
// Generate random log data arrays
fc.assert(
  fc.property(
    fc.array(fc.float(), { minLength: 100, maxLength: 2000 }),
    (depths) => {
      const logData = generateLogData(depths);
      const artifactWithEmbedded = { logData };
      const artifactWithS3 = { logDataS3: { key: 'test.json' } };
      
      const embeddedSize = Buffer.byteLength(JSON.stringify(artifactWithEmbedded));
      const s3Size = Buffer.byteLength(JSON.stringify(artifactWithS3));
      
      return s3Size < embeddedSize;
    }
  )
);
```

**Property 2: Round trip consistency**
```typescript
fc.assert(
  fc.property(
    generateLogDataArbitrary(),
    async (originalLogData) => {
      const s3Ref = await storeLogDataInS3('test-session', 'TEST-WELL', originalLogData);
      const fetchedLogData = await fetchLogDataFromS3(s3Ref);
      
      return deepEqual(originalLogData, fetchedLogData);
    }
  )
);
```

## Performance Considerations

### S3 Storage
- Batch S3 writes for multi-well analysis
- Use parallel uploads with Promise.all()
- Set appropriate S3 storage class (STANDARD for frequent access)

### Frontend Caching
- Cache fetched log data in component state
- Use React Query or SWR for automatic caching
- Set cache TTL to 1 hour (data rarely changes)

### Network Optimization
- Enable S3 CloudFront distribution for faster access
- Use gzip compression for JSON data
- Implement progressive loading for large datasets

## Migration Strategy

### Phase 1: Add S3 Storage (Backward Compatible)
- Modify porosity tool to store data in S3
- Keep embedded logData for backward compatibility
- Deploy backend changes

### Phase 2: Update Frontend
- Add S3 fetch logic to porosity display component
- Maintain fallback to embedded logData
- Deploy frontend changes

### Phase 3: Remove Embedded Data
- Remove logData from artifacts (keep only S3 reference)
- Monitor for any issues
- Clean up old code

### Rollback Plan
If issues occur:
1. Revert to embedding logData in artifacts
2. Keep S3 storage as backup
3. Investigate and fix issues
4. Retry migration
