/**
 * Equipment Status Handler
 * Provides current operational status and health metrics for equipment
 * Requirements: 1.1, 1.4, 4.1
 */

import { wellDataService, Well } from '../../shared/wellDataService';
import { wellAnalysisEngine, NoteworthyConditions, PriorityAction } from '../../shared/wellAnalysisEngine';

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
  console.log('Message:', message);

  try {
    // Check if user is asking for all equipment/wells
    const lowerMessage = message.toLowerCase();
    const isAllQuery = /all.*wells|all.*equipment|all.*my.*wells|all.*my.*equipment/.test(lowerMessage);
    
    if (isAllQuery) {
      // Detect if specifically asking for wells vs general equipment
      const isWellsQuery = /all.*wells|all.*my.*wells|show.*all.*wells|status.*all.*wells/.test(lowerMessage);
      
      if (isWellsQuery) {
        console.log('📊 Handling query for all wells with AI analysis');
        return await handleAllWellsStatus(message);
      } else {
        console.log('📊 Handling query for all equipment');
        return await handleAllEquipmentStatus(message);
      }
    }
    
    // Validate equipment ID for single equipment query
    if (!equipmentId) {
      return {
        success: false,
        message: 'Please specify an equipment ID (e.g., PUMP-001, COMP-123, WELL-001) to check status, or ask for "all equipment" to see all statuses.',
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
 * Handle query for all equipment status
 * Uses Well Data Service for data retrieval
 */
async function handleAllEquipmentStatus(message: string): Promise<EquipmentStatusResult> {
  console.log('📊 Retrieving status for all equipment');

  try {
    // Get all equipment from database
    const allEquipment = getAllEquipment();
    
    // Filter by type if specified in message
    const lowerMessage = message.toLowerCase();
    let filteredEquipment = allEquipment;
    
    if (lowerMessage.includes('well')) {
      filteredEquipment = allEquipment.filter(eq => eq.type === 'well');
    } else if (lowerMessage.includes('pump')) {
      filteredEquipment = allEquipment.filter(eq => eq.type === 'pump');
    } else if (lowerMessage.includes('compressor')) {
      filteredEquipment = allEquipment.filter(eq => eq.type === 'compressor');
    } else if (lowerMessage.includes('turbine')) {
      filteredEquipment = allEquipment.filter(eq => eq.type === 'turbine');
    }

    console.log(`Found ${filteredEquipment.length} equipment items`);

    // Create artifacts for each equipment
    const artifacts = filteredEquipment.map(equipment => {
      const alerts = equipment.sensors
        .filter((sensor: any) => {
          const status = getSensorStatus(sensor);
          return status === 'critical' || status === 'warning';
        })
        .map((sensor: any) => ({
          severity: getSensorStatus(sensor) === 'critical' ? 'critical' : 'high',
          message: `${sensor.type} reading ${sensor.currentValue} ${sensor.unit} is ${getSensorStatus(sensor) === 'critical' ? 'above critical threshold' : 'elevated'}`
        }));

      return {
        messageContentType: 'equipment_health',
        title: `${equipment.name}`,
        subtitle: `ID: ${equipment.id} | Type: ${equipment.type}`,
        equipmentHealth: {
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          healthScore: equipment.healthScore,
          operationalStatus: equipment.operationalStatus,
          lastMaintenanceDate: equipment.lastMaintenanceDate,
          nextMaintenanceDate: equipment.nextMaintenanceDate,
          metrics: {
            temperature: equipment.sensors.find((s: any) => s.type === 'temperature')?.currentValue,
            vibration: equipment.sensors.find((s: any) => s.type === 'vibration')?.currentValue,
            pressure: equipment.sensors.find((s: any) => s.type === 'pressure')?.currentValue,
            efficiency: equipment.healthScore
          },
          alerts: alerts.length > 0 ? alerts : undefined
        }
      };
    });

    // Create summary statistics
    const avgHealthScore = Math.round(
      filteredEquipment.reduce((sum, eq) => sum + eq.healthScore, 0) / filteredEquipment.length
    );
    const operationalCount = filteredEquipment.filter(eq => eq.operationalStatus === 'operational').length;
    const degradedCount = filteredEquipment.filter(eq => eq.operationalStatus === 'degraded').length;
    const criticalCount = filteredEquipment.filter(eq => eq.healthScore < 60).length;

    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Equipment Inventory',
        summary: `Found ${filteredEquipment.length} equipment items`,
        details: `${operationalCount} operational, ${degradedCount} degraded`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Health Assessment',
        summary: `Average health score: ${avgHealthScore}/100`,
        details: `${criticalCount} equipment items require attention`,
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const equipmentType = lowerMessage.includes('well') ? 'wells' : 
                         lowerMessage.includes('pump') ? 'pumps' :
                         lowerMessage.includes('compressor') ? 'compressors' :
                         lowerMessage.includes('turbine') ? 'turbines' : 'equipment items';

    const statusMessage = `Found ${filteredEquipment.length} ${equipmentType}. ` +
      `${operationalCount} operational, ${degradedCount} degraded. ` +
      `Average health score: ${avgHealthScore}/100. ` +
      (criticalCount > 0 ? `⚠️ ${criticalCount} items require immediate attention.` : 'All items within acceptable parameters.');

    return {
      success: true,
      message: statusMessage,
      artifacts,
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Error retrieving all equipment status:', error);
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
 * Handle query for all wells status with AI analysis
 * Uses Well Data Service and AI Analysis Engine
 * Requirements: 1.1, 1.4, 4.1
 */
async function handleAllWellsStatus(message: string): Promise<EquipmentStatusResult> {
  console.log('📊 Retrieving status for all wells with AI analysis');

  try {
    // Step 1: Get all wells from Well Data Service
    const wells = await wellDataService.getAllWells();
    console.log(`✅ Retrieved ${wells.length} wells from Well Data Service`);

    // Step 2: Get fleet health metrics
    const fleetMetrics = await wellDataService.getFleetHealthMetrics();
    console.log('✅ Calculated fleet health metrics:', fleetMetrics);

    // Step 3: Analyze noteworthy conditions using AI Analysis Engine
    const noteworthyConditions = wellAnalysisEngine.analyzeNoteworthyConditions(wells);
    console.log('✅ AI analysis complete - noteworthy conditions identified');

    // Step 4: Generate priority actions
    const priorityActions = wellAnalysisEngine.generatePriorityActions(wells, noteworthyConditions);
    console.log(`✅ Generated ${priorityActions.length} priority actions`);

    // Step 5: Get comparative performance
    const comparativePerformance = wellAnalysisEngine.getComparativePerformance(wells);
    console.log('✅ Comparative performance analysis complete');

    // Step 6: Generate consolidated dashboard artifact
    const dashboardArtifact = generateConsolidatedDashboardArtifact(
      wells,
      fleetMetrics,
      noteworthyConditions,
      priorityActions,
      comparativePerformance
    );

    // Step 7: Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Data Retrieval',
        summary: `Retrieved ${wells.length} wells from database`,
        details: `Using Well Data Service with caching`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Fleet Health Assessment',
        summary: `Fleet health score: ${fleetMetrics.averageHealthScore}/100`,
        details: `${fleetMetrics.operational} operational, ${fleetMetrics.degraded} degraded, ${fleetMetrics.critical} critical`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'AI Analysis',
        summary: `Identified ${noteworthyConditions.criticalIssues.length} critical issues, ${noteworthyConditions.decliningHealth.length} declining health trends`,
        details: `Generated ${priorityActions.length} priority actions`,
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    // Step 8: Generate summary message
    const statusMessage = generateFleetSummaryMessage(fleetMetrics, noteworthyConditions, priorityActions);

    console.log('✅ All wells status handler complete');
    return {
      success: true,
      message: statusMessage,
      artifacts: [dashboardArtifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Error retrieving all wells status:', error);
    return {
      success: false,
      message: `Error retrieving wells status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to retrieve wells status',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Generate consolidated dashboard artifact
 * Requirements: 2.1, 2.2, 2.3, 6.1, 6.2
 */
function generateConsolidatedDashboardArtifact(
  wells: Well[],
  fleetMetrics: any,
  noteworthyConditions: NoteworthyConditions,
  priorityActions: PriorityAction[],
  comparativePerformance: any
): any {
  console.log('🎨 Generating consolidated dashboard artifact');

  // Calculate additional metrics
  const wellsNeedingAttention = wells.filter(w => w.healthScore < 70).length;
  const upcomingMaintenance = wells.filter(w => {
    const daysUntilMaintenance = Math.ceil(
      (new Date(w.nextMaintenanceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0;
  }).length;

  // Generate chart data
  const charts = generateChartData(wells);

  // Create well summaries
  const wellSummaries = wells.map(w => ({
    id: w.id,
    name: w.name,
    healthScore: w.healthScore,
    status: w.operationalStatus,
    alertCount: w.alerts.length,
    criticalAlertCount: w.alerts.filter(a => a.severity === 'critical').length,
    lastMaintenance: w.lastMaintenanceDate,
    nextMaintenance: w.nextMaintenanceDate,
    location: w.location,
    keyMetrics: {
      temperature: w.sensors.find(s => s.type === 'temperature')?.currentValue,
      pressure: w.sensors.find(s => s.type === 'pressure')?.currentValue,
      flowRate: w.sensors.find(s => s.type === 'flow_rate')?.currentValue,
      production: w.metadata.production.currentRate
    }
  }));

  const artifact = {
    messageContentType: 'wells_equipment_dashboard',
    title: 'Wells Equipment Status Dashboard',
    subtitle: `${wells.length} wells monitored`,
    dashboard: {
      summary: {
        totalWells: fleetMetrics.totalWells,
        operational: fleetMetrics.operational,
        degraded: fleetMetrics.degraded,
        critical: fleetMetrics.critical,
        offline: fleetMetrics.offline,
        fleetHealthScore: fleetMetrics.averageHealthScore,
        criticalAlerts: fleetMetrics.criticalAlerts,
        wellsNeedingAttention,
        upcomingMaintenance
      },
      noteworthyConditions: {
        criticalIssues: noteworthyConditions.criticalIssues,
        decliningHealth: noteworthyConditions.decliningHealth,
        maintenanceOverdue: noteworthyConditions.maintenanceOverdue,
        topPerformers: noteworthyConditions.topPerformers,
        unusualPatterns: noteworthyConditions.unusualPatterns
      },
      priorityActions,
      wells: wellSummaries,
      charts,
      comparativePerformance: {
        topByHealth: comparativePerformance.topByHealth.map((w: Well) => ({
          id: w.id,
          name: w.name,
          healthScore: w.healthScore,
          status: w.operationalStatus
        })),
        bottomByHealth: comparativePerformance.bottomByHealth.map((w: Well) => ({
          id: w.id,
          name: w.name,
          healthScore: w.healthScore,
          status: w.operationalStatus
        })),
        topByProduction: comparativePerformance.topByProduction.map((w: Well) => ({
          id: w.id,
          name: w.name,
          production: w.metadata.production.currentRate,
          efficiency: w.metadata.production.efficiency
        })),
        bottomByProduction: comparativePerformance.bottomByProduction.map((w: Well) => ({
          id: w.id,
          name: w.name,
          production: w.metadata.production.currentRate,
          efficiency: w.metadata.production.efficiency
        }))
      },
      timestamp: new Date().toISOString()
    }
  };

  console.log('✅ Consolidated dashboard artifact generated');
  return artifact;
}

/**
 * Generate chart data for visualizations
 */
function generateChartData(wells: Well[]): any {
  // Health distribution (histogram buckets)
  const healthDistribution = {
    '0-20': wells.filter(w => w.healthScore >= 0 && w.healthScore <= 20).length,
    '21-40': wells.filter(w => w.healthScore >= 21 && w.healthScore <= 40).length,
    '41-60': wells.filter(w => w.healthScore >= 41 && w.healthScore <= 60).length,
    '61-80': wells.filter(w => w.healthScore >= 61 && w.healthScore <= 80).length,
    '81-100': wells.filter(w => w.healthScore >= 81 && w.healthScore <= 100).length
  };

  // Status breakdown (pie chart)
  const statusBreakdown = {
    operational: wells.filter(w => w.operationalStatus === 'operational').length,
    degraded: wells.filter(w => w.operationalStatus === 'degraded').length,
    critical: wells.filter(w => w.operationalStatus === 'critical').length,
    offline: wells.filter(w => w.operationalStatus === 'offline').length
  };

  // Fleet trend (30-day mock data - in production, this would come from historical data)
  const fleetTrend = generateMockFleetTrend(wells);

  // Alert heatmap (30-day mock data)
  const alertHeatmap = generateMockAlertHeatmap(wells);

  return {
    healthDistribution,
    statusBreakdown,
    fleetTrend,
    alertHeatmap
  };
}

/**
 * Generate mock fleet trend data (30 days)
 */
function generateMockFleetTrend(wells: Well[]): any[] {
  const currentAvg = wells.reduce((sum, w) => sum + w.healthScore, 0) / wells.length;
  const trend = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate slight variation around current average
    const variation = (Math.random() - 0.5) * 10;
    const value = Math.max(0, Math.min(100, currentAvg + variation));
    
    trend.push({
      date: date.toISOString().split('T')[0],
      averageHealth: Math.round(value)
    });
  }
  
  return trend;
}

/**
 * Generate mock alert heatmap data (30 days)
 */
function generateMockAlertHeatmap(wells: Well[]): any[] {
  const heatmap = [];
  const currentAlertRate = wells.reduce((sum, w) => sum + w.alerts.length, 0) / wells.length;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate alert frequency
    const alertCount = Math.max(0, Math.round(currentAlertRate + (Math.random() - 0.5) * 5));
    
    heatmap.push({
      date: date.toISOString().split('T')[0],
      alertCount
    });
  }
  
  return heatmap;
}

/**
 * Generate fleet summary message
 */
function generateFleetSummaryMessage(
  fleetMetrics: any,
  noteworthyConditions: NoteworthyConditions,
  priorityActions: PriorityAction[]
): string {
  let message = `Fleet Status: ${fleetMetrics.totalWells} wells monitored. `;
  message += `Fleet health score: ${fleetMetrics.averageHealthScore}/100. `;
  message += `${fleetMetrics.operational} operational, ${fleetMetrics.degraded} degraded, ${fleetMetrics.critical} critical. `;
  
  if (noteworthyConditions.criticalIssues.length > 0) {
    message += `⚠️ ${noteworthyConditions.criticalIssues.length} critical issues require immediate attention. `;
  }
  
  if (noteworthyConditions.decliningHealth.length > 0) {
    message += `📉 ${noteworthyConditions.decliningHealth.length} wells showing declining health trends. `;
  }
  
  if (priorityActions.length > 0) {
    const urgentActions = priorityActions.filter(a => a.priority === 'urgent').length;
    if (urgentActions > 0) {
      message += `🚨 ${urgentActions} urgent actions required. `;
    }
  }
  
  if (noteworthyConditions.topPerformers.length > 0) {
    message += `✅ ${noteworthyConditions.topPerformers.length} wells performing excellently. `;
  }
  
  return message.trim();
}

/**
 * Get all equipment from database
 */
function getAllEquipment(): any[] {
  const equipment: any[] = [];
  
  // Add 24 wells (matching the original demo context)
  for (let i = 1; i <= 24; i++) {
    const wellId = `WELL-${String(i).padStart(3, '0')}`;
    equipment.push(getMockEquipmentData(wellId));
  }
  
  // Add other equipment types
  equipment.push(getMockEquipmentData('PUMP-001'));
  equipment.push(getMockEquipmentData('COMP-123'));
  equipment.push(getMockEquipmentData('TURB-456'));
  
  return equipment.filter(Boolean);
}

/**
 * Generate well data dynamically for 24 wells
 */
function generateWellData(wellNumber: number): any {
  const wellId = `WELL-${String(wellNumber).padStart(3, '0')}`;
  
  // Vary parameters based on well number for realistic diversity
  const baseHealthScore = 75 + (wellNumber % 20);
  const operationalStatus = baseHealthScore > 70 ? 'operational' : 'degraded';
  const basePressure = 2500 + (wellNumber * 50);
  const baseTemp = 170 + (wellNumber * 2);
  const baseFlowRate = 400 + (wellNumber * 10);
  
  // Determine sector based on well number
  const sector = Math.ceil(wellNumber / 6);
  
  return {
    id: wellId,
    name: `Production Well ${String(wellNumber).padStart(3, '0')}`,
    type: 'well',
    location: `Field A - Sector ${sector}`,
    manufacturer: 'Schlumberger',
    model: 'ESP-1000',
    serialNumber: `SLB-2023-${String(wellNumber).padStart(3, '0')}`,
    installDate: `2023-${String(Math.floor(wellNumber / 2) + 1).padStart(2, '0')}-15`,
    operationalStatus,
    healthScore: baseHealthScore,
    lastMaintenanceDate: '2024-12-15',
    nextMaintenanceDate: '2025-03-15',
    sensors: [
      {
        type: 'pressure',
        currentValue: basePressure,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 }
      },
      {
        type: 'temperature',
        currentValue: baseTemp,
        unit: '°F',
        normalRange: { min: 150, max: 200 },
        alertThreshold: { warning: 210, critical: 230 }
      },
      {
        type: 'flow_rate',
        currentValue: baseFlowRate,
        unit: 'BPD',
        normalRange: { min: 400, max: 500 },
        alertThreshold: { warning: 350, critical: 300 }
      }
    ]
  };
}

/**
 * Get mock equipment data (replace with actual database query in production)
 */
function getMockEquipmentData(equipmentId: string): any {
  // Handle well IDs dynamically
  const wellMatch = equipmentId.match(/^WELL-(\d{3})$/);
  if (wellMatch) {
    const wellNumber = parseInt(wellMatch[1], 10);
    if (wellNumber >= 1 && wellNumber <= 24) {
      return generateWellData(wellNumber);
    }
  }
  
  // Static equipment database for non-well equipment
  const equipmentDatabase: Record<string, any> = {
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
