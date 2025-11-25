/**
 * Example usage of financial calculations for wind farm projects
 */

import {
  calculateFinancialMetrics,
  calculateCostBreakdown,
  calculateRevenueProjection,
  formatCurrency,
  formatPercentage,
  formatNumber,
  type WindFarmFinancialInputs,
  type FinancialMetrics
} from './financialCalculations';

/**
 * Example 1: Basic wind farm financial analysis
 */
export function exampleBasicAnalysis() {
  const projectInputs: WindFarmFinancialInputs = {
    turbineCount: 10,
    turbineCapacityMW: 3.0,
    annualEnergyProductionMWh: 90_000
  };

  const metrics = calculateFinancialMetrics(projectInputs);

  console.log('Basic Wind Farm Analysis:');
  console.log(`Total Capital Cost: ${formatCurrency(metrics.totalCapitalCost)}`);
  console.log(`LCOE: $${metrics.lcoe.toFixed(2)}/MWh`);
  console.log(`NPV: ${formatCurrency(metrics.npv)}`);
  console.log(`IRR: ${formatPercentage(metrics.irr)}`);
  console.log(`Payback Period: ${metrics.paybackPeriod.toFixed(1)} years`);

  return metrics;
}

/**
 * Example 2: Custom cost assumptions
 */
export function exampleCustomCosts() {
  const projectInputs: WindFarmFinancialInputs = {
    turbineCount: 50,
    turbineCapacityMW: 3.5,
    annualEnergyProductionMWh: 500_000,
    
    // Custom costs
    turbineCostPerMW: 1_400_000, // Higher quality turbines
    installationCostPerMW: 350_000, // Difficult terrain
    gridConnectionCost: 2_000_000, // Remote location
    landCostPerTurbine: 15_000, // Higher land lease
    operatingCostPerMWPerYear: 45_000, // Higher O&M
    
    // Custom revenue
    electricityPricePerMWh: 55, // Higher PPA price
    
    // Custom financial assumptions
    discountRate: 0.07, // Lower discount rate
    projectLifetimeYears: 30 // Longer project life
  };

  const metrics = calculateFinancialMetrics(projectInputs);
  const breakdown = calculateCostBreakdown(projectInputs);

  console.log('Custom Cost Analysis:');
  console.log('Cost Breakdown:');
  console.log(`  Turbines: ${formatCurrency(breakdown.turbines)}`);
  console.log(`  Installation: ${formatCurrency(breakdown.installation)}`);
  console.log(`  Grid: ${formatCurrency(breakdown.grid)}`);
  console.log(`  Land (annual): ${formatCurrency(breakdown.land)}`);
  console.log('Financial Metrics:');
  console.log(`  LCOE: $${metrics.lcoe.toFixed(2)}/MWh`);
  console.log(`  NPV: ${formatCurrency(metrics.npv)}`);
  console.log(`  IRR: ${formatPercentage(metrics.irr)}`);

  return { metrics, breakdown };
}

/**
 * Example 3: Revenue projection over project lifetime
 */
export function exampleRevenueProjection() {
  const projectInputs: WindFarmFinancialInputs = {
    turbineCount: 25,
    turbineCapacityMW: 3.0,
    annualEnergyProductionMWh: 225_000,
    electricityPricePerMWh: 50,
    projectLifetimeYears: 25
  };

  const projection = calculateRevenueProjection(projectInputs);

  console.log('Revenue Projection:');
  console.log('Year | Revenue      | Costs        | Net Income   | Cumulative');
  console.log('-----|--------------|--------------|--------------|-------------');
  
  // Show first 5 years and last 5 years
  [...projection.slice(0, 5), ...projection.slice(-5)].forEach(year => {
    console.log(
      `${year.year.toString().padStart(4)} | ` +
      `${formatCurrency(year.revenue).padStart(12)} | ` +
      `${formatCurrency(year.costs).padStart(12)} | ` +
      `${formatCurrency(year.netIncome).padStart(12)} | ` +
      `${formatCurrency(year.cumulativeCashFlow).padStart(12)}`
    );
  });

  return projection;
}

/**
 * Example 4: Scenario comparison
 */
export function exampleScenarioComparison() {
  const baseScenario: WindFarmFinancialInputs = {
    turbineCount: 20,
    turbineCapacityMW: 3.0,
    annualEnergyProductionMWh: 180_000,
    electricityPricePerMWh: 50
  };

  const optimisticScenario: WindFarmFinancialInputs = {
    ...baseScenario,
    annualEnergyProductionMWh: 210_000, // Better wind resource
    electricityPricePerMWh: 55 // Better PPA
  };

  const pessimisticScenario: WindFarmFinancialInputs = {
    ...baseScenario,
    annualEnergyProductionMWh: 150_000, // Lower wind resource
    electricityPricePerMWh: 45 // Lower PPA
  };

  const baseMetrics = calculateFinancialMetrics(baseScenario);
  const optimisticMetrics = calculateFinancialMetrics(optimisticScenario);
  const pessimisticMetrics = calculateFinancialMetrics(pessimisticScenario);

  console.log('Scenario Comparison:');
  console.log('Metric              | Base         | Optimistic   | Pessimistic');
  console.log('--------------------|--------------|--------------|-------------');
  console.log(`LCOE ($/MWh)        | ${baseMetrics.lcoe.toFixed(2).padStart(12)} | ${optimisticMetrics.lcoe.toFixed(2).padStart(12)} | ${pessimisticMetrics.lcoe.toFixed(2).padStart(12)}`);
  console.log(`NPV                 | ${formatCurrency(baseMetrics.npv).padStart(12)} | ${formatCurrency(optimisticMetrics.npv).padStart(12)} | ${formatCurrency(pessimisticMetrics.npv).padStart(12)}`);
  console.log(`IRR                 | ${formatPercentage(baseMetrics.irr).padStart(12)} | ${formatPercentage(optimisticMetrics.irr).padStart(12)} | ${formatPercentage(pessimisticMetrics.irr).padStart(12)}`);
  console.log(`Payback (years)     | ${baseMetrics.paybackPeriod.toFixed(1).padStart(12)} | ${optimisticMetrics.paybackPeriod.toFixed(1).padStart(12)} | ${pessimisticMetrics.paybackPeriod.toFixed(1).padStart(12)}`);

  return { baseMetrics, optimisticMetrics, pessimisticMetrics };
}

/**
 * Example 5: Integration with orchestrator
 */
export function exampleOrchestratorIntegration(
  turbineCount: number,
  turbineCapacityMW: number,
  annualEnergyProductionMWh: number
) {
  // Calculate financial metrics for orchestrator response
  const inputs: WindFarmFinancialInputs = {
    turbineCount,
    turbineCapacityMW,
    annualEnergyProductionMWh
  };

  const metrics = calculateFinancialMetrics(inputs);
  const breakdown = calculateCostBreakdown(inputs);
  const projection = calculateRevenueProjection(inputs);

  // Format for financial analysis artifact
  return {
    messageContentType: 'financial_analysis',
    projectId: 'example-project',
    metrics: {
      totalCapitalCost: metrics.totalCapitalCost,
      operatingCostPerYear: metrics.operatingCostPerYear,
      revenuePerYear: metrics.revenuePerYear,
      lcoe: metrics.lcoe,
      npv: metrics.npv,
      irr: metrics.irr,
      paybackPeriod: metrics.paybackPeriod
    },
    costBreakdown: {
      turbines: breakdown.turbines,
      installation: breakdown.installation,
      grid: breakdown.grid,
      land: breakdown.land,
      other: breakdown.other
    },
    revenueProjection: projection.map(p => ({
      year: p.year,
      revenue: p.revenue,
      costs: p.costs,
      netIncome: p.netIncome
    })),
    assumptions: {
      discountRate: inputs.discountRate ?? 0.08,
      projectLifetime: inputs.projectLifetimeYears ?? 25,
      electricityPrice: inputs.electricityPricePerMWh ?? 50,
      capacityFactor: inputs.capacityFactor ?? 0.35
    }
  };
}

/**
 * Example 6: Sensitivity analysis
 */
export function exampleSensitivityAnalysis() {
  const baseInputs: WindFarmFinancialInputs = {
    turbineCount: 30,
    turbineCapacityMW: 3.0,
    annualEnergyProductionMWh: 270_000,
    electricityPricePerMWh: 50
  };

  console.log('Sensitivity Analysis:');
  console.log('\nElectricity Price Impact:');
  [40, 45, 50, 55, 60].forEach(price => {
    const metrics = calculateFinancialMetrics({
      ...baseInputs,
      electricityPricePerMWh: price
    });
    console.log(`  $${price}/MWh: NPV = ${formatCurrency(metrics.npv)}, IRR = ${formatPercentage(metrics.irr)}`);
  });

  console.log('\nCapacity Factor Impact:');
  [0.30, 0.35, 0.40, 0.45].forEach(cf => {
    const energyProduction = baseInputs.turbineCount * baseInputs.turbineCapacityMW * 8760 * cf;
    const metrics = calculateFinancialMetrics({
      ...baseInputs,
      annualEnergyProductionMWh: energyProduction
    });
    console.log(`  ${(cf * 100).toFixed(0)}%: NPV = ${formatCurrency(metrics.npv)}, IRR = ${formatPercentage(metrics.irr)}`);
  });

  console.log('\nDiscount Rate Impact:');
  [0.06, 0.08, 0.10, 0.12].forEach(rate => {
    const metrics = calculateFinancialMetrics({
      ...baseInputs,
      discountRate: rate
    });
    console.log(`  ${(rate * 100).toFixed(0)}%: NPV = ${formatCurrency(metrics.npv)}, LCOE = $${metrics.lcoe.toFixed(2)}/MWh`);
  });
}

// Run examples if executed directly
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('Financial Calculations Examples');
  console.log('='.repeat(60));
  
  console.log('\n1. Basic Analysis:');
  exampleBasicAnalysis();
  
  console.log('\n2. Custom Costs:');
  exampleCustomCosts();
  
  console.log('\n3. Revenue Projection:');
  exampleRevenueProjection();
  
  console.log('\n4. Scenario Comparison:');
  exampleScenarioComparison();
  
  console.log('\n5. Sensitivity Analysis:');
  exampleSensitivityAnalysis();
}
