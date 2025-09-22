import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { Message } from '@/../utils/types';
import { useFileSystem } from '@/contexts/FileSystemContext';

// Import all the message components
import AiMessageComponent from './messageComponents/AiMessageComponent';
import ThinkingMessageComponent from './messageComponents/ThinkingMessageComponent'
import HumanMessageComponent from './messageComponents/HumanMessageComponent';
import CalculatorToolComponent from './messageComponents/CalculatorToolComponent';
import UserInputToolComponent from './messageComponents/UserInputToolComponent';
import { SearchFilesToolComponent } from './messageComponents/SearchFilesToolComponent';
import ListFilesToolComponent from './messageComponents/ListFilesToolComponent';
import ReadFileToolComponent from './messageComponents/ReadFileToolComponent';
import WriteFileToolComponent from './messageComponents/WriteFileToolComponent';
import UpdateFileToolComponent from './messageComponents/UpdateFileToolComponent';
import TextToTableToolComponent from './messageComponents/TextToTableToolComponent';
import PySparkToolComponent from './messageComponents/PySparkToolComponent';
import RenderAssetToolComponent from './messageComponents/RenderAssetToolComponent';
import DefaultToolMessageComponent from './messageComponents/DefaultToolMessageComponent';
import DuckDuckGoSearchToolComponent from './messageComponents/DuckDuckGoSearchToolComponent';
import WebBrowserToolComponent from './messageComponents/WebBrowserToolComponent';
import CreateProjectToolComponent from './messageComponents/CreateProjectToolComponent';
import CustomWorkshopComponent from './messageComponents/CustomWorkshopComponent'
import { PlotDataToolComponent } from '../components/PlotDataToolComponent';
import InteractiveAgentSummaryComponent from './messageComponents/InteractiveAgentSummaryComponent';
import ProfessionalResponseComponent from './messageComponents/ProfessionalResponseComponent';
import { ComprehensiveShaleAnalysisComponent } from './messageComponents/ComprehensiveShaleAnalysisComponent';
import { ComprehensivePorosityAnalysisComponent } from './messageComponents/ComprehensivePorosityAnalysisComponent';
import { LogPlotViewerComponent } from './messageComponents/LogPlotViewerComponent';
import { MultiWellCorrelationComponent } from './messageComponents/MultiWellCorrelationComponent';

const ChatMessage = (params: {
    message: Message,
    onRegenerateMessage?: (messageId: string, messageText: string) => Promise<boolean>;
}) => {
    const { message, onRegenerateMessage } = params
    const theme = useTheme();
    const { refreshFiles } = useFileSystem();

    // Use a ref to track which messages we've already processed
    // to prevent multiple refreshes for the same message
    const processedMessageRef = useRef<{ [key: string]: boolean }>({});

    // Effect to handle file operation updates
    useEffect(() => {
        // Skip if we've already processed this message
        const messageId = (message as any).id;
        if (!messageId || processedMessageRef.current[messageId as any]) {
            return;
        }

        if ((message as any).role === 'tool' &&
            ((message as any).toolName === 'writeFile' ||
                (message as any).toolName === 'updateFile')) {
            try {
                const fileData = JSON.parse((message as any).content?.text || '{}');
                if (fileData.success) {
                    // Mark this message as processed
                    processedMessageRef.current[messageId as any] = true;
                    // Refresh file list when operations are successful
                    refreshFiles();
                }
            } catch {
                // Even on error, mark as processed to prevent infinite retries
                processedMessageRef.current[messageId as any] = true;
            }
        }
    }, [message, refreshFiles]);


    switch (message.role) {
        case 'human':
            return <HumanMessageComponent
                message={message}
                theme={theme}
                onRegenerateMessage={onRegenerateMessage}
            />;
        case 'ai':
            // CRITICAL FIX: Check for artifacts first before other processing
            console.log('🔍 ChatMessage: Processing AI message with artifacts check');
            console.log('🔍 ChatMessage: Message artifacts:', (message as any).artifacts);
            console.log('🔍 ChatMessage: Artifacts type:', typeof (message as any).artifacts);
            console.log('🔍 ChatMessage: Artifacts is array:', Array.isArray((message as any).artifacts));
            console.log('🔍 ChatMessage: Artifacts count:', (message as any).artifacts?.length || 0);
            
            // Check for artifacts in AI message and wrap in enhanced AiMessageComponent
            if ((message as any).artifacts && Array.isArray((message as any).artifacts) && (message as any).artifacts.length > 0) {
                console.log('🎯 ChatMessage: Found artifacts in AI message!');
                const artifacts = (message as any).artifacts;
                console.log('🔍 ChatMessage: First artifact raw:', artifacts[0]);
                console.log('🔍 ChatMessage: First artifact type:', typeof artifacts[0]);
                
                // Check if any artifact is a comprehensive shale analysis
                for (const artifact of artifacts) {
                    if (artifact) {
                        let parsedArtifact = artifact;
                        
                        // CRITICAL FIX: Parse artifact if it's a JSON string
                        if (typeof artifact === 'string') {
                            try {
                                parsedArtifact = JSON.parse(artifact);
                                console.log('✅ ChatMessage: Successfully parsed JSON string artifact');
                            } catch (e) {
                                console.error('❌ ChatMessage: Failed to parse artifact JSON:', e);
                                continue;
                            }
                        }
                        
                        console.log('🔍 ChatMessage: Parsed artifact keys:', Object.keys(parsedArtifact || {}));
                        console.log('🔍 ChatMessage: Checking artifact type:', parsedArtifact.messageContentType || parsedArtifact.type);
                        
                        // Check for comprehensive shale analysis - wrap in AiMessageComponent
                        if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_shale_analysis') {
                            console.log('🎉 ChatMessage: Rendering ComprehensiveShaleAnalysisComponent from parsed artifact with AI wrapper!');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<ComprehensiveShaleAnalysisComponent data={parsedArtifact} />}
                            />;
                        }
                        
                        // Check for comprehensive porosity analysis - wrap in AiMessageComponent
                        if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_porosity_analysis') {
                            console.log('🎉 ChatMessage: Rendering ComprehensivePorosityAnalysisComponent from parsed artifact with AI wrapper!');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<ComprehensivePorosityAnalysisComponent data={parsedArtifact} />}
                            />;
                        }
                        
                        // Check for multi-well correlation - wrap in AiMessageComponent
                        if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_multi_well_correlation') {
                            console.log('🎉 ChatMessage: Rendering MultiWellCorrelationComponent from parsed artifact with AI wrapper!');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<MultiWellCorrelationComponent data={parsedArtifact} />}
                            />;
                        }
                        
                        // Check for log plot viewer - wrap in AiMessageComponent
                        if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.type === 'logPlotViewer') {
                            console.log('🎉 ChatMessage: Rendering LogPlotViewerComponent from parsed artifact with AI wrapper!');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<LogPlotViewerComponent data={parsedArtifact} />}
                            />;
                        }
                    }
                }
                
                console.log('⚠️ ChatMessage: Artifacts found but no matching component, continuing with regular AI message');
            } else {
                console.log('⚠️ ChatMessage: No artifacts found in AI message');
            }

            // Check if message contains professional response JSON
            const messageText = (message as any).content?.text || '';
            
            // Try to detect professional response JSON
            let professionalResponse = null;
            try {
                if (messageText.trim().startsWith('{') && messageText.trim().endsWith('}')) {
                    const parsed = JSON.parse(messageText);
                    if (parsed.responseType === 'professional' && parsed.calculationType) {
                        professionalResponse = parsed;
                    }
                }
            } catch (e) {
                // Not JSON, continue with regular processing
            }

            // Route professional responses to specialized components
            if (professionalResponse) {
                return <ProfessionalResponseComponent 
                    content={message.content} 
                    theme={theme}
                    chatSessionId={(message as any).chatSessionId || ''}
                />;
            }
            
            // Check if message contains actual statistical data that should use interactive visualization
            const hasStatisticalData = messageText.includes('Mean:') &&
                                     messageText.includes('Median:') &&
                                     messageText.includes('Standard Deviation:');
            
            if (hasStatisticalData && messageText.length > 200) {
                return <InteractiveAgentSummaryComponent 
                    content={message.content} 
                    theme={theme} 
                    chatSessionId={(message as any).chatSessionId || ''} 
                />;
            } else {
                return <AiMessageComponent message={message} theme={theme} />;
            }
        case 'professional-response':
            // Handle professional response messages with rich formatting
            return <ProfessionalResponseComponent 
                content={message.content} 
                theme={theme}
                chatSessionId={(message as any).chatSessionId || ''}
            />;
        case 'ai-stream':
            return <ThinkingMessageComponent message={message} theme={theme} />
        case 'tool':
            //This set of tools messages will render even if the chain of thought is not being shown
            // Remove "mcp__" prefix from toolName if present
            const toolName = (message as any).toolName?.startsWith("mcp__") 
                ? (message as any).toolName.substring(5) 
                : (message as any).toolName;
                
            switch (toolName) {
                case 'renderAssetTool':
                    return <RenderAssetToolComponent
                        content={message.content}
                        theme={theme}
                        chatSessionId={(message as any).chatSessionId || ''}
                    />;
                case 'userInputTool':
                    return <UserInputToolComponent content={message.content} theme={theme} />;
                case 'createProject':
                    return <CreateProjectToolComponent content={message.content} theme={theme} />;
                case 'calculator':
                    return <CalculatorToolComponent content={message.content} theme={theme} />;
                case 'searchFiles':
                    return <SearchFilesToolComponent
                        content={message.content}
                        theme={theme}
                        chatSessionId={(message as any).chatSessionId || ''}
                    />;
                case 'listFiles':
                    return <ListFilesToolComponent content={message.content} theme={theme} />;
                case 'readFile':
                    return <ReadFileToolComponent content={message.content} theme={theme} />;
                case 'writeFile':
                    return <WriteFileToolComponent
                        content={message.content}
                        theme={theme}
                        chatSessionId={(message as any).chatSessionId || ''}
                    />;
                case 'updateFile':
                    return <UpdateFileToolComponent content={message.content} theme={theme} />;
                case 'textToTableTool':
                    return <TextToTableToolComponent content={message.content} theme={theme} />;
                case 'pysparkTool':
                    return <PySparkToolComponent content={message.content} theme={theme} />;
                case 'duckduckgo-search':
                    return <DuckDuckGoSearchToolComponent content={message.content} theme={theme} />;
                case 'webBrowserTool':
                    return <WebBrowserToolComponent content={message.content} theme={theme} />;
                case 'plotDataTool':
                    return <PlotDataToolComponent 
                        content={message.content} 
                        theme={theme} 
                        chatSessionId={(message as any).chatSessionId || ''} 
                    />;
                case 'permeabilityCalculator':
                    return <CustomWorkshopComponent content={message.content} theme={theme} />;
                case 'comprehensive_shale_analysis':
                    // FIXED: Enhanced parsing for comprehensive shale analysis with artifact extraction
                    try {
                        const messageContent = (message as any).content?.text || '{}';
                        console.log('🔍 Frontend: Parsing comprehensive_shale_analysis message:', {
                            contentLength: messageContent.length,
                            contentPreview: messageContent.substring(0, 200)
                        });
                        
                        let analysisData = null;
                        
                        // Try to parse as direct JSON first
                        try {
                            const parsed = JSON.parse(messageContent);
                            console.log('🔍 Frontend: Parsed structure:', {
                                hasSuccess: !!parsed.success,
                                hasArtifacts: Array.isArray(parsed.artifacts),
                                artifactsLength: parsed.artifacts?.length || 0,
                                hasMessage: !!parsed.message
                            });
                            
                            // Check for artifacts first
                            if (parsed.artifacts && Array.isArray(parsed.artifacts) && parsed.artifacts.length > 0) {
                                const artifact = parsed.artifacts[0];
                                if (typeof artifact === 'string') {
                                    analysisData = JSON.parse(artifact);
                                } else if (artifact && typeof artifact === 'object') {
                                    analysisData = artifact;
                                }
                                console.log('✅ Frontend: Found artifact data:', !!analysisData?.messageContentType);
                            }
                            
                            // Fallback to result field
                            if (!analysisData && parsed.result && typeof parsed.result === 'object') {
                                analysisData = parsed.result;
                                console.log('✅ Frontend: Using result field as fallback');
                            }
                            
                            // Check if it's already the analysis data directly
                            if (!analysisData && parsed.messageContentType === 'comprehensive_shale_analysis') {
                                analysisData = parsed;
                                console.log('✅ Frontend: Using direct parsed data');
                            }
                        } catch (parseError) {
                            console.log('⚠️ Frontend: JSON parse failed, trying fallback');
                        }
                        
                        // Validate the analysis data and wrap in AiMessageComponent for consistency
                        if (analysisData && analysisData.messageContentType === 'comprehensive_shale_analysis') {
                            console.log('🎯 Frontend: Rendering ComprehensiveShaleAnalysisComponent with AI wrapper');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<ComprehensiveShaleAnalysisComponent data={analysisData} />}
                            />;
                        } else {
                            console.log('❌ Frontend: No valid analysis data found, using default component');
                            console.log('🔍 Available data:', {
                                hasAnalysisData: !!analysisData,
                                messageContentType: analysisData?.messageContentType,
                                analysisDataKeys: analysisData ? Object.keys(analysisData) : []
                            });
                        }
                    } catch (e) {
                        console.error('❌ Frontend: Error parsing comprehensive shale analysis:', e);
                    }
                    return <DefaultToolMessageComponent message={message} />;
                case 'comprehensive_porosity_analysis':
                    // Enhanced parsing for comprehensive porosity analysis with artifact extraction
                    try {
                        const messageContent = (message as any).content?.text || '{}';
                        console.log('🔍 Frontend: Parsing comprehensive_porosity_analysis message:', {
                            contentLength: messageContent.length,
                            contentPreview: messageContent.substring(0, 200)
                        });
                        
                        let analysisData = null;
                        
                        // Try to parse as direct JSON first
                        try {
                            const parsed = JSON.parse(messageContent);
                            console.log('🔍 Frontend: Parsed porosity structure:', {
                                hasSuccess: !!parsed.success,
                                hasArtifacts: Array.isArray(parsed.artifacts),
                                artifactsLength: parsed.artifacts?.length || 0,
                                hasMessage: !!parsed.message
                            });
                            
                            // Check for artifacts first
                            if (parsed.artifacts && Array.isArray(parsed.artifacts) && parsed.artifacts.length > 0) {
                                const artifact = parsed.artifacts[0];
                                if (typeof artifact === 'string') {
                                    analysisData = JSON.parse(artifact);
                                } else if (artifact && typeof artifact === 'object') {
                                    analysisData = artifact;
                                }
                                console.log('✅ Frontend: Found porosity artifact data:', !!analysisData?.messageContentType);
                            }
                            
                            // Fallback to result field
                            if (!analysisData && parsed.result && typeof parsed.result === 'object') {
                                analysisData = parsed.result;
                                console.log('✅ Frontend: Using porosity result field as fallback');
                            }
                            
                            // Check if it's already the analysis data directly
                            if (!analysisData && parsed.messageContentType === 'comprehensive_porosity_analysis') {
                                analysisData = parsed;
                                console.log('✅ Frontend: Using direct porosity parsed data');
                            }
                        } catch (parseError) {
                            console.log('⚠️ Frontend: Porosity JSON parse failed, trying fallback');
                        }
                        
                        // Validate the analysis data and wrap in AiMessageComponent for consistency
                        if (analysisData && analysisData.messageContentType === 'comprehensive_porosity_analysis') {
                            console.log('🎯 Frontend: Rendering ComprehensivePorosityAnalysisComponent with AI wrapper');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<ComprehensivePorosityAnalysisComponent data={analysisData} />}
                            />;
                        } else {
                            console.log('❌ Frontend: No valid porosity analysis data found, using default component');
                            console.log('🔍 Available porosity data:', {
                                hasAnalysisData: !!analysisData,
                                messageContentType: analysisData?.messageContentType,
                                analysisDataKeys: analysisData ? Object.keys(analysisData) : []
                            });
                        }
                    } catch (e) {
                        console.error('❌ Frontend: Error parsing comprehensive porosity analysis:', e);
                    }
                    return <DefaultToolMessageComponent message={message} />;
                case 'calculate_porosity':
                    // Enhanced porosity calculation - check for comprehensive analysis delegation
                    try {
                        const messageContent = (message as any).content?.text || '{}';
                        console.log(`🔍 Frontend: Parsing ${toolName} message:`, {
                            contentLength: messageContent.length,
                            contentPreview: messageContent.substring(0, 200)
                        });
                        
                        let analysisData = null;
                        let professionalData = null;
                        
                        try {
                            const parsed = JSON.parse(messageContent);
                            
                            // Check for comprehensive porosity analysis response (delegated from calculate_porosity)
                            if (parsed.artifacts && Array.isArray(parsed.artifacts) && parsed.artifacts.length > 0) {
                                const artifact = parsed.artifacts[0];
                                if (typeof artifact === 'string') {
                                    analysisData = JSON.parse(artifact);
                                } else if (artifact && typeof artifact === 'object') {
                                    analysisData = artifact;
                                }
                                console.log('✅ Frontend: Found artifact data in porosity calculation:', !!analysisData?.messageContentType);
                            }
                            
                            // Fallback to result field
                            if (!analysisData && parsed.result && typeof parsed.result === 'object') {
                                analysisData = parsed.result;
                                console.log('✅ Frontend: Using porosity result field as fallback');
                            }
                            
                            // Check if it's already the analysis data directly
                            if (!analysisData && parsed.messageContentType === 'comprehensive_porosity_analysis') {
                                analysisData = parsed;
                                console.log('✅ Frontend: Using direct porosity parsed data');
                            }
                            
                            // Check if it's a professional response format
                            if (!analysisData && parsed.responseType === 'professional' && parsed.calculationType) {
                                professionalData = parsed;
                                console.log(`✅ Frontend: Found professional response for ${toolName}`);
                            }
                        } catch (parseError) {
                            console.log(`⚠️ Frontend: ${toolName} JSON parse failed`);
                        }
                        
                        // Route to ComprehensivePorosityAnalysisComponent if comprehensive analysis data found
                        if (analysisData && analysisData.messageContentType === 'comprehensive_porosity_analysis') {
                            console.log('🎯 Frontend: Rendering ComprehensivePorosityAnalysisComponent from calculate_porosity with AI wrapper');
                            return <AiMessageComponent 
                                message={message} 
                                theme={theme} 
                                enhancedComponent={<ComprehensivePorosityAnalysisComponent data={analysisData} />}
                            />;
                        }
                        
                        // Route to ProfessionalResponseComponent if professional format
                        if (professionalData) {
                            console.log(`🎯 Frontend: Rendering ProfessionalResponseComponent for ${toolName}`);
                            return <ProfessionalResponseComponent 
                                content={message.content} 
                                theme={theme}
                                chatSessionId={(message as any).chatSessionId || ''}
                            />;
                        }
                        
                        console.log(`❌ Frontend: No valid response format found for ${toolName}, using default`);
                    } catch (e) {
                        console.error(`❌ Frontend: Error parsing ${toolName}:`, e);
                    }
                    return <DefaultToolMessageComponent message={message} />;
                case 'calculate_shale_volume':
                case 'calculate_saturation':
                case 'assess_data_quality':
                case 'perform_uncertainty_analysis':
                    // Enhanced petrophysical tools - route to ProfessionalResponseComponent
                    try {
                        const messageContent = (message as any).content?.text || '{}';
                        console.log(`🔍 Frontend: Parsing ${toolName} message:`, {
                            contentLength: messageContent.length,
                            contentPreview: messageContent.substring(0, 200)
                        });
                        
                        let professionalData = null;
                        
                        try {
                            const parsed = JSON.parse(messageContent);
                            
                            // Check if it's a professional response format
                            if (parsed.responseType === 'professional' && parsed.calculationType) {
                                professionalData = parsed;
                                console.log(`✅ Frontend: Found professional response for ${toolName}`);
                            }
                        } catch (parseError) {
                            console.log(`⚠️ Frontend: ${toolName} JSON parse failed`);
                        }
                        
                        // Route to ProfessionalResponseComponent if valid format
                        if (professionalData) {
                            console.log(`🎯 Frontend: Rendering ProfessionalResponseComponent for ${toolName}`);
                            return <ProfessionalResponseComponent 
                                content={message.content} 
                                theme={theme}
                                chatSessionId={(message as any).chatSessionId || ''}
                            />;
                        } else {
                            console.log(`❌ Frontend: No valid professional response format found for ${toolName}, using default`);
                        }
                    } catch (e) {
                        console.error(`❌ Frontend: Error parsing ${toolName}:`, e);
                    }
                    return <DefaultToolMessageComponent message={message} />;
                default:
                    return <DefaultToolMessageComponent message={message} />;
            }
        default:
            return null;
    }
}

export default ChatMessage
