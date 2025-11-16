#!/bin/bash

# Quick verification script for terrain analysis end-to-end test

echo "🧪 Running Terrain Analysis End-to-End Test..."
echo ""

node test-terrain-e2e.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ TERRAIN ANALYSIS E2E TEST PASSED"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "All components verified:"
  echo "  ✅ API Gateway routing"
  echo "  ✅ Orchestrator invocation"
  echo "  ✅ Terrain Lambda execution"
  echo "  ✅ Artifact generation"
  echo "  ✅ CloudWatch logs clean"
  echo ""
else
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "❌ TERRAIN ANALYSIS E2E TEST FAILED"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "Check the output above for details."
  echo ""
  echo "Common issues:"
  echo "  • IAM roles not configured (run: ./fix-standalone-lambda-iam.sh)"
  echo "  • Lambda code not deployed (run: npm run build:lambdas && cdk deploy)"
  echo "  • Environment variables missing (check CDK stack outputs)"
  echo ""
fi

exit $EXIT_CODE
