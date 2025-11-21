import { useTheme } from '@mui/material/styles';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import React from 'react';

import { Message } from '@/utils/types';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { retrieveArtifacts } from '@/utils/s3ArtifactStorage';
import { useAgentProgress } from '@/hooks/useAgentProgress';
import { AgentProgressIndicator } from './renewable/AgentProgressIndicator';
import { ExtendedThinkingDisplay } from './renewable/ExtendedThinkingDisplay';

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
import CloudscapePorosityDisplay from './cloudscape/CloudscapePorosityDisplay';
import CloudscapeShaleVolumeDisplay from './cloudscape/CloudscapeShaleVolumeDisplay';
import CloudscapeDataQualityDisplay from './cloudscape/CloudscapeDataQualityDisplay';
import CloudscapeCurveQualityDisplay from './cloudscape/CloudscapeCurveQualityDisplay';
import CloudscapeMultiWellCorrelationDisplay from './cloudscape/CloudscapeMultiWellCorrelationDisplay';
import { ComprehensiveWellDataDiscoveryComponent } from './messageComponents/ComprehensiveWellDataDiscoveryComponent';
import { LogPlotViewerComponent } from './messageComponents/LogPlotViewerComponent';
import UniversalResponseComponent from './messageComponents/UniversalResponseComponent';
import InteractiveEducationalComponent from './messageComponents/InteractiveEducationalComponent';
import RenewableEnergyGuidanceComponent from './messageComponents/RenewableEnergyGuidanceComponent';
import EDIcraftResponseComponent from './messageComponents/EDIcraftResponseComponent';
// New renewable energy artifact components
import { 
  TerrainMapArtifact, 
  LayoutMapArtifact, 
  SimulationChartArtifact, 
  ReportArtifact,
  WindRoseArtifact,
  WakeAnalysisArtifact,
  ProjectDashboardArtifact
} from './renewable';
// Maintenance artifact components
import {
  EquipmentHealthArtifact,
  FailurePredictionArtifact,
  MaintenanceScheduleArtifact,
  InspectionReportArtifact,
  AssetLifecycleArtifact
} from './maintenance';
// Confirmation dialog component
import { ConfirmationMessageComponent } from './messageComponents/ConfirmationMessageComponent';
// Data access approval component
import { DataAccessApprovalComponent } from './messageComponents/DataAccessApprovalComponent';

// Enhanced artifact processor component with S3 support - STABLE VERSION WITH DEDUPLICATION
const EnhancedArtifactProcessor = React.memo(({ rawArtifacts, message, theme, onSendMessage }: {
    rawArtifacts: any[];
    message: Message;
    theme: any;
    onSendMessage?: (message: string) => void;
}) => {
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const processingRef = useRef<boolean>(false); // Prevent multiple processing
    const renderCountRef = useRef<number>(0); // Track render count
    const contentHashRef = useRef<string>(''); // Track content hash for deduplication
    
    // Generate stable content hash for deduplication
    const contentHash = useMemo(() => {
        const hashContent = JSON.stringify(rawArtifacts);
        const hash = `artifact-${hashContent.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '')}-${hashContent.length}`;
        return hash;
    }, [rawArtifacts]);
    
    // Track component renders
    renderCountRef.current += 1;
    console.log('🔄 EnhancedArtifactProcessor RENDER #' + renderCountRef.current, {
        messageId: (message as any).id,
        rawArtifactsCount: rawArtifacts?.length || 0,
        contentHash: contentHash,
        timestamp: new Date().toISOString()
    });
    
    // Check if this content is already being rendered in the DOM
    useEffect(() => {
        const existingElements = document.querySelectorAll(`[data-content-hash="${contentHash}"]`);
        if (existingElements.length > 1) {
            console.warn(`⚠️ Duplicate artifact render detected: ${contentHash} (${existingElements.length} instances)`);
        }
    }, [contentHash]);

    // Memoize raw artifacts to prevent dependency changes
    // Use a stable string representation for comparison
    const artifactsKey = useMemo(() => JSON.stringify(rawArtifacts), [rawArtifacts]);
    const stableRawArtifacts = useMemo(() => rawArtifacts, [artifactsKey]);

    // Memoize the process function to prevent useEffect re-runs
    const processArtifacts = useCallback(async () => {
        // Skip if content hash already exists in DOM (deduplication)
        const existingElements = document.querySelectorAll(`[data-content-hash="${contentHash}"]`);
        if (existingElements.length > 0 && contentHashRef.current === contentHash) {
            console.log('⏭️ EnhancedArtifactProcessor: Content already rendered, skipping processing');
            setLoading(false);
            return;
        }
        
        // Update content hash ref
        contentHashRef.current = contentHash;
        
        // Prevent multiple simultaneous processing
        if (processingRef.current) {
            console.log('⏭️ EnhancedArtifactProcessor: Already processing, skipping...');
            return;
        }
        
        processingRef.current = true;
        
        try {
            console.log('🔄 EnhancedArtifactProcessor: Processing artifacts...');
            console.log('🔍 Raw artifacts type:', typeof stableRawArtifacts);
            console.log('🔍 Raw artifacts count:', stableRawArtifacts?.length || 0);
            
            // CRITICAL FIX: Deserialize JSON strings from GraphQL with error handling
            // GraphQL stores artifacts as JSON strings (AWSJSON type), we need to parse them
            let deserializedArtifacts: any[] = [];
            const deserializationErrors: Array<{ index: number; error: string }> = [];
            
            if (stableRawArtifacts && stableRawArtifacts.length > 0) {
                for (let index = 0; index < stableRawArtifacts.length; index++) {
                    const artifact = stableRawArtifacts[index];
                    
                    // Check if artifact is a JSON string that needs parsing
                    if (typeof artifact === 'string') {
                        try {
                            // Handle empty strings
                            if (artifact.trim() === '') {
                                console.warn(`⚠️ Artifact ${index + 1} is empty string, skipping`);
                                continue;
                            }
                            
                            let parsed = JSON.parse(artifact);
                            
                            // Handle double-stringified JSON (common GraphQL issue)
                            let parseAttempts = 0;
                            while (typeof parsed === 'string' && parseAttempts < 3) {
                                parseAttempts++;
                                console.log(`🔄 Artifact ${index + 1} is ${parseAttempts}x stringified, parsing again...`);
                                parsed = JSON.parse(parsed);
                            }
                            
                            // Validate parsed artifact has required fields
                            if (parsed === null) {
                                console.error(`❌ Artifact ${index + 1} parsed to null`);
                                throw new Error('Parsed artifact is null');
                            }
                            
                            if (typeof parsed !== 'object') {
                                console.error(`❌ Artifact ${index + 1} parsed to primitive type:`, typeof parsed, parsed);
                                throw new Error(`Parsed artifact is a ${typeof parsed}, not an object`);
                            }
                            
                            if (Array.isArray(parsed)) {
                                console.error(`❌ Artifact ${index + 1} parsed to array with ${parsed.length} items`);
                                throw new Error('Parsed artifact is an array, not an object');
                            }
                            
                            if (!parsed.type && !parsed.messageContentType) {
                                console.warn(`⚠️ Artifact ${index + 1} missing type field, keys:`, Object.keys(parsed));
                            }
                            
                            console.log(`✅ Deserialized artifact ${index + 1} from JSON string:`, {
                                type: parsed.type || parsed.messageContentType,
                                hasData: !!parsed.data,
                                keys: Object.keys(parsed).slice(0, 5)
                            });
                            
                            deserializedArtifacts.push(parsed);
                        } catch (parseError: any) {
                            console.error(`❌ Failed to parse artifact ${index + 1}:`, parseError);
                            deserializationErrors.push({
                                index: index + 1,
                                error: parseError.message || 'Unknown parsing error',
                            });
                            
                            // Create error placeholder artifact
                            const errorArtifact = {
                                type: 'deserialization_error',
                                messageContentType: 'error',
                                title: `Artifact ${index + 1} Failed to Load`,
                                data: {
                                    message: `This artifact could not be displayed due to a deserialization error: ${parseError.message}`,
                                    originalArtifact: typeof artifact === 'string' ? artifact.substring(0, 200) + '...' : 'Invalid data',
                                },
                            };
                            deserializedArtifacts.push(errorArtifact);
                        }
                    } else if (artifact && typeof artifact === 'object') {
                        // Already an object (backward compatibility)
                        console.log(`📝 Artifact ${index + 1} already an object:`, {
                            type: artifact.type || artifact.messageContentType,
                            hasData: !!artifact.data,
                        });
                        deserializedArtifacts.push(artifact);
                    } else {
                        console.error(`❌ Artifact ${index + 1} has invalid type:`, typeof artifact);
                        deserializationErrors.push({
                            index: index + 1,
                            error: `Invalid artifact type: ${typeof artifact}`,
                        });
                        
                        // Create error placeholder
                        const errorArtifact = {
                            type: 'invalid_artifact',
                            messageContentType: 'error',
                            title: `Invalid Artifact ${index + 1}`,
                            data: {
                                message: `This artifact has an invalid format and cannot be displayed.`,
                            },
                        };
                        deserializedArtifacts.push(errorArtifact);
                    }
                }
                
                // Log deserialization summary
                if (deserializationErrors.length > 0) {
                    console.error('❌ Deserialization errors:', deserializationErrors);
                    setError(`${deserializationErrors.length} artifact(s) failed to load`);
                } else {
                    console.log(`✅ Successfully deserialized all ${deserializedArtifacts.length} artifacts`);
                }
            }
            
            // Check if any artifacts are S3 references
            const hasS3References = deserializedArtifacts.some(artifact => 
                artifact && artifact.type === 's3_reference'
            );
            
            // CRITICAL FIX: Deduplicate artifacts before setting
            // Artifacts can be duplicated due to multiple saves or re-renders
            const deduplicateArtifacts = (arts: any[]) => {
                const seen = new Set<string>();
                return arts.filter(art => {
                    const key = JSON.stringify({
                        type: art.type,
                        messageContentType: art.messageContentType || art.data?.messageContentType,
                        projectId: art.projectId || art.data?.projectId
                    });
                    if (seen.has(key)) {
                        console.warn('⚠️ Duplicate artifact detected and removed:', key);
                        return false;
                    }
                    seen.add(key);
                    return true;
                });
            };
            
            if (hasS3References) {
                console.log('📥 EnhancedArtifactProcessor: S3 references detected, retrieving...');
                try {
                    const retrievedArtifacts = await retrieveArtifacts(deserializedArtifacts);
                    const deduplicated = deduplicateArtifacts(retrievedArtifacts);
                    console.log(`🔍 Deduplicated: ${retrievedArtifacts.length} -> ${deduplicated.length} artifacts`);
                    setArtifacts(deduplicated);
                } catch (s3Error: any) {
                    console.error('❌ Failed to retrieve S3 artifacts:', s3Error);
                    setError(`Failed to load artifacts from storage: ${s3Error.message}`);
                    // Use deserialized artifacts as fallback
                    const deduplicated = deduplicateArtifacts(deserializedArtifacts);
                    setArtifacts(deduplicated);
                }
            } else {
                console.log('📝 EnhancedArtifactProcessor: No S3 references, using artifacts directly');
                const deduplicated = deduplicateArtifacts(deserializedArtifacts);
                console.log(`🔍 Deduplicated: ${deserializedArtifacts.length} -> ${deduplicated.length} artifacts`);
                setArtifacts(deduplicated);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('❌ EnhancedArtifactProcessor: Error processing artifacts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load artifacts');
            setLoading(false);
            // Fallback: use raw artifacts
            setArtifacts(stableRawArtifacts);
        } finally {
            processingRef.current = false;
        }
    }, [stableRawArtifacts, contentHash]);

    useEffect(() => {
        processArtifacts();
    }, [processArtifacts]);

    // Show loading state for S3 artifacts
    if (loading) {
        return <AiMessageComponent 
            message={message} 
            theme={theme} 
            enhancedComponent={
                <div style={{ padding: '16px', textAlign: 'center' }} data-content-hash={contentHash}>
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
                <div style={{ padding: '16px', color: 'orange' }} data-content-hash={contentHash}>
                    <div>⚠️ Error loading visualization data</div>
                    <div style={{ fontSize: '0.8em', marginTop: '8px' }}>{error}</div>
                    <div style={{ fontSize: '0.8em', marginTop: '8px' }}>
                        Using fallback data if available
                    </div>
                </div>
            }
        />;
    }

    // CRITICAL: Log all artifacts before processing to detect duplicates
    console.log('🔍 EnhancedArtifactProcessor: Processing artifacts array:', {
        count: artifacts.length,
        types: artifacts.map(a => a?.type || a?.messageContentType || 'unknown'),
        messageId: (message as any).id,
        timestamp: new Date().toISOString()
    });
    
    // Process retrieved artifacts
    for (const artifact of artifacts) {
        if (artifact) {
            let parsedArtifact = artifact;
            
            // DEBUG: Log raw artifact
            console.log('🔍 RAW ARTIFACT:', typeof artifact, artifact);
            
            // Parse artifact if it's a JSON string
            if (typeof artifact === 'string') {
                try {
                    parsedArtifact = JSON.parse(artifact);
                    console.log('✅ EnhancedArtifactProcessor: Successfully parsed JSON string artifact');
                    console.log('🔍 PARSED ARTIFACT:', parsedArtifact);
                } catch (e) {
                    console.error('❌ EnhancedArtifactProcessor: Failed to parse artifact JSON:', e);
                    continue;
                }
            }
            
            console.log('🔍 EnhancedArtifactProcessor: Parsed artifact keys:', Object.keys(parsedArtifact || {}));
            console.log('🔍 EnhancedArtifactProcessor: Checking artifact type:', parsedArtifact.messageContentType || parsedArtifact.type);
            
            // Check for error artifacts (deserialization errors, validation errors, etc.)
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.type === 'deserialization_error' || 
                 parsedArtifact.type === 'invalid_artifact' ||
                 parsedArtifact.type === 'validation_error' ||
                 parsedArtifact.type === 'error' ||
                 parsedArtifact.messageContentType === 'error')) {
                console.log('⚠️ EnhancedArtifactProcessor: Rendering error artifact');
                return (
                    <div 
                        data-content-hash={contentHash}
                        style={{
                            padding: '16px',
                            margin: '8px 0',
                            backgroundColor: theme.palette.mode === 'dark' ? '#3d1f1f' : '#fff3cd',
                            border: `1px solid ${theme.palette.mode === 'dark' ? '#721c24' : '#ffc107'}`,
                            borderRadius: '4px',
                            color: theme.palette.mode === 'dark' ? '#f8d7da' : '#856404',
                        }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                            {parsedArtifact.title || 'Artifact Error'}
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            {parsedArtifact.data?.message || parsedArtifact.message || 'This artifact could not be displayed.'}
                        </div>
                        {parsedArtifact.data?.originalType && (
                            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                                Original type: {parsedArtifact.data.originalType}
                            </div>
                        )}
                    </div>
                );
            }
            
            // Check for comprehensive shale analysis - CLOUDSCAPE VERSION
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_shale_analysis') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering CloudscapeShaleVolumeDisplay from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<CloudscapeShaleVolumeDisplay data={parsedArtifact} />}
                />;
            }
            
            // Check for comprehensive porosity analysis - CLOUDSCAPE VERSION
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'comprehensive_porosity_analysis') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering CloudscapePorosityDisplay from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<CloudscapePorosityDisplay data={parsedArtifact} />}
                />;
            }
            
            // Check for data quality assessment - CLOUDSCAPE VERSION
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'data_quality_assessment') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering CloudscapeDataQualityDisplay from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<CloudscapeDataQualityDisplay artifact={parsedArtifact} />}
                />;
            }
            
            // Check for curve quality assessment - CLOUDSCAPE VERSION
            if (parsedArtifact && typeof parsedArtifact === 'object' && parsedArtifact.messageContentType === 'curve_quality_assessment') {
                console.log('🎉 EnhancedArtifactProcessor: Rendering CloudscapeCurveQualityDisplay from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<CloudscapeCurveQualityDisplay artifact={parsedArtifact} />}
                />;
            }
            
            // Check for multi-well correlation - CLOUDSCAPE VERSION
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'comprehensive_multi_well_correlation' || 
                 parsedArtifact.messageContentType === 'multi_well_correlation' ||
                 parsedArtifact.messageContentType === 'multi_well_correlation_analysis')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering CloudscapeMultiWellCorrelationDisplay from S3 artifact!');
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<CloudscapeMultiWellCorrelationDisplay data={parsedArtifact} />}
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
                console.log('🎉 EnhancedArtifactProcessor: Rendering TerrainMapArtifact!');
                console.log('🔍 FRONTEND DEBUG - parsedArtifact keys:', Object.keys(parsedArtifact));
                console.log('🔍 FRONTEND DEBUG - has geojson:', !!parsedArtifact.geojson);
                console.log('🔍 FRONTEND DEBUG - has data.geojson:', !!parsedArtifact.data?.geojson);
                console.log('🔍 FRONTEND DEBUG - has mapHtml:', !!parsedArtifact.mapHtml);
                console.log('🔍 FRONTEND DEBUG - parsedArtifact:', parsedArtifact);
                
                // CRITICAL FIX: Pass parsedArtifact.data, not parsedArtifact
                // The component expects the data object directly with metrics, geojson, etc.
                const terrainData = parsedArtifact.data || parsedArtifact;
                console.log('🔍 FRONTEND DEBUG - terrainData keys:', Object.keys(terrainData));
                console.log('🔍 FRONTEND DEBUG - terrainData.metrics:', terrainData.metrics);
                
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<TerrainMapArtifact 
                        data={terrainData} 
                        onFollowUpAction={onSendMessage}
                    />}
                />;
            }
            
            // NEW: Check for renewable energy wind farm layout
            // Check both parsedArtifact.data.messageContentType (from orchestrator) and parsedArtifact.messageContentType (direct)
            // Also check parsedArtifact.type to catch orchestrator-wrapped responses
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.data?.messageContentType === 'wind_farm_layout' || 
                 parsedArtifact.messageContentType === 'wind_farm_layout' ||
                 parsedArtifact.type === 'wind_farm_layout')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering LayoutMapArtifact!');
                // CRITICAL FIX: Always use parsedArtifact.data if it exists
                const layoutData = parsedArtifact.data || parsedArtifact;
                console.log('🔍 FRONTEND DEBUG - parsedArtifact.type:', parsedArtifact.type);
                console.log('🔍 FRONTEND DEBUG - layoutData keys:', Object.keys(layoutData));
                console.log('🔍 FRONTEND DEBUG - turbineCount:', layoutData.turbineCount);
                console.log('🔍 FRONTEND DEBUG - totalCapacity:', layoutData.totalCapacity);
                console.log('🔍 FRONTEND DEBUG - has geojson:', !!layoutData.geojson);
                console.log('🔍 FRONTEND DEBUG - full layoutData:', layoutData);
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<LayoutMapArtifact data={layoutData} />}
                />;
            }
            
            // NEW: Check for renewable energy wind farm simulation
            // CRITICAL FIX: Check both top-level and nested messageContentType
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'wind_farm_simulation' ||
                 parsedArtifact.data?.messageContentType === 'wind_farm_simulation' ||
                 parsedArtifact.type === 'wind_farm_simulation')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering SimulationChartArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<SimulationChartArtifact 
                        data={artifactData} 
                        onFollowUpAction={onSendMessage}
                    />}
                />;
            }
            
            // NEW: Check for wake simulation
            // CRITICAL FIX: Check both top-level and nested messageContentType
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'wake_simulation' ||
                 parsedArtifact.data?.messageContentType === 'wake_simulation' ||
                 parsedArtifact.type === 'wake_simulation')) {
                console.log('🌊 Rendering WakeAnalysisArtifact for wake simulation');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<WakeAnalysisArtifact 
                        data={artifactData} 
                        onFollowUpAction={onSendMessage}
                    />}
                />;
            }
            
            // NEW: Check for wake analysis
            // CRITICAL FIX: Check both top-level and nested messageContentType
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'wake_analysis' ||
                 parsedArtifact.data?.messageContentType === 'wake_analysis' ||
                 parsedArtifact.type === 'wake_analysis')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering SimulationChartArtifact for wake analysis!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<SimulationChartArtifact 
                        data={artifactData} 
                        onFollowUpAction={onSendMessage}
                    />}
                />;
            }
            
            // NEW: Check for wind rose analysis
            // CRITICAL FIX: Check both top-level and nested messageContentType
            console.log('🔍 Checking wind rose:', parsedArtifact?.messageContentType, parsedArtifact?.data?.messageContentType, parsedArtifact?.type);
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'wind_rose' || 
                 parsedArtifact.messageContentType === 'wind_rose_analysis' ||
                 parsedArtifact.data?.messageContentType === 'wind_rose' ||
                 parsedArtifact.data?.messageContentType === 'wind_rose_analysis' ||
                 parsedArtifact.type === 'wind_rose' ||
                 parsedArtifact.type === 'wind_rose_analysis')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering WindRoseArtifact!', parsedArtifact);
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<WindRoseArtifact data={artifactData} />}
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
            
            // MAINTENANCE ARTIFACTS: Check for equipment health assessment
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'equipment_health' ||
                 parsedArtifact.data?.messageContentType === 'equipment_health' ||
                 parsedArtifact.type === 'equipment_health')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering EquipmentHealthArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<EquipmentHealthArtifact data={artifactData} />}
                />;
            }
            
            // MAINTENANCE ARTIFACTS: Check for failure prediction
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'failure_prediction' ||
                 parsedArtifact.data?.messageContentType === 'failure_prediction' ||
                 parsedArtifact.type === 'failure_prediction')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering FailurePredictionArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<FailurePredictionArtifact data={artifactData} />}
                />;
            }
            
            // MAINTENANCE ARTIFACTS: Check for maintenance schedule
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'maintenance_schedule' ||
                 parsedArtifact.data?.messageContentType === 'maintenance_schedule' ||
                 parsedArtifact.type === 'maintenance_schedule')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering MaintenanceScheduleArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<MaintenanceScheduleArtifact data={artifactData} />}
                />;
            }
            
            // MAINTENANCE ARTIFACTS: Check for inspection report
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'inspection_report' ||
                 parsedArtifact.data?.messageContentType === 'inspection_report' ||
                 parsedArtifact.type === 'inspection_report')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering InspectionReportArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<InspectionReportArtifact data={artifactData} />}
                />;
            }
            
            // MAINTENANCE ARTIFACTS: Check for asset lifecycle
            if (parsedArtifact && typeof parsedArtifact === 'object' && 
                (parsedArtifact.messageContentType === 'asset_lifecycle' ||
                 parsedArtifact.data?.messageContentType === 'asset_lifecycle' ||
                 parsedArtifact.type === 'asset_lifecycle')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering AssetLifecycleArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={<AssetLifecycleArtifact data={artifactData} />}
                />;
            }

            // Check for project dashboard artifact
            if (parsedArtifact && typeof parsedArtifact === 'object' &&
                (parsedArtifact.messageContentType === 'project_dashboard' ||
                 parsedArtifact.data?.messageContentType === 'project_dashboard' ||
                 parsedArtifact.type === 'project_dashboard')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering ProjectDashboardArtifact!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={
                        <ProjectDashboardArtifact 
                            data={artifactData}
                            darkMode={theme.palette.mode === 'dark'}
                            onAction={(action: string, projectName: string) => {
                                console.log(`[ChatMessage] Dashboard action: ${action} on project: ${projectName}`);
                                
                                // Handle different dashboard actions
                                if (onSendMessage) {
                                    switch (action) {
                                        case 'view':
                                            // Send query to show project details
                                            onSendMessage(`show project ${projectName}`);
                                            break;
                                        case 'continue':
                                            // Set as active and suggest next step
                                            onSendMessage(`continue with project ${projectName}`);
                                            break;
                                        case 'rename':
                                            // Prompt for new name
                                            onSendMessage(`rename project ${projectName}`);
                                            break;
                                        case 'delete':
                                            // Use REST API for delete
                                            (async () => {
                                                try {
                                                    const { deleteProject } = await import('@/lib/api/projects');
                                                    console.log(`[ChatMessage] Deleting project ${projectName} via REST API`);
                                                    
                                                    const result = await deleteProject(projectName);
                                                    
                                                    console.log(`[ChatMessage] Delete result:`, result);
                                                    
                                                    if (result.success) {
                                                        console.log(`[ChatMessage] Successfully deleted project ${projectName}`);
                                                        // Wait a moment for S3 to propagate, then refresh dashboard
                                                        // Add timestamp to force cache refresh
                                                        setTimeout(() => {
                                                            onSendMessage(`show my project dashboard (refresh ${Date.now()})`);
                                                        }, 1000);
                                                    } else {
                                                        console.error(`[ChatMessage] Failed to delete project ${projectName}:`, result.message);
                                                        alert(`Failed to delete project: ${result.message || 'Unknown error'}`);
                                                    }
                                                } catch (error: any) {
                                                    console.error(`[ChatMessage] Error deleting project ${projectName}:`, error);
                                                    alert(`Error deleting project: ${error.message}`);
                                                }
                                            })();
                                            break;
                                        case 'bulk-delete':
                                            // Handle bulk delete - projectName contains JSON array of names
                                            // Use REST API for delete
                                            (async () => {
                                                try {
                                                    const projectNames = JSON.parse(projectName);
                                                    if (Array.isArray(projectNames) && projectNames.length > 0) {
                                                        const { deleteProject } = await import('@/lib/api/projects');
                                                        console.log(`[ChatMessage] Bulk deleting ${projectNames.length} projects via REST API`);
                                                        
                                                        // Delete all projects in parallel using REST API
                                                        const deletePromises = projectNames.map(async (name) => {
                                                            try {
                                                                const result = await deleteProject(name);
                                                                console.log(`[ChatMessage] Deleted project ${name}:`, result);
                                                                return { name, success: result.success, result };
                                                            } catch (error: any) {
                                                                console.error(`[ChatMessage] Failed to delete project ${name}:`, error);
                                                                return { name, success: false, error: error.message };
                                                            }
                                                        });
                                                        
                                                        const results = await Promise.all(deletePromises);
                                                        const successCount = results.filter(r => r.success).length;
                                                        const failCount = results.filter(r => !r.success).length;
                                                        
                                                        console.log(`[ChatMessage] Bulk delete complete: ${successCount} succeeded, ${failCount} failed`);
                                                        
                                                        // Show result to user
                                                        if (failCount > 0) {
                                                            alert(`Deleted ${successCount} projects. ${failCount} failed.`);
                                                        }
                                                        
                                                        // Refresh dashboard after deletion
                                                        // Add timestamp to force cache refresh
                                                        if (successCount > 0) {
                                                            setTimeout(() => {
                                                                onSendMessage(`show my project dashboard (refresh ${Date.now()})`);
                                                            }, 1000);
                                                        }
                                                    }
                                                } catch (e) {
                                                    console.error('[ChatMessage] Failed to parse bulk delete project names:', e);
                                                }
                                            })();
                                            break;
                                        case 'refresh':
                                            // Refresh dashboard
                                            onSendMessage('show my project dashboard');
                                            break;
                                        case 'create':
                                            // Start new project
                                            onSendMessage('analyze terrain at a new location');
                                            break;
                                        default:
                                            console.warn(`[ChatMessage] Unknown dashboard action: ${action}`);
                                    }
                                } else {
                                    console.warn('[ChatMessage] onSendMessage callback not available');
                                }
                            }}
                        />
                    }
                />;
            }

            // Check for data access approval request artifact
            if (parsedArtifact && typeof parsedArtifact === 'object' &&
                (parsedArtifact.messageContentType === 'data_access_approval' ||
                 parsedArtifact.data?.messageContentType === 'data_access_approval' ||
                 parsedArtifact.type === 'data_access_approval')) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering DataAccessApprovalComponent!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={
                        <DataAccessApprovalComponent
                            data={artifactData}
                            theme={theme}
                            onApprove={() => {
                                console.log('✅ User approved expanded data access');
                                if (onSendMessage) {
                                    onSendMessage('approve');
                                }
                            }}
                            onCancel={() => {
                                console.log('❌ User cancelled data access request');
                                if (onSendMessage) {
                                    onSendMessage('cancel');
                                }
                            }}
                        />
                    }
                />;
            }

            // Check for confirmation request artifact
            if (parsedArtifact && typeof parsedArtifact === 'object' &&
                (parsedArtifact.messageContentType === 'confirmation_required' ||
                 parsedArtifact.data?.messageContentType === 'confirmation_required' ||
                 parsedArtifact.type === 'confirmation_required' ||
                 parsedArtifact.requiresConfirmation === true)) {
                console.log('🎉 EnhancedArtifactProcessor: Rendering ConfirmationMessageComponent!');
                const artifactData = parsedArtifact.data || parsedArtifact;
                
                // Extract confirmation details
                const confirmationMessage = artifactData.message || parsedArtifact.message || 'Confirmation required';
                const confirmationPrompt = artifactData.confirmationPrompt || parsedArtifact.confirmationPrompt;
                const options = artifactData.options || parsedArtifact.options;
                const projectList = artifactData.projectList || parsedArtifact.projectList || artifactData.matches;
                const action = artifactData.action || parsedArtifact.action || 'confirm';
                const metadata = artifactData.metadata || parsedArtifact.metadata;
                
                return <AiMessageComponent 
                    message={message} 
                    theme={theme} 
                    enhancedComponent={
                        <ConfirmationMessageComponent
                            message={confirmationMessage}
                            confirmationPrompt={confirmationPrompt}
                            options={options}
                            projectList={projectList}
                            action={action}
                            metadata={metadata}
                            onConfirm={(value) => {
                                console.log('✅ User confirmed action:', value);
                                // Send confirmation response back through chat
                                if (onSendMessage) {
                                    // Generate follow-up message based on action
                                    let followUpMessage = '';
                                    if (action === 'delete' || action === 'bulk_delete') {
                                        followUpMessage = `yes`;
                                    } else if (action === 'merge') {
                                        followUpMessage = value;
                                    } else {
                                        followUpMessage = value;
                                    }
                                    onSendMessage(followUpMessage);
                                }
                            }}
                            onCancel={() => {
                                console.log('❌ User cancelled action');
                                if (onSendMessage) {
                                    onSendMessage('cancel');
                                }
                            }}
                        />
                    }
                />;
            }
        }
    }
    
    console.log('⚠️ EnhancedArtifactProcessor: Artifacts found but no matching component, using regular AI message');
    return (
        <div data-content-hash={contentHash}>
            <AiMessageComponent message={message} theme={theme} />
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when artifacts haven't changed
    // This prevents duplicate processing when props haven't actually changed
    const prevHash = JSON.stringify(prevProps.rawArtifacts);
    const nextHash = JSON.stringify(nextProps.rawArtifacts);
    const shouldSkipRender = prevHash === nextHash;
    
    if (shouldSkipRender) {
        console.log('⏭️ EnhancedArtifactProcessor: Skipping re-render, artifacts unchanged');
    }
    
    return shouldSkipRender;
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

    // Agent progress tracking
    const [showProgress, setShowProgress] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);

    // Check if message has a requestId for progress tracking
    useEffect(() => {
        const msgRequestId = (message as any).requestId;
        if (msgRequestId && message.role === 'ai' && !(message as any).responseComplete) {
            setRequestId(msgRequestId);
            setShowProgress(true);
        } else {
            setShowProgress(false);
        }
    }, [message]);

    // Use agent progress hook
    const { progressData, isPolling } = useAgentProgress({
        requestId,
        enabled: showProgress,
        onComplete: () => {
            console.log('[ChatMessage] Agent progress complete');
            setShowProgress(false);
        },
        onError: (error) => {
            console.error('[ChatMessage] Agent progress error:', error);
            setShowProgress(false);
        },
    });

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
            console.log('🔍 ChatMessage: Processing AI message', {
                messageId: (message as any).id,
                hasArtifacts: !!((message as any).artifacts),
                artifactsType: typeof (message as any).artifacts,
                isArray: Array.isArray((message as any).artifacts),
                artifactsCount: (message as any).artifacts?.length || 0,
                timestamp: new Date().toISOString()
            });

            // Show agent progress indicator if available
            const progressSteps = progressData?.steps || [];
            const currentStep = progressSteps.length > 0 
                ? progressSteps[progressSteps.length - 1]?.step 
                : '';
            const thinkingBlocks = (message as any).thinking || [];
            const thoughtSteps = (message as any).thoughtSteps || [];

            // Render progress indicator and thinking display
            const progressComponents = (
                <>
                    {showProgress && isPolling && (
                        <AgentProgressIndicator
                            steps={progressSteps}
                            currentStep={currentStep}
                            isVisible={true}
                        />
                    )}
                    {thinkingBlocks.length > 0 && (
                        <ExtendedThinkingDisplay
                            thinking={thinkingBlocks}
                            defaultExpanded={false}
                        />
                    )}
                    {thoughtSteps.length > 0 && (
                        <ExtendedThinkingDisplay
                            thinking={thoughtSteps}
                            defaultExpanded={true}
                        />
                    )}
                </>
            );
            
            // Check for artifacts in AI message and wrap in enhanced AiMessageComponent
            if ((message as any).artifacts && Array.isArray((message as any).artifacts) && (message as any).artifacts.length > 0) {
                console.log('🎯 ChatMessage: Found artifacts in AI message!', {
                    messageId: (message as any).id,
                    artifactsCount: (message as any).artifacts.length
                });
                const rawArtifacts = (message as any).artifacts;
                console.log('🔍 ChatMessage: First artifact raw:', rawArtifacts[0]);
                console.log('🔍 ChatMessage: First artifact type:', typeof rawArtifacts[0]);
                
                // NEW: Enhanced artifact processing with S3 support
                return (
                    <>
                        {progressComponents}
                        <EnhancedArtifactProcessor 
                            rawArtifacts={rawArtifacts}
                            message={message}
                            theme={theme}
                            onSendMessage={params.onSendMessage}
                        />
                    </>
                );
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
                return (
                    <>
                        {progressComponents}
                        <ProfessionalResponseComponent 
                            content={message.content} 
                            theme={theme}
                            chatSessionId={(message as any).chatSessionId || ''}
                        />
                    </>
                );
            }
            
            // Check if message contains EDIcraft Cloudscape template response
            // Use consistent detection logic with EDIcraftResponseComponent
            const hasEDIcraftIndicator = messageText.includes('✅') || messageText.includes('❌') || 
                                        messageText.includes('⏳') || messageText.includes('⚠️') || 
                                        messageText.includes('💡') || messageText.includes('ℹ️');
            const hasEDIcraftTerms = /wellbore|trajectory|minecraft|drilling|rig|rcon|blocks? placed|coordinates?|game rule|time lock|cleared|environment|clear.*confirmation|visualization|capabilities/i.test(messageText);
            const hasStructuredData = /\*\*[^*]+\*\*:?\s*[^\n]+/i.test(messageText);
            const isClearConfirmation = /✅.*\*\*Minecraft Environment Cleared\*\*/i.test(messageText) ||
                                       (messageText.includes('**Summary:**') && messageText.includes('**Wellbores Cleared:**'));
            
            const isEDIcraftResponse = isClearConfirmation || 
                                      (hasEDIcraftIndicator && hasEDIcraftTerms) || 
                                      (hasStructuredData && hasEDIcraftTerms);
            
            // Debug logging for EDIcraft detection
            console.log('🔍 EDIcraft Detection:', {
                messageText: messageText.substring(0, 200),
                hasEDIcraftIndicator,
                hasEDIcraftTerms,
                hasStructuredData,
                isClearConfirmation,
                isEDIcraftResponse
            });
            
            if (isEDIcraftResponse) {
                console.log('✅ Rendering EDIcraftResponseComponent');
                return (
                    <>
                        {progressComponents}
                        <EDIcraftResponseComponent content={messageText} />
                    </>
                );
            }
            
            // Check if message contains actual statistical data that should use interactive visualization
            const hasStatisticalData = messageText.includes('Mean:') &&
                                     messageText.includes('Median:') &&
                                     messageText.includes('Standard Deviation:');
            
            if (hasStatisticalData && messageText.length > 200) {
                return (
                    <>
                        {progressComponents}
                        <InteractiveAgentSummaryComponent 
                            content={message.content} 
                            theme={theme} 
                            chatSessionId={(message as any).chatSessionId || ''} 
                        />
                    </>
                );
            } else {
                return (
                    <>
                        {progressComponents}
                        <AiMessageComponent message={message} theme={theme} />
                    </>
                );
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

// Memoize to prevent re-renders when parent re-renders on every keystroke
export default React.memo(ChatMessage);
