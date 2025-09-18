import { GeologicalMarkerService } from '../geologicalMarkerService';
import { WellLogData, GeologicalMarker } from '../../types/petrophysics';

// Mock well data
const mockWells: WellLogData[] = [
  {
    wellName: 'Test-Well-001',
    wellInfo: {
      wellName: 'Test-Well-001',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.0, longitude: -95.0 },
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical'
    },
    curves: [
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: [30, 45, 80, 120, 90, 40, 35, 60, 100, 75],
        nullValue: -999.25,
        quality: {
          completeness: 0.95,
          outlierCount: 1,
          environmentalCorrections: [],
          qualityFlag: 'good'
        }
      }
    ],
    depthRange: [8000, 9000],
    dataQuality: {
      overallQuality: 'good',
      dataCompleteness: 0.95,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  },
  {
    wellName: 'Test-Well-002',
    wellInfo: {
      wellName: 'Test-Well-002',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.1, longitude: -95.1 },
      elevation: 110,
      totalDepth: 10500,
      wellType: 'vertical'
    },
    curves: [
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: [35, 50, 85, 115, 95, 45, 40, 65, 105, 80],
        nullValue: -999.25,
        quality: {
          completeness: 0.92,
          outlierCount: 2,
          environmentalCorrections: [],
          qualityFlag: 'good'
        }
      }
    ],
    depthRange: [8100, 9100],
    dataQuality: {
      overallQuality: 'good',
      dataCompleteness: 0.92,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  }
];

describe('GeologicalMarkerService', () => {
  let service: GeologicalMarkerService;

  beforeEach(() => {
    service = new GeologicalMarkerService();
  });

  describe('createMarker', () => {
    it('creates a new geological marker with default properties', () => {
      const marker = service.createMarker('Test Formation', 'formation_top', mockWells);

      expect(marker.name).toBe('Test Formation');
      expect(marker.type).toBe('formation_top');
      expect(marker.depths).toHaveLength(2);
      expect(marker.depths[0].wellName).toBe('Test-Well-001');
      expect(marker.depths[1].wellName).toBe('Test-Well-002');
      expect(marker.color).toBe('#FF6B6B'); // Default formation_top color
      expect(marker.confidence).toBe('medium');
      expect(marker.id).toMatch(/^marker_\d+_[a-z0-9]+$/);
    });

    it('creates marker with custom initial depth', () => {
      const customDepth = 8500;
      const marker = service.createMarker('Custom Depth Marker', 'sequence_boundary', mockWells, customDepth);

      expect(marker.depths.every(d => d.depth === customDepth)).toBe(true);
      expect(marker.color).toBe('#4ECDC4'); // Default sequence_boundary color
    });

    it('adds marker to internal collection', () => {
      service.createMarker('Test Marker', 'formation_top', mockWells);
      
      const allMarkers = service.getAllMarkers();
      expect(allMarkers).toHaveLength(1);
      expect(allMarkers[0].name).toBe('Test Marker');
    });
  });

  describe('updateMarkerDepth', () => {
    it('updates existing marker depth for specific well', () => {
      const marker = service.createMarker('Test Marker', 'formation_top', mockWells);
      const newDepth = 8750;

      const result = service.updateMarkerDepth(marker.id, 'Test-Well-001', newDepth);

      expect(result).toBe(true);
      const updatedMarker = service.getMarkerById(marker.id);
      const wellDepth = updatedMarker?.depths.find(d => d.wellName === 'Test-Well-001');
      expect(wellDepth?.depth).toBe(newDepth);
    });

    it('adds new depth entry for well not in marker', () => {
      const marker = service.createMarker('Test Marker', 'formation_top', [mockWells[0]]);
      const newDepth = 8600;

      const result = service.updateMarkerDepth(marker.id, 'New-Well', newDepth);

      expect(result).toBe(true);
      const updatedMarker = service.getMarkerById(marker.id);
      expect(updatedMarker?.depths).toHaveLength(2);
      const newWellDepth = updatedMarker?.depths.find(d => d.wellName === 'New-Well');
      expect(newWellDepth?.depth).toBe(newDepth);
    });

    it('returns false for non-existent marker', () => {
      const result = service.updateMarkerDepth('non-existent-id', 'Test-Well-001', 8500);
      expect(result).toBe(false);
    });
  });

  describe('updateMarker', () => {
    it('updates marker properties', () => {
      const marker = service.createMarker('Original Name', 'formation_top', mockWells);
      
      const result = service.updateMarker(marker.id, {
        name: 'Updated Name',
        confidence: 'high',
        color: '#00FF00'
      });

      expect(result).toBe(true);
      const updatedMarker = service.getMarkerById(marker.id);
      expect(updatedMarker?.name).toBe('Updated Name');
      expect(updatedMarker?.confidence).toBe('high');
      expect(updatedMarker?.color).toBe('#00FF00');
    });

    it('returns false for non-existent marker', () => {
      const result = service.updateMarker('non-existent-id', { name: 'New Name' });
      expect(result).toBe(false);
    });
  });

  describe('deleteMarker', () => {
    it('deletes existing marker', () => {
      const marker = service.createMarker('To Delete', 'formation_top', mockWells);
      
      const result = service.deleteMarker(marker.id);

      expect(result).toBe(true);
      expect(service.getAllMarkers()).toHaveLength(0);
    });

    it('returns false for non-existent marker', () => {
      const result = service.deleteMarker('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getMarkersByType', () => {
    it('filters markers by type', () => {
      service.createMarker('Formation Top 1', 'formation_top', mockWells);
      service.createMarker('Sequence Boundary 1', 'sequence_boundary', mockWells);
      service.createMarker('Formation Top 2', 'formation_top', mockWells);

      const formationTops = service.getMarkersByType('formation_top');
      const sequenceBoundaries = service.getMarkersByType('sequence_boundary');

      expect(formationTops).toHaveLength(2);
      expect(sequenceBoundaries).toHaveLength(1);
      expect(formationTops.every(m => m.type === 'formation_top')).toBe(true);
    });
  });

  describe('autoCorrelateMarkers', () => {
    it('creates auto-correlated markers based on log peaks', () => {
      const correlatedMarkers = service.autoCorrelateMarkers(mockWells, 'GR');

      expect(correlatedMarkers.length).toBeGreaterThan(0);
      correlatedMarkers.forEach(marker => {
        expect(marker.name).toMatch(/^Auto Marker \d+$/);
        expect(marker.type).toBe('formation_top');
        expect(marker.confidence).toBe('medium');
      });
    });

    it('adds auto-correlated markers to service collection', () => {
      const initialCount = service.getAllMarkers().length;
      service.autoCorrelateMarkers(mockWells, 'GR');
      
      const finalCount = service.getAllMarkers().length;
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('handles wells without specified curve', () => {
      const wellsWithoutGR = mockWells.map(well => ({
        ...well,
        curves: well.curves.filter(c => c.name !== 'GR')
      }));

      const correlatedMarkers = service.autoCorrelateMarkers(wellsWithoutGR, 'GR');
      expect(correlatedMarkers).toHaveLength(0);
    });
  });

  describe('validateMarkerConsistency', () => {
    it('validates consistent marker', () => {
      const marker = service.createMarker('Consistent Marker', 'formation_top', mockWells);
      // Set similar depths
      service.updateMarkerDepth(marker.id, 'Test-Well-001', 8200);
      service.updateMarkerDepth(marker.id, 'Test-Well-002', 8220);

      const validation = service.validateMarkerConsistency(marker.id);

      expect(validation.isConsistent).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('identifies large depth variations', () => {
      const marker = service.createMarker('Inconsistent Marker', 'formation_top', mockWells);
      // Set very different depths
      service.updateMarkerDepth(marker.id, 'Test-Well-001', 8000);
      service.updateMarkerDepth(marker.id, 'Test-Well-002', 9000);

      const validation = service.validateMarkerConsistency(marker.id);

      expect(validation.isConsistent).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Large depth variation'))).toBe(true);
    });

    it('identifies markers with too few wells', () => {
      const marker = service.createMarker('Single Well Marker', 'formation_top', [mockWells[0]]);

      const validation = service.validateMarkerConsistency(marker.id);

      expect(validation.isConsistent).toBe(false);
      expect(validation.issues.some(issue => issue.includes('fewer than 2 wells'))).toBe(true);
    });

    it('provides suggestions for low confidence markers', () => {
      const marker = service.createMarker('Low Confidence Marker', 'formation_top', mockWells);
      service.updateMarker(marker.id, { confidence: 'low' });

      const validation = service.validateMarkerConsistency(marker.id);

      expect(validation.suggestions.some(suggestion => 
        suggestion.includes('additional log analysis')
      )).toBe(true);
    });

    it('handles non-existent marker', () => {
      const validation = service.validateMarkerConsistency('non-existent-id');

      expect(validation.isConsistent).toBe(false);
      expect(validation.issues).toContain('Marker not found');
    });
  });

  describe('exportMarkers', () => {
    beforeEach(() => {
      service.createMarker('Export Test 1', 'formation_top', mockWells);
      service.createMarker('Export Test 2', 'sequence_boundary', mockWells);
    });

    it('exports markers as JSON', () => {
      const jsonExport = service.exportMarkers('json');
      const parsed = JSON.parse(jsonExport);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('type');
      expect(parsed[0]).toHaveProperty('depths');
    });

    it('exports markers as CSV', () => {
      const csvExport = service.exportMarkers('csv');
      const lines = csvExport.split('\n');

      expect(lines[0]).toContain('Marker ID,Name,Type,Well Name,Depth (ft),Confidence');
      expect(lines.length).toBeGreaterThan(1); // Header + data rows
    });

    it('exports markers as LAS format', () => {
      const lasExport = service.exportMarkers('las');

      expect(lasExport).toContain('~Version Information');
      expect(lasExport).toContain('VERS. 2.0');
      expect(lasExport).toContain('~Well Information');
      expect(lasExport).toContain('~Curve Information');
    });

    it('throws error for unsupported format', () => {
      expect(() => service.exportMarkers('xml' as any)).toThrow('Unsupported export format: xml');
    });
  });

  describe('importMarkers', () => {
    it('imports valid JSON markers', () => {
      const markersToImport: GeologicalMarker[] = [
        {
          id: 'imported_1',
          name: 'Imported Marker 1',
          type: 'formation_top',
          depths: [{ wellName: 'Well-A', depth: 8000 }],
          color: '#FF0000',
          confidence: 'high'
        }
      ];

      const result = service.importMarkers(JSON.stringify(markersToImport));

      expect(result).toBe(true);
      const allMarkers = service.getAllMarkers();
      expect(allMarkers.some(m => m.name === 'Imported Marker 1')).toBe(true);
    });

    it('rejects invalid JSON', () => {
      const result = service.importMarkers('invalid json');
      expect(result).toBe(false);
    });

    it('rejects markers with missing required fields', () => {
      const invalidMarkers = [
        {
          name: 'Invalid Marker',
          // Missing required fields
        }
      ];

      const result = service.importMarkers(JSON.stringify(invalidMarkers));
      expect(result).toBe(false);
    });
  });

  describe('private helper methods', () => {
    it('assigns correct default colors for marker types', () => {
      const formationTop = service.createMarker('Formation', 'formation_top', mockWells);
      const sequenceBoundary = service.createMarker('Sequence', 'sequence_boundary', mockWells);
      const floodingSurface = service.createMarker('Flooding', 'flooding_surface', mockWells);

      expect(formationTop.color).toBe('#FF6B6B');
      expect(sequenceBoundary.color).toBe('#4ECDC4');
      expect(floodingSurface.color).toBe('#45B7D1');
    });
  });
});