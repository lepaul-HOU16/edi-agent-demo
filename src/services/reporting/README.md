# Professional Reporting System

This module provides comprehensive reporting capabilities for the Professional Petrophysical Analysis System, including template-based report generation, PDF export, Excel export, and LAS file export with calculated curves.

## Components

### 1. ReportTemplateEngine
- **Purpose**: Create and manage report templates for different types of petrophysical reports
- **Features**:
  - Template-based report generation with placeholder substitution
  - Built-in templates for formation evaluation and completion design
  - Configurable sections with different content types (text, tables, charts, calculations)
  - Metadata integration and automatic content processing

### 2. PDFGenerator
- **Purpose**: Generate high-quality PDF reports with industry-standard formatting
- **Features**:
  - Professional PDF layout with headers, footers, and table of contents
  - Embedded log plot support with high-resolution images
  - Multi-page report generation with proper page breaks
  - Configurable formatting options (A4/Letter, portrait/landscape)
  - Industry-standard metadata and document properties

### 3. ExcelExporter
- **Purpose**: Export petrophysical data and analysis results to Excel workbooks
- **Features**:
  - Multi-worksheet export (Summary, Raw Data, Calculations, Statistics, Charts)
  - Calculated curve data export with proper formatting
  - Statistical analysis tables with conditional formatting
  - Chart definitions for data visualization
  - Configurable column widths and formatting options

### 4. LASExporter
- **Purpose**: Export calculated curves to industry-standard LAS format
- **Features**:
  - LAS 2.0 and 3.0 format support
  - Integration of calculated curves with original log data
  - Proper curve metadata and parameter documentation
  - Multiple well export capabilities
  - Industry-standard mnemonics and units

## Usage Examples

### Generate Formation Evaluation Report
```typescript
import { ReportTemplateEngine, PDFGenerator } from './reporting';

const templateEngine = new ReportTemplateEngine();
const pdfGenerator = new PDFGenerator();

// Generate report from template
const report = templateEngine.generateReport('formation_evaluation', reportData);

// Export to PDF
const pdfBuffer = await pdfGenerator.generatePDF(report);
```

### Export to Excel
```typescript
import { ExcelExporter } from './reporting';

const exporter = new ExcelExporter();

// Export complete analysis to Excel
const excelBuffer = await exporter.exportToExcel(reportData, calculations);

// Export calculated curves only
const curvesBuffer = await exporter.exportCalculatedCurves(wellData, calculations);
```

### Export to LAS Format
```typescript
import { LASExporter } from './reporting';

const exporter = new LASExporter();

// Export well with calculated curves
const lasContent = await exporter.exportToLAS(wellData, calculations);

// Export multiple wells
const multipleWells = await exporter.exportMultipleWells(wellsData, calculationsMap);
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **5.1**: Formation evaluation summaries ✓
- **5.2**: Completion design recommendations ✓  
- **5.5**: High-resolution log plots in PDF reports ✓
- **5.6**: Data tables in Excel formats ✓
- **5.7**: LAS file output with calculated curves ✓
- **5.9**: Professional PDF formatting ✓

## Testing

All components include comprehensive test suites covering:
- Core functionality and API contracts
- Error handling and edge cases
- Data validation and format compliance
- Integration scenarios and workflow testing

Run tests with:
```bash
npm test -- src/services/reporting/__tests__/
```

## Industry Standards Compliance

- **LAS Format**: Complies with CWLS LAS 2.0 specification
- **PDF Generation**: Uses industry-standard PDF structure and metadata
- **Excel Export**: Compatible with Microsoft Excel and other spreadsheet applications
- **Report Templates**: Follow petroleum industry reporting conventions