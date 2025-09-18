import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompletionTargetViewer } from '../CompletionTargetViewer';
import { WellLogData, CompletionTarget } from '../../../types/petrophysics';

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
    curves: [],
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
    wellName: 'Well-B',
    wellInfo: {
      wellName: 'Well-B',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.1, longitude: -95.1 },
      elevation: 110,
      totalDepth: 10500,
      wellType: 'vertical'
    },
    curves: [],
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

const mockTargets: CompletionTarget[] = [
  {
    wellName: 'Well-A',
    startDepth: 8200,
    endDepth: 8250,
    thickness: 50,
    averagePorosity: 0.25,
    estimatedPermeability: 100,
    waterSaturation: 0.25,
    shaleVolume: 0.05,
    ranking: 1,
    quality: 'excellent'
  },
  {
    wellName: 'Well-A',
    startDepth: 8400,
    endDepth: 8430,
    thickness: 30,
    averagePorosity: 0.18,
    estimatedPermeability: 15,
    waterSaturation: 0.45,
    shaleVolume: 0.12,
    ranking: 2,
    quality: 'good'
  },
  {
    wellName: 'Well-B',
    startDepth: 8300,
    endDepth: 8320,
    thickness: 20,
    averagePorosity: 0.12,
    estimatedPermeability: 3,
    waterSaturation: 0.65,
    shaleVolume: 0.25,
    ranking: 3,
    quality: 'fair'
  },
  {
    wellName: 'Well-B',
    startDepth: 8500,
    endDepth: 8510,
    thickness: 10,
    averagePorosity: 0.08,
    estimatedPermeability: 0.5,
    waterSaturation: 0.85,
    shaleVolume: 0.40,
    ranking: 4,
    quality: 'poor'
  }
];

describe('CompletionTargetViewer', () => {
  const mockOnTargetSelect = jest.fn();
  const mockOnTargetUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('Well-A')).toBeInTheDocument();
    expect(screen.getByText('Well-B')).toBeInTheDocument();
  });

  it('displays control panel with sorting and filtering options', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ranking')).toBeInTheDocument();
    expect(screen.getByText('Filter by quality:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All')).toBeInTheDocument();
  });

  it('displays quality legend', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('renders SVG with completion targets', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check for target rectangles
    const targetRects = svg?.querySelectorAll('rect');
    expect(targetRects?.length).toBeGreaterThan(0);
  });

  it('displays summary statistics', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Targets: 4')).toBeInTheDocument();
    expect(screen.getByText('Excellent: 1')).toBeInTheDocument();
    expect(screen.getByText('Good: 1')).toBeInTheDocument();
    expect(screen.getByText('Fair: 1')).toBeInTheDocument();
    expect(screen.getByText('Poor: 1')).toBeInTheDocument();
  });

  it('handles sorting by different criteria', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    const sortSelect = screen.getByDisplayValue('Ranking');
    
    // Test sorting by thickness
    fireEvent.change(sortSelect, { target: { value: 'thickness' } });
    expect(sortSelect).toHaveValue('thickness');

    // Test sorting by quality
    fireEvent.change(sortSelect, { target: { value: 'quality' } });
    expect(sortSelect).toHaveValue('quality');

    // Test sorting by porosity
    fireEvent.change(sortSelect, { target: { value: 'porosity' } });
    expect(sortSelect).toHaveValue('porosity');
  });

  it('handles filtering by quality', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    const filterSelect = screen.getByDisplayValue('All');
    
    // Filter by excellent quality
    fireEvent.change(filterSelect, { target: { value: 'excellent' } });
    expect(filterSelect).toHaveValue('excellent');

    // Should show only excellent targets in summary
    expect(screen.getByText('Total Targets: 1')).toBeInTheDocument();
  });

  it('handles target selection', async () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Click on a target in the list
    const targetItems = screen.getAllByText(/#\d+/);
    if (targetItems.length > 0) {
      fireEvent.click(targetItems[0]);
      
      await waitFor(() => {
        expect(mockOnTargetSelect).toHaveBeenCalled();
      });
    }
  });

  it('displays target details when selected', async () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Click on a target in the list
    const targetItems = screen.getAllByText(/#1/);
    if (targetItems.length > 0) {
      fireEvent.click(targetItems[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Target Details')).toBeInTheDocument();
        expect(screen.getByText('Well: Well-A')).toBeInTheDocument();
        expect(screen.getByText(/Depth: 8200 - 8250 ft/)).toBeInTheDocument();
        expect(screen.getByText('Thickness: 50.0 ft')).toBeInTheDocument();
      });
    }
  });

  it('displays all targets in the target list', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('All Targets')).toBeInTheDocument();
    
    // Check for target rankings
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('handles clicking on SVG target rectangles', async () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    const svg = document.querySelector('svg');
    const targetRects = svg?.querySelectorAll('rect');
    
    if (targetRects && targetRects.length > 0) {
      // Find a target rectangle (not the well track backgrounds)
      const targetRect = Array.from(targetRects).find(rect => 
        rect.getAttribute('width') === '30'
      );
      
      if (targetRect) {
        fireEvent.click(targetRect);
        
        await waitFor(() => {
          expect(mockOnTargetSelect).toHaveBeenCalled();
        });
      }
    }
  });

  it('renders with custom dimensions', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
        height={500}
        width={800}
      />
    );

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '500');
  });

  it('handles empty targets array', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={[]}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    expect(screen.getByText('Total Targets: 0')).toBeInTheDocument();
    expect(screen.getByText('Excellent: 0')).toBeInTheDocument();
    expect(screen.getByText('Good: 0')).toBeInTheDocument();
    expect(screen.getByText('Fair: 0')).toBeInTheDocument();
    expect(screen.getByText('Poor: 0')).toBeInTheDocument();
  });

  it('handles empty wells array', () => {
    render(
      <CompletionTargetViewer
        wells={[]}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Should still render controls and target list
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText('All Targets')).toBeInTheDocument();
  });

  it('displays correct quality colors and badges', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Check for quality badges in target list
    const excellentBadges = screen.getAllByText('excellent');
    const goodBadges = screen.getAllByText('good');
    const fairBadges = screen.getAllByText('fair');
    const poorBadges = screen.getAllByText('poor');

    expect(excellentBadges.length).toBeGreaterThan(0);
    expect(goodBadges.length).toBeGreaterThan(0);
    expect(fairBadges.length).toBeGreaterThan(0);
    expect(poorBadges.length).toBeGreaterThan(0);
  });

  it('shows target thickness and porosity in target list', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Check for thickness and porosity display
    expect(screen.getByText(/50\.0ft, φ=25\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/30\.0ft, φ=18\.0%/)).toBeInTheDocument();
  });

  it('updates target list when filtering changes', () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Initially should show all 4 targets
    expect(screen.getByText('Total Targets: 4')).toBeInTheDocument();

    // Filter by excellent quality
    const filterSelect = screen.getByDisplayValue('All');
    fireEvent.change(filterSelect, { target: { value: 'excellent' } });

    // Should now show only 1 target
    expect(screen.getByText('Total Targets: 1')).toBeInTheDocument();
  });

  it('highlights selected target in the list', async () => {
    render(
      <CompletionTargetViewer
        wells={mockWells}
        targets={mockTargets}
        onTargetSelect={mockOnTargetSelect}
        onTargetUpdate={mockOnTargetUpdate}
      />
    );

    // Click on first target
    const firstTarget = screen.getByText('#1');
    fireEvent.click(firstTarget.closest('div')!);

    await waitFor(() => {
      // The selected target should have different styling
      const selectedDiv = firstTarget.closest('div');
      expect(selectedDiv).toHaveClass('bg-blue-50');
    });
  });
});