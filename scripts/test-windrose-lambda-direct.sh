#!/bin/bash

echo "Testing windrose Lambda directly..."

WINDROSE_LAMBDA="amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH"

PAYLOAD='{
  "query": "Analyze wind patterns",
  "parameters": {
    "project_id": "test-direct",
    "latitude": 35.067482,
    "longitude": -101.395466
  }
}'

echo "Invoking Lambda: $WINDROSE_LAMBDA"
echo "Payload: $PAYLOAD"
echo ""

aws lambda invoke \
  --function-name "$WINDROSE_LAMBDA" \
  --payload "$PAYLOAD" \
  --cli-binary-format raw-in-base64-out \
  /tmp/windrose-response.json

echo ""
echo "Response:"
cat /tmp/windrose-response.json | jq '.'
