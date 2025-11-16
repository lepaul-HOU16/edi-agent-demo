/**
 * Well Analysis Engine
 * AI-powered analysis for identifying noteworthy conditions and generating priority actions
 * 
 * Requirements: 2.1, 2.2, 3.1
 */

import { Well, Sensor, Alert } from './wellDataService';

// Types for analysis results
export interface NoteworthyItem {
  wellId: string;
  wellName: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, any>;
}

export interface PriorityAction {
  id: string;
  wellId: string;
  wellName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedTime?: string;
  dueDate?: string;
  actionType: 'inspection' | 'maintenance' | 'diagnostic' | 'repair';
}

export interface NoteworthyConditions {
  criticalIssues: NoteworthyItem[];
  decliningHealth: NoteworthyItem[];
  maintenanceOverdue: NoteworthyItem[];
  topPerformers: NoteworthyItem[];
  unusualPatterns: NoteworthyItem[];
}

export interface PerformanceRanking {
  topByHealth: Well[];
  bottomByHealth: Well[];
  topByProduction: Well[];
  bottomByProduction: Well[];
}

/**
 * Well Analysis Engine Class
 */
export class WellAnalysisEngine {
  /**
   * Analyze all wells to identify noteworthy conditions
   * Identifies critical issues, declining health, unusual patterns, top performers
   */
  analyzeNoteworthyConditions(wells: Well[], historicalData?: Map<string, number>): NoteworthyConditions {
    console.log('🔍 WellAnalysisEngine.analyzeNoteworthyConditions - Start');
    console.log(`📊 Analyzing ${wells.length} wells`);

    const conditions: NoteworthyConditions = {
      criticalIssues: [],
      decliningHealth: [],
      maintenanceOverdue: [],
      topPerformers: [],
      unusualPatterns: []
    };

    // Analyze each well
    for (const well of wells) {
      // Check for critical issues
      const criticalIssue = this.identifyCriticalIssues(well);
      if (criticalIssue) {
        conditions.criticalIssues.push(criticalIssue);
      }

      // Check for declining health
      const decliningHealth = this.identifyDecliningHealth(well, historicalData);
      if (decliningHealth) {
        conditions.decliningHealth.push(decliningHealth);
      }

      // Check for overdue maintenance
      const overdueIssue = this.identifyOverdueMaintenance(well);
      if (overdueIssue) {
        conditions.maintenanceOverdue.push(overdueIssue);
      }

      // Check for unusual patterns
      const unusualPattern = this.identifyUnusualPatterns(well);
      if (unusualPattern) {
        conditions.unusualPatterns.push(unusualPattern);
      }

      // Identify top performers
      if (this.isTopPerformer(well)) {
        conditions.topPerformers.push({
          wellId: well.id,
          wellName: well.name,
          severity: 'info',
          title: 'Excellent Performance',
          description: `${well.name} maintains ${well.healthScore}% health score with optimal production efficiency`,
          metrics: {
            healthScore: well.healthScore,
            efficiency: well.metadata.production.efficiency,
            uptime: this.calculateUptime(well)
          }
        });
      }
    }

    // Sort by severity
    conditions.criticalIssues.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
    conditions.decliningHealth.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));

    console.log('✅ Noteworthy conditions analysis complete:', {
      critical: conditions.criticalIssues.length,
      declining: conditions.decliningHealth.length,
      overdue: conditions.maintenanceOverdue.length,
      topPerformers: conditions.topPerformers.length,
      unusual: conditions.unusualPatterns.length
    });

    return conditions;
  }

  /**
   * Generate priority actions based on well conditions
   * Ranks actions by urgency and impact
   */
  generatePriorityActions(wells: Well[], noteworthyConditions: NoteworthyConditions): PriorityAction[] {
    console.log('🔍 WellAnalysisEngine.generatePriorityActions - Start');

    const actions: PriorityAction[] = [];
    let actionCounter = 1;

    // Generate actions for critical issues (URGENT)
    for (const issue of noteworthyConditions.criticalIssues) {
      const well = wells.find(w => w.id === issue.wellId);
      if (!well) continue;

      actions.push({
        id: `ACTION-${String(actionCounter++).padStart(3, '0')}`,
        wellId: issue.wellId,
        wellName: issue.wellName,
        priority: 'urgent',
        title: `Immediate inspection required: ${issue.title}`,
        description: issue.description,
        estimatedTime: '2-4 hours',
        dueDate: this.calculateDueDate(0), // Immediate
        actionType: 'inspection'
      });
    }

    // Generate actions for declining health (HIGH)
    for (const issue of noteworthyConditions.decliningHealth) {
      const well = wells.find(w => w.id === issue.wellId);
      if (!well) continue;

      actions.push({
        id: `ACTION-${String(actionCounter++).padStart(3, '0')}`,
        wellId: issue.wellId,
        wellName: issue.wellName,
        priority: 'high',
        title: `Diagnostic check required: ${issue.title}`,
        description: issue.description,
        estimatedTime: '4-6 hours',
        dueDate: this.calculateDueDate(2), // Within 2 days
        actionType: 'diagnostic'
      });
    }

    // Generate actions for overdue maintenance (MEDIUM to HIGH)
    for (const issue of noteworthyConditions.maintenanceOverdue) {
      const well = wells.find(w => w.id === issue.wellId);
      if (!well) continue;

      const daysOverdue = this.calculateDaysOverdue(well.nextMaintenanceDate);
      const priority = daysOverdue > 14 ? 'high' : 'medium';

      actions.push({
        id: `ACTION-${String(actionCounter++).padStart(3, '0')}`,
        wellId: issue.wellId,
        wellName: issue.wellName,
        priority,
        title: `Schedule maintenance: ${issue.title}`,
        description: issue.description,
        estimatedTime: '6-8 hours',
        dueDate: this.calculateDueDate(7), // Within 1 week
        actionType: 'maintenance'
      });
    }

    // Generate actions for unusual patterns (MEDIUM)
    for (const issue of noteworthyConditions.unusualPatterns) {
      const well = wells.find(w => w.id === issue.wellId);
      if (!well) continue;

      actions.push({
        id: `ACTION-${String(actionCounter++).padStart(3, '0')}`,
        wellId: issue.wellId,
        wellName: issue.wellName,
        priority: 'medium',
        title: `Monitor and investigate: ${issue.title}`,
        description: issue.description,
        estimatedTime: '2-3 hours',
        dueDate: this.calculateDueDate(7), // Within 1 week
        actionType: 'diagnostic'
      });
    }

    // Sort by priority (urgent > high > medium > low)
    actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log(`✅ Generated ${actions.length} priority actions`);
    return actions;
  }

  /**
   * Identify top performing wells
   */
  identifyTopPerformers(wells: Well[], count: number = 5): Well[] {
    console.log('🔍 WellAnalysisEngine.identifyTopPerformers - Start');

    // Sort by health score (descending)
    const sorted = [...wells].sort((a, b) => b.healthScore - a.healthScore);
    const topPerformers = sorted.slice(0, count);

    console.log(`✅ Identified ${topPerformers.length} top performers`);
    return topPerformers;
  }

  /**
   * Identify bottom performing wells
   */
  identifyBottomPerformers(wells: Well[], count: number = 5): Well[] {
    console.log('🔍 WellAnalysisEngine.identifyBottomPerformers - Start');

    // Sort by health score (ascending)
    const sorted = [...wells].sort((a, b) => a.healthScore - b.healthScore);
    const bottomPerformers = sorted.slice(0, count);

    console.log(`✅ Identified ${bottomPerformers.length} bottom performers`);
    return bottomPerformers;
  }

  /**
   * Analyze health score trends
   * Compares current health score with historical data
   */
  analyzeHealthTrends(wells: Well[], historicalData: Map<string, number>): Map<string, { change: number; trend: 'improving' | 'declining' | 'stable' }> {
    console.log('🔍 WellAnalysisEngine.analyzeHealthTrends - Start');

    const trends = new Map<string, { change: number; trend: 'improving' | 'declining' | 'stable' }>();

    for (const well of wells) {
      const previousHealth = historicalData.get(well.id);
      if (previousHealth === undefined) {
        // No historical data, assume stable
        trends.set(well.id, { change: 0, trend: 'stable' });
        continue;
      }

      const change = well.healthScore - previousHealth;
      let trend: 'improving' | 'declining' | 'stable';

      if (change > 5) {
        trend = 'improving';
      } else if (change < -5) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }

      trends.set(well.id, { change, trend });
    }

    console.log(`✅ Analyzed health trends for ${trends.size} wells`);
    return trends;
  }

  /**
   * Get comparative performance rankings
   */
  getComparativePerformance(wells: Well[]): PerformanceRanking {
    console.log('🔍 WellAnalysisEngine.getComparativePerformance - Start');

    const ranking: PerformanceRanking = {
      topByHealth: this.identifyTopPerformers(wells, 5),
      bottomByHealth: this.identifyBottomPerformers(wells, 5),
      topByProduction: this.getTopByProduction(wells, 5),
      bottomByProduction: this.getBottomByProduction(wells, 5)
    };

    console.log('✅ Comparative performance analysis complete');
    return ranking;
  }

  // Private helper methods

  /**
   * Identify critical issues in a well
   */
  private identifyCriticalIssues(well: Well): NoteworthyItem | null {
    // Check for critical alerts
    const criticalAlerts = well.alerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      const alert = criticalAlerts[0];
      return {
        wellId: well.id,
        wellName: well.name,
        severity: 'critical',
        title: 'Critical Alert Active',
        description: alert.message,
        recommendation: 'Immediate inspection and corrective action required',
        metrics: {
          alertCount: criticalAlerts.length,
          healthScore: well.healthScore
        }
      };
    }

    // Check for critical operational status
    if (well.operationalStatus === 'critical') {
      return {
        wellId: well.id,
        wellName: well.name,
        severity: 'critical',
        title: 'Critical Operational Status',
        description: `${well.name} is in critical operational status with health score of ${well.healthScore}%`,
        recommendation: 'Immediate diagnostic assessment required',
        metrics: {
          healthScore: well.healthScore,
          status: well.operationalStatus
        }
      };
    }

    // Check for multiple critical sensors
    const criticalSensors = well.sensors.filter(s => s.status === 'critical');
    if (criticalSensors.length >= 2) {
      return {
        wellId: well.id,
        wellName: well.name,
        severity: 'critical',
        title: 'Multiple Critical Sensor Readings',
        description: `${criticalSensors.length} sensors showing critical readings: ${criticalSensors.map(s => s.type).join(', ')}`,
        recommendation: 'Comprehensive system inspection required',
        metrics: {
          criticalSensors: criticalSensors.length,
          sensors: criticalSensors.map(s => ({ type: s.type, value: s.currentValue, unit: s.unit }))
        }
      };
    }

    return null;
  }

  /**
   * Identify declining health trends
   */
  private identifyDecliningHealth(well: Well, historicalData?: Map<string, number>): NoteworthyItem | null {
    if (!historicalData) return null;

    const previousHealth = historicalData.get(well.id);
    if (previousHealth === undefined) return null;

    const change = well.healthScore - previousHealth;
    const percentChange = (change / previousHealth) * 100;

    // Flag if health declined by more than 10%
    if (change < -10) {
      return {
        wellId: well.id,
        wellName: well.name,
        severity: change < -20 ? 'high' : 'medium',
        title: 'Declining Health Trend',
        description: `Health score dropped from ${previousHealth}% to ${well.healthScore}% (${Math.abs(change)} point decline)`,
        recommendation: 'Schedule diagnostic evaluation to identify root cause',
        metrics: {
          previousHealth,
          currentHealth: well.healthScore,
          change,
          percentChange: Math.round(percentChange)
        }
      };
    }

    return null;
  }

  /**
   * Identify overdue maintenance
   */
  private identifyOverdueMaintenance(well: Well): NoteworthyItem | null {
    const daysOverdue = this.calculateDaysOverdue(well.nextMaintenanceDate);

    if (daysOverdue > 0) {
      return {
        wellId: well.id,
        wellName: well.name,
        severity: daysOverdue > 14 ? 'high' : 'medium',
        title: 'Maintenance Overdue',
        description: `Scheduled maintenance is ${daysOverdue} days overdue (due: ${well.nextMaintenanceDate})`,
        recommendation: 'Schedule maintenance as soon as possible to prevent equipment degradation',
        metrics: {
          daysOverdue,
          nextMaintenanceDate: well.nextMaintenanceDate,
          lastMaintenanceDate: well.lastMaintenanceDate
        }
      };
    }

    return null;
  }

  /**
   * Identify unusual patterns in sensor data
   */
  private identifyUnusualPatterns(well: Well): NoteworthyItem | null {
    // Check for sensors with unusual trends
    const increasingSensors = well.sensors.filter(s => 
      s.trend === 'increasing' && s.currentValue > s.normalRange.max
    );

    if (increasingSensors.length > 0) {
      const sensor = increasingSensors[0];
      return {
        wellId: well.id,
        wellName: well.name,
        severity: 'medium',
        title: 'Unusual Sensor Pattern Detected',
        description: `${sensor.type} showing increasing trend above normal range (${sensor.currentValue} ${sensor.unit})`,
        recommendation: 'Monitor closely and investigate if trend continues',
        metrics: {
          sensorType: sensor.type,
          currentValue: sensor.currentValue,
          normalRange: sensor.normalRange,
          trend: sensor.trend
        }
      };
    }

    // Check for multiple warning sensors
    const warningSensors = well.sensors.filter(s => s.status === 'warning');
    if (warningSensors.length >= 2) {
      return {
        wellId: well.id,
        wellName: well.name,
        severity: 'medium',
        title: 'Multiple Warning Sensors',
        description: `${warningSensors.length} sensors showing warning status: ${warningSensors.map(s => s.type).join(', ')}`,
        recommendation: 'Investigate potential systemic issue',
        metrics: {
          warningSensors: warningSensors.length,
          sensors: warningSensors.map(s => ({ type: s.type, value: s.currentValue, unit: s.unit }))
        }
      };
    }

    return null;
  }

  /**
   * Check if well is a top performer
   */
  private isTopPerformer(well: Well): boolean {
    return (
      well.healthScore >= 90 &&
      well.operationalStatus === 'operational' &&
      well.alerts.filter(a => a.severity === 'critical').length === 0 &&
      well.metadata.production.efficiency >= 85
    );
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(well: Well): number {
    // Simplified calculation based on operational status and health score
    if (well.operationalStatus === 'offline') return 0;
    if (well.operationalStatus === 'critical') return 50;
    if (well.operationalStatus === 'degraded') return 75;
    return Math.min(98, well.healthScore);
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: 'critical' | 'high' | 'medium' | 'info'): number {
    const weights = { critical: 4, high: 3, medium: 2, info: 1 };
    return weights[severity];
  }

  /**
   * Calculate days overdue for maintenance
   */
  private calculateDaysOverdue(nextMaintenanceDate: string): number {
    const nextDate = new Date(nextMaintenanceDate);
    const today = new Date();
    const diffTime = today.getTime() - nextDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate due date for action
   */
  private calculateDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get top wells by production efficiency
   */
  private getTopByProduction(wells: Well[], count: number): Well[] {
    return [...wells]
      .sort((a, b) => b.metadata.production.efficiency - a.metadata.production.efficiency)
      .slice(0, count);
  }

  /**
   * Get bottom wells by production efficiency
   */
  private getBottomByProduction(wells: Well[], count: number): Well[] {
    return [...wells]
      .sort((a, b) => a.metadata.production.efficiency - b.metadata.production.efficiency)
      .slice(0, count);
  }
}

// Export singleton instance
export const wellAnalysisEngine = new WellAnalysisEngine();
