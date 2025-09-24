/**
 * Methodology Compliance Verification Tests
 * Tests for SPE and SPWLA standard compliance checking
 */

import { 
  MethodologyComplianceService, 
  WorkflowCompliance, 
  CalculationStep,
  ComplianceStandard 
} from '../methodologyCompliance';

describe('MethodologyComplianceService', () => {
  let complianceService: MethodologyComplianceService;

  beforeEach(() => {
    complianceService = new MethodologyComplianceService();
  });

  describe('Standard Loading', () => {
    it('should load SPE standards', () => {
      const standards = complianceService.getAvailableStandards();
      const speStandards = standards.filter(s => s.organization === 'SPE');
      
      expect(speStandards.length).toBeGreaterThan(0);
      expect(speStandards.some(s => s.standardId === 'SPE-96')).toBe(true);
      expect(speStandards.some(s => s.standardId === 'SPE-182')).toBe(true);
    });

    it('should load SPWLA standards', () => {
      const standards = complianceService.getAvailableStandards();
      const spwlaStandards = standards.filter(s => s.organization === 'SPWLA');
      
      expect(spwlaStandards.length).toBeGreaterThan(0);
      expect(spwlaStandards.some(s => s.standardId === 'SPWLA-2023')).toBe(true);
    });

    it('should load API standards', () => {
      const standards = complianceService.getAvailableStandards();
      const apiStandards = standards.filter(s => s.organization === 'API');
      
      expect(apiStandards.length).toBeGreaterThan(0);
      expect(apiStandards.some(s => s.standardId === 'API-RP-40')).toBe(true);
    });

    it('should have proper standard structure', () => {
      const spe96 = complianceService.getStandard('SPE-96');
      expect(spe96).toBeDefined();
      expect(spe96!.organization).toBe('SPE');
      expect(spe96!.requirements.length).toBeGreaterThan(0);
      expect(spe96!.applicableCalculations.length).toBeGreaterThan(0);
      expect(spe96!.references.length).toBeGreaterThan(0);
    });
  });

  describe('SPE Standard Compliance', () => {
    it('should validate SPE-96 parameter range requirements', async () => {
      const compliantWorkflow: WorkflowCompliance = {
        workflowName: 'SPE Compliant Porosity Calculation',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: {
              matrixDensity: 2.65, // Within SPE-96 sandstone range
              fluidDensity: 1.0
            },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Density porosity using standard sandstone matrix density',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(compliantWorkflow);
      const spe96Result = results.find(r => r.standardId === 'SPE-96');
      
      expect(spe96Result).toBeDefined();
      expect(spe96Result!.overallCompliance).toBe('compliant');
      expect(spe96Result!.complianceScore).toBeGreaterThanOrEqual(90);
    });

    it('should detect SPE-96 parameter range violations', async () => {
      const nonCompliantWorkflow: WorkflowCompliance = {
        workflowName: 'Non-compliant Porosity Calculation',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: {
              matrixDensity: 3.0, // Outside SPE-96 sandstone range
              fluidDensity: 1.0
            },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Density porosity with non-standard matrix density',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(nonCompliantWorkflow);
      const spe96Result = results.find(r => r.standardId === 'SPE-96');
      
      expect(spe96Result).toBeDefined();
      expect(spe96Result!.overallCompliance).toBe('non_compliant');
      
      const parameterRequirement = spe96Result!.requirementResults.find(r => r.requirementId === 'SPE-96-001');
      expect(parameterRequirement!.status).toBe('failed');
      expect(parameterRequirement!.details).toContain('Matrix density 3 outside recommended range');
    });

    it('should validate SPE-182 Archie parameter requirements', async () => {
      const archieWorkflow: WorkflowCompliance = {
        workflowName: 'Archie Saturation Calculation',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'saturation',
            method: 'archie',
            parameters: {
              a: 1.0,  // Within SPE-182 range
              m: 2.0,  // Within SPE-182 range
              n: 2.0,  // Within SPE-182 range
              rw: 0.05
            },
            inputData: { RT: [10, 15, 20], POROSITY: [0.15, 0.18, 0.12] },
            results: [0.4, 0.3, 0.5],
            methodology: 'Archie equation with standard parameters for clean sandstone',
            uncertainty: [0.1, 0.1, 0.1],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(archieWorkflow);
      const spe182Result = results.find(r => r.standardId === 'SPE-182');
      
      expect(spe182Result).toBeDefined();
      
      const archieRequirement = spe182Result!.requirementResults.find(r => r.requirementId === 'SPE-182-001');
      expect(archieRequirement!.status).toBe('passed');
    });

    it('should detect SPE-182 Archie parameter violations', async () => {
      const nonCompliantArchieWorkflow: WorkflowCompliance = {
        workflowName: 'Non-compliant Archie Calculation',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'saturation',
            method: 'archie',
            parameters: {
              a: 3.0,  // Outside SPE-182 range
              m: 1.0,  // Outside SPE-182 range
              n: 3.0,  // Outside SPE-182 range
              rw: 0.05
            },
            inputData: { RT: [10, 15, 20], POROSITY: [0.15, 0.18, 0.12] },
            results: [0.4, 0.3, 0.5],
            methodology: 'Archie equation with non-standard parameters',
            uncertainty: [0.1, 0.1, 0.1],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(nonCompliantArchieWorkflow);
      const spe182Result = results.find(r => r.standardId === 'SPE-182');
      
      expect(spe182Result).toBeDefined();
      
      const archieRequirement = spe182Result!.requirementResults.find(r => r.requirementId === 'SPE-182-001');
      expect(archieRequirement!.status).toBe('warning');
      expect(archieRequirement!.details).toContain('parameter');
      expect(archieRequirement!.details).toContain('outside recommended range');
    });
  });

  describe('SPWLA Standard Compliance', () => {
    it('should validate SPWLA-2023 documentation requirements', async () => {
      const documentedWorkflow: WorkflowCompliance = {
        workflowName: 'Well-documented Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Comprehensive methodology documentation with equations and parameter justification',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(documentedWorkflow);
      const spwlaResult = results.find(r => r.standardId === 'SPWLA-2023');
      
      expect(spwlaResult).toBeDefined();
      
      const docRequirement = spwlaResult!.requirementResults.find(r => r.requirementId === 'SPWLA-2023-001');
      expect(docRequirement!.status).toBe('passed');
    });

    it('should detect missing documentation', async () => {
      const undocumentedWorkflow: WorkflowCompliance = {
        workflowName: 'Poorly documented Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: '', // Missing documentation
            uncertainty: [],  // Missing uncertainty
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(undocumentedWorkflow);
      const spwlaResult = results.find(r => r.standardId === 'SPWLA-2023');
      
      expect(spwlaResult).toBeDefined();
      expect(spwlaResult!.overallCompliance).toBe('non_compliant');
      
      const docRequirement = spwlaResult!.requirementResults.find(r => r.requirementId === 'SPWLA-2023-001');
      expect(docRequirement!.status).toBe('failed');
    });
  });

  describe('Uncertainty Reporting Compliance', () => {
    it('should validate proper uncertainty reporting', async () => {
      const uncertaintyCompliantWorkflow: WorkflowCompliance = {
        workflowName: 'Uncertainty Compliant Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Density porosity calculation with uncertainty analysis',
            uncertainty: [0.02, 0.02, 0.02], // Proper uncertainty reporting
            qualityMetrics: { dataCompleteness: 100 }
          },
          {
            stepId: 'step2',
            calculationType: 'saturation',
            method: 'archie',
            parameters: { a: 1.0, m: 2.0, n: 2.0, rw: 0.05 },
            inputData: { RT: [10, 15, 20], POROSITY: [0.15, 0.18, 0.12] },
            results: [0.4, 0.3, 0.5],
            methodology: 'Archie saturation with uncertainty analysis',
            uncertainty: [0.08, 0.06, 0.10], // Proper uncertainty reporting
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(uncertaintyCompliantWorkflow);
      const spe96Result = results.find(r => r.standardId === 'SPE-96');
      
      expect(spe96Result).toBeDefined();
      
      const uncertaintyRequirement = spe96Result!.requirementResults.find(r => r.requirementId === 'SPE-96-002');
      expect(uncertaintyRequirement!.status).toBe('passed');
    });

    it('should detect missing uncertainty reporting', async () => {
      const noUncertaintyWorkflow: WorkflowCompliance = {
        workflowName: 'No Uncertainty Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Density porosity calculation',
            uncertainty: [], // Missing uncertainty
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(noUncertaintyWorkflow);
      const spe96Result = results.find(r => r.standardId === 'SPE-96');
      
      expect(spe96Result).toBeDefined();
      
      const uncertaintyRequirement = spe96Result!.requirementResults.find(r => r.requirementId === 'SPE-96-002');
      expect(uncertaintyRequirement!.status).toBe('failed');
      expect(uncertaintyRequirement!.details).toContain('Missing uncertainty for: porosity');
    });
  });

  describe('Certification Levels', () => {
    it('should assign regulatory_ready certification for high compliance', async () => {
      const highComplianceWorkflow: WorkflowCompliance = {
        workflowName: 'High Compliance Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Comprehensive density porosity calculation with full documentation',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(highComplianceWorkflow);
      
      // Should have high compliance scores
      results.forEach(result => {
        if (result.complianceScore >= 95) {
          expect(result.certificationLevel).toBe('regulatory_ready');
        } else if (result.complianceScore >= 85) {
          expect(result.certificationLevel).toBe('industry_standard');
        }
      });
    });

    it('should assign research_grade certification for low compliance', async () => {
      const lowComplianceWorkflow: WorkflowCompliance = {
        workflowName: 'Low Compliance Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 3.5, fluidDensity: 1.0 }, // Non-compliant parameter
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: '', // Missing documentation
            uncertainty: [], // Missing uncertainty
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(lowComplianceWorkflow);
      
      // Should have low compliance scores
      results.forEach(result => {
        if (result.complianceScore < 85) {
          expect(result.certificationLevel).toBe('research_grade');
        }
      });
    });
  });

  describe('Compliance Recommendations', () => {
    it('should provide specific recommendations for failed requirements', async () => {
      const failedWorkflow: WorkflowCompliance = {
        workflowName: 'Failed Requirements Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 3.0, fluidDensity: 1.0 }, // Non-compliant
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: '', // Missing
            uncertainty: [], // Missing
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(failedWorkflow);
      
      results.forEach(result => {
        expect(result.recommendations.length).toBeGreaterThan(0);
        
        if (result.overallCompliance === 'non_compliant') {
          expect(result.recommendations.some(rec => 
            rec.includes('failed requirements')
          )).toBe(true);
        }
      });
    });

    it('should provide positive recommendations for compliant workflows', async () => {
      const compliantWorkflow: WorkflowCompliance = {
        workflowName: 'Compliant Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Complete methodology documentation',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'not_certified',
        validationDate: new Date()
      };

      const results = await complianceService.validateWorkflowCompliance(compliantWorkflow);
      
      results.forEach(result => {
        if (result.overallCompliance === 'compliant') {
          expect(result.recommendations.some(rec => 
            rec.includes('Excellent compliance')
          )).toBe(true);
        }
      });
    });
  });

  describe('Compliance Report Generation', () => {
    it('should generate comprehensive compliance report', async () => {
      const workflow: WorkflowCompliance = {
        workflowName: 'Test Workflow',
        calculationSteps: [
          {
            stepId: 'step1',
            calculationType: 'porosity',
            method: 'density',
            parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
            inputData: { RHOB: [2.4, 2.5, 2.6] },
            results: [0.15, 0.09, 0.03],
            methodology: 'Test methodology',
            uncertainty: [0.02, 0.02, 0.02],
            qualityMetrics: { dataCompleteness: 100 }
          }
        ],
        complianceResults: [],
        overallCertification: 'conditionally_certified',
        validationDate: new Date()
      };

      // Add compliance results
      workflow.complianceResults = await complianceService.validateWorkflowCompliance(workflow);

      const report = complianceService.generateComplianceReport(workflow);
      const parsedReport = JSON.parse(report);

      expect(parsedReport.workflowName).toBe('Test Workflow');
      expect(parsedReport.overallCertification).toBe('conditionally_certified');
      expect(parsedReport.complianceResults.length).toBeGreaterThan(0);
      expect(parsedReport.summary.totalStandards).toBeGreaterThan(0);
      expect(parsedReport.summary.averageScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Standard Retrieval', () => {
    it('should retrieve specific standards by ID', () => {
      const spe96 = complianceService.getStandard('SPE-96');
      expect(spe96).toBeDefined();
      expect(spe96!.standardId).toBe('SPE-96');
      expect(spe96!.organization).toBe('SPE');
    });

    it('should return undefined for non-existent standards', () => {
      const nonExistent = complianceService.getStandard('NON-EXISTENT');
      expect(nonExistent).toBeUndefined();
    });

    it('should list all available standards', () => {
      const standards = complianceService.getAvailableStandards();
      expect(standards.length).toBeGreaterThanOrEqual(4); // SPE-96, SPE-182, SPWLA-2023, API-RP-40
      
      const organizations = [...new Set(standards.map(s => s.organization))];
      expect(organizations).toContain('SPE');
      expect(organizations).toContain('SPWLA');
      expect(organizations).toContain('API');
    });
  });
});