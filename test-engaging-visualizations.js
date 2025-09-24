const testEngagingVisualizations = async () => {
  console.log('🧪 Testing Original User Prompt for Engaging Visualizations');
  console.log('='.repeat(70));
  
  const originalPrompt = 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.';
  
  console.log('Original Prompt:', originalPrompt);
  console.log('\nExpected: Engaging interactive visualizations');
  console.log('Previous Result: Basic text outlines (underwhelming)');
  
  try {
    const response = await fetch('https://main.d1kmb31vw2585w.amplifyapp.com/api/agents/enhanced-strands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: originalPrompt,
        sessionId: 'test-visual-' + Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('\n🎯 ANALYSIS RESULT:');
    console.log('Response Type:', typeof result.response);
    console.log('Has Response:', !!result.response);
    
    if (result.response && typeof result.response === 'object') {
      console.log('✅ INTERACTIVE COMPONENT DETECTED');
      console.log('Component Type:', result.response.type);
      console.log('Component Props Keys:', Object.keys(result.response.props || {}));
      
      if (result.response.type === 'ComprehensiveShaleAnalysisComponent') {
        console.log('\n🎨 VISUALIZATION FEATURES:');
        const props = result.response.props;
        console.log('- Wells Analyzed:', props.wells?.length || 0);
        console.log('- Interactive Charts:', !!props.chartData);
        console.log('- Clean Sand Intervals:', !!props.cleanSandIntervals);
        console.log('- Professional Summary:', !!props.summary);
        console.log('- Larionov Calculations:', !!props.shaleVolumeData);
        
        console.log('\n✅ SUCCESS: Engaging visualizations are now delivered!');
        console.log('❌ No more basic text outlines');
        return true;
      }
    } else if (typeof result.response === 'string') {
      console.log('❌ BASIC TEXT RESPONSE (Still underwhelming):');
      console.log(result.response.substring(0, 200) + '...');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    return false;
  }
};

testEngagingVisualizations().then(success => {
  if (success) {
    console.log('\n🎉 TRANSFORMATION COMPLETE: Underwhelming → Engaging!');
  } else {
    console.log('\n⚠️  System may need additional validation');
  }
});
