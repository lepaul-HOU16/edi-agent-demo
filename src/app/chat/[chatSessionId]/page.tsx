'use client';

import React, { useEffect, useState } from 'react';

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { Typography, Paper, Divider, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PsychologyIcon from '@mui/icons-material/Psychology';

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

import ChatBox from "@/components/ChatBox"
import EditableTextBox from '@/components/EditableTextBox';
import { withAuth } from '@/components/WithAuth';
import FileDrawer from '@/components/FileDrawer';
import { sendMessage } from '../../../../utils/amplifyUtils';

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
    const [selectedId, setSelectedId] = useState("1");
    const [selectedItems, setSelectedItems] = React.useState([{ name: "", description: "", prompt: "" }]);

    if (!activeChatSession || !activeChatSession.id) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Loading your chat session...</Typography>
                </Paper>
            </Box>
            // <ContentLayout />
        );
    }

    return (
        <div style={{ margin: '36px 80px 0' }}>
            <>
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
                <Grid
                    disableGutters
                    gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
                >
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

                    <div className='convo'>
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            overflow: 'hidden',
                            p: 2
                        }}>
                            {/* Main chat area - always full width with padding for desktop drawer */}
                            <Box sx={{
                                height: '100%',
                                width: '100%',
                                position: 'relative',
                                transition: theme.transitions.create(['padding-right'], {
                                    easing: theme.transitions.easing.easeOut,
                                    duration: theme.transitions.duration.standard,
                                }),
                                ...(fileDrawerOpen && !isMobile && {
                                    paddingRight: '45%'
                                })
                            }}>
                                <div>
                                    <Box sx={{
                                        p: 3,
                                        backgroundColor: '#fff',
                                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>

                                        <EditableTextBox
                                            object={activeChatSession}
                                            fieldPath="name"
                                            onUpdate={setActiveChatSessionAndUpload}
                                            typographyVariant="h3"
                                        />
                                        <Box sx={{
                                            display: 'flex',
                                            gap: 1,
                                            justifyContent: 'flex-end'
                                        }}>
                                        </Box>
                                    </Box>

                                    <div className='toggles'>
                                        {/* Chain of Thought */}
                                        <Tooltip title={showChainOfThought ? "Hide Chain of Thought" : "Show Chain of Thought"}>
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
                                        </Tooltip>

                                        {/* File Drawer */}
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

                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        p: 3,
                                        backgroundColor: '#f8f9fa',
                                        flex: 1
                                    }}>
                                        {/* <ChatBox
                                            chatSessionId={activeChatSession.id}
                                            showChainOfThought={showChainOfThought}
                                        /> */}
                                        <ChatBox
                                            chatSessionId={activeChatSession.id}
                                            showChainOfThought={showChainOfThought}
                                            onInputChange={setUserInput}
                                            userInput={userInput}
                                        />

                                    </Box>
                                </div>
                            </Box>

                            {/* Floating file button for mobile - only show when drawer is closed */}
                            {isMobile && !fileDrawerOpen && (
                                <Box
                                    sx={{
                                        position: 'fixed',
                                        bottom: 16,
                                        right: 16,
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
                                </Box>
                            )}

                            {/* File Drawer - completely different handling for mobile vs desktop */}
                            <FileDrawer
                                open={fileDrawerOpen}
                                onClose={() => setFileDrawerOpen(false)}
                                chatSessionId={activeChatSession.id}
                                variant={drawerVariant}
                            />
                        </Box>
                    </div>
                </Grid >
            </>
        </div >
    );
}

export default withAuth(Page);