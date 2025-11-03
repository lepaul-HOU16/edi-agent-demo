# Layout S3 Persistence - Quick Test Guide

## Quick Test (After Deployment)

```bash
# Run verification test
node tests/verify-layout-s3-persistence.js
```

## What It Tests

1. ✅ Layout Lambda exists and is accessible
2. ✅ S3 bucket is configured
3. ✅ Layout generation works
4. ✅ Layout JSON saved to S3
5. ✅ All required fields present:
   - `project_id`
   - `algorithm`
   - `turbines` array
   - `perimeter` polygon
   - `features` array
   - `metadata` object
6. ✅ Turbine structure valid (id, lat, lon, hub_height, rotor_diameter)
7. ✅ Perimeter is valid GeoJSON Polygon
8. ✅ Metadata complete (timestamps, capacities, coordinates)

## Expected Success Output

```
🧪 Testing Layout S3 Persistence
============================================================

📍 Step 1: Finding layout Lambda...
✅ Found layout Lambda: amplify-digitalassistant--RenewableLayoutTool...

📍 Step 2: Getting S3 bucket name...
✅ S3 Bucket: amplify-digitalassistant--workshopstoragebucket...

📍 Step 3: Invoking layout Lambda...
✅ Layout created: 16 turbines

📍 Step 4: Verifying layout JSON in S3...
✅ Layout JSON found in S3: renewable/layout/test-layout-s3-.../layout.json

📍 Step 5: Validating layout JSON structure...
✅ All required top-level fields present
✅ Turbines array: 16 turbines
✅ Turbine structure valid
✅ Perimeter polygon present
✅ Features array: 0 OSM features
✅ Metadata complete

============================================================
✅ LAYOUT S3 PERSISTENCE TEST PASSED
============================================================

Layout JSON Structure:
  - Project ID: test-layout-s3-...
  - Algorithm: grid
  - Turbines: 16
  - OSM Features: 0
  - Perimeter: Polygon
  - Total Capacity: 40.0 MW
  - Site Area: 0.01 km²
  - Created: 2025-01-...

✅ Wake simulation can now retrieve this layout data
```

## Manual Verification

### Check S3 Directly

```bash
# List layout files for a project
aws s3 ls s3://YOUR-BUCKET/renewable/layout/YOUR-PROJECT-ID/

# Expected files:
# - layout.json          (NEW - for wake simulation)
# - layout_results.json  (legacy format)
# - layout_map.html      (visualization)
```

### Download and Inspect

```bash
# Download layout JSON
aws s3 cp s3://YOUR-BUCKET/renewable/layout/YOUR-PROJECT-ID/layout.json ./layout.json

# View contents
cat layout.json | jq .

# Check required fields
cat layout.json | jq 'keys'
# Should show: ["algorithm", "features", "metadata", "perimeter", "project_id", "turbines"]
```

### Verify Turbine Structure

```bash
# Check first turbine
cat layout.json | jq '.turbines[0]'

# Should show:
# {
#   "id": "T001",
#   "latitude": 35.0,
#   "longitude": -101.0,
#   "hub_height": 80.0,
#   "rotor_diameter": 100.0
# }
```

### Verify Perimeter

```bash
# Check perimeter
cat layout.json | jq '.perimeter'

# Should show:
# {
#   "type": "Polygon",
#   "coordinates": [[[lon, lat], [lon, lat], ...]]
# }
```

## Troubleshooting

### Test Fails: "Layout Lambda not found"
- Check sandbox is running: `ps aux | grep "ampx sandbox"`
- Restart sandbox: `npx ampx sandbox`

### Test Fails: "RENEWABLE_S3_BUCKET not configured"
- Check Lambda environment variables
- Verify backend.ts configuration
- Restart sandbox to apply changes

### Test Fails: "Layout JSON not found in S3"
- Check CloudWatch logs for Lambda errors
- Verify S3 bucket permissions
- Check if S3 save operation succeeded in logs

### Test Fails: "Missing required fields"
- Code may not be deployed yet
- Wait for sandbox auto-deploy (30-60 seconds)
- Check Lambda last modified time

## Integration Test

Test the complete workflow:

```bash
# 1. Run layout optimization
# 2. Check S3 for layout.json
# 3. Run wake simulation (should load from S3)
# 4. Verify wake simulation uses layout data
```

## Success Criteria

✅ Test exits with code 0
✅ All validation steps pass
✅ Layout JSON exists in S3
✅ All required fields present and valid
✅ Wake simulation can load the file

## Next Steps

After this test passes:
1. ✅ Layout S3 persistence working
2. ⏭️ Implement wake simulation S3 retrieval (Task 2)
3. ⏭️ Test complete layout → wake simulation flow
