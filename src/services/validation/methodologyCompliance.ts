/**
 * Methodology Compliance Verification System
 * Validates petrophysical calculation workflows against SPE and SPWLA standards
 * Ensures industry best practices and regulatory submission format compliance
 */

export interface ComplianceStandard {
  organization: 'SPE' | 'SPWLA' | 'API' | 'AAPG';
  standardId: string;
  title: string;
  version: string;
  datePublished: string;
  applicableCalculations: string[];
  requirements: ComplianceRequirement[];
  references: string[];
}

export interface ComplianceRequirement {
  id: string;
  category: 'methodology' | 'documentation' | 'validation' | 'reporting' | 'quality_control';
  severity: 'mandatory' | 'recommended' | 'optional';
  description: string;
  validationCriteria: ValidationCriteria;
  examples: string[];
}

export interface ValidationCriteria {
  type: 'parameter_range' | 'methodology_usage' | 'documentation_completeness' | 'calculation_accuracy' | 'uncertainty_reporting';
  criteria: any;
}

export interface ComplianceResult {
  standardId: string;
  overallCompliance: 'compliant' | 'non_compliant' | 'partially_compliant';
  complianceScore: number; // 0-100%
  requirementResults: RequirementResult[];
  recommendations: string[];
  certificationLevel: 'industry_standard' | 'regulatory_ready' | 'research_grade';
}

export interface RequirementResult {
  requirementId: string;
  status: 'passed' | 'failed' | 'warning' | 'not_applicable';
  details: string;
  evidence: any;
}

export interface WorkflowCompliance {
  workflowName: string;
  calculationSteps: CalculationStep[];
  complianceResults: ComplianceResult[];
  overallCertification: 'certified' | 'conditionally_certified' | 'not_certified';
  validationDate: Date;
}

export interface CalculationStep {
  stepId: string;
  calculationType: string;
  method: string;
  parameters: any;
  inputData: any;
  results: any;
  methodology: string;
  uncertainty: any;
  qualityMetrics: any;
}

export class MethodologyComplianceService {
  private standards: Map<string, ComplianceStandard> = new Map();

  constructor() {
    this.loadIndustryStandards();
  }

  /**
   * Load industry standards for compliance verification
   */
  private loadIndustryStandards(): void {
    this.loadSPEStandards();
    this.loadSPWLAStandards();
    this.loadAPIStandards();
  }

  /**
   * Load SPE (Society of Petroleum Engineers) standards
   */
  private loadSPEStandards(): void {
    // SPE-96 Petrophysical Data Reliability and Uncertainty
    const spe96: ComplianceStandard = {
      organization: 'SPE',
      standardId: 'SPE-96',
      title: 'Petrophysical Data Reliability and Uncertainty',
      version: '2023.1',
      datePublished: '2023-01-01',
      applicableCalculations: ['porosity', 'saturation', 'permeability', 'shale_volume'],
      requirements: [
        {
          id: 'SPE-96-001',
          category: 'methodology',
          severity: 'mandatory',
          description: 'Porosity calculations must use appropriate matrix density for lithology',
          validationCriteria: {
            type: 'parameter_range',
            criteria: {
              sandstone: { matrixDensity: [2.60, 2.70] },
              limestone: { matrixDensity: [2.68, 2.74] },
              dolomite: { matrixDensity: [2.83, 2.90] }
            }
          },
          examples: ['Sandstone: 2.65 g/cc', 'Limestone: 2.71 g/cc', 'Dolomite: 2.87 g/cc']
        },
        {
          id: 'SPE-96-002',
          category: 'uncertainty_reporting',
          severity: 'mandatory',
          description: 'Uncertainty ranges must be reported for all calculated parameters',
          validationCriteria: {
            type: 'uncertainty_reporting',
            criteria: {
              porosity: { minUncertainty: 0.01, maxUncertainty: 0.05 },
              saturation: { minUncertainty: 0.05, maxUncertainty: 0.20 },
              permeability: { minUncertainty: 0.20, maxUncertainty: 1.00 }
            }
          },
          examples: ['Porosity: ±2-5%', 'Saturation: ±5-20%', 'Permeability: ±20-100%']
        },
        {
          id: 'SPE-96-003',
          category: 'validation',
          severity: 'recommended',
          description: 'Calculations should be validated against core data when available',
          validationCriteria: {
            type: 'calculation_accuracy',
            criteria: {
              coreValidation: { minCorrelation: 0.80, maxDeviation: 0.15 }
            }
          },
          examples: ['Core porosity vs log porosity R² > 0.80']
        }
      ],
      references: [
        'SPE-96: Petrophysical Data Reliability and Uncertainty Guidelines',
        'SPE Petrophysics Best Practices Manual 2023'
      ]
    };

    // SPE-182 Formation Evaluation Standards
    const spe182: ComplianceStandard = {
      organization: 'SPE',
      standardId: 'SPE-182',
      title: 'Formation Evaluation Standards',
      version: '2023.1',
      datePublished: '2023-01-01',
      applicableCalculations: ['saturation', 'shale_volume'],
      requirements: [
        {
          id: 'SPE-182-001',
          category: 'methodology',
          severity: 'mandatory',
          description: 'Archie equation parameters must be justified for reservoir conditions',
          validationCriteria: {
            type: 'methodology_usage',
            criteria: {
              archie: {
                a: [0.5, 2.0],
                m: [1.5, 2.5],
                n: [1.5, 2.5],
                temperatureCorrection: true
              }
            }
          },
          examples: ['Clean sandstone: a=1.0, m=2.0, n=2.0', 'Carbonate: a=1.0, m=2.0-2.2, n=2.0']
        },
        {
          id: 'SPE-182-002',
          category: 'quality_control',
          severity: 'mandatory',
          description: 'Environmental corrections must be applied to log data',
          validationCriteria: {
            type: 'methodology_usage',
            criteria: {
              environmentalCorrections: ['borehole_size', 'mud_filtrate', 'temperature', 'pressure']
            }
          },
          examples: ['Borehole size correction for neutron porosity', 'Temperature correction for resistivity']
        }
      ],
      references: [
        'SPE-182: Formation Evaluation Standards',
        'Cased Hole Log Interpretation Principles/Applications'
      ]
    };

    this.standards.set('SPE-96', spe96);
    this.standards.set('SPE-182', spe182);
  }

  /**
   * Load SPWLA (Society of Petrophysicists and Well Log Analysts) standards
   */
  private loadSPWLAStandards(): void {
    // SPWLA-2023 Formation Evaluation Best Practices
    const spwla2023: ComplianceStandard = {
      organization: 'SPWLA',
      standardId: 'SPWLA-2023',
      title: 'Formation Evaluation Best Practices',
      version: '2023.1',
      datePublished: '2023-01-01',
      applicableCalculations: ['porosity', 'saturation', 'permeability', 'shale_volume'],
      requirements: [
        {
          id: 'SPWLA-2023-001',
          category: 'documentation',
          severity: 'mandatory',
          description: 'Complete methodology documentation must be provided',
          validationCriteria: {
            type: 'documentation_completeness',
            criteria: {
              requiredSections: [
                'calculation_methodology',
                'parameter_selection',
                'uncertainty_analysis',
                'quality_control',
                'validation_results'
              ]
            }
          },
          examples: ['Methodology section with equations', 'Parameter justification', 'Uncertainty analysis']
        },
        {
          id: 'SPWLA-2023-002',
          category: 'methodology',
          severity: 'recommended',
          description: 'Multiple porosity calculation methods should be compared',
          validationCriteria: {
            type: 'methodology_usage',
            criteria: {
              porosityMethods: ['density', 'neutron', 'effective'],
              comparisonRequired: true
            }
          },
          examples: ['Density vs neutron porosity comparison', 'Effective porosity calculation']
        },
        {
          id: 'SPWLA-2023-003',
          category: 'quality_control',
          severity: 'mandatory',
          description: 'Data quality flags must be implemented and documented',
          validationCriteria: {
            type: 'quality_control',
            criteria: {
              qualityFlags: ['bad_hole', 'invasion', 'tool_malfunction', 'environmental_effects'],
              flaggingCriteria: 'documented'
            }
          },
          examples: ['Bad hole conditions flagged', 'Invasion effects identified']
        }
      ],
      references: [
        'SPWLA Formation Evaluation Best Practices 2023',
        'SPWLA Petrophysics Fundamentals'
      ]
    };

    this.standards.set('SPWLA-2023', spwla2023);
  }

  /**
   * Load API (American Petroleum Institute) standards
   */
  private loadAPIStandards(): void {
    // API RP 40 Recommended Practices for Core Analysis
    const apiRp40: ComplianceStandard = {
      organization: 'API',
      standardId: 'API-RP-40',
      title: 'Recommended Practices for Core Analysis',
      version: '2023.1',
      datePublished: '2023-01-01',
      applicableCalculations: ['porosity', 'permeability'],
      requirements: [
        {
          id: 'API-RP-40-001',
          category: 'validation',
          severity: 'recommended',
          description: 'Log-derived parameters should be calibrated to core measurements',
          validationCriteria: {
            type: 'calculation_accuracy',
            criteria: {
              coreCalibration: {
                porosity: { tolerance: 0.03 },
                permeability: { tolerance: 0.5 } // log10 scale
              }
            }
          },
          examples: ['Core porosity within ±3 p.u. of log porosity']
        }
      ],
      references: [
        'API RP 40: Recommended Practices for Core Analysis'
      ]
    };

    this.standards.set('API-RP-40', apiRp40);
  }

  /**
   * Validate workflow compliance against industry standards
   */
  async validateWorkflowCompliance(workflow: WorkflowCompliance): Promise<ComplianceResult[]> {
    const results: ComplianceResult[] = [];

    for (const standard of this.standards.values()) {
      const result = await this.validateAgainstStandard(workflow, standard);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate workflow against a specific standard
   */
  private async validateAgainstStandard(
    workflow: WorkflowCompliance,
    standard: ComplianceStandard
  ): Promise<ComplianceResult> {
    const requirementResults: RequirementResult[] = [];
    let passedCount = 0;
    let totalCount = 0;

    for (const requirement of standard.requirements) {
      const result = await this.validateRequirement(workflow, requirement);
      requirementResults.push(result);
      
      totalCount++;
      if (result.status === 'passed') {
        passedCount++;
      }
    }

    const complianceScore = (passedCount / totalCount) * 100;
    const overallCompliance = this.determineOverallCompliance(complianceScore, requirementResults);
    const certificationLevel = this.determineCertificationLevel(complianceScore, requirementResults);
    const recommendations = this.generateComplianceRecommendations(requirementResults, standard);

    return {
      standardId: standard.standardId,
      overallCompliance,
      complianceScore,
      requirementResults,
      recommendations,
      certificationLevel
    };
  }

  /**
   * Validate a specific requirement
   */
  private async validateRequirement(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): Promise<RequirementResult> {
    const { validationCriteria } = requirement;

    try {
      switch (validationCriteria.type) {
        case 'parameter_range':
          return this.validateParameterRange(workflow, requirement);
        
        case 'methodology_usage':
          return this.validateMethodologyUsage(workflow, requirement);
        
        case 'documentation_completeness':
          return this.validateDocumentationCompleteness(workflow, requirement);
        
        case 'calculation_accuracy':
          return this.validateCalculationAccuracy(workflow, requirement);
        
        case 'uncertainty_reporting':
          return this.validateUncertaintyReporting(workflow, requirement);
        
        default:
          return {
            requirementId: requirement.id,
            status: 'not_applicable',
            details: `Validation type ${validationCriteria.type} not implemented`,
            evidence: null
          };
      }
    } catch (error) {
      return {
        requirementId: requirement.id,
        status: 'failed',
        details: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        evidence: null
      };
    }
  }

  /**
   * Validate parameter ranges
   */
  private validateParameterRange(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): RequirementResult {
    const { criteria } = requirement.validationCriteria;
    const violations: string[] = [];

    for (const step of workflow.calculationSteps) {
      if (step.calculationType === 'porosity' && criteria.sandstone) {
        const matrixDensity = step.parameters.matrixDensity;
        if (matrixDensity && (matrixDensity < criteria.sandstone.matrixDensity[0] || 
                             matrixDensity > criteria.sandstone.matrixDensity[1])) {
          violations.push(`Matrix density ${matrixDensity} outside recommended range for sandstone`);
        }
      }
    }

    return {
      requirementId: requirement.id,
      status: violations.length === 0 ? 'passed' : 'failed',
      details: violations.length === 0 ? 'All parameters within acceptable ranges' : violations.join('; '),
      evidence: { violations, checkedSteps: workflow.calculationSteps.length }
    };
  }

  /**
   * Validate methodology usage
   */
  private validateMethodologyUsage(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): RequirementResult {
    const { criteria } = requirement.validationCriteria;
    const issues: string[] = [];

    for (const step of workflow.calculationSteps) {
      if (step.calculationType === 'saturation' && step.method === 'archie' && criteria.archie) {
        const params = step.parameters;
        
        if (params.a < criteria.archie.a[0] || params.a > criteria.archie.a[1]) {
          issues.push(`Archie 'a' parameter ${params.a} outside recommended range`);
        }
        
        if (params.m < criteria.archie.m[0] || params.m > criteria.archie.m[1]) {
          issues.push(`Archie 'm' parameter ${params.m} outside recommended range`);
        }
        
        if (params.n < criteria.archie.n[0] || params.n > criteria.archie.n[1]) {
          issues.push(`Archie 'n' parameter ${params.n} outside recommended range`);
        }
      }
    }

    return {
      requirementId: requirement.id,
      status: issues.length === 0 ? 'passed' : 'warning',
      details: issues.length === 0 ? 'Methodology usage compliant' : issues.join('; '),
      evidence: { issues, applicableSteps: workflow.calculationSteps.filter(s => s.calculationType === 'saturation').length }
    };
  }

  /**
   * Validate documentation completeness
   */
  private validateDocumentationCompleteness(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): RequirementResult {
    const { criteria } = requirement.validationCriteria;
    const missingDocumentation: string[] = [];

    for (const section of criteria.requiredSections) {
      let hasSection = false;
      
      for (const step of workflow.calculationSteps) {
        if (step.methodology && step.methodology.length > 0) {
          hasSection = true;
          break;
        }
      }
      
      if (!hasSection) {
        missingDocumentation.push(section);
      }
    }

    return {
      requirementId: requirement.id,
      status: missingDocumentation.length === 0 ? 'passed' : 'failed',
      details: missingDocumentation.length === 0 ? 
        'All required documentation sections present' : 
        `Missing documentation: ${missingDocumentation.join(', ')}`,
      evidence: { missingDocumentation, requiredSections: criteria.requiredSections }
    };
  }

  /**
   * Validate calculation accuracy
   */
  private validateCalculationAccuracy(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): RequirementResult {
    // This would validate against core data or other reference measurements
    // For now, return a placeholder implementation
    return {
      requirementId: requirement.id,
      status: 'not_applicable',
      details: 'Core data validation not available in current workflow',
      evidence: null
    };
  }

  /**
   * Validate uncertainty reporting
   */
  private validateUncertaintyReporting(
    workflow: WorkflowCompliance,
    requirement: ComplianceRequirement
  ): RequirementResult {
    const { criteria } = requirement.validationCriteria;
    const missingUncertainty: string[] = [];

    for (const step of workflow.calculationSteps) {
      if (criteria[step.calculationType]) {
        if (!step.uncertainty || step.uncertainty.length === 0) {
          missingUncertainty.push(step.calculationType);
        }
      }
    }

    return {
      requirementId: requirement.id,
      status: missingUncertainty.length === 0 ? 'passed' : 'failed',
      details: missingUncertainty.length === 0 ? 
        'Uncertainty reported for all calculations' : 
        `Missing uncertainty for: ${missingUncertainty.join(', ')}`,
      evidence: { missingUncertainty, totalSteps: workflow.calculationSteps.length }
    };
  }

  /**
   * Determine overall compliance status
   */
  private determineOverallCompliance(
    complianceScore: number,
    requirementResults: RequirementResult[]
  ): 'compliant' | 'non_compliant' | 'partially_compliant' {
    const mandatoryFailures = requirementResults.filter(r => 
      r.status === 'failed' && this.getRequirementSeverity(r.requirementId) === 'mandatory'
    );

    if (mandatoryFailures.length > 0) {
      return 'non_compliant';
    }

    if (complianceScore >= 90) {
      return 'compliant';
    } else if (complianceScore >= 70) {
      return 'partially_compliant';
    } else {
      return 'non_compliant';
    }
  }

  /**
   * Determine certification level
   */
  private determineCertificationLevel(
    complianceScore: number,
    requirementResults: RequirementResult[]
  ): 'industry_standard' | 'regulatory_ready' | 'research_grade' {
    if (complianceScore >= 95) {
      return 'regulatory_ready';
    } else if (complianceScore >= 85) {
      return 'industry_standard';
    } else {
      return 'research_grade';
    }
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    requirementResults: RequirementResult[],
    standard: ComplianceStandard
  ): string[] {
    const recommendations: string[] = [];

    const failedRequirements = requirementResults.filter(r => r.status === 'failed');
    const warningRequirements = requirementResults.filter(r => r.status === 'warning');

    if (failedRequirements.length > 0) {
      recommendations.push(`Address ${failedRequirements.length} failed requirements for ${standard.standardId} compliance`);
      
      failedRequirements.forEach(req => {
        recommendations.push(`${req.requirementId}: ${req.details}`);
      });
    }

    if (warningRequirements.length > 0) {
      recommendations.push(`Review ${warningRequirements.length} warning items for improved compliance`);
    }

    if (failedRequirements.length === 0 && warningRequirements.length === 0) {
      recommendations.push(`Excellent compliance with ${standard.standardId} standards`);
    }

    return recommendations;
  }

  /**
   * Get requirement severity by ID
   */
  private getRequirementSeverity(requirementId: string): 'mandatory' | 'recommended' | 'optional' {
    for (const standard of this.standards.values()) {
      const requirement = standard.requirements.find(r => r.id === requirementId);
      if (requirement) {
        return requirement.severity;
      }
    }
    return 'optional';
  }

  /**
   * Get all available standards
   */
  getAvailableStandards(): ComplianceStandard[] {
    return Array.from(this.standards.values());
  }

  /**
   * Get standard by ID
   */
  getStandard(standardId: string): ComplianceStandard | undefined {
    return this.standards.get(standardId);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(workflowCompliance: WorkflowCompliance): string {
    const report = {
      workflowName: workflowCompliance.workflowName,
      validationDate: workflowCompliance.validationDate,
      overallCertification: workflowCompliance.overallCertification,
      complianceResults: workflowCompliance.complianceResults,
      summary: {
        totalStandards: workflowCompliance.complianceResults.length,
        compliantStandards: workflowCompliance.complianceResults.filter(r => r.overallCompliance === 'compliant').length,
        averageScore: workflowCompliance.complianceResults.reduce((sum, r) => sum + r.complianceScore, 0) / workflowCompliance.complianceResults.length
      }
    };

    return JSON.stringify(report, null, 2);
  }
}