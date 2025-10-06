/**
 * Test S3 bucket access directly to debug the log curve data issue
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

console.log('🔍 === DIRECT S3 BUCKET ACCESS TEST ===');
console.log('🎯 Testing if we can access well data directly from S3');

async function testS3BucketAccess() {
  const s3Client = new S3Client({ region: 'us-east-1' });
  const S3_BUCKET = 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
  const WELL_DATA_PREFIX = 'global/well-data/';
  
  try {
    console.log('\n📋 Step 1: Testing S3 bucket access...');
    console.log('🪣 Bucket:', S3_BUCKET);
    console.log('📁 Prefix:', WELL_DATA_PREFIX);
    
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: WELL_DATA_PREFIX,
      MaxKeys: 10
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    console.log('📊 S3 ListObjects result:', {
      keyCount: listResponse.KeyCount || 0,
      isTruncated: listResponse.IsTruncated,
      hasContents: !!listResponse.Contents,
      contentsLength: listResponse.Contents?.length || 0
    });
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('❌ CRITICAL: No objects found in S3 bucket');
      console.log('💡 This explains why no wells are available');
      console.log('🔧 Check if well data exists at path:', WELL_DATA_PREFIX);
      return;
    }
    
    // Show first few objects
    console.log('\n📋 First few S3 objects:');
    listResponse.Contents.slice(0, 5).forEach((obj, i) => {
      console.log(`  ${i + 1}. ${obj.Key} (${obj.Size} bytes)`);
    });
    
    // Extract well names
    const wells = [];
    listResponse.Contents.forEach(obj => {
      if (obj.Key && obj.Key.endsWith('.las')) {
        const wellName = obj.Key.replace(WELL_DATA_PREFIX, '').replace('.las', '');
        wells.push(wellName);
      }
    });
    
    console.log('🎯 Wells found:', wells.length);
    console.log('📋 Well names:', wells.slice(0, 5).join(', '));
    
    if (wells.length === 0) {
      console.log('❌ CRITICAL: No .las files found');
      console.log('💡 This explains why no well data is available');
      return;
    }
    
    // Test reading a specific LAS file
    const testWell = wells[0];
    console.log(`\n📋 Step 2: Testing LAS file parsing for: ${testWell}`);
    
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${WELL_DATA_PREFIX}${testWell}.las`
    });
    
    const getResponse = await s3Client.send(getCommand);
    
    if (!getResponse.Body) {
      console.log('❌ CRITICAL: No body in S3 GetObject response');
      return;
    }
    
    const content = await getResponse.Body.transformToString();
    console.log('📄 LAS file content length:', content.length);
    console.log('📋 First 500 characters:', content.substring(0, 500));
    
    // Parse curves section
    const lines = content.split('\n');
    let section = '';
    const curves = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('~')) {
        section = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
        if (section === 'CURVE') {
          console.log('📊 Found CURVE section in LAS file');
        }
        continue;
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
        }
        
        if (curveName && curveName.length > 0 && !curves.includes(curveName)) {
          curves.push(curveName);
        }
      }
    }
    
    console.log('🎯 Parsed curves from LAS file:', curves.length);
    console.log('📋 Curve names:', curves.join(', '));
    
    if (curves.length === 0) {
      console.log('❌ CRITICAL: No curves parsed from LAS file');
      console.log('💡 This explains why log curve matrix is blank');
      console.log('🔧 Check LAS file format and parsing logic');
    } else {
      console.log('✅ LAS file parsing working - found real curves');
      console.log('💡 S3 data pipeline should be working');
    }
    
    console.log('\n🎯 === DIAGNOSIS ===');
    if (wells.length > 0 && curves.length > 0) {
      console.log('✅ S3 data is available and parseable');
      console.log('💡 Issue must be in agent artifact generation or response processing');
    } else if (wells.length === 0) {
      console.log('❌ No well data in S3 - need to check data upload');
    } else if (curves.length === 0) {
      console.log('❌ LAS file parsing broken - need to fix curve extraction');
    }
    
  } catch (error) {
    console.error('💥 S3 access test failed:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.log('❌ CRITICAL: S3 bucket does not exist or is inaccessible');
    } else if (error.name === 'AccessDenied') {
      console.log('❌ CRITICAL: No permission to access S3 bucket');
    } else {
      console.log('❌ CRITICAL: Unknown S3 access error');
    }
    
    console.log('🔧 This explains why MCP tools cannot access real data');
  }
}

testS3BucketAccess().catch(console.error);
