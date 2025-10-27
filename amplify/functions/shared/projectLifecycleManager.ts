/**
 * ProjectLifecycleManager - Core class for project lifecycle operations
 * 
 * Manages project lifecycle including:
 * - Deduplication detection and resolution
 * - Project deletion (single and bulk)
 * - Project renaming
 * - Project merging
 * - Project archiving/unarchiving
 * - Project search and filtering
 * - Export/import functionality
 * 
 * Requirements: All
 */

import { ProjectStore, ProjectData } from './projectStore';
import { ProjectResolver } from './projectResolver';
import { ProjectNameGenerator } from './projectNameGenerator';
import { SessionContextManager, SessionContext } from './sessionContextManager';
import { ProximityDetector, Coordinates, DuplicateMatch, DuplicateGroup } from './proximityDetector';

// ============================================================================
// Result Type Interfaces
// ============================================================================

/**
 * Result of duplicate detection
 */
export interface DuplicateDetectionResult {
  hasDuplicates: boolean;
  duplicates: DuplicateMatch[];
  message?: string;
}

/**
 * User's choice for duplicate resolution
 */
export interface DuplicateResolutionChoice {
  action: 'continue' | 'create_new' | 'view_details';
  selectedProject?: string;
}

/**
 * Result of project deletion
 */
export interface DeleteResult {
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}

/**
 * Result of bulk deletion
 */
export interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  deletedProjects: string[];
  failedProjects: Array<{ name: string; error: string }>;
  message: string;
}

/**
 * Result of project rename
 */
export interface RenameResult {
  success: boolean;
  oldName: string;
  newName: string;
  message: string;
  error?: string;
}

/**
 * Result of project merge
 */
export interface MergeResult {
  success: boolean;
  mergedProject: string;
  deletedProject: string;
  message: string;
  error?: string;
}

/**
 * Result of archive operation
 */
export interface ArchiveResult {
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}

/**
 * Result of unarchive operation
 */
export interface UnarchiveResult {
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  projectName: string;
  message: string;
  error?: string;
}

/**
 * Export data structure
 */
export interface ExportData {
  version: string;
  exportedAt: string;
  project: ProjectData;
  artifacts: {
    terrain?: string;
    layout?: string;
    simulation?: string;
    report?: string;
  };
}

/**
 * Search criteria for filtering projects
 */
export interface ProjectSearchFilters {
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  incomplete?: boolean;
  coordinates?: Coordinates;
  radiusKm?: number;
  archived?: boolean;
}

/**
 * Project dashboard data
 */
export interface ProjectDashboard {
  projects: Array<{
    name: string;
    location: string;
    completionPercentage: number;
    lastUpdated: string;
    isActive: boolean;
    isDuplicate: boolean;
    status: string;
  }>;
  totalProjects: number;
  activeProject: string | null;
  duplicateGroups: DuplicateGroup[];
}

// ============================================================================
// Error Types and Messages
// ============================================================================

/**
 * Error types for lifecycle operations
 */
export enum ProjectLifecycleError {
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  NAME_ALREADY_EXISTS = 'NAME_ALREADY_EXISTS',
  PROJECT_IN_PROGRESS = 'PROJECT_IN_PROGRESS',
  CONFIRMATION_REQUIRED = 'CONFIRMATION_REQUIRED',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  S3_ERROR = 'S3_ERROR',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  INVALID_PROJECT_NAME = 'INVALID_PROJECT_NAME',
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  EXPORT_ERROR = 'EXPORT_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',
  INVALID_SEARCH_RADIUS = 'INVALID_SEARCH_RADIUS',
}

/**
 * Error message templates with user-friendly formatting and suggested actions
 */
export const ERROR_MESSAGES = {
  PROJECT_NOT_FOUND: (name: string) =>
    `Project '${name}' not found. Use 'list projects' to see available projects.`,

  NAME_ALREADY_EXISTS: (name: string) =>
    `Project name '${name}' already exists. Please choose a different name.`,

  PROJECT_IN_PROGRESS: (name: string) =>
    `Cannot delete '${name}' - project is currently being processed. Please wait for completion.`,

  CONFIRMATION_REQUIRED: (action: string, target: string) =>
    `Are you sure you want to ${action} '${target}'? Type 'yes' to confirm.`,

  S3_ERROR: (operation: string) =>
    `Failed to ${operation} due to storage error. Please try again.`,

  INVALID_COORDINATES: (coords: string) =>
    `Invalid coordinates: ${coords}. Latitude must be between -90 and 90, longitude between -180 and 180.`,

  UNSUPPORTED_VERSION: (version: string) =>
    `Unsupported export version: ${version}. This system supports version 1.0.`,

  INVALID_PROJECT_NAME: (name: string) =>
    `Invalid project name: '${name}'. Project names must be lowercase with hyphens (kebab-case).`,

  MERGE_CONFLICT: (name1: string, name2: string) =>
    `Cannot merge projects '${name1}' and '${name2}'. Both projects must exist and have compatible data.`,

  EXPORT_ERROR: (name: string, reason: string) =>
    `Failed to export project '${name}': ${reason}`,

  IMPORT_ERROR: (reason: string) =>
    `Failed to import project: ${reason}`,

  // Search and filtering error messages (Requirements 5.1-5.5)
  NO_PROJECTS_FOUND: (criteria: string) =>
    `No projects found matching: ${criteria}`,

  INVALID_DATE_RANGE: (dateFrom: string, dateTo: string) =>
    `Invalid date range: ${dateFrom} to ${dateTo}. Start date must be before end date.`,

  INVALID_SEARCH_RADIUS: (radius: number) =>
    `Invalid search radius: ${radius}km. Radius must be between 0.1 and 100 km.`,

  NO_LOCATION_MATCH: (location: string) =>
    `No projects found in location: ${location}`,

  NO_INCOMPLETE_PROJECTS: () =>
    `No incomplete projects found. All projects have completed analysis.`,

  NO_ARCHIVED_PROJECTS: () =>
    `No archived projects found.`,

  SEARCH_ERROR: (reason: string) =>
    `Search failed: ${reason}`,
};

/**
 * User-friendly error message formatter with context and suggestions
 */
export class LifecycleErrorFormatter {
  /**
   * Format project not found error with suggestions
   */
  static formatProjectNotFound(projectName: string, availableProjects: string[]): string {
    let message = `❌ Project '${projectName}' not found.\n\n`;
    
    if (availableProjects.length > 0) {
      message += `**Available projects:**\n`;
      availableProjects.slice(0, 5).forEach((name, index) => {
        message += `${index + 1}. ${name}\n`;
      });
      
      if (availableProjects.length > 5) {
        message += `... and ${availableProjects.length - 5} more\n`;
      }
      
      message += `\n**Suggestions:**\n`;
      message += `• Use 'list projects' to see all projects\n`;
      message += `• Check spelling of project name\n`;
      message += `• Try searching: 'search projects in [location]'\n`;
    } else {
      message += `**No projects exist yet.**\n\n`;
      message += `**Get started:**\n`;
      message += `• Create a project: 'analyze terrain at [latitude], [longitude]'\n`;
      message += `• Import a project: 'import project from [file]'\n`;
    }
    
    return message;
  }

  /**
   * Format search results with context
   */
  static formatSearchResults(
    projects: ProjectData[],
    filters: ProjectSearchFilters
  ): string {
    if (projects.length === 0) {
      return this.formatNoSearchResults(filters);
    }

    let message = `**Found ${projects.length} project(s)**\n\n`;
    
    // Show applied filters
    const appliedFilters: string[] = [];
    if (filters.location) appliedFilters.push(`Location: ${filters.location}`);
    if (filters.dateFrom) appliedFilters.push(`From: ${filters.dateFrom}`);
    if (filters.dateTo) appliedFilters.push(`To: ${filters.dateTo}`);
    if (filters.incomplete) appliedFilters.push(`Status: Incomplete`);
    if (filters.archived !== undefined) appliedFilters.push(`Archived: ${filters.archived}`);
    if (filters.coordinates) {
      appliedFilters.push(
        `Near: ${filters.coordinates.latitude}, ${filters.coordinates.longitude} (${filters.radiusKm}km)`
      );
    }
    
    if (appliedFilters.length > 0) {
      message += `**Filters:** ${appliedFilters.join(' | ')}\n\n`;
    }
    
    // List projects
    projects.forEach((project, index) => {
      const completion = this.calculateCompletionPercentage(project);
      const status = this.getProjectStatus(project);
      message += `${index + 1}. **${project.project_name}**\n`;
      message += `   Status: ${status} (${completion}% complete)\n`;
      message += `   Created: ${new Date(project.created_at).toLocaleDateString()}\n`;
      if (project.coordinates) {
        message += `   Location: ${project.coordinates.latitude.toFixed(4)}, ${project.coordinates.longitude.toFixed(4)}\n`;
      }
      message += `\n`;
    });
    
    return message;
  }

  /**
   * Format no search results with suggestions
   */
  static formatNoSearchResults(filters: ProjectSearchFilters): string {
    let message = `❌ No projects found matching your search criteria.\n\n`;
    
    message += `**Your search:**\n`;
    if (filters.location) message += `• Location: ${filters.location}\n`;
    if (filters.dateFrom) message += `• From: ${filters.dateFrom}\n`;
    if (filters.dateTo) message += `• To: ${filters.dateTo}\n`;
    if (filters.incomplete) message += `• Status: Incomplete only\n`;
    if (filters.archived !== undefined) message += `• Archived: ${filters.archived}\n`;
    if (filters.coordinates) {
      message += `• Near: ${filters.coordinates.latitude}, ${filters.coordinates.longitude} (${filters.radiusKm}km)\n`;
    }
    
    message += `\n**Suggestions:**\n`;
    message += `• Try broader search criteria\n`;
    message += `• Remove some filters\n`;
    message += `• Use 'list projects' to see all projects\n`;
    message += `• Check if projects are archived: 'list archived projects'\n`;
    
    return message;
  }

  /**
   * Format duplicate projects with action suggestions
   */
  static formatDuplicateGroups(groups: DuplicateGroup[]): string {
    if (groups.length === 0) {
      return `✅ No duplicate projects found. All projects are at unique locations.\n`;
    }

    let message = `**Found ${groups.length} group(s) of duplicate projects:**\n\n`;
    
    groups.forEach((group, groupIndex) => {
      message += `**Group ${groupIndex + 1}** (${group.count} projects, avg distance: ${group.averageDistance.toFixed(2)}km):\n`;
      message += `Location: ${group.centerCoordinates.latitude.toFixed(4)}, ${group.centerCoordinates.longitude.toFixed(4)}\n\n`;
      
      group.projects.forEach((project, projIndex) => {
        const completion = this.calculateCompletionPercentage(project);
        message += `  ${projIndex + 1}. ${project.project_name} (${completion}% complete)\n`;
      });
      
      message += `\n**Actions:**\n`;
      message += `• Merge projects: 'merge projects ${group.projects[0].project_name} and ${group.projects[1].project_name}'\n`;
      message += `• Delete duplicates: 'delete project ${group.projects[1].project_name}'\n`;
      message += `• View details: 'show project ${group.projects[0].project_name}'\n\n`;
    });
    
    return message;
  }

  /**
   * Format deletion confirmation with project details
   */
  static formatDeleteConfirmation(project: ProjectData): string {
    const completion = this.calculateCompletionPercentage(project);
    const status = this.getProjectStatus(project);
    
    let message = `⚠️  **Confirm Deletion**\n\n`;
    message += `You are about to delete:\n`;
    message += `• Project: **${project.project_name}**\n`;
    message += `• Status: ${status} (${completion}% complete)\n`;
    message += `• Created: ${new Date(project.created_at).toLocaleDateString()}\n`;
    
    if (project.coordinates) {
      message += `• Location: ${project.coordinates.latitude.toFixed(4)}, ${project.coordinates.longitude.toFixed(4)}\n`;
    }
    
    message += `\n**This will permanently remove:**\n`;
    if (project.terrain_results) message += `• Terrain analysis data\n`;
    if (project.layout_results) message += `• Layout optimization data\n`;
    if (project.simulation_results) message += `• Wake simulation results\n`;
    if (project.report_results) message += `• Generated reports\n`;
    
    message += `\n**Type 'yes' to confirm deletion, or 'no' to cancel.**\n`;
    
    return message;
  }

  /**
   * Format bulk deletion confirmation
   */
  static formatBulkDeleteConfirmation(projects: ProjectData[], pattern: string): string {
    let message = `⚠️  **Confirm Bulk Deletion**\n\n`;
    message += `You are about to delete ${projects.length} project(s) matching pattern: **${pattern}**\n\n`;
    
    message += `**Projects to be deleted:**\n`;
    projects.forEach((project, index) => {
      const completion = this.calculateCompletionPercentage(project);
      message += `${index + 1}. ${project.project_name} (${completion}% complete)\n`;
    });
    
    message += `\n**This action cannot be undone.**\n`;
    message += `**Type 'yes' to confirm deletion, or 'no' to cancel.**\n`;
    
    return message;
  }

  /**
   * Format merge confirmation with project comparison
   */
  static formatMergeConfirmation(
    sourceProject: ProjectData,
    targetProject: ProjectData
  ): string {
    let message = `🔀 **Confirm Project Merge**\n\n`;
    message += `Merging: **${sourceProject.project_name}** → **${targetProject.project_name}**\n\n`;
    
    message += `**Source Project (will be deleted):**\n`;
    message += this.formatProjectSummary(sourceProject);
    
    message += `\n**Target Project (will be kept):**\n`;
    message += this.formatProjectSummary(targetProject);
    
    message += `\n**Merge strategy:**\n`;
    message += `• Keep most complete data from both projects\n`;
    message += `• Preserve all analysis results\n`;
    message += `• Delete source project after merge\n`;
    
    message += `\n**Which name would you like to keep?**\n`;
    message += `1. ${sourceProject.project_name}\n`;
    message += `2. ${targetProject.project_name}\n`;
    
    return message;
  }

  /**
   * Format project summary for display
   */
  private static formatProjectSummary(project: ProjectData): string {
    const completion = this.calculateCompletionPercentage(project);
    let summary = `• Name: ${project.project_name}\n`;
    summary += `• Completion: ${completion}%\n`;
    summary += `• Terrain: ${project.terrain_results ? '✓' : '✗'}\n`;
    summary += `• Layout: ${project.layout_results ? '✓' : '✗'}\n`;
    summary += `• Simulation: ${project.simulation_results ? '✓' : '✗'}\n`;
    summary += `• Report: ${project.report_results ? '✓' : '✗'}\n`;
    return summary;
  }

  /**
   * Calculate completion percentage
   */
  private static calculateCompletionPercentage(project: ProjectData): number {
    let completed = 0;
    const total = 4;
    if (project.terrain_results) completed++;
    if (project.layout_results) completed++;
    if (project.simulation_results) completed++;
    if (project.report_results) completed++;
    return Math.round((completed / total) * 100);
  }

  /**
   * Get project status
   */
  private static getProjectStatus(project: ProjectData): string {
    if (project.report_results) return 'Complete';
    if (project.simulation_results) return 'Simulation Complete';
    if (project.layout_results) return 'Layout Complete';
    if (project.terrain_results) return 'Terrain Complete';
    return 'Not Started';
  }

  /**
   * Format archive suggestion for old projects
   */
  static formatArchiveSuggestion(oldProjects: ProjectData[]): string {
    if (oldProjects.length === 0) {
      return '';
    }

    let message = `💡 **Suggestion:** You have ${oldProjects.length} project(s) older than 30 days with no recent activity.\n\n`;
    message += `**Consider archiving:**\n`;
    
    oldProjects.slice(0, 5).forEach((project, index) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      message += `${index + 1}. ${project.project_name} (${daysSinceUpdate} days old)\n`;
    });
    
    if (oldProjects.length > 5) {
      message += `... and ${oldProjects.length - 5} more\n`;
    }
    
    message += `\n**Archive projects to:**\n`;
    message += `• Keep your project list clean\n`;
    message += `• Preserve historical data\n`;
    message += `• Improve performance\n`;
    
    message += `\n**Example:** 'archive project ${oldProjects[0].project_name}'\n`;
    
    return message;
  }

  /**
   * Format validation error with context
   */
  static formatValidationError(
    errorType: ProjectLifecycleError,
    context: Record<string, any>
  ): string {
    switch (errorType) {
      case ProjectLifecycleError.INVALID_COORDINATES:
        return `❌ Invalid coordinates: ${context.coordinates}\n\n` +
               `**Requirements:**\n` +
               `• Latitude: -90 to 90\n` +
               `• Longitude: -180 to 180\n\n` +
               `**Example:** 'analyze terrain at 35.067482, -101.395466'\n`;

      case ProjectLifecycleError.INVALID_PROJECT_NAME:
        return `❌ Invalid project name: '${context.name}'\n\n` +
               `**Requirements:**\n` +
               `• Lowercase letters only\n` +
               `• Use hyphens (-) instead of spaces\n` +
               `• No special characters\n\n` +
               `**Examples:**\n` +
               `• west-texas-wind-farm ✓\n` +
               `• West Texas Wind Farm ✗\n` +
               `• west_texas_wind_farm ✗\n`;

      case ProjectLifecycleError.INVALID_SEARCH_RADIUS:
        return `❌ Invalid search radius: ${context.radius}km\n\n` +
               `**Requirements:**\n` +
               `• Minimum: 0.1 km\n` +
               `• Maximum: 100 km\n\n` +
               `**Example:** 'search projects within 5km of 35.067482, -101.395466'\n`;

      default:
        return `❌ Validation error: ${errorType}\n`;
    }
  }
}

// ============================================================================
// ProjectLifecycleManager Class
// ============================================================================

/**
 * Main class for managing project lifecycle operations
 */
export class ProjectLifecycleManager {
  private projectStore: ProjectStore;
  private projectResolver: ProjectResolver;
  private projectNameGenerator: ProjectNameGenerator;
  private sessionContextManager: SessionContextManager;
  private proximityDetector: ProximityDetector;

  /**
   * Constructor
   * 
   * @param projectStore - Project storage service
   * @param projectResolver - Project name resolution service
   * @param projectNameGenerator - Project name generation service
   * @param sessionContextManager - Session context management service
   */
  constructor(
    projectStore: ProjectStore,
    projectResolver: ProjectResolver,
    projectNameGenerator: ProjectNameGenerator,
    sessionContextManager: SessionContextManager
  ) {
    this.projectStore = projectStore;
    this.projectResolver = projectResolver;
    this.projectNameGenerator = projectNameGenerator;
    this.sessionContextManager = sessionContextManager;
    this.proximityDetector = new ProximityDetector();

    console.log('[ProjectLifecycleManager] Initialized');
  }

  // ============================================================================
  // Deduplication Methods
  // ============================================================================

  /**
   * Detect duplicate projects at given coordinates
   * 
   * @param coordinates - Target coordinates
   * @param radiusKm - Search radius in kilometers (default: 1km)
   * @returns Duplicate detection result
   */
  async detectDuplicates(
    coordinates: Coordinates,
    radiusKm: number = 1.0
  ): Promise<DuplicateDetectionResult> {
    try {
      console.log('[ProjectLifecycleManager] Detecting duplicates at:', coordinates);

      // Get all projects
      const allProjects = await this.projectStore.list();

      // Find projects within radius
      const matches = this.proximityDetector.findProjectsWithinRadius(
        allProjects,
        coordinates,
        radiusKm
      );

      const hasDuplicates = matches.length > 0;

      if (hasDuplicates) {
        console.log(`[ProjectLifecycleManager] Found ${matches.length} duplicate(s)`);
      }

      return {
        hasDuplicates,
        duplicates: matches,
        message: hasDuplicates
          ? `Found ${matches.length} existing project(s) within ${radiusKm}km`
          : 'No existing projects found at this location',
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error detecting duplicates:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate projects at given coordinates
   * Combines detection and prompt generation
   * 
   * @param coordinates - Target coordinates
   * @param radiusKm - Search radius in kilometers (default: 1km)
   * @returns Object with hasDuplicates flag and user prompt
   */
  async checkForDuplicates(
    coordinates: Coordinates,
    radiusKm: number = 1.0
  ): Promise<{
    hasDuplicates: boolean;
    duplicates: DuplicateMatch[];
    userPrompt: string;
    message: string;
  }> {
    try {
      console.log('[ProjectLifecycleManager] Checking for duplicates at:', coordinates);

      // Detect duplicates
      const detectionResult = await this.detectDuplicates(coordinates, radiusKm);

      if (!detectionResult.hasDuplicates) {
        return {
          hasDuplicates: false,
          duplicates: [],
          userPrompt: '',
          message: 'No existing projects found at this location',
        };
      }

      // Generate user prompt
      const userPrompt = await this.promptForDuplicateResolution(
        detectionResult.duplicates.map((d) => d.project),
        coordinates
      );

      return {
        hasDuplicates: true,
        duplicates: detectionResult.duplicates,
        userPrompt,
        message: detectionResult.message || '',
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error checking for duplicates:', error);
      throw error;
    }
  }

  /**
   * Generate user prompt for duplicate resolution
   * 
   * @param existingProjects - Array of existing projects found
   * @param newCoordinates - Coordinates of new project
   * @returns Formatted prompt message
   */
  async promptForDuplicateResolution(
    existingProjects: ProjectData[],
    newCoordinates: Coordinates
  ): Promise<string> {
    if (existingProjects.length === 0) {
      return '';
    }

    const projectList = existingProjects
      .map((p, index) => {
        const distance = this.proximityDetector.calculateDistance(
          newCoordinates,
          p.coordinates!
        );
        return `${index + 1}. ${p.project_name} (${distance.toFixed(2)}km away)`;
      })
      .join('\n');

    return `Found existing project(s) at these coordinates:\n\n${projectList}\n\nWould you like to:\n1. Continue with existing project\n2. Create new project\n3. View existing project details\n\nPlease respond with your choice (1, 2, or 3).`;
  }

  /**
   * Handle user's duplicate resolution choice
   * 
   * @param choice - User's choice (1, 2, or 3)
   * @param duplicates - Array of duplicate matches
   * @param sessionId - Session ID for context management
   * @returns Result with action to take
   */
  async handleDuplicateChoice(
    choice: string,
    duplicates: DuplicateMatch[],
    sessionId: string
  ): Promise<{
    action: 'continue' | 'create_new' | 'view_details';
    projectName?: string;
    message: string;
  }> {
    try {
      console.log(`[ProjectLifecycleManager] Handling duplicate choice: ${choice}`);

      // Parse choice
      const choiceNum = parseInt(choice.trim());

      if (choiceNum === 1) {
        // Continue with existing project (use the closest one)
        const closestProject = duplicates[0].project;
        
        // Set as active project
        await this.sessionContextManager.setActiveProject(sessionId, closestProject.project_name);
        await this.sessionContextManager.addToHistory(sessionId, closestProject.project_name);

        return {
          action: 'continue',
          projectName: closestProject.project_name,
          message: `Continuing with existing project: ${closestProject.project_name}`,
        };
      } else if (choiceNum === 2) {
        // Create new project
        return {
          action: 'create_new',
          message: 'Creating new project at these coordinates',
        };
      } else if (choiceNum === 3) {
        // View details of existing projects
        const projectDetails = duplicates
          .map((d, index) => {
            const completionStatus = this.calculateCompletionStatus(d.project);
            return `\n${index + 1}. ${d.project.project_name} (${d.distanceKm.toFixed(2)}km away)\n   Created: ${new Date(d.project.created_at).toLocaleDateString()}\n   Completion: ${completionStatus.percentage}% (${completionStatus.completed}/${completionStatus.total} steps)\n   Status: ${completionStatus.steps.join(', ')}`;
          })
          .join('\n');

        return {
          action: 'view_details',
          message: `Project Details:${projectDetails}\n\nWould you like to:\n1. Continue with existing project\n2. Create new project`,
        };
      } else {
        return {
          action: 'create_new',
          message: 'Invalid choice. Creating new project.',
        };
      }
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error handling duplicate choice:', error);
      throw error;
    }
  }

  /**
   * Calculate completion status for a project
   * 
   * @param project - Project data
   * @returns Completion status
   */
  private calculateCompletionStatus(project: ProjectData): {
    percentage: number;
    completed: number;
    total: number;
    steps: string[];
  } {
    const steps = [
      { name: 'Terrain', completed: !!project.terrain_results },
      { name: 'Layout', completed: !!project.layout_results },
      { name: 'Simulation', completed: !!project.simulation_results },
      { name: 'Report', completed: !!project.report_results },
    ];

    const completed = steps.filter((s) => s.completed).length;
    const total = steps.length;
    const percentage = Math.round((completed / total) * 100);
    const stepNames = steps
      .map((s) => `${s.name}: ${s.completed ? '✓' : '✗'}`)
      .filter((_, i) => steps[i].completed);

    return {
      percentage,
      completed,
      total,
      steps: stepNames,
    };
  }

  // ============================================================================
  // Deletion Methods
  // ============================================================================

  /**
   * Delete a single project
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7
   * 
   * @param projectName - Name of project to delete
   * @param skipConfirmation - Skip confirmation prompt (default: false)
   * @param sessionId - Optional session ID for context management
   * @returns Delete result
   */
  async deleteProject(
    projectName: string,
    skipConfirmation: boolean = false,
    sessionId?: string
  ): Promise<DeleteResult> {
    try {
      console.log(`[ProjectLifecycleManager] Deleting project: ${projectName}`);

      // 1. Check if project exists (Requirement 2.2)
      const project = await this.projectStore.load(projectName);
      if (!project) {
        return {
          success: false,
          projectName,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND(projectName),
          error: ProjectLifecycleError.PROJECT_NOT_FOUND,
        };
      }

      // 2. Check if project is in progress (Requirement 2.7)
      if (project.metadata?.status === 'in_progress') {
        return {
          success: false,
          projectName,
          message: ERROR_MESSAGES.PROJECT_IN_PROGRESS(projectName),
          error: ProjectLifecycleError.PROJECT_IN_PROGRESS,
        };
      }

      // 3. Check if confirmation is required (Requirement 2.1)
      if (!skipConfirmation) {
        return {
          success: false,
          projectName,
          message: ERROR_MESSAGES.CONFIRMATION_REQUIRED('delete', projectName),
          error: ProjectLifecycleError.CONFIRMATION_REQUIRED,
        };
      }

      // 4. Delete from S3 (Requirement 2.2, 2.3)
      await this.projectStore.delete(projectName);

      // 5. Update session context if active project deleted (Requirement 2.4)
      if (sessionId) {
        const activeProject = await this.sessionContextManager.getActiveProject(sessionId);
        if (activeProject === projectName) {
          await this.sessionContextManager.setActiveProject(sessionId, '');
          console.log(`[ProjectLifecycleManager] Cleared active project from session ${sessionId}`);
        }
      }

      // 6. Clear resolver cache (Requirement 2.5)
      this.projectResolver.clearCache();

      console.log(`[ProjectLifecycleManager] Successfully deleted project: ${projectName}`);

      return {
        success: true,
        projectName,
        message: `Project '${projectName}' has been deleted.`,
      };
    } catch (error) {
      console.error(`[ProjectLifecycleManager] Error deleting project ${projectName}:`, error);
      return {
        success: false,
        projectName,
        message: `Failed to delete project '${projectName}'`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete multiple projects matching a pattern
   * 
   * @param pattern - Pattern to match project names
   * @param skipConfirmation - Skip confirmation prompt (default: false)
   * @returns Bulk delete result
   */
  async deleteBulk(
    pattern: string,
    skipConfirmation: boolean = false
  ): Promise<BulkDeleteResult> {
    try {
      console.log(`[ProjectLifecycleManager] Bulk delete with pattern: ${pattern}`);

      // Find matching projects
      const matches = await this.projectStore.findByPartialName(pattern);

      if (matches.length === 0) {
        return {
          success: false,
          deletedCount: 0,
          deletedProjects: [],
          failedProjects: [],
          message: `No projects match pattern '${pattern}'.`,
        };
      }

      // Check if confirmation is required
      if (!skipConfirmation) {
        const projectList = matches.map((p) => p.project_name).join(', ');
        return {
          success: false,
          deletedCount: 0,
          deletedProjects: [],
          failedProjects: [],
          message: `Found ${matches.length} project(s) matching '${pattern}': ${projectList}. Type 'yes' to delete all.`,
        };
      }

      // Delete each project
      const results = await Promise.allSettled(
        matches.map((p) => this.projectStore.delete(p.project_name))
      );

      const deleted: string[] = [];
      const failed: Array<{ name: string; error: string }> = [];

      results.forEach((result, index) => {
        const projectName = matches[index].project_name;
        if (result.status === 'fulfilled') {
          deleted.push(projectName);
        } else {
          failed.push({
            name: projectName,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      });

      // Clear resolver cache
      this.projectResolver.clearCache();

      console.log(
        `[ProjectLifecycleManager] Bulk delete complete: ${deleted.length} deleted, ${failed.length} failed`
      );

      return {
        success: failed.length === 0,
        deletedCount: deleted.length,
        deletedProjects: deleted,
        failedProjects: failed,
        message:
          failed.length === 0
            ? `Successfully deleted ${deleted.length} project(s).`
            : `Deleted ${deleted.length} project(s). Failed to delete ${failed.length} project(s).`,
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error in bulk delete:', error);
      return {
        success: false,
        deletedCount: 0,
        deletedProjects: [],
        failedProjects: [],
        message: `Bulk delete failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // ============================================================================
  // Rename Methods
  // ============================================================================

  /**
   * Rename a project
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
   * 
   * @param oldName - Current project name
   * @param newName - New project name
   * @param sessionId - Optional session ID for context management
   * @returns Rename result
   */
  async renameProject(
    oldName: string, 
    newName: string,
    sessionId?: string
  ): Promise<RenameResult> {
    try {
      console.log(`[ProjectLifecycleManager] Renaming project: ${oldName} -> ${newName}`);

      // 1. Validate old project exists (Requirement 3.1)
      const project = await this.projectStore.load(oldName);
      if (!project) {
        return {
          success: false,
          oldName,
          newName,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND(oldName),
          error: ProjectLifecycleError.PROJECT_NOT_FOUND,
        };
      }

      // 2. Normalize new name (Requirement 3.1)
      const normalizedNewName = this.projectNameGenerator.normalize(newName);

      // 3. Check if new name already exists (Requirement 3.1, 3.4)
      const existing = await this.projectStore.load(normalizedNewName);
      if (existing) {
        return {
          success: false,
          oldName,
          newName: normalizedNewName,
          message: ERROR_MESSAGES.NAME_ALREADY_EXISTS(normalizedNewName),
          error: ProjectLifecycleError.NAME_ALREADY_EXISTS,
        };
      }

      // 4. Create updated project with new name (Requirement 3.2)
      const updatedProject: ProjectData = {
        ...project,
        project_name: normalizedNewName,
        updated_at: new Date().toISOString(),
      };

      // 5. Save with new name (Requirement 3.3 - S3 path update)
      await this.projectStore.save(normalizedNewName, updatedProject);

      // 6. Delete old project (Requirement 3.3 - S3 path update)
      await this.projectStore.delete(oldName);

      // 7. Update session context if active project (Requirement 3.5)
      if (sessionId) {
        const activeProject = await this.sessionContextManager.getActiveProject(sessionId);
        if (activeProject === oldName) {
          await this.sessionContextManager.setActiveProject(sessionId, normalizedNewName);
          console.log(`[ProjectLifecycleManager] Updated active project in session ${sessionId}: ${oldName} -> ${normalizedNewName}`);
        }

        // 8. Update project history (Requirement 3.5)
        const context = await this.sessionContextManager.getContext(sessionId);
        if (context.project_history.includes(oldName)) {
          // Replace old name with new name in history
          const updatedHistory = context.project_history.map(name => 
            name === oldName ? normalizedNewName : name
          );
          
          // Update history in session context
          // We need to update the history directly since there's no updateHistory method
          // We'll add the new name to ensure it's in the history
          await this.sessionContextManager.addToHistory(sessionId, normalizedNewName);
          console.log(`[ProjectLifecycleManager] Updated project history in session ${sessionId}`);
        }
      }

      // 9. Clear resolver cache (Requirement 3.6)
      this.projectResolver.clearCache();

      console.log(`[ProjectLifecycleManager] Successfully renamed project: ${oldName} -> ${normalizedNewName}`);

      return {
        success: true,
        oldName,
        newName: normalizedNewName,
        message: `Project renamed from '${oldName}' to '${normalizedNewName}'.`,
      };
    } catch (error) {
      console.error(`[ProjectLifecycleManager] Error renaming project ${oldName}:`, error);
      return {
        success: false,
        oldName,
        newName,
        message: `Failed to rename project '${oldName}'`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // Merge Methods
  // ============================================================================

  /**
   * Merge two projects into one
   * 
   * @param sourceProjectName - Project to merge from (will be deleted)
   * @param targetProjectName - Project to merge into (will be kept)
   * @param keepName - Which name to keep (default: target)
   * @returns Merge result
   */
  async mergeProjects(
    sourceProjectName: string,
    targetProjectName: string,
    keepName?: string
  ): Promise<MergeResult> {
    try {
      console.log(`[ProjectLifecycleManager] Merging projects: ${sourceProjectName} -> ${targetProjectName}`);

      // Load both projects
      const sourceProject = await this.projectStore.load(sourceProjectName);
      const targetProject = await this.projectStore.load(targetProjectName);

      if (!sourceProject || !targetProject) {
        const missing = !sourceProject ? sourceProjectName : targetProjectName;
        return {
          success: false,
          mergedProject: '',
          deletedProject: '',
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND(missing),
          error: ProjectLifecycleError.PROJECT_NOT_FOUND,
        };
      }

      // Determine which name to keep
      const finalName = keepName || targetProjectName;
      if (finalName !== sourceProjectName && finalName !== targetProjectName) {
        return {
          success: false,
          mergedProject: '',
          deletedProject: '',
          message: `Keep name must be either '${sourceProjectName}' or '${targetProjectName}'.`,
          error: ProjectLifecycleError.MERGE_CONFLICT,
        };
      }

      // Merge data (keep most complete)
      const mergedProject: ProjectData = {
        ...targetProject,
        project_name: finalName,
        updated_at: new Date().toISOString(),
        // Keep non-null values from either project
        coordinates: targetProject.coordinates || sourceProject.coordinates,
        terrain_results: targetProject.terrain_results || sourceProject.terrain_results,
        layout_results: targetProject.layout_results || sourceProject.layout_results,
        simulation_results: targetProject.simulation_results || sourceProject.simulation_results,
        report_results: targetProject.report_results || sourceProject.report_results,
        metadata: {
          ...sourceProject.metadata,
          ...targetProject.metadata,
        },
      };

      // Save merged project
      await this.projectStore.save(finalName, mergedProject);

      // Delete the other project
      const deleteTarget = finalName === sourceProjectName ? targetProjectName : sourceProjectName;
      await this.projectStore.delete(deleteTarget);

      // Clear resolver cache
      this.projectResolver.clearCache();

      console.log(`[ProjectLifecycleManager] Successfully merged projects into: ${finalName}`);

      return {
        success: true,
        mergedProject: finalName,
        deletedProject: deleteTarget,
        message: `Projects merged into '${finalName}'. Deleted '${deleteTarget}'.`,
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error merging projects:', error);
      return {
        success: false,
        mergedProject: '',
        deletedProject: '',
        message: `Failed to merge projects`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ============================================================================
  // Archive Methods
  // ============================================================================

  /**
   * Archive a project
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   * 
   * @param projectName - Name of project to archive
   * @param sessionId - Optional session ID for context management
   * @returns Archive result
   */
  async archiveProject(projectName: string, sessionId?: string): Promise<ArchiveResult> {
    try {
      console.log(`[ProjectLifecycleManager] Archiving project: ${projectName}`);

      // 1. Check if project exists (Requirement 8.1)
      const project = await this.projectStore.load(projectName);
      if (!project) {
        return {
          success: false,
          projectName,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND(projectName),
          error: ProjectLifecycleError.PROJECT_NOT_FOUND,
        };
      }

      // 2. Add archived flag (Requirement 8.1, 8.2)
      const archivedProject: ProjectData = {
        ...project,
        updated_at: new Date().toISOString(),
        metadata: {
          ...project.metadata,
          archived: true,
          archived_at: new Date().toISOString(),
        },
      };

      // 3. Save archived project (Requirement 8.1)
      await this.projectStore.save(projectName, archivedProject);

      // 4. Clear active project if this was the active one (Requirement 8.5)
      if (sessionId) {
        const activeProject = await this.sessionContextManager.getActiveProject(sessionId);
        if (activeProject === projectName) {
          await this.sessionContextManager.setActiveProject(sessionId, '');
          console.log(`[ProjectLifecycleManager] Cleared active project from session ${sessionId}`);
        }
      }

      // 5. Clear resolver cache
      this.projectResolver.clearCache();

      console.log(`[ProjectLifecycleManager] Successfully archived project: ${projectName}`);

      return {
        success: true,
        projectName,
        message: `Project '${projectName}' has been archived.`,
      };
    } catch (error) {
      console.error(`[ProjectLifecycleManager] Error archiving project ${projectName}:`, error);
      return {
        success: false,
        projectName,
        message: `Failed to archive project '${projectName}'`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Unarchive a project
   * 
   * Requirements: 8.4
   * 
   * @param projectName - Name of project to unarchive
   * @returns Unarchive result
   */
  async unarchiveProject(projectName: string): Promise<UnarchiveResult> {
    try {
      console.log(`[ProjectLifecycleManager] Unarchiving project: ${projectName}`);

      // 1. Check if project exists (Requirement 8.4)
      const project = await this.projectStore.load(projectName);
      if (!project) {
        return {
          success: false,
          projectName,
          message: ERROR_MESSAGES.PROJECT_NOT_FOUND(projectName),
          error: ProjectLifecycleError.PROJECT_NOT_FOUND,
        };
      }

      // 2. Remove archived flag (Requirement 8.4)
      const unarchivedProject: ProjectData = {
        ...project,
        updated_at: new Date().toISOString(),
        metadata: {
          ...project.metadata,
          archived: false,
          archived_at: undefined,
        },
      };

      // 3. Save unarchived project (Requirement 8.4)
      await this.projectStore.save(projectName, unarchivedProject);

      // 4. Clear resolver cache
      this.projectResolver.clearCache();

      console.log(`[ProjectLifecycleManager] Successfully unarchived project: ${projectName}`);

      return {
        success: true,
        projectName,
        message: `Project '${projectName}' has been unarchived.`,
      };
    } catch (error) {
      console.error(`[ProjectLifecycleManager] Error unarchiving project ${projectName}:`, error);
      return {
        success: false,
        projectName,
        message: `Failed to unarchive project '${projectName}'`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List active (non-archived) projects
   * 
   * Requirements: 8.2
   * 
   * @returns Array of active projects (excludes archived)
   */
  async listActiveProjects(): Promise<ProjectData[]> {
    try {
      console.log('[ProjectLifecycleManager] Listing active projects');
      
      // Get all projects and filter out archived ones (Requirement 8.2)
      const allProjects = await this.projectStore.list();
      const activeProjects = allProjects.filter((p) => p.metadata?.archived !== true);
      
      console.log(`[ProjectLifecycleManager] Found ${activeProjects.length} active project(s)`);
      
      return activeProjects;
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error listing active projects:', error);
      return [];
    }
  }

  /**
   * List archived projects
   * 
   * Requirements: 8.3
   * 
   * @returns Array of archived projects
   */
  async listArchivedProjects(): Promise<ProjectData[]> {
    try {
      console.log('[ProjectLifecycleManager] Listing archived projects');
      
      // Get all projects and filter for archived ones (Requirement 8.3)
      const allProjects = await this.projectStore.list();
      const archivedProjects = allProjects.filter((p) => p.metadata?.archived === true);
      
      console.log(`[ProjectLifecycleManager] Found ${archivedProjects.length} archived project(s)`);
      
      return archivedProjects;
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error listing archived projects:', error);
      return [];
    }
  }

  // ============================================================================
  // Search and Filter Methods
  // ============================================================================

  /**
   * Search projects with filters
   * 
   * @param filters - Search criteria
   * @returns Array of matching projects
   */
  async searchProjects(filters: ProjectSearchFilters): Promise<ProjectData[]> {
    try {
      console.log('[ProjectLifecycleManager] Searching projects with filters:', filters);

      let projects = await this.projectStore.list();

      // Filter by location
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        projects = projects.filter((p) =>
          p.project_name.toLowerCase().includes(locationLower)
        );
      }

      // Filter by date range
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        projects = projects.filter((p) => new Date(p.created_at) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        projects = projects.filter((p) => new Date(p.created_at) <= toDate);
      }

      // Filter by completion status
      if (filters.incomplete) {
        projects = projects.filter(
          (p) =>
            !p.terrain_results ||
            !p.layout_results ||
            !p.simulation_results ||
            !p.report_results
        );
      }

      // Filter by coordinates proximity
      if (filters.coordinates && filters.radiusKm) {
        const matches = this.proximityDetector.findProjectsWithinRadius(
          projects,
          filters.coordinates,
          filters.radiusKm
        );
        projects = matches.map((m) => m.project);
      }

      // Filter by archived status
      if (filters.archived !== undefined) {
        projects = projects.filter(
          (p) => (p.metadata?.archived || false) === filters.archived
        );
      }

      console.log(`[ProjectLifecycleManager] Found ${projects.length} matching projects`);

      return projects;
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error searching projects:', error);
      return [];
    }
  }

  /**
   * Find duplicate projects
   * 
   * @param radiusKm - Grouping radius in kilometers (default: 1km)
   * @returns Array of duplicate groups
   */
  async findDuplicates(radiusKm: number = 1.0): Promise<DuplicateGroup[]> {
    try {
      console.log('[ProjectLifecycleManager] Finding duplicate projects');

      const projects = await this.projectStore.list();
      const groups = this.proximityDetector.groupDuplicates(projects, radiusKm);

      console.log(`[ProjectLifecycleManager] Found ${groups.length} duplicate group(s)`);

      return groups;
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error finding duplicates:', error);
      return [];
    }
  }

  // ============================================================================
  // Export/Import Methods
  // ============================================================================

  /**
   * Export project data
   * 
   * @param projectName - Name of project to export
   * @returns Export data
   */
  async exportProject(projectName: string): Promise<ExportData | null> {
    try {
      console.log(`[ProjectLifecycleManager] Exporting project: ${projectName}`);

      const project = await this.projectStore.load(projectName);
      if (!project) {
        throw new Error(ERROR_MESSAGES.PROJECT_NOT_FOUND(projectName));
      }

      const exportData: ExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project,
        artifacts: {
          terrain: project.terrain_results?.s3_key,
          layout: project.layout_results?.s3_key,
          simulation: project.simulation_results?.s3_key,
          report: project.report_results?.s3_key,
        },
      };

      console.log(`[ProjectLifecycleManager] Successfully exported project: ${projectName}`);

      return exportData;
    } catch (error) {
      console.error(`[ProjectLifecycleManager] Error exporting project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * Import project data
   * 
   * @param data - Export data to import
   * @returns Import result
   */
  async importProject(data: ExportData): Promise<ImportResult> {
    try {
      console.log('[ProjectLifecycleManager] Importing project');

      // Validate format version
      if (data.version !== '1.0') {
        return {
          success: false,
          projectName: '',
          message: ERROR_MESSAGES.UNSUPPORTED_VERSION(data.version),
          error: ProjectLifecycleError.UNSUPPORTED_VERSION,
        };
      }

      // Check for name conflict
      const existing = await this.projectStore.load(data.project.project_name);
      let importName = data.project.project_name;

      if (existing) {
        importName = await this.projectNameGenerator.ensureUnique(
          `${importName}-imported`
        );
      }

      // Save imported project
      const importedProject: ProjectData = {
        ...data.project,
        project_name: importName,
        updated_at: new Date().toISOString(),
        metadata: {
          ...data.project.metadata,
          imported_at: new Date().toISOString(),
        },
      };

      await this.projectStore.save(importName, importedProject);

      console.log(`[ProjectLifecycleManager] Successfully imported project as: ${importName}`);

      return {
        success: true,
        projectName: importName,
        message: `Project imported as '${importName}'.`,
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error importing project:', error);
      return {
        success: false,
        projectName: '',
        message: ERROR_MESSAGES.IMPORT_ERROR(
          error instanceof Error ? error.message : String(error)
        ),
        error: ProjectLifecycleError.IMPORT_ERROR,
      };
    }
  }

  // ============================================================================
  // Dashboard Methods
  // ============================================================================

  /**
   * Generate project dashboard data
   * 
   * @param sessionContext - Current session context
   * @returns Dashboard data
   */
  async generateDashboard(sessionContext: SessionContext): Promise<ProjectDashboard> {
    try {
      console.log('[ProjectLifecycleManager] Generating project dashboard');

      const allProjects = await this.projectStore.list();
      const duplicateGroups = await this.findDuplicates();

      // Create set of duplicate project names
      const duplicateProjectNames = new Set<string>();
      duplicateGroups.forEach((group) => {
        group.projects.forEach((p) => duplicateProjectNames.add(p.project_name));
      });

      // Map projects to dashboard format
      const dashboardProjects = allProjects.map((project) => {
        const completionPercentage = this.calculateCompletionPercentage(project);
        const location = this.extractLocation(project);
        const status = this.getProjectStatus(project);

        return {
          name: project.project_name,
          location,
          completionPercentage,
          lastUpdated: project.updated_at,
          isActive: project.project_name === sessionContext.active_project,
          isDuplicate: duplicateProjectNames.has(project.project_name),
          status,
        };
      });

      // Sort by last updated (most recent first)
      dashboardProjects.sort(
        (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );

      return {
        projects: dashboardProjects,
        totalProjects: allProjects.length,
        activeProject: sessionContext.active_project || null,
        duplicateGroups,
      };
    } catch (error) {
      console.error('[ProjectLifecycleManager] Error generating dashboard:', error);
      return {
        projects: [],
        totalProjects: 0,
        activeProject: null,
        duplicateGroups: [],
      };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate project completion percentage
   */
  private calculateCompletionPercentage(project: ProjectData): number {
    let completed = 0;
    const total = 4;

    if (project.terrain_results) completed++;
    if (project.layout_results) completed++;
    if (project.simulation_results) completed++;
    if (project.report_results) completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Extract location from project name
   */
  private extractLocation(project: ProjectData): string {
    // Try to extract location from project name
    // e.g., "west-texas-wind-farm" -> "West Texas"
    const parts = project.project_name.split('-');
    const locationParts = parts.filter(
      (part) => part !== 'wind' && part !== 'farm' && part !== 'project'
    );

    if (locationParts.length > 0) {
      return locationParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    // Fallback to coordinates if available
    if (project.coordinates) {
      return `${project.coordinates.latitude.toFixed(2)}, ${project.coordinates.longitude.toFixed(2)}`;
    }

    return 'Unknown';
  }

  /**
   * Get project status
   */
  private getProjectStatus(project: ProjectData): string {
    if (project.report_results) return 'Complete';
    if (project.simulation_results) return 'Simulation Complete';
    if (project.layout_results) return 'Layout Complete';
    if (project.terrain_results) return 'Terrain Complete';
    return 'Not Started';
  }
}
