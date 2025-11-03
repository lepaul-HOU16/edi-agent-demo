/**
 * Parameter Validation Module
 * 
 * Validates required parameters before tool invocation to ensure
 * clear error messages and prevent tool failures.
 */

import type { RenewableIntent } from './types';

/**
 * Project context interface for parameter validation
 */
export interface ProjectContext {
  projectName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
  report_results?: any;
}

export interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidValues: string[];
  satisfiedByContext: string[]; // Parameters satisfied by project context
  contextUsed: boolean; // Whether context was used in validation
}

/**
 * Required parameters for each tool type
 */
const REQUIRED_PARAMETERS: Record<string, string[]> = {
  terrain_analysis: ['latitude', 'longitude'],
  layout_optimization: ['latitude', 'longitude'], // capacity is optional, will default to 30MW
  wake_simulation: ['project_id'],
  wind_rose_analysis: ['latitude', 'longitude'], // Wind rose needs coordinates
  report_generation: ['project_id']
};

/**
 * Optional parameters with defaults
 */
const OPTIONAL_PARAMETERS: Record<string, Record<string, any>> = {
  terrain_analysis: {
    radius_km: 5,
    setback_m: 200,
    project_id: null // Will be generated if not provided
  },
  layout_optimization: {
    capacity: 30, // Default to 30MW if not provided
    num_turbines: null, // Will be calculated from capacity if not provided
    layout_type: 'grid',
    project_id: null // Will be generated if not provided
  },
  wake_simulation: {
    wind_speed: 8.5
  },
  wind_rose_analysis: {
    project_id: null // Will be generated if not provided
  },
  report_generation: {}
};

/**
 * Parameters that can be satisfied by project context
 * Maps intent types to context sources and the parameters they can satisfy
 */
const CONTEXT_SATISFIABLE_PARAMS: Record<string, Record<string, string[]>> = {
  layout_optimization: {
    coordinates: ['latitude', 'longitude'],
    terrain: ['terrain_results']
  },
  wake_simulation: {
    layout: ['layout_results'],
    coordinates: ['latitude', 'longitude']
  },
  report_generation: {
    all_results: ['terrain_results', 'layout_results']
  }
};

/**
 * Parameter value constraints
 */
const PARAMETER_CONSTRAINTS: Record<string, (value: any) => { valid: boolean; error?: string }> = {
  latitude: (value: any) => {
    const lat = parseFloat(value);
    if (isNaN(lat)) {
      return { valid: false, error: 'Latitude must be a valid number' };
    }
    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
    return { valid: true };
  },
  
  longitude: (value: any) => {
    const lon = parseFloat(value);
    if (isNaN(lon)) {
      return { valid: false, error: 'Longitude must be a valid number' };
    }
    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' };
    }
    return { valid: true };
  },
  
  capacity: (value: any) => {
    const cap = parseFloat(value);
    if (isNaN(cap)) {
      return { valid: false, error: 'Capacity must be a valid number' };
    }
    if (cap <= 0) {
      return { valid: false, error: 'Capacity must be greater than 0' };
    }
    if (cap > 1000) {
      return { valid: false, error: 'Capacity must be 1000 MW or less' };
    }
    return { valid: true };
  },
  
  radius_km: (value: any) => {
    const radius = parseFloat(value);
    if (isNaN(radius)) {
      return { valid: false, error: 'Radius must be a valid number' };
    }
    if (radius <= 0) {
      return { valid: false, error: 'Radius must be greater than 0' };
    }
    if (radius > 50) {
      return { valid: false, error: 'Radius must be 50 km or less' };
    }
    return { valid: true };
  },
  
  setback_m: (value: any) => {
    const setback = parseFloat(value);
    if (isNaN(setback)) {
      return { valid: false, error: 'Setback must be a valid number' };
    }
    if (setback < 0) {
      return { valid: false, error: 'Setback must be 0 or greater' };
    }
    if (setback > 1000) {
      return { valid: false, error: 'Setback must be 1000 m or less' };
    }
    return { valid: true };
  },
  
  num_turbines: (value: any) => {
    const num = parseInt(value);
    if (isNaN(num)) {
      return { valid: false, error: 'Number of turbines must be a valid integer' };
    }
    if (num <= 0) {
      return { valid: false, error: 'Number of turbines must be greater than 0' };
    }
    if (num > 200) {
      return { valid: false, error: 'Number of turbines must be 200 or less' };
    }
    return { valid: true };
  },
  
  project_id: (value: any) => {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Project ID must be a string' };
    }
    if (value.length === 0) {
      return { valid: false, error: 'Project ID cannot be empty' };
    }
    if (value.length > 100) {
      return { valid: false, error: 'Project ID must be 100 characters or less' };
    }
    // Check for valid characters (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { valid: false, error: 'Project ID can only contain letters, numbers, hyphens, and underscores' };
    }
    return { valid: true };
  }
};

/**
 * Check if a parameter can be satisfied from project context
 */
export function canSatisfyFromContext(
  param: string,
  intentType: string,
  projectContext?: ProjectContext
): boolean {
  if (!projectContext) {
    return false;
  }
  
  const satisfiable = CONTEXT_SATISFIABLE_PARAMS[intentType];
  if (!satisfiable) {
    return false;
  }
  
  // Check if this parameter can be satisfied by context
  for (const [contextKey, params] of Object.entries(satisfiable)) {
    if (params.includes(param)) {
      // Check if context has the required data
      if (contextKey === 'coordinates' && projectContext.coordinates) {
        return true;
      }
      if (contextKey === 'terrain' && projectContext.terrain_results) {
        return true;
      }
      if (contextKey === 'layout' && projectContext.layout_results) {
        return true;
      }
      if (contextKey === 'all_results' && 
          projectContext.terrain_results && 
          projectContext.layout_results) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Validate parameters for a given intent
 */
export function validateParameters(
  intent: RenewableIntent,
  projectContext?: ProjectContext
): ParameterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const invalidValues: string[] = [];
  const satisfiedByContext: string[] = [];
  let contextUsed = false;
  
  const requiredParams = REQUIRED_PARAMETERS[intent.type] || [];
  const optionalParams = OPTIONAL_PARAMETERS[intent.type] || {};
  
  console.log('───────────────────────────────────────────────────────────');
  console.log('🔍 PARAMETER VALIDATION');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`🎯 Intent Type: ${intent.type}`);
  console.log(`📋 Required Parameters: ${requiredParams.join(', ')}`);
  console.log(`📦 Provided Parameters: ${JSON.stringify(intent.params, null, 2)}`);
  
  if (projectContext) {
    console.log(`🗂️  Project Context Available:`);
    console.log(`   - Project Name: ${projectContext.projectName || 'N/A'}`);
    console.log(`   - Has Coordinates: ${!!projectContext.coordinates}`);
    console.log(`   - Has Terrain Results: ${!!projectContext.terrain_results}`);
    console.log(`   - Has Layout Results: ${!!projectContext.layout_results}`);
    console.log(`   - Has Simulation Results: ${!!projectContext.simulation_results}`);
  }
  
  // Check for required parameters
  for (const param of requiredParams) {
    const hasParam = (param in intent.params) && 
                     intent.params[param] !== undefined && 
                     intent.params[param] !== null;
    
    if (!hasParam) {
      // Check if parameter can be satisfied from context
      if (canSatisfyFromContext(param, intent.type, projectContext)) {
        satisfiedByContext.push(param);
        contextUsed = true;
        warnings.push(`Using ${param} from active project context`);
        console.log(`✅ Parameter '${param}' satisfied by project context`);
      } else {
        missingRequired.push(param);
        errors.push(`Missing required parameter: ${param}`);
      }
    }
  }
  
  // Validate parameter values
  for (const [param, value] of Object.entries(intent.params)) {
    if (value === undefined || value === null) {
      continue; // Skip undefined/null values (already caught by required check)
    }
    
    const validator = PARAMETER_CONSTRAINTS[param];
    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        invalidValues.push(param);
        errors.push(`Invalid ${param}: ${result.error}`);
      }
    }
  }
  
  // Add warnings for missing optional parameters
  for (const [param, defaultValue] of Object.entries(optionalParams)) {
    if (!(param in intent.params) && defaultValue !== null) {
      warnings.push(`Optional parameter ${param} not provided, will use default: ${defaultValue}`);
    }
  }
  
  const isValid = errors.length === 0;
  
  console.log(`✅ Validation Result: ${isValid ? 'VALID' : 'INVALID'}`);
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.log(`⚠️  Warnings: ${warnings.join(', ')}`);
  }
  if (satisfiedByContext.length > 0) {
    console.log(`🗂️  Satisfied by Context: ${satisfiedByContext.join(', ')}`);
  }
  console.log('───────────────────────────────────────────────────────────');
  
  return {
    isValid,
    errors,
    warnings,
    missingRequired,
    invalidValues,
    satisfiedByContext,
    contextUsed
  };
}

/**
 * Apply default values for optional parameters
 */
export function applyDefaultParameters(intent: RenewableIntent): RenewableIntent {
  const optionalParams = OPTIONAL_PARAMETERS[intent.type] || {};
  
  for (const [param, defaultValue] of Object.entries(optionalParams)) {
    if (!(param in intent.params) && defaultValue !== null) {
      intent.params[param] = defaultValue;
    }
  }
  
  // Generate project_id if not provided
  if (!intent.params.project_id) {
    intent.params.project_id = `project-${Date.now()}`;
  }
  
  // Calculate num_turbines from capacity if not provided (for layout optimization)
  if (intent.type === 'layout_optimization' && !intent.params.num_turbines && intent.params.capacity) {
    // Assume 2.5 MW per turbine as default
    intent.params.num_turbines = Math.ceil(intent.params.capacity / 2.5);
  }
  
  return intent;
}

/**
 * Format validation errors into user-friendly message with context awareness
 */
export function formatValidationError(
  validation: ParameterValidationResult, 
  intentType: string,
  projectContext?: ProjectContext
): string {
  if (validation.isValid) {
    return '';
  }
  
  const parts: string[] = [];
  
  // Check if missing parameters could have been satisfied by context
  const couldUsedContext = validation.missingRequired.some(param => 
    canSatisfyFromContext(param, intentType, projectContext)
  );
  
  if (validation.missingRequired.length > 0) {
    // Use context-aware error messages if context could have helped
    if (couldUsedContext || projectContext) {
      const contextMessage = formatMissingContextError(
        intentType,
        validation.missingRequired,
        projectContext?.projectName
      );
      parts.push(contextMessage);
    } else {
      parts.push(`Missing required parameters: ${validation.missingRequired.join(', ')}`);
    }
  }
  
  if (validation.invalidValues.length > 0) {
    parts.push(`Invalid parameter values: ${validation.invalidValues.join(', ')}`);
  }
  
  // Add specific guidance based on intent type (fallback for non-context errors)
  if (!couldUsedContext && !projectContext && validation.missingRequired.length > 0) {
    const guidance = getParameterGuidance(intentType);
    if (guidance) {
      parts.push(`\n\n${guidance}`);
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Format missing context error with intent-specific guidance
 * Used when validation fails due to missing project context
 */
function formatMissingContextError(
  intentType: string,
  missingParams: string[],
  activeProject?: string
): string {
  const suggestions: Record<string, string> = {
    layout_optimization: 
      "To optimize layout, either:\n" +
      "• Provide coordinates: 'optimize layout at 35.067482, -101.395466'\n" +
      "• Run terrain analysis first: 'analyze terrain at 35.067482, -101.395466'",
    
    wake_simulation:
      "To run wake simulation, first:\n" +
      "• Create a layout: 'optimize layout'\n" +
      "• Or specify a project: 'run wake simulation for project-name'",
    
    report_generation:
      "To generate a report, first:\n" +
      "• Complete terrain analysis and layout optimization\n" +
      "• Or specify a project: 'generate report for project-name'"
  };
  
  let message = `Missing required information: ${missingParams.join(', ')}.\n\n`;
  message += suggestions[intentType] || 'Please provide the required parameters.';
  
  if (activeProject) {
    message += `\n\nActive project: ${activeProject}`;
  }
  
  return message;
}

/**
 * Get parameter guidance for specific intent types
 */
function getParameterGuidance(intentType: string): string {
  const guidance: Record<string, string> = {
    terrain_analysis: 'For terrain analysis, please provide coordinates in the format: "latitude, longitude" (e.g., "35.067482, -101.395466")',
    layout_optimization: 'For layout optimization, please provide coordinates (e.g., "Create a wind farm layout at 35.067482, -101.395466"). Optionally specify capacity (e.g., "Create a 30MW wind farm...")',
    wake_simulation: 'For wake simulation, please provide a project ID from a previous layout analysis',
    report_generation: 'For report generation, please provide a project ID from a previous analysis'
  };
  
  return guidance[intentType] || '';
}

/**
 * Log validation failure to CloudWatch with structured format
 */
export function logValidationFailure(
  validation: ParameterValidationResult,
  intent: RenewableIntent,
  requestId: string,
  projectContext?: ProjectContext
): void {
  console.error(JSON.stringify({
    level: 'ERROR',
    category: 'PARAMETER_VALIDATION',
    requestId,
    intentType: intent.type,
    validation: {
      isValid: validation.isValid,
      missingRequired: validation.missingRequired,
      invalidValues: validation.invalidValues,
      errors: validation.errors,
      satisfiedByContext: validation.satisfiedByContext,
      contextUsed: validation.contextUsed
    },
    projectContext: {
      hasActiveProject: !!projectContext?.projectName,
      projectName: projectContext?.projectName,
      hasCoordinates: !!projectContext?.coordinates,
      hasTerrainResults: !!projectContext?.terrain_results,
      hasLayoutResults: !!projectContext?.layout_results,
      hasSimulationResults: !!projectContext?.simulation_results
    },
    providedParameters: intent.params,
    timestamp: new Date().toISOString()
  }, null, 2));
}

/**
 * Log validation success to CloudWatch with structured format
 * Useful for monitoring context usage and debugging parameter auto-fill
 */
export function logValidationSuccess(
  validation: ParameterValidationResult,
  intent: RenewableIntent,
  requestId: string,
  projectContext?: ProjectContext
): void {
  console.log(JSON.stringify({
    level: 'INFO',
    category: 'PARAMETER_VALIDATION',
    requestId,
    intentType: intent.type,
    validation: {
      isValid: validation.isValid,
      warnings: validation.warnings,
      satisfiedByContext: validation.satisfiedByContext,
      contextUsed: validation.contextUsed
    },
    projectContext: {
      hasActiveProject: !!projectContext?.projectName,
      projectName: projectContext?.projectName,
      hasCoordinates: !!projectContext?.coordinates,
      hasTerrainResults: !!projectContext?.terrain_results,
      hasLayoutResults: !!projectContext?.layout_results,
      hasSimulationResults: !!projectContext?.simulation_results
    },
    providedParameters: intent.params,
    timestamp: new Date().toISOString()
  }, null, 2));
}
