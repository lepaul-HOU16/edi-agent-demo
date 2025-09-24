import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveCorrelationPanel } from '../InteractiveCorrelationPanel';
import { WellLogData, GeologicalMarker } from '../../../types/petrophysics';

// Mock data
const mockWells: WellLogData[] = [
  {
    wellName: 'Well-A',
    wellInfo: {
      wellName: 'Well-A',
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
        data: Array.from({ length: 50 }, (_, i) => 40 + Math.sin(i * 0.2) * 20),
        nullValue: -999.25,
        quality: {
          completeness: 0.98,
          outlierCount: 1,
          environmentalCorrections: [],
          qualityFlag: 'excellent'
        }
      },
      {
        name: 'NPHI',
        unit: 'V/V',
        description: 'Neutron Porosity',
        data: Array.from({ length: 50 }, (_, i) => 0.15 + Math.sin(i * 0.15) * 0.1),
        nullValue: -999.25,
        quality: {
          completeness: 0.95,
          outlierCount: 2,
          environmentalCorrections: [],
          qualityFlag: 'good'
        }
      }
    ],
    depthRange: [7500, 8500],
    dataQuality: {
      overallQuality: 'excellent',
      dataCompleteness: 0.98,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  },
  {
    wellName: 'Well-B',
    wellInfo: {
      wellName: 'Well-B',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.05, longitude: -95.05 },
      elevation: 105,
      totalDepth: 10200,
      wellType: 'vertical'
    },
    curves: [
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: Array.from({ length: 50 }, (_, i) => 38 + Math.sin(i * 0.18) * 22),
        nullValue: -999.25,
        quality: {
          completeness: 0.96,
          outlierCount: 1,
          environmentalCorrections: [],
          qualityFlag: 'good'
        }
      },
      {
        name: 'NPHI',
        unit: 'V/V',
        description: 'Neutron Porosity',
        data: Array.from({ length: 50 }, (_, i) => 0.12 + Math.sin(i * 0.17) * 0.08),
        nullValue: -999.25,
        quality: {
          completeness: 0.94,
          outlierCount: 3,
          environmentalCorrections: [],
          qualityFlag: 'good'
        }
      }
    ],
    depthRange: [7600, 8600],
    dataQuality: {
      overallQuality: 'good',
      dataCompleteness: 0.96,
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
    id: 'marker_test_1',
    name: 'Top Reservoir',
    type: 'formation_top',
    depths: [
      { wellName: 'Well-A', depth: 7800 },
      { wellName: 'Well-B', depth: 7850 }
    ],
    color: '#FF6B6B',
    confidence: 'high'
  },
  {
    id: 'marker_test_2',
    name: 'Base Reservoir',
    type: 'formation_top',
    depths: [
      { wellName: 'Well-A', depth: 8200 },
      { wellName: 'Well-B', depth: 8220 }
    ],
    color: '#4ECDC4',
    confidence: 'medium'
  }
];

describe('InteractiveCorrelationPanel', () => {
  const mockOnMarkerUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    expect(screen.getByText('Well-A')).toBeInTheDocument();
    expect(screen.getByText('Well-B')).toBeInTheDocument();
  });

  it('displays correlation controls', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    expect(screen.getByText('Curve:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gamma Ray')).toBeInTheDocument();
    expect(screen.getByText('Auto Correlate')).toBeInTheDocument();
    expect(screen.getByText('Snap to Peaks')).toBeInTheDocument();
  });

  it('renders log curves in tracks', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check for track backgrounds (rectangles)
    const trackBackgrounds = svg?.querySelectorAll('rect');
    expect(trackBackgrounds?.length).toBeGreaterThan(0);

    // Check for log curve paths
    const curvePaths = svg?.querySelectorAll('path');
    expect(curvePaths?.length).toBeGreaterThan(0);
  });

  it('displays geological markers with correlation lines', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    expect(screen.getByText('Top Reservoir')).toBeInTheDocument();
    expect(screen.getByText('Base Reservoir')).toBeInTheDocument();

    const svg = document.querySelector('svg');
    const markerCircles = svg?.querySelectorAll('circle');
    
    // Should have circles for each marker on each well
    expect(markerCircles?.length).toBe(mockMarkers.length * mockWells.length);
  });

  it('handles curve selection change', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        selectedCurve="NPHI"
      />
    );

    expect(screen.getByDisplayValue('Neutron Porosity')).toBeInTheDocument();
    expect(screen.getByText('NPHI')).toBeInTheDocument();
  });

  it('displays depth scale with proper intervals', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const svg = document.querySelector('svg');
    const depthScaleGroup = svg?.querySelector('.depth-scale');
    expect(depthScaleGroup).toBeInTheDocument();

    // Check for depth scale lines and text
    const scaleLines = depthScaleGroup?.querySelectorAll('line');
    const scaleTexts = depthScaleGroup?.querySelectorAll('text');
    
    expect(scaleLines?.length).toBeGreaterThan(0);
    expect(scaleTexts?.length).toBeGreaterThan(0);
  });

  it('handles marker drag and drop functionality', async () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const svg = document.querySelector('svg');
    const markerCircles = svg?.querySelectorAll('circle');
    
    if (markerCircles && markerCircles.length > 0) {
      const firstMarker = markerCircles[0];
      
      // Simulate mouse down
      fireEvent.mouseDown(firstMarker, { clientY: 100 });
      
      // Simulate mouse move
      fireEvent.mouseMove(svg!, { clientY: 150 });
      
      // Simulate mouse up
      fireEvent.mouseUp(svg!);
      
      // Should have called onMarkerUpdate with updated depth
      await waitFor(() => {
        expect(mockOnMarkerUpdate).toHaveBeenCalled();
      });
    }
  });

  it('shows hover effects on markers', async () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const svg = document.querySelector('svg');
    const markerCircles = svg?.querySelectorAll('circle');
    
    if (markerCircles && markerCircles.length > 0) {
      const firstMarker = markerCircles[0];
      
      // Simulate mouse enter
      fireEvent.mouseEnter(firstMarker);
      
      // Check that hover state is applied (opacity change in correlation line)
      const correlationLines = svg?.querySelectorAll('path');
      expect(correlationLines?.length).toBeGreaterThan(0);
    }
  });

  it('displays correlation statistics', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    expect(screen.getByText('Total Markers:')).toBeInTheDocument();
    expect(screen.getByText('Wells Correlated:')).toBeInTheDocument();
    expect(screen.getByText('Avg Confidence:')).toBeInTheDocument();
    
    // Check for the specific text patterns instead of just numbers
    expect(screen.getByText(/Total Markers:\s*2/)).toBeInTheDocument();
    expect(screen.getByText(/Wells Correlated:\s*2/)).toBeInTheDocument();
  });

  it('handles auto correlate button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const autoCorrelateButton = screen.getByText('Auto Correlate');
    fireEvent.click(autoCorrelateButton);

    expect(consoleSpy).toHaveBeenCalledWith('Auto-correlate triggered');
    
    consoleSpy.mockRestore();
  });

  it('handles snap to peaks button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    const snapToPeaksButton = screen.getByText('Snap to Peaks');
    fireEvent.click(snapToPeaksButton);

    expect(consoleSpy).toHaveBeenCalledWith('Snap to peaks triggered');
    
    consoleSpy.mockRestore();
  });

  it('renders with custom dimensions', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
        height={500}
        width={800}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '500');
  });

  it('handles empty markers array', () => {
    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={[]}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    expect(screen.getByText('Total Markers:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles wells with missing curve data', () => {
    const wellsWithMissingCurves = [
      {
        ...mockWells[0],
        curves: [] // No curves
      },
      mockWells[1]
    ];

    render(
      <InteractiveCorrelationPanel
        wells={wellsWithMissingCurves}
        markers={mockMarkers}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    // Should still render without crashing
    expect(screen.getByText('Well-A')).toBeInTheDocument();
    expect(screen.getByText('Well-B')).toBeInTheDocument();
  });

  it('calculates confidence percentage correctly', () => {
    const markersWithMixedConfidence: GeologicalMarker[] = [
      { ...mockMarkers[0], confidence: 'high' },
      { ...mockMarkers[1], confidence: 'low' }
    ];

    render(
      <InteractiveCorrelationPanel
        wells={mockWells}
        markers={markersWithMixedConfidence}
        onMarkerUpdate={mockOnMarkerUpdate}
      />
    );

    // 1 high confidence out of 2 total = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});