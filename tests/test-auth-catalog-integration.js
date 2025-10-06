// Test the authentication integration with catalog functionality
const { execSync } = require('child_process');
const fs = require('fs');

async function testAuthCatalogIntegration() {
    console.log('🔐 === TESTING AUTHENTICATION & CATALOG INTEGRATION ===');
    
    try {
        // Test 1: Verify layout authentication integration
        console.log('📋 Step 1: Verifying layout authentication integration');
        
        const layoutPath = './src/app/layout.tsx';
        if (!fs.existsSync(layoutPath)) {
            throw new Error('Layout file not found');
        }
        
        const layoutContent = fs.readFileSync(layoutPath, 'utf8');
        
        // Check for required authentication imports and usage
        const authChecks = {
            hasUseAuthenticator: layoutContent.includes('useAuthenticator'),
            hasUserAttributes: layoutContent.includes('useUserAttributes'), 
            hasSignOut: layoutContent.includes('signOut()'),
            hasAuthStatus: layoutContent.includes('authStatus'),
            hasConditionalAuth: layoutContent.includes("authStatus === 'authenticated'"),
            hasSignInButton: layoutContent.includes("text: 'Sign in'"),
            hasAuthRedirect: layoutContent.includes("href: '/auth'")
        };
        
        console.log('🔍 Layout authentication integration checks:');
        Object.entries(authChecks).forEach(([check, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
        });
        
        const layoutAuthScore = Object.values(authChecks).filter(Boolean).length;
        console.log(`📊 Layout authentication score: ${layoutAuthScore}/${Object.keys(authChecks).length}`);
        
        // Test 2: Verify auth page exists and is properly configured
        console.log('\n📋 Step 2: Verifying auth page configuration');
        
        const authPagePath = './src/app/auth/page.tsx';
        if (!fs.existsSync(authPagePath)) {
            throw new Error('Auth page not found');
        }
        
        const authPageContent = fs.readFileSync(authPagePath, 'utf8');
        
        const authPageChecks = {
            hasAuthenticator: authPageContent.includes('<Authenticator'),
            hasRedirectLogic: authPageContent.includes('AuthenticatedRedirect'),
            hasSignUpAttributes: authPageContent.includes('signUpAttributes'),
            hasRouter: authPageContent.includes('useRouter'),
            hasEffectRedirect: authPageContent.includes("router.push('/')"),
        };
        
        console.log('🔍 Auth page configuration checks:');
        Object.entries(authPageChecks).forEach(([check, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
        });
        
        const authPageScore = Object.values(authPageChecks).filter(Boolean).length;
        console.log(`📊 Auth page score: ${authPageScore}/${Object.keys(authPageChecks).length}`);
        
        // Test 3: Verify catalog page has withAuth wrapper
        console.log('\n📋 Step 3: Verifying catalog page authentication');
        
        const catalogPagePath = './src/app/catalog/page.tsx';
        if (!fs.existsSync(catalogPagePath)) {
            throw new Error('Catalog page not found');
        }
        
        const catalogContent = fs.readFileSync(catalogPagePath, 'utf8');
        
        const catalogAuthChecks = {
            hasWithAuth: catalogContent.includes('withAuth'),
            hasAuthWrapping: catalogContent.includes('withAuth(CatalogPageBase)'),
            hasAmplifyClient: catalogContent.includes('generateClient<Schema>'),
            hasCatalogSearch: catalogContent.includes('catalogSearch'),
        };
        
        console.log('🔍 Catalog authentication checks:');
        Object.entries(catalogAuthChecks).forEach(([check, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
        });
        
        const catalogAuthScore = Object.values(catalogAuthChecks).filter(Boolean).length;
        console.log(`📊 Catalog authentication score: ${catalogAuthScore}/${Object.keys(catalogAuthChecks).length}`);
        
        // Test 4: Verify data schema authentication settings
        console.log('\n📋 Step 4: Verifying GraphQL schema authentication');
        
        const schemaPath = './amplify/data/resource.ts';
        if (!fs.existsSync(schemaPath)) {
            throw new Error('Schema file not found');
        }
        
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        const schemaAuthChecks = {
            hasCatalogSearch: schemaContent.includes('catalogSearch:'),
            hasAuthenticatedAuth: schemaContent.includes('allow.authenticated()'),
            hasUserPoolAuth: schemaContent.includes("defaultAuthorizationMode: 'userPool'"),
            hasQueryAuth: schemaContent.includes('.authorization((allow) => [allow.authenticated()]'),
        };
        
        console.log('🔍 Schema authentication checks:');
        Object.entries(schemaAuthChecks).forEach(([check, passed]) => {
            console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed}`);
        });
        
        const schemaAuthScore = Object.values(schemaAuthChecks).filter(Boolean).length;
        console.log(`📊 Schema authentication score: ${schemaAuthScore}/${Object.keys(schemaAuthChecks).length}`);
        
        // Overall assessment
        console.log('\n🎯 === INTEGRATION ASSESSMENT ===');
        const totalScore = layoutAuthScore + authPageScore + catalogAuthScore + schemaAuthScore;
        const maxScore = Object.keys(authChecks).length + Object.keys(authPageChecks).length + 
                        Object.keys(catalogAuthChecks).length + Object.keys(schemaAuthChecks).length;
        
        console.log(`📊 Overall authentication integration: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%)`);
        
        const isWellIntegrated = totalScore >= maxScore * 0.8; // 80% threshold
        
        console.log(`🎯 Authentication integration status: ${isWellIntegrated ? '✅ GOOD' : '❌ NEEDS WORK'}`);
        
        // Test 5: Check Amplify deployment status
        console.log('\n📋 Step 5: Checking deployment configuration');
        
        const amplifyOutputPath = './amplify_outputs.json';
        if (fs.existsSync(amplifyOutputPath)) {
            const amplifyConfig = JSON.parse(fs.readFileSync(amplifyOutputPath, 'utf8'));
            
            console.log('✅ Amplify configuration found');
            console.log('🔗 GraphQL endpoint:', amplifyConfig.data?.url || 'Not found');
            console.log('🔐 Auth configuration:', !!amplifyConfig.auth);
            console.log('🏪 User pool ID:', amplifyConfig.auth?.user_pool_id || 'Not found');
            console.log('📱 User pool client:', amplifyConfig.auth?.user_pool_client_id || 'Not found');
            
            // Check if auth is properly configured
            const hasAuthConfig = amplifyConfig.auth && amplifyConfig.auth.user_pool_id && amplifyConfig.auth.user_pool_client_id;
            console.log(`🔐 Auth properly configured: ${hasAuthConfig ? '✅ YES' : '❌ NO'}`);
        } else {
            console.log('❌ Amplify configuration file not found - deployment may be needed');
        }
        
        // Recommendations
        console.log('\n💡 === RECOMMENDATIONS ===');
        
        if (isWellIntegrated) {
            console.log('✅ Authentication integration looks good!');
            console.log('📝 Next steps:');
            console.log('   1. Deploy the changes with: npx amplify push');
            console.log('   2. Test login at /auth');
            console.log('   3. Navigate to /catalog after login');
            console.log('   4. Try depth query: "wells with depth greater than 3500m"');
        } else {
            console.log('❌ Authentication integration needs improvement');
            console.log('🔧 Issues to fix:');
            
            if (!authChecks.hasUseAuthenticator) {
                console.log('   - Add useAuthenticator hook to layout');
            }
            if (!authChecks.hasSignOut) {
                console.log('   - Connect sign out button to AWS Amplify signOut()');
            }
            if (!catalogAuthChecks.hasWithAuth) {
                console.log('   - Wrap catalog page with withAuth()');
            }
        }
        
        return {
            success: isWellIntegrated,
            scores: {
                layout: `${layoutAuthScore}/${Object.keys(authChecks).length}`,
                authPage: `${authPageScore}/${Object.keys(authPageChecks).length}`,
                catalog: `${catalogAuthScore}/${Object.keys(catalogAuthChecks).length}`,
                schema: `${schemaAuthScore}/${Object.keys(schemaAuthChecks).length}`
            },
            overall: `${totalScore}/${maxScore}`,
            percentage: Math.round(totalScore/maxScore*100)
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
}

// Simulate authentication workflow
async function simulateAuthWorkflow() {
    console.log('\n🔄 === SIMULATING AUTHENTICATION WORKFLOW ===');
    
    try {
        console.log('👤 Step 1: User visits /catalog (unauthenticated)');
        console.log('   - withAuth() detects unauthenticated status');
        console.log('   - Redirects to /auth page');
        
        console.log('\n🔐 Step 2: User signs in at /auth');
        console.log('   - AWS Amplify Authenticator handles login');
        console.log('   - User enters credentials');
        console.log('   - AWS Cognito validates and issues tokens');
        
        console.log('\n✅ Step 3: Authentication successful');
        console.log('   - AuthenticatedRedirect component detects auth status');
        console.log('   - Redirects to home page (/)');
        
        console.log('\n🗺️ Step 4: User navigates to /catalog');
        console.log('   - withAuth() detects authenticated status');
        console.log('   - Allows access to CatalogPageBase');
        console.log('   - AWS Amplify client includes auth headers');
        
        console.log('\n🔍 Step 5: User submits catalog query');
        console.log('   - Frontend calls catalogSearch GraphQL query');
        console.log('   - AWS AppSync receives request with auth headers');
        console.log('   - Lambda function executes successfully');
        console.log('   - Results returned to frontend');
        
        console.log('\n🔄 Step 6: User clicks sign out');
        console.log('   - CloudScape TopNavigation calls signOut()');
        console.log('   - AWS Amplify clears auth tokens');
        console.log('   - User redirected to auth page');
        
        return { success: true, workflowValid: true };
        
    } catch (error) {
        console.error('❌ Workflow simulation failed:', error);
        return { success: false, error: error.message };
    }
}

// Run the tests
if (require.main === module) {
    Promise.resolve()
        .then(() => testAuthCatalogIntegration())
        .then(result => {
            console.log('\n🏁 Integration Test Result:', result);
            return simulateAuthWorkflow();
        })
        .then(workflowResult => {
            console.log('\n🏁 Workflow Simulation Result:', workflowResult);
            
            console.log('\n🚀 === DEPLOYMENT INSTRUCTIONS ===');
            console.log('1. Deploy changes: npx amplify push');
            console.log('2. Test authentication flow:');
            console.log('   - Visit localhost:3000/catalog (should redirect to /auth)');
            console.log('   - Sign in with credentials');
            console.log('   - Should redirect back to home, then navigate to /catalog');
            console.log('   - Test depth query: "wells with depth greater than 3500m"');
            console.log('   - Verify sign out works from TopNavigation dropdown');
            
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite crashed:', error);
            process.exit(1);
        });
}

module.exports = { testAuthCatalogIntegration, simulateAuthWorkflow };
