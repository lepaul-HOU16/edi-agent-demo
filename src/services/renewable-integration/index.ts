/**
 * Renewable Energy Integration Layer
 * 
 * This module provides the integration between the EDI Platform frontend
 * and the Python renewable energy backend deployed on AWS Bedrock AgentCore.
 * 
 * Usage:
 * ```typescript
 * import { getRenewableConfig, isRenewableEnabled } from '@/services/renewable-integration';
 * 
 * if (isRenewableEnabled()) {
 *   const config = getRenewableConfig();
 *   // Use config to connect to backend
 * }
 * ```
 */

// Export types
export type {
  AgentCoreRequest,
  AgentCoreResponse,
  AgentCoreArtifact,
  ThoughtStep,
  BaseArtifact,
  TerrainArtifact,
  LayoutArtifact,
  SimulationArtifact,
  ReportArtifact,
  ExclusionZone,
  TurbinePosition,
  PerformanceByDirection,
  OptimizationRecommendation,
  GeoJSON,
  GeoJSONFeature,
  RenewableConfig,
} from './types';

// Export error classes
export {
  AgentCoreError,
  AuthenticationError,
  ConnectionError,
} from './types';

// Export configuration functions
export {
  getRenewableConfig,
  isRenewableEnabled,
  getAgentCoreEndpoint,
  getS3Bucket,
  getRegion,
} from './config';

// Export RenewableClient
export { RenewableClient } from './renewableClient';

// Export ResponseTransformer
export { ResponseTransformer } from './responseTransformer';
