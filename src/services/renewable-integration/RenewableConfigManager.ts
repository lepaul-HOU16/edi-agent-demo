/**
 * Renewable Configuration Manager
 * 
 * Centralized configuration management for renewable energy features.
 * Handles deployment validation settings, feature flags, and runtime configuration.
 */

export interface RenewableConfig {
  // Feature flags
  features: {
    terrainAnalysis: boolean;
    layoutOptimization: boolean;
    wakeSimulation: boolean;
    reportGeneration: boolean;
    fallbackReports: boolean;
  };
  
  // Deployment validation settings
  deployment: {
    validateOnStartup: boolean;
    retryAttempts: number;
    retryDelayMs: number;
    maxRetryDelayMs: number;
    healthCheckIntervalMs: number;
    timeoutMs: number;
  };
  
  // Lambda function configuration
  lambdaFunctions: {
    orchestrator: string;
    terrain: string;
    layout: string;
    simulation: string;
    report: string;
  };
  
  // Error handling configuration
  errorHandling: {
    enableDetailedErrors: boolean;
    enableRetry: boolean;
    enableFallback: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  // UI configuration
  ui: {
    showDeploymentStatus: boolean;
    showDebugInfo: boolean;
    enableErrorRecovery: boolean;
    autoRefreshStatus: boolean;
    refreshIntervalMs: number;
  };
}

export class RenewableConfigManager {
  private static instance: RenewableConfigManager;
  private config: RenewableConfig;
  private listeners: Array<(config: RenewableConfig) => void> = [];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadConfiguration();
  }

  public static getInstance(): RenewableConfigManager {
    if (!RenewableConfigManager.instance) {
      RenewableConfigManager.instance = new RenewableConfigManager();
    }
    return RenewableConfigManager.instance;
  }

  private getDefaultConfig(): RenewableConfig {
    return {
      features: {
        terrainAnalysis: true,
        layoutOptimization: true,
        wakeSimulation: true,
        reportGeneration: true,
        fallbackReports: true,
      },
      deployment: {
        validateOnStartup: true,
        retryAttempts: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
        healthCheckIntervalMs: 30000,
        timeoutMs: 30000,
      },
      lambdaFunctions: {
        orchestrator: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION || 'renewableOrchestrator',
        terrain: process.env.RENEWABLE_TERRAIN_FUNCTION || 'renewableTools-terrain',
        layout: process.env.RENEWABLE_LAYOUT_FUNCTION || 'renewableTools-layout',
        simulation: process.env.RENEWABLE_SIMULATION_FUNCTION || 'renewableTools-simulation',
        report: process.env.RENEWABLE_REPORT_FUNCTION || 'renewableTools-report',
      },
      errorHandling: {
        enableDetailedErrors: process.env.NODE_ENV === 'development',
        enableRetry: true,
        enableFallback: true,
        logLevel: (process.env.RENEWABLE_LOG_LEVEL as any) || 'info',
      },
      ui: {
        showDeploymentStatus: true,
        showDebugInfo: process.env.NODE_ENV === 'development',
        enableErrorRecovery: true,
        autoRefreshStatus: false,
        refreshIntervalMs: 60000,
      },
    };
  }

  private loadConfiguration(): void {
    try {
      // Load from localStorage if available (browser)
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('renewable-config');
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          this.config = { ...this.config, ...parsedConfig };
        }
      }

      // Load from environment variables
      this.loadFromEnvironment();
    } catch (error) {
      console.warn('Failed to load renewable configuration:', error);
    }
  }

  private loadFromEnvironment(): void {
    // Feature flags from environment
    if (process.env.RENEWABLE_TERRAIN_ENABLED !== undefined) {
      this.config.features.terrainAnalysis = process.env.RENEWABLE_TERRAIN_ENABLED === 'true';
    }
    if (process.env.RENEWABLE_LAYOUT_ENABLED !== undefined) {
      this.config.features.layoutOptimization = process.env.RENEWABLE_LAYOUT_ENABLED === 'true';
    }
    if (process.env.RENEWABLE_SIMULATION_ENABLED !== undefined) {
      this.config.features.wakeSimulation = process.env.RENEWABLE_SIMULATION_ENABLED === 'true';
    }
    if (process.env.RENEWABLE_REPORTS_ENABLED !== undefined) {
      this.config.features.reportGeneration = process.env.RENEWABLE_REPORTS_ENABLED === 'true';
    }

    // Deployment settings from environment
    if (process.env.RENEWABLE_RETRY_ATTEMPTS) {
      this.config.deployment.retryAttempts = parseInt(process.env.RENEWABLE_RETRY_ATTEMPTS, 10);
    }
    if (process.env.RENEWABLE_TIMEOUT_MS) {
      this.config.deployment.timeoutMs = parseInt(process.env.RENEWABLE_TIMEOUT_MS, 10);
    }
  }

  public getConfig(): RenewableConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<RenewableConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.saveConfiguration();
    this.notifyListeners();
  }

  private mergeConfig(current: RenewableConfig, updates: Partial<RenewableConfig>): RenewableConfig {
    return {
      features: { ...current.features, ...updates.features },
      deployment: { ...current.deployment, ...updates.deployment },
      lambdaFunctions: { ...current.lambdaFunctions, ...updates.lambdaFunctions },
      errorHandling: { ...current.errorHandling, ...updates.errorHandling },
      ui: { ...current.ui, ...updates.ui },
    };
  }

  private saveConfiguration(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('renewable-config', JSON.stringify(this.config));
      }
    } catch (error) {
      console.warn('Failed to save renewable configuration:', error);
    }
  }

  public subscribe(listener: (config: RenewableConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error notifying config listener:', error);
      }
    });
  }

  // Convenience methods for common configuration checks
  public isFeatureEnabled(feature: keyof RenewableConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getRetryConfig() {
    return {
      attempts: this.config.deployment.retryAttempts,
      delayMs: this.config.deployment.retryDelayMs,
      maxDelayMs: this.config.deployment.maxRetryDelayMs,
    };
  }

  public getLambdaFunctionName(functionType: keyof RenewableConfig['lambdaFunctions']): string {
    return this.config.lambdaFunctions[functionType];
  }

  public shouldShowDeploymentStatus(): boolean {
    return this.config.ui.showDeploymentStatus;
  }

  public shouldEnableErrorRecovery(): boolean {
    return this.config.ui.enableErrorRecovery;
  }

  public getLogLevel(): string {
    return this.config.errorHandling.logLevel;
  }

  // Validation methods
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate retry attempts
    if (this.config.deployment.retryAttempts < 0 || this.config.deployment.retryAttempts > 10) {
      errors.push('Retry attempts must be between 0 and 10');
    }

    // Validate timeout
    if (this.config.deployment.timeoutMs < 1000 || this.config.deployment.timeoutMs > 300000) {
      errors.push('Timeout must be between 1000ms and 300000ms');
    }

    // Validate function names
    Object.entries(this.config.lambdaFunctions).forEach(([key, value]) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        errors.push(`Lambda function name for ${key} is invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Reset to defaults
  public resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfiguration();
    this.notifyListeners();
  }

  // Export/Import configuration
  public exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfiguration(configJson: string): { success: boolean; error?: string } {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateImportedConfig(importedConfig);
      
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      this.config = importedConfig;
      this.saveConfiguration();
      this.notifyListeners();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `Invalid JSON: ${error.message}` };
    }
  }

  private validateImportedConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { isValid: false, errors };
    }

    // Validate required sections
    const requiredSections = ['features', 'deployment', 'lambdaFunctions', 'errorHandling', 'ui'];
    for (const section of requiredSections) {
      if (!config[section] || typeof config[section] !== 'object') {
        errors.push(`Missing or invalid section: ${section}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const renewableConfig = RenewableConfigManager.getInstance();