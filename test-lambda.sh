#!/bin/bash

# Test Lambda function directly

echo "Testing Lambda function: agentcore-gateway-lambda"
echo ""

# Create payload file
cat > payload.json << 'EOF'
{
  "tool": "get_wind_conditions",
  "arguments": {
    "latitude": 30.25,
    "longitude": -97.74
  }
}
EOF

echo "Payload:"
cat payload.json
echo ""
echo "Invoking Lambda..."
echo ""

# Invoke Lambda
aws lambda invoke \
  --function-name agentcore-gateway-lambda \
  --payload file://payload.json \
  response.json

echo ""
echo "Response:"
cat response.json
echo ""

# Cleanup
rm payload.json
