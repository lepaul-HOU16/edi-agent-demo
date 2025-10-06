/**
 * Renewable Energy Orchestrator Lambda
 * 
 * Simple orchestration logic that replaces complex multi-agent framework.
 * Routes renewable energy queries to appropriate tool Lambdas and aggregates results.
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

const lambdaClient = new LambdaClient({});

/**
 * Main Lambda handler
 */
export async function handler(event: OrchestratorRequest): Promise<OrchestratorResponse> {
  const startTime = Date.now();
  const thoughtSteps: ThoughtStep[] = [];
  const toolsUsed: string[] = [];
  
  try {
    console.log('Renewable orchestrator invoked:', JSON.stringify(event));
    
    // Step 1: Parse intent from query
    thoughtSteps.push({
      step: 1,
      action: 'Analyzing query',
      reasoning: 'Determining which renewable energy tool to use'
    });
    
    const intent = parseIntent(event.query);
    console.log('Parsed intent:', JSON.stringify(intent));
    
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
    
    thoughtSteps.push({
      step: 2,
      action: `Calling ${intent.type} tool`,
      reasoning: `Query matches ${intent.type} pattern with ${intent.confidence}% confidence`
    });
    
    // Step 2: Call appropriate tool Lambda(s)
    const results = await callToolLambdas(intent, event.query, event.context);
    toolsUsed.push(intent.type);
    
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
      step: 3,
      action: 'Processing results',
      reasoning: 'Formatting tool output for display',
      result: `Successfully processed ${results.length} result(s)`
    });
    
    // Step 3: Format results as EDI artifacts
    const artifacts = formatArtifacts(results);
    const message = generateResponseMessage(intent, results);
    
    return {
      success: true,
      message,
      artifacts,
      thoughtSteps,
      metadata: {
        executionTime: Date.now() - startTime,
        toolsUsed,
        projectId: intent.params.project_id || event.context?.projectId
      }
    };
    
  } catch (error) {
    console.error('Orchestrator error:', error);
    
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps,
      metadata: {
        executionTime: Date.now() - startTime,
        toolsUsed
      }
    };
  }
}

/**
 * Parse user query to determine intent
 */
function parseIntent(query: string): RenewableIntent {
  const lowerQuery = query.toLowerCase();
  
  // Terrain analysis patterns
  if (matchesAny(lowerQuery, [
    /terrain/i,
    /analyze.*site/i,
    /suitability/i,
    /exclusion.*zone/i,
    /unbuildable/i,
    /constraint/i
  ])) {
    return {
      type: 'terrain_analysis',
      params: extractTerrainParams(query),
      confidence: 90
    };
  }
  
  // Layout optimization patterns
  if (matchesAny(lowerQuery, [
    /layout/i,
    /turbine.*placement/i,
    /design.*wind.*farm/i,
    /position.*turbine/i,
    /grid.*layout/i,
    /optimize.*layout/i
  ])) {
    return {
      type: 'layout_optimization',
      params: extractLayoutParams(query),
      confidence: 85
    };
  }
  
  // Wake simulation patterns
  if (matchesAny(lowerQuery, [
    /simulation/i,
    /wake/i,
    /performance/i,
    /aep/i,
    /annual.*energy/i,
    /capacity.*factor/i
  ])) {
    return {
      type: 'wake_simulation',
      params: extractSimulationParams(query),
      confidence: 80
    };
  }
  
  // Report generation patterns
  if (matchesAny(lowerQuery, [
    /report/i,
    /summary/i,
    /executive/i,
    /document/i,
    /findings/i
  ])) {
    return {
      type: 'report_generation',
      params: extractReportParams(query),
      confidence: 75
    };
  }
  
  return {
    type: 'unknown',
    params: {},
    confidence: 0
  };
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
  
  // Extract coordinates
  const coordMatch = query.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
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
  
  // Extract coordinates
  const coordMatch = query.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
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
 * Call appropriate tool Lambda(s)
 */
async function callToolLambdas(
  intent: RenewableIntent,
  query: string,
  context?: any
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  try {
    let functionName: string;
    let payload: any;
    
    switch (intent.type) {
      case 'terrain_analysis':
        functionName = process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || '';
        payload = {
          query,
          parameters: intent.params
        };
        break;
        
      case 'layout_optimization':
        functionName = process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME || '';
        payload = {
          query,
          parameters: intent.params
        };
        break;
        
      case 'wake_simulation':
        functionName = process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || '';
        payload = {
          query,
          parameters: {
            ...intent.params,
            layout: context?.layout // Pass layout from previous step if available
          }
        };
        break;
        
      case 'report_generation':
        functionName = process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME || '';
        payload = {
          query,
          parameters: {
            ...intent.params,
            terrain_results: context?.terrain_results,
            layout_results: context?.layout_results,
            simulation_results: context?.simulation_results
          }
        };
        break;
        
      default:
        throw new Error(`Unknown intent type: ${intent.type}`);
    }
    
    if (!functionName) {
      // Return helpful error message about missing tool Lambdas
      console.error(`Tool Lambda not configured for ${intent.type}`);
      results.push({
        success: false,
        type: intent.type,
        data: {
          message: `Renewable energy tool for ${intent.type} is not yet deployed. The Python tool Lambdas require the renewable-demo code to be packaged as a Lambda Layer. Please deploy the renewable-demo layer first.`,
          deploymentRequired: true,
          missingComponent: 'renewable-demo Lambda Layer'
        },
        error: `Tool Lambda not configured for ${intent.type}`
      });
      return results;
    }
    
    console.log(`Invoking Lambda: ${functionName}`);
    const result = await invokeLambdaWithRetry(functionName, payload);
    results.push(result);
    
  } catch (error) {
    console.error('Error calling tool Lambda:', error);
    
    // Check if it's a function not found error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('ResourceNotFoundException') || errorMessage.includes('Function not found')) {
      results.push({
        success: false,
        type: intent.type,
        data: {
          message: `Renewable energy tool Lambda does not exist. The Python tool Lambdas require the renewable-demo code to be packaged as a Lambda Layer and deployed. This is a deployment configuration issue.`,
          deploymentRequired: true,
          missingComponent: 'Python tool Lambda functions'
        },
        error: 'Tool Lambda not deployed'
      });
    } else {
      results.push({
        success: false,
        type: intent.type,
        data: {},
        error: errorMessage
      });
    }
  }
  
  return results;
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
        return {
          success: body.success,
          type: body.type,
          data: body.data,
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
 * Format tool results as EDI artifacts
 */
function formatArtifacts(results: ToolResult[]): Artifact[] {
  const artifacts: Artifact[] = [];
  
  for (const result of results) {
    if (!result.success) {
      continue;
    }
    
    switch (result.type) {
      case 'terrain_analysis':
        artifacts.push({
          type: 'wind_farm_terrain_analysis',
          data: {
            coordinates: result.data.coordinates,
            projectId: result.data.projectId,
            exclusionZones: result.data.exclusionZones,
            metrics: result.data.metrics,
            geojson: result.data.geojson,
            message: result.data.message
          }
        });
        break;
        
      case 'layout_optimization':
        artifacts.push({
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
        });
        break;
        
      case 'wake_simulation':
        artifacts.push({
          type: 'wind_farm_simulation',
          data: {
            projectId: result.data.projectId,
            performanceMetrics: result.data.performanceMetrics,
            turbineMetrics: result.data.turbineMetrics,
            monthlyProduction: result.data.monthlyProduction,
            message: result.data.message
          }
        });
        break;
        
      case 'report_generation':
        artifacts.push({
          type: 'wind_farm_report',
          data: {
            projectId: result.data.projectId,
            executiveSummary: result.data.executiveSummary,
            recommendations: result.data.recommendations,
            reportHtml: result.data.reportHtml,
            message: result.data.message
          }
        });
        break;
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
      
    case 'report_generation':
      return result.data.message || 'Report generated successfully.';
      
    default:
      return 'Analysis completed successfully.';
  }
}
