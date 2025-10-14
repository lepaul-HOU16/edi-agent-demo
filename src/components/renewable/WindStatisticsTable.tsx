/**
 * Wind Statistics Table Component
 * 
 * Comprehensive table displaying wind resource statistics with
 * professional formatting and export capabilities.
 */

import React, { useState } from 'react';
import {
  Table,
  Header,
  SpaceBetween,
  Box,
  Badge,
  Button,
  ButtonDropdown,
  Pagination,
  TextFilter,
  CollectionPreferences,
  PropertyFilter
} from '@cloudscape-design/components';
import { WindResourceData, WindStatistics, SeasonalWindData } from '../../types/windData';

interface WindStatisticsTableProps {
  windData: WindResourceData;
  seasonalData?: SeasonalWindData;
  onExport?: (format: string, data: any) => void;
  compact?: boolean;
}

interface StatisticItem {
  id: string;
  category: string;
  parameter: string;
  value: number;
  unit: string;
  formattedValue: string;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  importance: 'high' | 'medium' | 'low';
  benchmark?: {
    excellent: number;
    good: number;
    fair: number;
  };
}

const WindStatisticsTable: React.FC<WindStatisticsTableProps> = ({
  windData,
  seasonalData,
  onExport,
  compact = false
}) => {
  const [selectedItems, setSelectedItems] = useState<StatisticItem[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteringText, setFilteringText] = useState('');
  const [sortingColumn, setSortingColumn] = useState<any>({ sortingField: 'importance' });
  const [sortingDescending, setSortingDescending] = useState(false);

  // Prepare statistics data
  const statisticsData: StatisticItem[] = React.useMemo(() => {
    const stats = windData.statistics;
    const items: StatisticItem[] = [
      {
        id: 'mean_speed',
        category: 'Wind Resource',
        parameter: 'Mean Wind Speed',
        value: stats.meanWindSpeed,
        unit: 'm/s',
        formattedValue: `${stats.meanWindSpeed.toFixed(1)} m/s`,
        rating: getRating(stats.meanWindSpeed, { excellent: 7.5, good: 6.5, fair: 5.5 }),
        description: 'Average wind speed over the measurement period',
        importance: 'high',
        benchmark: { excellent: 7.5, good: 6.5, fair: 5.5 }
      },
      {
        id: 'max_speed',
        category: 'Wind Resource',
        parameter: 'Maximum Wind Speed',
        value: stats.maxWindSpeed,
        unit: 'm/s',
        formattedValue: `${stats.maxWindSpeed.toFixed(1)} m/s`,
        rating: getRating(stats.maxWindSpeed, { excellent: 25, good: 20, fair: 15 }),
        description: 'Highest recorded wind speed',
        importance: 'medium'
      },
      {
        id: 'power_density',
        category: 'Energy Potential',
        parameter: 'Power Density',
        value: stats.powerDensity,
        unit: 'W/m²',
        formattedValue: `${stats.powerDensity.toFixed(0)} W/m²`,
        rating: getRating(stats.powerDensity, { excellent: 400, good: 300, fair: 200 }),
        description: 'Available wind power per unit area',
        importance: 'high',
        benchmark: { excellent: 400, good: 300, fair: 200 }
      },
      {
        id: 'weibull_shape',
        category: 'Distribution',
        parameter: 'Weibull Shape (k)',
        value: stats.weibullParameters.shape,
        unit: '',
        formattedValue: stats.weibullParameters.shape.toFixed(2),
        rating: getRating(stats.weibullParameters.shape, { excellent: 2.5, good: 2.0, fair: 1.5 }),
        description: 'Wind speed distribution shape parameter',
        importance: 'medium'
      },
      {
        id: 'weibull_scale',
        category: 'Distribution',
        parameter: 'Weibull Scale (A)',
        value: stats.weibullParameters.scale,
        unit: 'm/s',
        formattedValue: `${stats.weibullParameters.scale.toFixed(1)} m/s`,
        rating: getRating(stats.weibullParameters.scale, { excellent: 8, good: 7, fair: 6 }),
        description: 'Wind speed distribution scale parameter',
        importance: 'medium'
      },
      {
        id: 'calm_percentage',
        category: 'Availability',
        parameter: 'Calm Percentage',
        value: stats.calmPercentage,
        unit: '%',
        formattedValue: `${stats.calmPercentage.toFixed(1)}%`,
        rating: getRating(stats.calmPercentage, { excellent: 5, good: 10, fair: 15 }, true), // Lower is better
        description: 'Percentage of time with wind speed < 1 m/s',
        importance: 'medium'
      },
      {
        id: 'standard_deviation',
        category: 'Variability',
        parameter: 'Standard Deviation',
        value: stats.standardDeviation,
        unit: 'm/s',
        formattedValue: `${stats.standardDeviation.toFixed(1)} m/s`,
        rating: getRating(stats.standardDeviation, { excellent: 2, good: 3, fair: 4 }),
        description: 'Wind speed variability measure',
        importance: 'low'
      },
      {
        id: 'prevailing_direction',
        category: 'Direction',
        parameter: 'Prevailing Direction',
        value: stats.prevailingDirection,
        unit: '°',
        formattedValue: `${getDirectionLabel(stats.prevailingDirection)}`,
        rating: 'good' as const,
        description: 'Most frequent wind direction',
        importance: 'medium'
      }
    ];

    // Add data quality metrics
    items.push({
      id: 'completeness',
      category: 'Data Quality',
      parameter: 'Data Completeness',
      value: windData.qualityMetrics.completeness,
      unit: '%',
      formattedValue: `${windData.qualityMetrics.completeness.toFixed(1)}%`,
      rating: getRating(windData.qualityMetrics.completeness, { excellent: 95, good: 90, fair: 85 }),
      description: 'Percentage of valid data points',
      importance: 'high'
    });

    items.push({
      id: 'measurement_hours',
      category: 'Data Quality',
      parameter: 'Total Measurement Hours',
      value: windData.timeRange.totalHours,
      unit: 'hours',
      formattedValue: windData.timeRange.totalHours.toLocaleString(),
      rating: getRating(windData.timeRange.totalHours, { excellent: 8760, good: 4380, fair: 2190 }),
      description: 'Total hours of wind measurements',
      importance: 'medium'
    });

    return items;
  }, [windData]);

  // Filter and sort data
  const filteredData = statisticsData.filter(item =>
    item.parameter.toLowerCase().includes(filteringText.toLowerCase()) ||
    item.category.toLowerCase().includes(filteringText.toLowerCase()) ||
    item.description.toLowerCase().includes(filteringText.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const field = sortingColumn.sortingField;
    let aValue = a[field as keyof StatisticItem];
    let bValue = b[field as keyof StatisticItem];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortingDescending ? 1 : -1;
    if (aValue > bValue) return sortingDescending ? -1 : 1;
    return 0;
  });

  // Pagination
  const paginatedData = sortedData.slice(
    (currentPageIndex - 1) * pageSize,
    currentPageIndex * pageSize
  );

  // Column definitions
  const columnDefinitions = [
    {
      id: 'category',
      header: 'Category',
      cell: (item: StatisticItem) => item.category,
      sortingField: 'category',
      isRowHeader: true
    },
    {
      id: 'parameter',
      header: 'Parameter',
      cell: (item: StatisticItem) => (
        <Box>
          <div style={{ fontWeight: 'bold' }}>{item.parameter}</div>
          {!compact && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              {item.description}
            </div>
          )}
        </Box>
      ),
      sortingField: 'parameter'
    },
    {
      id: 'value',
      header: 'Value',
      cell: (item: StatisticItem) => (
        <Box>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {item.formattedValue}
          </div>
        </Box>
      ),
      sortingField: 'value'
    },
    {
      id: 'rating',
      header: 'Rating',
      cell: (item: StatisticItem) => (
        <Badge color={getBadgeColor(item.rating)}>
          {item.rating.toUpperCase()}
        </Badge>
      ),
      sortingField: 'rating'
    },
    {
      id: 'importance',
      header: 'Importance',
      cell: (item: StatisticItem) => (
        <Badge color={getImportanceBadgeColor(item.importance)}>
          {item.importance.toUpperCase()}
        </Badge>
      ),
      sortingField: 'importance'
    }
  ];

  // Add benchmark column if not compact
  if (!compact) {
    columnDefinitions.push({
      id: 'benchmark',
      header: 'Benchmarks',
      cell: (item: StatisticItem) => (
        item.benchmark ? (
          <Box>
            <div style={{ fontSize: '11px' }}>
              <div>Excellent: ≥{item.benchmark.excellent}{item.unit}</div>
              <div>Good: ≥{item.benchmark.good}{item.unit}</div>
              <div>Fair: ≥{item.benchmark.fair}{item.unit}</div>
            </div>
          </Box>
        ) : null
      ),
      sortingField: 'benchmark'
    } as any);
  }

  // Handle export
  const handleExport = (format: string) => {
    if (!onExport) return;

    const exportData = {
      statistics: statisticsData,
      metadata: {
        location: windData.location,
        timeRange: windData.timeRange,
        dataSource: windData.dataSource,
        measurementHeight: windData.measurementHeight,
        exportedAt: new Date().toISOString(),
        format
      },
      summary: {
        totalParameters: statisticsData.length,
        excellentRatings: statisticsData.filter(item => item.rating === 'excellent').length,
        goodRatings: statisticsData.filter(item => item.rating === 'good').length,
        fairRatings: statisticsData.filter(item => item.rating === 'fair').length,
        poorRatings: statisticsData.filter(item => item.rating === 'poor').length
      }
    };

    onExport(format, exportData);
  };

  return (
    <Table
      columnDefinitions={columnDefinitions}
      items={paginatedData}
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
      sortingColumn={sortingColumn}
      sortingDescending={sortingDescending}
      onSortingChange={({ detail }) => {
        setSortingColumn(detail.sortingColumn);
        setSortingDescending(detail.isDescending || false);
      }}
      header={
        <Header
          variant="h2"
          counter={`(${statisticsData.length})`}
          description="Comprehensive wind resource statistics and quality metrics"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <ButtonDropdown
                items={[
                  { id: 'csv', text: 'Export CSV', description: 'Comma-separated values' },
                  { id: 'excel', text: 'Export Excel', description: 'Microsoft Excel format' },
                  { id: 'json', text: 'Export JSON', description: 'Raw data format' },
                  { id: 'pdf', text: 'Export PDF', description: 'Formatted report' }
                ]}
                onItemClick={({ detail }) => handleExport(detail.id)}
                disabled={!onExport}
              >
                Export Statistics
              </ButtonDropdown>
              <Button
                iconName="refresh"
                onClick={() => {
                  setFilteringText('');
                  setSelectedItems([]);
                  setCurrentPageIndex(1);
                }}
              >
                Reset
              </Button>
            </SpaceBetween>
          }
        >
          Wind Resource Statistics
        </Header>
      }
      filter={
        <TextFilter
          filteringText={filteringText}
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
          filteringPlaceholder="Search statistics..."
          countText={`${filteredData.length} ${filteredData.length === 1 ? 'match' : 'matches'}`}
        />
      }
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          pagesCount={Math.ceil(filteredData.length / pageSize)}
          onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
        />
      }
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={{
            pageSize: pageSize,
            visibleContent: ['category', 'parameter', 'value', 'rating', 'importance']
          }}
          onConfirm={({ detail }) => {
            setPageSize(detail.pageSize || 10);
          }}
          pageSizePreference={{
            title: 'Page size',
            options: [
              { value: 5, label: '5 statistics' },
              { value: 10, label: '10 statistics' },
              { value: 20, label: '20 statistics' },
              { value: 50, label: '50 statistics' }
            ]
          }}
        />
      }
      empty={
        <Box textAlign="center" color="inherit">
          <b>No statistics found</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            No wind resource statistics match the current filter.
          </Box>
        </Box>
      }
    />
  );
};

// Helper function to get rating based on value and thresholds
function getRating(
  value: number, 
  thresholds: { excellent: number; good: number; fair: number },
  lowerIsBetter: boolean = false
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (lowerIsBetter) {
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.fair) return 'fair';
    return 'poor';
  } else {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.fair) return 'fair';
    return 'poor';
  }
}

// Helper function to get badge color based on rating
function getBadgeColor(rating: string): 'green' | 'blue' | 'grey' | 'red' {
  switch (rating) {
    case 'excellent': return 'green';
    case 'good': return 'blue';
    case 'fair': return 'grey';
    case 'poor': return 'red';
    default: return 'grey';
  }
}

// Helper function to get importance badge color
function getImportanceBadgeColor(importance: string): 'red' | 'grey' | 'blue' {
  switch (importance) {
    case 'high': return 'red';
    case 'medium': return 'grey';
    case 'low': return 'blue';
    default: return 'grey';
  }
}

// Helper function to get direction label from degrees
function getDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return `${directions[index]} (${degrees.toFixed(0)}°)`;
}

export default WindStatisticsTable;