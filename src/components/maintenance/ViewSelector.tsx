/**
 * View Selector Component
 * Dropdown component for switching between consolidated view and individual wells
 * 
 * Features:
 * - Dropdown with "Consolidated View" as default
 * - Wells grouped by status (Critical, Degraded, Operational)
 * - Search/filter functionality
 * - Health score badges
 * - Keyboard navigation support
 * 
 * Requirements: 3.1, 3.3, 10.1
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Select,
  SelectProps,
  Box,
  Badge,
  SpaceBetween,
  Input,
  FormField
} from '@cloudscape-design/components';

// Type definitions
interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

interface ViewSelectorProps {
  wells: WellSummary[];
  selectedView: string; // 'consolidated' or wellId
  onViewChange: (viewMode: 'consolidated' | 'individual', wellId?: string) => void;
}

/**
 * Get status badge variant based on well status
 */
const getStatusBadgeVariant = (status: string): 'red' | 'green' | 'blue' | 'grey' => {
  switch (status) {
    case 'critical':
      return 'red';
    case 'degraded':
      return 'blue';
    case 'operational':
      return 'green';
    case 'offline':
      return 'grey';
    default:
      return 'grey';
  }
};

/**
 * Get status icon based on well status
 */
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'critical':
      return '🔴';
    case 'degraded':
      return '🟡';
    case 'operational':
      return '🟢';
    case 'offline':
      return '⚫';
    default:
      return '⚪';
  }
};

/**
 * Get health score color based on score value
 */
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#037f0c'; // Green
  if (score >= 60) return '#f89256'; // Orange
  return '#d91515'; // Red
};

/**
 * View Selector Component
 */
export const ViewSelector: React.FC<ViewSelectorProps> = ({
  wells,
  selectedView,
  onViewChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Filter wells based on search query
  const filteredWells = useMemo(() => {
    if (!searchQuery.trim()) {
      return wells;
    }

    const query = searchQuery.toLowerCase();
    return wells.filter(well => 
      well.id.toLowerCase().includes(query) ||
      well.name.toLowerCase().includes(query) ||
      well.location.toLowerCase().includes(query)
    );
  }, [wells, searchQuery]);

  // Group wells by status
  const groupedWells = useMemo(() => {
    const groups = {
      critical: [] as WellSummary[],
      degraded: [] as WellSummary[],
      operational: [] as WellSummary[],
      offline: [] as WellSummary[]
    };

    filteredWells.forEach(well => {
      if (well.status in groups) {
        groups[well.status].push(well);
      }
    });

    // Sort each group by health score (lowest first for critical/degraded, highest first for operational)
    groups.critical.sort((a, b) => a.healthScore - b.healthScore);
    groups.degraded.sort((a, b) => a.healthScore - b.healthScore);
    groups.operational.sort((a, b) => b.healthScore - a.healthScore);
    groups.offline.sort((a, b) => a.healthScore - b.healthScore);

    return groups;
  }, [filteredWells]);

  // Create options for the Select component
  const selectOptions = useMemo(() => {
    const options: SelectProps.Option[] = [];

    // Add consolidated view option
    options.push({
      label: '📊 Consolidated View (All Wells)',
      value: 'consolidated',
      description: `View all ${wells.length} wells with AI-powered insights`
    });

    // Add separator
    if (filteredWells.length > 0) {
      options.push({
        label: '─────────────────────────────',
        value: '__separator__',
        disabled: true
      });
    }

    // Add critical wells
    if (groupedWells.critical.length > 0) {
      options.push({
        label: '🔴 CRITICAL WELLS',
        value: '__critical_header__',
        disabled: true
      });

      groupedWells.critical.forEach(well => {
        options.push({
          label: `${getStatusIcon(well.status)} ${well.id} - ${well.name}`,
          value: well.id,
          description: `Health: ${well.healthScore}/100 | Alerts: ${well.criticalAlertCount} critical`,
          tags: [well.status.toUpperCase()]
        });
      });
    }

    // Add degraded wells
    if (groupedWells.degraded.length > 0) {
      options.push({
        label: '🟡 DEGRADED WELLS',
        value: '__degraded_header__',
        disabled: true
      });

      groupedWells.degraded.forEach(well => {
        options.push({
          label: `${getStatusIcon(well.status)} ${well.id} - ${well.name}`,
          value: well.id,
          description: `Health: ${well.healthScore}/100 | Alerts: ${well.alertCount}`,
          tags: [well.status.toUpperCase()]
        });
      });
    }

    // Add operational wells
    if (groupedWells.operational.length > 0) {
      options.push({
        label: '🟢 OPERATIONAL WELLS',
        value: '__operational_header__',
        disabled: true
      });

      groupedWells.operational.forEach(well => {
        options.push({
          label: `${getStatusIcon(well.status)} ${well.id} - ${well.name}`,
          value: well.id,
          description: `Health: ${well.healthScore}/100 | Status: ${well.status}`,
          tags: [well.status.toUpperCase()]
        });
      });
    }

    // Add offline wells
    if (groupedWells.offline.length > 0) {
      options.push({
        label: '⚫ OFFLINE WELLS',
        value: '__offline_header__',
        disabled: true
      });

      groupedWells.offline.forEach(well => {
        options.push({
          label: `${getStatusIcon(well.status)} ${well.id} - ${well.name}`,
          value: well.id,
          description: `Health: ${well.healthScore}/100 | Status: ${well.status}`,
          tags: [well.status.toUpperCase()]
        });
      });
    }

    // Show "no results" message if search returned nothing
    if (searchQuery.trim() && filteredWells.length === 0) {
      options.push({
        label: '❌ No wells found',
        value: '__no_results__',
        description: `No wells match "${searchQuery}"`,
        disabled: true
      });
    }

    return options;
  }, [wells.length, filteredWells.length, groupedWells, searchQuery]);

  // Get selected option
  const selectedOption = useMemo(() => {
    return selectOptions.find(opt => opt.value === selectedView) || selectOptions[0];
  }, [selectOptions, selectedView]);

  /**
   * Handle view selection change
   */
  const handleChange = (event: { detail: { selectedOption: SelectProps.Option } }) => {
    const { selectedOption } = event.detail;
    const value = selectedOption.value;

    console.log(`🎯 View selector changed: ${value}`);

    // Clear search when selection changes
    setSearchQuery('');

    // Handle selection
    if (value === 'consolidated') {
      onViewChange('consolidated');
    } else if (value && !value.startsWith('__')) {
      // It's a well ID
      onViewChange('individual', value);
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (event: { detail: { value: string } }) => {
    setSearchQuery(event.detail.value);
    console.log(`🔍 Search query: ${event.detail.value}`);
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    console.log('🧹 Search cleared');
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: any) => {
    // Escape key - close dropdown and clear search
    if (event.detail?.key === 'Escape' || event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      console.log('⌨️ Escape pressed - closing dropdown');
    }
  };

  return (
    <SpaceBetween size="m">
      {/* Search Input (shown when dropdown is open) */}
      {isOpen && (
        <FormField
          label="Search wells"
          description="Filter by well ID, name, or location"
        >
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type to search..."
            type="search"
            clearAriaLabel="Clear search"
            onKeyDown={handleKeyDown}
            ariaLabel="Search wells"
          />
        </FormField>
      )}

      {/* View Selector Dropdown */}
      <FormField
        label="View"
        description="Select consolidated view or individual well"
      >
        <Select
          selectedOption={selectedOption}
          onChange={handleChange}
          options={selectOptions}
          placeholder="Select a view"
          filteringType="manual" // We handle filtering ourselves
          expandToViewport
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow click events to fire
            setTimeout(() => setIsOpen(false), 200);
          }}
          ariaLabel="View selector"
          selectedAriaLabel="Selected view"
        />
      </FormField>

      {/* Selected Well Summary (when individual well is selected) */}
      {selectedView !== 'consolidated' && selectedView && (
        <Box>
          {(() => {
            const well = wells.find(w => w.id === selectedView);
            if (!well) return null;

            return (
              <SpaceBetween size="xs">
                <Box variant="awsui-key-label">Selected Well Details</Box>
                <SpaceBetween size="xs" direction="horizontal">
                  <Badge color={getStatusBadgeVariant(well.status)}>
                    {well.status.toUpperCase()}
                  </Badge>
                  <Box variant="span">
                    <strong>Health Score:</strong>{' '}
                    <span style={{ color: getHealthScoreColor(well.healthScore), fontWeight: 'bold' }}>
                      {well.healthScore}/100
                    </span>
                  </Box>
                  <Box variant="span">
                    <strong>Alerts:</strong> {well.alertCount}
                    {well.criticalAlertCount > 0 && (
                      <Badge color="red"> {well.criticalAlertCount} critical</Badge>
                    )}
                  </Box>
                </SpaceBetween>
                <Box variant="small" color="text-body-secondary">
                  {well.location}
                </Box>
              </SpaceBetween>
            );
          })()}
        </Box>
      )}

      {/* Search Results Summary */}
      {searchQuery.trim() && (
        <Box variant="small" color="text-body-secondary">
          {filteredWells.length === 0 ? (
            <span>No wells found matching "{searchQuery}"</span>
          ) : (
            <span>
              Showing {filteredWells.length} of {wells.length} wells
              {' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleClearSearch();
                }}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Clear search
              </a>
            </span>
          )}
        </Box>
      )}
    </SpaceBetween>
  );
};

export default ViewSelector;
