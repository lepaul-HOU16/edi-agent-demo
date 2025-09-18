/**
 * Petrophysical Analysis Tools for Lambda MCP Server
 * Cloud-native tools that integrate with S3 and use TypeScript calculation engines
 * No LangChain dependencies - pure MCP server integration
 */

import { z } from "zod";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { PorosityCalculator } from "../../../src/services/calculators/porosityCalculator";
import { ShaleVolumeCalculator } from "../../../src/services/calculators/shaleVolumeCalculator";
import { SaturationCalculator } from "../../../src/services/calculators/saturationCalculator";
import { PermeabilityCalculator } from "../../../src/services/calculators/permeabilityCalculator";
import { QualityControlCalculator } from "../../../src/services/calculators/qualityControlCalculator";
import { UncertaintyAnalysisCalculator } from "../../../src/services/calculators/uncertaintyAnalysisCalculator";
import { WellLogData, LogCurve, CalculationParameters } from "../../../src/types/petrophysics";

// MCP Tool interface (without LangChain dependency)
interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  func: (args: any) => Promise<string>;
}

// Initialize S3 client and calculation engines
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const porosityCalculator = new PorosityCalculator();
const shaleVolumeCalculator = new ShaleVolumeCalculator();
const saturationCalculator = new SaturationCalculator();
const permeabilityCalculator = new PermeabilityCalculator();
const qualityControlCalculator = new QualityControlCalculator();
const uncertaintyAnalysisCalculator = new UncertaintyAnalysisCalculator();

// S3 bucket configuration
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
const WELL_DATA_PREFIX = 'global/well-data/';

/**
 * Simple LAS file parser for cloud deployment
 */
class CloudLASParser {
  private wellInfo: { [key: string]: string } = {};
  private curves: { [key: string]: number[] } = {};
  private curveInfo: { [key: string]: { unit: string; description: string } } = {};

  constructor(private content: string) {
    this.parse();
  }

  private parse(): void {
    const lines = this.content.split('\n');
    let section = '';
    const curveNames: string[] = [];
    let asciiLineCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('~')) {
        section = trimmedLine.substring(1).split(/\s+/)[0].toUpperCase();
        continue;
      }

      if (section === 'WELL' && trimmedLine.includes('.') && trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':', 2);
        if (parts.length === 2) {
          const key = parts[0].split('.')[0].trim();
          const value = parts[1].trim();
          this.wellInfo[key] = value;
        }
      }

      if (section === 'CURVE' && trimmedLine.includes('.') && trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':', 2);
        if (parts.length === 2) {
          const curvePart = parts[0].trim();
          const description = parts[1].trim();
          const curveMatch = curvePart.match(/^(\w+)\.(\w+)/);

          if (curveMatch) {
            const curveName = curveMatch[1];
            const unit = curveMatch[2];
            curveNames.push(curveName);
            this.curveInfo[curveName] = { unit, description };
            this.curves[curveName] = [];
          }
        }
      }

      if (section === 'ASCII' && trimmedLine && !trimmedLine.startsWith('#')) {
        asciiLineCount++;
        try {
          const values = trimmedLine.split(/\s+/).map(v => parseFloat(v));
          if (values.length >= curveNames.length) {
            // Use only the first N values that match our curve names
            curveNames.forEach((name, i) => {
              // Allow NaN values (they represent null/missing data in LAS files)
              this.curves[name].push(values[i]);
            });
          } else {
            console.log(`ASCII line ${asciiLineCount}: Expected at least ${curveNames.length} values, got ${values.length}: "${trimmedLine}"`);
          }
        } catch (error) {
          console.log(`ASCII line ${asciiLineCount} parse error:`, error.message);
        }
      }
    }

    console.log(`LAS Parse Summary: Found ${curveNames.length} curves, processed ${asciiLineCount} ASCII lines`);
    curveNames.forEach(name => {
      console.log(`  ${name}: ${this.curves[name].length} data points`);
    });
  }

  getWellInfo(): { [key: string]: string } {
    return this.wellInfo;
  }

  getCurves(): { [key: string]: number[] } {
    return this.curves;
  }

  getCurveInfo(): { [key: string]: { unit: string; description: string } } {
    return this.curveInfo;
  }

  getAvailableCurves(): string[] {
    return Object.keys(this.curves);
  }

  toWellLogData(wellName: string): WellLogData {
    const curves: LogCurve[] = Object.entries(this.curves).map(([name, data]) => ({
      name,
      displayName: name,
      data,
      unit: this.curveInfo[name]?.unit || '',
      description: this.curveInfo[name]?.description || '',
      color: this.getDefaultColor(name),
      lineWidth: 2,
      scale: this.getDefaultScale(name)
    }));

    const depths = this.curves['DEPT'] || this.curves['DEPTH'] || [];
    const depthRange: [number, number] = depths.length > 0
      ? [Math.min(...depths), Math.max(...depths)]
      : [0, 0];

    return {
      wellName,
      wellInfo: {
        wellName,
        field: this.wellInfo['FIELD'] || 'Unknown',
        operator: this.wellInfo['COMP'] || 'Unknown',
        wellType: 'vertical',
        location: { latitude: 0, longitude: 0 },
        elevation: parseFloat(this.wellInfo['ELEV'] || '0'),
        totalDepth: parseFloat(this.wellInfo['TD'] || '0'),
        spudDate: new Date()
      },
      curves,
      depthRange,
      dataQuality: {
        overallQuality: 'good',
        completeness: 0.95,
        dataCompleteness: 0.95,
        issues: [],
        recommendations: []
      },
      lastModified: new Date()
    };
  }

  private getDefaultColor(curveName: string): string {
    const colorMap: { [key: string]: string } = {
      'GR': '#2E7D32',
      'RHOB': '#1976D2',
      'NPHI': '#F57C00',
      'RT': '#D32F2F',
      'DEPT': '#424242',
      'DEPTH': '#424242'
    };
    return colorMap[curveName] || '#666666';
  }

  private getDefaultScale(curveName: string): [number, number] {
    const scaleMap: { [key: string]: [number, number] } = {
      'GR': [0, 150],
      'RHOB': [1.5, 3.0],
      'NPHI': [0.6, -0.1],
      'RT': [0.1, 1000]
    };
    return scaleMap[curveName] || [0, 100];
  }
}

/**
 * List all available wells from S3
 */
export const listWellsTool: MCPTool = {
  name: "list_wells",
  description: "List all available wells from S3 storage",
  inputSchema: z.object({
    prefix: z.string().optional().describe("Optional prefix to filter wells")
  }),
  func: async ({ prefix = "" }) => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: WELL_DATA_PREFIX + prefix,
        Delimiter: '/'
      });

      const response = await s3Client.send(command);
      const wells: string[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith('.las')) {
            const wellName = object.Key.replace(WELL_DATA_PREFIX, '').replace('.las', '');
            wells.push(wellName);
          }
        }
      }

      return JSON.stringify({
        success: true,
        wells,
        count: wells.length,
        bucket: S3_BUCKET,
        prefix: WELL_DATA_PREFIX + prefix
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to list wells: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wells: []
      });
    }
  }
};

/**
 * Get well information and available curves
 */
export const getWellInfoTool: MCPTool = {
  name: "get_well_info",
  description: "Get well header information and available curves from S3",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well (without .las extension)")
  }),
  func: async ({ wellName }) => {
    try {
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);

      return JSON.stringify({
        success: true,
        wellName,
        wellInfo: parser.getWellInfo(),
        availableCurves: parser.getAvailableCurves(),
        curveInfo: parser.getCurveInfo()
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to get well info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName
      });
    }
  }
};

/**
 * Get curve data for specific depth range
 */
export const getCurveDataTool: MCPTool = {
  name: "get_curve_data",
  description: "Get curve data for specific curves and depth range from S3",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    curves: z.array(z.string()).describe("Array of curve names to retrieve"),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, curves, depthStart, depthEnd }) => {
    try {
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const allCurves = parser.getCurves();

      // Get depth data
      const depths = allCurves['DEPT'] || allCurves['DEPTH'] || [];
      const result: { [key: string]: number[] } = { depths };

      // Filter by depth range if specified
      let filteredIndices: number[] = [];
      if (depthStart !== undefined || depthEnd !== undefined) {
        filteredIndices = depths.map((depth, index) => {
          const inRange = (depthStart === undefined || depth >= depthStart) &&
            (depthEnd === undefined || depth <= depthEnd);
          return inRange ? index : -1;
        }).filter(index => index !== -1);

        result.depths = filteredIndices.map(i => depths[i]);
      }

      // Get requested curves
      for (const curveName of curves) {
        if (allCurves[curveName]) {
          if (filteredIndices.length > 0) {
            result[curveName] = filteredIndices.map(i => allCurves[curveName][i]);
          } else {
            result[curveName] = allCurves[curveName];
          }
        }
      }

      return JSON.stringify({
        success: true,
        wellName,
        data: result,
        depthRange: depthStart !== undefined || depthEnd !== undefined
          ? [depthStart, depthEnd]
          : [Math.min(...depths), Math.max(...depths)]
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Failed to get curve data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName
      });
    }
  }
};

/**
 * Calculate porosity using various methods
 */
export const calculatePorosityTool: MCPTool = {
  name: "calculate_porosity",
  description: "Calculate porosity using density, neutron, or effective porosity methods",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    method: z.enum(["density", "neutron", "effective"]).describe("Porosity calculation method"),
    parameters: z.object({
      matrixDensity: z.number().optional().describe("Matrix density (g/cc), default 2.65"),
      fluidDensity: z.number().optional().describe("Fluid density (g/cc), default 1.0")
    }).optional(),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, method, parameters = {}, depthStart, depthEnd }) => {
    try {
      // Load well data
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.toWellLogData(wellName);

      // Set up calculation parameters
      const calcParams: CalculationParameters = {
        matrixDensity: parameters.matrixDensity || 2.65,
        fluidDensity: parameters.fluidDensity || 1.0,
        a: 1.0,
        m: 2.0,
        n: 2.0,
        rw: 0.1,
        grClean: 30,
        grShale: 120
      };

      // Filter by depth range if specified
      let filteredWellData = wellData;
      if (depthStart !== undefined && depthEnd !== undefined) {
        const depthCurve = wellData.curves.find(c => c.name === 'DEPT' || c.name === 'DEPTH');
        if (depthCurve) {
          const validIndices = depthCurve.data.map((depth, index) =>
            depth >= depthStart && depth <= depthEnd ? index : -1
          ).filter(index => index !== -1);

          filteredWellData = {
            ...wellData,
            curves: wellData.curves.map(curve => ({
              ...curve,
              data: validIndices.map(i => curve.data[i])
            }))
          };
        }
      }

      // Calculate porosity
      let values: number[] = [];
      let methodology = '';

      switch (method) {
        case 'density':
          const rhobData = filteredWellData.curves.find(c => c.name === 'RHOB')?.data || [];
          // Check if RHOB data needs scaling (if values are > 10, likely in different units)
          const scaledRhobData = rhobData.map(rhob => {
            if (rhob === -999.25 || isNaN(rhob) || !isFinite(rhob)) return rhob;
            // If RHOB values are > 10, assume they need scaling (divide by ~50)
            return rhob > 10 ? rhob / 50 : rhob;
          });
          values = porosityCalculator.calculateDensityPorosity(scaledRhobData, calcParams);
          methodology = `Density Porosity: φD = (${calcParams.matrixDensity} - RHOB_scaled) / (${calcParams.matrixDensity} - ${calcParams.fluidDensity}) [RHOB scaled if > 10]`;
          break;
        case 'neutron':
          const nphiData = filteredWellData.curves.find(c => c.name === 'NPHI')?.data || [];
          values = nphiData.map(nphi => {
            if (nphi === -999.25 || isNaN(nphi) || !isFinite(nphi)) return -999.25;
            // Check if NPHI is already in decimal form (values around 0-3) or percentage (0-100)
            if (nphi > 3) {
              // Assume percentage form, convert to decimal
              if (nphi < 0 || nphi > 100) return -999.25;
              return nphi / 100;
            } else {
              // Assume already in decimal form (0-1 range, but allow up to 3 for high porosity)
              if (nphi < 0 || nphi > 3) return -999.25;
              return nphi;
            }
          });
          methodology = 'Neutron Porosity: φN = NPHI (auto-detected units)';
          break;
        case 'effective':
          const rhobDataEff = filteredWellData.curves.find(c => c.name === 'RHOB')?.data || [];
          const nphiDataEff = filteredWellData.curves.find(c => c.name === 'NPHI')?.data || [];
          // Scale RHOB data if needed
          const scaledRhobDataEff = rhobDataEff.map(rhob => {
            if (rhob === -999.25 || isNaN(rhob) || !isFinite(rhob)) return rhob;
            return rhob > 10 ? rhob / 50 : rhob;
          });
          const densityPhi = porosityCalculator.calculateDensityPorosity(scaledRhobDataEff, calcParams);
          const neutronPhi = nphiDataEff.map(nphi => {
            if (nphi === -999.25 || isNaN(nphi) || !isFinite(nphi)) return -999.25;
            // Auto-detect NPHI units
            if (nphi > 3) {
              if (nphi < 0 || nphi > 100) return -999.25;
              return nphi / 100;
            } else {
              if (nphi < 0 || nphi > 3) return -999.25;
              return nphi;
            }
          });

          // Calculate effective porosity as average of density and neutron
          values = densityPhi.map((dphi, i) => {
            const nphi = neutronPhi[i];
            if (dphi === -999.25 || nphi === -999.25) return -999.25;
            return (dphi + nphi) / 2;
          });
          methodology = `Effective Porosity: φE = (φD + φN) / 2 [auto-scaled units]`;
          break;
        default:
          throw new Error(`Unknown porosity method: ${method}`);
      }

      // Calculate basic statistics
      const validValues = values.filter(v => v !== -999.25 && !isNaN(v) && isFinite(v));
      let statistics: any;
      let quality: any;

      if (validValues.length > 0) {
        const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
        const standardDeviation = Math.sqrt(variance);

        statistics = {
          mean: Number(mean.toFixed(4)),
          standardDeviation: Number(standardDeviation.toFixed(4)),
          min: Number(Math.min(...validValues).toFixed(4)),
          max: Number(Math.max(...validValues).toFixed(4)),
          count: values.length,
          validCount: validValues.length
        };
      } else {
        statistics = {
          mean: null,
          standardDeviation: null,
          min: null,
          max: null,
          count: values.length,
          validCount: 0
        };
      }

      // Calculate quality metrics
      const dataCompleteness = values.length > 0 ? validValues.length / values.length : 0;
      quality = {
        qualityFlag: dataCompleteness > 0.9 ? 'good' : dataCompleteness > 0.7 ? 'fair' : 'poor',
        dataCompleteness: Number(dataCompleteness.toFixed(3)),
        confidenceLevel: dataCompleteness > 0.9 ? 'high' : dataCompleteness > 0.7 ? 'medium' : 'low'
      };

      return JSON.stringify({
        success: true,
        wellName,
        method,
        parameters: calcParams,
        result: {
          values,
          statistics,
          quality,
          methodology
        },
        depthRange: depthStart !== undefined && depthEnd !== undefined ? [depthStart, depthEnd] : undefined
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Porosity calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName,
        method
      });
    }
  }
};

/**
 * Calculate shale volume using various methods
 */
export const calculateShaleVolumeTool: MCPTool = {
  name: "calculate_shale_volume",
  description: "Calculate shale volume using gamma ray methods (Larionov, Clavier, Linear)",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    method: z.enum(["larionov_tertiary", "larionov_pre_tertiary", "clavier", "linear"]).describe("Shale volume calculation method"),
    parameters: z.object({
      grClean: z.number().optional().describe("Clean sand GR value (API), default 30"),
      grShale: z.number().optional().describe("Shale GR value (API), default 120")
    }).optional(),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, method, parameters = {}, depthStart, depthEnd }) => {
    try {
      // Load well data
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.toWellLogData(wellName);

      // Set up calculation parameters
      const calcParams: CalculationParameters = {
        matrixDensity: 2.65,
        fluidDensity: 1.0,
        a: 1.0,
        m: 2.0,
        n: 2.0,
        rw: 0.1,
        grClean: parameters.grClean || 30,
        grShale: parameters.grShale || 120
      };

      // Get GR data
      const grCurve = wellData.curves.find(c => c.name === 'GR');
      if (!grCurve) {
        throw new Error('GR curve not found in well data');
      }

      let grData = grCurve.data;

      // Filter by depth range if specified
      if (depthStart !== undefined && depthEnd !== undefined) {
        const depthCurve = wellData.curves.find(c => c.name === 'DEPT' || c.name === 'DEPTH');
        if (depthCurve) {
          const validIndices = depthCurve.data.map((depth, index) =>
            depth >= depthStart && depth <= depthEnd ? index : -1
          ).filter(index => index !== -1);
          grData = validIndices.map(i => grCurve.data[i]);
        }
      }

      // Calculate shale volume
      let result;
      switch (method) {
        case 'larionov_tertiary':
          result = shaleVolumeCalculator.calculateLarionov(grData, calcParams.grClean, calcParams.grShale, 'tertiary');
          break;
        case 'larionov_pre_tertiary':
          result = shaleVolumeCalculator.calculateLarionov(grData, calcParams.grClean, calcParams.grShale, 'pre_tertiary');
          break;
        case 'clavier':
          result = shaleVolumeCalculator.calculateClavier(grData, calcParams.grClean, calcParams.grShale);
          break;
        case 'linear':
          result = shaleVolumeCalculator.calculateLinear(grData, calcParams.grClean, calcParams.grShale);
          break;
        default:
          throw new Error(`Unknown shale volume method: ${method}`);
      }

      return JSON.stringify({
        success: true,
        wellName,
        method,
        parameters: calcParams,
        result: {
          values: result.values,
          statistics: result.statistics,
          quality: result.quality,
          methodology: result.methodology
        },
        depthRange: depthStart !== undefined && depthEnd !== undefined ? [depthStart, depthEnd] : undefined
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Shale volume calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName,
        method
      });
    }
  }
};

/**
 * Calculate water saturation using Archie equation
 */
export const calculateSaturationTool: MCPTool = {
  name: "calculate_saturation",
  description: "Calculate water saturation using Archie equation",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    method: z.enum(["archie"]).describe("Water saturation calculation method"),
    parameters: z.object({
      rw: z.number().optional().describe("Formation water resistivity (ohm-m), default 0.1"),
      a: z.number().optional().describe("Tortuosity factor, default 1.0"),
      m: z.number().optional().describe("Cementation exponent, default 2.0"),
      n: z.number().optional().describe("Saturation exponent, default 2.0"),
      matrixDensity: z.number().optional().describe("Matrix density for porosity calc (g/cc), default 2.65"),
      fluidDensity: z.number().optional().describe("Fluid density for porosity calc (g/cc), default 1.0")
    }).optional(),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, method, parameters = {}, depthStart, depthEnd }) => {
    try {
      // Load well data
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.toWellLogData(wellName);

      // Set up calculation parameters
      const calcParams: CalculationParameters = {
        matrixDensity: parameters.matrixDensity || 2.65,
        fluidDensity: parameters.fluidDensity || 1.0,
        a: parameters.a || 1.0,
        m: parameters.m || 2.0,
        n: parameters.n || 2.0,
        rw: parameters.rw || 0.1,
        grClean: 30,
        grShale: 120
      };

      // Get required curves
      const rtCurve = wellData.curves.find(c => c.name === 'RT');
      const rhobCurve = wellData.curves.find(c => c.name === 'RHOB');

      if (!rtCurve) {
        throw new Error('RT curve not found in well data');
      }
      if (!rhobCurve) {
        throw new Error('RHOB curve not found in well data');
      }

      let rtData = rtCurve.data;
      let rhobData = rhobCurve.data;

      // Filter by depth range if specified
      if (depthStart !== undefined && depthEnd !== undefined) {
        const depthCurve = wellData.curves.find(c => c.name === 'DEPT' || c.name === 'DEPTH');
        if (depthCurve) {
          const validIndices = depthCurve.data.map((depth, index) =>
            depth >= depthStart && depth <= depthEnd ? index : -1
          ).filter(index => index !== -1);
          rtData = validIndices.map(i => rtCurve.data[i]);
          rhobData = validIndices.map(i => rhobCurve.data[i]);
        }
      }

      // Calculate porosity first (needed for saturation)
      const porosityResult = porosityCalculator.calculateDensityPorosity(
        rhobData,
        calcParams.matrixDensity,
        calcParams.fluidDensity
      );

      // Calculate saturation
      const result = saturationCalculator.calculateArchie(
        rtData,
        porosityResult.values,
        calcParams.rw,
        calcParams.a,
        calcParams.m,
        calcParams.n
      );

      return JSON.stringify({
        success: true,
        wellName,
        method,
        parameters: calcParams,
        result: {
          values: result.values,
          statistics: result.statistics,
          quality: result.quality,
          methodology: result.methodology
        },
        porosity: {
          values: porosityResult.values,
          statistics: porosityResult.statistics
        },
        depthRange: depthStart !== undefined && depthEnd !== undefined ? [depthStart, depthEnd] : undefined
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Saturation calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName,
        method
      });
    }
  }
};

/**
 * Assess data quality for a well
 */
export const assessDataQualityTool: MCPTool = {
  name: "assess_data_quality",
  description: "Assess data quality for well log curves including completeness and outliers",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    curves: z.array(z.string()).optional().describe("Specific curves to assess (optional, defaults to all)"),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, curves, depthStart, depthEnd }) => {
    try {
      // Load well data
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.toWellLogData(wellName);

      // Determine which curves to assess
      const curvesToAssess = curves || wellData.curves.map(c => c.name);
      const qualityResults: { [key: string]: any } = {};

      for (const curveName of curvesToAssess) {
        const curve = wellData.curves.find(c => c.name === curveName);
        if (!curve) {
          qualityResults[curveName] = {
            error: `Curve ${curveName} not found`
          };
          continue;
        }

        let curveData = curve.data;

        // Filter by depth range if specified
        if (depthStart !== undefined && depthEnd !== undefined) {
          const depthCurve = wellData.curves.find(c => c.name === 'DEPT' || c.name === 'DEPTH');
          if (depthCurve) {
            const validIndices = depthCurve.data.map((depth, index) =>
              depth >= depthStart && depth <= depthEnd ? index : -1
            ).filter(index => index !== -1);
            curveData = validIndices.map(i => curve.data[i]);
          }
        }

        // Assess quality
        const qualityResult = qualityControlCalculator.assessCurveQuality(curveName, curveData);
        qualityResults[curveName] = {
          completeness: qualityResult.completeness,
          outlierPercentage: qualityResult.outlierPercentage,
          noiseLevel: qualityResult.noiseLevel,
          qualityFlag: qualityResult.qualityFlag,
          issues: qualityResult.issues,
          recommendations: qualityResult.recommendations,
          statistics: qualityResult.statistics
        };
      }

      return JSON.stringify({
        success: true,
        wellName,
        qualityAssessment: qualityResults,
        assessedCurves: curvesToAssess,
        depthRange: depthStart !== undefined && depthEnd !== undefined ? [depthStart, depthEnd] : undefined
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Data quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName
      });
    }
  }
};

/**
 * Perform uncertainty analysis on calculations
 */
export const performUncertaintyAnalysisTool: MCPTool = {
  name: "perform_uncertainty_analysis",
  description: "Perform Monte Carlo uncertainty analysis on petrophysical calculations",
  inputSchema: z.object({
    wellName: z.string().describe("Name of the well"),
    calculationType: z.enum(["porosity", "saturation", "shale_volume"]).describe("Type of calculation to analyze"),
    parameters: z.object({
      iterations: z.number().optional().describe("Number of Monte Carlo iterations, default 1000"),
      confidenceLevel: z.number().optional().describe("Confidence level (0-1), default 0.95")
    }).optional(),
    depthStart: z.number().optional().describe("Start depth (optional)"),
    depthEnd: z.number().optional().describe("End depth (optional)")
  }),
  func: async ({ wellName, calculationType, parameters = {}, depthStart, depthEnd }) => {
    try {
      // Load well data
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new Error('No data received from S3');
      }

      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.toWellLogData(wellName);

      const iterations = parameters.iterations || 1000;
      const confidenceLevel = parameters.confidenceLevel || 0.95;

      // Filter by depth range if specified
      let filteredWellData = wellData;
      if (depthStart !== undefined && depthEnd !== undefined) {
        const depthCurve = wellData.curves.find(c => c.name === 'DEPT' || c.name === 'DEPTH');
        if (depthCurve) {
          const validIndices = depthCurve.data.map((depth, index) =>
            depth >= depthStart && depth <= depthEnd ? index : -1
          ).filter(index => index !== -1);

          filteredWellData = {
            ...wellData,
            curves: wellData.curves.map(curve => ({
              ...curve,
              data: validIndices.map(i => curve.data[i])
            }))
          };
        }
      }

      // Perform uncertainty analysis based on calculation type
      let result;
      switch (calculationType) {
        case 'porosity':
          const rhobData = filteredWellData.curves.find(c => c.name === 'RHOB')?.data || [];
          result = uncertaintyAnalysisCalculator.analyzePorosityUncertainty(
            rhobData,
            { matrixDensity: 2.65, fluidDensity: 1.0 },
            { iterations, confidenceLevel }
          );
          break;
        case 'saturation':
          const rtData = filteredWellData.curves.find(c => c.name === 'RT')?.data || [];
          const rhobDataSat = filteredWellData.curves.find(c => c.name === 'RHOB')?.data || [];
          result = uncertaintyAnalysisCalculator.analyzeSaturationUncertainty(
            rtData,
            rhobDataSat,
            { rw: 0.1, a: 1.0, m: 2.0, n: 2.0, matrixDensity: 2.65, fluidDensity: 1.0 },
            { iterations, confidenceLevel }
          );
          break;
        case 'shale_volume':
          const grData = filteredWellData.curves.find(c => c.name === 'GR')?.data || [];
          result = uncertaintyAnalysisCalculator.analyzeShaleVolumeUncertainty(
            grData,
            { grClean: 30, grShale: 120 },
            { iterations, confidenceLevel }
          );
          break;
        default:
          throw new Error(`Unknown calculation type: ${calculationType}`);
      }

      return JSON.stringify({
        success: true,
        wellName,
        calculationType,
        parameters: { iterations, confidenceLevel },
        result: {
          mean: result.mean,
          standardDeviation: result.standardDeviation,
          confidenceInterval: result.confidenceInterval,
          percentiles: result.percentiles,
          methodology: result.methodology
        },
        depthRange: depthStart !== undefined && depthEnd !== undefined ? [depthStart, depthEnd] : undefined
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Uncertainty analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        wellName,
        calculationType
      });
    }
  }
};

// Export all petrophysical tools
export const petrophysicsTools: MCPTool[] = [
  listWellsTool,
  getWellInfoTool,
  getCurveDataTool,
  calculatePorosityTool,
  calculateShaleVolumeTool,
  calculateSaturationTool,
  assessDataQualityTool,
  performUncertaintyAnalysisTool
];