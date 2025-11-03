/**
 * Test Error Message Templates
 * 
 * Verifies that user-friendly error messages are generated correctly
 * for various missing data scenarios and ambiguous references.
 */

const { ErrorMessageTemplates } = require('../amplify/functions/shared/errorMessageTemplates');

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 TESTING ERROR MESSAGE TEMPLATES');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Missing Coordinates
console.log('Test 1: Missing Coordinates Error');
console.log('─────────────────────────────────────────────────────────');
const missingCoordsContext = {
  projectId: 'project-123',
  projectName: 'west-texas-wind-farm',
  missingData: 'coordinates',
  requiredOperation: 'terrain_analysis',
  hasProjectContext: true
};

const coordsError = ErrorMessageTemplates.missingCoordinates(missingCoordsContext);
console.log('Message:', coordsError.message);
console.log('Suggestion:', coordsError.suggestion);
console.log('Next Steps:', coordsError.nextSteps);
console.log('Category:', coordsError.errorCategory);
console.log('\nFormatted for user:');
console.log(ErrorMessageTemplates.formatForUser(coordsError, missingCoordsContext));
console.log('\n');

// Test 2: Missing Layout
console.log('Test 2: Missing Layout Error');
console.log('─────────────────────────────────────────────────────────');
const missingLayoutContext = {
  projectId: 'project-456',
  projectName: 'panhandle-wind',
  missingData: 'layout',
  requiredOperation: 'layout_optimization',
  hasProjectContext: true
};

const layoutError = ErrorMessageTemplates.missingLayout(missingLayoutContext);
console.log('Message:', layoutError.message);
console.log('Suggestion:', layoutError.suggestion);
console.log('Next Steps:', layoutError.nextSteps);
console.log('Category:', layoutError.errorCategory);
console.log('\n');

// Test 3: Missing Analysis Results
console.log('Test 3: Missing Analysis Results Error');
console.log('─────────────────────────────────────────────────────────');
const missingAnalysisContext = {
  projectId: 'project-789',
  projectName: 'amarillo-tx-wind-farm',
  missingData: 'analysis_results',
  requiredOperation: 'complete_workflow',
  hasProjectContext: false
};

const analysisError = ErrorMessageTemplates.missingAnalysisResults(missingAnalysisContext);
console.log('Message:', analysisError.message);
console.log('Suggestion:', analysisError.suggestion);
console.log('Next Steps:', analysisError.nextSteps);
console.log('Category:', analysisError.errorCategory);
console.log('\n');

// Test 4: Ambiguous Project Reference
console.log('Test 4: Ambiguous Project Reference Error');
console.log('─────────────────────────────────────────────────────────');
const ambiguousMatches = [
  'west-texas-wind-farm',
  'east-texas-wind-farm',
  'north-texas-wind-farm'
];
const ambiguousQuery = 'optimize layout for texas';

const ambiguousError = ErrorMessageTemplates.ambiguousProjectReference(ambiguousMatches, ambiguousQuery);
console.log('Message:', ambiguousError.message);
console.log('Suggestion:', ambiguousError.suggestion);
console.log('Next Steps:', ambiguousError.nextSteps);
console.log('Category:', ambiguousError.errorCategory);
console.log('\nFormatted for user:');
console.log(ErrorMessageTemplates.formatAmbiguousReferenceForUser(ambiguousMatches, ambiguousQuery));
console.log('\n');

// Test 5: API Response Formatting
console.log('Test 5: API Response Formatting');
console.log('─────────────────────────────────────────────────────────');
const apiResponse = ErrorMessageTemplates.formatForResponse(coordsError, missingCoordsContext);
console.log('API Response:', JSON.stringify(apiResponse, null, 2));
console.log('\n');

// Test 6: Ambiguous Reference API Response
console.log('Test 6: Ambiguous Reference API Response');
console.log('─────────────────────────────────────────────────────────');
const ambiguousApiResponse = ErrorMessageTemplates.formatAmbiguousReferenceForResponse(
  ambiguousMatches,
  ambiguousQuery
);
console.log('API Response:', JSON.stringify(ambiguousApiResponse, null, 2));
console.log('\n');

// Test 7: Workflow Status Message
console.log('Test 7: Workflow Status Message');
console.log('─────────────────────────────────────────────────────────');
const projectData = {
  terrain_results: { features: [] },
  layout_results: { turbineCount: 10 },
  simulation_results: null,
  report_results: null
};

const statusMessage = ErrorMessageTemplates.generateWorkflowStatus('west-texas-wind-farm', projectData);
console.log(statusMessage);
console.log('\n');

// Test 8: Generate Error Message by Type
console.log('Test 8: Generate Error Message by Type');
console.log('─────────────────────────────────────────────────────────');
const testCases = [
  { type: 'coordinates', projectName: 'test-project-1' },
  { type: 'layout', projectName: 'test-project-2' },
  { type: 'terrain_results', projectName: 'test-project-3' },
  { type: 'simulation_results', projectName: 'test-project-4' },
  { type: 'unknown_type', projectName: 'test-project-5' }
];

testCases.forEach(testCase => {
  const context = {
    projectName: testCase.projectName,
    missingData: testCase.type,
    requiredOperation: 'test_operation'
  };
  
  const error = ErrorMessageTemplates.generateErrorMessage(testCase.type, context);
  console.log(`\n${testCase.type}:`);
  console.log(`  Message: ${error.message}`);
  console.log(`  Category: ${error.errorCategory}`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('✅ ALL ERROR MESSAGE TEMPLATE TESTS COMPLETE');
console.log('═══════════════════════════════════════════════════════════');
