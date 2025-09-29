/**
 * Enhanced Agent Router
 * Routes queries between Petrophysics Agent, General Knowledge Agent, and Catalog Search
 * Handles cross-agent integrations and context preservation
 */

import { GeneralKnowledgeAgent } from './generalKnowledgeAgent';
import { EnhancedStrandsAgent } from './enhancedStrandsAgent';
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

  constructor(foundationModelId?: string, s3Bucket?: string) {
    this.generalAgent = new GeneralKnowledgeAgent();
    this.petrophysicsAgent = new EnhancedStrandsAgent(foundationModelId, s3Bucket);
    
    console.log('AgentRouter initialized with multi-agent capabilities');
  }

  /**
   * Main routing function - determines which agent should handle the query
   */
  async routeQuery(message: string): Promise<RouterResponse> {
    console.log('🔀 AgentRouter: Routing query:', message.substring(0, 100) + '...');
    
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
  private determineAgentType(message: string): 'general' | 'petrophysics' | 'catalog' {
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

    // Priority 2: Catalog/geographic patterns
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

    // Priority 3: Petrophysics patterns (most specific, checked last to avoid conflicts)
    const petrophysicsPatterns = [
      // Specific calculations
      /calculate.*(porosity|shale|saturation|permeability)/,
      /formation.*evaluation|petrophysical.*analysis/,
      /(density|neutron|gamma.*ray).*analysis/,
      
      // Well-specific analysis
      /well-\d+|analyze.*well.*\d+|formation.*evaluation.*for/,
      /log.*curve|well.*log|las.*file/,
      
      // Technical petroleum engineering
      /larionov|archie|kozeny.*carman|timur/,
      /crossplot|correlation.*panel|multi.*well.*correlation/,
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

    if (catalogPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🗺️ AgentRouter: Catalog search pattern matched');
      return 'catalog';
    }

    if (petrophysicsPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🔬 AgentRouter: Petrophysics pattern matched');
      return 'petrophysics';
    }

    // Default routing based on content
    if (this.containsPetrophysicsTerms(lowerMessage)) {
      return 'petrophysics';
    }

    if (this.containsGeographicTerms(lowerMessage)) {
      return 'catalog';
    }

    // Default to general for conversational queries
    console.log('🌐 AgentRouter: Defaulting to general knowledge agent');
    return 'general';
  }

  /**
   * Check if message contains petroleum/petrophysics terms
   */
  private containsPetrophysicsTerms(message: string): boolean {
    // Don't consider weather queries as petrophysics even if they mention wells
    if (message.includes('weather')) {
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
   * Check if message contains geographic/location terms
   */
  private containsGeographicTerms(message: string): boolean {
    // Don't consider weather queries as geographic even if they mention location terms
    if (message.includes('weather')) {
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
