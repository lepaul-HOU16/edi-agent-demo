/**
 * Verification Script: Enhanced Action Button Generation with Dashboard Access
 * 
 * This script demonstrates that generateActionButtons correctly generates
 * contextual action buttons with dashboard access for each artifact type.
 */

import { generateActionButtons } from '../amplify/functions/shared/actionButtonTypes.js';

console.log('='.repeat(80));
console.log('TASK 7: Enhanced Action Button Generation with Dashboard Access');
console.log('='.repeat(80));
console.log();

// Test data
const projectName = 'test-wind-farm';
const artifactTypes = [
  'terrain_analysis',
  'wind_farm_layout',
  'wake_simulation',
  'report_generation'
];

// Test each artifact type
artifactTypes.forEach(artifactType => {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Artifact Type: ${artifactType}`);
  console.log(`${'─'.repeat(80)}`);
  
  const buttons = generateActionButtons(artifactType, projectName);
  
  console.log(`\nGenerated ${buttons.length} action buttons:\n`);
  
  buttons.forEach((button, index) => {
    console.log(`${index + 1}. ${button.label} ${button.primary ? '(PRIMARY)' : '(SECONDARY)'}`);
    console.log(`   Query: "${button.query}"`);
    console.log(`   Icon: ${button.icon}`);
    console.log();
  });
  
  // Verify dashboard button is present
  const hasDashboard = buttons.some(b => 
    b.label.includes('Dashboard') || b.query.includes('dashboard')
  );
  
  if (hasDashboard) {
    console.log('✅ Dashboard button present');
  } else {
    console.log('❌ Dashboard button missing');
  }
  
  // Verify exactly one primary button
  const primaryCount = buttons.filter(b => b.primary === true).length;
  if (primaryCount === 1) {
    console.log('✅ Exactly one primary button');
  } else {
    console.log(`❌ Expected 1 primary button, found ${primaryCount}`);
  }
});

// Test specific requirements
console.log(`\n${'='.repeat(80)}`);
console.log('REQUIREMENT VERIFICATION');
console.log(`${'='.repeat(80)}\n`);

// Requirement 7.2: Terrain analysis buttons
console.log('Requirement 7.2: Terrain Analysis Buttons');
const terrainButtons = generateActionButtons('terrain_analysis', projectName);
console.log(`  Expected: "Optimize Layout" (primary) + "View Dashboard" (secondary)`);
console.log(`  Actual: "${terrainButtons[0].label}" (${terrainButtons[0].primary ? 'primary' : 'secondary'}) + "${terrainButtons[1].label}" (${terrainButtons[1].primary ? 'primary' : 'secondary'})`);
const terrainMatch = 
  terrainButtons[0].label === 'Optimize Layout' && terrainButtons[0].primary === true &&
  terrainButtons[1].label === 'View Dashboard' && terrainButtons[1].primary === false;
console.log(`  ${terrainMatch ? '✅ PASS' : '❌ FAIL'}\n`);

// Requirement 7.3: Wind farm layout buttons
console.log('Requirement 7.3: Wind Farm Layout Buttons');
const layoutButtons = generateActionButtons('wind_farm_layout', projectName);
console.log(`  Expected: "Run Wake Simulation" (primary) + "View Dashboard" + "Refine Layout"`);
console.log(`  Actual: "${layoutButtons[0].label}" (${layoutButtons[0].primary ? 'primary' : 'secondary'}) + "${layoutButtons[1].label}" + "${layoutButtons[2].label}"`);
const layoutMatch = 
  layoutButtons[0].label === 'Run Wake Simulation' && layoutButtons[0].primary === true &&
  layoutButtons[1].label === 'View Dashboard' && layoutButtons[1].primary === false &&
  layoutButtons[2].label === 'Refine Layout' && layoutButtons[2].primary === false;
console.log(`  ${layoutMatch ? '✅ PASS' : '❌ FAIL'}\n`);

// Requirement 7.4: Wake simulation buttons
console.log('Requirement 7.4: Wake Simulation Buttons');
const wakeButtons = generateActionButtons('wake_simulation', projectName);
console.log(`  Expected: "Generate Report" (primary) + "View Dashboard" + "Financial Analysis" + "Optimize Layout"`);
console.log(`  Actual: "${wakeButtons[0].label}" (${wakeButtons[0].primary ? 'primary' : 'secondary'}) + "${wakeButtons[1].label}" + "${wakeButtons[2].label}" + "${wakeButtons[3].label}"`);
const wakeMatch = 
  wakeButtons[0].label === 'Generate Report' && wakeButtons[0].primary === true &&
  wakeButtons[1].label === 'View Dashboard' && wakeButtons[1].primary === false &&
  wakeButtons[2].label === 'Financial Analysis' && wakeButtons[2].primary === false &&
  wakeButtons[3].label === 'Optimize Layout' && wakeButtons[3].primary === false;
console.log(`  ${wakeMatch ? '✅ PASS' : '❌ FAIL'}\n`);

// Requirement 7.4: Report generation buttons
console.log('Requirement 7.4: Report Generation Buttons');
const reportButtons = generateActionButtons('report_generation', projectName);
console.log(`  Expected: "View Dashboard" (primary) + "Export Report"`);
console.log(`  Actual: "${reportButtons[0].label}" (${reportButtons[0].primary ? 'primary' : 'secondary'}) + "${reportButtons[1].label}"`);
const reportMatch = 
  reportButtons[0].label === 'View Dashboard' && reportButtons[0].primary === true &&
  reportButtons[1].label === 'Export Report' && reportButtons[1].primary === false;
console.log(`  ${reportMatch ? '✅ PASS' : '❌ FAIL'}\n`);

// Summary
console.log(`${'='.repeat(80)}`);
console.log('SUMMARY');
console.log(`${'='.repeat(80)}\n`);

const allPass = terrainMatch && layoutMatch && wakeMatch && reportMatch;

if (allPass) {
  console.log('✅ ALL REQUIREMENTS VERIFIED');
  console.log('\nTask 7 is complete:');
  console.log('  ✅ Terrain analysis: "Optimize Layout" (primary) + "View Dashboard" (secondary)');
  console.log('  ✅ Wind farm layout: "Run Wake Simulation" (primary) + "View Dashboard" + "Refine Layout"');
  console.log('  ✅ Wake simulation: "Generate Report" (primary) + "View Dashboard" + "Financial Analysis" + "Optimize Layout"');
  console.log('  ✅ Report generation: "View Dashboard" (primary) + "Export Report"');
  console.log('\nDashboard access is now available at every step of the workflow!');
  process.exit(0);
} else {
  console.log('❌ SOME REQUIREMENTS FAILED');
  console.log('\nPlease review the output above for details.');
  process.exit(1);
}
