/**
 * Renewable Energy Deployment Health Check API Route
 * 
 * Specific health check endpoint for deployment validation.
 * Focuses on Lambda function deployment status and configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RenewableDeploymentValidator } from '../../../../../services/renewable-integration/RenewableDeploymentValidator';
import { renewableConfig } from '../../../../../services/renewable-integration/RenewableConfigManager';

export async function GET(request: NextRequest) {
  try {
    const validator = new RenewableDeploymentValidator();
    const deploymentResult = await validator.validateDeployment();
    
    // Get configuration status
    const configValidation = renewableConfig.validateConfiguration();
    
    // Combine deployment and configuration status
    const overallStatus = deploymentResult.isHealthy && configValidation.isValid ? 'healthy' :
                         deploymentResult.isHealthy || configValidation.isValid ? 'degraded' : 'unhealthy';
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      deployment: {
        healthy: deploymentResult.isHealthy,
        message: deploymentResult.message,
        details: deploymentResult.details,
        remediationSteps: deploymentResult.remediationSteps,
      },
      configuration: {
        valid: configValidation.isValid,
        errors: configValidation.errors,
      },
      lambdaFunctions: deploymentResult.details?.lambdaFunctions || {},
      recommendations: generateRecommendations(deploymentResult, configValidation),
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
    console.error('Deployment health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      deployment: {
        healthy: false,
        message: 'Deployment validation failed',
        details: null,
      },
      configuration: {
        valid: false,
        errors: ['Health check service error'],
      },
      recommendations: [
        'Check if renewable energy services are properly deployed',
        'Verify AWS credentials and permissions',
        'Run: npx ampx sandbox to deploy services',
      ],
    }, { status: 500 });
  }
}

function generateRecommendations(
  deploymentResult: any, 
  configValidation: { isValid: boolean; errors: string[] }
): string[] {
  const recommendations: string[] = [];
  
  if (!deploymentResult.isHealthy) {
    recommendations.push(...(deploymentResult.remediationSteps || [
      'Run: npx ampx sandbox',
      'Verify all Lambda functions are deployed',
      'Check AWS Lambda console for function existence',
    ]));
  }
  
  if (!configValidation.isValid) {
    recommendations.push('Fix configuration errors:');
    recommendations.push(...configValidation.errors.map(error => `  - ${error}`));
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All systems are operational');
  }
  
  return recommendations;
}

export async function POST(request: NextRequest) {
  // POST to trigger a fresh deployment validation
  return GET(request);
}