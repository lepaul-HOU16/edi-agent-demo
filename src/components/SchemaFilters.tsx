'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Collapse,
  Button,
  Divider
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
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

interface Filters {
  authority: string;
  source: string;
  entityType: string;
  status: string;
  scope: string;
}

interface SchemaFiltersProps {
  filters: Filters;
  onFilterChange: (filterName: string, value: string) => void;
  schemas: Schema[];
}

const SchemaFilters: React.FC<SchemaFiltersProps> = ({
  filters,
  onFilterChange,
  schemas
}) => {
  const [expanded, setExpanded] = useState(false);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const authorities = new Set<string>();
    const sources = new Set<string>();
    const entityTypes = new Set<string>();
    const statuses = new Set<string>();
    const scopes = new Set<string>();

    schemas.forEach(schema => {
      authorities.add(schema.schemaIdentity.authority);
      sources.add(schema.schemaIdentity.source);
      entityTypes.add(schema.schemaIdentity.entityType);
      statuses.add(schema.status);
      scopes.add(schema.scope);
    });

    return {
      authorities: Array.from(authorities).sort(),
      sources: Array.from(sources).sort(),
      entityTypes: Array.from(entityTypes).sort(),
      statuses: Array.from(statuses).sort(),
      scopes: Array.from(scopes).sort()
    };
  }, [schemas]);

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length;

  const handleClearAllFilters = () => {
    Object.keys(filters).forEach(filterName => {
      onFilterChange(filterName, '');
    });
  };

  const handleClearFilter = (filterName: string) => {
    onFilterChange(filterName, '');
  };

  const getFilterDisplayValue = (filterName: string, value: string) => {
    const displayNames: { [key: string]: string } = {
      authority: 'Authority',
      source: 'Source',
      entityType: 'Entity Type',
      status: 'Status',
      scope: 'Scope'
    };
    return `${displayNames[filterName]}: ${value}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ pb: expanded ? 2 : 1 }}>
        {/* Filter Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="action" />
            <Typography variant="subtitle1">
              Filters
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} active`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearAllFilters}
                color="secondary"
              >
                Clear All
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([filterName, value]) => {
              if (!value) return null;
              return (
                <Chip
                  key={filterName}
                  label={getFilterDisplayValue(filterName, value)}
                  onDelete={() => handleClearFilter(filterName)}
                  size="small"
                  color="primary"
                  variant="filled"
                />
              );
            })}
          </Box>
        )}

        {/* Filter Controls */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            {/* Authority Filter */}
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Authority</InputLabel>
                <Select
                  value={filters.authority}
                  label="Authority"
                  onChange={(e) => onFilterChange('authority', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Authorities</em>
                  </MenuItem>
                  {filterOptions.authorities.map(authority => (
                    <MenuItem key={authority} value={authority}>
                      {authority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Source Filter */}
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source}
                  label="Source"
                  onChange={(e) => onFilterChange('source', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Sources</em>
                  </MenuItem>
                  {filterOptions.sources.map(source => (
                    <MenuItem key={source} value={source}>
                      {source}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Entity Type Filter */}
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={filters.entityType}
                  label="Entity Type"
                  onChange={(e) => onFilterChange('entityType', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Types</em>
                  </MenuItem>
                  {filterOptions.entityTypes.map(entityType => (
                    <MenuItem key={entityType} value={entityType}>
                      {entityType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => onFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Statuses</em>
                  </MenuItem>
                  {filterOptions.statuses.map(status => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Scope Filter */}
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Scope</InputLabel>
                <Select
                  value={filters.scope}
                  label="Scope"
                  onChange={(e) => onFilterChange('scope', e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Scopes</em>
                  </MenuItem>
                  {filterOptions.scopes.map(scope => (
                    <MenuItem key={scope} value={scope}>
                      {scope}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Filter Statistics */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Available Options:</strong> {' '}
              {filterOptions.authorities.length} authorities, {' '}
              {filterOptions.sources.length} sources, {' '}
              {filterOptions.entityTypes.length} entity types, {' '}
              {filterOptions.statuses.length} statuses, {' '}
              {filterOptions.scopes.length} scopes
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SchemaFilters;