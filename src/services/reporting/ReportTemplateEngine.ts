import { CalculationResults, WellLogData, ReservoirZone, CompletionTarget } from '../../types/petrophysics';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  metadata: TemplateMetadata;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'calculation_summary';
  content: string;
  data?: any;
  formatting?: SectionFormatting;
}

export interface TemplateMetadata {
  version: string;
  author: string;
  created: Date;
  lastModified: Date;
  category: 'formation_evaluation' | 'completion_design' | 'reservoir_characterization';
}

export interface SectionFormatting {
  fontSize?: number;
  fontFamily?: string;
  alignment?: 'left' | 'center' | 'right';
  margins?: { top: number; bottom: number; left: number; right: number };
  pageBreak?: boolean;
}

export interface ReportData {
  wells: WellLogData[];
  calculations: CalculationResults[];
  reservoirZones?: ReservoirZone[];
  completionTargets?: CompletionTarget[];
  metadata: {
    projectName: string;
    analyst: string;
    date: Date;
    company?: string;
    field?: string;
  };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  sections: ProcessedSection[];
  metadata: ReportData['metadata'];
  generatedAt: Date;
}

export interface ProcessedSection {
  id: string;
  title: string;
  type: string;
  content: string;
  processedContent: string;
  data?: any;
}

export class ReportTemplateEngine {
  private templates: Map<string, ReportTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Register a new report template
   */
  registerTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all available templates
   */
  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Generate report from template and data
   */
  generateReport(templateId: string, data: ReportData): GeneratedReport {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const processedSections = template.sections.map(section => 
      this.processSection(section, data)
    );

    return {
      id: this.generateReportId(),
      templateId,
      title: this.processTemplate(template.name, data),
      sections: processedSections,
      metadata: data.metadata,
      generatedAt: new Date()
    };
  }

  /**
   * Process a single section with data
   */
  private processSection(section: ReportSection, data: ReportData): ProcessedSection {
    let processedContent = this.processTemplate(section.content, data);

    // Handle different section types
    switch (section.type) {
      case 'calculation_summary':
        processedContent = this.generateCalculationSummary(data.calculations);
        break;
      case 'table':
        if (section.data) {
          processedContent = this.generateTableContent(section.data, data);
        }
        break;
      case 'chart':
        // Chart content will be handled by visualization components
        break;
    }

    return {
      id: section.id,
      title: this.processTemplate(section.title, data),
      type: section.type,
      content: section.content,
      processedContent,
      data: section.data
    };
  }

  /**
   * Process template strings with data substitution
   */
  private processTemplate(template: string, data: ReportData): string {
    let processed = template;

    // Replace metadata placeholders
    processed = processed.replace(/\{\{projectName\}\}/g, data.metadata.projectName);
    processed = processed.replace(/\{\{analyst\}\}/g, data.metadata.analyst);
    processed = processed.replace(/\{\{date\}\}/g, data.metadata.date.toLocaleDateString());
    processed = processed.replace(/\{\{company\}\}/g, data.metadata.company || 'N/A');
    processed = processed.replace(/\{\{field\}\}/g, data.metadata.field || 'N/A');

    // Replace well data placeholders
    if (data.wells.length > 0) {
      const wellNames = data.wells.map(w => w.wellName).join(', ');
      processed = processed.replace(/\{\{wellNames\}\}/g, wellNames);
      processed = processed.replace(/\{\{wellCount\}\}/g, data.wells.length.toString());
    }

    return processed;
  }

  /**
   * Generate calculation summary content
   */
  private generateCalculationSummary(calculations: CalculationResults[]): string {
    if (calculations.length === 0) {
      return 'No calculations available.';
    }

    let summary = '## Calculation Summary\n\n';
    
    calculations.forEach(calc => {
      summary += `### ${calc.calculationType} - ${calc.method}\n`;
      summary += `- Well: ${calc.wellName}\n`;
      summary += `- Mean: ${calc.statistics.mean.toFixed(3)}\n`;
      summary += `- Standard Deviation: ${calc.statistics.standardDeviation.toFixed(3)}\n`;
      summary += `- Range: ${calc.statistics.min.toFixed(3)} - ${calc.statistics.max.toFixed(3)}\n`;
      summary += `- Quality: ${calc.qualityMetrics.confidenceLevel}\n\n`;
    });

    return summary;
  }

  /**
   * Generate table content from data
   */
  private generateTableContent(tableConfig: any, data: ReportData): string {
    // This would generate HTML table or markdown table based on configuration
    // For now, return a simple placeholder
    return `Table: ${tableConfig.title || 'Data Table'}`;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    // Formation Evaluation Template
    const formationEvaluationTemplate: ReportTemplate = {
      id: 'formation_evaluation',
      name: 'Formation Evaluation Report - {{projectName}}',
      description: 'Comprehensive formation evaluation with petrophysical analysis',
      sections: [
        {
          id: 'executive_summary',
          title: 'Executive Summary',
          type: 'text',
          content: `This report presents the formation evaluation results for {{wellNames}} in the {{field}} field. The analysis was conducted by {{analyst}} on {{date}} using industry-standard petrophysical methods.

Key findings include reservoir characterization, porosity and permeability estimates, and hydrocarbon saturation calculations. The results support completion design recommendations and reservoir development planning.`
        },
        {
          id: 'well_information',
          title: 'Well Information',
          type: 'table',
          content: 'Well details and basic information',
          data: { type: 'well_info' }
        },
        {
          id: 'calculation_results',
          title: 'Petrophysical Calculations',
          type: 'calculation_summary',
          content: 'Summary of all petrophysical calculations performed'
        },
        {
          id: 'reservoir_characterization',
          title: 'Reservoir Characterization',
          type: 'text',
          content: `Based on the petrophysical analysis, the reservoir zones have been identified and characterized. The analysis includes porosity distribution, permeability estimates, and fluid saturation calculations.

Net-to-gross ratios and reservoir quality indices provide insight into completion potential and expected production performance.`
        }
      ],
      metadata: {
        version: '1.0',
        author: 'System',
        created: new Date(),
        lastModified: new Date(),
        category: 'formation_evaluation'
      }
    };

    // Completion Design Template
    const completionDesignTemplate: ReportTemplate = {
      id: 'completion_design',
      name: 'Completion Design Recommendations - {{projectName}}',
      description: 'Completion design recommendations based on petrophysical analysis',
      sections: [
        {
          id: 'completion_summary',
          title: 'Completion Design Summary',
          type: 'text',
          content: `This report provides completion design recommendations for {{wellNames}} based on comprehensive petrophysical analysis. The recommendations include perforation intervals, completion methods, and expected production performance.

Analysis conducted by {{analyst}} on {{date}} for {{company}}.`
        },
        {
          id: 'target_identification',
          title: 'Completion Target Identification',
          type: 'table',
          content: 'Identified completion targets with ranking and recommendations',
          data: { type: 'completion_targets' }
        },
        {
          id: 'perforation_recommendations',
          title: 'Perforation Recommendations',
          type: 'text',
          content: `Based on the reservoir quality analysis, the following perforation intervals are recommended:

- High-quality reservoir zones with porosity > 12% and water saturation < 50%
- Completion efficiency optimization based on net-to-gross ratios
- Consideration of geological and geomechanical factors`
        },
        {
          id: 'expected_performance',
          title: 'Expected Performance',
          type: 'calculation_summary',
          content: 'Performance predictions based on petrophysical properties'
        }
      ],
      metadata: {
        version: '1.0',
        author: 'System',
        created: new Date(),
        lastModified: new Date(),
        category: 'completion_design'
      }
    };

    this.registerTemplate(formationEvaluationTemplate);
    this.registerTemplate(completionDesignTemplate);
  }
}