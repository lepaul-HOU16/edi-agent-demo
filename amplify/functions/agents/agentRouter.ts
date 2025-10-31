/**
 * Enhanced Agent Router
 * Routes queries between Petrophysics Agent, General Knowledge Agent, and Catalog Search
 * Handles cross-agent integrations and context preservation
 */

import { GeneralKnowledgeAgent } from './generalKnowledgeAgent';
import { EnhancedStrandsAgent } from './enhancedStrandsAgent';
import { RenewableProxyAgent } from './renewableProxyAgent';
import { MaintenanceStrandsAgent } from '../maintenanceAgent/maintenanceStrandsAgent';
import { EDIcraftAgent } from './edicraftAgent';
import { getRenewableConfig } from '../shared/renewableConfig';
import { 
  ThoughtStep, 
  createThoughtStep, 
  completeThoughtStep 
} from '../../../utils/thoughtTypes';

interface RouterResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
}

export class AgentRouter {
  private generalAgent: GeneralKnowledgeAgent;
  private petrophysicsAgent: EnhancedStrandsAgent;
  private maintenanceAgent: MaintenanceStrandsAgent;
  private edicraftAgent: EDIcraftAgent;
  private renewableAgent: RenewableProxyAgent | null = null;
  private renewableEnabled: boolean = false;

  constructor(foundationModelId?: string, s3Bucket?: string) {
    this.generalAgent = new GeneralKnowledgeAgent();
    this.petrophysicsAgent = new EnhancedStrandsAgent(foundationModelId, s3Bucket);
    this.maintenanceAgent = new MaintenanceStrandsAgent(foundationModelId, s3Bucket);
    this.edicraftAgent = new EDIcraftAgent();
    console.log('✅ AgentRouter: Maintenance agent initialized');
    console.log('✅ AgentRouter: EDIcraft agent initialized');
    
    // Initialize renewable agent (always enabled unless explicitly disabled)
    try {
      const renewableConfig = getRenewableConfig();
      // Always initialize unless explicitly disabled
      if (renewableConfig.enabled !== false) {
        this.renewableAgent = new RenewableProxyAgent();
        this.renewableEnabled = true;
        console.log('✅ AgentRouter: Renewable energy integration enabled');
      } else {
        console.log('ℹ️ AgentRouter: Renewable energy integration explicitly disabled');
      }
    } catch (error) {
      console.warn('⚠️ AgentRouter: Failed to initialize renewable agent:', error);
      // Even if config fails, try to initialize anyway
      try {
        this.renewableAgent = new RenewableProxyAgent();
        this.renewableEnabled = true;
        console.log('✅ AgentRouter: Renewable energy integration enabled (fallback)');
      } catch (fallbackError) {
        console.error('❌ AgentRouter: Could not initialize renewable agent:', fallbackError);
        this.renewableEnabled = false;
      }
    }
    
    console.log('AgentRouter initialized with multi-agent capabilities');
  }

  /**
   * Main routing function - determines which agent should handle the query
   */
  async routeQuery(
    message: string, 
    conversationHistory?: any[], 
    sessionContext?: { 
      chatSessionId?: string; 
      userId?: string;
      selectedAgent?: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';
      collectionContext?: any; // Collection data context for scoped queries
    }
  ): Promise<RouterResponse> {
    console.log('🔀 AgentRouter: Routing query:', message.substring(0, 100) + '...');
    console.log('🔀 AgentRouter: Conversation history provided:', !!conversationHistory, 'messages:', conversationHistory?.length || 0);
    console.log('🔀 AgentRouter: Session context:', JSON.stringify(sessionContext, null, 2));
    
    // Log collection context if present
    if (sessionContext?.collectionContext) {
      console.log('🗂️ AgentRouter: Collection context active');
      console.log('🗂️ Collection:', sessionContext.collectionContext.collectionName || sessionContext.collectionContext.name);
      console.log('🗂️ Data items:', sessionContext.collectionContext.dataItems?.length || 0);
      console.log('ℹ️ AgentRouter: Agent will be limited to collection data scope');
    } else {
      console.log('ℹ️ AgentRouter: No collection context - full data access');
    }
    
    try {
      // Check for explicit agent selection
      let agentType: 'general' | 'petrophysics' | 'catalog' | 'renewable' | 'maintenance' | 'edicraft';
      
      // If agent is explicitly selected (not 'auto'), use it directly
      if (sessionContext?.selectedAgent && sessionContext.selectedAgent !== 'auto') {
        agentType = sessionContext.selectedAgent;
        console.log('✅ AgentRouter: Explicit agent selection (bypassing intent detection):', agentType);
        console.log('✅ AgentRouter: Selected agent value:', sessionContext.selectedAgent);
        console.log('✅ AgentRouter: Selected agent type:', typeof sessionContext.selectedAgent);
      } else {
        // Auto mode: Determine which agent should handle this query based on content
        agentType = this.determineAgentType(message);
        console.log('🎯 AgentRouter: Auto-detected agent based on message content:', agentType);
        console.log('🎯 AgentRouter: selectedAgent was:', sessionContext?.selectedAgent);
      }

      let result;
      switch (agentType) {
        case 'general':
          console.log('🌐 Routing to General Knowledge Agent');
          result = await this.generalAgent.processQuery(message);
          
          // Handle catalog integration if triggered
          if (result.triggerActions?.catalogZoom) {
            console.log('🗺️ Triggering catalog integration for coordinates:', result.triggerActions.catalogZoom.coordinates);
            const catalogResult = await this.integrateCatalogData(result, message);
            if (catalogResult) {
              result.artifacts = [...(result.artifacts || []), catalogResult];
            }
          }
          
          return {
            ...result,
            agentUsed: 'general_knowledge'
          };

        case 'maintenance':
          console.log('🔧 Routing to Maintenance Agent');
          try {
            result = await this.maintenanceAgent.processMessage(message);
            return {
              ...result,
              agentUsed: 'maintenance'
            };
          } catch (error) {
            console.error('❌ Maintenance agent error:', error);
            return {
              success: false,
              message: `Maintenance agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              agentUsed: 'maintenance_error',
              artifacts: []
            };
          }

        case 'edicraft':
          console.log('🎮 Routing to EDIcraft Agent');
          console.log('🎮 Message:', message);
          console.log('🎮 Session context:', sessionContext);
          
          // DETERMINISTIC PATTERN MATCHING for wellbore trajectory workflow
          let edicraftMessage = message;
          const wellborePattern = /build.*wellbore.*trajectory.*for\s+(well-\d+|well\s*\d+)/i;
          const wellboreMatch = message.match(wellborePattern);
          
          if (wellboreMatch) {
            const wellId = wellboreMatch[1].replace(/\s+/g, '-').toUpperCase();
            console.log(`[DETERMINISTIC] Detected wellbore trajectory request for: ${wellId}`);
            console.log('[DETERMINISTIC] Routing to wellbore trajectory workflow');
            
            // Construct explicit workflow instruction for the agent
            edicraftMessage = `Execute wellbore trajectory workflow for ${wellId}:
1. Call get_trajectory_coordinates("${wellId}") to fetch trajectory data from OSDU
2. Call calculate_trajectory_coordinates with the survey data to convert to Minecraft coordinates
3. Call build_wellbore_in_minecraft with the Minecraft coordinates to build the visualization
4. Report the results

IMPORTANT: Execute ALL steps in sequence. Do not stop after step 1.`;
            
            console.log('[DETERMINISTIC] Sending workflow instruction to agent:', edicraftMessage);
          }
          
          try {
            result = await this.edicraftAgent.processMessage(edicraftMessage);
            console.log('🎮 EDIcraft agent result:', {
              success: result.success,
              messageLength: result.message?.length,
              hasArtifacts: !!result.artifacts,
              connectionStatus: result.connectionStatus
            });
            return {
              ...result,
              agentUsed: 'edicraft'
            };
          } catch (error) {
            console.error('❌ EDIcraft agent error:', error);
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
            return {
              success: false,
              message: `EDIcraft agent error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              agentUsed: 'edicraft_error',
              artifacts: [],
              thoughtSteps: [{
                id: 'edicraft_error',
                type: 'completion',
                timestamp: Date.now(),
                title: 'EDIcraft Agent Error',
                summary: error instanceof Error ? error.message : 'Unknown error occurred',
                status: 'error'
              }]
            };
          }

        case 'renewable':
          console.log('🌱 Routing to Renewable Energy Agent');
          
          // Check if renewable integration is enabled
          if (!this.renewableEnabled || !this.renewableAgent) {
            console.log('⚠️ Renewable energy integration is disabled');
            return {
              success: true,
              message: 'Renewable energy features are currently disabled. Please contact your administrator to enable this feature.',
              artifacts: [],
              thoughtSteps: [{
                id: 'renewable_disabled',
                type: 'completion',
                timestamp: Date.now(),
                title: 'Renewable Energy Feature Disabled',
                summary: 'This feature requires configuration. Please contact your administrator.',
                status: 'complete'
              }],
              agentUsed: 'renewable_disabled'
            };
          }
          
          // Route to renewable agent with session context for async processing
          result = await this.renewableAgent.processQuery(message, conversationHistory, sessionContext);
          return {
            ...result,
            agentUsed: 'renewable_energy'
          };

        case 'catalog':
          console.log('🗺️ Routing to Catalog Search Agent');
          // For now, use existing catalog search handler
          // This could be enhanced to call catalogSearch function directly
          result = await this.petrophysicsAgent.processMessage(message);
          return {
            ...result,
            agentUsed: 'catalog_search'
          };

        case 'petrophysics':
        default:
          console.log('🔬 Routing to Petrophysics Agent');
          result = await this.petrophysicsAgent.processMessage(message);
          return {
            ...result,
            agentUsed: 'petrophysics'
          };
      }

    } catch (error) {
      console.error('❌ AgentRouter: Error in routing:', error);
      return {
        success: false,
        message: `Error routing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentUsed: 'router_error',
        artifacts: []
      };
    }
  }

  /**
   * Determine which agent should handle the query
   */
  private determineAgentType(message: string): 'general' | 'petrophysics' | 'catalog' | 'renewable' | 'maintenance' | 'edicraft' {
    const lowerMessage = message.toLowerCase();
    
    // Priority 1: EDIcraft patterns (HIGHEST PRIORITY for Minecraft/OSDU visualization)
    const edicraftPatterns = [
      // Core Minecraft patterns
      /minecraft/i,
      
      // Environment control patterns (clear, reset, remove)
      /clear.*minecraft|minecraft.*clear/i,
      /clear.*environment|environment.*clear/i,
      /remove.*wellbore|remove.*structure/i,
      /clean.*minecraft|reset.*minecraft/i,
      /delete.*wellbore|delete.*structure/i,
      
      // Wellbore trajectory patterns
      /wellbore.*trajectory|trajectory.*wellbore/i,
      /build.*wellbore|wellbore.*build/i,
      /osdu.*wellbore/i,
      /3d.*wellbore|wellbore.*path/i,
      
      // Horizon surface patterns
      /horizon.*surface|surface.*horizon/i,
      /build.*horizon|render.*surface/i,
      /osdu.*horizon/i,
      /geological.*surface/i,
      
      // NEW: Horizon finding and naming patterns
      /find.*horizon|horizon.*find/i,
      /get.*horizon|horizon.*name/i,
      /list.*horizon|show.*horizon/i,
      
      // NEW: Coordinate conversion patterns (more flexible)
      /convert.*coordinates|coordinates.*convert/i,
      /convert.*to.*minecraft|minecraft.*convert/i,
      /coordinates.*for.*minecraft|minecraft.*coordinates/i,
      
      // NEW: Combined horizon + coordinate patterns (HIGHEST PRIORITY)
      /horizon.*coordinates|coordinates.*horizon/i,
      /horizon.*minecraft|minecraft.*horizon/i,
      /horizon.*convert|convert.*horizon/i,
      
      // NEW: Natural language patterns
      /tell.*me.*horizon|horizon.*tell.*me/i,
      /what.*horizon|which.*horizon/i,
      /where.*horizon|horizon.*where/i,
      
      // NEW: Coordinate output patterns
      /coordinates.*you.*use|coordinates.*to.*use/i,
      /print.*coordinates|output.*coordinates/i,
      
      // Coordinate and position patterns
      /player.*position/i,
      /coordinate.*tracking/i,
      /transform.*coordinates/i,
      /utm.*minecraft/i,
      
      // Visualization patterns
      /minecraft.*visualization/i,
      /visualize.*minecraft/i,
      /subsurface.*visualization/i,
      /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
      
      // Combined patterns - well log + minecraft (priority over petrophysics)
      /well.*log.*minecraft|log.*minecraft/i,
      /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i
    ];
    
    // Priority 2: Maintenance patterns (HIGHEST PRIORITY for equipment-related queries)
    const maintenancePatterns = [
      /equipment.*failure|failure.*equipment/,
      /preventive.*maintenance|preventative.*maintenance/,
      /inspection.*schedule|schedule.*inspection/,
      /equipment.*monitoring|monitor.*equipment/,
      /maintenance.*planning|plan.*maintenance/,
      /predictive.*maintenance|predict.*maintenance/,
      /asset.*health|equipment.*health/,
      /equipment.*status|status.*equipment|status.*for.*equipment|status.*of.*equipment/,
      /show.*equipment.*status|check.*equipment.*status|get.*equipment.*status/,
      /status.*for.*all|status.*all.*wells|all.*wells.*status|all.*equipment.*status/,
      /show.*status.*for.*all|show.*all.*equipment|show.*all.*wells/,
      /status.*for.*(pump|comp|turb|motor|valve|tank|well)/,
      /status.*of.*(pump|comp|turb|motor|valve|tank|well)/,
      /what.*status.*(pump|comp|turb|motor|valve|tank|well)/,
      /maintenance.*history|maintenance.*records/,
      /failure.*prediction|predict.*failure/,
      /condition.*assessment|equipment.*condition/,
      /pm.*schedule|routine.*maintenance/
    ];
    
    // Priority 2: Weather queries (HIGHEST PRIORITY - must come first)
    const weatherPatterns = [
      /weather.*near.*wells?/,  // "weather near my wells"
      /weather.*near.*my.*wells?/,  // "weather near my wells" 
      /weather.*in|temperature.*in|forecast.*for|climate.*in/,
      /what.*weather|how.*weather|current.*weather/,
      /weather.*conditions/,
      /temperature.*near|forecast.*near|climate.*near/
    ];

    // Priority 2: Other general knowledge patterns
    const generalPatterns = [      
      // Regulatory/legal queries  
      /eu ai.*regulation|gdpr|legal.*requirement|compliance/,
      /regulation.*regarding|law.*about|government.*standard/,
      
      // General conversational patterns
      /^(what|how|why|when|where)\s+(is|are|was|were|do|does|did|can|could|should|would)/,
      /explain.*to.*me|tell.*me.*about|help.*me.*understand/,
      /what.*does.*mean|define|definition.*of/,
      
      // General knowledge questions
      /latest.*news|current.*events|recent.*development/,
      /market.*trend|industry.*news|economic/,
      
      // Conversational starters
      /^(hi|hello|hey|good morning|good afternoon)/,
      /^(can you|could you|please|help)/
    ];

    // Priority 2: Renewable energy patterns (before catalog/petrophysics to avoid conflicts)
    const renewablePatterns = [
      // Environmental and impact assessment (HIGHEST PRIORITY)
      /environmental/i,
      /impact.*assessment/i,
      /perform.*environmental/i,
      
      // Wind farm development
      /wind.*farm|wind.*turbine|turbine.*layout|wind.*energy/,
      /renewable.*energy|clean.*energy|green.*energy/,
      
      // Site analysis and terrain (BOTH WORD ORDERS)
      /terrain.*analysis|analyze.*terrain|site.*analysis.*wind|unbuildable.*areas|exclusion.*zones/,
      /wind.*resource|wind.*speed.*analysis|wind.*data/,
      
      // Layout and optimization
      /turbine.*placement|layout.*optimization|turbine.*spacing/,
      /wind.*farm.*design|wind.*farm.*layout/,
      /create.*wind.*farm.*layout|create.*\d+mw.*wind.*farm/,
      
      // Performance and simulation
      /wake.*analysis|wake.*effect|capacity.*factor/,
      /energy.*production.*wind|annual.*energy.*production|aep/,
      /wind.*simulation|performance.*simulation/,
      
      // Specific renewable terms
      /offshore.*wind|onshore.*wind|wind.*project/,
      /megawatt.*wind|mw.*wind|gigawatt.*hour|gwh/,
      /wind.*farm.*development|renewable.*site.*design/,
      
      // Report generation
      /generate.*comprehensive.*report|generate.*executive.*report/,
      /generate.*terrain.*analysis.*report|generate.*environmental.*impact.*assessment.*report/
    ];

    // Priority 3: Catalog/geographic patterns
    const catalogPatterns = [
      // Geographic searches
      /wells?.*in.*region|wells?.*in.*area|wells?.*offshore/,
      /show.*wells?.*in|find.*wells?.*near|wells?.*around/,
      /map.*of.*wells?|geographic.*distribution|spatial.*analysis/,
      /south china sea|gulf.*of.*mexico|north sea/,
      
      // Well discovery without specific analysis
      /show.*all.*wells?|list.*all.*wells?|wells?.*available/,
      /field.*overview.*map|well.*location|geographic.*search/
    ];

    // Priority 4: Petrophysics patterns (most specific, checked last to avoid conflicts)
    const petrophysicsPatterns = [
      // Comprehensive well analysis (HIGHEST PRIORITY)
      /analyze.*complete.*dataset.*wells?/,
      /comprehensive.*summary.*wells?/,
      /well.*data.*quality.*assessment/,
      /spatial.*distribution.*wells?/,
      /field.*overview.*well.*statistics/,
      
      // Well naming patterns (both cases)
      /well-\d+|WELL-\d+|analyze.*well.*\d+|analyze.*WELL.*\d+/,
      /wells?.*from.*well-\d+|wells?.*from.*WELL-\d+/,
      /production.*wells?.*\d+/,
      
      // Log curve analysis
      /log.*curves?|well.*logs?|las.*files?/,
      /(gr|rhob|nphi|dtc|cali).*analysis/,
      /gamma.*ray|density|neutron|resistivity.*data/,
      /available.*log.*curves?/,
      
      // Specific calculations
      /calculate.*(porosity|shale|saturation|permeability)/,
      /formation.*evaluation|petrophysical.*analysis/,
      /(density|neutron|gamma.*ray).*analysis/,
      
      // Multi-well analysis
      /multi.*well.*correlation|correlation.*panel/,
      /crossplot|cross.*plot/,
      /depth.*ranges?.*wells?/,
      
      // Technical petroleum engineering
      /larionov|archie|kozeny.*carman|timur/,
      /reservoir.*quality|completion.*target|net.*pay/
    ];

    // Test patterns in priority order - EDICRAFT FIRST, then MAINTENANCE, then WEATHER, then RENEWABLE!
    console.log('🔍 AgentRouter: Testing patterns for message:', lowerMessage.substring(0, 100));
    
    // Check EDIcraft patterns with detailed logging for each pattern test
    console.log('🎮 AgentRouter: Testing EDIcraft patterns...');
    const matchedEDIcraftPatterns: { pattern: RegExp; source: string }[] = [];
    
    for (const pattern of edicraftPatterns) {
      const matches = pattern.test(lowerMessage);
      if (matches) {
        matchedEDIcraftPatterns.push({ pattern, source: pattern.source });
        console.log('  ✅ EDIcraft pattern MATCHED:', pattern.source);
        console.log('  📝 Query excerpt:', lowerMessage.substring(0, 100));
      }
    }
    
    if (matchedEDIcraftPatterns.length > 0) {
      console.log('🎮 AgentRouter: EDIcraft agent selected');
      console.log('🎮 AgentRouter: Total patterns matched:', matchedEDIcraftPatterns.length);
      console.log('🎮 AgentRouter: Matched patterns:', matchedEDIcraftPatterns.map(p => p.source).join(', '));
      console.log('🎮 AgentRouter: Final decision: EDICRAFT');
      return 'edicraft';
    }
    console.log('  ❌ No EDIcraft patterns matched');
    
    // Check Maintenance patterns with detailed logging
    console.log('🔧 AgentRouter: Testing Maintenance patterns...');
    const matchedMaintenancePatterns: string[] = [];
    for (const pattern of maintenancePatterns) {
      if (pattern.test(lowerMessage)) {
        matchedMaintenancePatterns.push(pattern.source);
        console.log('  ✅ Maintenance pattern MATCHED:', pattern.source);
      }
    }
    if (matchedMaintenancePatterns.length > 0) {
      console.log('🔧 AgentRouter: Maintenance agent selected');
      console.log('🔧 AgentRouter: Total patterns matched:', matchedMaintenancePatterns.length);
      console.log('🔧 AgentRouter: Final decision: MAINTENANCE');
      return 'maintenance';
    }
    console.log('  ❌ No Maintenance patterns matched');
    
    // Check Weather patterns with detailed logging
    console.log('🌤️ AgentRouter: Testing Weather patterns...');
    const matchedWeatherPatterns: string[] = [];
    for (const pattern of weatherPatterns) {
      if (pattern.test(lowerMessage)) {
        matchedWeatherPatterns.push(pattern.source);
        console.log('  ✅ Weather pattern MATCHED:', pattern.source);
      }
    }
    if (matchedWeatherPatterns.length > 0) {
      console.log('🌤️ AgentRouter: Weather query detected - routing to General agent');
      console.log('🌤️ AgentRouter: Total patterns matched:', matchedWeatherPatterns.length);
      console.log('🌤️ AgentRouter: Final decision: GENERAL (weather)');
      return 'general';
    }
    console.log('  ❌ No Weather patterns matched');

    // Check Renewable patterns with detailed logging
    console.log('🌱 AgentRouter: Testing Renewable patterns...');
    const matchedRenewablePatterns: string[] = [];
    for (const pattern of renewablePatterns) {
      if (pattern.test(lowerMessage)) {
        matchedRenewablePatterns.push(pattern.source);
        console.log('  ✅ Renewable pattern MATCHED:', pattern.source);
      }
    }
    if (matchedRenewablePatterns.length > 0) {
      console.log('🌱 AgentRouter: Renewable energy agent selected');
      console.log('🌱 AgentRouter: Total patterns matched:', matchedRenewablePatterns.length);
      console.log('🌱 AgentRouter: Final decision: RENEWABLE');
      return 'renewable';
    }
    console.log('  ❌ No Renewable patterns matched');

    // Check General patterns with detailed logging
    console.log('🌐 AgentRouter: Testing General knowledge patterns...');
    const matchedGeneralPatterns: string[] = [];
    for (const pattern of generalPatterns) {
      if (pattern.test(lowerMessage)) {
        matchedGeneralPatterns.push(pattern.source);
        console.log('  ✅ General pattern MATCHED:', pattern.source);
      }
    }
    if (matchedGeneralPatterns.length > 0) {
      console.log('🌐 AgentRouter: General knowledge agent selected');
      console.log('🌐 AgentRouter: Total patterns matched:', matchedGeneralPatterns.length);
      console.log('🌐 AgentRouter: Final decision: GENERAL');
      return 'general';
    }
    console.log('  ❌ No General patterns matched');

    // Check Catalog patterns with detailed logging
    console.log('🗺️ AgentRouter: Testing Catalog patterns...');
    const matchedCatalogPatterns: string[] = [];
    for (const pattern of catalogPatterns) {
      if (pattern.test(lowerMessage)) {
        matchedCatalogPatterns.push(pattern.source);
        console.log('  ✅ Catalog pattern MATCHED:', pattern.source);
      }
    }
    if (matchedCatalogPatterns.length > 0) {
      console.log('🗺️ AgentRouter: Catalog search agent selected');
      console.log('🗺️ AgentRouter: Total patterns matched:', matchedCatalogPatterns.length);
      console.log('🗺️ AgentRouter: Final decision: CATALOG');
      return 'catalog';
    }
    console.log('  ❌ No Catalog patterns matched');

    // Check Petrophysics patterns with detailed logging
    console.log('🔬 AgentRouter: Testing Petrophysics patterns...');
    const matchedPetrophysicsPatterns: string[] = [];
    for (const pattern of petrophysicsPatterns) {
      if (pattern.test(lowerMessage)) {
        matchedPetrophysicsPatterns.push(pattern.source);
        console.log('  ✅ Petrophysics pattern MATCHED:', pattern.source);
      }
    }
    if (matchedPetrophysicsPatterns.length > 0) {
      console.log('🔬 AgentRouter: Petrophysics agent selected');
      console.log('🔬 AgentRouter: Total patterns matched:', matchedPetrophysicsPatterns.length);
      console.log('🔬 AgentRouter: Final decision: PETROPHYSICS');
      return 'petrophysics';
    }
    console.log('  ❌ No Petrophysics patterns matched');

    // Default routing based on content
    if (this.containsMaintenanceTerms(lowerMessage)) {
      return 'maintenance';
    }

    if (this.containsRenewableTerms(lowerMessage)) {
      return 'renewable';
    }

    if (this.containsPetrophysicsTerms(lowerMessage)) {
      return 'petrophysics';
    }

    if (this.containsGeographicTerms(lowerMessage)) {
      return 'catalog';
    }

    // Default to general for conversational queries
    console.log('� AgentRouter: Defaulting to general knowledge agent');
    return 'general';
  }

  /**
   * Check if message contains petroleum/petrophysics terms
   */
  private containsPetrophysicsTerms(message: string): boolean {
    // Don't consider weather or renewable queries as petrophysics
    if (message.includes('weather') || this.containsRenewableTerms(message)) {
      return false;
    }
    
    const petroTerms = [
      'porosity', 'permeability', 'saturation', 'shale', 'formation',
      'log', 'curve', 'well', 'reservoir', 'gamma ray', 'density',
      'neutron', 'resistivity', 'calculation', 'analysis', 'evaluation'
    ];

    return petroTerms.some(term => message.includes(term));
  }

  /**
   * Check if message contains maintenance terms
   */
  private containsMaintenanceTerms(message: string): boolean {
    const maintenanceTerms = [
      'equipment', 'failure', 'maintenance', 'inspection', 'preventive',
      'predictive', 'asset', 'health', 'monitoring', 'planning'
    ];

    return maintenanceTerms.some(term => message.includes(term));
  }

  /**
   * Check if message contains renewable energy terms
   */
  private containsRenewableTerms(message: string): boolean {
    const renewableTerms = [
      'wind', 'turbine', 'renewable', 'clean energy', 'green energy',
      'wind farm', 'layout', 'wake', 'capacity factor', 'aep',
      'environmental', 'impact assessment', 'terrain analysis'
    ];

    return renewableTerms.some(term => message.includes(term));
  }

  /**
   * Check if message contains geographic/location terms
   */
  private containsGeographicTerms(message: string): boolean {
    // Don't consider weather or renewable queries as geographic even if they mention location terms
    if (message.includes('weather') || this.containsRenewableTerms(message)) {
      return false;
    }
    
    const geoTerms = [
      'map', 'location', 'coordinate', 'region', 'area', 'offshore',
      'field', 'basin', 'geographic', 'spatial', 'distribution'
    ];

    return geoTerms.some(term => message.includes(term));
  }

  /**
   * Integrate catalog data for weather queries with geographic components
   */
  private async integrateCatalogData(generalResult: any, originalMessage: string): Promise<any> {
    console.log('🔗 AgentRouter: Integrating catalog data for weather query');
    
    try {
      const coordinates = generalResult.triggerActions?.catalogZoom?.coordinates;
      const region = generalResult.triggerActions?.catalogZoom?.region;
      
      if (!coordinates) {
        console.log('❌ No coordinates available for catalog integration');
        return null;
      }

      // Create a catalog search query based on the region
      const catalogQuery = `wells in ${region}`;
      
      // Note: In production, this would call the catalog search function directly
      // For now, return a mock catalog artifact that would be integrated
      return {
        messageContentType: 'catalog_map_integration',
        title: `Regional Wells - ${region}`,
        subtitle: `Wells and facilities in ${region}`,
        mapCenter: coordinates,
        zoomLevel: 8,
        wellsInRegion: [], // Would be populated by catalog search
        weatherOverlay: {
          enabled: true,
          data: generalResult.artifacts?.find(a => a.messageContentType === 'weather_widget')
        }
      };

    } catch (error) {
      console.error('Error in catalog integration:', error);
      return null;
    }
  }

  /**
   * Check if message contains EDIcraft/Minecraft terms
   */
  private containsEDIcraftTerms(message: string): boolean {
    const edicraftTerms = [
      'minecraft', 'wellbore trajectory', 'horizon surface', 'build wellbore',
      'osdu wellbore', 'osdu horizon', 'player position', 'coordinate tracking',
      'transform coordinates', 'utm minecraft', 'subsurface visualization',
      '3d wellbore', 'geological surface', 'minecraft visualization'
    ];

    return edicraftTerms.some(term => message.includes(term));
  }

  /**
   * Validate data access against collection context
   * Returns approval message if data is out of scope
   */
  private validateDataAccess(
    requestedDataIds: string[],
    collectionContext: any
  ): { allowed: boolean; approvalMessage?: string } {
    if (!collectionContext) {
      // No collection context - allow all access
      return { allowed: true };
    }

    // Build set of allowed data IDs from collection
    const allowedDataIds = new Set<string>();
    const dataItems = collectionContext.dataItems || [];
    
    dataItems.forEach((item: any) => {
      if (item.id) allowedDataIds.add(item.id);
      if (item.name) allowedDataIds.add(item.name);
    });

    // Check which requested items are out of scope
    const outOfScopeItems = requestedDataIds.filter(
      id => !allowedDataIds.has(id)
    );

    if (outOfScopeItems.length === 0) {
      // All requested data is within collection scope
      return { allowed: true };
    }

    // Some data is out of scope - create approval message
    const collectionName = collectionContext.collectionName || collectionContext.name || 'your collection';
    const approvalMessage = `⚠️ **Data Access Request**\n\nThis query requires access to ${outOfScopeItems.length} data points outside "${collectionName}".\n\n**Out of scope items:**\n${outOfScopeItems.slice(0, 5).join(', ')}${outOfScopeItems.length > 5 ? ` and ${outOfScopeItems.length - 5} more...` : ''}\n\nReply "approve" to proceed with expanded access, or rephrase your query to use only collection data.`;

    return {
      allowed: false,
      approvalMessage
    };
  }
}
