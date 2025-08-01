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

const amplifyClient = generateClient<Schema>();

function Page({
    params,
}: {
    params: Promise<{ chatSessionId: string }>
}) {
    const [userInput, setUserInput] = useState<string>('');
    const [activeChatSession, setActiveChatSession] = useState<Schema["ChatSession"]["createType"]>();
    const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
    const [showChainOfThought, setShowChainOfThought] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [messages, setMessages] = useState<Message[]>([]);

    const setActiveChatSessionAndUpload = async (newChatSession: Schema["ChatSession"]["createType"]) => {
        const { data: updatedChatSession } = await amplifyClient.models.ChatSession.update({
            id: (await params).chatSessionId,
            ...newChatSession
        });

        if (updatedChatSession) setActiveChatSession(updatedChatSession);
    }

    //Get the chat session info
    useEffect(() => {
        const fetchChatSession = async () => {
            const chatSessionId = (await params).chatSessionId
            if (chatSessionId) {
                const { data: newChatSessionData } = await amplifyClient.models.ChatSession.get({
                    id: chatSessionId
                });
                if (newChatSessionData) setActiveChatSession({ ...newChatSessionData, name: newChatSessionData.name || "" });
            }
        }
        fetchChatSession()
    }, [params]);

    // Drawer variant only matters for mobile now
    const drawerVariant = "temporary";

    // Add state for segmented control
    const [selectedId, setSelectedId] = useState("seg-1");
    const [selectedItems, setSelectedItems] = React.useState([{ name: "", description: "", prompt: "" }]);

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

    const router = useRouter();

    const handleCreateNewChat = async () => {
        try {
            // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
            amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" })

            const newChatSession = await amplifyClient.models.ChatSession.create({});
            router.push(`/chat/${newChatSession.data!.id}`);
        } catch (error) {
            console.error("Error creating chat session:", error);
            alert("Failed to create chat session.");
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
                                { text: 'Data Collection: Barrow', href: '#' },
                                { text: 'Workspace', href: '#' },
                                { text: 'Canvas: Insights', href: '#' }
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
                                    setSelectedItems(detail?.selectedItems ?? [])
                                    setUserInput(detail?.selectedItems[0]?.prompt || '')
                                }}
                                selectedItems={selectedItems}
                                items={[
                                    {
                                        name: 'Wind Farm Performance Optimizer',
                                        description: 'Monitor and analyze fleet-wide wind farm production metrics, comparing actual vs forecasted output to maximize energy generation and ROI.',
                                        prompt: 'I manage a fleet of wind farms and want to maximize energy production while minimizing operational expense. Let me check our fleet performance for this quarter. Compare the actual production to the forecasted production for each wind farm. Generate the necessary time series data and render a dashboard to visualize the performance of each wind farm.',
                                    },
                                    {
                                        name: 'Wellsite Compressor Maintenance AI',
                                        description: 'Smart scheduling system that analyzes historical compressor data to optimize maintenance timing and reduce operational costs in the San Juan basin.',
                                        prompt: 'Create a demo to optimize the maintenance schedule for a fleet of wellsite compressors in the San Juan basin. Generate non-optimized data with historic maintenance events, compressor failures, and time series compressor data. Analyze the data to find an optimized maintenance plan and estimate the cost savings. Create a comprehensive report and render it for visualization.',
                                    },
                                    {
                                        name: 'Frac Design Intelligence',
                                        description: 'Advanced analytics platform analyzing 10,000+ well completion designs to determine optimal fracking parameters for maximum production outcomes.',
                                        prompt: 'I compare completion designs and oil production data for an upstream oil company. Generate 10,000 well fracturing completion designs (well spacing, lateral length, perforation cluster spacing, pumped water volumes, pumped proppand sand lbs, number of fracing stages) Generate production data for these wells. There should be a relationship between the completion design and production numbers. The production should loosely follow a hyperbolic decline and have some noise. After generating the data, perform an analysis to determine optimal completion design parameters to maximize production. Create a comprehensive report and render it for visualization.',
                                    },
                                    {
                                        name: 'Smart Home Resource Monitor',
                                        description: 'Real-time utility monitoring system that detects anomalies, identifies efficiency opportunities, and provides actionable cost-saving recommendations.',
                                        prompt: 'Create a demo for analyzing, reporting, and recommending actions based on smart home electricity and water meters. Generate time series sensor data. Look for anomalies in the data (including leak events) and opportunities to increase energy effeciency. Create a report with an analysis of the data, with recommendations for how to optimize resources usage, including financial metrics.',
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
                                        }

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
