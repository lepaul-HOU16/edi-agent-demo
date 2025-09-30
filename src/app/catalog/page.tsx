'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Badge, BreadcrumbGroup, Cards, Container, ContentLayout, ExpandableSection, Grid, Header, Icon, SpaceBetween, Table, Box, Button, Pagination, SegmentedControl, Modal, FormField, Input, Textarea } from '@cloudscape-design/components';
import { useTheme, IconButton, Tooltip, List, ListItem, useMediaQuery } from '@mui/material';
import FileDrawer from '@/components/FileDrawer';
import FolderIcon from '@mui/icons-material/Folder';
import RestartAlt from '@mui/icons-material/RestartAlt';
import CatalogChatBoxCloudscape from "@/components/CatalogChatBoxCloudscape";
import ChatMessage from '@/components/ChatMessage';
import GeoscientistDashboard from '@/components/GeoscientistDashboard';
import GeoscientistDashboardErrorBoundary from '@/components/GeoscientistDashboardErrorBoundary';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { sendMessage } from '../../../utils/amplifyUtils';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../../utils/types';
import { withAuth } from '@/components/WithAuth';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { isCollectionsEnabled, isCollectionCreationEnabled } from '@/services/featureFlags';

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
  const amplifyClient = React.useMemo(() => generateClient<Schema>(), []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<Schema["ChatSession"]["createType"]>({ id: "default" } as Schema["ChatSession"]["createType"]);
  
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
  const [activeWeatherLayers, setActiveWeatherLayers] = useState<{ [key: string]: boolean }>({});
  const [showWeatherControls, setShowWeatherControls] = useState<boolean>(true);
  
  // Collection creation state (Phase 2 feature)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [selectedDataItems, setSelectedDataItems] = useState<any[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);
  
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
      console.log('🔄 Chain of Thought: Attempting auto-scroll...');
      
      if (chainOfThoughtContainerRef.current) {
        console.log('✅ Chain of Thought: Using scrollTop to max height');
        try {
          const container = chainOfThoughtContainerRef.current;
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
            console.log(`📏 Chain of Thought: Scrolled to ${container.scrollTop}/${container.scrollHeight}`);
          });
        } catch (error) {
          console.error('❌ Chain of Thought: Container scroll failed:', error);
        }
      }
    } else {
      console.log('⏸️ Chain of Thought: Auto-scroll disabled');
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
      console.log('Chain of Thought: User scrolled up, disabling auto-scroll');
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
          console.log('📦 Chain of thought: Found message with', steps.length, 'steps');
          
          const parsedSteps = Array.isArray(steps) ? steps.map(step => {
            if (typeof step === 'string') {
              try {
                return JSON.parse(step);
              } catch (e) {
                console.error('❌ Failed to parse step JSON:', step);
                return null;
              }
            }
            return step;
          }) : [];
          
          return parsedSteps.filter(Boolean);
        })
        .filter(step => step && typeof step === 'object');
        
      totalThoughtSteps = thoughtStepsFromMessages.length;
      console.log('🧠 Chain of thought: Total steps found:', totalThoughtSteps, 'Previous count:', chainOfThoughtMessageCount);
    } catch (error) {
      console.error('❌ Error counting thought steps:', error);
      totalThoughtSteps = 0;
    }
    
    // Only auto-scroll when on chain of thought panel AND auto-scroll is enabled
    if (totalThoughtSteps > chainOfThoughtMessageCount && chainOfThoughtAutoScroll && selectedId === "seg-3") {
      console.log('🔄 Chain of thought: New steps detected, scrolling to bottom');
      
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
    console.log('🔍 Panel switch effect triggered:', {
      selectedId,
      hasSearchResults: mapState.hasSearchResults,
      hasWellData: !!mapState.wellData,
      hasMapRef: !!mapComponentRef.current,
      mapStateDebug: mapState
    });
    
    // When switching to map panel (seg-1) and we have saved search results
    if (selectedId === "seg-1" && mapState.hasSearchResults && mapState.wellData) {
      console.log('🔄 Map restoration conditions met, starting restoration...');
      
      // Multiple attempts to restore map state
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkAndRestore = () => {
        attempts++;
        console.log(`🔄 Map restoration attempt ${attempts}/${maxAttempts}`);
        
        if (mapComponentRef.current) {
          console.log('✅ MapRef available, restoring map state');
          console.log('🗺️ Restoring map with:', {
            wellCount: mapState.wellData?.features?.length || 0,
            bounds: mapState.bounds,
            hasUpdateMapData: typeof mapComponentRef.current.updateMapData === 'function',
            hasFitBounds: typeof mapComponentRef.current.fitBounds === 'function'
          });
          
          try {
            // Restore well data first
            if (mapState.wellData && mapComponentRef.current.updateMapData) {
              console.log('🗺️ Calling updateMapData with', mapState.wellData.features?.length || 0, 'wells...');
              mapComponentRef.current.updateMapData(mapState.wellData);
              
              // Then restore bounds with longer delay
              if (mapState.bounds && mapComponentRef.current.fitBounds) {
                setTimeout(() => {
                  console.log('🗺️ Calling fitBounds after delay...');
                  mapComponentRef.current.fitBounds(mapState.bounds);
                  console.log('✅ Map state restoration complete');
                }, 1000);
              }
            }
          } catch (error) {
            console.error('❌ Error in map restoration attempt', attempts, ':', error);
          }
        } else if (attempts < maxAttempts) {
          console.log(`⚠️ MapRef not available yet, retrying in ${200 * attempts}ms... (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkAndRestore, 200 * attempts); // Exponential backoff
        } else {
          console.error('❌ Max attempts reached, map restoration failed');
        }
      };
      
      // Start restoration
      const restoreTimeout = setTimeout(checkAndRestore, 300);
      
      return () => clearTimeout(restoreTimeout);
    } else {
      console.log('🔍 Map restoration conditions not met:', {
        isMapPanel: selectedId === "seg-1",
        hasResults: mapState.hasSearchResults,
        hasData: !!mapState.wellData,
        wellDataFeatures: mapState.wellData?.features?.length || 0
      });
    }
  }, [selectedId, mapState]);

  const mapColorScheme = theme.palette.mode === 'dark' ? "Dark" : "Light";

  const handleCreateNewChat = async () => {
    try {
      console.log('🔄 RESET: Clearing all catalog state...');
      
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
        console.log('🗺️ RESET: Clearing map data...');
        mapComponentRef.current.clearMap();
      }
      
      // Clear any loading states
      setIsLoadingMapData(false);
      setError(null);
      
      console.log('✅ RESET: All catalog state cleared successfully');
      
    } catch (error) {
      console.error("❌ RESET: Error resetting catalog:", error);
      alert("Failed to reset catalog. Please refresh the page.");
    }
  }

  // Handler to remove selected items from collection
  const handleRemoveSelectedFromCollection = useCallback(() => {
    if (!tableSelection || tableSelection.length === 0) return;
    
    console.log('🗑️ Removing selected items from collection:', tableSelection.length);
    
    // Remove selected items from the data items list
    const updatedItems = selectedDataItems.filter(item => 
      !tableSelection.some(selected => selected.id === item.id)
    );
    
    setSelectedDataItems(updatedItems);
    setTableSelection([]); // Clear selection
    
    console.log('✅ Items removed:', {
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
      console.log('🔄 Collection modal opened, selecting all items:', selectedDataItems.length);
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
      
      console.log('📊 Creating collection with final selection:', {
        originalItems: selectedDataItems.length,
        finalItems: finalDataItems.length,
        removed: selectedDataItems.length - finalDataItems.length
      });
      
      // Debug: Log the exact input fields
      console.log('🔍 Debug collection creation inputs:', {
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
        console.log('✅ Minimal metadata serialization successful:', metadataString);
      } catch (serializeError) {
        console.error('❌ Even minimal serialization failed:', serializeError);
        // Fallback to simplest possible string
        metadataString = `{"wellCount":${finalDataItems.length},"createdFrom":"catalog_search"}`;
      }
      
      // Debug: Test all mutation parameters individually
      const mutationParams = {
        operation: 'createCollection',
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        dataSourceType: 'Mixed',
        previewMetadata: metadataString
      };
      
      console.log('🧪 Testing mutation parameters:');
      console.log('  operation:', typeof mutationParams.operation, mutationParams.operation);
      console.log('  name:', typeof mutationParams.name, mutationParams.name);
      console.log('  description:', typeof mutationParams.description, mutationParams.description);
      console.log('  dataSourceType:', typeof mutationParams.dataSourceType, mutationParams.dataSourceType);
      console.log('  previewMetadata:', typeof mutationParams.previewMetadata, metadataString.length, 'chars');
      
      // Create collection through real backend service
      console.log('🔄 Calling collectionManagement mutation...');
      const response = await amplifyClient.mutations.collectionManagement(mutationParams);
      console.log('✅ Mutation response received:', response);
      
      const result = response;
      
      if (result.data) {
        const parsedResult = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        
        if (parsedResult.success) {
          // Show success message with final count
          const successMessage: Message = {
            id: uuidv4() as any,
            role: "ai" as any,
            content: {
              text: `✅ **Collection Created Successfully!**\n\nCreated collection **"${collectionName}"** with ${finalDataItems.length} wells.\n\n📁 **Collection Features:**\n- Preserved exact search context and map state\n- Geographic bounds and analytics configuration saved\n- Available at [Collection Management](/collections)\n\n🚀 **Next Steps:**\n- Create new workspace canvases linked to this collection\n- Restore this exact data context anytime\n- Share collection with team members (coming soon)`
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
        } else {
          console.error('Collection creation failed:', parsedResult.error);
          alert('Failed to create collection: ' + parsedResult.error);
        }
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };
  
  // Function to handle catalog search with enhanced context management
  const handleChatSearch = useCallback(async (prompt: string) => {
    setIsLoadingMapData(true);
    setError(null);
    
    try {
      console.log('🚀 PROCESSING CATALOG SEARCH:', prompt);
      
      // Enhanced context determination for filtering
      const isFirstQuery = !analysisData || analysisData.length === 0;
      const lowerPrompt = prompt.toLowerCase().trim();
      
      // Phase 2: Detect collection creation intent (feature-flagged)
      if (creationEnabled && analysisData && analysisData.length > 0) {
        const collectionKeywords = ['create', 'new collection', 'collection', 'save', 'with this data', 'make collection', 'create collection'];
        const isCollectionCreation = collectionKeywords.some(keyword => lowerPrompt.includes(keyword)) && 
                                     (lowerPrompt.includes('collection') || lowerPrompt.includes('save'));
        
        if (isCollectionCreation) {
          console.log('🗂️ Collection creation intent detected');
          
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
      
      console.log('🔍 Context Analysis:', {
        isFirstQuery,
        isLikelyFilter,
        hasExistingData: !!analysisData,
        existingWellCount: analysisData?.length || 0,
        prompt: lowerPrompt,
        collectionsEnabled: creationEnabled
      });
      
      // Prepare context for backend - only if we have data and this looks like a filter
      let searchContextForBackend = null;
      if (!isFirstQuery && analysisData && analysisData.length > 0) {
        searchContextForBackend = {
          wells: analysisData,
          queryType: analysisQueryType,
          timestamp: new Date().toISOString(),
          isFilterOperation: isLikelyFilter
        };
        
        console.log('📤 Sending context to backend:', {
          wellCount: searchContextForBackend.wells.length,
          previousQueryType: searchContextForBackend.queryType,
          isFilterOperation: isLikelyFilter,
          contextWells: searchContextForBackend.wells.slice(0, 3).map(w => w.name)
        });
      } else {
        console.log('📤 No context sent - fresh search');
      }
      
      // Use catalogSearch with enhanced context (serialize JSON for GraphQL)
      const searchResponse = await amplifyClient.queries.catalogSearch({
        prompt: prompt,
        existingContext: searchContextForBackend ? JSON.stringify(searchContextForBackend) : null
      });
      
      console.log('🔍 CATALOG SEARCH RESPONSE:', searchResponse);
      
      if (searchResponse.data) {
        // Parse the search results
        const geoJsonData = typeof searchResponse.data === 'string' 
          ? JSON.parse(searchResponse.data) 
          : searchResponse.data;
        
        console.log('✅ PARSED CATALOG DATA WITH THOUGHT STEPS:', geoJsonData);
        console.log('🧠 Thought steps received:', geoJsonData.thoughtSteps?.length || 0);
        
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
          
          console.log('✅ Updated analysis context:', {
            wellCount: analysisWellData.length,
            queryType: geoJsonData.metadata?.queryType || 'general',
            isContextualFilter: geoJsonData.metadata?.contextFilter || false
          });
        } else {
          // Only clear analysis data if this was a fresh search, not a failed filter
          if (isFirstQuery || !searchContextForBackend) {
            console.log('🧹 Clearing analysis data - no results on fresh search');
            setAnalysisData(null);
            setAnalysisQueryType('');
          } else {
            console.log('⚠️ Filter returned no results - keeping existing context');
          }
        }
        
        // FIXED: Always save map state from search results, regardless of which panel is active
        if (geoJsonData && geoJsonData.type === 'FeatureCollection') {
          console.log('🗺️ Processing search results for map state (panel-independent)');
          
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
              
              console.log('🗺️ Saving map state from search results:', { 
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
            
            console.log('🌤️ Weather layers detected:', weatherLayers);
            console.log('🌤️ Additional weather layers:', additionalLayers);
            
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
            console.log('🌤️ Initial weather layer states:', initialActiveState);
          } else {
            // Reset weather layers for non-weather queries
            setAvailableWeatherLayers([]);
            setActiveWeatherLayers({});
          }
          
          // ALWAYS save map state regardless of panel
          setMapState({
            center: center,
            zoom: 8,
            bounds: bounds,
            wellData: geoJsonData,
            hasSearchResults: true,
            weatherLayers: weatherLayers
          });
            }
          }
          
          // Update map in background if possible (when map panel is active)
          if (selectedId === "seg-1" && mapComponentRef.current) {
            console.log('🗺️ Map panel active, updating map immediately');
            try {
              mapComponentRef.current.updateMapData(geoJsonData);
            } catch (error) {
              console.error('❌ Error updating map immediately:', error);
            }
          } else {
            console.log('🗺️ Chain of thought panel active, map will be updated on panel switch');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in catalog search:', error);
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
  }, [amplifyClient, setMessages, mapComponentRef, analysisData, analysisQueryType]);
  
  // NOTE: Chat session subscription removed since catalog uses direct search
  // Chain of thought infrastructure is ready for when catalogSearch backend 
  // is enhanced to return thought steps

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

  // Weather layer toggle handler
  const handleWeatherLayerToggle = useCallback((layerType: string, visible: boolean) => {
    console.log(`🌤️ Toggling weather layer: ${layerType} -> ${visible}`);
    
    // Update local state
    setActiveWeatherLayers(prev => ({
      ...prev,
      [layerType]: visible
    }));
    
    // Toggle on map if available
    if (mapComponentRef.current && mapComponentRef.current.toggleWeatherLayer) {
      console.log(`🗺️ Calling map toggleWeatherLayer for ${layerType}`);
      mapComponentRef.current.toggleWeatherLayer(layerType, visible);
    } else {
      console.warn('⚠️ Map component or toggleWeatherLayer function not available');
    }
  }, []);
  
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
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
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
          <div className='brea'>
            <BreadcrumbGroup
              items={[
                { text: 'Data Catalog', href: '/catalog' },
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
        ) : selectedId === "seg-2" ? (
          // Data Analysis & Visualization Panel
          <div className='panel'>
            <Container
              footer=""
              header={
                <SpaceBetween direction="horizontal" size="m" alignItems="center">
                  <Box variant="h2">Data Analysis & Visualization</Box>
                </SpaceBetween>
              }
            >
              <div style={{ 
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 300px)',
                position: 'relative',
                paddingBottom: '60px'
              }}>
                {analysisData ? (
                  <GeoscientistDashboardErrorBoundary 
                    fallbackTableData={analysisData}
                    searchQuery={`Analysis for ${analysisData.length} wells`}
                  >
                    <GeoscientistDashboard
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
                        <Box variant="h2" textAlign="center">
                          No analysis data available
                        </Box>
                        <Box variant="p" textAlign="center" color="text-body-secondary">
                          Submit a search query to see detailed reservoir analysis, production intelligence, 
                          regional context, and operations planning insights.
                        </Box>
                      </SpaceBetween>
                    </SpaceBetween>
                  </Container>
                )}
              </div>
            </Container>
          </div>
        ) : (
          // Chain of Thought Panel (seg-3)
          <div className='panel'>
            <Container
              footer=""
              header={
                <SpaceBetween direction="horizontal" size="m" alignItems="center">
                  <Box variant="h2">Chain of Thought - AI Reasoning Process</Box>
                  {/* <SpaceBetween direction="horizontal" size="xs">
                    <Button 
                      variant="inline-icon"
                      iconName="refresh"
                      onClick={() => scrollChainOfThoughtToBottom()}
                    >
                      Manual Scroll
                    </Button>
                    <Button 
                      variant="inline-icon"
                      iconName={chainOfThoughtAutoScroll ? "status-positive" : "status-warning"}
                      onClick={() => setChainOfThoughtAutoScroll(!chainOfThoughtAutoScroll)}
                    >
                      Auto-scroll {chainOfThoughtAutoScroll ? 'On' : 'Off'}
                    </Button>
                  </SpaceBetween> */}
                </SpaceBetween>
              }
            >
              <div 
                ref={chainOfThoughtContainerRef}
                onScroll={handleChainOfThoughtScroll}
                style={{ 
                  overflowY: 'auto',
                  maxHeight: 'calc(100vh - 300px)',
                  position: 'relative',
                  paddingBottom: '60px'
                }}
              >
                {(() => {
                  console.log('🧠 Chain of Thought: Processing messages for thought steps...');
                  console.log('🔍 Total messages:', messages.length);
                  
                  messages.forEach((message, index) => {
                    if (message.role === 'ai') {
                      console.log(`🔍 AI Message ${index}:`, {
                        id: (message as any).id,
                        hasThoughtSteps: !!(message as any).thoughtSteps,
                        thoughtStepsLength: (message as any).thoughtSteps?.length || 0,
                        thoughtStepsType: typeof (message as any).thoughtSteps,
                        rawThoughtSteps: (message as any).thoughtSteps
                      });
                    }
                  });

                  let thoughtStepsFromMessages: any[] = [];
                  
                  try {
                    thoughtStepsFromMessages = messages
                      .filter(message => {
                        const hasSteps = message.role === 'ai' && (message as any).thoughtSteps;
                        if (hasSteps) {
                          console.log('🎯 Found AI message with thought steps:', (message as any).thoughtSteps);
                        }
                        return hasSteps;
                      })
                      .flatMap(message => {
                        const steps = (message as any).thoughtSteps || [];
                        console.log('📦 Extracting steps from message:', steps.length, 'steps');
                        
                        const parsedSteps = Array.isArray(steps) ? steps.map(step => {
                          if (typeof step === 'string') {
                            try {
                              const parsed = JSON.parse(step);
                              console.log('✅ Parsed JSON step:', parsed.title);
                              return parsed;
                            } catch (e) {
                              console.error('❌ Failed to parse step JSON:', step);
                              return null;
                            }
                          }
                          return step;
                        }) : [];
                        
                        return parsedSteps.filter(Boolean);
                      })
                      .filter(step => step && typeof step === 'object')
                      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                      
                    console.log('✅ Final thought steps array:', thoughtStepsFromMessages.length, 'steps');
                    thoughtStepsFromMessages.forEach((step, index) => {
                      console.log(`🔍 Step ${index + 1}:`, {
                        id: step.id,
                        title: step.title,
                        summary: step.summary,
                        status: step.status,
                        hasDetails: !!step.details
                      });
                    });
                  } catch (error) {
                    console.error('❌ Error extracting thought steps:', error);
                    thoughtStepsFromMessages = [];
                  }

                  if (thoughtStepsFromMessages.length > 0) {
                    console.log('🎉 Rendering', thoughtStepsFromMessages.length, 'thought steps');
                    return (
                      <SpaceBetween direction="vertical" size="m">
                        {thoughtStepsFromMessages.map((step, index) => {
                          const stepTitle = step.title || `Step ${index + 1}`;
                          const stepSummary = step.summary || 'Processing...';
                          const stepId = step.id || `step-${index}`;
                          const stepStatus = step.status || 'complete';
                          const stepType = step.type || 'processing';
                          
                          return (
                            <Container
                              key={stepId}
                              header={
                                <Box variant="h3" fontWeight="bold">
                                  {stepTitle}
                                </Box>
                              }
                            >
                              <SpaceBetween direction="vertical" size="m">
                                <Box>
                                  {stepSummary}
                                </Box>
                                {step.details && (
                                  <ExpandableSection
                                    headerText="Technical Details"
                                    defaultExpanded={false}
                                    variant="footer"
                                  >
                                    <Box 
                                      padding={{ left: 'm' }}
                                      color="text-body-secondary"
                                    >
                                      <pre style={{ 
                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                        fontSize: '12px',
                                        whiteSpace: 'pre-wrap',
                                        margin: 0,
                                        backgroundColor: '#fafbfc',
                                        padding: '12px',
                                        borderRadius: '4px',
                                        border: '1px solid #e9ecef'
                                      }}>
                                        {step.details}
                                      </pre>
                                    </Box>
                                  </ExpandableSection>
                                )}
                              </SpaceBetween>
                            </Container>
                          );
                        })}
                      </SpaceBetween>
                    );
                  }

                  console.log('📝 No thought steps found - showing empty state');
                  const debugInfo = `Messages: ${messages.length}, AI messages: ${messages.filter(m => m.role === 'ai').length}`;
                  
                  return (
                    <Container>
                      <SpaceBetween direction="vertical" size="l" alignItems="center">
                        <Icon name="gen-ai" size="large" />
                        <SpaceBetween direction="vertical" size="m" alignItems="center">
                          <Box variant="h2" textAlign="center">
                            No AI reasoning process active
                          </Box>
                          <Box variant="p" textAlign="center" color="text-body-secondary">
                            Submit a query to see the AI's step-by-step decision-making process.
                            The chain of thought will show confidence levels, timing, and complete
                            technical details for full transparency and verification.
                          </Box>
                          <Box variant="small" textAlign="center" color="text-body-secondary">
                            Debug: {debugInfo}
                          </Box>
                        </SpaceBetween>
                      </SpaceBetween>
                    </Container>
                  );
                })()}
                <div ref={chainOfThoughtEndRef} style={{ height: '1px' }} />
              </div>
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
                  await handleChatSearch(message);
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

      {/* Phase 2: Collection Creation Modal (Feature-Flagged) */}
      {creationEnabled && (
        <Modal
          onDismiss={() => setShowCreateCollectionModal(false)}
          visible={showCreateCollectionModal}
          closeAriaLabel="Close modal"
          header="Create Data Collection from Search Results"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button 
                  variant="link" 
                  onClick={() => setShowCreateCollectionModal(false)}
                  disabled={creatingCollection}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCollection}
                  loading={creatingCollection}
                  disabled={!collectionName.trim()}
                >
                  Create Collection
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <Alert
              statusIconAriaLabel="Info"
              type="info"
              header="Beta Feature - Collection Management"
            >
              You're creating a collection to preserve your current search results, map state, and analytics configuration for future use.
            </Alert>

            <FormField
              label="Collection Name"
              description="Choose a descriptive name for your data collection"
            >
              <Input
                value={collectionName}
                onChange={({ detail }) => setCollectionName(detail.value)}
                placeholder="e.g., Cuu Long Basin Production Wells"
              />
            </FormField>

            <FormField
              label="Description (Optional)"
              description="Provide additional context about this collection"
            >
              <Textarea
                value={collectionDescription}
                onChange={({ detail }) => setCollectionDescription(detail.value)}
                placeholder="Describe the purpose and contents of this collection..."
                rows={3}
              />
            </FormField>

            <Container
              header={
                <Header 
                  variant="h3" 
                  counter={`(${selectedDataItems.length} wells)`}
                  actions={
                    <SpaceBetween direction="horizontal" size="s">
                      <Button
                        variant="normal"
                        iconName="remove"
                        disabled={!tableSelection || tableSelection.length === 0}
                        onClick={handleRemoveSelectedFromCollection}
                      >
                        Remove Selected ({tableSelection?.length || 0})
                      </Button>
                    </SpaceBetween>
                  }
                >
                  Data Preview - Select Wells to Include
                </Header>
              }
            >
              {selectedDataItems.length > 0 ? (
                <Table
                  columnDefinitions={[
                    { id: "name", header: "Well Name", cell: item => item.name },
                    { id: "location", header: "Location", cell: item => item.location },
                    { id: "depth", header: "Depth", cell: item => item.depth },
                    { id: "operator", header: "Operator", cell: item => item.operator }
                  ]}
                  items={selectedDataItems}
                  loadingText="Loading data"
                  selectionType="multi"
                  selectedItems={tableSelection}
                  onSelectionChange={({ detail }) => setTableSelection(detail.selectedItems)}
                  header={
                    <Header
                      counter={`(${selectedDataItems.length} wells available)`}
                      description="Uncheck wells you don't want to include in the collection"
                    >
                      Wells for Collection
                    </Header>
                  }
                  empty={
                    <Box textAlign="center" color="inherit">
                      <Box variant="strong" color="inherit">No data selected</Box>
                    </Box>
                  }
                />
              ) : (
                <Box textAlign="center" color="inherit" padding="m">
                  No data available to create collection
                </Box>
              )}
            </Container>
          </SpaceBetween>
        </Modal>
      )}
    </div>
  );
}

// Apply auth protection
const CatalogPage = withAuth(CatalogPageBase);

export default CatalogPage;
