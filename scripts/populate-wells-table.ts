/**
 * Populate Wells Table with 24 Wells
 * Creates equipment status data for the Wells Equipment Dashboard
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient<Schema>();

/**
 * Generate well data for 24 wells
 */
function generateWellData(wellNumber: number) {
  const wellId = `WELL-${String(wellNumber).padStart(3, '0')}`;
  
  // Vary parameters based on well number for realistic diversity
  const baseHealthScore = 75 + (wellNumber % 20);
  const operationalStatus = baseHealthScore > 70 ? 'operational' : 'degraded';
  const basePressure = 2500 + (wellNumber * 50);
  const baseTemp = 170 + (wellNumber * 2);
  const baseFlowRate = 400 + (wellNumber * 10);
  
  // Determine sector based on well number
  const sector = Math.ceil(wellNumber / 6);
  
  // Generate sensors
  const sensors = [
    {
      type: 'pressure',
      currentValue: basePressure,
      unit: 'PSI',
      normalRange: { min: 2500, max: 3000 },
      alertThreshold: { warning: 3100, critical: 3300 },
      status: basePressure > 3100 ? 'critical' : basePressure > 3000 ? 'warning' : 'normal',
      lastUpdated: new Date().toISOString(),
      trend: 'stable'
    },
    {
      type: 'temperature',
      currentValue: baseTemp,
      unit: '°F',
      normalRange: { min: 150, max: 200 },
      alertThreshold: { warning: 210, critical: 230 },
      status: baseTemp > 210 ? 'critical' : baseTemp > 200 ? 'warning' : 'normal',
      lastUpdated: new Date().toISOString(),
      trend: 'stable'
    },
    {
      type: 'flow_rate',
      currentValue: baseFlowRate,
      unit: 'BPD',
      normalRange: { min: 400, max: 500 },
      alertThreshold: { warning: 350, critical: 300 },
      status: baseFlowRate < 350 ? 'warning' : 'normal',
      lastUpdated: new Date().toISOString(),
      trend: 'stable'
    }
  ];

  // Generate alerts from critical/warning sensors
  const alerts = sensors
    .filter(s => s.status === 'critical' || s.status === 'warning')
    .map((s, idx) => ({
      id: `${wellId}-ALERT-${idx + 1}`,
      severity: s.status === 'critical' ? 'critical' : 'warning',
      message: `${s.type} reading ${s.currentValue} ${s.unit} is ${s.status === 'critical' ? 'above critical threshold' : 'elevated'}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      relatedSensor: s.type
    }));

  return {
    id: wellId,
    name: `Production Well ${String(wellNumber).padStart(3, '0')}`,
    type: 'well',
    location: `Field A - Sector ${sector}`,
    operationalStatus,
    healthScore: baseHealthScore,
    lastMaintenanceDate: '2024-12-15',
    nextMaintenanceDate: '2025-03-15',
    sensors,
    alerts,
    metadata: {
      field: 'Field A',
      operator: 'Energy Corp',
      installDate: `2023-${String(Math.floor(wellNumber / 2) + 1).padStart(2, '0')}-15`,
      depth: 8000 + (wellNumber * 100),
      production: {
        currentRate: baseFlowRate,
        averageRate: baseFlowRate * 0.95,
        cumulativeProduction: baseFlowRate * 365 * 2,
        efficiency: baseHealthScore
      }
    }
  };
}

/**
 * Main function to populate wells
 */
async function populateWells() {
  console.log('🔧 Populating Wells Table with 24 Wells');
  console.log('=' .repeat(80));

  try {
    // Generate 24 wells
    const wells = [];
    for (let i = 1; i <= 24; i++) {
      wells.push(generateWellData(i));
    }

    console.log(`\n📊 Generated ${wells.length} wells`);

    // Create wells in database
    let successCount = 0;
    let errorCount = 0;

    for (const well of wells) {
      try {
        console.log(`\n📝 Creating ${well.id}...`);
        
        const result = await client.models.Well.create({
          id: well.id,
          name: well.name,
          type: well.type,
          location: well.location,
          operationalStatus: well.operationalStatus as any,
          healthScore: well.healthScore,
          lastMaintenanceDate: well.lastMaintenanceDate,
          nextMaintenanceDate: well.nextMaintenanceDate,
          sensors: well.sensors,
          alerts: well.alerts,
          metadata: well.metadata
        });

        if (result.data) {
          console.log(`✅ Created ${well.id} - Health: ${well.healthScore}%, Status: ${well.operationalStatus}`);
          successCount++;
        } else {
          console.error(`❌ Failed to create ${well.id}:`, result.errors);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating ${well.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Successfully created ${successCount} wells`);
    if (errorCount > 0) {
      console.log(`❌ Failed to create ${errorCount} wells`);
    }
    console.log('='.repeat(80));

    // Verify wells were created
    console.log('\n🔍 Verifying wells in database...');
    const { data: allWells } = await client.models.Well.list();
    console.log(`✅ Found ${allWells?.length || 0} wells in database`);

    if (allWells && allWells.length > 0) {
      console.log('\n📋 Sample Wells:');
      allWells.slice(0, 5).forEach(well => {
        console.log(`  - ${well.id}: ${well.name} (Health: ${well.healthScore}%)`);
      });
    }

    return true;

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    return false;
  }
}

// Run the script
populateWells()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
