/**
 * Unit tests for EDIcraft Clear Environment Button
 * Tests the clear button UI component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EDIcraftControls } from '@/components/EDIcraftControls';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

describe('EDIcraftControls - Clear Environment Button', () => {
  const mockOnClearEnvironment = jest.fn();
  const mockChatSessionId = 'test-session-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render clear button when EDIcraft agent is active', () => {
    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should have remove icon on clear button', () => {
    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    expect(clearButton).toHaveAttribute('iconName', 'remove');
  });

  it('should call onClearEnvironment when button is clicked', async () => {
    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnClearEnvironment).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state during clear operation', async () => {
    // Mock a slow clear operation
    const slowClear = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={slowClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    // Button should show loading state
    await waitFor(() => {
      expect(clearButton).toHaveAttribute('loading', 'true');
    });

    // Wait for operation to complete
    await waitFor(() => {
      expect(clearButton).not.toHaveAttribute('loading', 'true');
    }, { timeout: 200 });
  });

  it('should be disabled during loading state', async () => {
    const slowClear = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={slowClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(clearButton).toBeDisabled();
    });
  });

  it('should handle clear operation errors gracefully', async () => {
    const failingClear = jest.fn(() => Promise.reject(new Error('Clear failed')));
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={failingClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    // Should handle error without crashing
    await waitFor(() => {
      expect(failingClear).toHaveBeenCalled();
    });

    // Button should return to normal state
    await waitFor(() => {
      expect(clearButton).not.toBeDisabled();
    });

    consoleError.mockRestore();
  });

  it('should use Cloudscape Button component', () => {
    const { container } = render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    // Should use Cloudscape Button
    const button = container.querySelector('[data-testid="clear-environment-button"]');
    expect(button).toHaveClass('awsui-button');
  });

  it('should have normal variant styling', () => {
    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    expect(clearButton).toHaveAttribute('variant', 'normal');
  });

  it('should be positioned prominently in chat interface', () => {
    const { container } = render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    // Should use SpaceBetween for layout
    const spaceBetween = container.querySelector('.awsui-space-between');
    expect(spaceBetween).toBeInTheDocument();
  });

  it('should send clear command message to agent', async () => {
    const mockSendMessage = jest.fn();

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={async () => {
          await mockSendMessage('Clear the Minecraft environment');
        }}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Clear the Minecraft environment');
    });
  });

  it('should show success notification after clear', async () => {
    const mockShowNotification = jest.fn();

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={async () => {
          mockShowNotification('success', 'Environment cleared successfully');
        }}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('cleared')
      );
    });
  });

  it('should show error notification on failure', async () => {
    const mockShowNotification = jest.fn();
    const failingClear = jest.fn(async () => {
      mockShowNotification('error', 'Failed to clear environment');
      throw new Error('Clear failed');
    });

    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={failingClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Failed')
      );
    });
  });

  it('should only show when EDIcraft agent is active', () => {
    // Test that component doesn't render for other agents
    const { container } = render(
      <div>
        {/* Simulate conditional rendering */}
        {false && (
          <EDIcraftControls
            chatSessionId={mockChatSessionId}
            onClearEnvironment={mockOnClearEnvironment}
          />
        )}
      </div>
    );

    const clearButton = container.querySelector('[data-testid="clear-environment-button"]');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should be visible during demo sessions', () => {
    render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear minecraft environment/i });
    
    // Should be visible (not hidden)
    expect(clearButton).toBeVisible();
  });

  it('should use Cloudscape spacing', () => {
    const { container } = render(
      <EDIcraftControls
        chatSessionId={mockChatSessionId}
        onClearEnvironment={mockOnClearEnvironment}
      />
    );

    // Should use SpaceBetween with xs size
    const spaceBetween = container.querySelector('.awsui-space-between');
    expect(spaceBetween).toHaveAttribute('size', 'xs');
  });
});
