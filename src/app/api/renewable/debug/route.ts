/**
 * Renewable Energy Debug API Route
 * 
 * Provides debugging information for renewable energy deployment issues.
 * Shows environment variables, function names, and deployment status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, GetFunctionCommand, ListFunctionsCommand } from '@aws-sdk/client-lambda';

export async function GET(request: NextRequest) {
  try {
    const lambdaClient = new LambdaClient({});
    
    // Get environment info (this would be from the frontend/API route environment)
    const frontendEnv = {
      NEXT_PUBLIC_RENEWABLE_ENABLED: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED,
      NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT,
      NEXT_PUBLIC_RENEWABLE_S3_BUCKET: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET,
      NEXT_PUBLIC_RENEWABLE_AWS_REGION: process.env.NEXT_PUBLIC_RENEWABLE_AWS_REGION,
    };
    
    // Try to list Lambda functions to see what's deployed
    let deployedFunctions: string[] = [];
    try {
      const listResponse = await lambdaClient.send(new ListFunctionsCommand({}));
      deployedFunctions = (listResponse.Functions || [])
        .map(f => f.FunctionName || '')
        .filter(name => name.toLowerCase().includes('renewable'))
        .sort();
    } catch (error) {
      console.error('Error listing Lambda functions:', error);
    }
    
    // Try to get specific function details
    const expectedFunctions = [
      'renewableOrchestrator',
      'renewableTools-terrain', 
      'renewableTools-layout',
      'renewableTools-simulation',
      'renewableTools-report',
      'lightweightAgent'
    ];
    
    const functionStatus: Record<string, any> = {};
    
    for (const functionName of expectedFunctions) {
      try {
        const response = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
        functionStatus[functionName] = {
          exists: true,
          state: response.Configuration?.State,
          runtime: response.Configuration?.Runtime,
          timeout: response.Configuration?.Timeout,
          memorySize: response.Configuration?.MemorySize,
          lastModified: response.Configuration?.LastModified,
          environment: response.Configuration?.Environment?.Variables || {}
        };
      } catch (error) {
        functionStatus[functionName] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Check if we can invoke the orchestrator
    let orchestratorTest = null;
    try {
      // Try to find the actual orchestrator function name
      const orchestratorFunction = deployedFunctions.find(name => 
        name.includes('renewableOrchestrator') || name.includes('renewable-orchestrator')
      );
      
      if (orchestratorFunction) {
        orchestratorTest = {
          functionName: orchestratorFunction,
          canInvoke: 'unknown', // We won't actually invoke it here
          message: 'Function found in deployment'
        };
      } else {
        orchestratorTest = {
          functionName: 'not found',
          canInvoke: false,
          message: 'Orchestrator function not found in deployment'
        };
      }
    } catch (error) {
      orchestratorTest = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      frontendEnvironment: frontendEnv,
      deployedRenewableFunctions: deployedFunctions,
      functionStatus,
      orchestratorTest,
      recommendations: generateRecommendations(deployedFunctions, functionStatus)
    };
    
    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    
    return NextResponse.json({
      error: 'Debug API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      recommendations: [
        'Check AWS credentials and permissions',
        'Verify Lambda functions are deployed',
        'Run: npx ampx sandbox to deploy all functions'
      ]
    }, { status: 500 });
  }
}

function generateRecommendations(deployedFunctions: string[], functionStatus: Record<string, any>): string[] {
  const recommendations: string[] = [];
  
  if (deployedFunctions.length === 0) {
    recommendations.push('No renewable energy functions found - run: npx ampx sandbox');
    recommendations.push('Check if deployment completed successfully');
    return recommendations;
  }
  
  const expectedFunctions = ['renewableOrchestrator', 'renewableTools-terrain', 'renewableTools-layout', 'renewableTools-simulation', 'renewableTools-report'];
  const missingFunctions = expectedFunctions.filter(expected => 
    !deployedFunctions.some(deployed => deployed.includes(expected.replace('renewableTools-', '')))
  );
  
  if (missingFunctions.length > 0) {
    recommendations.push(`Missing functions: ${missingFunctions.join(', ')}`);
    recommendations.push('Run: npx ampx sandbox to deploy missing functions');
  }
  
  // Check for environment variable issues
  const lightweightAgent = functionStatus['lightweightAgent'];
  if (lightweightAgent?.exists && lightweightAgent.environment) {
    if (!lightweightAgent.environment.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME) {
      recommendations.push('lightweightAgent missing RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable');
      recommendations.push('This should be set automatically in backend.ts - check deployment');
    }
  }
  
  // Check orchestrator environment variables
  const orchestrator = functionStatus['renewableOrchestrator'];
  if (orchestrator?.exists && orchestrator.environment) {
    const requiredEnvVars = [
      'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME', 
      'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !orchestrator.environment[envVar]);
    if (missingEnvVars.length > 0) {
      recommendations.push(`Orchestrator missing environment variables: ${missingEnvVars.join(', ')}`);
      recommendations.push('These should be set automatically in backend.ts - check deployment');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All functions appear to be deployed correctly');
    recommendations.push('If terrain analysis still fails, check CloudWatch logs for detailed errors');
  }
  
  return recommendations;
}