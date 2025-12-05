import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Badge, BreadcrumbGroup, Cards, Container, ContentLayout, ExpandableSection, Grid, Header, Icon, SpaceBetween, Table, Box as CloudscapeBox, Button, Pagination, SegmentedControl, Modal } from '@cloudscape-design/components';
import { useTheme, IconButton, Tooltip, List, ListItem, useMediaQuery, Typography, Box } from '@mui/material';
import FileDrawer from '@/components/FileDrawer';
import FolderIcon from '@mui/icons-material/Folder';
import RestartAlt from '@mui/icons-material/RestartAlt';
import CatalogChatBoxCloudscape from "@/components/CatalogChatBoxCloudscape";
import ChatMessage from '@/components/ChatMessage';
import ChainOfThoughtDisplay from '@/components/ChainOfThoughtDisplay';
import DataDashboard from '@/components/DataDashboard';
import GeoscientistDashboardErrorBoundary from '@/components/GeoscientistDashboardErrorBoundary';
import CollectionCreationModal from '@/components/CollectionCreationModal';
import { sendMessage } from '@/utils/chatUtils';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/utils/types';
import { withAuth } from '@/components/WithAuth';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { isCollectionsEnabled, isCollectionCreationEnabled } from '@/services/featureFlags';
import { executeOSDUQuery, convertOSDUToWellData } from '@/utils/osduQueryExecutor';
import { OSDUQueryBuilder } from '@/components/OSDUQueryBuilder';
import type { QueryCriterion } from '@/components/OSDUQueryBuilder';
import { createCollection } from '@/lib/api/collections';
import { searchCatalog } from '@/lib/api/catalog';

// Import MapComponent directly - handle SSR with conditional rendering instead
import MapComponentBase from './MapComponent';
import logger from '@/utils/logger';

// Create a wrapper component that handles SSR without dynamic imports
interface MapComponentProps {
  mapColorScheme: 'Light' | 'Dark';
  onPolygonCreate: (polygon: PolygonFilter) => void;
  onPolygonDelete: (deletedIds: string[]) => void;
  onPolygonUpdate: (updatedPolygon: PolygonFilter) => void;
}

const MapComponent = React.forwardRef<any, MapComponentProps>((props, ref) => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading map...</div>;
  }

  return <MapComponentBase {...props} ref={ref} />;
});

MapComponent.displayName = 'MapComponent';

// Polygon management types
interface PolygonFilter {
  id: string;
  geometry: GeoJSON.Polygon;
  name?: string;
  metadata?: any;
  createdAt: Date;
  area?: number;
}

function CatalogPageBase() {
  const [selectedId, setSelectedId] = useState("seg-1");

  // Analysis panel state management
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisQueryType, setAnalysisQueryType] = useState<string>('');
  // Removed amplifyClient - using REST API instead
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<any>({ id: "default" });

  const [isLoadingMapData, setIsLoadingMapData] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Polygon management state
  const [polygons, setPolygons] = useState<PolygonFilter[]>([]);
  const [activePolygon, setActivePolygon] = useState<PolygonFilter | null>(null);

  // Map state persistence for panel switching
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
    bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null;
    wellData: any;
    hasSearchResults: boolean;
    weatherLayers?: string[];
  }>({
    center: [106.9, 10.2],
    zoom: 5,
    bounds: null,
    wellData: null,
    hasSearchResults: false,
    weatherLayers: []
  });

  // Weather layer controls state
  const [availableWeatherLayers, setAvailableWeatherLayers] = useState<string[]>([]);

  // OSDU Search Context interfaces for conversational filtering
  interface OSDURecord {
    id: string;
    name: string;
    type: string;
    operator?: string;
    location?: string;
    basin?: string;
    country?: string;
    depth?: string;
    logType?: string;
    status?: string;
    dataSource: string;
    latitude?: number | null;
    longitude?: number | null;
  }

  interface FilterCriteria {
    type: 'operator' | 'location' | 'depth' | 'type' | 'status';
    value: string | number;
    operator?: '>' | '<' | '=' | 'contains';
  }

  interface OSDUSearchContext {
    query: string;                    // Original search query
    timestamp: Date;                  // When search was performed
    recordCount: number;              // Total records from API
    records: OSDURecord[];            // Full record array
    filteredRecords?: OSDURecord[];   // Currently filtered records
    activeFilters?: FilterCriteria[]; // Applied filters
  }

  // OSDU context state for filtering and follow-up queries
  const [osduContext, setOsduContext] = useState<OSDUSearchContext | null>(null);
  const [activeWeatherLayers, setActiveWeatherLayers] = useState<{ [key: string]: boolean }>({});
  const [showWeatherControls, setShowWeatherControls] = useState<boolean>(true);

  // Collection creation state (Phase 2 feature)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [selectedDataItems, setSelectedDataItems] = useState<any[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);

  // Query builder state (Task 7.1)
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);

  // Query builder toggle handler
  const handleOpenQueryBuilder = useCallback(() => {
    logger.debug('Opening query builder');
    setShowQueryBuilder(true);
  }, []);

  const handleCloseQueryBuilder = useCallback(() => {
    logger.debug('Closing query builder');
    setShowQueryBuilder(false);
  }, []);

  // Table selection state for bulk operations in collection modal
  const [tableSelection, setTableSelection] = useState<any[]>([]);

  // Feature flag context
  const userContext = { userId: 'current-user' }; // In production, get from auth
  const collectionsEnabled = isCollectionsEnabled(userContext);
  const creationEnabled = isCollectionCreationEnabled(userContext);

  // Chain of thought auto-scroll state
  const [chainOfThoughtAutoScroll, setChainOfThoughtAutoScroll] = useState<boolean>(true);
  const [chainOfThoughtMessageCount, setChainOfThoughtMessageCount] = useState<number>(0);
  const chainOfThoughtContainerRef = React.useRef<HTMLDivElement>(null);
  const chainOfThoughtEndRef = React.useRef<HTMLDivElement>(null);
  const chainOfThoughtScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const drawerVariant = "temporary";
  const mapComponentRef = React.useRef<any>(null);

  // Auto-scroll functionality for chain of thought
  const scrollChainOfThoughtToBottom = React.useCallback(() => {
    if (chainOfThoughtAutoScroll) {
      logger.debug('Chain of Thought: Attempting auto-scroll...');

      if (chainOfThoughtContainerRef.current) {
        logger.debug('Chain of Thought: Using scrollTop to max height');
        try {
          const container = chainOfThoughtContainerRef.current;
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
            logger.debug(`Chain of Thought: Scrolled to ${container.scrollTop}/${container.scrollHeight}`);
          });
        } catch (error) {
          logger.error('❌ Chain of Thought: Container scroll failed:', error);
        }
      }
    } else {
      logger.debug('Chain of Thought: Auto-scroll disabled');
    }
  }, [chainOfThoughtAutoScroll]);

  // Handle scroll events to detect user interrupt
  const handleChainOfThoughtScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;

    if (!isAtBottom && chainOfThoughtAutoScroll) {
      logger.debug('Chain of Thought: User scrolled up, disabling auto-scroll');
      setChainOfThoughtAutoScroll(false);
    }
  }, [chainOfThoughtAutoScroll]);

  // Monitor messages for chain of thought steps to trigger auto-scroll - ONLY when on chain of thought panel
  React.useEffect(() => {
    // Only auto-scroll when on the chain of thought panel (seg-3)
    if (selectedId !== "seg-3") {
      return;
    }

    let totalThoughtSteps = 0;

    try {
      const thoughtStepsFromMessages = messages
        .filter(message => message.role === 'ai' && (message as any).thoughtSteps)
        .flatMap(message => {
          const steps = (message as any).thoughtSteps || [];
          logger.debug('Chain of thought: Found message with', steps.length, 'steps');

          const parsedSteps = Array.isArray(steps) ? steps.map(step => {
            if (typeof step === 'string') {
              try {
                return JSON.parse(step);
              } catch (e) {
                logger.error('❌ Failed to parse step JSON:', step);
                return null;
              }
            }
            return step;
          }) : [];

          return parsedSteps.filter(Boolean);
        })
        .filter(step => step && typeof step === 'object');

      totalThoughtSteps = thoughtStepsFromMessages.length;
      logger.debug('Chain of thought: Total steps found:', totalThoughtSteps, 'Previous count:', chainOfThoughtMessageCount);
    } catch (error) {
      logger.error('❌ Error counting thought steps:', error);
      totalThoughtSteps = 0;
    }

    // Only auto-scroll when on chain of thought panel AND auto-scroll is enabled
    if (totalThoughtSteps > chainOfThoughtMessageCount && chainOfThoughtAutoScroll && selectedId === "seg-3") {
      logger.debug('Chain of thought: New steps detected, scrolling to bottom');

      if (chainOfThoughtScrollTimeoutRef.current) {
        clearTimeout(chainOfThoughtScrollTimeoutRef.current);
      }

      chainOfThoughtScrollTimeoutRef.current = setTimeout(() => {
        scrollChainOfThoughtToBottom();
      }, 300); // Increased delay to reduce aggressiveness
    }

    setChainOfThoughtMessageCount(totalThoughtSteps);
  }, [messages, chainOfThoughtMessageCount, chainOfThoughtAutoScroll, scrollChainOfThoughtToBottom, selectedId]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (chainOfThoughtScrollTimeoutRef.current) {
        clearTimeout(chainOfThoughtScrollTimeoutRef.current);
      }
    };
  }, []);

  // Map state restoration when switching back to map panel
  React.useEffect(() => {
    // Panel switch logging removed for performance

    // When switching to map panel (seg-1) and we have saved search results
    if (selectedId === "seg-1" && mapState.hasSearchResults && mapState.wellData) {
      logger.info('Map restoration conditions met, starting restoration...');

      // Multiple attempts to restore map state
      let attempts = 0;
      const maxAttempts = 10;

      const checkAndRestore = () => {
        attempts++;
        logger.debug(`Map restoration attempt ${attempts}/${maxAttempts}`);

        if (mapComponentRef.current) {
          logger.info('MapRef available, restoring map state');
          logger.debug('Restoring map with:', {
            wellCount: mapState.wellData?.features?.length || 0,
            bounds: mapState.bounds,
            hasUpdateMapData: typeof mapComponentRef.current.updateMapData === 'function',
            hasFitBounds: typeof mapComponentRef.current.fitBounds === 'function'
          });

          try {
            // Clear map first to ensure clean state
            if (mapComponentRef.current.clearMap) {
              mapComponentRef.current.clearMap();
            }
            
            // Restore well data first
            if (mapState.wellData && mapComponentRef.current.updateMapData) {
              logger.info('🔍 DEBUG: Restoring map with wellData:', {
                featureCount: mapState.wellData.features?.length || 0,
                firstFeature: mapState.wellData.features?.[0],
                allFeatureNames: mapState.wellData.features?.slice(0, 5).map((f: any) => f.properties?.name)
              });
              mapComponentRef.current.updateMapData(mapState.wellData);

              // Then restore bounds with longer delay
              if (mapState.bounds && mapComponentRef.current.fitBounds) {
                setTimeout(() => {
                  logger.debug('Calling fitBounds after delay...');
                  mapComponentRef.current.fitBounds(mapState.bounds);
                  logger.info('Map state restoration complete');
                }, 1000);
              }
            }
          } catch (error) {
            logger.error('❌ Error in map restoration attempt', attempts, ':', error);
          }
        } else if (attempts < maxAttempts) {
          logger.debug(`MapRef not available yet, retrying in ${200 * attempts}ms... (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkAndRestore, 200 * attempts); // Exponential backoff
        } else {
          logger.error('❌ Max attempts reached, map restoration failed');
        }
      };

      // Start restoration
      const restoreTimeout = setTimeout(checkAndRestore, 300);

      return () => clearTimeout(restoreTimeout);
    } else {
      // Map restoration condition logging removed for performance
    }
  }, [selectedId, mapState]);

  const mapColorScheme = theme.palette.mode === 'dark' ? "Dark" : "Light";

  const handleCreateNewChat = async () => {
    try {
      logger.info('RESET: Clearing all catalog state...');

      // Reset all message and chat state
      setMessages([]);
      setChainOfThoughtMessageCount(0);
      setChainOfThoughtAutoScroll(true);

      // Clear all analysis data and query context
      setAnalysisData(null);
      setAnalysisQueryType('');

      // Reset map state completely
      setMapState({
        center: [106.9, 10.2],
        zoom: 5,
        bounds: null,
        wellData: null,
        hasSearchResults: false,
        weatherLayers: []
      });

      // Clear polygon filters
      setPolygons([]);
      setActivePolygon(null);

      // Reset weather layer states
      setAvailableWeatherLayers([]);
      setActiveWeatherLayers({});
      setShowWeatherControls(true);

      // Clear collection creation state
      setShowCreateCollectionModal(false);
      setCollectionName('');
      setCollectionDescription('');
      setSelectedDataItems([]);
      setCreatingCollection(false);

      // Clear map if available
      if (mapComponentRef.current && mapComponentRef.current.clearMap) {
        logger.info('RESET: Clearing map data...');
        mapComponentRef.current.clearMap();
      }

      // Clear any loading states
      setIsLoadingMapData(false);
      setError(null);

      logger.info('RESET: All catalog state cleared successfully');

    } catch (error) {
      logger.error("❌ RESET: Error resetting catalog:", error);
      alert("Failed to reset catalog. Please refresh the page.");
    }
  }

  // Handler to remove selected items from collection
  const handleRemoveSelectedFromCollection = useCallback(() => {
    if (!tableSelection || tableSelection.length === 0) return;

    logger.info('Removing selected items from collection:', tableSelection.length);

    // Remove selected items from the data items list
    const updatedItems = selectedDataItems.filter(item =>
      !tableSelection.some(selected => selected.id === item.id)
    );

    setSelectedDataItems(updatedItems);
    setTableSelection([]); // Clear selection

    logger.info('Items removed:', {
      original: selectedDataItems.length,
      removed: tableSelection.length,
      remaining: updatedItems.length
    });
  }, [tableSelection, selectedDataItems]);

  // Initialize table selection when modal opens
  React.useEffect(() => {
    if (showCreateCollectionModal && selectedDataItems.length > 0) {
      // Initially select all items (user can uncheck what they don't want)
      setTableSelection(selectedDataItems);
      logger.info('Collection modal opened, selecting all items:', selectedDataItems.length);
    } else if (!showCreateCollectionModal) {
      // Clear selection when modal closes
      setTableSelection([]);
    }
  }, [showCreateCollectionModal, selectedDataItems]);

  // Collection creation handler (Phase 2 Advanced Feature)
  const handleCreateCollection = async () => {
    if (!collectionName.trim() || selectedDataItems.length === 0 || !creationEnabled) return;

    // Use the final selected items (after any removals)
    const finalDataItems = tableSelection.length > 0 ? tableSelection : selectedDataItems;

    try {
      setCreatingCollection(true);

      // Count OSDU vs catalog data in collection
      const osduItems = finalDataItems.filter(item => item.dataSource === 'OSDU');
      const catalogItems = finalDataItems.filter(item => item.dataSource !== 'OSDU');

      logger.info('Creating collection with final selection:', {
        originalItems: selectedDataItems.length,
        finalItems: finalDataItems.length,
        removed: selectedDataItems.length - finalDataItems.length,
        osduCount: osduItems.length,
        catalogCount: catalogItems.length,
        dataSources: osduItems.length > 0 && catalogItems.length > 0 ? 'Mixed (OSDU + Catalog)' :
          osduItems.length > 0 ? 'OSDU Only' : 'Catalog Only'
      });

      // Debug: Log the exact input fields
      logger.info('Debug collection creation inputs:', {
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        dataSourceType: 'Mixed',
        finalDataItemsLength: finalDataItems.length,
        finalDataItemsSample: finalDataItems.slice(0, 1)
      });

      // Try minimal metadata first to isolate the issue
      const minimalMetadata = {
        wellCount: finalDataItems.length,
        createdFrom: 'catalog_search'
      };

      // Test minimal serialization
      let metadataString;
      try {
        metadataString = JSON.stringify(minimalMetadata);
        logger.info('Minimal metadata serialization successful:', metadataString);
      } catch (serializeError) {
        logger.error('❌ Even minimal serialization failed:', serializeError);
        // Fallback to simplest possible string
        metadataString = `{"wellCount":${finalDataItems.length},"createdFrom":"catalog_search"}`;
      }

      // Prepare data items for storage - convert to format suitable for collection
      const dataItemsForStorage = finalDataItems.map((item, index) => ({
        id: item.id || `item-${index}`,
        name: item.name,
        type: item.type || 'well',
        location: item.location,
        depth: item.depth,
        operator: item.operator,
        coordinates: item.coordinates,
        // OSDU-specific fields
        dataSource: item.dataSource || 'catalog',
        osduId: item.osduId, // Preserve OSDU record ID
        // Store original OSDU data for reference (without circular refs)
        osduMetadata: item.dataSource === 'OSDU' ? {
          basin: item.basin,
          country: item.country,
          logType: item.logType,
          recordType: item.type
        } : undefined
      }));

      logger.info('Prepared data items for storage:', {
        totalItems: dataItemsForStorage.length,
        osduItems: dataItemsForStorage.filter(i => i.dataSource === 'OSDU').length,
        catalogItems: dataItemsForStorage.filter(i => i.dataSource !== 'OSDU').length,
        sampleItem: dataItemsForStorage[0]
      });

      // Debug: Test all mutation parameters individually
      const mutationParams = {
        operation: 'createCollection',
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        dataSourceType: osduItems.length > 0 && catalogItems.length > 0 ? 'Mixed' :
          osduItems.length > 0 ? 'OSDU' : 'Catalog',
        previewMetadata: metadataString,
        dataItems: dataItemsForStorage // Include actual data items with OSDU metadata
      };

      logger.info('Testing mutation parameters:');
      logger.info('  operation:', typeof mutationParams.operation, mutationParams.operation);
      logger.info('  name:', typeof mutationParams.name, mutationParams.name);
      logger.info('  description:', typeof mutationParams.description, mutationParams.description);
      logger.info('  dataSourceType:', typeof mutationParams.dataSourceType, mutationParams.dataSourceType);
      logger.info('  previewMetadata:', typeof mutationParams.previewMetadata, metadataString.length, 'chars');
      logger.info('  dataItems:', typeof mutationParams.dataItems, mutationParams.dataItems.length, 'items');

      // Create collection through REST API
      logger.info('Calling createCollection API...');
      const result = await createCollection(mutationParams);
      logger.info('API response received:', result);

      if (result) {
        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

        if (parsedResult.success) {
          // Extract collection ID from response
          const collectionId = parsedResult.collectionId || parsedResult.id;

          logger.info('Collection created successfully:', {
            collectionId,
            name: collectionName,
            wellCount: finalDataItems.length
          });

          // Build data source summary for success message
          const dataSourceSummary = osduItems.length > 0 && catalogItems.length > 0
            ? `${catalogItems.length} catalog wells + ${osduItems.length} OSDU records`
            : osduItems.length > 0
              ? `${osduItems.length} OSDU records`
              : `${catalogItems.length} catalog wells`;

          // Show success message with final count and data sources
          const successMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `✅ **Collection Created Successfully!**\n\nCreated collection **"${collectionName}"** with ${finalDataItems.length} items (${dataSourceSummary}).\n\n📁 **Collection Features:**\n- Preserved exact search context and map state\n- Geographic bounds and analytics configuration saved\n- ${osduItems.length > 0 ? 'OSDU data source attribution maintained\n- ' : ''}Navigating to collection detail page...\n\n🚀 **Next Steps:**\n- Create new workspace canvases linked to this collection\n- Restore this exact data context anytime\n- Share collection with team members (coming soon)`
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          setMessages(prevMessages => [...prevMessages, successMessage]);
          setShowCreateCollectionModal(false);
          setCollectionName('');
          setCollectionDescription('');
          setSelectedDataItems([]);
          setTableSelection([]);

          // Navigate to collection detail page
          if (collectionId) {
            logger.info('Navigating to collection detail page:', `/collections/${collectionId}`);
            // Use window.location for navigation to ensure proper page load
            window.location.href = `/collections/${collectionId}`;
          } else {
            logger.warn('⚠️ No collection ID in response, navigating to collections list');
            window.location.href = '/collections';
          }
        } else {
          logger.error('Collection creation failed:', parsedResult.error);
          alert('Failed to create collection: ' + parsedResult.error);
        }
      }
    } catch (error) {
      logger.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  // Query Builder Execution Handler (Task 6.2)
  const handleQueryBuilderExecution = useCallback(async (query: string, criteria: QueryCriterion[]) => {
    logger.debug('Query Builder: Executing structured query', {
      query,
      criteriaCount: criteria.length
    });

    setIsLoadingMapData(true);
    setShowQueryBuilder(false); // Close query builder

    // Add user message showing the query
    const userMessage: Message = {
      id: uuidv4() as any,
      role: "human" as any,
      content: {
        text: `**Query Builder Search:**\n\`\`\`\n${query}\n\`\`\``
      } as any,
      responseComplete: true as any,
      createdAt: new Date().toISOString() as any,
      chatSessionId: '' as any,
      owner: '' as any
    } as any;

    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Determine data type from criteria (use first criterion's field to infer type)
      let dataType = 'well'; // default
      if (criteria.length > 0) {
        const firstField = criteria[0].field;
        if (firstField.includes('wellbore')) dataType = 'wellbore';
        else if (firstField.includes('log')) dataType = 'log';
        else if (firstField.includes('seismic') || firstField.includes('survey')) dataType = 'seismic';
      }

      // Execute query directly against OSDU API (bypasses AI agent)
      // Pass analytics parameters for tracking
      // Request up to 1000 records to ensure we get the full result set
      const result = await executeOSDUQuery(
        query,
        'osdu',
        1000,
        dataType,
        criteria.length,
        undefined // templateUsed - would need to be passed from query builder
      );

      logger.info('Query Builder: Query executed', {
        success: result.success,
        recordCount: result.recordCount,
        executionTime: `${result.executionTime.toFixed(2)}ms`
      });

      if (!result.success) {
        // Display error message
        const errorMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: `⚠️ **Query Execution Failed**\n\n${result.error || 'Unknown error'}\n\nPlease check your query criteria and try again.`
          } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsLoadingMapData(false);
        return;
      }

      // Convert OSDU records to well data format
      const wellData = convertOSDUToWellData(result.records);

      // Save OSDU results to context for filtering
      setOsduContext({
        query,
        timestamp: new Date(),
        recordCount: wellData.length,
        records: wellData,
        filteredRecords: undefined,
        activeFilters: []
      });

      // Format OSDU response data for OSDUSearchResponse component
      const osduResponseData = {
        answer: result.answer,
        recordCount: result.recordCount,
        records: wellData,
        query,
        executionTime: result.executionTime,
        queryBuilder: true // Flag to indicate this came from query builder
      };

      // Use osdu-search-response format for existing OSDUSearchResponse component
      const messageText = `\`\`\`osdu-search-response\n${JSON.stringify(osduResponseData, null, 2)}\n\`\`\``;

      // Create AI message with results
      const resultMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: { text: messageText } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      } as any;

      setMessages(prevMessages => [...prevMessages, resultMessage]);

      // Update map with results
      const wellsWithCoords = wellData.filter(w => w.latitude && w.longitude);
      if (wellsWithCoords.length > 0) {
        const osduGeoJSON = {
          type: "FeatureCollection" as const,
          features: wellsWithCoords.map((well, index) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [well.longitude!, well.latitude!]
            },
            properties: {
              name: well.name,
              type: well.type,
              operator: well.operator,
              location: well.location,
              depth: well.depth,
              status: well.status,
              dataSource: 'OSDU',
              category: 'osdu',
              id: well.id || `osdu-${index}`
            }
          }))
        };

        setMapState(prev => ({
          ...prev,
          wellData: osduGeoJSON,
          hasSearchResults: true
        }));

        if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
          mapComponentRef.current.updateMapData(osduGeoJSON);
        }
      }

      // Add to analysis data for visualization panel
      if (wellData.length > 0) {
        setAnalysisData(wellData);
        setAnalysisQueryType('osdu-query-builder');
      }

    } catch (error) {
      logger.error('❌ Query Builder: Execution failed', error);

      const errorMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: `⚠️ **Query Execution Failed**\n\nAn unexpected error occurred: ${error instanceof Error ? error.message : String(error)}\n\nPlease try again or contact support if the issue persists.`
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      } as any;

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoadingMapData(false);
    }
  }, [selectedId, setMessages, setOsduContext, setMapState, setAnalysisData, setAnalysisQueryType]);

  // Intent detection function for routing queries
  const detectSearchIntent = useCallback((query: string): 'osdu' | 'catalog' => {
    const lowerQuery = query.toLowerCase().trim();

    // OSDU intent detection - check for "OSDU" keyword
    if (lowerQuery.includes('osdu')) {
      logger.info('🔍 OSDU search intent detected');
      return 'osdu';
    }

    // Default to catalog search
    logger.info('🔍 Catalog search intent detected');
    return 'catalog';
  }, []);

  // Client-side filtering function for OSDU results
  const filterOSDURecords = useCallback((records: any[], query: string) => {
    const lowerQuery = query.toLowerCase();
    logger.debug('Filtering', records.length, 'OSDU records with query:', query);

    // Extract filter criteria from query
    const filters: any = {};

    // Operator filter
    if (lowerQuery.includes('operator')) {
      const operatorMatch = lowerQuery.match(/operator[:\s]+([a-z0-9\s]+)/i);
      if (operatorMatch) filters.operator = operatorMatch[1].trim();
    }

    // Depth filter
    if (lowerQuery.match(/depth.*>|greater.*than|deeper.*than/)) {
      const depthMatch = lowerQuery.match(/(\d+)\s*(m|meter|ft|feet)?/);
      if (depthMatch) filters.minDepth = parseInt(depthMatch[1]);
    }

    // Location filter
    if (lowerQuery.includes('block') || lowerQuery.includes('field')) {
      const locationMatch = lowerQuery.match(/block\s+([a-z0-9\-]+)|field\s+([a-z0-9\s]+)/i);
      if (locationMatch) filters.location = (locationMatch[1] || locationMatch[2] || '').trim();
    }

    // Type filter
    if (lowerQuery.includes('production')) filters.type = 'production';
    if (lowerQuery.includes('exploration')) filters.type = 'exploration';

    // Status filter
    if (lowerQuery.includes('active')) filters.status = 'active';

    logger.debug('Extracted filters:', filters);

    // Apply filters
    let filtered = records;

    if (filters.operator) {
      filtered = filtered.filter(r =>
        r.operator?.toLowerCase().includes(filters.operator.toLowerCase())
      );
    }

    if (filters.minDepth) {
      filtered = filtered.filter(r => {
        const depthStr = r.depth?.toString() || '';
        const depthNum = parseInt(depthStr.replace(/[^\d]/g, ''));
        return !isNaN(depthNum) && depthNum > filters.minDepth;
      });
    }

    if (filters.location) {
      filtered = filtered.filter(r =>
        r.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(r =>
        r.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(r =>
        r.status?.toLowerCase().includes(filters.status.toLowerCase())
      );
    }

    logger.info('Filtered from', records.length, 'to', filtered.length, 'records');
    return { filtered, filters };
  }, []);

  // Filter intent detection function for conversational filtering
  const detectFilterIntent = useCallback((query: string, hasOsduContext: boolean): {
    isFilter: boolean;
    filterType?: string;
    filterValue?: string;
    filterOperator?: string;
  } => {
    const lowerQuery = query.toLowerCase().trim();

    // Only detect filter intent if OSDU context exists
    if (!hasOsduContext) {
      // Filter intent logging removed for performance
      return { isFilter: false };
    }

    // Filter keywords
    const filterKeywords = [
      'filter', 'show only', 'where', 'with',
      'operator', 'location', 'depth', 'type', 'status',
      'greater than', 'less than', 'equals'
    ];

    const hasFilterKeyword = filterKeywords.some(kw => lowerQuery.includes(kw));

    if (!hasFilterKeyword) {
      logger.debug('Filter intent: No filter keywords found');
      return { isFilter: false };
    }

    // Parse filter type and value
    let filterType: string | undefined;
    let filterValue: string | undefined;
    let filterOperator: string = 'contains';

    // Operator filter
    if (lowerQuery.includes('operator')) {
      filterType = 'operator';
      const match = lowerQuery.match(/operator\s+(?:is\s+)?([a-z0-9\s]+)/i);
      if (match) filterValue = match[1].trim();
    }

    // Location filter
    else if (lowerQuery.includes('location') || lowerQuery.includes('country')) {
      filterType = 'location';
      const match = lowerQuery.match(/(?:location|country)\s+(?:is\s+)?([a-z0-9\s]+)/i);
      if (match) filterValue = match[1].trim();
    }

    // Depth filter
    else if (lowerQuery.includes('depth')) {
      filterType = 'depth';

      // Greater than
      if (lowerQuery.includes('greater than') || lowerQuery.includes('>')) {
        filterOperator = '>';
        const match = lowerQuery.match(/(?:greater than|>)\s*(\d+)/);
        if (match) filterValue = match[1];
      }
      // Less than
      else if (lowerQuery.includes('less than') || lowerQuery.includes('<')) {
        filterOperator = '<';
        const match = lowerQuery.match(/(?:less than|<)\s*(\d+)/);
        if (match) filterValue = match[1];
      }
      // Equals
      else {
        filterOperator = '=';
        const match = lowerQuery.match(/depth\s+(?:is\s+)?(\d+)/);
        if (match) filterValue = match[1];
      }
    }

    // Type filter
    else if (lowerQuery.includes('type')) {
      filterType = 'type';
      const match = lowerQuery.match(/type\s+(?:is\s+)?([a-z0-9\s]+)/i);
      if (match) filterValue = match[1].trim();
    }

    // Status filter
    else if (lowerQuery.includes('status')) {
      filterType = 'status';
      const match = lowerQuery.match(/status\s+(?:is\s+)?([a-z0-9\s]+)/i);
      if (match) filterValue = match[1].trim();
    }

    logger.debug('Filter intent detected:', { filterType, filterValue, filterOperator });

    return {
      isFilter: true,
      filterType,
      filterValue,
      filterOperator
    };
  }, []);

  // Client-side filter application function for OSDU results
  const applyOsduFilter = useCallback((
    records: OSDURecord[],
    filterType: string,
    filterValue: string,
    filterOperator: string = 'contains'
  ): OSDURecord[] => {
    logger.debug('Applying filter:', { filterType, filterValue, filterOperator, recordCount: records.length });

    const filtered = records.filter(record => {
      switch (filterType) {
        case 'operator':
          // Case-insensitive operator matching
          return record.operator?.toLowerCase().includes(filterValue.toLowerCase());

        case 'location':
          // Case-insensitive location/country matching
          return (
            record.location?.toLowerCase().includes(filterValue.toLowerCase()) ||
            record.country?.toLowerCase().includes(filterValue.toLowerCase())
          );

        case 'depth':
          // Numeric depth filtering with operators
          if (!record.depth) return false;

          // Extract numeric value from depth string (e.g., "3500m" -> 3500)
          const depthValue = parseFloat(record.depth.replace(/[^\d.]/g, ''));
          const targetDepth = parseFloat(filterValue);

          if (isNaN(depthValue) || isNaN(targetDepth)) return false;

          switch (filterOperator) {
            case '>':
              return depthValue > targetDepth;
            case '<':
              return depthValue < targetDepth;
            case '=':
              // Within 100 units tolerance for equality
              return Math.abs(depthValue - targetDepth) < 100;
            default:
              return false;
          }

        case 'type':
          // Case-insensitive type matching
          return record.type?.toLowerCase().includes(filterValue.toLowerCase());

        case 'status':
          // Case-insensitive status matching
          return record.status?.toLowerCase().includes(filterValue.toLowerCase());

        default:
          // Unknown filter type - return true to include record
          logger.warn('⚠️ Unknown filter type:', filterType);
          return true;
      }
    });

    logger.info('Filter applied:', {
      originalCount: records.length,
      filteredCount: filtered.length,
      filterType,
      filterValue,
      filterOperator
    });

    return filtered;
  }, []);

  // Function to handle catalog search with enhanced context management
  const handleChatSearch = useCallback(async (prompt: string) => {
    setIsLoadingMapData(true);
    setError(null);

    try {
      logger.info('PROCESSING CATALOG SEARCH:', prompt);

      // TASK 11: Check for filter intent WITHOUT OSDU context - show error
      const filterIntent = detectFilterIntent(prompt, !!osduContext);

      if (filterIntent.isFilter && !osduContext) {
        logger.debug('Filter intent detected but no OSDU context available');

        // Display error message if filter attempted without OSDU context
        const noContextMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: `⚠️ **No OSDU Results to Filter**\n\nI detected that you want to filter data, but there are no OSDU search results available to filter.\n\n**To use filtering:**\n1. First perform an OSDU search\n2. Then apply filters to refine those results\n\n**Example OSDU search queries:**\n- "show me osdu wells"\n- "search osdu for production wells"\n- "find osdu wells in Norway"\n- "osdu exploration wells"\n\n**After getting OSDU results, you can filter them:**\n- "filter by operator Shell"\n- "show only depth > 3000m"\n- "where location is Gulf of Mexico"\n\n💡 **Tip:** OSDU searches require the keyword "osdu" in your query to access external data sources.`
          } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        setMessages(prevMessages => [...prevMessages, noContextMessage]);
        setIsLoadingMapData(false);

        logger.debug('No context error message displayed');
        return; // Early return to prevent further processing
      }

      // TASK 5: Check for filter intent FIRST when OSDU context exists
      if (osduContext && filterIntent.isFilter) {
        logger.debug('OSDU context exists, checking for filter intent...');

        // TASK 12: Check if filter type and value were successfully parsed
        if (!filterIntent.filterType || !filterIntent.filterValue) {
          logger.error('❌ Filter parsing failed:', { filterIntent, query: prompt });

          // Display error message if filter parsing failed
          const parsingErrorMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `⚠️ **Could Not Parse Filter**\n\nI detected that you want to filter data, but I couldn't understand your filter criteria.\n\n**What I received:** "${prompt}"\n\n**Common filter patterns:**\n\n**🏢 By Operator:**\n- "filter by operator Shell"\n- "show only operator BP"\n- "where operator is Chevron"\n\n**📍 By Location/Country:**\n- "filter by location Norway"\n- "show only country USA"\n- "where location is Gulf of Mexico"\n\n**📏 By Depth:**\n- "show wells with depth greater than 3000"\n- "filter depth > 5000"\n- "where depth < 2000"\n- "depth equals 4500"\n\n**🔧 By Type:**\n- "filter by type production"\n- "show only type exploration"\n- "where type is development"\n\n**📊 By Status:**\n- "filter by status active"\n- "show only status producing"\n- "where status is completed"\n\n💡 **Tip:** Make sure to include both the filter type (operator, location, depth, type, or status) and the value you want to filter by.\n\n**Current Context:**\n- Total OSDU records: ${osduContext.recordCount}\n- Currently showing: ${osduContext.filteredRecords?.length || osduContext.recordCount} records\n\nTry rephrasing your filter using one of the patterns above, or type "help" to see more examples.`
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          setMessages(prevMessages => [...prevMessages, parsingErrorMessage]);
          setIsLoadingMapData(false);

          logger.debug('Filter parsing error message displayed');
          return; // Early return to prevent further processing
        }

        if (filterIntent.filterType && filterIntent.filterValue) {
          logger.info('Filter intent detected, applying filter:', filterIntent);

          // Apply filter to existing results (or already-filtered results)
          const baseRecords = osduContext.filteredRecords || osduContext.records;
          const filteredRecords = applyOsduFilter(
            baseRecords,
            filterIntent.filterType,
            filterIntent.filterValue,
            filterIntent.filterOperator
          );

          // Update context with filtered results and new filter criteria
          const newFilter: FilterCriteria = {
            type: filterIntent.filterType as any,
            value: filterIntent.filterValue,
            operator: filterIntent.filterOperator as any
          };

          setOsduContext({
            ...osduContext,
            filteredRecords,
            activeFilters: [...(osduContext.activeFilters || []), newFilter]
          });

          // TASK 6: Create filter result display with enhanced formatting
          // Build filter description with proper formatting
          const filterOperatorDisplay = filterIntent.filterOperator === 'contains'
            ? 'containing'
            : filterIntent.filterOperator === '>'
              ? 'greater than'
              : filterIntent.filterOperator === '<'
                ? 'less than'
                : filterIntent.filterOperator === '='
                  ? 'equal to'
                  : filterIntent.filterOperator;

          const filterDescription = `${filterIntent.filterType} ${filterOperatorDisplay} "${filterIntent.filterValue}"`;

          // Build cumulative filter description if multiple filters applied
          const allFilters = [...(osduContext.activeFilters || []), newFilter];
          const filterSummary = allFilters.length > 1
            ? `Applied ${allFilters.length} filters: ${allFilters.map(f => {
              const op = f.operator === 'contains' ? 'containing' : f.operator === '>' ? '>' : f.operator === '<' ? '<' : f.operator === '=' ? '=' : f.operator;
              return `${f.type} ${op} "${f.value}"`;
            }).join(', ')}`
            : `Applied filter: ${filterDescription}`;

          // Create enhanced answer text with filter context
          const answerText = filteredRecords.length > 0
            ? `🔍 **Filtered OSDU Results**\n\n${filterSummary}\n\n**Results:** Found ${filteredRecords.length} of ${osduContext.recordCount} records matching your criteria.\n\n💡 **Tip:** You can apply additional filters or use "show all" to reset.`
            : `🔍 **No Results Found**\n\n${filterSummary}\n\n**No records match your filter criteria.**\n\n**Suggestions:**\n- Try a different ${filterIntent.filterType} value\n- Use "show all" to see all ${osduContext.recordCount} original results\n- Refine your filter criteria`;

          // Format OSDU response data for OSDUSearchResponse component
          const osduResponseData = {
            answer: answerText,
            recordCount: filteredRecords.length,
            records: filteredRecords,
            query: prompt,
            // Include filter metadata for component display
            filterApplied: true,
            filterDescription: filterDescription,
            originalRecordCount: osduContext.recordCount,
            activeFilters: allFilters
          };

          // Use osdu-search-response format for existing OSDUSearchResponse component
          const messageText = `\`\`\`osdu-search-response\n${JSON.stringify(osduResponseData, null, 2)}\n\`\`\``;

          // Create AI message with filtered results
          const filteredMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: { text: messageText } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          // Add message to chat
          setMessages(prevMessages => [...prevMessages, filteredMessage]);

          logger.debug('Filter result message created:', {
            filterDescription,
            filteredCount: filteredRecords.length,
            originalCount: osduContext.recordCount,
            totalFilters: allFilters.length
          });

          // Update map with filtered results
          const filteredWithCoords = filteredRecords.filter(w => w.latitude && w.longitude);
          if (filteredWithCoords.length > 0) {
            const osduGeoJSON = {
              type: "FeatureCollection" as const,
              features: filteredWithCoords.map((well, index) => ({
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [well.longitude!, well.latitude!]
                },
                properties: {
                  name: well.name,
                  type: well.type,
                  operator: well.operator,
                  location: well.location,
                  depth: well.depth,
                  status: well.status,
                  dataSource: 'OSDU',
                  category: 'osdu',
                  id: well.id || `osdu-${index}`
                }
              }))
            };

            setMapState(prev => ({
              ...prev,
              wellData: osduGeoJSON,
              hasSearchResults: true
            }));

            if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
              mapComponentRef.current.updateMapData(osduGeoJSON);
            }
          }

          setIsLoadingMapData(false);
          return; // Early return after filter processing to prevent new search
        }

        // Filter intent logging removed for performance
      }

      // TASK 10: Check for filter help intent ("help" or "how to filter")
      if (osduContext && (prompt.toLowerCase().includes('help') || prompt.toLowerCase().includes('how to filter'))) {
        logger.info('Filter help requested, displaying comprehensive filter examples');

        // Create comprehensive filter help message with examples for all filter types
        const helpMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: `📖 **OSDU Filtering Help**\n\nYou can filter your OSDU results using natural language. Here are examples for each filter type:\n\n**🏢 By Operator:**\n- "filter by operator Shell"\n- "show only operator BP"\n- "where operator is Chevron"\n\n**📍 By Location/Country:**\n- "filter by location Norway"\n- "show only country USA"\n- "where location is Gulf of Mexico"\n\n**📏 By Depth:**\n- "show wells with depth greater than 3000"\n- "filter depth > 5000"\n- "where depth < 2000"\n- "depth equals 4500"\n\n**🔧 By Type:**\n- "filter by type production"\n- "show only type exploration"\n- "where type is development"\n\n**📊 By Status:**\n- "filter by status active"\n- "show only status producing"\n- "where status is completed"\n\n**🔄 Reset Filters:**\n- "show all" - Display all original results\n- "reset filters" - Clear all applied filters\n\n**💡 Tips:**\n- You can apply multiple filters in sequence to narrow down results\n- Filters are applied to your current result set\n- Use "show all" anytime to see the original unfiltered results\n\n**Current Context:**\n- Total OSDU records: ${osduContext.recordCount}\n- Active filters: ${osduContext.activeFilters?.length || 0}\n- Currently showing: ${osduContext.filteredRecords?.length || osduContext.recordCount} records`
          } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        // Add help message to chat
        setMessages(prevMessages => [...prevMessages, helpMessage]);

        logger.debug('Filter help message displayed');

        setIsLoadingMapData(false);
        return; // Early return after help display to prevent new search
      }

      // TASK 8: Check for filter reset intent ("show all" or "reset")
      if (osduContext && (prompt.toLowerCase().includes('show all') || prompt.toLowerCase().includes('reset'))) {
        logger.info('Filter reset detected, clearing filters and showing original results');

        // Clear filteredRecords and activeFilters from context
        setOsduContext({
          ...osduContext,
          filteredRecords: undefined,
          activeFilters: []
        });

        // Create message indicating filters were reset with original record count
        const resetAnswerText = `🔄 **Filters Reset**\n\nShowing all ${osduContext.recordCount} original results from your OSDU search.\n\n💡 **Tip:** You can apply new filters anytime by asking questions like "filter by operator Shell" or "show only depth > 3000m"`;

        // Format OSDU response data for OSDUSearchResponse component
        const osduResponseData = {
          answer: resetAnswerText,
          recordCount: osduContext.recordCount,
          records: osduContext.records,
          query: osduContext.query, // Use original query
          // Indicate filters were reset
          filterApplied: false,
          filtersReset: true
        };

        // Use osdu-search-response format for existing OSDUSearchResponse component
        const messageText = `\`\`\`osdu-search-response\n${JSON.stringify(osduResponseData, null, 2)}\n\`\`\``;

        // Create AI message with reset confirmation and original unfiltered results
        const resetMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: { text: messageText } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        // Add message to chat
        setMessages(prevMessages => [...prevMessages, resetMessage]);

        logger.debug('Filter reset message created:', {
          originalRecordCount: osduContext.recordCount,
          originalQuery: osduContext.query,
          filtersCleared: true
        });

        // Update map with original unfiltered results
        const originalWithCoords = osduContext.records.filter(w => w.latitude && w.longitude);
        if (originalWithCoords.length > 0) {
          const osduGeoJSON = {
            type: "FeatureCollection" as const,
            features: originalWithCoords.map((well, index) => ({
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: [well.longitude!, well.latitude!]
              },
              properties: {
                name: well.name,
                type: well.type,
                operator: well.operator,
                location: well.location,
                depth: well.depth,
                status: well.status,
                dataSource: 'OSDU',
                category: 'osdu',
                id: well.id || `osdu-${index}`
              }
            }))
          };

          setMapState(prev => ({
            ...prev,
            wellData: osduGeoJSON,
            hasSearchResults: true
          }));

          if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
            mapComponentRef.current.updateMapData(osduGeoJSON);
          }
        }

        setIsLoadingMapData(false);
        return; // Early return after reset processing to prevent new search
      }

      // Detect search intent (OSDU vs catalog) - only if not filtered above
      const searchIntent = detectSearchIntent(prompt);
      logger.info('Search intent:', searchIntent);

      // Handle OSDU search intent
      if (searchIntent === 'osdu') {
        logger.debug('Executing OSDU search');

        // Add loading message
        const loadingMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: `🔍 **Searching OSDU data...**\n\nQuerying external OSDU data sources for: *"${prompt}"*`
          } as any,
          responseComplete: false as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        setMessages(prevMessages => [...prevMessages, loadingMessage]);

        try {
          // Execute OSDU search via the osduQueryExecutor utility
          logger.info('🔍 Executing OSDU search via executeOSDUQuery');
          const osduResult = await executeOSDUQuery(
            prompt,
            'osdu',
            1000, // Request up to 1000 records
            'well', // Default data type
            0, // criteriaCount
            undefined // templateUsed
          );

          logger.info('✅ OSDU search result:', {
            success: osduResult.success,
            recordCount: osduResult.recordCount,
            executionTime: `${osduResult.executionTime.toFixed(2)}ms`
          });

          // Handle errors
          if (!osduResult.success) {
            logger.error('❌ OSDU search failed:', osduResult.error);
            throw new Error(osduResult.error || 'OSDU search failed');
          }

          if (!osduResult.records || osduResult.records.length === 0) {
            logger.warn('⚠️ No OSDU records returned');
            throw new Error('No OSDU records found for your query');
          }

          // Convert OSDU result records to well data format using the imported utility
          const osduWellData = convertOSDUToWellData(osduResult.records);

          logger.info('🔄 Converted OSDU records to well data:', {
            originalCount: osduResult.records.length,
            convertedCount: osduWellData.length,
            withCoordinates: osduWellData.filter(w => w.latitude && w.longitude).length
          });

          // Save OSDU results to context for filtering
          setOsduContext({
            query: prompt,
            timestamp: new Date(),
            recordCount: osduWellData.length,
            records: osduWellData,
            filteredRecords: undefined,
            activeFilters: []
          });

          logger.info('💾 Saved OSDU context:', osduWellData.length, 'records');

          // Build message text using the result from executeOSDUQuery
          const answer = osduResult.answer || `Found ${osduWellData.length} OSDU records. You can now filter these results by asking follow-up questions like "show only production wells" or "filter by depth > 3000m"`;
          const recordCount = osduResult.recordCount || osduWellData.length;

          // Use Cloudscape component format for OSDU responses
          const osduResponseData = {
            answer,
            recordCount,
            records: osduWellData,
            query: prompt,
            executionTime: osduResult.executionTime
          };

          // Format as special OSDU response marker for frontend component
          const messageText = `\`\`\`osdu-search-response\n${JSON.stringify(osduResponseData, null, 2)}\n\`\`\``;

          // Create OSDU results message
          const osduMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: messageText
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          // Add OSDU well data to analysis data for collection context
          if (osduWellData.length > 0) {
            logger.info('📊 Adding OSDU data to analysis context:', osduWellData.length, 'records');

            // Merge with existing analysis data if present
            setAnalysisData(prevData => {
              const merged = prevData ? [...prevData, ...osduWellData] : osduWellData;
              logger.info('✅ Analysis data updated:', {
                previousCount: prevData?.length || 0,
                osduCount: osduWellData.length,
                totalCount: merged.length
              });
              return merged;
            });

            // Update query type to indicate mixed data
            setAnalysisQueryType(prevType => {
              const newType = prevType ? `${prevType}+osdu` : 'osdu';
              logger.info('🏷️ Query type updated:', prevType, '→', newType);
              return newType;
            });

            // Update map with OSDU data if we have coordinates
            const osduWithCoords = osduWellData.filter(w => w.latitude && w.longitude);
            if (osduWithCoords.length > 0) {
              logger.info('🗺️ Updating map with OSDU locations:', osduWithCoords.length, 'points');

              // Convert OSDU well data to GeoJSON features for map display
              const osduGeoJSON = {
                type: "FeatureCollection" as const,
                features: osduWithCoords.map((well, index) => ({
                  type: "Feature" as const,
                  geometry: {
                    type: "Point" as const,
                    coordinates: [well.longitude!, well.latitude!]
                  },
                  properties: {
                    name: well.name,
                    type: well.type,
                    operator: well.operator,
                    location: well.location,
                    depth: well.depth,
                    status: well.status,
                    dataSource: 'OSDU',
                    category: 'osdu',
                    id: well.id || `osdu-${index}`
                  }
                }))
              };

              // Calculate bounds for OSDU data
              const lats = osduWithCoords.map(w => w.latitude).filter(Boolean) as number[];
              const lons = osduWithCoords.map(w => w.longitude).filter(Boolean) as number[];

              if (lats.length > 0 && lons.length > 0) {
                const bounds = {
                  minLat: Math.min(...lats),
                  maxLat: Math.max(...lats),
                  minLon: Math.min(...lons),
                  maxLon: Math.max(...lons)
                };

                // Calculate center
                const center: [number, number] = [
                  (bounds.minLon + bounds.maxLon) / 2,
                  (bounds.minLat + bounds.maxLat) / 2
                ];

                // Update map state with OSDU GeoJSON data
                setMapState(prevState => ({
                  ...prevState,
                  wellData: osduGeoJSON,
                  bounds: bounds,
                  center: center,
                  hasSearchResults: true
                }));

                // If on map panel, update map immediately
                if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
                  logger.info('🗺️ Immediately updating map with OSDU data');
                  mapComponentRef.current.updateMapData(osduGeoJSON);

                  // Fit bounds to show all OSDU wells
                  if (mapComponentRef.current.fitBounds) {
                    setTimeout(() => {
                      mapComponentRef.current.fitBounds(bounds);
                    }, 100);
                  }
                }

                logger.info('✅ Map state updated with OSDU GeoJSON data:', {
                  center,
                  bounds,
                  wellCount: osduWithCoords.length,
                  featureCount: osduGeoJSON.features.length
                });
              }
            }
          }

          // Remove loading message and add result
          setMessages(prevMessages => {
            const filtered = prevMessages.filter(m => m.id !== loadingMessage.id);
            return [...filtered, osduMessage];
          });
        } catch (osduError) {
          logger.error('❌ OSDU search failed:', osduError);

          // Determine error type for better user messaging using Cloudscape format
          const errorMsg = osduError instanceof Error ? osduError.message : String(osduError);
          let errorType: 'timeout' | 'auth' | 'network' | 'config' | 'rate-limit' | 'generic' = 'generic';
          let userMessage = '';

          // Categorize errors and use Cloudscape component format
          if (errorMsg.includes('not configured') || errorMsg.includes('503')) {
            errorType = 'config';
          } else if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('forbidden') || errorMsg.includes('authentication')) {
            errorType = 'auth';
          } else if (errorMsg.includes('timeout') || errorMsg.includes('504')) {
            errorType = 'timeout';
          } else if (errorMsg.includes('429') || errorMsg.includes('too many requests')) {
            errorType = 'rate-limit';
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            errorType = 'network';
          } else {
            errorType = 'generic';
          }

          // Format error response for Cloudscape component
          userMessage = `\`\`\`osdu-error-response\n${JSON.stringify({ errorType, errorMessage: errorMsg, query: prompt }, null, 2)}\n\`\`\``;

          // Remove loading message and show error
          const errorMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: userMessage
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          setMessages(prevMessages => {
            const filtered = prevMessages.filter(m => m.id !== loadingMessage.id);
            return [...filtered, errorMessage];
          });
        } finally {
          setIsLoadingMapData(false);
        }

        return; // Exit early for OSDU search
      }

      // Enhanced context determination for filtering (catalog search only)
      const isFirstQuery = !analysisData || analysisData.length === 0;
      const lowerPrompt = prompt.toLowerCase().trim();

      // Phase 2: Detect collection creation intent (feature-flagged)
      if (creationEnabled && analysisData && analysisData.length > 0) {
        const collectionKeywords = ['create', 'new collection', 'collection', 'save', 'with this data', 'make collection', 'create collection'];
        const isCollectionCreation = collectionKeywords.some(keyword => lowerPrompt.includes(keyword)) &&
          (lowerPrompt.includes('collection') || lowerPrompt.includes('save'));

        if (isCollectionCreation) {
          logger.info('🗂️ Collection creation intent detected');

          // Prepare data for collection creation
          setSelectedDataItems(analysisData);
          setShowCreateCollectionModal(true);

          const collectionMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `📁 **Create Collection**\n\nI'll help you create a collection with your current ${analysisData.length} wells. Please provide a name for your collection in the modal that just opened.\n\n✨ **This collection will preserve:**\n- All ${analysisData.length} well data points\n- Current map view and geographic bounds\n- Search filters and analysis configuration\n- Complete context for future restoration\n\n🎯 **Beta Feature**: Collections are currently available to 25% of users for testing.`
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          setMessages(prevMessages => [...prevMessages, collectionMessage]);
          setIsLoadingMapData(false);
          return;
        }
      }

      // Detect if this should be a filter operation on existing data
      const filterKeywords = ['filter', 'depth', 'greater than', '>', 'deeper', 'show wells with', 'wells with'];
      const isLikelyFilter = !isFirstQuery && filterKeywords.some(keyword => lowerPrompt.includes(keyword));

      logger.info('🔍 Context Analysis:', {
        isFirstQuery,
        isLikelyFilter,
        hasExistingData: !!analysisData,
        existingWellCount: analysisData?.length || 0,
        prompt: lowerPrompt,
        collectionsEnabled: creationEnabled
      });

      // Prepare context for backend - includes both catalog and OSDU data
      let searchContextForBackend = null;
      if (!isFirstQuery && analysisData && analysisData.length > 0) {
        // Separate OSDU and catalog wells for tracking
        const osduWells = analysisData.filter(w => w.dataSource === 'OSDU');
        const catalogWells = analysisData.filter(w => w.dataSource !== 'OSDU');

        searchContextForBackend = {
          wells: analysisData, // Includes both OSDU and catalog data
          queryType: analysisQueryType,
          timestamp: new Date().toISOString(),
          isFilterOperation: isLikelyFilter,
          // Add metadata about data sources
          dataSources: {
            osdu: osduWells.length,
            catalog: catalogWells.length,
            total: analysisData.length
          }
        };

        logger.info('📤 Sending context to backend:', {
          wellCount: searchContextForBackend.wells.length,
          osduCount: osduWells.length,
          catalogCount: catalogWells.length,
          previousQueryType: searchContextForBackend.queryType,
          isFilterOperation: isLikelyFilter,
          contextWells: searchContextForBackend.wells.slice(0, 3).map(w => `${w.name} (${w.dataSource || 'catalog'})`)
        });
      } else {
        logger.info('📤 No context sent - fresh search');
      }

      // Call catalog search REST API with enhanced context
      const searchResponse = await searchCatalog(prompt, searchContextForBackend);

      logger.info('🔍 CATALOG SEARCH RESPONSE:', searchResponse);

      // The response is already a GeoJSON FeatureCollection
      if (searchResponse && searchResponse.type === 'FeatureCollection') {
        const geoJsonData = searchResponse;

        logger.info('✅ PARSED CATALOG DATA WITH THOUGHT STEPS:', geoJsonData);
        logger.info('🧠 Thought steps received:', geoJsonData.thoughtSteps?.length || 0);

        // Filter features to only include wells for the table (not weather data)
        const wellFeatures = geoJsonData.features?.filter((feature: any) =>
          feature.properties?.type === 'My Wells' ||
          feature.properties?.category === 'personal' ||
          (!feature.properties?.type?.startsWith('weather_') && feature.properties?.name)
        ) || [];

        const weatherFeatures = geoJsonData.features?.filter((feature: any) =>
          feature.properties?.type?.startsWith('weather_')
        ) || [];

        // Create table data from ONLY well features for the chat component
        const tableItems = wellFeatures.map((feature: any, index: number) => ({
          id: `well-${index}`,
          name: feature.properties?.name || 'Unknown Well',
          type: feature.properties?.type || 'Unknown',
          location: feature.properties?.location || 'Unknown',
          depth: feature.properties?.depth || 'Unknown',
          operator: feature.properties?.operator || 'Unknown'
        }));

        // Create search results message based on backend query type
        const backendQueryType = geoJsonData.metadata?.queryType;
        const isWeatherQuery = backendQueryType === 'weatherMaps';
        const isDepthQuery = backendQueryType === 'depth';
        let messageText;

        if (isWeatherQuery) {
          messageText = `**🌤️ Weather Map Results**\n\nFound **${wellFeatures.length} wells** with **${weatherFeatures.length} weather data points** for query: *"${prompt}"*\n\nWells displayed as red markers, weather shown as temperature and precipitation overlays. Use the weather layer controls to toggle visibility.\n\n**📊 Well Data Table:**\n\n\`\`\`json-table-data\n${JSON.stringify(tableItems, null, 2)}\n\`\`\`\n\n🌤️ *Weather overlays: Temperature heatmap and precipitation patterns. Toggle controls in top-right corner of map.*`;
        } else if (isDepthQuery) {
          const depthFilter = geoJsonData.metadata?.depthFilter;
          const filterCriteria = depthFilter ? `depth ${depthFilter.operator.replace('_', ' ')} ${depthFilter.minDepth}${depthFilter.unit}` : 'depth criteria';
          messageText = `**🔽 Depth Filter Applied**\n\nFiltered to **${wellFeatures.length} wells** matching: *${filterCriteria}* from query: *"${prompt}"*\n\nResults displayed on the map with interactive markers and updated table below.\n\n**📊 Filtered Well Data:**\n\n\`\`\`json-table-data\n${JSON.stringify(tableItems, null, 2)}\n\`\`\`\n\n💡 *Analysis visualizations updated in the Data Analysis & Visualization tab.*`;
        } else {
          messageText = `**🔍 Catalog Search Results**\n\nFound **${wellFeatures.length} wells** for query: *"${prompt}"*\n\nResults displayed on the map with interactive markers and detailed table below.\n\n**📊 Well Data Table:**\n\n\`\`\`json-table-data\n${JSON.stringify(tableItems, null, 2)}\n\`\`\`\n\n💡 *Click map markers for additional well information.*\n\n📁 **New**: [Collection Management (Beta)](/collections) - Organize and save your curated datasets for reuse across analysis sessions.`;
        }

        const newMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: messageText
          } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any,
          // Include thought steps from catalog search
          thoughtSteps: geoJsonData.thoughtSteps || []
        } as any;

        setTimeout(() => {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }, 0);

        // Enhanced analysis data management for proper context continuity
        if (wellFeatures.length > 0) {
          const analysisWellData = wellFeatures.map((feature: any, index: number) => ({
            name: feature.properties?.name || 'Unknown Well',
            type: feature.properties?.type || 'Unknown',
            depth: feature.properties?.depth || 'Unknown',
            location: feature.properties?.location || 'Unknown',
            operator: feature.properties?.operator || 'Unknown',
            coordinates: feature.geometry.coordinates as [number, number],
            category: feature.properties?.category || 'search_result'
          }));

          // Always update analysis data with current search results for proper filtering context
          setAnalysisData(analysisWellData);
          setAnalysisQueryType(geoJsonData.metadata?.queryType || 'general');

          logger.info('✅ Updated analysis context:', {
            wellCount: analysisWellData.length,
            queryType: geoJsonData.metadata?.queryType || 'general',
            isContextualFilter: geoJsonData.metadata?.contextFilter || false
          });
        } else {
          // Only clear analysis data if this was a fresh search, not a failed filter
          if (isFirstQuery || !searchContextForBackend) {
            logger.info('🧹 Clearing analysis data - no results on fresh search');
            setAnalysisData(null);
            setAnalysisQueryType('');
          } else {
            logger.info('⚠️ Filter returned no results - keeping existing context');
          }
        }

        // FIXED: Always save map state from search results, regardless of which panel is active
        if (geoJsonData && geoJsonData.type === 'FeatureCollection') {
          logger.info('🗺️ Processing search results for map state (panel-independent)');

          // Calculate bounds from search results (always, regardless of panel)
          if (geoJsonData.features && geoJsonData.features.length > 0) {
            const coordinates = geoJsonData.features
              .filter((f: any) => f && f.geometry && f.geometry.coordinates && Array.isArray(f.geometry.coordinates))
              .map((f: any) => f.geometry.coordinates);

            if (coordinates.length > 0) {
              const bounds = {
                minLon: Math.min(...coordinates.map(coords => coords[0])),
                maxLon: Math.max(...coordinates.map(coords => coords[0])),
                minLat: Math.min(...coordinates.map(coords => coords[1])),
                maxLat: Math.max(...coordinates.map(coords => coords[1]))
              };

              const centerLon = (bounds.minLon + bounds.maxLon) / 2;
              const centerLat = (bounds.minLat + bounds.maxLat) / 2;
              const center: [number, number] = [centerLon, centerLat];

              logger.info('🗺️ Saving map state from search results:', {
                center,
                bounds,
                wellCount: geoJsonData.features.length,
                activePanel: selectedId
              });

              // Check if this is weather data and update weather layer state
              const isWeatherData = geoJsonData.metadata?.queryType === 'weatherMaps';
              let weatherLayers: string[] = [];

              if (isWeatherData && geoJsonData.weatherLayers) {
                weatherLayers = Object.keys(geoJsonData.weatherLayers).filter(key => key !== 'additional');
                const additionalLayers = geoJsonData.weatherLayers.additional ? Object.keys(geoJsonData.weatherLayers.additional) : [];

                logger.info('🌤️ Weather layers detected:', weatherLayers);
                logger.info('🌤️ Additional weather layers:', additionalLayers);

                // Set available weather layers
                setAvailableWeatherLayers([...weatherLayers, ...additionalLayers]);

                // Set initial active state for primary layers
                const initialActiveState: { [key: string]: boolean } = {};
                weatherLayers.forEach(layer => {
                  initialActiveState[layer] = geoJsonData.weatherLayers[layer]?.visible || false;
                });
                additionalLayers.forEach(layer => {
                  initialActiveState[layer] = geoJsonData.weatherLayers.additional[layer]?.visible || false;
                });

                setActiveWeatherLayers(initialActiveState);
                setShowWeatherControls(true); // Always show controls for weather queries
                logger.info('🌤️ Initial weather layer states:', initialActiveState);
              } else {
                // Reset weather layers for non-weather queries
                setAvailableWeatherLayers([]);
                setActiveWeatherLayers({});
              }

              // ALWAYS save map state regardless of panel
              logger.info('🔍 DEBUG: Saving map state with wellData:', {
                featureCount: geoJsonData.features?.length || 0,
                firstFeature: geoJsonData.features?.[0],
                allFeatureNames: geoJsonData.features?.slice(0, 5).map((f: any) => f.properties?.name)
              });
              
              setMapState({
                center: center,
                zoom: 8,
                bounds: bounds,
                wellData: geoJsonData,
                hasSearchResults: true,
                weatherLayers: weatherLayers
              });

              // Also update the map component's internal state for persistence
              if (mapComponentRef.current && mapComponentRef.current.restoreMapState) {
                mapComponentRef.current.restoreMapState({
                  center: center,
                  zoom: 8
                });
              }
            }
          }

          // Update map in background if possible (when map panel is active)
          if (selectedId === "seg-1" && mapComponentRef.current) {
            logger.info('🗺️ Map panel active, updating map immediately');
            try {
              // Clear map first to ensure only new data is shown
              if (mapComponentRef.current.clearMap) {
                mapComponentRef.current.clearMap();
              }
              mapComponentRef.current.updateMapData(geoJsonData);
            } catch (error) {
              logger.error('❌ Error updating map immediately:', error);
            }
          } else {
            logger.info('🗺️ Chain of thought panel active, map will be updated on panel switch');
          }
        }
      }

    } catch (error) {
      logger.error('❌ Error in catalog search:', error);
      setError(error instanceof Error ? error : new Error(String(error)));

      const errorMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: `Error processing your catalog search: ${error instanceof Error ? error.message : String(error)}`
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      };

      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }, 0);
    } finally {
      setIsLoadingMapData(false);
    }
  }, [setMessages, mapComponentRef, analysisData, analysisQueryType]);

  // NOTE: Chat session subscription removed since catalog uses direct search
  // Chain of thought infrastructure is ready for when catalogSearch backend 
  // is enhanced to return thought steps

  const handlePolygonCreate = useCallback((polygon: PolygonFilter) => {
    setPolygons(prev => [...prev, polygon]);
    setActivePolygon(polygon);
    logger.info('Polygon created:', polygon);
  }, []);

  const handlePolygonDelete = useCallback((deletedIds: string[]) => {
    setPolygons(prev => prev.filter(p => !deletedIds.includes(p.id)));
    setActivePolygon(null);
    logger.info('Polygons deleted:', deletedIds);
  }, []);

  const handlePolygonUpdate = useCallback((updatedPolygon: PolygonFilter) => {
    setPolygons(prev => prev.map(p =>
      p.id === updatedPolygon.id ? updatedPolygon : p
    ));
    logger.info('Polygon updated:', updatedPolygon.id);
  }, []);

  // Weather layer toggle handler
  const handleWeatherLayerToggle = useCallback((layerType: string, visible: boolean) => {
    logger.info(`🌤️ Toggling weather layer: ${layerType} -> ${visible}`);

    // Update local state
    setActiveWeatherLayers(prev => ({
      ...prev,
      [layerType]: visible
    }));

    // Toggle on map if available
    if (mapComponentRef.current && mapComponentRef.current.toggleWeatherLayer) {
      logger.info(`🗺️ Calling map toggleWeatherLayer for ${layerType}`);
      mapComponentRef.current.toggleWeatherLayer(layerType, visible);
    } else {
      logger.warn('⚠️ Map component or toggleWeatherLayer function not available');
    }
  }, []);

  return (
    <div className='main-container' data-page="catalog">
      {/* this is the header grid that manages the controls and title */}
      <div className="reset-chat">
        <Grid
          disableGutters
          gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
        >
          {/* left grid with title and segmented controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Data Catalog - All Data</Typography>
            <SegmentedControl
              selectedId={selectedId}
              onChange={({ detail }) =>
                setSelectedId(detail.selectedId)
              }
              label="Segmented control with only icons"
              options={[
                {
                  iconName: "map",
                  iconAlt: "Map View",
                  id: "seg-1"
                },
                {
                  iconSvg: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="48"
                      viewBox="0 0 24 24"
                      width="48"
                    >
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                    </svg>
                  ),
                  iconAlt: "Data Analysis & Visualization",
                  id: "seg-2"
                },
                {
                  iconSvg: (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="48"
                      viewBox="0 0 24 24"
                      width="48"
                    >
                      <g></g>
                      <g>
                        <g>
                          <path d="M13,8.57c-0.79,0-1.43,0.64-1.43,1.43s0.64,1.43,1.43,1.43s1.43-0.64,1.43-1.43S13.79,8.57,13,8.57z" />
                          <path d="M13,3C9.25,3,6.2,5.94,6.02,9.64L4.1,12.2C3.85,12.53,4.09,13,4.5,13H6v3c0,1.1,0.9,2,2,2h1v3h7v-4.68 c2.36-1.12,4-3.53,4-6.32C20,6.13,16.87,3,13,3z M16,10c0,0.13-0.01,0.26-0.02,0.39l0.83,0.66c0.08,0.06,0.1,0.16,0.05,0.25 l-0.8,1.39c-0.05,0.09-0.16,0.12-0.24,0.09l-0.99-0.4c-0.21,0.16-0.43,0.29-0.67,0.39L14,13.83c-0.01,0.1-0.1,0.17-0.2,0.17h-1.6 c-0.1,0-0.18-0.07-0.2-0.17l-0.15-1.06c-0.25-0.1-0.47-0.23-0.68-0.39l-0.99,0.4c-0.09,0.03-0.2,0-0.25-0.09l-0.8-1.39 c-0.05-0.08-0.03-0.19,0.05-0.25l0.84-0.66C10.01,10.26,10,10.13,10,10c0-0.13,0.02-0.27,0.04-0.39L9.19,8.95 c-0.08-0.06-0.1-0.16-0.05-0.26l0.8-1.38c0.05-0.09,0.15-0.12,0.24-0.09l1,0.4c0.2-0.15,0.43-0.29,0.67-0.39l0.15-1.06 C12.02,6.07,12.1,6,12.2,6h1.6c0.1,0,0.18,0.07,0.2,0.17l0.15,1.06c0.24,0.1,0.46,0.23,0.67,0.39l1-0.4c0.09-0.03,0.2,0,0.24,0.09 l0.8,1.38c0.05,0.09,0.03,0.2-0.05,0.26l-0.85,0.66C15.99,9.73,16,9.86,16,10z" />
                        </g>
                      </g>
                    </svg>
                  ),
                  iconAlt: "Chain of Thought",
                  id: "seg-3"
                }
              ]}
            />
          </div>
          {/* right grid with breadcrumbs and ctas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 'calc(100% - 30px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <a href="/catalog" style={{ color: '#0073bb', textDecoration: 'none' }}>Data Catalog</a>
                <span style={{ color: '#5f6b7a' }}>›</span>
                <span style={{ color: '#000716', fontWeight: 600 }}>All Data</span>
              </div>
            </div>
            <div className='toggles'>
              <Tooltip title={showQueryBuilder ? "Start New Session" : "Start New Session"}>
                <IconButton
                  onClick={handleCreateNewChat}
                  color="primary"
                  size="large"
                >
                  <RestartAlt />
                </IconButton>
              </Tooltip>

              <Tooltip title={showQueryBuilder ? "Hide Query Builder" : "Show Query Builder"}>
                <IconButton
                  onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                  color="primary"
                  size="large"
                  sx={{
                    bgcolor: showQueryBuilder ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    zIndex: 1300
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm15 0h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z" />
                  </svg>
                </IconButton>
              </Tooltip>

              <Tooltip title={fileDrawerOpen ? "Hide Files" : "View Files"}>
                <IconButton
                  onClick={() => setFileDrawerOpen(!fileDrawerOpen)}
                  color="primary"
                  size="large"
                  sx={{
                    bgcolor: fileDrawerOpen ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    zIndex: 1300
                  }}
                >
                  <FolderIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </Grid>
      </div>
      <div className='content-area'>
        <Grid
        disableGutters
        gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
        >
          {selectedId === "seg-1" ? (
            <div className='panel' style={{ height: 'calc(100% - 29px)', borderBottomLeftRadius: '20px', display: 'flex', flexDirection: 'column', marginBottom: '160px' }}>
              <div style={{ position: 'relative', flex: 1, minHeight: 0, height: '100%' }}>
                <MapComponent
                  ref={mapComponentRef}
                  mapColorScheme={mapColorScheme}
                  onPolygonCreate={handlePolygonCreate}
                  onPolygonDelete={handlePolygonDelete}
                  onPolygonUpdate={handlePolygonUpdate}
                />
              </div>
            </div>
          ) : selectedId === "seg-2" ? (
            // Data Analysis & Visualization Panel
            <div className='panel' style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Container
                footer=""
                header={
                  <SpaceBetween direction="horizontal" size="m" alignItems="center">
                    <CloudscapeBox variant="h2">Data Analysis & Visualization</CloudscapeBox>
                  </SpaceBetween>
                }
              >
                <div style={{
                  overflowY: 'auto',
                  flex: 1,
                  position: 'relative',
                  paddingBottom: '60px'
                }}>
                  {analysisData ? (
                    <GeoscientistDashboardErrorBoundary
                      fallbackTableData={analysisData}
                      searchQuery={`Analysis for ${analysisData.length} wells`}
                    >
                      <DataDashboard
                        wells={analysisData}
                        queryType={analysisQueryType}
                        searchQuery={`Analysis for ${analysisData.length} wells`}
                        weatherData={analysisQueryType === 'weatherMaps' ? {
                          temperature: { min: 26, max: 31, current: 28.5 },
                          precipitation: { current: 2.3, forecast: 'Light showers' },
                          operationalStatus: 'Favorable'
                        } : undefined}
                      />
                    </GeoscientistDashboardErrorBoundary>
                  ) : (
                    <Container>
                      <SpaceBetween direction="vertical" size="l" alignItems="center">
                        <Icon name="settings" size="large" />
                        <SpaceBetween direction="vertical" size="m" alignItems="center">
                          <Box
                            sx={{
                              padding: '40px 20px',
                              textAlign: 'center',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '8px',
                              marginTop: '12px'
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#6c757d',
                                marginBottom: '8px',
                                fontSize: '16px'
                              }}
                            >
                              No AI reasoning process active
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#868e96',
                                fontSize: '13px'
                              }}
                            >
                              Submit a query to see the AI's step-by-step decision-making process
                            </Typography>
                          </Box>
                        </SpaceBetween>
                      </SpaceBetween>
                    </Container>
                  )}
                </div>
              </Container>
            </div>
          ) : (
            // Chain of Thought Panel (seg-3) - using reusable ChainOfThoughtDisplay component
            <div className='panel'>
              <ChainOfThoughtDisplay messages={messages} />
            </div>
          )}

          <div className='convo'>
            <div style={{
              height: '100%',
              width: '100%',
              position: 'relative',
              transition: theme.transitions.create(['padding-right'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.standard,
              }),
              paddingRight: fileDrawerOpen && !isMobile ? '0' : '0'
            }}>
              <div style={{
                paddingBottom: '160px',
              }}>

                <CatalogChatBoxCloudscape
                  onInputChange={setUserInput}
                  userInput={userInput}
                  messages={messages}
                  setMessages={setMessages}
                  onSendMessage={async (message: string) => {
                    await handleChatSearch(message);
                  }}
                  onOpenQueryBuilder={() => setShowQueryBuilder(!showQueryBuilder)}
                  showQueryBuilder={showQueryBuilder}
                  onExecuteQuery={handleQueryBuilderExecution}
                />
              </div>
            </div>

            {isMobile && !fileDrawerOpen && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '16px',
                  right: '16px',
                  zIndex: 1100
                }}
              >
                <Tooltip title="View Files">
                  <IconButton
                    onClick={() => setFileDrawerOpen(!fileDrawerOpen)}
                    color="primary"
                    size="large"
                    sx={{
                      bgcolor: 'white',
                      boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
                      '&:hover': {
                        bgcolor: 'white',
                      }
                    }}
                  >
                    <FolderIcon />
                  </IconButton>
                </Tooltip>
              </div>
            )}

            <FileDrawer
              open={fileDrawerOpen}
              onClose={() => setFileDrawerOpen(false)}
              chatSessionId={activeChatSession.id || ""}
              variant={drawerVariant}
            />
          </div>
        </Grid>
      </div>



      {/* Phase 2: Collection Creation Modal (Feature-Flagged) */}
      {creationEnabled && (
        <CollectionCreationModal
          visible={showCreateCollectionModal}
          onDismiss={() => setShowCreateCollectionModal(false)}
          collectionName={collectionName}
          collectionDescription={collectionDescription}
          onNameChange={setCollectionName}
          onDescriptionChange={setCollectionDescription}
          onCreateCollection={handleCreateCollection}
          creating={creatingCollection}
          dataItems={selectedDataItems}
          selectedItems={tableSelection}
          onSelectionChange={setTableSelection}
          showItemSelection={true}
        />
      )}


    </div>
  );
}

// Apply auth protection
const CatalogPage = withAuth(CatalogPageBase);

export default CatalogPage;
