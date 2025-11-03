/**
 * Renewable Energy Orchestrator Diagnostics API Route
 * 
 * Provides comprehensive diagnostics for the renewable energy orchestrator.
 * Runs health checks, validates configuration, and provides troubleshooting guidance.
 * 
 * Endpoints:
 * - GET /api/renewable/diagnostics - Run full diagnostic suite
 * - GET /api/renewable/diagnostics?quick=true - Run quick diagnostics (env vars only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorDiagnostics } from '../../../../../amplify/functions/agents/diagnostics/orchestratorDiagnostics';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Generate CloudWatch log stream link for a Lambda function
 */
function generateCloudWatchLink(functionName: string, region: string): string {
  const encodedFunctionName = encodeURIComponent(functionName);
  return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${encodedFunctionName}`;
}

/**
 * Check if user is authenticated
 */
async function checkAuthentication(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Restrict access to authenticated users
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required to access diagnostics',
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quick = searchParams.get('quick') === 'true';
    const region = process.env.AWS_REGION || 'us-west-2';

    // Initialize diagnostics utility
    const diagnostics = new OrchestratorDiagnostics(region);

    let results;
    if (quick) {
      // Quick diagnostics - just check environment variables
      results = [diagnostics.checkEnvironmentVariables()];
    } else {
      // Full diagnostic suite
      results = await diagnostics.runFullDiagnostics();
    }

    // Calculate overall status
    const allPassed = results.every(r => r.success);
    const anyFailed = results.some(r => !r.success);
    const overallStatus = allPassed ? 'healthy' : anyFailed ? 'unhealthy' : 'degraded';

    // Generate CloudWatch links for relevant functions
    const cloudWatchLinks: Record<string, string> = {};
    const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
    
    if (orchestratorFunctionName) {
      cloudWatchLinks.orchestrator = generateCloudWatchLink(orchestratorFunctionName, region);
    }

    const terrainFunctionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME;
    if (terrainFunctionName) {
      cloudWatchLinks.terrainTool = generateCloudWatchLink(terrainFunctionName, region);
    }

    const layoutFunctionName = process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME;
    if (layoutFunctionName) {
      cloudWatchLinks.layoutTool = generateCloudWatchLink(layoutFunctionName, region);
    }

    const simulationFunctionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME;
    if (simulationFunctionName) {
      cloudWatchLinks.simulationTool = generateCloudWatchLink(simulationFunctionName, region);
    }

    const reportFunctionName = process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME;
    if (reportFunctionName) {
      cloudWatchLinks.reportTool = generateCloudWatchLink(reportFunctionName, region);
    }

    // Collect all recommendations
    const allRecommendations = results
      .filter(r => r.recommendations && r.recommendations.length > 0)
      .flatMap(r => r.recommendations || []);

    // Remove duplicates
    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    // Build response
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      region,
      diagnosticType: quick ? 'quick' : 'full',
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      },
      cloudWatchLinks,
      recommendations: uniqueRecommendations,
      nextSteps: generateNextSteps(results, overallStatus),
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Diagnostics API error:', error);

    return NextResponse.json({
      status: 'error',
      error: 'Diagnostics service failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      recommendations: [
        'Check AWS credentials and permissions',
        'Verify Lambda functions are deployed',
        'Run: npx ampx sandbox to deploy all functions',
        'Check CloudWatch logs for detailed error information',
      ],
    }, { status: 500 });
  }
}

/**
 * Generate actionable next steps based on diagnostic results
 */
function generateNextSteps(results: any[], overallStatus: string): string[] {
  const nextSteps: string[] = [];

  if (overallStatus === 'healthy') {
    nextSteps.push('All systems operational - orchestrator is ready to use');
    nextSteps.push('You can now perform terrain analysis queries');
    return nextSteps;
  }

  // Check for specific failure patterns
  const envCheck = results.find(r => r.step === 'Check Environment Variables');
  const existsCheck = results.find(r => r.step === 'Check Orchestrator Exists');
  const invocationCheck = results.find(r => r.step === 'Test Orchestrator Invocation');

  if (envCheck && !envCheck.success) {
    nextSteps.push('1. Fix environment variable configuration in amplify/backend.ts');
    nextSteps.push('2. Run: npx ampx sandbox to redeploy with correct configuration');
    nextSteps.push('3. Wait for deployment to complete');
    nextSteps.push('4. Run diagnostics again to verify');
  } else if (existsCheck && !existsCheck.success) {
    if (existsCheck.error?.includes('ResourceNotFoundException')) {
      nextSteps.push('1. Deploy the orchestrator Lambda function');
      nextSteps.push('2. Run: npx ampx sandbox');
      nextSteps.push('3. Wait for deployment to complete (may take 5-10 minutes)');
      nextSteps.push('4. Run diagnostics again to verify deployment');
    } else if (existsCheck.error?.includes('AccessDeniedException')) {
      nextSteps.push('1. Check IAM permissions for Lambda:GetFunction');
      nextSteps.push('2. Verify execution role has necessary permissions');
      nextSteps.push('3. Check amplify/backend.ts for IAM policy configuration');
    } else {
      nextSteps.push('1. Check AWS credentials are configured correctly');
      nextSteps.push('2. Verify network connectivity to AWS');
      nextSteps.push('3. Check CloudWatch logs for detailed error information');
    }
  } else if (invocationCheck && !invocationCheck.success) {
    nextSteps.push('1. Check orchestrator Lambda logs in CloudWatch');
    nextSteps.push('2. Verify orchestrator handler code is correct');
    nextSteps.push('3. Check for runtime errors or missing dependencies');
    nextSteps.push('4. Verify tool Lambda function names are set correctly');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Review diagnostic results and recommendations above');
    nextSteps.push('Check CloudWatch logs for detailed error information');
    nextSteps.push('Contact support if issues persist');
  }

  return nextSteps;
}

/**
 * Support POST for triggering fresh diagnostics
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
