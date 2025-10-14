/**
 * Fallback Report Generator - Simple client-side report generation
 * 
 * Generates basic renewable energy reports when Lambda functions are unavailable.
 * Focuses on practical fallback functionality, not comprehensive reporting.
 */

export interface FallbackReportData {
  projectName: string;
  location: {
    lat: number;
    lon: number;
    address?: string;
  };
  terrainData?: any;
  layoutData?: any;
  simulationData?: any;
  timestamp: string;
}

export interface FallbackReport {
  html: string;
  summary: string;
  recommendations: string[];
  dataAvailable: {
    terrain: boolean;
    layout: boolean;
    simulation: boolean;
  };
}

export class FallbackReportGenerator {
  /**
   * Generate fallback report from available data
   */
  generateReport(data: FallbackReportData): FallbackReport {
    const dataAvailable = {
      terrain: !!data.terrainData,
      layout: !!data.layoutData,
      simulation: !!data.simulationData
    };

    const html = this.generateHTML(data, dataAvailable);
    const summary = this.generateSummary(data, dataAvailable);
    const recommendations = this.generateRecommendations(dataAvailable);

    return {
      html,
      summary,
      recommendations,
      dataAvailable
    };
  }

  /**
   * Generate HTML report
   */
  private generateHTML(data: FallbackReportData, dataAvailable: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wind Farm Development Report - ${data.projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .project-title { color: #1e40af; font-size: 28px; margin: 0; }
        .subtitle { color: #6b7280; font-size: 16px; margin: 5px 0; }
        .section { margin: 30px 0; padding: 20px; border-left: 4px solid #e5e7eb; }
        .section.available { border-left-color: #10b981; background: #f0fdf4; }
        .section.unavailable { border-left-color: #f59e0b; background: #fffbeb; }
        .section h2 { color: #1f2937; margin-top: 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-available { background: #dcfce7; color: #166534; }
        .status-unavailable { background: #fef3c7; color: #92400e; }
        .recommendations { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; }
        .recommendations h3 { color: #1e40af; margin-top: 0; }
        .recommendations ul { margin: 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="project-title">${data.projectName}</h1>
        <p class="subtitle">Wind Farm Development Report</p>
        <p class="subtitle">Location: ${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}</p>
        <p class="subtitle">Generated: ${new Date(data.timestamp).toLocaleString()}</p>
    </div>

    <div class="section ${dataAvailable.terrain ? 'available' : 'unavailable'}">
        <h2>Terrain Analysis <span class="status-badge ${dataAvailable.terrain ? 'status-available' : 'status-unavailable'}">${dataAvailable.terrain ? 'Available' : 'Unavailable'}</span></h2>
        ${dataAvailable.terrain ? 
          this.generateTerrainSection(data.terrainData) : 
          '<p>Terrain analysis data is not available. This analysis identifies suitable areas for turbine placement and exclusion zones.</p>'
        }
    </div>

    <div class="section ${dataAvailable.layout ? 'available' : 'unavailable'}">
        <h2>Layout Design <span class="status-badge ${dataAvailable.layout ? 'status-available' : 'status-unavailable'}">${dataAvailable.layout ? 'Available' : 'Unavailable'}</span></h2>
        ${dataAvailable.layout ? 
          this.generateLayoutSection(data.layoutData) : 
          '<p>Layout design data is not available. This would show optimized turbine placement and spacing.</p>'
        }
    </div>

    <div class="section ${dataAvailable.simulation ? 'available' : 'unavailable'}">
        <h2>Wake Simulation <span class="status-badge ${dataAvailable.simulation ? 'status-available' : 'status-unavailable'}">${dataAvailable.simulation ? 'Available' : 'Unavailable'}</span></h2>
        ${dataAvailable.simulation ? 
          this.generateSimulationSection(data.simulationData) : 
          '<p>Wake simulation data is not available. This analysis would estimate energy production and wake losses.</p>'
        }
    </div>

    <div class="recommendations">
        <h3>Next Steps</h3>
        <ul>
            ${this.generateRecommendations(dataAvailable).map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <div class="footer">
        <p>This is a fallback report generated when full analysis tools are unavailable.</p>
        <p>For complete analysis, ensure all renewable energy functions are deployed and accessible.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate terrain section content
   */
  private generateTerrainSection(terrainData: any): string {
    if (!terrainData) return '<p>No terrain data available.</p>';

    const metrics = terrainData.metrics || {};
    return `
        <p>Terrain analysis completed successfully.</p>
        <ul>
            <li><strong>Suitability Score:</strong> ${metrics.suitabilityScore || 'N/A'}%</li>
            <li><strong>Exclusion Zones:</strong> ${metrics.exclusionZones || 'N/A'} identified</li>
            <li><strong>Buildable Area:</strong> ${metrics.buildableArea || 'N/A'} hectares</li>
        </ul>
        ${terrainData.mapHtml ? '<div style="margin: 20px 0;">Interactive terrain map available in full report.</div>' : ''}
    `;
  }

  /**
   * Generate layout section content
   */
  private generateLayoutSection(layoutData: any): string {
    if (!layoutData) return '<p>No layout data available.</p>';

    const metrics = layoutData.metrics || {};
    return `
        <p>Wind farm layout designed successfully.</p>
        <ul>
            <li><strong>Turbine Count:</strong> ${metrics.turbineCount || 'N/A'}</li>
            <li><strong>Total Capacity:</strong> ${metrics.totalCapacity || 'N/A'} MW</li>
            <li><strong>Layout Efficiency:</strong> ${metrics.layoutEfficiency || 'N/A'}%</li>
        </ul>
        ${layoutData.mapHtml ? '<div style="margin: 20px 0;">Interactive layout map available in full report.</div>' : ''}
    `;
  }

  /**
   * Generate simulation section content
   */
  private generateSimulationSection(simulationData: any): string {
    if (!simulationData) return '<p>No simulation data available.</p>';

    const metrics = simulationData.metrics || {};
    return `
        <p>Wake simulation analysis completed.</p>
        <ul>
            <li><strong>Annual Energy Production:</strong> ${metrics.annualEnergyProduction || 'N/A'} MWh</li>
            <li><strong>Capacity Factor:</strong> ${metrics.capacityFactor || 'N/A'}%</li>
            <li><strong>Wake Losses:</strong> ${metrics.wakeLosses || 'N/A'}%</li>
        </ul>
        ${simulationData.chartImage ? '<div style="margin: 20px 0;">Performance charts available in full report.</div>' : ''}
    `;
  }

  /**
   * Generate text summary
   */
  private generateSummary(data: FallbackReportData, dataAvailable: any): string {
    const availableCount = Object.values(dataAvailable).filter(Boolean).length;
    const totalCount = Object.keys(dataAvailable).length;

    let summary = `Wind farm development report for ${data.projectName} at coordinates ${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}. `;
    
    if (availableCount === 0) {
      summary += 'No analysis data is currently available. This may be due to backend services being unavailable or not yet deployed.';
    } else if (availableCount === totalCount) {
      summary += 'Complete analysis data is available including terrain analysis, layout design, and wake simulation.';
    } else {
      summary += `Partial analysis data is available (${availableCount}/${totalCount} components). `;
      
      const available = Object.entries(dataAvailable)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([key, _]) => key);
      
      const unavailable = Object.entries(dataAvailable)
        .filter(([_, isAvailable]) => !isAvailable)
        .map(([key, _]) => key);
      
      summary += `Available: ${available.join(', ')}. Missing: ${unavailable.join(', ')}.`;
    }

    return summary;
  }

  /**
   * Generate recommendations based on available data
   */
  private generateRecommendations(dataAvailable: any): string[] {
    const recommendations: string[] = [];

    if (!dataAvailable.terrain) {
      recommendations.push('Run terrain analysis to identify suitable areas for turbine placement');
    }

    if (!dataAvailable.layout) {
      recommendations.push('Generate layout design to optimize turbine placement and spacing');
    }

    if (!dataAvailable.simulation) {
      recommendations.push('Perform wake simulation to estimate energy production and losses');
    }

    if (Object.values(dataAvailable).every(Boolean)) {
      recommendations.push('All analysis components are complete - proceed with detailed engineering design');
      recommendations.push('Consider environmental impact assessment and permitting requirements');
      recommendations.push('Evaluate grid connection options and electrical infrastructure needs');
    } else {
      recommendations.push('Ensure all renewable energy backend services are deployed and accessible');
      recommendations.push('Check system logs for any deployment or configuration issues');
    }

    return recommendations;
  }

  /**
   * Generate simple executive summary report
   */
  generateExecutiveSummary(data: FallbackReportData): string {
    const dataAvailable = {
      terrain: !!data.terrainData,
      layout: !!data.layoutData,
      simulation: !!data.simulationData
    };

    const availableCount = Object.values(dataAvailable).filter(Boolean).length;
    
    return `
# Executive Summary - ${data.projectName}

**Project Location:** ${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}
**Report Date:** ${new Date(data.timestamp).toLocaleDateString()}
**Analysis Status:** ${availableCount}/3 components available

## Project Overview
This wind farm development project is located at coordinates ${data.location.lat.toFixed(4)}, ${data.location.lon.toFixed(4)}. ${this.generateSummary(data, dataAvailable)}

## Analysis Components
- **Terrain Analysis:** ${dataAvailable.terrain ? '✅ Complete' : '❌ Pending'}
- **Layout Design:** ${dataAvailable.layout ? '✅ Complete' : '❌ Pending'}  
- **Wake Simulation:** ${dataAvailable.simulation ? '✅ Complete' : '❌ Pending'}

## Key Findings
${dataAvailable.terrain && data.terrainData?.metrics ? 
  `- Site suitability score: ${data.terrainData.metrics.suitabilityScore || 'N/A'}%` : 
  '- Terrain analysis pending'
}
${dataAvailable.layout && data.layoutData?.metrics ? 
  `- Proposed capacity: ${data.layoutData.metrics.totalCapacity || 'N/A'} MW` : 
  '- Layout design pending'
}
${dataAvailable.simulation && data.simulationData?.metrics ? 
  `- Estimated annual production: ${data.simulationData.metrics.annualEnergyProduction || 'N/A'} MWh` : 
  '- Production estimates pending'
}

## Recommendations
${this.generateRecommendations(dataAvailable).map(rec => `- ${rec}`).join('\n')}

---
*This is a fallback report generated when full analysis tools are unavailable.*
`;
  }
}