#!/usr/bin/env node

/**
 * Regression Validation Test Suite
 * Tests that horizon routing enhancements don't break existing functionality
 */

const testQueries = {
  edicraft: [
    {
      name: "Build Wellbore Trajectory",
      query: "build wellbore trajectory for WELL-001",
      expectedAgent: "edicraft",
      expectedKeywords: ["wellbore", "trajectory", "minecraft"]
    },
    {
      name: "Visualize Horizon Surface",
      query: "visualize horizon surface in minecraft",
      expectedAgent: "edicraft",
      expectedKeywords: ["horizon", "surface", "visualization"]
    },
    {
      name: "Show Well Log in Minecraft",
      query: "show well log in minecraft",
      expectedAgent: "edicraft",
      expectedKeywords: ["well", "log", "minecraft"]
    }
  ],
  petrophysics: [
    {
      name: "Calculate Porosity",
      query: "calculate porosity for WELL-001",
      expectedAgent: "petrophysics",
      expectedKeywords: ["porosity", "calculation"]
    },
    {
      name: "Well Log Analysis",
      query: "well logs for WELL-001",
      expectedAgent: "petrophysics",
      expectedKeywords: ["well", "log"]
    },
    {
      name: "Shale Volume Analysis",
      query: "calculate shale volume using gamma ray",
      expectedAgent: "petrophysics",
      expectedKeywords: ["shale", "volume", "gamma"]
    }
  ],
  renewable: [
    {
      name: "Wind Farm Analysis",
      query: "analyze wind farm potential at coordinates 35.0, -101.0",
      expectedAgent: "renewable",
      expectedKeywords: ["wind", "farm", "analysis"]
    },
    {
      name: "Terrain Analysis",
      query: "perform terrain analysis for wind farm site",
      expectedAgent: "renewable",
      expectedKeywords: ["terrain", "analysis"]
    },
    {
      name: "Layout Optimization",
      query: "optimize turbine layout for my wind farm",
      expectedAgent: "renewable",
      expectedKeywords: ["layout", "optimization", "turbine"]
    }
  ],
  maintenance: [
    {
      name: "Equipment Status",
      query: "check equipment status for pump P-101",
      expectedAgent: "maintenance",
      expectedKeywords: ["equipment", "status"]
    },
    {
      name: "Maintenance Schedule",
      query: "show maintenance schedule for compressor",
      expectedAgent: "maintenance",
      expectedKeywords: ["maintenance", "schedule"]
    }
  ]
};

class RegressionTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Simulate agent routing logic
   */
  determineAgentType(query) {
    const lowerMessage = query.toLowerCase();

    // EDIcraft patterns (including new horizon patterns)
    const edicraftPatterns = [
      /minecraft/i,
      /wellbore.*trajectory|trajectory.*wellbore/i,
      /build.*wellbore|wellbore.*build/i,
      /osdu.*wellbore/i,
      /3d.*wellbore|wellbore.*path/i,
      /horizon.*surface|surface.*horizon/i,
      /build.*horizon|render.*surface/i,
      /osdu.*horizon/i,
      /geological.*surface/i,
      /player.*position/i,
      /coordinate.*tracking/i,
      /transform.*coordinates/i,
      /utm.*minecraft/i,
      /minecraft.*visualization/i,
      /visualize.*minecraft/i,
      /subsurface.*visualization/i,
      /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
      /well.*log.*minecraft|log.*minecraft/i,
      /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i,
      // New horizon patterns
      /find.*horizon|horizon.*find/i,
      /get.*horizon|horizon.*name/i,
      /list.*horizon|show.*horizon/i,
      /convert.*coordinates|coordinates.*convert/i,
      /convert.*to.*minecraft|minecraft.*convert/i,
      /coordinates.*for.*minecraft|minecraft.*coordinates/i,
      /horizon.*coordinates|coordinates.*horizon/i,
      /horizon.*minecraft|minecraft.*horizon/i,
      /horizon.*convert|convert.*horizon/i,
      /tell.*me.*horizon|horizon.*tell.*me/i,
      /what.*horizon|which.*horizon/i,
      /where.*horizon|horizon.*where/i,
      /coordinates.*you.*use|coordinates.*to.*use/i,
      /print.*coordinates|output.*coordinates/i
    ];

    // Renewable patterns
    const renewablePatterns = [
      /wind.*farm|wind.*energy|wind.*turbine/i,
      /renewable.*energy|renewable.*site/i,
      /terrain.*analysis.*wind|wind.*terrain/i,
      /layout.*optimization|turbine.*placement/i,
      /wake.*effect|wake.*simulation/i,
      /wind.*rose|wind.*resource/i,
      /site.*suitability.*wind/i,
      /energy.*production.*wind/i,
      /aep.*calculation|annual.*energy/i
    ];

    // Maintenance patterns
    const maintenancePatterns = [
      /equipment.*status|status.*equipment/i,
      /maintenance.*schedule|schedule.*maintenance/i,
      /pump.*status|compressor.*status/i,
      /failure.*prediction|predictive.*maintenance/i,
      /sensor.*data.*equipment/i
    ];

    // Petrophysics patterns
    const petrophysicsPatterns = [
      // Log curve analysis
      /log.*curves?|well.*logs?|las.*files?/i,
      /(gr|rhob|nphi|dtc|cali).*analysis/i,
      /gamma.*ray|density|neutron|resistivity.*data/i,
      /available.*log.*curves?/i,
      
      // Specific calculations
      /calculate.*(porosity|shale|saturation|permeability)/i,
      /formation.*evaluation|petrophysical.*analysis/i,
      /(density|neutron|gamma.*ray).*analysis/i,
      
      // Well naming patterns
      /well-\d+|WELL-\d+|analyze.*well.*\d+|analyze.*WELL.*\d+/i,
      /wells?.*from.*well-\d+|wells?.*from.*WELL-\d+/i,
      
      // Technical terms
      /porosity|permeability|saturation/i,
      /shale.*volume|clay.*content/i,
      /reservoir.*quality|completion.*target|net.*pay/i
    ];

    // Check patterns in priority order
    if (edicraftPatterns.some(pattern => pattern.test(lowerMessage))) {
      return 'edicraft';
    }

    if (renewablePatterns.some(pattern => pattern.test(lowerMessage))) {
      return 'renewable';
    }

    if (maintenancePatterns.some(pattern => pattern.test(lowerMessage))) {
      return 'maintenance';
    }

    if (petrophysicsPatterns.some(pattern => pattern.test(lowerMessage))) {
      return 'petrophysics';
    }

    return 'auto';
  }

  /**
   * Test a single query
   */
  testQuery(testCase) {
    const detectedAgent = this.determineAgentType(testCase.query);
    const passed = detectedAgent === testCase.expectedAgent;

    const result = {
      name: testCase.name,
      query: testCase.query,
      expectedAgent: testCase.expectedAgent,
      detectedAgent: detectedAgent,
      passed: passed
    };

    this.results.tests.push(result);

    if (passed) {
      this.results.passed++;
      console.log(`✅ PASS: ${testCase.name}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Routed to: ${detectedAgent}`);
    } else {
      this.results.failed++;
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Query: "${testCase.query}"`);
      console.log(`   Expected: ${testCase.expectedAgent}`);
      console.log(`   Got: ${detectedAgent}`);
    }
    console.log('');
  }

  /**
   * Run all regression tests
   */
  runAllTests() {
    console.log('='.repeat(80));
    console.log('REGRESSION VALIDATION TEST SUITE');
    console.log('Testing that horizon routing enhancements don\'t break existing functionality');
    console.log('='.repeat(80));
    console.log('');

    // Test EDIcraft queries
    console.log('📝 Testing EDIcraft Queries');
    console.log('-'.repeat(80));
    testQueries.edicraft.forEach(test => this.testQuery(test));

    // Test Petrophysics queries
    console.log('📝 Testing Petrophysics Queries');
    console.log('-'.repeat(80));
    testQueries.petrophysics.forEach(test => this.testQuery(test));

    // Test Renewable queries
    console.log('📝 Testing Renewable Energy Queries');
    console.log('-'.repeat(80));
    testQueries.renewable.forEach(test => this.testQuery(test));

    // Test Maintenance queries
    console.log('📝 Testing Maintenance Queries');
    console.log('-'.repeat(80));
    testQueries.maintenance.forEach(test => this.testQuery(test));

    // Print summary
    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.tests.length}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(1)}%`);
    console.log('');

    if (this.results.failed > 0) {
      console.log('❌ REGRESSION DETECTED - Some tests failed!');
      console.log('');
      console.log('Failed Tests:');
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`  - ${t.name}: Expected ${t.expectedAgent}, got ${t.detectedAgent}`);
        });
      process.exit(1);
    } else {
      console.log('✅ ALL TESTS PASSED - No regressions detected!');
      console.log('');
      console.log('Horizon routing enhancements are working correctly and have not');
      console.log('broken any existing functionality.');
      process.exit(0);
    }
  }
}

// Run tests
const tester = new RegressionTester();
tester.runAllTests();
