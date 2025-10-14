/**
 * Report Fallback Service - Integration service for fallback reporting
 * 
 * Coordinates between the main renewable client and fallback report generation
 * when Lambda functions are unavailable.
 */

import { FallbackReportGenerator, FallbackReportData, FallbackReport } from './FallbackReportGenerator';
import { ErrorReporter } from './ErrorReporter';

export interface ReportRequest {
  projectName: string;
  location: {
    lat: number;
    lon: number;
    address?: string;
  };
  includeTerrainAnalysis?: boolean;
  includeLayoutDesign?: boolean;
  includeWakeSimulation?: boolean;
}

export interface ReportResponse {
  success: boolean;
  report?: FallbackReport;
  error?: string;
  fallbackUsed: boolean;
  message: string;
}

export class ReportFallbackService {
  private fallbackGenerator: FallbackReportGenerator;
  private errorReporter: ErrorReporter;

  constructor() {
    this.fallbackGenerator = new FallbackReportGenerator();
    this.errorReporter = new ErrorReporter();
  }

  /**
   * Generate report with fallback capability
   */
  async generateReport(
    request: ReportRequest,
    availableData: any = {}
  ): Promise<ReportResponse> {
    try {
      console.log('ReportFallbackService: Generating fallback report for', request.projectName);

      // Prepare fallback data
      const fallbackData: FallbackReportData = {
        projectName: request.projectName,
        location: request.location,
        terrainData: availableData.terrain,
        layoutData: availableData.layout,
        simulationData: availableData.simulation,
        timestamp: new Date().toISOString()
      };

      // Generate fallback report
      const report = this.fallbackGenerator.generateReport(fallbackData);

      const hasAnyData = report.dataAvailable.terrain || 
                        report.dataAvailable.layout || 
                        report.dataAvailable.simulation;

      return {
        success: true,
        report,
        fallbackUsed: true,
        message: hasAnyData ? 
          'Report generated with available data. Some components may be missing due to service unavailability.' :
          'Basic report generated. Full analysis requires backend services to be deployed and accessible.'
      };

    } catch (error) {
      console.error('ReportFallbackService: Error generating fallback report:', error);
      
      const errorReport = this.errorReporter.formatForUI(error, {
        projectName: request.projectName,
        service: 'fallback-report-generation'
      });

      return {
        success: false,
        error: errorReport.message,
        fallbackUsed: true,
        message: 'Failed to generate fallback report'
      };
    }
  }

  /**
   * Generate executive summary only
   */
  generateExecutiveSummary(
    request: ReportRequest,
    availableData: any = {}
  ): string {
    const fallbackData: FallbackReportData = {
      projectName: request.projectName,
      location: request.location,
      terrainData: availableData.terrain,
      layoutData: availableData.layout,
      simulationData: availableData.simulation,
      timestamp: new Date().toISOString()
    };

    return this.fallbackGenerator.generateExecutiveSummary(fallbackData);
  }

  /**
   * Check what data is available for reporting
   */
  assessDataAvailability(availableData: any = {}): {
    terrain: boolean;
    layout: boolean;
    simulation: boolean;
    completeness: number;
    canGenerateReport: boolean;
  } {
    const terrain = !!availableData.terrain;
    const layout = !!availableData.layout;
    const simulation = !!availableData.simulation;
    
    const availableCount = [terrain, layout, simulation].filter(Boolean).length;
    const completeness = Math.round((availableCount / 3) * 100);
    
    return {
      terrain,
      layout,
      simulation,
      completeness,
      canGenerateReport: true // Fallback can always generate something
    };
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(availableData: any = {}): string {
    const assessment = this.assessDataAvailability(availableData);
    
    if (assessment.completeness === 100) {
      return 'All analysis components are available for comprehensive reporting.';
    } else if (assessment.completeness > 0) {
      return `${assessment.completeness}% of analysis components are available. Report will include available data.`;
    } else {
      return 'No analysis data is currently available. Basic project report can still be generated.';
    }
  }
}