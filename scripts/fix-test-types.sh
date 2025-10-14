#!/bin/bash

# Fix TypeScript test files to include required userId and sessionId fields

echo "Fixing OrchestratorRequest type issues in test files..."

# Fix ProjectIdGeneration.test.ts
sed -i.bak 's/query: '\''Analyze terrain at 35\.067482, -101\.395466'\''/query: '\''Analyze terrain at 35.067482, -101.395466'\'',\n        userId: '\''test-user'\'',\n        sessionId: '\''test-session'\''/g' amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts

sed -i.bak 's/query: `Analyze terrain at 35\.\${i}, -101\.\${i}`/query: `Analyze terrain at 35.${i}, -101.${i}`,\n          userId: '\''test-user'\'',\n          sessionId: '\''test-session'\''/g' amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts

sed -i.bak 's/query: identicalQuery/query: identicalQuery,\n          userId: '\''test-user'\'',\n          sessionId: '\''test-session'\''/g' amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts

sed -i.bak 's/query: '\''Optimize layout for 15 turbines at 35\.067482, -101\.395466'\''/query: '\''Optimize layout for 15 turbines at 35.067482, -101.395466'\'',\n        userId: '\''test-user'\'',\n        sessionId: '\''test-session'\''/g' amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts

sed -i.bak 's/query: tool\.query/query: tool.query,\n          userId: '\''test-user'\'',\n          sessionId: '\''test-session'\''/g' amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts

# Fix TerrainParameterPassing.test.ts
sed -i.bak 's/query: testCase\.query, context: {}/query: testCase.query,\n        userId: '\''test-user'\'',\n        sessionId: '\''test-session'\'',\n        context: {}/g' amplify/functions/renewableOrchestrator/__tests__/TerrainParameterPassing.test.ts

sed -i.bak 's/query: '\''Analyze terrain at 35\.067482, -101\.395466'\'', context: {}/query: '\''Analyze terrain at 35.067482, -101.395466'\'',\n      userId: '\''test-user'\'',\n      sessionId: '\''test-session'\'',\n      context: {}/g' amplify/functions/renewableOrchestrator/__tests__/TerrainParameterPassing.test.ts

# Remove backup files
rm -f amplify/functions/renewableOrchestrator/__tests__/*.bak

echo "✅ Fixed OrchestratorRequest type issues"
