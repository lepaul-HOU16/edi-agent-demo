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
  
  // Drawer variant only matters for mobile now
  const drawerVariant = "temporary";

  // Reference to MapComponent
  const mapComponentRef = React.useRef<any>(null);

  // Polygon event handlers for MapComponent
  const handlePolygonCreate = useCallback((polygon: PolygonFilter) => {
    setPolygons(prev => [...prev, polygon]);
    setActivePolygon(polygon);
    
    console.log('Polygon created:', polygon);
    
    // Add notification message to chat
    const polygonMessage: Message = {
      id: uuidv4() as any,
      role: "ai" as any,
      content: {
        text: `**🗺️ Polygon Created**\n\nArea selection polygon has been drawn covering **${polygon.area?.toFixed(2)} km²**.\n\nYou can now filter wells within this area by saying "*wells in the polygon*" or "*filter by polygon area*".`
      } as any,
      responseComplete: true as any,
      createdAt: new Date().toISOString() as any,
      chatSessionId: '' as any,
      owner: '' as any
    };
    
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, polygonMessage]);
    }, 0);
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
    if (!wells || !wells.features) {
      return wells;
    }
    
    const filteredFeatures = wells.features.filter((well: any) => {
      return booleanPointInPolygon(well.geometry, polygon.geometry);
    });
    
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
  const analyzeQuery = (query: string): ContextualQuery => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Contextual filter patterns
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
      /(?:filter|show only|narrow down|refine)/i,
      
      // Polygon filters
      /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
      /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
      /(?:polygon|area)\s*(?:filter|selection)/i
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
      
      // Polygon filters
      const polygonFilterPatterns = [
        /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
        /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
        /(?:polygon|area)\s*(?:filter|selection)/i
      ];
      
      const isPolygonFilter = polygonFilterPatterns.some(pattern => pattern.test(lowerQuery));
      if (isPolygonFilter && activePolygon) {
        filterType = 'polygon' as any;
        filterValue = activePolygon.id;
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
  };

  // Function to apply filters to current context data
  const applyContextualFilter = (contextData: any, filterType: string, filterValue: any): any => {
    if (!contextData || !contextData.features) {
      return contextData;
    }
    
    let filteredFeatures = [...contextData.features];
    
    switch (filterType) {
      case 'depth':
        filteredFeatures = filteredFeatures.filter(feature => {
          const depthStr = feature.properties?.depth || '0';
          const depth = parseInt(depthStr.replace(/[^\d]/g, ''));
          
          if (filterValue.operator === '>') {
            return depth > filterValue.value;
          } else if (filterValue.operator === '<') {
            return depth < filterValue.value;
          }
          return true;
        });
        break;
        
      case 'operator':
        const targetOperator = filterValue.toLowerCase();
        filteredFeatures = filteredFeatures.filter(feature => {
          const operator = (feature.properties?.operator || '').toLowerCase();
          return operator.includes(targetOperator) || targetOperator.includes(operator);
        });
        break;
        
      case 'type':
        filteredFeatures = filteredFeatures.filter(feature => {
          const type = feature.properties?.type || '';
          return type.toLowerCase() === filterValue.toLowerCase();
        });
        break;
        
      case 'location':
        filteredFeatures = filteredFeatures.filter(feature => {
          const location = (feature.properties?.location || '').toLowerCase();
          const region = (feature.properties?.region || '').toLowerCase();
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

  // Function to save context
  const saveContext = useCallback((data: any, query: string, filters: string[] = []) => {
    const context: SearchContext = {
      data,
      originalQuery: query,
      appliedFilters: filters,
      timestamp: new Date(),
      recordCount: data?.features?.length || 0,
      queryType: data?.metadata?.queryType || 'general'
    };
    
    setCurrentContext(context);
    setContextHistory(prev => [context, ...prev].slice(0, 10)); // Keep last 10 contexts
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
      console.log('Processing search for prompt:', prompt);
      
      // Analyze query to determine if contextual or new search
      const queryAnalysis = analyzeQuery(prompt);
      console.log('Query analysis:', queryAnalysis);
      
      let geoJsonData = null;
      
      if (queryAnalysis.isContextual && queryAnalysis.operation === 'filter' && currentContext) {
        // Handle contextual filtering
        console.log('Processing contextual filter on current data');
        
        geoJsonData = applyContextualFilter(
          currentContext.data,
          queryAnalysis.filterType!,
          queryAnalysis.filterValue
        );
        
        // Update context with applied filter
        const newFilters = [...currentContext.appliedFilters, `${queryAnalysis.filterType}: ${JSON.stringify(queryAnalysis.filterValue)}`];
        saveContext(geoJsonData, currentContext.originalQuery, newFilters);
        
      } else {
        // Handle new search
        console.log('Processing new search query');
        
        // Clear context for new search
        if (!queryAnalysis.isContextual) {
          clearContext();
        }
        
        let searchResponse;
        try {
          console.log('Attempting to call catalogSearch function...');
          searchResponse = await amplifyClient.queries.catalogSearch({
            prompt: prompt
          });
          console.log('catalogSearch response received:', searchResponse);
        } catch (functionError) {
          console.error('catalogSearch function error:', functionError);
          // Show the actual error instead of falling back to simulation
          throw new Error(`Search function failed: ${functionError instanceof Error ? functionError.message : String(functionError)}`);
        }

        // Parse the search results
        if (searchResponse.data) {
          try {
            geoJsonData = typeof searchResponse.data === 'string' 
              ? JSON.parse(searchResponse.data) 
              : searchResponse.data;
          } catch (parseError) {
            console.error('Error parsing search response:', parseError);
            throw new Error('Invalid response format from search service');
          }
        }

        if (!geoJsonData) {
          throw new Error('No data received from search service');
        }
        
        // Save context for new search
        saveContext(geoJsonData, prompt);
      }
      
      console.log('Processed search results:', geoJsonData);
      
      // Update the map using MapComponent with better error handling
      if (geoJsonData && geoJsonData.type === 'FeatureCollection') {
        console.log('Search returned', geoJsonData.features.length, 'features for map update');
        
        if (mapComponentRef.current) {
          console.log('✅ MapComponent ref is available, calling updateMapData...');
          try {
            mapComponentRef.current.updateMapData(geoJsonData);
            console.log('✅ Successfully called updateMapData on MapComponent');
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

      // Generate well cards data that matches the map data
      const wellCardsData = geoJsonData.features.map((feature, index) => ({
        id: index + 1,
        name: feature.properties.name || 'Unknown Well',
        type: feature.properties.type || 'Unknown',
        location: feature.properties.location || 'Unknown',
        depth: feature.properties.depth || 'Unknown',
        operator: feature.properties.operator || 'Unknown',
        latitude: feature.properties.latitude || feature.geometry.coordinates[1]?.toFixed(6) || 'N/A',
        longitude: feature.properties.longitude || feature.geometry.coordinates[0]?.toFixed(6) || 'N/A',
        region: feature.properties.region || 'South China Sea',
        dataSource: feature.properties.dataSource || 'OSDU Platform',
        logoUrl: getOperatorLogo(feature.properties.operator || 'Unknown')
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
      if (queryAnalysis.isContextual && currentContext) {
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
  }, [amplifyClient]);

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
          contextRecordCount: currentContext?.recordCount || 0
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
