'use client';

import React, { useEffect, useState } from 'react';
import { Alert, BreadcrumbGroup, Cards, Container, ContentLayout, Grid, Header, SpaceBetween, Table, Box, Button, Pagination, SegmentedControl } from '@cloudscape-design/components';
import { useTheme, IconButton, Tooltip, List, ListItem, useMediaQuery } from '@mui/material';
import FileDrawer from '@/components/FileDrawer';
import FolderIcon from '@mui/icons-material/Folder';
import RestartAlt from '@mui/icons-material/RestartAlt';
import ChatBox from "@/components/ChatBox";
import ChatMessage from '@/components/ChatMessage';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { sendMessage } from '../../../utils/amplifyUtils';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; // Import the CSS for the map

const amplifyClient = generateClient<Schema>();

interface DataCollection {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  owner: string;
}

export default function CatalogPage() {
  const [selectedId, setSelectedId] = useState("seg-1");
  const [selectedItems, setSelectedItems] = React.useState([{ name: "", description: "", prompt: "" }]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<Schema["ChatSession"]["createType"]>({ id: "default" });
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
      // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
      amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" })

      const newChatSession = await amplifyClient.models.ChatSession.create({});
      // Use router.push here if you want to navigate
      // router.push(`/chat/${newChatSession.data!.id}`);
      if (newChatSession.data) {
        setActiveChatSession({ ...newChatSession.data });
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("Failed to create chat session.");
    }
  }

  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const mapName = "EdiTestMap";
  const region = "us-east-1";
  const style = "Standard";

  // Store map instance in a ref so it persists across renders
  const mapRef = React.useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: "map",
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [3.151419, 56.441028],
        zoom: 4,
      });

      // Add scale control with metric units (kilometers)
      const scale = new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
      });
      mapRef.current.addControl(scale, 'top-right');
      mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
      
      // Create a custom geocoder control compatible with MapLibre GL
      // We'll create a simple search box that will be styled to match the map
      const geocoderContainer = document.createElement('div');
      geocoderContainer.className = 'maplibre-geocoder';
      geocoderContainer.style.margin = '10px';
      geocoderContainer.style.width = '240px';
      geocoderContainer.style.zIndex = '1';
      
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search for locations';
      searchInput.style.width = '100%';
      searchInput.style.padding = '8px 12px';
      searchInput.style.borderRadius = '4px';
      searchInput.style.border = '1px solid #ccc';
      searchInput.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
      searchInput.style.fontSize = '14px';
      
      geocoderContainer.appendChild(searchInput);
      
      // Add the custom geocoder control to the map
      mapRef.current.getContainer().querySelector('.maplibregl-ctrl-top-left')?.appendChild(geocoderContainer);
      
      // Add event listener for the search input
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && mapRef.current) {
          const query = searchInput.value;
          // Use Amazon Location Service to search for the location
          fetch(`https://places.geo.${region}.amazonaws.com/v2/places/text/search?key=${apiKey}&text=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
              if (data.Results && data.Results.length > 0) {
                const result = data.Results[0];
                const coordinates = result.Place.Geometry.Point;
                
                // Fly to the location
                mapRef.current?.flyTo({
                  center: coordinates,
                  zoom: 12
                });
                
                // Add a marker at the location
                if (mapRef.current) {
                  const marker = new maplibregl.Marker()
                    .setLngLat(coordinates)
                    .addTo(mapRef.current);
                }
              }
            })
            .catch(error => {
              console.error('Error searching for location:', error);
            });
        }
      });
      
      // Ensure the map renders properly by triggering a resize after initialization
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 100);
    } else {
      // Update the map style when colorScheme changes
      mapRef.current.setStyle(`https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`);
      
      // Resize the map when style changes to ensure proper rendering
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 100);
    }
    
    // Add window resize handler
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [colorScheme]); // Add colorScheme to dependency array to update map when theme changes
  
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
            <div id="map" />
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
                        return !['renderAssetTool', 'userInputTool', 'createProject'].includes(message.toolName!);
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

                  return filteredMessages.map((message) => (
                    <ListItem key={message.id}>
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
              <ChatBox
                chatSessionId={activeChatSession.id || ""}
                showChainOfThought={showChainOfThought}
                onInputChange={setUserInput}
                userInput={userInput}
                messages={messages}
                setMessages={setMessages}
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
