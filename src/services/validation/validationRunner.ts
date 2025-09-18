/**
 * Validation Runner
 * Orchestrates comprehensive validation of petrophysical calculations
 * against industry standards and commercial software benchmarks
 */

import { IndustryValidationService, ValidationResult } from './industryValidation';
import { BenchmarkDataManager } from './benchmarkDataManager';
import { PorosityCalculator } from '../calculators/porosityCalculator';
import { ShaleVolumeCalculator } from '../calculators/shaleVolumeCalculator';
import { SaturationCalculator } from '../calculators/saturationCalculator';
import { PermeabilityCalculator } from '../calculators/permeabilityCalculator';

export interface ValidationSuite {
  name: string;
  description: string;
  calculationTypes: string[];
  softwarePackages: string[];
  results: ValidationSuiteResult[];
}

export interface ValidationSuiteResult {
  calculationType: string;
  method: string;
  software: string;
  benchmarkName: string;
  result: ValidationResult;
  executionTime: number;
}

export interface ValidationSummary {
  totalBenchmarks: number;
  passedBenchmarks: number;
  failedBenchmarks: number;
  overallAccuracy: number;
  averageCorrelation: number;
  softwareSummary: { [software: string]: SoftwareValidationSummary };
  calculationTypeSummary: { [type: string]: CalculationTypeValidationSummary };
  recommendations: string[];
}

export interface SoftwareValidationSummary {
  totalBenchmarks: number;
  passedBenchmarks: number;
  averageAccuracy: number;
  averageCorrelation: number;
}

export interface CalculationTypeValidationSummary {
  totalBenchmarks: number;
  passedBenchmarks: number;
  averageAccuracy: number;
  methods: string[];
}

export class ValidationRunner {
  private validationService: IndustryValidationService;
  private dataManager: BenchmarkDataManager;
  private porosityCalculator: PorosityCalculator;
  private shaleVolumeCalculator: ShaleVolumeCalculator;
  private saturationCalculator: SaturationCalculator;
  private permeabilityCalculator: PermeabilityCalculator;

  constructor() {
    this.validationService = new IndustryValidationService();
    this.dataManager = new BenchmarkDataManager();
    this.porosityCalculator = new PorosityCalculator();
    this.shaleVolumeCalculator = new ShaleVolumeCalculator();
    this.saturationCalculator = new SaturationCalculator();
    this.permeabilityCalculator = new PermeabilityCalculator();
  }

  /**
   * Initialize validation runner with all benchmark data
   */
  async initialize(): Promise<void> {
    await this.validationService.loadBenchmarks();
    await this.dataManager.loadStandardDatasets();
  }

  /**
   * Run comprehensive validation suite
   */
  async runComprehensiveValidation(): Promise<ValidationSuite> {
    const startTime = Date.now();
    const results: ValidationSuiteResult[] = [];

    // Get all benchmarks
    const allBenchmarks = this.dataManager.getAllBenchmarks();

    for (const benchmark of allBenchmarks) {
      try {
        const suiteResult = await this.runSingleBenchmarkValidation(benchmark);
        results.push(suiteResult);
      } catch (error) {
        console.error(`Failed to validate benchmark ${benchmark.name}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      name: 'Comprehensive Industry Validation Suite',
      description: `Complete validation against ${allBenchmarks.length} industry benchmarks`,
      calculationTypes: [...new Set(allBenchmarks.map(b => b.calculationType))],
      softwarePackages: [...new Set(allBenchmarks.map(b => b.software))],
      results
    };
  }

  /**
   * Run validation for specific calculation type
   */
  async runCalculationTypeValidation(calculationType: string): Promise<ValidationSuite> {
    const benchmarks = this.dataManager.getBenchmarksByType(calculationType);
    const results: ValidationSuiteResult[] = [];

    for (const benchmark of benchmarks) {
      try {
        const suiteResult = await this.runSingleBenchmarkValidation(benchmark);
        results.push(suiteResult);
      } catch (error) {
        console.error(`Failed to validate benchmark ${benchmark.name}:`, error);
      }
    }

    return {
      name: `${calculationType.charAt(0).toUpperCase() + calculationType.slice(1)} Validation Suite`,
      description: `Validation of ${calculationType} calculations against industry standards`,
      calculationTypes: [calculationType],
      softwarePackages: [...new Set(benchmarks.map(b => b.software))],
      results
    };
  }

  /**
   * Run validation for specific software package
   */
  async runSoftwareValidation(software: string): Promise<ValidationSuite> {
    const benchmarks = this.dataManager.getBenchmarksBySoftware(software);
    const results: ValidationSuiteResult[] = [];

    for (const benchmark of benchmarks) {
      try {
        const suiteResult = await this.runSingleBenchmarkValidation(benchmark);
        results.push(suiteResult);
      } catch (error) {
        console.error(`Failed to validate benchmark ${benchmark.name}:`, error);
      }
    }

    return {
      name: `${software} Validation Suite`,
      description: `Validation against ${software} calculation standards`,
      calculationTypes: [...new Set(benchmarks.map(b => b.calculationType))],
      softwarePackages: [software],
      results
    };
  }

  /**
   * Run validation for a single benchmark
   */
  private async runSingleBenchmarkValidation(benchmark: any): Promise<ValidationSuiteResult> {
    const startTime = Date.now();
    
    // Calculate results using our implementation
    const actualResults = await this.calculateResults(benchmark);
    
    // Validate against benchmark
    const validationResults = await this.validationService.validateCalculation(
      benchmark.calculationType,
      benchmark.method,
      actualResults,
      benchmark.inputData.depths,
      benchmark.inputData
    );

    const executionTime = Date.now() - startTime;

    return {
      calculationType: benchmark.calculationType,
      method: benchmark.method,
      software: benchmark.software,
      benchmarkName: benchmark.name,
      result: validationResults[0], // Take first result
      executionTime
    };
  }

  /**
   * Calculate results using appropriate calculator
   */
  private async calculateResults(benchmark: any): Promise<number[]> {
    const { calculationType, method, inputData } = benchmark;

    switch (calculationType) {
      case 'porosity':
        return this.calculatePorosityResults(method, inputData);
      
      case 'shale_volume':
        return this.calculateShaleVolumeResults(method, inputData);
      
      case 'saturation':
        return this.calculateSaturationResults(method, inputData);
      
      case 'permeability':
        return this.calculatePermeabilityResults(method, inputData);
      
      default:
        throw new Error(`Unsupported calculation type: ${calculationType}`);
    }
  }

  /**
   * Calculate porosity results
   */
  private calculatePorosityResults(method: string, inputData: any): number[] {
    const { curves, parameters } = inputData;

    switch (method) {
      case 'density':
        return this.porosityCalculator.calculateDensityPorosity(
          curves.RHOB,
          parameters
        );
      
      case 'neutron':
        return this.porosityCalculator.calculateNeutronPorosity(
          curves.NPHI,
          parameters
        );
      
      case 'density_neutron_combined':
        const densityPorosity = this.porosityCalculator.calculateDensityPorosity(
          curves.RHOB,
          parameters
        );
        const neutronPorosity = this.porosityCalculator.calculateNeutronPorosity(
          curves.NPHI,
          parameters
        );
        return this.porosityCalculator.calculateEffectivePorosity(
          densityPorosity,
          neutronPorosity
        );
      
      default:
        throw new Error(`Unsupported porosity method: ${method}`);
    }
  }

  /**
   * Calculate shale volume results
   */
  private calculateShaleVolumeResults(method: string, inputData: any): number[] {
    const { curves, parameters } = inputData;

    switch (method) {
      case 'larionov_tertiary':
        return this.shaleVolumeCalculator.calculateLarionovTertiary(
          curves.GR,
          parameters
        );
      
      case 'larionov_mesozoic':
        return this.shaleVolumeCalculator.calculateLarionovPreTertiary(
          curves.GR,
          parameters
        );
      
      case 'linear':
        return this.shaleVolumeCalculator.calculateLinear(
          curves.GR,
          parameters
        );
      
      case 'clavier':
        return this.shaleVolumeCalculator.calculateClavier(
          curves.GR,
          parameters
        );
      
      default:
        throw new Error(`Unsupported shale volume method: ${method}`);
    }
  }

  /**
   * Calculate saturation results
   */
  private calculateSaturationResults(method: string, inputData: any): number[] {
    const { curves, parameters } = inputData;

    switch (method) {
      case 'archie':
        return this.saturationCalculator.calculateArchie(
          curves.RT,
          curves.POROSITY,
          parameters
        );
      
      case 'waxman_smits':
        return this.saturationCalculator.calculateWaxmanSmits(
          curves.RT,
          curves.POROSITY,
          parameters
        );
      
      default:
        throw new Error(`Unsupported saturation method: ${method}`);
    }
  }

  /**
   * Calculate permeability results
   */
  private calculatePermeabilityResults(method: string, inputData: any): number[] {
    const { curves, parameters } = inputData;

    switch (method) {
      case 'timur':
        return this.permeabilityCalculator.calculateTimur(
          curves.POROSITY,
          curves.SW,
          parameters
        );
      
      case 'kozeny_carman':
        return this.permeabilityCalculator.calculateKozenyCarman(
          curves.POROSITY,
          parameters
        );
      
      default:
        throw new Error(`Unsupported permeability method: ${method}`);
    }
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(validationSuite: ValidationSuite): ValidationSummary {
    const { results } = validationSuite;
    
    const totalBenchmarks = results.length;
    const passedBenchmarks = results.filter(r => r.result.passed).length;
    const failedBenchmarks = totalBenchmarks - passedBenchmarks;
    
    const overallAccuracy = results.reduce((sum, r) => sum + r.result.accuracy, 0) / totalBenchmarks;
    const averageCorrelation = results.reduce((sum, r) => sum + r.result.statistics.correlationCoefficient, 0) / totalBenchmarks;

    // Software summary
    const softwareSummary: { [software: string]: SoftwareValidationSummary } = {};
    const softwareGroups = this.groupBy(results, 'software');
    
    for (const [software, softwareResults] of Object.entries(softwareGroups)) {
      const softwarePassed = softwareResults.filter(r => r.result.passed).length;
      const softwareAccuracy = softwareResults.reduce((sum, r) => sum + r.result.accuracy, 0) / softwareResults.length;
      const softwareCorrelation = softwareResults.reduce((sum, r) => sum + r.result.statistics.correlationCoefficient, 0) / softwareResults.length;
      
      softwareSummary[software] = {
        totalBenchmarks: softwareResults.length,
        passedBenchmarks: softwarePassed,
        averageAccuracy: softwareAccuracy,
        averageCorrelation: softwareCorrelation
      };
    }

    // Calculation type summary
    const calculationTypeSummary: { [type: string]: CalculationTypeValidationSummary } = {};
    const typeGroups = this.groupBy(results, 'calculationType');
    
    for (const [type, typeResults] of Object.entries(typeGroups)) {
      const typePassed = typeResults.filter(r => r.result.passed).length;
      const typeAccuracy = typeResults.reduce((sum, r) => sum + r.result.accuracy, 0) / typeResults.length;
      const typeMethods = [...new Set(typeResults.map(r => r.method))];
      
      calculationTypeSummary[type] = {
        totalBenchmarks: typeResults.length,
        passedBenchmarks: typePassed,
        averageAccuracy: typeAccuracy,
        methods: typeMethods
      };
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallAccuracy,
      averageCorrelation,
      failedBenchmarks,
      totalBenchmarks,
      softwareSummary,
      calculationTypeSummary
    );

    return {
      totalBenchmarks,
      passedBenchmarks,
      failedBenchmarks,
      overallAccuracy,
      averageCorrelation,
      softwareSummary,
      calculationTypeSummary,
      recommendations
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    overallAccuracy: number,
    averageCorrelation: number,
    failedBenchmarks: number,
    totalBenchmarks: number,
    softwareSummary: { [software: string]: SoftwareValidationSummary },
    calculationTypeSummary: { [type: string]: CalculationTypeValidationSummary }
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance recommendations
    if (overallAccuracy >= 95) {
      recommendations.push('✅ Excellent overall accuracy (≥95%). Calculations meet industry standards.');
    } else if (overallAccuracy >= 90) {
      recommendations.push('⚠️ Good overall accuracy (90-95%). Minor parameter adjustments may improve results.');
    } else {
      recommendations.push('❌ Below target accuracy (<90%). Significant review of calculation methods required.');
    }

    if (averageCorrelation >= 0.95) {
      recommendations.push('✅ Excellent correlation with industry standards (≥0.95).');
    } else if (averageCorrelation >= 0.90) {
      recommendations.push('⚠️ Good correlation with industry standards (0.90-0.95).');
    } else {
      recommendations.push('❌ Poor correlation with industry standards (<0.90). Review calculation methodology.');
    }

    // Software-specific recommendations
    for (const [software, summary] of Object.entries(softwareSummary)) {
      if (summary.averageAccuracy < 90) {
        recommendations.push(`❌ Poor performance against ${software} benchmarks (${summary.averageAccuracy.toFixed(1)}%). Review ${software}-specific parameters.`);
      }
    }

    // Calculation type recommendations
    for (const [type, summary] of Object.entries(calculationTypeSummary)) {
      if (summary.averageAccuracy < 90) {
        recommendations.push(`❌ ${type} calculations below target (${summary.averageAccuracy.toFixed(1)}%). Focus on ${type} methodology improvement.`);
      }
    }

    // Failed benchmark recommendations
    if (failedBenchmarks > 0) {
      const failureRate = (failedBenchmarks / totalBenchmarks) * 100;
      if (failureRate > 10) {
        recommendations.push(`❌ High failure rate (${failureRate.toFixed(1)}%). Comprehensive review required.`);
      } else {
        recommendations.push(`⚠️ Some benchmarks failed (${failedBenchmarks}/${totalBenchmarks}). Review specific cases.`);
      }
    }

    return recommendations;
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as { [key: string]: T[] });
  }

  /**
   * Export validation results to JSON
   */
  exportValidationResults(validationSuite: ValidationSuite): string {
    const summary = this.generateValidationSummary(validationSuite);
    
    return JSON.stringify({
      validationSuite,
      summary,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }
}