import React, { useEffect, useState } from 'react';
import { Typography, Paper, Divider, IconButton, Tooltip, List, ListItem, useTheme, useMediaQuery, Breadcrumbs } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useParams, useNavigate } from 'react-router-dom';
import { Message } from '@/utils/types';
import ChatMessage from '@/components/ChatMessage';

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
// Removed Next.js router - using React Router instead
import RestartAlt from '@mui/icons-material/RestartAlt';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';

import ChatBox from "@/components/ChatBox"
import EditableTextBox from '@/components/EditableTextBox';
import { withAuth } from '@/components/WithAuth';
import FileDrawer from '@/components/FileDrawer';
import AgentSwitcher from '@/components/AgentSwitcher';
import AgentLandingPage from '@/components/AgentLandingPage';
import CollectionContextBadge from '@/components/CollectionContextBadge';
import ChainOfThoughtDisplay from '@/components/ChainOfThoughtDisplay';
import { ProjectContextProvider, useProjectContext } from '@/contexts/ProjectContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { sendMessage } from '@/utils/chatUtils';
import { getSession } from '@/lib/api/sessions';
import zIndex from '@mui/material/styles/zIndex';
import { getCanvasCollectionContext, type CollectionData, getCollectionSummary } from '@/utils/collectionInheritance';
import '@/utils/projectContextDebug'; // Initialize debug utilities
import { useRenewableJobPolling } from '@/hooks/useRenewableJobPolling';

// Inner component that uses ProjectContext
function ChatPageContent() {
    // Get active project from context
    const { activeProject } = useProjectContext();
    const { chatSessionId } = useParams<{ chatSessionId: string }>();
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState<string>('');
    const [activeChatSession, setActiveChatSession] = useState<any>();
    const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
    const [showChainOfThought, setShowChainOfThought] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [messages, setMessages] = useState<Message[]>([]);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    // Removed amplifyClient - using REST API instead
    
    // STREAMING: Poll for thought steps in realtime (fast polling for immediate updates)
    const { latestMessage: streamingMessage, hasNewResults } = useRenewableJobPolling({
        chatSessionId: chatSessionId || '',
        enabled: isWaitingForResponse && !!chatSessionId,
        pollingInterval: 500, // Poll every 500ms for fast streaming updates
        onNewMessage: (streamingMsg) => {
            console.log('[ChatPage] Received streaming thought steps:', streamingMsg.thoughtSteps?.length);
            
            // Update the last AI message with streaming thought steps
            if (streamingMsg.thoughtSteps && streamingMsg.thoughtSteps.length > 0) {
                setMessages(prev => {
                    const updated = [...prev];
                    // Find the last AI message
                    for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].role === 'ai') {
                            // Update with streaming thought steps
                            updated[i] = {
                                ...updated[i],
                                thoughtSteps: streamingMsg.thoughtSteps
                            } as any;
                            break;
                        }
                    }
                    return updated;
                });
            }
        }
    });
    
    // Collection context state
    const [collectionContext, setCollectionContext] = useState<CollectionData | null>(null);
    const [loadingCollection, setLoadingCollection] = useState(false);
    
    // Agent selection state - updated to include 'edicraft'
    const [selectedAgent, setSelectedAgent] = useState<'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft'>('auto');
    
    // Handler for agent change - updated to include 'edicraft'
    const handleAgentChange = (agent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft') => {
        console.log('Agent selection changed to:', agent);
        setSelectedAgent(agent);
        // Store in sessionStorage for persistence
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('selectedAgent', agent);
        }
    };
    
    // Handler for sending messages programmatically (e.g., from landing page buttons)
    // Options: { silent?: boolean } - when silent is true, user message won't appear in chat
    const handleSendMessage = async (message: string, options?: { silent?: boolean }) => {
        if (!activeChatSession?.id || !message.trim()) {
            console.error('Cannot send message: missing chat session or empty message');
            return;
        }
        
        try {
            console.log('🚀 [ChatPage] Sending message programmatically:', message);
            console.log('🎯 [ChatPage] Active project:', activeProject);
            console.log('🔇 [ChatPage] Silent mode:', options?.silent || false);
            
            // Create user message
            const newMessage = {
                role: 'human', // Schema expects 'human', 'ai', or 'tool'
                content: { text: message },
                chatSessionId: activeChatSession.id,
                // Note: timestamp/createdAt is auto-generated by the schema
            };
            
            // Add user message to UI immediately (unless silent mode is enabled)
            if (!options?.silent) {
                setMessages((prevMessages) => [...prevMessages, newMessage as any as Message]);
            } else {
                console.log('🔇 [ChatPage] Skipping user message display (silent mode)');
            }
            
            // Start polling for streaming thought steps
            setIsWaitingForResponse(true);
            
            // Prepare project context for backend
            const projectContext = activeProject ? {
                projectId: activeProject.projectId,
                projectName: activeProject.projectName,
                location: activeProject.location,
                coordinates: activeProject.coordinates
            } : undefined;
            
            console.log('🎯 [ChatPage] Sending project context to backend:', projectContext);
            
            // Send to backend with project context
            await sendMessage({
                chatSessionId: activeChatSession.id,
                newMessage: newMessage as any,
                agentType: selectedAgent,
                projectContext, // Pass project context to backend
            });
            
            // Stop polling when response is complete
            setIsWaitingForResponse(false);
            
            // Clear input
            setUserInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };
    
    // Restore agent selection from sessionStorage on page load - updated to include 'edicraft'
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedAgent = sessionStorage.getItem('selectedAgent');
            if (storedAgent && ['auto', 'petrophysics', 'maintenance', 'renewable', 'edicraft'].includes(storedAgent)) {
                setSelectedAgent(storedAgent as 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft');
                console.log('Restored agent selection from sessionStorage:', storedAgent);
            }
        }
    }, []);
    
    // Memoized message handlers to prevent parent re-renders from interfering with message state
    const stableSetMessages = React.useCallback((newMessages: Message[] | ((prevMessages: Message[]) => Message[])) => {
        console.log('Parent: Setting messages', typeof newMessages === 'function' ? 'function' : newMessages.length);
        setMessages(newMessages);
    }, []);
    
    const stableMessages = React.useMemo(() => messages, [messages]);
    
    // Memoized input change handler to prevent re-renders on every keystroke
    const stableOnInputChange = React.useCallback((input: string) => {
        setUserInput(input);
    }, []);
    
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
        try {
            // TODO: Implement session update via REST API
            console.log('Session update not yet implemented via REST API');
            setActiveChatSession(newChatSession);
        } catch (error) {
            console.error('Error updating chat session:', error);
        }
    }

    //Get the chat session info, load messages, and load collection context
    useEffect(() => {
        let isMounted = true;
        
        const fetchChatSession = async () => {
            try {
                if (!isMounted || !chatSessionId) return;
                
                // Use REST API to get session
                const sessionData = await getSession(chatSessionId);
                
                if (!isMounted || !sessionData) return;
                
                // If no name is provided, create a default name with date and time
                if (!sessionData.name) {
                    const defaultName = `New Canvas - ${new Date().toLocaleString()}`;
                    // TODO: Update session name via REST API
                    if (isMounted) {
                        setActiveChatSession({ ...sessionData, name: defaultName });
                    }
                } else {
                    if (isMounted) {
                        setActiveChatSession(sessionData);
                    }
                }
                
                // Load messages for this session
                try {
                    const { getSessionMessages } = await import('@/lib/api/sessions');
                    const messagesResponse = await getSessionMessages(chatSessionId);
                    if (messagesResponse.data && isMounted) {
                        console.log('✅ Loaded messages:', messagesResponse.data.length);
                        
                        // STALE MESSAGE CLEANUP: Filter out stale streaming messages (older than 5 minutes)
                        // This prevents persistent "Thinking" indicators from appearing after page reload
                        // when streaming messages weren't properly cleaned up by the backend.
                        // Requirements: 2.3, 2.4
                        const now = Date.now();
                        const FIVE_MINUTES_MS = 5 * 60 * 1000;
                        
                        const filteredMessages = messagesResponse.data.filter((msg: any) => {
                            // Only filter streaming messages (role: 'ai-stream')
                            if (msg.role === 'ai-stream') {
                                const messageTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
                                const age = now - messageTime;
                                
                                if (age > FIVE_MINUTES_MS) {
                                    console.warn('⚠️ [STALE MESSAGE CLEANUP] Ignoring stale streaming message:', {
                                        messageId: msg.id,
                                        age: Math.round(age / 1000) + 's',
                                        createdAt: msg.createdAt,
                                        sessionId: chatSessionId
                                    });
                                    return false; // Filter out stale streaming message
                                }
                            }
                            return true; // Keep all other messages
                        });
                        
                        if (filteredMessages.length < messagesResponse.data.length) {
                            const staleCount = messagesResponse.data.length - filteredMessages.length;
                            console.warn(`⚠️ [STALE MESSAGE CLEANUP] Filtered out ${staleCount} stale streaming message(s) from session ${chatSessionId}`);
                        }
                        
                        setMessages(filteredMessages as any);
                    }
                } catch (error) {
                    console.error('❌ Error loading messages:', error);
                    // Continue even if messages fail to load
                }
                
                // Load collection context if this canvas is linked to a collection
                if (sessionData.linkedCollectionId && isMounted) {
                    console.log('🔗 Canvas linked to collection:', sessionData.linkedCollectionId);
                    setLoadingCollection(true);
                    
                    try {
                        const collectionData = await getCanvasCollectionContext(chatSessionId);
                        if (collectionData && isMounted) {
                            console.log('✅ Collection context loaded:', {
                                name: collectionData.name,
                                wellCount: collectionData.dataItems?.length || 0,
                                dataSource: collectionData.dataSourceType
                            });
                            setCollectionContext(collectionData);
                        }
                    } catch (error) {
                        console.error('❌ Error loading collection context:', error);
                    } finally {
                        if (isMounted) {
                            setLoadingCollection(false);
                        }
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
    }, [chatSessionId]);

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
        try {
            console.log('🔄 Creating new chat session and resetting chain of thought...');
            
            // Reset chain of thought state first
            setExpandedSteps({});
            setChainOfThoughtData([]);
            setMessages([]);
            setChainOfThoughtMessageCount(0);
            setChainOfThoughtAutoScroll(true);
            
            console.log('✅ Chain of thought state reset successfully');
            
            // Navigate to create-new-chat page with fromSession parameter to inherit collection context
            const currentSessionId = activeChatSession?.id;
            if (currentSessionId) {
                console.log('🔗 Navigating to create new chat with session context:', currentSessionId);
                navigate(`/create-new-chat?fromSession=${currentSessionId}`);
            } else {
                // Fallback: create without context inheritance
                console.log('⚠️ No current session ID, creating without context inheritance');
                navigate('/create-new-chat');
            }
        } catch (error) {
            console.error("Error creating chat session:", error);
            alert("Failed to create chat session. Please try again.");
        }
    }

    return (
                <div className='main-container' data-page="chat">
                <div className="reset-chat">
                    <Grid
                        disableGutters
                        gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
                    >
                        <div className="reset-chat-left">
                            <EditableTextBox
                                object={activeChatSession}
                                fieldPath="name"
                                onUpdate={setActiveChatSessionAndUpload}
                                typographyVariant="h6"
                                stripTimestamp={true}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <AgentSwitcher
                                    selectedAgent={selectedAgent}
                                    onAgentChange={handleAgentChange}
                                />
                                <div className='toggles'>
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
                                        ]}/>
                                </div>
                            </div>
                        </div>
                        <div className="reset-chat-right">
                            <div className="breadcrumb-container" style={{ marginLeft: '23px' }}>
                                {collectionContext ? (
                                    <div className="breadcrumb-links">
                                        <a href={`/collections/${collectionContext.id}`}>{collectionContext.name}</a>
                                        <span className="separator">›</span>
                                        <span className="current">{activeChatSession?.name?.replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M\s*$/, '') || 'Canvas'}</span>
                                    </div>
                                ) : (
                                    <div className="breadcrumb-links">
                                        <span className="separator">No Collection</span>
                                        <span className="separator">›</span>
                                        <span className="current">{activeChatSession?.name?.replace(/\s*-\s*\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M\s*$/, '') || 'Canvas'}</span>
                                    </div>
                                )}
                            </div>
                            <Tooltip title="Start New Session">
                                <IconButton
                                    onClick={handleCreateNewChat}
                                    color="primary"
                                    size="large"
                                >
                                    <RestartAlt />
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
                    </Grid>
                </div>
            <div className='content-area'>
                <Grid
                    disableGutters
                    gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
                >
                    {selectedId === "seg-1" ? (
                    <div className='panel'>
                        <AgentLandingPage
                            selectedAgent={selectedAgent}
                            onWorkflowSelect={(prompt: string) => {
                                setUserInput(prompt);
                            }}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                ) : selectedId === "seg-1-old" ? (
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
                                    setSelectedItems(detail?.selectedItems ?? []);
                                    setUserInput(detail?.selectedItems[0]?.prompt || '');
                                    
                                    // Auto-select agent if prompt has agentType specified
                                    const selectedPrompt = detail?.selectedItems[0];
                                    if (selectedPrompt && (selectedPrompt as any).agentType) {
                                        const agentType = (selectedPrompt as any).agentType;
                                        console.log('Auto-selecting agent based on prompt:', agentType);
                                        setSelectedAgent(agentType);
                                        // Store in sessionStorage for persistence
                                        if (typeof window !== 'undefined') {
                                            sessionStorage.setItem('selectedAgent', agentType);
                                        }
                                    }
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
                                    // Maintenance Agent Prompts
                                    {
                                        name: 'Equipment Health Assessment',
                                        description: 'Comprehensive health analysis of critical equipment with operational status, performance metrics, and maintenance recommendations.',
                                        prompt: 'Perform a comprehensive health assessment for equipment PUMP-001. Analyze current operational status, health score, performance metrics, sensor readings, and maintenance history. Generate health score visualization, identify potential issues, and provide actionable maintenance recommendations with priority levels.',
                                        agentType: 'maintenance',
                                    },
                                    {
                                        name: 'Failure Prediction Analysis',
                                        description: 'AI-powered predictive analysis identifying equipment failure risks with timeline projections and contributing factors.',
                                        prompt: 'Analyze equipment COMPRESSOR-001 for failure prediction. Use historical maintenance data, sensor readings, and operational patterns to predict failure risk over the next 90 days. Generate risk timeline chart, identify contributing factors with impact scores, calculate time-to-failure estimate, and provide preventive action recommendations.',
                                        agentType: 'maintenance',
                                    },
                                    {
                                        name: 'Preventive Maintenance Planning',
                                        description: 'Optimized maintenance schedule generation based on equipment condition, operational priorities, and resource availability.',
                                        prompt: 'Generate a preventive maintenance plan for equipment TURBINE-001, PUMP-001, and VALVE-001 for the next 6 months. Optimize schedule based on equipment condition, operational priorities, and resource constraints. Create Gantt-style schedule visualization, estimate costs and durations, identify task dependencies, and provide resource allocation recommendations.',
                                        agentType: 'maintenance',
                                    },
                                    {
                                        name: 'Inspection Schedule Generation',
                                        description: 'Automated inspection schedule creation with sensor data analysis, anomaly detection, and compliance tracking.',
                                        prompt: 'Create an inspection schedule for equipment MOTOR-001. Analyze sensor data trends (temperature, vibration, current), detect anomalies, assess compliance requirements, and generate inspection timeline. Include trend charts, anomaly highlights, inspection checklist, and findings documentation with industry standard compliance.',
                                        agentType: 'maintenance',
                                    },
                                    {
                                        name: 'Asset Lifecycle Analysis',
                                        description: 'Complete asset lifecycle evaluation with cost analysis, maintenance history, and end-of-life predictions.',
                                        prompt: 'Perform asset lifecycle analysis for equipment PUMP-001. Evaluate complete lifecycle from installation to current state, analyze total cost of ownership, maintenance frequency trends, performance degradation patterns, and predict end-of-life timeline. Generate lifecycle timeline visualization, cost breakdown, and replacement strategy recommendations.',
                                        agentType: 'maintenance',
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

                                        const newMessage = {
                                            role: 'user' as const,
                                            content: {
                                                text: userInput
                                            }
                                        };

                                        // Start polling for streaming thought steps
                                        setIsWaitingForResponse(true);

                                        await sendMessage({
                                            chatSessionId: selectedChatSessionId!,
                                            newMessage: newMessage,
                                            agentType: selectedAgent
                                        });
                                        
                                        // Stop polling when response is complete
                                        setIsWaitingForResponse(false);
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
                    // Chain of Thought here - using reusable ChainOfThoughtDisplay component
                    <div className='panel'>
                        <ChainOfThoughtDisplay messages={messages} />
                    </div>
                )}

                <div className='convo'>
                    <div style={{ width: '100%', position: 'relative' }}>
                        <div>
                            {/* Collection Context Alert */}
                            {collectionContext && (
                                <Box margin={{ bottom: 'm' }}>
                                    <Alert
                                        type="info"
                                        header={`Collection: ${collectionContext.name}`}
                                    >
                                        <SpaceBetween direction="vertical" size="xs">
                                            <Box>
                                                {getCollectionSummary(collectionContext)}
                                            </Box>
                                            {collectionContext.dataSourceType === 'S3' && (
                                                <Box>
                                                    <strong>📁 File Access:</strong> All {collectionContext.dataItems?.length || 0} well files are accessible in the Session Files panel under <strong>global/well-data/</strong>
                                                </Box>
                                            )}
                                            <Box>
                                                <Button 
                                                    variant="inline-link" 
                                                    iconName="external"
                                                    onClick={() => navigate(`/collections/${collectionContext.id}`)}
                                                >
                                                    View Collection Details
                                                </Button>
                                            </Box>
                                        </SpaceBetween>
                                    </Alert>
                                </Box>
                            )}

                            {/* ChatBox with agent switcher in input area */}
                            <ChatBox
                                chatSessionId={activeChatSession.id}
                                showChainOfThought={showChainOfThought}
                                onInputChange={stableOnInputChange}
                                userInput={userInput}
                                messages={stableMessages}
                                setMessages={stableSetMessages}
                                selectedAgent={selectedAgent}
                                onAgentChange={handleAgentChange}
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

                    {/* File Drawer - completely different handling for mobile vs desktop */}
                    <FileDrawer
                        open={fileDrawerOpen}
                        onClose={() => setFileDrawerOpen(false)}
                        chatSessionId={activeChatSession.id}
                        variant={drawerVariant}
                    />
                </div>
                </Grid>
            </div>
            </div>
    );
}

// Wrapper component that provides ProjectContext
function Page() {
    return (
        <ErrorBoundary>
            <ProjectContextProvider>
                <ChatPageContent />
            </ProjectContextProvider>
        </ErrorBoundary>
    );
}

export default withAuth(Page);
