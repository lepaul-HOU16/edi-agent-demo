import { GeneratedReport, ReportData } from './ReportTemplateEngine';

export interface PDFGenerationOptions {
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  includeHeader: boolean;
  includeFooter: boolean;
  includeTOC: boolean;
  logoUrl?: string;
  watermark?: string;
}

export interface PDFSection {
  type: 'text' | 'table' | 'chart' | 'image' | 'page_break';
  content: string;
  data?: any;
  styling?: PDFSectionStyling;
}

export interface PDFSectionStyling {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  marginTop?: number;
  marginBottom?: number;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface PDFDocument {
  title: string;
  author: string;
  subject: string;
  creator: string;
  sections: PDFSection[];
  metadata: {
    createdAt: Date;
    modifiedAt: Date;
    version: string;
  };
}

export interface ChartEmbedOptions {
  width: number;
  height: number;
  dpi: number;
  format: 'png' | 'svg' | 'jpeg';
  backgroundColor?: string;
}

export class PDFGenerator {
  private defaultOptions: PDFGenerationOptions = {
    format: 'A4',
    orientation: 'portrait',
    margins: {
      top: 72,    // 1 inch
      bottom: 72,
      left: 72,
      right: 72
    },
    includeHeader: true,
    includeFooter: true,
    includeTOC: false
  };

  /**
   * Generate PDF from report data
   */
  async generatePDF(
    report: GeneratedReport, 
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<Buffer> {
    const pdfOptions = { ...this.defaultOptions, ...options };
    const pdfDocument = this.createPDFDocument(report, pdfOptions);
    
    return this.renderPDF(pdfDocument, pdfOptions);
  }

  /**
   * Generate PDF with embedded log plots
   */
  async generatePDFWithPlots(
    report: GeneratedReport,
    plotImages: Map<string, Buffer>,
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<Buffer> {
    const pdfOptions = { ...this.defaultOptions, ...options };
    const pdfDocument = this.createPDFDocumentWithPlots(report, plotImages, pdfOptions);
    
    return this.renderPDF(pdfDocument, pdfOptions);
  }

  /**
   * Create PDF document structure from report
   */
  private createPDFDocument(
    report: GeneratedReport, 
    options: PDFGenerationOptions
  ): PDFDocument {
    const sections: PDFSection[] = [];

    // Add title page
    sections.push({
      type: 'text',
      content: report.title,
      styling: {
        fontSize: 24,
        fontWeight: 'bold',
        alignment: 'center',
        marginTop: 100,
        marginBottom: 50
      }
    });

    // Add metadata section
    sections.push({
      type: 'text',
      content: this.formatMetadata(report.metadata),
      styling: {
        fontSize: 12,
        alignment: 'center',
        marginBottom: 50
      }
    });

    // Add page break after title
    sections.push({
      type: 'page_break',
      content: ''
    });

    // Add table of contents if requested
    if (options.includeTOC) {
      sections.push({
        type: 'text',
        content: 'Table of Contents',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 20
        }
      });

      const tocContent = this.generateTableOfContents(report);
      sections.push({
        type: 'text',
        content: tocContent,
        styling: {
          fontSize: 12,
          marginBottom: 30
        }
      });

      sections.push({
        type: 'page_break',
        content: ''
      });
    }

    // Add report sections
    report.sections.forEach((section, index) => {
      // Add section title
      sections.push({
        type: 'text',
        content: section.title,
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginTop: index === 0 ? 0 : 30,
          marginBottom: 15
        }
      });

      // Add section content
      sections.push({
        type: this.mapSectionType(section.type),
        content: section.processedContent,
        data: section.data,
        styling: {
          fontSize: 11,
          marginBottom: 20,
          alignment: 'justify'
        }
      });
    });

    return {
      title: report.title,
      author: report.metadata.analyst,
      subject: `Petrophysical Analysis Report - ${report.metadata.projectName}`,
      creator: 'Professional Petrophysical Analysis System',
      sections,
      metadata: {
        createdAt: report.generatedAt,
        modifiedAt: new Date(),
        version: '1.0'
      }
    };
  }

  /**
   * Create PDF document with embedded plots
   */
  private createPDFDocumentWithPlots(
    report: GeneratedReport,
    plotImages: Map<string, Buffer>,
    options: PDFGenerationOptions
  ): PDFDocument {
    const baseDocument = this.createPDFDocument(report, options);
    
    // Insert plot images after relevant sections
    const sectionsWithPlots: PDFSection[] = [];
    
    baseDocument.sections.forEach(section => {
      sectionsWithPlots.push(section);
      
      // Add plots after calculation sections
      if (section.content.includes('Calculation') || section.content.includes('Analysis')) {
        plotImages.forEach((imageBuffer, plotId) => {
          sectionsWithPlots.push({
            type: 'image',
            content: `Log Plot: ${plotId}`,
            data: {
              imageBuffer,
              width: 500,
              height: 700,
              caption: `Figure: ${plotId} Log Display`
            },
            styling: {
              alignment: 'center',
              marginTop: 20,
              marginBottom: 20,
              pageBreakAfter: true
            }
          });
        });
      }
    });

    return {
      ...baseDocument,
      sections: sectionsWithPlots
    };
  }

  /**
   * Render PDF document to buffer
   */
  private async renderPDF(
    document: PDFDocument, 
    options: PDFGenerationOptions
  ): Promise<Buffer> {
    // In a real implementation, this would use a PDF library like PDFKit, jsPDF, or Puppeteer
    // For now, we'll create a mock PDF buffer with document metadata
    
    const pdfContent = this.createMockPDFContent(document, options);
    return Buffer.from(pdfContent, 'utf-8');
  }

  /**
   * Create mock PDF content for testing
   */
  private createMockPDFContent(
    document: PDFDocument, 
    options: PDFGenerationOptions
  ): string {
    let content = `%PDF-1.4
%Mock PDF Document
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Title (${document.title})
/Author (${document.author})
/Subject (${document.subject})
/Creator (${document.creator})
/CreationDate (D:${this.formatPDFDate(document.metadata.createdAt)})
/ModDate (D:${this.formatPDFDate(document.metadata.modifiedAt)})
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${options.format === 'A4' ? '595 842' : '612 792'}]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${document.sections.length * 100}
>>
stream
BT
/F1 12 Tf
72 750 Td
`;

    // Add document content
    document.sections.forEach((section, index) => {
      const yPosition = 750 - (index * 30);
      content += `(${section.content.substring(0, 50).replace(/[()]/g, '')}) Tj\n`;
      content += `0 -20 Td\n`;
    });

    content += `ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000200 00000 n 
0000000250 00000 n 
0000000350 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${content.length + 100}
%%EOF`;

    return content;
  }

  /**
   * Format metadata for display
   */
  private formatMetadata(metadata: ReportData['metadata']): string {
    return `
Project: ${metadata.projectName}
Analyst: ${metadata.analyst}
Date: ${metadata.date.toLocaleDateString()}
${metadata.company ? `Company: ${metadata.company}` : ''}
${metadata.field ? `Field: ${metadata.field}` : ''}
    `.trim();
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(report: GeneratedReport): string {
    let toc = '';
    report.sections.forEach((section, index) => {
      toc += `${index + 1}. ${section.title} ........................ ${index + 2}\n`;
    });
    return toc;
  }

  /**
   * Map section type to PDF section type
   */
  private mapSectionType(sectionType: string): 'text' | 'table' | 'chart' | 'image' | 'page_break' {
    switch (sectionType) {
      case 'table':
        return 'table';
      case 'chart':
        return 'chart';
      case 'image':
        return 'image';
      default:
        return 'text';
    }
  }

  /**
   * Format date for PDF metadata
   */
  private formatPDFDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Embed chart image in PDF
   */
  async embedChart(
    chartData: any, 
    options: ChartEmbedOptions = {
      width: 800,
      height: 600,
      dpi: 300,
      format: 'png'
    }
  ): Promise<Buffer> {
    // In a real implementation, this would render the chart to an image
    // For now, return a mock image buffer
    const mockImageData = `Mock chart image data: ${JSON.stringify(chartData).substring(0, 100)}`;
    return Buffer.from(mockImageData, 'utf-8');
  }

  /**
   * Validate PDF generation options
   */
  validateOptions(options: Partial<PDFGenerationOptions>): string[] {
    const errors: string[] = [];

    if (options.format && !['A4', 'Letter'].includes(options.format)) {
      errors.push('Invalid format. Must be A4 or Letter.');
    }

    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push('Invalid orientation. Must be portrait or landscape.');
    }

    if (options.margins) {
      const { top, bottom, left, right } = options.margins;
      if (top < 0 || bottom < 0 || left < 0 || right < 0) {
        errors.push('Margins must be non-negative values.');
      }
    }

    return errors;
  }

  /**
   * Get PDF generation statistics
   */
  getGenerationStats(document: PDFDocument): {
    sectionCount: number;
    estimatedPages: number;
    contentLength: number;
    hasImages: boolean;
    hasTables: boolean;
  } {
    const sectionCount = document.sections.length;
    const contentLength = document.sections.reduce((total, section) => 
      total + section.content.length, 0
    );
    const hasImages = document.sections.some(section => section.type === 'image');
    const hasTables = document.sections.some(section => section.type === 'table');
    
    // Rough estimation: 500 characters per page
    const estimatedPages = Math.ceil(contentLength / 500) + (hasImages ? 2 : 0);

    return {
      sectionCount,
      estimatedPages,
      contentLength,
      hasImages,
      hasTables
    };
  }
}