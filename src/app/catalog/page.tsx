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
import maplibregl, { 
  Map as MaplibreMap, 
  GeoJSONSource,
  MapMouseEvent,
  MapLayerMouseEvent
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { withAuth } from '@/components/WithAuth';

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

function CatalogPageBase() {
  const [selectedId, setSelectedId] = useState("seg-1");
  const amplifyClient = generateClient<Schema>();
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
  
  // Drawer variant only matters for mobile now
  const drawerVariant = "temporary";

  // Map configuration
  const mapColorScheme = theme.palette.mode === 'dark' ? "Dark" : "Light";
  
  // Store map instance in a ref so it persists across renders
  const mapRef = React.useRef<MaplibreMap | null>(null);
  
  // Simple source and layer IDs
  const WELLS_SOURCE_ID = 'wells';
  const WELLS_LAYER_ID = 'wells-layer';
  const SEISMIC_SOURCE_ID = 'seismic';
  const SEISMIC_LAYER_ID = 'seismic-layer';

  // Simulate catalogSearch functionality locally when Amplify function is unavailable
  const simulateCatalogSearch = async (prompt: string): Promise<any> => {
    console.log('Simulating catalog search locally for prompt:', prompt);
    
    // Parse the search query locally
    const parseQuery = (searchQuery: string) => {
      const lowerQuery = searchQuery.toLowerCase().trim();
      
      if (lowerQuery.includes('south china sea') || lowerQuery.includes('scs')) {
        return { queryType: 'geographic', parameters: { region: 'south-china-sea', coordinates: { minLon: 99, maxLon: 121, minLat: 3, maxLat: 23 } } };
      }
      if (lowerQuery.includes('vietnam') || lowerQuery.includes('vietnamese')) {
        return { queryType: 'geographic', parameters: { region: 'vietnam', coordinates: { minLon: 102, maxLon: 110, minLat: 8, maxLat: 17 } } };
      }
      if (lowerQuery.includes('malaysia') || lowerQuery.includes('malaysian')) {
        return { queryType: 'geographic', parameters: { region: 'malaysia', coordinates: { minLon: 100.25, maxLon: 104.5, minLat: 1.0, maxLat: 6.5 } } };
      }
      if (lowerQuery.includes('my wells') || lowerQuery.includes('show me my wells') || lowerQuery.includes('personal wells')) {
        return { queryType: 'myWells', parameters: { region: 'malaysia', coordinates: { minLon: 100.25, maxLon: 104.5, minLat: 1.0, maxLat: 6.5 } } };
      }
      if (lowerQuery.includes('production')) {
        return { queryType: 'wellType', parameters: { type: 'Production' } };
      }
      if (lowerQuery.includes('exploration')) {
        return { queryType: 'wellType', parameters: { type: 'Exploration' } };
      }
      if (lowerQuery.includes('deep') || /\d+\s*(m|meter|ft|feet)/.test(lowerQuery)) {
        const depthMatch = lowerQuery.match(/(\d+)\s*(m|meter|ft|feet)/);
        const depth = depthMatch ? parseInt(depthMatch[1]) : 3000;
        return { queryType: 'depth', parameters: { minDepth: depth } };
      }
      const wellMatch = lowerQuery.match(/well[\s\-]*(\w+)/);
      if (wellMatch) {
        return { queryType: 'wellName', parameters: { name: wellMatch[1] } };
      }
      return { queryType: 'general', parameters: { text: searchQuery } };
    };
    
    const parsedQuery = parseQuery(prompt);
    
    // Realistic South China Sea wells database
    const realisticWells = [
      { name: "Cuu Long Basin Well-001", lat: 10.5, lon: 107.8, type: "Production", depth: 3650, operator: "PetroVietnam", block: "Block 15-1" },
      { name: "Bach Ho Field Well-A2", lat: 10.3, lon: 107.2, type: "Production", depth: 2890, operator: "Vietsovpetro", block: "Block 09-1" },
      { name: "Su Tu Den Field Well-B1", lat: 9.8, lon: 106.9, type: "Production", depth: 3200, operator: "PetroVietnam", block: "Block 16-1" },
      { name: "Nam Con Son Well-E3", lat: 9.2, lon: 108.1, type: "Exploration", depth: 4100, operator: "PVEP", block: "Block 06-1" },
      { name: "Sarawak Basin Well-M1", lat: 4.2, lon: 113.5, type: "Production", depth: 3450, operator: "Petronas", block: "Block SK-07" },
      { name: "Sabah Well-Deep-1", lat: 5.8, lon: 115.2, type: "Exploration", depth: 4800, operator: "Shell Malaysia", block: "Block SB-12" },
      { name: "Kimanis Field Well-K3", lat: 5.4, lon: 115.8, type: "Production", depth: 2750, operator: "Petronas Carigali", block: "Block PM-3" },
      { name: "Champion West Well-C1", lat: 4.8, lon: 114.1, type: "Production", depth: 3100, operator: "BSP", block: "Block B" },
      { name: "Malampaya Field Well-P2", lat: 11.2, lon: 119.8, type: "Production", depth: 3850, operator: "Shell Philippines", block: "SC 38" },
      { name: "Reed Bank Well-R1", lat: 10.8, lon: 116.2, type: "Exploration", depth: 4250, operator: "Forum Energy", block: "SC 72" },
      { name: "East Natuna Field Well-N4", lat: 3.5, lon: 108.8, type: "Production", depth: 3300, operator: "Pertamina", block: "Natuna Block" },
      { name: "Anambas Basin Well-A1", lat: 2.8, lon: 106.1, type: "Exploration", depth: 3900, operator: "Medco Energi", block: "Anambas Block" },
      { name: "Liwan Gas Field Well-L2", lat: 19.5, lon: 112.8, type: "Production", depth: 4500, operator: "CNOOC", block: "Block 29/26" },
      { name: "Panyu Field Well-PY3", lat: 21.2, lon: 113.5, type: "Production", depth: 2950, operator: "CNOOC", block: "Block 16/08" },
      { name: "Wenchang Field Well-WC1", lat: 19.8, lon: 111.2, type: "Production", depth: 3680, operator: "CNOOC", block: "Block 13/22" }
    ];
    
    // Filter wells based on search criteria
    let filteredWells = [...realisticWells];
    
    switch (parsedQuery.queryType) {
      case 'myWells':
        // For "My Wells" queries, don't filter - let the backend handle S3 data
        filteredWells = realisticWells;
        break;
      case 'geographic':
        const coords = parsedQuery.parameters.coordinates;
        filteredWells = realisticWells.filter(well => 
          well.lon >= coords.minLon && well.lon <= coords.maxLon &&
          well.lat >= coords.minLat && well.lat <= coords.maxLat
        );
        break;
      case 'wellType':
        filteredWells = realisticWells.filter(well => 
          well.type.toLowerCase() === parsedQuery.parameters.type.toLowerCase()
        );
        break;
      case 'depth':
        filteredWells = realisticWells.filter(well => well.depth >= parsedQuery.parameters.minDepth);
        break;
      case 'wellName':
        const namePattern = parsedQuery.parameters.name.toLowerCase();
        filteredWells = realisticWells.filter(well => 
          well.name.toLowerCase().includes(namePattern)
        );
        break;
    }
    
    // Convert to GeoJSON format
    const features = filteredWells.map((well, index) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [well.lon, well.lat]
      },
      properties: {
        name: well.name,
        type: well.type,
        depth: `${well.depth} m`,
        location: well.block,
        operator: well.operator,
        osduId: `osdu:work-product-component--Wellbore:scs-${index + 1}:${well.name.replace(/\s+/g, '-').toLowerCase()}`,
        kind: 'osdu:wks:master-data--Wellbore:1.0.0',
        region: parsedQuery.parameters?.region || 'south-china-sea',
        latitude: well.lat.toFixed(6),
        longitude: well.lon.toFixed(6),
        searchCriteria: prompt,
        dataSource: 'OSDU Community Platform (Simulated)'
      }
    }));
    
    return {
      type: "FeatureCollection",
      metadata: {
        type: "wells",
        searchQuery: prompt,
        source: "OSDU Community Platform (Local Simulation)",
        recordCount: features.length,
        region: parsedQuery.parameters?.region || 'south-china-sea',
        queryType: parsedQuery.queryType || 'general',
        timestamp: new Date().toISOString(),
        coordinateBounds: features.length > 0 ? {
          minLon: Math.min(...features.map(f => f.geometry.coordinates[0])),
          maxLon: Math.max(...features.map(f => f.geometry.coordinates[0])),
          minLat: Math.min(...features.map(f => f.geometry.coordinates[1])),
          maxLat: Math.max(...features.map(f => f.geometry.coordinates[1]))
        } : null
      },
      features: features
    };
  };

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
      
      console.log('Search response:', searchResponse);
      
      // Parse the search results
      let geoJsonData = null;
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
      
      console.log('Parsed search results:', geoJsonData);
      
      // Update the map with the new GeoJSON data using default Amazon Location Service approach
      if (geoJsonData && mapRef.current && geoJsonData.type === 'FeatureCollection') {
        console.log('Updating map with search results:', geoJsonData.features.length, 'features');
        
        // Simple approach: check if source exists, update or create
        const wellsSource = mapRef.current.getSource(WELLS_SOURCE_ID);
        if (wellsSource) {
          // Update existing source
          (wellsSource as GeoJSONSource).setData(geoJsonData);
          console.log('Updated existing wells source');
        } else {
          // Add new source and layer
          mapRef.current.addSource(WELLS_SOURCE_ID, {
            type: 'geojson',
            data: geoJsonData
          });
          
          // Add simple circle layer
          mapRef.current.addLayer({
            id: WELLS_LAYER_ID,
            type: 'circle',
            source: WELLS_SOURCE_ID,
            paint: {
              'circle-radius': 8,
              'circle-color': '#FF0000',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-opacity': 0.8
            }
          });
          
          console.log('Added new wells source and layer');
          
          // Add click event for wells layer
          mapRef.current.on('click', WELLS_LAYER_ID, (e: MapLayerMouseEvent) => {
            if (!e.features || e.features.length === 0) return;
            
            const coordinates = e.lngLat;
            const properties = e.features[0].properties;
            const name = properties?.name || 'Unnamed Well';
            
            // Create simple popup
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <h3>${name}</h3>
              ${properties ? Object.entries(properties)
                .filter(([key]) => key !== 'name')
                .slice(0, 5) // Show only first 5 properties
                .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                .join('') : 'No additional metadata available'}
            `;
            
            new maplibregl.Popup()
              .setLngLat(coordinates)
              .setDOMContent(popupContent)
              .addTo(mapRef.current!);
          });
          
          // Change cursor on hover
          mapRef.current.on('mouseenter', WELLS_LAYER_ID, () => {
            if (mapRef.current) {
              mapRef.current.getCanvas().style.cursor = 'pointer';
            }
          });
          
          mapRef.current.on('mouseleave', WELLS_LAYER_ID, () => {
            if (mapRef.current) {
              mapRef.current.getCanvas().style.cursor = '';
            }
          });
        }
        
        // Fit map bounds to show all search results
        if (geoJsonData.features.length > 0) {
          const coordinates = geoJsonData.features.map((feature: any) => feature.geometry.coordinates);
          const bounds = coordinates.reduce((bounds: maplibregl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          
          mapRef.current.fitBounds(bounds, { 
            padding: 50,
            maxZoom: 12
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

        // Create enhanced summary message with Cloudscape table data
        const messageText = `**🔍 Search Results Summary**\n\n` +
          `Found **${geoJsonData.features.length} wells** matching your search criteria: *"${prompt}"*\n\n` +
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
      }
      
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

  useEffect(() => {
    // Initialize map when selectedId is "seg-1"
    if (selectedId === "seg-1") {
      const mapContainer = document.getElementById("map");
      if (mapContainer && !mapRef.current) {
        
        // Create new map instance using default Amazon Location Service implementation
        mapRef.current = new maplibregl.Map({
          container: "map",
          style: `https://maps.geo.${REGION}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`,
          center: [106.9, 10.2], // Center on Vietnamese territorial waters
          zoom: 7,
        });

        // Add controls
        mapRef.current.addControl(new maplibregl.ScaleControl({
          maxWidth: 200,
          unit: 'metric'
        }), 'top-right');
        mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
        
        // Wait for the map to load before setup
        mapRef.current.on('load', () => {
          console.log('Map loaded successfully - wells will only appear when searched');
          // No initial data loading - wells will only appear when searched for
        });
        
        // Ensure proper rendering
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 100);
      }
    }
    
    return () => {
      // Clean up map when component unmounts or tab changes
      if (mapRef.current && selectedId !== "seg-1") {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedId, mapColorScheme, fetchMapData]);
  
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
              <div id="map" style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '0 0 16px 16px' }} />
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
