#!/bin/bash

echo "=========================================="
echo "Manual Lambda Code Update (Bypass Amplify)"
echo "=========================================="
echo ""

LAMBDA_NAME="amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh"
HANDLER_PATH="amplify/functions/renewableTools/handler.ts"

echo "This will:"
echo "1. Compile the TypeScript handler"
echo "2. Bundle it with dependencies"
echo "3. Upload directly to Lambda"
echo "4. Bypass Amplify Gen 2 entirely"
echo ""

read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Step 1: Installing esbuild..."
npm install --no-save esbuild

echo ""
echo "Step 2: Bundling handler..."
npx esbuild "$HANDLER_PATH" \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=.tmp-lambda-bundle.js \
  --external:@aws-sdk/* \
  --format=cjs

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Bundle created"

echo ""
echo "Step 3: Creating deployment package..."
zip -q lambda-update.zip .tmp-lambda-bundle.js

echo "✅ Package created"

echo ""
echo "Step 4: Updating Lambda..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://lambda-update.zip

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Lambda updated successfully"
    echo ""
    echo "Cleaning up..."
    rm -f .tmp-lambda-bundle.js lambda-update.zip
    echo ""
    echo "Wait 10 seconds for Lambda to update, then test deletion."
else
    echo ""
    echo "❌ Lambda update failed"
    rm -f .tmp-lambda-bundle.js lambda-update.zip
    exit 1
fi

echo ""
