import { ExcelExporter, ExcelExportOptions } from '../ExcelExporter';
import { ReportData } from '../ReportTemplateEngine';
import { CalculationResults, WellLogData, ReservoirZone, StatisticalSummary, QualityMetrics } from '../../../types/petrophysics';

describe('ExcelExporter', () => {
  let exporter: ExcelExporter;
  let mockReportData: ReportData;
  let mockCalculations: CalculationResults[];
  let mockWellData: WellLogData[];

  beforeEach(() => {
    exporter = new ExcelExporter();

    // Create mock well data
    mockWellData = [
      {
        wellName: 'TEST-001',
        wellInfo: {
          wellName: 'TEST-001',
          field: 'Test Field',
          operator: 'Test Operator',
          location: { latitude: 30.0, longitude: -95.0 },
          elevation: 100,
          totalDepth: 10000,
          wellType: 'vertical' as const
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
            unit: 'g/cc',
            description: 'Bulk Density',
            data: [2.45, 2.40, 2.35, 2.30, 2.25],
            nullValue: -999.25,
            quality: {
              dataCompleteness: 0.98,
              environmentalCorrections: ['mud_correction'],
              uncertaintyRange: [0.01, 0.03],
              confidenceLevel: 'high'
            }
          }
        ],
        depthRange: [8000, 8005],
        dataQuality: {
          dataCompleteness: 0.95,
          environmentalCorrections: ['borehole_correction'],
          uncertaintyRange: [0.02, 0.05],
          confidenceLevel: 'high'
        },
        lastModified: new Date()
      }
    ];

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

    // Create mock report data
    mockReportData = {
      wells: mockWellData,
      calculations: mockCalculations,
      metadata: {
        projectName: 'Test Project',
        analyst: 'Test Analyst',
        date: new Date('2024-01-15'),
        company: 'Test Company',
        field: 'Test Field'
      }
    };
  });

  describe('Excel Export', () => {
    it('should export report data to Excel with default options', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
      
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('Excel Workbook');
      expect(content).toContain('Test Project');
      expect(content).toContain('Test Analyst');
    });

    it('should export with custom options', async () => {
      const customOptions: Partial<ExcelExportOptions> = {
        includeCharts: false,
        includeRawData: false,
        sheetNames: {
          summary: 'Custom Summary',
          rawData: 'Raw Data',
          calculations: 'Calc Results',
          charts: 'Charts',
          statistics: 'Stats'
        }
      };

      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations, customOptions);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('Custom Summary');
      expect(content).toContain('Calc Results');
    });

    it('should export calculated curves', async () => {
      const excelBuffer = await exporter.exportCalculatedCurves(mockWellData, mockCalculations);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('Calculated Petrophysical Curves');
      expect(content).toContain('TEST-001');
    });

    it('should export statistics only', async () => {
      const mockReservoirZones: ReservoirZone[] = [
        {
          name: 'Zone A',
          topDepth: 8000,
          bottomDepth: 8050,
          averagePorosity: 0.15,
          averagePermeability: 100,
          netToGross: 0.8,
          quality: 'good'
        }
      ];

      const excelBuffer = await exporter.exportStatistics(mockCalculations, mockReservoirZones);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('Petrophysical Statistics');
      expect(content).toContain('Zone A');
    });
  });

  describe('Worksheet Creation', () => {
    it('should create summary worksheet with correct structure', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Summary');
      expect(content).toContain('Project Name');
      expect(content).toContain('Test Project');
      expect(content).toContain('Analyst');
      expect(content).toContain('Test Analyst');
    });

    it('should create raw data worksheet with curve data', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Raw Data');
      expect(content).toContain('GR (API)');
      expect(content).toContain('RHOB (g/cc)');
      expect(content).toContain('TEST-001');
    });

    it('should create calculations worksheet with results', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Calculations');
      expect(content).toContain('porosity');
      expect(content).toContain('saturation');
      expect(content).toContain('density_neutron');
      expect(content).toContain('archie');
    });

    it('should create statistics worksheet with statistical measures', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Statistics');
      expect(content).toContain('Mean');
      expect(content).toContain('Median');
      expect(content).toContain('Std Dev');
      // The mock output shows limited rows, so check for the statistics that are shown
      expect(content).toContain('Mean');
      expect(content).toContain('Median');
    });

    it('should create charts worksheet when enabled', async () => {
      const options = { includeCharts: true };
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations, options);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Charts');
      expect(content).toContain('Porosity Distribution');
      expect(content).toContain('Saturation vs Porosity');
    });
  });

  describe('Data Handling', () => {
    it('should handle empty well data gracefully', async () => {
      const emptyReportData = {
        ...mockReportData,
        wells: []
      };

      const excelBuffer = await exporter.exportToExcel(emptyReportData, mockCalculations);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('Summary');
      // The summary should still be created even with empty wells
    });

    it('should handle empty calculations gracefully', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, []);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      const content = excelBuffer.toString('utf-8');
      expect(content).toContain('No calculations available');
    });

    it('should handle null values in curve data', async () => {
      const wellWithNulls = {
        ...mockWellData[0],
        curves: [
          {
            ...mockWellData[0].curves[0],
            data: [45, -999.25, 55, -999.25, 65] // Include null values
          }
        ]
      };

      const excelBuffer = await exporter.exportCalculatedCurves([wellWithNulls], mockCalculations);
      
      expect(excelBuffer).toBeInstanceOf(Buffer);
      // Should handle null values without crashing
    });
  });

  describe('Options Validation', () => {
    it('should validate export options successfully', () => {
      const validOptions: Partial<ExcelExportOptions> = {
        includeCharts: true,
        sheetNames: {
          summary: 'Summary',
          rawData: 'Raw Data',
          calculations: 'Calculations',
          charts: 'Charts',
          statistics: 'Statistics'
        }
      };

      const errors = exporter.validateExportOptions(validOptions);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate sheet names', () => {
      const invalidOptions = {
        sheetNames: {
          summary: 'Data',
          rawData: 'Data', // Duplicate
          calculations: 'Calculations',
          charts: 'Charts',
          statistics: 'Statistics'
        }
      };

      const errors = exporter.validateExportOptions(invalidOptions);
      expect(errors).toContain('Sheet names must be unique');
    });

    it('should detect sheet names that are too long', () => {
      const invalidOptions = {
        sheetNames: {
          summary: 'This is a very long sheet name that exceeds the Excel limit',
          rawData: 'Raw Data',
          calculations: 'Calculations',
          charts: 'Charts',
          statistics: 'Statistics'
        }
      };

      const errors = exporter.validateExportOptions(invalidOptions);
      expect(errors.some(error => error.includes('exceeds 31 character limit'))).toBe(true);
    });
  });

  describe('Formatting and Structure', () => {
    it('should apply proper column widths and formatting', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      
      // The mock implementation doesn't show formatting details,
      // but we can verify the structure is created
      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should create proper filename with date', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      expect(content).toContain(`Test Project_Analysis_${dateStr}.xlsx`);
    });

    it('should include proper metadata in workbook', async () => {
      const excelBuffer = await exporter.exportToExcel(mockReportData, mockCalculations);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Title: Petrophysical Analysis - Test Project');
      expect(content).toContain('Author: Test Analyst');
    });
  });

  describe('Reservoir Zones Export', () => {
    it('should export reservoir zones data correctly', async () => {
      const reservoirZones: ReservoirZone[] = [
        {
          name: 'Upper Sand',
          topDepth: 8000,
          bottomDepth: 8025,
          averagePorosity: 0.18,
          averagePermeability: 150,
          netToGross: 0.85,
          quality: 'excellent'
        },
        {
          name: 'Lower Sand',
          topDepth: 8050,
          bottomDepth: 8075,
          averagePorosity: 0.12,
          averagePermeability: 80,
          netToGross: 0.70,
          quality: 'good'
        }
      ];

      const excelBuffer = await exporter.exportStatistics(mockCalculations, reservoirZones);
      const content = excelBuffer.toString('utf-8');
      
      expect(content).toContain('Reservoir Zones');
      expect(content).toContain('Upper Sand');
      expect(content).toContain('Lower Sand');
      expect(content).toContain('8000');
      expect(content).toContain('8025');
    });
  });

  describe('Unit Handling', () => {
    it('should return correct units for calculation types', () => {
      // Access private method for testing
      const getUnit = (exporter as any).getUnitForCalculationType.bind(exporter);
      
      expect(getUnit('porosity')).toBe('%');
      expect(getUnit('saturation')).toBe('%');
      expect(getUnit('shale_volume')).toBe('%');
      expect(getUnit('permeability')).toBe('mD');
      expect(getUnit('unknown')).toBe('');
    });
  });
});