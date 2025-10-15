/**
 * Renewable Energy Orchestrator Lambda
 * 
 * Simple orchestration logic that replaces complex multi-agent framework.
 * Routes renewable energy queries to appropriate tool Lambdas and aggregates results.
 * Enhanced with validation and fallback capabilities.
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import type { 
  OrchestratorRequest, 
  OrchestratorResponse, 
  RenewableIntent, 
  ToolResult,
  ThoughtStep,
  Artifact
} from './types';
import { IntentRouter } from './IntentRouter';
import { 
  validateParameters, 
  applyDefaultParameters, 
  formatValidationError,
  logValidationFailure 
} from './parameterValidator';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}

const lambdaClient = new LambdaClient({});

/**
 * Execution time tracker for detailed performance monitoring
 */
interface ExecutionTimings {
  validation: number;
  intentDetection: number;
  toolInvocation: number;
  resultFormatting: number;
  total: number;
}

/**
 * Main Lambda handler
 */
export async function handler(event: OrchestratorRequest): Promise<OrchestratorResponse> {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const thoughtSteps: ThoughtStep[] = [];
  const toolsUsed: string[] = [];
  const timings: Partial<ExecutionTimings> = {};
  
  try {
    // Enhanced entry point logging
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 ORCHESTRATOR ENTRY POINT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`⏰ Timestamp: ${new Date(startTime).toISOString()}`);
    console.log(`📦 Full Request Payload: ${JSON.stringify(event, null, 2)}`);
    console.log(`🔍 Query: ${event.query}`);
    console.log(`📝 Context: ${JSON.stringify(event.context || {}, null, 2)}`);
    console.log(`🔄 Async Mode: ${event.sessionId ? 'YES (will write to DynamoDB)' : 'NO (sync response)'}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Handle health check requests
    if (event.query === '__health_check__') {
      console.log('Health check requested');
      
      // Log environment variables for debugging
      console.log('Environment variables:', {
        RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
        RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME,
        RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
        RENEWABLE_REPORT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        AWS_LAMBDA_FUNCTION_VERSION: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        AWS_REGION: process.env.AWS_REGION
      });
      
      return {
        success: true,
        message: 'Orchestrator is healthy',
        artifacts: [],
        thoughtSteps: [],
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: [],
          health: {
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
            version: process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown',
            region: process.env.AWS_REGION || 'unknown',
            toolsConfigured: {
              terrain: !!process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
              layout: !!process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME,
              simulation: !!process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
              report: !!process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME
            },
            toolFunctionNames: {
              terrain: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 'not configured',
              layout: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME || 'not configured',
              simulation: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || 'not configured',
              report: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME || 'not configured'
            }
          }
        }
      };
    }
    
    // Step 1: Quick validation check
    thoughtSteps.push({
      step: 1,
      action: 'Validating deployment',
      reasoning: 'Checking if renewable energy tools are available'
    });
    
    const validationStartTime = Date.now();
    const validation = await quickValidationCheck();
    timings.validation = Date.now() - validationStartTime;
    
    console.log(`⏱️  Validation Duration: ${timings.validation}ms`);
    
    if (!validation.canProceed) {
      return {
        success: false,
        message: `Deployment issues detected: ${validation.errors.join(', ')}. Please run: npx ampx sandbox`,
        artifacts: [],
        thoughtSteps,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: [],
          validationErrors: validation.errors
        }
      };
    }
    
    // Step 2: Parse intent from query
    thoughtSteps.push({
      step: 2,
      action: 'Analyzing query',
      reasoning: 'Determining which renewable energy tool to use'
    });
    
    const intentStartTime = Date.now();
    const intent = await parseIntent(event.query, event.context);
    timings.intentDetection = Date.now() - intentStartTime;
    
    // Enhanced intent detection logging
    console.log('───────────────────────────────────────────────────────────');
    console.log('🎯 INTENT DETECTION RESULTS');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`🔍 Detected Type: ${intent.type}`);
    console.log(`📊 Confidence: ${intent.confidence}%`);
    console.log(`⚙️  Parameters: ${JSON.stringify(intent.params, null, 2)}`);
    console.log(`⏱️  Detection Duration: ${timings.intentDetection}ms`);
    console.log('───────────────────────────────────────────────────────────');
    
    if (intent.type === 'unknown') {
      return {
        success: false,
        message: 'Could not understand the renewable energy query. Please specify terrain analysis, layout optimization, wake simulation, or report generation.',
        artifacts: [],
        thoughtSteps,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: []
        }
      };
    }
    
    // Step 2.5: Validate parameters before tool invocation
    thoughtSteps.push({
      step: 3,
      action: 'Validating parameters',
      reasoning: 'Checking that all required parameters are present and valid'
    });
    
    const paramValidation = validateParameters(intent);
    
    if (!paramValidation.isValid) {
      // Log validation failure to CloudWatch
      logValidationFailure(paramValidation, intent, requestId);
      
      const errorMessage = formatValidationError(paramValidation, intent.type);
      
      return {
        success: false,
        message: errorMessage,
        artifacts: [],
        thoughtSteps,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: [],
          validationErrors: paramValidation.errors,
          parameterValidation: {
            missingRequired: paramValidation.missingRequired,
            invalidValues: paramValidation.invalidValues
          }
        }
      } as OrchestratorResponse;
    }
    
    // Apply default values for optional parameters
    const intentWithDefaults = applyDefaultParameters(intent);
    
    console.log('✅ Parameter validation passed');
    console.log(`📦 Final parameters: ${JSON.stringify(intentWithDefaults.params, null, 2)}`);
    
    thoughtSteps.push({
      step: 4,
      action: `Calling ${intentWithDefaults.type} tool`,
      reasoning: `Query matches ${intentWithDefaults.type} pattern with ${intentWithDefaults.confidence}% confidence, all parameters validated`
    });
    
    // Step 3: Call appropriate tool Lambda(s) with fallback
    const toolStartTime = Date.now();
    const results = await callToolLambdasWithFallback(intentWithDefaults, event.query, event.context, requestId);
    timings.toolInvocation = Date.now() - toolStartTime;
    toolsUsed.push(intentWithDefaults.type);
    
    if (!results || results.length === 0) {
      return {
        success: false,
        message: 'Tool execution failed',
        artifacts: [],
        thoughtSteps,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed
        }
      };
    }
    
    thoughtSteps.push({
      step: 5,
      action: 'Processing results',
      reasoning: 'Formatting tool output for display',
      result: `Successfully processed ${results.length} result(s)`
    });
    
    // Step 3: Format results as EDI artifacts
    const formattingStartTime = Date.now();
    console.log('🔍 DEBUG - Results count before formatting:', results.length);
    console.log('🔍 DEBUG - Results types:', results.map(r => r.type));
    const artifacts = formatArtifacts(results);
    console.log('🔍 DEBUG - Artifacts count after formatting:', artifacts.length);
    console.log('🔍 DEBUG - Artifact types:', artifacts.map(a => a.type));
    const message = generateResponseMessage(intentWithDefaults, results);
    timings.resultFormatting = Date.now() - formattingStartTime;
    
    // Enhanced project ID logging
    let projectId = intentWithDefaults.params.project_id || event.context?.projectId;
    
    // Ensure we always have a project ID (should already be set by applyDefaultParameters)
    if (!projectId) {
      projectId = `project-${Date.now()}`;
    }
    
    console.log('───────────────────────────────────────────────────────────');
    console.log('🆔 PROJECT ID GENERATION');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`🆔 Project ID: ${projectId}`);
    console.log(`📝 Source: ${intent.params.project_id ? 'From intent params' : (event.context?.projectId ? 'From context' : 'Generated')}`);
    console.log(`⏰ Generated At: ${new Date().toISOString()}`);
    console.log('───────────────────────────────────────────────────────────');
    
    timings.total = Date.now() - startTime;
    
    const response: OrchestratorResponse = {
      success: true,
      message,
      artifacts,
      thoughtSteps,
      responseComplete: true,  // Signal to frontend that response is complete
      metadata: {
        executionTime: timings.total,
        toolsUsed,
        projectId,
        requestId,
        timings: {
          validation: timings.validation || 0,
          intentDetection: timings.intentDetection || 0,
          toolInvocation: timings.toolInvocation || 0,
          resultFormatting: timings.resultFormatting || 0,
          total: timings.total
        }
      }
    };
    
    // Enhanced final response logging
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 FINAL RESPONSE STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`✅ Success: ${response.success}`);
    console.log(`📝 Message: ${response.message}`);
    console.log(`📊 Artifact Count: ${response.artifacts.length}`);
    console.log(`🔧 Tools Used: ${response.metadata.toolsUsed.join(', ')}`);
    console.log(`🆔 Project ID: ${response.metadata.projectId}`);
    console.log('⏱️  Execution Time Breakdown:');
    console.log(`   - Validation: ${timings.validation}ms`);
    console.log(`   - Intent Detection: ${timings.intentDetection}ms`);
    console.log(`   - Tool Invocation: ${timings.toolInvocation}ms`);
    console.log(`   - Result Formatting: ${timings.resultFormatting}ms`);
    console.log(`   - Total: ${timings.total}ms`);
    console.log('📦 Artifacts:', response.artifacts.map(a => ({
      type: a.type,
      hasData: !!a.data,
      dataKeys: Object.keys(a.data || {})
    })));
    console.log(`🎯 Thought Steps: ${response.thoughtSteps.length}`);
    console.log(`📤 Full Response: ${JSON.stringify(response, null, 2)}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // CRITICAL: If invoked async (has sessionId), write results to DynamoDB
    if (event.sessionId && event.userId) {
      console.log('🔄 ASYNC MODE: Writing results to ChatMessage table');
      await writeResultsToChatMessage(event.sessionId, event.userId, response);
    }
    
    return response;
    
  } catch (error) {
    console.error('Orchestrator error:', error);
    
    // Enhanced error handling with specific remediation
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userMessage = 'An error occurred during renewable energy analysis.';
    let remediationSteps: string[] = [];
    
    if (errorMessage.includes('ResourceNotFoundException')) {
      userMessage = 'Renewable energy tools are not deployed.';
      remediationSteps = [
        'Run: npx ampx sandbox',
        'Verify all Lambda functions are deployed',
        'Check AWS Lambda console for function existence'
      ];
    } else if (errorMessage.includes('AccessDenied')) {
      userMessage = 'Permission denied accessing renewable energy tools.';
      remediationSteps = [
        'Check AWS credentials: aws sts get-caller-identity',
        'Verify IAM permissions for Lambda invocation',
        'Update execution role if necessary'
      ];
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      userMessage = 'Renewable energy analysis timed out.';
      remediationSteps = [
        'Try again with a smaller analysis area',
        'Check Lambda function timeout settings',
        'Verify function is not stuck in processing'
      ];
    } else {
      remediationSteps = [
        'Check system logs for more details',
        'Verify all dependencies are available',
        'Try again in a few moments'
      ];
    }
    
    return {
      success: false,
      message: userMessage,
      artifacts: [],
      thoughtSteps,
      metadata: {
        executionTime: Date.now() - startTime,
        toolsUsed,
        error: {
          type: error instanceof Error ? error.name : 'UnknownError',
          message: errorMessage,
          remediationSteps
        }
      }
    };
  }
}

/**
 * Parse user query to determine intent using the new IntentRouter
 */
async function parseIntent(query: string, context?: any): Promise<RenewableIntent> {
  const router = new IntentRouter();
  
  try {
    const routingResult = await router.routeQuery(query, context);
    
    // Handle confirmation requirements
    if (routingResult.requiresConfirmation && routingResult.confirmationMessage) {
      console.log('⚠️ Intent requires confirmation:', routingResult.confirmationMessage);
      
      // For now, proceed with the suggested intent but log the uncertainty
      // In a full implementation, this would trigger a user confirmation dialog
      console.log('📝 Fallback options available:', routingResult.fallbackOptions);
    }
    
    return routingResult.intent;
  } catch (error) {
    console.error('❌ Error in intent routing:', error);
    
    // Fallback to basic terrain analysis
    return {
      type: 'terrain_analysis',
      params: extractTerrainParams(query),
      confidence: 30
    };
  }
}

/**
 * Check if query matches any of the patterns
 */
function matchesAny(query: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(query));
}

/**
 * Extract terrain analysis parameters from query
 */
function extractTerrainParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Safety check for undefined query
  if (!query || typeof query !== 'string') {
    console.warn('extractTerrainParams called with invalid query:', query);
    return params;
  }
  
  // Extract coordinates - look for decimal coordinates (latitude, longitude)
  const coordMatch = query.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatch) {
    params.latitude = parseFloat(coordMatch[1]);
    params.longitude = parseFloat(coordMatch[2]);
  }
  
  // Extract radius
  const radiusMatch = query.match(/(\d+)\s*km/i);
  if (radiusMatch) {
    params.radius_km = parseFloat(radiusMatch[1]);
  }
  
  // Extract setback
  const setbackMatch = query.match(/(\d+)\s*m.*setback/i);
  if (setbackMatch) {
    params.setback_m = parseInt(setbackMatch[1]);
  }
  
  // Extract or generate project ID
  const projectIdMatch = query.match(/project[_\s]id[:\s]+['"]?([a-zA-Z0-9-]+)['"]?/i);
  if (projectIdMatch) {
    params.project_id = projectIdMatch[1];
  } else {
    params.project_id = `project-${Date.now()}`;
  }
  
  return params;
}

/**
 * Extract layout optimization parameters from query
 */
function extractLayoutParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Safety check for undefined query
  if (!query || typeof query !== 'string') {
    console.warn('extractLayoutParams called with invalid query:', query);
    return params;
  }
  
  // Extract coordinates - look for decimal coordinates (latitude, longitude)
  const coordMatch = query.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatch) {
    params.center_lat = parseFloat(coordMatch[1]);
    params.center_lon = parseFloat(coordMatch[2]);
  }
  
  // Extract number of turbines
  const turbineMatch = query.match(/(\d+)\s*turbine/i);
  if (turbineMatch) {
    params.num_turbines = parseInt(turbineMatch[1]);
  }
  
  // Extract capacity
  const capacityMatch = query.match(/(\d+)\s*mw/i);
  if (capacityMatch) {
    const totalCapacity = parseInt(capacityMatch[1]);
    params.num_turbines = params.num_turbines || Math.ceil(totalCapacity / 2.5);
  }
  
  // Extract layout type
  if (/offset.*grid/i.test(query)) {
    params.layout_type = 'offset_grid';
  } else if (/spiral/i.test(query)) {
    params.layout_type = 'spiral';
  } else if (/greedy/i.test(query)) {
    params.layout_type = 'greedy';
  } else {
    params.layout_type = 'grid';
  }
  
  // Extract or generate project ID
  const projectIdMatch = query.match(/project[_\s]id[:\s]+['"]?([a-zA-Z0-9-]+)['"]?/i);
  if (projectIdMatch) {
    params.project_id = projectIdMatch[1];
  } else {
    params.project_id = `project-${Date.now()}`;
  }
  
  return params;
}

/**
 * Extract simulation parameters from query
 */
function extractSimulationParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Extract project ID
  const projectIdMatch = query.match(/project[_\s]id[:\s]+['"]?([a-zA-Z0-9-]+)['"]?/i);
  if (projectIdMatch) {
    params.project_id = projectIdMatch[1];
  }
  
  // Extract wind speed
  const windSpeedMatch = query.match(/(\d+\.?\d*)\s*m\/s/i);
  if (windSpeedMatch) {
    params.wind_speed = parseFloat(windSpeedMatch[1]);
  }
  
  return params;
}

/**
 * Extract report parameters from query
 */
function extractReportParams(query: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Extract project ID
  const projectIdMatch = query.match(/project[_\s]id[:\s]+['"]?([a-zA-Z0-9-]+)['"]?/i);
  if (projectIdMatch) {
    params.project_id = projectIdMatch[1];
  }
  
  return params;
}

/**
 * Quick validation check for deployment status
 */
async function quickValidationCheck(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
    'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
    'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
    'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing environment variable: ${envVar}`);
    }
  }
  
  // If we have critical errors, we can't proceed
  const canProceed = errors.length === 0;
  
  return {
    isValid: canProceed && warnings.length === 0,
    errors,
    warnings,
    canProceed
  };
}

/**
 * Call appropriate tool Lambda(s) with fallback
 */
async function callToolLambdasWithFallback(
  intent: RenewableIntent,
  query: string,
  context: any | undefined,
  requestId: string
): Promise<ToolResult[]> {
  try {
    // Try the normal flow first
    return await callToolLambdas(intent, query, context, requestId);
  } catch (error) {
    console.warn('Tool Lambda failed, using fallback:', error);
    
    // Return fallback result with clear messaging
    return [{
      success: true,
      type: intent.type,
      data: {
        ...generateMockToolResult(intent.type, intent.params, query).data,
        fallbackUsed: true,
        message: `${generateMockToolResult(intent.type, intent.params, query).data.message} (Fallback data used due to backend unavailability)`
      }
    }];
  }
}

/**
 * Call appropriate tool Lambda(s)
 */
async function callToolLambdas(
  intent: RenewableIntent,
  query: string,
  context: any | undefined,
  requestId: string
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  let functionName: string = '';
  let payload: any;
  
  try {
    
    switch (intent.type) {
      case 'terrain_analysis':
        // Use lightweight ZIP-deployed terrain Lambda
        functionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || 'renewable-terrain-simple';
        payload = {
          parameters: {
            project_id: intent.params.project_id,
            latitude: intent.params.latitude,
            longitude: intent.params.longitude,
            radius_km: intent.params.radius_km || 5
          }
        };
        break;
        
      case 'layout_optimization':
        // Use lightweight layout Lambda
        functionName = process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME || 'renewable-layout-simple';
        payload = {
          parameters: {
            project_id: intent.params.project_id,
            latitude: intent.params.latitude,
            longitude: intent.params.longitude,
            area_km2: intent.params.area_km2 || 5.0,
            turbine_spacing_m: intent.params.turbine_spacing_m || 500,
            constraints: context?.terrainFeatures || []
          }
        };
        break;
        
      case 'wake_simulation':
        // Use lightweight simulation Lambda
        functionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || 'renewable-simulation-simple';
        payload = {
          parameters: {
            project_id: intent.params.project_id,
            layout: context?.layout || context?.layoutResults || intent.params.layout,
            wind_speed: intent.params.wind_speed || 8.5,
            wind_direction: intent.params.wind_direction || 270
          }
        };
        break;
        
      case 'wind_rose':
        // Use lightweight simulation Lambda with wind_rose action
        functionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || 'renewable-simulation-simple';
        payload = {
          action: 'wind_rose',
          parameters: {
            project_id: intent.params.project_id,
            latitude: intent.params.latitude,
            longitude: intent.params.longitude,
            wind_speed: intent.params.wind_speed || 8.5
          }
        };
        break;
        
      case 'report_generation':
        functionName = process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME || '';
        payload = {
          query,
          parameters: {
            ...intent.params,
            terrain_results: context?.terrain_results || context?.terrainResults,
            layout_results: context?.layout_results || context?.layoutResults,
            simulation_results: context?.simulation_results || context?.simulationResults
          }
        };
        break;
        
      default:
        throw new Error(`Unknown intent type: ${intent.type}`);
    }
    
    if (!functionName) {
      // Log the actual environment variables to debug deployment issue
      console.error(`Tool Lambda not configured for ${intent.type}`);
      console.error('Environment variables:', {
        RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME,
        RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME,
        RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME,
        RENEWABLE_REPORT_TOOL_FUNCTION_NAME: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME
      });
      
      // Provide helpful fallback with mock data
      console.warn(`Using fallback mock data for ${intent.type} due to missing Lambda function`);
      const mockResult = generateMockToolResult(intent.type, intent.params, query);
      mockResult.data.deploymentRequired = true;
      mockResult.data.missingComponent = `${intent.type} Python Lambda function`;
      mockResult.data.message = `${mockResult.data.message} (Using mock data - Python Lambda tools not deployed)`;
      
      results.push(mockResult);
      return results;
    }
    
    // Enhanced tool Lambda invocation logging
    const toolInvocationStartTime = Date.now();
    console.log('───────────────────────────────────────────────────────────');
    console.log('🔧 TOOL LAMBDA INVOCATION');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`🎯 Intent Type: ${intent.type}`);
    console.log(`📦 Function Name: ${functionName}`);
    console.log(`📤 Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`⏰ Invocation Time: ${new Date(toolInvocationStartTime).toISOString()}`);
    console.log('───────────────────────────────────────────────────────────');
    
    const result = await invokeLambdaWithRetry(functionName, payload);
    const toolInvocationDuration = Date.now() - toolInvocationStartTime;
    
    // Enhanced tool Lambda response logging
    console.log('───────────────────────────────────────────────────────────');
    console.log('✅ TOOL LAMBDA RESPONSE');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`📋 Request ID: ${requestId}`);
    console.log(`🎯 Intent Type: ${intent.type}`);
    console.log(`📦 Function Name: ${functionName}`);
    console.log(`✔️  Success: ${result.success}`);
    console.log(`📊 Artifact Count: ${result.data?.visualizations ? Object.keys(result.data.visualizations).length : 0}`);
    console.log(`📝 Message: ${result.data?.message || 'No message'}`);
    console.log(`⏱️  Execution Duration: ${toolInvocationDuration}ms`);
    console.log(`📥 Full Response: ${JSON.stringify(result, null, 2)}`);
    console.log('───────────────────────────────────────────────────────────');
    
    results.push(result);
    
  } catch (error) {
    console.error('Error calling tool Lambda:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Check if it's a function not found error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('ResourceNotFoundException') || errorMessage.includes('Function not found')) {
      console.warn(`Lambda function ${functionName} not found. Using mock data for frontend testing.`);
      const mockResult = generateMockToolResult(intent.type, intent.params, query);
      mockResult.data.deploymentRequired = true;
      mockResult.data.missingComponent = 'Python tool Lambda functions';
      mockResult.data.message = `${mockResult.data.message} (Using mock data - Lambda function not found)`;
      results.push(mockResult);
    } else {
      // If Lambda exists but fails (likely due to missing dependencies), provide helpful mock data
      console.warn(`Lambda ${functionName || 'unknown'} failed with error: ${errorMessage}. Providing mock data for frontend testing.`);
      const mockResult = generateMockToolResult(intent.type, intent.params, query);
      mockResult.data.deploymentRequired = true;
      mockResult.data.executionError = errorMessage;
      mockResult.data.message = `${mockResult.data.message} (Using mock data - Lambda execution failed)`;
      results.push(mockResult);
    }
  }
  
  return results;
}

/**
 * Generate mock tool result for testing when tools aren't deployed
 */
function generateMockToolResult(intentType: string, params: any, query: string): ToolResult {
  const projectId = params.project_id || `mock-${Date.now()}`;
  
  switch (intentType) {
    case 'terrain_analysis':
      return {
        success: true,
        type: 'terrain_analysis',
        data: {
          messageContentType: 'wind_farm_terrain_analysis',
          title: `Terrain Analysis - ${projectId}`,
          subtitle: 'Mock terrain analysis for testing visualization components',
          projectId,
          coordinates: {
            lat: params.center_lat || 35.067482,
            lng: params.center_lon || -101.395466
          },
          exclusionZones: [
            { type: 'water', area: 0.5, description: 'Small water body' },
            { type: 'road', length: 2.3, description: 'County road' }
          ],
          metrics: {
            totalFeatures: 12,
            radiusKm: 5,
            featuresByType: { water: 2, roads: 4, buildings: 6 }
          },
          mapHtml: '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc; background: #f9f9f9;">Mock Interactive Map<br/>Terrain analysis visualization would appear here</div>',
          visualizations: {
            elevation_profile: 'https://via.placeholder.com/800x400/4CAF50/white?text=Elevation+Profile',
            accessibility_analysis: 'https://via.placeholder.com/800x400/2196F3/white?text=Accessibility+Analysis',
            topographic_map: 'https://via.placeholder.com/800x400/FF9800/white?text=Topographic+Map'
          },
          message: 'Mock terrain analysis completed successfully. This is test data for frontend development.'
        }
      };
      
    case 'layout_optimization':
      return {
        success: true,
        type: 'layout_optimization',
        data: {
          messageContentType: 'wind_farm_layout',
          title: `Wind Farm Layout - ${projectId}`,
          subtitle: 'Mock layout optimization for testing visualization components',
          projectId,
          turbineCount: params.num_turbines || 15,
          totalCapacity: (params.num_turbines || 15) * 2.5,
          turbinePositions: Array.from({ length: params.num_turbines || 15 }, (_, i) => ({
            lat: (params.center_lat || 35.067482) + (Math.random() - 0.5) * 0.01,
            lng: (params.center_lon || -101.395466) + (Math.random() - 0.5) * 0.01,
            id: `T${i + 1}`
          })),
          mapHtml: '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc; background: #f9f9f9;">Mock Interactive Map<br/>Wind farm layout would appear here</div>',
          visualizations: {
            interactive_map: 'https://via.placeholder.com/800x600/4CAF50/white?text=Interactive+Layout+Map',
            validation_chart: 'https://via.placeholder.com/800x400/2196F3/white?text=Layout+Validation',
            spacing_analysis: 'https://via.placeholder.com/800x400/FF9800/white?text=Spacing+Analysis'
          },
          message: 'Mock layout optimization completed successfully. This is test data for frontend development.'
        }
      };
      
    case 'wake_simulation':
      return {
        success: true,
        type: 'wake_simulation',
        data: {
          messageContentType: 'wind_farm_simulation',
          title: `Wake Simulation Results - ${projectId}`,
          subtitle: 'Mock wake simulation for testing visualization components',
          projectId,
          performanceMetrics: {
            annualEnergyProduction: 125000,
            capacityFactor: 0.42,
            wakeLosses: 0.08,
            wakeEfficiency: 0.92,
            grossAEP: 135000,
            netAEP: 125000
          },
          visualizations: {
            wind_rose: 'https://via.placeholder.com/600x600/4CAF50/white?text=Wind+Rose+Diagram',
            wake_analysis: 'https://via.placeholder.com/800x600/2196F3/white?text=Wake+Analysis+Chart',
            performance_charts: [
              'https://via.placeholder.com/800x400/FF9800/white?text=Performance+Chart+1',
              'https://via.placeholder.com/800x400/9C27B0/white?text=Performance+Chart+2'
            ],
            monthly_production: 'https://via.placeholder.com/800x400/607D8B/white?text=Monthly+Production',
            wake_heat_map: '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc; background: #f9f9f9;">Mock Wake Heat Map<br/>Interactive wake visualization would appear here</div>'
          },
          mapHtml: '<div style="padding: 20px; text-align: center; border: 2px dashed #ccc; background: #f9f9f9;">Mock Interactive Map<br/>Wake simulation visualization would appear here</div>',
          optimizationRecommendations: [
            'Consider repositioning turbines to reduce wake losses from 8% to ~6%',
            'Optimize turbine spacing to improve capacity factor from 42%',
            'Implement advanced wake steering control systems for 2-3% additional gains'
          ],
          message: 'Mock wake simulation completed successfully. This is test data for frontend development.'
        }
      };
      
    case 'report_generation':
      return {
        success: true,
        type: 'report_generation',
        data: {
          messageContentType: 'renewable_report',
          title: `Renewable Energy Report - ${projectId}`,
          subtitle: 'Mock report generation for testing',
          projectId,
          reportUrl: 'https://via.placeholder.com/800x1000/4CAF50/white?text=Mock+PDF+Report',
          reportType: 'comprehensive',
          sections: ['Executive Summary', 'Terrain Analysis', 'Layout Design', 'Performance Analysis'],
          visualizations: {
            complete_report: 'https://via.placeholder.com/800x1000/4CAF50/white?text=Complete+Report+PDF'
          },
          message: 'Mock report generated successfully. This is test data for frontend development.'
        }
      };
      
    default:
      return {
        success: false,
        type: intentType,
        data: {
          message: `Mock data not available for ${intentType}`
        },
        error: 'Unknown intent type'
      };
  }
}

/**
 * Invoke Lambda with retry logic
 */
async function invokeLambdaWithRetry(
  functionName: string,
  payload: any,
  maxRetries: number = 3
): Promise<ToolResult> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(payload)
      });
      
      const response = await lambdaClient.send(command);
      
      if (!response.Payload) {
        throw new Error('No payload in Lambda response');
      }
      
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      
      // Parse the body if it's a Lambda proxy response
      if (result.body) {
        const body = JSON.parse(result.body);
        
        // If body has type and data fields, use them directly
        if (body.type && body.data) {
          return {
            success: body.success,
            type: body.type,
            data: body.data,
            error: body.error
          };
        }
        
        // Otherwise, treat the entire body as data and infer type from content
        let inferredType = 'unknown';
        if (body.wind_rose_data) {
          inferredType = 'wind_rose';
        } else if (body.wake_loss_percent !== undefined) {
          inferredType = 'wake_simulation';
        } else if (body.turbine_count && body.layout) {
          inferredType = 'layout_optimization';
        } else if (body.feature_count) {
          inferredType = 'terrain_analysis';
        }
        
        return {
          success: body.success,
          type: inferredType,
          data: body,
          error: body.error
        };
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Lambda invocation attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw new Error(`Lambda invocation failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Format tool results as EDI artifacts with validation
 */
function formatArtifacts(results: ToolResult[]): Artifact[] {
  const artifacts: Artifact[] = [];
  
  for (const result of results) {
    if (!result.success) {
      continue;
    }
    
    let artifact: Artifact | null = null;
    
    switch (result.type) {
      case 'terrain_analysis':
        console.log('🔍 TERRAIN DEBUG - result.data keys:', Object.keys(result.data));
        console.log('🔍 TERRAIN DEBUG - has geojson:', !!result.data.geojson);
        console.log('🔍 TERRAIN DEBUG - has mapHtml:', !!result.data.mapHtml);
        console.log('🔍 TERRAIN DEBUG - geojson type:', typeof result.data.geojson);
        if (result.data.geojson) {
          console.log('🔍 TERRAIN DEBUG - geojson features:', result.data.geojson.features?.length);
        }
        
        artifact = {
          type: 'wind_farm_terrain_analysis',
          data: {
            messageContentType: 'wind_farm_terrain_analysis',
            coordinates: result.data.coordinates,
            projectId: result.data.projectId,
            exclusionZones: result.data.exclusionZones,
            metrics: result.data.metrics,
            geojson: result.data.geojson,
            mapHtml: result.data.mapHtml,
            mapUrl: result.data.mapUrl,
            visualizations: result.data.visualizations,
            message: result.data.message
          }
        };
        
        console.log('🔍 TERRAIN DEBUG - artifact.data has geojson:', !!artifact.data.geojson);
        break;
        
      case 'layout_optimization':
        artifact = {
          type: 'wind_farm_layout',
          data: {
            messageContentType: 'wind_farm_layout',
            title: `Wind Farm Layout - ${result.data.turbineCount} Turbines`,
            subtitle: `${result.data.totalCapacity} MW capacity with ${result.data.layoutType || 'optimized'} layout`,
            projectId: result.data.projectId,
            layoutType: result.data.layoutType,
            turbineCount: result.data.turbineCount,
            totalCapacity: result.data.totalCapacity,
            turbinePositions: result.data.turbinePositions,
            geojson: result.data.geojson,
            mapHtml: result.data.mapHtml,
            mapUrl: result.data.mapUrl,
            spacing: result.data.spacing,
            visualizations: result.data.visualizations,
            message: result.data.message
          }
        };
        break;
        
      case 'wake_simulation':
        artifact = {
          type: 'wind_farm_simulation',
          data: {
            messageContentType: 'wind_farm_simulation',
            title: result.data.title || `Wake Simulation Results - ${result.data.projectId || result.data.project_id}`,
            subtitle: result.data.subtitle || `Comprehensive analysis with ${Object.keys(result.data.visualizations || {}).length} visualizations`,
            projectId: result.data.projectId || result.data.project_id,
            performanceMetrics: result.data.performanceMetrics,
            visualizations: result.data.visualizations,
            mapHtml: result.data.mapHtml,
            optimizationRecommendations: result.data.optimizationRecommendations,
            s3Url: result.data.s3Url || result.data.s3_data?.url,
            message: result.data.message
          }
        };
        break;
        
      case 'wind_rose':
        artifact = {
          type: 'wind_rose_analysis',
          data: {
            messageContentType: 'wind_rose_analysis',
            title: `Wind Rose Analysis - ${result.data.project_id}`,
            subtitle: `Wind patterns with ${result.data.statistics?.avg_wind_speed || result.data.average_wind_speed}m/s average speed`,
            projectId: result.data.project_id,
            coordinates: result.data.location,
            metrics: {
              avgWindSpeed: result.data.statistics?.avg_wind_speed || result.data.average_wind_speed,
              maxWindSpeed: result.data.statistics?.max_wind_speed || result.data.max_wind_speed,
              prevailingDirection: result.data.statistics?.prevailing_direction || result.data.prevailing_direction,
              totalObservations: result.data.statistics?.total_observations || 8760
            },
            windData: result.data.wind_data || result.data.wind_rose_data,
            geojson: result.data.geojson,
            s3Url: result.data.s3_data?.url,
            message: result.data.message
          }
        };
        break;
        
      case 'report_generation':
        artifact = {
          type: 'wind_farm_report',
          data: {
            projectId: result.data.projectId,
            executiveSummary: result.data.executiveSummary,
            recommendations: result.data.recommendations,
            reportHtml: result.data.reportHtml,
            message: result.data.message
          }
        };
        break;
    }
    
    // Validate artifact before adding
    if (artifact) {
      try {
        // Test JSON serializability
        const serialized = JSON.stringify(artifact);
        JSON.parse(serialized);
        
        // Artifact is valid, add it
        artifacts.push(artifact);
        
        console.log('✅ Artifact validated and added:', {
          type: artifact.type,
          hasData: !!artifact.data,
          dataKeys: artifact.data ? Object.keys(artifact.data) : [],
        });
      } catch (error: any) {
        console.error('❌ Artifact failed JSON serialization:', {
          type: artifact.type,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        
        // Try to sanitize the artifact
        try {
          const sanitized = JSON.parse(JSON.stringify(artifact, (key, value) => {
            // Remove functions and undefined values
            if (typeof value === 'function' || value === undefined) {
              return null;
            }
            return value;
          }));
          
          artifacts.push(sanitized);
          console.log('⚠️ Artifact sanitized and added:', {
            type: sanitized.type,
          });
        } catch (sanitizeError: any) {
          console.error('❌ Failed to sanitize artifact:', {
            type: artifact.type,
            error: sanitizeError.message,
          });
        }
      }
    }
  }
  
  return artifacts;
}

/**
 * Generate response message
 */
function generateResponseMessage(intent: RenewableIntent, results: ToolResult[]): string {
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    // Check if it's a deployment issue
    const deploymentIssue = results.find(r => r.data?.deploymentRequired);
    if (deploymentIssue) {
      return deploymentIssue.data.message || 'Renewable energy tools are not yet deployed.';
    }
    
    return 'Tool execution failed. Please check the parameters and try again.';
  }
  
  const result = successfulResults[0];
  
  switch (intent.type) {
    case 'terrain_analysis':
      return result.data.message || 'Terrain analysis completed successfully.';
      
    case 'layout_optimization':
      return result.data.message || `Layout optimization completed with ${result.data.turbineCount} turbines.`;
      
    case 'wake_simulation':
      return result.data.message || 'Wake simulation completed successfully.';
      
    case 'wind_rose':
      return result.data.message || 'Wind rose analysis completed successfully.';
      
    case 'report_generation':
      return result.data.message || 'Report generated successfully.';
      
    default:
      return 'Analysis completed successfully.';
  }
}


/**
 * Write results to ChatMessage table for async invocations
 * This allows results to appear in the chat even when invoked with InvocationType='Event'
 */
async function writeResultsToChatMessage(
  sessionId: string,
  userId: string,
  response: OrchestratorResponse
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('📝 Writing results to DynamoDB ChatMessage table...');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Artifacts: ${response.artifacts?.length || 0}`);
    console.log(`   Thought Steps: ${response.thoughtSteps?.length || 0}`);
    
    // Use DynamoDB SDK with proper serialization for AWSJSON types
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
    
    const dynamoClient = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
        convertClassInstanceToMap: false
      }
    });
    
    const tableName = process.env.AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME || 'ChatMessage';
    console.log(`   Table Name: ${tableName}`);
    
    // Validate required fields
    if (!sessionId || !userId) {
      throw new Error('Missing required fields: sessionId and userId are required');
    }
    
    if (!response.message) {
      console.warn('⚠️  Response message is empty, using default message');
    }
    
    // CRITICAL: Serialize artifacts and thoughtSteps as JSON strings
    // Amplify's AWSJSON type expects strings, not objects
    const serializedArtifacts = response.artifacts?.map(artifact => 
      typeof artifact === 'string' ? artifact : JSON.stringify(artifact)
    ) || [];
    
    const serializedThoughtSteps = response.thoughtSteps?.map(step => 
      typeof step === 'string' ? step : JSON.stringify(step)
    ) || [];
    
    console.log(`   Serialized ${serializedArtifacts.length} artifacts and ${serializedThoughtSteps.length} thought steps`);
    
    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatSessionId: sessionId,
      owner: userId,
      role: 'ai',
      content: {
        text: response.message || 'Analysis complete'
      },
      responseComplete: true,
      artifacts: serializedArtifacts,
      thoughtSteps: serializedThoughtSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`   Message ID: ${chatMessage.id}`);
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: chatMessage
    }));
    
    const duration = Date.now() - startTime;
    console.log('✅ Results written to ChatMessage table', {
      messageId: chatMessage.id,
      chatSessionId: sessionId,
      artifactCount: serializedArtifacts.length,
      thoughtStepCount: serializedThoughtSteps.length,
      duration: `${duration}ms`
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Failed to write results to ChatMessage:', error);
    console.error('   Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`
    });
    
    // Log specific error types for debugging
    if (error instanceof Error) {
      if (error.message.includes('ResourceNotFoundException')) {
        console.error('   ⚠️  Table not found - ensure ChatMessage table exists');
      } else if (error.message.includes('AccessDenied')) {
        console.error('   ⚠️  Permission denied - check IAM permissions for DynamoDB');
      } else if (error.message.includes('ValidationException')) {
        console.error('   ⚠️  Invalid data format - check message structure');
      }
    }
    
    // Don't throw - this is a best-effort operation
    // The orchestrator should still return successfully even if DynamoDB write fails
  }
}
