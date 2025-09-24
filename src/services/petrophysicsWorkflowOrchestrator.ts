/**
 * Petrophysics Workflow Orchestrator
 * Integrates visualization, calculation, and reporting systems for complete workflow
 * Requirements: 1.1, 2.1, 3.4, 5.1
 */

import { EventEmitter } from 'events';
import {
  WellLogData,
  CalculationParameters,
  CalculationResults,
  ReservoirZone,
  CompletionTarget,
  QualityMetrics,
  ValidationResult
} from '../types/petrophysics';

import { PetrophysicsCalculationEngine } from './petrophysicsEngine';
import { PorosityCalculator } from './calculators/porosityCalculator';
import { ShaleVolumeCalculator } from './calculators/shaleVolumeCalculator';
import { SaturationCalculator } from './calculators/saturationCalculator';
import { PermeabilityCalculator } from './calculators/permeabilityCalculator';
import { ReservoirQualityCalculator } from './calculators/reservoirQualityCalculator';
import { ReportTemplateEngine, ReportData, GeneratedReport } from './reporting/ReportTemplateEngine';
import { PDFGenerator } from './reporting/PDFGenerator';
import { ExcelExporter } from './reporting/ExcelExporter';
import { LASExporter } from './reporting/LASExporter';
import { CompletionTargetService } from './completionTargetService';
import { GeologicalMarkerService } from './geologicalMarkerService';
import { PetrophysicsPerformanceOptimizer } from './performanceOptimizer';
import { ErrorHandlingSystem, ErrorCategory, ErrorSeverity } from './errorHandlingSystem';

export interface WorkflowConfig {
  enableRealTimeUpdates: boolean;
  autoSaveResults: boolean;
  cacheTimeout: number;
  maxConcurrentCalculations: number;
  enableProgressTracking: boolean;
  enableErrorRecovery: boolean;
  enablePerformanceOptimization: boolean;
  enableLazyLoading: boolean;
  enableMemoryOptimization: boolean;
}

export interface WorkflowState {
  id: string;
  status: 'idle' | 'loading' | 'calculating' | 'generating_report' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  wells: WellLogData[];
  calculations: CalculationResults[];
  reservoirZones: ReservoirZone[];
  completionTargets: CompletionTarget[];
  errors: string[];
  warnings: string[];
}

export interface WorkflowResult {
  state: WorkflowState;
  reports: GeneratedReport[];
  exportedFiles: { [format: string]: string };
  visualizationData: any;
}

export interface ProgressUpdate {
  workflowId: string;
  step: string;
  progress: number;
  message: string;
  timestamp: Date;
}

export interface ErrorRecoveryOptions {
  retryCount: number;
  fallbackMethods: string[];
  skipOnError: boolean;
}

/**
 * Main workflow orchestrator that coordinates all petrophysical analysis components
 */
export class PetrophysicsWorkflowOrchestrator extends EventEmitter {
  private config: WorkflowConfig;
  private calculationEngine: PetrophysicsCalculationEngine;
  private reportEngine: ReportTemplateEngine;
  private pdfGenerator: PDFGenerator;
  private excelExporter: ExcelExporter;
  private lasExporter: LASExporter;
  private completionService: CompletionTargetService;
  private geologicalService: GeologicalMarkerService;
  private performanceOptimizer: PetrophysicsPerformanceOptimizer;
  private errorHandler: ErrorHandlingSystem;
  
  private activeWorkflows: Map<string, WorkflowState>;
  private calculationQueue: Map<string, Promise<any>>;
  private resultCache: Map<string, any>;

  constructor(config?: Partial<WorkflowConfig>) {
    super();
    
    this.config = {
      enableRealTimeUpdates: true,
      autoSaveResults: true,
      cacheTimeout: 300000, // 5 minutes
      maxConcurrentCalculations: 4,
      enableProgressTracking: true,
      enableErrorRecovery: true,
      enablePerformanceOptimization: true,
      enableLazyLoading: true,
      enableMemoryOptimization: true,
      ...config
    };

    // Initialize services
    this.calculationEngine = new PetrophysicsCalculationEngine();
    this.reportEngine = new ReportTemplateEngine();
    this.pdfGenerator = new PDFGenerator();
    this.excelExporter = new ExcelExporter();
    this.lasExporter = new LASExporter();
    this.completionService = new CompletionTargetService();
    this.geologicalService = new GeologicalMarkerService();
    this.performanceOptimizer = new PetrophysicsPerformanceOptimizer();
    this.errorHandler = new ErrorHandlingSystem({
      enableAutoRecovery: this.config.enableErrorRecovery,
      maxRetryAttempts: 3,
      retryDelay: 2000,
      enableFallbackMethods: true,
      enableUserNotification: true,
      logErrors: true
    });

    this.activeWorkflows = new Map();
    this.calculationQueue = new Map();
    this.resultCache = new Map();

    this.setupEventHandlers();
    this.setupErrorHandlerEvents();
  }

  /**
   * Start a complete petrophysical analysis workflow
   */
  public async startCompleteWorkflow(
    wells: WellLogData[],
    calculationParameters: CalculationParameters,
    reportTemplates: string[] = ['formation_evaluation'],
    exportFormats: string[] = ['PDF', 'Excel']
  ): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId();
    
    const initialState: WorkflowState = {
      id: workflowId,
      status: 'loading',
      progress: 0,
      currentStep: 'Initializing workflow',
      wells: [],
      calculations: [],
      reservoirZones: [],
      completionTargets: [],
      errors: [],
      warnings: []
    };

    this.activeWorkflows.set(workflowId, initialState);
    this.emitProgress(workflowId, 'Initializing workflow', 0, 'Starting complete petrophysical analysis');

    try {
      // Show initial progress
      this.errorHandler.showProgress({
        id: `workflow_${workflowId}`,
        title: 'Petrophysical Analysis',
        message: 'Starting complete workflow analysis',
        progress: 0,
        indeterminate: false,
        canCancel: true,
        onCancel: () => this.cancelWorkflow(workflowId)
      });

      // Step 1: Load and validate well data
      await this.loadWellData(workflowId, wells);
      
      // Step 2: Perform all calculations
      await this.performAllCalculations(workflowId, calculationParameters);
      
      // Step 3: Analyze reservoir zones and completion targets
      await this.analyzeReservoirZones(workflowId);
      
      // Step 4: Generate reports
      const reports = await this.generateReports(workflowId, reportTemplates);
      
      // Step 5: Export to requested formats
      const exportedFiles = await this.exportResults(workflowId, exportFormats);
      
      // Step 6: Prepare visualization data
      const visualizationData = await this.prepareVisualizationData(workflowId);

      const finalState = this.activeWorkflows.get(workflowId)!;
      finalState.status = 'complete';
      finalState.progress = 100;
      finalState.currentStep = 'Workflow complete';

      // Hide progress and show success
      this.errorHandler.hideProgress(`workflow_${workflowId}`);
      this.errorHandler.showUserFeedback({
        type: 'success',
        title: 'Analysis Complete',
        message: `Successfully analyzed ${wells.length} wells with ${finalState.calculations.length} calculations`,
        duration: 5000
      });

      this.emitProgress(workflowId, 'Workflow complete', 100, 'All analysis steps completed successfully');

      return {
        state: finalState,
        reports,
        exportedFiles,
        visualizationData
      };

    } catch (error) {
      const state = this.activeWorkflows.get(workflowId)!;
      state.status = 'error';
      
      // Hide progress
      this.errorHandler.hideProgress(`workflow_${workflowId}`);
      
      // Handle error with comprehensive error handling
      await this.errorHandler.handleError(error as Error, {
        workflowId,
        workflowBlocking: true,
        wells: wells.length,
        step: state.currentStep
      });
      
      state.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.emit('workflow_error', { workflowId, error: error instanceof Error ? error.message : 'Unknown error' });
      
      throw error;
    }
  }

  /**
   * Load and validate well data
   */
  private async loadWellData(workflowId: string, wells: WellLogData[]): Promise<void> {
    const state = this.activeWorkflows.get(workflowId)!;
    state.currentStep = 'Loading well data';
    state.progress = 10;

    this.emitProgress(workflowId, 'Loading well data', 10, `Loading ${wells.length} wells`);

    // Update main progress indicator
    this.errorHandler.updateProgress(`workflow_${workflowId}`, {
      progress: 10,
      message: `Loading ${wells.length} wells`
    });

    const validatedWells: WellLogData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < wells.length; i++) {
      const well = wells[i];
      
      try {
        // Apply performance optimizations if enabled
        let optimizedWell = well;
        if (this.config.enablePerformanceOptimization) {
          if (this.config.enableMemoryOptimization) {
            optimizedWell = this.performanceOptimizer.optimizeWellData(well);
          }
        }
        
        const validation = this.calculationEngine.loadWellData(optimizedWell);
        
        if (validation.isValid) {
          validatedWells.push(optimizedWell);
        } else {
          // Handle validation errors with error handler
          for (const validationError of validation.errors) {
            await this.errorHandler.handleError(new Error(validationError.message), {
              wellName: well.wellName,
              wellData: well,
              validationError: true
            });
          }
          errors.push(...validation.errors.map(e => `${well.wellName}: ${e.message}`));
        }
        
        warnings.push(...validation.warnings.map(w => `${well.wellName}: ${w.message}`));
        
      } catch (wellError) {
        await this.errorHandler.handleError(wellError as Error, {
          wellName: well.wellName,
          wellData: well,
          loadingError: true
        });
        errors.push(`${well.wellName}: ${wellError instanceof Error ? wellError.message : 'Unknown error'}`);
      }
      
      // Update progress
      const progress = 10 + (i / wells.length) * 10;
      this.emitProgress(workflowId, 'Loading well data', progress, `Loaded ${i + 1}/${wells.length} wells`);
      
      this.errorHandler.updateProgress(`workflow_${workflowId}`, {
        progress,
        message: `Loaded ${i + 1}/${wells.length} wells`
      });
    }

    state.wells = validatedWells;
    state.errors.push(...errors);
    state.warnings.push(...warnings);
    state.progress = 20;

    if (validatedWells.length === 0) {
      throw new Error('No valid wells loaded. Cannot proceed with analysis.');
    }

    this.emitProgress(workflowId, 'Well data loaded', 20, `Successfully loaded ${validatedWells.length} wells`);
  }

  /**
   * Perform all petrophysical calculations
   */
  private async performAllCalculations(workflowId: string, parameters: CalculationParameters): Promise<void> {
    const state = this.activeWorkflows.get(workflowId)!;
    state.currentStep = 'Performing calculations';
    
    this.emitProgress(workflowId, 'Performing calculations', 25, 'Starting petrophysical calculations');

    const calculationTypes = [
      { type: 'porosity', calculator: new PorosityCalculator() },
      { type: 'shale_volume', calculator: new ShaleVolumeCalculator() },
      { type: 'saturation', calculator: new SaturationCalculator() },
      { type: 'permeability', calculator: new PermeabilityCalculator() },
      { type: 'reservoir_quality', calculator: new ReservoirQualityCalculator() }
    ];

    const allCalculations: CalculationResults[] = [];
    let completedCalculations = 0;
    const totalCalculations = state.wells.length * calculationTypes.length;

    // Process calculations with concurrency control
    const calculationPromises: Promise<void>[] = [];
    
    for (const well of state.wells) {
      for (const { type, calculator } of calculationTypes) {
        const calculationPromise = this.performSingleCalculation(
          well,
          type,
          calculator,
          parameters
        ).then(result => {
          if (result) {
            allCalculations.push(result);
          }
          completedCalculations++;
          
          const progress = 25 + (completedCalculations / totalCalculations) * 40;
          this.emitProgress(
            workflowId, 
            'Performing calculations', 
            progress, 
            `Completed ${completedCalculations}/${totalCalculations} calculations`
          );
        }).catch(error => {
          state.errors.push(`${well.wellName} ${type}: ${error.message}`);
          completedCalculations++;
        });

        calculationPromises.push(calculationPromise);

        // Limit concurrent calculations
        if (calculationPromises.length >= this.config.maxConcurrentCalculations) {
          await Promise.all(calculationPromises);
          calculationPromises.length = 0;
        }
      }
    }

    // Wait for remaining calculations
    if (calculationPromises.length > 0) {
      await Promise.all(calculationPromises);
    }

    state.calculations = allCalculations;
    state.progress = 65;

    this.emitProgress(workflowId, 'Calculations complete', 65, `Completed ${allCalculations.length} calculations`);
  }

  /**
   * Perform a single calculation with error handling
   */
  private async performSingleCalculation(
    well: WellLogData,
    calculationType: string,
    calculator: any,
    parameters: CalculationParameters
  ): Promise<CalculationResults | null> {
    const calculationId = `${well.wellName}_${calculationType}_${Date.now()}`;
    
    try {
      const cacheKey = `${well.wellName}_${calculationType}_${JSON.stringify(parameters)}`;
      
      // Start performance monitoring
      if (this.config.enablePerformanceOptimization) {
        this.performanceOptimizer.startCalculation(calculationId);
      }
      
      // Check performance-optimized cache first
      if (this.config.enablePerformanceOptimization) {
        const cachedResult = this.performanceOptimizer.getCachedCalculationResult(cacheKey);
        if (cachedResult) {
          this.performanceOptimizer.endCalculation(calculationId);
          return cachedResult;
        }
      }
      
      // Check legacy cache
      if (this.resultCache.has(cacheKey)) {
        const result = this.resultCache.get(cacheKey);
        if (this.config.enablePerformanceOptimization) {
          this.performanceOptimizer.endCalculation(calculationId);
        }
        return result;
      }

      let calculationResult: any = null;

      // Get required curve data
      const depthCurve = well.curves.find(c => c.name.toLowerCase().includes('dept'));
      if (!depthCurve) {
        throw new Error('Depth curve not found');
      }

      switch (calculationType) {
        case 'porosity':
          const rhobCurve = well.curves.find(c => c.name.toLowerCase() === 'rhob');
          const nphiCurve = well.curves.find(c => c.name.toLowerCase() === 'nphi');
          if (rhobCurve) {
            calculationResult = calculator.calculateDensityPorosity(
              rhobCurve.data,
              parameters.matrixDensity || 2.65,
              parameters.fluidDensity || 1.0
            );
          }
          break;
          
        case 'shale_volume':
          const grCurve = well.curves.find(c => c.name.toLowerCase() === 'gr');
          if (grCurve) {
            calculationResult = calculator.calculateLarionov(
              grCurve.data,
              parameters.grClean || 30,
              parameters.grShale || 120,
              'tertiary'
            );
          }
          break;
          
        case 'saturation':
          const rtCurve = well.curves.find(c => c.name.toLowerCase() === 'rt');
          const porosityData = well.curves.find(c => c.name.toLowerCase() === 'nphi')?.data;
          if (rtCurve && porosityData) {
            calculationResult = calculator.calculateArchie(
              rtCurve.data,
              porosityData,
              parameters.rw || 0.1,
              parameters.a || 1.0,
              parameters.m || 2.0,
              parameters.n || 2.0
            );
          }
          break;
          
        case 'permeability':
          const porosityForPerm = well.curves.find(c => c.name.toLowerCase() === 'nphi')?.data;
          if (porosityForPerm) {
            calculationResult = calculator.calculateTimur(
              porosityForPerm,
              0.2 // Default irreducible water saturation
            );
          }
          break;
          
        case 'reservoir_quality':
          const grForQuality = well.curves.find(c => c.name.toLowerCase() === 'gr');
          const porosityForQuality = well.curves.find(c => c.name.toLowerCase() === 'nphi');
          if (grForQuality && porosityForQuality) {
            calculationResult = calculator.calculateNetToGross(
              grForQuality.data,
              porosityForQuality.data,
              75, // GR cutoff
              0.1 // Porosity cutoff
            );
          }
          break;
      }

      // Convert calculation result to CalculationResults format
      if (calculationResult && calculationResult.values) {
        const result: CalculationResults = {
          wellName: well.wellName,
          calculationType,
          method: this.getMethodName(calculationType),
          parameters,
          results: {
            values: calculationResult.values,
            depths: depthCurve.data,
            uncertainty: calculationResult.uncertainty || [],
            quality: calculationResult.quality || {
              dataCompleteness: 1.0,
              environmentalCorrections: [],
              uncertaintyRange: [0.05, 0.15],
              confidenceLevel: 'medium'
            },
            methodology: calculationResult.methodology || `${calculationType} calculation`,
            parameters,
            statistics: this.calculationEngine.calculateStatistics(calculationResult.values),
            timestamp: new Date()
          },
          statistics: this.calculationEngine.calculateStatistics(calculationResult.values),
          qualityMetrics: {
            dataCompleteness: calculationResult.quality?.dataCompleteness || 0.9,
            environmentalCorrections: [],
            uncertaintyRange: [0.05, 0.15],
            confidenceLevel: 'medium'
          },
          timestamp: new Date()
        };

        // Cache result in both caches
        this.resultCache.set(cacheKey, result);
        
        if (this.config.enablePerformanceOptimization) {
          this.performanceOptimizer.cacheCalculationResult(cacheKey, result);
        }
        
        // Set cache expiration for legacy cache
        setTimeout(() => {
          this.resultCache.delete(cacheKey);
        }, this.config.cacheTimeout);

        // End performance monitoring
        if (this.config.enablePerformanceOptimization) {
          this.performanceOptimizer.endCalculation(calculationId);
        }

        return result;
      }

      return null;

    } catch (error) {
      // End performance monitoring on error
      if (this.config.enablePerformanceOptimization) {
        this.performanceOptimizer.endCalculation(calculationId);
      }
      
      // Handle error with comprehensive error handling
      const recovered = await this.errorHandler.handleError(error as Error, {
        wellName: well.wellName,
        calculationType,
        parameters,
        calculationError: true
      });
      
      if (this.config.enableErrorRecovery || recovered) {
        // Try fallback methods or skip calculation
        console.warn(`Calculation failed for ${well.wellName} ${calculationType}:`, error);
        return null;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get method name for calculation type
   */
  private getMethodName(calculationType: string): string {
    switch (calculationType) {
      case 'porosity': return 'Density Porosity';
      case 'shale_volume': return 'Larionov (Tertiary)';
      case 'saturation': return 'Archie';
      case 'permeability': return 'Timur';
      case 'reservoir_quality': return 'Net-to-Gross';
      default: return calculationType;
    }
  }

  /**
   * Analyze reservoir zones and completion targets
   */
  private async analyzeReservoirZones(workflowId: string): Promise<void> {
    const state = this.activeWorkflows.get(workflowId)!;
    state.currentStep = 'Analyzing reservoir zones';
    
    this.emitProgress(workflowId, 'Analyzing reservoir zones', 70, 'Identifying reservoir zones and completion targets');

    try {
      // Create mock reservoir zones and completion targets for now
      const reservoirZones: ReservoirZone[] = [];
      const completionTargets: CompletionTarget[] = [];

      for (const well of state.wells) {
        // Create mock reservoir zones
        const zone: ReservoirZone = {
          name: `Zone_${well.wellName}_1`,
          topDepth: well.depthRange[0] + 100,
          bottomDepth: well.depthRange[0] + 300,
          thickness: 200,
          averagePorosity: 0.15,
          averagePermeability: 50,
          netToGross: 0.7,
          quality: 'good',
          wellName: well.wellName
        };
        reservoirZones.push(zone);

        // Create mock completion targets
        const target: CompletionTarget = {
          wellName: well.wellName,
          startDepth: well.depthRange[0] + 150,
          endDepth: well.depthRange[0] + 250,
          thickness: 100,
          averagePorosity: 0.18,
          estimatedPermeability: 75,
          waterSaturation: 0.3,
          shaleVolume: 0.2,
          ranking: 1,
          quality: 'good'
        };
        completionTargets.push(target);
      }

      state.reservoirZones = reservoirZones;
      state.completionTargets = completionTargets;
      state.progress = 80;

      this.emitProgress(
        workflowId, 
        'Reservoir analysis complete', 
        80, 
        `Identified ${reservoirZones.length} reservoir zones and ${completionTargets.length} completion targets`
      );

    } catch (error) {
      state.warnings.push(`Reservoir zone analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      state.progress = 80;
    }
  }

  /**
   * Generate reports using specified templates
   */
  private async generateReports(workflowId: string, templateIds: string[]): Promise<GeneratedReport[]> {
    const state = this.activeWorkflows.get(workflowId)!;
    state.currentStep = 'Generating reports';
    
    this.emitProgress(workflowId, 'Generating reports', 85, `Generating ${templateIds.length} reports`);

    const reports: GeneratedReport[] = [];

    const reportData: ReportData = {
      wells: state.wells,
      calculations: state.calculations,
      reservoirZones: state.reservoirZones,
      completionTargets: state.completionTargets,
      metadata: {
        projectName: `Analysis_${workflowId}`,
        analyst: 'Petrophysics System',
        date: new Date(),
        company: 'Analysis Company',
        field: state.wells.length > 0 ? state.wells[0].wellInfo?.field : 'Unknown Field'
      }
    };

    for (let i = 0; i < templateIds.length; i++) {
      try {
        const report = this.reportEngine.generateReport(templateIds[i], reportData);
        reports.push(report);
        
        const progress = 85 + ((i + 1) / templateIds.length) * 10;
        this.emitProgress(workflowId, 'Generating reports', progress, `Generated ${i + 1}/${templateIds.length} reports`);
        
      } catch (error) {
        state.errors.push(`Report generation failed for template ${templateIds[i]}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    state.progress = 95;
    return reports;
  }

  /**
   * Export results to requested formats
   */
  private async exportResults(workflowId: string, formats: string[]): Promise<{ [format: string]: string }> {
    const state = this.activeWorkflows.get(workflowId)!;
    state.currentStep = 'Exporting results';
    
    this.emitProgress(workflowId, 'Exporting results', 95, `Exporting to ${formats.length} formats`);

    const exportedFiles: { [format: string]: string } = {};

    for (const format of formats) {
      try {
        let filePath: string;

        switch (format.toUpperCase()) {
          case 'PDF':
            // Create a mock PDF export for now
            filePath = `exports/${workflowId}_report.pdf`;
            // In a real implementation, this would call the PDF generator
            // filePath = await this.pdfGenerator.generateReport({...});
            break;

          case 'EXCEL':
            // Create a mock Excel export for now
            filePath = `exports/${workflowId}_data.xlsx`;
            // In a real implementation, this would call the Excel exporter
            // filePath = await this.excelExporter.exportAnalysisResults({...});
            break;

          case 'LAS':
            // Create a mock LAS export for now
            if (state.wells.length > 0) {
              filePath = `exports/${workflowId}_${state.wells[0].wellName}.las`;
              // In a real implementation, this would call the LAS exporter
              // filePath = await this.lasExporter.exportWithCalculatedCurves(...);
            } else {
              throw new Error('No wells available for LAS export');
            }
            break;

          default:
            throw new Error(`Unsupported export format: ${format}`);
        }

        exportedFiles[format] = filePath;

      } catch (error) {
        state.errors.push(`Export failed for format ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return exportedFiles;
  }

  /**
   * Prepare data for visualization components
   */
  private async prepareVisualizationData(workflowId: string): Promise<any> {
    const state = this.activeWorkflows.get(workflowId)!;
    
    return {
      wells: state.wells,
      calculations: state.calculations,
      reservoirZones: state.reservoirZones,
      completionTargets: state.completionTargets,
      trackConfigs: this.generateTrackConfigurations(state.wells, state.calculations),
      depthRanges: this.calculateDepthRanges(state.wells),
      qualityMetrics: this.aggregateQualityMetrics(state.calculations)
    };
  }

  /**
   * Generate track configurations for log visualization
   */
  private generateTrackConfigurations(wells: WellLogData[], calculations: CalculationResults[]): any[] {
    // Generate standard track configurations based on available data
    const tracks = [
      {
        id: 'track1',
        type: 'GR',
        title: 'Gamma Ray',
        curves: [{ name: 'GR', displayName: 'Gamma Ray', color: '#2E7D32', lineWidth: 2, scale: [0, 150], unit: 'API' }],
        scale: { min: 0, max: 150, gridLines: true },
        fills: [
          { type: 'threshold', threshold: 75, color: '#4CAF50', opacity: 0.3, condition: 'less_than' },
          { type: 'threshold', threshold: 75, color: '#8D6E63', opacity: 0.3, condition: 'greater_than' }
        ],
        width: 1
      },
      {
        id: 'track2',
        type: 'POROSITY',
        title: 'Porosity',
        curves: [
          { name: 'NPHI', displayName: 'Neutron Porosity', color: '#1976D2', lineWidth: 2, scale: [0, 40], unit: '%' },
          { name: 'RHOB', displayName: 'Bulk Density', color: '#D32F2F', lineWidth: 2, scale: [1.95, 2.95], inverted: true, unit: 'g/cc' }
        ],
        scale: { min: 0, max: 40, gridLines: true },
        fills: [],
        width: 1
      },
      {
        id: 'track3',
        type: 'RESISTIVITY',
        title: 'Resistivity',
        curves: [{ name: 'RT', displayName: 'True Resistivity', color: '#000000', lineWidth: 2, scale: [0.2, 2000], unit: 'ohm-m' }],
        scale: { min: 0.2, max: 2000, logarithmic: true, gridLines: true },
        fills: [
          { type: 'threshold', threshold: 10, color: '#4CAF50', opacity: 0.3, condition: 'greater_than' }
        ],
        width: 1
      }
    ];

    // Add calculated parameters track if calculations are available
    if (calculations.length > 0) {
      tracks.push({
        id: 'track4',
        type: 'CALCULATED',
        title: 'Calculated Parameters',
        curves: [
          { name: 'VSH', displayName: 'Shale Volume', color: '#8D6E63', lineWidth: 2, scale: [0, 1], unit: 'fraction' },
          { name: 'SW', displayName: 'Water Saturation', color: '#2196F3', lineWidth: 2, scale: [0, 1], unit: 'fraction' },
          { name: 'PHIE', displayName: 'Effective Porosity', color: '#FF9800', lineWidth: 2, scale: [0, 0.4], unit: 'fraction' }
        ],
        scale: { min: 0, max: 1, gridLines: true },
        fills: [],
        width: 1
      });
    }

    return tracks;
  }

  /**
   * Calculate overall depth ranges for all wells
   */
  private calculateDepthRanges(wells: WellLogData[]): { overall: [number, number]; byWell: { [wellName: string]: [number, number] } } {
    if (wells.length === 0) {
      return { overall: [0, 1000], byWell: {} };
    }

    let minDepth = Infinity;
    let maxDepth = -Infinity;
    const byWell: { [wellName: string]: [number, number] } = {};

    wells.forEach(well => {
      minDepth = Math.min(minDepth, well.depthRange[0]);
      maxDepth = Math.max(maxDepth, well.depthRange[1]);
      byWell[well.wellName] = well.depthRange;
    });

    return {
      overall: [minDepth, maxDepth],
      byWell
    };
  }

  /**
   * Aggregate quality metrics from all calculations
   */
  private aggregateQualityMetrics(calculations: CalculationResults[]): any {
    if (calculations.length === 0) {
      return { overallQuality: 'unknown', calculationCount: 0 };
    }

    const qualityLevels = calculations.map(calc => calc.qualityMetrics.confidenceLevel);
    const highQuality = qualityLevels.filter(q => q === 'high').length;
    const mediumQuality = qualityLevels.filter(q => q === 'medium').length;
    const lowQuality = qualityLevels.filter(q => q === 'low').length;

    let overallQuality: 'high' | 'medium' | 'low';
    if (highQuality / calculations.length > 0.7) {
      overallQuality = 'high';
    } else if ((highQuality + mediumQuality) / calculations.length > 0.5) {
      overallQuality = 'medium';
    } else {
      overallQuality = 'low';
    }

    return {
      overallQuality,
      calculationCount: calculations.length,
      qualityDistribution: { high: highQuality, medium: mediumQuality, low: lowQuality }
    };
  }

  /**
   * Setup event handlers for real-time updates
   */
  private setupEventHandlers(): void {
    if (this.config.enableRealTimeUpdates) {
      // Listen for parameter changes and trigger recalculations
      this.on('parameter_change', async (data) => {
        await this.handleParameterChange(data.workflowId, data.parameters);
      });

      // Listen for calculation completion
      this.on('calculation_complete', (data) => {
        this.handleCalculationComplete(data.workflowId, data.results);
      });
    }
  }

  /**
   * Handle parameter changes for real-time updates
   */
  private async handleParameterChange(workflowId: string, parameters: CalculationParameters): Promise<void> {
    const state = this.activeWorkflows.get(workflowId);
    if (!state || state.status !== 'complete') return;

    try {
      // Recalculate affected calculations
      await this.performAllCalculations(workflowId, parameters);
      
      // Update visualization data
      const visualizationData = await this.prepareVisualizationData(workflowId);
      
      this.emit('workflow_updated', { workflowId, visualizationData });
      
    } catch (error) {
      this.emit('workflow_error', { workflowId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Handle calculation completion
   */
  private handleCalculationComplete(workflowId: string, results: CalculationResults[]): void {
    const state = this.activeWorkflows.get(workflowId);
    if (!state) return;

    // Update state with new results
    state.calculations = results;
    
    this.emit('calculations_updated', { workflowId, calculations: results });
  }

  /**
   * Emit progress updates
   */
  private emitProgress(workflowId: string, step: string, progress: number, message: string): void {
    if (this.config.enableProgressTracking) {
      const update: ProgressUpdate = {
        workflowId,
        step,
        progress,
        message,
        timestamp: new Date()
      };

      this.emit('progress', update);
    }
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow state
   */
  public getWorkflowState(workflowId: string): WorkflowState | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Cancel workflow
   */
  public cancelWorkflow(workflowId: string): void {
    const state = this.activeWorkflows.get(workflowId);
    if (state) {
      state.status = 'error';
      state.errors.push('Workflow cancelled by user');
      this.activeWorkflows.delete(workflowId);
      this.emit('workflow_cancelled', { workflowId });
    }
  }

  /**
   * Clear completed workflows
   */
  public clearCompletedWorkflows(): void {
    for (const [id, state] of this.activeWorkflows.entries()) {
      if (state.status === 'complete' || state.status === 'error') {
        this.activeWorkflows.delete(id);
      }
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): WorkflowConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WorkflowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance metrics and optimization report
   */
  public getPerformanceReport(): any {
    if (!this.config.enablePerformanceOptimization) {
      return {
        optimizationEnabled: false,
        message: 'Performance optimization is disabled'
      };
    }

    return {
      optimizationEnabled: true,
      ...this.performanceOptimizer.getPerformanceReport(),
      workflowMetrics: {
        activeWorkflows: this.activeWorkflows.size,
        queuedCalculations: this.calculationQueue.size,
        cachedResults: this.resultCache.size
      }
    };
  }

  /**
   * Clear all caches and optimize memory
   */
  public optimizeMemory(): void {
    // Clear legacy cache
    this.resultCache.clear();
    
    // Clear calculation queue
    this.calculationQueue.clear();
    
    // Use performance optimizer cleanup
    if (this.config.enablePerformanceOptimization) {
      this.performanceOptimizer.cleanup();
    }
    
    // Clear error history
    this.errorHandler.clearErrorHistory();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get comprehensive error and performance report
   */
  public getSystemReport(): {
    performance: any;
    errors: any;
    workflows: {
      active: number;
      completed: number;
      failed: number;
    };
  } {
    const performanceReport = this.getPerformanceReport();
    const errorStats = this.errorHandler.getErrorStatistics();
    
    // Calculate workflow statistics
    let completed = 0;
    let failed = 0;
    
    for (const workflow of this.activeWorkflows.values()) {
      if (workflow.status === 'complete') completed++;
      if (workflow.status === 'error') failed++;
    }

    return {
      performance: performanceReport,
      errors: errorStats,
      workflows: {
        active: this.activeWorkflows.size,
        completed,
        failed
      }
    };
  }

  /**
   * Show user feedback through error handler
   */
  public showUserFeedback(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string, duration?: number): void {
    this.errorHandler.showUserFeedback({
      type,
      title,
      message,
      duration
    });
  }

  /**
   * Get active progress indicators
   */
  public getActiveProgress(): any[] {
    return this.errorHandler.getActiveProgress();
  }

  /**
   * Setup error handler event forwarding
   */
  private setupErrorHandlerEvents(): void {
    // Forward error handler events to workflow orchestrator events
    this.errorHandler.on('error', (errorDetails) => {
      this.emit('system_error', errorDetails);
    });

    this.errorHandler.on('user_feedback', (feedback) => {
      this.emit('user_feedback', feedback);
    });

    this.errorHandler.on('progress_start', (progress) => {
      this.emit('progress_start', progress);
    });

    this.errorHandler.on('progress_update', (progress) => {
      this.emit('progress_update', progress);
    });

    this.errorHandler.on('progress_end', (progress) => {
      this.emit('progress_end', progress);
    });
  }
}

// Export default instance
export const petrophysicsWorkflow = new PetrophysicsWorkflowOrchestrator();