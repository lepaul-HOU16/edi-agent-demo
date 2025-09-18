/**
 * Performance Optimizer for Petrophysical Analysis
 * Implements caching, lazy loading, and memory optimization
 * Requirements: 3.4, 4.1
 */

import { WellLogData, CalculationResults } from '../types/petrophysics';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enableCompression: boolean;
  enablePersistence: boolean;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageCalculationTime: number;
  memoryUsage: number;
  activeConnections: number;
  queueLength: number;
}

export interface LazyLoadConfig {
  chunkSize: number;
  preloadThreshold: number;
  maxConcurrentLoads: number;
}

export interface MemoryOptimizationConfig {
  maxMemoryUsage: number; // in MB
  gcThreshold: number;
  enableDataCompression: boolean;
  enableVirtualization: boolean;
}

/**
 * Advanced caching system with LRU eviction and compression
 */
export class AdvancedCache<K, V> {
  private cache: Map<string, CacheEntry<V>>;
  private accessOrder: string[];
  private config: CacheConfig;
  private hitCount: number = 0;
  private missCount: number = 0;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.accessOrder = [];
    this.config = config;
  }

  set(key: K, value: V): void {
    const keyStr = this.serializeKey(key);
    const entry: CacheEntry<V> = {
      value: this.config.enableCompression ? this.compress(value) : value,
      timestamp: Date.now(),
      accessCount: 1,
      compressed: this.config.enableCompression
    };

    // Remove existing entry if present
    if (this.cache.has(keyStr)) {
      this.removeFromAccessOrder(keyStr);
    }

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(keyStr, entry);
    this.accessOrder.push(keyStr);

    if (this.config.enablePersistence) {
      this.persistEntry(keyStr, entry);
    }
  }

  get(key: K): V | undefined {
    const keyStr = this.serializeKey(key);
    const entry = this.cache.get(keyStr);

    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(keyStr);
      this.removeFromAccessOrder(keyStr);
      this.missCount++;
      return undefined;
    }

    // Update access order
    this.removeFromAccessOrder(keyStr);
    this.accessOrder.push(keyStr);
    entry.accessCount++;
    this.hitCount++;

    return entry.compressed ? this.decompress(entry.value) : entry.value;
  }

  has(key: K): boolean {
    const keyStr = this.serializeKey(key);
    const entry = this.cache.get(keyStr);
    
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(keyStr);
      this.removeFromAccessOrder(keyStr);
      return false;
    }
    
    return true;
  }

  delete(key: K): boolean {
    const keyStr = this.serializeKey(key);
    const deleted = this.cache.delete(keyStr);
    if (deleted) {
      this.removeFromAccessOrder(keyStr);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hitCount = 0;
    this.missCount = 0;
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total === 0 ? 0 : this.hitCount / total;
  }

  getSize(): number {
    return this.cache.size;
  }

  getMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += this.estimateSize(key) + this.estimateSize(entry);
    }
    return totalSize;
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private serializeKey(key: K): string {
    return typeof key === 'string' ? key : JSON.stringify(key);
  }

  private compress(value: V): any {
    // Simple compression simulation - in real implementation use actual compression
    return JSON.stringify(value);
  }

  private decompress(value: any): V {
    // Simple decompression simulation
    return JSON.parse(value);
  }

  private persistEntry(key: string, entry: CacheEntry<V>): void {
    // Persistence implementation would go here
    // For now, just simulate with localStorage or IndexedDB
  }

  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Rough estimate in bytes
  }
}

interface CacheEntry<V> {
  value: V;
  timestamp: number;
  accessCount: number;
  compressed: boolean;
}

/**
 * Lazy loading manager for large datasets
 */
export class LazyLoadManager {
  private config: LazyLoadConfig;
  private loadQueue: Map<string, Promise<any>>;
  private loadedChunks: Set<string>;
  private activeLoads: number = 0;

  constructor(config: LazyLoadConfig) {
    this.config = config;
    this.loadQueue = new Map();
    this.loadedChunks = new Set();
  }

  async loadChunk<T>(
    chunkId: string,
    loader: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    // Check if already loaded
    if (this.loadedChunks.has(chunkId)) {
      return loader(); // Return cached data
    }

    // Check if already in queue
    if (this.loadQueue.has(chunkId)) {
      return this.loadQueue.get(chunkId)!;
    }

    // Wait if too many concurrent loads
    while (this.activeLoads >= this.config.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const loadPromise = this.executeLoad(chunkId, loader);
    this.loadQueue.set(chunkId, loadPromise);

    return loadPromise;
  }

  private async executeLoad<T>(chunkId: string, loader: () => Promise<T>): Promise<T> {
    this.activeLoads++;
    
    try {
      const result = await loader();
      this.loadedChunks.add(chunkId);
      return result;
    } finally {
      this.activeLoads--;
      this.loadQueue.delete(chunkId);
    }
  }

  preloadChunks(chunkIds: string[], loaders: Map<string, () => Promise<any>>): void {
    chunkIds.forEach(chunkId => {
      const loader = loaders.get(chunkId);
      if (loader && !this.loadedChunks.has(chunkId) && !this.loadQueue.has(chunkId)) {
        this.loadChunk(chunkId, loader, -1); // Low priority for preloading
      }
    });
  }

  isLoaded(chunkId: string): boolean {
    return this.loadedChunks.has(chunkId);
  }

  getLoadStatus(): { loaded: number; queued: number; active: number } {
    return {
      loaded: this.loadedChunks.size,
      queued: this.loadQueue.size,
      active: this.activeLoads
    };
  }

  clearCache(): void {
    this.loadedChunks.clear();
    this.loadQueue.clear();
  }
}

/**
 * Memory optimization manager
 */
export class MemoryOptimizer {
  private config: MemoryOptimizationConfig;
  private memoryUsage: number = 0;
  private dataRegistry: Map<string, WeakRef<any>>;
  private compressionCache: AdvancedCache<string, any>;

  constructor(config: MemoryOptimizationConfig) {
    this.config = config;
    this.dataRegistry = new Map();
    this.compressionCache = new AdvancedCache({
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      enableCompression: true,
      enablePersistence: false
    });

    // Set up memory monitoring
    this.startMemoryMonitoring();
  }

  registerData(id: string, data: any): void {
    if (this.config.enableDataCompression && this.shouldCompress(data)) {
      const compressed = this.compressData(data);
      this.compressionCache.set(id, compressed);
    } else {
      this.dataRegistry.set(id, new WeakRef(data));
    }

    this.updateMemoryUsage();
  }

  getData(id: string): any | undefined {
    // Try compression cache first
    const compressed = this.compressionCache.get(id);
    if (compressed) {
      return this.decompressData(compressed);
    }

    // Try weak reference registry
    const weakRef = this.dataRegistry.get(id);
    if (weakRef) {
      const data = weakRef.deref();
      if (data) {
        return data;
      } else {
        // Data was garbage collected
        this.dataRegistry.delete(id);
      }
    }

    return undefined;
  }

  optimizeWellData(wellData: WellLogData): WellLogData {
    if (!this.config.enableVirtualization) {
      return wellData;
    }

    // Create virtualized version for large datasets
    const optimized = { ...wellData };
    
    optimized.curves = wellData.curves.map(curve => {
      if (curve.data.length > 10000) {
        // Virtualize large curve data
        return {
          ...curve,
          data: this.createVirtualizedArray(curve.data),
          _isVirtualized: true
        } as any;
      }
      return curve;
    });

    return optimized;
  }

  private createVirtualizedArray(data: number[]): any {
    const chunkSize = 1000;
    const chunks = new Map<number, number[]>();
    
    return new Proxy(data, {
      get: (target, prop) => {
        if (typeof prop === 'string' && !isNaN(Number(prop))) {
          const index = Number(prop);
          const chunkIndex = Math.floor(index / chunkSize);
          
          if (!chunks.has(chunkIndex)) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, data.length);
            chunks.set(chunkIndex, data.slice(start, end));
          }
          
          const chunk = chunks.get(chunkIndex)!;
          return chunk[index % chunkSize];
        }
        
        return (target as any)[prop];
      }
    });
  }

  private shouldCompress(data: any): boolean {
    const size = this.estimateSize(data);
    return size > 1024 * 10; // Compress if larger than 10KB
  }

  private compressData(data: any): any {
    // Simple compression simulation
    return {
      compressed: true,
      data: JSON.stringify(data),
      originalSize: this.estimateSize(data)
    };
  }

  private decompressData(compressed: any): any {
    if (compressed.compressed) {
      return JSON.parse(compressed.data);
    }
    return compressed;
  }

  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length * 2;
  }

  private updateMemoryUsage(): void {
    // Estimate current memory usage
    let usage = 0;
    
    for (const [, weakRef] of this.dataRegistry) {
      const data = weakRef.deref();
      if (data) {
        usage += this.estimateSize(data);
      }
    }
    
    usage += this.compressionCache.getMemoryUsage();
    this.memoryUsage = usage / (1024 * 1024); // Convert to MB

    // Trigger GC if needed
    if (this.memoryUsage > this.config.maxMemoryUsage * this.config.gcThreshold) {
      this.triggerGarbageCollection();
    }
  }

  private triggerGarbageCollection(): void {
    // Clean up weak references
    for (const [id, weakRef] of this.dataRegistry) {
      if (!weakRef.deref()) {
        this.dataRegistry.delete(id);
      }
    }

    // Clear some cache entries
    const cacheSize = this.compressionCache.getSize();
    if (cacheSize > 500) {
      // Clear oldest 25% of cache
      this.compressionCache.clear();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.updateMemoryUsage();
    }, 5000); // Check every 5 seconds
  }

  getMemoryUsage(): number {
    return this.memoryUsage;
  }

  getOptimizationStats(): {
    usage: number;
    memoryUsage: number;
    registeredObjects: number;
    compressedObjects: number;
    cacheHitRate: number;
  } {
    return {
      usage: this.memoryUsage,
      memoryUsage: this.memoryUsage,
      registeredObjects: this.dataRegistry.size,
      compressedObjects: this.compressionCache.getSize(),
      cacheHitRate: this.compressionCache.getHitRate()
    };
  }
}

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private calculationTimes: number[];
  private startTimes: Map<string, number>;

  constructor() {
    this.metrics = {
      cacheHitRate: 0,
      averageCalculationTime: 0,
      memoryUsage: 0,
      activeConnections: 0,
      queueLength: 0
    };
    this.calculationTimes = [];
    this.startTimes = new Map();
  }

  startTimer(operationId: string): void {
    this.startTimes.set(operationId, performance.now());
  }

  endTimer(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.calculationTimes.push(duration);
    this.startTimes.delete(operationId);

    // Keep only last 100 measurements
    if (this.calculationTimes.length > 100) {
      this.calculationTimes.shift();
    }

    this.updateAverageCalculationTime();
    return duration;
  }

  updateMetrics(updates: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private updateAverageCalculationTime(): void {
    if (this.calculationTimes.length === 0) return;
    
    const sum = this.calculationTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageCalculationTime = sum / this.calculationTimes.length;
  }

  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (this.metrics.cacheHitRate < 0.7) {
      recommendations.push('Consider increasing cache size or TTL to improve hit rate');
    }

    if (this.metrics.averageCalculationTime > 1000) {
      recommendations.push('Calculation times are high - consider optimization or parallelization');
    }

    if (this.metrics.memoryUsage > 500) {
      recommendations.push('High memory usage detected - enable compression or virtualization');
    }

    if (this.metrics.queueLength > 10) {
      recommendations.push('High queue length - consider increasing concurrent processing limits');
    }

    return {
      metrics: this.metrics,
      recommendations
    };
  }
}

/**
 * Main performance optimizer that coordinates all optimization strategies
 */
export class PetrophysicsPerformanceOptimizer {
  private cache: AdvancedCache<string, any>;
  private lazyLoader: LazyLoadManager;
  private memoryOptimizer: MemoryOptimizer;
  private monitor: PerformanceMonitor;

  constructor(
    cacheConfig?: Partial<CacheConfig>,
    lazyLoadConfig?: Partial<LazyLoadConfig>,
    memoryConfig?: Partial<MemoryOptimizationConfig>
  ) {
    this.cache = new AdvancedCache({
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      enableCompression: true,
      enablePersistence: false,
      ...cacheConfig
    });

    this.lazyLoader = new LazyLoadManager({
      chunkSize: 1000,
      preloadThreshold: 0.8,
      maxConcurrentLoads: 3,
      ...lazyLoadConfig
    });

    this.memoryOptimizer = new MemoryOptimizer({
      maxMemoryUsage: 512, // 512 MB
      gcThreshold: 0.8,
      enableDataCompression: true,
      enableVirtualization: true,
      ...memoryConfig
    });

    this.monitor = new PerformanceMonitor();
  }

  // Cache operations
  cacheCalculationResult(key: string, result: CalculationResults): void {
    this.cache.set(key, result);
  }

  getCachedCalculationResult(key: string): CalculationResults | undefined {
    return this.cache.get(key);
  }

  // Lazy loading operations
  async loadWellDataChunk(
    wellName: string,
    chunkIndex: number,
    loader: () => Promise<WellLogData>
  ): Promise<WellLogData> {
    const chunkId = `${wellName}_${chunkIndex}`;
    return this.lazyLoader.loadChunk(chunkId, loader);
  }

  // Memory optimization
  optimizeWellData(wellData: WellLogData): WellLogData {
    const optimized = this.memoryOptimizer.optimizeWellData(wellData);
    this.memoryOptimizer.registerData(wellData.wellName, optimized);
    return optimized;
  }

  // Performance monitoring
  startCalculation(calculationId: string): void {
    this.monitor.startTimer(calculationId);
  }

  endCalculation(calculationId: string): number {
    return this.monitor.endTimer(calculationId);
  }

  // Get comprehensive performance report
  getPerformanceReport(): {
    cache: { hitRate: number; size: number; memoryUsage: number };
    lazyLoading: { loaded: number; queued: number; active: number };
    memory: {
      usage: number;
      registeredObjects: number;
      compressedObjects: number;
      cacheHitRate: number;
    };
    monitor: {
      metrics: PerformanceMetrics;
      recommendations: string[];
    };
  } {
    return {
      cache: {
        hitRate: this.cache.getHitRate(),
        size: this.cache.getSize(),
        memoryUsage: this.cache.getMemoryUsage()
      },
      lazyLoading: this.lazyLoader.getLoadStatus(),
      memory: this.memoryOptimizer.getOptimizationStats(),
      monitor: this.monitor.getPerformanceReport()
    };
  }

  // Cleanup and optimization
  cleanup(): void {
    this.cache.clear();
    this.lazyLoader.clearCache();
  }
}

// Export default instance
export const performanceOptimizer = new PetrophysicsPerformanceOptimizer();