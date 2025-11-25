/**
 * Project List Handler
 * 
 * Handles queries for listing renewable energy projects and showing project details.
 * Provides formatted responses with project status, metrics, and timestamps.
 * 
 * Requirements: 8.1, 8.3, 8.6
 */

import { ProjectStore, ProjectData } from './projectStore';
import { SessionContextManager } from './sessionContextManager';

export interface ProjectListResponse {
  success: boolean;
  message: string;
  projects?: ProjectSummary[];
  projectDetails?: ProjectDetails;
  activeProject?: string;
}

export interface ProjectSummary {
  project_name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metrics?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
  isActive: boolean;
}

export interface ProjectStatus {
  terrain: boolean;
  layout: boolean;
  simulation: boolean;
  report: boolean;
  completionPercentage: number;
}

export interface ProjectDetails {
  project_name: string;
  project_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
  report_results?: any;
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
}

export class ProjectListHandler {
  private projectStore: ProjectStore;
  private sessionContextManager: SessionContextManager;

  constructor(bucketName?: string, sessionTableName?: string) {
    this.projectStore = new ProjectStore(bucketName);
    this.sessionContextManager = new SessionContextManager(sessionTableName);
  }

  /**
   * Handle "list my renewable projects" query
   * Returns all projects with status, timestamps, and active marker
   */
  async listProjects(sessionId?: string): Promise<ProjectListResponse> {
    try {
      console.log('[ProjectListHandler] Listing all projects');
      
      // Get all projects from S3
      const allProjects = await this.projectStore.list();
      
      if (allProjects.length === 0) {
        return {
          success: true,
          message: 'You don\'t have any renewable energy projects yet. Start by analyzing terrain at a location:\n\n"analyze terrain at 35.067482, -101.395466"',
          projects: []
        };
      }

      // Get active project from session
      let activeProjectName: string | undefined;
      if (sessionId) {
        try {
          activeProjectName = await this.sessionContextManager.getActiveProject(sessionId);
        } catch (error) {
          console.warn('[ProjectListHandler] Could not get active project:', error);
        }
      }

      // Convert to project summaries
      const projectSummaries = allProjects.map(project => 
        this.createProjectSummary(project, project.project_name === activeProjectName)
      );

      // Sort by updated_at (most recent first)
      projectSummaries.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      // Format response message
      const message = this.formatProjectListMessage(projectSummaries, activeProjectName);

      console.log(`[ProjectListHandler] Found ${projectSummaries.length} projects`);

      return {
        success: true,
        message,
        projects: projectSummaries,
        activeProject: activeProjectName
      };

    } catch (error) {
      console.error('[ProjectListHandler] Error listing projects:', error);
      return {
        success: false,
        message: 'Failed to list projects. Please try again.',
        projects: []
      };
    }
  }

  /**
   * Handle "show project {name}" query
   * Returns complete project data with all analysis results
   */
  async showProjectDetails(projectName: string): Promise<ProjectListResponse> {
    try {
      console.log(`[ProjectListHandler] Showing details for project: ${projectName}`);

      // Load project data
      const projectData = await this.projectStore.load(projectName);

      if (!projectData) {
        return {
          success: false,
          message: `Project "${projectName}" not found. Use "list my renewable projects" to see available projects.`
        };
      }

      // Create detailed project info
      const projectDetails = this.createProjectDetails(projectData);

      // Format response message
      const message = this.formatProjectDetailsMessage(projectDetails);

      console.log(`[ProjectListHandler] Retrieved details for project: ${projectName}`);

      return {
        success: true,
        message,
        projectDetails
      };

    } catch (error) {
      console.error(`[ProjectListHandler] Error showing project details for ${projectName}:`, error);
      return {
        success: false,
        message: `Failed to load project "${projectName}". Please try again.`
      };
    }
  }

  /**
   * Create project summary from project data
   */
  private createProjectSummary(project: ProjectData, isActive: boolean): ProjectSummary {
    const status = this.calculateProjectStatus(project);

    return {
      project_name: project.project_name,
      status,
      created_at: project.created_at,
      updated_at: project.updated_at,
      coordinates: project.coordinates,
      metrics: project.metadata,
      isActive
    };
  }

  /**
   * Create detailed project info from project data
   */
  private createProjectDetails(project: ProjectData): ProjectDetails {
    const status = this.calculateProjectStatus(project);

    return {
      project_name: project.project_name,
      project_id: project.project_id,
      status,
      created_at: project.created_at,
      updated_at: project.updated_at,
      coordinates: project.coordinates,
      terrain_results: project.terrain_results,
      layout_results: project.layout_results,
      simulation_results: project.simulation_results,
      report_results: project.report_results,
      metadata: project.metadata
    };
  }

  /**
   * Calculate project completion status
   */
  private calculateProjectStatus(project: ProjectData): ProjectStatus {
    const terrain = !!project.terrain_results;
    const layout = !!project.layout_results;
    const simulation = !!project.simulation_results;
    const report = !!project.report_results;

    const completed = [terrain, layout, simulation, report].filter(Boolean).length;
    const completionPercentage = Math.round((completed / 4) * 100);

    return {
      terrain,
      layout,
      simulation,
      report,
      completionPercentage
    };
  }

  /**
   * Format project list message for user
   */
  private formatProjectListMessage(projects: ProjectSummary[], activeProject?: string): string {
    const lines: string[] = [];

    lines.push('# Your Renewable Energy Projects\n');

    for (const project of projects) {
      const marker = project.isActive ? '→ ' : '  ';
      const activeLabel = project.isActive ? ' (active)' : '';
      
      lines.push(`${marker}**${project.project_name}**${activeLabel}`);
      
      // Status indicators
      const statusLine = [
        project.status.terrain ? '✓ Terrain' : '✗ Terrain',
        project.status.layout ? '✓ Layout' : '✗ Layout',
        project.status.simulation ? '✓ Simulation' : '✗ Simulation',
        project.status.report ? '✓ Report' : '✗ Report'
      ].join(' | ');
      lines.push(`  ${statusLine}`);

      // Completion percentage
      lines.push(`  Progress: ${project.status.completionPercentage}%`);

      // Coordinates
      if (project.coordinates) {
        lines.push(`  Location: ${project.coordinates.latitude.toFixed(6)}, ${project.coordinates.longitude.toFixed(6)}`);
      }

      // Metrics
      if (project.metrics) {
        const metricParts: string[] = [];
        if (project.metrics.turbine_count) {
          metricParts.push(`${project.metrics.turbine_count} turbines`);
        }
        if (project.metrics.total_capacity_mw) {
          metricParts.push(`${project.metrics.total_capacity_mw} MW`);
        }
        if (project.metrics.annual_energy_gwh) {
          metricParts.push(`${project.metrics.annual_energy_gwh.toFixed(1)} GWh/year`);
        }
        if (metricParts.length > 0) {
          lines.push(`  Metrics: ${metricParts.join(', ')}`);
        }
      }

      // Timestamps
      const createdDate = this.formatTimestamp(project.created_at);
      const updatedDate = this.formatTimestamp(project.updated_at);
      lines.push(`  Created: ${createdDate} | Updated: ${updatedDate}`);

      lines.push(''); // Empty line between projects
    }

    lines.push('\n**Next Steps:**');
    if (activeProject) {
      const activeProj = projects.find(p => p.project_name === activeProject);
      if (activeProj) {
        const nextStep = this.getNextStep(activeProj.status);
        lines.push(`- ${nextStep} for ${activeProject}`);
      }
    } else {
      lines.push('- Select a project to continue: "show project {name}"');
    }
    lines.push('- Start a new project: "analyze terrain at {coordinates}"');

    return lines.join('\n');
  }

  /**
   * Format project details message for user
   */
  private formatProjectDetailsMessage(details: ProjectDetails): string {
    const lines: string[] = [];

    lines.push(`# Project: ${details.project_name}\n`);

    // Status section
    lines.push('## Status');
    const statusLine = [
      details.status.terrain ? '✓ Terrain Analysis' : '✗ Terrain Analysis',
      details.status.layout ? '✓ Layout Optimization' : '✗ Layout Optimization',
      details.status.simulation ? '✓ Wake Simulation' : '✗ Wake Simulation',
      details.status.report ? '✓ Report Generation' : '✗ Report Generation'
    ].join('\n');
    lines.push(statusLine);
    lines.push(`\n**Completion:** ${details.status.completionPercentage}%\n`);

    // Location section
    if (details.coordinates) {
      lines.push('## Location');
      lines.push(`Latitude: ${details.coordinates.latitude.toFixed(6)}`);
      lines.push(`Longitude: ${details.coordinates.longitude.toFixed(6)}\n`);
    }

    // Metrics section
    if (details.metadata) {
      lines.push('## Project Metrics');
      if (details.metadata.turbine_count) {
        lines.push(`Turbines: ${details.metadata.turbine_count}`);
      }
      if (details.metadata.total_capacity_mw) {
        lines.push(`Total Capacity: ${details.metadata.total_capacity_mw} MW`);
      }
      if (details.metadata.annual_energy_gwh) {
        lines.push(`Annual Energy Production: ${details.metadata.annual_energy_gwh.toFixed(2)} GWh`);
      }
      lines.push('');
    }

    // Analysis results summary
    lines.push('## Analysis Results\n');

    if (details.terrain_results) {
      lines.push('### Terrain Analysis ✓');
      lines.push('Terrain and site constraints have been analyzed.');
      lines.push('');
    }

    if (details.layout_results) {
      lines.push('### Layout Optimization ✓');
      if (details.metadata?.turbine_count) {
        lines.push(`Optimized layout with ${details.metadata.turbine_count} turbines.`);
      } else {
        lines.push('Turbine layout has been optimized.');
      }
      lines.push('');
    }

    if (details.simulation_results) {
      lines.push('### Wake Simulation ✓');
      if (details.metadata?.annual_energy_gwh) {
        lines.push(`Estimated annual energy production: ${details.metadata.annual_energy_gwh.toFixed(2)} GWh`);
      } else {
        lines.push('Wake effects and energy production have been simulated.');
      }
      lines.push('');
    }

    if (details.report_results) {
      lines.push('### Report Generation ✓');
      lines.push('Comprehensive project report has been generated.');
      lines.push('');
    }

    // Timestamps
    lines.push('## Timeline');
    lines.push(`Created: ${this.formatTimestamp(details.created_at)}`);
    lines.push(`Last Updated: ${this.formatTimestamp(details.updated_at)}\n`);

    // Next steps
    lines.push('## Next Steps');
    const nextStep = this.getNextStep(details.status);
    lines.push(`- ${nextStep}`);

    return lines.join('\n');
  }

  /**
   * Get next step suggestion based on project status
   */
  private getNextStep(status: ProjectStatus): string {
    if (!status.terrain) {
      return 'Run terrain analysis';
    } else if (!status.layout) {
      return 'Optimize turbine layout';
    } else if (!status.simulation) {
      return 'Run wake simulation';
    } else if (!status.report) {
      return 'Generate comprehensive report';
    } else {
      return 'Project complete! Start a new project or refine this one';
    }
  }

  /**
   * Format timestamp to human-readable format
   */
  private formatTimestamp(isoString: string): string {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      return isoString;
    }
  }

  /**
   * Generate dashboard artifact for UI rendering
   * Requirements: 2.1, 2.2, 2.5
   */
  async generateDashboardArtifact(sessionId?: string): Promise<{
    success: boolean;
    message: string;
    artifacts: any[];
    projectCount: number;
  }> {
    try {
      console.log('[ProjectListHandler] Generating dashboard artifact');
      
      // Get all projects from ProjectStore
      const allProjects = await this.projectStore.list();
      
      // Even if no projects, still generate dashboard artifact (empty dashboard)
      const hasProjects = allProjects.length > 0;

      // Get active project from SessionContextManager
      let activeProjectName: string | undefined;
      if (sessionId && hasProjects) {
        try {
          activeProjectName = await this.sessionContextManager.getActiveProject(sessionId);
          console.log('[ProjectListHandler] Active project:', activeProjectName);
        } catch (error) {
          console.warn('[ProjectListHandler] Could not get active project:', error);
        }
      }

      // Detect duplicates (projects within 1km radius)
      const duplicateGroups = hasProjects ? this.detectDuplicates(allProjects) : [];
      console.log('[ProjectListHandler] Found', duplicateGroups.length, 'duplicate groups');

      // Create dashboard data with all required fields
      const dashboardData = {
        projects: allProjects.map(project => ({
          name: project.project_name,
          location: this.formatLocation(project.coordinates),
          completionPercentage: this.calculateCompletionPercentage(project),
          lastUpdated: project.updated_at,
          isActive: project.project_name === activeProjectName,
          isDuplicate: this.isProjectDuplicate(project, duplicateGroups),
          status: this.getProjectStatusLabel(project)
        })),
        totalProjects: allProjects.length,
        activeProject: activeProjectName || null,
        duplicateGroups: duplicateGroups.map(group => ({
          location: this.formatLocation(group.coordinates),
          count: group.projects.length,
          projects: group.projects.map(p => ({
            project_name: p.project_name,
            coordinates: p.coordinates
          }))
        }))
      };

      // Create artifact structure
      const artifact = {
        type: 'project_dashboard',
        messageContentType: 'project_dashboard',  // CRITICAL: Frontend checks this field
        title: 'Renewable Energy Projects Dashboard',
        data: dashboardData
      };

      console.log('[ProjectListHandler] Dashboard artifact generated successfully');

      const message = hasProjects 
        ? `Found ${allProjects.length} renewable energy project${allProjects.length !== 1 ? 's' : ''}.`
        : 'You don\'t have any renewable energy projects yet.';

      return {
        success: true,
        message,
        artifacts: [artifact],
        projectCount: allProjects.length
      };

    } catch (error) {
      console.error('[ProjectListHandler] Error generating dashboard artifact:', error);
      return {
        success: false,
        message: 'Failed to load project dashboard.',
        artifacts: [],
        projectCount: 0
      };
    }
  }

  /**
   * Detect duplicate projects within 1km radius
   * Requirements: 2.3
   */
  private detectDuplicates(projects: ProjectData[]): Array<{
    coordinates: { latitude: number; longitude: number };
    projects: ProjectData[];
  }> {
    const duplicateGroups: Array<{
      coordinates: { latitude: number; longitude: number };
      projects: ProjectData[];
    }> = [];
    
    const processed = new Set<string>();

    for (const project of projects) {
      // Skip if no coordinates or already processed
      if (!project.coordinates || processed.has(project.project_name)) {
        continue;
      }

      // Find all projects within 1km
      const nearby = projects.filter(p => {
        if (!p.coordinates || p.project_name === project.project_name) {
          return false;
        }

        const distance = this.calculateDistance(
          project.coordinates.latitude,
          project.coordinates.longitude,
          p.coordinates.latitude,
          p.coordinates.longitude
        );

        return distance <= 1.0; // 1km radius
      });

      if (nearby.length > 0) {
        // Found duplicates - create group
        const group = [project, ...nearby];
        duplicateGroups.push({
          coordinates: project.coordinates,
          projects: group
        });

        // Mark all as processed
        group.forEach(p => processed.add(p.project_name));
      }
    }

    return duplicateGroups;
  }

  /**
   * Calculate distance between two coordinates in km using Haversine formula
   * Requirements: 5.5
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format location for display
   * Requirements: 5.1
   */
  private formatLocation(coordinates?: { latitude: number; longitude: number }): string {
    if (!coordinates) return 'Unknown';
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
  }

  /**
   * Calculate completion percentage for a project
   * Requirements: 5.2
   */
  private calculateCompletionPercentage(project: ProjectData): number {
    const steps = [
      !!project.terrain_results,
      !!project.layout_results,
      !!project.simulation_results,
      !!project.report_results
    ];
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / 4) * 100);
  }

  /**
   * Check if project is in duplicate groups
   * Requirements: 5.3
   */
  private isProjectDuplicate(
    project: ProjectData,
    duplicateGroups: Array<{ projects: ProjectData[] }>
  ): boolean {
    return duplicateGroups.some(group =>
      group.projects.some(p => p.project_name === project.project_name)
    );
  }

  /**
   * Get project status label
   * Requirements: 5.4
   */
  private getProjectStatusLabel(project: ProjectData): string {
    if (project.report_results) return 'Complete';
    if (project.simulation_results) return 'Simulation Complete';
    if (project.layout_results) return 'Layout Complete';
    if (project.terrain_results) return 'Terrain Complete';
    return 'Not Started';
  }

  /**
   * Check if query is a dashboard request (requires UI artifact)
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  static isProjectDashboardQuery(query: string): boolean {
    console.log('[ProjectListHandler] Testing dashboard query:', query);
    
    // Dashboard-specific patterns
    const dashboardPatterns = [
      /\bshow\b.*\bproject\b.*\bdashboard\b/i,
      /\bproject\b.*\bdashboard\b/i,
      /\bdashboard\b/i,
      /\bview\b.*\bdashboard\b/i,
      /\bopen\b.*\bdashboard\b/i,
      /\bmy\b.*\bdashboard\b/i
    ];

    // Exclusion patterns - queries that should NOT trigger dashboard
    const exclusionPatterns = [
      /\blist\b/i,                          // Any "list" query should be text-only
      /\banalyze\b/i,                       // Action verbs should not trigger dashboard
      /\boptimize\b/i,
      /\bsimulate\b/i,
      /\bgenerate\b/i,
      /\bcreate\b/i,
      /\brun\b/i,
      /\bperform\b/i
    ];

    // First check exclusions - if any match, reject immediately
    for (let i = 0; i < exclusionPatterns.length; i++) {
      if (exclusionPatterns[i].test(query)) {
        console.log(`[ProjectListHandler] ❌ Dashboard rejected: Matched exclusion pattern ${i + 1}`);
        return false;
      }
    }

    // Then check dashboard patterns
    for (let i = 0; i < dashboardPatterns.length; i++) {
      if (dashboardPatterns[i].test(query)) {
        console.log(`[ProjectListHandler] ✅ Dashboard matched pattern ${i + 1}:`, dashboardPatterns[i].source);
        return true;
      }
    }
    
    console.log('[ProjectListHandler] ❌ No dashboard patterns matched');
    return false;
  }

  /**
   * Check if query is a project list request
   */
  static isProjectListQuery(query: string): boolean {
    console.log('[ProjectListHandler] Testing query:', query);
    
    // Use word boundaries to ensure exact word matches
    const patterns = [
      /\blist\b.*\bmy\b.*\bprojects?\b/i,
      /\bshow\b.*\bmy\b.*\bprojects?\b/i,
      /\bwhat\b.*\bprojects?\b.*\bdo\b.*\bi\b.*\bhave\b/i,
      /\bmy\b.*\brenewable\b.*\bprojects?\b/i,
      /\ball\b.*\bmy\b.*\bprojects?\b/i,
      /\bview\b.*\bprojects?\b/i,
      /\bsee\b.*\bmy\b.*\bprojects?\b/i
    ];

    // Additional safety check: reject if query contains action verbs
    const actionVerbs = ['analyze', 'optimize', 'simulate', 'generate', 'create', 'run', 'perform'];
    const lowerQuery = query.toLowerCase();
    const hasActionVerb = actionVerbs.some(verb => lowerQuery.includes(verb));
    
    if (hasActionVerb) {
      console.log('[ProjectListHandler] ❌ Rejected: Query contains action verb');
      return false;
    }

    // Test each pattern individually for debugging
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i].test(query)) {
        console.log(`[ProjectListHandler] ✅ Matched pattern ${i + 1}:`, patterns[i].source);
        return true;
      }
    }
    
    console.log('[ProjectListHandler] ❌ No patterns matched');
    return false;
  }

  /**
   * Check if query is a project details request
   */
  static isProjectDetailsQuery(query: string): { isMatch: boolean; projectName?: string } {
    console.log('[ProjectListHandler] Testing project details query:', query);
    
    // Additional safety check: must explicitly mention "project"
    if (!query.toLowerCase().includes('project')) {
      console.log('[ProjectListHandler] ❌ No "project" keyword found');
      return { isMatch: false };
    }

    // Use word boundaries to ensure exact word matches
    const patterns = [
      /\bshow\b.*\bproject\b\s+([a-z0-9-]+)/i,
      /\bdetails\b.*\bfor\b.*\bproject\b\s+([a-z0-9-]+)/i,
      /\bproject\b\s+([a-z0-9-]+).*\bdetails\b/i,
      /\bview\b.*\bproject\b\s+([a-z0-9-]+)/i,
      /\binfo\b.*\babout\b.*\bproject\b\s+([a-z0-9-]+)/i,
      /\bstatus\b.*\bof\b.*\bproject\b\s+([a-z0-9-]+)/i
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = query.match(patterns[i]);
      if (match && match[1]) {
        console.log(`[ProjectListHandler] ✅ Matched pattern ${i + 1}, extracted project name:`, match[1]);
        return {
          isMatch: true,
          projectName: match[1]
        };
      }
    }

    console.log('[ProjectListHandler] ❌ No project details patterns matched');
    return { isMatch: false };
  }
}
