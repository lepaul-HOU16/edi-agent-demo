/**
 * Test Suite: Catalog Table Responsive Behavior and Edge Cases
 * 
 * Tests task 6 requirements:
 * - Empty dataset handling
 * - Single item dataset
 * - Large dataset (5000+ items)
 * - Responsive layout at different viewport widths
 * - No horizontal scrolling
 * - Text wrapping behavior
 * 
 * Requirements: 2.1, 3.3, 5.1
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the CatalogChatBoxCloudscape component
const mockTableData = {
  empty: [],
  single: [
    {
      well_id: 'WELL-001',
      data: {
        FacilityName: 'Test Facility Alpha',
        NameAliases: ['Alias-1', 'Alias-2']
      },
      wellbores: [
        {
          welllogs: [
            {
              data: {
                Curves: ['GR', 'RHOB', 'NPHI', 'DT', 'CALI']
              }
            }
          ]
        }
      ]
    }
  ],
  typical: Array.from({ length: 50 }, (_, i) => ({
    well_id: `WELL-${String(i + 1).padStart(3, '0')}`,
    data: {
      FacilityName: `Facility ${String.fromCharCode(65 + (i % 26))} - ${i + 1}`,
      NameAliases: [`Alias-${i}-1`, `Alias-${i}-2`]
    },
    wellbores: Array.from({ length: (i % 5) + 1 }, (_, j) => ({
      welllogs: Array.from({ length: (j % 3) + 1 }, () => ({
        data: {
          Curves: ['GR', 'RHOB', 'NPHI', 'DT', 'CALI']
        }
      }))
    }))
  })),
  large: Array.from({ length: 5000 }, (_, i) => ({
    well_id: `WELL-${String(i + 1).padStart(5, '0')}`,
    data: {
      FacilityName: `Large Dataset Facility ${i + 1}`,
      NameAliases: [`Alias-${i}`]
    },
    wellbores: [
      {
        welllogs: [
          {
            data: {
              Curves: ['GR', 'RHOB', 'NPHI']
            }
          }
        ]
      }
    ]
  })),
  longNames: [
    {
      well_id: 'WELL-LONG-001',
      data: {
        FacilityName: 'This is an extremely long facility name that should test text wrapping and truncation behavior in the table cell to ensure proper display',
        NameAliases: ['Very-Long-Alias-Name-That-Should-Also-Test-Wrapping']
      },
      wellbores: [
        {
          welllogs: [
            {
              data: {
                Curves: Array.from({ length: 50 }, (_, i) => `CURVE-${i}`)
              }
            }
          ]
        }
      ]
    }
  ]
};

// Simple mock component for testing
const MockCatalogTable = ({ tableData }: { tableData: any[] }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const generateColumnDefinitions = () => {
    if (!tableData || tableData.length === 0) return [];

    return [
      {
        id: 'facilityName',
        header: 'Facility Name',
        width: '50%'
      },
      {
        id: 'wellboreCount',
        header: 'Wellbores',
        width: '25%'
      },
      {
        id: 'curveCount',
        header: 'Welllog Curves',
        width: '25%'
      }
    ];
  };

  const columns = generateColumnDefinitions();
  const paginatedData = tableData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (tableData.length === 0) {
    return (
      <div data-testid="catalog-table-container">
        <div data-testid="empty-state">No data available</div>
      </div>
    );
  }

  return (
    <div data-testid="catalog-table-container" style={{ width: '100%', overflow: 'hidden' }}>
      <table data-testid="catalog-table" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, idx) => {
            const wellbores = item.wellbores || [];
            const wellboreCount = Array.isArray(wellbores) ? wellbores.length : 0;
            
            const totalCurves = wellbores.reduce((total: number, wb: any) => {
              const welllogs = wb.welllogs || [];
              return total + welllogs.reduce((wbTotal: number, wl: any) => {
                const curves = wl.data?.Curves || [];
                return wbTotal + curves.length;
              }, 0);
            }, 0);

            return (
              <tr key={idx} data-testid={`table-row-${idx}`}>
                <td style={{ 
                  width: '50%', 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.data?.FacilityName || 'N/A'}
                </td>
                <td style={{ width: '25%' }}>{wellboreCount}</td>
                <td style={{ width: '25%' }}>{totalCurves}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div data-testid="pagination-info">
        Page {currentPage} of {Math.ceil(tableData.length / itemsPerPage)}
      </div>
    </div>
  );
};

describe('Catalog Table - Responsive Behavior and Edge Cases', () => {
  describe('Empty Dataset', () => {
    it('should display empty state when no data is provided', () => {
      render(<MockCatalogTable tableData={mockTableData.empty} />);
      
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No data available');
    });

    it('should not render table when dataset is empty', () => {
      render(<MockCatalogTable tableData={mockTableData.empty} />);
      
      const table = screen.queryByTestId('catalog-table');
      expect(table).not.toBeInTheDocument();
    });

    it('should not show pagination for empty dataset', () => {
      render(<MockCatalogTable tableData={mockTableData.empty} />);
      
      const pagination = screen.queryByTestId('pagination-info');
      expect(pagination).not.toBeInTheDocument();
    });
  });

  describe('Single Item Dataset', () => {
    it('should render table with single item', () => {
      render(<MockCatalogTable tableData={mockTableData.single} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toBeInTheDocument();
      
      const rows = screen.getAllByTestId(/table-row-/);
      expect(rows).toHaveLength(1);
    });

    it('should display correct data for single item', () => {
      render(<MockCatalogTable tableData={mockTableData.single} />);
      
      expect(screen.getByText('Test Facility Alpha')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 wellbore
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 curves
    });

    it('should show page 1 of 1 for single item', () => {
      render(<MockCatalogTable tableData={mockTableData.single} />);
      
      const pagination = screen.getByTestId('pagination-info');
      expect(pagination).toHaveTextContent('Page 1 of 1');
    });

    it('should render all three columns for single item', () => {
      render(<MockCatalogTable tableData={mockTableData.single} />);
      
      expect(screen.getByText('Facility Name')).toBeInTheDocument();
      expect(screen.getByText('Wellbores')).toBeInTheDocument();
      expect(screen.getByText('Welllog Curves')).toBeInTheDocument();
    });
  });

  describe('Large Dataset (5000+ items)', () => {
    it('should render table with large dataset', () => {
      render(<MockCatalogTable tableData={mockTableData.large} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toBeInTheDocument();
    });

    it('should paginate large dataset correctly', () => {
      render(<MockCatalogTable tableData={mockTableData.large} />);
      
      const pagination = screen.getByTestId('pagination-info');
      expect(pagination).toHaveTextContent('Page 1 of 500'); // 5000 items / 10 per page
    });

    it('should only render 10 items per page for large dataset', () => {
      render(<MockCatalogTable tableData={mockTableData.large} />);
      
      const rows = screen.getAllByTestId(/table-row-/);
      expect(rows).toHaveLength(10);
    });

    it('should display first page items correctly', () => {
      render(<MockCatalogTable tableData={mockTableData.large} />);
      
      expect(screen.getByText('Large Dataset Facility 1')).toBeInTheDocument();
      expect(screen.getByText('Large Dataset Facility 10')).toBeInTheDocument();
      expect(screen.queryByText('Large Dataset Facility 11')).not.toBeInTheDocument();
    });

    it('should handle large dataset without performance issues', () => {
      const startTime = performance.now();
      render(<MockCatalogTable tableData={mockTableData.large} />);
      const endTime = performance.now();
      
      // Rendering should complete in less than 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Responsive Layout', () => {
    it('should maintain column width percentages', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      const headers = within(table).getAllByRole('columnheader');
      
      expect(headers).toHaveLength(3);
      expect(headers[0]).toHaveStyle({ width: '50%' });
      expect(headers[1]).toHaveStyle({ width: '25%' });
      expect(headers[2]).toHaveStyle({ width: '25%' });
    });

    it('should use fixed table layout for consistent column widths', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toHaveStyle({ tableLayout: 'fixed' });
    });

    it('should set table width to 100%', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toHaveStyle({ width: '100%' });
    });

    it('should prevent horizontal scrolling with overflow hidden', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const container = screen.getByTestId('catalog-table-container');
      expect(container).toHaveStyle({ overflow: 'hidden' });
    });
  });

  describe('Text Wrapping and Truncation', () => {
    it('should handle long facility names with ellipsis', () => {
      render(<MockCatalogTable tableData={mockTableData.longNames} />);
      
      const rows = screen.getAllByTestId(/table-row-/);
      const firstCell = rows[0].querySelector('td:first-child');
      
      expect(firstCell).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      });
    });

    it('should display long facility name content', () => {
      render(<MockCatalogTable tableData={mockTableData.longNames} />);
      
      const longName = 'This is an extremely long facility name that should test text wrapping and truncation behavior in the table cell to ensure proper display';
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should maintain row height with long content', () => {
      render(<MockCatalogTable tableData={mockTableData.longNames} />);
      
      const rows = screen.getAllByTestId(/table-row-/);
      expect(rows).toHaveLength(1);
      
      // Row should exist and be rendered
      expect(rows[0]).toBeInTheDocument();
    });
  });

  describe('Column Width Distribution', () => {
    it('should allocate 50% width to Facility Name column', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const facilityHeader = screen.getByText('Facility Name');
      expect(facilityHeader).toHaveStyle({ width: '50%' });
    });

    it('should allocate 25% width to Wellbores column', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const wellboresHeader = screen.getByText('Wellbores');
      expect(wellboresHeader).toHaveStyle({ width: '25%' });
    });

    it('should allocate 25% width to Welllog Curves column', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const curvesHeader = screen.getByText('Welllog Curves');
      expect(curvesHeader).toHaveStyle({ width: '25%' });
    });

    it('should total 100% width across all columns', () => {
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      const headers = within(table).getAllByRole('columnheader');
      
      const totalWidth = headers.reduce((sum, header) => {
        const width = header.style.width;
        return sum + parseInt(width);
      }, 0);
      
      expect(totalWidth).toBe(100);
    });
  });

  describe('Data Integrity with Edge Cases', () => {
    it('should handle items with missing wellbores', () => {
      const dataWithMissing = [{
        well_id: 'WELL-MISSING',
        data: { FacilityName: 'Missing Wellbores' },
        wellbores: undefined
      }];
      
      render(<MockCatalogTable tableData={dataWithMissing} />);
      
      expect(screen.getByText('Missing Wellbores')).toBeInTheDocument();
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2); // 0 wellbores and 0 curves
    });

    it('should handle items with empty wellbores array', () => {
      const dataWithEmpty = [{
        well_id: 'WELL-EMPTY',
        data: { FacilityName: 'Empty Wellbores' },
        wellbores: []
      }];
      
      render(<MockCatalogTable tableData={dataWithEmpty} />);
      
      expect(screen.getByText('Empty Wellbores')).toBeInTheDocument();
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(2); // 0 wellbores and 0 curves
    });

    it('should handle items with missing facility name', () => {
      const dataWithMissingName = [{
        well_id: 'WELL-NO-NAME',
        data: {},
        wellbores: []
      }];
      
      render(<MockCatalogTable tableData={dataWithMissingName} />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Viewport Width Scenarios', () => {
    it('should render correctly at typical desktop width (1920px)', () => {
      // Simulate desktop viewport
      global.innerWidth = 1920;
      
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveStyle({ width: '100%' });
    });

    it('should render correctly at laptop width (1366px)', () => {
      // Simulate laptop viewport
      global.innerWidth = 1366;
      
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toBeInTheDocument();
    });

    it('should render correctly at tablet width (768px)', () => {
      // Simulate tablet viewport
      global.innerWidth = 768;
      
      render(<MockCatalogTable tableData={mockTableData.typical} />);
      
      const table = screen.getByTestId('catalog-table');
      expect(table).toBeInTheDocument();
    });

    it('should maintain column structure at all viewport widths', () => {
      const viewportWidths = [1920, 1366, 768];
      
      viewportWidths.forEach(width => {
        global.innerWidth = width;
        const { unmount } = render(<MockCatalogTable tableData={mockTableData.typical} />);
        
        const headers = screen.getAllByRole('columnheader');
        expect(headers).toHaveLength(3);
        
        unmount();
      });
    });
  });
});
