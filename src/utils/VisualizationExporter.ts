/**
 * VisualizationExporter - Utility for exporting renewable energy visualizations
 * 
 * Provides functionality to export charts, maps, and reports in various formats
 * including high-resolution images, PDFs, and batch exports.
 */

export interface ExportOptions {
  filename?: string;
  format?: 'png' | 'jpg' | 'pdf' | 'html';
  quality?: number;
  width?: number;
  height?: number;
}

export class VisualizationExporter {
  /**
   * Export an image visualization
   */
  static async exportImage(imageUrl: string, options: ExportOptions = {}): Promise<void> {
    const {
      filename = 'visualization',
      format = 'png',
      quality = 1.0
    } = options;

    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // If we need to convert format or adjust quality, use canvas
      if (format !== 'png' || quality < 1.0) {
        const convertedBlob = await this.convertImageFormat(blob, format, quality);
        this.downloadBlob(convertedBlob, `${filename}.${format}`);
      } else {
        this.downloadBlob(blob, `${filename}.${format}`);
      }
    } catch (error) {
      console.error('Failed to export image:', error);
      throw new Error('Failed to export visualization. Please try again.');
    }
  }

  /**
   * Export HTML content (for maps)
   */
  static exportHTML(htmlContent: string, filename: string = 'map'): void {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      this.downloadBlob(blob, `${filename}.html`);
    } catch (error) {
      console.error('Failed to export HTML:', error);
      throw new Error('Failed to export map. Please try again.');
    }
  }

  /**
   * Export HTML content as PDF (simplified approach)
   */
  static async exportHTMLAsPDF(htmlContent: string, filename: string = 'map'): Promise<void> {
    try {
      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw new Error('Failed to export PDF. Please try again.');
    }
  }

  /**
   * Batch export multiple visualizations
   */
  static async batchExport(
    visualizations: Array<{
      url: string;
      filename: string;
      type: 'image' | 'html';
      htmlContent?: string;
    }>,
    options: ExportOptions = {}
  ): Promise<void> {
    const { format = 'png' } = options;
    
    try {
      const exportPromises = visualizations.map(async (viz, index) => {
        const filename = `${viz.filename}_${index + 1}`;
        
        if (viz.type === 'image') {
          await this.exportImage(viz.url, { ...options, filename });
        } else if (viz.type === 'html' && viz.htmlContent) {
          this.exportHTML(viz.htmlContent, filename);
        }
        
        // Add small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      await Promise.all(exportPromises);
    } catch (error) {
      console.error('Failed to batch export:', error);
      throw new Error('Failed to export visualizations. Some files may not have been downloaded.');
    }
  }

  /**
   * Get high-resolution version of an image URL
   */
  static getHighResolutionUrl(imageUrl: string, scale: number = 2): string {
    try {
      const url = new URL(imageUrl);
      url.searchParams.set('dpi', (96 * scale).toString());
      url.searchParams.set('scale', scale.toString());
      return url.toString();
    } catch {
      // If URL parsing fails, return original
      return imageUrl;
    }
  }

  /**
   * Convert image format using canvas
   */
  private static async convertImageFormat(
    blob: Blob, 
    format: string, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (convertedBlob) => {
            if (convertedBlob) {
              resolve(convertedBlob);
            } else {
              reject(new Error('Failed to convert image format'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Download a blob as a file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate export filename with timestamp
   */
  static generateFilename(baseName: string, category: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${category}_${sanitizedBaseName}_${timestamp}`;
  }

  /**
   * Check if export is supported in current browser
   */
  static isExportSupported(): boolean {
    return !!(document.createElement('a').download !== undefined && window.URL && window.URL.createObjectURL);
  }

  /**
   * Get available export formats for a visualization type
   */
  static getAvailableFormats(type: 'image' | 'map' | 'report'): string[] {
    switch (type) {
      case 'image':
        return ['png', 'jpg'];
      case 'map':
        return ['html', 'pdf'];
      case 'report':
        return ['pdf'];
      default:
        return ['png'];
    }
  }
}

export default VisualizationExporter;