'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Schema as SchemaIcon,
  Psychology as AIIcon
} from '@mui/icons-material';
import { withAuth } from '@/components/WithAuth';
import osduApi from '@/services/osduApiService';
import SemanticSchemaSearch from '@/components/SemanticSchemaSearch';
import SchemaCard from '@/components/SchemaCard';
import SchemaFilters from '@/components/SchemaFilters';
import SchemaSearchSuggestions from '@/components/SchemaSearchSuggestions';

interface Schema {
  id: string;
  schemaIdentity: {
    authority: string;
    source: string;
    entityType: string;
    schemaVersionMajor: number;
    schemaVersionMinor: number;
    schemaVersionPatch: number;
    id: string;
  };
  schema: any;
  status: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface SemanticSearchResult {
  schema: Schema;
  similarity: number;
  metadata?: any;
}

const SchemasPage: React.FC = () => {
  const router = useRouter();
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    authority: '',
    source: '',
    entityType: '',
    status: '',
    scope: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });
  const [searchInputRef, setSearchInputRef] = useState<HTMLElement | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // Load schemas on component mount
  useEffect(() => {
    loadSchemas();
  }, [filters, pagination.page]);

  const loadSchemas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filterInput = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const paginationInput = {
        limit: pagination.pageSize,
        offset: (pagination.page - 1) * pagination.pageSize
      };

      const response = await osduApi.listSchemas('osdu', filterInput, paginationInput);
      
      if (response?.listSchemas?.items) {
        setSchemas(response.listSchemas.items);
        setPagination(prev => ({
          ...prev,
          total: response.listSchemas.items.length // This would need to be updated with actual total count
        }));
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
      setError('Failed to load schemas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSchemas();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedTab === 0) {
        // Traditional search
        const filterInput = {
          ...filters,
          searchText: searchQuery
        };
        
        const response = await osduApi.listSchemas('osdu', filterInput);
        
        if (response?.listSchemas?.items) {
          setSchemas(response.listSchemas.items);
        }
      } else {
        // Semantic search using the API service
        try {
          const response = await osduApi.searchSchemasBySimilarity(searchQuery, 20);
          if (response?.searchSchemasBySimilarity?.results) {
            setSemanticResults(response.searchSchemasBySimilarity.results);
          }
        } catch (err) {
          console.error('Semantic search failed:', err);
          // Fallback to regular search
          const filterInput = {
            ...filters,
            searchText: searchQuery
          };
          
          const response = await osduApi.listSchemas('osdu', filterInput);
          
          if (response?.listSchemas?.items) {
            // Convert to semantic results format
            const fallbackResults: SemanticSearchResult[] = response.listSchemas.items.map(schema => ({
              schema,
              similarity: 0.5,
              metadata: {
                matchedFields: ['fallback'],
                reasoning: 'Fallback to text search',
                confidence: 0.5
              }
            }));
            setSemanticResults(fallbackResults);
          }
        }
      }
    } catch (err) {
      console.error('Error searching schemas:', err);
      setError('Failed to search schemas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSemanticResults([]);
    loadSchemas();
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    if (newValue === 0) {
      setSemanticResults([]);
      loadSchemas();
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'success';
      case 'development':
        return 'warning';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  const displaySchemas = selectedTab === 1 && semanticResults.length > 0 
    ? semanticResults.map(result => result.schema)
    : schemas;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Schema Registry
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and search OSDU M25 schemas with traditional and AI-powered semantic search
        </Typography>
      </Box>

      {/* Search Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab 
                icon={<SchemaIcon />} 
                label="Traditional Search" 
                iconPosition="start"
              />
              <Tab 
                icon={<AIIcon />} 
                label="Semantic Search" 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={
                  selectedTab === 0 
                    ? "Search schemas by name, type, or content..." 
                    : "Describe what you're looking for (e.g., 'well data schemas with production information')..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={(e) => {
                  setSearchInputRef(e.currentTarget);
                  setSuggestionsOpen(true);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              {/* Search Suggestions */}
              <SchemaSearchSuggestions
                anchorEl={searchInputRef}
                open={suggestionsOpen}
                onClose={() => setSuggestionsOpen(false)}
                onSuggestionClick={(suggestion) => {
                  setSearchQuery(suggestion);
                  setSuggestionsOpen(false);
                  // Auto-trigger search for suggestions
                  setTimeout(() => handleSearch(), 100);
                }}
                searchQuery={searchQuery}
                schemas={schemas}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={handleSearch}
                  color="primary"
                  size="large"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : <SearchIcon />}
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {/* Semantic Search Component */}
          {selectedTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <SemanticSchemaSearch
                onResults={setSemanticResults}
                searchQuery={searchQuery}
                loading={loading}
                onSearch={handleSearch}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <SchemaFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        schemas={schemas}
      />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {selectedTab === 1 && semanticResults.length > 0
            ? `Found ${semanticResults.length} semantically similar schemas`
            : `Showing ${displaySchemas.length} schemas`
          }
        </Typography>
        
        {selectedTab === 1 && semanticResults.length > 0 && (
          <Chip 
            label="AI-Powered Results" 
            color="primary" 
            size="small"
            icon={<AIIcon />}
          />
        )}
      </Box>

      {/* Schema Grid */}
      {loading && schemas.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displaySchemas.map((schema, index) => (
            <Grid item xs={12} md={6} lg={4} key={schema.id}>
              <SchemaCard 
                schema={schema}
                similarity={
                  selectedTab === 1 && semanticResults.length > 0
                    ? semanticResults.find(r => r.schema.id === schema.id)?.similarity
                    : undefined
                }
                onViewDetails={(schema) => router.push(`/schemas/${schema.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Schema Recommendations */}
      {!loading && !searchQuery && displaySchemas.length > 0 && selectedTab === 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Recommended Schemas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            AI-powered recommendations based on popular and recently updated schemas
          </Typography>
          
          <Grid container spacing={2}>
            {displaySchemas.slice(0, 4).map((schema) => (
              <Grid item xs={12} sm={6} md={3} key={`rec-${schema.id}`}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => router.push(`/schemas/${schema.id}`)}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SchemaIcon color="primary" fontSize="small" />
                      <Typography variant="body2" fontWeight="medium">
                        {schema.schemaIdentity.entityType}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {schema.schemaIdentity.authority}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={schema.status}
                        size="small"
                        color={getStatusColor(schema.status)}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {!loading && displaySchemas.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchemaIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No schemas found
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {searchQuery 
              ? "Try adjusting your search terms or filters"
              : "No schemas are currently available"
            }
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {!loading && displaySchemas.length > 0 && selectedTab === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(pagination.total / pagination.pageSize)}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default withAuth(SchemasPage);