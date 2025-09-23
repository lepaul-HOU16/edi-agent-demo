/**
 * Debug script to test intent pattern matching directly
 */

// Simulate the matchesAny function
function matchesAny(query, patterns) {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    const matches = regex.test(query);
    if (matches) {
      console.log(`✅ Pattern "${pattern}" MATCHES query "${query}"`);
    } else {
      console.log(`❌ Pattern "${pattern}" does NOT match query "${query}"`);
    }
    return matches;
  });
}

function testIntentPatterns() {
  console.log('🧪 === INTENT PATTERN DEBUGGING ===');
  
  const testQuery = 'calculate porosity';
  console.log(`🎯 Testing query: "${testQuery}"\n`);
  
  // Test each intent pattern group
  console.log('1. 📊 Testing gamma_ray_visualization patterns:');
  const gammaRayPatterns = ['histogram', 'plot.*gamma ray', 'depth coverage', 'visualize.*gamma ray'];
  const gammaRayMatch = testQuery.includes('gamma ray') && matchesAny(testQuery, gammaRayPatterns);
  console.log('Result:', gammaRayMatch ? '✅ MATCHES' : '❌ NO MATCH');
  
  console.log('\n2. 🪨 Testing shale_analysis_workflow patterns:');
  const shalePatterns = [
    'larionov.*shale',
    'comprehensive.*shale.*analysis', 
    'gamma ray.*shale.*analysis',
    'shale.*analysis.*workflow',
    'shale.*volume.*analysis.*workflow'
  ];
  const shaleMatch = matchesAny(testQuery, shalePatterns);
  console.log('Result:', shaleMatch ? '✅ MATCHES (THIS IS THE PROBLEM!)' : '❌ NO MATCH');
  
  console.log('\n3. 🧮 Testing porosity_analysis_workflow patterns:');
  const porosityWorkflowPatterns = [
    'density.*neutron.*crossplot',
    'integrated.*porosity.*analysis', 
    'multi.*well.*porosity.*analysis',
    'extract.*density.*neutron.*log'
  ];
  const porosityWorkflowMatch = matchesAny(testQuery, porosityWorkflowPatterns);
  console.log('Result:', porosityWorkflowMatch ? '✅ MATCHES' : '❌ NO MATCH');
  
  console.log('\n4. 🧮 Testing calculate_porosity patterns:');
  const calculatePorosityPatterns = ['calculate.*porosity', 'density.*porosity', 'neutron.*porosity'];
  const calculatePorosityMatch = matchesAny(testQuery, calculatePorosityPatterns);
  console.log('Result:', calculatePorosityMatch ? '✅ MATCHES (THIS IS WHAT WE WANT!)' : '❌ NO MATCH');
  
  console.log('\n5. 🪨 Testing calculate_shale patterns:');
  const calculateShalePatterns = ['calculate.*shale', 'shale.*volume', 'larionov', 'clavier'];
  const calculateShaleMatch = matchesAny(testQuery, calculateShalePatterns);
  console.log('Result:', calculateShaleMatch ? '✅ MATCHES' : '❌ NO MATCH');
  
  console.log('\n6. 🔬 Testing formation_evaluation patterns:');
  const formationPatterns = [
    'formation.*evaluation',
    'comprehensive.*analysis',
    'analyze.*well',
    'petrophysical.*analysis'
  ];
  const formationMatch = matchesAny(testQuery, formationPatterns);
  console.log('Result:', formationMatch ? '✅ MATCHES' : '❌ NO MATCH');
  
  console.log('\n🔍 === ANALYSIS ===');
  console.log('Expected behavior for "calculate porosity":');
  console.log('- Should match calculate_porosity: ✅ Expected');
  console.log('- Should NOT match shale_analysis_workflow: ❌ Expected');
  console.log('- Should NOT match any other workflow: ❌ Expected');
  
  console.log('\nActual matching results:');
  console.log('- Gamma Ray Visualization:', gammaRayMatch);
  console.log('- Shale Analysis Workflow:', shaleMatch, shaleMatch ? '← PROBLEM!' : '');
  console.log('- Porosity Analysis Workflow:', porosityWorkflowMatch);
  console.log('- Calculate Porosity:', calculatePorosityMatch, calculatePorosityMatch ? '← CORRECT!' : '');
  console.log('- Calculate Shale:', calculateShaleMatch);
  console.log('- Formation Evaluation:', formationMatch);
  
  if (shaleMatch) {
    console.log('\n🚨 ROOT CAUSE FOUND:');
    console.log('The shale_analysis_workflow patterns are incorrectly matching "calculate porosity"');
    console.log('This explains why requests are routed to shale analysis instead of porosity calculation');
  }
  
  if (calculatePorosityMatch && !shaleMatch) {
    console.log('\n✅ INTENT PATTERNS ARE CORRECT:');
    console.log('The patterns should correctly route "calculate porosity" to the porosity handler');
  }
}

testIntentPatterns();
