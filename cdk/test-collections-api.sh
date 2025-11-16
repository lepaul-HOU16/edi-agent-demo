#!/bin/bash

# Test script for Collections REST API
# This script tests all Collections API endpoints

set -e

echo "🧪 Testing Collections REST API"
echo "================================"

# Get API Gateway URL from CDK outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name EnergyInsightsCdkStack \
  --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
  --output text)

if [ -z "$API_URL" ]; then
  echo "❌ Could not find API Gateway URL"
  exit 1
fi

echo "📍 API URL: $API_URL"

# Get Cognito token (you'll need to replace these with actual values)
# For now, we'll test without auth to verify the Lambda works
echo ""
echo "⚠️  Note: This test requires a valid Cognito JWT token"
echo "   Set TOKEN environment variable with your JWT token"
echo ""

if [ -z "$TOKEN" ]; then
  echo "❌ TOKEN environment variable not set"
  echo "   Get a token by logging into the app and copying from browser dev tools"
  exit 1
fi

# Test 1: List Collections
echo "📋 Test 1: List Collections"
echo "GET $API_URL/api/collections/list"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/collections/list")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ List collections successful"
  echo "$BODY" | jq '.'
else
  echo "❌ List collections failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

# Test 2: Create Collection
echo ""
echo "📁 Test 2: Create Collection"
echo "POST $API_URL/api/collections/create"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Collection",
    "description": "Created by test script",
    "dataSourceType": "S3",
    "previewMetadata": {
      "wellCount": 2,
      "createdFrom": "test"
    },
    "dataItems": [
      {
        "id": "test_well_001",
        "name": "TEST-001",
        "type": "wellbore",
        "dataSource": "S3",
        "s3Key": "test/well-001.las"
      }
    ]
  }' \
  "$API_URL/api/collections/create")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Create collection successful"
  COLLECTION_ID=$(echo "$BODY" | jq -r '.collectionId')
  echo "Collection ID: $COLLECTION_ID"
  echo "$BODY" | jq '.'
else
  echo "❌ Create collection failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

# Test 3: Get Collection
echo ""
echo "🔍 Test 3: Get Collection"
echo "GET $API_URL/api/collections/$COLLECTION_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/collections/$COLLECTION_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Get collection successful"
  echo "$BODY" | jq '.'
else
  echo "❌ Get collection failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

# Test 4: Update Collection
echo ""
echo "✏️  Test 4: Update Collection"
echo "PUT $API_URL/api/collections/$COLLECTION_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Collection (Updated)",
    "description": "Updated by test script"
  }' \
  "$API_URL/api/collections/$COLLECTION_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Update collection successful"
  echo "$BODY" | jq '.'
else
  echo "❌ Update collection failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

# Test 5: Query Collection
echo ""
echo "🔍 Test 5: Query Collection (Get Wells)"
echo "POST $API_URL/api/collections/$COLLECTION_ID/query"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$API_URL/api/collections/$COLLECTION_ID/query")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Query collection successful"
  echo "$BODY" | jq '.'
else
  echo "❌ Query collection failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

# Test 6: Delete Collection
echo ""
echo "🗑️  Test 6: Delete Collection"
echo "DELETE $API_URL/api/collections/$COLLECTION_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/api/collections/$COLLECTION_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Delete collection successful"
  echo "$BODY" | jq '.'
else
  echo "❌ Delete collection failed with status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

echo ""
echo "================================"
echo "✅ All Collections API tests passed!"
echo "================================"
