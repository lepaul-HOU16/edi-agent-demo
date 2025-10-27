#!/usr/bin/env node

/**
 * Task 4: Verify Agent System Prompts
 * 
 * This script verifies that all agent system prompts contain the required elements
 * to guide intelligent decision-making.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPromptRequirements(agentName, filePath, requirements) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`Checking ${agentName} System Prompt`, 'bold');
  log('='.repeat(60), 'blue');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract system prompt
    const promptMatch = content.match(/system_prompt\s*=\s*"""([\s\S]*?)"""/);
    if (!promptMatch) {
      log(`❌ No system_prompt found in ${agentName}`, 'red');
      return false;
    }
    
    const systemPrompt = promptMatch[1];
    let allPassed = true;
    
    log(`\n📋 Checking ${requirements.length} requirements:\n`);
    
    requirements.forEach((req, index) => {
      const passed = req.check(systemPrompt);
      const status = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      
      log(`${status} ${index + 1}. ${req.description}`, color);
      
      if (!passed && req.hint) {
        log(`   💡 Hint: ${req.hint}`, 'yellow');
      }
      
      allPassed = allPassed && passed;
    });
    
    log(`\n${'─'.repeat(60)}`);
    if (allPassed) {
      log(`✅ ${agentName} system prompt: ALL CHECKS PASSED`, 'green');
    } else {
      log(`❌ ${agentName} system prompt: SOME CHECKS FAILED`, 'red');
    }
    
    return allPassed;
    
  } catch (error) {
    log(`❌ Error reading ${agentName}: ${error.message}`, 'red');
    return false;
  }
}

// Task 4.1: Terrain Agent Requirements
const terrainRequirements = [
  {
    description: 'Explains project_id requirement',
    check: (prompt) => prompt.includes('project_id') && prompt.includes('MUST be provided'),
    hint: 'Should explain that project_id is mandatory'
  },
  {
    description: 'Describes unbuildable areas analysis workflow',
    check: (prompt) => prompt.includes('unbuildable') && prompt.includes('workflow'),
    hint: 'Should describe the analysis workflow for identifying exclusion zones'
  },
  {
    description: 'Includes response footer format guidance',
    check: (prompt) => prompt.includes('Response Footer') && prompt.includes('Project ID'),
    hint: 'Should specify the footer format with project_id'
  },
  {
    description: 'Explains what the agent does',
    check: (prompt) => prompt.includes('terrain analysis') || prompt.includes('site assessment'),
    hint: 'Should clearly state the agent\'s purpose'
  },
  {
    description: 'Describes safety setbacks and buffer zones',
    check: (prompt) => prompt.includes('setback') && prompt.includes('buffer'),
    hint: 'Should explain setback distances and safety zones'
  }
];

// Task 4.2: Layout Agent Requirements
const layoutRequirements = [
  {
    description: 'Explains all 4 layout algorithms',
    check: (prompt) => {
      const algorithms = ['grid', 'greedy', 'spiral', 'offset'];
      return algorithms.every(alg => prompt.toLowerCase().includes(alg));
    },
    hint: 'Should describe grid, greedy, spiral, and offset-grid algorithms'
  },
  {
    description: 'Describes auto_relocate behavior',
    check: (prompt) => prompt.includes('auto_relocate') || prompt.includes('relocate'),
    hint: 'Should explain automatic turbine relocation for conflicts'
  },
  {
    description: 'Includes explore_alternative_sites warning',
    check: (prompt) => prompt.includes('explore_alternative_sites') || prompt.includes('alternative sites'),
    hint: 'Should warn about using explore_alternative_sites'
  },
  {
    description: 'Provides decision-making process guidance',
    check: (prompt) => prompt.includes('decision') || prompt.includes('choose') || prompt.includes('select'),
    hint: 'Should guide the agent on how to choose algorithms'
  },
  {
    description: 'Specifies response footer with turbine count',
    check: (prompt) => prompt.includes('Response Footer') || prompt.includes('turbine'),
    hint: 'Should specify footer format with turbine count'
  },
  {
    description: 'Explains project_id requirement',
    check: (prompt) => prompt.includes('project_id') && prompt.includes('MUST be provided'),
    hint: 'Should explain that project_id is mandatory'
  }
];

// Task 4.3: Simulation Agent Requirements
const simulationRequirements = [
  {
    description: 'Explains PyWake simulation',
    check: (prompt) => prompt.includes('PyWake') || prompt.includes('wake simulation'),
    hint: 'Should describe PyWake-based wake modeling'
  },
  {
    description: 'Describes economic analysis',
    check: (prompt) => prompt.includes('economic') || prompt.includes('financial'),
    hint: 'Should explain economic viability assessment'
  },
  {
    description: 'Explains GeoJSON input processing',
    check: (prompt) => prompt.includes('GeoJSON') || prompt.includes('layout'),
    hint: 'Should describe how turbine layout data is processed'
  },
  {
    description: 'Describes performance metrics',
    check: (prompt) => prompt.includes('performance') && (prompt.includes('AEP') || prompt.includes('capacity factor')),
    hint: 'Should explain key performance metrics like AEP and capacity factor'
  },
  {
    description: 'Specifies response footer with simulation_id',
    check: (prompt) => prompt.includes('Response Footer') || prompt.includes('simulation'),
    hint: 'Should specify footer format with simulation_id'
  },
  {
    description: 'Explains project_id requirement',
    check: (prompt) => prompt.includes('project_id') && prompt.includes('MUST be provided'),
    hint: 'Should explain that project_id is mandatory'
  }
];

// Task 4.4: Report Agent Requirements
const reportRequirements = [
  {
    description: 'Describes report generation capabilities',
    check: (prompt) => prompt.includes('report') && prompt.includes('PDF'),
    hint: 'Should explain PDF report generation'
  },
  {
    description: 'Explains output formats',
    check: (prompt) => prompt.includes('PDF') || prompt.includes('format'),
    hint: 'Should describe available output formats'
  },
  {
    description: 'Specifies data requirements',
    check: (prompt) => prompt.includes('data') && (prompt.includes('load') || prompt.includes('file')),
    hint: 'Should explain what data is needed for reports'
  },
  {
    description: 'Lists available tools',
    check: (prompt) => prompt.includes('Available Tools') || prompt.includes('tools'),
    hint: 'Should list the tools available for report generation'
  },
  {
    description: 'Explains project_id requirement',
    check: (prompt) => prompt.includes('project_id') && prompt.includes('MUST be provided'),
    hint: 'Should explain that project_id is mandatory'
  }
];

async function main() {
  log('\n🔬 Task 4: Agent System Prompt Verification', 'bold');
  log('='.repeat(60), 'blue');
  
  const agentsDir = 'amplify/functions/renewableAgents';
  
  const results = {
    terrain: checkPromptRequirements(
      'Terrain Agent',
      path.join(agentsDir, 'terrain_agent.py'),
      terrainRequirements
    ),
    layout: checkPromptRequirements(
      'Layout Agent',
      path.join(agentsDir, 'layout_agent.py'),
      layoutRequirements
    ),
    simulation: checkPromptRequirements(
      'Simulation Agent',
      path.join(agentsDir, 'simulation_agent.py'),
      simulationRequirements
    ),
    report: checkPromptRequirements(
      'Report Agent',
      path.join(agentsDir, 'report_agent.py'),
      reportRequirements
    )
  };
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 SUMMARY', 'bold');
  log('='.repeat(60), 'blue');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([agent, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent`, color);
  });
  
  log('\n' + '='.repeat(60), 'blue');
  
  if (allPassed) {
    log('✅ ALL AGENT SYSTEM PROMPTS VERIFIED', 'green');
    log('✅ Task 4 Complete: All agents have comprehensive system prompts', 'green');
    process.exit(0);
  } else {
    log('❌ SOME AGENT SYSTEM PROMPTS NEED IMPROVEMENT', 'red');
    log('⚠️  Task 4 Incomplete: Review failed checks above', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkPromptRequirements };
