'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Popper,
  ClickAwayListener,
  Fade,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
  Lightbulb as SuggestionIcon
} from '@mui/icons-material';

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

interface SearchSuggestion {
  type: 'recent' | 'popular' | 'semantic' | 'entity';
  text: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SchemaSearchSuggestionsProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
  searchQuery: string;
  schemas: Schema[];
}

const SchemaSearchSuggestions: React.FC<SchemaSearchSuggestionsProps> = ({
  anchorEl,
  open,
  onClose,
  onSuggestionClick,
  searchQuery,
  schemas
}) => {
  const [recentSearches] = useState<string[]>([
    'well data schemas',
    'seismic survey',
    'production data',
    'legal compliance'
  ]);

  const suggestions = useMemo(() => {
    const allSuggestions: SearchSuggestion[] = [];

    // Recent searches
    if (!searchQuery) {
      recentSearches.forEach(search => {
        allSuggestions.push({
          type: 'recent',
          text: search,
          description: 'Recent search',
          icon: <HistoryIcon fontSize="small" />
        });
      });
    }

    // Entity type suggestions based on current query
    if (searchQuery.length > 0) {
      const matchingEntities = schemas
        .filter(schema => 
          schema.schemaIdentity.entityType.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 3)
        .map(schema => ({
          type: 'entity' as const,
          text: schema.schemaIdentity.entityType,
          description: `${schema.schemaIdentity.authority} schema`,
          icon: <SearchIcon fontSize="small" />
        }));
      
      allSuggestions.push(...matchingEntities);
    }

    // Semantic suggestions
    const semanticSuggestions: SearchSuggestion[] = [
      {
        type: 'semantic',
        text: 'drilling and completion data',
        description: 'AI-powered semantic search',
        icon: <AIIcon fontSize="small" />
      },
      {
        type: 'semantic',
        text: 'reservoir engineering schemas',
        description: 'AI-powered semantic search',
        icon: <AIIcon fontSize="small" />
      },
      {
        type: 'semantic',
        text: 'geophysical survey data',
        description: 'AI-powered semantic search',
        icon: <AIIcon fontSize="small" />
      }
    ];

    // Add semantic suggestions if query is long enough or no query
    if (searchQuery.length === 0 || searchQuery.length > 3) {
      allSuggestions.push(...semanticSuggestions.slice(0, 2));
    }

    // Popular searches
    if (!searchQuery) {
      const popularSuggestions: SearchSuggestion[] = [
        {
          type: 'popular',
          text: 'reference data',
          description: 'Popular search',
          icon: <TrendingIcon fontSize="small" />
        },
        {
          type: 'popular',
          text: 'work product component',
          description: 'Popular search',
          icon: <TrendingIcon fontSize="small" />
        }
      ];
      
      allSuggestions.push(...popularSuggestions);
    }

    return allSuggestions.slice(0, 8); // Limit to 8 suggestions
  }, [searchQuery, schemas, recentSearches]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion.text);
    onClose();
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'semantic':
        return 'primary';
      case 'popular':
        return 'success';
      case 'recent':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!open || suggestions.length === 0) {
    return null;
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      style={{ zIndex: 1300, width: anchorEl?.clientWidth || 'auto' }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              maxHeight: 400,
              overflow: 'auto',
              border: 1,
              borderColor: 'divider'
            }}
          >
            <ClickAwayListener onClickAway={onClose}>
              <Box>
                {/* Header */}
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery ? 'Search suggestions' : 'Quick searches'}
                  </Typography>
                </Box>

                <Divider />

                {/* Suggestions List */}
                <List dense sx={{ py: 0 }}>
                  {suggestions.map((suggestion, index) => (
                    <ListItem
                      key={`${suggestion.type}-${index}`}
                      button
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {suggestion.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {suggestion.text}
                            </Typography>
                            <Chip
                              label={suggestion.type}
                              size="small"
                              variant="outlined"
                              color={getSuggestionColor(suggestion.type)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={suggestion.description}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Footer */}
                <Divider />
                <Box sx={{ p: 2, pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuggestionIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Try semantic search for better results
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </ClickAwayListener>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

export default SchemaSearchSuggestions;