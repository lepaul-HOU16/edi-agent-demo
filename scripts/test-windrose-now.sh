#!/bin/bash

echo "Testing windrose Lambda with fixed imports..."

WINDROSE="amplify-digitalassistant--RenewableWindroseToolED9-TGqAlgBMzPxH"

PAYLOAD='{"query":"test","parameters":{"project_id":"test-now"}}'

aws lambda invoke \
  --function-name "$WINDROSE" \
  --payload "$PAYLOAD" \
  --cli-binary-format raw-in-base64-out \
  /tmp/windrose-now.json

echo ""
echo "Response:"
cat /tmp/windrose-now.json | jq '.'
