import { GeologicalMarker, MarkerDepth, WellLogData } from '../types/petrophysics';

/**
 * Service for managing geological markers and formation tops
 * Supports creation, editing, and correlation of geological markers across multiple wells
 */
export class GeologicalMarkerService {
  private markers: GeologicalMarker[] = [];

  /**
   * Create a new geological marker
   */
  createMarker(
    name: string,
    type: 'formation_top' | 'sequence_boundary' | 'flooding_surface',
    wells: WellLogData[],
    initialDepth?: number
  ): GeologicalMarker {
    const marker: GeologicalMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      depths: wells.map(well => ({
        wellName: well.wellName,
        depth: initialDepth || well.depthRange[0] + (well.depthRange[1] - well.depthRange[0]) * 0.3
      })),
      color: this.getDefaultColor(type),
      confidence: 'medium'
    };

    this.markers.push(marker);
    return marker;
  }

  /**
   * Update marker depth for a specific well
   */
  updateMarkerDepth(markerId: string, wellName: string, newDepth: number): boolean {
    const marker = this.markers.find(m => m.id === markerId);
    if (!marker) return false;

    const depthEntry = marker.depths.find(d => d.wellName === wellName);
    if (depthEntry) {
      depthEntry.depth = newDepth;
      return true;
    }

    // Add new depth entry if well not found
    marker.depths.push({ wellName, depth: newDepth });
    return true;
  }

  /**
   * Update marker properties
   */
  updateMarker(markerId: string, updates: Partial<GeologicalMarker>): boolean {
    const markerIndex = this.markers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return false;

    this.markers[markerIndex] = { ...this.markers[markerIndex], ...updates };
    return true;
  }

  /**
   * Delete a geological marker
   */
  deleteMarker(markerId: string): boolean {
    const initialLength = this.markers.length;
    this.markers = this.markers.filter(m => m.id !== markerId);
    return this.markers.length < initialLength;
  }

  /**
   * Get all markers
   */
  getAllMarkers(): GeologicalMarker[] {
    return [...this.markers];
  }

  /**
   * Get markers by type
   */
  getMarkersByType(type: 'formation_top' | 'sequence_boundary' | 'flooding_surface'): GeologicalMarker[] {
    return this.markers.filter(m => m.type === type);
  }

  /**
   * Get marker by ID
   */
  getMarkerById(markerId: string): GeologicalMarker | undefined {
    return this.markers.find(m => m.id === markerId);
  }

  /**
   * Auto-correlate markers based on log character similarity
   * This is a simplified implementation - in practice would use more sophisticated algorithms
   */
  autoCorrelateMarkers(wells: WellLogData[], curveName: string = 'GR'): GeologicalMarker[] {
    const correlatedMarkers: GeologicalMarker[] = [];

    // Find significant peaks/troughs in gamma ray logs
    wells.forEach((well, wellIndex) => {
      const grCurve = well.curves.find(c => c.name === curveName);
      if (!grCurve) return;

      const peaks = this.findSignificantPeaks(grCurve.data, grCurve.nullValue);
      
      peaks.forEach((peakIndex, index) => {
        const depth = well.depthRange[0] + (peakIndex / grCurve.data.length) * 
                     (well.depthRange[1] - well.depthRange[0]);

        if (wellIndex === 0) {
          // Create new marker for first well
          const marker: GeologicalMarker = {
            id: `auto_marker_${index}_${Date.now()}`,
            name: `Auto Marker ${index + 1}`,
            type: 'formation_top',
            depths: [{ wellName: well.wellName, depth }],
            color: this.getDefaultColor('formation_top'),
            confidence: 'medium'
          };
          correlatedMarkers.push(marker);
        } else {
          // Try to correlate with existing markers
          const bestMatch = this.findBestCorrelation(correlatedMarkers, depth, well.wellName);
          if (bestMatch) {
            bestMatch.depths.push({ wellName: well.wellName, depth });
          }
        }
      });
    });

    // Add auto-correlated markers to the service
    this.markers.push(...correlatedMarkers);
    return correlatedMarkers;
  }

  /**
   * Validate marker consistency across wells
   */
  validateMarkerConsistency(markerId: string): {
    isConsistent: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const marker = this.getMarkerById(markerId);
    if (!marker) {
      return {
        isConsistent: false,
        issues: ['Marker not found'],
        suggestions: []
      };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for reasonable depth variations
    const depths = marker.depths.map(d => d.depth);
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const depthVariation = maxDepth - minDepth;

    if (depthVariation > 500) { // 500 ft variation threshold
      issues.push(`Large depth variation (${depthVariation.toFixed(0)} ft) across wells`);
      suggestions.push('Review marker picks for geological consistency');
    }

    // Check for missing wells
    if (marker.depths.length < 2) {
      issues.push('Marker exists in fewer than 2 wells');
      suggestions.push('Extend correlation to additional wells');
    }

    // Check confidence level consistency
    if (marker.confidence === 'low') {
      suggestions.push('Consider additional log analysis to improve confidence');
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Export markers to various formats
   */
  exportMarkers(format: 'json' | 'csv' | 'las'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.markers, null, 2);
      
      case 'csv':
        return this.exportToCsv();
      
      case 'las':
        return this.exportToLas();
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import markers from JSON
   */
  importMarkers(jsonData: string): boolean {
    try {
      const importedMarkers = JSON.parse(jsonData) as GeologicalMarker[];
      
      // Validate imported data
      const isValid = importedMarkers.every(marker => 
        marker.id && marker.name && marker.type && marker.depths && marker.color
      );

      if (isValid) {
        this.markers = [...this.markers, ...importedMarkers];
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import markers:', error);
      return false;
    }
  }

  // Private helper methods

  private getDefaultColor(type: 'formation_top' | 'sequence_boundary' | 'flooding_surface'): string {
    const colors = {
      formation_top: '#FF6B6B',
      sequence_boundary: '#4ECDC4',
      flooding_surface: '#45B7D1'
    };
    return colors[type];
  }

  private findSignificantPeaks(data: number[], nullValue: number): number[] {
    const peaks: number[] = [];
    const threshold = this.calculateThreshold(data, nullValue);

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] !== nullValue && 
          data[i] > data[i - 1] && 
          data[i] > data[i + 1] && 
          data[i] > threshold) {
        peaks.push(i);
      }
    }

    return peaks;
  }

  private calculateThreshold(data: number[], nullValue: number): number {
    const validData = data.filter(d => d !== nullValue);
    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length;
    const std = Math.sqrt(
      validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
    );
    return mean + std; // One standard deviation above mean
  }

  private findBestCorrelation(
    markers: GeologicalMarker[], 
    depth: number, 
    wellName: string
  ): GeologicalMarker | null {
    let bestMatch: GeologicalMarker | null = null;
    let minDistance = Infinity;

    markers.forEach(marker => {
      if (marker.depths.some(d => d.wellName === wellName)) return; // Already has this well

      const avgDepth = marker.depths.reduce((sum, d) => sum + d.depth, 0) / marker.depths.length;
      const distance = Math.abs(depth - avgDepth);

      if (distance < minDistance && distance < 100) { // 100 ft correlation window
        minDistance = distance;
        bestMatch = marker;
      }
    });

    return bestMatch;
  }

  private exportToCsv(): string {
    const headers = ['Marker ID', 'Name', 'Type', 'Well Name', 'Depth (ft)', 'Confidence'];
    const rows = [headers.join(',')];

    this.markers.forEach(marker => {
      marker.depths.forEach(depth => {
        rows.push([
          marker.id,
          marker.name,
          marker.type,
          depth.wellName,
          depth.depth.toString(),
          marker.confidence
        ].join(','));
      });
    });

    return rows.join('\n');
  }

  private exportToLas(): string {
    // Simplified LAS export - would need full LAS format implementation
    let lasContent = '~Version Information\n';
    lasContent += 'VERS. 2.0: CWLS LOG ASCII STANDARD - VERSION 2.0\n';
    lasContent += 'WRAP. NO: ONE LINE PER DEPTH STEP\n';
    lasContent += '~Well Information\n';
    lasContent += '~Curve Information\n';
    lasContent += 'DEPT.FT: DEPTH\n';
    
    this.markers.forEach(marker => {
      lasContent += `${marker.name.replace(/\s+/g, '_').toUpperCase()}.FT: ${marker.name}\n`;
    });

    lasContent += '~ASCII\n';
    // Would need to implement depth-based data export here
    
    return lasContent;
  }
}

export default GeologicalMarkerService;