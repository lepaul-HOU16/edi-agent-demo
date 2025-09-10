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
import CatalogChatBox from "@/components/CatalogChatBox";
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
import 'maplibre-gl/dist/maplibre-gl.css'; // Import the CSS for the map
import { getCurrentUser } from 'aws-amplify/auth';



interface DataCollection {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  owner: string;
}

// GeoJSON types
interface GeoJSONData {
  wells: any | null;
  seismic: any | null;
}


export default function CatalogPage() {
  const [selectedId, setSelectedId] = useState("seg-1");
  const [selectedItems, setSelectedItems] = React.useState([{ name: "", description: "", prompt: "" }]);
  const [amplifyClient, setAmplifyClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
  // Determine color scheme based on theme mode
  const colorScheme = theme.palette.mode === 'dark' ? 'dark' : 'light';
  
  // Drawer variant only matters for mobile now
  const drawerVariant = "temporary";

  // Sample data collections
  const dataCollections: DataCollection[] = [
    {
      id: 'dc1',
      name: 'Barrow',
      description: 'Seismic and well data from the Barrow region',
      dateCreated: '2025-05-15',
      owner: 'Energy Research Team'
    },
    {
      id: 'dc2',
      name: 'Beagle Sub-basin',
      description: 'Comprehensive dataset of the Beagle Sub-basin area',
      dateCreated: '2025-04-22',
      owner: 'Exploration Division'
    },
    {
      id: 'dc3',
      name: 'Capreolus',
      description: 'Production and reservoir data from Capreolus field',
      dateCreated: '2025-03-10',
      owner: 'Production Analytics'
    },
    {
      id: 'dc4',
      name: 'Dampier Study',
      description: 'Environmental and geological study of the Dampier area',
      dateCreated: '2025-02-28',
      owner: 'Environmental Research'
    }
  ];



  const handleCreateNewChat = async () => {
    try {
      // Clear the messages state to reset the conversation
      setMessages([]);
    } catch (error) {
      console.error("Error resetting chat:", error);
      alert("Failed to reset chat.");
    }
  }

  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const mapName = "EdiTestMap";
  const region = "us-east-1";
  const style = "Standard";
  const mapColorScheme = theme.palette.mode === 'dark' ? "Dark" : "Light";

  // Store map instance in a ref so it persists across renders
  const mapRef = React.useRef<MaplibreMap | null>(null);
  // Store source IDs to avoid duplicates
  const sourcesRef = React.useRef({
    wells: 'wells-source',
    seismic: 'seismic-source'
  });
  
  // Function to handle user input from chat and send to Amplify GraphQL for search
  const handleChatSearch = useCallback(async (prompt: string) => {
    if (!amplifyClient || !isAuthenticated) {
      console.warn('Amplify client not available or user not authenticated');
      return null;
    }

    setIsLoadingMapData(true);
    setError(null);
    
    try {
      // Check if catalogSearch query is available
      if (!amplifyClient.queries.catalogSearch) {
        throw new Error('catalogSearch query not available - backend deployment may be in progress');
      }

      // Use Amplify GraphQL query for catalog search
      const response = await amplifyClient.queries.catalogSearch({ prompt });
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(`GraphQL error: ${response.errors.map(e => e.message).join(', ')}`);
      }
      
      if (!response.data) {
        throw new Error('No data returned from catalog search');
      }
      
      // Parse the response data
      let geoJsonData;
      try {
        geoJsonData = JSON.parse(response.data);
        console.log('Extracted GeoJSON data:', geoJsonData);
      } catch (error) {
        console.error('Error parsing search response:', error);
        throw new Error('Invalid JSON response from search service');
      }
      
      // Update the map with the new GeoJSON data
      if (geoJsonData && mapRef.current) {
        // Update wells data if available
        if (geoJsonData.type === 'FeatureCollection' && geoJsonData.metadata?.type === 'wells') {
          // If the wells source already exists, update it
          if (mapRef.current.getSource(sourcesRef.current.wells)) {
            (mapRef.current.getSource(sourcesRef.current.wells) as GeoJSONSource).setData(geoJsonData);
          } else {
            // Otherwise, add the source and layer
            mapRef.current.addSource(sourcesRef.current.wells, {
              type: 'geojson',
              data: geoJsonData
            });
            
            mapRef.current.addLayer({
              id: 'wells-layer',
              type: 'circle',
              source: sourcesRef.current.wells,
              paint: {
                'circle-radius': 5,
                'circle-color': '#ff0000',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
              }
            });
            
            // Add click event for wells layer
            mapRef.current.on('click', 'wells-layer', (e: MapLayerMouseEvent) => {
              if (!e.features || e.features.length === 0) return;
              
              const coordinates = e.lngLat;
              const properties = e.features[0].properties;
              const name = properties?.name || 'Unnamed Well';
              
              // Create popup content with available metadata
              const popupContent = document.createElement('div');
              popupContent.innerHTML = `
                <h3>${name}</h3>
                ${properties ? Object.entries(properties)
                  .filter(([key]) => key !== 'name') // Skip name as it's already in the title
                  .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                  .join('') : 'No additional metadata available'}
              `;
              
              // Create and show popup
              new maplibregl.Popup()
                .setLngLat(coordinates)
                .setDOMContent(popupContent)
                .addTo(mapRef.current!);
            });
            
            // Change cursor to pointer when hovering over wells
            mapRef.current.on('mouseenter', 'wells-layer', () => {
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = 'pointer';
              }
            });
            
            // Change cursor back when leaving wells
            mapRef.current.on('mouseleave', 'wells-layer', () => {
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = '';
              }
            });
          }
          
          // Generate placeholder table data
          const placeholderTableData = [
            { id: "1", name: "Well-001", type: "Exploration", location: "Block A-123", depth: "3,450 m" },
            { id: "2", name: "Well-002", type: "Production", location: "Block B-456", depth: "2,780 m" },
            { id: "3", name: "Well-003", type: "Injection", location: "Block A-123", depth: "3,200 m" },
            { id: "4", name: "Well-004", type: "Exploration", location: "Block C-789", depth: "4,120 m" },
            { id: "5", name: "Well-005", type: "Production", location: "Block B-456", depth: "2,950 m" },
            { id: "6", name: "Well-006", type: "Monitoring", location: "Block D-012", depth: "1,850 m" },
            { id: "7", name: "Well-007", type: "Exploration", location: "Block E-345", depth: "5,230 m" },
            { id: "8", name: "Well-008", type: "Production", location: "Block A-123", depth: "3,380 m" },
            { id: "9", name: "Well-009", type: "Injection", location: "Block C-789", depth: "4,050 m" },
            { id: "10", name: "Well-010", type: "Monitoring", location: "Block D-012", depth: "2,100 m" }
          ];
          
          // Embed the table data in the message text using a special format
          const tableDataJson = JSON.stringify(placeholderTableData, null, 2);
          const messageText = `Found ${geoJsonData.features.length} wells matching your search criteria. The map has been updated to show these wells.\n\n` +
            `Here's a table of the wells found:\n\n` +
            `\`\`\`json-table-data\n${tableDataJson}\n\`\`\``;
          
          // Add a new message to show the search results with the table data
          const newMessage: Message = {
            id: uuidv4(),
            role: "ai",
            content: {
              text: messageText
            } as any, // Use type assertion to bypass type checking
            responseComplete: true,
            createdAt: new Date().toISOString(),
            chatSessionId: '',
            owner: ''
          };
          
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      }
      
      return geoJsonData;
    } catch (error) {
      console.error('Error fetching search data:', error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Add error message to chat
      const errorMessage: Message = {
        id: uuidv4(),
        role: "ai",
        content: {
          text: `Error processing your search: ${error instanceof Error ? error.message : String(error)}`
        } as any, // Use type assertion to bypass type checking
        responseComplete: true,
        createdAt: new Date().toISOString(),
        chatSessionId: '',
        owner: ''
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      return null;
    } finally {
      setIsLoadingMapData(false);
    }
  }, [amplifyClient, isAuthenticated]);

  // Function to fetch map data from Amplify GraphQL
  const fetchMapData = useCallback(async () => {
    if (!amplifyClient || !isAuthenticated) {
      console.warn('Amplify client not available or user not authenticated');
      return null;
    }

    setIsLoadingMapData(true);
    setError(null);
    
    try {
      // Use Amplify GraphQL query for catalog map data
      const response = await amplifyClient.queries.getCatalogMapData({ 
        type: "get_all_map_data" 
      });
      
      if (response.errors && response.errors.length > 0) {
        throw new Error(`GraphQL error: ${response.errors.map(e => e.message).join(', ')}`);
      }
      
      if (!response.data) {
        throw new Error('No data returned from catalog map data service');
      }
      
      // Parse the response data
      let geoData;
      try {
        geoData = JSON.parse(response.data);
        console.log('Final geoData structure:', geoData);
      } catch (error) {
        console.error('Error parsing map data response:', error);
        throw new Error('Invalid JSON response from map data service');
      }
      
      // Set the map data state, ensuring we have valid data
      setMapData({
        wells: geoData.wells || null,
        seismic: geoData.seismic || null
      });
      
      // Log what we're setting in the state
      console.log('Setting mapData state:', {
        wells: geoData.wells ? 'present' : 'missing',
        seismic: geoData.seismic ? 'present' : 'missing'
      });
      
      return geoData;
    } catch (error) {
      console.error('Error fetching map data:', error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoadingMapData(false);
    }
  }, [amplifyClient, isAuthenticated]);
  
  // Initialize Amplify client and check authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await getCurrentUser();
        const client = generateClient<Schema>();
        setAmplifyClient(client);
        setIsAuthenticated(true);
      } catch (error) {
        console.warn('User not authenticated:', error);
        setIsAuthenticated(false);
      }
    };

    initializeAuth();
  }, []);

  // MultiPolygon-related functions removed

  useEffect(() => {
    // Initialize or reinitialize map when selectedId is "seg-1" or when theme changes
    if (selectedId === "seg-1") {
      // If map container exists but map isn't initialized or needs to be reinitialized
      const mapContainer = document.getElementById("map");
      if (mapContainer && (!mapRef.current || mapRef.current.getContainer() !== mapContainer)) {
        // Clean up previous map instance if it exists
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        
        // Create new map instance
        mapRef.current = new maplibregl.Map({
          container: "map",
          style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`,
          center: [108.300, 14.000], // 13.929305410576353, 108.31485104240228
          zoom: 5,
        });

        // Add scale control with metric units (kilometers)
        const scale = new maplibregl.ScaleControl({
          maxWidth: 200,
          unit: 'metric'
        });
        mapRef.current.addControl(scale, 'top-right');
        mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
        
        // Wait for the map to load before adding sources and layers
        mapRef.current.on('load', () => {
          // Map initialization without MultiPolygon features
          
          // Fetch map data when the map loads
          fetchMapData().then(geoData => {
            if (!geoData || !mapRef.current) return;
            
            // Add sources and layers for wells if available
            if (geoData.wells) {
              // Add wells source if it doesn't exist
              if (!mapRef.current.getSource(sourcesRef.current.wells)) {
                mapRef.current.addSource(sourcesRef.current.wells, {
                  type: 'geojson',
                  data: geoData.wells
                });
                
              // Add wells layer
              mapRef.current.addLayer({
                id: 'wells-layer',
                type: 'circle',
                source: sourcesRef.current.wells,
                paint: {
                  'circle-radius': 5,
                  'circle-color': '#ff0000',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#ffffff'
                }
              });
              
              // Add click event for wells layer
              mapRef.current.on('click', 'wells-layer', (e: MapLayerMouseEvent) => {
                if (!e.features || e.features.length === 0) return;
                
                const coordinates = e.lngLat;
                const properties = e.features[0].properties;
                const name = properties?.name || 'Unnamed Well';
                
                // Create popup content with available metadata
                const popupContent = document.createElement('div');
                popupContent.innerHTML = `
                  <h3>${name}</h3>
                  ${properties ? Object.entries(properties)
                    .filter(([key]) => key !== 'name') // Skip name as it's already in the title
                    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                    .join('') : 'No additional metadata available'}
                `;
                
                // Create and show popup
                new maplibregl.Popup()
                  .setLngLat(coordinates)
                  .setDOMContent(popupContent)
                  .addTo(mapRef.current!);
              });
              
              // Change cursor to pointer when hovering over wells
              mapRef.current.on('mouseenter', 'wells-layer', () => {
                if (mapRef.current) {
                  mapRef.current.getCanvas().style.cursor = 'pointer';
                }
              });
              
              // Change cursor back when leaving wells
              mapRef.current.on('mouseleave', 'wells-layer', () => {
                if (mapRef.current) {
                  mapRef.current.getCanvas().style.cursor = '';
                }
              });
              } else {
                // Update existing source
                (mapRef.current.getSource(sourcesRef.current.wells) as GeoJSONSource).setData(geoData.wells);
              }
            }
            
            // Add sources and layers for seismic if available
            if (geoData.seismic) {
              // Add seismic source if it doesn't exist
              if (!mapRef.current.getSource(sourcesRef.current.seismic)) {
                mapRef.current.addSource(sourcesRef.current.seismic, {
                  type: 'geojson',
                  data: geoData.seismic
                });
                
              // Add seismic layer
              mapRef.current.addLayer({
                id: 'seismic-layer',
                type: 'line',
                source: sourcesRef.current.seismic,
                paint: {
                  'line-color': '#0000ff',
                  'line-width': 2
                }
              });
              
              // Add click event for seismic layer
              mapRef.current.on('click', 'seismic-layer', (e: MapLayerMouseEvent) => {
                if (!e.features || e.features.length === 0) return;
                
                const coordinates = e.lngLat;
                const properties = e.features[0].properties;
                const name = properties?.name || 'Unnamed Seismic Grid';
                
                // Create popup content with available metadata
                const popupContent = document.createElement('div');
                popupContent.innerHTML = `
                  <h3>${name}</h3>
                  ${properties ? Object.entries(properties)
                    .filter(([key]) => key !== 'name') // Skip name as it's already in the title
                    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                    .join('') : 'No additional metadata available'}
                `;
                
                // Create and show popup
                new maplibregl.Popup()
                  .setLngLat(coordinates)
                  .setDOMContent(popupContent)
                  .addTo(mapRef.current!);
              });
              
              // Change cursor to pointer when hovering over seismic lines
              mapRef.current.on('mouseenter', 'seismic-layer', () => {
                if (mapRef.current) {
                  mapRef.current.getCanvas().style.cursor = 'pointer';
                }
              });
              
              // Change cursor back when leaving seismic lines
              mapRef.current.on('mouseleave', 'seismic-layer', () => {
                if (mapRef.current) {
                  mapRef.current.getCanvas().style.cursor = '';
                }
              });
              } else {
                // Update existing source
                (mapRef.current.getSource(sourcesRef.current.seismic) as GeoJSONSource).setData(geoData.seismic);
              }
            }
          });
        });
        
        // Ensure the map renders properly by triggering a resize after initialization
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 100);
      } else if (mapRef.current) {
        // If map already exists, just update the style and resize
        mapRef.current.setStyle(`https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${mapColorScheme}`);
        
        // Resize the map to ensure proper rendering
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.resize();
          }
        }, 100);
      }
    }
    
    // Add window resize handler
    const handleResize = () => {
      if (mapRef.current && selectedId === "seg-1") {
        mapRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      // We don't remove the map on unmount anymore, as we want to preserve it when switching tabs
      // It will be properly cleaned up when needed in the effect logic above
    };
  }, [colorScheme, mapColorScheme, selectedId, fetchMapData]);
  
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
                padding: '15px',
                width: '200px',
                height: '200px',
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
            <div id="map" style={{ width: '100%', height: 'calc(100vh - 200px)', borderRadius: '0 0 16px 16px' }} />
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
                    // ...messages,
                    ...(messages ? messages : []),
                  ].filter((message) => {
                    // if (showChainOfThought) return true
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
                      <ChatMessage
                        message={message}
                      // onRegenerateMessage={message.role === 'human' ? handleRegenerateMessage : undefined}
                      />
                    </ListItem>
                  ));
                })()}
                {/* <div ref={messagesEndRef} /> */}
              </List>
            </Container>
          </div>
        )}


        <div className='convo'>

          {/* Main chat area - always full width with padding for desktop drawer */}
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
                {/* Chain of Thought */}
                {/* <Tooltip title={showChainOfThought ? "Hide Chain of Thought" : "Show Chain of Thought"}>
                                            <IconButton
                                                onClick={() => setShowChainOfThought(!showChainOfThought)}
                                                color="primary"
                                                size="large"
                                                sx={{
                                                    bgcolor: showChainOfThought ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                    zIndex: 1300 // Ensure button is above drawer
                                                }}
                                            >
                                                <PsychologyIcon />
                                            </IconButton>
                                        </Tooltip> */}

                {/* File Drawer */}
                <div style={{ marginLeft: '20px' }}>
                  <IconButton
                    onClick={handleCreateNewChat}
                    color="primary"
                    size="large"
                  >
                    <RestartAlt />
                  </IconButton>
                  {/* <Button onClick={handleCreateNewChat}>Reset Chat</Button> */}
                </div>

                <Tooltip title={fileDrawerOpen ? "Hide Files" : "View Files"}>
                  <IconButton
                    onClick={() => setFileDrawerOpen(!fileDrawerOpen)}
                    color="primary"
                    size="large"
                    sx={{
                      bgcolor: fileDrawerOpen ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      zIndex: 1300 // Ensure button is above drawer
                    }}
                  >
                    <FolderIcon />
                  </IconButton>
                </Tooltip>
              </div>

              {/* <Divider /> */}


              {/* <ChatBox
                                                chatSessionId={activeChatSession.id}
                                                showChainOfThought={showChainOfThought}
                                            /> */}
              <CatalogChatBox
                onInputChange={setUserInput}
                userInput={userInput}
                messages={messages}
                setMessages={setMessages}
                onSendMessage={async (message: string) => {
                  if (selectedId === "seg-1" && message) {
                    // Process the user's message for map search
                    await handleChatSearch(message);
                  }
                }}
              />

            </div>
          </div> 

          {/* Floating file button for mobile - only show when drawer is closed */}
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

          {/* File Drawer - completely different handling for mobile vs desktop */}
          <FileDrawer
            open={fileDrawerOpen}
            onClose={() => setFileDrawerOpen(false)}
            chatSessionId={activeChatSession.id || ""}
            variant={drawerVariant}
          />

        </div>
      </Grid >
    </div>
  );
}
