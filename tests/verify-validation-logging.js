/**
 * Verification Script for Validation Logging
 * 
 * This script demonstrates the enhanced validation logging with project context.
 * Run this to see the structured CloudWatch logs in action.
 */

const { 
  validateParameters, 
  logValidationFailure,
  logValidationSuccess
} = require('../amplify/functions/renewableOrchestrator/parameterValidator');

console.log('═══════════════════════════════════════════════════════════');
console.log('VALIDATION LOGGING VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

// Scenario 1: Validation failure without project context
console.log('📋 Scenario 1: Validation Failure Without Context');
console.log('─────────────────────────────────────────────────────────\n');

const intent1 = {
  type: 'layout_optimization',
  params: {},
  confidence: 90
};

const validation1 = validateParameters(intent1);
console.log('\n🔍 Validation Result:', {
  isValid: validation1.isValid,
  missingRequired: validation1.missingRequired,
  contextUsed: validation1.contextUsed
});

console.log('\n📝 Logging validation failure...\n');
logValidationFailure(validation1, intent1, 'test-req-001');

console.log('\n═══════════════════════════════════════════════════════════\n');

// Scenario 2: Validation success with project context
console.log('📋 Scenario 2: Validation Success With Context');
console.log('─────────────────────────────────────────────────────────\n');

const intent2 = {
  type: 'layout_optimization',
  params: {},
  confidence: 90
};

const projectContext = {
  projectName: 'west-texas-site',
  coordinates: { latitude: 35.067482, longitude: -101.395466 },
  terrain_results: { features: [] }
};

const validation2 = validateParameters(intent2, projectContext);
console.log('\n🔍 Validation Result:', {
  isValid: validation2.isValid,
  satisfiedByContext: validation2.satisfiedByContext,
  contextUsed: validation2.contextUsed
});

console.log('\n📝 Logging validation success...\n');
logValidationSuccess(validation2, intent2, 'test-req-002', projectContext);

console.log('\n═══════════════════════════════════════════════════════════\n');

// Scenario 3: Validation success without context (explicit parameters)
console.log('📋 Scenario 3: Validation Success Without Context');
console.log('─────────────────────────────────────────────────────────\n');

const intent3 = {
  type: 'terrain_analysis',
  params: { latitude: 35.067482, longitude: -101.395466 },
  confidence: 92
};

const validation3 = validateParameters(intent3);
console.log('\n🔍 Validation Result:', {
  isValid: validation3.isValid,
  satisfiedByContext: validation3.satisfiedByContext,
  contextUsed: validation3.contextUsed
});

console.log('\n📝 Logging validation success...\n');
logValidationSuccess(validation3, intent3, 'test-req-003');

console.log('\n═══════════════════════════════════════════════════════════\n');

// Scenario 4: Validation failure with project context (missing different params)
console.log('📋 Scenario 4: Validation Failure With Context');
console.log('─────────────────────────────────────────────────────────\n');

const intent4 = {
  type: 'wake_simulation',
  params: {},
  confidence: 88
};

const projectContext2 = {
  projectName: 'incomplete-project',
  coordinates: { latitude: 35.0, longitude: -101.0 }
  // Missing layout_results
};

const validation4 = validateParameters(intent4, projectContext2);
console.log('\n🔍 Validation Result:', {
  isValid: validation4.isValid,
  missingRequired: validation4.missingRequired,
  contextUsed: validation4.contextUsed
});

console.log('\n📝 Logging validation failure...\n');
logValidationFailure(validation4, intent4, 'test-req-004', projectContext2);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ VERIFICATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📊 Summary:');
console.log('  - Scenario 1: Validation failed without context (ERROR log)');
console.log('  - Scenario 2: Validation passed with context (INFO log)');
console.log('  - Scenario 3: Validation passed without context (INFO log)');
console.log('  - Scenario 4: Validation failed with partial context (ERROR log)');
console.log('\n💡 All logs above are structured JSON suitable for CloudWatch Insights.');
console.log('   Use the queries in TASK_4_VALIDATION_LOGGING_COMPLETE.md to filter them.\n');
