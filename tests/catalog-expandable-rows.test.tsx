/**
 * Test suite for Catalog Table Expandable Rows Functionality
 * 
 * This test verifies that after removing the "Details" column,
 * the expandable row functionality remains fully intact.
 * 
 * Requirements tested:
 * - 4.1: Clicking on table rows expands them
 * - 4.2: Clicking dropdown icon toggles expansion
 * - 4.3: Expanded content displays correctly below the row
 * - 4.4: Multiple rows can be expanded simultaneously
 * - 4.5: Expanded rows can be collapsed
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CatalogChatBoxCloudscape from '../src/components/CatalogChatBoxCloudscape';
import { Message } from '../utils/types';

// Mock data that matches OSDU structure
const mockWellData = [
  {
    well_id: 'well-001',
    data: {
      FacilityName: 'Test Well Alpha',
      NameAliases: ['Alpha-1', 'TW-001']
    },
    wellbores: [
      {
        data: { WellboreName: 'Wellbore A1' },
        welllogs: [
          {
            data: {
              WellLogName: 'Log A1-1',
              Curves: ['GR', 'RHOB', 'NPHI']
            }
          }
        ]
      }
    ]
  },
  {
    well_id: 'well-002',
    data: {
      FacilityName: 'Test Well Beta',
      NameAliases: ['Beta-1']
    },
    wellbores: [
      {
        data: { WellboreName: 'Wellbore B1' },
        welllogs: [
          {
            data: {
              WellLogName: 'Log B1-1',
              Curves: ['GR', 'DT']
            }
          }
        ]
      }
    ]
  },
  {
    well_id: 'well-003',
    data: {
      FacilityName: 'Test Well Gamma',
      NameAliases: ['Gamma-1', 'TW-003']
    },
    wellbores: [
      {
        data: { WellboreName: 'Wellbore G1' },
        welllogs: [
          {
            data: {
              WellLogName: 'Log G1-1',
              Curves: ['GR']
            }
          }
        ]
      }
    ]
  }
];

// Create a message with table data
const createMessageWithTableData = (data: any[]): Message => {
  const tableDataJson = JSON.stringify(data, null, 2);
  return {
    id: 'test-message-1',
    role: 'ai',
    content: {
      text: `Here are the wells:\n\n\`\`\`json-table-data\n${tableDataJson}\n\`\`\``
    },
    responseComplete: true,
    createdAt: new Date().toISOString(),
    chatSessionId: 'test-session',
    owner: 'test-user'
  } as any;
};

describe('Catalog Table Expandable Rows', () => {
  const mockOnInputChange = jest.fn();
  const mockSetMessages = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (messages: Message[] = []) => {
    return render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );
  };

  describe('Requirement 4.1: Clicking on table rows expands them', () => {
    it('should expand a row when clicked', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Find the first row (should have the facility name)
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      expect(firstRow).toBeInTheDocument();

      // Click the row to expand it
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      // Wait for expanded content to appear
      await waitFor(() => {
        // Check for expanded content elements
        expect(screen.getByText('Well ID')).toBeInTheDocument();
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });
    });

    it('should show expandable content for all data rows', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
        expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
        expect(screen.getByText('Test Well Gamma')).toBeInTheDocument();
      });

      // All three wells should be present and clickable
      const wells = ['Test Well Alpha', 'Test Well Beta', 'Test Well Gamma'];
      wells.forEach(wellName => {
        const row = screen.getByText(wellName).closest('tr');
        expect(row).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 4.2: Clicking dropdown icon toggles expansion', () => {
    it('should have dropdown icons for expandable rows', async () => {
      const message = createMessageWithTableData(mockWellData);
      const { container } = renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Cloudscape uses specific classes for expand buttons
      // Look for expand/collapse buttons
      const expandButtons = container.querySelectorAll('[aria-label*="expand"], [aria-label*="Expand"]');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('should toggle expansion when dropdown icon is clicked', async () => {
      const message = createMessageWithTableData(mockWellData);
      const { container } = renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Find and click the first expand button
      const expandButtons = container.querySelectorAll('[aria-label*="expand"], [aria-label*="Expand"]');
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);

        // Wait for expanded content
        await waitFor(() => {
          expect(screen.getByText('Well ID')).toBeInTheDocument();
        });

        // Click again to collapse
        fireEvent.click(expandButtons[0]);

        // Expanded content should be removed
        await waitFor(() => {
          expect(screen.queryByText('Well ID')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Requirement 4.3: Expanded content displays correctly below the row', () => {
    it('should display well ID in expanded content', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('Well ID')).toBeInTheDocument();
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });
    });

    it('should display name aliases in expanded content', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('Name Aliases')).toBeInTheDocument();
        expect(screen.getByText(/Alpha-1, TW-001/)).toBeInTheDocument();
      });
    });

    it('should display wellbores information in expanded content', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText(/Wellbores \(1\)/)).toBeInTheDocument();
        expect(screen.getByText('Wellbore A1')).toBeInTheDocument();
      });
    });

    it('should display welllog curves in expanded content', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('Log A1-1')).toBeInTheDocument();
        expect(screen.getByText(/3 curves/)).toBeInTheDocument();
      });
    });

    it('should display additional information section', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('Additional Information')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 4.4: Multiple rows can be expanded simultaneously', () => {
    it('should allow expanding multiple rows at the same time', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
        expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });

      // Expand second row
      const secondRow = screen.getByText('Test Well Beta').closest('tr');
      if (secondRow) {
        fireEvent.click(secondRow);
      }

      await waitFor(() => {
        // Both should be visible
        expect(screen.getByText('well-001')).toBeInTheDocument();
        expect(screen.getByText('well-002')).toBeInTheDocument();
      });
    });

    it('should maintain first row expanded when expanding second row', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
        expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });

      // Expand second row
      const secondRow = screen.getByText('Test Well Beta').closest('tr');
      if (secondRow) {
        fireEvent.click(secondRow);
      }

      await waitFor(() => {
        // First row should still be expanded
        expect(screen.getByText('well-001')).toBeInTheDocument();
        // Second row should now be expanded
        expect(screen.getByText('well-002')).toBeInTheDocument();
      });
    });

    it('should allow expanding all three rows simultaneously', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
        expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
        expect(screen.getByText('Test Well Gamma')).toBeInTheDocument();
      });

      // Expand all three rows
      const wells = ['Test Well Alpha', 'Test Well Beta', 'Test Well Gamma'];
      for (const wellName of wells) {
        const row = screen.getByText(wellName).closest('tr');
        if (row) {
          fireEvent.click(row);
        }
      }

      // All three well IDs should be visible
      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
        expect(screen.getByText('well-002')).toBeInTheDocument();
        expect(screen.getByText('well-003')).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 4.5: Expanded rows can be collapsed', () => {
    it('should collapse an expanded row when clicked again', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      // Expand first row
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });

      // Click again to collapse
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        expect(screen.queryByText('well-001')).not.toBeInTheDocument();
      });
    });

    it('should collapse individual rows without affecting others', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
        expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
      });

      // Expand both rows
      const firstRow = screen.getByText('Test Well Alpha').closest('tr');
      const secondRow = screen.getByText('Test Well Beta').closest('tr');

      if (firstRow) fireEvent.click(firstRow);
      if (secondRow) fireEvent.click(secondRow);

      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
        expect(screen.getByText('well-002')).toBeInTheDocument();
      });

      // Collapse first row only
      if (firstRow) {
        fireEvent.click(firstRow);
      }

      await waitFor(() => {
        // First row should be collapsed
        expect(screen.queryByText('well-001')).not.toBeInTheDocument();
        // Second row should still be expanded
        expect(screen.getByText('well-002')).toBeInTheDocument();
      });
    });

    it('should allow re-expanding a collapsed row', async () => {
      const message = createMessageWithTableData(mockWellData);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
      });

      const firstRow = screen.getByText('Test Well Alpha').closest('tr');

      // Expand
      if (firstRow) fireEvent.click(firstRow);
      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });

      // Collapse
      if (firstRow) fireEvent.click(firstRow);
      await waitFor(() => {
        expect(screen.queryByText('well-001')).not.toBeInTheDocument();
      });

      // Re-expand
      if (firstRow) fireEvent.click(firstRow);
      await waitFor(() => {
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should handle empty wellbores array gracefully', async () => {
      const dataWithEmptyWellbores = [{
        well_id: 'well-empty',
        data: {
          FacilityName: 'Empty Well',
          NameAliases: []
        },
        wellbores: []
      }];

      const message = createMessageWithTableData(dataWithEmptyWellbores);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Empty Well')).toBeInTheDocument();
      });

      // Should show 0 wellbores and 0 curves
      expect(screen.getByText('0')).toBeInTheDocument(); // wellbore count
    });

    it('should handle missing data fields gracefully', async () => {
      const dataWithMissingFields = [{
        well_id: 'well-minimal',
        data: {
          FacilityName: 'Minimal Well'
        },
        wellbores: []
      }];

      const message = createMessageWithTableData(dataWithMissingFields);
      renderComponent([message]);

      await waitFor(() => {
        expect(screen.getByText('Minimal Well')).toBeInTheDocument();
      });

      // Should render without errors
      const row = screen.getByText('Minimal Well').closest('tr');
      expect(row).toBeInTheDocument();
    });
  });
});
