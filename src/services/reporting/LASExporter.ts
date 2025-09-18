import { WellLogData, CalculationResults } from '../../types/petrophysics';

export interface LASExportOptions {
  version: '2.0' | '3.0';
  includeOriginalCurves: boolean;
  includeCalculatedCurves: boolean;
  includeQualityFlags: boolean;
  wrapMode: boolean;
  nullValue: number;
  stepSize?: number;
  depthUnit: 'M' | 'FT';
  encoding: 'ASCII' | 'UTF-8';
}

export interface LASHeader {
  version: string;
  wrap: boolean;
  delimiter: string;
}

export interface LASWellInfo {
  wellName: string;
  field?: string;
  company?: string;
  operator?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    utmX?: number;
    utmY?: number;
  };
  elevation?: number;
  totalDepth?: number;
  startDepth: number;
  stopDepth: number;
  step: number;
  nullValue: number;
  wellId?: string;
  api?: string;
  county?: string;
  state?: string;
  country?: string;
  serviceCompany?: string;
  date?: Date;
}

export interface LASCurveInfo {
  mnemonic: string;
  unit: string;
  description: string;
  apiCode?: string;
  data: number[];
  nullValue: number;
  quality?: 'good' | 'fair' | 'poor';
  source?: 'original' | 'calculated';
  method?: string;
}

export interface LASParameterInfo {
  mnemonic: string;
  unit: string;
  value: string | number;
  description: string;
}

export interface LASFile {
  header: LASHeader;
  wellInfo: LASWellInfo;
  curves: LASCurveInfo[];
  parameters: LASParameterInfo[];
  otherInfo: string[];
  data: number[][];
}

export class LASExporter {
  private defaultOptions: LASExportOptions = {
    version: '2.0',
    includeOriginalCurves: true,
    includeCalculatedCurves: true,
    includeQualityFlags: false,
    wrapMode: false,
    nullValue: -999.25,
    depthUnit: 'FT',
    encoding: 'ASCII'
  };

  /**
   * Export well data and calculations to LAS format
   */
  async exportToLAS(
    wellData: WellLogData,
    calculations: CalculationResults[],
    options: Partial<LASExportOptions> = {}
  ): Promise<string> {
    const exportOptions = { ...this.defaultOptions, ...options };
    const lasFile = this.createLASFile(wellData, calculations, exportOptions);
    
    return this.generateLASContent(lasFile, exportOptions);
  }

  /**
   * Export multiple wells to separate LAS files
   */
  async exportMultipleWells(
    wellsData: WellLogData[],
    calculationsMap: Map<string, CalculationResults[]>,
    options: Partial<LASExportOptions> = {}
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const wellData of wellsData) {
      const wellCalculations = calculationsMap.get(wellData.wellName) || [];
      const lasContent = await this.exportToLAS(wellData, wellCalculations, options);
      results.set(wellData.wellName, lasContent);
    }
    
    return results;
  }

  /**
   * Add calculated curves to existing LAS content
   */
  addCalculatedCurvesToLAS(
    existingLAS: string,
    calculations: CalculationResults[],
    options: Partial<LASExportOptions> = {}
  ): string {
    const exportOptions = { ...this.defaultOptions, ...options };
    
    // Parse existing LAS (simplified implementation)
    const sections = this.parseLASSections(existingLAS);
    
    // Add calculated curves to curve information section
    const calculatedCurves = this.createCalculatedCurveInfo(calculations, exportOptions);
    sections.curveInfo = sections.curveInfo + '\n' + calculatedCurves;
    
    // Add calculated data columns (simplified - would need proper depth matching)
    const calculatedData = this.createCalculatedDataColumns(calculations, exportOptions);
    sections.data = this.mergeDataColumns(sections.data, calculatedData);
    
    return this.reconstructLAS(sections, exportOptions);
  }

  /**
   * Create LAS file structure from well data and calculations
   */
  private createLASFile(
    wellData: WellLogData,
    calculations: CalculationResults[],
    options: LASExportOptions
  ): LASFile {
    const curves: LASCurveInfo[] = [];
    const parameters: LASParameterInfo[] = [];
    
    // Add depth curve first
    curves.push({
      mnemonic: 'DEPT',
      unit: options.depthUnit,
      description: 'Depth',
      data: this.generateDepthArray(wellData.depthRange, options.stepSize || 0.5),
      nullValue: options.nullValue,
      source: 'original'
    });

    // Add original curves if requested
    if (options.includeOriginalCurves) {
      wellData.curves.forEach(curve => {
        curves.push({
          mnemonic: curve.name,
          unit: curve.unit,
          description: curve.description,
          data: curve.data,
          nullValue: curve.nullValue,
          source: 'original'
        });
      });
    }

    // Add calculated curves if requested
    if (options.includeCalculatedCurves) {
      calculations.forEach(calc => {
        const curveMnemonic = this.getCalculationMnemonic(calc.calculationType);
        curves.push({
          mnemonic: curveMnemonic,
          unit: this.getCalculationUnit(calc.calculationType),
          description: `${calc.calculationType} (${calc.method})`,
          data: this.generateCalculatedData(calc, wellData.depthRange, options.stepSize || 0.5),
          nullValue: options.nullValue,
          source: 'calculated',
          method: calc.method
        });
      });
    }

    // Add calculation parameters
    calculations.forEach(calc => {
      Object.entries(calc.parameters).forEach(([key, value]) => {
        parameters.push({
          mnemonic: `${calc.calculationType.toUpperCase()}_${key.toUpperCase()}`,
          unit: this.getParameterUnit(key),
          value: value,
          description: `${calc.calculationType} calculation parameter: ${key}`
        });
      });
    });

    // Create data matrix
    const data = this.createDataMatrix(curves);

    return {
      header: {
        version: options.version,
        wrap: options.wrapMode,
        delimiter: ' '
      },
      wellInfo: {
        wellName: wellData.wellName,
        field: wellData.wellInfo.field,
        company: wellData.wellInfo.operator,
        operator: wellData.wellInfo.operator,
        location: {
          latitude: wellData.wellInfo.location?.latitude,
          longitude: wellData.wellInfo.location?.longitude
        },
        elevation: wellData.wellInfo.elevation,
        totalDepth: wellData.wellInfo.totalDepth,
        startDepth: wellData.depthRange[0],
        stopDepth: wellData.depthRange[1],
        step: options.stepSize || 0.5,
        nullValue: options.nullValue
      },
      curves,
      parameters,
      otherInfo: [
        'Generated by Professional Petrophysical Analysis System',
        `Export Date: ${new Date().toISOString()}`,
        `Original Curves: ${options.includeOriginalCurves ? 'Yes' : 'No'}`,
        `Calculated Curves: ${options.includeCalculatedCurves ? 'Yes' : 'No'}`,
        `Calculations: ${calculations.map(c => `${c.calculationType}(${c.method})`).join(', ')}`
      ],
      data
    };
  }

  /**
   * Generate LAS file content
   */
  private generateLASContent(lasFile: LASFile, options: LASExportOptions): string {
    let content = '';

    // Version section
    content += '~VERSION INFORMATION\n';
    content += `VERS.                          ${lasFile.header.version} : CWLS LOG ASCII STANDARD - VERSION ${lasFile.header.version}\n`;
    content += `WRAP.                          ${lasFile.header.wrap ? 'YES' : 'NO'} : ONE LINE PER DEPTH STEP\n`;
    content += `DLM .                          SPACE : COLUMN DATA SEPARATOR\n`;

    // Well information section
    content += '~WELL INFORMATION\n';
    content += `#MNEM.UNIT              DATA                       DESCRIPTION\n`;
    content += `#----- -----            ----------               -------------------------\n`;
    content += `STRT .${lasFile.wellInfo.startDepth >= 0 ? 'FT' : 'M'}              ${lasFile.wellInfo.startDepth.toFixed(2)}                     : START DEPTH\n`;
    content += `STOP .${lasFile.wellInfo.stopDepth >= 0 ? 'FT' : 'M'}              ${lasFile.wellInfo.stopDepth.toFixed(2)}                     : STOP DEPTH\n`;
    content += `STEP .${lasFile.wellInfo.step >= 0 ? 'FT' : 'M'}              ${lasFile.wellInfo.step.toFixed(2)}                       : STEP\n`;
    content += `NULL .                  ${lasFile.wellInfo.nullValue}                   : NULL VALUE\n`;
    content += `WELL .                  ${lasFile.wellInfo.wellName}                     : WELL NAME\n`;
    
    if (lasFile.wellInfo.field) {
      content += `FLD  .                  ${lasFile.wellInfo.field}                     : FIELD\n`;
    }
    if (lasFile.wellInfo.company) {
      content += `COMP .                  ${lasFile.wellInfo.company}                     : COMPANY\n`;
    }
    if (lasFile.wellInfo.location?.latitude && lasFile.wellInfo.location?.longitude) {
      content += `LAT  .DEG               ${lasFile.wellInfo.location.latitude.toFixed(6)}                 : LATITUDE\n`;
      content += `LON  .DEG               ${lasFile.wellInfo.location.longitude.toFixed(6)}                 : LONGITUDE\n`;
    }

    // Curve information section
    content += '~CURVE INFORMATION\n';
    content += `#MNEM.UNIT              API CODES                   CURVE DESCRIPTION\n`;
    content += `#----- -----            ----------               -------------------------\n`;
    
    lasFile.curves.forEach(curve => {
      const apiCode = curve.apiCode || '';
      content += `${curve.mnemonic.padEnd(5)}.${curve.unit.padEnd(15)} ${apiCode.padEnd(25)} : ${curve.description}\n`;
    });

    // Parameter information section
    if (lasFile.parameters.length > 0) {
      content += '~PARAMETER INFORMATION\n';
      content += `#MNEM.UNIT              VALUE                       DESCRIPTION\n`;
      content += `#----- -----            ----------               -------------------------\n`;
      
      lasFile.parameters.forEach(param => {
        content += `${param.mnemonic.padEnd(5)}.${param.unit.padEnd(15)} ${String(param.value).padEnd(25)} : ${param.description}\n`;
      });
    }

    // Other information section
    if (lasFile.otherInfo.length > 0) {
      content += '~OTHER INFORMATION\n';
      lasFile.otherInfo.forEach(info => {
        content += `# ${info}\n`;
      });
    }

    // ASCII data section
    content += '~ASCII LOG DATA\n';
    
    // Add curve headers
    const curveHeaders = lasFile.curves.map(c => c.mnemonic).join('     ');
    content += `${curveHeaders}\n`;
    
    // Add data rows
    lasFile.data.forEach(row => {
      const formattedRow = row.map(value => {
        if (value === null || value === undefined || value === lasFile.wellInfo.nullValue) {
          return lasFile.wellInfo.nullValue.toFixed(2);
        }
        return value.toFixed(3);
      }).join('     ');
      content += `${formattedRow}\n`;
    });

    return content;
  }

  /**
   * Generate depth array for given range and step
   */
  private generateDepthArray(depthRange: [number, number], step: number): number[] {
    const depths: number[] = [];
    for (let depth = depthRange[0]; depth <= depthRange[1]; depth += step) {
      depths.push(depth);
    }
    return depths;
  }

  /**
   * Generate calculated data array for given depth range
   */
  private generateCalculatedData(
    calculation: CalculationResults,
    depthRange: [number, number],
    step: number
  ): number[] {
    const depthCount = Math.floor((depthRange[1] - depthRange[0]) / step) + 1;
    const data: number[] = [];
    
    // Simplified: use mean value for all depths
    // In a real implementation, this would use actual depth-indexed results
    for (let i = 0; i < depthCount; i++) {
      data.push(calculation.statistics.mean);
    }
    
    return data;
  }

  /**
   * Create data matrix from curves
   */
  private createDataMatrix(curves: LASCurveInfo[]): number[][] {
    if (curves.length === 0) return [];
    
    const maxLength = Math.max(...curves.map(c => c.data.length));
    const data: number[][] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const row: number[] = [];
      curves.forEach(curve => {
        const value = i < curve.data.length ? curve.data[i] : curve.nullValue;
        row.push(value);
      });
      data.push(row);
    }
    
    return data;
  }

  /**
   * Get standard mnemonic for calculation type
   */
  private getCalculationMnemonic(calculationType: string): string {
    switch (calculationType.toLowerCase()) {
      case 'porosity':
        return 'PHIE';
      case 'saturation':
        return 'SW';
      case 'shale_volume':
        return 'VSH';
      case 'permeability':
        return 'PERM';
      default:
        return calculationType.toUpperCase().substring(0, 4);
    }
  }

  /**
   * Get unit for calculation type
   */
  private getCalculationUnit(calculationType: string): string {
    switch (calculationType.toLowerCase()) {
      case 'porosity':
        return 'V/V';
      case 'saturation':
        return 'V/V';
      case 'shale_volume':
        return 'V/V';
      case 'permeability':
        return 'MD';
      default:
        return '';
    }
  }

  /**
   * Get unit for parameter
   */
  private getParameterUnit(parameterName: string): string {
    switch (parameterName.toLowerCase()) {
      case 'matrixdensity':
      case 'fluiddensity':
        return 'G/C3';
      case 'rw':
        return 'OHMM';
      case 'a':
      case 'm':
      case 'n':
        return '';
      default:
        return '';
    }
  }

  /**
   * Parse LAS sections (simplified implementation)
   */
  private parseLASSections(lasContent: string): {
    version: string;
    wellInfo: string;
    curveInfo: string;
    parameters: string;
    other: string;
    data: string;
  } {
    const sections = {
      version: '',
      wellInfo: '',
      curveInfo: '',
      parameters: '',
      other: '',
      data: ''
    };

    const lines = lasContent.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      if (line.startsWith('~VERSION')) {
        currentSection = 'version';
      } else if (line.startsWith('~WELL')) {
        currentSection = 'wellInfo';
      } else if (line.startsWith('~CURVE')) {
        currentSection = 'curveInfo';
      } else if (line.startsWith('~PARAMETER')) {
        currentSection = 'parameters';
      } else if (line.startsWith('~OTHER')) {
        currentSection = 'other';
      } else if (line.startsWith('~ASCII')) {
        currentSection = 'data';
      } else if (currentSection) {
        sections[currentSection as keyof typeof sections] += line + '\n';
      }
    });

    return sections;
  }

  /**
   * Create calculated curve information section
   */
  private createCalculatedCurveInfo(
    calculations: CalculationResults[],
    options: LASExportOptions
  ): string {
    let curveInfo = '';
    
    calculations.forEach(calc => {
      const mnemonic = this.getCalculationMnemonic(calc.calculationType);
      const unit = this.getCalculationUnit(calc.calculationType);
      const description = `${calc.calculationType} (${calc.method})`;
      
      curveInfo += `${mnemonic.padEnd(5)}.${unit.padEnd(15)} ${''.padEnd(25)} : ${description}\n`;
    });
    
    return curveInfo;
  }

  /**
   * Create calculated data columns
   */
  private createCalculatedDataColumns(
    calculations: CalculationResults[],
    options: LASExportOptions
  ): number[][] {
    // Simplified implementation - would need proper depth indexing
    const columns: number[][] = [];
    
    calculations.forEach(calc => {
      const column = Array(100).fill(calc.statistics.mean); // Mock data
      columns.push(column);
    });
    
    return columns;
  }

  /**
   * Merge data columns
   */
  private mergeDataColumns(existingData: string, newColumns: number[][]): string {
    // Simplified implementation for merging columns
    const lines = existingData.trim().split('\n');
    let mergedData = '';
    
    lines.forEach((line, index) => {
      if (line.trim() && !line.startsWith('#')) {
        let newLine = line;
        newColumns.forEach(column => {
          if (index < column.length) {
            newLine += `     ${column[index].toFixed(3)}`;
          }
        });
        mergedData += newLine + '\n';
      } else {
        mergedData += line + '\n';
      }
    });
    
    return mergedData;
  }

  /**
   * Reconstruct LAS file from sections
   */
  private reconstructLAS(
    sections: {
      version: string;
      wellInfo: string;
      curveInfo: string;
      parameters: string;
      other: string;
      data: string;
    },
    options: LASExportOptions
  ): string {
    let content = '';
    
    content += '~VERSION INFORMATION\n' + sections.version;
    content += '~WELL INFORMATION\n' + sections.wellInfo;
    content += '~CURVE INFORMATION\n' + sections.curveInfo;
    
    if (sections.parameters.trim()) {
      content += '~PARAMETER INFORMATION\n' + sections.parameters;
    }
    
    if (sections.other.trim()) {
      content += '~OTHER INFORMATION\n' + sections.other;
    }
    
    content += '~ASCII LOG DATA\n' + sections.data;
    
    return content;
  }

  /**
   * Validate LAS export options
   */
  validateExportOptions(options: Partial<LASExportOptions>): string[] {
    const errors: string[] = [];

    if (options.version && !['2.0', '3.0'].includes(options.version)) {
      errors.push('Invalid LAS version. Must be 2.0 or 3.0.');
    }

    if (options.depthUnit && !['M', 'FT'].includes(options.depthUnit)) {
      errors.push('Invalid depth unit. Must be M or FT.');
    }

    if (options.stepSize && options.stepSize <= 0) {
      errors.push('Step size must be greater than 0.');
    }

    if (options.nullValue === undefined || options.nullValue === null) {
      errors.push('Null value must be specified.');
    }

    return errors;
  }

  /**
   * Get LAS file statistics
   */
  getLASStatistics(lasFile: LASFile): {
    curveCount: number;
    originalCurves: number;
    calculatedCurves: number;
    dataPoints: number;
    depthRange: [number, number];
    stepSize: number;
  } {
    const originalCurves = lasFile.curves.filter(c => c.source === 'original').length;
    const calculatedCurves = lasFile.curves.filter(c => c.source === 'calculated').length;
    
    return {
      curveCount: lasFile.curves.length,
      originalCurves,
      calculatedCurves,
      dataPoints: lasFile.data.length,
      depthRange: [lasFile.wellInfo.startDepth, lasFile.wellInfo.stopDepth],
      stepSize: lasFile.wellInfo.step
    };
  }
}