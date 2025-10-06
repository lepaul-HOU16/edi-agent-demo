/**
 * Backend Renewable Energy Configuration
 * 
 * This is the BACKEND version of the renewable config.
 * It uses Lambda environment variables (not Next.js NEXT_PUBLIC_ variables).
 * 
 * IMPORTANT: This file is separate from src/services/renewable-integration/config.ts
 * because Lambda functions cannot import frontend code.
 */

export interface RenewableConfig {
  enabled: boolean;
  agentCoreEndpoint: string;
  region: string;
  s3Bucket: string;
}

/**
 * Get renewable energy configuration for Lambda backend
 * 
 * ALWAYS ENABLED BY DEFAULT in Lambda environment to support orchestrator.
 */
export function getRenewableConfig(): RenewableConfig {
  // In Lambda, renewable features are ALWAYS enabled by default
  // This allows the Lambda orchestrator to work
  const enabled = process.env.RENEWABLE_ENABLED !== 'false';
  
  // Get orchestrator function name (primary endpoint for Lambda-based approach)
  const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME || 'renewableOrchestrator';
  
  // Get AgentCore endpoint (fallback for when AgentCore becomes GA)
  const agentCoreEndpoint = process.env.RENEWABLE_AGENTCORE_ENDPOINT || orchestratorFunctionName;
  
  // Get region from Lambda environment
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Get S3 bucket for renewable artifacts
  const s3Bucket = process.env.RENEWABLE_S3_BUCKET || process.env.S3_BUCKET || '';
  
  console.log('Backend Renewable Config:', {
    enabled,
    agentCoreEndpoint: agentCoreEndpoint.substring(0, 50) + '...',
    region,
    s3Bucket: s3Bucket ? 'configured' : 'not configured'
  });
  
  return {
    enabled,
    agentCoreEndpoint,
    region,
    s3Bucket
  };
}

/**
 * Check if renewable energy features are enabled
 */
export function isRenewableEnabled(): boolean {
  return getRenewableConfig().enabled;
}

/**
 * Get the AgentCore endpoint (or Lambda orchestrator function name)
 */
export function getAgentCoreEndpoint(): string {
  return getRenewableConfig().agentCoreEndpoint;
}

/**
 * Get the S3 bucket for renewable artifacts
 */
export function getS3Bucket(): string {
  return getRenewableConfig().s3Bucket;
}

/**
 * Get the AWS region
 */
export function getRegion(): string {
  return getRenewableConfig().region;
}
