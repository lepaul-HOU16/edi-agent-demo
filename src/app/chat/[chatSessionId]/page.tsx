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
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import Badge from '@cloudscape-design/components/badge';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import ColumnLayout from '@cloudscape-design/components/column-layout';
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
    
    // Memoized message handlers to prevent parent re-renders from interfering with message state
    const stableSetMessages = React.useCallback((newMessages: Message[] | ((prevMessages: Message[]) => Message[])) => {
        console.log('Parent: Setting messages', typeof newMessages === 'function' ? 'function' : newMessages.length);
        setMessages(newMessages);
    }, []);
    
    const stableMessages = React.useMemo(() => messages, [messages]);
    
    // Chain of thought auto-scroll state
    const [chainOfThoughtAutoScroll, setChainOfThoughtAutoScroll] = useState<boolean>(true);
    const [chainOfThoughtMessageCount, setChainOfThoughtMessageCount] = useState<number>(0);
    const chainOfThoughtContainerRef = React.useRef<HTMLDivElement>(null);
    const chainOfThoughtEndRef = React.useRef<HTMLDivElement>(null);
    const chainOfThoughtScrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll functionality for chain of thought
    const scrollChainOfThoughtToBottom = React.useCallback(() => {
        if (chainOfThoughtAutoScroll) {
            console.log('🔄 Chain of Thought: Attempting auto-scroll...');
            
            // Use consistent scrollTop approach with proper timing
            if (chainOfThoughtContainerRef.current) {
                console.log('✅ Chain of Thought: Using scrollTop to max height');
                try {
                    const container = chainOfThoughtContainerRef.current;
                    // Use requestAnimationFrame for better timing
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
        
        // Check if user scrolled up from bottom (with a small buffer)
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
        
        if (!isAtBottom && chainOfThoughtAutoScroll) {
            console.log('Chain of Thought: User scrolled up, disabling auto-scroll');
            setChainOfThoughtAutoScroll(false);
        }
    }, [chainOfThoughtAutoScroll]);

    // Monitor messages for chain of thought steps to trigger auto-scroll
    React.useEffect(() => {
        // Count total thought steps across all messages
        let totalThoughtSteps = 0;
        
        try {
            const thoughtStepsFromMessages = messages
                .filter(message => message.role === 'ai' && (message as any).thoughtSteps)
                .flatMap(message => {
                    const steps = (message as any).thoughtSteps || [];
                    console.log('📦 Chain of thought: Found message with', steps.length, 'steps');
                    
                    // Parse JSON strings if needed
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
        
        // If we have new thought steps and auto-scroll is enabled, scroll to bottom
        if (totalThoughtSteps > chainOfThoughtMessageCount && chainOfThoughtAutoScroll) {
            console.log('🔄 Chain of thought: New steps detected, scrolling to bottom');
            
            // Clear any existing timeout
            if (chainOfThoughtScrollTimeoutRef.current) {
                clearTimeout(chainOfThoughtScrollTimeoutRef.current);
            }
            
            // Scroll after a brief delay to ensure DOM has updated
            chainOfThoughtScrollTimeoutRef.current = setTimeout(() => {
                scrollChainOfThoughtToBottom();
            }, 150);
        }
        
        // If we have new steps but auto-scroll is disabled, re-enable it for new content
        if (totalThoughtSteps > chainOfThoughtMessageCount && !chainOfThoughtAutoScroll) {
            console.log('� Chain of thought: New content detected, re-enabling auto-scroll');
            setChainOfThoughtAutoScroll(true);
            
            // Clear any existing timeout
            if (chainOfThoughtScrollTimeoutRef.current) {
                clearTimeout(chainOfThoughtScrollTimeoutRef.current);
            }
            
            // Scroll after a brief delay
            chainOfThoughtScrollTimeoutRef.current = setTimeout(() => {
                scrollChainOfThoughtToBottom();
            }, 150);
        }
        
        setChainOfThoughtMessageCount(totalThoughtSteps);
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
    
    // Chain of thought progressive disclosure state
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
    const [chainOfThoughtData, setChainOfThoughtData] = useState<any[]>([]);
    
    // Reset chain of thought state when chat session changes
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [forceRefresh, setForceRefresh] = useState<number>(0);
    
    React.useEffect(() => {
        const sessionId = activeChatSession?.id;
        if (sessionId && sessionId !== currentSessionId) {
            // Clear expanded steps and reset data when navigating to a different chat session
            setExpandedSteps({});
            setChainOfThoughtData([]);
            setCurrentSessionId(sessionId);
            setForceRefresh(Date.now()); // Force component refresh
            console.log('🔄 Chain of thought state reset for new session:', sessionId);
        }
    }, [activeChatSession?.id, currentSessionId]);

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
            console.log('🔄 Creating new chat session and resetting chain of thought...');
            
            // Reset chain of thought state first
            setExpandedSteps({});
            setChainOfThoughtData([]);
            setMessages([]);
            setChainOfThoughtMessageCount(0);
            setChainOfThoughtAutoScroll(true);
            
            console.log('✅ Chain of thought state reset successfully');
            
            // Create a default name with date and time for the new chat session
            const defaultName = `New Canvas - ${new Date().toLocaleString()}`;
            const newChatSession = await amplifyClient.models.ChatSession.create({
                name: defaultName
            } as any);
            
            if (newChatSession.data?.id) {
                console.log('✅ New chat session created:', newChatSession.data.id);
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
                                { text: 'Data Catalog', href: '/catalog' },
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
                                Explore pre-built, AI-enhanced workflows designed for geoscientists to
                                analyze well data and streamline petrophysical interpretations.
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
                                    // Use React's proper state update mechanism to avoid render warnings
                                    React.startTransition(() => {
                                        setSelectedItems(detail?.selectedItems ?? []);
                                        setUserInput(detail?.selectedItems[0]?.prompt || '');
                                    });
                                }}
                                selectedItems={selectedItems}
                                items={[
                                    {
                                        name: 'Production Well Data Discovery (24 Wells)',
                                        description: 'Comprehensive analysis of all 24 production wells (WELL-001 through WELL-024) with spatial distribution and log curve inventory.',
                                        prompt: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
                                    },
                                    {
                                        name: 'Multi-Well Correlation Analysis (WELL-001 to WELL-005)',
                                        description: 'AI-powered correlation analysis with interactive visualization panels, geological interpretation, and development strategy recommendations using the first 5 wells.',
                                        prompt: 'Create a comprehensive multi-well correlation analysis for wells WELL-001, WELL-002, WELL-003, WELL-004, and WELL-005. Generate normalized log correlations showing gamma ray, resistivity, and porosity data. Include geological correlation lines, reservoir zone identification, and statistical analysis. Create interactive visualization components with expandable technical documentation.',
                                    },
                                    {
                                        name: 'Comprehensive Shale Analysis (WELL-001)',
                                        description: 'Advanced shale volume calculation using gamma ray data from WELL-001 with interactive depth plots and reservoir quality assessment.',
                                        prompt: 'Perform comprehensive shale analysis on WELL-001 using gamma ray data. Calculate shale volume using Larionov method, identify clean sand intervals, and generate interactive depth plots. Include statistical summaries, uncertainty analysis, and reservoir quality assessment with expandable technical details.',
                                    },
                                    {
                                        name: 'Integrated Porosity Analysis (Wells 001-003)',
                                        description: 'Multi-well porosity analysis using density-neutron data from WELL-001, WELL-002, and WELL-003 with crossplot generation.',
                                        prompt: 'Perform integrated porosity analysis for WELL-001, WELL-002, and WELL-003 using RHOB (density) and NPHI (neutron) data. Generate density-neutron crossplots, calculate porosity, identify lithology, and create reservoir quality indices. Include interactive visualizations and professional documentation.',
                                    },
                                    {
                                        name: 'Professional Porosity Calculation (WELL-001)',
                                        description: 'Enterprise-grade porosity calculation using density-neutron methodology with complete uncertainty analysis and SPE/API documentation.',
                                        prompt: 'Calculate porosity for WELL-001 using enhanced professional methodology. Include density porosity, neutron porosity, and effective porosity calculations with statistical analysis, uncertainty assessment, and complete technical documentation following SPE/API standards.',
                                    },
                                    // {
                                    //     name: 'Advanced Shale Volume Analysis (WELL-001)',
                                    //     description: 'Professional shale volume calculation using Larionov methods with geological interpretation and reservoir assessment.',
                                    //     prompt: 'Perform advanced shale volume calculation for WELL-001 using Larionov tertiary method. Include net-to-gross analysis, clean sand identification, statistical validation, and professional geological interpretation with industry-standard documentation.',
                                    // },
                                    // {
                                    //     name: 'Water Saturation Assessment (WELL-001)',
                                    //     description: 'Comprehensive water saturation calculation using Archie equation with hydrocarbon assessment and completion recommendations.',
                                    //     prompt: 'Calculate water saturation for WELL-001 using enhanced Archie equation methodology. Include resistivity analysis, porosity integration, hydrocarbon saturation assessment, and completion strategy recommendations with uncertainty analysis.',
                                    // },
                                    // {
                                    //     name: 'Data Quality Assessment (WELL-001)',
                                    //     description: 'Professional log data quality evaluation with completeness analysis, outlier detection, and SPE-standard quality metrics.',
                                    //     prompt: 'Assess data quality for gamma ray curve in WELL-001. Perform comprehensive quality analysis including data completeness, outlier detection, statistical validation, and professional recommendations following SPE data quality standards.',
                                    // }
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
                                        These pre-built workflows leverage AI techniques to provide
                                        enhanced geoscientific analysis and recommendations.
                                    </Alert>
                                </div>
                            </Box>
                        </Container>
                    </div>
                ) : (
                    // Chain of Thought here
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
                            {/* Create a proper scrollable container within the panel */}
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
                                    // ENHANCED: Extract thought steps with better debugging and data handling
                                    console.log('🧠 Chain of Thought: Processing messages for thought steps...');
                                    console.log('🔍 Total messages:', messages.length);
                                    
                                    // Debug each message
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

                                    // Extract thought steps with enhanced error handling
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
                                                
                                                // CRITICAL FIX: Parse JSON strings stored in database
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
                                                    return step; // Already an object
                                                }) : [];
                                                
                                                return parsedSteps.filter(Boolean); // Remove nulls
                                            })
                                            .filter(step => step && typeof step === 'object') // Ensure valid step objects
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

                                    // If we have real thought steps, show them with Cloudscape Design components
                                    if (thoughtStepsFromMessages.length > 0) {
                                        console.log('🎉 Rendering', thoughtStepsFromMessages.length, 'thought steps');
                                        return (
                                            <SpaceBetween direction="vertical" size="m">
                                                {thoughtStepsFromMessages.map((step, index) => {
                                                    // ENHANCED: Provide fallback values for missing data
                                                    const stepTitle = step.title || `Step ${index + 1}`;
                                                    const stepSummary = step.summary || 'Processing...';
                                                    const stepId = step.id || `step-${index}`;
                                                    const stepStatus = step.status || 'complete';
                                                    const stepType = step.type || 'processing';
                                                    
                                                    // Get appropriate Cloudscape icon and status for each step type
                                                    const getStepConfig = (type: string, status: string) => {
                                                        const configs = {
                                                            intent_detection: {
                                                                iconName: 'search',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'blue'
                                                            },
                                                            parameter_extraction: {
                                                                iconName: 'edit',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'severity-medium'
                                                            },
                                                            tool_selection: {
                                                                iconName: 'folder',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'green'
                                                            },
                                                            execution: {
                                                                iconName: 'status-in-progress',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'blue'
                                                            },
                                                            validation: {
                                                                iconName: 'status-positive',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'green'
                                                            },
                                                            completion: {
                                                                iconName: 'tick',
                                                                statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                                variant: 'green'
                                                            }
                                                        };
                                                        
                                                        return configs[type] || {
                                                            iconName: 'refresh',
                                                            statusType: status === 'complete' ? 'success' : status === 'error' ? 'error' : 'in-progress',
                                                            variant: 'blue'
                                                        };
                                                    };
                                                    
                                                    const config = getStepConfig(stepType, stepStatus);
                                                    
                                                    return (
                                                        <Container
                                                            key={stepId}
                                                            header={
                                                                <SpaceBetween direction="horizontal" size="m" alignItems="center">
                                                                    <SpaceBetween direction="horizontal" size="s" alignItems="center">
                                                                        <Icon name={config.iconName} />
                                                                        <Box variant="h3" fontWeight="bold">
                                                                            {stepTitle}
                                                                        </Box>
                                                                        <StatusIndicator type={config.statusType}>
                                                                            {stepStatus === 'complete' ? 'Complete' : 
                                                                             stepStatus === 'error' ? 'Error' : 
                                                                             stepStatus === 'thinking' ? 'Processing' : 'Complete'}
                                                                        </StatusIndicator>
                                                                    </SpaceBetween>
                                                                    <SpaceBetween direction="horizontal" size="xs">
                                                                        <Badge color={config.variant}>
                                                                            {stepType.replace('_', ' ').toUpperCase()}
                                                                        </Badge>
                                                                        {step.confidence && (
                                                                            <Badge color="green">
                                                                                {Math.round((step.confidence || 0) * 100)}% confidence
                                                                            </Badge>
                                                                        )}
                                                                        {step.duration && (
                                                                            <Badge>
                                                                                {step.duration}ms
                                                                            </Badge>
                                                                        )}
                                                                    </SpaceBetween>
                                                                </SpaceBetween>
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

                                    // ENHANCED: Show debug info in empty state using Cloudscape components
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
                                {/* Auto-scroll anchor point */}
                                <div ref={chainOfThoughtEndRef} style={{ height: '1px' }} />
                            </div>
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
                                messages={stableMessages}
                                setMessages={stableSetMessages}
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
