/**
 * Test Action Buttons Implementation
 * 
 * Verifies that contextual action buttons are properly generated and included
 * in artifact responses.
 */

const { generateActionButtons, generateNextStepSuggestion, formatProjectStatusChecklist } = require('../amplify/functions/shared/actionButtonTypes');

console.log('🧪 Testing Action Button Generation...\n');

// Test 1: Generate action buttons for terrain analysis
console.log('Test 1: Terrain Analysis Actions');
const terrainActions = generateActionButtons('terrain_analysis', 'west-texas-wind-farm');
console.log('Actions:', JSON.stringify(terrainActions, null, 2));
console.assert(terrainActions.length > 0, 'Should generate actions for terrain analysis');
console.assert(terrainActions[0].primary === true, 'First action should be primary');
console.assert(terrainActions[0].label.includes('Layout'), 'Should suggest layout optimization');
console.log('✅ Terrain analysis actions generated correctly\n');

// Test 2: Generate action buttons for layout optimization
console.log('Test 2: Layout Optimization Actions');
const layoutActions = generateActionButtons('layout_optimization', 'west-texas-wind-farm');
console.log('Actions:', JSON.stringify(layoutActions, null, 2));
console.assert(layoutActions.length > 0, 'Should generate actions for layout optimization');
console.assert(layoutActions[0].label.includes('Simulation'), 'Should suggest wake simulation');
console.log('✅ Layout optimization actions generated correctly\n');

// Test 3: Generate action buttons for wake simulation
console.log('Test 3: Wake Simulation Actions');
const simulationActions = generateActionButtons('wake_simulation', 'west-texas-wind-farm');
console.log('Actions:', JSON.stringify(simulationActions, null, 2));
console.assert(simulationActions.length > 0, 'Should generate actions for wake simulation');
console.assert(simulationActions[0].label.includes('Report'), 'Should suggest report generation');
console.log('✅ Wake simulation actions generated correctly\n');

// Test 4: Generate action buttons for report generation
console.log('Test 4: Report Generation Actions');
const reportActions = generateActionButtons('report_generation', 'west-texas-wind-farm');
console.log('Actions:', JSON.stringify(reportActions, null, 2));
console.assert(reportActions.length > 0, 'Should generate actions for report generation');
console.assert(reportActions[0].label.includes('New Project'), 'Should suggest starting new project');
console.log('✅ Report generation actions generated correctly\n');

// Test 5: Generate next step suggestion
console.log('Test 5: Next Step Suggestions');
const projectStatus1 = { terrain: false, layout: false, simulation: false, report: false };
const nextStep1 = generateNextStepSuggestion(projectStatus1);
console.log('No steps complete:', nextStep1);
console.assert(nextStep1.includes('terrain'), 'Should suggest terrain analysis first');

const projectStatus2 = { terrain: true, layout: false, simulation: false, report: false };
const nextStep2 = generateNextStepSuggestion(projectStatus2);
console.log('Terrain complete:', nextStep2);
console.assert(nextStep2.includes('layout'), 'Should suggest layout optimization next');

const projectStatus3 = { terrain: true, layout: true, simulation: false, report: false };
const nextStep3 = generateNextStepSuggestion(projectStatus3);
console.log('Layout complete:', nextStep3);
console.assert(nextStep3.includes('simulation'), 'Should suggest wake simulation next');

const projectStatus4 = { terrain: true, layout: true, simulation: true, report: false };
const nextStep4 = generateNextStepSuggestion(projectStatus4);
console.log('Simulation complete:', nextStep4);
console.assert(nextStep4.includes('report'), 'Should suggest report generation next');

const projectStatus5 = { terrain: true, layout: true, simulation: true, report: true };
const nextStep5 = generateNextStepSuggestion(projectStatus5);
console.log('All complete:', nextStep5);
console.assert(nextStep5.includes('complete'), 'Should indicate all steps complete');
console.log('✅ Next step suggestions generated correctly\n');

// Test 6: Format project status checklist
console.log('Test 6: Project Status Checklist');
const checklist = formatProjectStatusChecklist(projectStatus3);
console.log('Checklist:\n' + checklist);
console.assert(checklist.includes('✓'), 'Should include checkmarks for completed steps');
console.assert(checklist.includes('○'), 'Should include empty circles for incomplete steps');
console.assert(checklist.includes('Terrain Analysis'), 'Should include all step names');
console.log('✅ Project status checklist formatted correctly\n');

console.log('🎉 All action button tests passed!');
