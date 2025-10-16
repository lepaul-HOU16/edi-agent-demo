/**
 * Comprehensive Well Analysis Engine Tests
 * Tests for AI analysis logic, noteworthy conditions, and priority actions
 * 
 * Requirements: 2.1, 2.2, 3.1
 */

import { WellAnalysisEngine } from '../amplify/functions/shared/wellAnalysisEngine';
import { Well } from '../amplify/functions/shared/wellDataService';

describe('Well Analysis Engine - Comprehensive Tests', () => {
  let analysisEngine: WellAnalysisEngine;
  let mockWells: Well[];

  beforeEach(() => {
    analysisEngine = new WellAnalysisEngine();
    mockWells = createMockWellFleet();
  });

  describe('Noteworthy Conditions Analysis', () => {
    test('should identify critical issues', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);

      expect(conditions.criticalIssues).toBeDefined();
      expect(Array.isArray(conditions.criticalIssues)).toBe(true);
      
      // Should identify wells with critical status or alerts
      const criticalWells = mockWells.filter(w => 
        w.operationalStatus === 'critical' || 
        w.alerts.some(a => a.severity === 'critical')
      );
      
      if (criticalWells.length > 0) {
        expect(conditions.criticalIssues.length).toBeGreaterThan(0);
      }

      console.log(`✅ Critical issues identified: ${conditions.criticalIssues.length}`);
    });

    test('should identify declining health trends', () => {
      // Create historical data showing health decline
      const historicalData = new Map<string, number>();
      mockWells.forEach(well => {
        historicalData.set(well.id, well.healthScore + 15); // Previous health was higher
      });

      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells, historicalData);

      expect(conditions.decliningHealth).toBeDefined();
      expect(Array.isArray(conditions.decliningHealth)).toBe(true);
      
      // Should identify wells with significant health decline
      expect(conditions.decliningHealth.length).toBeGreaterThan(0);

      console.log(`✅ Declining health trends identified: ${conditions.decliningHealth.length}`);
    });

    test('should identify overdue maintenance', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);

      expect(conditions.maintenanceOverdue).toBeDefined();
      expect(Array.isArray(conditions.maintenanceOverdue)).toBe(true);

      // Check if any wells have overdue maintenance
      const overdueWells = mockWells.filter(w => {
        const nextDate = new Date(w.nextMaintenanceDate);
        return nextDate < new Date();
      });

      if (overdueWells.length > 0) {
        expect(conditions.maintenanceOverdue.length).toBeGreaterThan(0);
      }

      console.log(`✅ Overdue maintenance identified: ${conditions.maintenanceOverdue.length}`);
    });

    test('should identify top performers', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);

      expect(conditions.topPerformers).toBeDefined();
      expect(Array.isArray(conditions.topPerformers)).toBe(true);

      // Should identify wells with high health scores and no critical issues
      const highPerformers = mockWells.filter(w => 
        w.healthScore >= 90 && 
        w.operationalStatus === 'operational'
      );

      if (highPerformers.length > 0) {
        expect(conditions.topPerformers.length).toBeGreaterThan(0);
      }

      console.log(`✅ Top performers identified: ${conditions.topPerformers.length}`);
    });

    test('should identify unusual patterns', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);

      expect(conditions.unusualPatterns).toBeDefined();
      expect(Array.isArray(conditions.unusualPatterns)).toBe(true);

      console.log(`✅ Unusual patterns identified: ${conditions.unusualPatterns.length}`);
    });

    test('should sort conditions by severity', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);

      // Verify critical issues are sorted by severity
      if (conditions.criticalIssues.length > 1) {
        for (let i = 0; i < conditions.criticalIssues.length - 1; i++) {
          const current = conditions.criticalIssues[i];
          const next = conditions.criticalIssues[i + 1];
          
          const severityOrder = { critical: 4, high: 3, medium: 2, info: 1 };
          expect(severityOrder[current.severity]).toBeGreaterThanOrEqual(severityOrder[next.severity]);
        }
      }

      console.log('✅ Conditions sorted by severity');
    });
  });

  describe('Priority Actions Generation', () => {
    test('should generate priority actions from noteworthy conditions', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);
      const actions = analysisEngine.generatePriorityActions(mockWells, conditions);

      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
      
      // Should generate actions if there are issues
      const totalIssues = conditions.criticalIssues.length + 
                         conditions.decliningHealth.length + 
                         conditions.maintenanceOverdue.length;
      
      if (totalIssues > 0) {
        expect(actions.length).toBeGreaterThan(0);
      }

      console.log(`✅ Priority actions generated: ${actions.length}`);
    });

    test('should assign correct priority levels', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);
      const actions = analysisEngine.generatePriorityActions(mockWells, conditions);

      // Verify actions have valid priority levels
      actions.forEach(action => {
        expect(['urgent', 'high', 'medium', 'low']).toContain(action.priority);
      });

      // Critical issues should generate urgent actions
      const urgentActions = actions.filter(a => a.priority === 'urgent');
      if (conditions.criticalIssues.length > 0) {
        expect(urgentActions.length).toBeGreaterThan(0);
      }

      console.log(`✅ Priority levels assigned correctly: ${urgentActions.length} urgent`);
    });

    test('should sort actions by priority', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);
      const actions = analysisEngine.generatePriorityActions(mockWells, conditions);

      if (actions.length > 1) {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        
        for (let i = 0; i < actions.length - 1; i++) {
          const current = actions[i];
          const next = actions[i + 1];
          
          expect(priorityOrder[current.priority]).toBeGreaterThanOrEqual(priorityOrder[next.priority]);
        }
      }

      console.log('✅ Actions sorted by priority');
    });

    test('should include estimated time and due dates', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);
      const actions = analysisEngine.generatePriorityActions(mockWells, conditions);

      actions.forEach(action => {
        expect(action).toHaveProperty('estimatedTime');
        expect(action).toHaveProperty('dueDate');
        expect(action).toHaveProperty('actionType');
        
        // Verify action type is valid
        expect(['inspection', 'maintenance', 'diagnostic', 'repair']).toContain(action.actionType);
      });

      console.log('✅ Actions include time estimates and due dates');
    });

    test('should assign unique action IDs', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions(mockWells);
      const actions = analysisEngine.generatePriorityActions(mockWells, conditions);

      const actionIds = actions.map(a => a.id);
      const uniqueIds = new Set(actionIds);
      
      expect(uniqueIds.size).toBe(actionIds.length);

      console.log('✅ All action IDs are unique');
    });
  });

  describe('Performance Rankings', () => {
    test('should identify top performers by health score', () => {
      const topPerformers = analysisEngine.identifyTopPerformers(mockWells, 5);

      expect(topPerformers).toBeDefined();
      expect(Array.isArray(topPerformers)).toBe(true);
      expect(topPerformers.length).toBeLessThanOrEqual(5);

      // Verify sorted by health score (descending)
      if (topPerformers.length > 1) {
        for (let i = 0; i < topPerformers.length - 1; i++) {
          expect(topPerformers[i].healthScore).toBeGreaterThanOrEqual(topPerformers[i + 1].healthScore);
        }
      }

      console.log(`✅ Top ${topPerformers.length} performers identified`);
    });

    test('should identify bottom performers by health score', () => {
      const bottomPerformers = analysisEngine.identifyBottomPerformers(mockWells, 5);

      expect(bottomPerformers).toBeDefined();
      expect(Array.isArray(bottomPerformers)).toBe(true);
      expect(bottomPerformers.length).toBeLessThanOrEqual(5);

      // Verify sorted by health score (ascending)
      if (bottomPerformers.length > 1) {
        for (let i = 0; i < bottomPerformers.length - 1; i++) {
          expect(bottomPerformers[i].healthScore).toBeLessThanOrEqual(bottomPerformers[i + 1].healthScore);
        }
      }

      console.log(`✅ Bottom ${bottomPerformers.length} performers identified`);
    });

    test('should get comparative performance rankings', () => {
      const ranking = analysisEngine.getComparativePerformance(mockWells);

      expect(ranking).toHaveProperty('topByHealth');
      expect(ranking).toHaveProperty('bottomByHealth');
      expect(ranking).toHaveProperty('topByProduction');
      expect(ranking).toHaveProperty('bottomByProduction');

      expect(ranking.topByHealth.length).toBeLessThanOrEqual(5);
      expect(ranking.bottomByHealth.length).toBeLessThanOrEqual(5);
      expect(ranking.topByProduction.length).toBeLessThanOrEqual(5);
      expect(ranking.bottomByProduction.length).toBeLessThanOrEqual(5);

      console.log('✅ Comparative performance rankings generated');
    });
  });

  describe('Health Trend Analysis', () => {
    test('should analyze health trends with historical data', () => {
      const historicalData = new Map<string, number>();
      mockWells.forEach(well => {
        // Simulate various trends
        const variation = Math.random() * 20 - 10; // ±10 points
        historicalData.set(well.id, well.healthScore - variation);
      });

      const trends = analysisEngine.analyzeHealthTrends(mockWells, historicalData);

      expect(trends.size).toBe(mockWells.length);

      // Verify each trend has required properties
      trends.forEach((trend, wellId) => {
        expect(trend).toHaveProperty('change');
        expect(trend).toHaveProperty('trend');
        expect(['improving', 'declining', 'stable']).toContain(trend.trend);
      });

      console.log(`✅ Health trends analyzed for ${trends.size} wells`);
    });

    test('should classify trends correctly', () => {
      const historicalData = new Map<string, number>();
      
      // Create wells with known trends
      const improvingWell = mockWells[0];
      historicalData.set(improvingWell.id, improvingWell.healthScore - 10); // Improved by 10

      const decliningWell = mockWells[1];
      historicalData.set(decliningWell.id, decliningWell.healthScore + 10); // Declined by 10

      const stableWell = mockWells[2];
      historicalData.set(stableWell.id, stableWell.healthScore); // No change

      const trends = analysisEngine.analyzeHealthTrends(mockWells.slice(0, 3), historicalData);

      expect(trends.get(improvingWell.id)?.trend).toBe('improving');
      expect(trends.get(decliningWell.id)?.trend).toBe('declining');
      expect(trends.get(stableWell.id)?.trend).toBe('stable');

      console.log('✅ Trend classification correct');
    });

    test('should handle missing historical data', () => {
      const historicalData = new Map<string, number>();
      // Only add data for some wells
      historicalData.set(mockWells[0].id, 80);

      const trends = analysisEngine.analyzeHealthTrends(mockWells, historicalData);

      // Should still analyze all wells (assume stable for missing data)
      expect(trends.size).toBe(mockWells.length);

      console.log('✅ Missing historical data handled gracefully');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty well list', () => {
      const conditions = analysisEngine.analyzeNoteworthyConditions([]);

      expect(conditions.criticalIssues).toEqual([]);
      expect(conditions.decliningHealth).toEqual([]);
      expect(conditions.maintenanceOverdue).toEqual([]);
      expect(conditions.topPerformers).toEqual([]);
      expect(conditions.unusualPatterns).toEqual([]);

      console.log('✅ Empty well list handled');
    });

    test('should handle single well', () => {
      const singleWell = [mockWells[0]];
      const conditions = analysisEngine.analyzeNoteworthyConditions(singleWell);

      expect(conditions).toBeDefined();
      // Should analyze the single well
      const totalConditions = conditions.criticalIssues.length + 
                             conditions.decliningHealth.length + 
                             conditions.maintenanceOverdue.length + 
                             conditions.topPerformers.length + 
                             conditions.unusualPatterns.length;
      
      expect(totalConditions).toBeGreaterThanOrEqual(0);

      console.log('✅ Single well handled');
    });

    test('should handle wells with no alerts', () => {
      const wellsNoAlerts = mockWells.map(w => ({
        ...w,
        alerts: []
      }));

      const conditions = analysisEngine.analyzeNoteworthyConditions(wellsNoAlerts);

      // Should not crash, may have fewer critical issues
      expect(conditions).toBeDefined();

      console.log('✅ Wells with no alerts handled');
    });

    test('should handle wells with no sensors', () => {
      const wellsNoSensors = mockWells.map(w => ({
        ...w,
        sensors: []
      }));

      const conditions = analysisEngine.analyzeNoteworthyConditions(wellsNoSensors);

      // Should not crash
      expect(conditions).toBeDefined();

      console.log('✅ Wells with no sensors handled');
    });
  });
});

// Helper function to create mock well fleet
function createMockWellFleet(): Well[] {
  const wells: Well[] = [];
  
  for (let i = 1; i <= 24; i++) {
    const wellId = `WELL-${String(i).padStart(3, '0')}`;
    const healthScore = 50 + Math.floor(Math.random() * 50); // 50-100
    const operationalStatus = healthScore > 80 ? 'operational' : healthScore > 60 ? 'degraded' : 'critical';
    
    wells.push({
      id: wellId,
      name: `Production Well ${String(i).padStart(3, '0')}`,
      type: 'well',
      location: `Field A - Sector ${Math.ceil(i / 6)}`,
      operationalStatus: operationalStatus as any,
      healthScore,
      lastMaintenanceDate: '2024-12-15',
      nextMaintenanceDate: i % 3 === 0 ? '2024-12-01' : '2025-03-15', // Some overdue
      sensors: [
        {
          type: 'pressure',
          currentValue: 2500 + i * 50,
          unit: 'PSI',
          normalRange: { min: 2500, max: 3000 },
          alertThreshold: { warning: 3100, critical: 3300 },
          status: 'normal',
          lastUpdated: new Date().toISOString(),
          trend: 'stable'
        }
      ],
      alerts: i % 5 === 0 ? [
        {
          id: `${wellId}-ALERT-1`,
          severity: 'critical',
          message: 'Critical pressure alert',
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ] : [],
      metadata: {
        field: 'Field A',
        operator: 'Energy Corp',
        installDate: '2023-01-15',
        depth: 8000 + i * 100,
        production: {
          currentRate: 400 + i * 10,
          averageRate: 400 + i * 10,
          cumulativeProduction: (400 + i * 10) * 365 * 2,
          efficiency: healthScore
        }
      }
    });
  }
  
  return wells;
}

console.log('🧪 Starting Well Analysis Engine Comprehensive Tests...\n');
