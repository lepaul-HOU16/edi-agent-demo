'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, BreadcrumbGroup, Cards, Container, ContentLayout, Grid, Header, SpaceBetween, Table, Box, Button, Pagination, SegmentedControl } from '@cloudscape-design/components';
import { useTheme, IconButton, Tooltip, List, ListItem, useMediaQuery } from '@mui/material';
import FileDrawer from '@/components/FileDrawer';
import FolderIcon from '@mui/icons-material/Folder';
import RestartAlt from '@mui/icons-material/RestartAlt';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CatalogChatBoxCloudscape from "@/components/CatalogChatBoxCloudscape";
import ChatMessage from '@/components/ChatMessage';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { sendMessage } from '../../../utils/amplifyUtils';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../../utils/types';
import { PropertyFilterProperty } from '@cloudscape-design/collection-hooks';
import { withAuth } from '@/components/WithAuth';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// Import MapComponent directly - handle SSR with conditional rendering instead
import MapComponentBase from './MapComponent';

// Create a wrapper component that handles SSR without dynamic imports
interface MapComponentProps {
  mapColorScheme: 'Light' | 'Dark';
  onPolygonCreate: (polygon: PolygonFilter) => void;
  onPolygonDelete: (deletedIds: string[]) => void;
  onPolygonUpdate: (updatedPolygon: PolygonFilter) => void;
}

const MapComponent = React.forwardRef<any, MapComponentProps>((props, ref) => {
  const [isClient, setIsClient] = React.useState(false);

  // Only render on client side to prevent SSR issues
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading map...</div>;
  }

  return <MapComponentBase {...props} ref={ref} />;
});

// Add display name for better debugging
MapComponent.displayName = 'MapComponent';

// AWS configuration for Amazon Location Service
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";
const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
const mapName = "EdiTestMap";
const style = "Standard";

// GeoJSON types
interface GeoJSONData {
  wells: any | null;
  seismic: any | null;
}

// Polygon management types
interface PolygonFilter {
  id: string;
  geometry: GeoJSON.Polygon;
  name?: string;
  metadata?: any;
  createdAt: Date;
  area?: number; // in square kilometers
}

// Context management types
interface SearchContext {
  data: any; // GeoJSON FeatureCollection
  originalQuery: string;
  appliedFilters: string[];
  timestamp: Date;
  recordCount: number;
  queryType: string;
  activePolygons?: PolygonFilter[]; // Active polygons for this search context
}

interface ContextualQuery {
  isContextual: boolean;
  operation: 'filter' | 'sort' | 'highlight' | 'new';
  filterType?: 'depth' | 'operator' | 'type' | 'location' | 'name' | 'polygon';
  filterValue?: any;
  polygonId?: string; // Reference to active polygon
  originalQuery: string;
}

function CatalogPageBase() {
  const [selectedId, setSelectedId] = useState("seg-1");
  const amplifyClient = React.useMemo(() => generateClient<Schema>(), []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<Schema["ChatSession"]["createType"]>({ id: "default" } as Schema["ChatSession"]["createType"]);
  
  // Map data state
  const [mapData, setMapData] = useState<GeoJSONData>({ wells: null, seismic: null });
  const [isLoadingMapData, setIsLoadingMapData] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Context management state
  const [currentContext, setCurrentContext] = useState<SearchContext | null>(null);
  const [contextHistory, setContextHistory] = useState<SearchContext[]>([]);
  
  // Polygon management state
  const [polygons, setPolygons] = useState<PolygonFilter[]>([]);
  const [activePolygon, setActivePolygon] = useState<PolygonFilter | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  
  // Table data state for the main table
  const [currentTableData, setCurrentTableData] = useState<any[]>([]);
  
  // Drawer variant only matters for mobile now
  const drawerVariant = "temporary";

  // Reference to MapComponent
  const mapComponentRef = React.useRef<any>(null);

  // Simplified polygon event handlers - removing complex debugging that may be causing issues
  const handlePolygonCreate = useCallback((polygon: PolygonFilter) => {
    setPolygons(prev => [...prev, polygon]);
    setActivePolygon(polygon);
    console.log('Polygon created:', polygon);
  }, []);

  const handlePolygonDelete = useCallback((deletedIds: string[]) => {
    setPolygons(prev => prev.filter(p => !deletedIds.includes(p.id)));
    setActivePolygon(null);
    console.log('Polygons deleted:', deletedIds);
  }, []);

  const handlePolygonUpdate = useCallback((updatedPolygon: PolygonFilter) => {
    setPolygons(prev => prev.map(p => 
      p.id === updatedPolygon.id ? updatedPolygon : p
    ));
    console.log('Polygon updated:', updatedPolygon.id);
  }, []);

  // Function to apply polygon filtering to wells
  const applyPolygonFilter = (wells: any, polygon: PolygonFilter): any => {
    console.log('🗺️ STARTING POLYGON FILTER ANALYSIS');
    console.log('🗺️ Input wells count:', wells?.features?.length || 0);
    console.log('🗺️ Polygon geometry:', JSON.stringify(polygon.geometry, null, 2));
    console.log('🗺️ Polygon area:', polygon.area, 'km²');
    
    if (!wells || !wells.features) {
      console.warn('⚠️ applyPolygonFilter: Invalid wells data structure');
      return wells;
    }
    
    // Log first few wells for coordinate analysis
    if (wells.features.length > 0) {
      console.log('🗺️ Sample well coordinates:');
      wells.features.slice(0, 5).forEach((well: any, i: number) => {
        console.log(`  ${i + 1}. ${well.properties?.name || 'Unknown'}: [${well.geometry?.coordinates?.[0]}, ${well.geometry?.coordinates?.[1]}] (lng,lat)`);
      });
    }
    
    const filteredFeatures = wells.features.filter((well: any, index: number) => {
      // Safety check for well structure
      if (!well || !well.geometry || !well.geometry.coordinates) {
        console.warn('⚠️ applyPolygonFilter: Skipping well with invalid geometry');
        return false;
      }
      
      try {
        const isInside = booleanPointInPolygon(well.geometry, polygon.geometry);
        
        // Log details for first few wells
        if (index < 5) {
          console.log(`🗺️ Well ${index + 1} (${well.properties?.name || 'Unknown'}):`, {
            coordinates: well.geometry.coordinates,
            geometry: well.geometry,
            isInside: isInside
          });
        }
        
        return isInside;
      } catch (error) {
        console.warn('⚠️ applyPolygonFilter: Error checking point in polygon:', error);
        console.warn('  - Well geometry:', well.geometry);
        console.warn('  - Polygon geometry:', polygon.geometry);
        return false;
      }
    });
    
    console.log('🗺️ POLYGON FILTER RESULTS:');
    console.log('  - Original wells:', wells.features.length);
    console.log('  - Wells inside polygon:', filteredFeatures.length);
    console.log('  - Filtered percentage:', Math.round((filteredFeatures.length / wells.features.length) * 100) + '%');
    
    if (filteredFeatures.length > 0) {
      console.log('🗺️ Wells that passed filter:');
      filteredFeatures.slice(0, 3).forEach((well: any, i: number) => {
        console.log(`  ✅ ${i + 1}. ${well.properties?.name || 'Unknown'}: [${well.geometry.coordinates[0]}, ${well.geometry.coordinates[1]}]`);
      });
    }
    
    return {
      ...wells,
      features: filteredFeatures,
      metadata: {
        ...wells.metadata,
        recordCount: filteredFeatures.length,
        filtered: true,
        originalCount: wells.features.length,
        polygonFilter: {
          id: polygon.id,
          name: polygon.name,
          area: polygon.area
        }
      }
    };
  };

  // Function to detect if query is contextual (filter) vs new search
  const analyzeQuery = useCallback((query: string): ContextualQuery => {
    const lowerQuery = query.toLowerCase().trim();
    
    console.log('🎯 QUERY ANALYSIS:', {
      query: lowerQuery,
      hasActivePolygon: !!activePolygon,
      hasContext: !!currentContext,
      activePolygonId: activePolygon?.id
    });
    
    // Check for polygon queries
    const polygonFilterPatterns = [
      /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
      /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
      /(?:polygon|area)\s*(?:filter|selection)/i,
      /(?:find|search|show).*wells?.*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i
    ];
    
    const isPolygonQuery = polygonFilterPatterns.some(pattern => pattern.test(lowerQuery));
    
    // EXISTING FUNCTIONALITY: Polygon filter on existing context
    if (isPolygonQuery && activePolygon && currentContext && currentContext.data && currentContext.data.features?.length > 0) {
      console.log('🎯 POLYGON FILTER ON EXISTING CONTEXT');
      return {
        isContextual: true,
        operation: 'filter',
        filterType: 'polygon' as any,
        filterValue: activePolygon.id,
        polygonId: activePolygon.id,
        originalQuery: query
      };
    }
    
    // NEW FUNCTIONALITY: Polygon-first search (no existing context)
    if (isPolygonQuery && activePolygon && (!currentContext || !currentContext.data || !currentContext.data.features?.length)) {
      console.log('🎯 POLYGON-FIRST SEARCH DETECTED');
      return {
        isContextual: false, // Treat as new search, not filter
        operation: 'new',
        filterType: 'polygon' as any,
        filterValue: 'polygon_first_search', // Clear flag for new feature
        polygonId: activePolygon.id,
        originalQuery: query
      };
    }
    
    // Rest of the normal logic only if not a polygon query
    const filterPatterns = [
      // Depth filters
      /(?:depth|deep|deeper)\s*(?:greater|more|above|over|\>)\s*(?:than\s*)?(\d+)/i,
      /(?:depth|deep)\s*(?:less|under|below|\<)\s*(?:than\s*)?(\d+)/i,
      /(?:show|filter|find).*(?:depth|deep).*(\d+)/i,
      
      // Operator filters
      /(?:operated by|operator|by)\s*([A-Za-z\s]+)/i,
      /(?:show|filter|find).*(?:shell|petronas|cnooc|pertamina|pvep|vietsovpetro|petrovietnam)/i,
      
      // Type filters
      /(?:show|filter|find).*(?:production|exploration).*wells/i,
      /(?:only|just).*(?:production|exploration)/i,
      
      // Location filters
      /(?:in|from|at)\s*(vietnam|malaysia|brunei|philippines|china)/i,
      
      // Generic contextual indicators
      /(?:from these|of those|in current|these wells|current wells|existing wells)/i,
      /(?:filter|show only|narrow down|refine)/i
    ];

    // Check if we have current context and if query matches filter patterns
    const hasContext = currentContext && currentContext.data && currentContext.data.features?.length > 0;
    const isFilterPattern = filterPatterns.some(pattern => pattern.test(lowerQuery));

    // New search patterns that should reset context (but only if they don't contain filter words)
    const newSearchPatterns = [
      /^(?:show|find|search)(?:\s+me)?(?:\s+all)?\s+wells\s*$/i, // Only if it's just "show me wells" without additional criteria
      /(?:show|find|get).*wells.*(?:vietnam|malaysia|brunei|philippines|china)/i,
      /my wells|personal wells|user wells/i,
      /wells.*(?:south china sea|scs)/i
    ];

    // Check if it's a pure new search (no filter patterns) or contains filter patterns
    const isNewSearch = newSearchPatterns.some(pattern => pattern.test(lowerQuery)) && !isFilterPattern;
    
    // If no context, treat as new search
    if (!hasContext) {
      return {
        isContextual: false,
        operation: 'new',
        originalQuery: query
      };
    }

    // If has context and explicit new search (without filter patterns), reset context
    if (hasContext && isNewSearch) {
      return {
        isContextual: false,
        operation: 'new',
        originalQuery: query
      };
    }
    
    // If has context and matches filter patterns, treat as contextual
    if (hasContext && isFilterPattern) {
      // Determine filter type and value
      let filterType: 'depth' | 'operator' | 'type' | 'location' | 'name' = 'depth';
      let filterValue: any = null;

      // Depth filters
      const depthGreaterMatch = lowerQuery.match(/(?:depth|deep|deeper)\s*(?:greater|more|above|over|\>)\s*(?:than\s*)?(\d+)/i);
      const depthLessMatch = lowerQuery.match(/(?:depth|deep)\s*(?:less|under|below|\<)\s*(?:than\s*)?(\d+)/i);
      
      if (depthGreaterMatch) {
        filterType = 'depth';
        filterValue = { operator: '>', value: parseInt(depthGreaterMatch[1]) };
      } else if (depthLessMatch) {
        filterType = 'depth';
        filterValue = { operator: '<', value: parseInt(depthLessMatch[1]) };
      }
      
      // Operator filters
      const operatorMatch = lowerQuery.match(/(?:operated by|operator|by)\s*([A-Za-z\s]+)/i) ||
                           lowerQuery.match(/(shell|petronas|cnooc|pertamina|pvep|vietsovpetro|petrovietnam)/i);
      if (operatorMatch) {
        filterType = 'operator';
        filterValue = operatorMatch[1].trim();
      }
      
      // Type filters
      if (lowerQuery.includes('production')) {
        filterType = 'type';
        filterValue = 'Production';
      } else if (lowerQuery.includes('exploration')) {
        filterType = 'type';
        filterValue = 'Exploration';
      }
      
      // Location filters
      const locationMatch = lowerQuery.match(/(?:in|from|at)\s*(vietnam|malaysia|brunei|philippines|china)/i);
      if (locationMatch) {
        filterType = 'location';
        filterValue = locationMatch[1].toLowerCase();
      }
      
      // Polygon filters - check this FIRST before other filters
      const polygonFilterPatterns = [
        /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
        /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
        /(?:polygon|area)\s*(?:filter|selection)/i
      ];
      
      const isPolygonFilter = polygonFilterPatterns.some(pattern => pattern.test(lowerQuery));
      if (isPolygonFilter && activePolygon) {
        console.log('🎯 Detected polygon filter with active polygon');
        filterType = 'polygon' as any;
        filterValue = activePolygon.id;
        
        return {
          isContextual: true,
          operation: 'filter',
          filterType,
          filterValue,
          polygonId: activePolygon.id,
          originalQuery: query
        };
      }

      return {
        isContextual: true,
        operation: 'filter',
        filterType,
        filterValue,
        polygonId: isPolygonFilter ? activePolygon?.id : undefined,
        originalQuery: query
      };
    }
    
    // Default to new search
    return {
      isContextual: false,
      operation: 'new',
      originalQuery: query
    };
  }, [currentContext, activePolygon, polygons]);

  // Function to apply filters to current context data
  const applyContextualFilter = (contextData: any, filterType: string, filterValue: any): any => {
    console.log('🔧 APPLYING CONTEXTUAL FILTER:');
    console.log('  Filter type:', filterType);
    console.log('  Filter value:', filterValue);
    console.log('  Input data source:', contextData?.metadata?.source);
    console.log('  Input feature count:', contextData?.features?.length || 0);
    console.log('  Sample input wells:', contextData?.features?.slice(0, 3)?.map((f: any) => ({
      name: f?.properties?.name || 'Unknown',
      depth: f?.properties?.depth || 'Unknown',
      operator: f?.properties?.operator || f?.properties?.dataSource || 'Unknown'
    })) || []);
    
    if (!contextData || !contextData.features) {
      console.log('❌ No context data to filter');
      return contextData;
    }
    
    let filteredFeatures = [...contextData.features];
    
    switch (filterType) {
      case 'depth':
        console.log('🔧 Applying depth filter...');
        const beforeDepthFilter = filteredFeatures.length;
        
        filteredFeatures = filteredFeatures.filter(feature => {
          // Safety check for feature properties
          if (!feature || !feature.properties) {
            console.warn('  ⚠️ Skipping feature with null/undefined properties');
            return false;
          }
          
          // Safety check for filterValue
          if (!filterValue || !filterValue.operator || typeof filterValue.value !== 'number') {
            console.warn('  ⚠️ Invalid depth filter value:', filterValue);
            return true; // Return all features if filter is invalid
          }
          
          const depthStr = feature.properties.depth || '0';
          const depth = parseInt(depthStr.replace(/[^\d]/g, ''));
          
          const passes = filterValue.operator === '>' 
            ? depth > filterValue.value 
            : filterValue.operator === '<' 
              ? depth < filterValue.value 
              : true;
              
          if (passes) {
            console.log(`  ✅ ${feature.properties.name || 'Unknown'}: ${depthStr} → ${depth} (passes ${filterValue.operator} ${filterValue.value})`);
          }
          
          return passes;
        });
        
        console.log(`🔧 Depth filter results: ${beforeDepthFilter} → ${filteredFeatures.length} wells`);
        break;
        
      case 'operator':
        const targetOperator = filterValue.toLowerCase();
        filteredFeatures = filteredFeatures.filter(feature => {
          // Safety check for feature properties
          if (!feature || !feature.properties) {
            console.warn('  ⚠️ Skipping feature with null/undefined properties in operator filter');
            return false;
          }
          
          const operator = (feature.properties.operator || '').toLowerCase();
          return operator.includes(targetOperator) || targetOperator.includes(operator);
        });
        break;
        
      case 'type':
        filteredFeatures = filteredFeatures.filter(feature => {
          // Safety check for feature properties
          if (!feature || !feature.properties) {
            console.warn('  ⚠️ Skipping feature with null/undefined properties in type filter');
            return false;
          }
          
          const type = feature.properties.type || '';
          return type.toLowerCase() === filterValue.toLowerCase();
        });
        break;
        
      case 'location':
        filteredFeatures = filteredFeatures.filter(feature => {
          // Safety check for feature properties
          if (!feature || !feature.properties) {
            console.warn('  ⚠️ Skipping feature with null/undefined properties in location filter');
            return false;
          }
          
          const location = (feature.properties.location || '').toLowerCase();
          const region = (feature.properties.region || '').toLowerCase();
          return location.includes(filterValue) || region.includes(filterValue);
        });
        break;
        
      case 'polygon':
        // Find the polygon by ID and apply spatial filtering
        const targetPolygon = polygons.find(p => p.id === filterValue);
        if (targetPolygon) {
          const polygonFiltered = applyPolygonFilter(contextData, targetPolygon);
          return polygonFiltered;
        }
        // If polygon not found, return unchanged data
        console.warn('Polygon filter requested but polygon not found:', filterValue);
        break;
        
      default:
        // No filtering
        break;
    }
    
    return {
      ...contextData,
      features: filteredFeatures,
      metadata: {
        ...contextData.metadata,
        recordCount: filteredFeatures.length,
        filtered: true,
        originalCount: contextData.features.length
      }
    };
  };

  // Function to save context with enhanced debugging
  const saveContext = useCallback((data: any, query: string, filters: string[] = []) => {
    console.log('🔄 SAVING CONTEXT:');
    console.log('  Query:', query);
    console.log('  Data type:', data?.type);
    console.log('  Feature count:', data?.features?.length || 0);
    console.log('  Data source:', data?.metadata?.source);
    console.log('  Query type:', data?.metadata?.queryType);
    console.log('  Applied filters:', filters);
    
    const context: SearchContext = {
      data,
      originalQuery: query,
      appliedFilters: filters,
      timestamp: new Date(),
      recordCount: data?.features?.length || 0,
      queryType: data?.metadata?.queryType || 'general'
    };
    
    // Log sample data for verification
    if (data?.features?.length > 0) {
      console.log('  Sample wells in new context:');
      data.features.slice(0, 3).forEach((f: any, i: number) => {
        console.log(`    ${i + 1}. ${f.properties?.name} (${f.properties?.depth}, ${f.properties?.operator || f.properties?.dataSource})`);
      });
    }
    
    setCurrentContext(context);
    setContextHistory(prev => [context, ...prev].slice(0, 10)); // Keep last 10 contexts
    
    console.log('✅ Context saved successfully');
  }, []);

  // Function to clear context
  const clearContext = useCallback(() => {
    setCurrentContext(null);
    console.log('Context cleared for new search');
  }, []);

  // Map configuration
  const mapColorScheme = theme.palette.mode === 'dark' ? "Dark" : "Light";


  const handleCreateNewChat = async () => {
    try {
      // Clear the messages state to reset the conversation
      setMessages([]);
      // Clear the table data and context
      setCurrentTableData([]);
      clearContext();
    } catch (error) {
      console.error("Error resetting chat:", error);
      alert("Failed to reset chat.");
    }
  }
  
  // Function to handle user input from chat and send to backend for search
  const handleChatSearch = useCallback(async (prompt: string) => {
    setIsLoadingMapData(true);
    setError(null);
    
    try {
      console.log('🚀 PROCESSING SEARCH FOR PROMPT:', prompt);
      console.log('🚀 POLYGON STATE DEBUG:', {
        activePolygon: activePolygon ? {
          id: activePolygon.id,
          area: activePolygon.area,
          name: activePolygon.name
        } : null,
        polygonsCount: polygons.length,
        allPolygonIds: polygons.map(p => p.id)
      });
      
      // Analyze query to determine if contextual or new search
      const queryAnalysis = analyzeQuery(prompt);
      console.log('🔍 DETAILED QUERY ANALYSIS:', queryAnalysis);
      console.log('🔍 CURRENT CONTEXT STATE:', {
        hasContext: !!currentContext,
        contextQuery: currentContext?.originalQuery || 'none',
        contextRecordCount: currentContext?.recordCount || 0,
        contextDataSource: currentContext?.data?.metadata?.source || 'none',
        contextQueryType: currentContext?.data?.metadata?.queryType || 'none'
      });
      
      let geoJsonData = null;
      
      // Handle NEW FUNCTIONALITY: Polygon-first search (check this FIRST)
      if (queryAnalysis.filterType === 'polygon' && queryAnalysis.filterValue === 'polygon_first_search' && activePolygon) {
        
        console.log('🎯 PROCESSING POLYGON-FIRST SEARCH');
        console.log('🎯 Query analysis:', queryAnalysis);
        console.log('🎯 Active polygon:', activePolygon?.id);
        
        // Call backend with enhanced query that includes user wells for polygon searches
        let searchResponse;
        try {
          // For polygon searches, we want to include all wells (including user wells)
          const enhancedQuery = prompt.toLowerCase().includes('my wells') 
            ? prompt // Keep original if specifically asking for "my wells"
            : 'all wells in south china sea'; // Get comprehensive dataset for polygon filtering
            
          console.log('🔍 POLYGON-FIRST: Calling backend with enhanced query:', enhancedQuery);
          console.log('🔍 POLYGON-FIRST: Original user query:', prompt);
          
          searchResponse = await amplifyClient.queries.catalogSearch({
            prompt: enhancedQuery
          });
          
          console.log('🔍 POLYGON-FIRST: Backend response received');
        } catch (functionError) {
          console.error('❌ POLYGON-FIRST: Backend call failed:', functionError);
          throw new Error(`Search function failed: ${functionError instanceof Error ? functionError.message : String(functionError)}`);
        }

        // Parse and apply polygon filter
        if (searchResponse.data) {
          try {
            const searchData = typeof searchResponse.data === 'string' 
              ? JSON.parse(searchResponse.data) 
              : searchResponse.data;
              
            console.log('✅ POLYGON-FIRST: Parsed search data, applying polygon filter...');
            
            if (activePolygon) {
              geoJsonData = applyPolygonFilter(searchData, activePolygon);
              const polygonFilterName = `polygon: ${activePolygon.name || activePolygon.id}`;
              saveContext(geoJsonData, prompt, [polygonFilterName]);
            } else {
              console.warn('⚠️ POLYGON-FIRST: No active polygon found');
              geoJsonData = searchData;
              saveContext(geoJsonData, prompt);
            }
            
          } catch (parseError) {
            console.error('❌ POLYGON-FIRST: Parse error:', parseError);
            throw new Error('Invalid response format from search service');
          }
        }
        
      } else if (queryAnalysis.isContextual && queryAnalysis.operation === 'filter' && currentContext) {
        // Handle ALL existing contextual filtering (including working polygon filter)
        console.log('🎯 PROCESSING EXISTING CONTEXTUAL FILTER');
        console.log('🎯 Filter type:', queryAnalysis.filterType);
        console.log('🎯 Filter value:', queryAnalysis.filterValue);
        
        geoJsonData = applyContextualFilter(
          currentContext.data,
          queryAnalysis.filterType!,
          queryAnalysis.filterValue
        );
        
        // Update context with applied filter
        const newFilters = [...currentContext.appliedFilters, `${queryAnalysis.filterType}: ${JSON.stringify(queryAnalysis.filterValue)}`];
        saveContext(geoJsonData, currentContext.originalQuery, newFilters);
      }
      
      // **COMMON TABLE AND MAP UPDATE LOGIC FOR ALL FILTERING OPERATIONS AND POLYGON-FIRST SEARCH**
      if (geoJsonData && (
          (queryAnalysis.isContextual && queryAnalysis.operation === 'filter') ||
          (queryAnalysis.filterType === 'polygon' && queryAnalysis.filterValue === 'polygon_first_search')
        )) {
        console.log('🎯 UPDATING TABLE AND MAP FOR FILTERED RESULTS');
        
        // **UPDATE MAIN TABLE DATA WITH FILTERED RESULTS**
        const filteredTableData = geoJsonData.features
          .filter((feature: any) => feature && feature.properties) // Safety filter
          .map((feature: any, index: number) => ({
            id: `well-${index}`,
            name: feature.properties?.name || 'Unknown Well',
            type: feature.properties?.type || 'Unknown', 
            location: feature.properties?.location || 'Unknown',
            depth: feature.properties?.depth || 'Unknown',
            operator: feature.properties?.operator || 'Unknown'
          }));
        setCurrentTableData(filteredTableData);
        console.log('✅ Updated main table with', filteredTableData.length, 'filtered wells');
        
        // **UPDATE MAP WITH FILTERED DATA**
        console.log('Updating map with filtered data:', geoJsonData.features.length, 'wells');
        if (mapComponentRef.current && geoJsonData) {
          try {
            mapComponentRef.current.updateMapData(geoJsonData);
            
            // Auto-zoom map to fit filtered wells
            if (geoJsonData.features && geoJsonData.features.length > 0) {
              const validCoordinates = geoJsonData.features
                .filter(f => f && f.geometry && f.geometry.coordinates && Array.isArray(f.geometry.coordinates))
                .map(f => f.geometry.coordinates);
              
              if (validCoordinates.length > 0) {
                const bounds = {
                  minLon: Math.min(...validCoordinates.map(coords => coords[0])),
                  maxLon: Math.max(...validCoordinates.map(coords => coords[0])),
                  minLat: Math.min(...validCoordinates.map(coords => coords[1])),
                  maxLat: Math.max(...validCoordinates.map(coords => coords[1]))
                };
              
                // Fit map to filtered bounds with padding
                if (mapComponentRef.current.fitBounds) {
                  mapComponentRef.current.fitBounds(bounds);
                }
              }
            }
            
            console.log('✅ Map updated and zoomed to filtered data');
          } catch (error) {
            console.error('❌ Error updating map with filtered data:', error);
          }
        }
        
      } else if (!geoJsonData) {
        // Handle remaining cases only if no data has been processed yet
        
        // Handle contextual queries without context
        if (queryAnalysis.isContextual && !currentContext) {
          console.log('⚠️ Contextual filter attempted without current data');
          
          // Add helpful message to user
          const noContextMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `**⚠️ No Data to Filter**\n\nYou're trying to apply a filter ("${prompt}") but there's no current dataset loaded.\n\n**To use filters:**\n1. First search for wells: "*Show me all wells in South China Sea*"\n2. Then apply filters: "*wells with depth greater than 3500m*"\n\n💡 *Filters work on existing search results, not as standalone queries.*`
            } as any,
            responseComplete: true as any,
            createdAt: new Date().toISOString() as any,
            chatSessionId: '' as any,
            owner: '' as any
          };
          
          setTimeout(() => {
            setMessages(prevMessages => [...prevMessages, noContextMessage]);
          }, 0);
          
          setIsLoadingMapData(false);
          return null;
        }
        
        // Handle new search
        console.log('🆕 PROCESSING NEW SEARCH QUERY');
        
        // Don't clear context immediately - check if it's actually a new search first
        // Only clear if it's definitely a geography-based new search
        const isGeographicNewSearch = /(?:show|find|get).*wells.*(?:vietnam|malaysia|brunei|philippines|china|south china sea|scs)/i.test(prompt.toLowerCase()) ||
                                     /my wells|personal wells|user wells/i.test(prompt.toLowerCase());
        
        if (isGeographicNewSearch) {
          console.log('🆕 CLEARING CONTEXT for geographic new search');
          clearContext();
        } else {
          console.log('🆕 KEEPING CONTEXT - might be a filter that backend misclassified');
        }
        
        let searchResponse;
        try {
          console.log('🔍 CALLING BACKEND catalogSearch function...');
          console.log('🔍 SEARCH PROMPT:', prompt);
          
          searchResponse = await amplifyClient.queries.catalogSearch({
            prompt: prompt
          });
          
          console.log('🔍 BACKEND RESPONSE RECEIVED:', {
            hasData: !!searchResponse.data,
            dataLength: searchResponse.data ? String(searchResponse.data).length : 0,
            dataType: typeof searchResponse.data
          });
        } catch (functionError) {
          console.error('❌ catalogSearch function error:', functionError);
          // Show the actual error instead of falling back to simulation
          throw new Error(`Search function failed: ${functionError instanceof Error ? functionError.message : String(functionError)}`);
        }

        // Parse the search results
        if (searchResponse.data) {
          try {
            geoJsonData = typeof searchResponse.data === 'string' 
              ? JSON.parse(searchResponse.data) 
              : searchResponse.data;
              
            console.log('✅ PARSED BACKEND DATA:', {
              type: geoJsonData?.type,
              featureCount: geoJsonData?.features?.length || 0,
              dataSource: geoJsonData?.metadata?.source,
              queryType: geoJsonData?.metadata?.queryType,
              sampleWells: geoJsonData?.features?.slice(0, 3)?.map((f: any) => ({
                name: f.properties?.name,
                type: f.properties?.type,
                depth: f.properties?.depth,
                operator: f.properties?.operator || f.properties?.dataSource
              })) || []
            });
            
          } catch (parseError) {
            console.error('❌ Error parsing search response:', parseError);
            throw new Error('Invalid response format from search service');
          }
        }

        if (!geoJsonData) {
          throw new Error('No data received from search service');
        }
        
        // Save context for new search
        console.log('🔄 SAVING NEW SEARCH CONTEXT...');
        saveContext(geoJsonData, prompt);
        
        // **UPDATE MAIN TABLE DATA WITH NEW SEARCH RESULTS**
        const newTableData = geoJsonData.features
          .filter((feature: any) => feature && feature.properties) // Safety filter
          .map((feature: any, index: number) => ({
            id: `well-${index}`,
            name: feature.properties?.name || 'Unknown Well',
            type: feature.properties?.type || 'Unknown', 
            location: feature.properties?.location || 'Unknown',
            depth: feature.properties?.depth || 'Unknown',
            operator: feature.properties?.operator || 'Unknown'
          }));
        
        console.log('🔍 Filtered table data validation:');
        console.log('  - Original features:', geoJsonData.features?.length || 0);
        console.log('  - Valid features after filtering:', newTableData.length);
        console.log('  - Sample data:', newTableData.slice(0, 2));
        setCurrentTableData(newTableData);
        console.log('✅ Updated main table with', newTableData.length, 'new search results');
        console.log('✅ Sample table data:', newTableData.slice(0, 3));
      }
      
      console.log('Processed search results:', geoJsonData);
      
      // Update the map using MapComponent with better error handling
      if (geoJsonData && geoJsonData.type === 'FeatureCollection') {
        console.log('Search returned', geoJsonData.features.length, 'features for map update');
        
        if (mapComponentRef.current) {
          console.log('✅ MapComponent ref is available, calling updateMapData...');
          try {
            mapComponentRef.current.updateMapData(geoJsonData);
            
            // Auto-zoom map to fit all results with padding
            if (geoJsonData.features && geoJsonData.features.length > 0) {
              const validCoordinates = geoJsonData.features
                .filter(f => f && f.geometry && f.geometry.coordinates && Array.isArray(f.geometry.coordinates))
                .map(f => f.geometry.coordinates);
              
              if (validCoordinates.length > 0) {
                const bounds = {
                  minLon: Math.min(...validCoordinates.map(coords => coords[0])),
                  maxLon: Math.max(...validCoordinates.map(coords => coords[0])),
                  minLat: Math.min(...validCoordinates.map(coords => coords[1])),
                  maxLat: Math.max(...validCoordinates.map(coords => coords[1]))
                };
              
                // Fit map to results with padding
                if (mapComponentRef.current.fitBounds) {
                  mapComponentRef.current.fitBounds(bounds);
                }
              }
            }
            
            console.log('✅ Successfully called updateMapData and fitBounds on MapComponent');
          } catch (error) {
            console.error('❌ Error calling updateMapData:', error);
          }
        } else {
          console.warn('⚠️ MapComponent ref is not available yet, retrying in 500ms...');
          // Retry after a short delay if ref isn't ready
          setTimeout(() => {
            if (mapComponentRef.current) {
              console.log('✅ Retry successful - MapComponent ref now available');
              try {
                mapComponentRef.current.updateMapData(geoJsonData);
                console.log('✅ Successfully called updateMapData on retry');
              } catch (error) {
                console.error('❌ Error on retry:', error);
              }
            } else {
              console.error('❌ MapComponent ref still not available after retry');
            }
          }, 500);
        }
      } else {
        console.warn('⚠️ Invalid geoJsonData for map update:', {
          hasData: !!geoJsonData,
          isFeatureCollection: geoJsonData?.type === 'FeatureCollection',
          featureCount: geoJsonData?.features?.length || 0
        });
      }
        
      // Operator logo mapping function
      const getOperatorLogo = (operator: string): string => {
        const logoMap: { [key: string]: string } = {
          'PetroVietnam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Logo_Petrolimex.svg/200px-Logo_Petrolimex.svg.png',
          'Vietsovpetro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vietsovpetro_logo.png/200px-Vietsovpetro_logo.png',
          'PVEP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Logo_Petrolimex.svg/200px-Logo_Petrolimex.svg.png',
          'Petronas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Petronas_Logo.svg/200px-Petronas_Logo.svg.png',
          'Shell Malaysia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Shell_logo.svg/200px-Shell_logo.svg.png',
          'Petronas Carigali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Petronas_Logo.svg/200px-Petronas_Logo.svg.png',
          'BSP': 'https://via.placeholder.com/80x40/0066cc/ffffff?text=BSP',
          'Shell Philippines': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Shell_logo.svg/200px-Shell_logo.svg.png',
          'Forum Energy': 'https://via.placeholder.com/80x40/ff6600/ffffff?text=Forum',
          'Pertamina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Pertamina_logo.svg/200px-Pertamina_logo.svg.png',
          'Medco Energi': 'https://via.placeholder.com/80x40/cc0000/ffffff?text=Medco',
          'CNOOC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/China_National_Offshore_Oil_Corporation_logo.svg/200px-China_National_Offshore_Oil_Corporation_logo.svg.png'
        };
        
        return logoMap[operator] || 'https://via.placeholder.com/80x40/666666/ffffff?text=Oil%26Gas';
      };

      // Skip message generation if no data was processed (safety check)
      if (!geoJsonData) {
        console.warn('⚠️ No geoJsonData available for message generation');
        setIsLoadingMapData(false);
        return null;
      }

      // Generate well cards data that matches the map data
      const wellCardsData = geoJsonData.features
        .filter((feature: any) => feature && feature.properties && feature.geometry) // Safety filter
        .map((feature: any, index: number) => ({
          id: index + 1,
          name: feature.properties?.name || 'Unknown Well',
          type: feature.properties?.type || 'Unknown',
          location: feature.properties?.location || 'Unknown',
          depth: feature.properties?.depth || 'Unknown',
          operator: feature.properties?.operator || 'Unknown',
          latitude: feature.properties?.latitude || feature.geometry?.coordinates?.[1]?.toFixed(6) || 'N/A',
          longitude: feature.properties?.longitude || feature.geometry?.coordinates?.[0]?.toFixed(6) || 'N/A',
          region: feature.properties?.region || 'South China Sea',
          dataSource: feature.properties?.dataSource || 'OSDU Platform',
          logoUrl: getOperatorLogo(feature.properties?.operator || 'Unknown')
        }));
      
      // Create Cloudscape Table data
      const tableItems = wellCardsData.map((well, index) => ({
        id: `well-${index}`,
        name: well.name,
        type: well.type,
        location: well.location,
        depth: well.depth,
        operator: well.operator
      }));

      // Create markdown-compatible visual well cards as condensed graphics
      const wellCardsMarkdown = wellCardsData.map((well, index) => {
        const typeIcon = well.type === 'Production' ? '🟢' : '🔵';
        const depthValue = parseInt(well.depth.replace(/[^\d]/g, ''));
        const isDeep = depthValue > 4000;
        const depthIcon = isDeep ? '🔥' : '⚡';
        
        return `
**${typeIcon} ${well.name}** *(${well.type})*  
📍 **Location:** ${well.location}  
${depthIcon} **Depth:** ${well.depth}  
🏢 **Operator:** ${well.operator}  
🌐 **Coordinates:** ${well.latitude}°N, ${well.longitude}°E  
---`;
      }).join('\n\n');

      // Create a compact summary table for all wells
      const wellSummaryTable = `
| Well | Type | Depth | Operator | Location |
|------|------|-------|----------|----------|
${wellCardsData.map(well => {
        const typeIcon = well.type === 'Production' ? '🟢' : '🔵';
        const depthValue = parseInt(well.depth.replace(/[^\d]/g, ''));
        const depthIcon = depthValue > 4000 ? '🔥' : '⚡';
        return `| ${typeIcon} ${well.name} | ${well.type} | ${depthIcon} ${well.depth} | ${well.operator} | ${well.location} |`;
      }).join('\n')}
`;

      // Create contextual information
      let contextualInfo = '';
      
      // Handle polygon-first search case (NEW FUNCTIONALITY)
      if (queryAnalysis.filterType === 'polygon' && queryAnalysis.filterValue === 'polygon_first_search' && activePolygon && geoJsonData.metadata?.polygonFilter) {
        const originalCount = geoJsonData.metadata?.originalCount || 0;
        const filteredCount = geoJsonData.features.length;
        
        contextualInfo = `\n**🗺️ Polygon-First Search Applied:**\n` +
          `• **Search Query:** "${prompt}"\n` +
          `• **Polygon Area:** ${activePolygon.area?.toFixed(2)} km² (${activePolygon.name || activePolygon.id})\n` +
          `• **Search & Filter:** Found wells in South China Sea, then spatially filtered\n` +
          `• **Total Found:** ${originalCount} wells in region\n` +
          `• **Within Polygon:** ${filteredCount} wells (${originalCount > 0 ? Math.round((filteredCount/originalCount)*100) : 0}% of regional wells)\n` +
          `• **Well Density:** ${(filteredCount / (activePolygon.area || 1)).toFixed(2)} wells/km²\n\n` +
          `💡 *You can now apply additional filters like "depth greater than 4000m" or "operated by Shell" to these polygon-filtered results.*\n\n`;
          
      } else if (queryAnalysis.isContextual && currentContext) {
        const originalCount = currentContext.data?.metadata?.originalCount || currentContext.data?.features?.length || 0;
        const filteredCount = geoJsonData.features.length;
        
        // Special handling for polygon filters
        if (queryAnalysis.filterType === 'polygon' && activePolygon && geoJsonData.metadata?.polygonFilter) {
          contextualInfo = `\n**🗺️ Polygon Area Filter Applied:**\n` +
            `• **Original Dataset:** ${originalCount} wells\n` +
            `• **Polygon Area:** ${activePolygon.area?.toFixed(2)} km² (${activePolygon.name})\n` +
            `• **Spatial Filter:** Wells within polygon boundary\n` +
            `• **Filtered Result:** ${filteredCount} wells (${Math.round((filteredCount/originalCount)*100)}% of original)\n` +
            `• **Wells per km²:** ${(filteredCount / (activePolygon.area || 1)).toFixed(2)} wells/km²\n` +
            `• **Applied Filters:** ${currentContext.appliedFilters.join(', ')}\n\n` +
            `💡 *You can draw additional polygons or combine with other filters like "depth greater than 4000m" within this area.*\n\n`;
        } else {
          contextualInfo = `\n**🎯 Contextual Filter Applied:**\n` +
            `• **Original Dataset:** ${originalCount} wells\n` +
            `• **Filter:** ${queryAnalysis.filterType} ${queryAnalysis.filterType === 'depth' ? 
              `${queryAnalysis.filterValue?.operator} ${queryAnalysis.filterValue?.value}m` : 
              `= ${queryAnalysis.filterValue}`}\n` +
            `• **Filtered Result:** ${filteredCount} wells (${Math.round((filteredCount/originalCount)*100)}% of original)\n` +
            `• **Applied Filters:** ${currentContext.appliedFilters.join(', ')}\n\n` +
            `💡 *Try additional filters like "show only Shell wells" or "depth greater than 4000m" to further refine results.*\n\n`;
        }
      } else {
        // Enhanced suggestions that include polygon capabilities
        contextualInfo = `\n💡 *You can now apply contextual filters to these results! Try queries like:*\n` +
          `• "wells with depth greater than 4000m"\n` +
          `• "show only production wells"\n` +
          `• "operated by Shell"\n` +
          `• Draw a polygon on the map and say "wells in the polygon"\n\n`;
      }

      // Create enhanced summary message with Cloudscape table data
      const messageText = `**🔍 Search Results Summary**\n\n` +
        `Found **${geoJsonData.features.length} wells** matching your search criteria: *"${prompt}"*\n\n` +
        contextualInfo +
        `The interactive map has been updated to show these wells in the South China Sea region. Click on any marker for detailed popups.\n\n` +
        `---\n\n` +
        `**📊 Well Data Table:**\n\n` +
        `\`\`\`json-table-data\n${JSON.stringify(tableItems, null, 2)}\n\`\`\`\n\n` +
        `**🗺️ Regional Distribution:**\n${wellCardsData.map(well => `• **${well.name}** - ${well.operator} (${well.type})`).join('\n')}\n\n` +
        `💡 *Tip: Click map markers for detailed popups with additional well information.*`;
      
      // Add message to chat
      const newMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: messageText
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      };
      
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }, 0);
      
      return geoJsonData;
    } catch (error) {
      console.error('Error fetching search data:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Add error message to chat
      const errorMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: `Error processing your search: ${error instanceof Error ? error.message : String(error)}`
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      };
      
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }, 0);
      return null;
    } finally {
      setIsLoadingMapData(false);
    }
  }, [amplifyClient, currentContext, saveContext, clearContext, analyzeQuery, activePolygon, polygons, applyPolygonFilter]);

  // Function to fetch initial map data
  const fetchMapData = useCallback(async () => {
    setIsLoadingMapData(true);
    setError(null);
    
    try {
      console.log('Fetching initial map data');
      
      let mapResponse;
      try {
        console.log('Attempting to call getCatalogMapData function...');
        mapResponse = await amplifyClient.queries.getCatalogMapData({
          type: 'all'
        });
        console.log('getCatalogMapData response received:', mapResponse);
      } catch (functionError) {
        console.error('getCatalogMapData function error:', functionError);
        // Show the actual error instead of falling back to empty data
        throw new Error(`Map data function failed: ${functionError instanceof Error ? functionError.message : String(functionError)}`);
      }
      
      console.log('Map data response:', mapResponse);
      
      let geoData = null;
      if (mapResponse.data) {
        try {
          geoData = typeof mapResponse.data === 'string' 
            ? JSON.parse(mapResponse.data) 
            : mapResponse.data;
        } catch (parseError) {
          console.error('Error parsing map response:', parseError);
          throw new Error('Invalid response format from map data service');
        }
      }
      
      if (!geoData) {
        throw new Error('No data received from map data service');
      }
      
      console.log('Parsed map data:', geoData);
      setMapData({
        wells: geoData.wells || null,
        seismic: geoData.seismic || null
      });
      
      return geoData;
    } catch (error) {
      console.error('Error fetching map data:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoadingMapData(false);
    }
  }, [amplifyClient]);

  // Don't load data automatically - let user search for their wells first
  // useEffect(() => {
  //   fetchMapData();
  // }, [fetchMapData]);

  // Test function to verify map updates work
  const testMapUpdate = useCallback(() => {
    console.log('🧪 Testing map update with sample data...');
    const testData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [106.9, 10.2] // Vietnam waters
          },
          properties: {
            name: 'Test Well 1',
            type: 'Production',
            depth: '4500m',
            operator: 'Test Company'
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [107.1, 10.4] // Vietnam waters
          },
          properties: {
            name: 'Test Well 2',
            type: 'Exploration',
            depth: '3200m',
            operator: 'Test Company'
          }
        }
      ]
    };

    if (mapComponentRef.current) {
      console.log('✅ Calling updateMapData with test data...');
      try {
        mapComponentRef.current.updateMapData(testData);
        console.log('✅ Test map update completed successfully');
      } catch (error) {
        console.error('❌ Test map update failed:', error);
      }
    } else {
      console.error('❌ MapComponent ref not available for test');
    }
  }, []);

  // Add test button in development with better debugging - run only once
  React.useEffect(() => {
    console.log('🏗️ CatalogPage useEffect running - setting up test functions (one-time setup)');
    console.log('🏗️ NODE_ENV:', process.env.NODE_ENV);
    
    if (process.env.NODE_ENV === 'development') {
      // Create stable references that don't change
      (window as any).testMapUpdate = () => {
        console.log('🧪 Testing map update with sample data...');
        const testData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [106.9, 10.2] // Vietnam waters
              },
              properties: {
                name: 'Test Well 1',
                type: 'Production',
                depth: '4500m',
                operator: 'Test Company'
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [107.1, 10.4] // Vietnam waters
              },
              properties: {
                name: 'Test Well 2',
                type: 'Exploration',
                depth: '3200m',
                operator: 'Test Company'
              }
            }
          ]
        };

        if (mapComponentRef.current) {
          console.log('✅ Calling updateMapData with test data...');
          try {
            mapComponentRef.current.updateMapData(testData);
            console.log('✅ Test map update completed successfully');
          } catch (error) {
            console.error('❌ Test map update failed:', error);
          }
        } else {
          console.error('❌ MapComponent ref not available for test');
        }
      };
      
      (window as any).debugCatalog = () => {
        return {
          mapComponentRef,
          mapRefAvailable: !!mapComponentRef.current,
          hasCurrentContext: !!currentContext,
          contextRecordCount: currentContext?.recordCount || 0,
          activePolygon: activePolygon,
          polygons: polygons
        };
      };
      
      // Add comprehensive polygon testing function with proper state access
      (window as any).testPolygonFiltering = (testQuery = 'wells in the polygon') => {
        console.log('🧪 TESTING POLYGON FILTERING STEP BY STEP');
        console.log('🧪 Test query:', testQuery);
        
        // Get current state values
        const currentActivePolygon = activePolygon;
        const currentPolygons = polygons;
        const currentContextState = currentContext;
        
        // Step 1: Check polygon state
        console.log('🧪 STEP 1: Polygon State Check');
        console.log('  - Active polygon exists:', !!currentActivePolygon);
        console.log('  - Active polygon ID:', currentActivePolygon?.id);
        console.log('  - Active polygon area:', currentActivePolygon?.area);
        console.log('  - All polygons count:', currentPolygons.length);
        
        if (currentPolygons.length > 0) {
          console.log('  - All polygons:', currentPolygons.map(p => ({ id: p.id, area: p.area })));
        }
        
        // Step 2: Test query analysis
        console.log('🧪 STEP 2: Query Analysis Test');
        const lowerQuery = testQuery.toLowerCase().trim();
        const polygonPatterns = [
          /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
          /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
          /(?:polygon|area)\s*(?:filter|selection)/i,
          /(?:all|show)\s*wells?\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i
        ];
        
        const patternResults = polygonPatterns.map((pattern, i) => ({
          patternIndex: i,
          matches: pattern.test(lowerQuery)
        }));
        
        console.log('  - Query patterns test results:', patternResults);
        console.log('  - Any pattern matches:', patternResults.some(p => p.matches));
        
        // Step 3: Test context state
        console.log('🧪 STEP 3: Context State Check');
        console.log('  - Current context exists:', !!currentContextState);
        console.log('  - Context record count:', currentContextState?.recordCount || 0);
        console.log('  - Context query:', currentContextState?.originalQuery || 'none');
        
        // Step 4: Simulate query analysis
        console.log('🧪 STEP 4: Simulating analyzeQuery function');
        try {
          const result = analyzeQuery(testQuery);
          console.log('  - Analysis result:', result);
        } catch (error) {
          console.error('  - Error in analyzeQuery:', error);
        }
        
        // Step 5: Test spatial filtering if we have data
        if (currentContextState?.data?.features && currentActivePolygon) {
          console.log('🧪 STEP 5: Testing Spatial Filtering');
          try {
            const testResult = applyPolygonFilter(currentContextState.data, currentActivePolygon);
            console.log('  - Spatial filter test result:', {
              originalCount: currentContextState.data.features.length,
              filteredCount: testResult.features.length,
              percentage: Math.round((testResult.features.length / currentContextState.data.features.length) * 100) + '%'
            });
          } catch (error) {
            console.error('  - Error in spatial filtering:', error);
          }
        } else {
          console.log('🧪 STEP 5: Cannot test spatial filtering');
          console.log('  - Has context data:', !!currentContextState?.data?.features);
          console.log('  - Has active polygon:', !!currentActivePolygon);
        }
        
        return {
          activePolygon: !!currentActivePolygon,
          hasContext: !!currentContextState,
          patternMatches: patternResults.some(p => p.matches),
          polygonCount: currentPolygons.length
        };
      };
      
      // Add live debugging function that shows current state when you try "wells in polygon"
      (window as any).debugPolygonSearch = () => {
        console.log('🔍 LIVE DEBUG: Current State for Polygon Search');
        console.log('================================================');
        console.log('Active Polygon State:', {
          exists: !!activePolygon,
          id: activePolygon?.id || 'none',
          area: activePolygon?.area || 'none',
          name: activePolygon?.name || 'none',
          geometry: activePolygon?.geometry ? 'exists' : 'none'
        });
        
        console.log('Context State:', {
          exists: !!currentContext,
          recordCount: currentContext?.recordCount || 0,
          query: currentContext?.originalQuery || 'none'
        });
        
        console.log('Polygons Array:', {
          count: polygons.length,
          ids: polygons.map(p => p.id)
        });
        
        // Test the actual analyzeQuery function with current state
        const testQuery = 'wells in polygon';
        console.log('\nTesting analyzeQuery with current state:');
        try {
          const result = analyzeQuery(testQuery);
          console.log('Query analysis result:', result);
          
          // Check if it would trigger polygon-first search
          const shouldTrigger = (
            result.filterType === 'polygon' && 
            result.filterValue === 'polygon_first_search' && 
            activePolygon
          );
          
          console.log('Should trigger polygon-first search:', shouldTrigger);
        } catch (error) {
          console.error('Error in analyzeQuery:', error);
        }
        
        return {
          activePolygon: activePolygon,
          currentContext: currentContext,
          polygons: polygons
        };
      };
      
      console.log('🧪 Test functions added to window:');
      console.log('  - window.testMapUpdate() - Test map updates');
      console.log('  - window.debugCatalog() - Get debug info');
      console.log('🧪 MapComponent ref available:', !!mapComponentRef.current);
    }
    
    return () => {
      // Cleanup
      if (typeof window !== 'undefined') {
        delete (window as any).testMapUpdate;
        delete (window as any).debugCatalog;
      }
    };
  }, []); // Empty dependency array - run only once on mount
  
  return (
    <div style={{ margin: '36px 80px 0' }}>
      <ContentLayout
        disableOverlap
        headerVariant="divider"
        header={
          <Header
            variant="h1"
            description=""
          >
            Data Catalog - All Data
          </Header>
        }
      />
      <div className="reset-chat">
        <Grid
          disableGutters
          gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
        >
          <div className='panel-header'>
            <SegmentedControl
              selectedId={selectedId}
              onChange={({ detail }) =>
                setSelectedId(detail.selectedId)
              }
              label="Segmented control with only icons"
              options={[
                {
                  iconName: "map",
                  iconAlt: "Segment 1",
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
                      <g></g>
                      <g>
                        <g>
                          <path d="M13,8.57c-0.79,0-1.43,0.64-1.43,1.43s0.64,1.43,1.43,1.43s1.43-0.64,1.43-1.43S13.79,8.57,13,8.57z" />
                          <path d="M13,3C9.25,3,6.2,5.94,6.02,9.64L4.1,12.2C3.85,12.53,4.09,13,4.5,13H6v3c0,1.1,0.9,2,2,2h1v3h7v-4.68 c2.36-1.12,4-3.53,4-6.32C20,6.13,16.87,3,13,3z M16,10c0,0.13-0.01,0.26-0.02,0.39l0.83,0.66c0.08,0.06,0.1,0.16,0.05,0.25 l-0.8,1.39c-0.05,0.09-0.16,0.12-0.24,0.09l-0.99-0.4c-0.21,0.16-0.43,0.29-0.67,0.39L14,13.83c-0.01,0.1-0.1,0.17-0.2,0.17h-1.6 c-0.1,0-0.18-0.07-0.2-0.17l-0.15-1.06c-0.25-0.1-0.47-0.23-0.68-0.39l-0.99,0.4c-0.09,0.03-0.2,0-0.25-0.09l-0.8-1.39 c-0.05-0.08-0.03-0.19,0.05-0.25l0.84-0.66C10.01,10.26,10,10.13,10,10c0-0.13,0.02-0.27,0.04-0.39L9.19,8.95 c-0.08-0.06-0.1-0.16-0.05-0.26l0.8-1.38c0.05-0.09,0.15-0.12,0.24-0.09l1,0.4c0.2-0.15,0.43-0.29,0.67-0.39l0.15-1.06 C12.02,6.07,12.1,6,12.2,6h1.6c0.1,0,0.18,0.07,0.2,0.17l0.15,1.06c0.24,0.1,0.46,0.23,0.67,0.39l1-0.4c0.09-0.03,0.2,0,0.24,0.09 l0.8,1.38c0.05,0.09,0.03,0.2-0.05,0.26l-0.85,0.66C15.99,9.73,16,9.86,16,10z" />
                        </g>
                      </g>
                    </svg>
                  ),
                  iconAlt: "Segment 2",
                  id: "seg-2"
                }
              ]}
            />
          </div>
          <div className='brea'>
            <BreadcrumbGroup
              items={[
                { text: 'Data Catalog', href: '#' },
                { text: 'Data Collection: All Data', href: '#' }
              ]}
              ariaLabel="Breadcrumbs"
            />
          </div>
        </Grid>
      </div>
      <Grid
        disableGutters
        gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
      >
        {selectedId === "seg-1" ? (
          <div className='panel'>
            {isLoadingMapData && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                width: '200px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <span>Loading map data...</span>
              </div>
            )}
            {error && (
              <div style={{ 
                position: 'absolute', 
                top: '100px', 
                left: '40%', 
                transform: 'translateX(-35%)',
                zIndex: 10,
                boxShadow: 'none',
              }}>
                <Alert
                  type="error"
                  dismissible
                  onDismiss={() => setError(null)}
                  header="Map Data Error"
                >
                  {error.message}
                </Alert>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <MapComponent 
                ref={mapComponentRef}
                mapColorScheme={mapColorScheme}
                onPolygonCreate={handlePolygonCreate}
                onPolygonDelete={handlePolygonDelete}
                onPolygonUpdate={handlePolygonUpdate}
              />
            </div>
          </div>
        ) : (
          // Chain of Thought here
          <div className='panel'>
            <Container
              footer=""
              header="Chain of Thought - Process Log"
            >
              <List>
                {(() => {
                  const filteredMessages = [
                    ...(messages ? messages : []),
                  ].filter((message) => {
                    switch (message.role) {
                      case 'ai':
                        return !message.responseComplete
                      case 'tool':
                        return message.toolName ? !['renderAssetTool', 'userInputTool', 'createProject'].includes(String(message.toolName)) : true;
                      default:
                        return false;
                    }
                  });

                  if (filteredMessages.length === 0) {
                    return (
                      <ListItem>
                        <div style={{ width: '100%', textAlign: 'center', padding: '20px' }}>
                          <Box variant="h3" color="text-status-inactive">
                            No process log available yet. AI thinking steps will appear here.
                          </Box>
                        </div>
                      </ListItem>
                    );
                  }

                  return filteredMessages.map((message, index) => (
                    <ListItem key={Array.isArray(message.id) ? message.id[0] || `message-${index}` : message.id || `message-${index}`}>
                      <ChatMessage message={message} />
                    </ListItem>
                  ));
                })()}
              </List>
            </Container>
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
              <div className='toggles'>
                <div style={{ marginLeft: '20px' }}>
                  <IconButton
                    onClick={handleCreateNewChat}
                    color="primary"
                    size="large"
                  >
                    <RestartAlt />
                  </IconButton>
                </div>

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

              {/* Main Data Table - Only shows after search results are available */}
              {/* {currentTableData.length > 0 && currentContext && (
                <div style={{ marginTop: '20px', marginBottom: '20px', padding: '0 16px' }}>
                  <Container
                    header={
                      <Header
                        variant="h2"
                        description={`Showing ${currentTableData.length} wells from search results`}
                      >
                        Well Data Results
                      </Header>
                    }
                  >
                    <Table
                      columnDefinitions={[
                        {
                          id: "name",
                          header: "Well Name",
                          cell: (item: any) => item.name || "N/A",
                          sortingField: "name"
                        },
                        {
                          id: "type", 
                          header: "Type",
                          cell: (item: any) => item.type || "N/A",
                          sortingField: "type"
                        },
                        {
                          id: "depth",
                          header: "Depth", 
                          cell: (item: any) => item.depth || "N/A",
                          sortingField: "depth"
                        },
                        {
                          id: "operator",
                          header: "Operator",
                          cell: (item: any) => item.operator || "N/A", 
                          sortingField: "operator"
                        },
                        {
                          id: "location",
                          header: "Location",
                          cell: (item: any) => item.location || "N/A",
                          sortingField: "location"
                        }
                      ]}
                      items={currentTableData}
                      trackBy={(item) => item.id || `item-${Math.random()}`}
                      empty={
                        <Box textAlign="center" color="inherit">
                          <b>No wells found</b>
                          <Box
                            padding={{ bottom: "s" }}
                            variant="p"
                            color="inherit"
                          >
                            Try searching for wells or adjusting your filters.
                          </Box>
                        </Box>
                      }
                      sortingDisabled={false}
                      variant="container"
                    />
                  </Container>
                </div>
              )} */}

              <CatalogChatBoxCloudscape
                onInputChange={setUserInput}
                userInput={userInput}
                messages={messages}
                setMessages={setMessages}
                onSendMessage={async (message: string) => {
                  if (selectedId === "seg-1" && message) {
                    await handleChatSearch(message);
                  }
                }}
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
  );
}

// Apply auth protection
const CatalogPage = withAuth(CatalogPageBase);

export default CatalogPage;
