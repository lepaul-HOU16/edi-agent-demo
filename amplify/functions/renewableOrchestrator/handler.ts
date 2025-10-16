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
import { ProjectStore } from '../shared/projectStore';
import { ProjectNameGenerator } from '../shared/projectNameGenerator';
import { SessionContextManager } from '../shared/sessionContextManager';
import { ProjectResolver } from '../shared/projectResolver';
import { ErrorMessageTemplates } from '../shared/errorMessageTemplates';
import { generateActionButtons, generateNextStepSuggestion, formatProjectStatusChecklist } from '../shared/actionButtonTypes';
import { ProjectListHandler } from '../shared/projectListHandler';

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
    
    // Handle project listing queries
    const projectListHandler = new ProjectListHandler(
      process.env.RENEWABLE_S3_BUCKET,
      process.env.SESSION_CONTEXT_TABLE
    );
    
    // Check if this is a "list my projects" query
    if (ProjectListHandler.isProjectListQuery(event.query)) {
      console.log('📋 Detected project list query');
      const listStartTime = Date.now();
      thoughtSteps.push({
        step: 1,
        action: 'Listing projects',
        reasoning: 'Retrieving all renewable energy projects',
        status: 'in_progress',
        timestamp: new Date(listStartTime).toISOString()
      });
      
      const listResponse = await projectListHandler.listProjects(event.sessionId);
      const listDuration = Date.now() - listStartTime;
      
      // Update thought step with completion
      thoughtSteps[0] = {
        ...thoughtSteps[0],
        status: 'complete',
        duration: listDuration,
        result: `Found ${listResponse.projects?.length || 0} project(s)`
      };
      
      return {
        success: listResponse.success,
        message: listResponse.message,
        artifacts: [],
        thoughtSteps,
        responseComplete: true,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: ['project_list'],
          projectCount: listResponse.projects?.length || 0,
          activeProject: listResponse.activeProject
        }
      };
    }
    
    // Check if this is a "show project {name}" query
    const projectDetailsCheck = ProjectListHandler.isProjectDetailsQuery(event.query);
    if (projectDetailsCheck.isMatch && projectDetailsCheck.projectName) {
      console.log(`📋 Detected project details query for: ${projectDetailsCheck.projectName}`);
      const detailsStartTime = Date.now();
      thoughtSteps.push({
        step: 1,
        action: 'Loading project details',
        reasoning: `Retrieving details for project: ${projectDetailsCheck.projectName}`,
        status: 'in_progress',
        timestamp: new Date(detailsStartTime).toISOString()
      });
      
      const detailsResponse = await projectListHandler.showProjectDetails(projectDetailsCheck.projectName);
      const detailsDuration = Date.now() - detailsStartTime;
      
      // Update thought step with completion
      thoughtSteps[0] = {
        ...thoughtSteps[0],
        status: detailsResponse.success ? 'complete' : 'error',
        duration: detailsDuration,
        result: detailsResponse.success ? 'Project details loaded' : 'Project not found',
        ...(detailsResponse.success ? {} : {
          error: {
            message: 'Project not found',
            suggestion: 'Check project name or list all projects'
          }
        })
      };
      
      return {
        success: detailsResponse.success,
        message: detailsResponse.message,
        artifacts: [],
        thoughtSteps,
        responseComplete: true,
        metadata: {
          executionTime: Date.now() - startTime,
          toolsUsed: ['project_details'],
          projectName: projectDetailsCheck.projectName
        }
      };
    }
    
    // Step 1: Quick validation check
    const validationStartTime = Date.now();
    thoughtSteps.push({
      step: 1,
      action: 'Validating deployment',
      reasoning: 'Checking if renewable energy tools are available',
      status: 'in_progress',
      timestamp: new Date(validationStartTime).toISOString()
    });
    
    const validation = await quickValidationCheck();
    timings.validation = Date.now() - validationStartTime;
    
    // Update thought step with completion
    thoughtSteps[thoughtSteps.length - 1] = {
      ...thoughtSteps[thoughtSteps.length - 1],
      status: 'complete',
      duration: timings.validation,
      result: validation.canProceed ? 'All tools available' : 'Deployment issues detected'
    };
    
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
    const intentStartTime = Date.now();
    thoughtSteps.push({
      step: 2,
      action: 'Analyzing query',
      reasoning: 'Determining which renewable energy tool to use',
      status: 'in_progress',
      timestamp: new Date(intentStartTime).toISOString()
    });
    
    const intent = await parseIntent(event.query, event.context);
    timings.intentDetection = Date.now() - intentStartTime;
    
    // Update thought step with completion
    thoughtSteps[thoughtSteps.length - 1] = {
      ...thoughtSteps[thoughtSteps.length - 1],
      status: 'complete',
      duration: timings.intentDetection,
      result: `Detected: ${intent.type}`
    };
    
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
    
    // Step 2.5: Project name resolution
    const projectResolutionStartTime = Date.now();
    thoughtSteps.push({
      step: 3,
      action: 'Resolving project name',
      reasoning: 'Determining project context from query and session',
      status: 'in_progress',
      timestamp: new Date(projectResolutionStartTime).toISOString()
    });
    
    let projectName: string | null = null;
    
    try {
      // Initialize project persistence components
      const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
      const sessionContextManager = new SessionContextManager(process.env.SESSION_CONTEXT_TABLE);
      const projectNameGenerator = new ProjectNameGenerator(projectStore);
      const projectResolver = new ProjectResolver(projectStore);
      
      // Get session context
      const sessionId = event.sessionId || `session-${Date.now()}`;
      const sessionContext = await sessionContextManager.getContext(sessionId);
      
      console.log('───────────────────────────────────────────────────────────');
      console.log('🆔 PROJECT NAME RESOLUTION');
      console.log('───────────────────────────────────────────────────────────');
      console.log(`📋 Request ID: ${requestId}`);
      console.log(`🔗 Session ID: ${sessionId}`);
      console.log(`📝 Active Project: ${sessionContext.active_project || 'none'}`);
      console.log(`📚 Project History: ${sessionContext.project_history.join(', ') || 'empty'}`);
      
      // Try to resolve existing project reference
      const resolveResult = await projectResolver.resolve(event.query, sessionContext);
      
      console.log(`🔍 Resolution Result: ${JSON.stringify(resolveResult, null, 2)}`);
      
      if (resolveResult.isAmbiguous && resolveResult.matches) {
        // Multiple projects match - return user-friendly error with suggestions
        const errorMessage = ErrorMessageTemplates.formatAmbiguousReferenceForUser(
          resolveResult.matches,
          event.query
        );
        
        console.log('❌ Ambiguous project reference detected');
        console.log(`   Query: ${event.query}`);
        console.log(`   Matches: ${resolveResult.matches.join(', ')}`);
        
        return {
          success: false,
          message: errorMessage,
          artifacts: [],
          thoughtSteps,
          metadata: {
            executionTime: Date.now() - startTime,
            toolsUsed: [],
            errorCategory: 'AMBIGUOUS_REFERENCE',
            ambiguousProjects: resolveResult.matches,
            matchCount: resolveResult.matches.length
          }
        };
      }
      
      if (resolveResult.projectName) {
        // Found existing project
        projectName = resolveResult.projectName;
        console.log(`✅ Resolved to existing project: ${projectName}`);
      } else {
        // No existing project found - generate new project name
        const coordinates = intent.params.latitude && intent.params.longitude
          ? { lat: intent.params.latitude, lon: intent.params.longitude }
          : undefined;
        
        projectName = await projectNameGenerator.generateFromQuery(event.query, coordinates);
        console.log(`🆕 Generated new project name: ${projectName}`);
      }
      
      // Set as active project in session
      await sessionContextManager.setActiveProject(sessionId, projectName);
      await sessionContextManager.addToHistory(sessionId, projectName);
      
      // Add project name to intent params
      intent.params.project_name = projectName;
      if (!intent.params.project_id) {
        intent.params.project_id = projectName; // Use project name as ID for now
      }
      
      const projectResolutionDuration = Date.now() - projectResolutionStartTime;
      console.log(`⏱️  Project Resolution Duration: ${projectResolutionDuration}ms`);
      console.log('───────────────────────────────────────────────────────────');
      
      // Update thought step with completion
      thoughtSteps[thoughtSteps.length - 1] = {
        ...thoughtSteps[thoughtSteps.length - 1],
        status: 'complete',
        duration: projectResolutionDuration,
        result: projectName ? `Project: ${projectName}` : 'No project context'
      };
      
    } catch (error) {
      console.error('❌ Error in project name resolution:', error);
      // Continue without project name - will use fallback logic
      console.warn('⚠️  Continuing without project name resolution');
      
      // Update thought step with error
      const projectResolutionDuration = Date.now() - projectResolutionStartTime;
      thoughtSteps[thoughtSteps.length - 1] = {
        ...thoughtSteps[thoughtSteps.length - 1],
        status: 'error',
        duration: projectResolutionDuration,
        error: {
          message: 'Failed to resolve project name',
          suggestion: 'Continuing without project context'
        }
      };
    }
    
    // Step 3: Validate parameters before tool invocation
    const paramValidationStartTime = Date.now();
    thoughtSteps.push({
      step: 4,
      action: 'Validating parameters',
      reasoning: 'Checking that all required parameters are present and valid',
      status: 'in_progress',
      timestamp: new Date(paramValidationStartTime).toISOString()
    });
    
    const paramValidation = validateParameters(intent);
    const paramValidationDuration = Date.now() - paramValidationStartTime;
    
    // Update thought step with completion
    thoughtSteps[thoughtSteps.length - 1] = {
      ...thoughtSteps[thoughtSteps.length - 1],
      status: paramValidation.isValid ? 'complete' : 'error',
      duration: paramValidationDuration,
      result: paramValidation.isValid ? 'All parameters valid' : 'Missing required parameters',
      ...(paramValidation.isValid ? {} : {
        error: {
          message: `Missing: ${paramValidation.missingRequired.join(', ')}`,
          suggestion: 'Please provide all required parameters'
        }
      })
    };
    
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
    
    // Step 4.5: Load project data from S3 if project name exists
    let projectData: any = null;
    if (projectName) {
      const loadProjectStartTime = Date.now();
      thoughtSteps.push({
        step: 5,
        action: 'Loading project data',
        reasoning: `Loading existing data for project: ${projectName}`,
        status: 'in_progress',
        timestamp: new Date(loadProjectStartTime).toISOString()
      });
      
      try {
        const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
        projectData = await projectStore.load(projectName);
        
        const loadProjectDuration = Date.now() - loadProjectStartTime;
        
        // Update thought step with completion
        thoughtSteps[thoughtSteps.length - 1] = {
          ...thoughtSteps[thoughtSteps.length - 1],
          status: 'complete',
          duration: loadProjectDuration,
          result: projectData ? 'Project data loaded' : 'New project'
        };
        
        if (projectData) {
          console.log('───────────────────────────────────────────────────────────');
          console.log('📦 PROJECT DATA LOADED');
          console.log('───────────────────────────────────────────────────────────');
          console.log(`📋 Request ID: ${requestId}`);
          console.log(`🆔 Project Name: ${projectName}`);
          console.log(`📅 Created: ${projectData.created_at}`);
          console.log(`📅 Updated: ${projectData.updated_at}`);
          console.log(`📍 Has Coordinates: ${!!projectData.coordinates}`);
          console.log(`🗺️  Has Terrain Results: ${!!projectData.terrain_results}`);
          console.log(`📐 Has Layout Results: ${!!projectData.layout_results}`);
          console.log(`💨 Has Simulation Results: ${!!projectData.simulation_results}`);
          console.log(`📄 Has Report Results: ${!!projectData.report_results}`);
          console.log('───────────────────────────────────────────────────────────');
          
          // Merge project data into context
          const mergedContext = {
            ...event.context,
            projectData,
            coordinates: projectData.coordinates,
            terrain_results: projectData.terrain_results,
            terrainResults: projectData.terrain_results,
            layout_results: projectData.layout_results,
            layoutResults: projectData.layout_results,
            simulation_results: projectData.simulation_results,
            simulationResults: projectData.simulation_results,
            report_results: projectData.report_results,
            reportResults: projectData.report_results
          };
          
          // Update event context for tool Lambda calls
          event.context = mergedContext;
          
          // Auto-fill missing parameters from project data
          if (!intentWithDefaults.params.latitude && projectData.coordinates) {
            intentWithDefaults.params.latitude = projectData.coordinates.latitude;
            intentWithDefaults.params.longitude = projectData.coordinates.longitude;
            console.log(`✅ Auto-filled coordinates from project data: (${projectData.coordinates.latitude}, ${projectData.coordinates.longitude})`);
          }
          
          if (!intentWithDefaults.params.layout && projectData.layout_results) {
            intentWithDefaults.params.layout = projectData.layout_results;
            console.log(`✅ Auto-filled layout from project data`);
          }
        } else {
          console.log(`ℹ️  No existing data found for project: ${projectName} (new project)`);
        }
      } catch (error) {
        console.error('❌ Error loading project data:', error);
        console.warn('⚠️  Continuing without project data');
        
        const loadProjectDuration = Date.now() - loadProjectStartTime;
        
        // Update thought step with error
        thoughtSteps[thoughtSteps.length - 1] = {
          ...thoughtSteps[thoughtSteps.length - 1],
          status: 'error',
          duration: loadProjectDuration,
          error: {
            message: 'Failed to load project data',
            suggestion: 'Continuing without project context'
          }
        };
      }
    }
    
    const toolStartTime = Date.now();
    thoughtSteps.push({
      step: 6,
      action: `Calling ${intentWithDefaults.type} tool`,
      reasoning: `Query matches ${intentWithDefaults.type} pattern with ${intentWithDefaults.confidence}% confidence, all parameters validated`,
      status: 'in_progress',
      timestamp: new Date(toolStartTime).toISOString()
    });
    
    // Step 5: Call appropriate tool Lambda(s) with fallback
    const results = await callToolLambdasWithFallback(intentWithDefaults, event.query, event.context, requestId);
    timings.toolInvocation = Date.now() - toolStartTime;
    toolsUsed.push(intentWithDefaults.type);
    
    // Update thought step with completion
    thoughtSteps[thoughtSteps.length - 1] = {
      ...thoughtSteps[thoughtSteps.length - 1],
      status: results && results.length > 0 ? 'complete' : 'error',
      duration: timings.toolInvocation,
      result: results && results.length > 0 ? `Generated ${results.length} artifact(s)` : 'Tool execution failed',
      ...(results && results.length > 0 ? {} : {
        error: {
          message: 'Tool execution failed',
          suggestion: 'Check CloudWatch logs for details'
        }
      })
    };
    
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
    
    const processingStartTime = Date.now();
    thoughtSteps.push({
      step: 7,
      action: 'Processing results',
      reasoning: 'Formatting tool output for display',
      status: 'complete',
      timestamp: new Date(processingStartTime).toISOString(),
      duration: Date.now() - processingStartTime,
      result: `Successfully processed ${results.length} result(s)`
    });
    
    // Step 6: Save project data to S3
    if (projectName && results && results.length > 0) {
      const saveProjectStartTime = Date.now();
      thoughtSteps.push({
        step: 8,
        action: 'Saving project data',
        reasoning: `Persisting results for project: ${projectName}`,
        status: 'in_progress',
        timestamp: new Date(saveProjectStartTime).toISOString()
      });
      
      try {
        const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
        
        // Extract results by type
        const resultsByType: Record<string, any> = {};
        for (const result of results) {
          if (result.success && result.data) {
            resultsByType[result.type] = result.data;
          }
        }
        
        // Prepare project data update
        const projectDataUpdate: any = {
          project_name: projectName,
          updated_at: new Date().toISOString()
        };
        
        // Add coordinates if this is terrain analysis
        if (intentWithDefaults.type === 'terrain_analysis' && intentWithDefaults.params.latitude && intentWithDefaults.params.longitude) {
          projectDataUpdate.coordinates = {
            latitude: intentWithDefaults.params.latitude,
            longitude: intentWithDefaults.params.longitude
          };
        }
        
        // Add results based on intent type
        if (intentWithDefaults.type === 'terrain_analysis' && resultsByType.terrain_analysis) {
          projectDataUpdate.terrain_results = resultsByType.terrain_analysis;
        } else if (intentWithDefaults.type === 'layout_optimization' && resultsByType.layout_optimization) {
          projectDataUpdate.layout_results = resultsByType.layout_optimization;
          
          // Extract metadata
          if (resultsByType.layout_optimization.turbine_count) {
            projectDataUpdate.metadata = {
              turbine_count: resultsByType.layout_optimization.turbine_count,
              total_capacity_mw: resultsByType.layout_optimization.total_capacity_mw
            };
          }
        } else if (intentWithDefaults.type === 'wake_simulation' && resultsByType.wake_simulation) {
          projectDataUpdate.simulation_results = resultsByType.wake_simulation;
          
          // Extract metadata
          if (resultsByType.wake_simulation.annual_energy_gwh) {
            projectDataUpdate.metadata = {
              ...projectDataUpdate.metadata,
              annual_energy_gwh: resultsByType.wake_simulation.annual_energy_gwh
            };
          }
        } else if (intentWithDefaults.type === 'report_generation' && resultsByType.report_generation) {
          projectDataUpdate.report_results = resultsByType.report_generation;
        }
        
        // Save to S3
        await projectStore.save(projectName, projectDataUpdate);
        
        console.log('───────────────────────────────────────────────────────────');
        console.log('💾 PROJECT DATA SAVED');
        console.log('───────────────────────────────────────────────────────────');
        console.log(`📋 Request ID: ${requestId}`);
        console.log(`🆔 Project Name: ${projectName}`);
        console.log(`📝 Updated Fields: ${Object.keys(projectDataUpdate).join(', ')}`);
        console.log(`⏰ Saved At: ${projectDataUpdate.updated_at}`);
        console.log('───────────────────────────────────────────────────────────');
        
        const saveProjectDuration = Date.now() - saveProjectStartTime;
        
        // Update thought step with completion
        thoughtSteps[thoughtSteps.length - 1] = {
          ...thoughtSteps[thoughtSteps.length - 1],
          status: 'complete',
          duration: saveProjectDuration,
          result: 'Project data saved to S3'
        };
        
      } catch (error) {
        console.error('❌ Error saving project data:', error);
        console.warn('⚠️  Continuing without saving project data');
        
        const saveProjectDuration = Date.now() - saveProjectStartTime;
        
        // Update thought step with error
        thoughtSteps[thoughtSteps.length - 1] = {
          ...thoughtSteps[thoughtSteps.length - 1],
          status: 'error',
          duration: saveProjectDuration,
          error: {
            message: 'Failed to save project data',
            suggestion: 'Results are still available but not persisted'
          }
        };
        // Don't fail the request if saving fails
      }
    }
    
    // Step 7: Reload project data to get updated status
    let updatedProjectData = projectData;
    if (projectName) {
      try {
        const projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
        updatedProjectData = await projectStore.load(projectName);
      } catch (error) {
        console.warn('Could not reload project data for status:', error);
      }
    }
    
    // Format results as EDI artifacts with action buttons
    const formattingStartTime = Date.now();
    console.log('🔍 DEBUG - Results count before formatting:', results.length);
    console.log('🔍 DEBUG - Results types:', results.map(r => r.type));
    const artifacts = formatArtifacts(results, intentWithDefaults.type, projectName || undefined, updatedProjectData);
    console.log('🔍 DEBUG - Artifacts count after formatting:', artifacts.length);
    console.log('🔍 DEBUG - Artifact types:', artifacts.map(a => a.type));
    console.log('🔍 DEBUG - Artifacts with actions:', artifacts.filter(a => a.actions).length);
    
    const message = generateResponseMessage(intentWithDefaults, results, projectName || undefined, updatedProjectData);
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
    
    // Calculate project status
    const projectStatus = updatedProjectData ? {
      terrain: !!updatedProjectData.terrain_results,
      layout: !!updatedProjectData.layout_results,
      simulation: !!updatedProjectData.simulation_results,
      report: !!updatedProjectData.report_results
    } : undefined;
    
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
        projectName: projectName || undefined,
        projectStatus,
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
    
    // CRITICAL: Do NOT save to database - frontend handles all saves
    // This prevents duplicate messages (orchestrator + frontend both saving)
    // Frontend save ensures proper loading state management and UI updates
    if (event.sessionId && event.userId) {
      console.log('🔄 Session context provided - frontend will save message with artifacts');
      console.log('   (Orchestrator skips save to prevent duplicates)');
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
        
        // Fetch layout data from S3 if not in context
        let layoutData = context?.layout || context?.layoutResults || intent.params.layout;
        
        if (!layoutData && intent.params.project_id) {
          try {
            console.log(`📦 Fetching layout data for project ${intent.params.project_id} from S3`);
            const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
            const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
            
            const s3Key = `renewable/layout/${intent.params.project_id}/layout.json`;
            const command = new GetObjectCommand({
              Bucket: process.env.RENEWABLE_S3_BUCKET,
              Key: s3Key
            });
            
            const response = await s3Client.send(command);
            const bodyString = await response.Body?.transformToString();
            
            if (bodyString) {
              const layoutResult = JSON.parse(bodyString);
              layoutData = layoutResult.layout || layoutResult;
              console.log(`✅ Retrieved layout with ${layoutData.features?.length || 0} turbines from S3`);
            }
          } catch (s3Error: any) {
            console.warn(`⚠️ Could not fetch layout from S3: ${s3Error.message}`);
            console.warn(`   This is expected if layout hasn't been generated yet for project ${intent.params.project_id}`);
          }
        }
        
        // If still no layout data, provide helpful error
        if (!layoutData) {
          console.warn(`⚠️ No layout data available for project ${intent.params.project_id}`);
          console.warn(`   User should run layout optimization first`);
        }
        
        payload = {
          parameters: {
            project_id: intent.params.project_id,
            layout: layoutData,
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
 * Format tool results as EDI artifacts with validation and action buttons
 */
function formatArtifacts(results: ToolResult[], intentType?: string, projectName?: string, projectStatus?: any): Artifact[] {
  const artifacts: Artifact[] = [];
  
  for (const result of results) {
    if (!result.success) {
      continue;
    }
    
    let artifact: Artifact | null = null;
    
    // Generate action buttons for this artifact
    const actions = projectName && intentType 
      ? generateActionButtons(intentType, projectName, projectStatus)
      : undefined;
    
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
            // CRITICAL FIX: Don't include mapHtml/mapUrl - let frontend build map with Leaflet
            // mapHtml: result.data.mapHtml,
            // mapUrl: result.data.mapUrl,
            visualizations: result.data.visualizations,
            message: result.data.message
          },
          actions
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
          },
          actions
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
          },
          actions
        };
        break;
        
      case 'wind_rose':
      case 'wind_rose_analysis':
        artifact = {
          type: 'wind_rose_analysis',
          data: {
            messageContentType: 'wind_rose_analysis',
            title: result.data.title || `Wind Rose Analysis - ${result.data.projectId}`,
            subtitle: result.data.subtitle,
            projectId: result.data.projectId,
            coordinates: result.data.coordinates || result.data.location,
            location: result.data.location,
            windRoseData: result.data.windRoseData,
            windStatistics: result.data.windStatistics,
            s3_data: result.data.s3_data,
            message: result.data.message
          },
          actions
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
          },
          actions
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
 * Generate response message with project status
 */
function generateResponseMessage(intent: RenewableIntent, results: ToolResult[], projectName?: string, projectData?: any): string {
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
  let baseMessage = '';
  
  switch (intent.type) {
    case 'terrain_analysis':
      baseMessage = result.data.message || 'Terrain analysis completed successfully.';
      break;
      
    case 'layout_optimization':
      baseMessage = result.data.message || `Layout optimization completed with ${result.data.turbineCount} turbines.`;
      break;
      
    case 'wake_simulation':
      baseMessage = result.data.message || 'Wake simulation completed successfully.';
      break;
      
    case 'wind_rose':
    case 'wind_rose_analysis':
      baseMessage = result.data.message || 'Wind rose analysis completed successfully.';
      break;
      
    case 'report_generation':
      baseMessage = result.data.message || 'Report generated successfully.';
      break;
      
    default:
      baseMessage = 'Analysis completed successfully.';
  }
  
  // Add project status if project name is provided
  if (projectName && projectData) {
    const projectStatus = {
      terrain: !!projectData.terrain_results,
      layout: !!projectData.layout_results,
      simulation: !!projectData.simulation_results,
      report: !!projectData.report_results
    };
    
    const statusChecklist = formatProjectStatusChecklist(projectStatus);
    const nextStep = generateNextStepSuggestion(projectStatus);
    
    baseMessage += `\n\n**Project: ${projectName}**\n\n${statusChecklist}`;
    
    if (nextStep) {
      baseMessage += `\n\n**Next:** ${nextStep}`;
    }
  }
  
  return baseMessage;
}

/**
 * Get project completion status
 */
function getProjectStatus(projectData: any, currentStep: string): { summary: string; nextStep: string } {
  const steps = {
    terrain: !!projectData.terrain_results,
    layout: !!projectData.layout_results,
    simulation: !!projectData.simulation_results,
    report: !!projectData.report_results
  };
  
  const statusIcons = {
    terrain: steps.terrain ? '✓' : '○',
    layout: steps.layout ? '✓' : '○',
    simulation: steps.simulation ? '✓' : '○',
    report: steps.report ? '✓' : '○'
  };
  
  const summary = `Status:\n${statusIcons.terrain} Terrain Analysis\n${statusIcons.layout} Layout Optimization\n${statusIcons.simulation} Wake Simulation\n${statusIcons.report} Report Generation`;
  
  // Determine next step
  let nextStep = '';
  if (!steps.terrain) {
    nextStep = 'Next: Run terrain analysis with coordinates';
  } else if (!steps.layout) {
    nextStep = 'Next: Optimize turbine layout';
  } else if (!steps.simulation) {
    nextStep = 'Next: Run wake simulation';
  } else if (!steps.report) {
    nextStep = 'Next: Generate comprehensive report';
  } else {
    nextStep = 'All steps complete! You can start a new project or refine this one.';
  }
  
  return { summary, nextStep };
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
