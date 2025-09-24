/**
 * Performance Optimizer Tests
 * Tests caching, lazy loading, and memory optimization features
 * Requirements: 3.4, 4.1
 */

import {
  AdvancedCache,
  LazyLoadManager,
  MemoryOptimizer,
  PerformanceMonitor,
  PetrophysicsPerformanceOptimizer
} from '../performanceOptimizer';
import { WellLogData, CalculationResults } from '../../types/petrophysics';

// Mock data generators
const createMockWellData = (wellName: string, dataSize: number = 1000): WellLogData => ({
  wellName,
  wellInfo: {
    wellName,
    field: 'Test Field',
    operator: 'Test Operator',
    location: { latitude: 30.0, longitude: -95.0 },
    elevation: 100,
    totalDepth: 10000,
    spudDate: new Date('2023-01-01')
  },
  curves: [
    {
      name: 'DEPT',
      unit: 'FT',
      description: 'Depth',
      data: Array.from({ length: dataSize }, (_, i) => 8000 + i),
      nullValue: -999.25,
      quality: {
        completeness: 1.0,
        outliers: 0,
        gaps: 0,
        environmentalCorrections: []
      }
    },
    {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: Array.from({ length: dataSize }, () => 50 + Math.random() * 100),
      nullValue: -999.25,
      quality: {
        completeness: 0.95,
        outliers: 2,
        gaps: 1,
        environmentalCorrections: ['borehole_correction']
      }
    }
  ],
  depthRange: [8000, 8000 + dataSize],
  dataQuality: {
    overallQuality: 'good',
    completeness: 0.95,
    issues: [],
    recommendations: []
  },
  lastModified: new Date()
});

const createMockCalculationResult = (wellName: string): CalculationResults => ({
  wellName,
  calculationType: 'porosity',
  method: 'density',
  parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
  results: [{
    values: Array.from({ length: 1000 }, () => Math.random() * 0.3),
    depths: Array.from({ length: 1000 }, (_, i) => 8000 + i),
    uncertainty: Array.from({ length: 1000 }, () => 0.02),
    quality: {
      dataCompleteness: 0.95,
      environmentalCorrections: [],
      uncertaintyRange: [0.02, 0.05],
      confidenceLevel: 'high'
    },
    methodology: 'Density porosity calculation'
  }],
  statistics: {
    mean: 0.15,
    median: 0.14,
    standardDeviation: 0.05,
    min: 0.05,
    max: 0.25,
    percentiles: { P10: 0.08, P50: 0.14, P90: 0.22 },
    count: 1000,
    validCount: 950
  },
  qualityMetrics: {
    dataCompleteness: 0.95,
    environmentalCorrections: [],
    uncertaintyRange: [0.02, 0.05],
    confidenceLevel: 'high'
  },
  timestamp: new Date()
});

describe('AdvancedCache', () => {
  let cache: AdvancedCache<string, any>;

  beforeEach(() => {
    cache = new AdvancedCache({
      maxSize: 5,
      ttl: 1000,
      enableCompression: false,
      enablePersistence: false
    });
  });

  test('should store and retrieve values', () => {
    const testData = { test: 'data' };
    cache.set('key1', testData);
    
    expect(cache.get('key1')).toEqual(testData);
    expect(cache.has('key1')).toBe(true);
  });

  test('should handle TTL expiration', async () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  test('should evict LRU items when cache is full', () => {
    // Fill cache to capacity
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    
    expect(cache.getSize()).toBe(5);
    
    // Add one more item, should evict the first one
    cache.set('key5', 'value5');
    
    expect(cache.getSize()).toBe(5);
    expect(cache.has('key0')).toBe(false); // First item should be evicted
    expect(cache.has('key5')).toBe(true); // New item should be present
  });

  test('should update access order on get', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    cache.set('key5', 'value5');
    
    // Access key1 to make it most recently used
    cache.get('key1');
    
    // Add new item, should evict key2 (now least recently used)
    cache.set('key6', 'value6');
    
    expect(cache.has('key1')).toBe(true); // Should still be present
    expect(cache.has('key2')).toBe(false); // Should be evicted
  });

  test('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    
    // 2 hits
    cache.get('key1');
    cache.get('key1');
    
    // 1 miss
    cache.get('nonexistent');
    
    expect(cache.getHitRate()).toBeCloseTo(2/3, 2);
  });

  test('should handle compression when enabled', () => {
    const compressedCache = new AdvancedCache({
      maxSize: 10,
      ttl: 5000,
      enableCompression: true,
      enablePersistence: false
    });
    
    const largeData = { data: 'x'.repeat(1000) };
    compressedCache.set('key1', largeData);
    
    const retrieved = compressedCache.get('key1');
    expect(retrieved).toEqual(largeData);
  });
});

describe('LazyLoadManager', () => {
  let lazyLoader: LazyLoadManager;

  beforeEach(() => {
    lazyLoader = new LazyLoadManager({
      chunkSize: 100,
      preloadThreshold: 0.8,
      maxConcurrentLoads: 2
    });
  });

  test('should load chunks on demand', async () => {
    const mockLoader = jest.fn().mockResolvedValue('chunk data');
    
    const result = await lazyLoader.loadChunk('chunk1', mockLoader);
    
    expect(result).toBe('chunk data');
    expect(mockLoader).toHaveBeenCalledTimes(1);
    expect(lazyLoader.isLoaded('chunk1')).toBe(true);
  });

  test('should not reload already loaded chunks', async () => {
    const mockLoader = jest.fn().mockResolvedValue('chunk data');
    
    await lazyLoader.loadChunk('chunk1', mockLoader);
    await lazyLoader.loadChunk('chunk1', mockLoader);
    
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });

  test('should handle concurrent load limits', async () => {
    const slowLoader = () => new Promise(resolve => setTimeout(() => resolve('data'), 100));
    
    // Start 3 loads (exceeds limit of 2)
    const load1 = lazyLoader.loadChunk('chunk1', slowLoader);
    const load2 = lazyLoader.loadChunk('chunk2', slowLoader);
    const load3 = lazyLoader.loadChunk('chunk3', slowLoader);
    
    const status = lazyLoader.getLoadStatus();
    expect(status.active).toBeLessThanOrEqual(2);
    
    await Promise.all([load1, load2, load3]);
    
    expect(lazyLoader.isLoaded('chunk1')).toBe(true);
    expect(lazyLoader.isLoaded('chunk2')).toBe(true);
    expect(lazyLoader.isLoaded('chunk3')).toBe(true);
  });

  test('should provide accurate load status', async () => {
    const slowLoader = () => new Promise(resolve => setTimeout(() => resolve('data'), 50));
    
    const load1 = lazyLoader.loadChunk('chunk1', slowLoader);
    
    const status = lazyLoader.getLoadStatus();
    expect(status.active).toBe(1);
    expect(status.queued).toBe(1);
    
    await load1;
    
    const finalStatus = lazyLoader.getLoadStatus();
    expect(finalStatus.loaded).toBe(1);
    expect(finalStatus.active).toBe(0);
  });
});

describe('MemoryOptimizer', () => {
  let memoryOptimizer: MemoryOptimizer;

  beforeEach(() => {
    memoryOptimizer = new MemoryOptimizer({
      maxMemoryUsage: 100, // 100 MB
      gcThreshold: 0.8,
      enableDataCompression: true,
      enableVirtualization: true
    });
  });

  test('should register and retrieve data', () => {
    const testData = { large: 'x'.repeat(1000) };
    
    memoryOptimizer.registerData('test1', testData);
    const retrieved = memoryOptimizer.getData('test1');
    
    expect(retrieved).toEqual(testData);
  });

  test('should optimize well data with virtualization', () => {
    const largeWellData = createMockWellData('LARGE_WELL', 15000);
    
    const optimized = memoryOptimizer.optimizeWellData(largeWellData);
    
    expect(optimized.wellName).toBe(largeWellData.wellName);
    expect(optimized.curves.length).toBe(largeWellData.curves.length);
    
    // Check if large curves are virtualized
    const largeCurve = optimized.curves.find(c => c.data.length > 10000);
    expect((largeCurve as any)?._isVirtualized).toBe(true);
  });

  test('should provide optimization statistics', () => {
    const testData1 = { data: 'x'.repeat(500) };
    const testData2 = { data: 'y'.repeat(1500) };
    
    memoryOptimizer.registerData('small', testData1);
    memoryOptimizer.registerData('large', testData2);
    
    const stats = memoryOptimizer.getOptimizationStats();
    
    expect(stats.registeredObjects).toBeGreaterThan(0);
    expect(stats.memoryUsage).toBeGreaterThan(0);
  });
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test('should track operation timing', () => {
    monitor.startTimer('operation1');
    
    // Simulate some work
    const start = Date.now();
    while (Date.now() - start < 10) {
      // Busy wait for 10ms
    }
    
    const duration = monitor.endTimer('operation1');
    
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should be reasonable
  });

  test('should calculate average calculation time', () => {
    monitor.startTimer('calc1');
    setTimeout(() => monitor.endTimer('calc1'), 10);
    
    monitor.startTimer('calc2');
    setTimeout(() => monitor.endTimer('calc2'), 20);
    
    // Wait for timers to complete
    setTimeout(() => {
      const metrics = monitor.getMetrics();
      expect(metrics.averageCalculationTime).toBeGreaterThan(0);
    }, 50);
  });

  test('should provide performance recommendations', () => {
    monitor.updateMetrics({
      cacheHitRate: 0.5, // Low hit rate
      averageCalculationTime: 1500, // High calculation time
      memoryUsage: 600, // High memory usage
      queueLength: 15 // High queue length
    });
    
    const report = monitor.getPerformanceReport();
    
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations.some(r => r.includes('cache'))).toBe(true);
    expect(report.recommendations.some(r => r.includes('calculation'))).toBe(true);
    expect(report.recommendations.some(r => r.includes('memory'))).toBe(true);
    expect(report.recommendations.some(r => r.includes('queue'))).toBe(true);
  });
});

describe('PetrophysicsPerformanceOptimizer Integration', () => {
  let optimizer: PetrophysicsPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new PetrophysicsPerformanceOptimizer(
      { maxSize: 100, ttl: 5000 },
      { maxConcurrentLoads: 2 },
      { maxMemoryUsage: 200, enableVirtualization: true }
    );
  });

  afterEach(() => {
    optimizer.cleanup();
  });

  test('should cache and retrieve calculation results', () => {
    const mockResult = createMockCalculationResult('TEST_WELL');
    const cacheKey = 'test_calculation_key';
    
    optimizer.cacheCalculationResult(cacheKey, mockResult);
    const retrieved = optimizer.getCachedCalculationResult(cacheKey);
    
    expect(retrieved).toEqual(mockResult);
  });

  test('should handle well data optimization', () => {
    const wellData = createMockWellData('TEST_WELL', 5000);
    
    const optimized = optimizer.optimizeWellData(wellData);
    
    expect(optimized.wellName).toBe(wellData.wellName);
    expect(optimized.curves.length).toBe(wellData.curves.length);
  });

  test('should track calculation performance', () => {
    const calculationId = 'test_calc_123';
    
    optimizer.startCalculation(calculationId);
    
    // Simulate calculation work
    const start = Date.now();
    while (Date.now() - start < 5) {
      // Busy wait
    }
    
    const duration = optimizer.endCalculation(calculationId);
    
    expect(duration).toBeGreaterThan(0);
  });

  test('should provide comprehensive performance report', () => {
    // Add some data to generate meaningful metrics
    const mockResult = createMockCalculationResult('TEST_WELL');
    optimizer.cacheCalculationResult('test_key', mockResult);
    
    const wellData = createMockWellData('TEST_WELL');
    optimizer.optimizeWellData(wellData);
    
    const report = optimizer.getPerformanceReport();
    
    expect(report.cache).toBeDefined();
    expect(report.lazyLoading).toBeDefined();
    expect(report.memory).toBeDefined();
    expect(report.monitor).toBeDefined();
    
    expect(typeof report.cache.hitRate).toBe('number');
    expect(typeof report.cache.size).toBe('number');
    expect(typeof report.memory.memoryUsage).toBe('number');
  });

  test('should handle lazy loading of well data chunks', async () => {
    const mockWellData = createMockWellData('CHUNK_WELL');
    const mockLoader = jest.fn().mockResolvedValue(mockWellData);
    
    const result = await optimizer.loadWellDataChunk('CHUNK_WELL', 0, mockLoader);
    
    expect(result).toEqual(mockWellData);
    expect(mockLoader).toHaveBeenCalledTimes(1);
  });
});

describe('Performance Optimization Scenarios', () => {
  let optimizer: PetrophysicsPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new PetrophysicsPerformanceOptimizer();
  });

  afterEach(() => {
    optimizer.cleanup();
  });

  test('should handle large dataset processing efficiently', async () => {
    const largeWellData = createMockWellData('LARGE_WELL', 50000);
    
    const startTime = performance.now();
    const optimized = optimizer.optimizeWellData(largeWellData);
    const endTime = performance.now();
    
    const processingTime = endTime - startTime;
    
    expect(processingTime).toBeLessThan(1000); // Should process in under 1 second
    expect(optimized.wellName).toBe(largeWellData.wellName);
  });

  test('should demonstrate cache effectiveness', () => {
    const mockResult = createMockCalculationResult('CACHE_TEST');
    const cacheKey = 'cache_effectiveness_test';
    
    // First access - cache miss
    let result = optimizer.getCachedCalculationResult(cacheKey);
    expect(result).toBeUndefined();
    
    // Store in cache
    optimizer.cacheCalculationResult(cacheKey, mockResult);
    
    // Second access - cache hit
    result = optimizer.getCachedCalculationResult(cacheKey);
    expect(result).toEqual(mockResult);
    
    const report = optimizer.getPerformanceReport();
    expect(report.cache.size).toBeGreaterThan(0);
  });

  test('should handle concurrent operations efficiently', async () => {
    const concurrentOperations = Array.from({ length: 10 }, (_, i) => {
      return optimizer.loadWellDataChunk(
        `WELL_${i}`,
        0,
        () => Promise.resolve(createMockWellData(`WELL_${i}`))
      );
    });
    
    const startTime = performance.now();
    const results = await Promise.all(concurrentOperations);
    const endTime = performance.now();
    
    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in reasonable time
    
    const report = optimizer.getPerformanceReport();
    expect(report.lazyLoading.loaded).toBe(10);
  });

  test('should optimize memory usage for multiple wells', () => {
    const wells = Array.from({ length: 20 }, (_, i) => 
      createMockWellData(`WELL_${i}`, 2000)
    );
    
    const initialReport = optimizer.getPerformanceReport();
    const initialMemory = initialReport.memory.memoryUsage;
    
    // Optimize all wells
    wells.forEach(well => optimizer.optimizeWellData(well));
    
    const finalReport = optimizer.getPerformanceReport();
    
    expect(finalReport.memory.registeredObjects).toBe(20);
    expect(finalReport.memory.memoryUsage).toBeGreaterThan(initialMemory);
  });
});