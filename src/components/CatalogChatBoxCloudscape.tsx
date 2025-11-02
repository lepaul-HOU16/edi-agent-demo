import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../../utils/types';
import ChatMessage from './ChatMessage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Table,
  Header,
  Pagination,
  ButtonDropdown,
  Button,
  Spinner,
  Icon
} from '@cloudscape-design/components';
import ExpandablePromptInput from './ExpandablePromptInput';
import GeoscientistDashboard from './GeoscientistDashboard';
import GeoscientistDashboardErrorBoundary from './GeoscientistDashboardErrorBoundary';
import HierarchicalDataTable from './HierarchicalDataTable';
import { v4 as uuidv4 } from 'uuid';

// Enhanced component to render professional geoscientist content instead of boring tables
function ProfessionalGeoscientistDisplay({
  tableData,
  searchQuery,
  queryType,
  weatherData,
  filterStats
}: {
  tableData: any[],
  searchQuery: string,
  queryType?: string,
  weatherData?: any,
  filterStats?: FilterStats | null
}) {
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Sorting state
  const [sortingColumn, setSortingColumn] = React.useState<any>(null);
  const [isDescending, setIsDescending] = React.useState(false);

  // Expandable rows state
  const [expandedItems, setExpandedItems] = React.useState<any[]>([]);

  // Convert table data to well data format for the dashboard
  const wellsData = tableData.map(item => ({
    name: item.name || item.Name || `Well-${Math.random().toString().substr(2, 3)}`,
    type: item.type || item.Type || 'Production',
    depth: item.depth || item.Depth || 'Unknown',
    location: item.location || item.Location || 'Offshore',
    operator: item.operator || item.Operator || 'Unknown',
    coordinates: [
      parseFloat(item.longitude) || 114.5 + Math.random() * 0.1,
      parseFloat(item.latitude) || 10.4 + Math.random() * 0.1
    ] as [number, number]
  }));

  // Check if we should show professional dashboard vs simple table
  const shouldShowProfessionalDashboard =
    wellsData.length <= 50 && // Don't overwhelm with too many wells
    (searchQuery.toLowerCase().includes('well') ||
      searchQuery.toLowerCase().includes('weather') ||
      searchQuery.toLowerCase().includes('analysis') ||
      searchQuery.toLowerCase().includes('field'));

  // Always show simple table in chat - visualizations moved to analytics tab
  console.log('📋 Rendering simple data table in chat (visualizations in analytics tab)');

  // Fallback to simple table for very large datasets
  console.log('📋 Rendering simple table for large dataset:', wellsData.length, 'items');

  // Helper function to get sortable values
  const getSortableValue = (item: any, field: string) => {
    switch (field) {
      case 'facilityName':
        return (item.data?.FacilityName || item.facilityName || item.name || 'N/A').toLowerCase();
      case 'wellboreCount':
        const wellbores = item.wellbores;
        return Array.isArray(wellbores)
          ? wellbores.length
          : (wellbores && typeof wellbores === 'object' ? Object.keys(wellbores).length : 0);
      case 'curveCount':
        const wbs = item.wellbores;
        const wbsArray = Array.isArray(wbs)
          ? wbs
          : (wbs && typeof wbs === 'object' ? Object.values(wbs) : []);

        return wbsArray.reduce((total: number, wellbore: any) => {
          const welllogs = wellbore.welllogs;
          const welllogsArray = Array.isArray(welllogs)
            ? welllogs
            : (welllogs && typeof welllogs === 'object' ? Object.values(welllogs) : []);

          const welllogCurves = welllogsArray.reduce((wbTotal: number, welllog: any) => {
            const curves = welllog.data?.Curves || welllog.Curves || [];
            return wbTotal + (Array.isArray(curves) ? curves.length : 0);
          }, 0);
          return total + welllogCurves;
        }, 0);
      default:
        return '';
    }
  };

  // Sort the data
  const sortedData = React.useMemo(() => {
    if (!sortingColumn) return tableData;

    const sorted = [...tableData].sort((a, b) => {
      const aValue = getSortableValue(a, sortingColumn.sortingField);
      const bValue = getSortableValue(b, sortingColumn.sortingField);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return isDescending ? bValue - aValue : aValue - bValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return isDescending ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });

    return sorted;
  }, [tableData, sortingColumn, isDescending]);

  // Generate column definitions with specific structure (compact for expandable rows)
  const generateColumnDefinitions = () => {
    if (!tableData || tableData.length === 0) return [];

    return [
      {
        id: 'facilityName',
        header: 'Facility Name',
        cell: (item: any) => {
          // If this is a wellbore child row, show wellbore name with indent
          if (item.__isWellboreChild) {
            return (
              <div style={{ paddingLeft: '24px', color: '#545b64', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="angle-right" size="small" /> 
                <span>{item.wellboreName}</span>
              </div>
            );
          }
          return <strong>{item.data?.FacilityName || item.facilityName || item.name || 'N/A'}</strong>;
        },
        sortingField: 'facilityName',
        isRowHeader: true,
        width: '50%'
      },
      {
        id: 'wellboreCount',
        header: 'Wellbores',
        cell: (item: any) => {
          // For wellbore child rows, show welllog count
          if (item.__isWellboreChild) {
            return <span style={{ color: '#545b64', fontSize: '14px' }}>{item.welllogCount} welllogs</span>;
          }
          // Handle both array and object formats
          const wellbores = item.wellbores;
          const count = Array.isArray(wellbores)
            ? wellbores.length
            : (wellbores && typeof wellbores === 'object' ? Object.keys(wellbores).length : 0);
          return count;
        },
        sortingField: 'wellboreCount',
        width: '25%'
      },
      {
        id: 'curveCount',
        header: 'Welllog Curves',
        cell: (item: any) => {
          // For wellbore child rows, show curve count
          if (item.__isWellboreChild) {
            return <span style={{ color: '#545b64', fontSize: '14px' }}>{item.curveCount} curves</span>;
          }
          // Handle both array and object formats
          const wellbores = item.wellbores;
          const wellboresArray = Array.isArray(wellbores)
            ? wellbores
            : (wellbores && typeof wellbores === 'object' ? Object.values(wellbores) : []);

          const totalCurves = wellboresArray.reduce((total: number, wellbore: any) => {
            const welllogs = wellbore.welllogs;
            const welllogsArray = Array.isArray(welllogs)
              ? welllogs
              : (welllogs && typeof welllogs === 'object' ? Object.values(welllogs) : []);

            const welllogCurves = welllogsArray.reduce((wbTotal: number, welllog: any) => {
              const curves = welllog.data?.Curves || welllog.Curves || [];
              return wbTotal + (Array.isArray(curves) ? curves.length : 0);
            }, 0);
            return total + welllogCurves;
          }, 0);
          return totalCurves;
        },
        sortingField: 'curveCount',
        width: '25%'
      }
    ];
  };

  // Detect data source type based on item structure
  const detectDataSource = (item: any): 'osdu' | 'tgs' | 'volve' | 'sp' | 'generic' => {
    // OSDU has specific schema with data.FacilityName and wellbores structure
    if (item.data?.FacilityName && item.wellbores) return 'osdu';
    // TGS might have different structure - add detection logic as needed
    if (item.tgs_id || item.source === 'tgs') return 'tgs';
    // Volve dataset detection
    if (item.volve_id || item.source === 'volve') return 'volve';
    // S&P detection
    if (item.sp_id || item.source === 'sp') return 'sp';
    return 'generic';
  };

  // Generate child rows (wellbores) for expandable rows
  const getWellboreChildren = (item: any) => {
    const wellbores = item.wellbores;
    const wellboresArray = Array.isArray(wellbores)
      ? wellbores
      : (wellbores && typeof wellbores === 'object' ? Object.values(wellbores) : []);

    if (wellboresArray.length === 0) return [];

    // Convert wellbores to child row items
    return wellboresArray.map((wellbore: any, idx: number) => {
      const wellboreName = wellbore.data?.WellboreName || wellbore.name || `Wellbore ${idx + 1}`;
      const welllogs = wellbore.welllogs;
      const welllogsArray = Array.isArray(welllogs)
        ? welllogs
        : (welllogs && typeof welllogs === 'object' ? Object.values(welllogs) : []);

      // Count total curves across all welllogs
      const totalCurves = welllogsArray.reduce((total: number, welllog: any) => {
        const curves = welllog.data?.Curves || welllog.Curves || [];
        return total + (Array.isArray(curves) ? curves.length : 0);
      }, 0);

      return {
        __isWellboreChild: true,
        __parentId: item.well_id || item.wellId || item.id,
        __wellboreId: `${item.well_id || item.wellId || item.id}-wb-${idx}`,
        wellboreName,
        welllogCount: welllogsArray.length,
        curveCount: totalCurves,
        welllogs: welllogsArray,
        data: wellbore.data
      };
    });
  };

  const columnDefinitions = generateColumnDefinitions();

  // Pagination calculations (use sorted data)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Use paginated data directly - wellbore children are generated on-demand
  const itemsForTable = paginatedData;

  // Reset to page 1 when data or sorting changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tableData.length, sortingColumn, isDescending]);

  return (
    <div
      style={{
        marginTop: '15px',
        marginBottom: '15px',
        maxWidth: '100%',
        width: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div className='tables' style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <Table
          variant="container"
          contentDensity="compact"
          columnDefinitions={columnDefinitions}
          items={itemsForTable}
          trackBy={(item) => item.well_id || item.wellId || item.uniqueId || item.id || `${item.name}-${tableData.indexOf(item)}`}
          loadingText="Loading wells"
          sortingColumn={sortingColumn}
          sortingDescending={isDescending}
          onSortingChange={({ detail }) => {
            setSortingColumn(detail.sortingColumn);
            setIsDescending(detail.isDescending || false);
          }}
          expandableRows={{
            getItemChildren: (item) => {
              // Don't expand wellbore child rows
              if (item.__isWellboreChild) return [];
              
              const isExpanded = expandedItems.some(
                (i) => (i.well_id || i.wellId || i.id) === (item.well_id || item.wellId || item.id)
              );
              
              // Return wellbore children when expanded
              return isExpanded ? getWellboreChildren(item) : [];
            },
            isItemExpandable: (item) => {
              // Only parent facility rows are expandable, not wellbore children
              return !item.__isWellboreChild && (item.wellbores && (
                Array.isArray(item.wellbores) ? item.wellbores.length > 0 : Object.keys(item.wellbores).length > 0
              ));
            },
            expandedItems: expandedItems,
            onExpandableItemToggle: ({ detail }) => {
              const item = detail.item;
              const isExpanded = expandedItems.some(
                (i) => (i.well_id || i.wellId || i.id) === (item.well_id || item.wellId || item.id)
              );

              if (isExpanded) {
                setExpandedItems(
                  expandedItems.filter(
                    (i) => (i.well_id || i.wellId || i.id) !== (item.well_id || item.wellId || item.id)
                  )
                );
              } else {
                setExpandedItems([...expandedItems, item]);
              }
            }
          }}
          header={
            <Header
              counter={
                filterStats?.isFiltered
                  ? `(${filterStats.filteredCount} of ${filterStats.totalCount} total)`
                  : `(${tableData.length} total)`
              }
              description={
                filterStats?.isFiltered
                  ? "Filtered results - click any row to view details"
                  : "Click any row to view detailed information"
              }
            >
              Well Data
            </Header>
          }
          pagination={
            tableData.length > itemsPerPage ? (
              <Pagination
                currentPageIndex={currentPage}
                onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
                pagesCount={totalPages}
                ariaLabels={{
                  nextPageLabel: 'Next page',
                  previousPageLabel: 'Previous page',
                  pageLabel: pageNumber => `Page ${pageNumber} of ${totalPages}`
                }}
              />
            ) : undefined
          }
          empty={
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <strong>No wells found</strong>
            </div>
          }
          wrapLines
        />
      </div>
    </div>
  );
}

// Enhanced AI message component that renders professional geoscientist content
function CustomAIMessage({ message, originalSearchQuery, hierarchicalData, filteredData, filterStats }: {
  message: Message,
  originalSearchQuery?: string,
  hierarchicalData?: any,
  filteredData?: any,
  filterStats?: FilterStats | null
}) {
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [queryType, setQueryType] = useState<string>('general');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [useHierarchicalView, setUseHierarchicalView] = useState<boolean>(false);

  // Parse the message content to extract table data and determine query type
  useEffect(() => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content
      ? String(message.content.text)
      : '';

    if (messageText) {
      try {
        // Look for JSON table data marker in the message
        const tableDataMatch = messageText.match(/```json-table-data\n([\s\S]*?)\n```/);
        if (tableDataMatch && tableDataMatch[1]) {
          const parsedData = JSON.parse(tableDataMatch[1]);

          // Check if we have files.metadata URL to fetch full data with wellbores/welllogs
          const files = (message as any).files;
          if (files && files.metadata) {
            console.log('📥 Fetching full metadata with wellbores/welllogs from:', files.metadata);

            // Fetch the full metadata file
            fetch(files.metadata)
              .then(response => response.json())
              .then(fullData => {
                console.log('✅ Loaded full metadata:', fullData.length, 'wells');

                // Use the full data which includes wellbores and welllogs
                setTableData(fullData);

                // Log first item to verify structure
                if (fullData.length > 0) {
                  console.log('🔍 Full data structure:', {
                    keys: Object.keys(fullData[0]),
                    wellbores: fullData[0].wellbores,
                    wellboresCount: Array.isArray(fullData[0].wellbores)
                      ? fullData[0].wellbores.length
                      : (fullData[0].wellbores && typeof fullData[0].wellbores === 'object' ? Object.keys(fullData[0].wellbores).length : 0)
                  });
                }
              })
              .catch(error => {
                console.error('❌ Error fetching full metadata:', error);
                // Fallback to parsed data
                setTableData(parsedData);
              });
          } else {
            // No metadata file, use parsed data
            setTableData(parsedData);
          }

          // Determine query type from the original search query
          if (originalSearchQuery) {
            const lowerQuery = originalSearchQuery.toLowerCase();

            // Check if this is a /getdata command - use hierarchical view
            if (lowerQuery === '/getdata' || lowerQuery.includes('getdata')) {
              setUseHierarchicalView(true);
              setQueryType('getdata');
            } else if (lowerQuery.includes('weather map') ||
              (lowerQuery.includes('weather') && lowerQuery.includes('map')) ||
              (lowerQuery.includes('weather') && lowerQuery.includes('near'))) {
              setQueryType('weatherMaps');
              // Create mock weather data for dashboard
              setWeatherData({
                temperature: { min: 26, max: 31, current: 28.5 },
                precipitation: { current: 2.3, forecast: 'Light showers' },
                operationalStatus: 'Favorable'
              });
            } else if (lowerQuery.includes('production') || lowerQuery.includes('reservoir')) {
              setQueryType('production');
            } else if (lowerQuery.includes('my wells')) {
              setQueryType('myWells');
            }
          }

          console.log('🎯 Detected query type:', queryType);
          console.log('🌳 Use hierarchical view:', useHierarchicalView);
        }
      } catch (error) {
        console.error("Error parsing table data:", error);
      }
    }
  }, [message.content, originalSearchQuery]);

  // Get clean text without the JSON table data
  const getCleanText = () => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content
      ? String(message.content.text)
      : '';

    if (!messageText) return "";
    return messageText.replace(/```json-table-data\n[\s\S]*?\n```/g, "");
  };

  // Extract thought steps from message
  const thoughtSteps = (message as any).thoughtSteps || [];
  const hasThoughtSteps = Array.isArray(thoughtSteps) && thoughtSteps.length > 0;

  // Extract stats from message (if available)
  const stats = (message as any).stats;
  const hasStats = stats && (stats.wellCount || stats.wellboreCount || stats.welllogCount);

  // Extract file URLs from message (if available)
  const files = (message as any).files;
  const hasFiles = files && (files.metadata || files.geojson);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{
          width: '40px',
          height: '40px',
          minWidth: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0073bb',
          borderRadius: '50%',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          <Icon name="gen-ai" />
        </div>
        <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Display thought steps summary if available */}
          {hasThoughtSteps && (
            <div style={{
              backgroundColor: '#f0f8ff',
              border: '1px solid #0073bb',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#0073bb'
              }}>
                <Icon name="gen-ai" />
                <span>AI Reasoning Process ({thoughtSteps.length} steps)</span>
              </div>
              <div style={{ fontSize: '13px', color: '#545b64' }}>
                View detailed thought process in the <strong>Chain of Thought</strong> panel
              </div>
            </div>
          )}

          {/* Display stats summary if available */}
          {hasStats && (
            <div style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #d5dbdb',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '12px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              {stats.wellCount !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="status-info" variant="success" />
                  <span style={{ fontWeight: 'bold' }}>{stats.wellCount}</span>
                  <span style={{ color: '#545b64' }}>wells</span>
                </div>
              )}
              {stats.wellboreCount !== undefined && stats.wellboreCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="status-info" variant="success" />
                  <span style={{ fontWeight: 'bold' }}>{stats.wellboreCount}</span>
                  <span style={{ color: '#545b64' }}>wellbores</span>
                </div>
              )}
              {stats.welllogCount !== undefined && stats.welllogCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="status-info" variant="success" />
                  <span style={{ fontWeight: 'bold' }}>{stats.welllogCount}</span>
                  <span style={{ color: '#545b64' }}>welllogs</span>
                </div>
              )}
            </div>
          )}

          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {getCleanText()}
          </ReactMarkdown>

          {/* Render hierarchical table for /getdata command, otherwise simple table */}
          {useHierarchicalView && hierarchicalData ? (
            <HierarchicalDataTable
              treeData={hierarchicalData}
              searchQuery={originalSearchQuery || 'wells analysis'}
            />
          ) : tableData && tableData.length > 0 ? (
            <ProfessionalGeoscientistDisplay
              tableData={filteredData || tableData}
              searchQuery={originalSearchQuery || 'wells analysis'}
              queryType={queryType}
              weatherData={weatherData}
              filterStats={filterStats}
            />
          ) : null}


          {/* Display file URLs if available */}
          {hasFiles && (
            <div style={{
              backgroundColor: '#f9f9f9',
              border: '1px solid #d5dbdb',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#232f3e'
              }}>
                📁 Data Files Available
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {files.metadata && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="file" />
                    <a
                      href={files.metadata}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0073bb', textDecoration: 'none' }}
                    >
                      Well Metadata (JSON)
                    </a>
                  </div>
                )}
                {files.geojson && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="file" />
                    <a
                      href={files.geojson}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0073bb', textDecoration: 'none' }}
                    >
                      GeoJSON Data
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Filter stats interface
interface FilterStats {
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
}

/**
 * CatalogChatBoxCloudscape - A pure Cloudscape version of the chat component
 * Enhanced with professional geoscientist visualizations instead of boring tables
 */
const CatalogChatBoxCloudscape = (params: {
  onInputChange: (input: string) => void,
  userInput: string,
  messages: Message[],
  setMessages: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  onSendMessage: (message: string) => Promise<void>,
  hierarchicalData?: any,
  filteredData?: any,
  filterStats?: FilterStats | null
}) => {
  const { onInputChange, userInput, messages, setMessages, onSendMessage, hierarchicalData, filteredData, filterStats } = params;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // For normal layout, check if we're at the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      console.log('Scrolling to bottom, messages length:', messages.length);
      // Use scrollIntoView on the end ref for more reliable scrolling
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
      // Update isScrolledToBottom after a brief delay to ensure scroll completes
      setTimeout(() => {
        setIsScrolledToBottom(true);
      }, 500);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive - with proper timing
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      console.log('Auto-scroll effect triggered, messages:', messages.length);
      // Multiple approaches to ensure reliable scrolling
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          // First try scrollIntoView
          scrollToBottom();

          // Backup: also try container scroll after additional delay
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight + 100, // Add extra buffer
                behavior: 'smooth'
              });
            }
          }, 100);
        });
      }, 300); // Increased delay

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (userMessage.trim()) {
      setIsLoading(true);

      // Store the search query for context in dashboard rendering
      setLastSearchQuery(userMessage);

      // Add user message to the chat
      const newUserMessage: Message = {
        id: uuidv4(),
        role: 'human',
        content: {
          text: userMessage
        },
        responseComplete: true,
        createdAt: new Date().toISOString(),
        chatSessionId: '',
        owner: ''
      } as any;

      // Defer the state update to avoid setState-during-render warning
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
      }, 0);

      // Clear the input field
      onInputChange('');

      // Process the message (this will be handled by the parent component's onSendMessage)
      await onSendMessage(userMessage);

      setIsLoading(false);
    }
  }, [onInputChange, setMessages, onSendMessage]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="messages-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          flexDirection: 'column',
          display: 'flex',
          marginBottom: '16px',
          position: 'relative'
        }}
      >
        <div>
          {messages.map((message, index) => (
            <div
              key={Array.isArray(message.id) ? message.id[0] || `message-${index}` : message.id || `message-${index}`}
              style={{ marginBottom: '16px', padding: '0 20px', maxWidth: '100%', boxSizing: 'border-box' }}
            >
              {message.role === 'ai' ? (
                <CustomAIMessage
                  message={message}
                  originalSearchQuery={lastSearchQuery}
                  hierarchicalData={hierarchicalData}
                  filteredData={filteredData}
                  filterStats={filterStats}
                />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className='controls'>
        <div className='input-bkgd'>
          <ExpandablePromptInput
            onChange={(value) => onInputChange(value)}
            onAction={() => handleSend(userInput)}
            value={userInput}
            actionButtonAriaLabel="Send message"
            actionButtonIconName="send"
            ariaLabel="Prompt input with action button"
            placeholder="Ask to find wells, wellbores and well logs"
          />
          <div style={{
            color: 'white',
            fontSize: '11px',
            lineHeight: '14px',
            width: '50px',
            marginRight: '-13px',
            marginLeft: '10px'
          }}>
            Data Sources
          </div>
          <ButtonDropdown
            items={[
              {
                text: 'OSDU',
                id: 'osduData'
              },
              {
                text: 'TGS',
                id: 'tgsData'
              },
              {
                text: 'Volve',
                id: 'volveData'
              },
              {
                text: 'S&P',
                id: 'spData'
              },
            ]}
            expandToViewport={true}
            onItemClick={({ detail }) => {
              // Find the clicked item and populate the text box with its text
              const clickedItem = [
                {
                  text: 'can you show me weather maps for the area near my wells',
                  id: '1'
                },
                {
                  text: 'show me my wells with reservoir analysis',
                  id: '2'
                },
                {
                  text: 'field development recommendations for my wells',
                  id: '3'
                },
                {
                  text: 'production optimization analysis',
                  id: '4'
                },
                {
                  text: 'operational weather windows for drilling',
                  id: '5'
                }
              ].find(item => item.id === detail.id);

              if (clickedItem) {
                onInputChange(clickedItem.text);
              }
            }}
          />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!isScrolledToBottom && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          right: '20px',
          zIndex: 1400
        }}>
          <Button
            variant="primary"
            iconName="angle-down"
            onClick={scrollToBottom}
            ariaLabel="Scroll to bottom"
          />
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000,
          border: '1px solid #e9ebed'
        }}>
          <Spinner size="normal" />
          <span style={{ marginLeft: '8px', fontSize: '14px', color: '#232f3e' }}>
            Processing your query...
          </span>
        </div>
      )}
    </div>
  );
};

export default CatalogChatBoxCloudscape;
