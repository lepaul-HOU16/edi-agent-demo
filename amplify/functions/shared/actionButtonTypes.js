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
 * Generate action buttons based on artifact type and project status
 * Enhanced to include dashboard access at every step
 */
function generateActionButtons(artifactType, projectName, projectStatus) {
    const actions = [];
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
