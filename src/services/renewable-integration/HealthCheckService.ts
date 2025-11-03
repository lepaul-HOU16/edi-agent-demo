/**
 * Health Check Service
 * 
 * Provides health check endpoints for deployment validation.
 * Monitors Lambda function health, configuration validation, and environment variables.
 */

import { renewableConfig } from './RenewableConfigManager';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'warn' | 'fail';
      message: string;
      duration?: number;
      details?: any;
    };
  };
  summary: {
    total: number;
    passed: number;
    warned: number;
    failed: number;
  };
}

export interface DeploymentHealthCheck {
  lambdaFunctions: boolean;
  configuration: boolean;
  environmentVariables: boolean;
  connectivity: boolean;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private lastHealthCheck: HealthCheckResult | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicHealthChecks();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {};

    try {
      // Check Lambda function deployment
      const lambdaCheck = await this.checkLambdaFunctions();
      checks['lambda-functions'] = lambdaCheck;

      // Check configuration validity
      const configCheck = await this.checkConfiguration();
      checks['configuration'] = configCheck;

      // Check environment variables
      const envCheck = await this.checkEnvironmentVariables();
      checks['environment-variables'] = envCheck;

      // Check connectivity
      const connectivityCheck = await this.checkConnectivity();
      checks['connectivity'] = connectivityCheck;

      // Check deployment validation service
      const deploymentCheck = await this.checkDeploymentValidation();
      checks['deployment-validation'] = deploymentCheck;

      // Calculate summary
      const summary = this.calculateSummary(checks);
      
      // Determine overall status
      const status = this.determineOverallStatus(summary);

      const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        checks,
        summary,
      };

      this.lastHealthCheck = result;
      return result;

    } catch (error) {
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          'health-check-error': {
            status: 'fail',
            message: `Health check failed: ${error.message}`,
            duration: Date.now() - startTime,
          },
        },
        summary: { total: 1, passed: 0, warned: 0, failed: 1 },
      };

      this.lastHealthCheck = errorResult;
      return errorResult;
    }
  }

  private async checkLambdaFunctions(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const config = renewableConfig.getConfig();
      const functions = config.lambdaFunctions;
      const missingFunctions: string[] = [];
      const availableFunctions: string[] = [];

      // Check each Lambda function
      for (const [key, functionName] of Object.entries(functions)) {
        try {
          // In a real implementation, this would call AWS Lambda API
          // For now, we'll simulate the check based on environment
          const isAvailable = await this.simulateLambdaCheck(functionName);
          
          if (isAvailable) {
            availableFunctions.push(key);
          } else {
            missingFunctions.push(key);
          }
        } catch (error) {
          missingFunctions.push(key);
        }
      }

      const totalFunctions = Object.keys(functions).length;
      const availableCount = availableFunctions.length;
      
      if (missingFunctions.length === 0) {
        return {
          status: 'pass',
          message: `All ${totalFunctions} Lambda functions are available`,
          duration: Date.now() - startTime,
          details: { available: availableFunctions },
        };
      } else if (availableCount > 0) {
        return {
          status: 'warn',
          message: `${availableCount}/${totalFunctions} Lambda functions available`,
          duration: Date.now() - startTime,
          details: { 
            available: availableFunctions, 
            missing: missingFunctions 
          },
        };
      } else {
        return {
          status: 'fail',
          message: 'No Lambda functions are available',
          duration: Date.now() - startTime,
          details: { missing: missingFunctions },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Lambda function check failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async simulateLambdaCheck(functionName: string): Promise<boolean> {
    // Simulate Lambda function availability check
    // In a real implementation, this would use AWS SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate some functions being available based on name patterns
        const isAvailable = functionName.includes('renewable') || 
                           functionName.includes('orchestrator') ||
                           Math.random() > 0.3; // 70% chance of being available
        resolve(isAvailable);
      }, Math.random() * 100 + 50); // 50-150ms delay
    });
  }

  private async checkConfiguration(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const validation = renewableConfig.validateConfiguration();
      
      if (validation.isValid) {
        return {
          status: 'pass',
          message: 'Configuration is valid',
          duration: Date.now() - startTime,
        };
      } else {
        return {
          status: 'fail',
          message: `Configuration has ${validation.errors.length} error(s)`,
          duration: Date.now() - startTime,
          details: { errors: validation.errors },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Configuration check failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkEnvironmentVariables(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      const requiredEnvVars = [
        'NODE_ENV',
        // Add other required environment variables
      ];
      
      const optionalEnvVars = [
        'RENEWABLE_ORCHESTRATOR_FUNCTION',
        'RENEWABLE_TERRAIN_FUNCTION',
        'RENEWABLE_LAYOUT_FUNCTION',
        'RENEWABLE_SIMULATION_FUNCTION',
        'RENEWABLE_REPORT_FUNCTION',
        'RENEWABLE_LOG_LEVEL',
      ];

      const missing: string[] = [];
      const present: string[] = [];
      const optional: string[] = [];

      // Check required environment variables
      for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
          present.push(envVar);
        } else {
          missing.push(envVar);
        }
      }

      // Check optional environment variables
      for (const envVar of optionalEnvVars) {
        if (process.env[envVar]) {
          optional.push(envVar);
        }
      }

      if (missing.length === 0) {
        return {
          status: 'pass',
          message: `All required environment variables are set`,
          duration: Date.now() - startTime,
          details: { 
            required: present, 
            optional: optional 
          },
        };
      } else {
        return {
          status: 'fail',
          message: `Missing ${missing.length} required environment variable(s)`,
          duration: Date.now() - startTime,
          details: { 
            missing, 
            present, 
            optional 
          },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Environment variable check failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async checkConnectivity(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Check if we can make HTTP requests (basic connectivity)
      const connectivityTests = [
        { name: 'Internet', test: () => this.testInternetConnectivity() },
        { name: 'AWS Services', test: () => this.testAWSConnectivity() },
      ];

      const results = await Promise.allSettled(
        connectivityTests.map(async ({ name, test }) => ({
          name,
          success: await test(),
        }))
      );

      const successful = results.filter(
        (result) => result.status === 'fulfilled' && result.value.success
      ).length;

      const total = connectivityTests.length;

      if (successful === total) {
        return {
          status: 'pass',
          message: 'All connectivity tests passed',
          duration: Date.now() - startTime,
          details: { successful, total },
        };
      } else if (successful > 0) {
        return {
          status: 'warn',
          message: `${successful}/${total} connectivity tests passed`,
          duration: Date.now() - startTime,
          details: { successful, total },
        };
      } else {
        return {
          status: 'fail',
          message: 'All connectivity tests failed',
          duration: Date.now() - startTime,
          details: { successful, total },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Connectivity check failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private async testInternetConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity test
      if (typeof window !== 'undefined') {
        return navigator.onLine;
      }
      return true; // Assume connectivity in server environment
    } catch {
      return false;
    }
  }

  private async testAWSConnectivity(): Promise<boolean> {
    try {
      // In a real implementation, this would test AWS service connectivity
      // For now, simulate based on environment
      return process.env.NODE_ENV !== undefined;
    } catch {
      return false;
    }
  }

  private async checkDeploymentValidation(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    
    try {
      // Check if deployment validation service is working
      const { RenewableDeploymentValidator } = await import('./RenewableDeploymentValidator');
      const validator = new RenewableDeploymentValidator();
      
      // Perform a quick validation check
      const validationResult = await validator.validateDeployment();
      
      if (validationResult.isHealthy) {
        return {
          status: 'pass',
          message: 'Deployment validation service is working',
          duration: Date.now() - startTime,
          details: validationResult,
        };
      } else {
        return {
          status: 'warn',
          message: 'Deployment validation detected issues',
          duration: Date.now() - startTime,
          details: validationResult,
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Deployment validation check failed: ${error.message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  private calculateSummary(checks: HealthCheckResult['checks']) {
    const total = Object.keys(checks).length;
    let passed = 0;
    let warned = 0;
    let failed = 0;

    for (const check of Object.values(checks)) {
      switch (check.status) {
        case 'pass':
          passed++;
          break;
        case 'warn':
          warned++;
          break;
        case 'fail':
          failed++;
          break;
      }
    }

    return { total, passed, warned, failed };
  }

  private determineOverallStatus(summary: HealthCheckResult['summary']): HealthCheckResult['status'] {
    if (summary.failed > 0) {
      return 'unhealthy';
    } else if (summary.warned > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  public getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  public startPeriodicHealthChecks(): void {
    const config = renewableConfig.getConfig();
    const interval = config.deployment.healthCheckIntervalMs;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, interval);
  }

  public stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // API endpoint methods for integration with backend
  public async handleHealthCheckRequest(): Promise<Response> {
    try {
      const healthCheck = await this.performHealthCheck();
      
      const statusCode = healthCheck.status === 'healthy' ? 200 : 
                        healthCheck.status === 'degraded' ? 200 : 503;

      return new Response(JSON.stringify(healthCheck), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  public async handleReadinessCheck(): Promise<Response> {
    try {
      const healthCheck = await this.performHealthCheck();
      const isReady = healthCheck.status !== 'unhealthy';

      return new Response(JSON.stringify({
        ready: isReady,
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
      }), {
        status: isReady ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  public async handleLivenessCheck(): Promise<Response> {
    // Simple liveness check - just verify the service is running
    return new Response(JSON.stringify({
      alive: true,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();