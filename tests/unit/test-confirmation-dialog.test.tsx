/**
 * Unit Tests for ConfirmationDialog Component
 * 
 * Tests confirmation dialog rendering and user interactions.
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const theme = createTheme();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render confirmation message', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Are you sure you want to delete this project?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Are you sure you want to delete this project/i)).toBeInTheDocument();
    });

    it('should render confirmation prompt', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Delete project?"
          confirmationPrompt="Type 'yes' to confirm deletion."
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Type 'yes' to confirm deletion/i)).toBeInTheDocument();
    });

    it('should render default Yes/Cancel buttons', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render custom options', () => {
      const customOptions = [
        { label: 'Continue', value: 'continue', variant: 'primary' as const },
        { label: 'Create New', value: 'create_new', variant: 'secondary' as const },
        { label: 'Cancel', value: 'cancel', variant: 'secondary' as const },
      ];

      renderWithTheme(
        <ConfirmationDialog
          message="Found duplicate project"
          options={customOptions}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render project list for bulk operations', () => {
      const projectList = [
        'texas-wind-farm-1',
        'texas-wind-farm-2',
        'texas-wind-farm-3',
      ];

      renderWithTheme(
        <ConfirmationDialog
          message="Delete multiple projects?"
          projectList={projectList}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Projects to be affected:')).toBeInTheDocument();
      projectList.forEach(project => {
        expect(screen.getByText(project)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when Yes button is clicked', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('yes');
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm with custom option value', () => {
      const customOptions = [
        { label: 'Continue', value: 'continue', variant: 'primary' as const },
        { label: 'Cancel', value: 'cancel', variant: 'secondary' as const },
      ];

      renderWithTheme(
        <ConfirmationDialog
          message="Choose action"
          options={customOptions}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('continue');
    });
  });

  describe('Visual Elements', () => {
    it('should display warning icon', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display confirmation required title', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirmation Required')).toBeInTheDocument();
    });

    it('should display help text', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/This action requires confirmation to prevent accidental data loss/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project list', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          projectList={[]}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Projects to be affected:')).not.toBeInTheDocument();
    });

    it('should handle long project lists with scrolling', () => {
      const longProjectList = Array.from({ length: 20 }, (_, i) => `project-${i + 1}`);

      renderWithTheme(
        <ConfirmationDialog
          message="Delete many projects?"
          projectList={longProjectList}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Projects to be affected:')).toBeInTheDocument();
      // Check first and last items
      expect(screen.getByText('project-1')).toBeInTheDocument();
      expect(screen.getByText('project-20')).toBeInTheDocument();
    });

    it('should handle missing confirmationPrompt', () => {
      renderWithTheme(
        <ConfirmationDialog
          message="Confirm action?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Should render without error
      expect(screen.getByText('Confirm action?')).toBeInTheDocument();
    });
  });
});
