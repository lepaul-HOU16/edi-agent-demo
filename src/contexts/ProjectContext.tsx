import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Project information interface
 */
export interface ProjectInfo {
  projectId: string;        // Unique project identifier (e.g., "for-wind-farm-12")
  projectName: string;      // Human-readable name (e.g., "West Texas Wind Farm")
  location?: string;        // Location description
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;      // Timestamp of last interaction
}

/**
 * Project context value interface
 */
export interface ProjectContextValue {
  activeProject: ProjectInfo | null;
  setActiveProject: (project: ProjectInfo | null) => void;
  projectHistory: ProjectInfo[];  // Recent projects (max 10)
  getProjectById: (projectId: string) => ProjectInfo | null;
}

/**
 * Project context for managing active project state across the application
 */
export const ProjectContext = createContext<ProjectContextValue | null>(null);

/**
 * Project context provider component
 */
export const ProjectContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<ProjectInfo | null>(null);
  const [projectHistory, setProjectHistory] = useState<ProjectInfo[]>([]);

  /**
   * Validate project data structure
   */
  const validateProjectData = (project: ProjectInfo | null): boolean => {
    if (!project) {
      return true; // null is valid (clears active project)
    }

    // Check required fields
    if (!project.projectId || typeof project.projectId !== 'string') {
      console.warn('⚠️ [ProjectContext] Invalid project data: missing or invalid projectId', project);
      return false;
    }

    if (!project.projectName || typeof project.projectName !== 'string') {
      console.warn('⚠️ [ProjectContext] Invalid project data: missing or invalid projectName', project);
      return false;
    }

    if (!project.lastUpdated || typeof project.lastUpdated !== 'number') {
      console.warn('⚠️ [ProjectContext] Invalid project data: missing or invalid lastUpdated timestamp', project);
      return false;
    }

    // Warn about optional fields if malformed
    if (project.location !== undefined && typeof project.location !== 'string') {
      console.warn('⚠️ [ProjectContext] Malformed project data: location should be a string', project);
    }

    if (project.coordinates !== undefined) {
      if (typeof project.coordinates !== 'object' || 
          typeof project.coordinates.latitude !== 'number' ||
          typeof project.coordinates.longitude !== 'number') {
        console.warn('⚠️ [ProjectContext] Malformed project data: coordinates should have numeric latitude and longitude', project);
      }
    }

    return true;
  };

  /**
   * Set the active project and update history
   */
  const setActiveProject = useCallback((project: ProjectInfo | null) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 PROJECT CONTEXT: setActiveProject called');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (project) {
      console.log('✅ Setting active project');
      console.log('🆔 Project ID:', project.projectId);
      console.log('📍 Project Name:', project.projectName);
      console.log('🌍 Location:', project.location || 'N/A');
      console.log('📊 Coordinates:', project.coordinates ? JSON.stringify(project.coordinates) : 'N/A');
      console.log('📦 Full Project:', JSON.stringify(project, null, 2));
    } else {
      console.log('🗑️ Clearing active project (set to null)');
    }
    console.log('═══════════════════════════════════════════════════════════');
    
    // Validate project data
    if (!validateProjectData(project)) {
      console.error('❌ [ProjectContext] Rejecting invalid project data:', project);
      return;
    }
    
    setActiveProjectState(project);
    
    if (project) {
      // Add to history (keep last 10, most recent first)
      setProjectHistory(prev => {
        const filtered = prev.filter(p => p.projectId !== project.projectId);
        return [project, ...filtered].slice(0, 10);
      });
      
      // Persist to sessionStorage with error handling
      try {
        sessionStorage.setItem('activeProject', JSON.stringify(project));
        console.log('💾 [ProjectContext] Persisted active project to sessionStorage');
      } catch (error) {
        console.error('❌ [ProjectContext] Failed to persist to sessionStorage:', error);
        if (error instanceof Error) {
          if (error.name === 'QuotaExceededError') {
            console.warn('⚠️ [ProjectContext] SessionStorage quota exceeded. Project context will not persist across page reloads.');
          } else if (error.name === 'SecurityError') {
            console.warn('⚠️ [ProjectContext] SessionStorage access denied (possibly in private browsing mode). Project context will not persist.');
          }
        }
      }
    } else {
      // Clear sessionStorage when project is set to null
      try {
        sessionStorage.removeItem('activeProject');
        console.log('🗑️ [ProjectContext] Cleared active project from sessionStorage');
      } catch (error) {
        console.error('❌ [ProjectContext] Failed to clear sessionStorage:', error);
      }
    }
  }, []);

  /**
   * Get a project from history by ID
   */
  const getProjectById = useCallback((projectId: string): ProjectInfo | null => {
    console.log('🔍 [ProjectContext] Looking up project by ID:', projectId);
    const project = projectHistory.find(p => p.projectId === projectId) || null;
    console.log('🔍 [ProjectContext] Found project:', project);
    return project;
  }, [projectHistory]);

  // Restore from sessionStorage on mount
  useEffect(() => {
    console.log('🔄 [ProjectContext] Initializing, checking sessionStorage...');
    
    // Check if sessionStorage is available
    let isSessionStorageAvailable = false;
    try {
      const testKey = '__test_session_storage__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      isSessionStorageAvailable = true;
    } catch (error) {
      console.warn('⚠️ [ProjectContext] SessionStorage is not available:', error);
      console.warn('⚠️ [ProjectContext] Project context will not persist across page reloads');
      isSessionStorageAvailable = false;
    }
    
    if (!isSessionStorageAvailable) {
      return;
    }
    
    // Try to restore from sessionStorage
    try {
      const stored = sessionStorage.getItem('activeProject');
      if (stored) {
        try {
          const project = JSON.parse(stored) as ProjectInfo;
          
          // Validate restored project data
          if (validateProjectData(project)) {
            setActiveProjectState(project);
            setProjectHistory([project]);
            console.log('🔄 [ProjectContext] Restored active project from session:', project);
          } else {
            console.warn('⚠️ [ProjectContext] Stored project data is invalid, clearing sessionStorage');
            sessionStorage.removeItem('activeProject');
          }
        } catch (parseError) {
          console.error('❌ [ProjectContext] Failed to parse stored project data:', parseError);
          console.warn('⚠️ [ProjectContext] Clearing corrupted sessionStorage data');
          try {
            sessionStorage.removeItem('activeProject');
          } catch (clearError) {
            console.error('❌ [ProjectContext] Failed to clear corrupted data:', clearError);
          }
        }
      } else {
        console.log('🔄 [ProjectContext] No stored project found in sessionStorage');
      }
    } catch (error) {
      console.error('❌ [ProjectContext] Failed to restore active project from sessionStorage:', error);
      if (error instanceof Error) {
        if (error.name === 'SecurityError') {
          console.warn('⚠️ [ProjectContext] SessionStorage access denied. This may happen in private browsing mode.');
        }
      }
    }
  }, []);

  const value: ProjectContextValue = {
    activeProject,
    setActiveProject,
    projectHistory,
    getProjectById
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * Hook to access project context
 * @throws Error if used outside of ProjectContextProvider
 */
export const useProjectContext = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectContextProvider');
  }
  return context;
};

/**
 * Helper function to safely extract project information from artifact data
 * Validates and normalizes project data with comprehensive error handling
 * 
 * @param artifactData - The artifact data object
 * @param artifactType - The type of artifact (for logging)
 * @returns ProjectInfo object or null if extraction fails
 */
export const extractProjectFromArtifact = (
  artifactData: any,
  artifactType: string
): ProjectInfo | null => {
  console.log(`🔍 [ProjectContext] ${artifactType}: Starting project extraction`);
  console.log(`🔍 [ProjectContext] ${artifactType}: Artifact data keys:`, Object.keys(artifactData || {}));
  
  try {
    // Extract project ID from various possible field names
    const projectId = artifactData.projectId || 
                     artifactData.project_id || 
                     artifactData.projectName ||
                     artifactData.project_name;

    console.log(`🔍 [ProjectContext] ${artifactType}: Extracted projectId:`, projectId);

    if (!projectId || typeof projectId !== 'string') {
      console.warn(`⚠️ [ProjectContext] ${artifactType}: Missing or invalid project identifier`, artifactData);
      return null;
    }

    // Extract project name
    const projectName = artifactData.title || 
                       artifactData.projectName || 
                       artifactData.project_name || 
                       projectId;

    console.log(`🔍 [ProjectContext] ${artifactType}: Extracted projectName:`, projectName);

    if (!projectName || typeof projectName !== 'string') {
      console.warn(`⚠️ [ProjectContext] ${artifactType}: Missing or invalid project name`, artifactData);
      return null;
    }

    // Extract location (optional)
    let location: string | undefined;
    if (artifactData.location && typeof artifactData.location === 'string') {
      location = artifactData.location;
    } else if (artifactData.subtitle && typeof artifactData.subtitle === 'string') {
      location = artifactData.subtitle;
    }

    console.log(`🔍 [ProjectContext] ${artifactType}: Extracted location:`, location);

    // Extract coordinates (optional)
    let coordinates: { latitude: number; longitude: number } | undefined;
    
    if (artifactData.coordinates) {
      if (typeof artifactData.coordinates.latitude === 'number' && 
          typeof artifactData.coordinates.longitude === 'number') {
        coordinates = {
          latitude: artifactData.coordinates.latitude,
          longitude: artifactData.coordinates.longitude
        };
      } else {
        console.warn(`⚠️ [ProjectContext] ${artifactType}: Malformed coordinates object`, artifactData.coordinates);
      }
    }

    // Try to extract coordinates from other sources if not found
    if (!coordinates) {
      // Check for lat/lng fields
      if (typeof artifactData.latitude === 'number' && typeof artifactData.longitude === 'number') {
        coordinates = {
          latitude: artifactData.latitude,
          longitude: artifactData.longitude
        };
      } else if (typeof artifactData.lat === 'number' && typeof artifactData.lng === 'number') {
        coordinates = {
          latitude: artifactData.lat,
          longitude: artifactData.lng
        };
      }
    }

    console.log(`🔍 [ProjectContext] ${artifactType}: Extracted coordinates:`, coordinates);

    const projectInfo: ProjectInfo = {
      projectId,
      projectName,
      location,
      coordinates,
      lastUpdated: Date.now()
    };

    console.log(`✅ [ProjectContext] ${artifactType}: Successfully extracted project info`, projectInfo);
    return projectInfo;

  } catch (error) {
    console.error(`❌ [ProjectContext] ${artifactType}: Error extracting project info:`, error);
    console.error(`❌ [ProjectContext] ${artifactType}: Artifact data:`, artifactData);
    return null;
  }
};

/**
 * Debug helper function to dump current project context state
 * Useful for troubleshooting context issues in development
 * 
 * @param context - The ProjectContextValue to debug
 * @param label - Optional label for the debug output
 */
export const debugProjectContext = (context: ProjectContextValue | null, label: string = 'ProjectContext'): void => {
  console.group(`🐛 [DEBUG] ${label}`);
  
  if (!context) {
    console.error('❌ Context is null - component may not be wrapped in ProjectContextProvider');
    console.groupEnd();
    return;
  }

  console.log('📊 Active Project:', context.activeProject);
  
  if (context.activeProject) {
    console.log('  ├─ Project ID:', context.activeProject.projectId);
    console.log('  ├─ Project Name:', context.activeProject.projectName);
    console.log('  ├─ Location:', context.activeProject.location || 'N/A');
    console.log('  ├─ Coordinates:', context.activeProject.coordinates || 'N/A');
    console.log('  └─ Last Updated:', new Date(context.activeProject.lastUpdated).toLocaleString());
  } else {
    console.log('  └─ No active project set');
  }

  console.log('📚 Project History:', `${context.projectHistory.length} projects`);
  
  if (context.projectHistory.length > 0) {
    context.projectHistory.forEach((project, index) => {
      const prefix = index === context.projectHistory.length - 1 ? '  └─' : '  ├─';
      console.log(`${prefix} [${index}] ${project.projectName} (${project.projectId})`);
    });
  } else {
    console.log('  └─ No project history');
  }

  // Check sessionStorage
  try {
    const stored = sessionStorage.getItem('activeProject');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('💾 SessionStorage:', parsed.projectName || 'Unknown');
    } else {
      console.log('💾 SessionStorage: Empty');
    }
  } catch (error) {
    console.log('💾 SessionStorage: Error reading', error);
  }

  console.groupEnd();
};
