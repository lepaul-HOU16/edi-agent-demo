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
 * Generate action buttons based on intent type and project status
 */
export function generateActionButtons(
  intentType: string,
  projectName: string,
  projectStatus?: ProjectStatus
): ActionButton[] {
  const actions: ActionButton[] = [];
  
  switch (intentType) {
    case 'terrain_analysis':
      // After terrain analysis, suggest layout optimization
      actions.push({
        label: 'Optimize Turbine Layout',
        query: `optimize layout for ${projectName}`,
        icon: 'settings',
        primary: true
      });
      actions.push({
        label: 'View Project Details',
        query: `show project ${projectName}`,
        icon: 'status-info'
      });
      break;
      
    case 'layout_optimization':
      // After layout optimization, suggest wake simulation
      actions.push({
        label: 'Run Wake Simulation',
        query: `run wake simulation for ${projectName}`,
        icon: 'refresh',
        primary: true
      });
      actions.push({
        label: 'Adjust Layout',
        query: `optimize layout for ${projectName} with different spacing`,
        icon: 'edit'
      });
      break;
      
    case 'wake_simulation':
    case 'wind_rose_analysis':
      // After wake simulation, suggest report generation
      actions.push({
        label: 'Generate Report',
        query: `generate report for ${projectName}`,
        icon: 'file',
        primary: true
      });
      actions.push({
        label: 'View Performance Dashboard',
        query: `show performance dashboard for ${projectName}`,
        icon: 'view-full'
      });
      actions.push({
        label: 'Compare Scenarios',
        query: `create alternative layout for ${projectName}`,
        icon: 'copy'
      });
      break;
      
    case 'report_generation':
      // After report generation, suggest starting new project or viewing all projects
      actions.push({
        label: 'Start New Project',
        query: 'analyze terrain at [coordinates]',
        icon: 'add-plus',
        primary: true
      });
      actions.push({
        label: 'View All Projects',
        query: 'list my renewable projects',
        icon: 'folder'
      });
      break;
      
    default:
      // Generic actions
      actions.push({
        label: 'View Project Details',
        query: `show project ${projectName}`,
        icon: 'status-info',
        primary: true
      });
      actions.push({
        label: 'View All Projects',
        query: 'list my renewable projects',
        icon: 'folder'
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
