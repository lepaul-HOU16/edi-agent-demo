"use strict";
/**
 * Action Button Types for Contextual Actions
 *
 * Defines the structure for action buttons that guide users to the next logical step
 * in their renewable energy workflow.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActionButtons = generateActionButtons;
exports.generateNextStepSuggestion = generateNextStepSuggestion;
exports.formatProjectStatusChecklist = formatProjectStatusChecklist;
/**
 * Generate action buttons based on intent type and project status
 */
function generateActionButtons(intentType, projectName, projectStatus) {
    const actions = [];
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
function generateNextStepSuggestion(projectStatus) {
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
function formatProjectStatusChecklist(projectStatus) {
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
