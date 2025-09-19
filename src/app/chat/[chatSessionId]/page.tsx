'use client';

import React, { useEffect, useState } from 'react';

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { Typography, Paper, Divider, IconButton, Tooltip, List, ListItem, useTheme, useMediaQuery, Breadcrumbs } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Message } from '../../../../utils/types';
import ChatMessage from '../../../components/ChatMessage';

import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Cards from '@cloudscape-design/components/cards';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Icon from '@cloudscape-design/components/icon';
import { useRouter } from 'next/navigation';
import RestartAlt from '@mui/icons-material/RestartAlt';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

import ChatBox from "@/components/ChatBox"
import EditableTextBox from '@/components/EditableTextBox';
import { withAuth } from '@/components/WithAuth';
import FileDrawer from '@/components/FileDrawer';
import { sendMessage } from '../../../../utils/amplifyUtils';
import zIndex from '@mui/material/styles/zIndex';

function Page({
    params,
}: {
    params: Promise<{ chatSessionId: string }>
}) {
    const [userInput, setUserInput] = useState<string>('');
    const [activeChatSession, setActiveChatSession] = useState<any>();
    const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
    const [showChainOfThought, setShowChainOfThought] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [messages, setMessages] = useState<Message[]>([]);
    const router = useRouter();
    const [amplifyClient, setAmplifyClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);
    
    // Chain of thought auto-scroll state
    const [chainOfThoughtAutoScroll, setChainOfThoughtAutoScroll] = useState<boolean>(true);
    const [chainOfThoughtMessageCount, setChainOfThoughtMessageCount] = useState<number>(0);
    const chainOfThoughtContainerRef = React.useRef<HTMLDivElement>(null);
    const chainOfThoughtEndRef = React.useRef<HTMLDivElement>(null);
    const chainOfThoughtScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll functionality for chain of thought
    const scrollChainOfThoughtToBottom = React.useCallback(() => {
        if (chainOfThoughtEndRef.current && chainOfThoughtAutoScroll) {
            console.log('Chain of Thought: Auto-scrolling to bottom');
            chainOfThoughtEndRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
        }
    }, [chainOfThoughtAutoScroll]);

    // Handle scroll events to detect user interrupt
    const handleChainOfThoughtScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        // Check if user scrolled up from bottom (with a small buffer)
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
        
        if (!isAtBottom && chainOfThoughtAutoScroll) {
            console.log('Chain of Thought: User scrolled up, disabling auto-scroll');
            setChainOfThoughtAutoScroll(false);
        }
    }, [chainOfThoughtAutoScroll]);

    // Monitor filtered messages for changes to trigger auto-scroll
    React.useEffect(() => {
        const filteredMessages = messages.filter((message) => {
            switch (message.role) {
                case 'ai':
                    return !message.responseComplete;
                case 'tool':
                    return !['renderAssetTool', 'userInputTool', 'createProject'].includes(message.toolName as any);
                default:
                    return false;
            }
        });

        const newMessageCount = filteredMessages.length;
        
        // If we have new messages and auto-scroll is enabled, scroll to bottom
        if (newMessageCount > chainOfThoughtMessageCount && chainOfThoughtAutoScroll) {
            // Clear any existing timeout
            if (chainOfThoughtScrollTimeoutRef.current) {
                clearTimeout(chainOfThoughtScrollTimeoutRef.current);
            }
            
            // Scroll after a brief delay to ensure DOM has updated
            chainOfThoughtScrollTimeoutRef.current = setTimeout(() => {
                scrollChainOfThoughtToBottom();
            }, 100);
        }
        
        // If we have new messages but auto-scroll is disabled, re-enable it for new content
        if (newMessageCount > chainOfThoughtMessageCount && !chainOfThoughtAutoScroll) {
            console.log('Chain of Thought: New content detected, re-enabling auto-scroll');
            setChainOfThoughtAutoScroll(true);
            
            // Clear any existing timeout
            if (chainOfThoughtScrollTimeoutRef.current) {
                clearTimeout(chainOfThoughtScrollTimeoutRef.current);
            }
            
            // Scroll after a brief delay to ensure DOM has updated
            chainOfThoughtScrollTimeoutRef.current = setTimeout(() => {
                scrollChainOfThoughtToBottom();
            }, 100);
        }
        
        setChainOfThoughtMessageCount(newMessageCount);
    }, [messages, chainOfThoughtMessageCount, chainOfThoughtAutoScroll, scrollChainOfThoughtToBottom]);

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (chainOfThoughtScrollTimeoutRef.current) {
                clearTimeout(chainOfThoughtScrollTimeoutRef.current);
            }
        };
    }, []);

    const setActiveChatSessionAndUpload = async (newChatSession: any) => {
        if (!amplifyClient) return;
        
        try {
            const resolvedParams = await params;
            const { data: updatedChatSession } = await amplifyClient.models.ChatSession.update({
                id: resolvedParams.chatSessionId,
                ...newChatSession
            } as any);

            if (updatedChatSession) setActiveChatSession(updatedChatSession);
        } catch (error) {
            console.error('Error updating chat session:', error);
        }
    }

    //Get the chat session info
    useEffect(() => {
        if (!amplifyClient) return;
        
        let isMounted = true;
        
        const fetchChatSession = async () => {
            try {
                const resolvedParams = await params;
                const chatSessionId = resolvedParams.chatSessionId;
                
                if (!isMounted || !chatSessionId) return;
                
                const { data: newChatSessionData } = await amplifyClient.models.ChatSession.get({
                    id: chatSessionId
                });
                
                if (!isMounted || !newChatSessionData) return;
                
                // If no name is provided, create a default name with date and time
                if (!newChatSessionData.name) {
                    const defaultName = `New Canvas - ${new Date().toLocaleString()}`;
                    // Save the default name to the database
                    const { data: updatedChatSession } = await amplifyClient.models.ChatSession.update({
                        id: chatSessionId,
                        name: defaultName
                    } as any);
                    if (isMounted) {
                        if (updatedChatSession) {
                            setActiveChatSession(updatedChatSession);
                        } else {
                            setActiveChatSession({ ...newChatSessionData, name: defaultName });
                        }
                    }
                } else {
                    if (isMounted) {
                        setActiveChatSession(newChatSessionData);
                    }
                }
            } catch (error) {
                console.error('Error fetching chat session:', error);
            }
        }
        
        fetchChatSession();
        
        return () => {
            isMounted = false;
        };
    }, [amplifyClient]);

    // Drawer variant only matters for mobile now
    const drawerVariant = "temporary";

    // Add state for segmented control
    const [selectedId, setSelectedId] = useState("seg-1");
    const [selectedItems, setSelectedItems] = React.useState([{ name: "", description: "", prompt: "" }]);

    // Initialize Amplify client
    useEffect(() => {
        try {
            const client = generateClient<Schema>();
            setAmplifyClient(client);
        } catch (error) {
            console.error('Failed to generate Amplify client:', error);
        }
    }, []);

    if (!activeChatSession || !activeChatSession.id) {
        return (
            <div style={{
                display: 'flex',
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                zIndex: '1200',
            }}>
                <Paper elevation={3} sx={{ p: 6, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Loading your chat session...</Typography>
                </Paper>
            </div>
        );
    }

    const handleCreateNewChat = async () => {
        if (!amplifyClient) return;
        
        try {
            // Create a default name with date and time for the new chat session
            const defaultName = `New Canvas - ${new Date().toLocaleString()}`;
            const newChatSession = await amplifyClient.models.ChatSession.create({
                name: defaultName
            } as any);
            
            if (newChatSession.data?.id) {
                router.push(`/chat/${newChatSession.data.id}`);
            } else {
                throw new Error('Failed to create chat session - no ID returned');
            }
        } catch (error) {
            console.error("Error creating chat session:", error);
            alert("Failed to create chat session. Please try again.");
        }
    }

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
                        Workspace - Insights
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
                                    iconName: "gen-ai",
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
                                { text: 'Data Collection: Cuu Long Basin', href: '#' },
                                { text: 'Workspace', href: '#' },
                                { text: 'Canvas: Petrophysical Analysis', href: '#' }
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
                        <Container
                            footer=""
                            header="AI-Powered Workflow Recommendations"
                        >
                            <Box
                                variant="h2"
                                margin={{ bottom: 'l' }}
                            >
                                Accelerate Your Data Analysis
                            </Box>
                            <Box margin={{ bottom: 'm' }}>
                                Discover automated, AI-powered workflows tailored for geoscientists to
                                interpret assets and expedite your data-driven analysis in data collections.
                            </Box>
                            <Cards
                                header=""
                                selectionType="single"
                                trackBy="name"
                                cardDefinition={{
                                    header: item => item.name,
                                    sections: [
                                        {
                                            id: 'description',
                                            header: 'Description',
                                            content: item => item.description,
                                        },
                                        {
                                            id: 'prompt',
                                        }

                                    ],
                                }}
                                onSelectionChange={({ detail }) => {
                                    // Defer both state updates to avoid updating component during render
                                    setTimeout(() => {
                                        setSelectedItems(detail?.selectedItems ?? [])
                                        setUserInput(detail?.selectedItems[0]?.prompt || '')
                                    }, 0)
                                }}
                                selectedItems={selectedItems}
                                items={[
                                    {
                                        name: 'Well Data Discovery & Summary',
                                        description: 'Discover and analyze available well log data to provide quick insights into the dataset.',
                                        prompt: 'How many wells do I have? Explore the well data in global/well-data/ directory and create a summary showing what log types are available across the wells. Generate a simple visualization showing the spatial distribution of wells and basic statistics about the dataset.',
                                    },
                                    {
                                        name: 'Gamma Ray Shale Analysis',
                                        description: 'Calculate and visualize shale volume across wells using gamma ray data.',
                                        prompt: 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.',
                                    },
                                    {
                                        name: 'Porosity from Density-Neutron',
                                        description: 'Calculate porosity and create density-neutron crossplot for reservoir characterization.',
                                        prompt: 'Extract density and neutron log data from the wells and calculate porosity. Create a density-neutron crossplot to identify lithology and highlight high-porosity zones. Generate depth plots showing porosity variations and identify the best reservoir intervals.',
                                    },
                                    {
                                        name: 'Multi-Well Log Correlation',
                                        description: 'Create correlation panel showing key logs across multiple wells.',
                                        prompt: 'Create a correlation panel showing gamma ray, resistivity, and porosity logs across 4-5 wells. Normalize the logs and create an interactive visualization that highlights geological patterns and reservoir zones. Make it visually appealing for presentation purposes.',
                                    }
                                ]}
                                loadingText="Loading resources"
                                cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 1 }]}
                                entireCardClickable={true}
                                firstIndex={1}
                            // selectedIndex="0"
                            />
                            <div style={{ marginTop: '8px' }}></div>
                            <Button
                                onClick={async () => {
                                    try {
                                        const selectedChatSessionId = activeChatSession.id;
                                        console.log("Selected Chat Session ID:", selectedChatSessionId);

                                        const newMessage: Schema['ChatMessage']['createType'] = {
                                            role: 'human',
                                            content: {
                                                text: userInput
                                            },
                                            chatSessionId: selectedChatSessionId!,
                                        } as any

                                        await sendMessage({
                                            chatSessionId: selectedChatSessionId!,
                                            newMessage: newMessage,
                                        });
                                        setUserInput('');
                                    } catch (error) {
                                        console.error("Failed to send message:", error);
                                    }
                                }}

                                variant="normal"
                                fullWidth={true}
                            >
                                Apply workflow
                            </Button>
                            <Box margin={{ top: 'l' }}>
                                <div style={{ marginTop: '14px' }}>
                                    <Alert
                                        statusIconAriaLabel="Info"
                                        type="info"
                                        header="Powered by Agentic AI"
                                    >
                                        These workflows are continuously learning from your latest data to provide
                                        more accurate geoscientific recommendations.
                                    </Alert>
                                </div>
                            </Box>
                        </Container>
                    </div>
                ) : (
                    // Chain of Thought here
                    <div 
                        className='panel'
                        ref={chainOfThoughtContainerRef}
                        onScroll={handleChainOfThoughtScroll}
                        style={{ overflowY: 'auto' }}
                    >
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
                                                return !['renderAssetTool', 'userInputTool', 'createProject'].includes(message.toolName as any);
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
                                        <ListItem key={String(message.id) || index}>
                                            <ChatMessage
                                                message={message}
                                            // onRegenerateMessage={message.role === 'human' ? handleRegenerateMessage : undefined}
                                            />
                                        </ListItem>
                                    ));
                                })()}
                                <div ref={chainOfThoughtEndRef} style={{ height: '1px' }} />
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
                        <EditableTextBox
                            object={activeChatSession}
                            fieldPath="name"
                            onUpdate={setActiveChatSessionAndUpload}
                            typographyVariant="h5"
                        />
                        <div style={{
                            paddingBottom: '160px',
                        }}>
                            <div className='toggles'>
                                {/* File Drawer */}
                                 <div style={{marginLeft: '20px'}}>
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
                                chatSessionId={activeChatSession.id}
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
                        chatSessionId={activeChatSession.id}
                        variant={drawerVariant}
                    />

                </div>
            </Grid >
        </div>
    );
}

export default withAuth(Page);
