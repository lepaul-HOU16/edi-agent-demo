/**
 * Fix TerrainParameterPassing test file
 * Adds required userId and sessionId fields and type annotations
 */

const fs = require('fs');

const filePath = 'amplify/functions/renewableOrchestrator/__tests__/TerrainParameterPassing.test.ts';

console.log(`\nFixing ${filePath}...`);

let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add type annotation and required fields to all request declarations
// Pattern: const request = { query: ..., context: {} };
const pattern1 = /const request = \{\s*\n\s*query: ([^\n]+),\s*\n\s*context: (\{[^}]*\})\s*\n\s*\};/g;
content = content.replace(pattern1, (match, queryValue, contextValue) => {
  return `const request: OrchestratorRequest = {\n        query: ${queryValue},\n        userId: 'test-user',\n        sessionId: 'test-session',\n        context: ${contextValue}\n      };`;
});

// Fix 2: Fix inline handler calls in loops
// Pattern: await handler({ query: testCase.query, context: {} });
const pattern2 = /await handler\(\{ query: testCase\.query, context: \{\} \}\)/g;
content = content.replace(pattern2, 'await handler({ query: testCase.query, userId: \'test-user\', sessionId: \'test-session\', context: {} })');

// Fix 3: Fix the mock type assertion
// Pattern: (InvokeCommand as jest.Mock)
const pattern3 = /\(InvokeCommand as jest\.Mock\)/g;
content = content.replace(pattern3, '(InvokeCommand as unknown as jest.Mock)');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Fixed ${filePath}`);
