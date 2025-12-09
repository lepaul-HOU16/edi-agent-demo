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
import { searchCatalog, searchOSDU } from '@/lib/api/catalog';

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

  // Catalog Search Context for conversational filtering (24 LAS files)
  interface CatalogRecord {
    id: string;
    name: string;
    type: string;
    operator?: string;
    location?: string;
    depth?: number;
    depthUnit?: 'm' | 'ft';
    wellName?: string;
    dataSource: string;
    latitude?: number | null;
    longitude?: number | null;
    properties?: any;
  }

  interface CatalogSearchContext {
    query: string;                      // Original search query
    timestamp: Date;                    // When search was performed
    recordCount: number;                // Total records from API (24 LAS files)
    records: CatalogRecord[];           // Full record array
    filteredRecords?: CatalogRecord[];  // Currently filtered records
    activeFilters?: FilterCriteria[];   // Applied filters
  }

  // Context state for filtering and follow-up queries
  const [osduContext, setOsduContext] = useState<OSDUSearchContext | null>(null);
  const [catalogContext, setCatalogContext] = useState<CatalogSearchContext | null>(null);
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

  // Client-side NLP parsing (simplified version of shared parser)
  const parseFilterQuery = useCallback((query: string): {
    locations: string[];
    operators: string[];
    wellPrefixes: string[];
    minDepth?: number;
    depthUnit?: 'm' | 'ft';
  } => {
    const lowerQuery = query.toLowerCase();
    const result: any = {
      locations: [],
      operators: [],
      wellPrefixes: []
    };

    // Location keywords
    const locationMap: Record<string, string> = {
      'north sea': 'North Sea',
      'gulf of mexico': 'Gulf of Mexico',
      'brunei': 'Brunei',
      'malaysia': 'Malaysia',
      'offshore': 'Offshore',
      'offshore brunei': 'Offshore Brunei',
      'offshore malaysia': 'Offshore Malaysia'
    };

    // Operator keywords
    const operatorMap: Record<string, string> = {
      'bp': 'BP',
      'shell': 'Shell',
      'my company': 'My Company',
      'chevron': 'Chevron',
      'exxonmobil': 'ExxonMobil',
      'exxon mobil': 'ExxonMobil'
    };

    // Well prefix keywords - match specific patterns to avoid false positives
    const prefixMap: Record<string, string> = {
      'usa': 'USA',
      'nor': 'NOR',
      'vie': 'VIE',
      'uae': 'UAE',
      'kaz': 'KAZ'
    };

    // Parse locations
    for (const [keyword, location] of Object.entries(locationMap)) {
      if (lowerQuery.includes(keyword)) {
        result.locations.push(location);
      }
    }

    // Parse operators
    for (const [keyword, operator] of Object.entries(operatorMap)) {
      if (lowerQuery.includes(keyword)) {
        result.operators.push(operator);
      }
    }

    // Parse well prefixes - use word boundaries to avoid matching "wells" as "WELL" prefix
    for (const [keyword, prefix] of Object.entries(prefixMap)) {
      // Skip "well" keyword entirely - it's too ambiguous (could be "show me wells" vs "WELL-001")
      if (keyword === 'well') continue;
      
      // Match keyword as standalone word or followed by hyphen/number (e.g., "USA wells", "USA-001")
      const prefixPattern = new RegExp(`\\b${keyword}(?:\\s+wells?|[-\\d])`, 'i');
      if (prefixPattern.test(lowerQuery)) {
        result.wellPrefixes.push(prefix);
      }
    }
    
    // Special case: "WELL" prefix ONLY if explicitly mentioned as identifier with hyphen/number (e.g., "WELL-001")
    // Do NOT match "show me wells" or "osdu wells"
    if (/\bwell-\d+/i.test(lowerQuery)) {
      result.wellPrefixes.push('WELL');
    }

    // Parse depth criteria
    const depthPatterns = [
      /deeper\s+than\s+(\d+)\s*(m|meters?|ft|feet?)?/i,
      /depth\s*[>]\s*(\d+)\s*(m|meters?|ft|feet?)?/i,
      /depth\s+greater\s+than\s+(\d+)\s*(m|meters?|ft|feet?)?/i,
      /wells?\s+with\s+depth\s*[>]\s*(\d+)\s*(m|meters?|ft|feet?)?/i,
      /(?:above|over)\s+(\d+)\s*(m|meters?|ft|feet?)?/i
    ];

    for (const pattern of depthPatterns) {
      const match = query.match(pattern);
      if (match) {
        const depth = parseInt(match[1]);
        const unitStr = match[2]?.toLowerCase() || 'm';
        const unit: 'm' | 'ft' = unitStr.startsWith('ft') || unitStr.startsWith('feet') ? 'ft' : 'm';
        result.minDepth = depth;
        result.depthUnit = unit;
        break;
      }
    }

    return result;
  }, []);

  // Unified filter detection for both OSDU and Catalog contexts
  const detectFilterIntent = useCallback((query: string): { 
    hasFilterIntent: boolean; 
    contextType: 'osdu' | 'catalog' | 'none';
    isResetCommand: boolean;
  } => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Detect reset commands
    const resetKeywords = ['show all', 'reset', 'clear filter', 'remove filter', 'all wells'];
    const isResetCommand = resetKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Detect filter intent keywords
    const filterKeywords = [
      'just', 'only', 'near', 'deeper', 'filter',
      'greater than', 'above', 'over', 'with depth', 'wells with'
    ];
    const hasFilterIntent = filterKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // IMPORTANT: Don't treat initial search queries as filters
    // "show me all my wells" or "show me my wells" should NOT be filters
    const isInitialSearchQuery = (lowerQuery.includes('show me') && lowerQuery.includes('my wells')) ||
                                  (lowerQuery.includes('show me') && lowerQuery.includes('osdu'));
    
    if (isInitialSearchQuery) {
      return { hasFilterIntent: false, contextType: 'none', isResetCommand: false };
    }
    
    // Determine which context to filter based on what data we have
    let contextType: 'osdu' | 'catalog' | 'none' = 'none';
    
    if (hasFilterIntent || isResetCommand) {
      // Check if we have catalog context (24 LAS files)
      if (catalogContext && catalogContext.records.length > 0) {
        contextType = 'catalog';
      }
      // Check if we have OSDU context
      else if (osduContext && osduContext.records.length > 0) {
        contextType = 'osdu';
      }
      // Check analysis data as fallback
      else if (analysisData && analysisData.length > 0) {
        // Determine from data source
        const hasOSDU = analysisData.some(w => w.dataSource === 'OSDU');
        const hasCatalog = analysisData.some(w => w.dataSource !== 'OSDU');
        
        if (hasCatalog) {
          contextType = 'catalog';
        } else if (hasOSDU) {
          contextType = 'osdu';
        }
      }
    }
    
    logger.info('🔍 Filter intent detection:', {
      hasFilterIntent,
      isResetCommand,
      contextType,
      hasCatalogContext: !!catalogContext,
      hasOSDUContext: !!osduContext,
      query: lowerQuery
    });
    
    return { hasFilterIntent, contextType, isResetCommand };
  }, [catalogContext, osduContext, analysisData]);

  // Unified context filtering for both OSDU and Catalog
  const applyContextFilter = useCallback((query: string, contextType: 'osdu' | 'catalog'): {
    success: boolean;
    filteredCount: number;
    originalCount: number;
    filterDescription: string;
  } => {
    const filters = parseFilterQuery(query);
    const hasFilters = filters.locations.length > 0 || 
                      filters.operators.length > 0 || 
                      filters.wellPrefixes.length > 0 || 
                      filters.minDepth !== undefined;

    if (!hasFilters) {
      return { success: false, filteredCount: 0, originalCount: 0, filterDescription: 'No filters detected' };
    }

    if (contextType === 'catalog' && catalogContext) {
      // Filter catalog records
      const recordsToFilter = catalogContext.filteredRecords || catalogContext.records;
      const filtered = recordsToFilter.filter(record => {
        // Location filter
        if (filters.locations.length > 0) {
          const locationMatch = filters.locations.some(loc => 
            record.location?.toLowerCase().includes(loc.toLowerCase())
          );
          if (!locationMatch) return false;
        }

        // Operator filter
        if (filters.operators.length > 0) {
          const operatorMatch = filters.operators.some(op => 
            record.operator?.toLowerCase().includes(op.toLowerCase())
          );
          if (!operatorMatch) return false;
        }

        // Well name prefix filter
        if (filters.wellPrefixes.length > 0) {
          const prefixMatch = filters.wellPrefixes.some(prefix => 
            record.wellName?.toUpperCase().startsWith(prefix.toUpperCase())
          );
          if (!prefixMatch) return false;
        }

        // Depth filter - handle both number and string depth values
        if (filters.minDepth !== undefined && record.depth !== undefined) {
          let depthValue: number;
          
          if (typeof record.depth === 'number') {
            depthValue = record.depth;
          } else {
            // Extract numeric value from depth string (e.g., "3650m (est.)" -> 3650)
            const depthMatch = String(record.depth).match(/(\d+(?:\.\d+)?)/);
            if (depthMatch) {
              depthValue = parseFloat(depthMatch[1]);
            } else {
              // No valid depth found, exclude from results
              return false;
            }
          }
          
          if (depthValue < filters.minDepth) return false;
        }

        return true;
      });

      // Update catalog context with filtered results
      setCatalogContext({
        ...catalogContext,
        filteredRecords: filtered,
        activeFilters: [
          ...filters.locations.map(loc => ({ type: 'location' as const, value: loc })),
          ...filters.operators.map(op => ({ type: 'operator' as const, value: op })),
          ...(filters.minDepth ? [{ type: 'depth' as const, value: filters.minDepth, operator: '>' as const }] : [])
        ]
      });

      // Update analysis data to match filtered results
      const filteredWellData = filtered.map(record => ({
        name: record.name,
        type: record.type,
        depth: record.depth?.toString() || 'Unknown',
        location: record.location || 'Unknown',
        operator: record.operator || 'Unknown',
        coordinates: [record.longitude || 0, record.latitude || 0] as [number, number],
        category: 'search_result',
        dataSource: 'catalog'
      }));

      setAnalysisData(filteredWellData);

      // 🔥 FIX: Update map with filtered data
      const filteredGeoJSON = {
        type: "FeatureCollection" as const,
        features: filtered.map((record, index) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [record.longitude || 0, record.latitude || 0]
          },
          properties: {
            name: record.name,
            type: record.type,
            depth: record.depth?.toString() || 'Unknown',
            location: record.location || 'Unknown',
            operator: record.operator || 'Unknown',
            category: 'search_result',
            dataSource: 'catalog',
            id: record.id || `catalog-${index}`
          }
        }))
      };

      // Update map state
      const coordinates = filtered.map(r => [r.longitude || 0, r.latitude || 0]);
      const bounds = coordinates.length > 0 ? {
        minLon: Math.min(...coordinates.map(c => c[0])),
        maxLon: Math.max(...coordinates.map(c => c[0])),
        minLat: Math.min(...coordinates.map(c => c[1])),
        maxLat: Math.max(...coordinates.map(c => c[1]))
      } : null;

      setMapState(prev => ({
        ...prev,
        wellData: filteredGeoJSON,
        bounds,
        hasSearchResults: true
      }));

      // Update map immediately if on map panel
      if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
        logger.info('🗺️ Updating map with filtered catalog data:', filtered.length, 'wells');
        mapComponentRef.current.updateMapData(filteredGeoJSON);
        
        if (bounds && mapComponentRef.current.fitBounds) {
          setTimeout(() => {
            mapComponentRef.current.fitBounds(bounds);
          }, 300);
        }
      }

      // Build filter description
      const filterParts: string[] = [];
      if (filters.locations.length > 0) filterParts.push(`location: ${filters.locations.join(', ')}`);
      if (filters.operators.length > 0) filterParts.push(`operator: ${filters.operators.join(', ')}`);
      if (filters.wellPrefixes.length > 0) filterParts.push(`well prefix: ${filters.wellPrefixes.join(', ')}`);
      if (filters.minDepth) filterParts.push(`depth > ${filters.minDepth}${filters.depthUnit}`);

      return {
        success: true,
        filteredCount: filtered.length,
        originalCount: recordsToFilter.length,
        filterDescription: filterParts.join(', ')
      };
    } else if (contextType === 'osdu' && osduContext) {
      // Filter OSDU records (similar logic)
      const recordsToFilter = osduContext.filteredRecords || osduContext.records;
      const filtered = recordsToFilter.filter(record => {
        // Location filter
        if (filters.locations.length > 0) {
          const locationMatch = filters.locations.some(loc => 
            record.location?.toLowerCase().includes(loc.toLowerCase()) ||
            record.basin?.toLowerCase().includes(loc.toLowerCase())
          );
          if (!locationMatch) return false;
        }

        // Operator filter
        if (filters.operators.length > 0) {
          const operatorMatch = filters.operators.some(op => 
            record.operator?.toLowerCase().includes(op.toLowerCase())
          );
          if (!operatorMatch) return false;
        }

        // Well name prefix filter
        if (filters.wellPrefixes.length > 0) {
          const prefixMatch = filters.wellPrefixes.some(prefix => 
            record.name?.toUpperCase().startsWith(prefix.toUpperCase())
          );
          if (!prefixMatch) return false;
        }

        // Depth filter - handle both number and string depth values
        if (filters.minDepth !== undefined && record.depth) {
          let depthValue: number;
          
          if (typeof record.depth === 'number') {
            depthValue = record.depth;
          } else if (typeof record.depth === 'string') {
            // Extract numeric value from depth string (e.g., "3650m" -> 3650)
            const depthMatch = record.depth.match(/(\d+(?:\.\d+)?)/);
            if (depthMatch) {
              depthValue = parseFloat(depthMatch[1]);
            } else {
              // No valid depth found, exclude from results
              return false;
            }
          } else {
            return false;
          }
          
          if (depthValue < filters.minDepth) return false;
        }

        return true;
      });

      // Update OSDU context with filtered results
      setOsduContext({
        ...osduContext,
        filteredRecords: filtered,
        activeFilters: [
          ...filters.locations.map(loc => ({ type: 'location' as const, value: loc })),
          ...filters.operators.map(op => ({ type: 'operator' as const, value: op })),
          ...(filters.minDepth ? [{ type: 'depth' as const, value: filters.minDepth, operator: '>' as const }] : [])
        ]
      });

      // Update analysis data to match filtered results
      const filteredWellData = filtered.map(record => ({
        name: record.name,
        type: record.type,
        depth: record.depth || 'Unknown',
        location: record.location || 'Unknown',
        operator: record.operator || 'Unknown',
        coordinates: [record.longitude || 0, record.latitude || 0] as [number, number],
        category: 'search_result',
        dataSource: 'OSDU'
      }));

      setAnalysisData(filteredWellData);

      // 🔥 FIX: Update map with filtered OSDU data
      const filteredGeoJSON = {
        type: "FeatureCollection" as const,
        features: filtered.map((record, index) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [record.longitude || 0, record.latitude || 0]
          },
          properties: {
            name: record.name,
            type: record.type,
            depth: record.depth || 'Unknown',
            location: record.location || 'Unknown',
            operator: record.operator || 'Unknown',
            category: 'osdu',
            dataSource: 'OSDU',
            id: record.id || `osdu-${index}`
          }
        }))
      };

      // Update map state
      const coordinates = filtered.map(r => [r.longitude || 0, r.latitude || 0]);
      const bounds = coordinates.length > 0 ? {
        minLon: Math.min(...coordinates.map(c => c[0])),
        maxLon: Math.max(...coordinates.map(c => c[0])),
        minLat: Math.min(...coordinates.map(c => c[1])),
        maxLat: Math.max(...coordinates.map(c => c[1]))
      } : null;

      setMapState(prev => ({
        ...prev,
        wellData: filteredGeoJSON,
        bounds,
        hasSearchResults: true
      }));

      // Update map immediately if on map panel
      if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
        logger.info('🗺️ Updating map with filtered OSDU data:', filtered.length, 'wells');
        mapComponentRef.current.updateMapData(filteredGeoJSON);
        
        if (bounds && mapComponentRef.current.fitBounds) {
          setTimeout(() => {
            mapComponentRef.current.fitBounds(bounds);
          }, 300);
        }
      }

      // Build filter description
      const filterParts: string[] = [];
      if (filters.locations.length > 0) filterParts.push(`location: ${filters.locations.join(', ')}`);
      if (filters.operators.length > 0) filterParts.push(`operator: ${filters.operators.join(', ')}`);
      if (filters.wellPrefixes.length > 0) filterParts.push(`well prefix: ${filters.wellPrefixes.join(', ')}`);
      if (filters.minDepth) filterParts.push(`depth > ${filters.minDepth}${filters.depthUnit}`);

      return {
        success: true,
        filteredCount: filtered.length,
        originalCount: recordsToFilter.length,
        filterDescription: filterParts.join(', ')
      };
    }

    return { success: false, filteredCount: 0, originalCount: 0, filterDescription: 'No context available' };
  }, [catalogContext, osduContext, parseFilterQuery]);

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
            // DON'T clear map - that causes flash to default center
            // Just update data and bounds directly
            
            // Restore well data first
            if (mapState.wellData && mapComponentRef.current.updateMapData) {
              logger.info('🔍 DEBUG: Restoring map with wellData:', {
                featureCount: mapState.wellData.features?.length || 0,
                firstFeature: mapState.wellData.features?.[0],
                allFeatureNames: mapState.wellData.features?.slice(0, 5).map((f: any) => f.properties?.name)
              });
              mapComponentRef.current.updateMapData(mapState.wellData);

              // Then restore bounds immediately with requestAnimationFrame
              if (mapState.bounds && mapComponentRef.current.fitBounds) {
                requestAnimationFrame(() => {
                  logger.debug('Calling fitBounds...');
                  mapComponentRef.current.fitBounds(mapState.bounds);
                  logger.info('Map state restoration complete');
                });
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

      // OLD FILTERING CODE REMOVED - Using new unified approach above
      // (Removed ~600 lines of old OSDU filtering logic)

      // Enhanced context determination for filtering (catalog search only)
      const isFirstQuery = !analysisData || analysisData.length === 0;
      const lowerPrompt = prompt.toLowerCase().trim();

      // Clear catalog context on new search (not a filter operation)
      if (isFirstQuery) {
        logger.info('🧹 Clearing catalog context - starting new search');
        setCatalogContext(null);
      }

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

      // Detect "show all" or "reset" commands to restore original context
      const resetKeywords = ['show all', 'reset', 'clear filter', 'remove filter', 'all wells'];
      const isResetCommand = resetKeywords.some(keyword => lowerPrompt.includes(keyword));

      if (isResetCommand && catalogContext && catalogContext.filteredRecords) {
        logger.info('🔄 Reset command detected - restoring original catalog context');
        
        // Restore original unfiltered records
        setCatalogContext({
          ...catalogContext,
          filteredRecords: undefined,
          activeFilters: []
        });

        // Restore analysis data to original records
        const restoredWellData = catalogContext.records.map(record => ({
          name: record.name,
          type: record.type,
          depth: record.depth?.toString() || 'Unknown',
          location: record.location || 'Unknown',
          operator: record.operator || 'Unknown',
          coordinates: [record.longitude || 0, record.latitude || 0] as [number, number],
          category: 'search_result',
          dataSource: 'catalog'
        }));

        setAnalysisData(restoredWellData);

        const resetMessage: Message = {
          id: uuidv4() as any,
          role: "ai" as any,
          content: {
            text: `**🔄 Filters Cleared**\n\nRestored all **${catalogContext.recordCount} wells** from original search.\n\nAll filters have been removed and the complete dataset is now displayed.`
          } as any,
          responseComplete: true as any,
          createdAt: new Date().toISOString() as any,
          chatSessionId: '' as any,
          owner: '' as any
        } as any;

        setMessages(prevMessages => [...prevMessages, resetMessage]);
        setIsLoadingMapData(false);
        return;
      }

      // UNIFIED FILTER DETECTION - Check if this is a filter operation
      const filterIntent = detectFilterIntent(prompt);
      
      if (filterIntent.hasFilterIntent && !filterIntent.isResetCommand && filterIntent.contextType !== 'none') {
        logger.info('🎯 FILTER INTENT DETECTED - Applying client-side filter');
        
        const filterResult = applyContextFilter(prompt, filterIntent.contextType);
        
        if (filterResult.success) {
          const filterMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `**🔍 Filtered Results**\n\nFiltered from **${filterResult.originalCount} wells** down to **${filterResult.filteredCount} wells**.\n\n**Active Filters:** ${filterResult.filterDescription}\n\n💡 Say "show all" to restore the original ${filterResult.originalCount} wells.`
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          } as any;

          setMessages(prevMessages => [...prevMessages, filterMessage]);
          setIsLoadingMapData(false);
          return; // Stop here - analysisData is already updated, table will render
        }
      }

      // Detect if this should be a filter operation on existing data
      const filterKeywords = ['filter', 'depth', 'greater than', '>', 'deeper', 'show wells with', 'wells with'];
      const isLikelyFilter = !isFirstQuery && filterKeywords.some(keyword => lowerPrompt.includes(keyword));

      logger.info('🔍 Context Analysis:', {
        isFirstQuery,
        isLikelyFilter,
        isResetCommand,
        hasExistingData: !!analysisData,
        existingWellCount: analysisData?.length || 0,
        hasCatalogContext: !!catalogContext,
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

      // Check for OSDU intent - if detected, call OSDU API directly
      const isOSDUQuery = lowerPrompt.includes('osdu');
      
      if (isOSDUQuery) {
        logger.info('🔍 OSDU QUERY DETECTED - Calling OSDU API directly');
        
        try {
          const osduResponse = await searchOSDU(prompt, 1000);
          
          logger.info('✅ OSDU API Response:', {
            recordCount: osduResponse.recordCount,
            hasError: !!osduResponse.error
          });
          
          // Handle OSDU response
          if (osduResponse.error) {
            // Show error message
            const errorMessage: Message = {
              id: uuidv4() as any,
              role: "ai" as any,
              content: {
                text: `❌ **OSDU Search Error**\n\n${osduResponse.answer}\n\n**Details:** ${osduResponse.error}\n\n**Suggestions:**\n- Contact your administrator to set up OSDU integration\n- Verify the OSDU API configuration\n- Check system status with your IT team\n\n💡 **Alternative:** Try a regular catalog search by removing "OSDU" from your query to search local data instead.`
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
          
          // Convert OSDU records to GeoJSON for map display
          const wellsWithCoords = osduResponse.records.filter((r: any) => r.latitude && r.longitude);
          
          logger.info('🗺️ Converting OSDU records to GeoJSON:', {
            totalRecords: osduResponse.recordCount,
            withCoordinates: wellsWithCoords.length
          });
          
          const osduGeoJSON = {
            type: "FeatureCollection" as const,
            features: wellsWithCoords.map((record: any, index: number) => ({
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: [record.longitude, record.latitude]
              },
              properties: {
                name: record.name || `OSDU Record ${index + 1}`,
                type: record.type || 'OSDU Well',
                operator: record.operator || 'Unknown',
                location: record.location || record.basin || record.country || 'Unknown',
                depth: record.depth || 'Unknown',
                status: record.status || 'Unknown',
                dataSource: 'OSDU',
                category: 'osdu',
                id: record.id || `osdu-${index}`
              }
            }))
          };
          
          // Create table data for chat display
          const tableItems = wellsWithCoords.map((record: any, index: number) => ({
            id: record.id || `osdu-${index}`,
            name: record.name || `OSDU Record ${index + 1}`,
            type: record.type || 'OSDU Well',
            location: record.location || record.basin || record.country || 'Unknown',
            depth: record.depth || 'Unknown',
            operator: record.operator || 'Unknown',
            dataSource: 'OSDU'
          }));
          
          // Create success message with table data
          const messageText = `✅ **OSDU Search Complete**\n\n${osduResponse.answer}\n\nFound **${osduResponse.recordCount} records** (${wellsWithCoords.length} with map coordinates).\n\n**📊 OSDU Data Table:**\n\n\`\`\`json-table-data\n${JSON.stringify(tableItems, null, 2)}\n\`\`\`\n\n🗺️ *Records displayed on map with OSDU data source attribution.*`;
          
          const successMessage: Message = {
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
          
          setMessages(prevMessages => [...prevMessages, successMessage]);
          
          // Update map with OSDU results
          if (wellsWithCoords.length > 0) {
            // Calculate bounds
            const coordinates = wellsWithCoords.map((r: any) => [r.longitude, r.latitude]);
            const bounds = {
              minLon: Math.min(...coordinates.map(c => c[0])),
              maxLon: Math.max(...coordinates.map(c => c[0])),
              minLat: Math.min(...coordinates.map(c => c[1])),
              maxLat: Math.max(...coordinates.map(c => c[1]))
            };
            
            const centerLon = (bounds.minLon + bounds.maxLon) / 2;
            const centerLat = (bounds.minLat + bounds.maxLat) / 2;
            
            logger.info('🗺️ Saving OSDU map state:', {
              center: [centerLon, centerLat],
              bounds,
              wellCount: wellsWithCoords.length
            });
            
            // Save map state
            setMapState({
              center: [centerLon, centerLat],
              zoom: 5,
              bounds,
              wellData: osduGeoJSON,
              hasSearchResults: true
            });
            
            // Update map if on map panel
            if (selectedId === "seg-1" && mapComponentRef.current?.updateMapData) {
              mapComponentRef.current.updateMapData(osduGeoJSON);
              
              // Fit bounds after short delay
              setTimeout(() => {
                if (mapComponentRef.current?.fitBounds) {
                  mapComponentRef.current.fitBounds(bounds);
                }
              }, 500);
            }
            
            // Update analysis data
            const analysisWellData = wellsWithCoords.map((record: any) => ({
              name: record.name || 'Unknown',
              type: record.type || 'OSDU Well',
              depth: record.depth || 'Unknown',
              location: record.location || record.basin || record.country || 'Unknown',
              operator: record.operator || 'Unknown',
              coordinates: [record.longitude, record.latitude] as [number, number],
              dataSource: 'OSDU',
              category: 'osdu'
            }));
            
            setAnalysisData(analysisWellData);
            setAnalysisQueryType('osdu');
            
            logger.info('✅ OSDU data integrated:', {
              mapFeatures: osduGeoJSON.features.length,
              analysisRecords: analysisWellData.length
            });
          }
          
          setIsLoadingMapData(false);
          return;
          
        } catch (osduError) {
          logger.error('❌ OSDU API Error:', osduError);
          
          const errorMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `❌ **OSDU Search Failed**\n\nUnable to search OSDU data at this time.\n\n**Error:** ${osduError instanceof Error ? osduError.message : String(osduError)}\n\n💡 **Alternative:** Try a regular catalog search by removing "OSDU" from your query.`
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

          // Store catalog search context for conversational filtering
          const catalogRecords: CatalogRecord[] = wellFeatures.map((feature: any) => ({
            id: feature.properties?.id || feature.properties?.name || `well-${Math.random()}`,
            name: feature.properties?.name || 'Unknown Well',
            type: feature.properties?.type || 'Unknown',
            operator: feature.properties?.operator,
            location: feature.properties?.location,
            depth: typeof feature.properties?.depth === 'number' ? feature.properties.depth : undefined,
            depthUnit: feature.properties?.depthUnit || 'm',
            wellName: feature.properties?.name,
            dataSource: 'catalog',
            latitude: feature.geometry?.coordinates?.[1],
            longitude: feature.geometry?.coordinates?.[0],
            properties: feature.properties
          }));

          setCatalogContext({
            query: prompt,
            timestamp: new Date(),
            recordCount: catalogRecords.length,
            records: catalogRecords,
            filteredRecords: undefined, // No filters applied yet
            activeFilters: []
          });

          logger.info('✅ Updated analysis context and catalog context:', {
            wellCount: analysisWellData.length,
            queryType: geoJsonData.metadata?.queryType || 'general',
            isContextualFilter: geoJsonData.metadata?.contextFilter || false,
            catalogContextRecords: catalogRecords.length
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
          <div className="reset-chat-left">
            <Typography variant="h6">Data Catalog - All Data</Typography>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                      height="24"
                      viewBox="0 0 24 24"
                      width="24"
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
                      height="24"
                      viewBox="0 0 24 24"
                      width="24"
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
          </div>
          {/* right grid with breadcrumbs and ctas */}
          <div className="reset-chat-right">
            <div className="breadcrumb-container" style={{ marginLeft: '23px' }}>
              <div className="breadcrumb-links">
                <span className="current">Data Catalog › All Data</span>
              </div>
            </div>
            <div className='toggles'>
              <Tooltip title="Start New Session">
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
            <div className='panel'>
              <MapComponent
                ref={mapComponentRef}
                mapColorScheme={mapColorScheme}
                onPolygonCreate={handlePolygonCreate}
                onPolygonDelete={handlePolygonDelete}
                onPolygonUpdate={handlePolygonUpdate}
              />
            </div>
          ) : selectedId === "seg-2" ? (
            // Data Analysis & Visualization Panel
            <div className='panel'>
              <Container
                footer=""
                header={
                  <SpaceBetween direction="horizontal" size="m" alignItems="center">
                    <CloudscapeBox variant="h2">Data Analysis & Visualization</CloudscapeBox>
                  </SpaceBetween>
                }
              >
                <div style={{ overflowY: 'auto', flex: 1, position: 'relative' }}>
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
            <div style={{ width: '100%', position: 'relative' }}>
              <div>

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
