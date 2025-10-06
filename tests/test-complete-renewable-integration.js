const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const amplifyOutputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

/**
 * Comprehensive Renewable Energy Integration Validation
 * Tests complete end-to-end workflow: Terrain → Layout → Simulation
 */

async function testCompleteRenewableIntegration() {
    console.log('🔄 Testing Complete Renewable Energy Integration...\n');
    
    const testCases = [
        {
            name: 'Phase 1: Terrain Analysis',
            message: 'Analyze terrain suitability for wind farm development at coordinates 32.7767, -96.7970 (Dallas, TX area)',
            expectedArtifact: 'wind_farm_terrain',
            phase: 'terrain'
        },
        {
            name: 'Phase 2: Layout Optimization', 
            message: 'Design optimal 30MW wind farm layout using grid configuration with IEA_Reference_3.4MW_130 turbines at 32.7767, -96.7970',
            expectedArtifact: 'wind_farm_layout',
            phase: 'layout'
        },
        {
            name: 'Phase 3: Wake Modeling Simulation',
            message: 'Run comprehensive wake analysis and energy simulation for 30MW wind farm at 32.7767, -96.7970 with IEA turbines',
            expectedArtifact: 'wind_farm_simulation', 
            phase: 'simulation'
        },
        {
            name: 'End-to-End Workflow',
            message: 'Complete wind farm development analysis: terrain assessment, layout design, and performance simulation for 45MW site at 40.7128, -74.0060 using Vestas V90 turbines',
            expectedArtifacts: ['wind_farm_terrain', 'wind_farm_layout', 'wind_farm_simulation'],
            phase: 'complete'
        }
    ];

    let results = [];
    
    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`📍 Phase: ${testCase.phase}`);
        console.log(`💬 Query: "${testCase.message}"`);
        
        try {
            const response = await client.graphql({
                query: `
                    mutation SendMessage($message: String!, $chatSessionId: String!) {
                        sendMessage(message: $message, chatSessionId: $chatSessionId)
                    }
                `,
                variables: {
                    message: testCase.message,
                    chatSessionId: `renewable_test_${Date.now()}_${testCase.phase}`
                }
            });

            // Parse response
            let parsedResponse;
            const responseData = response.data.sendMessage;
            if (typeof responseData === 'string') {
                try {
                    parsedResponse = JSON.parse(responseData);
                } catch {
                    parsedResponse = { content: responseData };
                }
            } else {
                parsedResponse = responseData;
            }

            // Validate agent routing
            const agentUsed = parsedResponse.agentUsed || 'unknown';
            const expectedAgent = 'renewableEnergyAgent';
            
            console.log(`🤖 Agent Used: ${agentUsed}`);
            
            if (agentUsed !== expectedAgent) {
                console.log(`⚠️  Warning: Expected ${expectedAgent}, got ${agentUsed}`);
            }

            // Validate artifacts
            const artifacts = parsedResponse.artifacts || [];
            const artifactTypes = artifacts.map(a => a.type);
            
            console.log(`🎨 Artifacts Generated: ${artifactTypes.join(', ') || 'None'}`);

            if (testCase.expectedArtifact) {
                const hasExpectedArtifact = artifactTypes.includes(testCase.expectedArtifact);
                console.log(`✅ Expected Artifact (${testCase.expectedArtifact}): ${hasExpectedArtifact ? 'Found' : 'Missing'}`);
                
                if (hasExpectedArtifact) {
                    const artifact = artifacts.find(a => a.type === testCase.expectedArtifact);
                    validateArtifactContent(artifact, testCase.phase);
                }
            }

            if (testCase.expectedArtifacts) {
                const foundArtifacts = testCase.expectedArtifacts.filter(expected => 
                    artifactTypes.includes(expected)
                );
                console.log(`✅ Multi-Phase Artifacts: ${foundArtifacts.length}/${testCase.expectedArtifacts.length} found`);
                console.log(`   Found: ${foundArtifacts.join(', ')}`);
                console.log(`   Missing: ${testCase.expectedArtifacts.filter(e => !foundArtifacts.includes(e)).join(', ') || 'None'}`);
            }

            // Validate thought process
            const thoughtSteps = parsedResponse.thoughtSteps || [];
            console.log(`🧠 Thought Steps: ${thoughtSteps.length}`);
            
            if (thoughtSteps.length > 0) {
                const relevantSteps = thoughtSteps.filter(step => 
                    step.content.toLowerCase().includes('renewable') ||
                    step.content.toLowerCase().includes('wind') ||
                    step.content.toLowerCase().includes('turbine')
                );
                console.log(`   Renewable-related steps: ${relevantSteps.length}`);
            }

            // Validate tool usage
            const toolsUsed = extractToolsFromResponse(parsedResponse);
            console.log(`🔧 Tools Used: ${toolsUsed.join(', ') || 'None detected'}`);

            results.push({
                test: testCase.name,
                phase: testCase.phase,
                success: true,
                agentUsed,
                artifactsGenerated: artifactTypes,
                toolsUsed,
                thoughtSteps: thoughtSteps.length
            });

            console.log(`✅ ${testCase.name}: PASSED`);

        } catch (error) {
            console.error(`❌ ${testCase.name}: FAILED`);
            console.error(`   Error: ${error.message}`);
            
            results.push({
                test: testCase.name,
                phase: testCase.phase,
                success: false,
                error: error.message
            });
        }
    }

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🔍 COMPREHENSIVE RENEWABLE INTEGRATION VALIDATION REPORT');
    console.log('='.repeat(80));

    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

    console.log(`\n📊 Overall Results:`);
    console.log(`   ✅ Passed: ${successfulTests.length}/${results.length}`);
    console.log(`   ❌ Failed: ${failedTests.length}/${results.length}`);
    console.log(`   📈 Success Rate: ${((successfulTests.length / results.length) * 100).toFixed(1)}%`);

    // Phase-by-phase analysis
    console.log(`\n🏗️ Phase Analysis:`);
    const phases = ['terrain', 'layout', 'simulation', 'complete'];
    phases.forEach(phase => {
        const phaseResults = results.filter(r => r.phase === phase);
        const phaseSuccess = phaseResults.filter(r => r.success);
        console.log(`   ${phase.toUpperCase()}: ${phaseSuccess.length}/${phaseResults.length} passed`);
    });

    // Agent routing analysis
    console.log(`\n🤖 Agent Routing:`);
    const agentUsage = {};
    successfulTests.forEach(test => {
        agentUsage[test.agentUsed] = (agentUsage[test.agentUsed] || 0) + 1;
    });
    Object.entries(agentUsage).forEach(([agent, count]) => {
        console.log(`   ${agent}: ${count} requests`);
    });

    // Artifact generation analysis
    console.log(`\n🎨 Artifact Generation:`);
    const artifactCounts = {};
    successfulTests.forEach(test => {
        test.artifactsGenerated.forEach(artifact => {
            artifactCounts[artifact] = (artifactCounts[artifact] || 0) + 1;
        });
    });
    Object.entries(artifactCounts).forEach(([artifact, count]) => {
        console.log(`   ${artifact}: ${count} generated`);
    });

    // Tool usage analysis
    console.log(`\n🔧 Tool Usage:`);
    const toolCounts = {};
    successfulTests.forEach(test => {
        test.toolsUsed.forEach(tool => {
            toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
    });
    Object.entries(toolCounts).forEach(([tool, count]) => {
        console.log(`   ${tool}: ${count} uses`);
    });

    // Failed tests details
    if (failedTests.length > 0) {
        console.log(`\n❌ Failed Tests Details:`);
        failedTests.forEach(test => {
            console.log(`   ${test.test}: ${test.error}`);
        });
    }

    // Integration status
    console.log(`\n🎯 Integration Status:`);
    const terrainWorks = results.some(r => r.phase === 'terrain' && r.success);
    const layoutWorks = results.some(r => r.phase === 'layout' && r.success);
    const simulationWorks = results.some(r => r.phase === 'simulation' && r.success);
    const endToEndWorks = results.some(r => r.phase === 'complete' && r.success);

    console.log(`   Phase 1 (Terrain): ${terrainWorks ? '✅ Working' : '❌ Issues'}`);
    console.log(`   Phase 2 (Layout): ${layoutWorks ? '✅ Working' : '❌ Issues'}`);
    console.log(`   Phase 3 (Simulation): ${simulationWorks ? '✅ Working' : '❌ Issues'}`);
    console.log(`   End-to-End: ${endToEndWorks ? '✅ Working' : '❌ Issues'}`);

    const integrationComplete = terrainWorks && layoutWorks && simulationWorks && endToEndWorks;
    console.log(`\n🏆 INTEGRATION STATUS: ${integrationComplete ? '✅ FULLY COMPLETE' : '⚠️  NEEDS ATTENTION'}`);

    return {
        totalTests: results.length,
        passedTests: successfulTests.length,
        failedTests: failedTests.length,
        successRate: (successfulTests.length / results.length) * 100,
        integrationComplete,
        results
    };
}

function validateArtifactContent(artifact, phase) {
    console.log(`   🔍 Validating ${phase} artifact content...`);
    
    if (!artifact || !artifact.content) {
        console.log(`   ⚠️  Artifact missing content`);
        return false;
    }

    const content = artifact.content;
    
    switch (phase) {
        case 'terrain':
            const terrainFields = ['siteAssessment', 'terrainAnalysis', 'suitabilityScore'];
            const hasTerrainFields = terrainFields.some(field => 
                JSON.stringify(content).includes(field)
            );
            console.log(`   Terrain fields present: ${hasTerrainFields ? '✅' : '❌'}`);
            break;
            
        case 'layout':
            const layoutFields = ['turbinePositions', 'layoutType', 'totalCapacity'];
            const hasLayoutFields = layoutFields.some(field => 
                JSON.stringify(content).includes(field)
            );
            console.log(`   Layout fields present: ${hasLayoutFields ? '✅' : '❌'}`);
            break;
            
        case 'simulation':
            const simFields = ['performanceMetrics', 'annualEnergyProduction', 'capacityFactor'];
            const hasSimFields = simFields.some(field => 
                JSON.stringify(content).includes(field)
            );
            console.log(`   Simulation fields present: ${hasSimFields ? '✅' : '❌'}`);
            break;
    }
}

function extractToolsFromResponse(response) {
    const tools = [];
    const responseStr = JSON.stringify(response);
    
    // Look for renewable energy tool usage patterns
    if (responseStr.includes('renewableTerrainAnalysis')) tools.push('renewableTerrainAnalysisTool');
    if (responseStr.includes('renewableLayoutOptimization')) tools.push('renewableLayoutOptimizationTool');
    if (responseStr.includes('renewableSimulation')) tools.push('renewableSimulationTool');
    
    return tools;
}

// Run the test
if (require.main === module) {
    testCompleteRenewableIntegration()
        .then(results => {
            console.log(`\n📋 Validation Complete: ${results.passedTests}/${results.totalTests} tests passed`);
            process.exit(results.integrationComplete ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = { testCompleteRenewableIntegration };
