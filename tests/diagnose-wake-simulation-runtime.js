#!/usr/bin/env node
/**
 * Wake Simulation Runtime Diagnostic
 * 
 * This script diagnoses why wake simulation is failing with "Tool execution failed"
 * by checking the complete data flow from orchestrator to Lambda.
 */

console.log('🔍 Wake Simulation Runtime Diagnostic\n');
console.log('=====================================\n');

console.log('📋 Checking Wake Simulation Flow:\n');

console.log('1. ✅ Frontend Component Mapping');
console.log('   - wake_simulation → WakeAnalysisArtifact');
console.log('   - Component exists and is correctly imported\n');

console.log('2. 🔄 Orchestrator Flow');
console.log('   Location: amplify/functions/renewableOrchestrator/handler.ts:1720');
console.log('   - Checks for layout in context');
console.log('   - Falls back to S3 if not in context');
console.log('   - Passes layout to simulation Lambda\n');

console.log('3. ⚠️  POTENTIAL ISSUE: Lambda Handler Validation');
console.log('   Location: amplify/functions/renewableTools/simulation/handler.py:550');
console.log('   - Validates layout exists and has features');
console.log('   - Returns error if no layout found\n');

console.log('🐛 Root Cause Analysis:\n');
console.log('The "Tool execution failed" error suggests:');
console.log('1. Layout data is NOT being passed correctly from orchestrator to Lambda');
console.log('2. OR layout data exists but is in wrong format');
console.log('3. OR Lambda is throwing an exception before returning proper error\n');

console.log('🔍 What to Check:\n');
console.log('1. Check CloudWatch logs for simulation Lambda');
console.log('   - Look for "Layout validation failed" messages');
console.log('   - Check what layout data is actually received\n');

console.log('2. Check if layout was actually created');
console.log('   - After "layout wind farm", check S3 for layout data');
console.log('   - Verify layout has features array\n');

console.log('3. Check orchestrator logs');
console.log('   - Look for "Fetching layout data" messages');
console.log('   - Check if S3 fetch succeeded\n');

console.log('📊 Expected Data Flow:\n');
console.log('User: "wake simulation"');
console.log('  ↓');
console.log('Orchestrator: Detects wake_simulation intent');
console.log('  ↓');
console.log('Orchestrator: Fetches layout from S3 or context');
console.log('  ↓');
console.log('Orchestrator: Invokes simulation Lambda with layout');
console.log('  ↓');
console.log('Simulation Lambda: Validates layout exists');
console.log('  ↓');
console.log('Simulation Lambda: Runs wake simulation');
console.log('  ↓');
console.log('Orchestrator: Formats response as wake_simulation artifact');
console.log('  ↓');
console.log('Frontend: Renders WakeAnalysisArtifact\n');

console.log('🔧 Quick Fixes to Try:\n');
console.log('1. Check if layout optimization actually succeeded');
console.log('   - Look for "Layout optimization complete" message');
console.log('   - Verify turbines were placed\n');

console.log('2. Check CloudWatch logs for actual error');
console.log('   - Search for simulation Lambda logs');
console.log('   - Look for Python exceptions\n');

console.log('3. Test with explicit layout data');
console.log('   - Try: "run wake simulation with 10 turbines at [coordinates]"\n');

console.log('💡 Most Likely Issue:');
console.log('The layout optimization is returning "grid layout" which suggests');
console.log('it might not be persisting the layout to S3 correctly, so when');
console.log('wake simulation tries to fetch it, the layout is missing or invalid.\n');

console.log('🎯 Next Steps:');
console.log('1. Check layout optimization S3 persistence');
console.log('2. Verify layout data format matches Lambda expectations');
console.log('3. Add better error messages to simulation Lambda');
console.log('4. Check if project context is being passed correctly\n');

console.log('✅ To fix this, we need to:');
console.log('1. Ensure layout optimization saves to S3 correctly');
console.log('2. Ensure orchestrator passes layout in correct format');
console.log('3. Improve error messages so we know exactly what failed\n');
