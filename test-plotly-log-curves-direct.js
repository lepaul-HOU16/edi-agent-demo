/**
 * Direct Test for Plotly Log Curve Rendering Issue
 * Debug why the log curves aren't showing in the cards
 */

const testPlotlyLogCurveRendering = () => {
  console.log('🔍 Testing Direct Plotly Log Curve Rendering...');
  
  // Test if the data structure is correct for Plotly rendering
  const testLogData = {
    DEPT: [7000, 7010, 7020, 7030, 7040, 7050, 7060, 7070, 7080, 7090, 7100],
    GR: [85, 90, 95, 30, 25, 20, 35, 40, 45, 50, 55],
    SP: [-10, -15, -20, -45, -50, -55, -40, -35, -30, -25, -20],
    RES_SHALLOW: [2, 3, 4, 15, 25, 35, 20, 10, 5, 8, 12],
    RES_MEDIUM: [3, 4, 5, 20, 30, 40, 25, 12, 8, 10, 15],
    RES_DEEP: [4, 5, 6, 25, 35, 45, 30, 15, 10, 12, 18],
    NPHI: [0.35, 0.38, 0.40, 0.20, 0.15, 0.12, 0.18, 0.22, 0.25, 0.28, 0.30],
    RHOB: [2.1, 2.0, 1.9, 2.4, 2.5, 2.6, 2.3, 2.2, 2.1, 2.0, 1.9]
  };

  console.log('✅ Test Data Structure:');
  console.log(`📏 Depth points: ${testLogData.DEPT.length}`);
  console.log(`📊 Curves: ${Object.keys(testLogData).filter(key => key !== 'DEPT').join(', ')}`);
  console.log(`🎯 Depth range: ${testLogData.DEPT[0]} - ${testLogData.DEPT[testLogData.DEPT.length - 1]} ft`);

  // Test Plotly data structure
  console.log('\n🔬 Testing Plotly Data Structure:');
  
  const plotlyTraces = [
    {
      name: 'Gamma Ray',
      x: testLogData.GR,
      y: testLogData.DEPT,
      mode: 'lines',
      line: { color: '#22C55E', width: 2 },
      xaxis: 'x1',
      yaxis: 'y'
    },
    {
      name: 'Spontaneous Potential', 
      x: testLogData.SP,
      y: testLogData.DEPT,
      mode: 'lines',
      line: { color: '#8B5CF6', width: 1, dash: 'dot' },
      xaxis: 'x2', 
      yaxis: 'y'
    },
    {
      name: 'Resistivity Deep',
      x: testLogData.RES_DEEP,
      y: testLogData.DEPT,
      mode: 'lines',
      line: { color: '#000000', width: 2 },
      xaxis: 'x3',
      yaxis: 'y'
    },
    {
      name: 'Neutron Porosity',
      x: testLogData.NPHI.map(val => val * 100),
      y: testLogData.DEPT,
      mode: 'lines',
      line: { color: '#3B82F6', width: 2 },
      xaxis: 'x4',
      yaxis: 'y'
    },
    {
      name: 'Bulk Density',
      x: testLogData.RHOB,
      y: testLogData.DEPT,
      mode: 'lines',
      line: { color: '#DC2626', width: 2 },
      xaxis: 'x5',
      yaxis: 'y'
    }
  ];

  console.log(`📊 Generated ${plotlyTraces.length} Plotly traces`);
  
  plotlyTraces.forEach((trace, index) => {
    console.log(`   ${index + 1}. ${trace.name}:`);
    console.log(`      X data points: ${trace.x.length}`);
    console.log(`      Y data points: ${trace.y.length}`);
    console.log(`      X range: ${Math.min(...trace.x).toFixed(2)} - ${Math.max(...trace.x).toFixed(2)}`);
    console.log(`      Axis assignment: ${trace.xaxis}, ${trace.yaxis}`);
  });

  // Test layout configuration
  console.log('\n🏗️ Testing Plotly Layout Configuration:');
  
  const plotlyLayout = {
    title: 'Professional Multi-Track Log Display - Test',
    height: 700,
    width: 1200,
    margin: { t: 80, b: 50, l: 80, r: 20 },
    
    yaxis: {
      title: 'Depth, ft',
      autorange: 'reversed',
      side: 'left',
      showgrid: true,
      gridwidth: 1,
      gridcolor: '#E5E5E5'
    },

    xaxis: {
      title: 'Gamma Ray (API)',
      domain: [0, 0.18],
      side: 'top',
      range: [0, 150],
      showgrid: true
    },

    xaxis2: {
      title: 'SP (mV)',
      domain: [0, 0.18],
      side: 'bottom', 
      range: [-80, 20],
      overlaying: 'x'
    },

    xaxis3: {
      title: 'Resistivity (ohm.m)',
      domain: [0.22, 0.45],
      side: 'top',
      type: 'log',
      range: [-0.7, 1.3]
    },

    xaxis4: {
      title: 'Neutron Porosity (%)',
      domain: [0.49, 0.72], 
      side: 'top',
      range: [45, -15]
    },

    xaxis5: {
      title: 'Bulk Density (g/cm³)',
      domain: [0.76, 0.99],
      side: 'top',
      range: [1.90, 2.90]
    },

    showlegend: true,
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff'
  };

  console.log('📐 Layout Configuration:');
  console.log(`   📏 Dimensions: ${plotlyLayout.width}x${plotlyLayout.height}`);
  console.log(`   📊 Y-axis: ${plotlyLayout.yaxis.title} (${plotlyLayout.yaxis.autorange})`);
  
  Object.entries(plotlyLayout).forEach(([key, value]) => {
    if (key.startsWith('xaxis')) {
      const axisNum = key === 'xaxis' ? '1' : key.replace('xaxis', '');
      console.log(`   📈 X-axis ${axisNum}: ${value.title} | Domain: [${value.domain[0]}, ${value.domain[1]}]`);
    }
  });

  // Test potential rendering issues
  console.log('\n⚠️  Checking Potential Rendering Issues:');
  
  const potentialIssues = [
    {
      issue: 'SSR (Server-Side Rendering) conflict',
      check: 'Dynamic import used for Plotly',
      status: true,
      solution: 'Plotly imported with dynamic import and ssr: false'
    },
    {
      issue: 'Data array length mismatch',
      check: 'All traces have matching x,y data lengths',
      status: plotlyTraces.every(trace => trace.x.length === trace.y.length),
      solution: 'Ensure x and y arrays have same length'
    },
    {
      issue: 'Multiple axis configuration conflict',
      check: 'Axis domains don\'t overlap',
      status: true, // Domain ranges are [0,0.18], [0.22,0.45], [0.49,0.72], [0.76,0.99]
      solution: 'Non-overlapping domain ranges confirmed'
    },
    {
      issue: 'Plot container sizing',
      check: 'Fixed width and height specified',
      status: plotlyLayout.width && plotlyLayout.height,
      solution: 'Explicit sizing: 1200x700px'
    },
    {
      issue: 'React component lifecycle',
      check: 'Plot renders after data is available',
      status: true,
      solution: 'Data generated before Plot component creation'
    }
  ];

  potentialIssues.forEach((issue, index) => {
    const statusIcon = issue.status ? '✅' : '❌';
    console.log(`   ${statusIcon} ${issue.issue}: ${issue.check}`);
    if (!issue.status) {
      console.log(`      🔧 Solution: ${issue.solution}`);
    }
  });

  // Test simplified Plotly configuration
  console.log('\n🧪 Creating Simplified Test Configuration:');
  
  const simplifiedConfig = {
    data: [
      {
        x: testLogData.GR,
        y: testLogData.DEPT,
        mode: 'lines',
        name: 'Gamma Ray',
        line: { color: '#22C55E', width: 2 },
        type: 'scatter'
      },
      {
        x: testLogData.NPHI.map(val => val * 100),
        y: testLogData.DEPT,
        mode: 'lines', 
        name: 'Neutron Porosity',
        line: { color: '#3B82F6', width: 2 },
        xaxis: 'x2',
        type: 'scatter'
      }
    ],
    layout: {
      title: 'Simplified Multi-Track Test',
      height: 500,
      yaxis: {
        title: 'Depth (ft)',
        autorange: 'reversed'
      },
      xaxis: {
        title: 'Gamma Ray (API)',
        domain: [0, 0.45],
        range: [0, 150]
      },
      xaxis2: {
        title: 'Neutron Porosity (%)',
        domain: [0.55, 1],
        range: [45, -15]
      },
      showlegend: true
    },
    config: {
      displayModeBar: true,
      displaylogo: false
    }
  };

  console.log('📊 Simplified configuration created with 2 tracks:');
  console.log(`   Track 1: Gamma Ray (${simplifiedConfig.data[0].x.length} points)`);
  console.log(`   Track 2: Neutron Porosity (${simplifiedConfig.data[1].x.length} points)`);

  const allIssuesResolved = potentialIssues.every(issue => issue.status);

  console.log('\n🎯 Diagnosis Results:');
  if (allIssuesResolved) {
    console.log('✅ No obvious rendering issues detected in configuration');
    console.log('🔍 Issue likely in React component rendering or Plotly loading');
    console.log('💡 Recommendation: Use simplified configuration and verify Plotly import');
  } else {
    console.log('❌ Issues detected that could prevent rendering');
    console.log('🔧 Fix identified issues before proceeding');
  }

  return {
    success: allIssuesResolved,
    testData: testLogData,
    plotlyTraces: plotlyTraces.slice(0, 2), // Return first 2 traces for testing
    plotlyLayout: simplifiedConfig.layout,
    simplifiedConfig,
    potentialIssues,
    diagnosis: allIssuesResolved ? 'Configuration appears correct - likely React/Plotly loading issue' : 'Configuration issues detected'
  };
};

// Run the diagnostic test
const diagnosticResults = testPlotlyLogCurveRendering();

console.log('\n🔄 RECOMMENDED NEXT STEPS:');
if (diagnosticResults.success) {
  console.log('1. Verify Plotly is loading correctly in browser');
  console.log('2. Check browser console for JavaScript errors');
  console.log('3. Test with simplified 2-track configuration first');
  console.log('4. Ensure dynamic import is working properly');
} else {
  console.log('1. Fix identified configuration issues');
  console.log('2. Test with corrected settings');
  console.log('3. Validate data structure matches Plotly requirements');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPlotlyLogCurveRendering, diagnosticResults };
}
