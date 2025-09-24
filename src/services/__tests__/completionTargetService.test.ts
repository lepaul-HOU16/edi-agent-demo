import { CompletionTargetService } from '../completionTargetService';
import { WellLogData, CalculationResult, CompletionTarget } from '../../types/petrophysics';

// Mock well data
const mockWellData: WellLogData = {
  wellName: 'Test-Well-001',
  wellInfo: {
    wellName: 'Test-Well-001',
    field: 'Test Field',
    operator: 'Test Operator',
    location: { latitude: 30.0, longitude: -95.0 },
    elevation: 100,
    totalDepth: 10000,
    wellType: 'vertical'
  },
  curves: [],
  depthRange: [8000, 9000],
  dataQuality: {
    overallQuality: 'good',
    dataCompleteness: 0.95,
    environmentalCorrections: [],
    validationFlags: [],
    lastAssessment: new Date()
  },
  lastModified: new Date(),
  version: '1.0'
};

// Mock calculation results
const createMockCalculationResult = (values: number[]): CalculationResult => ({
  values,
  depths: values.map((_, i) => 8000 + i * 10), // 10ft intervals
  uncertainty: values.map(() => 0.05),
  quality: {
    dataCompleteness: 1.0,
    environmentalCorrections: [],
    uncertaintyRange: [0.02, 0.08],
    confidenceLevel: 'high'
  },
  methodology: 'Test Method',
  parameters: {},
  statistics: {
    mean: values.reduce((sum, val) => sum + val, 0) / values.length,
    median: values[Math.floor(values.length / 2)],
    standardDeviation: 0.05,
    min: Math.min(...values),
    max: Math.max(...values),
    percentiles: { P10: values[0], P50: values[Math.floor(values.length / 2)], P90: values[values.length - 1] },
    count: values.length,
    validCount: values.length
  },
  timestamp: new Date()
});

describe('CompletionTargetService', () => {
  let service: CompletionTargetService;

  beforeEach(() => {
    service = new CompletionTargetService();
  });

  describe('identifyCompletionTargets', () => {
    it('identifies high-quality completion targets', () => {
      // Create data with a high-quality interval
      const porosity = createMockCalculationResult([
        0.05, 0.08, 0.18, 0.20, 0.22, 0.19, 0.21, 0.18, 0.08, 0.05
      ]);
      const permeability = createMockCalculationResult([
        0.1, 0.5, 15, 25, 30, 20, 28, 12, 0.8, 0.2
      ]);
      const saturation = createMockCalculationResult([
        0.8, 0.7, 0.3, 0.25, 0.20, 0.28, 0.22, 0.35, 0.6, 0.75
      ]);
      const shaleVolume = createMockCalculationResult([
        0.6, 0.5, 0.1, 0.05, 0.03, 0.08, 0.04, 0.12, 0.4, 0.55
      ]);

      const cutoffs = {
        porosityMin: 0.15,
        permeabilityMin: 10,
        waterSaturationMax: 0.4,
        shaleVolumeMax: 0.15
      };

      const targets = service.identifyCompletionTargets(
        mockWellData,
        porosity,
        permeability,
        saturation,
        shaleVolume,
        cutoffs
      );

      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0].wellName).toBe('Test-Well-001');
      expect(['excellent', 'good', 'fair']).toContain(targets[0].quality);
      expect(targets[0].thickness).toBeGreaterThan(0);
    });

    it('handles data with no qualifying intervals', () => {
      // Create data with poor reservoir quality
      const porosity = createMockCalculationResult([0.05, 0.06, 0.04, 0.07, 0.05]);
      const permeability = createMockCalculationResult([0.1, 0.2, 0.15, 0.3, 0.1]);
      const saturation = createMockCalculationResult([0.9, 0.85, 0.92, 0.88, 0.9]);
      const shaleVolume = createMockCalculationResult([0.8, 0.75, 0.85, 0.7, 0.8]);

      const cutoffs = {
        porosityMin: 0.15,
        permeabilityMin: 10,
        waterSaturationMax: 0.4,
        shaleVolumeMax: 0.15
      };

      const targets = service.identifyCompletionTargets(
        mockWellData,
        porosity,
        permeability,
        saturation,
        shaleVolume,
        cutoffs
      );

      expect(targets).toHaveLength(0);
    });

    it('throws error for invalid input data', () => {
      const porosity = createMockCalculationResult([0.2, 0.18]);
      const permeability = createMockCalculationResult([15, 20, 25]); // Different length
      const saturation = createMockCalculationResult([0.3, 0.25]);
      const shaleVolume = createMockCalculationResult([0.1, 0.08]);

      const cutoffs = {
        porosityMin: 0.15,
        permeabilityMin: 10,
        waterSaturationMax: 0.4,
        shaleVolumeMax: 0.15
      };

      expect(() => {
        service.identifyCompletionTargets(
          mockWellData,
          porosity,
          permeability,
          saturation,
          shaleVolume,
          cutoffs
        );
      }).toThrow('Invalid input data for completion target identification');
    });
  });

  describe('rankTargets', () => {
    it('ranks targets by composite score', () => {
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8020,
          thickness: 20,
          averagePorosity: 0.15,
          estimatedPermeability: 5,
          waterSaturation: 0.6,
          shaleVolume: 0.2,
          ranking: 0,
          quality: 'fair'
        },
        {
          wellName: 'Test-Well-001',
          startDepth: 8050,
          endDepth: 8100,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 50,
          waterSaturation: 0.25,
          shaleVolume: 0.05,
          ranking: 0,
          quality: 'excellent'
        }
      ];

      const rankedTargets = service.rankTargets(targets);

      expect(rankedTargets).toHaveLength(2);
      expect(rankedTargets[0].ranking).toBe(1);
      expect(rankedTargets[1].ranking).toBe(2);
      expect(rankedTargets[0].quality).toBe('excellent'); // Better target should be ranked first
    });

    it('handles empty targets array', () => {
      const rankedTargets = service.rankTargets([]);
      expect(rankedTargets).toHaveLength(0);
    });
  });

  describe('optimizePerforationIntervals', () => {
    it('creates perforation intervals for excellent targets', () => {
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8050,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];

      const perforationIntervals = service.optimizePerforationIntervals(targets);

      expect(perforationIntervals.length).toBeGreaterThan(0);
      expect(perforationIntervals[0].targetId).toContain('Test-Well-001');
      expect(perforationIntervals[0].expectedProductivity).toBeGreaterThan(0);
    });

    it('handles targets that are too thin for perforation', () => {
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8005, // Only 5 feet thick
          thickness: 5,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];

      const perforationIntervals = service.optimizePerforationIntervals(targets, 20, 10);

      expect(perforationIntervals).toHaveLength(0);
    });
  });

  describe('generateCompletionRecommendations', () => {
    it('generates recommendations for completion targets', () => {
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8050,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];

      const perforationIntervals = service.optimizePerforationIntervals(targets);
      const recommendations = service.generateCompletionRecommendations(targets, perforationIntervals);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].wellName).toBe('Test-Well-001');
      expect(recommendations[0].completionType).toBeDefined();
      expect(recommendations[0].stimulationRecommendation).toBeDefined();
      expect(recommendations[0].expectedRecovery).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(recommendations[0].riskAssessment);
      expect(recommendations[0].economicMetrics).toBeDefined();
    });

    it('sorts recommendations by priority', () => {
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8020,
          thickness: 20,
          averagePorosity: 0.15,
          estimatedPermeability: 5,
          waterSaturation: 0.6,
          shaleVolume: 0.2,
          ranking: 2,
          quality: 'fair'
        },
        {
          wellName: 'Test-Well-001',
          startDepth: 8050,
          endDepth: 8100,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];

      const perforationIntervals = service.optimizePerforationIntervals(targets);
      const recommendations = service.generateCompletionRecommendations(targets, perforationIntervals);

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].priority).toBeLessThan(recommendations[1].priority);
    });
  });

  describe('getTargetsForWell', () => {
    it('returns targets for specific well', () => {
      // First create some targets
      const porosity = createMockCalculationResult([0.2, 0.18, 0.22]);
      const permeability = createMockCalculationResult([15, 20, 25]);
      const saturation = createMockCalculationResult([0.3, 0.25, 0.28]);
      const shaleVolume = createMockCalculationResult([0.1, 0.08, 0.12]);

      const cutoffs = {
        porosityMin: 0.15,
        permeabilityMin: 10,
        waterSaturationMax: 0.4,
        shaleVolumeMax: 0.15
      };

      service.identifyCompletionTargets(
        mockWellData,
        porosity,
        permeability,
        saturation,
        shaleVolume,
        cutoffs
      );

      const wellTargets = service.getTargetsForWell('Test-Well-001');
      expect(wellTargets.every(target => target.wellName === 'Test-Well-001')).toBe(true);
    });

    it('returns empty array for non-existent well', () => {
      const wellTargets = service.getTargetsForWell('Non-Existent-Well');
      expect(wellTargets).toHaveLength(0);
    });
  });

  describe('getTargetsByQuality', () => {
    it('filters targets by quality rating', () => {
      // Create targets with different qualities
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8020,
          thickness: 20,
          averagePorosity: 0.15,
          estimatedPermeability: 5,
          waterSaturation: 0.6,
          shaleVolume: 0.2,
          ranking: 2,
          quality: 'fair'
        },
        {
          wellName: 'Test-Well-001',
          startDepth: 8050,
          endDepth: 8100,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];

      // Manually add targets to service for testing
      (service as any).targets = targets;

      const excellentTargets = service.getTargetsByQuality('excellent');
      const fairTargets = service.getTargetsByQuality('fair');

      expect(excellentTargets).toHaveLength(1);
      expect(excellentTargets[0].quality).toBe('excellent');
      expect(fairTargets).toHaveLength(1);
      expect(fairTargets[0].quality).toBe('fair');
    });
  });

  describe('exportTargets', () => {
    beforeEach(() => {
      // Add some targets for export testing
      const targets: CompletionTarget[] = [
        {
          wellName: 'Test-Well-001',
          startDepth: 8000,
          endDepth: 8050,
          thickness: 50,
          averagePorosity: 0.25,
          estimatedPermeability: 100,
          waterSaturation: 0.2,
          shaleVolume: 0.03,
          ranking: 1,
          quality: 'excellent'
        }
      ];
      (service as any).targets = targets;
    });

    it('exports targets as JSON', () => {
      const jsonExport = service.exportTargets('json');
      const parsed = JSON.parse(jsonExport);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toHaveProperty('wellName');
      expect(parsed[0]).toHaveProperty('quality');
    });

    it('exports targets as CSV', () => {
      const csvExport = service.exportTargets('csv');
      const lines = csvExport.split('\n');

      expect(lines[0]).toContain('Well Name');
      expect(lines[0]).toContain('Quality');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('exports targets as Excel placeholder', () => {
      const excelExport = service.exportTargets('excel');
      expect(excelExport).toContain('Excel export');
    });

    it('throws error for unsupported format', () => {
      expect(() => service.exportTargets('xml' as any)).toThrow('Unsupported export format: xml');
    });
  });

  describe('private methods behavior', () => {
    it('calculates composite scores correctly', () => {
      const target1: CompletionTarget = {
        wellName: 'Test-Well-001',
        startDepth: 8000,
        endDepth: 8100,
        thickness: 100, // Thick interval
        averagePorosity: 0.30, // High porosity
        estimatedPermeability: 1000, // High permeability
        waterSaturation: 0.15, // Low water saturation
        shaleVolume: 0.02,
        ranking: 0,
        quality: 'excellent'
      };

      const target2: CompletionTarget = {
        wellName: 'Test-Well-001',
        startDepth: 8200,
        endDepth: 8210,
        thickness: 10, // Thin interval
        averagePorosity: 0.10, // Low porosity
        estimatedPermeability: 0.5, // Low permeability
        waterSaturation: 0.80, // High water saturation
        shaleVolume: 0.3,
        ranking: 0,
        quality: 'poor'
      };

      const rankedTargets = service.rankTargets([target1, target2]);
      
      // Target1 should rank higher (lower ranking number) than target2
      expect(rankedTargets[0]).toEqual(expect.objectContaining({ wellName: target1.wellName, startDepth: target1.startDepth }));
      expect(rankedTargets[1]).toEqual(expect.objectContaining({ wellName: target2.wellName, startDepth: target2.startDepth }));
    });

    it('assesses target quality based on multiple criteria', () => {
      // Test excellent quality target
      const excellentTarget: CompletionTarget = {
        wellName: 'Test-Well-001',
        startDepth: 8000,
        endDepth: 8100, // 100ft thick
        thickness: 100,
        averagePorosity: 0.25, // 25% porosity
        estimatedPermeability: 200, // 200 mD
        waterSaturation: 0.20, // 20% water saturation
        shaleVolume: 0.02,
        ranking: 0,
        quality: 'excellent'
      };

      // Create targets to test quality assessment
      const targets = service.rankTargets([excellentTarget]);
      expect(targets[0].quality).toBe('excellent');
    });
  });
});