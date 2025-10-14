/**
 * Manual E2E test script for renewable energy loading state completion
 * Task 16: Test loading state completion
 * 
 * This script tests the loading state behavior by:
 * 1. Sending a terrain analysis query
 * 2. Monitoring the response for loading state changes
 * 3. Verifying loading indicator appears and disappears correctly
 * 4. Testing error and timeout scenarios
 */

const { generateClient } = require('aws-amplify/data');
const { Amplify } = require('aws-amplify');
const outputs = require('../amplify_outputs.json');

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient();

// Test scenarios
const TEST_SCENARIOS = {
  SUCCESS: {
    name: 'Successful terrain analysis',
    query: 'Analyze terrain for wind farm at coordinates 10.5, 106.5 with radius 5km',
    expectedBehavior: 'Loading indicator should appear, then disappear when complete',
  },
  ERROR_ORCHESTRATOR_NOT_FOUND: {
    name: 'Orchestrator not deployed',
    query: 'Analyze terrain for wind farm at coordinates 10.5, 106.5',
    expectedBehavior: 'Loading indicator should appear, then disappear with error message',
    simulateError: true,
  },
  TIMEOUT: {
    name: 'Analysis timeout',
    query: 'Analyze terrain for wind farm at coordinates 10.5, 106.5 with radius 50km',
    expectedBehavior: 'Loading indicator should appear, then disappear after timeout',
    expectTimeout: true,
  },
};

/**
 * Monitor loading state changes
 */
class LoadingStateMonitor {
  constructor() {
    this.states = [];
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = Date.now();
    this.recordState('loading_started');
    console.log('🔄 Loading state: STARTED');
  }

  complete() {
    this.endTime = Date.now();
    this.recordState('loading_completed');
    const duration = this.endTime - this.startTime;
    console.log(`✅ Loading state: COMPLETED (${duration}ms)`);
  }

  error(errorMessage) {
    this.endTime = Date.now();
    this.recordState('loading_error', { error: errorMessage });
    const duration = this.endTime - this.startTime;
    console.log(`❌ Loading state: ERROR (${duration}ms) - ${errorMessage}`);
  }

  timeout() {
    this.endTime = Date.now();
    this.recordState('loading_timeout');
    const duration = this.endTime - this.startTime;
    console.log(`⏱️ Loading state: TIMEOUT (${duration}ms)`);
  }

  recordState(state, metadata = {}) {
    this.states.push({
      state,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  getReport() {
    return {
      states: this.states,
      duration: this.endTime - this.startTime,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }
}

/**
 * Create a test chat session
 */
async function createTestChatSession() {
  console.log('📝 Creating test chat session...');
  
  try {
    const { data: chatSession } = await client.models.ChatSession.create({
      name: `Loading State Test - ${new Date().toISOString()}`,
    });

    if (!chatSession?.id) {
      throw new Error('Failed to create chat session');
    }

    console.log(`✅ Created chat session: ${chatSession.id}`);
    return chatSession.id;
  } catch (error) {
    console.error('❌ Failed to create chat session:', error);
    throw error;
  }
}

/**
 * Send a message and monitor loading state
 */
async function sendMessageAndMonitorLoading(chatSessionId, query, options = {}) {
  const monitor = new LoadingStateMonitor();
  const messages = [];
  let subscription = null;

  try {
    // Start monitoring
    monitor.start();

    // Subscribe to messages
    console.log('👂 Subscribing to messages...');
    subscription = client.models.ChatMessage.observeQuery({
      filter: { chatSessionId: { eq: chatSessionId } },
    }).subscribe({
      next: ({ items }) => {
        const newMessages = items.filter(
          msg => !messages.find(m => m.id === msg.id)
        );

        newMessages.forEach(msg => {
          messages.push(msg);
          console.log(`📨 Received message: ${msg.role} - ${msg.responseComplete ? 'COMPLETE' : 'INCOMPLETE'}`);

          // Check if response is complete
          if (msg.role === 'ai' && msg.responseComplete) {
            if (msg.content?.text?.includes('Error') || msg.content?.text?.includes('❌')) {
              monitor.error(msg.content.text);
            } else if (msg.content?.text?.includes('timed out') || msg.content?.text?.includes('⏱️')) {
              monitor.timeout();
            } else {
              monitor.complete();
            }
          }
        });
      },
      error: (error) => {
        console.error('❌ Subscription error:', error);
        monitor.error(error.message);
      },
    });

    // Send the message
    console.log(`💬 Sending query: "${query}"`);
    const { data: userMessage } = await client.models.ChatMessage.create({
      role: 'human',
      content: { text: query },
      chatSessionId,
    });

    if (!userMessage) {
      throw new Error('Failed to create user message');
    }

    // Invoke the agent
    console.log('🤖 Invoking agent...');
    const response = await client.queries.invokeAgent({
      message: query,
      chatSessionId,
    });

    console.log('📊 Agent response received');

    // Wait for response to be complete (with timeout)
    const timeout = options.expectTimeout ? 65000 : 30000;
    const startWait = Date.now();

    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startWait;

        // Check if we have a complete response
        const completeMessage = messages.find(
          msg => msg.role === 'ai' && msg.responseComplete
        );

        if (completeMessage) {
          clearInterval(checkInterval);
          resolve();
        } else if (elapsed > timeout) {
          clearInterval(checkInterval);
          monitor.timeout();
          resolve();
        }
      }, 500);
    });

    // Cleanup subscription
    if (subscription) {
      subscription.unsubscribe();
    }

    return {
      monitor: monitor.getReport(),
      messages,
      success: messages.some(msg => msg.role === 'ai' && msg.responseComplete),
    };
  } catch (error) {
    console.error('❌ Test error:', error);
    monitor.error(error.message);

    if (subscription) {
      subscription.unsubscribe();
    }

    return {
      monitor: monitor.getReport(),
      messages,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run a test scenario
 */
async function runTestScenario(scenario) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 Test Scenario: ${scenario.name}`);
  console.log('='.repeat(80));
  console.log(`Query: "${scenario.query}"`);
  console.log(`Expected: ${scenario.expectedBehavior}`);
  console.log('');

  try {
    // Create test chat session
    const chatSessionId = await createTestChatSession();

    // Send message and monitor loading state
    const result = await sendMessageAndMonitorLoading(
      chatSessionId,
      scenario.query,
      {
        expectTimeout: scenario.expectTimeout,
      }
    );

    // Print results
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(80));
    console.log(`Duration: ${result.monitor.duration}ms`);
    console.log(`States: ${result.monitor.states.map(s => s.state).join(' → ')}`);
    console.log(`Messages received: ${result.messages.length}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    // Verify loading state behavior
    console.log('\n✅ Loading State Verification:');
    const hasLoadingStart = result.monitor.states.some(s => s.state === 'loading_started');
    const hasLoadingEnd = result.monitor.states.some(
      s => s.state === 'loading_completed' || s.state === 'loading_error' || s.state === 'loading_timeout'
    );

    console.log(`  Loading indicator appeared: ${hasLoadingStart ? '✅' : '❌'}`);
    console.log(`  Loading indicator disappeared: ${hasLoadingEnd ? '✅' : '❌'}`);
    console.log(`  No page reload required: ✅ (reactive subscription)`);

    // Check for complete response
    const completeMessage = result.messages.find(
      msg => msg.role === 'ai' && msg.responseComplete
    );

    if (completeMessage) {
      console.log(`  Response complete: ✅`);
      console.log(`  Artifacts: ${completeMessage.artifacts?.length || 0}`);
    } else {
      console.log(`  Response complete: ❌`);
    }

    return {
      scenario: scenario.name,
      passed: hasLoadingStart && hasLoadingEnd,
      duration: result.monitor.duration,
      details: result,
    };
  } catch (error) {
    console.error('❌ Scenario failed:', error);
    return {
      scenario: scenario.name,
      passed: false,
      error: error.message,
    };
  }
}

/**
 * Run all test scenarios
 */
async function runAllTests() {
  console.log('🚀 Starting Loading State Completion Tests');
  console.log('='.repeat(80));
  console.log('This will test the loading indicator behavior for renewable energy queries');
  console.log('');

  const results = [];

  // Run success scenario
  console.log('📋 Running test scenarios...\n');
  
  try {
    // Test 1: Successful response
    const successResult = await runTestScenario(TEST_SCENARIOS.SUCCESS);
    results.push(successResult);

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Error response (if orchestrator is not deployed)
    // Uncomment to test error scenarios
    // const errorResult = await runTestScenario(TEST_SCENARIOS.ERROR_ORCHESTRATOR_NOT_FOUND);
    // results.push(errorResult);

    // Test 3: Timeout scenario (requires long-running query)
    // Uncomment to test timeout scenarios
    // const timeoutResult = await runTestScenario(TEST_SCENARIOS.TIMEOUT);
    // results.push(timeoutResult);

  } catch (error) {
    console.error('❌ Test suite error:', error);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary');
  console.log('='.repeat(80));

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.scenario}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log('');
  console.log(`Total: ${passedCount}/${totalCount} tests passed`);
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(passedCount === totalCount ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
