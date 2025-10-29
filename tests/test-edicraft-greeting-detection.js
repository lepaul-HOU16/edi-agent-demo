/**
 * Test EDIcraft greeting detection logic
 * Verify that "Build wellbore trajectory for WELL-001" is NOT detected as a greeting
 */

// Simulate the exact greeting detection logic from handler.ts
function isGreeting(message) {
  const normalizedMessage = message.trim().toLowerCase();
  return normalizedMessage === 'hello' || 
         normalizedMessage === 'hi' || 
         normalizedMessage === 'hey' ||
         normalizedMessage === '' ||
         normalizedMessage === 'help';
}

console.log('🧪 Testing EDIcraft Greeting Detection\n');
console.log('============================================================\n');

const testCases = [
  { message: 'hello', expected: true },
  { message: 'Hello', expected: true },
  { message: 'HELLO', expected: true },
  { message: 'hi', expected: true },
  { message: 'hey', expected: true },
  { message: 'help', expected: true },
  { message: '', expected: true },
  { message: '  ', expected: false }, // whitespace only
  { message: 'Build wellbore trajectory for WELL-001', expected: false },
  { message: 'build wellbore trajectory for well-001', expected: false },
  { message: 'Visualize horizon surface in Minecraft', expected: false },
  { message: 'hello world', expected: false }, // not exact match
  { message: 'hi there', expected: false }, // not exact match
];

let passed = 0;
let failed = 0;

testCases.forEach(({ message, expected }) => {
  const result = isGreeting(message);
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} | Message: "${message}"`);
  console.log(`         Expected: ${expected}, Got: ${result}`);
  console.log('');
});

console.log('============================================================');
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
