/**
 * Action Button Types for Contextual Actions
 * 
 * Defines the structure for action buttons that guide users to the next logical step
 * in their renewable energy workflow.
 */

export interface ActionButton {
  /**
   * Human-readable label for the button
   * Examples: "Optimize Turbine Layout", "Run Wake Simulation"
   */
  label: string;
  
  /**
   * Pre-filled query that will be sent when button is clicked
   * Should include project name placeholder: {project_name}
   */
  query: string;
  
  /**
   * Icon name from Cloudscape icon set
   * Examples: "layout", "simulation", "report", "dashboard", "add", "list", "info", "edit", "compare"
   */
  icon: string;
  
  /**
   * Whether this is the primary (recommended) action
   * Primary actions are styled more prominently
   */
  primary?: boolean;
}

/**
 * Project status for displaying completion checklist
 */
export interface ProjectStatus {
  terrain: boolean;
  layout: boolean;
  simulation: boolean;
  report: boolean;
}

/**
 * Response message enhancements
 */
export interface ResponseEnhancement {
  /**
   * Project name to display in response
   */
  projectName?: string;
  
  /**
   * Project status checklist
   */
  projectStatus?: ProjectStatus;
  
  /**
   * Next step suggestion
   */
  nextStep?: string;
  
  /**
   * Contextual action buttons
   */
  actions?: ActionButton[];
}

/**
 * Generate action buttons based on artifact type and project status
 * Enhanced to include dashboard access at every step
 */
export function generateActionButtons(
  artifactType: string,
  projectName?: string,
  projectStatus?: ProjectStatus
): ActionButton[] {
  const actions: ActionButton[] = [];
  
  // Use project name in queries if available, otherwise use generic queries
  const projectContext = projectName ? ` for ${projectName}` : '';
  
  switch (artifactType) {
    case 'terrain_analysis':
    case 'wind_farm_terrain_analysis':
      // Primary next step: Layout optimization
      actions.push({
        label: 'Optimize Layout',
        query: `optimize turbine layout${projectContext}`,
        icon: 'settings',
        primary: true
      });
      // Always accessible: Dashboard
      actions.push({
        label: 'View Dashboard',
        query: projectName ? `show project dashboard for ${projectName}` : 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      break;
      
    case 'layout_optimization':
    case 'wind_farm_layout':
      // Primary next step: Wake simulation
      actions.push({
        label: 'Run Wake Simulation',
        query: `run wake simulation${projectContext}`,
        icon: 'refresh',
        primary: true
      });
      // Always accessible: Dashboard
      actions.push({
        label: 'View Dashboard',
        query: projectName ? `show project dashboard for ${projectName}` : 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      // Optional: Refine layout
      actions.push({
        label: 'Refine Layout',
        query: `optimize turbine layout with different spacing${projectContext}`,
        icon: 'settings',
        primary: false
      });
      break;
      
    case 'wake_simulation':
    case 'wind_rose_analysis':
      // Primary next step: Generate report
      actions.push({
        label: 'Generate Report',
        query: `generate comprehensive executive report${projectContext}`,
        icon: 'file',
        primary: true
      });
      // Always accessible: Dashboard
      actions.push({
        label: 'View Dashboard',
        query: projectName ? `show project dashboard for ${projectName}` : 'show project dashboard',
        icon: 'status-info',
        primary: false
      });
      // Additional analysis options
      actions.push({
        label: 'Financial Analysis',
        query: `perform financial analysis and ROI calculation${projectContext}`,
        icon: 'calculator',
        primary: false
      });
      actions.push({
        label: 'Optimize Layout',
        query: `optimize turbine layout to reduce wake losses${projectContext}`,
        icon: 'settings',
        primary: false
      });
      break;
      
    case 'report_generation':
    case 'financial_analysis':
      // Always accessible: Dashboard (primary after report)
      actions.push({
        label: 'View Dashboard',
        query: projectName ? `show project dashboard for ${projectName}` : 'show project dashboard',
        icon: 'status-info',
        primary: true
      });
      actions.push({
        label: 'Export Report',
        query: `export project report as PDF${projectContext}`,
        icon: 'download',
        primary: false
      });
      break;
      
    default:
      // Generic actions with dashboard access
      actions.push({
        label: 'View Dashboard',
        query: projectName ? `show project dashboard for ${projectName}` : 'show project dashboard',
        icon: 'status-info',
        primary: true
      });
      actions.push({
        label: 'View All Projects',
        query: 'list my renewable projects',
        icon: 'folder',
        primary: false
      });
  }
  
  return actions;
}

/**
 * Generate next step suggestion based on project status
 */
export function generateNextStepSuggestion(projectStatus?: ProjectStatus): string | undefined {
  if (!projectStatus) {
    return undefined;
  }
  
  if (!projectStatus.terrain) {
    return 'Run terrain analysis to assess site suitability';
  }
  
  if (!projectStatus.layout) {
    return 'Optimize turbine layout to maximize energy production';
  }
  
  if (!projectStatus.simulation) {
    return 'Run wake simulation to analyze energy production and wake effects';
  }
  
  if (!projectStatus.report) {
    return 'Generate comprehensive report with all analysis results';
  }
  
  return 'All analysis steps complete! Start a new project or compare scenarios.';
}

/**
 * Format project status as checklist string
 */
export function formatProjectStatusChecklist(projectStatus: ProjectStatus): string {
  const checkmark = '✓';
  const empty = '○';
  
  return `
Project Status:
  ${projectStatus.terrain ? checkmark : empty} Terrain Analysis
  ${projectStatus.layout ? checkmark : empty} Layout Optimization
  ${projectStatus.simulation ? checkmark : empty} Wake Simulation
  ${projectStatus.report ? checkmark : empty} Report Generation
`.trim();
}
