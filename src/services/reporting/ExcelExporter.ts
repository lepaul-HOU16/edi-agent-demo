import { CalculationResults, WellLogData, ReservoirZone, CompletionTarget } from '../../types/petrophysics';
import { ReportData } from './ReportTemplateEngine';

export interface ExcelExportOptions {
  includeCharts: boolean;
  includeRawData: boolean;
  includeCalculations: boolean;
  includeSummary: boolean;
  sheetNames: {
    summary: string;
    rawData: string;
    calculations: string;
    charts: string;
    statistics: string;
  };
  formatting: ExcelFormatting;
}

export interface ExcelFormatting {
  headerStyle: {
    backgroundColor: string;
    fontColor: string;
    fontSize: number;
    bold: boolean;
  };
  dataStyle: {
    fontSize: number;
    numberFormat: string;
  };
  chartColors: string[];
}

export interface ExcelWorksheet {
  name: string;
  data: any[][];
  headers: string[];
  formatting?: WorksheetFormatting;
  charts?: ExcelChart[];
}

export interface WorksheetFormatting {
  columnWidths: number[];
  headerRow: number;
  freezePanes?: { row: number; column: number };
  conditionalFormatting?: ConditionalFormat[];
}

export interface ConditionalFormat {
  range: string;
  condition: 'greater_than' | 'less_than' | 'between' | 'color_scale';
  value?: number;
  minValue?: number;
  maxValue?: number;
  format: {
    backgroundColor?: string;
    fontColor?: string;
  };
}

export interface ExcelChart {
  type: 'line' | 'scatter' | 'bar' | 'histogram';
  title: string;
  xAxis: {
    title: string;
    dataRange: string;
  };
  yAxis: {
    title: string;
    dataRange: string;
  };
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
}

export interface ExcelWorkbook {
  filename: string;
  worksheets: ExcelWorksheet[];
  metadata: {
    title: string;
    author: string;
    company?: string;
    subject: string;
    createdAt: Date;
  };
}

export class ExcelExporter {
  private defaultOptions: ExcelExportOptions = {
    includeCharts: true,
    includeRawData: true,
    includeCalculations: true,
    includeSummary: true,
    sheetNames: {
      summary: 'Summary',
      rawData: 'Raw Data',
      calculations: 'Calculations',
      charts: 'Charts',
      statistics: 'Statistics'
    },
    formatting: {
      headerStyle: {
        backgroundColor: '#4472C4',
        fontColor: '#FFFFFF',
        fontSize: 12,
        bold: true
      },
      dataStyle: {
        fontSize: 10,
        numberFormat: '0.000'
      },
      chartColors: ['#4472C4', '#E70000', '#70AD47', '#FFC000', '#7030A0']
    }
  };

  /**
   * Export report data to Excel workbook
   */
  async exportToExcel(
    reportData: ReportData,
    calculations: CalculationResults[],
    options: Partial<ExcelExportOptions> = {}
  ): Promise<Buffer> {
    const exportOptions = { ...this.defaultOptions, ...options };
    const workbook = this.createWorkbook(reportData, calculations, exportOptions);
    
    return this.generateExcelBuffer(workbook);
  }

  /**
   * Export calculated curves to Excel
   */
  async exportCalculatedCurves(
    wellData: WellLogData[],
    calculations: CalculationResults[],
    options: Partial<ExcelExportOptions> = {}
  ): Promise<Buffer> {
    const exportOptions = { ...this.defaultOptions, ...options };
    const workbook = this.createCurveWorkbook(wellData, calculations, exportOptions);
    
    return this.generateExcelBuffer(workbook);
  }

  /**
   * Export statistical summary to Excel
   */
  async exportStatistics(
    calculations: CalculationResults[],
    reservoirZones?: ReservoirZone[],
    options: Partial<ExcelExportOptions> = {}
  ): Promise<Buffer> {
    const exportOptions = { ...this.defaultOptions, ...options };
    const workbook = this.createStatisticsWorkbook(calculations, reservoirZones, exportOptions);
    
    return this.generateExcelBuffer(workbook);
  }

  /**
   * Create complete workbook from report data
   */
  private createWorkbook(
    reportData: ReportData,
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorkbook {
    const worksheets: ExcelWorksheet[] = [];

    // Summary worksheet
    if (options.includeSummary) {
      worksheets.push(this.createSummaryWorksheet(reportData, calculations, options));
    }

    // Raw data worksheet
    if (options.includeRawData && reportData.wells.length > 0) {
      worksheets.push(this.createRawDataWorksheet(reportData.wells, options));
    }

    // Calculations worksheet
    if (options.includeCalculations && calculations.length > 0) {
      worksheets.push(this.createCalculationsWorksheet(calculations, options));
    }

    // Statistics worksheet
    worksheets.push(this.createStatisticsWorksheet(calculations, options));

    // Charts worksheet
    if (options.includeCharts) {
      worksheets.push(this.createChartsWorksheet(calculations, options));
    }

    return {
      filename: `${reportData.metadata.projectName}_Analysis_${this.formatDate(new Date())}.xlsx`,
      worksheets,
      metadata: {
        title: `Petrophysical Analysis - ${reportData.metadata.projectName}`,
        author: reportData.metadata.analyst,
        company: reportData.metadata.company,
        subject: 'Petrophysical Analysis Results',
        createdAt: new Date()
      }
    };
  }

  /**
   * Create summary worksheet
   */
  private createSummaryWorksheet(
    reportData: ReportData,
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Property', 'Value', 'Unit', 'Notes'];
    const data: any[][] = [];

    // Project information
    data.push(['Project Name', reportData.metadata.projectName, '', '']);
    data.push(['Analyst', reportData.metadata.analyst, '', '']);
    data.push(['Date', reportData.metadata.date.toLocaleDateString(), '', '']);
    data.push(['Company', reportData.metadata.company || 'N/A', '', '']);
    data.push(['Field', reportData.metadata.field || 'N/A', '', '']);
    data.push(['', '', '', '']); // Empty row

    // Well information
    data.push(['Well Count', reportData.wells.length.toString(), 'wells', '']);
    if (reportData.wells.length > 0) {
      const wellNames = reportData.wells.map(w => w.wellName).join(', ');
      data.push(['Well Names', wellNames, '', '']);
    }
    data.push(['', '', '', '']); // Empty row

    // Calculation summary
    data.push(['Calculation Summary', '', '', '']);
    calculations.forEach(calc => {
      data.push([
        `${calc.calculationType} (${calc.method})`,
        calc.statistics.mean.toFixed(3),
        this.getUnitForCalculationType(calc.calculationType),
        `Well: ${calc.wellName}`
      ]);
    });

    return {
      name: options.sheetNames.summary,
      headers,
      data,
      formatting: {
        columnWidths: [25, 20, 10, 30],
        headerRow: 1,
        freezePanes: { row: 2, column: 1 }
      }
    };
  }

  /**
   * Create raw data worksheet
   */
  private createRawDataWorksheet(
    wells: WellLogData[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    if (wells.length === 0) {
      return {
        name: options.sheetNames.rawData,
        headers: ['No Data'],
        data: [['No well data available']]
      };
    }

    // Use first well as template for structure
    const firstWell = wells[0];
    const headers = ['Well', 'Depth', ...firstWell.curves.map(c => `${c.name} (${c.unit})`)];
    const data: any[][] = [];

    wells.forEach(well => {
      const depthCount = well.curves.length > 0 ? well.curves[0].data.length : 0;
      
      for (let i = 0; i < depthCount; i++) {
        const depth = well.depthRange[0] + i; // Simplified depth calculation
        const row = [well.wellName, depth];
        
        well.curves.forEach(curve => {
          const value = curve.data[i];
          row.push(value !== curve.nullValue ? value : null);
        });
        
        data.push(row);
      }
    });

    return {
      name: options.sheetNames.rawData,
      headers,
      data,
      formatting: {
        columnWidths: [15, 10, ...Array(firstWell.curves.length).fill(12)],
        headerRow: 1,
        freezePanes: { row: 2, column: 3 }
      }
    };
  }

  /**
   * Create calculations worksheet
   */
  private createCalculationsWorksheet(
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Well', 'Calculation Type', 'Method', 'Mean', 'Std Dev', 'Min', 'Max', 'Quality'];
    const data: any[][] = [];

    calculations.forEach(calc => {
      data.push([
        calc.wellName,
        calc.calculationType,
        calc.method,
        calc.statistics.mean,
        calc.statistics.standardDeviation,
        calc.statistics.min,
        calc.statistics.max,
        calc.qualityMetrics.confidenceLevel
      ]);
    });

    return {
      name: options.sheetNames.calculations,
      headers,
      data,
      formatting: {
        columnWidths: [15, 15, 15, 10, 10, 10, 10, 10],
        headerRow: 1,
        freezePanes: { row: 2, column: 1 },
        conditionalFormatting: [
          {
            range: 'H2:H1000', // Quality column
            condition: 'color_scale',
            format: { backgroundColor: '#FF0000' }
          }
        ]
      }
    };
  }

  /**
   * Create statistics worksheet
   */
  private createStatisticsWorksheet(
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Statistic', ...calculations.map(c => `${c.calculationType} (${c.wellName})`)];
    const data: any[][] = [];

    if (calculations.length === 0) {
      return {
        name: options.sheetNames.statistics,
        headers: ['No Data'],
        data: [['No calculations available']]
      };
    }

    // Statistical measures
    const stats = ['Mean', 'Median', 'Std Dev', 'Min', 'Max', 'P10', 'P50', 'P90'];
    
    stats.forEach(statName => {
      const row = [statName];
      calculations.forEach(calc => {
        switch (statName) {
          case 'Mean':
            row.push(calc.statistics.mean);
            break;
          case 'Median':
            row.push(calc.statistics.median);
            break;
          case 'Std Dev':
            row.push(calc.statistics.standardDeviation);
            break;
          case 'Min':
            row.push(calc.statistics.min);
            break;
          case 'Max':
            row.push(calc.statistics.max);
            break;
          case 'P10':
            row.push(calc.statistics.percentiles['10'] || 0);
            break;
          case 'P50':
            row.push(calc.statistics.percentiles['50'] || calc.statistics.median);
            break;
          case 'P90':
            row.push(calc.statistics.percentiles['90'] || 0);
            break;
          default:
            row.push(0);
        }
      });
      data.push(row);
    });

    return {
      name: options.sheetNames.statistics,
      headers,
      data,
      formatting: {
        columnWidths: [15, ...Array(calculations.length).fill(15)],
        headerRow: 1,
        freezePanes: { row: 2, column: 2 }
      }
    };
  }

  /**
   * Create charts worksheet
   */
  private createChartsWorksheet(
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Chart Type', 'Description', 'Data Range'];
    const data: any[][] = [];

    // Chart descriptions
    data.push(['Porosity Distribution', 'Histogram of porosity values', 'Statistics!B2:B9']);
    data.push(['Saturation vs Porosity', 'Crossplot of saturation vs porosity', 'Calculations!D2:E1000']);
    data.push(['Quality Metrics', 'Bar chart of quality metrics by well', 'Calculations!A2:H1000']);

    const charts: ExcelChart[] = [
      {
        type: 'histogram',
        title: 'Porosity Distribution',
        xAxis: { title: 'Porosity (%)', dataRange: 'Statistics!B2:B9' },
        yAxis: { title: 'Frequency', dataRange: 'Statistics!B2:B9' },
        position: { row: 5, column: 1, width: 400, height: 300 }
      },
      {
        type: 'scatter',
        title: 'Saturation vs Porosity',
        xAxis: { title: 'Porosity (%)', dataRange: 'Calculations!D2:D1000' },
        yAxis: { title: 'Water Saturation (%)', dataRange: 'Calculations!E2:E1000' },
        position: { row: 5, column: 6, width: 400, height: 300 }
      }
    ];

    return {
      name: options.sheetNames.charts,
      headers,
      data,
      charts,
      formatting: {
        columnWidths: [20, 30, 20],
        headerRow: 1
      }
    };
  }

  /**
   * Create workbook for calculated curves
   */
  private createCurveWorkbook(
    wellData: WellLogData[],
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorkbook {
    const worksheets: ExcelWorksheet[] = [];

    wellData.forEach(well => {
      const wellCalculations = calculations.filter(c => c.wellName === well.wellName);
      worksheets.push(this.createWellCurveWorksheet(well, wellCalculations, options));
    });

    return {
      filename: `Calculated_Curves_${this.formatDate(new Date())}.xlsx`,
      worksheets,
      metadata: {
        title: 'Calculated Petrophysical Curves',
        author: 'Petrophysical Analysis System',
        subject: 'Calculated curve data export',
        createdAt: new Date()
      }
    };
  }

  /**
   * Create worksheet for individual well curves
   */
  private createWellCurveWorksheet(
    well: WellLogData,
    calculations: CalculationResults[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Depth', ...well.curves.map(c => c.name), ...calculations.map(c => c.calculationType)];
    const data: any[][] = [];

    // Simplified curve data export
    const depthCount = well.curves.length > 0 ? well.curves[0].data.length : 0;
    
    for (let i = 0; i < depthCount; i++) {
      const depth = well.depthRange[0] + i;
      const row = [depth];
      
      // Add original curve data
      well.curves.forEach(curve => {
        const value = curve.data[i];
        row.push(value !== curve.nullValue ? value : null);
      });
      
      // Add calculated values (simplified - would need actual depth-indexed results)
      calculations.forEach(calc => {
        row.push(calc.statistics.mean); // Placeholder
      });
      
      data.push(row);
    }

    return {
      name: well.wellName.substring(0, 31), // Excel sheet name limit
      headers,
      data,
      formatting: {
        columnWidths: [10, ...Array(headers.length - 1).fill(12)],
        headerRow: 1,
        freezePanes: { row: 2, column: 2 }
      }
    };
  }

  /**
   * Create statistics-only workbook
   */
  private createStatisticsWorkbook(
    calculations: CalculationResults[],
    reservoirZones?: ReservoirZone[],
    options: ExcelExportOptions
  ): ExcelWorkbook {
    const worksheets: ExcelWorksheet[] = [];
    
    worksheets.push(this.createStatisticsWorksheet(calculations, options));
    
    if (reservoirZones && reservoirZones.length > 0) {
      worksheets.push(this.createReservoirZonesWorksheet(reservoirZones, options));
    }

    return {
      filename: `Statistics_${this.formatDate(new Date())}.xlsx`,
      worksheets,
      metadata: {
        title: 'Petrophysical Statistics',
        author: 'Petrophysical Analysis System',
        subject: 'Statistical analysis results',
        createdAt: new Date()
      }
    };
  }

  /**
   * Create reservoir zones worksheet
   */
  private createReservoirZonesWorksheet(
    reservoirZones: ReservoirZone[],
    options: ExcelExportOptions
  ): ExcelWorksheet {
    const headers = ['Zone Name', 'Top Depth', 'Bottom Depth', 'Thickness', 'Avg Porosity', 'Avg Permeability', 'Net/Gross', 'Quality'];
    const data: any[][] = [];

    reservoirZones.forEach(zone => {
      data.push([
        zone.name,
        zone.topDepth,
        zone.bottomDepth,
        zone.bottomDepth - zone.topDepth,
        zone.averagePorosity,
        zone.averagePermeability,
        zone.netToGross,
        zone.quality
      ]);
    });

    return {
      name: 'Reservoir Zones',
      headers,
      data,
      formatting: {
        columnWidths: [20, 12, 12, 12, 12, 15, 12, 12],
        headerRow: 1,
        freezePanes: { row: 2, column: 1 }
      }
    };
  }

  /**
   * Generate Excel buffer (mock implementation)
   */
  private async generateExcelBuffer(workbook: ExcelWorkbook): Promise<Buffer> {
    // In a real implementation, this would use a library like ExcelJS or xlsx
    // For now, create a mock Excel-like structure
    
    const excelContent = this.createMockExcelContent(workbook);
    return Buffer.from(excelContent, 'utf-8');
  }

  /**
   * Create mock Excel content for testing
   */
  private createMockExcelContent(workbook: ExcelWorkbook): string {
    let content = `Excel Workbook: ${workbook.filename}\n`;
    content += `Title: ${workbook.metadata.title}\n`;
    content += `Author: ${workbook.metadata.author}\n`;
    content += `Created: ${workbook.metadata.createdAt.toISOString()}\n\n`;

    workbook.worksheets.forEach(worksheet => {
      content += `Worksheet: ${worksheet.name}\n`;
      content += `Headers: ${worksheet.headers.join('\t')}\n`;
      
      worksheet.data.forEach((row, index) => {
        if (index < 5) { // Limit output for testing
          content += `${row.join('\t')}\n`;
        }
      });
      
      content += `... (${worksheet.data.length} total rows)\n\n`;
    });

    return content;
  }

  /**
   * Get unit for calculation type
   */
  private getUnitForCalculationType(calculationType: string): string {
    switch (calculationType.toLowerCase()) {
      case 'porosity':
        return '%';
      case 'saturation':
        return '%';
      case 'shale_volume':
        return '%';
      case 'permeability':
        return 'mD';
      default:
        return '';
    }
  }

  /**
   * Format date for filename
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Validate export options
   */
  validateExportOptions(options: Partial<ExcelExportOptions>): string[] {
    const errors: string[] = [];

    if (options.sheetNames) {
      const names = Object.values(options.sheetNames);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        errors.push('Sheet names must be unique');
      }

      names.forEach(name => {
        if (name.length > 31) {
          errors.push(`Sheet name "${name}" exceeds 31 character limit`);
        }
      });
    }

    return errors;
  }
}