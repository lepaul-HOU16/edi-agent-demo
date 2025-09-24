/**
 * Find which Lambda function your sandbox GraphQL API is configured to call
 * This will determine the actual backend your UI is hitting
 */

const AWS = require('aws-sdk');

const appsync = new AWS.AppSync({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function findSandboxLambdaConfiguration() {
    console.log('🔍 FINDING SANDBOX LAMBDA CONFIGURATION');
    console.log('GraphQL API ID: doqkjfftczdazcaeyrt6kdcrvu');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        const apiId = 'doqkjfftczdazcaeyrt6kdcrvu';
        
        console.log('\n1. Getting GraphQL API configuration...');
        const apiResponse = await appsync.getGraphqlApi({ apiId }).promise();
        console.log('📋 API Details:');
        console.log('- Name:', apiResponse.graphqlApi.name);
        console.log('- Auth Type:', apiResponse.graphqlApi.authenticationType);
        console.log('- Created:', apiResponse.graphqlApi.creationTime);
        
        console.log('\n2. Getting resolvers for invokeLightweightAgent...');
        const resolversResponse = await appsync.listResolvers({
            apiId,
            typeName: 'Mutation'
        }).promise();
        
        const lightweightAgentResolver = resolversResponse.resolvers.find(
            resolver => resolver.fieldName === 'invokeLightweightAgent'
        );
        
        if (lightweightAgentResolver) {
            console.log('📋 Resolver Details:');
            console.log('- Resolver ARN:', lightweightAgentResolver.resolverArn);
            console.log('- Data Source:', lightweightAgentResolver.dataSourceName);
            console.log('- Kind:', lightweightAgentResolver.kind);
            console.log('- Runtime:', lightweightAgentResolver.runtime?.name);
            
            if (lightweightAgentResolver.dataSourceName) {
                console.log('\n3. Getting data source configuration...');
                const dataSourceResponse = await appsync.getDataSource({
                    apiId,
                    name: lightweightAgentResolver.dataSourceName
                }).promise();
                
                console.log('📋 Data Source Details:');
                console.log('- Type:', dataSourceResponse.dataSource.type);
                console.log('- Service Role ARN:', dataSourceResponse.dataSource.serviceRoleArn);
                
                if (dataSourceResponse.dataSource.lambdaConfig) {
                    const lambdaFunctionArn = dataSourceResponse.dataSource.lambdaConfig.lambdaFunctionArn;
                    console.log('- Lambda Function ARN:', lambdaFunctionArn);
                    
                    // Extract function name from ARN
                    const functionName = lambdaFunctionArn.split(':').pop();
                    console.log('🎯 SANDBOX IS CONFIGURED TO CALL:', functionName);
                    
                    // Check which version this is based on our earlier discovery
                    if (functionName === 'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY') {
                        console.log('✅ YOUR SANDBOX IS CALLING THE WORKING FUNCTION!');
                        console.log('📈 This means artifacts should be working');
                        console.log('💡 The issue is likely in the frontend pipeline');
                    } else if (functionName === 'amplify-digitalassistant--lightweightAgentlambda3D-bsDyPJZEdW4w') {
                        console.log('❌ YOUR SANDBOX IS CALLING THE BROKEN FUNCTION!');
                        console.log('💥 This explains why your UI shows old behavior');
                        console.log('🔧 SOLUTION: Update GraphQL resolver to point to working function');
                    } else {
                        console.log('🤔 YOUR SANDBOX IS CALLING AN UNKNOWN FUNCTION');
                        console.log('📋 Function name:', functionName);
                        console.log('💡 This might be a completely different deployment');
                    }
                    
                    console.log('\n4. Validating the target function...');
                    try {
                        const funcResponse = await lambda.getFunctionConfiguration({
                            FunctionName: functionName
                        }).promise();
                        
                        console.log('📊 Target Function Details:');
                        console.log('- Runtime:', funcResponse.Runtime);
                        console.log('- Last Modified:', funcResponse.LastModified);
                        console.log('- Code Size:', funcResponse.CodeSize, 'bytes');
                        console.log('- Memory:', funcResponse.MemorySize, 'MB');
                        console.log('- Timeout:', funcResponse.Timeout, 'seconds');
                        
                        // Compare with our known good/bad functions
                        if (funcResponse.LastModified.includes('2025-09-23')) {
                            console.log('✅ Function was updated today - likely has fixes');
                        } else if (funcResponse.LastModified.includes('2025-09-18')) {
                            console.log('❌ Function is 5 days old - likely broken version');
                        } else {
                            console.log('⚠️ Function age unclear - needs testing');
                        }
                        
                    } catch (funcError) {
                        console.log('❌ Could not get target function details:', funcError.message);
                    }
                    
                } else {
                    console.log('❌ No Lambda configuration found in data source');
                }
            }
            
        } else {
            console.log('❌ No resolver found for invokeLightweightAgent');
            console.log('💡 Available resolvers:');
            resolversResponse.resolvers.forEach(resolver => {
                console.log(`  - ${resolver.fieldName} (${resolver.kind})`);
            });
        }
        
        console.log('\n📋 CONFIGURATION SUMMARY:');
        console.log('This shows exactly which Lambda function your sandbox UI calls.');
        console.log('If it\'s calling the broken function, we need to update the resolver.');
        
    } catch (error) {
        console.error('❌ CONFIGURATION CHECK ERROR:', error.message);
        
        if (error.code === 'AccessDeniedException') {
            console.log('💡 Access denied to AppSync API. This might be because:');
            console.log('- Your AWS credentials don\'t have AppSync permissions');
            console.log('- The API is in a different account/region');
            console.log('- We need to use a different approach to identify the function');
        }
    }
}

findSandboxLambdaConfiguration().catch(console.error);
