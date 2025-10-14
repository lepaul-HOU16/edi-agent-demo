/**
 * Professional Output Quality Validation Script
 * 
 * This script validates export functionality for all visualizations and reports,
 * ensures professional formatting and data integrity, and confirms results are
 * suitable for stakeholder presentations.
 * 
 * Requirements: 12.3, 12.4, 12.5
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const fs = require('fs');
const path = require('path');

// Load Amplify configuration
let amplifyOutputs;
try {
  amplifyOutputs = require('../amplify_outputs.json');
} catch (error) {
  console.error('❌ Could not load amplify_outputs.json');
  process.exit(1);
}

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

/**
 * Professional Output Quality Validation
 */
async function validateProfessionalOutputQuality() {
  console.log('🔍 Professional Output Quality Validation');
  console.log('=' .repeat(80));
  
  const testResults = {
    exportFunctionality: [],
    professionalFormatting: [],
    dataIntegrity: [],
    stakeholderSuitability: [],
    overallScore: 0
  };

  // Test Cases for Professional Output Validation
  const testCases = [
    {
      name: 'Terrain Analysis Export',
      query: 'Generate comprehensive terrain analysis for wind farm at 35.067482, -101.395466 with professional export formats including maps, data tables, and technical documentation.',
      category: 'terrain',
      expectedExports: ['map', 'data', 'report'],
      stakeholderLevel: 'technical'
    },
    {
      name: 'Wind Rose Professional Report',
      query: 'Create professional wind rose analysis report for 35.067482, -101.395466 suitable for engineering review and stakeholder presentation.',
      category: 'wind_rose',
      expectedExports: ['chart', 'statistics', 'summary'],
      stakeholderLevel: 'executive'
    },
    {
      name: 'Layout Optimization CAD Export',
      query: 'Design optimal wind farm layout for 30MW at 35.067482, -101.395466 with CAD-ready export formats and professional engineering documentation.',
      category: 'layout',
      expectedExports: ['cad', 'coordinates', 'specifications'],
      stakeholderLevel: 'engineering'
    },
    {
      name: 'Site Suitability Executive Summary',
      query: 'Generate executive-level site suitability assessment for 35.067482, -101.395466 with investment recommendations and risk analysis.',
      category: 'suitability',
      expectedExports: ['executive_summary', 'risk_matrix', 'recommendations'],
      stakeholderLevel: 'executive'
    },
    {
      name: 'Comprehensive Development Report',
      query: 'Create comprehensive wind farm development report for 40.7128, -74.0060 including all analysis phases, professional formatting, and stakeholder-ready presentations.',
      category: 'comprehensive',
      expectedExports: ['full_report', 'executive_summary', 'technical_appendix'],
      stakeholderLevel: 'all'
    }
  ];

  console.log(`\n📋 Testing ${testCases.length} professional output scenarios...\n`);

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log(`   Category: ${testCase.category}`);
    console.log(`   Stakeholder Level: ${testCase.stakeholderLevel}`);
    console.log(`   Query: "${testCase.query}"`);

    try {
      const startTime = Date.now();
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: testCase.query,
          chatSessionId: `professional_output_${testCase.category}_${Date.now()}`
        }
      });

      const responseTime = Date.now() - startTime;
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);

      // Parse response
      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      // Validate Export Functionality
      const exportValidation = await validateExportFunctionality(parsedResponse, testCase);
      testResults.exportFunctionality.push(exportValidation);

      // Validate Professional Formatting
      const formattingValidation = await validateProfessionalFormatting(parsedResponse, testCase);
      testResults.professionalFormatting.push(formattingValidation);

      // Validate Data Integrity
      const integrityValidation = await validateDataIntegrity(parsedResponse, testCase);
      testResults.dataIntegrity.push(integrityValidation);

      // Validate Stakeholder Suitability
      const stakeholderValidation = await validateStakeholderSuitability(parsedResponse, testCase);
      testResults.stakeholderSuitability.push(stakeholderValidation);

      console.log(`   ✅ ${testCase.name}: Completed`);

    } catch (error) {
      console.error(`   ❌ ${testCase.name}: Failed - ${error.message}`);
      
      // Record failures
      testResults.exportFunctionality.push({ testCase: testCase.name, success: false, error: error.message });
      testResults.professionalFormatting.push({ testCase: testCase.name, success: false, error: error.message });
      testResults.dataIntegrity.push({ testCase: testCase.name, success: false, error: error.message });
      testResults.stakeholderSuitability.push({ testCase: testCase.name, success: false, error: error.message });
    }
  }

  // Generate Comprehensive Report
  await generateProfessionalOutputReport(testResults);

  return testResults;
}

/**
 * Validate Export Functionality
 * Requirements: 12.3, 12.4
 */
async function validateExportFunctionality(response, testCase) {
  console.log(`   🔍 Validating Export Functionality...`);
  
  const validation = {
    testCase: testCase.name,
    category: testCase.category,
    success: false,
    exportFormats: [],
    dataAvailability: false,
    downloadability: false,
    formatCompatibility: []
  };

  const artifacts = response.artifacts || [];
  const responseContent = JSON.stringify(response);

  if (artifacts.length > 0) {
    validation.dataAvailability = true;
    
    // Check for export-ready formats
    const exportFormats = ['png', 'pdf', 'svg', 'csv', 'json', 'html', 'xlsx'];
    validation.exportFormats = exportFormats.filter(format => 
      responseContent.toLowerCase().includes(format)
    );

    // Check for downloadable content
    validation.downloadability = responseContent.includes('download') ||
                                responseContent.includes('export') ||
                                responseContent.includes('save') ||
                                artifacts.some(a => a.content && typeof a.content === 'object');

    // Check format compatibility
    if (testCase.expectedExports) {
      validation.formatCompatibility = testCase.expectedExports.filter(expectedFormat => 
        responseContent.toLowerCase().includes(expectedFormat.toLowerCase()) ||
        artifacts.some(a => JSON.stringify(a).toLowerCase().includes(expectedFormat.toLowerCase()))
      );
    }

    validation.success = validation.dataAvailability && 
                        (validation.exportFormats.length > 0 || validation.downloadability);
  }

  console.log(`     📊 Export Formats: ${validation.exportFormats.join(', ') || 'None detected'}`);
  console.log(`     📥 Downloadable: ${validation.downloadability ? 'Yes' : 'No'}`);
  console.log(`     🎯 Format Compatibility: ${validation.formatCompatibility.length}/${testCase.expectedExports?.length || 0}`);
  console.log(`     ${validation.success ? '✅' : '❌'} Export Functionality: ${validation.success ? 'PASS' : 'FAIL'}`);

  return validation;
}

/**
 * Validate Professional Formatting
 * Requirements: 12.4, 12.5
 */
async function validateProfessionalFormatting(response, testCase) {
  console.log(`   🔍 Validating Professional Formatting...`);
  
  const validation = {
    testCase: testCase.name,
    category: testCase.category,
    success: false,
    hasStructure: false,
    hasProfessionalLanguage: false,
    hasMetadata: false,
    hasVisualElements: false,
    qualityScore: 0
  };

  const artifacts = response.artifacts || [];
  const responseContent = JSON.stringify(response).toLowerCase();

  // Check for professional structure
  const structureElements = ['title', 'summary', 'introduction', 'methodology', 'results', 'conclusions', 'recommendations'];
  validation.hasStructure = structureElements.some(element => 
    responseContent.includes(element)
  );

  // Check for professional language
  const professionalTerms = ['analysis', 'assessment', 'evaluation', 'methodology', 'findings', 'recommendations', 'technical', 'professional'];
  validation.hasProfessionalLanguage = professionalTerms.some(term => 
    responseContent.includes(term)
  );

  // Check for metadata and documentation
  validation.hasMetadata = responseContent.includes('metadata') ||
                          responseContent.includes('timestamp') ||
                          responseContent.includes('version') ||
                          responseContent.includes('source');

  // Check for visual elements
  validation.hasVisualElements = responseContent.includes('chart') ||
                                responseContent.includes('map') ||
                                responseContent.includes('graph') ||
                                responseContent.includes('visualization') ||
                                responseContent.includes('diagram');

  // Calculate quality score
  const qualityFactors = [
    validation.hasStructure,
    validation.hasProfessionalLanguage,
    validation.hasMetadata,
    validation.hasVisualElements
  ];
  validation.qualityScore = (qualityFactors.filter(Boolean).length / qualityFactors.length) * 100;

  validation.success = validation.qualityScore >= 75; // 75% threshold for professional quality

  console.log(`     📋 Structure: ${validation.hasStructure ? 'Yes' : 'No'}`);
  console.log(`     💼 Professional Language: ${validation.hasProfessionalLanguage ? 'Yes' : 'No'}`);
  console.log(`     📝 Metadata: ${validation.hasMetadata ? 'Yes' : 'No'}`);
  console.log(`     📊 Visual Elements: ${validation.hasVisualElements ? 'Yes' : 'No'}`);
  console.log(`     🎯 Quality Score: ${validation.qualityScore.toFixed(1)}%`);
  console.log(`     ${validation.success ? '✅' : '❌'} Professional Formatting: ${validation.success ? 'PASS' : 'FAIL'}`);

  return validation;
}

/**
 * Validate Data Integrity
 * Requirements: 12.3, 12.4
 */
async function validateDataIntegrity(response, testCase) {
  console.log(`   🔍 Validating Data Integrity...`);
  
  const validation = {
    testCase: testCase.name,
    category: testCase.category,
    success: false,
    hasConsistentData: false,
    hasValidationInfo: false,
    hasSourceAttribution: false,
    hasQualityMetrics: false
  };

  const artifacts = response.artifacts || [];
  const responseContent = JSON.stringify(response).toLowerCase();

  // Check for consistent data structure
  if (artifacts.length > 0) {
    validation.hasConsistentData = artifacts.every(artifact => 
      artifact.content && typeof artifact.content === 'object'
    );
  }

  // Check for validation information
  validation.hasValidationInfo = responseContent.includes('validation') ||
                                responseContent.includes('verified') ||
                                responseContent.includes('quality') ||
                                responseContent.includes('accuracy');

  // Check for source attribution
  validation.hasSourceAttribution = responseContent.includes('source') ||
                                   responseContent.includes('data source') ||
                                   responseContent.includes('openstreetmap') ||
                                   responseContent.includes('osm');

  // Check for quality metrics
  validation.hasQualityMetrics = responseContent.includes('confidence') ||
                                responseContent.includes('reliability') ||
                                responseContent.includes('completeness') ||
                                responseContent.includes('coverage');

  const integrityFactors = [
    validation.hasConsistentData,
    validation.hasValidationInfo,
    validation.hasSourceAttribution,
    validation.hasQualityMetrics
  ];
  
  validation.success = integrityFactors.filter(Boolean).length >= 2; // At least 2 out of 4 factors

  console.log(`     🔗 Consistent Data: ${validation.hasConsistentData ? 'Yes' : 'No'}`);
  console.log(`     ✅ Validation Info: ${validation.hasValidationInfo ? 'Yes' : 'No'}`);
  console.log(`     📚 Source Attribution: ${validation.hasSourceAttribution ? 'Yes' : 'No'}`);
  console.log(`     📈 Quality Metrics: ${validation.hasQualityMetrics ? 'Yes' : 'No'}`);
  console.log(`     ${validation.success ? '✅' : '❌'} Data Integrity: ${validation.success ? 'PASS' : 'FAIL'}`);

  return validation;
}

/**
 * Validate Stakeholder Suitability
 * Requirements: 12.5
 */
async function validateStakeholderSuitability(response, testCase) {
  console.log(`   🔍 Validating Stakeholder Suitability...`);
  
  const validation = {
    testCase: testCase.name,
    category: testCase.category,
    stakeholderLevel: testCase.stakeholderLevel,
    success: false,
    hasExecutiveSummary: false,
    hasTechnicalDetail: false,
    hasBusinessContext: false,
    hasActionableRecommendations: false,
    suitabilityScore: 0
  };

  const responseContent = JSON.stringify(response).toLowerCase();

  // Check for executive summary elements
  validation.hasExecutiveSummary = responseContent.includes('summary') ||
                                  responseContent.includes('overview') ||
                                  responseContent.includes('key findings') ||
                                  responseContent.includes('executive');

  // Check for technical detail
  validation.hasTechnicalDetail = responseContent.includes('technical') ||
                                 responseContent.includes('methodology') ||
                                 responseContent.includes('analysis') ||
                                 responseContent.includes('specifications');

  // Check for business context
  validation.hasBusinessContext = responseContent.includes('investment') ||
                                 responseContent.includes('cost') ||
                                 responseContent.includes('benefit') ||
                                 responseContent.includes('roi') ||
                                 responseContent.includes('business case');

  // Check for actionable recommendations
  validation.hasActionableRecommendations = responseContent.includes('recommend') ||
                                           responseContent.includes('suggest') ||
                                           responseContent.includes('next steps') ||
                                           responseContent.includes('action');

  // Calculate suitability score based on stakeholder level
  let requiredElements = [];
  switch (testCase.stakeholderLevel) {
    case 'executive':
      requiredElements = [validation.hasExecutiveSummary, validation.hasBusinessContext, validation.hasActionableRecommendations];
      break;
    case 'technical':
      requiredElements = [validation.hasTechnicalDetail, validation.hasActionableRecommendations];
      break;
    case 'engineering':
      requiredElements = [validation.hasTechnicalDetail, validation.hasActionableRecommendations];
      break;
    case 'all':
      requiredElements = [validation.hasExecutiveSummary, validation.hasTechnicalDetail, validation.hasBusinessContext, validation.hasActionableRecommendations];
      break;
    default:
      requiredElements = [validation.hasExecutiveSummary, validation.hasActionableRecommendations];
  }

  validation.suitabilityScore = (requiredElements.filter(Boolean).length / requiredElements.length) * 100;
  validation.success = validation.suitabilityScore >= 75; // 75% threshold

  console.log(`     📊 Executive Summary: ${validation.hasExecutiveSummary ? 'Yes' : 'No'}`);
  console.log(`     🔧 Technical Detail: ${validation.hasTechnicalDetail ? 'Yes' : 'No'}`);
  console.log(`     💼 Business Context: ${validation.hasBusinessContext ? 'Yes' : 'No'}`);
  console.log(`     🎯 Actionable Recommendations: ${validation.hasActionableRecommendations ? 'Yes' : 'No'}`);
  console.log(`     📈 Suitability Score: ${validation.suitabilityScore.toFixed(1)}%`);
  console.log(`     ${validation.success ? '✅' : '❌'} Stakeholder Suitability: ${validation.success ? 'PASS' : 'FAIL'}`);

  return validation;
}

/**
 * Generate Comprehensive Professional Output Report
 */
async function generateProfessionalOutputReport(testResults) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PROFESSIONAL OUTPUT QUALITY VALIDATION REPORT');
  console.log('='.repeat(80));

  // Calculate overall scores
  const categories = ['exportFunctionality', 'professionalFormatting', 'dataIntegrity', 'stakeholderSuitability'];
  const categoryScores = {};

  categories.forEach(category => {
    const results = testResults[category];
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    categoryScores[category] = {
      successCount,
      totalCount,
      percentage: totalCount > 0 ? (successCount / totalCount) * 100 : 0
    };
  });

  // Overall score
  const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score.percentage, 0) / categories.length;
  testResults.overallScore = overallScore;

  console.log('\n📈 Category Scores:');
  console.log(`   Export Functionality: ${categoryScores.exportFunctionality.successCount}/${categoryScores.exportFunctionality.totalCount} (${categoryScores.exportFunctionality.percentage.toFixed(1)}%)`);
  console.log(`   Professional Formatting: ${categoryScores.professionalFormatting.successCount}/${categoryScores.professionalFormatting.totalCount} (${categoryScores.professionalFormatting.percentage.toFixed(1)}%)`);
  console.log(`   Data Integrity: ${categoryScores.dataIntegrity.successCount}/${categoryScores.dataIntegrity.totalCount} (${categoryScores.dataIntegrity.percentage.toFixed(1)}%)`);
  console.log(`   Stakeholder Suitability: ${categoryScores.stakeholderSuitability.successCount}/${categoryScores.stakeholderSuitability.totalCount} (${categoryScores.stakeholderSuitability.percentage.toFixed(1)}%)`);

  console.log(`\n🎯 Overall Professional Output Quality Score: ${overallScore.toFixed(1)}%`);

  // Quality Assessment
  let qualityLevel = 'NEEDS IMPROVEMENT';
  if (overallScore >= 90) qualityLevel = 'EXCELLENT';
  else if (overallScore >= 80) qualityLevel = 'GOOD';
  else if (overallScore >= 70) qualityLevel = 'ACCEPTABLE';
  else if (overallScore >= 60) qualityLevel = 'MARGINAL';

  console.log(`🏆 Quality Level: ${qualityLevel}`);

  // Stakeholder Readiness Assessment
  console.log('\n👥 Stakeholder Readiness Assessment:');
  const stakeholderResults = testResults.stakeholderSuitability;
  const executiveReady = stakeholderResults.filter(r => r.stakeholderLevel === 'executive' && r.success).length;
  const technicalReady = stakeholderResults.filter(r => r.stakeholderLevel === 'technical' && r.success).length;
  const engineeringReady = stakeholderResults.filter(r => r.stakeholderLevel === 'engineering' && r.success).length;

  console.log(`   Executive Presentations: ${executiveReady > 0 ? '✅ Ready' : '❌ Needs Work'}`);
  console.log(`   Technical Reviews: ${technicalReady > 0 ? '✅ Ready' : '❌ Needs Work'}`);
  console.log(`   Engineering Documentation: ${engineeringReady > 0 ? '✅ Ready' : '❌ Needs Work'}`);

  // Export Capability Assessment
  console.log('\n📤 Export Capability Assessment:');
  const exportResults = testResults.exportFunctionality;
  const hasMultipleFormats = exportResults.some(r => r.exportFormats && r.exportFormats.length > 2);
  const hasDownloadability = exportResults.some(r => r.downloadability);
  const hasFormatCompatibility = exportResults.some(r => r.formatCompatibility && r.formatCompatibility.length > 0);

  console.log(`   Multiple Export Formats: ${hasMultipleFormats ? '✅ Available' : '❌ Limited'}`);
  console.log(`   Download Functionality: ${hasDownloadability ? '✅ Available' : '❌ Missing'}`);
  console.log(`   Format Compatibility: ${hasFormatCompatibility ? '✅ Compatible' : '❌ Issues'}`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (overallScore < 80) {
    console.log('   • Improve professional formatting and structure');
    console.log('   • Enhance export functionality and format options');
    console.log('   • Add more comprehensive data validation and quality metrics');
  }
  if (categoryScores.stakeholderSuitability.percentage < 75) {
    console.log('   • Tailor content better for different stakeholder levels');
    console.log('   • Include more executive summaries and business context');
    console.log('   • Provide clearer actionable recommendations');
  }
  if (categoryScores.exportFunctionality.percentage < 75) {
    console.log('   • Implement more export format options (PDF, Excel, CAD)');
    console.log('   • Improve download and sharing capabilities');
    console.log('   • Ensure format compatibility for professional tools');
  }

  // Final Assessment
  const isProductionReady = overallScore >= 75 && 
                           categoryScores.stakeholderSuitability.percentage >= 70 &&
                           categoryScores.exportFunctionality.percentage >= 70;

  console.log(`\n🚀 Production Readiness: ${isProductionReady ? '✅ READY FOR STAKEHOLDER DEMONSTRATIONS' : '⚠️  NEEDS IMPROVEMENT BEFORE STAKEHOLDER PRESENTATIONS'}`);

  // Save detailed report
  const reportPath = path.join(__dirname, 'professional-output-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return testResults;
}

// Run validation if called directly
if (require.main === module) {
  validateProfessionalOutputQuality()
    .then(results => {
      const success = results.overallScore >= 75;
      console.log(`\n🏁 Professional Output Quality Validation: ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Professional output validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateProfessionalOutputQuality };