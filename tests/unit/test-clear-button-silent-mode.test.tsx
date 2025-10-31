/**
 * Test: Clear Button Silent Mode
 * 
 * Verifies that the clear button in EDIcraftAgentLanding:
 * 1. Does NOT create visible chat messages
 * 2. Calls invokeEDIcraftAgent mutation directly
 * 3. Displays result as Alert notification
 * 4. Auto-dismisses success messages after 5 seconds
 * 5. Keeps error messages visible until user dismisses
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EDIcraftAgentLanding from '../../src/components/agent-landing-pages/EDIcraftAgentLanding';
import { generateClient } from 'aws-amplify/data';

// Mock AWS Amplify
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn()
}));

describe('Clear Button Silent Mode', () => {
  let mockClient: any;
  let mockMutations: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockMutations = {
      invokeEDIcraftAgent: jest.fn()
    };

    mockClient = {
      mutations: mockMutations
    };

    (generateClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should NOT call onSendMessage when clear button is clicked', async () => {
    const mockOnSendMessage = jest.fn();
    const mockOnWorkflowSelect = jest.fn();

    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: true,
        message: 'Environment cleared successfully!'
      }
    });

    render(
      <EDIcraftAgentLanding 
        onSendMessage={mockOnSendMessage}
        onWorkflowSelect={mockOnWorkflowSelect}
      />
    );

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  test('should call invokeEDIcraftAgent mutation directly', async () => {
    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: true,
        message: 'Environment cleared successfully!'
      }
    });

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockMutations.invokeEDIcraftAgent).toHaveBeenCalledWith({
        chatSessionId: expect.stringMatching(/^silent-clear-\d+$/),
        message: 'Clear the Minecraft environment and fill any terrain holes',
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'system'
      });
    });
  });

  test('should display success result as Alert notification', async () => {
    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: true,
        message: 'Environment cleared! 1234 blocks removed.'
      }
    });

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Environment cleared! 1234 blocks removed.')).toBeInTheDocument();
    });

    // Verify it's an Alert component (has dismiss button)
    const dismissButton = screen.getByLabelText(/dismiss/i);
    expect(dismissButton).toBeInTheDocument();
  });

  test('should auto-dismiss success messages after 5 seconds', async () => {
    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: true,
        message: 'Environment cleared successfully!'
      }
    });

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    // Success message should appear
    await waitFor(() => {
      expect(screen.getByText('Environment cleared successfully!')).toBeInTheDocument();
    });

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);

    // Success message should disappear
    await waitFor(() => {
      expect(screen.queryByText('Environment cleared successfully!')).not.toBeInTheDocument();
    });
  });

  test('should keep error messages visible until user dismisses', async () => {
    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: false,
        message: 'RCON connection failed'
      }
    });

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText('RCON connection failed')).toBeInTheDocument();
    });

    // Fast-forward 10 seconds (more than auto-dismiss time)
    jest.advanceTimersByTime(10000);

    // Error message should STILL be visible
    expect(screen.getByText('RCON connection failed')).toBeInTheDocument();

    // User can manually dismiss
    const dismissButton = screen.getByLabelText(/dismiss/i);
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText('RCON connection failed')).not.toBeInTheDocument();
    });
  });

  test('should handle mutation errors gracefully', async () => {
    mockMutations.invokeEDIcraftAgent.mockRejectedValue(
      new Error('Network error')
    );

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to clear environment: Network error/)).toBeInTheDocument();
    });

    // Error should stay visible (not auto-dismiss)
    jest.advanceTimersByTime(10000);
    expect(screen.getByText(/Failed to clear environment: Network error/)).toBeInTheDocument();
  });

  test('should show loading state while clearing', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockMutations.invokeEDIcraftAgent.mockReturnValue(promise);

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    // Button should show loading state
    await waitFor(() => {
      expect(clearButton).toHaveAttribute('aria-busy', 'true');
    });

    // Resolve the promise
    resolvePromise({
      data: {
        success: true,
        message: 'Done'
      }
    });

    // Loading state should clear
    await waitFor(() => {
      expect(clearButton).not.toHaveAttribute('aria-busy', 'true');
    });
  });

  test('should use silent chatSessionId format', async () => {
    mockMutations.invokeEDIcraftAgent.mockResolvedValue({
      data: {
        success: true,
        message: 'Success'
      }
    });

    render(<EDIcraftAgentLanding />);

    const clearButton = screen.getByText('Clear Minecraft Environment');
    fireEvent.click(clearButton);

    await waitFor(() => {
      const call = mockMutations.invokeEDIcraftAgent.mock.calls[0][0];
      expect(call.chatSessionId).toMatch(/^silent-clear-\d+$/);
      expect(call.userId).toBe('system');
    });
  });
});
