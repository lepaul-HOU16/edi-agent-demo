/**
 * Equipment Status Handler
 * Provides current operational status and health metrics for equipment
 * Requirements: 4.1
 */

interface EquipmentStatusResult {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
}

/**
 * Handle equipment status queries
 */
export async function handleEquipmentStatus(
  message: string,
  equipmentId?: string
): Promise<EquipmentStatusResult> {
  console.log('📊 Equipment Status Handler - Start');
  console.log('Equipment ID:', equipmentId);

  try {
    // Validate equipment ID
    if (!equipmentId) {
      return {
        success: false,
        message: 'Please specify an equipment ID (e.g., PUMP-001, COMP-123) to check status.',
        artifacts: [],
        thoughtSteps: [{
          type: 'error',
          title: 'Missing Equipment ID',
          summary: 'Equipment ID is required for status check',
          status: 'error',
          timestamp: Date.now()
        }]
      };
    }

    // Mock equipment data (in production, this would query a database)
    const equipmentData = getMockEquipmentData(equipmentId);

    if (!equipmentData) {
      return {
        success: false,
        message: `Equipment ${equipmentId} not found in the system. Please verify the equipment ID.`,
        artifacts: [],
        thoughtSteps: [{
          type: 'error',
          title: 'Equipment Not Found',
          summary: `No equipment found with ID: ${equipmentId}`,
          status: 'error',
          timestamp: Date.now()
        }]
      };
    }

    // Collect alerts from sensors
    const alerts = equipmentData.sensors
      .filter((sensor: any) => {
        const status = getSensorStatus(sensor);
        return status === 'critical' || status === 'warning';
      })
      .map((sensor: any) => ({
        severity: getSensorStatus(sensor) === 'critical' ? 'critical' : 
                 getSensorStatus(sensor) === 'warning' ? 'high' : 'medium',
        message: `${sensor.type} reading ${sensor.currentValue} ${sensor.unit} is ${getSensorStatus(sensor) === 'critical' ? 'above critical threshold' : 'elevated'}`
      }));

    // Generate recommendations based on equipment status
    const recommendations = [];
    if (equipmentData.healthScore < 70) {
      recommendations.push('Schedule immediate inspection to assess equipment condition');
    }
    if (alerts.length > 0) {
      recommendations.push('Address sensor alerts to prevent potential equipment failure');
    }
    const daysSinceLastMaintenance = Math.floor(
      (new Date().getTime() - new Date(equipmentData.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastMaintenance > 90) {
      recommendations.push('Consider advancing next maintenance date due to time since last service');
    }

    // Create equipment health artifact matching the component's expected structure
    const artifact = {
      messageContentType: 'equipment_health',
      title: `Equipment Status: ${equipmentData.name}`,
      subtitle: `ID: ${equipmentId} | Type: ${equipmentData.type}`,
      equipmentHealth: {
        equipmentId: equipmentData.id,
        equipmentName: equipmentData.name,
        healthScore: equipmentData.healthScore,
        operationalStatus: equipmentData.operationalStatus,
        lastMaintenanceDate: equipmentData.lastMaintenanceDate,
        nextMaintenanceDate: equipmentData.nextMaintenanceDate,
        metrics: {
          temperature: equipmentData.sensors.find((s: any) => s.type === 'temperature')?.currentValue,
          vibration: equipmentData.sensors.find((s: any) => s.type === 'vibration')?.currentValue,
          pressure: equipmentData.sensors.find((s: any) => s.type === 'pressure')?.currentValue,
          efficiency: equipmentData.healthScore // Use health score as efficiency proxy
        },
        alerts: alerts.length > 0 ? alerts : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      }
    };

    // Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Equipment Identification',
        summary: `Located equipment ${equipmentId}: ${equipmentData.name}`,
        details: `Type: ${equipmentData.type}, Location: ${equipmentData.location}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Health Assessment',
        summary: `Health Score: ${equipmentData.healthScore}/100 - ${getHealthStatus(equipmentData.healthScore)}`,
        details: `Operational Status: ${equipmentData.operationalStatus}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Sensor Readings',
        summary: `Analyzed ${equipmentData.sensors.length} sensor readings`,
        details: equipmentData.sensors.map(s => 
          `${s.type}: ${s.currentValue} ${s.unit} (${getSensorStatus(s)})`
        ).join(', '),
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const statusMessage = getStatusMessage(equipmentData);

    console.log('✅ Equipment Status Handler - Complete');
    return {
      success: true,
      message: statusMessage,
      artifacts: [artifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Equipment Status Handler - Error:', error);
    return {
      success: false,
      message: `Error retrieving equipment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to retrieve equipment status',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Get mock equipment data (replace with actual database query in production)
 */
function getMockEquipmentData(equipmentId: string): any {
  const equipmentDatabase: Record<string, any> = {
    'WELL-001': {
      id: 'WELL-001',
      name: 'Production Well 001',
      type: 'well',
      location: 'Field A - Sector 1',
      manufacturer: 'Schlumberger',
      model: 'ESP-1000',
      serialNumber: 'SLB-2023-001',
      installDate: '2023-03-20',
      operationalStatus: 'operational',
      healthScore: 92,
      lastMaintenanceDate: '2024-12-15',
      nextMaintenanceDate: '2025-03-15',
      sensors: [
        {
          type: 'pressure',
          currentValue: 2850,
          unit: 'PSI',
          normalRange: { min: 2500, max: 3000 },
          alertThreshold: { warning: 3100, critical: 3300 }
        },
        {
          type: 'temperature',
          currentValue: 185,
          unit: '°F',
          normalRange: { min: 150, max: 200 },
          alertThreshold: { warning: 210, critical: 230 }
        },
        {
          type: 'flow_rate',
          currentValue: 450,
          unit: 'BPD',
          normalRange: { min: 400, max: 500 },
          alertThreshold: { warning: 350, critical: 300 }
        }
      ]
    },
    'PUMP-001': {
      id: 'PUMP-001',
      name: 'Primary Cooling Pump',
      type: 'pump',
      location: 'Building A - Mechanical Room',
      manufacturer: 'Flowserve',
      model: 'HPX-500',
      serialNumber: 'FSV-2023-001',
      installDate: '2023-01-15',
      operationalStatus: 'operational',
      healthScore: 85,
      lastMaintenanceDate: '2024-12-01',
      nextMaintenanceDate: '2025-03-01',
      sensors: [
        {
          type: 'temperature',
          currentValue: 72,
          unit: '°F',
          normalRange: { min: 60, max: 80 },
          alertThreshold: { warning: 85, critical: 95 }
        },
        {
          type: 'vibration',
          currentValue: 0.15,
          unit: 'in/s',
          normalRange: { min: 0, max: 0.2 },
          alertThreshold: { warning: 0.25, critical: 0.35 }
        },
        {
          type: 'pressure',
          currentValue: 125,
          unit: 'PSI',
          normalRange: { min: 100, max: 150 },
          alertThreshold: { warning: 160, critical: 180 }
        }
      ]
    },
    'COMP-123': {
      id: 'COMP-123',
      name: 'Main Air Compressor',
      type: 'compressor',
      location: 'Building B - Compressor Station',
      manufacturer: 'Atlas Copco',
      model: 'GA-75',
      serialNumber: 'AC-2022-123',
      installDate: '2022-06-10',
      operationalStatus: 'degraded',
      healthScore: 65,
      lastMaintenanceDate: '2024-11-15',
      nextMaintenanceDate: '2025-02-15',
      sensors: [
        {
          type: 'temperature',
          currentValue: 88,
          unit: '°F',
          normalRange: { min: 60, max: 85 },
          alertThreshold: { warning: 90, critical: 100 }
        },
        {
          type: 'vibration',
          currentValue: 0.28,
          unit: 'in/s',
          normalRange: { min: 0, max: 0.2 },
          alertThreshold: { warning: 0.25, critical: 0.35 }
        },
        {
          type: 'pressure',
          currentValue: 145,
          unit: 'PSI',
          normalRange: { min: 120, max: 150 },
          alertThreshold: { warning: 160, critical: 180 }
        }
      ]
    },
    'TURB-456': {
      id: 'TURB-456',
      name: 'Gas Turbine Generator',
      type: 'turbine',
      location: 'Power Plant - Unit 4',
      manufacturer: 'General Electric',
      model: 'LM6000',
      serialNumber: 'GE-2021-456',
      installDate: '2021-09-15',
      operationalStatus: 'operational',
      healthScore: 88,
      lastMaintenanceDate: '2024-11-30',
      nextMaintenanceDate: '2025-02-28',
      sensors: [
        {
          type: 'temperature',
          currentValue: 1050,
          unit: '°F',
          normalRange: { min: 900, max: 1100 },
          alertThreshold: { warning: 1150, critical: 1200 }
        },
        {
          type: 'vibration',
          currentValue: 0.18,
          unit: 'in/s',
          normalRange: { min: 0, max: 0.25 },
          alertThreshold: { warning: 0.30, critical: 0.40 }
        },
        {
          type: 'power_output',
          currentValue: 42.5,
          unit: 'MW',
          normalRange: { min: 40, max: 45 },
          alertThreshold: { warning: 38, critical: 35 }
        },
        {
          type: 'fuel_flow',
          currentValue: 2850,
          unit: 'lb/hr',
          normalRange: { min: 2500, max: 3000 },
          alertThreshold: { warning: 3100, critical: 3300 }
        }
      ]
    }
  };

  return equipmentDatabase[equipmentId];
}

/**
 * Get sensor status based on current value
 */
function getSensorStatus(sensor: any): string {
  const value = sensor.currentValue;
  
  if (value >= sensor.alertThreshold.critical || value < sensor.normalRange.min) {
    return 'critical';
  }
  if (value >= sensor.alertThreshold.warning) {
    return 'warning';
  }
  if (value >= sensor.normalRange.min && value <= sensor.normalRange.max) {
    return 'normal';
  }
  return 'unknown';
}

/**
 * Get health status description
 */
function getHealthStatus(healthScore: number): string {
  if (healthScore >= 90) return 'Excellent';
  if (healthScore >= 75) return 'Good';
  if (healthScore >= 60) return 'Fair';
  if (healthScore >= 40) return 'Poor';
  return 'Critical';
}

/**
 * Generate status message
 */
function getStatusMessage(equipment: any): string {
  const healthStatus = getHealthStatus(equipment.healthScore);
  const criticalSensors = equipment.sensors.filter((s: any) => getSensorStatus(s) === 'critical');
  const warningSensors = equipment.sensors.filter((s: any) => getSensorStatus(s) === 'warning');

  let message = `Equipment ${equipment.id} (${equipment.name}) is currently ${equipment.operationalStatus} with a health score of ${equipment.healthScore}/100 (${healthStatus}).`;

  if (criticalSensors.length > 0) {
    message += ` ⚠️ CRITICAL: ${criticalSensors.length} sensor(s) in critical state.`;
  } else if (warningSensors.length > 0) {
    message += ` ⚠️ WARNING: ${warningSensors.length} sensor(s) showing elevated readings.`;
  } else {
    message += ` All sensors are operating within normal parameters.`;
  }

  message += ` Last maintenance: ${equipment.lastMaintenanceDate}. Next scheduled: ${equipment.nextMaintenanceDate}.`;

  return message;
}
