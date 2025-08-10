#!/usr/bin/env node

/**
 * Legal Tag Test Runner
 * 
 * Comprehensive test runner for legal tag data flow testing.
 * Runs unit tests, integration tests, and provides guidance for manual tests.
 * 
 * Usage:
 *   npm run test:legal-tags
 *   node test/scripts/runLegalTagTests.js [options]
 * 
 * Options:
 *   --unit          Run only unit tests
 *   --integration   Run only integration tests
 *   --manual        Show manual test guidance
 *   --all           Run all automated tests (default)
 *   --verbose       Show detailed output
 *   --coverage      Generate coverage report
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class LegalTagTestRunner {
  constructor() {
    this.args = process.argv.slice(2);
    this.options = this.parseArgs();
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      manual: { total: 0 }
    };
  }

  parseArgs() {
    const options = {
      unit: false,
      integration: false,
      manual: false,
      all: true,
      verbose: false,
      coverage: false
    };

    this.args.forEach(arg => {
      switch (arg) {
        case '--unit':
          options.unit = true;
          options.all = false;
          break;
        case '--integration':
          options.integration = true;
          options.all = false;
          break;
        case '--manual':
          options.manual = true;
          options.all = false;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--coverage':
          options.coverage = true;
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
      }
    });

    // If --all is true, enable all test types
    if (options.all) {
      options.unit = true;
      options.integration = true;
      options.manual = true;
    }

    return options;
  }

  showHelp() {
    console.log(`
Legal Tag Test Runner

Usage: node test/scripts/runLegalTagTests.js [options]

Options:
  --unit          Run only unit tests
  --integration   Run only integration tests  
  --manual        Show manual test guidance
  --all           Run all automated tests (default)
  --verbose       Show detailed output
  --coverage      Generate coverage report
  --help          Show this help message

Examples:
  node test/scripts/runLegalTagTests.js --unit
  node test/scripts/runLegalTagTests.js --integration --verbose
  node test/scripts/runLegalTagTests.js --all --coverage
    `);
  }

  async runTests() {
    console.log('🧪 Legal Tag Comprehensive Test Suite');
    console.log('=====================================\n');

    if (this.options.unit) {
      await this.runUnitTests();
    }

    if (this.options.integration) {
      await this.runIntegrationTests();
    }

    if (this.options.manual) {
      await this.showManualTestGuidance();
    }

    this.showSummary();
  }

  async runUnitTests() {
    console.log('📋 Running Unit Tests...\n');
    
    const unitTestFiles = [
      'test/unit/legalTagDataFlow.test.ts',
      'test/unit/legalTagErrorHandler.test.ts',
      'test/unit/responseNormalizer.test.ts',
      'test/unit/osduApiServiceResponseNormalization.test.ts'
    ];

    for (const testFile of unitTestFiles) {
      if (fs.existsSync(testFile)) {
        console.log(`Running: ${testFile}`);
        await this.runMochaTest(testFile, 'unit');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...\n');
    
    const integrationTestFiles = [
      'test/integration/legalTagEndToEndFlow.test.ts',
      'test/integration/OsduApiServiceIntegration.test.ts'
    ];

    for (const testFile of integrationTestFiles) {
      if (fs.existsSync(testFile)) {
        console.log(`Running: ${testFile}`);
        await this.runMochaTest(testFile, 'integration');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }
  }

  async runMochaTest(testFile, type) {
    return new Promise((resolve) => {
      const mochaArgs = [
        '--require', 'tsx',
        testFile
      ];

      if (this.options.verbose) {
        mochaArgs.push('--reporter', 'spec');
      }

      if (this.options.coverage) {
        // Add coverage options if needed
        mochaArgs.unshift('--coverage');
      }

      const mocha = spawn('npx', ['mocha', ...mochaArgs], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      mocha.stdout.on('data', (data) => {
        output += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });

      mocha.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });

      mocha.on('close', (code) => {
        const results = this.parseTestResults(output, errorOutput);
        this.testResults[type].passed += results.passed;
        this.testResults[type].failed += results.failed;
        this.testResults[type].total += results.total;

        if (code === 0) {
          console.log(`✅ ${testFile} - ${results.passed} passed, ${results.failed} failed`);
        } else {
          console.log(`❌ ${testFile} - ${results.passed} passed, ${results.failed} failed`);
          if (!this.options.verbose && errorOutput) {
            console.log('Error output:', errorOutput);
          }
        }
        
        resolve();
      });
    });
  }

  parseTestResults(output, errorOutput) {
    // Parse mocha output to extract test results
    const results = { passed: 0, failed: 0, total: 0 };
    
    // Look for mocha summary line like "5 passing (123ms)" or "3 passing, 2 failing"
    const passingMatch = output.match(/(\d+) passing/);
    const failingMatch = output.match(/(\d+) failing/);
    
    if (passingMatch) {
      results.passed = parseInt(passingMatch[1]);
    }
    
    if (failingMatch) {
      results.failed = parseInt(failingMatch[1]);
    }
    
    results.total = results.passed + results.failed;
    
    return results;
  }

  async showManualTestGuidance() {
    console.log('📖 Manual Test Guidance\n');
    console.log('The following manual tests should be performed:');
    console.log('');

    const manualTestCategories = [
      {
        name: 'Empty Database Scenarios',
        tests: [
          'Test with completely empty legal tags database',
          'Verify empty state UI displays correctly',
          'Test transition from empty to populated state',
          'Verify create button remains functional when empty'
        ]
      },
      {
        name: 'Error Condition Testing',
        tests: [
          'Test with network disconnected',
          'Test with expired authentication tokens',
          'Test during server maintenance windows',
          'Test with malformed server responses'
        ]
      },
      {
        name: 'Performance Testing',
        tests: [
          'Test with large datasets (1000+ legal tags)',
          'Test concurrent operations from multiple users',
          'Monitor memory usage during extended sessions',
          'Test pagination with large result sets'
        ]
      },
      {
        name: 'Browser Compatibility',
        tests: [
          'Test in Chrome, Firefox, Safari, Edge',
          'Test on mobile devices (iOS, Android)',
          'Test responsive design at different screen sizes',
          'Test accessibility features (keyboard navigation, screen readers)'
        ]
      },
      {
        name: 'Internationalization',
        tests: [
          'Test with legal tags containing special characters',
          'Test with different languages (French, Chinese, Arabic, etc.)',
          'Test right-to-left text rendering',
          'Test Unicode character handling'
        ]
      }
    ];

    manualTestCategories.forEach(category => {
      console.log(`\n🔍 ${category.name}:`);
      category.tests.forEach(test => {
        console.log(`   • ${test}`);
        this.testResults.manual.total++;
      });
    });

    console.log('\n📝 Manual Test Execution:');
    console.log('   1. Run: npm run test:specific test/manual/legalTagManualTestScenarios.test.ts');
    console.log('   2. Follow the detailed guidance printed by each test');
    console.log('   3. Document results in test execution reports');
    console.log('   4. Report any issues found during manual testing');
  }

  showSummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    const totalPassed = this.testResults.unit.passed + this.testResults.integration.passed;
    const totalFailed = this.testResults.unit.failed + this.testResults.integration.failed;
    const totalAutomated = this.testResults.unit.total + this.testResults.integration.total;
    
    console.log(`Unit Tests:        ${this.testResults.unit.passed} passed, ${this.testResults.unit.failed} failed (${this.testResults.unit.total} total)`);
    console.log(`Integration Tests: ${this.testResults.integration.passed} passed, ${this.testResults.integration.failed} failed (${this.testResults.integration.total} total)`);
    console.log(`Manual Tests:      ${this.testResults.manual.total} scenarios identified`);
    console.log('');
    console.log(`Total Automated:   ${totalPassed} passed, ${totalFailed} failed (${totalAutomated} total)`);
    
    if (totalFailed === 0 && totalAutomated > 0) {
      console.log('✅ All automated tests passed!');
    } else if (totalFailed > 0) {
      console.log('❌ Some tests failed. Please review the output above.');
    }
    
    if (this.testResults.manual.total > 0) {
      console.log(`📋 ${this.testResults.manual.total} manual test scenarios require execution`);
    }

    console.log('\n🎯 Next Steps:');
    console.log('   1. Address any failing automated tests');
    console.log('   2. Execute manual test scenarios');
    console.log('   3. Document test results');
    console.log('   4. Update test coverage as needed');
  }
}

// Run the test suite
const runner = new LegalTagTestRunner();
runner.runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});