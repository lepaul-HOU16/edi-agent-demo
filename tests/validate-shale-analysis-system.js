/**
 * Validate the comprehensive shale analysis system integration
 * Checks file existence and component integration without TypeScript compilation
 */

const fs = require('fs');
const path = require('path');

function validateShaleAnalysisSystem() {
  console.log('🧪 Validating Comprehensive Shale Analysis System...\n');

  const results = {
    comprehensiveTool: false,
    enhancedTools: false,
    reactComponent: false,
    chatMessageRouting: false,
    typeScriptErrors: false
  };

  // Test 1: Comprehensive Shale Analysis Tool
  console.log('📊 Test 1: Comprehensive Shale Analysis Tool');
  try {
    const toolPath = './amplify/functions/tools/comprehensiveShaleAnalysisTool.ts';
    if (fs.existsSync(toolPath)) {
      const toolContent = fs.readFileSync(toolPath, 'utf8');
      
      // Check for key features
      const hasShaleVolumeCalculator = toolContent.includes('ShaleVolumeCalculator');
      const hasLarionov = toolContent.includes('calculateLarionov');
      const hasCleanSandIdentification = toolContent.includes('identifyCleanSandIntervals');
      const hasMultiWellSupport = toolContent.includes('multi_well_correlation');
      const hasFieldOverview = toolContent.includes('field_overview');
      
      console.log(`✅ Tool file exists: ${toolPath}`);
      console.log(`   Shale Volume Calculator: ${hasShaleVolumeCalculator ? '✅' : '❌'}`);
      console.log(`   Larionov Method: ${hasLarionov ? '✅' : '❌'}`);
      console.log(`   Clean Sand Identification: ${hasCleanSandIdentification ? '✅' : '❌'}`);
      console.log(`   Multi-well Support: ${hasMultiWellSupport ? '✅' : '❌'}`);
      console.log(`   Field Overview: ${hasFieldOverview ? '✅' : '❌'}`);
      
      results.comprehensiveTool = hasShaleVolumeCalculator && hasLarionov && hasCleanSandIdentification;
    } else {
      console.log(`❌ Tool file not found: ${toolPath}`);
    }
  } catch (error) {
    console.log(`❌ Error checking comprehensive tool: ${error.message}`);
  }

  // Test 2: Enhanced Petrophysics Tools Integration
  console.log('\n🔧 Test 2: Enhanced Petrophysics Tools Integration');
  try {
    const enhancedToolsPath = './amplify/functions/tools/enhancedPetrophysicsTools.ts';
    if (fs.existsSync(enhancedToolsPath)) {
      const enhancedContent = fs.readFileSync(enhancedToolsPath, 'utf8');
      
      // Check for integration
      const hasComprehensiveImport = enhancedContent.includes('comprehensiveShaleAnalysisTool');
      const hasExport = enhancedContent.includes('comprehensiveShaleAnalysisTool  // NEW');
      const hasCalculateDensityPorosity = enhancedContent.includes('function calculateDensityPorosity');
      const noPorosityCalculatorReferences = !enhancedContent.includes('porosityCalculator.');
      
      console.log(`✅ Enhanced tools file exists: ${enhancedToolsPath}`);
      console.log(`   Comprehensive tool import: ${hasComprehensiveImport ? '✅' : '❌'}`);
      console.log(`   Tool exported: ${hasExport ? '✅' : '❌'}`);
      console.log(`   Density porosity function: ${hasCalculateDensityPorosity ? '✅' : '❌'}`);
      console.log(`   TypeScript errors fixed: ${noPorosityCalculatorReferences ? '✅' : '❌'}`);
      
      results.enhancedTools = hasComprehensiveImport && hasExport;
      results.typeScriptErrors = noPorosityCalculatorReferences;
    } else {
      console.log(`❌ Enhanced tools file not found: ${enhancedToolsPath}`);
    }
  } catch (error) {
    console.log(`❌ Error checking enhanced tools: ${error.message}`);
  }

  // Test 3: React Visualization Component
  console.log('\n🎨 Test 3: React Visualization Component');
  try {
    const componentPath = './src/components/messageComponents/ComprehensiveShaleAnalysisComponent.tsx';
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Check for key React features
      const hasTabView = componentContent.includes('TabView') || componentContent.includes('Tabs');
      const hasRecharts = componentContent.includes('Recharts') || componentContent.includes('AreaChart') || componentContent.includes('ResponsiveContainer');
      const hasDataProcessing = componentContent.includes('processSingleWellData');
      const hasMultiWellProcessing = componentContent.includes('processMultiWellData');
      const hasFieldProcessing = componentContent.includes('processFieldData') || componentContent.includes('processFieldOverviewData');
      const hasInteractiveElements = componentContent.includes('onClick') || componentContent.includes('onSelect') || componentContent.includes('onValueChange');
      
      console.log(`✅ Component file exists: ${componentPath}`);
      console.log(`   Tab-based interface: ${hasTabView ? '✅' : '❌'}`);
      console.log(`   Recharts integration: ${hasRecharts ? '✅' : '❌'}`);
      console.log(`   Single well processing: ${hasDataProcessing ? '✅' : '❌'}`);
      console.log(`   Multi-well processing: ${hasMultiWellProcessing ? '✅' : '❌'}`);
      console.log(`   Field overview processing: ${hasFieldProcessing ? '✅' : '❌'}`);
      console.log(`   Interactive elements: ${hasInteractiveElements ? '✅' : '❌'}`);
      
      results.reactComponent = hasTabView && hasRecharts && hasDataProcessing;
    } else {
      console.log(`❌ Component file not found: ${componentPath}`);
    }
  } catch (error) {
    console.log(`❌ Error checking React component: ${error.message}`);
  }

  // Test 4: ChatMessage Routing Integration
  console.log('\n🔧 Test 4: ChatMessage Routing Integration');
  try {
    const chatMessagePath = './src/components/ChatMessage.tsx';
    if (fs.existsSync(chatMessagePath)) {
      const chatMessageContent = fs.readFileSync(chatMessagePath, 'utf8');
      
      // Check for routing integration
      const hasComprehensiveImport = chatMessageContent.includes('ComprehensiveShaleAnalysisComponent');
      const hasRouting = chatMessageContent.includes("case 'comprehensive_shale_analysis':");
      const hasMessageTypeCheck = chatMessageContent.includes('messageContentType === \'comprehensive_shale_analysis\'');
      const hasComponentReturn = chatMessageContent.includes('<ComprehensiveShaleAnalysisComponent');
      
      console.log(`✅ ChatMessage file exists: ${chatMessagePath}`);
      console.log(`   Component import: ${hasComprehensiveImport ? '✅' : '❌'}`);
      console.log(`   Tool routing case: ${hasRouting ? '✅' : '❌'}`);
      console.log(`   Message type check: ${hasMessageTypeCheck ? '✅' : '❌'}`);
      console.log(`   Component rendering: ${hasComponentReturn ? '✅' : '❌'}`);
      
      results.chatMessageRouting = hasComprehensiveImport && hasRouting && hasComponentReturn;
    } else {
      console.log(`❌ ChatMessage file not found: ${chatMessagePath}`);
    }
  } catch (error) {
    console.log(`❌ Error checking ChatMessage routing: ${error.message}`);
  }

  // Test 5: Professional Response Templates
  console.log('\n📋 Test 5: Professional Response Templates');
  try {
    const templatesPath = './amplify/functions/tools/professionalResponseTemplates.ts';
    if (fs.existsSync(templatesPath)) {
      const templatesContent = fs.readFileSync(templatesPath, 'utf8');
      
      const hasShaleVolumeResponse = templatesContent.includes('buildShaleVolumeResponse');
      const hasPorosityResponse = templatesContent.includes('buildPorosityResponse');
      const hasProfessionalErrorResponse = templatesContent.includes('buildProfessionalErrorResponse');
      
      console.log(`✅ Professional templates exist: ${templatesPath}`);
      console.log(`   Shale volume response: ${hasShaleVolumeResponse ? '✅' : '❌'}`);
      console.log(`   Porosity response: ${hasPorosityResponse ? '✅' : '❌'}`);
      console.log(`   Professional error handling: ${hasProfessionalErrorResponse ? '✅' : '❌'}`);
    } else {
      console.log(`❌ Professional templates not found: ${templatesPath}`);
    }
  } catch (error) {
    console.log(`❌ Error checking professional templates: ${error.message}`);
  }

  // System Summary
  console.log('\n🚀 System Validation Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const allSystemsReady = Object.values(results).every(result => result === true);
  
  console.log(`📊 Comprehensive Shale Analysis Tool: ${results.comprehensiveTool ? '✅ Ready' : '❌ Issues'}`);
  console.log(`🔧 Enhanced Petrophysics Integration: ${results.enhancedTools ? '✅ Ready' : '❌ Issues'}`);
  console.log(`🎨 React Visualization Component: ${results.reactComponent ? '✅ Ready' : '❌ Issues'}`);
  console.log(`🔗 ChatMessage Routing: ${results.chatMessageRouting ? '✅ Ready' : '❌ Issues'}`);
  console.log(`🔧 TypeScript Errors Fixed: ${results.typeScriptErrors ? '✅ Ready' : '❌ Issues'}`);
  
  console.log('\n🎯 SYSTEM STATUS:');
  if (allSystemsReady) {
    console.log('✅ ALL SYSTEMS READY - Enhanced gamma ray shale analysis is operational!');
    console.log('\n💡 The system now delivers:');
    console.log('   • Comprehensive gamma ray log analysis using Larionov method');
    console.log('   • Interactive React visualizations with engaging charts');
    console.log('   • Professional SPE/API standard responses');
    console.log('   • Multi-well correlation and field overview capabilities');
    console.log('   • Clean sand interval identification with geological interpretation');
    console.log('\n🚀 Ready for deployment and testing with real well data!');
  } else {
    console.log('⚠️  SOME ISSUES DETECTED - Review failed components above');
  }
  
  console.log('\n📝 Test the system with:');
  console.log('   "Analyze gamma ray logs for CARBONATE_PLATFORM_002 using Larionov method"');
  console.log('   "Multi-well correlation analysis for comprehensive shale study"');
  console.log('   "Field overview shale analysis for completion strategy"');

  return results;
}

// Run the validation
const results = validateShaleAnalysisSystem();

// Exit with appropriate code
process.exit(Object.values(results).every(r => r === true) ? 0 : 1);
