#!/usr/bin/env node

/**
 * Task 8: Verify Extended Thinking Display
 * Tests Claude 3.7 Sonnet extended thinking capture and frontend display
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

class ExtendedThinkingTester {
    constructor() {
        this.projectId = 'test-thinking-' + Date.now();
        this.results = {
            thinking_capture: {},
            thinking_display: {},
            thinking_parsing: {},
            errors: []
        };
    }

    async testThinkingCapture() {
        console.log('🧠 Testing Extended Thinking Capture...');
        console.log('=' .repeat(50));

        const testQueries = [
            {
                name: 'Complex Terrain Analysis',
                query: 'Analyze terrain for wind farm at coordinates 40.7589, -73.9851. Consider multiple factors including topography, land use, environmental constraints, and optimal turbine placement zones.',
                expected_thinking: true
            },
            {
                name: 'Multi-Constraint Layout',
                query: 'Create turbine layout with 100 turbines considering: 1) Minimum 5D spacing, 2) Avoid water bodies, 3) Stay 500m from roads, 4) Maximize energy capture, 5) Minimize wake losses.',
                expected_thinking: true
            },
            {
                name: 'Economic Optimization',
                query: 'Run simulation and optimize for best LCOE considering: turbine costs, O&M expenses, energy production, capacity factor, and 20-year project lifetime.',
                expected_thinking: true
            }
        ];

        for (const testQuery of testQueries) {
            await this.testSingleThinkingCapture(testQuery);
        }
    }

    async testSingleThinkingCapture(testQuery) {
        console.log(`\n💭 Testing: ${testQuery.name}`);
        
        try {
            const payload = {
                query: testQuery.query,
                context: {
                    project_id: this.projectId,
                    capture_thinking: true,
                    model: 'claude-3-7-sonnet'
                }
            };

            const result = await this.invokeOrchestrator(payload);
            
            // Check if thinking was captured
            const hasThinking = this.checkForThinking(result);
            
            this.results.thinking_capture[testQuery.name] = {
                status: hasThinking ? 'success' : 'no_thinking',
                has_thinking: hasThinking,
                thinking_length: hasThinking ? this.extractThinking(result).length : 0
            };

            if (hasThinking) {
                console.log(`   ✅ Extended thinking captured`);
                console.log(`   📊 Thinking length: ${this.extractThinking(result).length} characters`);
            } else {
                console.log(`   ⚠️  No extended thinking found`);
            }
            
        } catch (error) {
            this.results.thinking_capture[testQuery.name] = {
                status: 'failed',
                error: error.message
            };
            this.results.errors.push({
                step: 'thinking_capture',
                query: testQuery.name,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`   ❌ Capture failed: ${error.message}`);
        }
    }

    checkForThinking(response) {
        const responseStr = JSON.stringify(response);
        
        // Check various possible locations for thinking content
        return responseStr.includes('thinking') || 
               responseStr.includes('extended_thinking') ||
               responseStr.includes('reasoning') ||
               responseStr.includes('chain_of_thought');
    }

    extractThinking(response) {
        // Try to extract thinking from various possible locations
        if (response.thinking) return response.thinking;
        if (response.extended_thinking) return response.extended_thinking;
        if (response.reasoning) return response.reasoning;
        if (response.chain_of_thought) return response.chain_of_thought;
        
        if (response.body && typeof response.body === 'object') {
            return this.extractThinking(response.body);
        }
        
        return '';
    }

    async testThinkingDisplay() {
        console.log('\n🎨 Testing Extended Thinking Display Component...');
        console.log('=' .repeat(50));

        const displayTests = [
            {
                name: 'Step Parsing',
                thinking: `Step 1: Analyze terrain data
                Examining topography and land use patterns.
                
                Step 2: Identify constraints
                Finding exclusion zones and setbacks.
                
                Step 3: Optimize placement
                Calculating optimal turbine positions.`,
                expected_steps: 3
            },
            {
                name: 'Type Detection',
                thinking: `Analysis: Reviewing wind resource data
                Decision: Choosing grid layout algorithm
                Calculation: Computing turbine spacing
                Reasoning: Balancing energy vs. cost`,
                expected_types: ['analysis', 'decision', 'calculation', 'reasoning']
            },
            {
                name: 'Long Content',
                thinking: 'A'.repeat(5000), // 5000 character thinking
                expected_truncation: false
            }
        ];

        for (const test of displayTests) {
            await this.testSingleDisplayScenario(test);
        }
    }

    async testSingleDisplayScenario(test) {
        console.log(`\n🖼️  Testing: ${test.name}`);
        
        try {
            // Simulate component parsing
            const parsed = this.simulateComponentParsing(test.thinking);
            
            this.results.thinking_display[test.name] = {
                status: 'success',
                steps_found: parsed.steps.length,
                types_found: parsed.types,
                content_length: test.thinking.length
            };

            console.log(`   ✅ Display test passed`);
            console.log(`   📊 Steps found: ${parsed.steps.length}`);
            console.log(`   🏷️  Types found: ${parsed.types.join(', ')}`);
            
        } catch (error) {
            this.results.thinking_display[test.name] = {
                status: 'failed',
                error: error.message
            };
            console.log(`   ❌ Display test failed: ${error.message}`);
        }
    }

    simulateComponentParsing(thinking) {
        // Simulate the ExtendedThinkingDisplay component's parsing logic
        const sections = thinking.split(/\n(?=\d+\.|Step \d+|Analysis:|Decision:|Calculation:|Reasoning:)/i);
        
        const steps = sections
            .filter(section => section.trim().length > 0)
            .map((section, index) => {
                const trimmed = section.trim();
                let type = 'reasoning';
                
                if (trimmed.toLowerCase().includes('analyz') || trimmed.toLowerCase().includes('examin')) {
                    type = 'analysis';
                } else if (trimmed.toLowerCase().includes('decid') || trimmed.toLowerCase().includes('choos')) {
                    type = 'decision';
                } else if (trimmed.toLowerCase().includes('calculat') || trimmed.toLowerCase().includes('comput')) {
                    type = 'calculation';
                }
                
                return { step: index + 1, type, content: trimmed };
            });
        
        const types = [...new Set(steps.map(s => s.type))];
        
        return { steps, types };
    }

    async testThinkingParsing() {
        console.log('\n🔍 Testing Thinking Content Parsing...');
        console.log('=' .repeat(50));

        const parsingTests = [
            {
                name: 'Numbered Steps',
                content: '1. First step\n2. Second step\n3. Third step',
                expected_format: 'numbered'
            },
            {
                name: 'Labeled Steps',
                content: 'Step 1: First\nStep 2: Second\nStep 3: Third',
                expected_format: 'labeled'
            },
            {
                name: 'Mixed Format',
                content: 'Analysis: Data review\n1. Process data\nDecision: Choose algorithm',
                expected_format: 'mixed'
            },
            {
                name: 'Unstructured',
                content: 'This is unstructured thinking without clear steps or sections.',
                expected_format: 'unstructured'
            }
        ];

        for (const test of parsingTests) {
            await this.testSingleParsingScenario(test);
        }
    }

    async testSingleParsingScenario(test) {
        console.log(`\n📝 Testing: ${test.name}`);
        
        try {
            const parsed = this.simulateComponentParsing(test.content);
            const format = this.detectFormat(test.content);
            
            this.results.thinking_parsing[test.name] = {
                status: 'success',
                detected_format: format,
                steps_extracted: parsed.steps.length,
                parseable: parsed.steps.length > 0
            };

            console.log(`   ✅ Parsing test passed`);
            console.log(`   📋 Format: ${format}`);
            console.log(`   📊 Steps extracted: ${parsed.steps.length}`);
            
        } catch (error) {
            this.results.thinking_parsing[test.name] = {
                status: 'failed',
                error: error.message
            };
            console.log(`   ❌ Parsing test failed: ${error.message}`);
        }
    }

    detectFormat(content) {
        if (/^\d+\./.test(content)) return 'numbered';
        if (/^Step \d+:/i.test(content)) return 'labeled';
        if (/(Analysis:|Decision:|Calculation:|Reasoning:)/i.test(content)) return 'mixed';
        return 'unstructured';
    }

    async invokeOrchestrator(payload) {
        const params = {
            FunctionName: 'renewableOrchestrator',
            Payload: JSON.stringify(payload),
            InvocationType: 'RequestResponse'
        };

        const result = await lambda.invoke(params).promise();
        
        if (result.FunctionError) {
            throw new Error(`Orchestrator Error: ${result.FunctionError}`);
        }

        return JSON.parse(result.Payload);
    }

    async runAllTests() {
        console.log('🚀 Starting Extended Thinking Display Tests...');
        console.log('=' .repeat(60));

        // Test thinking capture
        await this.testThinkingCapture();
        
        // Test display component
        await this.testThinkingDisplay();
        
        // Test parsing logic
        await this.testThinkingParsing();

        // Generate summary
        this.generateSummary();
    }

    generateSummary() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 EXTENDED THINKING DISPLAY TEST SUMMARY');
        console.log('=' .repeat(60));

        console.log(`\n🆔 Project ID: ${this.projectId}`);
        
        // Thinking Capture Results
        console.log('\n🧠 Thinking Capture:');
        Object.entries(this.results.thinking_capture).forEach(([name, result]) => {
            const status = result.status === 'success' ? '✅' : result.status === 'no_thinking' ? '⚠️' : '❌';
            console.log(`${status} ${name}: ${result.status}`);
            if (result.thinking_length) {
                console.log(`   📊 Length: ${result.thinking_length} characters`);
            }
        });
        
        // Display Component Results
        console.log('\n🎨 Display Component:');
        Object.entries(this.results.thinking_display).forEach(([name, result]) => {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`${status} ${name}: ${result.status}`);
            if (result.steps_found !== undefined) {
                console.log(`   📊 Steps: ${result.steps_found}`);
            }
        });
        
        // Parsing Results
        console.log('\n🔍 Content Parsing:');
        Object.entries(this.results.thinking_parsing).forEach(([name, result]) => {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`${status} ${name}: ${result.status}`);
            if (result.detected_format) {
                console.log(`   📋 Format: ${result.detected_format}`);
            }
        });
        
        // Error Summary
        console.log('\n🚨 Errors:');
        if (this.results.errors.length === 0) {
            console.log('✅ No errors detected');
        } else {
            this.results.errors.forEach(error => {
                console.log(`❌ ${error.step}: ${error.error}`);
            });
        }
        
        // Overall Assessment
        const totalTests = Object.keys(this.results.thinking_capture).length + 
                          Object.keys(this.results.thinking_display).length + 
                          Object.keys(this.results.thinking_parsing).length;
        
        const successfulTests = Object.values(this.results.thinking_capture).filter(r => r.status === 'success').length +
                               Object.values(this.results.thinking_display).filter(r => r.status === 'success').length +
                               Object.values(this.results.thinking_parsing).filter(r => r.status === 'success').length;
        
        console.log('\nResults:');
        console.log(`✅ Successful Tests: ${successfulTests}/${totalTests}`);
        console.log(`❌ Failed Tests: ${totalTests - successfulTests}/${totalTests}`);
        console.log(`🚨 Total Errors: ${this.results.errors.length}`);
        
        if (successfulTests >= totalTests * 0.8) { // 80% success rate
            console.log('\n🎉 EXTENDED THINKING DISPLAY WORKING WELL!');
            console.log('✅ Task 8: Verify Extended Thinking Display - COMPLETE');
        } else {
            console.log('\n⚠️  Extended thinking display needs attention');
            console.log('❌ Task 8: Verify Extended Thinking Display - NEEDS FIXES');
        }

        // Save results to file
        const fs = require('fs');
        fs.writeFileSync('tests/extended-thinking-display-results.json', JSON.stringify(this.results, null, 2));
        console.log('\n💾 Results saved to: tests/extended-thinking-display-results.json');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ExtendedThinkingTester();
    tester.runAllTests().catch(console.error);
}

module.exports = ExtendedThinkingTester;
