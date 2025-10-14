/**
 * Performance Optimizer for Renewable Energy Visualizations
 * 
 * This utility provides performance optimization for visualization loading times,
 * responsiveness, and final UI polish for the complete demo workflow.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionLatency: number;
  memoryUsage: number;
  componentCount: number;
}

export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  debounceDelay: number;
  chunkSize: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: OptimizationConfig;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  private constructor() {
    this.config = {
      enableLazyLoading: true,
      enableVirtualization: true,
      enableCaching: true,
      maxConcurrentRequests: 3,
      debounceDelay: 300,
      chunkSize: 1000
    };

    this.initializePerformanceMonitoring();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('renewable')) {
            this.recordPerformanceEntry(entry);
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });
    }
  }

  /**
   * Record performance entry
   */
  private recordPerformanceEntry(entry: PerformanceEntry): void {
    const componentName = this.extractComponentName(entry.name);
    const existingMetrics = this.metrics.get(componentName) || {
      loadTime: 0,
      renderTime: 0,
      interactionLatency: 0,
      memoryUsage: 0,
      componentCount: 0
    };

    // Update metrics based on entry type
    if (entry.entryType === 'measure') {
      if (entry.name.includes('load')) {
        existingMetrics.loadTime = entry.duration;
      } else if (entry.name.includes('render')) {
        existingMetrics.renderTime = entry.duration;
      } else if (entry.name.includes('interaction')) {
        existingMetrics.interactionLatency = entry.duration;
      }
    }

    this.metrics.set(componentName, existingMetrics);
  }

  /**
   * Extract component name from performance entry name
   */
  private extractComponentName(entryName: string): string {
    const match = entryName.match(/renewable-(\w+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Optimize visualization loading with lazy loading and chunking
   */
  public optimizeVisualizationLoading<T>(
    data: T[],
    renderFunction: (chunk: T[]) => Promise<void>,
    componentName: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        performance.mark(`renewable-${componentName}-load-start`);

        if (!this.config.enableLazyLoading) {
          await renderFunction(data);
          performance.mark(`renewable-${componentName}-load-end`);
          performance.measure(
            `renewable-${componentName}-load`,
            `renewable-${componentName}-load-start`,
            `renewable-${componentName}-load-end`
          );
          resolve();
          return;
        }

        // Chunk data for progressive loading
        const chunks = this.chunkArray(data, this.config.chunkSize);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Use requestIdleCallback for non-blocking rendering
          await this.scheduleWork(() => renderFunction(chunk));
          
          // Allow UI to breathe between chunks
          if (i < chunks.length - 1) {
            await this.delay(16); // ~60fps
          }
        }

        performance.mark(`renewable-${componentName}-load-end`);
        performance.measure(
          `renewable-${componentName}-load`,
          `renewable-${componentName}-load-start`,
          `renewable-${componentName}-load-end`
        );

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Optimize component rendering with virtualization
   */
  public optimizeComponentRendering(
    componentName: string,
    renderFunction: () => void
  ): void {
    performance.mark(`renewable-${componentName}-render-start`);

    if (this.config.enableVirtualization) {
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        renderFunction();
        performance.mark(`renewable-${componentName}-render-end`);
        performance.measure(
          `renewable-${componentName}-render`,
          `renewable-${componentName}-render-start`,
          `renewable-${componentName}-render-end`
        );
      });
    } else {
      renderFunction();
      performance.mark(`renewable-${componentName}-render-end`);
      performance.measure(
        `renewable-${componentName}-render`,
        `renewable-${componentName}-render-start`,
        `renewable-${componentName}-render-end`
      );
    }
  }

  /**
   * Debounce function for interaction optimization
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    delay?: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    const debounceDelay = delay || this.config.debounceDelay;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), debounceDelay);
    };
  }

  /**
   * Throttle function for scroll and resize events
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 16 // ~60fps
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Optimize memory usage by cleaning up unused resources
   */
  public optimizeMemoryUsage(componentName: string): void {
    // Clear cached data for component
    if (this.config.enableCaching) {
      this.clearComponentCache(componentName);
    }

    // Update memory metrics
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const existingMetrics = this.metrics.get(componentName) || {
        loadTime: 0,
        renderTime: 0,
        interactionLatency: 0,
        memoryUsage: 0,
        componentCount: 0
      };

      existingMetrics.memoryUsage = memoryInfo.usedJSHeapSize;
      this.metrics.set(componentName, existingMetrics);
    }
  }

  /**
   * Get performance metrics for a component
   */
  public getPerformanceMetrics(componentName: string): PerformanceMetrics | null {
    return this.metrics.get(componentName) || null;
  }

  /**
   * Get all performance metrics
   */
  public getAllPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Check if performance meets thresholds
   */
  public validatePerformanceThresholds(componentName: string): {
    isOptimal: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.metrics.get(componentName);
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!metrics) {
      return {
        isOptimal: false,
        issues: ['No performance metrics available'],
        recommendations: ['Initialize performance monitoring']
      };
    }

    // Check load time (should be < 3000ms)
    if (metrics.loadTime > 3000) {
      issues.push(`Load time too high: ${metrics.loadTime}ms`);
      recommendations.push('Enable lazy loading and data chunking');
    }

    // Check render time (should be < 100ms)
    if (metrics.renderTime > 100) {
      issues.push(`Render time too high: ${metrics.renderTime}ms`);
      recommendations.push('Enable virtualization and optimize rendering');
    }

    // Check interaction latency (should be < 50ms)
    if (metrics.interactionLatency > 50) {
      issues.push(`Interaction latency too high: ${metrics.interactionLatency}ms`);
      recommendations.push('Implement debouncing and throttling');
    }

    // Check memory usage (should be reasonable)
    if (metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      issues.push(`Memory usage too high: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      recommendations.push('Implement memory cleanup and caching optimization');
    }

    return {
      isOptimal: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(): {
    summary: {
      totalComponents: number;
      optimalComponents: number;
      averageLoadTime: number;
      averageRenderTime: number;
    };
    componentDetails: Array<{
      name: string;
      metrics: PerformanceMetrics;
      validation: ReturnType<typeof this.validatePerformanceThresholds>;
    }>;
  } {
    const componentDetails: Array<{
      name: string;
      metrics: PerformanceMetrics;
      validation: ReturnType<typeof this.validatePerformanceThresholds>;
    }> = [];

    let totalLoadTime = 0;
    let totalRenderTime = 0;
    let optimalCount = 0;

    this.metrics.forEach((metrics, name) => {
      const validation = this.validatePerformanceThresholds(name);
      
      componentDetails.push({
        name,
        metrics,
        validation
      });

      totalLoadTime += metrics.loadTime;
      totalRenderTime += metrics.renderTime;
      
      if (validation.isOptimal) {
        optimalCount++;
      }
    });

    const totalComponents = this.metrics.size;

    return {
      summary: {
        totalComponents,
        optimalComponents: optimalCount,
        averageLoadTime: totalComponents > 0 ? totalLoadTime / totalComponents : 0,
        averageRenderTime: totalComponents > 0 ? totalRenderTime / totalComponents : 0
      },
      componentDetails
    };
  }

  /**
   * Helper methods
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private scheduleWork(callback: () => Promise<void>): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(async () => {
          await callback();
          resolve();
        });
      } else {
        setTimeout(async () => {
          await callback();
          resolve();
        }, 0);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private clearComponentCache(componentName: string): void {
    // Implementation would depend on caching strategy
    // This is a placeholder for cache clearing logic
    console.log(`Clearing cache for component: ${componentName}`);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}