// Professional Reporting System
// Export all reporting services and types

export { ReportTemplateEngine } from './ReportTemplateEngine';
export type {
  ReportTemplate,
  ReportSection,
  TemplateMetadata,
  SectionFormatting,
  ReportData,
  GeneratedReport,
  ProcessedSection
} from './ReportTemplateEngine';

export { PDFGenerator } from './PDFGenerator';
export type {
  PDFGenerationOptions,
  PDFSection,
  PDFSectionStyling,
  PDFDocument,
  ChartEmbedOptions
} from './PDFGenerator';

export { ExcelExporter } from './ExcelExporter';
export type {
  ExcelExportOptions,
  ExcelFormatting,
  ExcelWorksheet,
  WorksheetFormatting,
  ConditionalFormat,
  ExcelChart,
  ExcelWorkbook
} from './ExcelExporter';

export { LASExporter } from './LASExporter';
export type {
  LASExportOptions,
  LASHeader,
  LASWellInfo,
  LASCurveInfo,
  LASParameterInfo,
  LASFile
} from './LASExporter';