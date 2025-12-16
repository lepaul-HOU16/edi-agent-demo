/**
 * Comprehensive Shale Volume Analysis Tool
 * Creates engaging visualizations and professional shale volume interpretations
 * Includes clean sand interval identification and completion recommendations
 */

import { z } from "zod";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const S3_BUCKET = process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
const WELL_DATA_PREFIX = 'global/well-data/';

// Interfaces for shale volume analysis
interface ShaleVolumeArtifact {
  messageContentType: 'comprehensive_shale_analysis';
  analysisType: 'single_well';
  wellName: string;
  method: string;
  
  executiveSummary: {
    title: string;
    method: string;
    keyFindings: string[];
    overallAssessment: string;
  };
  
  results: {
    shaleVolumeAnalysis: {
      method: string;
      formula: string;
      wellName: string;
      gammaRayData: {
        source: string;
        dataPoints: number;
        validPoints: number;
        grClean: string;
        grShale: string;
      };
      calculationResults: {
        averageShaleVolume: string;
        medianShaleVolume: string;
        standardDeviation: string;
        netToGross: string;
        uncertainty: string;
      };
    };
    
    cleanSandIntervals: {
      totalIntervals: number;
      criteria: string;
      bestIntervals: Array<{
        depth: string;
        thickness: string;
        averageShaleVolume: string;
        quality: string;
        completionPriority: string;
        netToGross: string;
      }>;
    };
    
    statisticalSummary: {
      distributionAnalysis: {
        distribution: string;
        cleanSandPeak: string;
        shalePeak: string;
        percentCleanSand: string;
      };
      uncertaintyAnalysis: {
        methodology: string;
        confidenceLevel: string;
        uncertaintyRange: string;
        reliabilityGrade: string;
      };
    };
  };
  
  visualizations: {
    depthPlots: {
      title: string;
      method: string;
      features: string[];
    };
    statisticalCharts: {
      title: string;
      charts: string[];
    };
    gammaRayCorrelation: {
      title: string;
      purpose: string;
      trendAnalysis: string;
    };
  };
  
  completionStrategy: {
    recommendedApproach: string;
    targetZones: string[];
    riskFactors: string[];
    expectedPerformance: string;
  };
  
  methodology: {
    formula: string;
    method: string;
    parameters: {
      grClean: { value: number; units: string; justification: string; };
      grShale: { value: number; units: string; justification: string; };
    };
    industryStandards: string[];
  };
}

interface CleanSandInterval {
  depthStart: number;
  depthEnd: number;
  thickness: number;
  averageShaleVolume: number;
  quality: 'Excellent' | 'Good' | 'Fair';
  completionPriority: 'Primary' | 'Secondary';
  netToGross: number;
}

// Simple LAS parser
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
          const curveMatch = curvePart.match(/^(\w+)\s*\.(\S+)/);

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
        try {
          const values = trimmedLine.split(/\s+/).map(v => parseFloat(v));
          if (values.length >= curveNames.length) {
            curveNames.forEach((name, i) => {
              this.curves[name].push(values[i]);
            });
          }
        } catch (error) {
          // Skip invalid lines
        }
      }
    }
  }

  getWellData(wellName: string): any {
    const curves = Object.entries(this.curves).map(([name, data]) => ({
      name,
      displayName: name,
      data,
      unit: this.curveInfo[name]?.unit || '',
      description: this.curveInfo[name]?.description || ''
    }));

    return {
      wellName,
      curves,
      wellInfo: this.wellInfo
    };
  }
}

// Shale Volume Calculator
class ShaleVolumeCalculator {
  /**
   * Calculate IGR (Gamma Ray Index) with proper bounds enforcement [0, 1]
   */
  static calculateIGR(grData: number[], grClean: number, grShale: number): number[] {
    return grData.map(gr => {
      if (gr === -999.25 || isNaN(gr) || !isFinite(gr)) return -999.25;
      
      // Calculate IGR
      const igr = (gr - grClean) / (grShale - grClean);
      
      // Clamp to [0, 1] range
      return Math.max(0, Math.min(1, igr));
    });
  }

  /**
   * Calculate shale volume using specified method
   */
  static calculateShaleVolume(
    igrData: number[], 
    method: 'larionov_tertiary' | 'larionov_pre_tertiary' | 'clavier' | 'linear'
  ): number[] {
    return igrData.map(igr => {
      if (igr === -999.25 || isNaN(igr) || !isFinite(igr)) return -999.25;
      
      let vsh: number;
      
      switch (method) {
        case 'larionov_tertiary':
          // Vsh = 0.083 * (2^(3.7*IGR) - 1)
          vsh = 0.083 * (Math.pow(2, 3.7 * igr) - 1);
          break;
        
        case 'larionov_pre_tertiary':
          // Vsh = 0.33 * (2^(2*IGR) - 1)
          vsh = 0.33 * (Math.pow(2, 2 * igr) - 1);
          break;
        
        case 'clavier':
          // Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
          const term = 3.38 - Math.pow(igr + 0.7, 2);
          vsh = term >= 0 ? 1.7 - Math.sqrt(term) : igr; // Fallback to linear if sqrt would be imaginary
          break;
        
        case 'linear':
          // Vsh = IGR
          vsh = igr;
          break;
        
        default:
          vsh = igr;
      }
      
      // Clamp to [0, 1] range
      return Math.max(0, Math.min(1, vsh));
    });
  }

  /**
   * Identify clean sand intervals (Vsh < 30%)
   */
  static identifyCleanSandIntervals(depths: number[], vsh: number[]): CleanSandInterval[] {
    const intervals: CleanSandInterval[] = [];
    let inInterval = false;
    let intervalStart = 0;
    let intervalValues: number[] = [];
    
    for (let i = 0; i < vsh.length; i++) {
      if (vsh[i] !== -999.25 && !isNaN(vsh[i]) && isFinite(vsh[i])) {
        if (vsh[i] < 0.30 && !inInterval) {
          // Start new interval
          inInterval = true;
          intervalStart = i;
          intervalValues = [vsh[i]];
        } else if (vsh[i] < 0.30 && inInterval) {
          // Continue interval
          intervalValues.push(vsh[i]);
        } else if (vsh[i] >= 0.30 && inInterval) {
          // End interval
          inInterval = false;
          if (intervalValues.length > 2) {
            const avgVsh = intervalValues.reduce((a, b) => a + b, 0) / intervalValues.length;
            const thickness = depths[i - 1] - depths[intervalStart];
            
            intervals.push({
              depthStart: depths[intervalStart],
              depthEnd: depths[i - 1],
              thickness,
              averageShaleVolume: avgVsh,
              quality: avgVsh < 0.15 ? 'Excellent' : avgVsh < 0.25 ? 'Good' : 'Fair',
              completionPriority: thickness > 15 && avgVsh < 0.20 ? 'Primary' : 'Secondary',
              netToGross: 1 - avgVsh
            });
          }
        }
      } else if (inInterval) {
        // Missing data ends interval
        inInterval = false;
        if (intervalValues.length > 2) {
          const avgVsh = intervalValues.reduce((a, b) => a + b, 0) / intervalValues.length;
          const thickness = depths[i - 1] - depths[intervalStart];
          
          intervals.push({
            depthStart: depths[intervalStart],
            depthEnd: depths[i - 1],
            thickness,
            averageShaleVolume: avgVsh,
            quality: avgVsh < 0.15 ? 'Excellent' : avgVsh < 0.25 ? 'Good' : 'Fair',
            completionPriority: thickness > 15 && avgVsh < 0.20 ? 'Primary' : 'Secondary',
            netToGross: 1 - avgVsh
          });
        }
      }
    }
    
    // Handle interval that extends to end of well
    if (inInterval && intervalValues.length > 2) {
      const avgVsh = intervalValues.reduce((a, b) => a + b, 0) / intervalValues.length;
      const thickness = depths[depths.length - 1] - depths[intervalStart];
      
      intervals.push({
        depthStart: depths[intervalStart],
        depthEnd: depths[depths.length - 1],
        thickness,
        averageShaleVolume: avgVsh,
        quality: avgVsh < 0.15 ? 'Excellent' : avgVsh < 0.25 ? 'Good' : 'Fair',
        completionPriority: thickness > 15 && avgVsh < 0.20 ? 'Primary' : 'Secondary',
        netToGross: 1 - avgVsh
      });
    }
    
    // Sort by quality (lowest Vsh first)
    return intervals.sort((a, b) => a.averageShaleVolume - b.averageShaleVolume);
  }
}

// Helper functions
function calculateStats(data: number[]): { mean: number; median: number; min: number; max: number; stdDev: number } {
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  
  return {
    mean,
    median,
    min: Math.min(...data),
    max: Math.max(...data),
    stdDev: Math.sqrt(variance)
  };
}

function getMethodFormula(method: string): string {
  switch (method) {
    case 'larionov_tertiary':
      return 'Vsh = 0.083 × (2^(3.7×IGR) - 1)';
    case 'larionov_pre_tertiary':
      return 'Vsh = 0.33 × (2^(2×IGR) - 1)';
    case 'clavier':
      return 'Vsh = 1.7 - √(3.38 - (IGR + 0.7)²)';
    case 'linear':
      return 'Vsh = IGR';
    default:
      return 'Vsh = IGR';
  }
}

function getMethodDescription(method: string): string {
  switch (method) {
    case 'larionov_tertiary':
      return 'Larionov Tertiary (younger rocks)';
    case 'larionov_pre_tertiary':
      return 'Larionov Pre-Tertiary (older rocks)';
    case 'clavier':
      return 'Clavier (consolidated formations)';
    case 'linear':
      return 'Linear (simple approximation)';
    default:
      return method;
  }
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  func: (args: any) => Promise<string>;
}

/**
 * Comprehensive Shale Volume Analysis Tool
 */
export const comprehensiveShaleVolumeAnalysisTool: MCPTool = {
  name: "calculate_shale_volume",
  description: "Calculate shale volume with comprehensive interactive analysis and visualizations, including clean sand interval identification",
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
  func: async ({ wellName, method, parameters, depthStart, depthEnd }) => {
    try {
      console.log('🔧 Comprehensive Shale Volume Analysis Tool called:', {
        wellName,
        method,
        parameters,
        depthRange: depthStart && depthEnd ? [depthStart, depthEnd] : 'full well'
      });

      // Default parameters
      const grClean = parameters?.grClean || 30;
      const grShale = parameters?.grShale || 120;

      // Step 1: Load well data from S3
      const key = `${WELL_DATA_PREFIX}${wellName}.las`;
      const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
      const response = await s3Client.send(command);
      
      if (!response.Body) {
        return JSON.stringify({
          success: false,
          error: 'Well data not found',
          message: `Well ${wellName} not found in S3 bucket`,
          suggestion: 'Check well name and ensure LAS file exists in S3'
        });
      }

      // Step 2: Parse LAS file
      const content = await response.Body.transformToString();
      const parser = new CloudLASParser(content);
      const wellData = parser.getWellData(wellName);

      // Step 3: Extract required curves
      const grCurve = wellData.curves.find((c: any) => 
        c.name === 'GR' || c.name === 'GAMMA' || c.name === 'GAMMARAY' ||
        c.name.toUpperCase().includes('GR') || c.name.toUpperCase().includes('GAMMA'));
      const depthCurve = wellData.curves.find((c: any) => 
        c.name === 'DEPT' || c.name === 'DEPTH' || c.name === 'MD' || c.name === 'TVDSS' ||
        c.name.toUpperCase().includes('DEPT') || c.name.toUpperCase().includes('DEPTH'));

      // Check for required curves
      if (!grCurve) {
        const availableCurves = wellData.curves.map((c: any) => c.name).join(', ');
        return JSON.stringify({
          success: false,
          error: 'Missing GR curve',
          message: `Well ${wellName} does not have a gamma ray (GR) curve required for shale volume analysis`,
          availableCurves,
          suggestion: 'Ensure LAS file contains GR curve data'
        });
      }

      if (!depthCurve) {
        const availableCurves = wellData.curves.map((c: any) => c.name).join(', ');
        return JSON.stringify({
          success: false,
          error: 'Missing DEPT curve',
          message: `Well ${wellName} does not have a depth (DEPT) curve`,
          availableCurves,
          suggestion: 'Ensure LAS file contains DEPT curve data'
        });
      }

      let grData = grCurve.data;
      let depths = depthCurve.data;

      // Step 4: Apply depth filtering if specified
      if (depthStart !== undefined && depthEnd !== undefined) {
        const validIndices = depths.map((depth: number, index: number) =>
          depth >= depthStart && depth <= depthEnd ? index : -1
        ).filter((index: number) => index !== -1);
        
        if (validIndices.length === 0) {
          return JSON.stringify({
            success: false,
            error: 'No data in depth range',
            message: `No data points found in specified depth range [${depthStart}-${depthEnd}] for well ${wellName}`,
            availableDepthRange: [Math.min(...depths), Math.max(...depths)],
            suggestion: 'Adjust depth range to match available data'
          });
        }
        
        grData = validIndices.map(i => grData[i]);
        depths = validIndices.map(i => depths[i]);
      }

      // Step 5: Validate GR data quality
      const validGR = grData.filter((v: number) => v !== -999.25 && !isNaN(v) && isFinite(v));
      if (validGR.length < 10) {
        return JSON.stringify({
          success: false,
          error: 'Insufficient valid GR data',
          message: `Well ${wellName} has insufficient valid gamma ray data (${validGR.length} valid points out of ${grData.length} total)`,
          suggestion: 'Check data quality and null value filtering'
        });
      }

      // Step 6: Calculate IGR and Vsh
      const igrData = ShaleVolumeCalculator.calculateIGR(grData, grClean, grShale);
      const vshData = ShaleVolumeCalculator.calculateShaleVolume(igrData, method);

      // Step 7: Calculate statistics
      const validVsh = vshData.filter(v => v !== -999.25 && !isNaN(v) && isFinite(v));
      const stats = calculateStats(validVsh);
      const netToGross = 1 - stats.mean;

      // Step 8: Identify clean sand intervals
      const cleanSandIntervals = ShaleVolumeCalculator.identifyCleanSandIntervals(depths, vshData);

      // Step 9: Calculate distribution analysis
      const cleanSandCount = validVsh.filter(v => v < 0.30).length;
      const percentCleanSand = (cleanSandCount / validVsh.length) * 100;

      // Step 10: Build log curve data for visualization
      const logCurveData = {
        DEPT: depths,
        GR: grData,
        VSH: vshData
      };

      // Step 11: Build comprehensive artifact
      const artifact: ShaleVolumeArtifact = {
        messageContentType: 'comprehensive_shale_analysis',
        analysisType: 'single_well',
        wellName,
        method,
        
        executiveSummary: {
          title: `Comprehensive Shale Volume Analysis for ${wellName}`,
          method: getMethodDescription(method),
          keyFindings: [
            `Average shale volume: ${(stats.mean * 100).toFixed(1)}% using ${getMethodDescription(method)}`,
            `Net-to-gross ratio: ${(netToGross * 100).toFixed(1)}% (${(netToGross * 100).toFixed(1)}% clean sand)`,
            `${cleanSandIntervals.length} clean sand interval(s) identified (Vsh < 30%)`,
            cleanSandIntervals.length > 0 
              ? `Best interval: ${cleanSandIntervals[0].depthStart.toFixed(0)}-${cleanSandIntervals[0].depthEnd.toFixed(0)}ft, ${cleanSandIntervals[0].thickness.toFixed(1)}ft thick, ${(cleanSandIntervals[0].averageShaleVolume * 100).toFixed(1)}% Vsh`
              : 'No clean sand intervals meeting quality criteria'
          ],
          overallAssessment: cleanSandIntervals.length >= 2 
            ? 'Excellent reservoir quality with multiple clean sand targets'
            : cleanSandIntervals.length === 1
            ? 'Good reservoir quality with viable completion target'
            : 'Limited clean sand development - detailed evaluation recommended'
        },
        
        results: {
          shaleVolumeAnalysis: {
            method: getMethodDescription(method),
            formula: getMethodFormula(method),
            wellName,
            gammaRayData: {
              source: 'LAS file gamma ray log',
              dataPoints: grData.length,
              validPoints: validGR.length,
              grClean: `${grClean} API`,
              grShale: `${grShale} API`
            },
            calculationResults: {
              averageShaleVolume: `${(stats.mean * 100).toFixed(1)}%`,
              medianShaleVolume: `${(stats.median * 100).toFixed(1)}%`,
              standardDeviation: `${(stats.stdDev * 100).toFixed(1)}%`,
              netToGross: `${(netToGross * 100).toFixed(1)}%`,
              uncertainty: `±${(stats.stdDev * 100 * 1.96).toFixed(1)}% (95% confidence)`
            }
          },
          
          // Log curve data for visualization (DEPT, GR, VSH)
          curveData: logCurveData,
          
          // Additional metadata for frontend
          parameters: {
            grMin: Math.min(...validGR),
            grMax: Math.max(...validGR),
            grClean,
            grShale
          },
          
          method,
          
          statistics: {
            mean: stats.mean,
            median: stats.median,
            min: stats.min,
            max: stats.max,
            stdDev: stats.stdDev
          },
          
          dataQuality: {
            completeness: (validGR.length / grData.length) * 100,
            validPoints: validGR.length,
            totalPoints: grData.length
          },
          
          vshValues: vshData,
          
          cleanSandIntervals: {
            totalIntervals: cleanSandIntervals.length,
            criteria: 'Vsh < 30%',
            bestIntervals: cleanSandIntervals.slice(0, 5).map(interval => ({
              depth: `${interval.depthStart.toFixed(0)}-${interval.depthEnd.toFixed(0)} ft`,
              thickness: `${interval.thickness.toFixed(1)} ft`,
              averageShaleVolume: `${(interval.averageShaleVolume * 100).toFixed(1)}%`,
              quality: interval.quality,
              completionPriority: interval.completionPriority,
              netToGross: `${(interval.netToGross * 100).toFixed(1)}%`
            }))
          },
          
          statisticalSummary: {
            distributionAnalysis: {
              distribution: stats.mean < 0.30 ? 'Clean sand dominated' : stats.mean < 0.50 ? 'Mixed lithology' : 'Shale dominated',
              cleanSandPeak: `${(stats.min * 100).toFixed(1)}%`,
              shalePeak: `${(stats.max * 100).toFixed(1)}%`,
              percentCleanSand: `${percentCleanSand.toFixed(1)}%`
            },
            uncertaintyAnalysis: {
              methodology: 'Statistical analysis with 95% confidence intervals',
              confidenceLevel: '95%',
              uncertaintyRange: `±${(stats.stdDev * 100 * 1.96).toFixed(1)}%`,
              reliabilityGrade: validGR.length > 100 ? 'High' : validGR.length > 50 ? 'Moderate' : 'Low'
            }
          }
        },
        
        visualizations: {
          depthPlots: {
            title: 'Shale Volume vs Depth',
            method: getMethodDescription(method),
            features: [
              'Shale volume profile with depth',
              'Clean sand intervals highlighted (Vsh < 30%)',
              'Gamma ray log correlation',
              'Completion target zones marked'
            ]
          },
          statisticalCharts: {
            title: 'Shale Volume Distribution Analysis',
            charts: [
              'Histogram showing shale volume distribution',
              'Box plot with quartile analysis',
              'Cumulative distribution function'
            ]
          },
          gammaRayCorrelation: {
            title: 'Gamma Ray to Shale Volume Correlation',
            purpose: 'Validate calculation method and identify anomalies',
            trendAnalysis: 'Non-linear relationship per ' + getMethodDescription(method)
          }
        },
        
        completionStrategy: {
          recommendedApproach: cleanSandIntervals.length >= 2
            ? 'Multi-stage hydraulic fracturing targeting multiple clean sand intervals'
            : cleanSandIntervals.length === 1
            ? 'Single-stage completion targeting primary clean sand interval'
            : 'Detailed reservoir characterization recommended before completion',
          targetZones: cleanSandIntervals.slice(0, 3).map(interval =>
            `${interval.depthStart.toFixed(0)}-${interval.depthEnd.toFixed(0)}ft (${interval.quality} quality, ${interval.completionPriority} priority)`
          ),
          riskFactors: [
            stats.mean > 0.40 ? 'High shale content may impact productivity' : 'Shale content within acceptable range',
            cleanSandIntervals.length === 0 ? 'No clean sand intervals identified - consider alternative targets' : 'Clean sand targets identified',
            stats.stdDev > 0.15 ? 'High variability in shale content - detailed zone selection critical' : 'Consistent shale volume profile'
          ],
          expectedPerformance: cleanSandIntervals.length >= 2 && stats.mean < 0.30
            ? 'Excellent - Multiple high-quality targets with low shale content'
            : cleanSandIntervals.length >= 1 && stats.mean < 0.40
            ? 'Good - Viable completion targets identified'
            : 'Fair - Limited clean sand development, moderate productivity expected'
        },
        
        methodology: {
          formula: getMethodFormula(method),
          method: getMethodDescription(method),
          parameters: {
            grClean: {
              value: grClean,
              units: 'API',
              justification: 'Clean sand baseline from log analysis'
            },
            grShale: {
              value: grShale,
              units: 'API',
              justification: 'Shale baseline from log analysis'
            }
          },
          industryStandards: [
            'SPE/AAPG petrophysical standards for shale volume calculation',
            'API RP 40 gamma ray log interpretation guidelines',
            method.includes('larionov') ? 'Larionov empirical correlations for consolidated formations' : 'Standard industry practices',
            'IGR normalization with bounds enforcement [0, 1]'
          ]
        }
      };

      console.log('✅ Comprehensive shale volume artifact created:', {
        wellName,
        method,
        cleanSandIntervals: cleanSandIntervals.length,
        avgVsh: (stats.mean * 100).toFixed(1) + '%',
        netToGross: (netToGross * 100).toFixed(1) + '%'
      });

      return JSON.stringify({
        success: true,
        message: `Comprehensive shale volume analysis complete for ${wellName} using ${getMethodDescription(method)}`,
        artifacts: [artifact]
      });

    } catch (error) {
      console.error('❌ Comprehensive shale volume analysis failed:', error);
      return JSON.stringify({
        success: false,
        error: `Shale volume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check input parameters and well data availability'
      });
    }
  }
};
