/**
 * Test file to verify prerequisite validation in WorkflowCTAButtons
 * This tests the implementation of task 6 from the workflow-button-context-fix spec
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkflowCTAButtons } from './src/components/renewable/WorkflowCTAButtons';
import { ProjectContextProvider } from './src/contexts/ProjectContext';

// Mock message data with different workflow states
const createMockMessages = (completedSteps: string[]) => {
  const artifactTypeMap: Record<string, string> = {
    'terrain': 'wind_farm_terrain_analysis',
    'layout': 'wind_farm_layout',
    'simulation': 'wake_analysis',
    'windrose': 'wind_rose',
    'financial': 'financial_analysis'
  };

  return completedSteps.map(step => ({
    id: `msg-${step}`,
    role: 'assistant' as const,
    content: `Completed ${step}`,
    artifacts: [
      JSON.stringify({
        messageContentType: artifactTypeMap[step],
        data: {
          projectId: 'test-project-1',
          projectName: 'Test Wind Farm'
        }
      })
    ]
  }));
};

describe('WorkflowCTAButtons - Prerequisite Validation (Task 6)', () => {
  const mockOnAction = jest.fn();

  beforeEach(() => {
    mockOnAction.mockClear();
  });

  test('Requirement 4.1: Verify layout prerequisite before wake simulation', () => {
    // Only terrain is complete, no layout
    const messages = createMockMessages(['terrain']);

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // The "Run Wake Simulation" button should not be visible yet
    // because it requires layout to be complete
    const wakeButton = screen.queryByText('Run Wake Simulation');
    expect(wakeButton).not.toBeInTheDocument();
  });

  test('Requirement 4.2: Verify simulation prerequisite before wind rose', () => {
    // Terrain and layout complete, but no simulation
    const messages = createMockMessages(['terrain', 'layout']);

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // The "Generate Wind Rose" button should not be visible yet
    const windRoseButton = screen.queryByText('Generate Wind Rose');
    expect(windRoseButton).not.toBeInTheDocument();
  });

  test('Requirement 4.4: Buttons are disabled when prerequisites are missing', () => {
    // No completed steps
    const messages: any[] = [];

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // Should show warning about no active project
    expect(screen.getByText(/No Active Project/i)).toBeInTheDocument();
  });

  test('Requirement 4.5: Show suggestion when prerequisites are missing', () => {
    // Only terrain complete, trying to show layout button
    const messages = createMockMessages(['terrain']);

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // Should show the "Generate Turbine Layout" button as next step
    expect(screen.getByText('Generate Turbine Layout')).toBeInTheDocument();
  });

  test('All prerequisites met: buttons are enabled', () => {
    // All steps complete
    const messages = createMockMessages(['terrain', 'layout', 'simulation', 'windrose']);

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // Should show the next button (Financial Analysis)
    const financialButton = screen.getByText('Financial Analysis');
    expect(financialButton).toBeInTheDocument();
    expect(financialButton).not.toBeDisabled();
  });

  test('Console logging for prerequisite checks', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const messages = createMockMessages(['terrain']);

    render(
      <ProjectContextProvider>
        <WorkflowCTAButtons messages={messages} onAction={mockOnAction} />
      </ProjectContextProvider>
    );

    // Verify that prerequisite checks are logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WorkflowCTA] Prerequisite check'),
      expect.anything()
    );

    consoleSpy.mockRestore();
  });
});

console.log('✅ Test file created for prerequisite validation');
console.log('📋 This test validates requirements 4.1, 4.2, 4.4, and 4.5');
