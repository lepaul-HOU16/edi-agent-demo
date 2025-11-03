/**
 * Test SessionContextManager implementation
 * 
 * Tests:
 * - Context creation and retrieval
 * - Active project tracking
 * - Project history management
 * - DynamoDB operations
 * - Caching behavior
 * - Fallback mechanisms
 */

const { SessionContextManager } = require('../amplify/functions/shared/sessionContextManager.ts');

// Mock DynamoDB client for testing
const mockDynamoClient = {
  send: jest.fn(),
};

async function testSessionContextManager() {
  console.log('🧪 Testing SessionContextManager Implementation\n');

  const manager = new SessionContextManager();
  const testSessionId = 'test-session-123';
  const testProjectName = 'west-texas-wind-farm';

  // Test 1: Get context for new session
  console.log('Test 1: Get context for new session');
  try {
    const context = await manager.getContext(testSessionId);
    console.log('✅ Context created:', {
      session_id: context.session_id,
      user_id: context.user_id,
      active_project: context.active_project,
      project_history: context.project_history,
      has_ttl: !!context.ttl,
    });
  } catch (error) {
    console.error('❌ Failed to get context:', error.message);
  }

  // Test 2: Set active project
  console.log('\nTest 2: Set active project');
  try {
    await manager.setActiveProject(testSessionId, testProjectName);
    const context = await manager.getContext(testSessionId);
    if (context.active_project === testProjectName) {
      console.log('✅ Active project set successfully:', context.active_project);
    } else {
      console.error('❌ Active project not set correctly');
    }
  } catch (error) {
    console.error('❌ Failed to set active project:', error.message);
  }

  // Test 3: Get active project
  console.log('\nTest 3: Get active project');
  try {
    const activeProject = await manager.getActiveProject(testSessionId);
    if (activeProject === testProjectName) {
      console.log('✅ Active project retrieved:', activeProject);
    } else {
      console.error('❌ Active project not retrieved correctly');
    }
  } catch (error) {
    console.error('❌ Failed to get active project:', error.message);
  }

  // Test 4: Add to history
  console.log('\nTest 4: Add to history');
  try {
    await manager.addToHistory(testSessionId, testProjectName);
    await manager.addToHistory(testSessionId, 'panhandle-wind');
    await manager.addToHistory(testSessionId, 'amarillo-tx-wind-farm');
    
    const context = await manager.getContext(testSessionId);
    console.log('✅ Project history:', context.project_history);
    
    // Verify order (most recent first)
    if (context.project_history[0] === 'amarillo-tx-wind-farm') {
      console.log('✅ History order correct (most recent first)');
    } else {
      console.error('❌ History order incorrect');
    }
  } catch (error) {
    console.error('❌ Failed to add to history:', error.message);
  }

  // Test 5: History deduplication
  console.log('\nTest 5: History deduplication');
  try {
    await manager.addToHistory(testSessionId, testProjectName);
    const context = await manager.getContext(testSessionId);
    
    const count = context.project_history.filter(p => p === testProjectName).length;
    if (count === 1) {
      console.log('✅ History deduplicated correctly');
    } else {
      console.error('❌ History has duplicates:', count);
    }
  } catch (error) {
    console.error('❌ Failed deduplication test:', error.message);
  }

  // Test 6: Cache hit
  console.log('\nTest 6: Cache hit');
  try {
    const start = Date.now();
    await manager.getContext(testSessionId);
    const duration = Date.now() - start;
    
    if (duration < 10) {
      console.log('✅ Cache hit (fast retrieval):', duration + 'ms');
    } else {
      console.warn('⚠️  Possible cache miss (slow retrieval):', duration + 'ms');
    }
  } catch (error) {
    console.error('❌ Failed cache test:', error.message);
  }

  // Test 7: Cache invalidation
  console.log('\nTest 7: Cache invalidation');
  try {
    manager.invalidateCache(testSessionId);
    const context = await manager.getContext(testSessionId);
    console.log('✅ Cache invalidated and context reloaded');
  } catch (error) {
    console.error('❌ Failed cache invalidation test:', error.message);
  }

  // Test 8: Cache statistics
  console.log('\nTest 8: Cache statistics');
  try {
    const stats = manager.getCacheStats();
    console.log('✅ Cache stats:', {
      cacheSize: stats.cacheSize,
      cacheTTL: stats.cacheTTL + 'ms',
      sessionTTL: stats.sessionTTL + 's',
    });
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error.message);
  }

  // Test 9: Multiple sessions
  console.log('\nTest 9: Multiple sessions');
  try {
    const session2 = 'test-session-456';
    await manager.setActiveProject(session2, 'north-texas-wind-farm');
    
    const context1 = await manager.getContext(testSessionId);
    const context2 = await manager.getContext(session2);
    
    if (context1.active_project !== context2.active_project) {
      console.log('✅ Multiple sessions isolated correctly');
      console.log('  Session 1:', context1.active_project);
      console.log('  Session 2:', context2.active_project);
    } else {
      console.error('❌ Sessions not isolated');
    }
  } catch (error) {
    console.error('❌ Failed multiple sessions test:', error.message);
  }

  // Test 10: TTL calculation
  console.log('\nTest 10: TTL calculation');
  try {
    const context = await manager.getContext(testSessionId);
    const now = Math.floor(Date.now() / 1000);
    const ttlDays = Math.floor((context.ttl - now) / (24 * 60 * 60));
    
    if (ttlDays >= 6 && ttlDays <= 7) {
      console.log('✅ TTL set correctly:', ttlDays + ' days');
    } else {
      console.error('❌ TTL incorrect:', ttlDays + ' days');
    }
  } catch (error) {
    console.error('❌ Failed TTL test:', error.message);
  }

  // Test 11: Fallback behavior (simulate DynamoDB error)
  console.log('\nTest 11: Fallback behavior');
  try {
    // Create manager with invalid table name to simulate error
    const fallbackManager = new SessionContextManager('invalid-table-name');
    const context = await fallbackManager.getContext('fallback-session');
    
    if (context.session_id === 'fallback-session') {
      console.log('✅ Fallback to session-only context works');
    } else {
      console.error('❌ Fallback failed');
    }
  } catch (error) {
    console.error('❌ Failed fallback test:', error.message);
  }

  // Test 12: Clear cache
  console.log('\nTest 12: Clear cache');
  try {
    manager.clearCache();
    const stats = manager.getCacheStats();
    
    if (stats.cacheSize === 0) {
      console.log('✅ Cache cleared successfully');
    } else {
      console.error('❌ Cache not cleared:', stats.cacheSize);
    }
  } catch (error) {
    console.error('❌ Failed clear cache test:', error.message);
  }

  console.log('\n✅ All SessionContextManager tests completed!');
}

// Run tests
testSessionContextManager().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
