/**
 * Fix OrchestratorRequest type issues in test files
 * Adds required userId and sessionId fields to all test requests
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
  'amplify/functions/renewableOrchestrator/__tests__/ProjectIdGeneration.test.ts',
  'amplify/functions/renewableOrchestrator/__tests__/TerrainParameterPassing.test.ts'
];

function fixFile(filePath) {
  console.log(`\nFixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;

  // Pattern 1: Simple query without context (multiline)
  // const request: OrchestratorRequest = {
  //   query: '...'
  // };
  const pattern1 = /const request: OrchestratorRequest = \{\s*\n\s*query: ([^\n]+)\n\s*\};/g;
  content = content.replace(pattern1, (match, queryValue) => {
    // Check if already has userId
    if (match.includes('userId')) return match;
    fixCount++;
    return `const request: OrchestratorRequest = {\n        query: ${queryValue},\n        userId: 'test-user',\n        sessionId: 'test-session'\n      };`;
  });

  // Pattern 2: Query with context
  // const request: OrchestratorRequest = {
  //   query: '...',
  //   context: {...}
  // };
  const pattern2 = /(const request: OrchestratorRequest = \{\s*\n\s*query: [^,\n]+,)\n(\s*context:)/g;
  content = content.replace(pattern2, (match, p1, p2) => {
    fixCount++;
    return `${p1}\n        userId: 'test-user',\n        sessionId: 'test-session',\n${p2}`;
  });

  // Pattern 3: Inline request in handler call
  // await handler({ query: testCase.query, context: {} });
  const pattern3 = /await handler\(\{ query: ([^,}]+), context: \{\} \}\)/g;
  content = content.replace(pattern3, (match, p1) => {
    fixCount++;
    return `await handler({ query: ${p1}, userId: 'test-user', sessionId: 'test-session', context: {} })`;
  });

  // Pattern 4: Request with only query and comment
  // const request: OrchestratorRequest = {
  //   query: '...'
  //   // No project ID in query
  // };
  const pattern4 = /(const request: OrchestratorRequest = \{\s*\n\s*query: [^,\n]+)\n(\s*\/\/[^\n]*\n\s*\})/g;
  content = content.replace(pattern4, (match, p1, p2) => {
    fixCount++;
    return `${p1},\n        userId: 'test-user',\n        sessionId: 'test-session'\n${p2}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${fixCount} occurrences in ${filePath}`);
}

// Fix all test files
testFiles.forEach(fixFile);

console.log('\n✅ All test files fixed!');
