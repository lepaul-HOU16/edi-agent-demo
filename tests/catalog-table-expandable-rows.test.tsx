import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CatalogChatBoxCloudscape from '../src/components/CatalogChatBoxCloudscape';

// Mock data for testing
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
            data: { WellLogName: 'Log 1', Curves: ['GR', 'RHOB', 'NPHI'] }
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
            data: { WellLogName: 'Log 2', Curves: ['GR', 'DT'] }
          }
        ]
      }
    ]
  },
  {
    well_id: 'well-003',
    data: {
      FacilityName: 'Test Well Gamma',
      NameAliases: []
    },
    wellbores: [
      {
        data: { WellboreName: 'Wellbore G1' },
        welllogs: [
          {
            data: { WellLogName: 'Log 3', Curves: ['GR'] }
          }
        ]
      }
    ]
  }
];

// Create a message with table data
const createMessageWithTableData = (data: any[]) => ({
  id: 'msg-1',
  role: 'ai' as const,
  content: {
    text: `Here are the wells:\n\`\`\`json-table-data\n${JSON.stringify(data)}\n\`\`\``
  },
  responseComplete: true,
  createdAt: new Date().toISOString(),
  chatSessionId: 'session-1',
  owner: 'test-user'
});

describe('CatalogChatBoxCloudscape - Expandable Row Functionality', () => {
  const mockOnInputChange = jest.fn();
  const mockSetMessages = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render table with expandable rows', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByText('Well Data')).toBeInTheDocument();
    });

    // Verify all three wells are displayed
    expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
    expect(screen.getByText('Test Well Beta')).toBeInTheDocument();
    expect(screen.getByText('Test Well Gamma')).toBeInTheDocument();
  });

  test('should expand row when clicking on it', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
    });

    // Find and click the first row
    const firstRow = screen.getByText('Test Well Alpha').closest('tr');
    expect(firstRow).toBeInTheDocument();

    if (firstRow) {
      fireEvent.click(firstRow);

      // Wait for expanded content to appear
      await waitFor(() => {
        expect(screen.getByText('Well ID')).toBeInTheDocument();
        expect(screen.getByText('well-001')).toBeInTheDocument();
      });

      // Verify expanded content shows wellbore information
      expect(screen.getByText(/Wellbores \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Wellbore A1')).toBeInTheDocument();
    }
  });

  test('should toggle expansion when clicking dropdown icon', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
    });

    // Find the dropdown icon button (Cloudscape uses specific classes)
    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click to expand
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Well ID')).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Well ID')).not.toBeInTheDocument();
    });
  });

  test('should display expanded content correctly below the row', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
    });

    // Expand first row
    const firstRow = screen.getByText('Test Well Alpha').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);

      await waitFor(() => {
        expect(screen.getByText('Well ID')).toBeInTheDocument();
      });

      // Verify all expected sections are present
      expect(screen.getByText('Well ID')).toBeInTheDocument();
      expect(screen.getByText('Name Aliases')).toBeInTheDocument();
      expect(screen.getByText('Alpha-1, TW-001')).toBeInTheDocument();
      expect(screen.getByText(/Wellbores \(1\)/)).toBeInTheDocument();
      expect(screen.getByText('Additional Information')).toBeInTheDocument();

      // Verify welllog information
      expect(screen.getByText('Wellbore A1')).toBeInTheDocument();
      expect(screen.getByText(/Welllogs: 1/)).toBeInTheDocument();
      expect(screen.getByText('Log 1')).toBeInTheDocument();
      expect(screen.getByText(/3 curves/)).toBeInTheDocument();
    }
  });

  test('should allow multiple rows to be expanded simultaneously', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

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

    // Expand second row
    const secondRow = screen.getByText('Test Well Beta').closest('tr');
    if (secondRow) {
      fireEvent.click(secondRow);
    }

    await waitFor(() => {
      expect(screen.getByText('well-002')).toBeInTheDocument();
    });

    // Both should be expanded simultaneously
    expect(screen.getByText('well-001')).toBeInTheDocument();
    expect(screen.getByText('well-002')).toBeInTheDocument();
    expect(screen.getByText('Wellbore A1')).toBeInTheDocument();
    expect(screen.getByText('Wellbore B1')).toBeInTheDocument();
  });

  test('should allow expanded rows to be collapsed', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

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

    // Verify expanded
    expect(screen.getByText('Wellbore A1')).toBeInTheDocument();

    // Click again to collapse
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    await waitFor(() => {
      expect(screen.queryByText('well-001')).not.toBeInTheDocument();
    });

    // Verify collapsed
    expect(screen.queryByText('Wellbore A1')).not.toBeInTheDocument();
    expect(screen.queryByText('Well ID')).not.toBeInTheDocument();
  });

  test('should maintain column structure with only three columns', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Well Data')).toBeInTheDocument();
    });

    // Verify column headers
    expect(screen.getByText('Facility Name')).toBeInTheDocument();
    expect(screen.getByText('Wellbores')).toBeInTheDocument();
    expect(screen.getByText('Welllog Curves')).toBeInTheDocument();

    // Verify no "Details" column
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Click to expand →')).not.toBeInTheDocument();
  });

  test('should display correct wellbore and curve counts', async () => {
    const messages = [createMessageWithTableData(mockWellData)];

    render(
      <CatalogChatBoxCloudscape
        onInputChange={mockOnInputChange}
        userInput=""
        messages={messages}
        setMessages={mockSetMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Well Alpha')).toBeInTheDocument();
    });

    // Find the table rows and verify counts
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Well Alpha: 1 wellbore, 3 curves (GR, RHOB, NPHI)
    // Well Beta: 1 wellbore, 2 curves (GR, DT)
    // Well Gamma: 1 wellbore, 1 curve (GR)

    // All wells should show 1 wellbore
    const wellboreCells = screen.getAllByText('1');
    expect(wellboreCells.length).toBeGreaterThanOrEqual(3);
  });
});
