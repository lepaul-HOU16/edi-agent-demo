import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveAgentSummaryComponent from '../InteractiveAgentSummaryComponent';

// Mock Cloudscape components for testing
jest.mock('@cloudscape-design/components', () => ({
  Container: ({ children, header }: any) => <div data-testid="container">{header}{children}</div>,
  Header: ({ children }: any) => <h2 data-testid="header">{children}</h2>,
  Alert: ({ children, header }: any) => <div data-testid="alert">{header}: {children}</div>,
  Cards: ({ items, cardDefinition }: any) => (
    <div data-testid="cards">
      {items?.map((item: any, index: number) => (
        <div key={index} data-testid={`card-${index}`}>
          {cardDefinition.header(item)}
        </div>
      ))}
    </div>
  ),
  Tabs: ({ tabs, activeTabId, onChange }: any) => (
    <div data-testid="tabs">
      {tabs.map((tab: any) => (
        <button 
          key={tab.id} 
          onClick={() => onChange({ detail: { activeTabId: tab.id } })}
          data-testid={`tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
      <div data-testid="tab-content">
        {tabs.find((t: any) => t.id === activeTabId)?.content}
      </div>
    </div>
  ),
  Box: ({ children, variant }: any) => <div data-variant={variant}>{children}</div>,
  Badge: ({ children, color }: any) => <span data-color={color}>{children}</span>,
  SpaceBetween: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, iconName }: any) => <button data-icon={iconName}>{children}</button>,
  Table: ({ items, columnDefinitions }: any) => (
    <table data-testid="table">
      <thead>
        <tr>
          {columnDefinitions.map((col: any) => <th key={col.id}>{col.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {items?.map((item: any, index: number) => (
          <tr key={index}>
            {columnDefinitions.map((col: any) => (
              <td key={col.id}>{col.cell ? col.cell(item) : item[col.id]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  ProgressBar: ({ value, additionalInfo }: any) => (
    <div data-testid="progress-bar" data-value={value}>{additionalInfo}</div>
  ),
  StatusIndicator: ({ children, type }: any) => (
    <span data-testid="status-indicator" data-type={type}>{children}</span>
  ),
  ExpandableSection: ({ children, headerText, expanded, onChange }: any) => (
    <div data-testid="expandable-section">
      <button onClick={onChange}>{headerText}</button>
      {expanded && <div>{children}</div>}
    </div>
  ),
  KeyValuePairs: ({ items }: any) => (
    <div data-testid="key-value-pairs">
      {items?.map((item: any, index: number) => (
        <div key={index}>{item.label}: {item.value}</div>
      ))}
    </div>
  ),
  Grid: ({ children }: any) => <div data-testid="grid">{children}</div>,
  ColumnLayout: ({ children }: any) => <div data-testid="column-layout">{children}</div>
}));

describe('InteractiveAgentSummaryComponent', () => {
  const mockAnalysisContent = {
    text: `Shale Volume Calculation Methods Comparison

Methodology
Three different methods were used to calculate Shale Volume (Vsh) from synthetic Gamma Ray log data:
1. Linear Method (Larionov)
2. Clavier Method
3. Stieber Method

Statistical Results

1. Linear Method (Larionov):
   Mean: 0.4545
   Median: 0.4177
   Standard Deviation: 0.3814
   Range: 0.0000 - 1.0000

2. Clavier Method:
   Mean: 0.1221
   Median: 0.1027
   Standard Deviation: 0.0863
   Range: 0.0200 - 0.3018`
  };

  it('should render analysis title correctly', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    expect(screen.getByText('Shale Volume Calculation Methods Comparison')).toBeInTheDocument();
  });

  it('should parse and display statistical data', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    // Should show method cards
    expect(screen.getByTestId('cards')).toBeInTheDocument();
    
    // Should display statistical values
    expect(screen.getByText(/0.4545/)).toBeInTheDocument();
    expect(screen.getByText(/0.1221/)).toBeInTheDocument();
  });

  it('should have interactive tabs', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-detailed')).toBeInTheDocument();
    expect(screen.getByTestId('tab-recommendations')).toBeInTheDocument();
  });

  it('should show confidence indicators', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    // Should have confidence badges
    const confidenceBadges = screen.getAllByText(/confidence/i);
    expect(confidenceBadges.length).toBeGreaterThan(0);
  });

  it('should handle tab switching', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    const detailedTab = screen.getByTestId('tab-detailed');
    fireEvent.click(detailedTab);
    
    // Should show detailed analysis content
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
  });

  it('should render methodology section', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    expect(screen.getByText(/Linear Method \(Larionov\)/)).toBeInTheDocument();
    expect(screen.getByText(/Clavier Method/)).toBeInTheDocument();
    expect(screen.getByText(/Stieber Method/)).toBeInTheDocument();
  });

  it('should handle empty content gracefully', () => {
    render(<InteractiveAgentSummaryComponent content={{ text: '' }} />);
    
    expect(screen.getByText('No analysis data available')).toBeInTheDocument();
  });

  it('should display progress bars for statistical values', () => {
    render(<InteractiveAgentSummaryComponent content={mockAnalysisContent} />);
    
    const progressBars = screen.getAllByTestId('progress-bar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
