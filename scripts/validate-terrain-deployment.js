#!/usr/bin/env node

/**
 * Validate that the enhanced OSM query was deployed to the terrain Lambda
 */

const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

async function validateDeployment() {
  const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-west-2' });
  
  console.log('🔍 Checking terrain Lambda deployment...\n');
  
  // Get log group name from environment or use pattern
  const logGroupName = '/aws/lambda/amplify-digitalassistant-lepaul-renewableTerrainTool';
  
  try {
    // Look for recent invocations with the enhanced query
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime: Date.now() - (5 * 60 * 1000), // Last 5 minutes
      filterPattern: '"Enhanced OSM query"',
      limit: 5
    });
    
    const response = await client.send(command);
    
    if (response.events && response.events.length > 0) {
      console.log('✅ DEPLOYMENT VERIFIED');
      console.log('   Enhanced OSM query is active in deployed Lambda\n');
      console.log('Recent log entries:');
      response.events.forEach(event => {
        console.log(`   ${new Date(event.timestamp).toISOString()}: ${event.message}`);
      });
      return true;
    } else {
      console.log('⚠️  NO RECENT INVOCATIONS FOUND');
      console.log('   The Lambda may be deployed but not yet invoked.');
      console.log('   Try running a terrain analysis query to test.\n');
      
      // Check for any recent logs at all
      const anyLogsCommand = new FilterLogEventsCommand({
        logGroupName,
        startTime: Date.now() - (5 * 60 * 1000),
        limit: 5
      });
      
      const anyLogsResponse = await client.send(anyLogsCommand);
      if (anyLogsResponse.events && anyLogsResponse.events.length > 0) {
        console.log('Recent Lambda activity (any logs):');
        anyLogsResponse.events.slice(0, 3).forEach(event => {
          console.log(`   ${new Date(event.timestamp).toISOString()}: ${event.message?.substring(0, 100)}`);
        });
      }
      
      return false;
    }
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('❌ LAMBDA NOT FOUND');
      console.log(`   Log group ${logGroupName} does not exist`);
      console.log('   The Lambda may not be deployed yet.\n');
    } else {
      console.log('❌ ERROR CHECKING LOGS');
      console.log(`   ${error.message}\n`);
    }
    return false;
  }
}

// Check if the enhanced query is in the deployed code
async function checkDeployedCode() {
  console.log('\n📝 Checking local code for enhanced query...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const handlerPath = path.join(__dirname, '../amplify/functions/renewableTools/terrain/simple_handler.py');
  
  try {
    const content = fs.readFileSync(handlerPath, 'utf8');
    
    // Check for key indicators of the enhanced query
    const hasEnhancedComment = content.includes('Enhanced OSM query - comprehensive features');
    const hasAllRoads = content.includes('way["highway"](around:');
    const hasAmenities = content.includes('way["amenity"](around:');
    const hasPlaces = content.includes('node["place"](around:');
    const hasTimeout30 = content.includes('[out:json][timeout:30]');
    
    if (hasEnhancedComment && hasAllRoads && hasAmenities && hasPlaces && hasTimeout30) {
      console.log('✅ LOCAL CODE HAS ENHANCED QUERY');
      console.log('   - Enhanced comment present');
      console.log('   - All roads query (not just major)');
      console.log('   - Amenities included');
      console.log('   - Places included');
      console.log('   - Timeout increased to 30s\n');
      return true;
    } else {
      console.log('❌ LOCAL CODE MISSING ENHANCED QUERY');
      console.log(`   - Enhanced comment: ${hasEnhancedComment ? '✅' : '❌'}`);
      console.log(`   - All roads: ${hasAllRoads ? '✅' : '❌'}`);
      console.log(`   - Amenities: ${hasAmenities ? '✅' : '❌'}`);
      console.log(`   - Places: ${hasPlaces ? '✅' : '❌'}`);
      console.log(`   - Timeout 30s: ${hasTimeout30 ? '✅' : '❌'}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR READING LOCAL FILE: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TERRAIN LAMBDA DEPLOYMENT VALIDATION');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const localCodeOk = await checkDeployedCode();
  const deploymentOk = await validateDeployment();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`Local Code:  ${localCodeOk ? '✅ Enhanced query present' : '❌ Missing enhanced query'}`);
  console.log(`Deployment:  ${deploymentOk ? '✅ Verified in CloudWatch' : '⚠️  Not yet invoked'}`);
  
  if (localCodeOk && !deploymentOk) {
    console.log('\n📋 NEXT STEP:');
    console.log('   Run a terrain analysis query to invoke the Lambda:');
    console.log('   "Analyze terrain for wind farm at 35.067482, -101.395466"\n');
  } else if (!localCodeOk) {
    console.log('\n❌ PROBLEM:');
    console.log('   Local code does not have the enhanced query.');
    console.log('   The deployment may have used old code.\n');
  } else {
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('   Enhanced query is deployed and active.\n');
  }
}

main().catch(console.error);
