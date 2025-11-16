/**
 * Renewable Energy Service - REST API Version
 * 
 * Client-side service for calling renewable energy REST API endpoints.
 * NO AMPLIFY DEPENDENCIES - Pure REST API implementation.
 */

import { useState } from 'react';

export interface WindDataParams {
  latitude: number;
  longitude: number;
  year?: number;
}

export interface EnergyProductionParams {
  latitude: number;
  longitude: number;
  turbineCount: number;
  turbineCapacity: number; // MW
}

export interface WindDataResult {
  location: {
    latitude: number;
    longitude: number;
  };
  year: number;
  summary: {
    meanWindSpeed: string;
    maxWindSpeed: string;
    minWindSpeed: string;
    totalHours: number;
    dataQuality: string;
  };
  rawData?: any;
}

export interface EnergyProductionResult {
  location: {
    latitude: number;
    longitude: number;
  };
  windFarm: {
    turbineCount: number;
    turbineCapacity: number;
    totalCapacity: number;
  };
  windConditions: {
    meanWindSpeed: string;
    capacityFactor: string;
  };
  energyProduction: {
    annualMWh: string;
    annualGWh: string;
    monthlyAverageMWh: string;
  };
}

/**
 * Renewable Energy Service
 */
export class RenewableEnergyService {
  /**
   * Get wind conditions for a location
   */
  static async getWindConditions(params: WindDataParams): Promise<WindDataResult> {
    try {
      console.log('Fetching wind conditions:', params);
      
      // Call REST API endpoint
      const response = await fetch('/api/renewable/wind-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getWindConditions',
          params,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch wind data');
      }
      
      return result.data;
      
    } catch (error) {
      console.error('Error fetching wind conditions:', error);
      throw error;
    }
  }
  
  /**
   * Calculate energy production for a wind farm
   */
  static async calculateEnergyProduction(params: EnergyProductionParams): Promise<EnergyProductionResult> {
    try {
      console.log('Calculating energy production:', params);
      
      // Call REST API endpoint
      const response = await fetch('/api/renewable/energy-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'calculateEnergyProduction',
          params,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate energy production');
      }
      
      return result.data;
      
    } catch (error) {
      console.error('Error calculating energy production:', error);
      throw error;
    }
  }
  
  /**
   * Analyze wind farm site using the renewable orchestrator
   */
  static async analyzeWindFarm(query: string, context?: any, sessionId?: string): Promise<any> {
    try {
      console.log('Analyzing wind farm:', { query, hasContext: !!context, sessionId });
      
      // Use the REST API client
      const { analyzeWindFarm } = await import('@/lib/api/renewable');
      
      const result = await analyzeWindFarm(query, context, sessionId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze wind farm');
      }
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing wind farm:', error);
      throw error;
    }
  }
}

/**
 * React hook for wind data
 */
export function useWindData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<WindDataResult | null>(null);
  
  const fetchWindData = async (params: WindDataParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await RenewableEnergyService.getWindConditions(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, fetchWindData };
}

/**
 * React hook for energy production
 */
export function useEnergyProduction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<EnergyProductionResult | null>(null);
  
  const calculateProduction = async (params: EnergyProductionParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await RenewableEnergyService.calculateEnergyProduction(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, calculateProduction };
}
