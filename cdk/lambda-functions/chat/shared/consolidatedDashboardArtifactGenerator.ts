/**
 * Consolidated Dashboard Artifact Generator
 * Generates comprehensive dashboard artifacts with fleet-wide metrics, AI analysis, and visualizations
 * 
 * Requirements: 2.1, 2.2, 2.3, 6.1, 6.2
 */

import { Well, WellHealthMetrics } from './wellDataService';
import { NoteworthyConditions, PriorityAction, PerformanceRanking } from './wellAnalysisEngine';

// Artifact Types
export interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

export interface ChartData {
  type: 'histogram' | 'pie' | 'line' | 'heatmap';
  data: any[];
  labels?: string[];
  colors?: string[];
  title?: string;
}

export interface FleetSummary {
  totalWells: number;
  operational: number;
  degraded: number;
  critical: number;
  offline: number;
  fleetHealthScore: number;
  criticalAlerts: number;
  wellsNeedingAttention: number;
  upcomingMaintenance: number;
}

export interface WellsDashboardArtifact {
  messageContentType: 'wells_equipment_dashboard';
  title: string;
  subtitle: string;
  dashboard: {
    summary: FleetSummary;
    noteworthyConditions: NoteworthyConditions;
    priorityActions: PriorityAction[];
    wells: WellSummary[];
    charts: {
      healthDistribution: ChartData;
      statusBreakdown: ChartData;
      fleetTrend: ChartData;
      alertHeatmap: ChartData;
    };
    comparativePerformance: {
      topByHealth: WellSummary[];
      bottomByHealth: WellSummary[];
      topByProduction: WellSummary[];
      bottomByProduction: WellSummary[];
    };
    timestamp: string;
  };
}

/**
 * Consolidated Dashboard Artifact Generator Class
 */
export class ConsolidatedDashboardArtifactGenerator {
  /**
   * Generate complete consolidated dashboard artifact
   */
  generateArtifact(
    wells: Well[],
    noteworthyConditions: NoteworthyConditions,
    priorityActions: PriorityAction[],
    performanceRanking: PerformanceRanking
  ): WellsDashboardArtifact {
    console.log('🔍 ConsolidatedDashboardArtifactGenerator.generateArtifact - Start');
    console.log(`📊 Generating artifact for ${wells.length} wells`);

    // Calculate fleet-wide metrics
    const summary = this.calculateFleetSummary(wells);

    // Transform wells to summaries
    const wellSummaries = wells.map(w => this.transformWellToSummary(w));

    // Generate chart data
    const charts = {
      healthDistribution: this.generateHealthDistributionChart(wells),
      statusBreakdown: this.generateStatusBreakdownChart(wells),
      fleetTrend: this.generateFleetTrendChart(wells),
      alertHeatmap: this.generateAlertHeatmapChart(wells)
    };

    // Transform performance ranking to summaries
    const comparativePerformance = {
      topByHealth: performanceRanking.topByHealth.map(w => this.transformWellToSummary(w)),
      bottomByHealth: performanceRanking.bottomByHealth.map(w => this.transformWellToSummary(w)),
      topByProduction: performanceRanking.topByProduction.map(w => this.transformWellToSummary(w)),
      bottomByProduction: performanceRanking.bottomByProduction.map(w => this.transformWellToSummary(w))
    };

    const artifact: WellsDashboardArtifact = {
      messageContentType: 'wells_equipment_dashboard',
      title: 'Wells Equipment Status Dashboard',
      subtitle: `${wells.length} wells monitored - Fleet Health: ${summary.fleetHealthScore}%`,
      dashboard: {
        summary,
        noteworthyConditions,
        priorityActions,
        wells: wellSummaries,
        charts,
        comparativePerformance,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Consolidated dashboard artifact generated successfully');
    return artifact;
  }

  /**
   * Calculate fleet-wide summary metrics
   */
  private calculateFleetSummary(wells: Well[]): FleetSummary {
    console.log('🔍 Calculating fleet summary metrics');

    const totalWells = wells.length;
    const operational = wells.filter(w => w.operationalStatus === 'operational').length;
    const degraded = wells.filter(w => w.operationalStatus === 'degraded').length;
    const critical = wells.filter(w => w.operationalStatus === 'critical').length;
    const offline = wells.filter(w => w.operationalStatus === 'offline').length;

    // Calculate weighted fleet health score
    // Weights: operational=1.0, degraded=0.7, critical=0.3, offline=0.0
    const weightedSum = wells.reduce((sum, well) => {
      let weight = 1.0;
      if (well.operationalStatus === 'degraded') weight = 0.7;
      else if (well.operationalStatus === 'critical') weight = 0.3;
      else if (well.operationalStatus === 'offline') weight = 0.0;
      
      return sum + (well.healthScore * weight);
    }, 0);

    const totalWeight = wells.reduce((sum, well) => {
      if (well.operationalStatus === 'degraded') return sum + 0.7;
      if (well.operationalStatus === 'critical') return sum + 0.3;
      if (well.operationalStatus === 'offline') return sum + 0.0;
      return sum + 1.0;
    }, 0);

    const fleetHealthScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Count critical alerts
    const criticalAlerts = wells.reduce((sum, well) => 
      sum + well.alerts.filter(a => a.severity === 'critical').length, 0
    );

    // Count wells needing attention (health < 70)
    const wellsNeedingAttention = wells.filter(w => w.healthScore < 70).length;

    // Count upcoming maintenance (next 7 days)
    const upcomingMaintenance = this.countUpcomingMaintenance(wells, 7);

    const summary: FleetSummary = {
      totalWells,
      operational,
      degraded,
      critical,
      offline,
      fleetHealthScore,
      criticalAlerts,
      wellsNeedingAttention,
      upcomingMaintenance
    };

    console.log('✅ Fleet summary calculated:', summary);
    return summary;
  }

  /**
   * Transform Well to WellSummary
   */
  private transformWellToSummary(well: Well): WellSummary {
    // Extract key metrics from sensors
    const pressureSensor = well.sensors.find(s => s.type === 'pressure');
    const tempSensor = well.sensors.find(s => s.type === 'temperature');
    const flowSensor = well.sensors.find(s => s.type === 'flow_rate');

    return {
      id: well.id,
      name: well.name,
      healthScore: well.healthScore,
      status: well.operationalStatus,
      alertCount: well.alerts.length,
      criticalAlertCount: well.alerts.filter(a => a.severity === 'critical').length,
      lastMaintenance: well.lastMaintenanceDate,
      nextMaintenance: well.nextMaintenanceDate,
      location: well.location,
      keyMetrics: {
        temperature: tempSensor?.currentValue,
        pressure: pressureSensor?.currentValue,
        flowRate: flowSensor?.currentValue,
        production: well.metadata.production.currentRate
      }
    };
  }

  /**
   * Generate health score distribution histogram
   */
  private generateHealthDistributionChart(wells: Well[]): ChartData {
    console.log('🔍 Generating health distribution chart');

    // Define health score ranges
    const ranges = [
      { label: '0-20', min: 0, max: 20, color: '#dc2626' },
      { label: '21-40', min: 21, max: 40, color: '#ea580c' },
      { label: '41-60', min: 41, max: 60, color: '#f59e0b' },
      { label: '61-80', min: 61, max: 80, color: '#84cc16' },
      { label: '81-100', min: 81, max: 100, color: '#22c55e' }
    ];

    // Count wells in each range
    const data = ranges.map(range => ({
      range: range.label,
      count: wells.filter(w => w.healthScore >= range.min && w.healthScore <= range.max).length,
      color: range.color
    }));

    return {
      type: 'histogram',
      data,
      labels: data.map(d => d.range),
      colors: data.map(d => d.color),
      title: 'Health Score Distribution'
    };
  }

  /**
   * Generate operational status breakdown pie chart
   */
  private generateStatusBreakdownChart(wells: Well[]): ChartData {
    console.log('🔍 Generating status breakdown chart');

    const statusCounts = {
      operational: wells.filter(w => w.operationalStatus === 'operational').length,
      degraded: wells.filter(w => w.operationalStatus === 'degraded').length,
      critical: wells.filter(w => w.operationalStatus === 'critical').length,
      offline: wells.filter(w => w.operationalStatus === 'offline').length
    };

    const data = [
      { status: 'Operational', count: statusCounts.operational, color: '#22c55e', percentage: 0 },
      { status: 'Degraded', count: statusCounts.degraded, color: '#f59e0b', percentage: 0 },
      { status: 'Critical', count: statusCounts.critical, color: '#dc2626', percentage: 0 },
      { status: 'Offline', count: statusCounts.offline, color: '#6b7280', percentage: 0 }
    ].filter(d => d.count > 0); // Only include non-zero statuses

    // Calculate percentages
    const total = wells.length;
    data.forEach(d => {
      d.percentage = Math.round((d.count / total) * 100);
    });

    return {
      type: 'pie',
      data,
      labels: data.map(d => d.status),
      colors: data.map(d => d.color),
      title: 'Operational Status Breakdown'
    };
  }

  /**
   * Generate 30-day fleet health trend line chart
   */
  private generateFleetTrendChart(wells: Well[]): ChartData {
    console.log('🔍 Generating fleet trend chart');

    // Generate mock 30-day trend data
    // In production, this would come from historical data
    const days = 30;
    const currentFleetHealth = this.calculateFleetSummary(wells).fleetHealthScore;
    
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate slight variations around current health
      const variation = Math.random() * 10 - 5; // ±5 points
      const healthScore = Math.max(0, Math.min(100, currentFleetHealth + variation));
      
      data.push({
        date: date.toISOString().split('T')[0],
        healthScore: Math.round(healthScore),
        targetScore: 80 // Reference line
      });
    }

    return {
      type: 'line',
      data,
      title: '30-Day Fleet Health Trend'
    };
  }

  /**
   * Generate alert frequency heatmap
   */
  private generateAlertHeatmapChart(wells: Well[]): ChartData {
    console.log('🔍 Generating alert heatmap chart');

    // Generate mock 30-day alert frequency data
    // In production, this would come from historical alert data
    const days = 30;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate alert frequency (0-10 alerts per day)
      const totalAlerts = wells.reduce((sum, w) => sum + w.alerts.length, 0);
      const avgAlertsPerDay = totalAlerts / wells.length;
      const alertCount = Math.max(0, Math.round(avgAlertsPerDay + (Math.random() * 4 - 2)));
      
      data.push({
        date: date.toISOString().split('T')[0],
        alertCount,
        intensity: this.getHeatmapIntensity(alertCount)
      });
    }

    return {
      type: 'heatmap',
      data,
      title: 'Alert Frequency (Last 30 Days)'
    };
  }

  /**
   * Count wells with upcoming maintenance within specified days
   */
  private countUpcomingMaintenance(wells: Well[], daysAhead: number): number {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return wells.filter(well => {
      const nextMaintenance = new Date(well.nextMaintenanceDate);
      return nextMaintenance >= today && nextMaintenance <= futureDate;
    }).length;
  }

  /**
   * Get heatmap intensity level based on alert count
   */
  private getHeatmapIntensity(alertCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (alertCount === 0) return 'low';
    if (alertCount <= 2) return 'medium';
    if (alertCount <= 5) return 'high';
    return 'critical';
  }
}

// Export singleton instance
export const consolidatedDashboardArtifactGenerator = new ConsolidatedDashboardArtifactGenerator();
