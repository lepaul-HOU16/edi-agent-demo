/**
 * Configuration management for Renewable Energy Integration
 * 
 * Reads configuration from environment variables and provides
 * typed configuration objects for the integration layer.
 */

import { RenewableConfig } from './types';

/**
 * Get renewable energy integration configuration
 * 
 * Reads from environment variables:
 * - NEXT_PUBLIC_RENEWABLE_ENABLED: Enable/disable renewable features
 * - NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: AgentCore endpoint URL
 * - NEXT_PUBLIC_RENEWABLE_S3_BUCKET: S3 bucket for artifacts
 * - NEXT_PUBLIC_RENEWABLE_REGION: AWS region (default: us-west-2)
 */
export function getRenewableConfig(): RenewableConfig {
  const config: RenewableConfig = {
    enabled: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED === 'true',
    agentCoreEndpoint: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
    s3Bucket: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET || '',
    region: process.env.NEXT_PUBLIC_RENEWABLE_REGION || 'us-west-2'
  };

  // Validate configuration if enabled
  if (config.enabled) {
    validateConfig(config);
  }

  return config;
}

/**
 * Validate renewable configuration
 * Throws error if required fields are missing when enabled
 */
function validateConfig(config: RenewableConfig): void {
  const errors: string[] = [];

  if (!config.agentCoreEndpoint) {
    errors.push('NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT is required');
  }

  if (!config.s3Bucket) {
    errors.push('NEXT_PUBLIC_RENEWABLE_S3_BUCKET is required');
  }

  if (!config.region) {
    errors.push('NEXT_PUBLIC_RENEWABLE_REGION is required');
  }

  if (errors.length > 0) {
    throw new Error(
      `Renewable energy integration configuration is invalid:\n${errors.join('\n')}`
    );
  }
}

/**
 * Check if renewable energy features are enabled
 */
export function isRenewableEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RENEWABLE_ENABLED === 'true';
}

/**
 * Get AgentCore endpoint URL
 */
export function getAgentCoreEndpoint(): string {
  const config = getRenewableConfig();
  return config.agentCoreEndpoint;
}

/**
 * Get S3 bucket name for renewable artifacts
 */
export function getS3Bucket(): string {
  const config = getRenewableConfig();
  return config.s3Bucket;
}

/**
 * Get AWS region for renewable services
 */
export function getRegion(): string {
  const config = getRenewableConfig();
  return config.region;
}
