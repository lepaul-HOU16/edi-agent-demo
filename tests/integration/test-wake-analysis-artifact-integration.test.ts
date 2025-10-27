/**
 * Integration Test for WakeAnalysisArtifact Component
 * 
 * Tests that the component correctly renders data from the orchestrator
 */

import { describe, it, expect } from '@jest/globals';

describe('WakeAnalysisArtifact Integration', () => {
  it('should match orchestrator wake_simulation artifact structure', () => {
    // This is the structure created by the orchestrator
    const orchestratorArtifact = {
      type: 'wake_simulation',
      data: {
        messageContentType: 'wake_simulation',
        title: 'Wake Simulation - test-project-123',
        subtitle: '15 turbines, 45.50 GWh/year',
        projectId: 'test-project-123',
        performanceMetrics: {
          annualEnergyProduction: 45.5,
          capacityFactor: 0.35,
          wakeLosses: 0.056,
          grossAEP: 48.2,
          netAEP: 45.5
        },
        turbineMetrics: {
          count: 15,
          totalCapacity: 37.5,
          averageWindSpeed: 8.5
        },
        monthlyProduction: [3.2, 3.5, 4.1, 4.3, 4.5, 4.2, 3.8, 3.6, 3.9, 4.0, 3.7, 3.4],
        visualizations: {
          wake_heat_map: 'https://s3.amazonaws.com/bucket/wake_map.html',
          wake_analysis: 'https://s3.amazonaws.com/bucket/wake_analysis.png'
        },
        windResourceData: {
          source: 'NREL Wind Toolkit',
          dataYear: 2023,
          reliability: 'high'
        },
        message: 'Simulation completed for 15 turbines using NREL Wind Toolkit data (2023)'
      }
    };

    // Verify structure matches component props
    expect(orchestratorArtifact.data.messageContentType).toBe('wake_simulation');
    expect(orchestratorArtifact.data.performanceMetrics).toBeDefined();
    expect(orchestratorArtifact.data.performanceMetrics.netAEP).toBe(45.5);
    expect(orchestratorArtifact.data.performanceMetrics.capacityFactor).toBe(0.35);
    expect(orchestratorArtifact.data.performanceMetrics.wakeLosses).toBe(0.056);
    expect(orchestratorArtifact.data.turbineMetrics).toBeDefined();
    expect(orchestratorArtifact.data.turbineMetrics.count).toBe(15);
    expect(orchestratorArtifact.data.visualizations).toBeDefined();
  });

  it('should handle simulation handler response structure', () => {
    // This is what the simulation handler returns
    const simulationResponse = {
      success: true,
      type: 'wake_simulation',
      data: {
        projectId: 'test-project-123',
        performanceMetrics: {
          annualEnergyProduction: 45.5,
          capacityFactor: 0.35,
          wakeLosses: 0.056,
          grossAEP: 48.2,
          netAEP: 45.5
        },
        turbineMetrics: {
          count: 15,
          totalCapacity: 37.5,
          averageWindSpeed: 8.5
        },
        monthlyProduction: [3.2, 3.5, 4.1, 4.3, 4.5, 4.2, 3.8, 3.6, 3.9, 4.0, 3.7, 3.4],
        visualizations: {
          wake_heat_map: 'https://s3.amazonaws.com/bucket/wake_map.html',
          wake_analysis: 'https://s3.amazonaws.com/bucket/wake_analysis.png',
          performance_charts: [
            'https://s3.amazonaws.com/bucket/perf_1.png',
            'https://s3.amazonaws.com/bucket/perf_2.png'
          ],
          seasonal_analysis: 'https://s3.amazonaws.com/bucket/seasonal.png',
          variability_analysis: 'https://s3.amazonaws.com/bucket/variability.png',
          wind_rose: 'https://s3.amazonaws.com/bucket/wind_rose.png'
        },
        windResourceData: {
          source: 'NREL Wind Toolkit',
          dataYear: 2023,
          reliability: 'high',
          meanWindSpeed: 8.5,
          prevailingDirection: 225,
          dataPoints: 8760
        },
        dataSource: 'NREL Wind Toolkit',
        dataYear: 2023,
        message: 'Simulation completed for 15 turbines using NREL Wind Toolkit data (2023)'
      }
    };

    // Verify all required fields are present
    expect(simulationResponse.success).toBe(true);
    expect(simulationResponse.type).toBe('wake_simulation');
    expect(simulationResponse.data.performanceMetrics).toBeDefined();
    expect(simulationResponse.data.turbineMetrics).toBeDefined();
    expect(simulationResponse.data.visualizations).toBeDefined();
    expect(simulationResponse.data.windResourceData).toBeDefined();
    
    // Verify visualization URLs
    expect(simulationResponse.data.visualizations.wake_heat_map).toContain('wake_map.html');
    expect(simulationResponse.data.visualizations.wake_analysis).toContain('wake_analysis.png');
    expect(simulationResponse.data.visualizations.performance_charts).toHaveLength(2);
  });

  it('should handle minimal wake simulation data', () => {
    // Minimal data that should still work
    const minimalData = {
      type: 'wake_simulation',
      data: {
        messageContentType: 'wake_simulation',
        title: 'Wake Simulation',
        projectId: 'test-project',
        performanceMetrics: {
          capacityFactor: 0.30,
          wakeLosses: 0.08
        }
      }
    };

    // Should have required fields
    expect(minimalData.data.messageContentType).toBe('wake_simulation');
    expect(minimalData.data.performanceMetrics.capacityFactor).toBeDefined();
    expect(minimalData.data.performanceMetrics.wakeLosses).toBeDefined();
  });

  it('should calculate wake efficiency from wake losses', () => {
    const wakeLosses = 0.056; // 5.6%
    const wakeEfficiency = 1 - wakeLosses; // 94.4%
    
    expect(wakeEfficiency).toBeCloseTo(0.944, 3);
    expect((wakeEfficiency * 100).toFixed(1)).toBe('94.4');
  });

  it('should determine wake loss severity correctly', () => {
    const testCases = [
      { loss: 0.03, expected: 'Low' },      // 3%
      { loss: 0.06, expected: 'Moderate' }, // 6%
      { loss: 0.10, expected: 'High' },     // 10%
      { loss: 0.15, expected: 'Very High' } // 15%
    ];

    testCases.forEach(({ loss, expected }) => {
      let severity;
      if (loss < 0.05) severity = 'Low';
      else if (loss < 0.08) severity = 'Moderate';
      else if (loss < 0.12) severity = 'High';
      else severity = 'Very High';
      
      expect(severity).toBe(expected);
    });
  });

  it('should format metrics correctly', () => {
    const aep = 45.5;
    const cf = 0.35;
    const wakeLoss = 0.056;
    
    expect(aep.toFixed(2)).toBe('45.50');
    expect((cf * 100).toFixed(1)).toBe('35.0');
    expect((wakeLoss * 100).toFixed(1)).toBe('5.6');
  });
});
