/**
 * Test EDIcraft agent response to non-greeting messages
 * Verify that the Python agent doesn't return welcome messages
 */

const { handler } = require('./amplify/functions/edicraftAgent/handler.ts');

async function testNonGreeting() {
  console.log('=== Testing EDIcraft Non-Greeting Messages ===\n');

  const testCases = [
    {
      message: 'Build wellbore trajectory for WELL-001',
      shouldContainWelcome: false,
      description: 'Wellbore build command'
    },
    {
      message: 'List players',
      shouldContainWelcome: false,
      description: 'List players command'
    },
    {
      message: 'Search for wellbores',
      shouldContainWelcome: false,
      description: 'Search command'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.description}`);
    console.log(`   Message: "${testCase.message}"`);

    try {
      const event = {
        arguments: {
          userId: 'test-user-123',
          message: testCase.message
        },
        identity: {
          sub: 'test-user-123'
        }
      };

      const response = await handler(event, {});

      console.log(`   Success: ${response.success}`);
      console.log(`   Message length: ${response.message.length} characters`);
      console.log(`   Message preview: ${response.message.substring(0, 200)}...`);

      // Check for unwanted welcome message phrases
      const unwantedPhrases = [
        'Welcome to EDIcraft',
        'I\'m ready to help you',
        'What would you like to do',
        'What would you like to visualize',
        'Getting Started',
        'What I Can Do',
        'ready to help you with wellbore trajectories',
        'I have access to tools for'
      ];

      const containsWelcome = unwantedPhrases.some(phrase => 
        response.message.toLowerCase().includes(phrase.toLowerCase())
      );

      if (containsWelcome === testCase.shouldContainWelcome) {
        console.log(`   ✅ PASS - No welcome message detected`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Unwanted welcome message detected`);
        console.log(`   Full message:\n${response.message}`);
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n=== Test Summary ===');
  console.log(`Total: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${(passed / testCases.length * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n✅ All tests passed! Python agent is not returning welcome messages.');
  } else {
    console.log('\n❌ Some tests failed. Python agent may still be returning welcome messages.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

testNonGreeting().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
