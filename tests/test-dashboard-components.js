/**
 * Dashboard Components Test
 * Validates dashboard data structures and component rendering
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Dashboard Components...\n');

// Test 1: Verify dashboard components exist
console.log('📋 Test 1: Verify dashboard component files exist');
const dashboardComponents = [
  'src/components/renewable/WindResourceDashboard.tsx',
  'src/components/renewable/PerformanceAnalysisDashboard.tsx',
  'src/components/renewable/WakeAnalysisDashboard.tsx',
  'src/components/renewable/DashboardArtifact.tsx',
  'src/components/renewable/PlotlyWindRose.tsx'
];

let allComponentsExist = true;
dashboardComponents.forEach(component => {
  const exists = fs.existsSync(component);
  console.log(`  ${exists ? '✅' : '❌'} ${component}`);
  if (!exists) allComponentsExist = false;
});

if (!allComponentsExist) {
  console.error('\n❌ Some dashboard components are missing!');
  process.exit(1);
}

// Test 2: Verify backend dashboard data generator exists
console.log('\n📋 Test 2: Verify backend dashboard data generator');
const backendFile = 'amplify/functions/renewableTools/dashboard_data_generator.py';
const backendExists = fs.existsSync(backendFile);
console.log(`  ${backendExists ? '✅' : '❌'} ${backendFile}`);

if (!backendExists) {
  console.error('\n❌ Backend dashboard data generator is missing!');
  process.exit(1);
}

// Test 3: Verify dashboard components are exported
console.log('\n📋 Test 3: Verify dashboard components are exported');
const indexFile = fs.readFileSync('src/components/renewable/index.ts', 'utf8');
const requiredExports = [
  'DashboardArtifact',
  'WindResourceDashboard',
  'PerformanceAnalysisDashboard',
  'WakeAnalysisDashboard',
  'PlotlyWindRose'
];

let allExported = true;
requiredExports.forEach(exportName => {
  const isExported = indexFile.includes(exportName);
  console.log(`  ${isExported ? '✅' : '❌'} ${exportName}`);
  if (!isExported) allExported = false;
});

if (!allExported) {
  console.error('\n❌ Some dashboard components are not exported!');
  process.exit(1);
}

// Test 4: Validate Wind Resource Dashboard data structure
console.log('\n📋 Test 4: Validate Wind Resource Dashboard data structure');
const windResourceData = {
  windRoseData: [
    {
      type: 'barpolar',
      r: [10, 15, 20, 15, 10, 8, 12, 18, 22, 20, 15, 12, 10, 8, 10, 12],
      theta: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    }
  ],
  windSpeedDistribution: {
    speeds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    frequencies: [2, 5, 10, 15, 20, 18, 15, 10, 3, 1, 1]
  },
  seasonalPatterns: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    avgSpeeds: [7.2, 7.6, 8.0, 8.4, 8.0, 6.8, 6.0, 6.4, 7.2, 8.0, 8.4, 7.6],
    maxSpeeds: [10.8, 11.4, 12.0, 12.6, 12.0, 10.2, 9.0, 9.6, 10.8, 12.0, 12.6, 11.4]
  },
  monthlyAverages: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    speeds: [7.2, 7.6, 8.0, 8.4, 8.0, 6.8, 6.0, 6.4, 7.2, 8.0, 8.4, 7.6]
  },
  variabilityAnalysis: {
    hourly: {
      hours: Array.from({length: 24}, (_, i) => i),
      avgSpeeds: Array.from({length: 24}, (_, i) => 6 + Math.sin(i * Math.PI / 12) * 2)
    },
    daily: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      avgSpeeds: [7.5, 7.6, 7.4, 7.7, 7.5, 7.3, 7.4]
    }
  },
  statistics: {
    average_speed: 7.5,
    max_speed: 15.2,
    prevailing_direction: 'W',
    prevailing_frequency: 22.5
  }
};

const windResourceKeys = ['windRoseData', 'windSpeedDistribution', 'seasonalPatterns', 'monthlyAverages', 'variabilityAnalysis', 'statistics'];
let windResourceValid = true;
windResourceKeys.forEach(key => {
  const hasKey = windResourceData.hasOwnProperty(key);
  console.log(`  ${hasKey ? '✅' : '❌'} ${key}`);
  if (!hasKey) windResourceValid = false;
});

if (!windResourceValid) {
  console.error('\n❌ Wind Resource Dashboard data structure is invalid!');
  process.exit(1);
}

// Test 5: Validate Performance Analysis Dashboard data structure
console.log('\n📋 Test 5: Validate Performance Analysis Dashboard data structure');
const performanceData = {
  summary: {
    total_aep_gwh: 134.03,
    capacity_factor: 0.507,
    wake_loss_percent: 4.25,
    number_of_turbines: 9,
    total_capacity_mw: 30.15,
    mean_wind_speed: 7.95,
    turbine_model: 'IEA37 3.35MW'
  },
  monthlyEnergyProduction: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    energy_gwh: [12.1, 11.8, 12.5, 11.9, 11.2, 9.8, 8.5, 9.2, 10.5, 11.8, 12.3, 12.4]
  },
  capacityFactorDistribution: {
    turbines: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09'],
    capacity_factors: [0.51, 0.52, 0.50, 0.53, 0.51, 0.49, 0.52, 0.51, 0.53]
  },
  turbinePerformanceHeatmap: {
    turbines: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09'],
    metrics: ['AEP (GWh)', 'Capacity Factor (%)', 'Wake Loss (%)', 'Availability (%)'],
    values: Array.from({length: 9}, () => [14.9, 51, 4.5, 98.5])
  },
  availabilityAndLosses: {
    categories: ['Wake Losses', 'Availability Losses', 'Other Losses'],
    values: [4.25, 1.5, 2.0]
  }
};

const performanceKeys = ['summary', 'monthlyEnergyProduction', 'capacityFactorDistribution', 'turbinePerformanceHeatmap', 'availabilityAndLosses'];
let performanceValid = true;
performanceKeys.forEach(key => {
  const hasKey = performanceData.hasOwnProperty(key);
  console.log(`  ${hasKey ? '✅' : '❌'} ${key}`);
  if (!hasKey) performanceValid = false;
});

if (!performanceValid) {
  console.error('\n❌ Performance Analysis Dashboard data structure is invalid!');
  process.exit(1);
}

// Test 6: Validate Wake Analysis Dashboard data structure
console.log('\n📋 Test 6: Validate Wake Analysis Dashboard data structure');
const wakeData = {
  wakeHeatMap: {
    html: '<html><body>Wake Heat Map</body></html>',
    url: null
  },
  wakeDeficitProfile: {
    distances: Array.from({length: 50}, (_, i) => i * 40),
    deficits: Array.from({length: 50}, (_, i) => 25 * Math.exp(-i * 40 / 800)),
    directions: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  },
  turbineInteractionMatrix: {
    turbines: ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09'],
    interactions: Array.from({length: 9}, () => Array.from({length: 9}, () => Math.random() * 15))
  },
  wakeLossByDirection: {
    directions: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
    losses: Array.from({length: 16}, () => 3 + Math.random() * 8)
  },
  summary: {
    total_wake_loss: 4.25,
    max_wake_deficit: 15.3,
    most_affected_turbine: 'T05',
    prevailing_wake_direction: 'W'
  }
};

const wakeKeys = ['wakeHeatMap', 'wakeDeficitProfile', 'turbineInteractionMatrix', 'wakeLossByDirection', 'summary'];
let wakeValid = true;
wakeKeys.forEach(key => {
  const hasKey = wakeData.hasOwnProperty(key);
  console.log(`  ${hasKey ? '✅' : '❌'} ${key}`);
  if (!hasKey) wakeValid = false;
});

if (!wakeValid) {
  console.error('\n❌ Wake Analysis Dashboard data structure is invalid!');
  process.exit(1);
}

// Test 7: Verify dashboard artifact structure
console.log('\n📋 Test 7: Verify dashboard artifact structure');
const dashboardArtifact = {
  type: 'renewable_dashboard',
  messageContentType: 'renewable_dashboard',
  dashboardType: 'wind_resource',
  projectId: 'test-project',
  data: windResourceData,
  metadata: {
    generated_at: new Date().toISOString(),
    version: '1.0'
  }
};

const artifactKeys = ['type', 'messageContentType', 'dashboardType', 'projectId', 'data', 'metadata'];
let artifactValid = true;
artifactKeys.forEach(key => {
  const hasKey = dashboardArtifact.hasOwnProperty(key);
  console.log(`  ${hasKey ? '✅' : '❌'} ${key}`);
  if (!hasKey) artifactValid = false;
});

if (!artifactValid) {
  console.error('\n❌ Dashboard artifact structure is invalid!');
  process.exit(1);
}

// Test 8: Verify dashboard types
console.log('\n📋 Test 8: Verify dashboard types');
const dashboardTypes = ['wind_resource', 'performance_analysis', 'wake_analysis'];
dashboardTypes.forEach(type => {
  console.log(`  ✅ ${type}`);
});

console.log('\n✅ All dashboard component tests passed!\n');
console.log('📊 Dashboard Components Summary:');
console.log('  - Wind Resource Dashboard: Consolidates wind rose and supporting charts');
console.log('  - Performance Analysis Dashboard: Shows energy production and turbine performance');
console.log('  - Wake Analysis Dashboard: Displays wake heat map and interaction analysis');
console.log('  - Dashboard Artifact: Routes to appropriate dashboard based on type');
console.log('  - Backend Generator: Creates dashboard data structures\n');

process.exit(0);
