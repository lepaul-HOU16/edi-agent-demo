/**
 * Memory management utilities to prevent heap errors
 * Provides tools for monitoring memory usage and forcing cleanup
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private memoryWarningThreshold = 0.85; // 85% memory usage triggers warning
  private lastGCTime = 0;
  private gcCooldownMs = 5000; // Minimum 5 seconds between GC calls

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory usage information
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
    jsHeapSizeLimit?: number;
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
  } {
    // Try to get performance memory info if available
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize
      };
    }

    // Fallback for Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return {
        used: memory.heapUsed,
        total: memory.heapTotal,
        percentage: (memory.heapUsed / memory.heapTotal) * 100
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * Force garbage collection if available and not in cooldown
   */
  forceGarbageCollection(force: boolean = false): boolean {
    const now = Date.now();
    
    // Check cooldown unless forced
    if (!force && (now - this.lastGCTime) < this.gcCooldownMs) {
      return false;
    }

    // Try browser GC
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
        this.lastGCTime = now;
        console.log('🗑️ Browser garbage collection completed');
        return true;
      } catch (error) {
        console.warn('⚠️ Browser GC failed:', error);
      }
    }

    // Try Node.js GC
    if (typeof global !== 'undefined' && (global as any).gc) {
      try {
        (global as any).gc();
        this.lastGCTime = now;
        console.log('🗑️ Node.js garbage collection completed');
        return true;
      } catch (error) {
        console.warn('⚠️ Node.js GC failed:', error);
      }
    }

    return false;
  }

  /**
   * Monitor memory usage and trigger cleanup if needed
   */
  checkMemoryPressure(): { 
    isHighMemory: boolean; 
    shouldCleanup: boolean; 
    percentage: number;
    recommendedAction?: string;
  } {
    const memInfo = this.getMemoryUsage();
    const percentage = memInfo.percentage;
    
    const isHighMemory = percentage > this.memoryWarningThreshold * 100;
    const shouldCleanup = percentage > 75;

    let recommendedAction: string | undefined;
    if (percentage > 90) {
      recommendedAction = 'Critical memory usage - force cleanup immediately';
    } else if (percentage > 80) {
      recommendedAction = 'High memory usage - cleanup recommended';
    } else if (percentage > 70) {
      recommendedAction = 'Moderate memory usage - monitor closely';
    }

    if (isHighMemory) {
      console.warn(`⚠️ High memory usage detected: ${percentage.toFixed(1)}%`, memInfo);
    }

    return {
      isHighMemory,
      shouldCleanup,
      percentage,
      recommendedAction
    };
  }

  /**
   * Clean up heavy objects and trigger GC
   */
  performMemoryCleanup(options: {
    clearConsole?: boolean;
    clearLocalStorage?: boolean;
    clearSessionStorage?: boolean;
    forceGC?: boolean;
  } = {}): void {
    console.log('🧹 Starting memory cleanup...');

    // Clear console if requested
    if (options.clearConsole && typeof console.clear === 'function') {
      console.clear();
    }

    // Clear browser storage if requested
    if (typeof window !== 'undefined') {
      if (options.clearLocalStorage) {
        try {
          // Only clear non-essential items
          const keysToKeep = ['auth', 'user', 'theme', 'settings'];
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }

      if (options.clearSessionStorage) {
        try {
          sessionStorage.clear();
        } catch (error) {
          console.warn('Failed to clear sessionStorage:', error);
        }
      }
    }

    // Force garbage collection
    if (options.forceGC !== false) {
      this.forceGarbageCollection(true);
    }

    console.log('✅ Memory cleanup completed');
  }

  /**
   * Set up periodic memory monitoring
   */
  startMemoryMonitoring(intervalMs: number = 30000): () => void {
    let intervalId: NodeJS.Timeout;

    const monitor = () => {
      const status = this.checkMemoryPressure();
      
      if (status.shouldCleanup) {
        console.warn('🚨 Automatic cleanup triggered due to memory pressure');
        this.performMemoryCleanup({ forceGC: true });
      }
    };

    if (typeof setInterval !== 'undefined') {
      intervalId = setInterval(monitor, intervalMs);
      console.log(`📊 Memory monitoring started (interval: ${intervalMs}ms)`);
    }

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('📊 Memory monitoring stopped');
      }
    };
  }

  /**
   * Create a memory-aware wrapper for heavy operations
   */
  withMemoryCheck<T>(
    operation: () => T | Promise<T>,
    options: {
      name?: string;
      cleanupBefore?: boolean;
      cleanupAfter?: boolean;
      maxMemoryPercentage?: number;
    } = {}
  ): T | Promise<T> {
    const { 
      name = 'operation', 
      cleanupBefore = false, 
      cleanupAfter = false,
      maxMemoryPercentage = 80
    } = options;

    // Check memory before operation
    const initialStatus = this.checkMemoryPressure();
    
    if (initialStatus.percentage > maxMemoryPercentage) {
      console.warn(`⚠️ High memory before ${name}: ${initialStatus.percentage.toFixed(1)}%`);
      
      if (cleanupBefore) {
        this.performMemoryCleanup({ forceGC: true });
      }
    }

    try {
      const result = operation();
      
      // Handle async operations
      if (result instanceof Promise) {
        return result.finally(() => {
          if (cleanupAfter) {
            setTimeout(() => this.performMemoryCleanup(), 100);
          }
        });
      }

      // Handle sync operations
      if (cleanupAfter) {
        setTimeout(() => this.performMemoryCleanup(), 100);
      }

      return result;
    } catch (error) {
      // Cleanup on error
      if (cleanupAfter) {
        setTimeout(() => this.performMemoryCleanup({ forceGC: true }), 100);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Export utility functions
export const forceGC = () => memoryManager.forceGarbageCollection();
export const checkMemory = () => memoryManager.checkMemoryPressure();
export const cleanupMemory = (options?: Parameters<typeof memoryManager.performMemoryCleanup>[0]) => 
  memoryManager.performMemoryCleanup(options);

// Auto-cleanup for heavy libraries
export const withMemoryCleanup = <T extends (...args: any[]) => any>(
  fn: T,
  options: { cleanup?: boolean; name?: string } = {}
): T => {
  return ((...args: Parameters<T>) => {
    const result = fn(...args);
    
    if (options.cleanup !== false) {
      // Defer cleanup to next tick
      setTimeout(() => {
        memoryManager.forceGarbageCollection();
      }, 100);
    }
    
    return result;
  }) as T;
};
