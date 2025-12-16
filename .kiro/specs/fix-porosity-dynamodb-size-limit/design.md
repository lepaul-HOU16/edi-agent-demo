# Design Document

## Overview

This design addresses the recurring DynamoDB size limit errors in the porosity analysis tool by ensuring log data is consistently stored in S3 when sessionId is provided, and by enforcing hard limits on well count to prevent artifacts from exceeding 400KB.

## Architecture

### Current State (Broken)

```
Porosity Tool
  ├─ analyzeSingleWellPorosity()
  │   ├─ Stores logData in S3 if sessionId provided ✅
  │   └─ Returns analysis with logDataS3 reference ✅
  │
  ├─ generateSingleWellPorosityReport()
  │   └─ ALWAYS includes analysis.logData ❌ (ignores logDataS3)
  │
  ├─ generateMultiWellPorosityReport()
  │   └─ ALWAYS includes analysis.logData for ALL wells ❌
  │
  └─ generatePorosityFieldReport()
      └─ ALWAYS includes analysis.logData for ALL wells ❌

Result: Artifacts exceed 400KB because log data is embedded even when stored in S3
```

### Fixed State

```
Porosity Tool
  ├─ analyzeSingleWellPorosity()
  │   ├─ Stores logData in S3 if sessionId provided ✅
  │   └─ Returns analysis with logDataS3 OR logData ✅
  │
  ├─ generateSingleWellPorosityReport()
  │   ├─ Checks if analysis.logDataS3 exists ✅
  │   ├─ Includes logDataS3 reference if available ✅
  │   ├─ Falls back to embedded logData if not ✅
  │   └─ Validates artifact size before returning ✅
  │
  ├─ generateMultiWellPorosityReport()
  │   ├─ Checks each analysis.logDataS3 ✅
  │   ├─ Includes logDataS3 reference per well if available ✅
  │   ├─ Falls back to embedded logData per well if not ✅
  │   └─ Validates artifact size before returning ✅
  │
  └─ generatePorosityFieldReport()
      ├─ Checks each analysis.logDataS3 ✅
      ├─ Includes logDataS3 reference per well if available ✅
      ├─ Falls back to embedded logData per well if not ✅
      └─ Validates artifact size before returning ✅

Result: Artifacts stay under 400KB by using S3 references instead of embedded data
```

## Components and Interfaces

### 1. S3 Storage Function (Already Exists)

```typescript
async function storeLogDataInS3(
  sessionId: string,
  wellName: string,
  logData: {
    DEPT: number[];
    RHOB: number[];
    NPHI: number[];
    PHID: number[];
    PHIN: number[];
    PHIE: number[];
    GR?: number[];
  }
): Promise<{
  bucket: string;
  key: string;
  region: string;
  sizeBytes: number;
}>
```

**Purpose**: Store log data in S3 with hierarchical key structure
**Key Format**: `porosity-data/{sessionId}/{wellName}.json`
**Returns**: S3 reference object for inclusion in artifact

### 2. Artifact Size Validation (Already Exists)

```typescript
function validateArtifactSize(artifact: any): void
```

**Purpose**: Validate artifact size before returning
**Throws**: Error if artifact exceeds 400KB
**Warns**: If artifact exceeds 350KB (approaching limit)

### 3. Artifact Generation Functions (FIXED)

#### Single-Well Artifact

```typescript
function generateSingleWellPorosityReport(
  analysis: WellPorosityAnalysis,
  plotData: any
): any {
  const artifact = {
    // ... other fields ...
    
    // FIXED: Check for S3 reference first
    ...(analysis.logDataS3 
      ? { logDataS3: analysis.logDataS3 } 
      : { logData: analysis.logData }
    ),
    
    curveMetadata: analysis.curveMetadata,
    
    ...(analysis.s3StorageError && { 
      s3StorageError: analysis.s3StorageError 
    })
  };
  
  // Validate size before returning
  validateArtifactSize(artifact);
  
  return artifact;
}
```

#### Multi-Well Artifact

```typescript
function generateMultiWellPorosityReport(
  analyses: WellPorosityAnalysis[],
  plotData: any[]
): any {
  const artifact = {
    // ... other fields ...
    
    // FIXED: Check each well's S3 reference
    wellsLogData: analyses.map(analysis => ({
      wellName: analysis.wellName,
      
      // Use S3 reference if available
      ...(analysis.logDataS3 
        ? { logDataS3: analysis.logDataS3 } 
        : { logData: analysis.logData }
      ),
      
      curveMetadata: analysis.curveMetadata,
      
      ...(analysis.s3StorageError && { 
        s3StorageError: analysis.s3StorageError 
      })
    }))
  };
  
  // Validate size before returning
  validateArtifactSize(artifact);
  
  return artifact;
}
```

#### Field Overview Artifact

```typescript
function generatePorosityFieldReport(
  fieldSummary: any,
  analyses: WellPorosityAnalysis[],
  plotData: any[]
): any {
  const artifact = {
    // ... other fields ...
    
    // FIXED: Check each well's S3 reference
    fieldLogData: analyses.map(analysis => ({
      wellName: analysis.wellName,
      
      // Use S3 reference if available
      ...(analysis.logDataS3 
        ? { logDataS3: analysis.logDataS3 } 
        : { logData: analysis.logData }
      ),
      
      curveMetadata: analysis.curveMetadata,
      
      ...(analysis.s3StorageError && { 
        s3StorageError: analysis.s3StorageError 
      })
    }))
  };
  
  // Validate size before returning
  validateArtifactSize(artifact);
  
  return artifact;
}
```

### 4. Hard Well Limit (NEW)

```typescript
// At tool entry point
const MAX_WELLS = 2;

if (targetWells && targetWells.length > MAX_WELLS) {
  console.warn(`⚠️ WELL LIMIT ENFORCED: Requested ${targetWells.length} wells, limiting to ${MAX_WELLS}`);
  targetWells = targetWells.slice(0, MAX_WELLS);
}
```

**Purpose**: Prevent ANY possibility of exceeding DynamoDB size limit
**Rationale**: Even with S3 storage, metadata and statistics can add up

## Data Models

### WellPorosityAnalysis (MODIFIED)

```typescript
interface WellPorosityAnalysis {
  wellName: string;
  depthRange: [number, number];
  porosityStats: PorosityStats;
  reservoirIntervals: ReservoirInterval[];
  lithologyAnalysis: LithologyAnalysis;
  highPorosityZones: HighPorosityZone[];
  reservoirQuality: string;
  completionRecommendations: string[];
  dataQuality: DataQuality;
  
  // MODIFIED: Mutually exclusive - either embedded or S3 reference
  logData?: LogData;           // Embedded log data (backward compatibility)
  logDataS3?: S3Reference;     // S3 reference (preferred)
  s3StorageError?: string;     // Error message if S3 storage failed
  
  curveMetadata: CurveMetadata;
}
```

### S3Reference

```typescript
interface S3Reference {
  bucket: string;    // S3 bucket name
  key: string;       // S3 object key
  region: string;    // AWS region
  sizeBytes: number; // Size of stored data
}
```

### LogData

```typescript
interface LogData {
  DEPT: number[];  // Depth
  RHOB: number[];  // Bulk density
  NPHI: number[];  // Neutron porosity
  PHID: number[];  // Calculated density porosity
  PHIN: number[];  // Calculated neutron porosity
  PHIE: number[];  // Calculated effective porosity
  GR?: number[];   // Gamma ray (optional)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: S3 Reference Exclusivity

*For any* well analysis with logDataS3 defined, the artifact SHALL NOT include embedded logData for that well.

**Validates: Requirements 3.4**

### Property 2: Artifact Size Limit

*For any* generated artifact, the JSON-serialized size SHALL NOT exceed 400KB (409,600 bytes).

**Validates: Requirements 2.4**

### Property 3: Well Count Hard Limit

*For any* tool invocation, the number of wells analyzed SHALL NOT exceed 2, regardless of input parameters.

**Validates: Requirements 2.1**

### Property 4: S3 Storage Consistency

*For any* well analysis where sessionId is provided and S3 storage succeeds, the analysis SHALL include logDataS3 and SHALL NOT include embedded logData.

**Validates: Requirements 1.1, 1.3**

### Property 5: Backward Compatibility

*For any* well analysis where sessionId is not provided OR S3 storage fails, the analysis SHALL include embedded logData.

**Validates: Requirements 1.4, 1.5**

## Error Handling

### Artifact Size Exceeded

```typescript
throw new Error(
  `Artifact size ${sizeKB.toFixed(2)} KB exceeds DynamoDB limit of 400.00 KB. ` +
  `Reduce the number of wells analyzed or depth range to decrease artifact size. ` +
  `Currently analyzing ${analyses.length} wells with ${wellsWithEmbeddedData} wells having embedded log data. ` +
  `Ensure sessionId is provided to enable S3 storage for log data.`
);
```

**Includes**:
- Actual artifact size
- Number of wells analyzed
- Number of wells with embedded data
- Actionable suggestions

### S3 Storage Failure

```typescript
console.error(`❌ Failed to store log data in S3 for ${wellName}:`, {
  error: errorMessage,
  wellName,
  sessionId,
  logDataSize: JSON.stringify(logData).length
});

// Fallback to embedded data
embeddedLogData = logData;
s3StorageError = `S3 storage failed: ${errorMessage}. Log data embedded in artifact instead.`;
```

**Behavior**:
- Log detailed error
- Fall back to embedded log data
- Include error message in artifact
- Continue processing (don't fail the entire analysis)

### Well Limit Enforcement

```typescript
console.warn(`⚠️ WELL LIMIT ENFORCED: Requested ${targetWells.length} wells, limiting to ${MAX_WELLS}`);
console.warn(`⚠️ Original wells: ${targetWells.join(', ')}`);
targetWells = targetWells.slice(0, MAX_WELLS);
console.warn(`⚠️ Limited wells: ${targetWells.join(', ')}`);
```

**Behavior**:
- Log warning with original and limited well lists
- Silently limit to 2 wells
- Continue processing with limited set

## Testing Strategy

### Unit Tests

1. **Test S3 Reference Inclusion**
   - Given: Well analysis with logDataS3
   - When: Generating artifact
   - Then: Artifact includes logDataS3, NOT logData

2. **Test Embedded Data Fallback**
   - Given: Well analysis without logDataS3
   - When: Generating artifact
   - Then: Artifact includes logData

3. **Test Well Limit Enforcement**
   - Given: Request for 5 wells
   - When: Tool processes request
   - Then: Only 2 wells are analyzed

4. **Test Artifact Size Validation**
   - Given: Artifact exceeding 400KB
   - When: Validating artifact size
   - Then: Error is thrown with actionable message

### Integration Tests

1. **Test End-to-End S3 Storage**
   - Given: sessionId provided
   - When: Analyzing multiple wells
   - Then: Log data stored in S3, artifacts contain references

2. **Test Frontend S3 Fetch**
   - Given: Artifact with logDataS3
   - When: Frontend renders artifact
   - Then: Log data fetched from S3, visualizations displayed

3. **Test Backward Compatibility**
   - Given: No sessionId provided
   - When: Analyzing single well
   - Then: Log data embedded in artifact, visualizations work

### Property-Based Tests

Not applicable for this fix - this is a data storage optimization, not algorithmic logic.

## Summary

The fix ensures that:

1. **S3 storage is used consistently** when sessionId is provided
2. **Artifacts never embed log data** when S3 references exist
3. **Hard limits prevent** any possibility of exceeding 400KB
4. **Error messages are actionable** with specific guidance
5. **Backward compatibility is maintained** for cases without sessionId

This makes the porosity tool STABLE and RELIABLE for multi-well analysis.
