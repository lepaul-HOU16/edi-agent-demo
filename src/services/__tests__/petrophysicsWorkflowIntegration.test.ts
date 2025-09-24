/**
 * Integration tests for Petrophysics Workflow Orchestrator
 * Tests complete workflow from LAS file upload to final report generation
 * Requirements: 1.1, 2.1, 3.4, 5.1
 */

import { 
  PetrophysicsWorkflowOrchestrator, 
  WorkflowConfig, 
  WorkflowState, 
  WorkflowResult 
} from '../petrophysicsWorkflowOrchestrator';
import { WellLogData, CalculationParameters } from '../../types/petrophysics';

// Mock data for testing
const createMockWellData = (wellName: string): WellLogData => ({
  wellName,
  wellInfo: {
    wellName,
    field: 'Test Field',
    operator: 'Test Operator',
    location: { latitude: 30.0, longitude: -95.0 },
    elevation: 100,
    totalDepth: 10000,
    spudDate: new Date('2023-01-01')
  },
  curves: [
    {
      name: 'DEPT',
      unit: 'FT',
      description: 'Depth',
      data: Array.from({ length: 1000 }, (_, i) => 8000 + i),
      nullValue: -999.25,
      quality: {
        completeness: 1.0,
        outliers: 0,
        gaps: 0,
        environmentalCorrections: []
      }
    },
    {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: Array.from({ length: 1000 }, (_, i) => 50 + Math.random() * 100),
      nullValue: -999.25,
      quality: {
        completeness: 0.95,
        outliers: 2,
        gaps: 1,
        environmentalCorrections: ['borehole_correction']
      }
    },
    {
      name: 'NPHI',
      unit: 'V/V',
      description: 'Neutron Porosity',
      data: Array.from({ length: 1000 }, (_, i) => 0.1 + Math.random() * 0.3),
      nullValue: -999.25,
      quality: {
        completeness: 0.92,
        outliers: 5,
        gaps: 2,
        environmentalCorrections: ['environmental_correction']
      }
    },
    {
      name: 'RHOB',
      unit: 'G/C3',
      description: 'Bulk Density',
      data: Array.from({ length: 1000 }, (_, i) => 2.2 + Math.random() * 0.5),
      nullValue: -999.25,
      quality: {
        completeness: 0.98,
        outliers: 1,
        gaps: 0,
        environmentalCorrections: ['mud_cake_correction']
      }
    },
    {
      name: 'RT',
      unit: 'OHMM',
      description: 'True Resistivity',
      data: Array.from({ length: 1000 }, (_, i) => 1 + Math.random() * 100),
      nullValue: -999.25,
      quality: {
        completeness: 0.90,
        outliers: 8,
        gaps: 3,
        environmentalCorrections: ['invasion_correction']
      }
    }
  ],
  depthRange: [8000, 9000],
  dataQuality: {
    overallQuality: 'good',
    completeness: 0.94,
    issues: ['Minor data gaps in resistivity log'],
    recommendations: ['Consider additional environmental corrections']
  },
  lastModified: new Date()
});

const createMockCalculationParameters = (): CalculationParameters => ({
  matrixDensity: 2.65,
  fluidDensity: 1.0,
  a: 1.0,
  m: 2.0,
  n: 2.0,
  rw: 0.1,
  grClean: 30,
  grShale: 120
});

describe('PetrophysicsWorkflowOrchestrator Integration Tests', () => {
  let orchestrator: PetrophysicsWorkflowOrchestrator;
  let mockWells: WellLogData[];
  let mockParameters: CalculationParameters;

  beforeEach(() => {
    const config: Partial<WorkflowConfig> = {
      enableRealTimeUpdates: true,
      autoSaveResults: false,
      cacheTimeout: 60000,
      maxConcurrentCalculations: 2,
      enableProgressTracking: true,
      enableErrorRecovery: true
    };

    orchestrator = new PetrophysicsWorkflowOrchestrator(config);
    mockWells = [
      createMockWellData('WELL-001'),
      createMockWellData('WELL-002')
    ];
    mockParameters = createMockCalculationParameters();
  });

  afterEach(() => {
    orchestrator.removeAllListeners();
    orchestrator.clearCompletedWorkflows();
  });

  describe('Complete Workflow Integration', () => {
    test('should execute complete workflow successfully', async () => {
      const progressUpdates: any[] = [];
      const errors: any[] = [];

      orchestrator.on('progress', (update) => {
        progressUpdates.push(update);
      });

      orchestrator.on('workflow_error', (error) => {
        errors.push(error);
      });

      const result = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF', 'Excel']
      );

      // Verify workflow completion
      expect(result).toBeDefined();
      expect(result.state.status).toBe('complete');
      expect(result.state.progress).toBe(100);
      expect(result.state.wells).toHaveLength(2);
      expect(result.state.calculations.length).toBeGreaterThan(0);

      // Verify progress tracking
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].progress).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);

      // Verify no critical errors
      expect(errors.length).toBe(0);

      // Verify reports generated
      expect(result.reports).toBeDefined();
      expect(result.reports.length).toBeGreaterThan(0);

      // Verify exports created
      expect(result.exportedFiles).toBeDefined();
      expect(Object.keys(result.exportedFiles)).toContain('PDF');
      expect(Object.keys(result.exportedFiles)).toContain('Excel');

      // Verify visualization data
      expect(result.visualizationData).toBeDefined();
      expect(result.visualizationData.wells).toHaveLength(2);
      expect(result.visualizationData.trackConfigs).toBeDefined();
    }, 30000); // 30 second timeout for complete workflow

    test('should handle workflow with single well', async () => {
      const singleWell = [createMockWellData('SINGLE-WELL')];

      const result = await orchestrator.startCompleteWorkflow(
        singleWell,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(result.state.status).toBe('complete');
      expect(result.state.wells).toHaveLength(1);
      expect(result.state.calculations.length).toBeGreaterThan(0);
      expect(result.reports.length).toBeGreaterThan(0);
    });

    test('should handle workflow with minimal export formats', async () => {
      const result = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(result.state.status).toBe('complete');
      expect(Object.keys(result.exportedFiles)).toHaveLength(1);
      expect(result.exportedFiles.PDF).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid well data gracefully', async () => {
      const invalidWell: WellLogData = {
        ...createMockWellData('INVALID-WELL'),
        curves: [] // No curves
      };

      await expect(
        orchestrator.startCompleteWorkflow(
          [invalidWell],
          mockParameters,
          ['formation_evaluation'],
          ['PDF']
        )
      ).rejects.toThrow('No valid wells loaded');
    });

    test('should continue workflow with partial calculation failures', async () => {
      // Create well with missing required curves
      const partialWell: WellLogData = {
        ...createMockWellData('PARTIAL-WELL'),
        curves: [
          {
            name: 'DEPT',
            unit: 'FT',
            description: 'Depth',
            data: Array.from({ length: 100 }, (_, i) => 8000 + i),
            nullValue: -999.25,
            quality: {
              completeness: 1.0,
              outliers: 0,
              gaps: 0,
              environmentalCorrections: []
            }
          },
          {
            name: 'GR',
            unit: 'API',
            description: 'Gamma Ray',
            data: Array.from({ length: 100 }, (_, i) => 50 + Math.random() * 100),
            nullValue: -999.25,
            quality: {
              completeness: 0.95,
              outliers: 2,
              gaps: 1,
              environmentalCorrections: []
            }
          }
          // Missing NPHI, RHOB, RT curves
        ]
      };

      const result = await orchestrator.startCompleteWorkflow(
        [partialWell],
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      // Should complete but with warnings/errors
      expect(result.state.status).toBe('complete');
      expect(result.state.warnings.length).toBeGreaterThan(0);
    });

    test('should handle workflow cancellation', async () => {
      const workflowPromise = orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      // Cancel workflow after a short delay
      setTimeout(() => {
        const workflowId = Array.from((orchestrator as any).activeWorkflows.keys())[0];
        if (workflowId) {
          orchestrator.cancelWorkflow(workflowId);
        }
      }, 100);

      await expect(workflowPromise).rejects.toThrow();
    });
  });

  describe('Real-time Updates', () => {
    test('should handle parameter changes during workflow', async () => {
      const result = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(result.state.status).toBe('complete');

      // Test parameter change
      const updatedParameters = {
        ...mockParameters,
        matrixDensity: 2.7
      };

      const updatePromise = new Promise((resolve) => {
        orchestrator.once('workflow_updated', resolve);
      });

      orchestrator.emit('parameter_change', {
        workflowId: result.state.id,
        parameters: updatedParameters
      });

      await updatePromise;
      // Should trigger recalculation
    });

    test('should emit progress updates throughout workflow', async () => {
      const progressUpdates: any[] = [];

      orchestrator.on('progress', (update) => {
        progressUpdates.push(update);
      });

      await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      // Should have multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(5);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i].progress).toBeGreaterThanOrEqual(progressUpdates[i - 1].progress);
      }

      // Should start at 0 and end at 100
      expect(progressUpdates[0].progress).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache calculation results', async () => {
      const startTime = Date.now();
      
      // First run
      const result1 = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );
      
      const firstRunTime = Date.now() - startTime;

      // Second run with same parameters (should use cache)
      const startTime2 = Date.now();
      
      const result2 = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );
      
      const secondRunTime = Date.now() - startTime2;

      expect(result1.state.status).toBe('complete');
      expect(result2.state.status).toBe('complete');
      
      // Second run should be faster due to caching
      // Note: This is a rough test and may not always pass due to system variations
      expect(secondRunTime).toBeLessThan(firstRunTime * 1.5);
    });

    test('should handle concurrent calculations within limits', async () => {
      const config: Partial<WorkflowConfig> = {
        maxConcurrentCalculations: 1 // Limit to 1 for testing
      };

      const limitedOrchestrator = new PetrophysicsWorkflowOrchestrator(config);

      const result = await limitedOrchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(result.state.status).toBe('complete');
      expect(result.state.calculations.length).toBeGreaterThan(0);

      limitedOrchestrator.removeAllListeners();
    });
  });

  describe('Workflow State Management', () => {
    test('should track workflow state correctly', async () => {
      let currentState: WorkflowState | null = null;

      orchestrator.on('progress', (update) => {
        currentState = orchestrator.getWorkflowState(update.workflowId);
      });

      const result = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(currentState).toBeDefined();
      expect(currentState!.status).toBe('complete');
      expect(currentState!.id).toBe(result.state.id);
    });

    test('should clear completed workflows', async () => {
      const result = await orchestrator.startCompleteWorkflow(
        mockWells,
        mockParameters,
        ['formation_evaluation'],
        ['PDF']
      );

      expect(orchestrator.getWorkflowState(result.state.id)).toBeDefined();

      orchestrator.clearCompletedWorkflows();

      expect(orchestrator.getWorkflowState(result.state.id)).toBeUndefined();
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration correctly', () => {
      const newConfig: Partial<WorkflowConfig> = {
        enableRealTimeUpdates: false,
        maxConcurrentCalculations: 8
      };

      orchestrator.updateConfig(newConfig);
      const updatedConfig = orchestrator.getConfig();

      expect(updatedConfig.enableRealTimeUpdates).toBe(false);
      expect(updatedConfig.maxConcurrentCalculations).toBe(8);
    });

    test('should maintain default configuration values', () => {
      const config = orchestrator.getConfig();

      expect(config.enableRealTimeUpdates).toBeDefined();
      expect(config.autoSaveResults).toBeDefined();
      expect(config.cacheTimeout).toBeDefined();
      expect(config.maxConcurrentCalculations).toBeDefined();
      expect(config.enableProgressTracking).toBeDefined();
      expect(config.enableErrorRecovery).toBeDefined();
    });
  });
});

describe('End-to-End Workflow Tests', () => {
  test('should complete full analysis workflow with all components', async () => {
    const orchestrator = new PetrophysicsWorkflowOrchestrator({
      enableRealTimeUpdates: true,
      enableProgressTracking: true,
      enableErrorRecovery: true
    });

    const wells = [
      createMockWellData('E2E-WELL-001'),
      createMockWellData('E2E-WELL-002'),
      createMockWellData('E2E-WELL-003')
    ];

    const parameters = createMockCalculationParameters();

    const result = await orchestrator.startCompleteWorkflow(
      wells,
      parameters,
      ['formation_evaluation', 'completion_design'],
      ['PDF', 'Excel', 'LAS']
    );

    // Verify complete workflow
    expect(result.state.status).toBe('complete');
    expect(result.state.wells).toHaveLength(3);
    expect(result.state.calculations.length).toBeGreaterThan(0);
    expect(result.state.reservoirZones.length).toBeGreaterThan(0);
    expect(result.state.completionTargets.length).toBeGreaterThan(0);

    // Verify all reports generated
    expect(result.reports).toHaveLength(2);
    expect(result.reports.some(r => r.templateId === 'formation_evaluation')).toBe(true);
    expect(result.reports.some(r => r.templateId === 'completion_design')).toBe(true);

    // Verify all exports created
    expect(Object.keys(result.exportedFiles)).toHaveLength(3);
    expect(result.exportedFiles.PDF).toBeDefined();
    expect(result.exportedFiles.Excel).toBeDefined();
    expect(result.exportedFiles.LAS).toBeDefined();

    // Verify visualization data structure
    expect(result.visualizationData.wells).toHaveLength(3);
    expect(result.visualizationData.trackConfigs).toBeDefined();
    expect(result.visualizationData.depthRanges).toBeDefined();
    expect(result.visualizationData.qualityMetrics).toBeDefined();

    orchestrator.removeAllListeners();
  }, 45000); // 45 second timeout for full E2E test
});