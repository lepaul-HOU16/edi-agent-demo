import { LASExporter, LASExportOptions } from '../LASExporter';
import { WellLogData, CalculationResults, StatisticalSummary, QualityMetrics } from '../../../types/petrophysics';

describe('LASExporter', () => {
  let exporter: LASExporter;
  let mockWellData: WellLogData;
  let mockCalculations: CalculationResults[];

  beforeEach(() => {
    exporter = new LASExporter();

    // Create mock well data
    mockWellData = {
      wellName: 'TEST-001',
      wellInfo: {
        wellName: 'TEST-001',
        field: 'Test Field',
        operator: 'Test Operator',
        location: { latitude: 30.123456, longitude: -95.654321 },
        elevation: 100,
        totalDepth: 10000
      },
      curves: [
        {
          name: 'GR',
          unit: 'API',
          description: 'Gamma Ray',
          data: [45, 50, 55, 60, 65],
          nullValue: -999.25,
          quality: {
            dataCompleteness: 0.95,
            environmentalCorrections: ['borehole_correction'],
            uncertaintyRange: [0.02, 0.05],
            confidenceLevel: 'high'
          }
        },
        {
          name: 'RHOB',
          unit: 'G/C3',
          description: 'Bulk Density',
          data: [2.45, 2.40, 2.35, 2.30, 2.25],
          nullValue: -999.25,
          quality: {
            dataCompleteness: 0.98,
            environmentalCorrections: ['mud_correction'],
            uncertaintyRange: [0.01, 0.03],
            confidenceLevel: 'high'
          }
        },
        {
          name: 'NPHI',
          unit: 'V/V',
          description: 'Neutron Porosity',
          data: [0.15, 0.18, 0.20, 0.16, 0.14],
          nullValue: -999.25,
          quality: {
            dataCompleteness: 0.96,
            environmentalCorrections: ['environmental_correction'],
            uncertaintyRange: [0.02, 0.04],
            confidenceLevel: 'high'
          }
        }
      ],
      depthRange: [8000, 8002],
      dataQuality: {
        dataCompleteness: 0.95,
        environmentalCorrections: ['borehole_correction'],
        uncertaintyRange: [0.02, 0.05],
        confidenceLevel: 'high'
      },
      lastModified: new Date()
    };

    // Create mock calculations
    const mockStatistics: StatisticalSummary = {
      mean: 0.15,
      median: 0.14,
      standardDeviation: 0.03,
      min: 0.08,
      max: 0.25,
      percentiles: { '10': 0.10, '50': 0.14, '90': 0.20 }
    };

    const mockQualityMetrics: QualityMetrics = {
      dataCompleteness: 0.95,
      environmentalCorrections: ['borehole_correction'],
      uncertaintyRange: [0.02, 0.05],
      confidenceLevel: 'high'
    };

    mockCalculations = [
      {
        wellName: 'TEST-001',
        calculationType: 'porosity',
        method: 'density_neutron',
        parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
        results: [],
        statistics: mockStatistics,
        qualityMetrics: mockQualityMetrics,
        timestamp: new Date()
      },
      {
        wellName: 'TEST-001',
        calculationType: 'saturation',
        method: 'archie',
        parameters: { rw: 0.1, a: 1.0, m: 2.0, n: 2.0 },
        results: [],
        statistics: { ...mockStatistics, mean: 0.45 },
        qualityMetrics: mockQualityMetrics,
        timestamp: new Date()
      }
    ];
  });

  describe('LAS Export', () => {
    it('should export well data to LAS format with default options', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      expect(lasContent).toContain('~VERSION INFORMATION');
      expect(lasContent).toContain('~WELL INFORMATION');
      expect(lasContent).toContain('~CURVE INFORMATION');
      expect(lasContent).toContain('~ASCII LOG DATA');
      expect(lasContent).toContain('TEST-001');
      expect(lasContent).toContain('DEPT');
      expect(lasContent).toContain('GR');
      expect(lasContent).toContain('RHOB');
      expect(lasContent).toContain('NPHI');
    });

    it('should export with custom options', async () => {
      const customOptions: Partial<LASExportOptions> = {
        version: '3.0',
        includeOriginalCurves: false,
        includeCalculatedCurves: true,
        wrapMode: true,
        depthUnit: 'M',
        stepSize: 1.0
      };

      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations, customOptions);
      
      expect(lasContent).toContain('VERSION 3.0');
      expect(lasContent).toContain('WRAP.                          YES');
      expect(lasContent).toContain('PHIE'); // Calculated porosity curve
      expect(lasContent).toContain('SW');   // Calculated saturation curve
      expect(lasContent).not.toContain('GR'); // Original curve excluded
    });

    it('should include calculated curves with proper mnemonics', async () => {
      const options = { includeCalculatedCurves: true };
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations, options);
      
      expect(lasContent).toContain('PHIE .V/V');
      expect(lasContent).toContain('SW   .V/V');
      expect(lasContent).toContain('porosity (density_neutron)');
      expect(lasContent).toContain('saturation (archie)');
    });

    it('should include calculation parameters', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      expect(lasContent).toContain('~PARAMETER INFORMATION');
      expect(lasContent).toContain('POROSITY_MATRIXDENSITY');
      expect(lasContent).toContain('SATURATION_RW');
      expect(lasContent).toContain('2.65');
      expect(lasContent).toContain('0.1');
    });

    it('should include well location information', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      expect(lasContent).toContain('LAT  .DEG               30.123456');
      expect(lasContent).toContain('LON  .DEG               -95.654321');
      expect(lasContent).toContain('Test Field');
      expect(lasContent).toContain('Test Operator');
    });
  });

  describe('Multiple Wells Export', () => {
    it('should export multiple wells to separate LAS files', async () => {
      const wellsData = [mockWellData];
      const calculationsMap = new Map<string, CalculationResults[]>();
      calculationsMap.set('TEST-001', mockCalculations);

      const results = await exporter.exportMultipleWells(wellsData, calculationsMap);
      
      expect(results.size).toBe(1);
      expect(results.has('TEST-001')).toBe(true);
      
      const lasContent = results.get('TEST-001')!;
      expect(lasContent).toContain('~VERSION INFORMATION');
      expect(lasContent).toContain('TEST-001');
    });

    it('should handle wells without calculations', async () => {
      const wellsData = [mockWellData];
      const calculationsMap = new Map<string, CalculationResults[]>();
      // No calculations for TEST-001

      const results = await exporter.exportMultipleWells(wellsData, calculationsMap);
      
      expect(results.size).toBe(1);
      const lasContent = results.get('TEST-001')!;
      expect(lasContent).toContain('TEST-001');
      expect(lasContent).not.toContain('PHIE'); // No calculated curves
    });
  });

  describe('LAS Structure Validation', () => {
    it('should create proper LAS 2.0 structure', async () => {
      const options = { version: '2.0' as const };
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations, options);
      
      expect(lasContent).toContain('VERS.                          2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0');
      expect(lasContent).toContain('STRT .FT');
      expect(lasContent).toContain('STOP .FT');
      expect(lasContent).toContain('STEP .FT');
      expect(lasContent).toContain('NULL .                  -999.25');
    });

    it('should format curve information section correctly', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      expect(lasContent).toContain('#MNEM.UNIT              API CODES                   CURVE DESCRIPTION');
      expect(lasContent).toContain('DEPT .FT');
      expect(lasContent).toContain('GR   .API');
      expect(lasContent).toContain('RHOB .G/C3');
      expect(lasContent).toContain('NPHI .V/V');
    });

    it('should format data section correctly', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      const lines = lasContent.split('\n');
      const dataStartIndex = lines.findIndex(line => line.includes('~ASCII LOG DATA'));
      expect(dataStartIndex).toBeGreaterThan(-1);
      
      // Check that data follows the header
      const headerLine = lines[dataStartIndex + 1];
      expect(headerLine).toContain('DEPT');
      
      // Check data formatting
      const dataLines = lines.slice(dataStartIndex + 2).filter(line => line.trim() && !line.startsWith('#'));
      expect(dataLines.length).toBeGreaterThan(0);
      
      // Each data line should have values separated by spaces
      dataLines.forEach(line => {
        const values = line.trim().split(/\s+/);
        expect(values.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Options Validation', () => {
    it('should validate export options successfully', () => {
      const validOptions: Partial<LASExportOptions> = {
        version: '2.0',
        depthUnit: 'FT',
        stepSize: 0.5,
        nullValue: -999.25
      };

      const errors = exporter.validateExportOptions(validOptions);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid LAS version', () => {
      const invalidOptions = {
        version: '1.0' as any
      };

      const errors = exporter.validateExportOptions(invalidOptions);
      expect(errors).toContain('Invalid LAS version. Must be 2.0 or 3.0.');
    });

    it('should detect invalid depth unit', () => {
      const invalidOptions = {
        depthUnit: 'CM' as any
      };

      const errors = exporter.validateExportOptions(invalidOptions);
      expect(errors).toContain('Invalid depth unit. Must be M or FT.');
    });

    it('should detect invalid step size', () => {
      const invalidOptions = {
        stepSize: -1
      };

      const errors = exporter.validateExportOptions(invalidOptions);
      expect(errors).toContain('Step size must be greater than 0.');
    });
  });

  describe('Curve Mnemonics and Units', () => {
    it('should use correct mnemonics for calculation types', () => {
      // Access private method for testing
      const getMnemonic = (exporter as any).getCalculationMnemonic.bind(exporter);
      
      expect(getMnemonic('porosity')).toBe('PHIE');
      expect(getMnemonic('saturation')).toBe('SW');
      expect(getMnemonic('shale_volume')).toBe('VSH');
      expect(getMnemonic('permeability')).toBe('PERM');
    });

    it('should use correct units for calculation types', () => {
      const getUnit = (exporter as any).getCalculationUnit.bind(exporter);
      
      expect(getUnit('porosity')).toBe('V/V');
      expect(getUnit('saturation')).toBe('V/V');
      expect(getUnit('shale_volume')).toBe('V/V');
      expect(getUnit('permeability')).toBe('MD');
    });

    it('should use correct parameter units', () => {
      const getParamUnit = (exporter as any).getParameterUnit.bind(exporter);
      
      expect(getParamUnit('matrixDensity')).toBe('G/C3');
      expect(getParamUnit('fluidDensity')).toBe('G/C3');
      expect(getParamUnit('rw')).toBe('OHMM');
      expect(getParamUnit('a')).toBe('');
      expect(getParamUnit('m')).toBe('');
      expect(getParamUnit('n')).toBe('');
    });
  });

  describe('Data Handling', () => {
    it('should handle null values correctly', async () => {
      const wellWithNulls = {
        ...mockWellData,
        curves: [
          {
            ...mockWellData.curves[0],
            data: [45, -999.25, 55, -999.25, 65] // Include null values
          }
        ]
      };

      const lasContent = await exporter.exportToLAS(wellWithNulls, mockCalculations);
      
      expect(lasContent).toContain('-999.25');
      expect(lasContent).toContain('NULL .                  -999.25');
    });

    it('should generate proper depth array', () => {
      const generateDepth = (exporter as any).generateDepthArray.bind(exporter);
      const depths = generateDepth([8000, 8002], 0.5);
      
      expect(depths).toEqual([8000, 8000.5, 8001, 8001.5, 8002]);
    });

    it('should handle empty calculations gracefully', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, []);
      
      expect(lasContent).toContain('~VERSION INFORMATION');
      expect(lasContent).toContain('TEST-001');
      expect(lasContent).not.toContain('PHIE');
      expect(lasContent).not.toContain('~PARAMETER INFORMATION');
    });
  });

  describe('LAS Statistics', () => {
    it('should calculate LAS file statistics correctly', async () => {
      const lasContent = await exporter.exportToLAS(mockWellData, mockCalculations);
      
      // Create a mock LAS file structure for testing
      const mockLASFile = {
        header: { version: '2.0', wrap: false, delimiter: ' ' },
        wellInfo: {
          wellName: 'TEST-001',
          startDepth: 8000,
          stopDepth: 8002,
          step: 0.5,
          nullValue: -999.25
        },
        curves: [
          { mnemonic: 'DEPT', source: 'original' },
          { mnemonic: 'GR', source: 'original' },
          { mnemonic: 'PHIE', source: 'calculated' },
          { mnemonic: 'SW', source: 'calculated' }
        ],
        parameters: [],
        otherInfo: [],
        data: [[8000, 45, 0.15, 0.45], [8000.5, 50, 0.15, 0.45]]
      };

      const stats = exporter.getLASStatistics(mockLASFile as any);
      
      expect(stats.curveCount).toBe(4);
      expect(stats.originalCurves).toBe(2);
      expect(stats.calculatedCurves).toBe(2);
      expect(stats.dataPoints).toBe(2);
      expect(stats.depthRange).toEqual([8000, 8002]);
      expect(stats.stepSize).toBe(0.5);
    });
  });

  describe('Adding Calculated Curves to Existing LAS', () => {
    it('should add calculated curves to existing LAS content', () => {
      const existingLAS = `~VERSION INFORMATION
VERS.                          2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0
~WELL INFORMATION
WELL .                  TEST-001                     : WELL NAME
~CURVE INFORMATION
DEPT .FT                                         : Depth
GR   .API                                        : Gamma Ray
~ASCII LOG DATA
DEPT     GR
8000     45
8001     50`;

      const updatedLAS = exporter.addCalculatedCurvesToLAS(existingLAS, mockCalculations);
      
      expect(updatedLAS).toContain('PHIE .V/V');
      expect(updatedLAS).toContain('SW   .V/V');
      expect(updatedLAS).toContain('porosity (density_neutron)');
      expect(updatedLAS).toContain('saturation (archie)');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing well information gracefully', async () => {
      const incompleteWellData = {
        ...mockWellData,
        wellInfo: {
          ...mockWellData.wellInfo,
          field: undefined,
          location: undefined
        }
      };

      const lasContent = await exporter.exportToLAS(incompleteWellData, mockCalculations);
      
      expect(lasContent).toContain('TEST-001');
      expect(lasContent).not.toContain('FLD  .');
      expect(lasContent).not.toContain('LAT  .');
      expect(lasContent).not.toContain('LON  .');
    });

    it('should handle empty curve data', async () => {
      const emptyWellData = {
        ...mockWellData,
        curves: []
      };

      const lasContent = await exporter.exportToLAS(emptyWellData, mockCalculations);
      
      expect(lasContent).toContain('TEST-001');
      expect(lasContent).toContain('DEPT'); // Depth curve should always be present
      expect(lasContent).toContain('PHIE'); // Calculated curves should still be added
    });
  });
});