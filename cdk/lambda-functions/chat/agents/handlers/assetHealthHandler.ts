/**
 * Asset Health Handler
 * Assesses overall health and condition of equipment assets
 * Requirements: 4.5
 */

interface AssetHealthResult {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
}

/**
 * Handle asset health assessment queries
 */
export async function handleAssetHealth(
  message: string
): Promise<AssetHealthResult> {
  console.log('💚 Asset Health Handler - Start');

  try {
    // Get asset health data for all equipment
    const healthData = getAssetHealthData();

    // Create asset health artifact
    const artifact = {
      messageContentType: 'equipment_health',
      title: 'Asset Health Assessment',
      subtitle: `${healthData.assets.length} assets analyzed | Overall health: ${healthData.overallHealth}/100`,
      data: {
        overallHealth: healthData.overallHealth,
        assets: healthData.assets,
        summary: healthData.summary,
        recommendations: healthData.recommendations
      },
      visualizationType: 'gauge'
    };

    // Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Asset Inventory',
        summary: `Analyzed ${healthData.assets.length} equipment assets`,
        details: `Types: ${healthData.assetTypes.join(', ')}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Health Assessment',
        summary: `Overall fleet health: ${healthData.overallHealth}/100`,
        details: `Excellent: ${healthData.summary.excellent}, Good: ${healthData.summary.good}, Fair: ${healthData.summary.fair}, Poor: ${healthData.summary.poor}, Critical: ${healthData.summary.critical}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Risk Analysis',
        summary: `${healthData.summary.critical + healthData.summary.poor} assets require immediate attention`,
        details: healthData.assets
          .filter((a: any) => a.healthScore < 60)
          .map((a: any) => `${a.name}: ${a.healthScore}/100`)
          .join(', '),
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'recommendation',
        title: 'Action Items',
        summary: `${healthData.recommendations.length} recommendations generated`,
        details: healthData.recommendations.slice(0, 3).join('; '),
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const message = getAssetHealthMessage(healthData);

    console.log('✅ Asset Health Handler - Complete');
    return {
      success: true,
      message,
      artifacts: [artifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Asset Health Handler - Error:', error);
    return {
      success: false,
      message: `Error assessing asset health: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to assess asset health',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Get asset health data for all equipment
 */
function getAssetHealthData(): any {
  const assets = [
    {
      id: 'PUMP-001',
      name: 'Primary Cooling Pump',
      type: 'pump',
      location: 'Building A',
      healthScore: 85,
      operationalStatus: 'operational',
      lastMaintenanceDate: '2024-12-01',
      nextMaintenanceDate: '2025-03-01',
      criticalIssues: 0,
      warnings: 0,
      age: 2,
      expectedLifespan: 15
    },
    {
      id: 'COMP-123',
      name: 'Main Air Compressor',
      type: 'compressor',
      location: 'Building B',
      healthScore: 65,
      operationalStatus: 'degraded',
      lastMaintenanceDate: '2024-11-15',
      nextMaintenanceDate: '2025-02-15',
      criticalIssues: 1,
      warnings: 2,
      age: 3,
      expectedLifespan: 12
    },
    {
      id: 'TURB-456',
      name: 'Steam Turbine Generator',
      type: 'turbine',
      location: 'Power Plant',
      healthScore: 92,
      operationalStatus: 'operational',
      lastMaintenanceDate: '2024-10-20',
      nextMaintenanceDate: '2025-04-20',
      criticalIssues: 0,
      warnings: 0,
      age: 1,
      expectedLifespan: 20
    },
    {
      id: 'VALVE-789',
      name: 'Main Control Valve',
      type: 'valve',
      location: 'Process Area',
      healthScore: 78,
      operationalStatus: 'operational',
      lastMaintenanceDate: '2024-11-30',
      nextMaintenanceDate: '2025-02-28',
      criticalIssues: 0,
      warnings: 1,
      age: 4,
      expectedLifespan: 10
    },
    {
      id: 'MOTOR-321',
      name: 'Conveyor Motor',
      type: 'motor',
      location: 'Warehouse',
      healthScore: 55,
      operationalStatus: 'degraded',
      lastMaintenanceDate: '2024-09-15',
      nextMaintenanceDate: '2025-01-15',
      criticalIssues: 2,
      warnings: 1,
      age: 8,
      expectedLifespan: 10
    }
  ];

  // Calculate overall health
  const overallHealth = Math.round(
    assets.reduce((sum, asset) => sum + asset.healthScore, 0) / assets.length
  );

  // Categorize assets
  const summary = {
    excellent: assets.filter(a => a.healthScore >= 90).length,
    good: assets.filter(a => a.healthScore >= 75 && a.healthScore < 90).length,
    fair: assets.filter(a => a.healthScore >= 60 && a.healthScore < 75).length,
    poor: assets.filter(a => a.healthScore >= 40 && a.healthScore < 60).length,
    critical: assets.filter(a => a.healthScore < 40).length
  };

  // Generate recommendations
  const recommendations = [];
  
  const criticalAssets = assets.filter(a => a.healthScore < 60);
  if (criticalAssets.length > 0) {
    recommendations.push(
      `🚨 URGENT: ${criticalAssets.length} asset(s) in poor/critical condition require immediate attention: ${criticalAssets.map(a => a.name).join(', ')}`
    );
  }

  const overdueAssets = assets.filter(a => {
    const nextMaint = new Date(a.nextMaintenanceDate);
    const today = new Date();
    return nextMaint < today;
  });
  if (overdueAssets.length > 0) {
    recommendations.push(
      `⚠️ ${overdueAssets.length} asset(s) have overdue maintenance: ${overdueAssets.map(a => a.name).join(', ')}`
    );
  }

  const agingAssets = assets.filter(a => (a.age / a.expectedLifespan) > 0.7);
  if (agingAssets.length > 0) {
    recommendations.push(
      `📊 ${agingAssets.length} asset(s) approaching end of life (>70% of expected lifespan): ${agingAssets.map(a => a.name).join(', ')}`
    );
  }

  const warningAssets = assets.filter(a => a.warnings > 0);
  if (warningAssets.length > 0) {
    recommendations.push(
      `⚠️ ${warningAssets.length} asset(s) have active warnings requiring investigation`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All assets are in good condition. Continue current maintenance schedule.');
  }

  return {
    overallHealth,
    assets,
    summary,
    recommendations,
    assetTypes: [...new Set(assets.map(a => a.type))]
  };
}

/**
 * Generate asset health message
 */
function getAssetHealthMessage(data: any): string {
  let message = `💚 Asset Health Assessment\n\n`;
  message += `Overall Fleet Health: ${data.overallHealth}/100\n`;
  message += `Total Assets: ${data.assets.length}\n\n`;

  message += `Health Distribution:\n`;
  message += `• Excellent (90-100): ${data.summary.excellent} assets\n`;
  message += `• Good (75-89): ${data.summary.good} assets\n`;
  message += `• Fair (60-74): ${data.summary.fair} assets\n`;
  message += `• Poor (40-59): ${data.summary.poor} assets\n`;
  message += `• Critical (<40): ${data.summary.critical} assets\n\n`;

  if (data.summary.poor + data.summary.critical > 0) {
    message += `⚠️ Assets Requiring Attention:\n`;
    data.assets
      .filter((a: any) => a.healthScore < 60)
      .forEach((asset: any) => {
        message += `• ${asset.name} (${asset.id}): ${asset.healthScore}/100 - ${asset.operationalStatus}\n`;
        message += `  Critical Issues: ${asset.criticalIssues}, Warnings: ${asset.warnings}\n`;
      });
    message += `\n`;
  }

  message += `Recommendations:\n`;
  data.recommendations.forEach((rec: string, index: number) => {
    message += `${index + 1}. ${rec}\n`;
  });

  return message;
}
