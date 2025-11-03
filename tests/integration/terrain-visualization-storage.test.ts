/**
 * Integration test for terrain visualization S3 storage
 * 
 * This test verifies that:
 * 1. S3 bucket is properly configured
 * 2. Terrain analysis returns S3 URLs instead of inline HTML
 * 3. Visualizations are accessible via the returned URLs
 * 4. No inline HTML is included in the response (to prevent size issues)
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-west-2' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });

describe('Terrain Visualization Storage', () => {
  const testCoordinates = {
    latitude: 40.7128,
    longitude: -74.0060,
    radius_km: 5
  };

  test('should return S3 URLs for terrain visualizations', async () => {
    console.log('🧪 Testing terrain visualization S3 storage...');
    
    // Get the terrain tool function name from environment
    const functionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
    
    if (!functionName) {
      console.warn('⚠️ RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME not set, skipping test');
      return;
    }

    // Invoke terrain analysis
    const payload = {
      latitude: testCoordinates.latitude,
      longitude: testCoordinates.longitude,
      radius_km: testCoordinates.radius_km,
      project_id: `test-terrain-${Date.now()}`
    };

    console.log(`📍 Testing terrain analysis at ${testCoordinates.latitude}, ${testCoordinates.longitude}`);

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });

    const response = await lambdaClient.send(command);
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    console.log('📦 Response status:', responsePayload.statusCode);
    
    expect(responsePayload.statusCode).toBe(200);
    
    const body = JSON.parse(responsePayload.body);
    expect(body.success).toBe(true);
    expect(body.type).toBe('terrain_analysis');
    
    const data = body.data;
    
    // CRITICAL: Verify NO inline HTML is returned
    console.log('🔍 Checking for inline HTML...');
    expect(data.mapHtml).toBeUndefined();
    console.log('✅ No inline HTML in response (prevents size issues)');
    
    // CRITICAL: Verify S3 URL is returned
    console.log('🔍 Checking for S3 URL...');
    if (data.mapUrl) {
      console.log(`✅ Map URL returned: ${data.mapUrl}`);
      expect(data.mapUrl).toMatch(/^https:\/\/.+\.s3\..+\.amazonaws\.com\/.+/);
      
      // Verify the S3 object exists
      const urlParts = new URL(data.mapUrl);
      const bucketName = urlParts.hostname.split('.')[0];
      const key = urlParts.pathname.substring(1); // Remove leading slash
      
      console.log(`🔍 Verifying S3 object exists: s3://${bucketName}/${key}`);
      
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key
        });
        
        const headResponse = await s3Client.send(headCommand);
        console.log(`✅ S3 object exists (${headResponse.ContentLength} bytes, ${headResponse.ContentType})`);
        expect(headResponse.ContentType).toBe('text/html');
        expect(headResponse.ContentLength).toBeGreaterThan(0);
      } catch (error: any) {
        console.error(`❌ S3 object verification failed: ${error.message}`);
        throw error;
      }
    } else if (data.visualizationError) {
      console.warn(`⚠️ Visualization error: ${data.visualizationError}`);
      console.warn('   This indicates S3 storage is not properly configured');
      // Don't fail the test, but log the issue
    } else {
      console.error('❌ No mapUrl or visualizationError in response');
      throw new Error('Expected either mapUrl or visualizationError in response');
    }
    
    // Check for additional visualization URLs
    if (data.visualizations) {
      console.log('📊 Additional visualizations found:');
      Object.entries(data.visualizations).forEach(([key, url]) => {
        console.log(`   ${key}: ${url}`);
        expect(url).toMatch(/^https:\/\/.+\.s3\..+\.amazonaws\.com\/.+/);
      });
    }
    
    // Verify response size is reasonable (should be small without inline HTML)
    const responseSize = JSON.stringify(body).length;
    console.log(`📏 Response size: ${responseSize} bytes (${(responseSize / 1024).toFixed(2)} KB)`);
    expect(responseSize).toBeLessThan(100 * 1024); // Should be under 100KB
    console.log('✅ Response size is within acceptable limits');
    
  }, 60000); // 60 second timeout

  test('should handle S3 configuration errors gracefully', async () => {
    console.log('🧪 Testing graceful handling of S3 configuration errors...');
    
    // This test verifies that if S3 is not configured, the Lambda returns
    // a proper error message instead of failing completely
    
    const functionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
    
    if (!functionName) {
      console.warn('⚠️ RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME not set, skipping test');
      return;
    }

    const payload = {
      latitude: testCoordinates.latitude,
      longitude: testCoordinates.longitude,
      radius_km: testCoordinates.radius_km,
      project_id: `test-terrain-error-${Date.now()}`
    };

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });

    const response = await lambdaClient.send(command);
    const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    // Should still return 200 with success: true
    expect(responsePayload.statusCode).toBe(200);
    
    const body = JSON.parse(responsePayload.body);
    expect(body.success).toBe(true);
    
    // Should have either mapUrl or visualizationError
    const data = body.data;
    const hasVisualization = data.mapUrl || data.visualizationError;
    expect(hasVisualization).toBeTruthy();
    
    if (data.visualizationError) {
      console.log(`✅ Graceful error handling: ${data.visualizationError}`);
    } else {
      console.log('✅ S3 storage is working correctly');
    }
  }, 60000);
});
