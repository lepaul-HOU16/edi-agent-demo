import { ReportTemplateEngine, ReportTemplate, ReportData } from '../ReportTemplateEngine';
import { CalculationResults, WellLogData, StatisticalSummary, QualityMetrics } from '../../../types/petrophysics';

describe('ReportTemplateEngine', () => {
  let engine: ReportTemplateEngine;
  let mockReportData: ReportData;

  beforeEach(() => {
    engine = new ReportTemplateEngine();
    
    // Create mock data
    const mockWellData: WellLogData = {
      wellName: 'TEST-001',
      wellInfo: {
        wellName: 'TEST-001',
        field: 'Test Field',
        operator: 'Test Operator',
        location: { latitude: 30.0, longitude: -95.0 },
        elevation: 100,
        totalDepth: 10000
      },
      curves: [],
      depthRange: [8000, 9000],
      dataQuality: {
        dataCompleteness: 0.95,
        environmentalCorrections: ['borehole_correction'],
        uncertaintyRange: [0.02, 0.05],
        confidenceLevel: 'high'
      },
      lastModified: new Date()
    };

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

    const mockCalculationResults: CalculationResults = {
      wellName: 'TEST-001',
      calculationType: 'porosity',
      method: 'density_neutron',
      parameters: { matrixDensity: 2.65, fluidDensity: 1.0 },
      results: [],
      statistics: mockStatistics,
      qualityMetrics: mockQualityMetrics,
      timestamp: new Date()
    };

    mockReportData = {
      wells: [mockWellData],
      calculations: [mockCalculationResults],
      metadata: {
        projectName: 'Test Project',
        analyst: 'Test Analyst',
        date: new Date('2024-01-14'),
        company: 'Test Company',
        field: 'Test Field'
      }
    };
  });

  describe('Template Management', () => {
    it('should initialize with default templates', () => {
      const templates = engine.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const formationTemplate = templates.find(t => t.id === 'formation_evaluation');
      expect(formationTemplate).toBeDefined();
      expect(formationTemplate?.metadata.category).toBe('formation_evaluation');
      
      const completionTemplate = templates.find(t => t.id === 'completion_design');
      expect(completionTemplate).toBeDefined();
      expect(completionTemplate?.metadata.category).toBe('completion_design');
    });

    it('should register new templates', () => {
      const customTemplate: ReportTemplate = {
        id: 'custom_template',
        name: 'Custom Template',
        description: 'A custom test template',
        sections: [
          {
            id: 'test_section',
            title: 'Test Section',
            type: 'text',
            content: 'Test content'
          }
        ],
        metadata: {
          version: '1.0',
          author: 'Test',
          created: new Date(),
          lastModified: new Date(),
          category: 'formation_evaluation'
        }
      };

      engine.registerTemplate(customTemplate);
      
      const retrieved = engine.getTemplate('custom_template');
      expect(retrieved).toEqual(customTemplate);
    });

    it('should retrieve template by ID', () => {
      const template = engine.getTemplate('formation_evaluation');
      expect(template).toBeDefined();
      expect(template?.id).toBe('formation_evaluation');
    });

    it('should return undefined for non-existent template', () => {
      const template = engine.getTemplate('non_existent');
      expect(template).toBeUndefined();
    });
  });

  describe('Report Generation', () => {
    it('should generate report from template and data', () => {
      const report = engine.generateReport('formation_evaluation', mockReportData);
      
      expect(report).toBeDefined();
      expect(report.templateId).toBe('formation_evaluation');
      expect(report.title).toContain('Test Project');
      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.metadata).toEqual(mockReportData.metadata);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        engine.generateReport('non_existent', mockReportData);
      }).toThrow('Template with ID non_existent not found');
    });

    it('should process template placeholders correctly', () => {
      const report = engine.generateReport('formation_evaluation', mockReportData);
      
      // Check that placeholders were replaced
      expect(report.title).toBe('Formation Evaluation Report - Test Project');
      
      const executiveSummary = report.sections.find(s => s.id === 'executive_summary');
      expect(executiveSummary?.processedContent).toContain('Test Analyst');
      expect(executiveSummary?.processedContent).toContain('TEST-001');
      expect(executiveSummary?.processedContent).toContain('Test Field');
    });

    it('should generate calculation summary section', () => {
      const report = engine.generateReport('formation_evaluation', mockReportData);
      
      const calcSection = report.sections.find(s => s.type === 'calculation_summary');
      expect(calcSection).toBeDefined();
      expect(calcSection?.processedContent).toContain('Calculation Summary');
      expect(calcSection?.processedContent).toContain('porosity');
      expect(calcSection?.processedContent).toContain('TEST-001');
      expect(calcSection?.processedContent).toContain('0.150'); // mean value
    });

    it('should handle empty calculations gracefully', () => {
      const dataWithoutCalcs = {
        ...mockReportData,
        calculations: []
      };
      
      const report = engine.generateReport('formation_evaluation', dataWithoutCalcs);
      const calcSection = report.sections.find(s => s.type === 'calculation_summary');
      
      expect(calcSection?.processedContent).toBe('No calculations available.');
    });
  });

  describe('Template Processing', () => {
    it('should replace metadata placeholders', () => {
      const template = 'Project: {{projectName}}, Analyst: {{analyst}}, Date: {{date}}';
      const engine = new ReportTemplateEngine();
      
      // Access private method through type assertion for testing
      const processed = (engine as any).processTemplate(template, mockReportData);
      
      expect(processed).toContain('Test Project');
      expect(processed).toContain('Test Analyst');
      expect(processed).toMatch(/Date: \d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should replace well data placeholders', () => {
      const template = 'Wells: {{wellNames}}, Count: {{wellCount}}';
      const engine = new ReportTemplateEngine();
      
      const processed = (engine as any).processTemplate(template, mockReportData);
      
      expect(processed).toContain('TEST-001');
      expect(processed).toContain('1');
    });

    it('should handle missing optional fields', () => {
      const dataWithoutOptional = {
        ...mockReportData,
        metadata: {
          ...mockReportData.metadata,
          company: undefined,
          field: undefined
        }
      };
      
      const template = 'Company: {{company}}, Field: {{field}}';
      const engine = new ReportTemplateEngine();
      
      const processed = (engine as any).processTemplate(template, dataWithoutOptional);
      
      expect(processed).toContain('N/A');
    });
  });

  describe('Section Processing', () => {
    it('should process text sections correctly', () => {
      const section = {
        id: 'test',
        title: 'Test {{projectName}}',
        type: 'text' as const,
        content: 'Content for {{analyst}}'
      };
      
      const engine = new ReportTemplateEngine();
      const processed = (engine as any).processSection(section, mockReportData);
      
      expect(processed.title).toBe('Test Test Project');
      expect(processed.processedContent).toBe('Content for Test Analyst');
    });

    it('should generate unique report IDs', () => {
      const report1 = engine.generateReport('formation_evaluation', mockReportData);
      const report2 = engine.generateReport('formation_evaluation', mockReportData);
      
      expect(report1.id).not.toBe(report2.id);
      expect(report1.id).toMatch(/^report_\d+_[a-z0-9]+$/);
    });
  });

  describe('Default Templates', () => {
    it('should have formation evaluation template with correct structure', () => {
      const template = engine.getTemplate('formation_evaluation');
      
      expect(template).toBeDefined();
      expect(template?.name).toContain('Formation Evaluation Report');
      expect(template?.sections).toHaveLength(4);
      
      const sectionIds = template?.sections.map(s => s.id);
      expect(sectionIds).toContain('executive_summary');
      expect(sectionIds).toContain('well_information');
      expect(sectionIds).toContain('calculation_results');
      expect(sectionIds).toContain('reservoir_characterization');
    });

    it('should have completion design template with correct structure', () => {
      const template = engine.getTemplate('completion_design');
      
      expect(template).toBeDefined();
      expect(template?.name).toContain('Completion Design Recommendations');
      expect(template?.sections).toHaveLength(4);
      
      const sectionIds = template?.sections.map(s => s.id);
      expect(sectionIds).toContain('completion_summary');
      expect(sectionIds).toContain('target_identification');
      expect(sectionIds).toContain('perforation_recommendations');
      expect(sectionIds).toContain('expected_performance');
    });
  });
});