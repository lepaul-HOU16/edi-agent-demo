/**
 * Preventive Maintenance Handler
 * Generates preventive maintenance recommendations based on equipment condition and usage
 * Requirements: 4.5
 */

interface PreventiveMaintenanceResult {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
}

/**
 * Handle preventive maintenance queries
 */
export async function handlePreventiveMaintenance(
  message: string
): Promise<PreventiveMaintenanceResult> {
  console.log('🛡️ Preventive Maintenance Handler - Start');

  try {
    // Extract parameters from message
    const params = extractPreventiveMaintenanceParameters(message);

    // Generate preventive maintenance recommendations
    const pmData = generatePreventiveMaintenanceRecommendations(params);

    // Create preventive maintenance artifact
    const artifact = {
      messageContentType: 'maintenance_schedule',
      title: 'Preventive Maintenance Recommendations',
      subtitle: `${pmData.recommendations.length} recommendations | Timeframe: ${params.timeframe}`,
      data: {
        timeframe: params.timeframe,
        priority: params.priority,
        recommendations: pmData.recommendations,
        summary: pmData.summary,
        benefits: pmData.benefits
      },
      visualizationType: 'table'
    };

    // Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Equipment Analysis',
        summary: `Analyzed ${params.equipmentIds.length} equipment assets`,
        details: `Timeframe: ${params.timeframe}, Priority filter: ${params.priority}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Recommendation Generation',
        summary: `Generated ${pmData.recommendations.length} preventive maintenance recommendations`,
        details: `Critical: ${pmData.summary.critical}, High: ${pmData.summary.high}, Medium: ${pmData.summary.medium}, Low: ${pmData.summary.low}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Cost-Benefit Analysis',
        summary: `Estimated savings: $${pmData.benefits.estimatedSavings.toLocaleString()}`,
        details: `Investment: $${pmData.benefits.totalCost.toLocaleString()}, ROI: ${pmData.benefits.roi}%`,
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const responseMessage = getPreventiveMaintenanceMessage(pmData, params);

    console.log('✅ Preventive Maintenance Handler - Complete');
    return {
      success: true,
      message: responseMessage,
      artifacts: [artifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Preventive Maintenance Handler - Error:', error);
    return {
      success: false,
      message: `Error generating preventive maintenance recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to generate preventive maintenance recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Extract preventive maintenance parameters from message
 */
function extractPreventiveMaintenanceParameters(message: string): any {
  // Default parameters (in production, extract from message using NLP)
  return {
    equipmentIds: ['PUMP-001', 'COMP-123'],
    timeframe: 'monthly',
    priority: 'all'
  };
}

/**
 * Generate preventive maintenance recommendations
 */
function generatePreventiveMaintenanceRecommendations(params: any): any {
  const recommendations = [];

  // Equipment-specific recommendations
  const equipmentRecommendations: Record<string, any[]> = {
    'PUMP-001': [
      {
        id: 'PM-001',
        equipmentId: 'PUMP-001',
        equipmentName: 'Primary Cooling Pump',
        activity: 'Bearing lubrication',
        frequency: 'Monthly',
        priority: 'medium',
        estimatedDuration: 0.5,
        estimatedCost: 50,
        benefits: 'Prevents bearing wear and extends equipment life',
        procedure: 'Apply grease to bearing fittings per manufacturer specifications',
        requiredSkills: ['Mechanical technician'],
        requiredParts: ['Bearing grease']
      },
      {
        id: 'PM-002',
        equipmentId: 'PUMP-001',
        equipmentName: 'Primary Cooling Pump',
        activity: 'Vibration monitoring',
        frequency: 'Monthly',
        priority: 'high',
        estimatedDuration: 1,
        estimatedCost: 100,
        benefits: 'Early detection of bearing wear and misalignment',
        procedure: 'Perform vibration analysis and trend monitoring',
        requiredSkills: ['Vibration analyst'],
        requiredParts: []
      },
      {
        id: 'PM-003',
        equipmentId: 'PUMP-001',
        equipmentName: 'Primary Cooling Pump',
        activity: 'Seal inspection',
        frequency: 'Quarterly',
        priority: 'medium',
        estimatedDuration: 1,
        estimatedCost: 75,
        benefits: 'Prevents leaks and environmental contamination',
        procedure: 'Visual inspection of mechanical seals for wear or leakage',
        requiredSkills: ['Mechanical technician'],
        requiredParts: []
      }
    ],
    'COMP-123': [
      {
        id: 'PM-101',
        equipmentId: 'COMP-123',
        equipmentName: 'Main Air Compressor',
        activity: 'Oil level check',
        frequency: 'Weekly',
        priority: 'high',
        estimatedDuration: 0.25,
        estimatedCost: 25,
        benefits: 'Prevents bearing damage and overheating',
        procedure: 'Check oil level and top up if necessary',
        requiredSkills: ['Operator'],
        requiredParts: ['Compressor oil']
      },
      {
        id: 'PM-102',
        equipmentId: 'COMP-123',
        equipmentName: 'Main Air Compressor',
        activity: 'Filter replacement',
        frequency: 'Monthly',
        priority: 'high',
        estimatedDuration: 1,
        estimatedCost: 150,
        benefits: 'Maintains air quality and prevents contamination',
        procedure: 'Replace air intake and oil filters',
        requiredSkills: ['Mechanical technician'],
        requiredParts: ['Air filter', 'Oil filter']
      },
      {
        id: 'PM-103',
        equipmentId: 'COMP-123',
        equipmentName: 'Main Air Compressor',
        activity: 'Vibration and temperature monitoring',
        frequency: 'Weekly',
        priority: 'critical',
        estimatedDuration: 0.5,
        estimatedCost: 50,
        benefits: 'Early detection of bearing failure (current high risk)',
        procedure: 'Monitor vibration levels and operating temperature',
        requiredSkills: ['Operator', 'Vibration analyst'],
        requiredParts: []
      },
      {
        id: 'PM-104',
        equipmentId: 'COMP-123',
        equipmentName: 'Main Air Compressor',
        activity: 'Oil change',
        frequency: 'Quarterly',
        priority: 'high',
        estimatedDuration: 3,
        estimatedCost: 400,
        benefits: 'Prevents bearing wear and maintains lubrication',
        procedure: 'Drain old oil, replace filters, add new oil',
        requiredSkills: ['Mechanical technician'],
        requiredParts: ['Compressor oil', 'Oil filter']
      }
    ]
  };

  // Collect recommendations for specified equipment
  for (const equipmentId of params.equipmentIds) {
    if (equipmentRecommendations[equipmentId]) {
      recommendations.push(...equipmentRecommendations[equipmentId]);
    }
  }

  // Filter by priority if specified
  let filteredRecommendations = recommendations;
  if (params.priority !== 'all') {
    filteredRecommendations = recommendations.filter(
      r => r.priority === params.priority || r.priority === 'critical'
    );
  }

  // Calculate summary
  const summary = {
    total: filteredRecommendations.length,
    critical: filteredRecommendations.filter(r => r.priority === 'critical').length,
    high: filteredRecommendations.filter(r => r.priority === 'high').length,
    medium: filteredRecommendations.filter(r => r.priority === 'medium').length,
    low: filteredRecommendations.filter(r => r.priority === 'low').length
  };

  // Calculate benefits
  const totalCost = filteredRecommendations.reduce((sum, r) => sum + r.estimatedCost, 0);
  const estimatedSavings = totalCost * 5; // Preventive maintenance typically saves 5x the cost
  const roi = Math.round(((estimatedSavings - totalCost) / totalCost) * 100);

  const benefits = {
    totalCost,
    estimatedSavings,
    roi,
    downtimeReduction: '60-80%',
    equipmentLifeExtension: '20-40%',
    energyEfficiencyImprovement: '10-15%'
  };

  return {
    recommendations: filteredRecommendations,
    summary,
    benefits
  };
}

/**
 * Generate preventive maintenance message
 */
function getPreventiveMaintenanceMessage(data: any, params: any): string {
  let message = `🛡️ Preventive Maintenance Recommendations\n\n`;
  message += `Timeframe: ${params.timeframe}\n`;
  message += `Priority Filter: ${params.priority}\n`;
  message += `Total Recommendations: ${data.summary.total}\n\n`;

  message += `Priority Breakdown:\n`;
  if (data.summary.critical > 0) {
    message += `• 🔴 Critical: ${data.summary.critical}\n`;
  }
  if (data.summary.high > 0) {
    message += `• 🟠 High: ${data.summary.high}\n`;
  }
  if (data.summary.medium > 0) {
    message += `• 🟡 Medium: ${data.summary.medium}\n`;
  }
  if (data.summary.low > 0) {
    message += `• 🟢 Low: ${data.summary.low}\n`;
  }
  message += `\n`;

  // Show critical and high priority recommendations
  const urgentRecommendations = data.recommendations.filter(
    (r: any) => r.priority === 'critical' || r.priority === 'high'
  );

  if (urgentRecommendations.length > 0) {
    message += `🚨 Urgent Recommendations:\n`;
    urgentRecommendations.forEach((rec: any) => {
      const priorityEmoji = rec.priority === 'critical' ? '🔴' : '🟠';
      message += `${priorityEmoji} ${rec.equipmentName}: ${rec.activity} (${rec.frequency})\n`;
      message += `   Benefit: ${rec.benefits}\n`;
      message += `   Cost: $${rec.estimatedCost}, Duration: ${rec.estimatedDuration}h\n`;
    });
    message += `\n`;
  }

  message += `💰 Cost-Benefit Analysis:\n`;
  message += `• Total Investment: $${data.benefits.totalCost.toLocaleString()}\n`;
  message += `• Estimated Savings: $${data.benefits.estimatedSavings.toLocaleString()}\n`;
  message += `• ROI: ${data.benefits.roi}%\n`;
  message += `• Downtime Reduction: ${data.benefits.downtimeReduction}\n`;
  message += `• Equipment Life Extension: ${data.benefits.equipmentLifeExtension}\n`;
  message += `• Energy Efficiency Improvement: ${data.benefits.energyEfficiencyImprovement}\n\n`;

  message += `Implementing these preventive maintenance activities will significantly reduce unplanned downtime, extend equipment life, and improve overall operational efficiency.`;

  return message;
}
