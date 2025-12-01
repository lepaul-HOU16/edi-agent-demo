/**
 * Project Context Debug Utilities
 * 
 * Global debugging functions for troubleshooting project context issues.
 * These functions can be called from the browser console for real-time debugging.
 */

import { ProjectContextValue, ProjectInfo } from '@/contexts/ProjectContext';

/**
 * Dump all project context state to console
 * Usage in browser console: window.debugProjectContext()
 */
export const dumpProjectContextState = (): void => {
  console.group('🐛 [DEBUG] Project Context State Dump');
  console.log('⏰ Timestamp:', new Date().toLocaleString());
  
  // Check sessionStorage
  console.group('💾 SessionStorage');
  try {
    const stored = sessionStorage.getItem('activeProject');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Active Project Stored:', parsed);
      console.log('  ├─ Project ID:', parsed.projectId);
      console.log('  ├─ Project Name:', parsed.projectName);
      console.log('  ├─ Location:', parsed.location || 'N/A');
      console.log('  ├─ Coordinates:', parsed.coordinates || 'N/A');
      console.log('  └─ Last Updated:', new Date(parsed.lastUpdated).toLocaleString());
    } else {
      console.log('⚠️ No active project in sessionStorage');
    }
  } catch (error) {
    console.error('❌ Error reading sessionStorage:', error);
  }
  console.groupEnd();
  
  // Check if ProjectContext is available in React DevTools
  console.group('🔍 React Context Status');
  console.log('ℹ️ To inspect React context, use React DevTools');
  console.log('ℹ️ Look for ProjectContextProvider in the component tree');
  console.log('ℹ️ The context value should show activeProject and projectHistory');
  console.groupEnd();
  
  // Check DOM for project-related elements
  console.group('🌐 DOM Elements');
  const workflowButtons = document.querySelectorAll('[class*="workflow"]');
  console.log('Workflow-related elements:', workflowButtons.length);
  
  const projectBadges = document.querySelectorAll('[class*="project"]');
  console.log('Project-related elements:', projectBadges.length);
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Log all console messages related to project context
 * Usage: Call this at app startup to enable comprehensive logging
 */
export const enableProjectContextLogging = (): void => {
  console.log('🔊 [DEBUG] Project Context logging enabled');
  console.log('🔊 [DEBUG] All project context operations will be logged with emoji prefixes:');
  console.log('  🎯 = Setting active project');
  console.log('  🔄 = Restoring from session');
  console.log('  🚀 = Executing action with project context');
  console.log('  ❌ = Error or missing context');
  console.log('  🎨 = Artifact updating context');
  console.log('  🔍 = Searching/detecting');
  console.log('  ✅ = Success');
  console.log('  ⚠️ = Warning');
  console.log('  💾 = SessionStorage operation');
  console.log('  🗑️ = Delete operation');
  console.log('  🎬 = Action initiated');
};

/**
 * Validate project context data structure
 */
export const validateProjectInfo = (project: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!project) {
    errors.push('Project is null or undefined');
    return { valid: false, errors };
  }
  
  if (!project.projectId || typeof project.projectId !== 'string') {
    errors.push('Missing or invalid projectId');
  }
  
  if (!project.projectName || typeof project.projectName !== 'string') {
    errors.push('Missing or invalid projectName');
  }
  
  if (!project.lastUpdated || typeof project.lastUpdated !== 'number') {
    errors.push('Missing or invalid lastUpdated timestamp');
  }
  
  if (project.location !== undefined && typeof project.location !== 'string') {
    errors.push('Invalid location (should be string)');
  }
  
  if (project.coordinates !== undefined) {
    if (typeof project.coordinates !== 'object') {
      errors.push('Invalid coordinates (should be object)');
    } else {
      if (typeof project.coordinates.latitude !== 'number') {
        errors.push('Invalid coordinates.latitude (should be number)');
      }
      if (typeof project.coordinates.longitude !== 'number') {
        errors.push('Invalid coordinates.longitude (should be number)');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Test project context operations
 */
export const testProjectContext = (): void => {
  console.group('🧪 [TEST] Project Context Operations');
  
  // Test 1: SessionStorage availability
  console.group('Test 1: SessionStorage Availability');
  try {
    const testKey = '__test_project_context__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    console.log('✅ SessionStorage is available');
  } catch (error) {
    console.error('❌ SessionStorage is NOT available:', error);
  }
  console.groupEnd();
  
  // Test 2: Validate stored project
  console.group('Test 2: Validate Stored Project');
  try {
    const stored = sessionStorage.getItem('activeProject');
    if (stored) {
      const parsed = JSON.parse(stored);
      const validation = validateProjectInfo(parsed);
      if (validation.valid) {
        console.log('✅ Stored project is valid');
      } else {
        console.error('❌ Stored project has errors:', validation.errors);
      }
    } else {
      console.log('ℹ️ No project stored');
    }
  } catch (error) {
    console.error('❌ Error validating stored project:', error);
  }
  console.groupEnd();
  
  // Test 3: Check for ProjectContextProvider
  console.group('Test 3: ProjectContextProvider Check');
  console.log('ℹ️ Open React DevTools and look for ProjectContextProvider');
  console.log('ℹ️ It should be near the top of the component tree in ChatPage');
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Log context mismatch error for debugging
 */
export const logContextMismatchError = (details: {
  errorMessage: string;
  activeProject?: any;
  query: string;
  expectedLocation?: string;
  actualLocation?: string;
}): void => {
  console.group('🚨 [ERROR] Context Mismatch Detected');
  console.log('⏰ Timestamp:', new Date().toLocaleString());
  console.log('📝 Query:', details.query);
  console.log('❌ Error Message:', details.errorMessage);
  
  if (details.activeProject) {
    console.group('🎯 Active Project');
    console.log('Project ID:', details.activeProject.projectId);
    console.log('Project Name:', details.activeProject.projectName);
    console.log('Location:', details.activeProject.location || 'N/A');
    console.log('Coordinates:', details.activeProject.coordinates || 'N/A');
    console.groupEnd();
  } else {
    console.log('⚠️ No active project found');
  }
  
  if (details.expectedLocation && details.actualLocation) {
    console.group('📍 Location Mismatch');
    console.log('Expected:', details.expectedLocation);
    console.log('Actual:', details.actualLocation);
    console.groupEnd();
  }
  
  console.group('💡 Suggested Actions');
  console.log('1. Refresh the page to reload project context');
  console.log('2. Start a new project for the desired location');
  console.log('3. Switch to the correct project using the dashboard');
  console.log('4. Check the project badge at the top of the page');
  console.groupEnd();
  
  console.groupEnd();
};

// Make functions available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugProjectContext = dumpProjectContextState;
  (window as any).testProjectContext = testProjectContext;
  (window as any).validateProjectInfo = validateProjectInfo;
  (window as any).enableProjectContextLogging = enableProjectContextLogging;
  (window as any).logContextMismatchError = logContextMismatchError;
  
  console.log('🐛 [DEBUG] Project context debug utilities loaded');
  console.log('🐛 [DEBUG] Available functions:');
  console.log('  - window.debugProjectContext() - Dump current state');
  console.log('  - window.testProjectContext() - Run diagnostic tests');
  console.log('  - window.validateProjectInfo(project) - Validate project data');
  console.log('  - window.enableProjectContextLogging() - Show logging guide');
  console.log('  - window.logContextMismatchError(details) - Log context mismatch');
}
