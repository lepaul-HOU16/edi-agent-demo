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
   * Check if query is a project list request
   */
  static isProjectListQuery(query: string): boolean {
    const patterns = [
      /list.*my.*projects?/i,
      /show.*my.*projects?/i,
      /what.*projects?.*do.*i.*have/i,
      /my.*renewable.*projects?/i,
      /all.*my.*projects?/i,
      /view.*projects?/i,
      /see.*my.*projects?/i
    ];

    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Check if query is a project details request
   */
  static isProjectDetailsQuery(query: string): { isMatch: boolean; projectName?: string } {
    const patterns = [
      /show.*project\s+([a-z0-9-]+)/i,
      /details.*for.*project\s+([a-z0-9-]+)/i,
      /project\s+([a-z0-9-]+).*details/i,
      /view.*project\s+([a-z0-9-]+)/i,
      /info.*about.*project\s+([a-z0-9-]+)/i,
      /status.*of.*project\s+([a-z0-9-]+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return {
          isMatch: true,
          projectName: match[1]
        };
      }
    }

    return { isMatch: false };
  }
}
