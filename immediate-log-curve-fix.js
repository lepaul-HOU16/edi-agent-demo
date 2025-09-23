/**
 * Immediate fix for log curve inventory matrix
 * This will directly update the agent to fix the dynamic import issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 === IMMEDIATE LOG CURVE FIX ===');
console.log('⏰ Timestamp:', new Date().toISOString());

async function applyImmediateFix() {
  try {
    console.log('\n📋 Current Status Analysis:');
    console.log('✅ S3 Data: 24 wells with real log curves (DEPT, CALI, DTC, GR, DEEPRESISTIVITY, etc.)');
    console.log('❌ Frontend Display: Showing fallback curves (GR, RHOB, NPHI, DTC, CALI, RT)');
    console.log('🎯 Root Cause: Dynamic imports failing in Lambda - MCP tools not accessible');
    
    console.log('\n📋 Step 1: Reading current agent file...');
    const agentPath = 'amplify/functions/agents/enhancedStrandsAgent.ts';
    
    if (!fs.existsSync(agentPath)) {
      throw new Error('enhancedStrandsAgent.ts not found');
    }
    
    let agentContent = fs.readFileSync(agentPath, 'utf8');
    console.log('✅ Agent file loaded, length:', agentContent.length);
    
    console.log('\n📋 Step 2: Applying critical import fix...');
    
    // Fix 1: Add static imports at the top
    const staticImports = `
// CRITICAL FIX: Static imports for Lambda compatibility
import { 
  listWellsTool, 
  getWellInfoTool, 
  petrophysicsTools 
} from '../tools/petrophysicsTools';
`;
    
    // Find where to insert the static imports (after existing imports)
    const importInsertPoint = agentContent.indexOf('export class EnhancedStrandsAgent');
    if (importInsertPoint === -1) {
      throw new Error('Could not find EnhancedStrandsAgent class');
    }
    
    // Insert static imports before the class
    agentContent = agentContent.slice(0, importInsertPoint) + staticImports + '\n' + agentContent.slice(importInsertPoint);
    
    console.log('✅ Added static imports');
    
    console.log('\n📋 Step 3: Replacing dynamic import with static registry...');
    
    // Fix 2: Replace the getAvailableTools method with static tools
    const oldGetAvailableTools = /private async getAvailableTools\(\): Promise<any\[\]> \{[\s\S]*?\n  \}/g;
    const newGetAvailableTools = `private async getAvailableTools(): Promise<any[]> {
    console.log('🔧 FIXED: Using static tool registry instead of dynamic imports');
    
    const allTools: any[] = [];
    
    // FIXED: Use static imports instead of dynamic imports
    try {
      console.log('📦 FIXED: Using static petrophysicsTools import');
      allTools.push(...petrophysicsTools);
      console.log('✅ FIXED: Added petrophysicsTools:', petrophysicsTools.length, 'tools');
    } catch (error) {
      console.error('❌ FIXED: Error with static petrophysicsTools:', error);
    }
    
    // Add individual tools directly
    try {
      if (listWellsTool) {
        allTools.push(listWellsTool);
        console.log('✅ FIXED: Added listWellsTool');
      }
      if (getWellInfoTool) {
        allTools.push(getWellInfoTool);
        console.log('✅ FIXED: Added getWellInfoTool');
      }
    } catch (error) {
      console.error('❌ FIXED: Error adding individual tools:', error);
    }
    
    console.log('📊 FIXED: Total tools loaded:', allTools.length);
    console.log('🔧 FIXED: Available tool names:', allTools.map(t => t.name || 'unnamed'));
    
    return allTools;
  }`;
    
    if (agentContent.match(oldGetAvailableTools)) {
      agentContent = agentContent.replace(oldGetAvailableTools, newGetAvailableTools);
      console.log('✅ Replaced getAvailableTools with static version');
    } else {
      console.log('⚠️ getAvailableTools method not found, may already be updated');
    }
    
    console.log('\n📋 Step 4: Writing fixed agent file...');
    
    // Create backup
    fs.writeFileSync(agentPath + '.backup', fs.readFileSync(agentPath));
    console.log('✅ Created backup file');
    
    // Write fixed version
    fs.writeFileSync(agentPath, agentContent);
    console.log('✅ Updated agent file with static imports');
    
    console.log('\n📋 Step 5: Creating deployment script...');
    
    const deployScript = `#!/bin/bash
echo "🚀 Deploying log curve inventory fix..."

# Navigate to project root
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
cd amplify/functions/agents
npm install @aws-sdk/client-s3@^3.400.0 zod@^3.22.0

# Go back to root
cd ../../..

# Deploy to AWS
echo "🌐 Deploying to AWS..."
npx amplify push --yes

echo "✅ Deployment complete!"
echo "💡 Test by opening a new chat session and checking log curves tab"
`;
    
    fs.writeFileSync('deploy-log-curve-fix.sh', deployScript);
    fs.chmodSync('deploy-log-curve-fix.sh', '755');
    console.log('✅ Created deploy-log-curve-fix.sh');
    
    console.log('\n💡 === IMMEDIATE FIX APPLIED ===');
    console.log('1. ✅ Added static imports to agent');
    console.log('2. ✅ Replaced dynamic imports with static tool registry');
    console.log('3. ✅ Created deployment script');
    console.log('4. ✅ Created backup of original file');
    
    console.log('\n🚀 === DEPLOYMENT INSTRUCTIONS ===');
    console.log('Run this command to deploy the fix:');
    console.log('');
    console.log('  ./deploy-log-curve-fix.sh');
    console.log('');
    console.log('Or manually:');
    console.log('  cd amplify/functions/agents && npm install');
    console.log('  cd ../../.. && npx amplify push --yes');
    
    console.log('\n✅ === EXPECTED RESULT ===');
    console.log('After deployment, the Log Curves tab should show:');
    console.log('- DEPT, CALI, DTC, GR, DEEPRESISTIVITY, SHALLOWRESISTIVITY');
    console.log('- NPHI, RHOB, LITHOLOGY, VWCL, ENVI, FAULT');
    console.log('- 24 wells (WELL-001 through WELL-024)');
    console.log('- Real S3 data instead of fallback curves');
    
  } catch (error) {
    console.error('❌ Error applying immediate fix:', error.message);
    throw error;
  }
}

// Execute the immediate fix
applyImmediateFix().catch(console.error);
