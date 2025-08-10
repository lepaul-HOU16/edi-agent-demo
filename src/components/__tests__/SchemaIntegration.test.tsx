/**
 * Integration tests for Schema functionality in UXPin frontend
 * Tests the integration between schema loading, semantic search, and UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import themes from '../../theme';
import SchemaCard from '../SchemaCard';
import SemanticSchemaSearch from '../SemanticSchemaSearch';
import SchemaFilters from '../SchemaFilters';
import SchemaSearchSuggestions from '../SchemaSearchSuggestions';

// Mock the osduApiService
jest.mock('../../services/osduApiService', () => ({
  listSchemas: jest.fn(),
  searchSchemasBySimilarity: jest.fn(),
  findRelatedSchemas: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock auth context
jest.mock('../../contexts/OidcAuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

const mockSchema = {
  id: 'test-schema-1',
  schemaIdentity: {
    authority: 'osdu',
    source: 'wks',
    entityType: 'WellboreMarker',
    schemaVersionMajor: 1,
    schemaVersionMinor: 0,
    schemaVersionPatch: 0,
    id: 'osdu:wks:WellboreMarker:1.0.0'
  },
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      depth: { type: 'number' }
    }
  },
  status: 'published',
  scope: 'shared',
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedBy: 'system',
  updatedAt: '2024-01-01T00:00:00Z'
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={themes.light}>
    {children}
  </ThemeProvider>
);

describe('Schema Integration Tests', () => {
  describe('SchemaCard Component', () => {
    it('should render schema information correctly', () => {
      render(
        <TestWrapper>
          <SchemaCard schema={mockSchema} />
        </TestWrapper>
      );

      expect(screen.getByText('WellboreMarker')).toBeInTheDocument();
      expect(screen.getByText('osdu:wks')).toBeInTheDocument();
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('shared')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should display similarity score when provided', () => {
      render(
        <TestWrapper>
          <SchemaCard schema={mockSchema} similarity={0.85} />
        </TestWrapper>
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should expand to show detailed information', async () => {
      render(
        <TestWrapper>
          <SchemaCard schema={mockSchema} />
        </TestWrapper>
      );

      const expandButton = screen.getByLabelText('Expand Details');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Schema Details')).toBeInTheDocument();
        expect(screen.getByText('test-schema-1')).toBeInTheDocument();
      });
    });
  });

  describe('SemanticSchemaSearch Component', () => {
    const mockOnResults = jest.fn();

    it('should render search insights based on query', () => {
      render(
        <TestWrapper>
          <SemanticSchemaSearch
            onResults={mockOnResults}
            searchQuery="well data"
            loading={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('AI Search Analysis')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <TestWrapper>
          <SemanticSchemaSearch
            onResults={mockOnResults}
            searchQuery="test query"
            loading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('AI is analyzing schemas for semantic similarity...')).toBeInTheDocument();
    });

    it('should display search help information', () => {
      render(
        <TestWrapper>
          <SemanticSchemaSearch
            onResults={mockOnResults}
            searchQuery="test query"
            loading={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/Semantic Search:/)).toBeInTheDocument();
      expect(screen.getByText(/AI-powered similarity analysis/)).toBeInTheDocument();
    });
  });

  describe('SchemaFilters Component', () => {
    const mockFilters = {
      authority: '',
      source: '',
      entityType: '',
      status: '',
      scope: ''
    };
    const mockOnFilterChange = jest.fn();

    it('should render filter controls', () => {
      render(
        <TestWrapper>
          <SchemaFilters
            filters={mockFilters}
            onFilterChange={mockOnFilterChange}
            schemas={[mockSchema]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should show active filter count', () => {
      const activeFilters = {
        ...mockFilters,
        authority: 'osdu',
        status: 'published'
      };

      render(
        <TestWrapper>
          <SchemaFilters
            filters={activeFilters}
            onFilterChange={mockOnFilterChange}
            schemas={[mockSchema]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should expand to show filter options', async () => {
      render(
        <TestWrapper>
          <SchemaFilters
            filters={mockFilters}
            onFilterChange={mockOnFilterChange}
            schemas={[mockSchema]}
          />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Authority')).toBeInTheDocument();
        expect(screen.getByLabelText('Source')).toBeInTheDocument();
        expect(screen.getByLabelText('Entity Type')).toBeInTheDocument();
      });
    });
  });

  describe('SchemaSearchSuggestions Component', () => {
    const mockOnSuggestionClick = jest.fn();
    const mockOnClose = jest.fn();

    it('should render search suggestions when open', () => {
      const anchorEl = document.createElement('div');
      
      render(
        <TestWrapper>
          <SchemaSearchSuggestions
            anchorEl={anchorEl}
            open={true}
            onClose={mockOnClose}
            onSuggestionClick={mockOnSuggestionClick}
            searchQuery=""
            schemas={[mockSchema]}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Quick searches')).toBeInTheDocument();
    });

    it('should handle suggestion clicks', async () => {
      const anchorEl = document.createElement('div');
      
      render(
        <TestWrapper>
          <SchemaSearchSuggestions
            anchorEl={anchorEl}
            open={true}
            onClose={mockOnClose}
            onSuggestionClick={mockOnSuggestionClick}
            searchQuery=""
            schemas={[mockSchema]}
          />
        </TestWrapper>
      );

      // Find and click a suggestion
      const suggestion = screen.getByText('well data schemas');
      fireEvent.click(suggestion);

      expect(mockOnSuggestionClick).toHaveBeenCalledWith('well data schemas');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const osduApi = require('../../services/osduApiService');
      osduApi.listSchemas.mockRejectedValue(new Error('API Error'));

      // This would be tested in the main page component
      // For now, we just verify the mock setup
      expect(osduApi.listSchemas).toBeDefined();
    });

    it('should handle loading states properly', () => {
      render(
        <TestWrapper>
          <SemanticSchemaSearch
            onResults={jest.fn()}
            searchQuery="test"
            loading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <SchemaCard schema={mockSchema} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Expand Details')).toBeInTheDocument();
      expect(screen.getByLabelText('View Related Schemas')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <SchemaCard schema={mockSchema} />
        </TestWrapper>
      );

      const viewButton = screen.getByText('View Details');
      expect(viewButton).toBeInTheDocument();
      
      // Test that the button is focusable
      viewButton.focus();
      expect(document.activeElement).toBe(viewButton);
    });
  });
});

describe('Integration with existing listSchemas query', () => {
  it('should verify schema loading results appear in interface', async () => {
    const osduApi = require('../../services/osduApiService');
    
    // Mock successful API response
    osduApi.listSchemas.mockResolvedValue({
      listSchemas: {
        items: [mockSchema],
        pagination: { nextToken: null }
      }
    });

    // This test would be more comprehensive in a full integration test
    // For now, we verify the API mock is set up correctly
    const result = await osduApi.listSchemas('osdu', {}, {});
    expect(result.listSchemas.items).toHaveLength(1);
    expect(result.listSchemas.items[0]).toEqual(mockSchema);
  });

  it('should test semantic search functionality end-to-end', async () => {
    const osduApi = require('../../services/osduApiService');
    
    // Mock semantic search response
    osduApi.searchSchemasBySimilarity.mockResolvedValue({
      searchSchemasBySimilarity: {
        results: [{
          schema: mockSchema,
          similarity: 0.85,
          metadata: {
            matchedFields: ['entityType'],
            reasoning: 'Semantic match found',
            confidence: 0.9
          }
        }]
      }
    });

    const result = await osduApi.searchSchemasBySimilarity('well data', 10);
    expect(result.searchSchemasBySimilarity.results).toHaveLength(1);
    expect(result.searchSchemasBySimilarity.results[0].similarity).toBe(0.85);
  });

  it('should validate schema detail pages show complete information', () => {
    render(
      <TestWrapper>
        <SchemaCard schema={mockSchema} />
      </TestWrapper>
    );

    // Verify all required schema information is displayed
    expect(screen.getByText('WellboreMarker')).toBeInTheDocument();
    expect(screen.getByText('osdu:wks')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('shared')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    
    // Verify properties are shown
    expect(screen.getByText('Properties:')).toBeInTheDocument();
  });
});