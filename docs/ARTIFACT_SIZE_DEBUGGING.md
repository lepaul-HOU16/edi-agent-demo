# Artifact Size Debugging Guide

## Problem

Terrain analysis returns "Found 1000 terrain features" but NO visualizations are displayed. The artifacts are being dropped due to size limits.

## Root Cause Analysis

### Size Thresholds

1. **Individual Artifact Threshold**: 100KB (reduced from 300KB)
   - Artifacts larger than 100KB should be uploaded to S3
   - S3 reference is only ~0.27KB

2. **Total Message Threshold**: 300KB
   - DynamoDB item size limit is 400KB
   - We use 300KB as safe threshold
   - Includes message text + all artifacts + metadata

### Expected Flow

```
Large Artifact (167KB)
  ↓
shouldStoreInS3() → YES (>100KB)
  ↓
uploadArtifactToS3()
  ↓
S3 Reference (0.27KB)
  ↓
Final Message (~0.5KB) ✅
```

### Actual Flow (When Failing)

```
Large Artifact (167KB)
  ↓
shouldStoreInS3() → YES (>100KB)
  ↓
uploadArtifactToS3() → FAILS ❌
  ↓
optimizeArtifactForDynamoDB()
  ↓
Still too large (>100KB)
  ↓
Error Placeholder Created
  ↓
OR Emergency Fallback Removes All Artifacts
```

## Debugging Steps

### 1. Check Browser Console

Look for these log messages in order:

```
📦 Processing artifacts for storage...
📏 Artifact 1 (wind_farm_terrain_analysis) size: XXX KB
📤 Artifact 1 is large (XXX KB), attempting S3 upload...
```

**If S3 upload succeeds:**
```
✅ Artifact uploaded to S3: chatSessionArtifacts/...
📈 Storage Statistics: { s3Artifacts: 1, ... }
```

**If S3 upload fails:**
```
❌ S3 upload failed for artifact 1: [error message]
🔧 Attempting data optimization for DynamoDB compatibility...
```

### 2. Check S3 Upload Errors

Common S3 upload failures:

1. **Permission Errors**
   ```
   AccessDenied: User is not authorized to perform: s3:PutObject
   ```
   **Fix**: Check Amplify storage permissions in `amplify/storage/resource.ts`

2. **Network Errors**
   ```
   NetworkingError: Network failure
   ```
   **Fix**: Check internet connection, retry

3. **Configuration Errors**
   ```
   InvalidAccessKeyId: The AWS Access Key Id you provided does not exist
   ```
   **Fix**: Check Amplify configuration, re-authenticate

### 3. Check Final Message Size

Look for this log:
```
📏 Final AI message size breakdown:
   Total: XXX KB
   Message text: XXX KB
   Artifacts: XXX KB
   Artifact count: X
```

**If total > 300KB:**
```
❌ Message size (XXX KB) exceeds DynamoDB limit (300 KB)
⚠️ EMERGENCY: Removing artifacts to prevent DynamoDB error
```

## Solutions

### Solution 1: Fix S3 Upload Permissions

Check `amplify/storage/resource.ts`:

```typescript
export const storage = defineStorage({
  name: 'amplifyStorage',
  access: (allow) => ({
    'chatSessionArtifacts/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});
```

### Solution 2: Reduce Artifact Size Threshold

Already implemented - reduced from 300KB to 100KB:

```typescript
const DYNAMODB_SIZE_LIMIT = 100 * 1024; // 100KB
```

This makes S3 upload more aggressive.

### Solution 3: Optimize Artifacts Before Upload

The system already attempts optimization if S3 upload fails:
- Samples coordinate arrays
- Preserves feature arrays (no sampling)
- Reduces precision

### Solution 4: Error Placeholders

If all else fails, create minimal error placeholder:

```typescript
{
  type: 'error',
  messageContentType: 'error',
  title: 'Visualization Unavailable',
  data: {
    message: 'This visualization was too large...',
    suggestion: 'Try reducing the analysis radius...'
  }
}
```

## Testing

### Test Script

Run the debug script to simulate artifact sizes:

```bash
node scripts/debug-artifact-size.js
```

Expected output:
```
📊 Artifact Size Analysis
========================
Total size: 167.60 KB
Should use S3 (>100KB): YES

📦 S3 Reference Size
===================
S3 reference size: 0.27 KB
Size reduction: 99.8%

📨 Final Message Size
====================
Message with S3 reference: 0.47 KB
Within DynamoDB limit (<300KB): YES ✅
```

### Manual Test

1. Send terrain analysis query:
   ```
   Analyze terrain for wind farm at 40.7128, -74.0060
   ```

2. Check browser console for:
   - S3 upload attempt
   - S3 upload success/failure
   - Final message size
   - Artifact count

3. Expected result:
   - Terrain map visualization displays
   - No DynamoDB errors
   - No "Emergency fallback" messages

## Monitoring

### CloudWatch Logs

Check Lambda function logs for:

```
📦 Artifacts: [{ type: 'wind_farm_terrain_analysis', hasData: true }]
```

### Browser Console

Check for:

```
✅ Successfully deserialized all X artifacts
📥 EnhancedArtifactProcessor: S3 references detected, retrieving...
✅ Artifact downloaded from S3: chatSessionArtifacts/...
```

## Current Status

### Changes Made

1. ✅ Reduced S3 threshold from 300KB to 100KB
2. ✅ Added detailed size logging
3. ✅ Added error placeholders for oversized artifacts
4. ✅ Enhanced deserialization error handling
5. ✅ Added emergency fallback with user message

### Next Steps

1. **Deploy changes**:
   ```bash
   npx ampx sandbox --once
   ```

2. **Test terrain analysis**:
   - Send query
   - Check console logs
   - Verify visualization displays

3. **If still failing**:
   - Share complete browser console output
   - Check CloudWatch logs for S3 upload errors
   - Verify storage permissions

## Expected Console Output (Success)

```
📦 Processing artifacts for storage...
📏 Artifact 1 (wind_farm_terrain_analysis) size: 167.60 KB
📤 Artifact 1 is large (167.60 KB), attempting S3 upload...
📤 Uploading large artifact to S3...
✅ Artifact uploaded to S3: chatSessionArtifacts/session-123/terrain-analysis-456.json (167.60 KB)
📈 Storage Statistics: {
  totalArtifacts: 1,
  inlineArtifacts: 0,
  s3Artifacts: 1,
  inlineSize: 0.00 KB,
  s3Size: 167.60 KB
}
✅ Artifact processing complete
✅ All artifacts are already JSON strings (from processArtifactsForStorage)
✅ Final serialized artifacts count: 1
📏 Final AI message size breakdown:
   Total: 0.47 KB
   Message text: 0.03 KB
   Artifacts: 0.27 KB
   Artifact count: 1
✅ Message size is within DynamoDB limits
AI message created successfully: msg-789
```

## Expected Console Output (Failure - Need to Fix)

```
📦 Processing artifacts for storage...
📏 Artifact 1 (wind_farm_terrain_analysis) size: 167.60 KB
📤 Artifact 1 is large (167.60 KB), attempting S3 upload...
📤 Uploading large artifact to S3...
❌ Failed to upload artifact to S3: AccessDenied: User is not authorized to perform: s3:PutObject
❌ S3 upload failed for artifact 1: S3 upload failed: AccessDenied
🔧 Attempting data optimization for DynamoDB compatibility...
📏 Optimized artifact size: 150.00 KB
❌ Artifact still too large after optimization (150.00 KB > 100 KB)
   S3 upload failed and optimization didn't reduce size enough
   Creating minimal error placeholder to preserve user experience
```

In this case, you'll see an error artifact displayed instead of the visualization.

## Quick Fix Checklist

- [ ] Deploy latest changes
- [ ] Test terrain analysis query
- [ ] Check browser console for S3 upload logs
- [ ] Verify storage permissions if S3 upload fails
- [ ] Check CloudWatch logs for backend errors
- [ ] Verify visualization displays or error message shows
