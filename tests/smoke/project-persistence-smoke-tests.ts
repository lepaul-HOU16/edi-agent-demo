/**
 * Project Persistence Smoke Tests
 * 
 * Validates that project persistence functionality is deployed and working:
 * - Orchestrator Lambda is deployed with correct environment variables
 * - Tool Lambdas are deployed and accessible
 * - DynamoDB session context table exists
 * - AWS Location Service place index exists
 * - S3 bucket is accessible for project storage
 * - End-to-end project creation and retrieval works
 */

import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LocationClient, DescribePlaceIndexCommand } from '@aws-sdk/client-location';
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const lambdaClient = new LambdaClient({});
const dynamoClient = new DynamoDBClient({});
const locationClient = new LocationClient({});
const s3Client = new S3Client({});

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Run a test and record the result
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - startTime
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    console.error(`❌ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test 1: Orchestrator Lambda is deployed
 */
async function testOrchestratorDeployed(): Promise<void> {
  const functions = await lambdaClient.send(new GetFunctionCommand({
    FunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator'
  }));
  
  if (!functions.Configuration) {
    throw new Error('Orchestrator Lambda not found');
  }
  
  console.log(`  Function: ${functions.Configuration.FunctionName}`);
  console.log(`  Runtime: ${functions.Configuration.Runtime}`);
  console.log(`  Memory: ${functions.Configuration.MemorySize}MB`);
  console.log(`  Timeout: ${functions.Configuration.Timeout}s`);
}

/**
 * Test 2: Orchestrator has required environment variables
 */
async function testOrchestratorEnvironmentVariables(): Promise<void> {
  const functions = await lambdaClient.send(new GetFunctionCommand({
    FunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator'
  }));
  
  const envVars = functions.Configuration?.Environment?.Variables || {};
  
  const requiredVars = [
    'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
    'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
    'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
    'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
    'RENEWABLE_S3_BUCKET',
    'SESSION_CONTEXT_TABLE',
    'AWS_LOCATION_PLACE_INDEX'
  ];
  
  const missing: string[] = [];
  for (const varName of requiredVars) {
    if (!envVars[varName]) {
      missing.push(varName);
    } else {
      console.log(`  ${varName}: ${envVars[varName]}`);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Test 3: Tool Lambdas are deployed
 */
async function testToolLambdasDeployed(): Promise<void> {
  const toolNames = [
    'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
    'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
    'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
    'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
  ];
  
  for (const envVar of toolNames) {
    const functionName = process.env[envVar];
    if (!functionName) {
      throw new Error(`Environment variable ${envVar} not set`);
    }
    
    const functions = await lambdaClient.send(new GetFunctionCommand({
      FunctionName: functionName
    }));
    
    if (!functions.Configuration) {
      throw new Error(`Tool Lambda ${functionName} not found`);
    }
    
    console.log(`  ${envVar}: ${functions.Configuration.FunctionName}`);
  }
}

/**
 * Test 4: DynamoDB session context table exists
 */
async function testSessionContextTableExists(): Promise<void> {
  const tableName = process.env.SESSION_CONTEXT_TABLE || 'RenewableSessionContext';
  
  const table = await dynamoClient.send(new DescribeTableCommand({
    TableName: tableName
  }));
  
  if (!table.Table) {
    throw new Error(`Session context table ${tableName} not found`);
  }
  
  console.log(`  Table: ${table.Table.TableName}`);
  console.log(`  Status: ${table.Table.TableStatus}`);
  console.log(`  Item Count: ${table.Table.ItemCount}`);
}

/**
 * Test 5: AWS Location Service place index exists
 */
async function testLocationServicePlaceIndexExists(): Promise<void> {
  const indexName = process.env.AWS_LOCATION_PLACE_INDEX || 'RenewableProjectPlaceIndex';
  
  const placeIndex = await locationClient.send(new DescribePlaceIndexCommand({
    IndexName: indexName
  }));
  
  if (!placeIndex.IndexName) {
    throw new Error(`Place index ${indexName} not found`);
  }
  
  console.log(`  Index: ${placeIndex.IndexName}`);
  console.log(`  Data Source: ${placeIndex.DataSource}`);
}

/**
 * Test 6: S3 bucket is accessible
 */
async function testS3BucketAccessible(): Promise<void> {
  const bucketName = process.env.RENEWABLE_S3_BUCKET;
  if (!bucketName) {
    throw new Error('RENEWABLE_S3_BUCKET environment variable not set');
  }
  
  // List objects in renewable/projects/ prefix
  const objects = await s3Client.send(new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'renewable/projects/',
    MaxKeys: 10
  }));
  
  console.log(`  Bucket: ${bucketName}`);
  console.log(`  Existing projects: ${objects.KeyCount || 0}`);
}

/**
 * Test 7: Can write to S3 bucket
 */
async function testS3BucketWritable(): Promise<void> {
  const bucketName = process.env.RENEWABLE_S3_BUCKET;
  if (!bucketName) {
    throw new Error('RENEWABLE_S3_BUCKET environment variable not set');
  }
  
  const testKey = `renewable/projects/smoke-test-${Date.now()}/project.json`;
  const testData = {
    project_id: 'smoke-test',
    project_name: 'smoke-test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Write test object
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: testKey,
    Body: JSON.stringify(testData),
    ContentType: 'application/json'
  }));
  
  // Read it back
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: testKey
  }));
  
  if (!response.Body) {
    throw new Error('Failed to read test object from S3');
  }
  
  console.log(`  Test write successful: ${testKey}`);
}

/**
 * Test 8: Orchestrator health check
 */
async function testOrchestratorHealthCheck(): Promise<void> {
  const functionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator';
  
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify({
      query: '__health_check__'
    })
  }));
  
  if (!response.Payload) {
    throw new Error('No response from orchestrator');
  }
  
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (!result.success) {
    throw new Error(`Health check failed: ${result.message}`);
  }
  
  console.log(`  Health: ${result.message}`);
  console.log(`  Tools configured: ${JSON.stringify(result.metadata?.health?.toolsConfigured)}`);
}

/**
 * Test 9: End-to-end project creation
 */
async function testEndToEndProjectCreation(): Promise<void> {
  const functionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator';
  
  const testQuery = 'analyze terrain at 35.0675, -101.3954 for smoke test project';
  
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify({
      query: testQuery,
      sessionId: `smoke-test-${Date.now()}`
    })
  }));
  
  if (!response.Payload) {
    throw new Error('No response from orchestrator');
  }
  
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (!result.success) {
    throw new Error(`Project creation failed: ${result.message}`);
  }
  
  console.log(`  Project created: ${result.metadata?.projectName || 'unknown'}`);
  console.log(`  Artifacts: ${result.artifacts?.length || 0}`);
}

/**
 * Test 10: Project listing works
 */
async function testProjectListing(): Promise<void> {
  const functionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator';
  
  const response = await lambdaClient.send(new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify({
      query: 'list my renewable projects',
      sessionId: `smoke-test-${Date.now()}`
    })
  }));
  
  if (!response.Payload) {
    throw new Error('No response from orchestrator');
  }
  
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  if (!result.success) {
    throw new Error(`Project listing failed: ${result.message}`);
  }
  
  console.log(`  Projects listed: ${result.metadata?.projectCount || 0}`);
}

/**
 * Main test runner
 */
async function runSmokeTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 PROJECT PERSISTENCE SMOKE TESTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const startTime = Date.now();
  
  // Infrastructure tests
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Infrastructure Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await runTest('1. Orchestrator Lambda is deployed', testOrchestratorDeployed);
  await runTest('2. Orchestrator has required environment variables', testOrchestratorEnvironmentVariables);
  await runTest('3. Tool Lambdas are deployed', testToolLambdasDeployed);
  await runTest('4. DynamoDB session context table exists', testSessionContextTableExists);
  await runTest('5. AWS Location Service place index exists', testLocationServicePlaceIndexExists);
  await runTest('6. S3 bucket is accessible', testS3BucketAccessible);
  await runTest('7. S3 bucket is writable', testS3BucketWritable);
  
  console.log('');
  
  // Functional tests
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  Functional Tests');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await runTest('8. Orchestrator health check', testOrchestratorHealthCheck);
  await runTest('9. End-to-end project creation', testEndToEndProjectCreation);
  await runTest('10. Project listing works', testProjectListing);
  
  console.log('');
  
  // Summary
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log('');
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ All smoke tests passed!');
    console.log('');
    process.exit(0);
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('Fatal error running smoke tests:', error);
  process.exit(1);
});
