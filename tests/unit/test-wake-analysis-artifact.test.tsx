/**
 * Unit Tests for WakeAnalysisArtifact Component
 * 
 * Tests rendering of wake simulation results with performance metrics and visualizations
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WakeAnalysisArtifact from '../../src/components/renewable/WakeAnalysisArtifact';

// Mock Plotly to avoid SSR issues in tests
jest.mock('react-plotly.js', () => ({
  __esModule: true,
  default: () => <div data-testid="plotly-chart">Plotly Chart</div>
}));

describe('WakeAnalysisArtifact', () => {
  const mockWakeData = {
    messageContentType: 'wake_simulation' as const,
    title: 'Wake Simulation Analysis',
    subtitle: '15 turbines, 45.50 GWh/year',
    projectId: 'test-project-123',
    performanceMetrics: {
      annualEnergyProduction: 45.5,
      netAEP: 45.5,
      grossAEP: 48.2,
      capacityFactor: 0.35,
      wakeLosses: 0.056,
      wakeEfficiency: 0.944
    },
    turbineMetrics: {
      count: 15,
      totalCapacity: 37.5,
      averageWindSpeed: 8.5
    },
    monthlyProduction: [3.2, 3.5, 4.1, 4.3, 4.5, 4.2, 3.8, 3.6, 3.9, 4.0, 3.7, 3.4],
    visualizations: {
      wake_heat_map: 'https://s3.amazonaws.com/bucket/wake_map.html',
      wake_analysis: 'https://s3.amazonaws.com/bucket/wake_analysis.png',
      performance_charts: [
        'https://s3.amazonaws.com/bucket/perf_chart_1.png',
        'https://s3.amazonaws.com/bucket/perf_chart_2.png'
      ],
      seasonal_analysis: 'https://s3.amazonaws.com/bucket/seasonal.png',
      wind_rose: 'https://s3.amazonaws.com/bucket/wind_rose.png'
    },
    windResourceData: {
      source: 'NREL Wind Toolkit',
      dataYear: 2023,
      reliability: 'high',
      meanWindSpeed: 8.5,
      prevailingDirection: 225,
      dataPoints: 8760
    },
    dataSource: 'NREL Wind Toolkit',
    dataYear: 2023,
    message: 'Wake simulation completed successfully'
  };

  it('renders wake analysis artifact with title and subtitle', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    expect(screen.getByText('Wake Simulation Analysis')).toBeInTheDocument();
    expect(screen.getByText('15 turbines, 45.50 GWh/year')).toBeInTheDocument();
  });

  it('displays performance metrics correctly', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Check AEP
    expect(screen.getByText('45.50 GWh')).toBeInTheDocument();
    
    // Check capacity factor
    expect(screen.getByText('35.0%')).toBeInTheDocument();
    
    // Check wake losses
    expect(screen.getByText('5.6%')).toBeInTheDocument();
    
    // Check wake efficiency
    expect(screen.getByText('94.4%')).toBeInTheDocument();
  });

  it('displays turbine configuration', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Expand turbine configuration section
    const expandButton = screen.getByText('Turbine Configuration');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('15')).toBeInTheDocument(); // turbine count
    expect(screen.getByText('37.5 MW')).toBeInTheDocument(); // total capacity
    expect(screen.getByText('8.5 m/s')).toBeInTheDocument(); // wind speed
  });

  it('shows correct wake loss severity badge', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Wake loss of 5.6% should be "Moderate" (blue badge)
    const wakeLossBadge = screen.getByText(/Wake Loss: 5.6%/);
    expect(wakeLossBadge).toBeInTheDocument();
    expect(screen.getByText('(Moderate)')).toBeInTheDocument();
  });

  it('displays data source information', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    expect(screen.getByText(/NREL Wind Toolkit/)).toBeInTheDocument();
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getByText(/8,760 data points analyzed/)).toBeInTheDocument();
  });

  it('renders monthly production chart when data available', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Monthly production chart should be rendered
    expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
  });

  it('renders wake heat map tab', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Click on wake heat map tab
    const wakeMapTab = screen.getByText('Wake Heat Map');
    fireEvent.click(wakeMapTab);
    
    // Check iframe is rendered
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain('wake_map.html');
  });

  it('renders analysis charts tab with all visualizations', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Click on analysis charts tab
    const chartsTab = screen.getByText('Analysis Charts');
    fireEvent.click(chartsTab);
    
    // Check all images are rendered
    const images = document.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    
    // Verify specific visualizations
    const wakeAnalysisImg = Array.from(images).find(img => 
      img.src.includes('wake_analysis.png')
    );
    expect(wakeAnalysisImg).toBeInTheDocument();
  });

  it('calls onFollowUpAction when action buttons clicked', () => {
    const mockFollowUpAction = jest.fn();
    render(<WakeAnalysisArtifact data={mockWakeData} onFollowUpAction={mockFollowUpAction} />);
    
    // Click "Generate Report" button
    const reportButton = screen.getByText('Generate Report');
    fireEvent.click(reportButton);
    
    expect(mockFollowUpAction).toHaveBeenCalledWith(
      'Generate comprehensive executive report with all analysis results'
    );
  });

  it('shows download report button when complete report available', () => {
    const dataWithReport = {
      ...mockWakeData,
      visualizations: {
        ...mockWakeData.visualizations,
        complete_report: 'https://s3.amazonaws.com/bucket/report.pdf'
      }
    };
    
    render(<WakeAnalysisArtifact data={dataWithReport} />);
    
    const downloadButton = screen.getByText('Download Report');
    expect(downloadButton).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    const minimalData = {
      messageContentType: 'wake_simulation' as const,
      title: 'Wake Simulation',
      projectId: 'test-project',
      performanceMetrics: {
        capacityFactor: 0.30,
        wakeLosses: 0.08
      }
    };
    
    render(<WakeAnalysisArtifact data={minimalData} />);
    
    // Should still render without errors
    expect(screen.getByText('Wake Simulation')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument(); // CF
    expect(screen.getByText('8.0%')).toBeInTheDocument(); // Wake loss
  });

  it('shows high wake loss severity for losses > 12%', () => {
    const highLossData = {
      ...mockWakeData,
      performanceMetrics: {
        ...mockWakeData.performanceMetrics,
        wakeLosses: 0.15 // 15%
      }
    };
    
    render(<WakeAnalysisArtifact data={highLossData} />);
    
    expect(screen.getByText('(Very High)')).toBeInTheDocument();
  });

  it('shows low wake loss severity for losses < 5%', () => {
    const lowLossData = {
      ...mockWakeData,
      performanceMetrics: {
        ...mockWakeData.performanceMetrics,
        wakeLosses: 0.03 // 3%
      }
    };
    
    render(<WakeAnalysisArtifact data={lowLossData} />);
    
    expect(screen.getByText('(Low)')).toBeInTheDocument();
  });

  it('displays performance summary with gross and net AEP', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    // Should show both gross and net AEP
    expect(screen.getByText('48.20 GWh/year')).toBeInTheDocument(); // Gross
    expect(screen.getByText('45.50 GWh/year')).toBeInTheDocument(); // Net
    
    // Should calculate energy loss
    const energyLoss = (48.2 - 45.5).toFixed(2);
    expect(screen.getByText(`${energyLoss} GWh/year`)).toBeInTheDocument();
  });

  it('renders all action buttons in next steps section', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
    expect(screen.getByText('Optimize Layout')).toBeInTheDocument();
    expect(screen.getByText('Financial Analysis')).toBeInTheDocument();
    expect(screen.getByText('Compare Scenarios')).toBeInTheDocument();
  });

  it('displays message when provided', () => {
    render(<WakeAnalysisArtifact data={mockWakeData} />);
    
    expect(screen.getByText('Wake simulation completed successfully')).toBeInTheDocument();
  });
});
