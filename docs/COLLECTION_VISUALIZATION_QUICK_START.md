# Collection Visualization Tool - Quick Start Guide

## What It Does

The Collection Visualization Tool automatically builds all wellbores from a collection in Minecraft, arranging them in an organized grid pattern with drilling rigs.

## Quick Usage

### Basic Command

```python
visualize_collection_wells("collection-123")
```

This will:
- ✅ Fetch all wells from the collection
- ✅ Arrange them in a grid (50 blocks apart)
- ✅ Build each wellbore trajectory
- ✅ Add drilling rigs at wellheads
- ✅ Show progress updates
- ✅ Provide summary with success/failure counts

### User Queries That Trigger This Tool

When users say:
- "Visualize all wells from the collection"
- "Build all wellbores in collection-123"
- "Show me all wells from the collection"
- "Create visualizations for the entire collection"

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `collection_id` | (required) | Collection identifier (e.g., "collection-123") |
| `batch_size` | 5 | Number of wells to process at once |
| `spacing` | 50 | Distance between wellheads in blocks |

## Examples

### Example 1: Default Settings (24 Wells)

```python
result = visualize_collection_wells("collection-123")
```

**Output:**
```
✅ Collection Visualization Complete

Collection: collection-123

Summary:
- Total Wells: 24
- Successfully Built: 24
- Failed: 0
- Success Rate: 100%

💡 Tip: All wellbores are now visible in Minecraft!
```

**Grid Layout:**
- 5×5 grid (25 positions)
- 50 blocks between wells
- Centered at origin
- Grid spans from (-125, -125) to (125, 125)

### Example 2: Faster Processing (Larger Batches)

```python
result = visualize_collection_wells(
    collection_id="collection-123",
    batch_size=10  # Process 10 wells at a time
)
```

**Benefits:**
- Faster completion time
- Fewer progress updates
- More efficient for large collections

### Example 3: Wider Spacing

```python
result = visualize_collection_wells(
    collection_id="collection-123",
    spacing=75  # 75 blocks between wells
)
```

**Benefits:**
- Less visual clutter
- Easier to navigate
- Better for detailed inspection

### Example 4: Dense Visualization

```python
result = visualize_collection_wells(
    collection_id="collection-123",
    spacing=30  # 30 blocks between wells
)
```

**Benefits:**
- Compact visualization
- See more wells at once
- Good for overview

## What Happens During Visualization

### Progress Updates

You'll see progress messages like:

```
⏳ Batch Visualization Progress

Current Status:
- Progress: 5 of 24 wells (20%)
- Current Well: WELL-005
- Status: Building

Please wait while the visualization completes...
```

### Grid Arrangement

Wells are arranged in a square grid:

```
WELL-001  WELL-002  WELL-003  WELL-004  WELL-005
WELL-006  WELL-007  WELL-008  WELL-009  WELL-010
WELL-011  WELL-012  WELL-013  WELL-014  WELL-015
WELL-016  WELL-017  WELL-018  WELL-019  WELL-020
WELL-021  WELL-022  WELL-023  WELL-024  (empty)
```

### Each Well Gets

1. **Wellbore Trajectory:** Full 3D path from surface to depth
2. **Drilling Rig:** Platform, derrick, equipment at wellhead
3. **Markers:** Depth markers every 10 points
4. **Signage:** Well name on sign at rig
5. **Lighting:** Glowstone for visibility

## Error Handling

### Partial Success

If some wells fail, you'll see:

```
✅ Collection Visualization Complete

Collection: collection-123

Summary:
- Total Wells: 24
- Successfully Built: 20
- Failed: 4
- Success Rate: 83%

Failed Wells:
  - WELL-001 (Data fetch failed: File not found)
  - WELL-005 (Invalid data format)
  - WELL-012 (RCON timeout)
  - WELL-018 (Access denied)
```

**What This Means:**
- 20 wells were built successfully
- 4 wells failed for various reasons
- You can still explore the 20 successful wells
- Failed wells can be debugged individually

### Complete Failure

If the entire operation fails:

```
❌ Collection Visualization Failed

Error Details:
S3 access validation failed: Access denied

Recovery Suggestions:
1. Check AWS credentials
2. Verify IAM permissions
3. Contact administrator
```

## Prerequisites

### Required Environment Variables

```bash
export RENEWABLE_S3_BUCKET=your-bucket-name
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Required S3 Structure

```
s3://your-bucket/
  collections/
    collection-123/
      well-001/
        trajectory.json  (or .csv or .las)
      well-002/
        trajectory.json
      well-003/
        trajectory.json
      ...
```

### Required Permissions

IAM policy needs:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket",
        "arn:aws:s3:::your-bucket/*"
      ]
    }
  ]
}
```

## Performance Tips

### For Small Collections (1-10 wells)
```python
visualize_collection_wells(
    collection_id="small-collection",
    batch_size=5,
    spacing=50
)
```

### For Medium Collections (10-50 wells)
```python
visualize_collection_wells(
    collection_id="medium-collection",
    batch_size=7,
    spacing=60
)
```

### For Large Collections (50+ wells)
```python
visualize_collection_wells(
    collection_id="large-collection",
    batch_size=10,
    spacing=75
)
```

## Troubleshooting

### "Collection contains no trajectory files"

**Check:**
```bash
aws s3 ls s3://your-bucket/collections/collection-123/ --recursive
```

**Fix:** Add trajectory files to the collection

### "S3 access validation failed"

**Check:**
```bash
aws s3 ls s3://your-bucket/
```

**Fix:** Configure AWS credentials or update IAM permissions

### "Wellbore build failed: RCON timeout"

**Check:** Minecraft server connection

**Fix:** 
- Restart Minecraft server
- Check RCON configuration
- Reduce batch size

### High failure rate

**Check:** Trajectory file formats

**Fix:**
- Ensure files are valid JSON, CSV, or LAS
- Verify coordinate/survey data structure
- Check for null values (-999.25, -9999)

## Best Practices

### 1. Start Small
Test with a small collection first:
```python
# Test with 5 wells
visualize_collection_wells("test-collection")
```

### 2. Monitor Progress
Watch the progress updates to ensure processing is working

### 3. Check Summary
Review the summary to see success rate and any failures

### 4. Adjust Parameters
Tune batch_size and spacing based on results

### 5. Handle Failures
Investigate failed wells individually if needed

## Next Steps

After visualization:

1. **Explore in Minecraft:** Teleport to wellheads to inspect
2. **Clear Environment:** Use `clear_minecraft_environment()` to reset
3. **Visualize Again:** Try different spacing or batch sizes
4. **Build Individual Wells:** Use `build_wellbore_trajectory_complete()` for specific wells

## Related Tools

- `build_wellbore_trajectory_complete()` - Build single wellbore
- `build_drilling_rig()` - Build rig at specific location
- `clear_minecraft_environment()` - Clear all visualizations
- `lock_world_time()` - Lock time to daytime

## Support

For issues or questions:
1. Check CloudWatch logs for detailed errors
2. Review S3 bucket structure
3. Verify AWS credentials and permissions
4. Test with smaller collection first
5. Contact system administrator if needed

---

**Ready to visualize your collection? Start with:**

```python
visualize_collection_wells("your-collection-id")
```
