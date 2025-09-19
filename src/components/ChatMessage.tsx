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
                    // Parse the comprehensive shale analysis data and render with engaging visualizations
                    try {
                        const analysisData = JSON.parse((message as any).content?.text || '{}');
                        if (analysisData.messageContentType === 'comprehensive_shale_analysis') {
                            return <ComprehensiveShaleAnalysisComponent data={analysisData} />;
                        }
                    } catch (e) {
                        // If parsing fails, fall back to default component
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
