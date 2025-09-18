/**
 * Example usage of the Petrophysical Calculation Engine Foundation
 * Demonstrates how to use the core interfaces and engine functionality
 */

import { PetrophysicsCalculationEngine } from '../petrophysicsEngine';
import {
  WellLogData,
  LogCurve,
  CalculationParameters,
  WellHeaderInfo,
  GeographicLocation,
  QualityAssessment,
  CurveQuality,
} from '../../types/petrophysics';

/**
 * Example: Creating and loading well data
 */
export function createExampleWellData(): WellLogData {
  // Define well location
  const location: GeographicLocation = {
    latitude: 29.7604,
    longitude: -95.3698,
    utmZone: '15N',
    utmEasting: 276000,
    utmNorthing: 3290000,
  };

  // Define well header information
  const wellInfo: WellHeaderInfo = {
    wellName: 'EXAMPLE-001',
    field: 'Example Field',
    operator: 'Example Operator',
    location,
    elevation: 150,
    totalDepth: 12000,
    spudDate: new Date('2023-06-01'),
    wellType: 'vertical',
  };

  // Define curve quality
  const goodQuality: CurveQuality = {
    completeness: 0.98,
    outlierCount: 1,
    environmentalCorrections: ['borehole_correction', 'temperature_correction'],
    qualityFlag: 'excellent',
  };

  // Create log curves with realistic data
  const curves: LogCurve[] = [
    {
      name: 'DEPT',
      unit: 'FT',
      description: 'Measured Depth',
      data: Array.from({ length: 100 }, (_, i) => 9000 + i * 0.5), // 9000-9049.5 ft
      nullValue: -999.25,
      quality: goodQuality,
      apiCode: '00',
    },
    {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: Array.from({ length: 100 }, (_, i) => 40 + Math.sin(i * 0.1) * 20 + Math.random() * 5),
      nullValue: -999.25,
      quality: goodQuality,
      apiCode: '07',
    },
    {
      name: 'RHOB',
      unit: 'G/C3',
      description: 'Bulk Density',
      data: Array.from({ length: 100 }, (_, i) => 2.3 + Math.cos(i * 0.05) * 0.2 + Math.random() * 0.05),
      nullValue: -999.25,
      quality: goodQuality,
      apiCode: '17',
    },
    {
      name: 'NPHI',
      unit: 'V/V',
      description: 'Neutron Porosity',
      data: Array.from({ length: 100 }, (_, i) => 0.15 - Math.cos(i * 0.05) * 0.08 + Math.random() * 0.02),
      nullValue: -999.25,
      quality: goodQuality,
      apiCode: '42',
    },
    {
      name: 'RT',
      unit: 'OHMM',
      description: 'True Resistivity',
      data: Array.from({ length: 100 }, (_, i) => 10 + Math.exp(Math.sin(i * 0.02)) * 50 + Math.random() * 5),
      nullValue: -999.25,
      quality: goodQuality,
      apiCode: '20',
    },
  ];

  // Define overall quality assessment
  const qualityAssessment: QualityAssessment = {
    overallQuality: 'excellent',
    dataCompleteness: 0.98,
    environmentalCorrections: ['borehole_correction', 'temperature_correction'],
    validationFlags: [],
    lastAssessment: new Date(),
  };

  return {
    wellName: 'EXAMPLE-001',
    wellInfo,
    curves,
    depthRange: [9000, 9049.5],
    dataQuality: qualityAssessment,
    lastModified: new Date(),
    version: '1.0',
  };
}

/**
 * Example: Using the calculation engine
 */
export function demonstrateEngineUsage(): void {
  // Create engine instance with custom configuration
  const engine = new PetrophysicsCalculationEngine({
    enableValidation: true,
    enableUncertaintyCalculation: true,
    defaultParameters: {
      matrixDensity: 2.65, // Sandstone
      fluidDensity: 1.0,   // Water
      rw: 0.1,             // Formation water resistivity
      a: 1.0,              // Tortuosity factor
      m: 2.0,              // Cementation exponent
      n: 2.0,              // Saturation exponent
    },
    qualityThresholds: {
      dataCompleteness: 0.85,
      uncertaintyMax: 0.25,
    },
  });

  // Load well data
  const wellData = createExampleWellData();
  const loadResult = engine.loadWellData(wellData);

  if (loadResult.isValid) {
    console.log('✓ Well data loaded successfully');
    
    // Display any warnings
    if (loadResult.warnings.length > 0) {
      console.log('Warnings:');
      loadResult.warnings.forEach(warning => {
        console.log(`  - ${warning.message}`);
      });
    }
  } else {
    console.log('✗ Failed to load well data');
    loadResult.errors.forEach(error => {
      console.log(`  Error: ${error.message}`);
    });
    return;
  }

  // Validate calculation parameters
  const porosityParams: CalculationParameters = {
    matrixDensity: 2.65,
    fluidDensity: 1.0,
  };

  const paramValidation = engine.validateCalculationParameters('porosity', porosityParams);
  
  if (paramValidation.isValid) {
    console.log('✓ Porosity calculation parameters are valid');
  } else {
    console.log('✗ Invalid porosity parameters');
    paramValidation.errors.forEach(error => {
      console.log(`  Error: ${error.message}`);
    });
  }

  // Demonstrate curve data access
  const grCurve = engine.getCurveData('EXAMPLE-001', 'GR');
  if (grCurve) {
    console.log(`✓ Retrieved GR curve: ${grCurve.data.length} data points`);
    
    // Calculate statistics for the curve
    const stats = engine.calculateStatistics(grCurve.data, grCurve.nullValue);
    console.log(`  Mean GR: ${stats.mean.toFixed(2)} ${grCurve.unit}`);
    console.log(`  Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)} ${grCurve.unit}`);
    console.log(`  Data completeness: ${((stats.validCount / stats.count) * 100).toFixed(1)}%`);
  }

  // Demonstrate quality metrics calculation
  const rhobCurve = engine.getCurveData('EXAMPLE-001', 'RHOB');
  const nphiCurve = engine.getCurveData('EXAMPLE-001', 'NPHI');
  
  if (rhobCurve && nphiCurve) {
    const qualityMetrics = engine.calculateQualityMetrics(
      rhobCurve.data,
      nphiCurve.data,
      'porosity',
      porosityParams
    );
    
    console.log('✓ Quality metrics calculated:');
    console.log(`  Data completeness: ${(qualityMetrics.dataCompleteness * 100).toFixed(1)}%`);
    console.log(`  Confidence level: ${qualityMetrics.confidenceLevel}`);
    console.log(`  Uncertainty range: ±${(qualityMetrics.uncertaintyRange[0] * 100).toFixed(1)}% - ±${(qualityMetrics.uncertaintyRange[1] * 100).toFixed(1)}%`);
  }

  // Display engine configuration
  const config = engine.getConfig();
  console.log('Engine configuration:');
  console.log(`  Validation enabled: ${config.enableValidation}`);
  console.log(`  Uncertainty calculation enabled: ${config.enableUncertaintyCalculation}`);
  console.log(`  Data completeness threshold: ${(config.qualityThresholds.dataCompleteness * 100).toFixed(0)}%`);
}

/**
 * Example: Error handling scenarios
 */
export function demonstrateErrorHandling(): void {
  const engine = new PetrophysicsCalculationEngine();

  console.log('Demonstrating error handling scenarios:');

  // Test invalid well data
  const invalidWellData = {
    wellName: '', // Invalid empty name
    wellInfo: {} as WellHeaderInfo,
    curves: [],   // No curves
    depthRange: [1000, 500] as [number, number], // Invalid range
    dataQuality: {} as QualityAssessment,
    lastModified: new Date(),
    version: '1.0',
  };

  const loadResult = engine.loadWellData(invalidWellData);
  console.log(`\n1. Invalid well data validation:`);
  console.log(`   Valid: ${loadResult.isValid}`);
  console.log(`   Errors: ${loadResult.errors.length}`);
  loadResult.errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error.message} (${error.severity})`);
  });

  // Test invalid calculation parameters
  const invalidParams: CalculationParameters = {
    matrixDensity: -1,    // Invalid negative value
    rw: 200,              // Unrealistic high value
    m: 10,                // Outside typical range
  };

  const paramResult = engine.validateCalculationParameters('archie', invalidParams);
  console.log(`\n2. Invalid parameter validation:`);
  console.log(`   Valid: ${paramResult.isValid}`);
  console.log(`   Errors: ${paramResult.errors.length}`);
  console.log(`   Warnings: ${paramResult.warnings.length}`);
  
  paramResult.errors.forEach((error, index) => {
    console.log(`   Error ${index + 1}: ${error.message}`);
  });
  
  paramResult.warnings.forEach((warning, index) => {
    console.log(`   Warning ${index + 1}: ${warning.message}`);
  });
}

// Export functions for use in other modules
export { PetrophysicsCalculationEngine };
export type {
  WellLogData,
  CalculationParameters,
  CalculationResult,
  QualityMetrics,
} from '../../types/petrophysics';