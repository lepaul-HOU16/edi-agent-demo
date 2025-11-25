/**
 * Unit tests for financial calculations
 */

import {
  calculateCapitalCost,
  calculateCostBreakdown,
  calculateOperatingCost,
  calculateAnnualRevenue,
  calculateLCOE,
  calculateNPV,
  calculateIRR,
  calculatePaybackPeriod,
  calculateRevenueProjection,
  calculateFinancialMetrics,
  type WindFarmFinancialInputs
} from './financialCalculations';

describe('Financial Calculations', () => {
  // Sample wind farm project
  const sampleInputs: WindFarmFinancialInputs = {
    turbineCount: 10,
    turbineCapacityMW: 3.0,
    annualEnergyProductionMWh: 90_000, // ~34% capacity factor
    electricityPricePerMWh: 50,
    discountRate: 0.08,
    projectLifetimeYears: 25,
    capacityFactor: 0.34,
    degradationRatePerYear: 0.005
  };

  describe('calculateCapitalCost', () => {
    it('should calculate total capital cost with default values', () => {
      const cost = calculateCapitalCost(sampleInputs);
      
      // 10 turbines * 3 MW = 30 MW total
      // Turbines: 30 MW * $1,300,000 = $39,000,000
      // Installation: 30 MW * $300,000 = $9,000,000
      // Grid: $500,000
      // Total: $48,500,000
      expect(cost).toBe(48_500_000);
    });

    it('should calculate capital cost with custom values', () => {
      const customInputs: WindFarmFinancialInputs = {
        ...sampleInputs,
        turbineCostPerMW: 1_500_000,
        installationCostPerMW: 400_000,
        gridConnectionCost: 1_000_000
      };
      
      const cost = calculateCapitalCost(customInputs);
      
      // 30 MW * $1,500,000 + 30 MW * $400,000 + $1,000,000 = $58,000,000
      expect(cost).toBe(58_000_000);
    });
  });

  describe('calculateCostBreakdown', () => {
    it('should break down costs by category', () => {
      const breakdown = calculateCostBreakdown(sampleInputs);
      
      expect(breakdown.turbines).toBe(39_000_000);
      expect(breakdown.installation).toBe(9_000_000);
      expect(breakdown.grid).toBe(500_000);
      expect(breakdown.land).toBe(100_000); // 10 turbines * $10,000
      expect(breakdown.other).toBe(0);
    });
  });

  describe('calculateOperatingCost', () => {
    it('should calculate annual operating cost', () => {
      const cost = calculateOperatingCost(sampleInputs);
      
      // 30 MW * $40,000 + 10 turbines * $10,000 = $1,300,000
      expect(cost).toBe(1_300_000);
    });
  });

  describe('calculateAnnualRevenue', () => {
    it('should calculate annual revenue', () => {
      const revenue = calculateAnnualRevenue(sampleInputs);
      
      // 90,000 MWh * $50 = $4,500,000
      expect(revenue).toBe(4_500_000);
    });
  });

  describe('calculateLCOE', () => {
    it('should calculate levelized cost of energy', () => {
      const lcoe = calculateLCOE(sampleInputs);
      
      // LCOE should be positive and reasonable (typically $30-$80/MWh for wind)
      expect(lcoe).toBeGreaterThan(0);
      expect(lcoe).toBeLessThan(100);
    });

    it('should account for degradation over time', () => {
      const noDegradation: WindFarmFinancialInputs = {
        ...sampleInputs,
        degradationRatePerYear: 0
      };
      
      const withDegradation: WindFarmFinancialInputs = {
        ...sampleInputs,
        degradationRatePerYear: 0.01 // 1% per year
      };
      
      const lcoeNoDeg = calculateLCOE(noDegradation);
      const lcoeWithDeg = calculateLCOE(withDegradation);
      
      // LCOE should be higher with degradation
      expect(lcoeWithDeg).toBeGreaterThan(lcoeNoDeg);
    });
  });

  describe('calculateNPV', () => {
    it('should calculate net present value', () => {
      const npv = calculateNPV(sampleInputs);
      
      // NPV should be positive for a viable project
      expect(npv).toBeGreaterThan(0);
    });

    it('should be negative for unprofitable project', () => {
      const unprofitableInputs: WindFarmFinancialInputs = {
        ...sampleInputs,
        electricityPricePerMWh: 10 // Very low price
      };
      
      const npv = calculateNPV(unprofitableInputs);
      
      expect(npv).toBeLessThan(0);
    });

    it('should decrease with higher discount rate', () => {
      const lowRate: WindFarmFinancialInputs = {
        ...sampleInputs,
        discountRate: 0.05
      };
      
      const highRate: WindFarmFinancialInputs = {
        ...sampleInputs,
        discountRate: 0.12
      };
      
      const npvLow = calculateNPV(lowRate);
      const npvHigh = calculateNPV(highRate);
      
      expect(npvLow).toBeGreaterThan(npvHigh);
    });
  });

  describe('calculateIRR', () => {
    it('should calculate internal rate of return', () => {
      const irr = calculateIRR(sampleInputs);
      
      // IRR should be positive and reasonable (typically 8-15% for wind projects)
      expect(irr).toBeGreaterThan(0);
      expect(irr).toBeLessThan(0.3); // Less than 30%
    });

    it('should be higher than discount rate for positive NPV project', () => {
      const irr = calculateIRR(sampleInputs);
      const npv = calculateNPV(sampleInputs);
      
      if (npv > 0) {
        expect(irr).toBeGreaterThan(sampleInputs.discountRate!);
      }
    });
  });

  describe('calculatePaybackPeriod', () => {
    it('should calculate simple payback period', () => {
      const payback = calculatePaybackPeriod(sampleInputs);
      
      // Payback should be positive and reasonable (typically 10-20 years)
      expect(payback).toBeGreaterThan(0);
      expect(payback).toBeLessThan(30);
    });

    it('should return Infinity for unprofitable project', () => {
      const unprofitableInputs: WindFarmFinancialInputs = {
        ...sampleInputs,
        electricityPricePerMWh: 5 // Very low price
      };
      
      const payback = calculatePaybackPeriod(unprofitableInputs);
      
      expect(payback).toBe(Infinity);
    });
  });

  describe('calculateRevenueProjection', () => {
    it('should generate revenue projection for project lifetime', () => {
      const projection = calculateRevenueProjection(sampleInputs);
      
      expect(projection).toHaveLength(25);
      expect(projection[0].year).toBe(1);
      expect(projection[24].year).toBe(25);
    });

    it('should show decreasing revenue due to degradation', () => {
      const projection = calculateRevenueProjection(sampleInputs);
      
      // Revenue should decrease over time
      expect(projection[0].revenue).toBeGreaterThan(projection[24].revenue);
    });

    it('should show cumulative cash flow turning positive', () => {
      const projection = calculateRevenueProjection(sampleInputs);
      
      // Should start negative (initial investment)
      expect(projection[0].cumulativeCashFlow).toBeLessThan(0);
      
      // Should eventually turn positive
      const lastYear = projection[projection.length - 1];
      expect(lastYear.cumulativeCashFlow).toBeGreaterThan(0);
    });

    it('should have consistent net income calculation', () => {
      const projection = calculateRevenueProjection(sampleInputs);
      
      projection.forEach(year => {
        expect(year.netIncome).toBe(year.revenue - year.costs);
      });
    });
  });

  describe('calculateFinancialMetrics', () => {
    it('should calculate all metrics at once', () => {
      const metrics = calculateFinancialMetrics(sampleInputs);
      
      expect(metrics.totalCapitalCost).toBeGreaterThan(0);
      expect(metrics.operatingCostPerYear).toBeGreaterThan(0);
      expect(metrics.revenuePerYear).toBeGreaterThan(0);
      expect(metrics.lcoe).toBeGreaterThan(0);
      expect(metrics.npv).toBeDefined();
      expect(metrics.irr).toBeGreaterThan(0);
      expect(metrics.paybackPeriod).toBeGreaterThan(0);
    });

    it('should have consistent values with individual calculations', () => {
      const metrics = calculateFinancialMetrics(sampleInputs);
      
      expect(metrics.totalCapitalCost).toBe(calculateCapitalCost(sampleInputs));
      expect(metrics.operatingCostPerYear).toBe(calculateOperatingCost(sampleInputs));
      expect(metrics.revenuePerYear).toBe(calculateAnnualRevenue(sampleInputs));
      expect(metrics.lcoe).toBe(calculateLCOE(sampleInputs));
      expect(metrics.npv).toBe(calculateNPV(sampleInputs));
      expect(metrics.irr).toBe(calculateIRR(sampleInputs));
      expect(metrics.paybackPeriod).toBe(calculatePaybackPeriod(sampleInputs));
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero turbines', () => {
      const zeroTurbines: WindFarmFinancialInputs = {
        ...sampleInputs,
        turbineCount: 0
      };
      
      const cost = calculateCapitalCost(zeroTurbines);
      expect(cost).toBe(500_000); // Only grid connection cost
    });

    it('should handle very small project', () => {
      const smallProject: WindFarmFinancialInputs = {
        turbineCount: 1,
        turbineCapacityMW: 2.0,
        annualEnergyProductionMWh: 6_000
      };
      
      const metrics = calculateFinancialMetrics(smallProject);
      expect(metrics.totalCapitalCost).toBeGreaterThan(0);
      expect(metrics.lcoe).toBeGreaterThan(0);
    });

    it('should handle very large project', () => {
      const largeProject: WindFarmFinancialInputs = {
        turbineCount: 100,
        turbineCapacityMW: 5.0,
        annualEnergyProductionMWh: 1_500_000
      };
      
      const metrics = calculateFinancialMetrics(largeProject);
      expect(metrics.totalCapitalCost).toBeGreaterThan(0);
      expect(metrics.lcoe).toBeGreaterThan(0);
    });
  });

  describe('Realistic Scenarios', () => {
    it('should produce reasonable metrics for typical onshore wind farm', () => {
      const typicalOnshore: WindFarmFinancialInputs = {
        turbineCount: 50,
        turbineCapacityMW: 3.0,
        annualEnergyProductionMWh: 450_000, // ~34% capacity factor
        electricityPricePerMWh: 45,
        discountRate: 0.08,
        projectLifetimeYears: 25
      };
      
      const metrics = calculateFinancialMetrics(typicalOnshore);
      
      // Typical ranges for onshore wind
      expect(metrics.lcoe).toBeGreaterThan(30);
      expect(metrics.lcoe).toBeLessThan(70);
      expect(metrics.irr).toBeGreaterThan(0.06);
      expect(metrics.irr).toBeLessThan(0.15);
      expect(metrics.paybackPeriod).toBeGreaterThan(8);
      expect(metrics.paybackPeriod).toBeLessThan(20);
    });

    it('should show better economics for high-wind site', () => {
      const lowWind: WindFarmFinancialInputs = {
        ...sampleInputs,
        annualEnergyProductionMWh: 70_000 // ~27% capacity factor
      };
      
      const highWind: WindFarmFinancialInputs = {
        ...sampleInputs,
        annualEnergyProductionMWh: 110_000 // ~42% capacity factor
      };
      
      const metricsLow = calculateFinancialMetrics(lowWind);
      const metricsHigh = calculateFinancialMetrics(highWind);
      
      expect(metricsHigh.lcoe).toBeLessThan(metricsLow.lcoe);
      expect(metricsHigh.npv).toBeGreaterThan(metricsLow.npv);
      expect(metricsHigh.irr).toBeGreaterThan(metricsLow.irr);
      expect(metricsHigh.paybackPeriod).toBeLessThan(metricsLow.paybackPeriod);
    });
  });
});
