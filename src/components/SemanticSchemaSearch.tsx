'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as SimilarityIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Info as InfoIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import osduApi from '@/services/osduApiService';

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
  metadata?: {
    matchedFields?: string[];
    reasoning?: string;
    confidence?: number;
  };
}

interface SemanticSchemaSearchProps {
  onResults: (results: SemanticSearchResult[]) => void;
  searchQuery: string;
  loading: boolean;
  onSearch?: () => void;
}

const SemanticSchemaSearch: React.FC<SemanticSchemaSearchProps> = ({
  onResults,
  searchQuery,
  loading,
  onSearch
}) => {
  const [searchInsights, setSearchInsights] = useState<{
    queryAnalysis: string;
    searchStrategy: string;
    expectedResults: string[];
  } | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Mock semantic search insights based on query
  useEffect(() => {
    if (searchQuery.trim()) {
      // Simulate AI analysis of the search query
      const insights = analyzeSearchQuery(searchQuery);
      setSearchInsights(insights);
    } else {
      setSearchInsights(null);
    }
  }, [searchQuery]);

  const analyzeSearchQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    let queryAnalysis = '';
    let searchStrategy = '';
    let expectedResults: string[] = [];

    // Analyze query intent
    if (lowerQuery.includes('well') || lowerQuery.includes('drilling')) {
      queryAnalysis = 'Detected well/drilling data query - focusing on wellbore and drilling schemas';
      searchStrategy = 'Semantic matching on well-related terminology and drilling operations';
      expectedResults = ['wellbore schemas', 'drilling data schemas', 'well completion schemas'];
    } else if (lowerQuery.includes('seismic') || lowerQuery.includes('geophysical')) {
      queryAnalysis = 'Detected geophysical data query - focusing on seismic and survey schemas';
      searchStrategy = 'Semantic matching on geophysical terminology and seismic data structures';
      expectedResults = ['seismic survey schemas', 'geophysical data schemas', 'interpretation schemas'];
    } else if (lowerQuery.includes('production') || lowerQuery.includes('reservoir')) {
      queryAnalysis = 'Detected production/reservoir query - focusing on production and reservoir schemas';
      searchStrategy = 'Semantic matching on production terminology and reservoir engineering';
      expectedResults = ['production data schemas', 'reservoir schemas', 'facility schemas'];
    } else if (lowerQuery.includes('legal') || lowerQuery.includes('compliance')) {
      queryAnalysis = 'Detected legal/compliance query - focusing on legal and regulatory schemas';
      searchStrategy = 'Semantic matching on legal terminology and compliance structures';
      expectedResults = ['legal tag schemas', 'compliance schemas', 'regulatory schemas'];
    } else {
      queryAnalysis = 'General schema search - using broad semantic matching';
      searchStrategy = 'Semantic matching across all schema types and content';
      expectedResults = ['reference data schemas', 'work product schemas', 'master data schemas'];
    }

    return {
      queryAnalysis,
      searchStrategy,
      expectedResults
    };
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'success';
    if (similarity >= 0.6) return 'warning';
    return 'error';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Excellent Match';
    if (similarity >= 0.8) return 'Very Good Match';
    if (similarity >= 0.7) return 'Good Match';
    if (similarity >= 0.6) return 'Fair Match';
    return 'Weak Match';
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await osduApi.searchSchemasBySimilarity(searchQuery, 10);
      if (response?.searchSchemasBySimilarity?.results) {
        onResults(response.searchSchemasBySimilarity.results);
      }
    } catch (error) {
      console.error('Semantic search failed:', error);
      // Handle error - could show a toast or error message
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Box>
      {/* Search Insights */}
      {searchInsights && (
        <Card sx={{ mb: 2, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon color="primary" />
                <Typography variant="subtitle2" color="primary">
                  AI Search Analysis
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={showInsights}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Query Analysis:</strong> {searchInsights.queryAnalysis}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Search Strategy:</strong> {searchInsights.searchStrategy}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Expected Results:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {searchInsights.expectedResults.map((result, index) => (
                      <Chip 
                        key={index}
                        label={result}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="body2" color="primary">
              AI is analyzing schemas for semantic similarity...
            </Typography>
          </Box>
          <LinearProgress />
        </Box>
      )}

      {/* Semantic Search Help */}
      {!loading && searchQuery && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleSemanticSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search Now'}
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>Semantic Search:</strong> Results are ranked by AI-powered similarity analysis. 
            Higher similarity scores indicate better conceptual matches to your query.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SemanticSchemaSearch;