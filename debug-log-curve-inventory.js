/**
 * Debug script to check log curve inventory issues
 * This will test S3 connectivity and well data availability
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: 'us-east-1' });

// Configuration from the petrophysicsTools.ts
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
const WELL_DATA_PREFIX = 'global/well-data/';

async function debugLogCurveInventory() {
  console.log('🔍 === LOG CURVE INVENTORY DIAGNOSTIC ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🪣 S3 Bucket:', S3_BUCKET);
  console.log('📁 Well Data Prefix:', WELL_DATA_PREFIX);
  
  try {
    // Step 1: Test S3 bucket access
    console.log('\n📋 Step 1: Testing S3 bucket access...');
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: WELL_DATA_PREFIX,
      MaxKeys: 10
    });
    
    const response = await s3Client.send(listCommand);
    console.log('✅ S3 Connection successful');
    console.log('📊 Objects found:', response.Contents?.length || 0);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ ISSUE IDENTIFIED: No objects found in S3 bucket');
      console.log('🔍 Checking bucket root...');
      
      // Check bucket root
      const rootCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        MaxKeys: 20
      });
      
      const rootResponse = await s3Client.send(rootCommand);
      console.log('📁 Root bucket contents:');
      rootResponse.Contents?.forEach(obj => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
      
      return;
    }
    
    // Step 2: List well files
    console.log('\n📋 Step 2: Analyzing well files...');
    const wellFiles = [];
    response.Contents.forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.las')) {
        const wellName = obj.Key.replace(WELL_DATA_PREFIX, '').replace('.las', '');
        wellFiles.push({
          wellName,
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        });
      }
    });
    
    console.log(`📊 Well files found: ${wellFiles.length}`);
    wellFiles.slice(0, 5).forEach(well => {
      console.log(`  - ${well.wellName} (${well.size} bytes)`);
    });
    
    if (wellFiles.length === 0) {
      console.log('❌ ISSUE IDENTIFIED: No .las files found');
      console.log('📁 Available files:');
      response.Contents.forEach(obj => {
        console.log(`  - ${obj.Key}`);
      });
      return;
    }
    
    // Step 3: Test curve parsing for first well
    console.log(`\n📋 Step 3: Testing curve parsing for ${wellFiles[0].wellName}...`);
    
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: wellFiles[0].key
    });
    
    const wellResponse = await s3Client.send(getCommand);
    if (!wellResponse.Body) {
      console.log('❌ ISSUE IDENTIFIED: Unable to read well file content');
      return;
    }
    
    const content = await wellResponse.Body.transformToString();
    console.log(`📄 File content length: ${content.length} characters`);
    
    // Parse curves
    const lines = content.split('\n');
    let section = '';
    const curves = [];
    let wellInfo = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('~')) {
        section = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
        console.log(`📑 Found section: ${section}`);
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
          // Handle multiple LAS curve formats
          // Format 1: CURVENAME.UNIT : DESCRIPTION
          // Format 2: CURVENAME UNIT : DESCRIPTION  
          // Format 3: CURVENAME:DESCRIPTION
          
          let curveName = '';
          
          if (trimmedLine.includes(':')) {
            const beforeColon = trimmedLine.split(':')[0].trim();
            
            // Try format: CURVENAME.UNIT
            const dotMatch = beforeColon.match(/^([A-Z_][A-Z0-9_]*)\./i);
            if (dotMatch) {
              curveName = dotMatch[1];
            } 
            // Try format: CURVENAME UNIT (space separated)
            else {
              const spaceMatch = beforeColon.match(/^([A-Z_][A-Z0-9_]*)/i);
              if (spaceMatch) {
                curveName = spaceMatch[1];
              }
            }
          }
          // Handle lines without colons but with curve definitions
          else if (trimmedLine.match(/^[A-Z_][A-Z0-9_]*/i)) {
            const directMatch = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)/i);
            if (directMatch) {
              curveName = directMatch[1];
            }
          }
          
          // Add curve if we found a valid name and it's not already in the list
          if (curveName && curveName.length > 0 && !curves.includes(curveName)) {
            curves.push(curveName);
          }
        }
    }
    
    console.log('📊 Parsing results:');
    console.log(`  - Well info fields: ${Object.keys(wellInfo).length}`);
    console.log(`  - Curves found: ${curves.length}`);
    console.log('📈 Available curves:', curves.join(', '));
    
    if (curves.length === 0) {
      console.log('❌ ISSUE IDENTIFIED: No curves found in LAS file');
      console.log('🔍 LAS file preview (first 20 lines):');
      lines.slice(0, 20).forEach((line, i) => {
        console.log(`${i + 1}: ${line}`);
      });
    } else {
      console.log('✅ Curves successfully parsed from LAS file');
    }
    
    // Step 4: Test the petrophysics functionality directly
    console.log('\n📋 Step 4: Testing petrophysics functionality directly...');
    
    try {
      // Replicate the listWellsTool functionality
      console.log('🔄 Testing well listing functionality...');
      const wellListCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: WELL_DATA_PREFIX,
        Delimiter: '/'
      });

      const wellListResponse = await s3Client.send(wellListCommand);
      const wells = [];

      if (wellListResponse.Contents) {
        for (const object of wellListResponse.Contents) {
          if (object.Key && object.Key.endsWith('.las')) {
            const wellName = object.Key.replace(WELL_DATA_PREFIX, '').replace('.las', '');
            wells.push(wellName);
          }
        }
      }

      console.log('📊 Well listing result:', {
        success: wells.length > 0,
        wellCount: wells.length,
        wells: wells.slice(0, 3)
      });
      
      if (wells.length > 0) {
        // Test well info functionality with first well
        console.log(`🔄 Testing well info functionality for ${wells[0]}...`);
        const wellInfoCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: `${WELL_DATA_PREFIX}${wells[0]}.las`
        });

        const wellInfoResponse = await s3Client.send(wellInfoCommand);
        if (!wellInfoResponse.Body) {
          throw new Error('No data received from S3');
        }

        const wellContent = await wellInfoResponse.Body.transformToString();
        
        // Parse well info and curves
        const wellLines = wellContent.split('\n');
        let wellSection = '';
        const wellCurves = [];
        const wellInfoData = {};

        for (const line of wellLines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith('~')) {
            wellSection = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
            continue;
          }

          if (wellSection === 'WELL' && trimmedLine.includes('.') && trimmedLine.includes(':')) {
            const parts = trimmedLine.split(':', 2);
            if (parts.length === 2) {
              const key = parts[0].split('.')[0].trim();
              const value = parts[1].trim();
              wellInfoData[key] = value;
            }
          }

          if (wellSection === 'CURVE' && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
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
            
            if (curveName && curveName.length > 0 && !wellCurves.includes(curveName)) {
              wellCurves.push(curveName);
            }
          }
        }

        console.log('📊 Well info result:', {
          success: wellCurves.length > 0,
          wellInfoFields: Object.keys(wellInfoData).length,
          curveCount: wellCurves.length,
          curves: wellCurves.slice(0, 8)
        });
        
        if (wellCurves.length > 0) {
          console.log('✅ LOG CURVE INVENTORY FUNCTIONALITY IS WORKING');
          console.log('💡 The issue might be in the AWS Lambda deployment or frontend integration');
          
          // Step 5: Test multiple wells to verify consistency
          console.log('\n📋 Step 5: Testing multiple wells for consistency...');
          let totalCurves = 0;
          const curveConsistency = {};
          
          for (let i = 0; i < Math.min(3, wells.length); i++) {
            const wellName = wells[i];
            const testCommand = new GetObjectCommand({
              Bucket: S3_BUCKET,
              Key: `${WELL_DATA_PREFIX}${wellName}.las`
            });
            
            const testResponse = await s3Client.send(testCommand);
            if (testResponse.Body) {
              const testContent = await testResponse.Body.transformToString();
              const testLines = testContent.split('\n');
              let testSection = '';
              const testCurves = [];
              
              for (const line of testLines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine.startsWith('~')) {
                  testSection = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
                  continue;
                }
                
                if (testSection === 'CURVE' && trimmedLine.length > 0 && !trimmedLine.startsWith('#')) {
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
                  }
                  
                  if (curveName && !testCurves.includes(curveName)) {
                    testCurves.push(curveName);
                    curveConsistency[curveName] = (curveConsistency[curveName] || 0) + 1;
                  }
                }
              }
              
              console.log(`  - ${wellName}: ${testCurves.length} curves`);
              totalCurves += testCurves.length;
            }
          }
          
          console.log('📊 Multi-well consistency check:');
          console.log(`  - Average curves per well: ${Math.round(totalCurves / Math.min(3, wells.length))}`);
          console.log('  - Common curves across wells:');
          
          const commonCurves = Object.entries(curveConsistency)
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
          commonCurves.forEach(([curve, count]) => {
            console.log(`    * ${curve}: found in ${count} wells`);
          });
          
          if (commonCurves.length > 0) {
            console.log('✅ CONSISTENT LOG CURVE INVENTORY ACROSS MULTIPLE WELLS');
            console.log('🎯 CONCLUSION: S3 data and parsing logic are working correctly');
            console.log('💡 If users report missing curves, check:');
            console.log('   1. AWS Lambda function deployment');
            console.log('   2. Frontend-backend integration');
            console.log('   3. Error handling in the chat interface');
          }
          
        } else {
          console.log('❌ ISSUE IDENTIFIED: Well info parsing not working');
        }
        
      } else {
        console.log('❌ ISSUE IDENTIFIED: Well listing not working');
      }
      
    } catch (toolError) {
      console.log('❌ ISSUE IDENTIFIED: Error testing petrophysics functionality:', toolError.message);
      console.log('📋 Full error:', toolError);
    }
    
    console.log('\n✅ === DIAGNOSTIC COMPLETE ===');
    
  } catch (error) {
    console.error('❌ === DIAGNOSTIC ERROR ===');
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

// Run the diagnostic
debugLogCurveInventory().catch(console.error);
