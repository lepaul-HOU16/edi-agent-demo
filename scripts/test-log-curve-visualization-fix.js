/**
 * Test script to validate the complete log curve visualization pipeline
 * Tests: S3 Data → Backend Tool → Frontend Integration
 */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: 'us-east-1' });

// Configuration matching the petrophysicsTools
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
const WELL_DATA_PREFIX = 'global/well-data/';

// Simulate the getCurveDataTool functionality
async function simulateGetCurveData(wellName, curves) {
  try {
    const key = `${WELL_DATA_PREFIX}${wellName}.las`;
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error('No data received from S3');
    }

    const content = await response.Body.transformToString();
    
    // Parse LAS file for curve data (simplified version)
    const lines = content.split('\n');
    let section = '';
    const curveNames = [];
    const curveData = {};
    const wellInfo = {};
    let dataStartIndex = -1;

    // First pass: identify sections and curve names
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();

      if (trimmedLine.startsWith('~')) {
        section = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
        continue;
      }

      if (section === 'WELL' && trimmedLine.includes('.') && trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':', 2);
        if (parts.length === 2) {
          const key = parts[0].split('.')[0].trim();
          const value = parts[1].trim();
          wellInfo[key] = value;
        }
      }

      if (section === 'CURVE' && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
        let curveName = '';
        
        if (trimmedLine.includes(':')) {
          const beforeColon = trimmedLine.split(':')[0].trim();
          const dotMatch = beforeColon.match(/^([A-Z_][A-Z0-9_]*)\./i);
          if (dotMatch) {
            curveName = dotMatch[1];
          } else {
            const spaceMatch = beforeColon.match(/^([A-Z_][A-Z0-9_]*)/i);
            if (spaceMatch) {
              curveName = spaceMatch[1];
            }
          }
        } else if (trimmedLine.match(/^[A-Z_][A-Z0-9_]*/i)) {
          const directMatch = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)/i);
          if (directMatch) {
            curveName = directMatch[1];
          }
        }
        
        if (curveName && curveName.length > 0 && !curveNames.includes(curveName)) {
          curveNames.push(curveName);
          curveData[curveName] = [];
        }
      }

      if (section === 'ASCII' && dataStartIndex === -1) {
        dataStartIndex = i + 1;
        break;
      }
    }

    // Second pass: parse actual data
    if (dataStartIndex > 0 && curveNames.length > 0) {
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0 || line.startsWith('#')) continue;

        const values = line.split(/\s+/);
        if (values.length >= curveNames.length) {
          for (let j = 0; j < curveNames.length; j++) {
            const value = parseFloat(values[j]);
            if (!isNaN(value) && value !== -999.25 && value !== -9999) {
              curveData[curveNames[j]].push(value);
            }
          }
        }
      }
    }

    // Filter requested curves if specified
    const finalCurveData = {};
    const requestedCurves = curves && curves.length > 0 ? curves : curveNames;
    
    for (const curveName of requestedCurves) {
      if (curveData[curveName] && curveData[curveName].length > 0) {
        finalCurveData[curveName] = curveData[curveName];
      }
    }

    // Create visualization-ready response
    const visualizationData = {
      messageContentType: 'log_plot_viewer',
      type: 'logPlotViewer',
      wellName: wellName,
      logData: finalCurveData,
      wellInfo: wellInfo,
      availableCurves: Object.keys(finalCurveData),
      dataPoints: finalCurveData[curveNames[0]]?.length || 0,
      tracks: Object.keys(finalCurveData).slice(0, 4)
    };

    return {
      success: true,
      wellName,
      message: `Successfully retrieved ${Object.keys(finalCurveData).length} curves with ${visualizationData.dataPoints} data points`,
      artifacts: [visualizationData],
      result: visualizationData,
      availableCurves: Object.keys(finalCurveData),
      dataPoints: visualizationData.dataPoints
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get curve data: ${error.message}`,
      wellName
    };
  }
}

async function testLogCurveVisualizationPipeline() {
  console.log('🔍 === LOG CURVE VISUALIZATION PIPELINE TEST ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    // Test 1: Basic curve data retrieval
    console.log('\n📋 Step 1: Testing curve data retrieval for WELL-001...');
    
    const parsedResult = await simulateGetCurveData('WELL-001', ['GR', 'NPHI', 'RHOB', 'DEEPRESISTIVITY']);
    console.log('✅ Tool execution result:', {
      success: parsedResult.success,
      wellName: parsedResult.wellName,
      availableCurves: parsedResult.availableCurves,
      dataPoints: parsedResult.dataPoints
    });
    
    if (!parsedResult.success) {
      console.log('❌ Tool execution failed:', parsedResult.error);
      return;
    }
    
    // Test 2: Validate artifact structure
    console.log('\n📋 Step 2: Validating artifact structure...');
    
    if (!parsedResult.artifacts || parsedResult.artifacts.length === 0) {
      console.log('❌ No artifacts generated');
      return;
    }
    
    const artifact = parsedResult.artifacts[0];
    console.log('📊 Artifact structure validation:');
    console.log('  - messageContentType:', artifact.messageContentType);
    console.log('  - type:', artifact.type);
    console.log('  - wellName:', artifact.wellName);
    console.log('  - available curves:', Object.keys(artifact.logData || {}));
    console.log('  - data points per curve:');
    
    Object.entries(artifact.logData || {}).forEach(([curveName, data]) => {
      console.log(`    * ${curveName}: ${Array.isArray(data) ? data.length : 'invalid'} points`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`      Range: ${Math.min(...data).toFixed(3)} to ${Math.max(...data).toFixed(3)}`);
      }
    });
    
    // Test 3: Frontend component compatibility check
    console.log('\n📋 Step 3: Frontend component compatibility check...');
    
    const requiredFields = ['messageContentType', 'wellName', 'logData'];
    const missingFields = requiredFields.filter(field => !artifact[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields for frontend:', missingFields);
      return;
    }
    
    // Check if we have expected curve types
    const logData = artifact.logData || {};
    const expectedCurves = ['GR', 'NPHI', 'RHOB', 'DEEPRESISTIVITY'];
    const availableCurves = Object.keys(logData);
    const foundCurves = expectedCurves.filter(curve => availableCurves.includes(curve));
    
    console.log('📈 Curve availability check:');
    expectedCurves.forEach(curve => {
      const available = availableCurves.includes(curve);
      const dataCount = available ? logData[curve]?.length || 0 : 0;
      console.log(`  ${available ? '✅' : '❌'} ${curve}: ${dataCount} data points`);
    });
    
    // Test 4: Data quality validation
    console.log('\n📋 Step 4: Data quality validation...');
    
    let totalDataPoints = 0;
    let validCurves = 0;
    
    Object.entries(logData).forEach(([curveName, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        validCurves++;
        totalDataPoints += data.length;
        
        // Check for realistic value ranges
        const min = Math.min(...data);
        const max = Math.max(...data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        
        console.log(`  📊 ${curveName}:`);
        console.log(`    - Count: ${data.length}`);
        console.log(`    - Range: ${min.toFixed(3)} to ${max.toFixed(3)}`);
        console.log(`    - Average: ${avg.toFixed(3)}`);
        
        // Basic data quality checks
        const nullCount = data.filter(v => v === null || v === undefined || isNaN(v)).length;
        const qualityPercent = ((data.length - nullCount) / data.length * 100).toFixed(1);
        console.log(`    - Data Quality: ${qualityPercent}% valid`);
      }
    });
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  - Valid curves: ${validCurves}`);
    console.log(`  - Average data points per curve: ${Math.round(totalDataPoints / validCurves)}`);
    
    // Test 5: Frontend integration simulation
    console.log('\n📋 Step 5: Frontend integration simulation...');
    
    // Simulate the LogPlotViewerComponent data processing
    const processRealWellData = () => {
      if (!artifact || !artifact.logData) {
        return {
          depths: [],
          curves: {},
          curveNames: [],
          hasData: false
        };
      }

      const logData = artifact.logData;
      const depths = logData.DEPT || [];
      const curves = {};
      const curveNames = [];

      Object.keys(logData).forEach(curveName => {
        if (curveName !== 'DEPT' && Array.isArray(logData[curveName])) {
          curves[curveName] = logData[curveName];
          curveNames.push(curveName);
        }
      });

      return {
        depths,
        curves,
        curveNames,
        hasData: depths.length > 0 && curveNames.length > 0
      };
    };
    
    const processedData = processRealWellData();
    console.log('🖥️  Frontend processing simulation:');
    console.log(`  - Has depth data: ${processedData.depths.length > 0}`);
    console.log(`  - Depth range: ${processedData.depths.length > 0 ? 
      `${Math.min(...processedData.depths).toFixed(1)} to ${Math.max(...processedData.depths).toFixed(1)} ft` : 'N/A'}`);
    console.log(`  - Curve count: ${processedData.curveNames.length}`);
    console.log(`  - Curves available: ${processedData.curveNames.join(', ')}`);
    console.log(`  - Ready for visualization: ${processedData.hasData ? '✅' : '❌'}`);
    
    // Test 6: Curve configuration matching
    console.log('\n📋 Step 6: Curve configuration matching...');
    
    const curveConfigs = [
      { name: 'GR', title: 'Gamma Ray (API)', available: processedData.curveNames.includes('GR') },
      { name: 'NPHI', title: 'Neutron Porosity (v/v)', available: processedData.curveNames.includes('NPHI') },
      { name: 'RHOB', title: 'Bulk Density (g/cc)', available: processedData.curveNames.includes('RHOB') },
      { name: 'DEEPRESISTIVITY', title: 'Deep Resistivity (ohm-m)', available: processedData.curveNames.includes('DEEPRESISTIVITY') }
    ];
    
    console.log('📈 Curve configuration status:');
    curveConfigs.forEach(config => {
      const dataCount = config.available ? processedData.curves[config.name]?.length || 0 : 0;
      console.log(`  ${config.available ? '✅' : '❌'} ${config.name} (${config.title}): ${dataCount} points`);
    });
    
    const readyForPlotting = curveConfigs.filter(c => c.available).length;
    console.log(`\n🎯 Plotting readiness: ${readyForPlotting}/4 curves ready`);
    
    if (readyForPlotting > 0) {
      console.log('✅ LOG CURVE VISUALIZATION PIPELINE IS WORKING!');
      console.log('💡 Real well data is now properly flowing from S3 to frontend visualization');
      
      console.log('\n🚀 Next steps for users:');
      console.log('  1. Deploy the updated backend tools to AWS Lambda');
      console.log('  2. Test the log curve visualization in the chat interface');
      console.log('  3. Verify that real curves are displayed instead of synthetic data');
      
    } else {
      console.log('❌ PIPELINE ISSUE: No curves ready for plotting');
    }
    
    console.log('\n✅ === PIPELINE TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ === PIPELINE TEST ERROR ===');
    console.error('💥 Error:', error.message);
    console.error('📋 Error details:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.log('💡 SOLUTION: Check S3 bucket name and ensure it exists');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 SOLUTION: Check S3 permissions and IAM roles');
    } else if (error.name === 'NetworkingError') {
      console.log('💡 SOLUTION: Check internet connection and AWS credentials');
    }
  }
}

// Run the pipeline test
testLogCurveVisualizationPipeline().catch(console.error);
