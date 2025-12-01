/**
 * Direct Unit Test for General Knowledge Agent Streaming
 * 
 * This test directly instantiates and tests the General Knowledge Agent
 * to verify streaming behavior without requiring full infrastructure.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { GeneralKnowledgeAgent } from './cdk/lambda-functions/chat/agents/generalKnowledgeAgent';

interface TestResult {
  success: boolean;
  stepCount: number;
  timings: number[];
  avgTiming: number;
  isIncremental: boolean;
  isBatched: boolean;
  errors: string[];
}

/**
 * Mock DynamoDB for testing
 */
class MockDynamoDB {
  private messages: Map<string, any[]> = new Map();
  private writeTimestamps: number[] = [];
  
  async putItem(params: any): Promise<void> {
    const sessionId = params.Item.sessionId;
    const timestamp = Date.now();
    
    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, []);
    }
    
    this.messages.get(sessionId)!.push({
      ...params.Item,
      writeTimestamp: timestamp
    });
    
    this.writeTimestamps.push(timestamp);
    
    console.log(`📝 DynamoDB Write at +${((timestamp - this.writeTimestamps[0]) / 1000).toFixed(2)}s`);
  }
  
  async query(params: any): Promise<any> {
    const sessionId = params.ExpressionAttributeValues[':sessionId'];
    const messages = this.messages.get(sessionId) || [];
    
    return {
      Items: messages
    };
  }
  
  getWriteTimings(): number[] {
    if (this.writeTimestamps.length < 2) return [];
    
    const timings: number[] = [];
    for (let i = 1; i < this.writeTimestamps.length; i++) {
      timings.push((this.writeTimestamps[i] - this.writeTimestamps[i - 1]) / 1000);
    }
    return timings;
  }
  
  reset() {
    this.messages.clear();
    this.writeTimestamps = [];
  }
}

/**
 * Test the General Knowledge Agent's streaming behavior
 */
async function testGeneralKnowledgeStreaming(query: string): Promise<TestResult> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing General Knowledge Agent Streaming');
  console.log('='.repeat(60));
  console.log(`Query: "${query}"`);
  
  const mockDB = new MockDynamoDB();
  const agent = new GeneralKnowledgeAgent();
  const errors: string[] = [];
  
  const sessionContext = {
    chatSessionId: `test-session-${Date.now()}`,
    userId: 'test-user'
  };
  
  try {
    console.log('\n⏱️  Starting agent processing...');
    const startTime = Date.now();
    
    // Process the query
    const result = await agent.processQuery(query, sessionContext);
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Processing complete in ${totalTime}s`);
    console.log(`   Steps generated: ${result.thoughtSteps?.length || 0}`);
    console.log(`   Success: ${result.success}`);
    
    // Analyze the thought steps
    const thoughtSteps = result.thoughtSteps || [];
    const stepCount = thoughtSteps.length;
    
    if (stepCount === 0) {
      errors.push('No thought steps generated');
      return {
        success: false,
        stepCount: 0,
        timings: [],
        avgTiming: 0,
        isIncremental: false,
        isBatched: false,
        errors
      };
    }
    
    // Get DynamoDB write timings
    const timings = mockDB.getWriteTimings();
    
    console.log('\n📊 Thought Steps:');
    thoughtSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.title} [${step.status}]`);
      if (step.result) {
        console.log(`      Result: ${step.result.substring(0, 80)}...`);
      }
    });
    
    // Analyze timing
    console.log('\n⏱️  Timing Analysis:');
    if (timings.length > 0) {
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const minTiming = Math.min(...timings);
      const maxTiming = Math.max(...timings);
      
      console.log(`   Average time between writes: ${avgTiming.toFixed(2)}s`);
      console.log(`   Min time: ${minTiming.toFixed(2)}s`);
      console.log(`   Max time: ${maxTiming.toFixed(2)}s`);
      
      // Check for incremental vs batched behavior
      const isIncremental = avgTiming >= 1.0;
      const isBatched = timings.every(t => t < 0.5);
      
      console.log('\n🔍 Streaming Behavior:');
      if (isBatched) {
        console.log('   ❌ BATCHED: All steps written at once');
        errors.push('Steps are batched, not streaming incrementally');
      } else if (isIncremental) {
        console.log('   ✅ INCREMENTAL: Steps stream in real-time');
      } else {
        console.log('   ⚠️  PARTIAL: Some incremental, some batched');
        errors.push('Inconsistent streaming behavior');
      }
      
      // Check if operations are awaited
      console.log('\n🔄 Operation Awaiting:');
      if (isIncremental) {
        console.log('   ✅ DynamoDB writes are awaited');
        console.log('   ✅ No fire-and-forget pattern detected');
      } else {
        console.log('   ❌ Operations may not be awaited');
        console.log('   ❌ Fire-and-forget pattern detected');
        errors.push('DynamoDB writes not properly awaited');
      }
      
      return {
        success: errors.length === 0,
        stepCount,
        timings,
        avgTiming,
        isIncremental,
        isBatched,
        errors
      };
    } else {
      console.log('   ⚠️  No timing data available');
      errors.push('Unable to measure timing between steps');
      
      return {
        success: false,
        stepCount,
        timings: [],
        avgTiming: 0,
        isIncremental: false,
        isBatched: false,
        errors
      };
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      stepCount: 0,
      timings: [],
      avgTiming: 0,
      isIncremental: false,
      isBatched: false,
      errors
    };
  } finally {
    mockDB.reset();
  }
}

/**
 * Run all streaming tests
 */
async function runAllTests() {
  console.log('\n🎯 General Knowledge Agent Streaming Test Suite');
  console.log('Testing Requirements: 3.1, 3.2, 3.3\n');
  
  const testQueries = [
    'What is the weather like in Malaysia?',
    'Tell me about EU AI regulations',
    'What are the latest developments in offshore drilling?'
  ];
  
  const results: Array<{ query: string; result: TestResult }> = [];
  
  for (const query of testQueries) {
    const result = await testGeneralKnowledgeStreaming(query);
    results.push({ query, result });
    
    // Wait between tests
    if (testQueries.indexOf(query) < testQueries.length - 1) {
      console.log('\n⏸️  Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = results.filter(r => r.result.success).length;
  const totalTests = results.length;
  
  results.forEach(({ query, result }, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${index + 1}. ${status}`);
    console.log(`   Query: "${query}"`);
    console.log(`   Steps: ${result.stepCount}`);
    
    if (result.timings.length > 0) {
      console.log(`   Avg timing: ${result.avgTiming.toFixed(2)}s`);
      console.log(`   Incremental: ${result.isIncremental ? 'Yes' : 'No'}`);
      console.log(`   Batched: ${result.isBatched ? 'Yes' : 'No'}`);
    }
    
    if (result.errors.length > 0) {
      console.log(`   Errors:`);
      result.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Requirements 3.1, 3.2, 3.3 verified');
    console.log('✅ Streaming is working correctly');
    console.log('✅ Steps appear incrementally');
    console.log('✅ DynamoDB writes are immediate and awaited');
    console.log('✅ No fire-and-forget pattern detected');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Review the analysis above for details');
    console.log('Check that General Knowledge Agent is using direct streaming functions');
  }
  
  console.log('\n' + '='.repeat(60));
  
  return passedTests === totalTests;
}

// Run tests if this is the main module
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { testGeneralKnowledgeStreaming, runAllTests };
