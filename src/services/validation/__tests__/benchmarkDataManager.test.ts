/**
 * Benchmark Data Manager Tests
 * Tests for loading and managing validation benchmark datasets
 */

import { BenchmarkDataManager, BenchmarkDataset } from '../benchmarkDataManager';

describe('BenchmarkDataManager', () => {
  let dataManager: BenchmarkDataManager;

  beforeEach(async () => {
    dataManager = new BenchmarkDataManager();
    await dataManager.loadStandardDatasets();
  });

  describe('Dataset Loading', () => {
    it('should load all standard datasets', () => {
      const datasets = dataManager.getDatasets();
      expect(datasets.length).toBeGreaterThanOrEqual(5);
      
      const datasetNames = datasets.map(d => d.name);
      expect(datasetNames).toContain('Techlog_2023_Standards');
      expect(datasetNames).toContain('Geolog_8_Standards');
      expect(datasetNames).toContain('IP_4_7_Standards');
      expect(datasetNames).toContain('SPE_Standards_2023');
      expect(datasetNames).toContain('SPWLA_Standards_2023');
    });

    it('should load Techlog dataset with proper structure', () => {
      const techlogDataset = dataManager.getDataset('Techlog_2023_Standards');
      expect(techlogDataset).toBeDefined();
      expect(techlogDataset!.source).toBe('Schlumberger Techlog 2023.1');
      expect(techlogDataset!.benchmarks.length).toBeGreaterThan(0);
      
      // Check for specific benchmarks
      const benchmarkNames = techlogDataset!.benchmarks.map(b => b.name);
      expect(benchmarkNames).toContain('techlog_porosity_density_sandstone');
      expect(benchmarkNames).toContain('techlog_porosity_neutron_sandstone');
      expect(benchmarkNames).toContain('techlog_porosity_density_carbonate');
    });

    it('should load Geolog dataset with shale volume benchmarks', () => {
      const geologDataset = dataManager.getDataset('Geolog_8_Standards');
      expect(geologDataset).toBeDefined();
      expect(geologDataset!.source).toBe('Paradigm Geolog 8.0');
      
      const shaleVolumeBenchmarks = geologDataset!.benchmarks.filter(
        b => b.calculationType === 'shale_volume'
      );
      expect(shaleVolumeBenchmarks.length).toBeGreaterThan(0);
      
      const benchmarkNames = shaleVolumeBenchmarks.map(b => b.name);
      expect(benchmarkNames).toContain('geolog_shale_larionov_tertiary_clastic');
      expect(benchmarkNames).toContain('geolog_shale_larionov_mesozoic_clastic');
    });

    it('should load Interactive Petrophysics dataset with saturation benchmarks', () => {
      const ipDataset = dataManager.getDataset('IP_4_7_Standards');
      expect(ipDataset).toBeDefined();
      expect(ipDataset!.source).toBe('Senergy Interactive Petrophysics 4.7');
      
      const saturationBenchmarks = ipDataset!.benchmarks.filter(
        b => b.calculationType === 'saturation'
      );
      expect(saturationBenchmarks.length).toBeGreaterThan(0);
      
      const permeabilityBenchmarks = ipDataset!.benchmarks.filter(
        b => b.calculationType === 'permeability'
      );
      expect(permeabilityBenchmarks.length).toBeGreaterThan(0);
    });

    it('should load SPE and SPWLA standard datasets', () => {
      const speDataset = dataManager.getDataset('SPE_Standards_2023');
      const spwlaDataset = dataManager.getDataset('SPWLA_Standards_2023');
      
      expect(speDataset).toBeDefined();
      expect(spwlaDataset).toBeDefined();
      
      expect(speDataset!.source).toBe('SPE Standards Committee');
      expect(spwlaDataset!.source).toBe('SPWLA Standards Committee');
    });
  });

  describe('Benchmark Retrieval', () => {
    it('should retrieve all benchmarks from all datasets', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      expect(allBenchmarks.length).toBeGreaterThan(5);
      
      // Check that benchmarks from different datasets are included
      const sources = [...new Set(allBenchmarks.map(b => b.metadata.source))];
      expect(sources.length).toBeGreaterThanOrEqual(5);
    });

    it('should filter benchmarks by calculation type', () => {
      const porosityBenchmarks = dataManager.getBenchmarksByType('porosity');
      const shaleVolumeBenchmarks = dataManager.getBenchmarksByType('shale_volume');
      const saturationBenchmarks = dataManager.getBenchmarksByType('saturation');
      
      expect(porosityBenchmarks.length).toBeGreaterThan(0);
      expect(shaleVolumeBenchmarks.length).toBeGreaterThan(0);
      expect(saturationBenchmarks.length).toBeGreaterThan(0);
      
      // Verify filtering works correctly
      porosityBenchmarks.forEach(b => {
        expect(b.calculationType).toBe('porosity');
      });
      
      shaleVolumeBenchmarks.forEach(b => {
        expect(b.calculationType).toBe('shale_volume');
      });
    });

    it('should filter benchmarks by software', () => {
      const techlogBenchmarks = dataManager.getBenchmarksBySoftware('Techlog');
      const geologBenchmarks = dataManager.getBenchmarksBySoftware('Geolog');
      const ipBenchmarks = dataManager.getBenchmarksBySoftware('InteractivePetrophysics');
      
      expect(techlogBenchmarks.length).toBeGreaterThan(0);
      expect(geologBenchmarks.length).toBeGreaterThan(0);
      expect(ipBenchmarks.length).toBeGreaterThan(0);
      
      // Verify filtering works correctly
      techlogBenchmarks.forEach(b => {
        expect(b.software).toBe('Techlog');
      });
    });
  });

  describe('Benchmark Data Quality', () => {
    it('should have proper tolerance settings for all benchmarks', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      
      allBenchmarks.forEach(benchmark => {
        expect(benchmark.tolerance).toBe(0.05); // ±5% target
        expect(benchmark.tolerance).toBeGreaterThan(0);
        expect(benchmark.tolerance).toBeLessThanOrEqual(0.1);
      });
    });

    it('should have complete input data for all benchmarks', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      
      allBenchmarks.forEach(benchmark => {
        expect(benchmark.inputData.wellName).toBeDefined();
        expect(benchmark.inputData.depths).toBeDefined();
        expect(benchmark.inputData.depths.length).toBeGreaterThan(0);
        expect(benchmark.inputData.curves).toBeDefined();
        expect(Object.keys(benchmark.inputData.curves).length).toBeGreaterThan(0);
      });
    });

    it('should have complete expected results for all benchmarks', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      
      allBenchmarks.forEach(benchmark => {
        expect(benchmark.expectedResults.values).toBeDefined();
        expect(benchmark.expectedResults.values.length).toBe(benchmark.inputData.depths.length);
        expect(benchmark.expectedResults.statistics).toBeDefined();
        expect(benchmark.expectedResults.qualityMetrics).toBeDefined();
        
        // Check statistics completeness
        const stats = benchmark.expectedResults.statistics;
        expect(stats.mean).toBeDefined();
        expect(stats.median).toBeDefined();
        expect(stats.min).toBeDefined();
        expect(stats.max).toBeDefined();
        expect(stats.stdDev).toBeDefined();
      });
    });

    it('should have proper metadata for all benchmarks', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      
      allBenchmarks.forEach(benchmark => {
        expect(benchmark.metadata.source).toBeDefined();
        expect(benchmark.metadata.version).toBeDefined();
        expect(benchmark.metadata.dateCreated).toBeDefined();
        expect(benchmark.metadata.description).toBeDefined();
        expect(benchmark.metadata.geologicalContext).toBeDefined();
      });
    });
  });

  describe('Dataset Management', () => {
    it('should allow adding custom datasets', () => {
      const customDataset: BenchmarkDataset = {
        name: 'Custom_Test_Dataset',
        description: 'Test dataset for validation',
        source: 'Test Source',
        benchmarks: [{
          name: 'custom_test_benchmark',
          software: 'Techlog',
          calculationType: 'porosity',
          method: 'density',
          inputData: {
            wellName: 'TEST_WELL',
            depths: [1000],
            curves: { RHOB: [2.4] },
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 }
          },
          expectedResults: {
            values: [0.15],
            statistics: { mean: 0.15, median: 0.15, min: 0.15, max: 0.15, stdDev: 0 },
            qualityMetrics: { dataCompleteness: 100, confidenceLevel: 'high' }
          },
          tolerance: 0.05,
          metadata: {
            source: 'Test',
            version: '1.0',
            dateCreated: '2024-01-15',
            description: 'Test benchmark',
            geologicalContext: 'Test'
          }
        }],
        metadata: {
          version: '1.0',
          dateCreated: '2024-01-15',
          lastUpdated: '2024-01-15',
          author: 'Test Author',
          geologicalContext: ['Test'],
          wellTypes: ['Test'],
          calculationTypes: ['porosity'],
          referencePublications: ['Test Publication']
        }
      };

      dataManager.addDataset(customDataset);
      
      const retrieved = dataManager.getDataset('Custom_Test_Dataset');
      expect(retrieved).toEqual(customDataset);
    });

    it('should export and import datasets correctly', () => {
      const originalDataset = dataManager.getDataset('Techlog_2023_Standards');
      expect(originalDataset).toBeDefined();
      
      // Export dataset
      const exportedJson = dataManager.exportDataset('Techlog_2023_Standards');
      expect(exportedJson).toBeDefined();
      expect(exportedJson).not.toBeNull();
      
      // Create new manager and import
      const newManager = new BenchmarkDataManager();
      const importSuccess = newManager.importDataset(exportedJson!);
      expect(importSuccess).toBe(true);
      
      // Verify imported dataset
      const importedDataset = newManager.getDataset('Techlog_2023_Standards');
      expect(importedDataset).toEqual(originalDataset);
    });

    it('should handle invalid JSON import gracefully', () => {
      const invalidJson = '{ invalid json }';
      const importSuccess = dataManager.importDataset(invalidJson);
      expect(importSuccess).toBe(false);
    });
  });

  describe('Geological Context Coverage', () => {
    it('should cover multiple geological contexts', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      const geologicalContexts = [...new Set(
        allBenchmarks.map(b => b.metadata.geologicalContext)
      )];
      
      expect(geologicalContexts.length).toBeGreaterThan(3);
      
      // Should include major reservoir types
      const contextString = geologicalContexts.join(' ').toLowerCase();
      expect(contextString).toMatch(/sandstone|sand/);
      expect(contextString).toMatch(/carbonate|limestone/);
      expect(contextString).toMatch(/shale|clastic/);
    });

    it('should cover multiple calculation methods', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      const methods = [...new Set(allBenchmarks.map(b => b.method))];
      
      expect(methods.length).toBeGreaterThan(5);
      
      // Should include major calculation methods
      expect(methods).toContain('density');
      expect(methods).toContain('neutron');
      expect(methods).toContain('larionov_tertiary');
      expect(methods).toContain('larionov_mesozoic');
      expect(methods).toContain('archie');
      expect(methods).toContain('timur');
    });
  });

  describe('Industry Standard Compliance', () => {
    it('should include SPE standard benchmarks', () => {
      const speBenchmarks = dataManager.getBenchmarksBySoftware('Techlog').filter(
        b => b.metadata.source.includes('SPE')
      );
      expect(speBenchmarks.length).toBeGreaterThan(0);
    });

    it('should include SPWLA standard benchmarks', () => {
      const spwlaBenchmarks = dataManager.getAllBenchmarks().filter(
        b => b.metadata.source.includes('SPWLA')
      );
      expect(spwlaBenchmarks.length).toBeGreaterThan(0);
    });

    it('should have reference publications for all benchmarks', () => {
      const allBenchmarks = dataManager.getAllBenchmarks();
      
      allBenchmarks.forEach(benchmark => {
        expect(benchmark.metadata.referencePublication).toBeDefined();
        expect(benchmark.metadata.referencePublication!.length).toBeGreaterThan(0);
      });
    });
  });
});