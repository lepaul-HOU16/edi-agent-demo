/**
 * Maintenance History Handler
 * Retrieves and analyzes maintenance history for equipment
 * Requirements: 4.4
 */

interface MaintenanceHistoryResult {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
}

/**
 * Handle maintenance history queries
 */
export async function handleMaintenanceHistory(
  message: string,
  equipmentId?: string
): Promise<MaintenanceHistoryResult> {
  console.log('📜 Maintenance History Handler - Start');
  console.log('Equipment ID:', equipmentId);

  try {
    // Validate equipment ID
    if (!equipmentId) {
      return {
        success: false,
        message: 'Please specify an equipment ID (e.g., PUMP-001, COMP-123) to retrieve maintenance history.',
        artifacts: [],
        thoughtSteps: [{
          type: 'error',
          title: 'Missing Equipment ID',
          summary: 'Equipment ID is required for maintenance history',
          status: 'error',
          timestamp: Date.now()
        }]
      };
    }

    // Get maintenance history
    const historyData = getMockMaintenanceHistory(equipmentId);

    if (!historyData) {
      return {
        success: false,
        message: `No maintenance history found for equipment ${equipmentId}.`,
        artifacts: [],
        thoughtSteps: [{
          type: 'error',
          title: 'No History Found',
          summary: `No maintenance records for ${equipmentId}`,
          status: 'error',
          timestamp: Date.now()
        }]
      };
    }

    // Create maintenance history artifact
    const artifact = {
      messageContentType: 'maintenance_schedule',
      title: `Maintenance History: ${historyData.equipmentName}`,
      subtitle: `${historyData.records.length} records | Last maintenance: ${historyData.lastMaintenanceDate}`,
      data: {
        equipmentId: historyData.equipmentId,
        equipmentName: historyData.equipmentName,
        records: historyData.records,
        statistics: historyData.statistics,
        trends: historyData.trends
      },
      visualizationType: 'table'
    };

    // Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'History Retrieval',
        summary: `Retrieved ${historyData.records.length} maintenance records`,
        details: `Period: ${historyData.records[historyData.records.length - 1].date} to ${historyData.records[0].date}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Maintenance Statistics',
        summary: `Total cost: $${historyData.statistics.totalCost.toLocaleString()}, Total downtime: ${historyData.statistics.totalDowntime} hours`,
        details: `Preventive: ${historyData.statistics.preventiveCount}, Corrective: ${historyData.statistics.correctiveCount}, Inspections: ${historyData.statistics.inspectionCount}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Trend Analysis',
        summary: historyData.trends.summary,
        details: historyData.trends.details,
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const message = getHistoryMessage(historyData);

    console.log('✅ Maintenance History Handler - Complete');
    return {
      success: true,
      message,
      artifacts: [artifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Maintenance History Handler - Error:', error);
    return {
      success: false,
      message: `Error retrieving maintenance history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to retrieve maintenance history',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Get mock maintenance history (replace with database query in production)
 */
function getMockMaintenanceHistory(equipmentId: string): any {
  const historyDatabase: Record<string, any> = {
    'PUMP-001': {
      equipmentId: 'PUMP-001',
      equipmentName: 'Primary Cooling Pump',
      lastMaintenanceDate: '2024-12-01',
      records: [
        {
          id: 'MR-001',
          date: '2024-12-01',
          type: 'preventive',
          description: 'Quarterly bearing lubrication and inspection',
          technician: 'John Smith',
          duration: 2,
          cost: 150,
          partsReplaced: ['Bearing grease'],
          findings: 'Bearings in good condition, no unusual wear',
          recommendations: 'Continue quarterly lubrication schedule'
        },
        {
          id: 'MR-002',
          date: '2024-09-15',
          type: 'inspection',
          description: 'Vibration analysis',
          technician: 'Sarah Johnson',
          duration: 1.5,
          cost: 200,
          partsReplaced: [],
          findings: 'Vibration levels within acceptable range',
          recommendations: 'Monitor vibration trends, next analysis in 3 months'
        },
        {
          id: 'MR-003',
          date: '2024-08-10',
          type: 'preventive',
          description: 'Seal replacement',
          technician: 'Mike Davis',
          duration: 3,
          cost: 300,
          partsReplaced: ['Mechanical seal kit'],
          findings: 'Old seal showing signs of wear',
          recommendations: 'Seal replaced successfully, monitor for leaks'
        },
        {
          id: 'MR-004',
          date: '2024-06-01',
          type: 'preventive',
          description: 'Quarterly bearing lubrication',
          technician: 'John Smith',
          duration: 2,
          cost: 150,
          partsReplaced: ['Bearing grease'],
          findings: 'Routine maintenance completed',
          recommendations: 'Continue current schedule'
        },
        {
          id: 'MR-005',
          date: '2024-03-15',
          type: 'corrective',
          description: 'Coupling alignment correction',
          technician: 'Tom Wilson',
          duration: 4,
          cost: 500,
          partsReplaced: ['Alignment shims'],
          findings: 'Misalignment detected during vibration analysis',
          recommendations: 'Alignment corrected, vibration levels normalized'
        }
      ]
    },
    'COMP-123': {
      equipmentId: 'COMP-123',
      equipmentName: 'Main Air Compressor',
      lastMaintenanceDate: '2024-11-15',
      records: [
        {
          id: 'MR-101',
          date: '2024-11-15',
          type: 'preventive',
          description: 'Oil change and filter replacement',
          technician: 'Mike Davis',
          duration: 3,
          cost: 400,
          partsReplaced: ['Compressor oil', 'Oil filter', 'Air filter'],
          findings: 'Oil contaminated, filters clogged',
          recommendations: 'Consider more frequent oil changes due to heavy usage'
        },
        {
          id: 'MR-102',
          date: '2024-09-20',
          type: 'corrective',
          description: 'Pressure relief valve replacement',
          technician: 'Sarah Johnson',
          duration: 2,
          cost: 350,
          partsReplaced: ['Pressure relief valve'],
          findings: 'Valve stuck, not releasing at set pressure',
          recommendations: 'Valve replaced, system tested successfully'
        },
        {
          id: 'MR-103',
          date: '2024-07-10',
          type: 'inspection',
          description: 'Thermal imaging inspection',
          technician: 'Tom Wilson',
          duration: 1,
          cost: 150,
          partsReplaced: [],
          findings: 'Hot spots detected on motor connections',
          recommendations: 'Tighten electrical connections, monitor temperature'
        },
        {
          id: 'MR-104',
          date: '2024-05-15',
          type: 'preventive',
          description: 'Oil change and filter replacement',
          technician: 'Mike Davis',
          duration: 3,
          cost: 400,
          partsReplaced: ['Compressor oil', 'Oil filter', 'Air filter'],
          findings: 'Routine maintenance completed',
          recommendations: 'Continue current schedule'
        },
        {
          id: 'MR-105',
          date: '2024-02-28',
          type: 'corrective',
          description: 'Motor bearing replacement',
          technician: 'John Smith',
          duration: 8,
          cost: 2000,
          partsReplaced: ['Motor bearing set', 'Coupling'],
          findings: 'Bearing failure due to excessive vibration',
          recommendations: 'Bearings replaced, implement vibration monitoring'
        }
      ]
    }
  };

  const history = historyDatabase[equipmentId];
  if (!history) return null;

  // Calculate statistics
  const statistics = {
    totalRecords: history.records.length,
    totalCost: history.records.reduce((sum: number, r: any) => sum + r.cost, 0),
    totalDowntime: history.records.reduce((sum: number, r: any) => sum + r.duration, 0),
    preventiveCount: history.records.filter((r: any) => r.type === 'preventive').length,
    correctiveCount: history.records.filter((r: any) => r.type === 'corrective').length,
    inspectionCount: history.records.filter((r: any) => r.type === 'inspection').length,
    averageCost: history.records.reduce((sum: number, r: any) => sum + r.cost, 0) / history.records.length,
    averageDuration: history.records.reduce((sum: number, r: any) => sum + r.duration, 0) / history.records.length
  };

  // Analyze trends
  const correctiveRatio = statistics.correctiveCount / statistics.totalRecords;
  const trends = {
    summary: correctiveRatio > 0.3 
      ? 'Increasing corrective maintenance indicates potential reliability issues'
      : 'Good preventive maintenance compliance',
    details: `Preventive/Corrective ratio: ${(statistics.preventiveCount / Math.max(statistics.correctiveCount, 1)).toFixed(2)}:1`,
    recommendation: correctiveRatio > 0.3
      ? 'Consider increasing preventive maintenance frequency'
      : 'Continue current maintenance strategy'
  };

  return {
    ...history,
    statistics,
    trends
  };
}

/**
 * Generate history message
 */
function getHistoryMessage(history: any): string {
  let message = `📜 Maintenance History for ${history.equipmentName} (${history.equipmentId})\n\n`;
  message += `Total Records: ${history.statistics.totalRecords}\n`;
  message += `Total Cost: $${history.statistics.totalCost.toLocaleString()}\n`;
  message += `Total Downtime: ${history.statistics.totalDowntime} hours\n`;
  message += `Last Maintenance: ${history.lastMaintenanceDate}\n\n`;

  message += `Maintenance Breakdown:\n`;
  message += `• Preventive: ${history.statistics.preventiveCount} (${((history.statistics.preventiveCount / history.statistics.totalRecords) * 100).toFixed(0)}%)\n`;
  message += `• Corrective: ${history.statistics.correctiveCount} (${((history.statistics.correctiveCount / history.statistics.totalRecords) * 100).toFixed(0)}%)\n`;
  message += `• Inspections: ${history.statistics.inspectionCount} (${((history.statistics.inspectionCount / history.statistics.totalRecords) * 100).toFixed(0)}%)\n\n`;

  message += `Average Cost per Maintenance: $${history.statistics.averageCost.toFixed(0)}\n`;
  message += `Average Duration: ${history.statistics.averageDuration.toFixed(1)} hours\n\n`;

  message += `Trend Analysis:\n`;
  message += `${history.trends.summary}\n`;
  message += `${history.trends.details}\n`;
  message += `Recommendation: ${history.trends.recommendation}\n\n`;

  message += `Recent Maintenance Activities:\n`;
  history.records.slice(0, 3).forEach((record: any) => {
    message += `• ${record.date}: ${record.description} (${record.type})\n`;
    message += `  Technician: ${record.technician}, Duration: ${record.duration}h, Cost: $${record.cost}\n`;
  });

  return message;
}
