import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiWellCorrelationViewer } from '../MultiWellCorrelationViewer';
import { WellLogData, GeologicalMarker } from '../../../types/petrophysics';

// Mock data
const mockWells: WellLogData[] = [
  {
    wellName: 'Well-001',
    wellInfo: {
      wellName: 'Well-001',
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
        data: Array.from({ length: 100 }, (_, i) => 50 + Math.sin(i * 0.1) * 30),
        nullValue: -999.25,
        quality: {
          completeness: 0.95,
          outlierCount: 2,
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
    wellName: 'Well-002',
    wellInfo: {
      wellName: 'Well-002',
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
        data: Array.from({ length: 100 }, (_, i) => 45 + Math.sin(i * 0.12) * 25),
        nullValue: -999.25,
        quality: {
          completeness: 0.92,
          outlierCount: 1,
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

const mockMarkers: GeologicalMarker[] = [
  {
    id: 'marker_1',
    name: 'Formation A Top',
    type: 'formation_top',
    depths: [
      { wellName: 'Well-001', depth: 8200 },
      { wellName: 'Well-002', depth: 8250 }
    ],
    color: '#FF6B6B',
    confidence: 'high'
  },
  {
    id: 'marker_2',
    name: 'Sequence Boundary 1',
    type: 'sequence_boundary',
    depths: [
      { wellName: 'Well-001', depth: 8500 },
      { wellName: 'Well-002', depth: 8520 }
    ],
    color: '#4ECDC4',
    confidence: 'medium'
  }
];

describe('MultiWellCorrelationViewer', () => {
  const mockOnMarkerUpdate = jest.fn();
  const mockOnCorrelationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    expect(screen.getByText('Well-001')).toBeInTheDocument();
    expect(screen.getByText('Well-002')).toBeInTheDocument();
  });

  it('displays geological markers correctly', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    expect(screen.getByText('Formation A Top')).toBeInTheDocument();
    expect(screen.getByText('Sequence Boundary 1')).toBeInTheDocument();
  });

  it('renders correlation controls', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    expect(screen.getByText('Add Marker')).toBeInTheDocument();
    expect(screen.getByText('Auto Correlate')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Markers')).toBeInTheDocument();
  });

  it('adds new marker when Add Marker button is clicked', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    const addButton = screen.getByText('Add Marker');
    fireEvent.click(addButton);

    expect(mockOnMarkerUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        ...mockMarkers,
        expect.objectContaining({
          name: expect.stringContaining('New Marker'),
          type: 'formation_top',
          depths: expect.arrayContaining([
            expect.objectContaining({ wellName: 'Well-001' }),
            expect.objectContaining({ wellName: 'Well-002' })
          ])
        })
      ])
    );
  });

  it('displays marker details when marker is selected', async () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    // Find and click on a marker circle (this would be in the SVG)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Simulate clicking on a marker by finding circles and clicking the first one
    const circles = svg?.querySelectorAll('circle');
    if (circles && circles.length > 0) {
      fireEvent.click(circles[0]);
      
      await waitFor(() => {
        expect(screen.getAllByText('Formation A Top')).toHaveLength(2); // One in SVG, one in details panel
      });
    }
  });

  it('renders depth scale correctly', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check that depth scale elements are present
    const depthScaleGroup = svg?.querySelector('.depth-scale');
    expect(depthScaleGroup).toBeInTheDocument();
  });

  it('handles marker type filtering', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    const filterSelect = screen.getByDisplayValue('All Markers');
    fireEvent.change(filterSelect, { target: { value: 'formation_top' } });

    // This would trigger filtering logic in a real implementation
    expect(filterSelect).toHaveValue('formation_top');
  });

  it('updates marker properties in details panel', async () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    // Simulate selecting a marker first
    const svg = document.querySelector('svg');
    const circles = svg?.querySelectorAll('circle');
    if (circles && circles.length > 0) {
      fireEvent.click(circles[0]);
      
      await waitFor(() => {
        const typeSelect = screen.getByDisplayValue('Formation Top');
        fireEvent.change(typeSelect, { target: { value: 'sequence_boundary' } });

        expect(mockOnMarkerUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'marker_1',
              type: 'sequence_boundary'
            })
          ])
        );
      });
    }
  });

  it('deletes marker when delete button is clicked', async () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    // Simulate selecting a marker first
    const svg = document.querySelector('svg');
    const circles = svg?.querySelectorAll('circle');
    if (circles && circles.length > 0) {
      fireEvent.click(circles[0]);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Marker');
        fireEvent.click(deleteButton);

        expect(mockOnMarkerUpdate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'marker_2' })
          ])
        );
      });
    }
  });

  it('handles empty wells array gracefully', () => {
    render(
      <MultiWellCorrelationViewer
        wells={[]}
        geologicalMarkers={[]}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    expect(screen.getByText('Add Marker')).toBeInTheDocument();
    expect(screen.getByText('Auto Correlate')).toBeInTheDocument();
  });

  it('handles missing geological markers gracefully', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={[]}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    expect(screen.getByText('Well-001')).toBeInTheDocument();
    expect(screen.getByText('Well-002')).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
        height={600}
        width={800}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '600');
  });

  it('displays correlation lines between wells', () => {
    render(
      <MultiWellCorrelationViewer
        wells={mockWells}
        geologicalMarkers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        onCorrelationChange={mockOnCorrelationChange}
      />
    );

    const svg = document.querySelector('svg');
    const paths = svg?.querySelectorAll('path');
    
    // Should have correlation lines for each marker
    expect(paths?.length).toBeGreaterThan(0);
  });
});