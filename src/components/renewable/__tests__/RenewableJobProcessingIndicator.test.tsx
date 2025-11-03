import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RenewableJobProcessingIndicator } from '../RenewableJobProcessingIndicator';

describe('RenewableJobProcessingIndicator', () => {
  it('should not render when not processing and no error', () => {
    const { container } = render(
      <RenewableJobProcessingIndicator isProcessing={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render processing state with default values', () => {
    render(
      <RenewableJobProcessingIndicator isProcessing={true} />
    );
    
    expect(screen.getByText(/Analyzing renewable energy site/i)).toBeInTheDocument();
    expect(screen.getByText(/Starting renewable energy analysis/i)).toBeInTheDocument();
  });

  it('should display current step description', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        currentStep="terrain_analysis"
        completedSteps={0}
        totalSteps={3}
      />
    );
    
    expect(screen.getByText(/Analyzing terrain and site conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 0 of 3/i)).toBeInTheDocument();
  });

  it('should display progress for layout optimization step', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        currentStep="layout_optimization"
        completedSteps={1}
        totalSteps={3}
      />
    );
    
    expect(screen.getByText(/Optimizing turbine layout/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
  });

  it('should display progress for simulation step', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        currentStep="simulation"
        completedSteps={2}
        totalSteps={3}
      />
    );
    
    expect(screen.getByText(/Running energy production simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });

  it('should format estimated time remaining in seconds', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        estimatedTimeRemaining={45}
      />
    );
    
    expect(screen.getByText(/~45s remaining/i)).toBeInTheDocument();
  });

  it('should format estimated time remaining in minutes', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        estimatedTimeRemaining={90}
      />
    );
    
    expect(screen.getByText(/~1m 30s remaining/i)).toBeInTheDocument();
  });

  it('should format estimated time remaining for exact minutes', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        estimatedTimeRemaining={120}
      />
    );
    
    expect(screen.getByText(/~2m remaining/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={false}
        error="Failed to connect to analysis service"
      />
    );
    
    expect(screen.getByText(/Analysis Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to connect to analysis service/i)).toBeInTheDocument();
  });

  it('should display helpful message about auto-update', () => {
    render(
      <RenewableJobProcessingIndicator isProcessing={true} />
    );
    
    expect(screen.getByText(/Your results will appear automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/30-60 seconds/i)).toBeInTheDocument();
  });

  it('should calculate progress percentage correctly', () => {
    const { rerender } = render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        completedSteps={0}
        totalSteps={3}
      />
    );
    
    // Progress should be 0%
    expect(screen.getByText(/Step 0 of 3/i)).toBeInTheDocument();
    
    rerender(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        completedSteps={1}
        totalSteps={3}
      />
    );
    
    // Progress should be 33%
    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
    
    rerender(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        completedSteps={3}
        totalSteps={3}
      />
    );
    
    // Progress should be 100%
    expect(screen.getByText(/Step 3 of 3/i)).toBeInTheDocument();
  });

  it('should handle custom step names gracefully', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        currentStep="custom_analysis_step"
      />
    );
    
    // Should display the custom step name as-is
    expect(screen.getByText(/custom_analysis_step/i)).toBeInTheDocument();
  });

  it('should display report generation step', () => {
    render(
      <RenewableJobProcessingIndicator
        isProcessing={true}
        currentStep="report_generation"
        completedSteps={3}
        totalSteps={3}
      />
    );
    
    expect(screen.getByText(/Generating comprehensive report/i)).toBeInTheDocument();
  });
});
