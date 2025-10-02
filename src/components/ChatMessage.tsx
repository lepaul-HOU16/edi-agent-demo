import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import React from 'react';

import { Message } from '@/../utils/types';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { retrieveArtifacts } from '@/../utils/s3ArtifactStorage';

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
import { ComprehensiveWellDataDiscoveryComponent } from './messageComponents/ComprehensiveWellDataDiscoveryComponent';
import { LogPlotViewerComponent } from './messageComponents/LogPlotViewerComponent';
import { MultiWellCorrelationComponent } from './messageComponents/MultiWellCorrelationComponent';
import UniversalResponseComponent from './messageComponents/UniversalResponseComponent';
import InteractiveEducationalComponent from './messageComponents/InteractiveEducationalComponent';
// Renewable energy components
import WindFarmTerrainComponent from './messageComponents/WindFarmTerrainComponent';
import WindFarmLayoutComponent from './messageComponents/WindFarmLayoutComponent';
import WindFarmSimulationComponent from './messageComponents/WindFarmSimulationComponent';
import RenewableEnergyGuidanceComponent from './messageComponents/RenewableEnergyGuidanceComponent';

// Enhanced artifact processor component with S3 support - STABLE VERSION
const EnhancedArtifactProcessor = React.memo(({ rawArtifacts, message, theme, onSendMessage }: {
    rawArtifacts: any[];
    message: Message;
    theme: any;
    onSendMessage?: (message: string) => void;
}) => {
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize raw artifacts to prevent dependency changes
    const stableRawArtifacts = useMemo(() => rawArtifacts, [JSON.stringify(rawArtifacts)]);

    // Memoize the process function to prevent useEffect re-runs
    const processArtifacts = useCallback(async () => {
        try {
            console.log('🔄 EnhancedArtifactProcessor: Processing artifacts...');
            
            // Check if any artifacts are S3 references
            const hasS3References = stableRawArtifacts.some(artifact => 
                artifact && artifact.type === 's3_reference'
            );
            
            if (hasS3References) {
                console.log('📥 EnhancedArtifactProcessor: S3 references detected, retrieving...');
                const retrievedArtifacts = await retrieveArtifacts(stableRawArtifacts);
                setArtifacts(retrievedArtifacts);
            } else {
                console.log('📝 EnhancedArtifactProcessor: No S3 references, using artifacts directly');
                setArtifacts(stableRawArtifacts);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('❌ EnhancedArtifactProcessor: Error processing artifacts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load artifacts');
            setLoading(false);
            // Fallback: use raw artifacts
            setArtifacts(stableRawArtifacts);
        }
    }, [stableRawArtifacts]);

    useEffect(() => {
        processArtifacts();
    }, [processArtifacts]);

    // Show loading state for S3 artifacts
    if (loading) {
        return <AiMessageComponent 
            message={message} 
            theme={theme} 
            enhancedComponent={
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <div>🔄 Loading visualization data...</div>
                    <div style={{ fontSize: '0.8em', color: 'gray', marginTop: '8px' }}>
                        Retrieving large dataset from storage
                    </div>
                </div>
            }
        />;
    }

    // Show error state with fallback
    if (error) {
        return <AiMessageComponent 
            message={message} 
            theme={theme} 
            enhancedComponent={
                <div style={{ padding: '16px', color: 'orange' }}>
                    <div>⚠️ Error loading visualization data</div>
                    <div style={{ fontSize: '0.8em', marginTop: '8px' }}>{error}</div>
                    <div style={{ fontSize: '0.8em', marginTop: '8px' }}>
                        Using fallback data if available
                    </div>
                </div>
            }
        />;
    }

    // Process retrieved artifacts
    for (const artifact of artifacts) {
        if (artifact) {
            let parsedArtifact = artifact;
            
            // Parse artifact if it's a JSON string
            if (typeof artifact === 'string') {
                try {
                    parsedArtifact = JSON.parse(artifact);
                    console.log('✅ EnhancedArtifactProcessor: Successfully parsed JSON string artifact');
                } catch (e) {
                    console.error('❌ EnhancedArtifactProcessor: Failed to parse artifact JSON:', e);
                    continue;
                }
            }
            
            console.log('🔍 EnhancedArtifactProcessor: Parsed artifact keys:', Object.keys(parsedArtifact || {}));
            console.log('🔍 EnhancedArtifactProcessor: Checking artifact type:', parsedArtifact.messageContentType || parsedArtifact.type);
            
            // Check for comprehensive shale analysis
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_shale_analysis') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering ComprehensiveShaleAnalysisComponent from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<ComprehensiveShaleAnalysisComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for comprehensive porosity analysis
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_porosity_analysis') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering ComprehensivePorosityAnalysisComponent from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<ComprehensivePorosityAnalysisComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for multi-well correlation
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'comprehensive_multi_well_correlation' || 
                 parsedArtifact.messageContentType === 'multi_well_correlation')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering MultiWellCorrelationComponent from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<MultiWellCorrelationComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for comprehensive well data discovery
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_well_data_discovery') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering ComprehensiveWellDataDiscoveryComponent from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<ComprehensiveWellDataDiscoveryComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for well data discovery
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'well_data_discovery') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering Well Data Discovery from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<InteractiveAgentSummaryComponent 
                        content={{text: JSON.stringify(parsedArtifact)}} 
                        theme={theme} 
                        chatSessionId={(message as any).chatSessionId || ''} 
                    />}
                />;
            }
            
            // Check for plot data
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'plotData') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering Plot Data from S3 artifact!');
                const mockContent = { text: JSON.stringify(parsedArtifact) } as any;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<PlotDataToolComponent 
                        content={mockContent} 
                        theme={theme} 
                        chatSessionId={(message as any).chatSessionId || ''} 
                    />}
                />;
            }
            
            // Check for statistical chart
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'statisticalChart') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering Statistical Chart from S3 artifact!');
                const mockContent = { text: JSON.stringify(parsedArtifact) } as any;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<PlotDataToolComponent 
                        content={mockContent} 
                        theme={theme} 
                        chatSessionId={(message as any).chatSessionId || ''} 
                    />}
                />;
            }
            
            // Check for depth plot
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'depthPlot') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering Depth Plot from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<LogPlotViewerComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for log plot viewer
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.type === 'logPlotViewer') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering LogPlotViewerComponent from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<LogPlotViewerComponent data={parsedArtifact} />}
                />;
            }
            
            // Check for log_plot_viewer (alternative naming)
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'log_plot_viewer') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering LogPlotViewerComponent from S3 artifact (log_plot_viewer)!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<LogPlotViewerComponent data={parsedArtifact} />}
                />;
            }
            
            // FIXED: Check for interactive educational components
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'interactive_educational') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering InteractiveEducationalComponent!');
                // CRITICAL FIX: Use direct import instead of React.lazy to prevent typing interference
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<InteractiveEducationalComponent data={parsedArtifact} />}
                />;
            }
            
            // FIXED: Check for universal response components (concept definitions, general knowledge, etc.)
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                ['concept_definition', 'general_knowledge', 'quick_answer', 'error_response', 'guidance_response'].includes(parsedArtifact.messageContentType)) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering UniversalResponseComponent for type:', parsedArtifact.messageContentType);
                // CRITICAL FIX: Use direct import instead of React.lazy to prevent typing interference
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<UniversalResponseComponent data={parsedArtifact} />}
                />;
            }
            
            // NEW: Check for renewable energy wind farm terrain analysis
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'wind_farm_terrain_analysis') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering WindFarmTerrainComponent with onSendMessage!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<WindFarmTerrainComponent data={parsedArtifact} onSendMessage={onSendMessage} />}
                />;
            }
            
            // NEW: Check for renewable energy wind farm layout
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'wind_farm_layout') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering WindFarmLayoutComponent!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<WindFarmLayoutComponent data={parsedArtifact} />}
                />;
            }
            
            // NEW: Check for renewable energy wind farm simulation
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'wind_farm_simulation') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering WindFarmSimulationComponent!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<WindFarmSimulationComponent data={parsedArtifact} />}
                />;
            }
            
            // NEW: Check for renewable energy guidance
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'renewable_energy_guidance') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering RenewableEnergyGuidanceComponent!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<RenewableEnergyGuidanceComponent data={parsedArtifact} />}
                />;
            }
        }
    }
    
    console.log('⚠️ EnhancedArtifactProcessor: Artifacts found but no matching component, using regular AI message');
    return <AiMessageComponent message={message} theme={theme} />;
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when artifacts haven't changed
    return JSON.stringify(prevProps.rawArtifacts) === JSON.stringify(nextProps.rawArtifacts);
});

const ChatMessage = (params: {
    message: Message,
    onRegenerateMessage?: (messageId: string, messageText: string) => Promise<boolean>;
    onSendMessage?: (message: string) => void;
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
                const rawArtifacts = (message as any).artifacts;
                console.log('🔍 ChatMessage: First artifact raw:', rawArtifacts[0]);
                console.log('🔍 ChatMessage: First artifact type:', typeof rawArtifacts[0]);
                
                // NEW: Enhanced artifact processing with S3 support
                return <EnhancedArtifactProcessor 
                    rawArtifacts={rawArtifacts}
                    message={message}
                    theme={theme}
                    onSendMessage={params.onSendMessage}
                />;
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
                default:
                    return <DefaultToolMessageComponent message={message} />;
            }
        default:
            return null;
    }
}

export default ChatMessage;
