/**
 * Test simulation handler NREL integration
 * Verifies that simulation handler uses real NREL data and includes data source metadata
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Simulation Handler NREL Integration\n');

// Read the simulation handler file
const handlerPath = path.join(__dirname, '../amplify/functions/renewableTools/simulation/handler.py');
const handlerContent = fs.readFileSync(handlerPath, 'utf8');

let passed = 0;
let failed = 0;

// Test 1: Verify NREL client import
console.log('Test 1: Verify NREL client import');
if (handlerContent.includes('from nrel_wind_client import NRELWindClient')) {
    console.log('✅ PASS: NREL client is imported\n');
    passed++;
} else {
    console.log('❌ FAIL: NREL client import not found\n');
    failed++;
}

// Test 2: Verify NO synthetic data generation in wind_rose action
console.log('Test 2: Verify NO synthetic data generation in wind_rose action');
const hasSyntheticWindGeneration = handlerContent.includes('# Generate sample wind data') ||
                                   handlerContent.includes('hash(f"{latitude}{longitude}') ||
                                   handlerContent.includes('base_frequency = 5.0');
if (!hasSyntheticWindGeneration) {
    console.log('✅ PASS: No synthetic wind data generation found\n');
    passed++;
} else {
    console.log('❌ FAIL: Synthetic wind data generation still exists\n');
    failed++;
}

// Test 3: Verify NREL client usage in wind_rose action
console.log('Test 3: Verify NREL client usage in wind_rose action');
if (handlerContent.includes('nrel_client = NRELWindClient()') &&
    handlerContent.includes('nrel_client.fetch_wind_data(latitude, longitude')) {
    console.log('✅ PASS: NREL client is used to fetch wind data\n');
    passed++;
} else {
    console.log('❌ FAIL: NREL client not used properly\n');
    failed++;
}

// Test 4: Verify error handling returns errors (not synthetic data)
console.log('Test 4: Verify error handling returns errors (not synthetic data)');
if (handlerContent.includes('noSyntheticData') &&
    handlerContent.includes('Cannot proceed without real wind data')) {
    console.log('✅ PASS: Error handling returns errors, not synthetic data\n');
    passed++;
} else {
    console.log('❌ FAIL: Error handling may fall back to synthetic data\n');
    failed++;
}

// Test 5: Verify data source metadata in wind_rose response
console.log('Test 5: Verify data source metadata in wind_rose response');
if (handlerContent.includes("'data_source': 'NREL Wind Toolkit'") &&
    handlerContent.includes("'data_year': 2023")) {
    console.log('✅ PASS: Data source metadata included in wind_rose response\n');
    passed++;
} else {
    console.log('❌ FAIL: Data source metadata missing from wind_rose response\n');
    failed++;
}

// Test 6: Verify data source metadata in wake_simulation response
console.log('Test 6: Verify data source metadata in wake_simulation response');
if (handlerContent.includes("'dataSource': 'NREL Wind Toolkit'") &&
    handlerContent.includes("'dataYear': 2023")) {
    console.log('✅ PASS: Data source metadata included in wake_simulation response\n');
    passed++;
} else {
    console.log('❌ FAIL: Data source metadata missing from wake_simulation response\n');
    failed++;
}

// Test 7: Verify NO synthetic fallback in wake simulation
console.log('Test 7: Verify NO synthetic fallback in wake simulation');
const hasWakeSyntheticFallback = handlerContent.includes('# Fallback to synthetic') ||
                                 handlerContent.includes('generate_synthetic_wind');
if (!hasWakeSyntheticFallback) {
    console.log('✅ PASS: No synthetic fallback in wake simulation\n');
    passed++;
} else {
    console.log('❌ FAIL: Synthetic fallback still exists in wake simulation\n');
    failed++;
}

// Test 8: Verify NREL client availability check
console.log('Test 8: Verify NREL client availability check');
if (handlerContent.includes('if not WIND_CLIENT_AVAILABLE:') &&
    handlerContent.includes('NREL wind client not available')) {
    console.log('✅ PASS: NREL client availability is checked\n');
    passed++;
} else {
    console.log('❌ FAIL: NREL client availability check missing\n');
    failed++;
}

// Test 9: Verify real wind data processing
console.log('Test 9: Verify real wind data processing');
if (handlerContent.includes('wind_conditions = nrel_client.process_wind_data(wind_resource_data)') &&
    handlerContent.includes("wind_speeds = wind_conditions['wind_speeds']")) {
    console.log('✅ PASS: Real wind data is processed from NREL\n');
    passed++;
} else {
    console.log('❌ FAIL: Real wind data processing not found\n');
    failed++;
}

// Test 10: Verify data source in response message
console.log('Test 10: Verify data source in response message');
if (handlerContent.includes('using NREL Wind Toolkit data (2023)')) {
    console.log('✅ PASS: Data source mentioned in response message\n');
    passed++;
} else {
    console.log('❌ FAIL: Data source not mentioned in response message\n');
    failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 All tests passed! Simulation handler properly uses NREL data.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Review the implementation.');
    process.exit(1);
}
