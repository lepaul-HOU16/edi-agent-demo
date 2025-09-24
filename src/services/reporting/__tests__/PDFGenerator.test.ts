import { PDFGenerator, PDFGenerationOptions } from '../PDFGenerator';
import { GeneratedReport, ReportData } from '../ReportTemplateEngine';

describe('PDFGenerator', () => {
  let generator: PDFGenerator;
  let mockReport: GeneratedReport;

  beforeEach(() => {
    generator = new PDFGenerator();
    
    mockReport = {
      id: 'test-report-1',
      templateId: 'formation_evaluation',
      title: 'Test Formation Evaluation Report',
      sections: [
        {
          id: 'executive_summary',
          title: 'Executive Summary',
          type: 'text',
          content: 'Original content',
          processedContent: 'This is a test executive summary for the formation evaluation report.'
        },
        {
          id: 'calculations',
          title: 'Petrophysical Calculations',
          type: 'calculation_summary',
          content: 'Calculation content',
          processedContent: 'Porosity calculations show average values of 15% with standard deviation of 3%.'
        },
        {
          id: 'recommendations',
          title: 'Recommendations',
          type: 'text',
          content: 'Recommendation content',
          processedContent: 'Based on the analysis, completion in zones with porosity > 12% is recommended.'
        }
      ],
      metadata: {
        projectName: 'Test Project',
        analyst: 'Test Analyst',
        date: new Date('2024-01-15'),
        company: 'Test Company',
        field: 'Test Field'
      },
      generatedAt: new Date('2024-01-15T10:00:00Z')
    };
  });

  describe('PDF Generation', () => {
    it('should generate PDF from report with default options', async () => {
      const pdfBuffer = await generator.generatePDF(mockReport);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      const pdfContent = pdfBuffer.toString('utf-8');
      expect(pdfContent).toContain('%PDF-1.4');
      expect(pdfContent).toContain(mockReport.title);
      expect(pdfContent).toContain(mockReport.metadata.analyst);
    });

    it('should generate PDF with custom options', async () => {
      const options: Partial<PDFGenerationOptions> = {
        format: 'Letter',
        orientation: 'landscape',
        includeHeader: false,
        includeFooter: false,
        includeTOC: true
      };

      const pdfBuffer = await generator.generatePDF(mockReport, options);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      const pdfContent = pdfBuffer.toString('utf-8');
      expect(pdfContent).toContain('612 792'); // Letter format dimensions
    });

    it('should generate PDF with embedded plots', async () => {
      const plotImages = new Map<string, Buffer>();
      plotImages.set('well-log-plot', Buffer.from('mock-image-data'));
      plotImages.set('correlation-plot', Buffer.from('mock-correlation-data'));

      const pdfBuffer = await generator.generatePDFWithPlots(mockReport, plotImages);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      const pdfContent = pdfBuffer.toString('utf-8');
      expect(pdfContent).toContain('%PDF-1.4');
    });

    it('should include table of contents when requested', async () => {
      const options: Partial<PDFGenerationOptions> = {
        includeTOC: true
      };

      const pdfBuffer = await generator.generatePDF(mockReport, options);
      const pdfContent = pdfBuffer.toString('utf-8');
      
      // The TOC content would be in the document structure
      expect(pdfContent).toContain('Table of Contents');
    });
  });

  describe('Options Validation', () => {
    it('should validate PDF generation options', () => {
      const validOptions: Partial<PDFGenerationOptions> = {
        format: 'A4',
        orientation: 'portrait',
        margins: { top: 72, bottom: 72, left: 72, right: 72 }
      };

      const errors = generator.validateOptions(validOptions);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid format', () => {
      const invalidOptions = {
        format: 'Invalid' as any
      };

      const errors = generator.validateOptions(invalidOptions);
      expect(errors).toContain('Invalid format. Must be A4 or Letter.');
    });

    it('should return errors for invalid orientation', () => {
      const invalidOptions = {
        orientation: 'invalid' as any
      };

      const errors = generator.validateOptions(invalidOptions);
      expect(errors).toContain('Invalid orientation. Must be portrait or landscape.');
    });

    it('should return errors for negative margins', () => {
      const invalidOptions = {
        margins: { top: -10, bottom: 72, left: 72, right: 72 }
      };

      const errors = generator.validateOptions(invalidOptions);
      expect(errors).toContain('Margins must be non-negative values.');
    });
  });

  describe('Chart Embedding', () => {
    it('should embed chart with default options', async () => {
      const chartData = {
        type: 'line',
        data: [1, 2, 3, 4, 5],
        labels: ['A', 'B', 'C', 'D', 'E']
      };

      const imageBuffer = await generator.embedChart(chartData);
      
      expect(imageBuffer).toBeInstanceOf(Buffer);
      expect(imageBuffer.length).toBeGreaterThan(0);
    });

    it('should embed chart with custom options', async () => {
      const chartData = { type: 'bar', data: [10, 20, 30] };
      const options = {
        width: 1200,
        height: 800,
        dpi: 600,
        format: 'png' as const,
        backgroundColor: '#ffffff'
      };

      const imageBuffer = await generator.embedChart(chartData, options);
      
      expect(imageBuffer).toBeInstanceOf(Buffer);
      expect(imageBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('Generation Statistics', () => {
    it('should calculate generation statistics', () => {
      const document = {
        title: 'Test Document',
        author: 'Test Author',
        subject: 'Test Subject',
        creator: 'Test Creator',
        sections: [
          {
            type: 'text' as const,
            content: 'This is a text section with some content.',
            styling: {}
          },
          {
            type: 'image' as const,
            content: 'Image section',
            styling: {}
          },
          {
            type: 'table' as const,
            content: 'Table section with data',
            styling: {}
          }
        ],
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          version: '1.0'
        }
      };

      const stats = generator.getGenerationStats(document);
      
      expect(stats.sectionCount).toBe(3);
      expect(stats.hasImages).toBe(true);
      expect(stats.hasTables).toBe(true);
      expect(stats.contentLength).toBeGreaterThan(0);
      expect(stats.estimatedPages).toBeGreaterThan(0);
    });

    it('should calculate statistics for text-only document', () => {
      const document = {
        title: 'Text Document',
        author: 'Author',
        subject: 'Subject',
        creator: 'Creator',
        sections: [
          {
            type: 'text' as const,
            content: 'Short text content.',
            styling: {}
          }
        ],
        metadata: {
          createdAt: new Date(),
          modifiedAt: new Date(),
          version: '1.0'
        }
      };

      const stats = generator.getGenerationStats(document);
      
      expect(stats.sectionCount).toBe(1);
      expect(stats.hasImages).toBe(false);
      expect(stats.hasTables).toBe(false);
      expect(stats.estimatedPages).toBe(1);
    });
  });

  describe('PDF Content Structure', () => {
    it('should create proper PDF document structure', async () => {
      const pdfBuffer = await generator.generatePDF(mockReport);
      const pdfContent = pdfBuffer.toString('utf-8');
      
      // Check PDF structure elements
      expect(pdfContent).toContain('%PDF-1.4');
      expect(pdfContent).toContain('/Type /Catalog');
      expect(pdfContent).toContain('/Type /Pages');
      expect(pdfContent).toContain('/Type /Page');
      expect(pdfContent).toContain('xref');
      expect(pdfContent).toContain('trailer');
      expect(pdfContent).toContain('startxref');
      expect(pdfContent).toContain('%%EOF');
    });

    it('should include document metadata in PDF', async () => {
      const pdfBuffer = await generator.generatePDF(mockReport);
      const pdfContent = pdfBuffer.toString('utf-8');
      
      expect(pdfContent).toContain(`/Title (${mockReport.title})`);
      expect(pdfContent).toContain(`/Author (${mockReport.metadata.analyst})`);
      expect(pdfContent).toContain('/Subject (Petrophysical Analysis Report');
      expect(pdfContent).toContain('/Creator (Professional Petrophysical Analysis System)');
    });

    it('should handle different page formats', async () => {
      const a4Options = { format: 'A4' as const };
      const letterOptions = { format: 'Letter' as const };

      const a4PDF = await generator.generatePDF(mockReport, a4Options);
      const letterPDF = await generator.generatePDF(mockReport, letterOptions);

      const a4Content = a4PDF.toString('utf-8');
      const letterContent = letterPDF.toString('utf-8');

      expect(a4Content).toContain('595 842'); // A4 dimensions
      expect(letterContent).toContain('612 792'); // Letter dimensions
    });
  });

  describe('Error Handling', () => {
    it('should handle empty report sections', async () => {
      const emptyReport = {
        ...mockReport,
        sections: []
      };

      const pdfBuffer = await generator.generatePDF(emptyReport);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle missing metadata gracefully', async () => {
      const reportWithMissingData = {
        ...mockReport,
        metadata: {
          projectName: 'Test Project',
          analyst: 'Test Analyst',
          date: new Date('2024-01-15')
          // Missing company and field
        }
      };

      const pdfBuffer = await generator.generatePDF(reportWithMissingData);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});