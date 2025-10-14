/**
 * Layout Export Service
 * 
 * Provides export functionality for turbine layouts in various formats
 * including CAD (DXF), GIS (Shapefile), and other industry-standard formats.
 */

import { OptimizedLayout, OptimizedTurbinePosition } from '../../types/layoutOptimization';
import { WindResourceData } from '../../types/windData';

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'json' | 'csv' | 'gis' | 'cad' | 'pdf' | 'excel' | 'kml' | 'geojson';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeAnalysisResults?: boolean;
  includeVisualization?: boolean;
  coordinateSystem?: 'wgs84' | 'utm' | 'local';
  units?: 'metric' | 'imperial';
  precision?: number;
  customFields?: Record<string, any>;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data?: string | ArrayBuffer;
  mimeType: string;
  size: number;
  error?: string;
}

// ============================================================================
// CAD Export Types
// ============================================================================

interface DXFEntity {
  type: 'CIRCLE' | 'LINE' | 'TEXT' | 'POLYLINE' | 'POINT';
  layer: string;
  color: number;
  coordinates: number[];
  properties: Record<string, any>;
}

interface DXFLayer {
  name: string;
  color: number;
  lineType: string;
  description: string;
}

// ============================================================================
// GIS Export Types
// ============================================================================

interface GISFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

interface GISFeatureCollection {
  type: 'FeatureCollection';
  crs: {
    type: 'name';
    properties: {
      name: string;
    };
  };
  features: GISFeature[];
}

// ============================================================================
// Main Export Service
// ============================================================================

export class LayoutExportService {
  private static instance: LayoutExportService;

  public static getInstance(): LayoutExportService {
    if (!LayoutExportService.instance) {
      LayoutExportService.instance = new LayoutExportService();
    }
    return LayoutExportService.instance;
  }

  /**
   * Export layout in specified format
   */
  async exportLayout(
    layout: OptimizedLayout,
    windData?: WindResourceData,
    options: ExportOptions = { format: 'json' }
  ): Promise<ExportResult> {
    try {
      console.log(`Exporting layout ${layout.id} in ${options.format} format`);

      switch (options.format) {
        case 'json':
          return await this.exportJSON(layout, windData, options);
        case 'csv':
          return await this.exportCSV(layout, options);
        case 'gis':
          return await this.exportGIS(layout, options);
        case 'cad':
          return await this.exportCAD(layout, options);
        case 'pdf':
          return await this.exportPDF(layout, windData, options);
        case 'excel':
          return await this.exportExcel(layout, windData, options);
        case 'kml':
          return await this.exportKML(layout, options);
        case 'geojson':
          return await this.exportGeoJSON(layout, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        filename: '',
        mimeType: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export as JSON with complete layout data
   */
  private async exportJSON(
    layout: OptimizedLayout,
    windData?: WindResourceData,
    options: ExportOptions
  ): Promise<ExportResult> {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        coordinateSystem: options.coordinateSystem || 'wgs84',
        units: options.units || 'metric'
      },
      layout: {
        id: layout.id,
        turbines: layout.turbines.map(turbine => ({
          id: turbine.id,
          coordinates: {
            x: turbine.x,
            y: turbine.y,
            lat: turbine.lat,
            lng: turbine.lng,
            elevation: turbine.elevation
          },
          specifications: {
            hubHeight: turbine.hubHeight,
            rotorDiameter: turbine.rotorDiameter,
            ratedPower: turbine.ratedPower,
            status: turbine.status
          },
          performance: {
            wakeDeficit: turbine.wakeEffects.wakeDeficit,
            powerLoss: turbine.wakeEffects.powerLoss,
            energyContribution: turbine.optimizationData.energyContribution
          }
        })),
        metrics: layout.layoutMetrics,
        ...(options.includeAnalysisResults && {
          energyAnalysis: layout.energyAnalysis,
          wakeAnalysis: layout.wakeAnalysis,
          costAnalysis: layout.costAnalysis,
          constraintViolations: layout.constraintViolations
        })
      },
      ...(windData && options.includeMetadata && {
        windData: {
          location: windData.location,
          statistics: windData.statistics,
          dataSource: windData.dataSource,
          timeRange: windData.timeRange
        }
      }),
      ...(options.customFields && { customFields: options.customFields })
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `${layout.id}_layout_${new Date().toISOString().split('T')[0]}.json`;

    return {
      success: true,
      filename,
      data: jsonString,
      mimeType: 'application/json',
      size: new Blob([jsonString]).size
    };
  }

  /**
   * Export as CSV for spreadsheet analysis
   */
  private async exportCSV(
    layout: OptimizedLayout,
    options: ExportOptions
  ): Promise<ExportResult> {
    const headers = [
      'Turbine_ID',
      'X_Coordinate',
      'Y_Coordinate',
      'Latitude',
      'Longitude',
      'Elevation',
      'Hub_Height',
      'Rotor_Diameter',
      'Rated_Power_kW',
      'Status',
      'Wake_Deficit_%',
      'Power_Loss_%',
      'Energy_Contribution_MWh'
    ];

    const rows = layout.turbines.map(turbine => [
      turbine.id,
      turbine.x.toFixed(options.precision || 2),
      turbine.y.toFixed(options.precision || 2),
      turbine.lat?.toFixed(6) || '',
      turbine.lng?.toFixed(6) || '',
      turbine.elevation?.toFixed(1) || '',
      turbine.hubHeight.toString(),
      turbine.rotorDiameter.toString(),
      turbine.ratedPower.toString(),
      turbine.status,
      turbine.wakeEffects.wakeDeficit.toFixed(2),
      turbine.wakeEffects.powerLoss.toFixed(2),
      turbine.optimizationData.energyContribution.toFixed(1)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const filename = `${layout.id}_turbines_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      success: true,
      filename,
      data: csvContent,
      mimeType: 'text/csv',
      size: new Blob([csvContent]).size
    };
  }

  /**
   * Export as GIS Shapefile (simplified as GeoJSON)
   */
  private async exportGIS(
    layout: OptimizedLayout,
    options: ExportOptions
  ): Promise<ExportResult> {
    const featureCollection: GISFeatureCollection = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: {
          name: options.coordinateSystem === 'utm' ? 'EPSG:32633' : 'EPSG:4326'
        }
      },
      features: layout.turbines.map(turbine => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [turbine.lng || turbine.x, turbine.lat || turbine.y]
        },
        properties: {
          TURBINE_ID: turbine.id,
          HUB_HEIGHT: turbine.hubHeight,
          ROTOR_DIAM: turbine.rotorDiameter,
          RATED_PWR: turbine.ratedPower,
          STATUS: turbine.status,
          WAKE_LOSS: turbine.wakeEffects.wakeDeficit,
          POWER_LOSS: turbine.wakeEffects.powerLoss,
          ENERGY_CONT: turbine.optimizationData.energyContribution,
          X_COORD: turbine.x,
          Y_COORD: turbine.y,
          ELEVATION: turbine.elevation || 0
        }
      }))
    };

    const gisData = JSON.stringify(featureCollection, null, 2);
    const filename = `${layout.id}_turbines_${new Date().toISOString().split('T')[0]}.geojson`;

    return {
      success: true,
      filename,
      data: gisData,
      mimeType: 'application/geo+json',
      size: new Blob([gisData]).size
    };
  }

  /**
   * Export as CAD DXF format
   */
  private async exportCAD(
    layout: OptimizedLayout,
    options: ExportOptions
  ): Promise<ExportResult> {
    const layers: DXFLayer[] = [
      { name: 'TURBINES', color: 1, lineType: 'CONTINUOUS', description: 'Wind Turbine Locations' },
      { name: 'ROTORS', color: 2, lineType: 'CONTINUOUS', description: 'Rotor Swept Areas' },
      { name: 'LABELS', color: 3, lineType: 'CONTINUOUS', description: 'Turbine Labels' },
      { name: 'WAKE_ZONES', color: 4, lineType: 'DASHED', description: 'Wake Effect Zones' }
    ];

    const entities: DXFEntity[] = [];

    // Add turbine entities
    layout.turbines.forEach(turbine => {
      // Turbine center point
      entities.push({
        type: 'POINT',
        layer: 'TURBINES',
        color: 1,
        coordinates: [turbine.x, turbine.y, turbine.elevation || 0],
        properties: {
          turbineId: turbine.id,
          ratedPower: turbine.ratedPower
        }
      });

      // Rotor swept area (circle)
      entities.push({
        type: 'CIRCLE',
        layer: 'ROTORS',
        color: 2,
        coordinates: [turbine.x, turbine.y, 0, turbine.rotorDiameter / 2],
        properties: {
          turbineId: turbine.id,
          rotorDiameter: turbine.rotorDiameter
        }
      });

      // Turbine label
      entities.push({
        type: 'TEXT',
        layer: 'LABELS',
        color: 3,
        coordinates: [turbine.x + turbine.rotorDiameter / 2 + 10, turbine.y + 10, 0],
        properties: {
          text: turbine.id,
          height: 5,
          rotation: 0
        }
      });

      // Wake zone (simplified as ellipse)
      if (turbine.wakeEffects.wakeDeficit > 5) {
        const wakeLength = turbine.rotorDiameter * 8;
        const wakeWidth = turbine.rotorDiameter * 2;
        
        entities.push({
          type: 'POLYLINE',
          layer: 'WAKE_ZONES',
          color: 4,
          coordinates: [
            turbine.x, turbine.y,
            turbine.x + wakeLength, turbine.y + wakeWidth / 2,
            turbine.x + wakeLength, turbine.y - wakeWidth / 2,
            turbine.x, turbine.y
          ],
          properties: {
            turbineId: turbine.id,
            wakeDeficit: turbine.wakeEffects.wakeDeficit
          }
        });
      }
    });

    // Generate DXF content (simplified)
    const dxfContent = this.generateDXFContent(layers, entities, options);
    const filename = `${layout.id}_layout_${new Date().toISOString().split('T')[0]}.dxf`;

    return {
      success: true,
      filename,
      data: dxfContent,
      mimeType: 'application/dxf',
      size: new Blob([dxfContent]).size
    };
  }

  /**
   * Export as PDF layout plan
   */
  private async exportPDF(
    layout: OptimizedLayout,
    windData?: WindResourceData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // This would use a PDF generation library like jsPDF
    // For now, return a placeholder
    const pdfContent = `PDF Layout Plan for ${layout.id}\n\nThis would contain:\n- Layout overview map\n- Turbine specifications table\n- Performance metrics\n- Constraint compliance summary`;
    const filename = `${layout.id}_layout_plan_${new Date().toISOString().split('T')[0]}.pdf`;

    return {
      success: true,
      filename,
      data: pdfContent,
      mimeType: 'application/pdf',
      size: new Blob([pdfContent]).size
    };
  }

  /**
   * Export as Excel workbook
   */
  private async exportExcel(
    layout: OptimizedLayout,
    windData?: WindResourceData,
    options: ExportOptions
  ): Promise<ExportResult> {
    // This would use a library like SheetJS to create Excel files
    // For now, return CSV-like content
    const excelContent = await this.exportCSV(layout, options);
    const filename = `${layout.id}_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;

    return {
      success: true,
      filename,
      data: excelContent.data,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: excelContent.size
    };
  }

  /**
   * Export as KML for Google Earth
   */
  private async exportKML(
    layout: OptimizedLayout,
    options: ExportOptions
  ): Promise<ExportResult> {
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${layout.id} Wind Farm Layout</name>
    <description>Optimized turbine layout with ${layout.turbines.length} turbines</description>
    
    <Style id="turbineStyle">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
        <scale>1.2</scale>
      </IconStyle>
    </Style>
    
    ${layout.turbines.map(turbine => `
    <Placemark>
      <name>${turbine.id}</name>
      <description>
        <![CDATA[
          <b>Turbine Specifications:</b><br/>
          Rated Power: ${turbine.ratedPower} kW<br/>
          Hub Height: ${turbine.hubHeight} m<br/>
          Rotor Diameter: ${turbine.rotorDiameter} m<br/>
          <br/>
          <b>Performance:</b><br/>
          Wake Deficit: ${turbine.wakeEffects.wakeDeficit.toFixed(1)}%<br/>
          Power Loss: ${turbine.wakeEffects.powerLoss.toFixed(1)}%<br/>
          Energy Contribution: ${turbine.optimizationData.energyContribution.toFixed(1)} MWh/year
        ]]>
      </description>
      <styleUrl>#turbineStyle</styleUrl>
      <Point>
        <coordinates>${turbine.lng || turbine.x},${turbine.lat || turbine.y},${turbine.elevation || 0}</coordinates>
      </Point>
    </Placemark>`).join('')}
    
  </Document>
</kml>`;

    const filename = `${layout.id}_layout_${new Date().toISOString().split('T')[0]}.kml`;

    return {
      success: true,
      filename,
      data: kmlContent,
      mimeType: 'application/vnd.google-earth.kml+xml',
      size: new Blob([kmlContent]).size
    };
  }

  /**
   * Export as GeoJSON
   */
  private async exportGeoJSON(
    layout: OptimizedLayout,
    options: ExportOptions
  ): Promise<ExportResult> {
    return await this.exportGIS(layout, { ...options, format: 'geojson' });
  }

  /**
   * Generate DXF file content
   */
  private generateDXFContent(
    layers: DXFLayer[],
    entities: DXFEntity[],
    options: ExportOptions
  ): string {
    let dxf = '';
    
    // DXF Header
    dxf += '0\nSECTION\n2\nHEADER\n';
    dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
    dxf += '9\n$INSUNITS\n70\n6\n'; // Meters
    dxf += '0\nENDSEC\n';
    
    // Tables section (layers)
    dxf += '0\nSECTION\n2\nTABLES\n';
    dxf += '0\nTABLE\n2\nLAYER\n70\n' + layers.length + '\n';
    
    layers.forEach(layer => {
      dxf += '0\nLAYER\n';
      dxf += '2\n' + layer.name + '\n';
      dxf += '70\n0\n';
      dxf += '62\n' + layer.color + '\n';
      dxf += '6\n' + layer.lineType + '\n';
    });
    
    dxf += '0\nENDTAB\n';
    dxf += '0\nENDSEC\n';
    
    // Entities section
    dxf += '0\nSECTION\n2\nENTITIES\n';
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'POINT':
          dxf += '0\nPOINT\n';
          dxf += '8\n' + entity.layer + '\n';
          dxf += '10\n' + entity.coordinates[0] + '\n';
          dxf += '20\n' + entity.coordinates[1] + '\n';
          dxf += '30\n' + (entity.coordinates[2] || 0) + '\n';
          break;
          
        case 'CIRCLE':
          dxf += '0\nCIRCLE\n';
          dxf += '8\n' + entity.layer + '\n';
          dxf += '10\n' + entity.coordinates[0] + '\n';
          dxf += '20\n' + entity.coordinates[1] + '\n';
          dxf += '30\n' + (entity.coordinates[2] || 0) + '\n';
          dxf += '40\n' + entity.coordinates[3] + '\n';
          break;
          
        case 'TEXT':
          dxf += '0\nTEXT\n';
          dxf += '8\n' + entity.layer + '\n';
          dxf += '10\n' + entity.coordinates[0] + '\n';
          dxf += '20\n' + entity.coordinates[1] + '\n';
          dxf += '30\n' + (entity.coordinates[2] || 0) + '\n';
          dxf += '40\n' + (entity.properties.height || 5) + '\n';
          dxf += '1\n' + (entity.properties.text || '') + '\n';
          break;
      }
    });
    
    dxf += '0\nENDSEC\n';
    dxf += '0\nEOF\n';
    
    return dxf;
  }

  /**
   * Download exported file
   */
  downloadFile(exportResult: ExportResult): void {
    if (!exportResult.success || !exportResult.data) {
      console.error('Cannot download file: export failed or no data');
      return;
    }

    const blob = new Blob([exportResult.data], { type: exportResult.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): Array<{ value: ExportFormat; label: string; description: string }> {
    return [
      {
        value: 'json',
        label: 'JSON',
        description: 'Complete layout data with all optimization results'
      },
      {
        value: 'csv',
        label: 'CSV',
        description: 'Turbine coordinates and specifications for spreadsheet analysis'
      },
      {
        value: 'gis',
        label: 'GIS Shapefile',
        description: 'Geographic data for GIS software (as GeoJSON)'
      },
      {
        value: 'cad',
        label: 'CAD (DXF)',
        description: 'Computer-aided design format for CAD software'
      },
      {
        value: 'pdf',
        label: 'PDF Layout Plan',
        description: 'Professional layout plan document'
      },
      {
        value: 'excel',
        label: 'Excel Workbook',
        description: 'Comprehensive analysis in Excel format'
      },
      {
        value: 'kml',
        label: 'KML',
        description: 'Google Earth compatible format'
      },
      {
        value: 'geojson',
        label: 'GeoJSON',
        description: 'Web-compatible geographic data format'
      }
    ];
  }
}