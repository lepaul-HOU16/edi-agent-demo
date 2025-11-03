/**
 * Test EDIcraft explicit agent selection
 * This simulates what happens when a user selects EDIcraft agent and sends a message
 */

console.log('=== Testing EDIcraft Explicit Selection ===\n');

// Simulate the data flow
const userSelection = 'edicraft';
const message = 'get a well log from well001 and show it in minecraft';

console.log('1. User selects agent:', userSelection);
console.log('2. User sends message:', message);
console.log('');

// Simulate ChatBox.tsx
console.log('3. ChatBox calls sendMessage with:');
console.log('   - chatSessionId: "test-session"');
console.log('   - message:', message);
console.log('   - agentType:', userSelection);
console.log('');

// Simulate amplifyUtils.ts
console.log('4. sendMessage calls invokeLightweightAgent with:');
console.log('   - chatSessionId: "test-session"');
console.log('   - message:', message);
console.log('   - agentType:', userSelection);
console.log('');

// Simulate handler.ts
console.log('5. Handler creates sessionContext:');
const sessionContext = {
  chatSessionId: 'test-session',
  userId: 'test-user',
  selectedAgent: userSelection
};
console.log('   sessionContext:', JSON.stringify(sessionContext, null, 2));
console.log('');

// Simulate AgentRouter.ts
console.log('6. AgentRouter.routeQuery receives:');
console.log('   - message:', message);
console.log('   - sessionContext:', JSON.stringify(sessionContext, null, 2));
console.log('');

console.log('7. AgentRouter checks explicit selection:');
if (sessionContext.selectedAgent && sessionContext.selectedAgent !== 'auto') {
  console.log('   ✅ EXPLICIT SELECTION DETECTED');
  console.log('   ✅ Agent type:', sessionContext.selectedAgent);
  console.log('   ✅ Should route to:', sessionContext.selectedAgent);
  console.log('');
  console.log('8. Expected behavior:');
  console.log('   - Route to EDIcraft agent');
  console.log('   - Call edicraftAgent.processMessage()');
  console.log('   - Return EDIcraft response');
} else {
  console.log('   ❌ NO EXPLICIT SELECTION');
  console.log('   ❌ Would use pattern matching instead');
}

console.log('');
console.log('=== Test Complete ===');
console.log('');
console.log('If you are seeing the petrophysics welcome message instead:');
console.log('1. Check CloudWatch logs for the agent Lambda function');
console.log('2. Look for "AgentRouter: Explicit agent selection" log');
console.log('3. Verify selectedAgent value is "edicraft" not undefined');
console.log('4. Check if EDIcraft agent is throwing an error');
