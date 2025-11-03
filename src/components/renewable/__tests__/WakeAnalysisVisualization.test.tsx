/**
 * Wake Analysis Visualization Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WakeOptimizationService } from '../../../services/renewable/WakeOptimizationService';
import { TurbineLayout, WindResourceData } from '../../../types/wakeData';

// Mock Cloudscape components to avoid ES module issues
jest.mock('@cloudscape-design/components', () => ({
  Container: ({ children, header }: any) => <div data-testid="container">{header}{children}</div>,
  Header: ({ children }: any) => <h2>{children}</h2>,
  SpaceBetween: ({ children }: any) => <div>{children}</div>,
  Box: ({ children }: any) => <div>{children}</div>,
  ColumnLayout: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ButtonDropdown: ({ children }: any) => <div>{children}</div>,
  Alert: ({ children, header }: any) => <div data-testid="alert"><strong>{header}</strong>{children}</div>,
  ProgressBar: () => <div data-testid="progress-bar" />,
  Spinner: () => <div data-testid="spinner" />,
  Tabs: ({ tabs, activeTabId }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          {tab.label}
          {tab.id === activeTabId && tab.content}
        </div>
      ))}
    </div>
  ),
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

// Mock data for testing
const mockTurbineLayout: TurbineLayout = {
  turbines: [
    {
      id: 'T001',
      x: 0,
      y: 0,
      hubHeight: 100,
      rotorDiameter: 120,
      ratedPower: 3000,
      status: 'active',
      wakeEffects: {
        upstreamTurbines: [],
        wakeDeficit: 5.2,
        powerLoss: 8.1,
        turbulenceIncrease: 15.3,
        fatigueLoad: 1.2,
        wakeOverlap: []
      }
    },
    {
      id: 'T002',
      x: 500,
      y: 0,
      hubHeight: 100,
      rotorDiameter: 120,
      ratedPower: 3000,
      status: 'active',
      wakeEffects: {
        upstreamTurbines: ['T001'],
        wakeDeficit: 12.5,
        powerLoss: 18.7,
        turbulenceIncrease: 25.8,
        fatigueLoad: 1.8,
        wakeOverlap: []
      }
    }
  ],
  siteArea: {
    boundary: {
      coordinates: [[0, 0], [1000, 0], [1000, 1000], [0, 1000], [0, 0]]
    },
    availableArea: 1000000,
    exclusionZones: [],
    constraints: [],
    windResource: {} as WindResourceData
  },
  layoutType: 'grid',
  spacing: {
    minimumDistance: 300,
    recommendedDistance: 500,
    prevailingWindSpacing: 5,
    crossWindSpacing: 3,
    optimizationCriteria: 'energy_yield'
  },
  totalCapacity: 6.0,
  turbineModel: {
    model: 'Test Turbine 3MW',
    manufacturer: 'Test Manufacturer',
    ratedPower: 3000,
    rotorDiameter: 120,
    hubHeight: 100,
    cutInSpeed: 3,
    ratedSpeed: 12,
    cutOutSpeed: 25,
    powerCurve: [],
    thrustCurve: []
  }
};

const mockWindData: WindResourceData = {
  location: {
    lat: 40.7128,
    lng: -74.0060,
    name: 'Test Location'
  },
  windData: [],
  statistics: {
    meanWindSpeed: 8.5,
    prevailingDirection: 270,
    powerDensity: 450
  }
};

describe('WakeOptimizationService', () => {
  const defaultProps = {
    turbineLayout: mockTurbineLayout,
    windData: mockWindData,
    isLoading: false
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('calculates wake losses correctly', () => {
    const results = WakeOptimizationService.calculateWakeLosses(mockTurbineLayout, mockWindData);
    
    expect(results).toBeDefined();
    expect(results.overallMetrics).toBeDefined();
    expect(results.turbineResults).toHaveLength(2);
    expect(results.overallMetrics.wakeEfficiency).toBeGreaterThan(0);
    expect(results.overallMetrics.wakeEfficiency).toBeLessThanOrEqual(100);
  });

  test('generates optimization recommendations', () => {
    const results = WakeOptimizationService.calculateWakeLosses(mockTurbineLayout, mockWindData);
    
    expect(results.optimizationRecommendations).toBeDefined();
    expect(Array.isArray(results.optimizationRecommendations)).toBe(true);
    
    if (results.optimizationRecommendations.length > 0) {
      const recommendation = results.optimizationRecommendations[0];
      expect(recommendation.type).toBeDefined();
      expect(recommendation.priority).toBeDefined();
      expect(recommendation.expectedBenefit).toBeDefined();
    }
  });

  test('calculates downstream energy impact', () => {
    const sourceTurbine = mockTurbineLayout.turbines[0];
    const affectedTurbines = [mockTurbineLayout.turbines[1]];
    
    const impact = WakeOptimizationService.calculateDownstreamEnergyImpact(
      sourceTurbine,
      affectedTurbines,
      mockWindData
    );
    
    expect(impact.totalEnergyImpact).toBeGreaterThanOrEqual(0);
    expect(impact.affectedTurbineCount).toBe(1);
    expect(impact.averageImpactPerTurbine).toBeGreaterThanOrEqual(0);
    expect(impact.economicImpact).toBeGreaterThanOrEqual(0);
  });

  test('compares layout configurations correctly', () => {
    const layouts = [mockTurbineLayout];
    const comparison = WakeOptimizationService.compareLayoutConfigurations(layouts, mockWindData);
    
    expect(comparison).toHaveLength(1);
    expect(comparison[0].layout).toBe(mockTurbineLayout);
    expect(comparison[0].wakeEfficiency).toBeGreaterThan(0);
    expect(comparison[0].totalWakeLoss).toBeGreaterThanOrEqual(0);
    expect(comparison[0].energyYield).toBeGreaterThan(0);
    expect(comparison[0].ranking).toBe(1);
  });

  test('provides optimization recommendations', () => {
    const mockWakeData = {
      turbineLayout: mockTurbineLayout,
      windData: mockWindData,
      results: WakeOptimizationService.calculateWakeLosses(mockTurbineLayout, mockWindData)
    } as any;
    
    const recommendations = WakeOptimizationService.provideOptimizationRecommendations(mockWakeData);
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Wake Analysis Integration', () => {
  test('calculates realistic wake effects', () => {
    const results = WakeOptimizationService.calculateWakeLosses(mockTurbineLayout, mockWindData);
    
    // Check that results are within realistic ranges
    expect(results.overallMetrics.totalWakeLoss).toBeGreaterThanOrEqual(0);
    expect(results.overallMetrics.totalWakeLoss).toBeLessThanOrEqual(50); // Max 50% wake loss
    expect(results.overallMetrics.wakeEfficiency).toBeGreaterThanOrEqual(50);
    expect(results.overallMetrics.wakeEfficiency).toBeLessThanOrEqual(100);
    
    // Check turbine results
    results.turbineResults.forEach(turbineResult => {
      expect(turbineResult.wakeDeficit).toBeGreaterThanOrEqual(0);
      expect(turbineResult.powerReduction).toBeGreaterThanOrEqual(0);
      expect(turbineResult.energyLoss).toBeGreaterThanOrEqual(0);
    });
  });

  test('generates appropriate optimization recommendations based on wake losses', () => {
    const results = WakeOptimizationService.calculateWakeLosses(mockTurbineLayout, mockWindData);
    
    // If there are severely affected turbines, should have layout modification recommendations
    const severelyAffected = results.turbineResults.filter(r => r.powerReduction > 10);
    const layoutModifications = results.optimizationRecommendations.filter(r => r.type === 'layout_modification');
    
    if (severelyAffected.length > 0) {
      expect(layoutModifications.length).toBeGreaterThan(0);
    }
    
    // All recommendations should have valid expected benefits
    results.optimizationRecommendations.forEach(rec => {
      expect(rec.expectedBenefit.wakeLossReduction).toBeGreaterThan(0);
      expect(rec.expectedBenefit.energyYieldIncrease).toBeGreaterThan(0);
      expect(rec.expectedBenefit.paybackPeriod).toBeGreaterThan(0);
    });
  });
});