/**
 * Standardized export utilities for renewable energy components
 * Provides consistent export patterns, format handling, and progress tracking
 */

import { useRenewableLoading } from './LoadingStateUtils';
import { handleRenewableError } from './ErrorHandlingUtils';

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'json' | 'csv' | 'xlsx';
  filename?: string;
  quality?: number; // For image formats
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ExportData {
  title: string;
  data: any;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
  size?: number;
}

/**
 * Standardized export service for renewable energy data
 */
export class RenewableExportService {
  private static instance: RenewableExportService;

  public static getInstance(): RenewableExportService {
    if (!RenewableExportService.instance) {
      RenewableExportService.instance = new RenewableExportService();
    }
    return RenewableExportService.instance;
  }

  /**
   * Export data in specified format
   */
  public async exportData(
    data: ExportData,
    options: ExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.(10);

      const filename = this.generateFilename(data.title, options);
      
      onProgress?.(30);

      let result: ExportResult;

      switch (options.format) {
        case 'json':
          result = await this.exportJSON(data, filename, options);
          break;
        case 'csv':
          result = await this.exportCSV(data, filename, options);
          break;
        case 'xlsx':
          result = await this.exportExcel(data, filename, options);
          break;
        case 'png':
        case 'svg':
          result = await this.exportImage(data, filename, options);
          break;
        case 'pdf':
          result = await this.exportPDF(data, filename, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      onProgress?.(100);
      return result;

    } catch (error) {
      const formattedError = handleRenewableError(error, 'RenewableExportService', 'exportData');
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  /**
   * Batch export multiple datasets
   */
  public async batchExport(
    exports: Array<{ data: ExportData; options: ExportOptions }>,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    const total = exports.length;

    for (let i = 0; i < total; i++) {
      const { data, options } = exports[i];
      
      onProgress?.(0, i + 1, total);
      
      const result = await this.exportData(data, options, (itemProgress) => {
        const overallProgress = ((i + itemProgress / 100) / total) * 100;
        onProgress?.(overallProgress, i + 1, total);
      });
      
      results.push(result);
    }

    return results;
  }

  private async exportJSON(data: ExportData, filename: string, options: ExportOptions): Promise<ExportResult> {
    const exportObject = {
      title: data.title,
      data: data.data,
      metadata: options.includeMetadata ? {
        ...data.metadata,
        exportedAt: new Date().toISOString(),
        format: 'json'
      } : undefined,
      timestamp: data.timestamp || new Date()
    };

    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    return this.downloadBlob(blob, filename);
  }

  private async exportCSV(data: ExportData, filename: string, options: ExportOptions): Promise<ExportResult> {
    let csvContent = '';

    // Handle different data structures
    if (Array.isArray(data.data)) {
      // Array of objects
      if (data.data.length > 0 && typeof data.data[0] === 'object') {
        const headers = Object.keys(data.data[0]);
        csvContent = headers.join(',') + '\n';
        
        data.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : String(value || '');
          });
          csvContent += values.join(',') + '\n';
        });
      }
    } else if (typeof data.data === 'object') {
      // Single object - convert to key-value pairs
      csvContent = 'Key,Value\n';
      Object.entries(data.data).forEach(([key, value]) => {
        csvContent += `${key},${String(value)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    return this.downloadBlob(blob, filename);
  }

  private async exportExcel(data: ExportData, filename: string, options: ExportOptions): Promise<ExportResult> {
    // For now, export as CSV with .xlsx extension
    // In production, use a library like xlsx or exceljs
    const csvResult = await this.exportCSV(data, filename.replace('.xlsx', '.csv'), options);
    return {
      ...csvResult,
      filename: filename
    };
  }

  private async exportImage(data: ExportData, filename: string, options: ExportOptions): Promise<ExportResult> {
    // This would typically capture a canvas or SVG element
    // For now, return a placeholder implementation
    try {
      // Look for canvas or SVG elements in the DOM
      const canvas = document.querySelector('canvas');
      const svg = document.querySelector('svg');

      if (canvas) {
        return this.exportCanvas(canvas, filename, options);
      } else if (svg) {
        return this.exportSVG(svg, filename, options);
      } else {
        throw new Error('No exportable visualization found');
      }
    } catch (error) {
      throw new Error(`Image export failed: ${error.message}`);
    }
  }

  private async exportCanvas(canvas: HTMLCanvasElement, filename: string, options: ExportOptions): Promise<ExportResult> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(this.downloadBlob(blob, filename));
        } else {
          resolve({
            success: false,
            error: 'Failed to create image blob'
          });
        }
      }, `image/${options.format}`, options.quality || 0.9);
    });
  }

  private async exportSVG(svg: SVGElement, filename: string, options: ExportOptions): Promise<ExportResult> {
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    return this.downloadBlob(blob, filename);
  }

  private async exportPDF(data: ExportData, filename: string, options: ExportOptions): Promise<ExportResult> {
    // PDF export would typically use a library like jsPDF or Puppeteer
    // For now, return a placeholder implementation
    throw new Error('PDF export not yet implemented');
  }

  private downloadBlob(blob: Blob, filename: string): ExportResult {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        filename,
        url,
        size: blob.size
      };
    } catch (error) {
      return {
        success: false,
        error: `Download failed: ${error.message}`
      };
    }
  }

  private generateFilename(title: string, options: ExportOptions): string {
    if (options.filename) {
      return options.filename;
    }

    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    return `${sanitizedTitle}_${timestamp}.${options.format}`;
  }
}

/**
 * Hook for standardized export functionality
 */
export const useRenewableExport = (componentName: string) => {
  const exportService = RenewableExportService.getInstance();
  const { startLoading, updateProgress, finishLoading, isLoading, progress, error } = useRenewableLoading({
    timeout: 30000,
    stages: ['Preparing data...', 'Generating export...', 'Downloading...']
  });

  const exportData = async (data: ExportData, options: ExportOptions) => {
    startLoading('Preparing data...');

    try {
      const result = await exportService.exportData(data, options, (progress) => {
        updateProgress(progress);
      });

      if (result.success) {
        finishLoading();
        return result;
      } else {
        finishLoading(result.error);
        return result;
      }
    } catch (error) {
      const formattedError = handleRenewableError(error, componentName, 'export');
      finishLoading(formattedError.message);
      return {
        success: false,
        error: formattedError.message
      };
    }
  };

  const batchExport = async (exports: Array<{ data: ExportData; options: ExportOptions }>) => {
    startLoading('Preparing batch export...');

    try {
      const results = await exportService.batchExport(exports, (progress, current, total) => {
        updateProgress(progress, `Exporting ${current} of ${total}...`);
      });

      finishLoading();
      return results;
    } catch (error) {
      const formattedError = handleRenewableError(error, componentName, 'batchExport');
      finishLoading(formattedError.message);
      return [];
    }
  };

  return {
    exportData,
    batchExport,
    isExporting: isLoading,
    exportProgress: progress,
    exportError: error
  };
};

/**
 * Utility functions for common export tasks
 */
export const ExportUtils = {
  /**
   * Get appropriate file extension for format
   */
  getFileExtension: (format: ExportOptions['format']): string => {
    const extensions: Record<ExportOptions['format'], string> = {
      png: 'png',
      svg: 'svg',
      pdf: 'pdf',
      json: 'json',
      csv: 'csv',
      xlsx: 'xlsx'
    };
    return extensions[format];
  },

  /**
   * Get MIME type for format
   */
  getMimeType: (format: ExportOptions['format']): string => {
    const mimeTypes: Record<ExportOptions['format'], string> = {
      png: 'image/png',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[format];
  },

  /**
   * Validate export options
   */
  validateExportOptions: (options: ExportOptions): string[] => {
    const errors: string[] = [];

    if (!options.format) {
      errors.push('Export format is required');
    }

    if (options.quality && (options.quality < 0 || options.quality > 1)) {
      errors.push('Quality must be between 0 and 1');
    }

    return errors;
  }
};