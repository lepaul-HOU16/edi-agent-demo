/**
 * Enhanced Agent Router
 * Routes queries between Petrophysics Agent, General Knowledge Agent, and Catalog Search
 * Handles cross-agent integrations and context preservation
 */

import { GeneralKnowledgeAgent } from './generalKnowledgeAgent';
import { EnhancedStrandsAgent } from './enhancedStrandsAgent';
import { RenewableEnergyAgent } from './renewableEnergyAgent';
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
  private renewableAgent: RenewableEnergyAgent;

  constructor(foundationModelId?: string, s3Bucket?: string) {
    this.generalAgent = new GeneralKnowledgeAgent();
    this.petrophysicsAgent = new EnhancedStrandsAgent(foundationModelId, s3Bucket);
    this.renewableAgent = new RenewableEnergyAgent(foundationModelId, s3Bucket);
    
    console.log('AgentRouter initialized with multi-agent capabilities');
  }

  /**
   * Main routing function - determines which agent should handle the query
   */
  async routeQuery(message: string, conversationHistory?: any[]): Promise<RouterResponse> {
    console.log('🔀 AgentRouter: Routing query:', message.substring(0, 100) + '...');
    console.log('🔀 AgentRouter: Conversation history provided:', !!conversationHistory, 'messages:', conversationHistory?.length || 0);
    
    try {
      // Determine which agent should handle this query
      const agentType = this.determineAgentType(message);
      console.log('🎯 AgentRouter: Selected agent:', agentType);

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

        case 'renewable':
          console.log('🌱 Routing to Renewable Energy Agent');
          result = await this.renewableAgent.processQuery(message);
          return {
            ...result,
            agentUsed: 'renewableEnergyAgent'
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
  private determineAgentType(message: string): 'general' | 'petrophysics' | 'catalog' | 'renewable' {
    const lowerMessage = message.toLowerCase();
    
    // Priority 1: Weather queries (HIGHEST PRIORITY - must come first)
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
      // Wind farm development
      /wind.*farm|wind.*turbine|turbine.*layout|wind.*energy/,
      /renewable.*energy|clean.*energy|green.*energy/,
      
      // Site analysis and terrain
      /terrain.*analysis|site.*analysis.*wind|unbuildable.*areas|exclusion.*zones/,
      /wind.*resource|wind.*speed.*analysis|wind.*data/,
      
      // Layout and optimization
      /turbine.*placement|layout.*optimization|turbine.*spacing/,
      /wind.*farm.*design|wind.*farm.*layout/,
      
      // Performance and simulation
      /wake.*analysis|wake.*effect|capacity.*factor/,
      /energy.*production.*wind|annual.*energy.*production|aep/,
      /wind.*simulation|performance.*simulation/,
      
      // Specific renewable terms
      /offshore.*wind|onshore.*wind|wind.*project/,
      /megawatt.*wind|mw.*wind|gigawatt.*hour|gwh/,
      /wind.*farm.*development|renewable.*site.*design/
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

    // Test patterns in priority order - WEATHER FIRST!
    if (weatherPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🌤️ AgentRouter: Weather pattern matched');
      return 'general';
    }

    if (generalPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🌐 AgentRouter: General knowledge pattern matched');
      return 'general';
    }

    if (renewablePatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🌱 AgentRouter: Renewable energy pattern matched');
      return 'renewable';
    }

    if (catalogPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('�️ AgentRouter: Catalog search pattern matched');
      return 'catalog';
    }

    if (petrophysicsPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🔬 AgentRouter: Petrophysics pattern matched');
      return 'petrophysics';
    }

    // Default routing based on content
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
   * Check if message contains renewable energy terms
   */
  private containsRenewableTerms(message: string): boolean {
    const renewableTerms = [
      'wind', 'turbine', 'renewable', 'clean energy', 'green energy',
      'wind farm', 'layout', 'wake', 'capacity factor', 'aep'
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
}
