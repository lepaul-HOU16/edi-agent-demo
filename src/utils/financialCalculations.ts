/**
 * Financial Calculations for Wind Farm Projects
 * 
 * Industry-standard formulas for renewable energy project economics
 * Based on NREL methodologies and standard financial analysis practices
 */

export interface WindFarmFinancialInputs {
  // Project specifications
  turbineCount: number;
  turbineCapacityMW: number; // Capacity per turbine in MW
  annualEnergyProductionMWh: number; // Total annual energy production
  
  // Capital costs
  turbineCostPerMW?: number; // Default: $1,300,000 per MW
  installationCostPerMW?: number; // Default: $300,000 per MW
  gridConnectionCost?: number; // Default: $500,000
  landCostPerTurbine?: number; // Default: $10,000 per turbine per year (lease)
  
  // Operating costs
  operatingCostPerMWPerYear?: number; // Default: $40,000 per MW per year
  
  // Revenue
  electricityPricePerMWh?: number; // Default: $50 per MWh
  
  // Financial assumptions
  discountRate?: number; // Default: 0.08 (8%)
  projectLifetimeYears?: number; // Default: 25 years
  capacityFactor?: number; // Default: 0.35 (35%)
  degradationRatePerYear?: number; // Default: 0.005 (0.5% per year)
}

export interface FinancialMetrics {
  totalCapitalCost: number;
  operatingCostPerYear: number;
  revenuePerYear: number;
  lcoe: number; // Levelized Cost of Energy ($/MWh)
  npv: number; // Net Present Value ($)
  irr: number; // Internal Rate of Return (%)
  paybackPeriod: number; // Years
}

export interface CostBreakdown {
  turbines: number;
  installation: number;
  grid: number;
  land: number;
  other: number;
}

export interface RevenueProjection {
  year: number;
  revenue: number;
  costs: number;
  netIncome: number;
  cumulativeCashFlow: number;
}

/**
 * Calculate total capital cost for wind farm project
 */
export function calculateCapitalCost(inputs: WindFarmFinancialInputs): number {
  const totalCapacityMW = inputs.turbineCount * inputs.turbineCapacityMW;
  const turbineCostPerMW = inputs.turbineCostPerMW ?? 1_300_000;
  const installationCostPerMW = inputs.installationCostPerMW ?? 300_000;
  const gridConnectionCost = inputs.gridConnectionCost ?? 500_000;
  
  const turbineCost = totalCapacityMW * turbineCostPerMW;
  const installationCost = totalCapacityMW * installationCostPerMW;
  
  return turbineCost + installationCost + gridConnectionCost;
}

/**
 * Calculate cost breakdown by category
 */
export function calculateCostBreakdown(inputs: WindFarmFinancialInputs): CostBreakdown {
  const totalCapacityMW = inputs.turbineCount * inputs.turbineCapacityMW;
  const turbineCostPerMW = inputs.turbineCostPerMW ?? 1_300_000;
  const installationCostPerMW = inputs.installationCostPerMW ?? 300_000;
  const gridConnectionCost = inputs.gridConnectionCost ?? 500_000;
  const landCostPerTurbine = inputs.landCostPerTurbine ?? 10_000;
  
  const turbineCost = totalCapacityMW * turbineCostPerMW;
  const installationCost = totalCapacityMW * installationCostPerMW;
  const landCost = inputs.turbineCount * landCostPerTurbine;
  
  return {
    turbines: turbineCost,
    installation: installationCost,
    grid: gridConnectionCost,
    land: landCost,
    other: 0
  };
}

/**
 * Calculate annual operating cost
 */
export function calculateOperatingCost(inputs: WindFarmFinancialInputs): number {
  const totalCapacityMW = inputs.turbineCount * inputs.turbineCapacityMW;
  const operatingCostPerMWPerYear = inputs.operatingCostPerMWPerYear ?? 40_000;
  const landCostPerTurbine = inputs.landCostPerTurbine ?? 10_000;
  
  const operatingCost = totalCapacityMW * operatingCostPerMWPerYear;
  const landLeaseCost = inputs.turbineCount * landCostPerTurbine;
  
  return operatingCost + landLeaseCost;
}

/**
 * Calculate annual revenue
 */
export function calculateAnnualRevenue(inputs: WindFarmFinancialInputs): number {
  const electricityPrice = inputs.electricityPricePerMWh ?? 50;
  return inputs.annualEnergyProductionMWh * electricityPrice;
}

/**
 * Calculate Levelized Cost of Energy (LCOE)
 * 
 * LCOE = (Total Lifetime Costs) / (Total Lifetime Energy Production)
 * Accounts for time value of money using discount rate
 */
export function calculateLCOE(inputs: WindFarmFinancialInputs): number {
  const capitalCost = calculateCapitalCost(inputs);
  const annualOperatingCost = calculateOperatingCost(inputs);
  const discountRate = inputs.discountRate ?? 0.08;
  const projectLifetime = inputs.projectLifetimeYears ?? 25;
  const degradationRate = inputs.degradationRatePerYear ?? 0.005;
  
  let totalDiscountedCosts = capitalCost;
  let totalDiscountedEnergy = 0;
  
  for (let year = 1; year <= projectLifetime; year++) {
    // Discount operating costs
    const discountFactor = Math.pow(1 + discountRate, year);
    totalDiscountedCosts += annualOperatingCost / discountFactor;
    
    // Account for degradation in energy production
    const degradationFactor = Math.pow(1 - degradationRate, year - 1);
    const yearlyEnergy = inputs.annualEnergyProductionMWh * degradationFactor;
    totalDiscountedEnergy += yearlyEnergy / discountFactor;
  }
  
  return totalDiscountedCosts / totalDiscountedEnergy;
}

/**
 * Calculate Net Present Value (NPV)
 * 
 * NPV = Sum of (Cash Flow / (1 + discount rate)^year) - Initial Investment
 */
export function calculateNPV(inputs: WindFarmFinancialInputs): number {
  const capitalCost = calculateCapitalCost(inputs);
  const annualRevenue = calculateAnnualRevenue(inputs);
  const annualOperatingCost = calculateOperatingCost(inputs);
  const discountRate = inputs.discountRate ?? 0.08;
  const projectLifetime = inputs.projectLifetimeYears ?? 25;
  const degradationRate = inputs.degradationRatePerYear ?? 0.005;
  
  let npv = -capitalCost; // Initial investment is negative cash flow
  
  for (let year = 1; year <= projectLifetime; year++) {
    // Account for degradation in energy production (affects revenue)
    const degradationFactor = Math.pow(1 - degradationRate, year - 1);
    const yearlyRevenue = annualRevenue * degradationFactor;
    const yearlyCashFlow = yearlyRevenue - annualOperatingCost;
    
    // Discount to present value
    const discountFactor = Math.pow(1 + discountRate, year);
    npv += yearlyCashFlow / discountFactor;
  }
  
  return npv;
}

/**
 * Calculate Internal Rate of Return (IRR)
 * 
 * IRR is the discount rate that makes NPV = 0
 * Uses Newton-Raphson method for numerical solution
 */
export function calculateIRR(inputs: WindFarmFinancialInputs): number {
  const capitalCost = calculateCapitalCost(inputs);
  const annualRevenue = calculateAnnualRevenue(inputs);
  const annualOperatingCost = calculateOperatingCost(inputs);
  const projectLifetime = inputs.projectLifetimeYears ?? 25;
  const degradationRate = inputs.degradationRatePerYear ?? 0.005;
  
  // Function to calculate NPV at a given rate
  const npvAtRate = (rate: number): number => {
    let npv = -capitalCost;
    for (let year = 1; year <= projectLifetime; year++) {
      const degradationFactor = Math.pow(1 - degradationRate, year - 1);
      const yearlyRevenue = annualRevenue * degradationFactor;
      const yearlyCashFlow = yearlyRevenue - annualOperatingCost;
      const discountFactor = Math.pow(1 + rate, year);
      npv += yearlyCashFlow / discountFactor;
    }
    return npv;
  };
  
  // Newton-Raphson method to find IRR
  let rate = 0.1; // Initial guess: 10%
  const tolerance = 0.0001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const npv = npvAtRate(rate);
    
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    // Calculate derivative (slope) using small delta
    const delta = 0.0001;
    const npvPlus = npvAtRate(rate + delta);
    const derivative = (npvPlus - npv) / delta;
    
    // Newton-Raphson update
    rate = rate - npv / derivative;
    
    // Ensure rate stays positive
    if (rate < 0) rate = 0.01;
  }
  
  return rate;
}

/**
 * Calculate simple payback period (years)
 * 
 * Payback Period = Initial Investment / Annual Net Cash Flow
 * Note: This is simple payback, not discounted payback
 */
export function calculatePaybackPeriod(inputs: WindFarmFinancialInputs): number {
  const capitalCost = calculateCapitalCost(inputs);
  const annualRevenue = calculateAnnualRevenue(inputs);
  const annualOperatingCost = calculateOperatingCost(inputs);
  const annualNetCashFlow = annualRevenue - annualOperatingCost;
  
  if (annualNetCashFlow <= 0) {
    return Infinity; // Project never pays back
  }
  
  return capitalCost / annualNetCashFlow;
}

/**
 * Calculate revenue projection over project lifetime
 */
export function calculateRevenueProjection(inputs: WindFarmFinancialInputs): RevenueProjection[] {
  const capitalCost = calculateCapitalCost(inputs);
  const annualRevenue = calculateAnnualRevenue(inputs);
  const annualOperatingCost = calculateOperatingCost(inputs);
  const projectLifetime = inputs.projectLifetimeYears ?? 25;
  const degradationRate = inputs.degradationRatePerYear ?? 0.005;
  
  const projection: RevenueProjection[] = [];
  let cumulativeCashFlow = -capitalCost; // Start with negative initial investment
  
  for (let year = 1; year <= projectLifetime; year++) {
    // Account for degradation
    const degradationFactor = Math.pow(1 - degradationRate, year - 1);
    const yearlyRevenue = annualRevenue * degradationFactor;
    const yearlyNetIncome = yearlyRevenue - annualOperatingCost;
    
    cumulativeCashFlow += yearlyNetIncome;
    
    projection.push({
      year,
      revenue: yearlyRevenue,
      costs: annualOperatingCost,
      netIncome: yearlyNetIncome,
      cumulativeCashFlow
    });
  }
  
  return projection;
}

/**
 * Calculate all financial metrics at once
 */
export function calculateFinancialMetrics(inputs: WindFarmFinancialInputs): FinancialMetrics {
  return {
    totalCapitalCost: calculateCapitalCost(inputs),
    operatingCostPerYear: calculateOperatingCost(inputs),
    revenuePerYear: calculateAnnualRevenue(inputs),
    lcoe: calculateLCOE(inputs),
    npv: calculateNPV(inputs),
    irr: calculateIRR(inputs),
    paybackPeriod: calculatePaybackPeriod(inputs)
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
