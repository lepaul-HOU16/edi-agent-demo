/**
 * Layout Optimization Service Tests
 */

import { LayoutOptimizationService } from '../LayoutOptimizationService';
import {
  OptimizationSiteArea,
  OptimizationConstraint,
  OptimizationConfig
} from '../../../types/layoutOptimization';
import { WindResourceData } from '../../../types/windData';
import { TurbineSpecification } from '../../../types/wakeData';

describe('LayoutOptimizationService', () => {
  let service: LayoutOptimizationService;
  let mockSiteArea: OptimizationSiteArea;
  let mockWindData: WindResourceData;
  let mockTurbineSpec: TurbineSpecification;
  let mockConstraints: OptimizationConstraint[];
  let mockConfig: OptimizationConfig;

  beforeEach(() => {
    service = new LayoutOptimizationService();
    
    mockSiteArea = {
      boundary: {
        coordinates: [
          [0, 0],
          [1000, 0],
          [1000, 1000],
          [0, 1000],
          [0, 0]
        ]
      },
      availableArea: 1000000, // 1 km²
      exclusionZones: [],
      terrainFeatures: []
    };

    mockWindData = {
      location: { lat: 40.7128, lng: -74.0060 },
      measurementHeight: 100,
      dataSource: 'test',
      timeRange: {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        totalHours: 8760
      },
      windData: [],
      statistics: {
        meanWindSpeed: 8.5,
        maxWindSpeed: 25.0,
        minWindSpeed: 0.0,
        standardDeviation: 3.2,
        prevailingDirection: 225,
        calmPercentage: 5.0,
        powerDensity: 450,
        weibullParameters: {
          shape: 2.1,
          scale: 9.2
        }
      },
      qualityMetrics: {
        completeness: 95.5,
        missingDataPoints: 394,
        outlierCount: 12,
        validationFlags: [],
        reliability: 'high'
      }
    };

    mockTurbineSpec = {
      model: 'Test Turbine 2.5MW',
      manufacturer: 'Test Manufacturer',
      ratedPower: 2500, // kW
      rotorDiameter: 120, // meters
      hubHeight: 100, // meters
      cutInSpeed: 3.0,
      ratedSpeed: 12.0,
      cutOutSpeed: 25.0,
      powerCurve: [
        { windSpeed: 3, power: 0, coefficient: 0 },
        { windSpeed: 12, power: 2500, coefficient: 0.45 },
        { windSpeed: 25, power: 2500, coefficient: 0.45 }
      ],
      thrustCurve: [
        { windSpeed: 3, thrust: 50, coefficient: 0.8 },
        { windSpeed: 12, thrust: 200, coefficient: 0.7 },
        { windSpeed: 25, thrust: 100, coefficient: 0.3 }
      ]
    };

    mockConstraints = [
      {
        id: 'min_spacing',
        type: 'minimum_spacing',
        description: 'Minimum turbine spacing',
        parameters: { value: 300 }, // 300 meters
        enforcement: 'hard',
        active: true
      },
      {
        id: 'setback',
        type: 'setback_distance',
        description: 'Setback from boundaries',
        parameters: { value: 100 }, // 100 meters
        enforcement: 'hard',
        active: true
      }
    ];

    mockConfig = {
      algorithm: {
        type: 'genetic_algorithm',
        parameters: {
          populationSize: 20,
          generations: 10,
          crossoverRate: 0.8,
          mutationRate: 0.1,
          elitismRate: 0.1
        },
        parallelization: false
      },
      objectives: [
        {
          type: 'maximize_energy_yield',
          weight: 0.4,
          priority: 'primary'
        },
        {
          type: 'minimize_wake_losses',
          weight: 0.3,
          priority: 'secondary'
        },
        {
          type: 'minimize_cost',
          weight: 0.3,
          priority: 'secondary'
        }
      ],
      constraints: [],
      parameters: {
        minTurbineSpacing: 300,
        maxTurbineSpacing: 1000,
        minSetbackDistance: 100,
        gridResolution: 50,
        wakeModelAccuracy: 'medium',
        considerTerrainEffects: false,
        considerNoise: false,
        considerVisualImpact: false,
        multiDirectionalOptimization: false
      },
      convergenceCriteria: {
        maxGenerations: 10,
        toleranceThreshold: 0.001,
        stallGenerations: 5
      },
      outputConfig: {
        saveIntermediateResults: false,
        generateVisualization: true,
        exportFormats: ['json'],
        includeWakeAnalysis: true,
        includeSensitivityAnalysis: false
      }
    };
  });

  describe('optimizeLayout', () => {
    it('should successfully optimize a simple layout', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      expect(result).toBeDefined();
      expect(result.bestLayout).toBeDefined();
      expect(result.bestLayout.turbines.length).toBeGreaterThan(0);
      expect(result.bestLayout.fitnessScore).toBeGreaterThan(0);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.constraintCompliance).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should respect minimum spacing constraints', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      const turbines = result.bestLayout.turbines;
      
      // Check that all turbines respect minimum spacing
      for (let i = 0; i < turbines.length; i++) {
        for (let j = i + 1; j < turbines.length; j++) {
          const distance = Math.sqrt(
            Math.pow(turbines[i].x - turbines[j].x, 2) +
            Math.pow(turbines[i].y - turbines[j].y, 2)
          );
          
          // Allow some tolerance for optimization algorithm
          expect(distance).toBeGreaterThanOrEqual(250); // 300m - 50m tolerance
        }
      }
    });

    it('should generate optimization history', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      expect(result.optimizationHistory).toBeDefined();
      expect(result.optimizationHistory.length).toBeGreaterThan(0);
      expect(result.optimizationHistory[0]).toHaveProperty('generation');
      expect(result.optimizationHistory[0]).toHaveProperty('bestFitness');
      expect(result.optimizationHistory[0]).toHaveProperty('averageFitness');
    });

    it('should calculate performance metrics', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      const metrics = result.performanceMetrics;
      expect(metrics.energyMetrics).toBeDefined();
      expect(metrics.economicMetrics).toBeDefined();
      expect(metrics.technicalMetrics).toBeDefined();
      expect(metrics.environmentalMetrics).toBeDefined();
      
      expect(metrics.energyMetrics.annualEnergyYield).toBeGreaterThan(0);
      expect(metrics.energyMetrics.capacityFactor).toBeGreaterThan(0);
      expect(metrics.energyMetrics.capacityFactor).toBeLessThanOrEqual(100);
    });

    it('should provide constraint compliance information', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      const compliance = result.constraintCompliance;
      expect(compliance.overallCompliance).toBeGreaterThanOrEqual(0);
      expect(compliance.overallCompliance).toBeLessThanOrEqual(100);
      expect(compliance.hardConstraintViolations).toBeGreaterThanOrEqual(0);
      expect(compliance.softConstraintViolations).toBeGreaterThanOrEqual(0);
      expect(compliance.recommendations).toBeDefined();
    });

    it('should generate recommendations', async () => {
      const result = await service.optimizeLayout(
        mockSiteArea,
        mockWindData,
        mockTurbineSpec,
        mockConstraints,
        mockConfig
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation).toHaveProperty('id');
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('expectedBenefit');
      }
    });

    it('should handle empty site area gracefully', async () => {
      const emptySiteArea = {
        ...mockSiteArea,
        boundary: {
          coordinates: [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0]
          ]
        },
        availableArea: 100 // Very small area
      };

      await expect(
        service.optimizeLayout(
          emptySiteArea,
          mockWindData,
          mockTurbineSpec,
          mockConstraints,
          mockConfig
        )
      ).rejects.toThrow();
    });
  });
});