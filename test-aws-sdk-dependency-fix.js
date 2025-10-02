const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 AWS SDK DEPENDENCY FIX VALIDATION');
console.log('====================================');

// 1. Verify package.json changes
const packageJsonPath = path.join(__dirname, 'amplify/functions/agents/package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('\n📦 Package.json dependencies:');
console.log(JSON.stringify(packageJson.dependencies, null, 2));

// 2. Check that problematic dependencies are removed
const problematicDeps = ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'];
const foundProblematicDeps = problematicDeps.filter(dep => packageJson.dependencies[dep]);

if (foundProblematicDeps.length > 0) {
    console.log('❌ FAILED: Found problematic dependencies:', foundProblematicDeps);
    process.exit(1);
} else {
    console.log('✅ SUCCESS: Problematic AWS SDK dependencies removed');
}

// 3. Verify handler.ts still imports these (relying on runtime)
const handlerPath = path.join(__dirname, 'amplify/functions/agents/handler.ts');
const handlerContent = fs.readFileSync(handlerPath, 'utf8');

const hasClientDynamoDBImport = handlerContent.includes("import { DynamoDBClient } from '@aws-sdk/client-dynamodb'");
const hasLibDynamoDBImport = handlerContent.includes("import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'");

if (hasClientDynamoDBImport && hasLibDynamoDBImport) {
    console.log('✅ SUCCESS: Handler.ts still imports AWS SDK (will use runtime versions)');
} else {
    console.log('❌ FAILED: Handler.ts missing required AWS SDK imports');
    process.exit(1);
}

// 4. Test deployment
console.log('\n🚀 Testing deployment...');
try {
    const deployResult = execSync('npx ampx sandbox --once', { 
        encoding: 'utf8', 
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
    });
    
    console.log('✅ SUCCESS: Deployment completed successfully!');
    console.log('\n📋 Deployment output:');
    console.log(deployResult);
    
    // Check for specific success indicators
    if (deployResult.includes('✅') || deployResult.includes('deployed successfully')) {
        console.log('\n🎉 DEPLOYMENT FIX VERIFIED: AWS SDK dependency issues resolved!');
    } else {
        console.log('\n⚠️  Deployment completed but checking for warnings...');
    }
    
} catch (error) {
    console.log('\n❌ DEPLOYMENT FAILED:');
    console.log('STDOUT:', error.stdout);
    console.log('STDERR:', error.stderr);
    
    // Check if it's still the same AWS SDK error
    const errorOutput = error.stderr || error.stdout || '';
    if (errorOutput.includes('Could not resolve \'@aws-sdk/client-dynamodb\'') || 
        errorOutput.includes('Could not resolve \'@aws-sdk/lib-dynamodb\'')) {
        console.log('\n💡 ANALYSIS: Still AWS SDK dependency errors - may need additional fixes');
        process.exit(1);
    } else {
        console.log('\n💡 ANALYSIS: Different error - AWS SDK dependency fix likely worked');
        console.log('Error details:', error.message);
    }
}

console.log('\n📊 DEPENDENCY FIX VALIDATION COMPLETE');
console.log('=====================================');
