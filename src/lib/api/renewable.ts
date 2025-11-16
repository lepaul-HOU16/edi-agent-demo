/**
 * Renewable Energy REST API Client
 * 
 * Provides methods to interact with the CDK-deployed renewable energy orchestrator API
 */

import { apiPost } from './client';

export interface RenewableAnalysisRequest {
  query: string;
  context?: any;
  sessionId?: string;
}

export interface RenewableAnalysisResponse {
  success: boolean;
  message?: string;
  response?: {
    text: string;
    artifacts?: any[];
  };
  thoughtSteps?: any[];
  toolsUsed?: string[];
  error?: string;
}

/**
 * Analyze wind farm site or perform renewable energy analysis
 */
export async function analyzeWindFarm(
  query: string,
  context?: any,
  sessionId?: string
): Promise<RenewableAnalysisResponse> {
  try {
    console.log('[Renewable API] Analyzing:', { query, hasContext: !!context, sessionId });
    
    const response = await apiPost<RenewableAnalysisResponse>('/api/renewable/analyze', {
      query,
      context,
      sessionId,
    });
    
    console.log('[Renewable API] Analysis complete:', {
      success: response.success,
      hasArtifacts: !!response.response?.artifacts,
      toolsUsed: response.toolsUsed,
    });
    
    return response;
  } catch (error: any) {
    console.error('[Renewable API] Analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze wind farm',
    };
  }
}
