#!/bin/bash

# Manual Test for Wake Simulation S3 Retrieval
# This script creates a persistent layout in S3 and tests wake simulation

set -e

PROJECT_ID="manual-wake-test-$(date +%s)"
S3_BUCKET="renewable-energy-artifacts-484907533441"
LAMBDA_NAME="amplify-digitalassistant--RenewableSimulationToolF-xvLTjnDdGvWI"

echo "============================================================"
echo "Manual Wake Simulation S3 Retrieval Test"
echo "============================================================"
echo ""
echo "Project ID: $PROJECT_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "Lambda: $LAMBDA_NAME"
echo ""

# Step 1: Create layout JSON
echo "📦 Step 1: Creating layout JSON..."
cat > /tmp/test-layout.json << 'EOF'
{
  "project_id": "REPLACE_PROJECT_ID",
  "algorithm": "intelligent",
  "turbines": [
    {
      "id": 1,
      "latitude": 35.0675,
      "longitude": -101.3955,
      "hub_height": 100,
      "rotor_diameter": 120,
      "capacity_MW": 2.5
    },
    {
      "id": 2,
      "latitude": 35.0685,
      "longitude": -101.3965,
      "hub_height": 100,
      "rotor_diameter": 120,
      "capacity_MW": 2.5
    },
    {
      "id": 3,
      "latitude": 35.0695,
      "longitude": -101.3975,
      "hub_height": 100,
      "rotor_diameter": 120,
      "capacity_MW": 2.5
    }
  ],
  "perimeter": {
    "type": "Polygon",
    "coordinates": [[
      [-101.4, 35.06],
      [-101.39, 35.06],
      [-101.39, 35.07],
      [-101.4, 35.07],
      [-101.4, 35.06]
    ]]
  },
  "features": [],
  "metadata": {
    "created_at": "2025-10-26T18:00:00Z",
    "num_turbines": 3,
    "total_capacity_mw": 7.5,
    "site_area_km2": 5.0
  }
}
EOF

# Replace project ID
sed -i.bak "s/REPLACE_PROJECT_ID/$PROJECT_ID/g" /tmp/test-layout.json
rm /tmp/test-layout.json.bak

echo "✅ Layout JSON created"

# Step 2: Upload to S3
echo ""
echo "📤 Step 2: Uploading layout to S3..."
S3_KEY="renewable/layout/$PROJECT_ID/layout.json"

aws s3 cp /tmp/test-layout.json "s3://$S3_BUCKET/$S3_KEY" \
  --content-type application/json

echo "✅ Layout uploaded to s3://$S3_BUCKET/$S3_KEY"

# Step 3: Verify upload
echo ""
echo "🔍 Step 3: Verifying S3 upload..."
aws s3 ls "s3://$S3_BUCKET/$S3_KEY"
echo "✅ Layout verified in S3"

# Step 4: Invoke simulation Lambda
echo ""
echo "🚀 Step 4: Invoking wake simulation Lambda..."
cat > /tmp/payload.json << EOF
{
  "action": "wake_simulation",
  "parameters": {
    "project_id": "$PROJECT_ID",
    "wind_speed": 8.0,
    "air_density": 1.225
  }
}
EOF

aws lambda invoke \
  --function-name "$LAMBDA_NAME" \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/payload.json \
  /tmp/response.json > /dev/null 2>&1

echo "✅ Lambda invoked"

# Step 5: Check response
echo ""
echo "📥 Step 5: Checking response..."
SUCCESS=$(cat /tmp/response.json | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Simulation succeeded!"
  echo ""
  echo "Response data:"
  cat /tmp/response.json | jq '.data // .body | fromjson | .data' 2>/dev/null || cat /tmp/response.json | jq .
else
  echo "❌ Simulation failed"
  echo ""
  echo "Error:"
  cat /tmp/response.json | jq '.error // .body | fromjson | .error' 2>/dev/null || cat /tmp/response.json | jq .
fi

# Step 6: Check CloudWatch logs
echo ""
echo "📝 Step 6: Checking CloudWatch logs..."
echo ""
echo "Recent logs (last 2 minutes):"
aws logs tail "/aws/lambda/$LAMBDA_NAME" --since 2m --format short 2>/dev/null | \
  grep -E "Loading layout|Layout source|Successfully loaded|Layout not found" | \
  tail -10 || echo "No relevant logs found"

# Step 7: Cleanup
echo ""
echo "🧹 Step 7: Cleanup..."
read -p "Delete test layout from S3? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  aws s3 rm "s3://$S3_BUCKET/$S3_KEY"
  echo "✅ Test layout deleted"
else
  echo "⏭️  Skipped cleanup. Layout remains at: s3://$S3_BUCKET/$S3_KEY"
fi

echo ""
echo "============================================================"
echo "Test Complete"
echo "============================================================"

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Task 2 S3 Retrieval: WORKING"
  exit 0
else
  echo "❌ Task 2 S3 Retrieval: NEEDS INVESTIGATION"
  exit 1
fi
