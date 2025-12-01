/**
 * Project Context Validation Utilities
 * 
 * Provides validation and error handling for project context flow
 */

export interface ProjectContext {
  projectId: string;
  projectName: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Validate project context structure
 */
export function validateProjectContext(context: any): context is ProjectContext {
  if (!context || typeof context !== 'object') {
    console.error('❌ [ProjectContext Validation] Context is null or not an object:', context);
    return false;
  }

  if (!context.projectId || typeof context.projectId !== 'string') {
    console.error('❌ [ProjectContext Validation] Missing or invalid projectId:', context.projectId);
    return false;
  }

  if (!context.projectName || typeof context.projectName !== 'string') {
    console.error('❌ [ProjectContext Validation] Missing or invalid projectName:', context.projectName);
    return false;
  }

  // Optional fields validation
  if (context.location !== undefined && typeof context.location !== 'string') {
    console.warn('⚠️ [ProjectContext Validation] Invalid location type:', typeof context.location);
  }

  if (context.coordinates !== undefined) {
    if (typeof context.coordinates !== 'object' ||
        typeof context.coordinates.latitude !== 'number' ||
        typeof context.coordinates.longitude !== 'number') {
      console.warn('⚠️ [ProjectContext Validation] Invalid coordinates structure:', context.coordinates);
    }
  }

  console.log('✅ [ProjectContext Validation] Context is valid');
  return true;
}

/**
 * Get validation error message for invalid project context
 */
export function getProjectContextErrorMessage(context: any): string {
  if (!context) {
    return 'No project context provided. Please select or create a project first.';
  }

  if (!context.projectId) {
    return 'Project context is missing project ID. Please reload the project.';
  }

  if (!context.projectName) {
    return 'Project context is missing project name. Please reload the project.';
  }

  return 'Project context is invalid. Please reload the project.';
}

/**
 * Log project context for debugging
 */
export function logProjectContext(context: any, location: string): void {
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`🎯 PROJECT CONTEXT at ${location}`);
  console.log(`═══════════════════════════════════════════════════════════`);
  
  if (!context) {
    console.log('❌ Context is null/undefined');
  } else {
    console.log('📋 Context Keys:', Object.keys(context));
    console.log('🆔 Project ID:', context.projectId || 'MISSING');
    console.log('📍 Project Name:', context.projectName || 'MISSING');
    console.log('🌍 Location:', context.location || 'N/A');
    console.log('📊 Coordinates:', context.coordinates ? JSON.stringify(context.coordinates) : 'N/A');
    console.log('✅ Valid:', validateProjectContext(context));
  }
  
  console.log(`═══════════════════════════════════════════════════════════`);
}
