/**
 * Renewable Energy Health Check API Route
 * 
 * Provides health check endpoints for renewable energy deployment validation.
 * Supports /health, /health/ready, and /health/live endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '../../../../services/renewable-integration/HealthCheckService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'full';

    switch (checkType) {
      case 'ready':
      case 'readiness':
        return await handleReadinessCheck();
      
      case 'live':
      case 'liveness':
        return await handleLivenessCheck();
      
      case 'full':
      case 'health':
      default:
        return await handleFullHealthCheck();
    }
  } catch (error) {
    console.error('Health check API error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check service unavailable',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function handleFullHealthCheck() {
  try {
    const healthCheck = await healthCheckService.performHealthCheck();
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      checks: {
        'health-service': {
          status: 'fail',
          message: `Health service error: ${error.message}`,
        },
      },
      summary: { total: 1, passed: 0, warned: 0, failed: 1 },
    }, { status: 500 });
  }
}

async function handleReadinessCheck() {
  try {
    const healthCheck = await healthCheckService.performHealthCheck();
    const isReady = healthCheck.status !== 'unhealthy';

    return NextResponse.json({
      ready: isReady,
      status: healthCheck.status,
      timestamp: healthCheck.timestamp,
      message: isReady ? 'Service is ready' : 'Service is not ready',
    }, { 
      status: isReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Readiness check failed',
    }, { status: 503 });
  }
}

async function handleLivenessCheck() {
  try {
    // Simple liveness check - just verify the service is running
    return NextResponse.json({
      alive: true,
      timestamp: new Date().toISOString(),
      message: 'Service is alive',
      uptime: process.uptime ? Math.floor(process.uptime()) : null,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json({
      alive: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Liveness check failed',
    }, { status: 500 });
  }
}

// Support for different HTTP methods if needed
export async function POST(request: NextRequest) {
  // POST can be used to trigger a fresh health check
  return GET(request);
}

export async function HEAD(request: NextRequest) {
  // HEAD request for simple alive check
  try {
    const healthCheck = await healthCheckService.getLastHealthCheck();
    const isHealthy = healthCheck?.status === 'healthy';
    
    return new NextResponse(null, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}