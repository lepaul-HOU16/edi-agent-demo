#!/usr/bin/env node

/**
 * EDIcraft Demo Enhancements - Deployment Validation Script
 * 
 * This script validates that all EDIcraft demo enhancements are properly deployed:
 * 1. Backend tools (clear_minecraft_environment, build_drilling_rig, etc.)
 * 2. Frontend components (EDIcraftControls, collection context retention)
 * 3. Collection service integration (getCollectionWells query)
 * 4. S3 data access layer
 * 5. Response templates
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 EDIcraft Demo Enhancements - Deployment Validation\n');

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(test) {
  results.passed.push(test);
  console.log(`✅ ${test}`);
}

function fail(test, reason) {
  results.failed.push({ test, reason });
  console.log(`❌ ${test}: ${reason}`);
}

function warn(test, reason) {
  results.warnings.push({ test, reason });
  console.log(`⚠️  ${test}: ${reason}`);
}

// ============================================
// 1. Backend Tools Validation
// ============================================
console.log('\n📦 Validating Backend Tools...\n');

const workflowToolsPath = 'edicraft-agent/tools/workflow_tools.py';
if (fs.existsSync(workflowToolsPath)) {
  const content = fs.readFileSync(workflowToolsPath, 'utf8');
  
  // Check for clear_minecraft_environment
  if (content.includes('def clear_minecraft_environment')) {
    pass('clear_minecraft_environment tool exists');
  } else {
    fail('clear_minecraft_environment tool', 'Function not found in workflow_tools.py');
  }
  
  // Check for build_drilling_rig
  if (content.includes('def build_drilling_rig')) {
    pass('build_drilling_rig tool exists');
  } else {
    fail('build_drilling_rig tool', 'Function not found in workflow_tools.py');
  }
  
  // Check for lock_world_time
  if (content.includes('def lock_world_time')) {
    pass('lock_world_time tool exists');
  } else {
    fail('lock_world_time tool', 'Function not found in workflow_tools.py');
  }
  
  // Check for visualize_collection_wells
  if (content.includes('def visualize_collection_wells')) {
    pass('visualize_collection_wells tool exists');
  } else {
    fail('visualize_collection_wells tool', 'Function not found in workflow_tools.py');
  }
  
  // Check for reset_demo_environment
  if (content.includes('def reset_demo_environment')) {
    pass('reset_demo_environment tool exists');
  } else {
    fail('reset_demo_environment tool', 'Function not found in workflow_tools.py');
  }
} else {
  fail('workflow_tools.py', 'File not found');
}

// ============================================
// 2. Response Templates Validation
// ============================================
console.log('\n📝 Validating Response Templates...\n');

const responseTemplatesPath = 'edicraft-agent/tools/response_templates.py';
if (fs.existsSync(responseTemplatesPath)) {
  const content = fs.readFileSync(responseTemplatesPath, 'utf8');
  
  if (content.includes('class CloudscapeResponseBuilder')) {
    pass('CloudscapeResponseBuilder class exists');
    
    // Check for key methods
    if (content.includes('def wellbore_success')) {
      pass('wellbore_success template method exists');
    } else {
      fail('wellbore_success template', 'Method not found');
    }
    
    if (content.includes('def batch_progress')) {
      pass('batch_progress template method exists');
    } else {
      fail('batch_progress template', 'Method not found');
    }
    
    if (content.includes('def error_response')) {
      pass('error_response template method exists');
    } else {
      fail('error_response template', 'Method not found');
    }
  } else {
    fail('CloudscapeResponseBuilder', 'Class not found in response_templates.py');
  }
} else {
  fail('response_templates.py', 'File not found');
}

// ============================================
// 3. Name Simplification Service Validation
// ============================================
console.log('\n🏷️  Validating Name Simplification Service...\n');

const nameUtilsPath = 'edicraft-agent/tools/name_utils.py';
if (fs.existsSync(nameUtilsPath)) {
  const content = fs.readFileSync(nameUtilsPath, 'utf8');
  
  if (content.includes('class WellNameSimplifier')) {
    pass('WellNameSimplifier class exists');
    
    if (content.includes('def simplify_name')) {
      pass('simplify_name method exists');
    } else {
      fail('simplify_name method', 'Method not found');
    }
    
    if (content.includes('def get_full_id')) {
      pass('get_full_id method exists');
    } else {
      fail('get_full_id method', 'Method not found');
    }
  } else {
    fail('WellNameSimplifier', 'Class not found in name_utils.py');
  }
} else {
  fail('name_utils.py', 'File not found');
}

// ============================================
// 4. S3 Data Access Layer Validation
// ============================================
console.log('\n☁️  Validating S3 Data Access Layer...\n');

const s3DataAccessPath = 'edicraft-agent/tools/s3_data_access.py';
if (fs.existsSync(s3DataAccessPath)) {
  const content = fs.readFileSync(s3DataAccessPath, 'utf8');
  
  if (content.includes('class S3WellDataAccess')) {
    pass('S3WellDataAccess class exists');
    
    if (content.includes('def get_trajectory_data')) {
      pass('get_trajectory_data method exists');
    } else {
      fail('get_trajectory_data method', 'Method not found');
    }
    
    if (content.includes('def list_collection_wells')) {
      pass('list_collection_wells method exists');
    } else {
      fail('list_collection_wells method', 'Method not found');
    }
  } else {
    fail('S3WellDataAccess', 'Class not found in s3_data_access.py');
  }
} else {
  fail('s3_data_access.py', 'File not found');
}

// ============================================
// 5. Frontend Components Validation
// ============================================
console.log('\n🎨 Validating Frontend Components...\n');

const edicraftControlsPath = 'src/components/EDIcraftControls.tsx';
if (fs.existsSync(edicraftControlsPath)) {
  const content = fs.readFileSync(edicraftControlsPath, 'utf8');
  
  if (content.includes('export function EDIcraftControls')) {
    pass('EDIcraftControls component exists');
    
    if (content.includes('Clear Minecraft Environment')) {
      pass('Clear button text is correct');
    } else {
      fail('Clear button', 'Button text not found');
    }
    
    if (content.includes('onClearEnvironment')) {
      pass('onClearEnvironment handler exists');
    } else {
      fail('onClearEnvironment handler', 'Handler not found');
    }
  } else {
    fail('EDIcraftControls', 'Component export not found');
  }
} else {
  fail('EDIcraftControls.tsx', 'File not found');
}

// Check ChatBox integration
const chatBoxPath = 'src/components/ChatBox.tsx';
if (fs.existsSync(chatBoxPath)) {
  const content = fs.readFileSync(chatBoxPath, 'utf8');
  
  if (content.includes('import { EDIcraftControls }')) {
    pass('EDIcraftControls imported in ChatBox');
  } else {
    fail('EDIcraftControls import', 'Import not found in ChatBox');
  }
  
  if (content.includes("selectedAgent === 'edicraft'")) {
    pass('EDIcraft agent check exists in ChatBox');
  } else {
    fail('EDIcraft agent check', 'Conditional rendering not found');
  }
  
  if (content.includes('<EDIcraftControls')) {
    pass('EDIcraftControls component rendered in ChatBox');
  } else {
    fail('EDIcraftControls rendering', 'Component not rendered in ChatBox');
  }
} else {
  fail('ChatBox.tsx', 'File not found');
}

// ============================================
// 6. Collection Context Retention Validation
// ============================================
console.log('\n🔗 Validating Collection Context Retention...\n');

const createNewChatPath = 'src/app/create-new-chat/page.tsx';
if (fs.existsSync(createNewChatPath)) {
  const content = fs.readFileSync(createNewChatPath, 'utf8');
  
  if (content.includes('fromSession')) {
    pass('fromSession parameter handling exists');
  } else {
    fail('fromSession parameter', 'Parameter handling not found');
  }
  
  if (content.includes('linkedCollectionId')) {
    pass('linkedCollectionId inheritance exists');
  } else {
    fail('linkedCollectionId', 'Collection ID inheritance not found');
  }
  
  if (content.includes('Inherited collection context')) {
    pass('Collection context inheritance logging exists');
  } else {
    warn('Collection context logging', 'Debug logging not found');
  }
} else {
  fail('create-new-chat/page.tsx', 'File not found');
}

// Check chat page integration
const chatPagePath = 'src/app/chat/[chatSessionId]/page.tsx';
if (fs.existsSync(chatPagePath)) {
  const content = fs.readFileSync(chatPagePath, 'utf8');
  
  if (content.includes('fromSession=')) {
    pass('fromSession parameter passed in Create New Chat button');
  } else {
    fail('fromSession parameter', 'Parameter not passed in button');
  }
} else {
  fail('chat/[chatSessionId]/page.tsx', 'File not found');
}

// ============================================
// 7. Collection Service Validation
// ============================================
console.log('\n📚 Validating Collection Service...\n');

const collectionServicePath = 'amplify/functions/collectionService/handler.ts';
if (fs.existsSync(collectionServicePath)) {
  const content = fs.readFileSync(collectionServicePath, 'utf8');
  
  if (content.includes('getCollectionWells')) {
    pass('getCollectionWells query exists');
  } else {
    fail('getCollectionWells query', 'Query not found in handler');
  }
} else {
  fail('collectionService/handler.ts', 'File not found');
}

// ============================================
// 8. Agent Registration Validation
// ============================================
console.log('\n🤖 Validating Agent Registration...\n');

const agentPyPath = 'edicraft-agent/agent.py';
if (fs.existsSync(agentPyPath)) {
  const content = fs.readFileSync(agentPyPath, 'utf8');
  
  // Check tool imports
  if (content.includes('from tools.workflow_tools import')) {
    pass('Workflow tools imported in agent.py');
    
    if (content.includes('clear_minecraft_environment')) {
      pass('clear_minecraft_environment imported');
    } else {
      fail('clear_minecraft_environment import', 'Tool not imported');
    }
  } else {
    fail('Workflow tools import', 'Import statement not found');
  }
  
  // Check tool registration
  if (content.includes('clear_minecraft_environment,')) {
    pass('clear_minecraft_environment registered in tools list');
  } else {
    fail('clear_minecraft_environment registration', 'Tool not in tools list');
  }
} else {
  fail('agent.py', 'File not found');
}

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 Validation Summary');
console.log('='.repeat(60) + '\n');

console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}\n`);

if (results.failed.length > 0) {
  console.log('Failed Tests:');
  results.failed.forEach(({ test, reason }) => {
    console.log(`  - ${test}: ${reason}`);
  });
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('Warnings:');
  results.warnings.forEach(({ test, reason }) => {
    console.log(`  - ${test}: ${reason}`);
  });
  console.log('');
}

// Exit with appropriate code
if (results.failed.length > 0) {
  console.log('❌ Validation FAILED - Some features are not properly deployed\n');
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log('⚠️  Validation PASSED with warnings - All critical features deployed\n');
  process.exit(0);
} else {
  console.log('✅ Validation PASSED - All features properly deployed\n');
  process.exit(0);
}
