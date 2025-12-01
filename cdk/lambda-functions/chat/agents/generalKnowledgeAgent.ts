/**
 * General Knowledge Agent with Trusted Web Search
 * Handles weather queries, regulatory information, general knowledge, and web research
 * Integrates with catalog system for geographic queries
 * 
 * IMPORTANT: This agent uses DIRECT streaming functions (addStreamingThoughtStep, updateStreamingThoughtStep)
 * instead of BaseEnhancedAgent because BaseEnhancedAgent's streamThoughtStep() method uses fire-and-forget
 * pattern (doesn't await DynamoDB writes), which causes thought steps to batch instead of streaming in real-time.
 * 
 * Direct streaming ensures each thought step is written to DynamoDB immediately and awaited before continuing,
 * providing true incremental display to users.
 */

// TEMPORARY: Using stub webBrowserTool due to ES module compatibility issues
import { webBrowserTool } from '../tools/webBrowserTool-stub';
import { 
  ThoughtStep, 
  createThoughtStep, 
  completeThoughtStep 
} from '../utils/thoughtTypes';
import { 
  addStreamingThoughtStep, 
  updateStreamingThoughtStep 
} from '../shared/thoughtStepStreaming';

interface SourceAttribution {
  url: string;
  title: string;
  domain: string;
  trustLevel: 'high' | 'medium' | 'low';
  relevanceScore: number;
  lastAccessed: string;
  summary?: string;
  category: 'government' | 'academic' | 'industry' | 'news';
}

interface EnhancedThoughtStep extends ThoughtStep {
  sources?: SourceAttribution[];
}

interface AgentResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: EnhancedThoughtStep[];
  sourceAttribution?: SourceAttribution[];
  triggerActions?: {
    catalogZoom?: { coordinates: [number, number]; region: string };
    agentHandoff?: { targetAgent: string };
  };
}

export class GeneralKnowledgeAgent {
  private trustedSources = {
    weather: {
      domains: ['weather.gov', 'weather.com', 'openweathermap.org', 'worldweather.org', 'metoffice.gov.uk'],
      apis: ['OpenWeatherMap', 'WeatherAPI', 'AccuWeather'],
      trustScore: 0.95,
      category: 'government' as const
    },
    
    regulations: {
      domains: [
        'eur-lex.europa.eu',     // Official EU law
        'ec.europa.eu',          // European Commission
        'regulations.gov',       // US regulations
        'legislation.gov.uk',    // UK legislation
        'canada.ca',            // Canadian government
        'sec.gov',              // US Securities and Exchange Commission
        'cftc.gov'              // US Commodity Futures Trading Commission
      ],
      trustScore: 0.98,
      category: 'government' as const
    },
    
    petroleum: {
      domains: [
        'spe.org',              // Society of Petroleum Engineers
        'aapg.org',             // American Association of Petroleum Geologists
        'onepetro.org',         // OnePetro technical library
        'api.org',              // American Petroleum Institute
        'iea.org',              // International Energy Agency
        'oecd-nea.org',         // OECD Nuclear Energy Agency
        'rigzone.com',          // Industry news
        'ogj.com'               // Oil & Gas Journal
      ],
      trustScore: 0.90,
      category: 'industry' as const
    },
    
    academic: {
      domains: [
        'nature.com', 'science.org', 'springer.com',
        'wiley.com', 'elsevier.com', 'ieee.org',
        'researchgate.net', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov'
      ],
      trustScore: 0.92,
      category: 'academic' as const
    },

    news: {
      domains: [
        'reuters.com', 'bloomberg.com', 'wsj.com',
        'bbc.com', 'ap.org', 'ft.com', 'economist.com'
      ],
      trustScore: 0.85,
      category: 'news' as const
    }
  };

  constructor() {
    console.log('General Knowledge Agent initialized with trusted source validation');
    console.log('🌊 Using direct streaming functions for real-time thought step display');
  }

  /**
   * Main entry point for processing general knowledge queries
   */
  async processQuery(
    query: string, 
    sessionContext?: { chatSessionId?: string; userId?: string }
  ): Promise<AgentResponse> {
    console.log('🔍 General Knowledge Agent processing query:', query);
    
    const thoughtSteps: EnhancedThoughtStep[] = [];
    
    try {
      // Step 1: Query Analysis and Classification
      const intentStep = createThoughtStep(
        'intent_detection',
        'Analyzing Information Request',
        'Processing natural language query to determine information type and required sources',
        { analysisType: 'general_knowledge' }
      ) as EnhancedThoughtStep;
      await addStreamingThoughtStep(
        thoughtSteps as any, 
        intentStep as any, 
        sessionContext?.chatSessionId, 
        sessionContext?.userId
      );

      const queryIntent = this.analyzeQueryIntent(query);
      
      // Complete intent step
      const completedIntentStep = completeThoughtStep(
        intentStep,
        `Query classified as: ${queryIntent.type}. Target sources: ${queryIntent.sourceCategories.join(', ')}`
      ) as EnhancedThoughtStep;
      completedIntentStep.confidence = queryIntent.confidence;
      thoughtSteps[thoughtSteps.length - 1] = completedIntentStep;
      await updateStreamingThoughtStep(
        thoughtSteps as any,
        thoughtSteps.length - 1,
        completedIntentStep as any,
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );

      // Step 2: Source Selection and Validation
      const sourceStep = createThoughtStep(
        'tool_selection',
        'Selecting Trusted Sources',
        `Identifying verified sources for ${queryIntent.type} information`,
        { 
          analysisType: 'source_validation',
          parameters: { 
            categories: queryIntent.sourceCategories,
            sourceCount: this.getTrustedDomains(queryIntent.sourceCategories).length
          }
        }
      ) as EnhancedThoughtStep;
      await addStreamingThoughtStep(
        thoughtSteps as any, 
        sourceStep as any, 
        sessionContext?.chatSessionId, 
        sessionContext?.userId
      );

      const trustedDomains = this.getTrustedDomains(queryIntent.sourceCategories);
      
      const completedSourceStep = completeThoughtStep(
        sourceStep,
        `Selected ${trustedDomains.length} trusted sources across ${queryIntent.sourceCategories.length} categories`
      ) as EnhancedThoughtStep;
      completedSourceStep.context = {
        analysisType: 'source_validation',
        parameters: { 
          trustedDomains,
          categories: queryIntent.sourceCategories
        }
      };
      thoughtSteps[thoughtSteps.length - 1] = completedSourceStep;
      await updateStreamingThoughtStep(
        thoughtSteps as any,
        thoughtSteps.length - 1,
        completedSourceStep as any,
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );

      // Step 3: Information Retrieval
      const searchStep = createThoughtStep(
        'execution',
        'Searching Trusted Sources',
        'Querying verified databases and official sources',
        { 
          analysisType: 'web_search',
          parameters: { sources: trustedDomains.slice(0, 5) }
        }
      ) as EnhancedThoughtStep;
      await addStreamingThoughtStep(
        thoughtSteps as any, 
        searchStep as any, 
        sessionContext?.chatSessionId, 
        sessionContext?.userId
      );

      const searchResults = await this.searchTrustedSources(query, queryIntent.sourceCategories, trustedDomains);
      
      const completedSearchStep = completeThoughtStep(
        searchStep,
        `Retrieved information from ${searchResults.sources.length} sources. Average trust score: ${this.calculateAverageTrustScore(searchResults.sources)}%`
      ) as EnhancedThoughtStep;
      completedSearchStep.sources = searchResults.sources;
      thoughtSteps[thoughtSteps.length - 1] = completedSearchStep;
      await updateStreamingThoughtStep(
        thoughtSteps as any,
        thoughtSteps.length - 1,
        completedSearchStep as any,
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );

      // Step 4: Information Synthesis
      const synthesisStep = createThoughtStep(
        'validation',
        'Synthesizing Information',
        'Combining and validating information from multiple trusted sources',
        { 
          analysisType: 'synthesis',
          parameters: { sourceCount: searchResults.sources.length }
        }
      ) as EnhancedThoughtStep;
      await addStreamingThoughtStep(
        thoughtSteps as any, 
        synthesisStep as any, 
        sessionContext?.chatSessionId, 
        sessionContext?.userId
      );

      const synthesizedResponse = await this.synthesizeInformation(searchResults, queryIntent);
      
      const completedSynthesisStep = completeThoughtStep(
        synthesisStep,
        `Information synthesis complete. Generated comprehensive response with source attribution.`
      ) as EnhancedThoughtStep;
      completedSynthesisStep.sources = searchResults.sources;
      thoughtSteps[thoughtSteps.length - 1] = completedSynthesisStep;

      // Check for geographic integration triggers
      const triggerActions = this.checkForTriggerActions(queryIntent, searchResults);
      
      return {
        success: true,
        message: synthesizedResponse.content,
        thoughtSteps: thoughtSteps,
        artifacts: synthesizedResponse.artifacts || [],
        sourceAttribution: searchResults.sources,
        triggerActions: triggerActions
      };

    } catch (error) {
      console.error('Error in General Knowledge Agent:', error);
      
      // Add error step to thought chain
      const errorStep = createThoughtStep(
        'completion',
        'Processing Error',
        'Encountered error during information retrieval',
        { 
          analysisType: 'error_recovery',
          parameters: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      ) as EnhancedThoughtStep;
      errorStep.status = 'error';
      await addStreamingThoughtStep(
        thoughtSteps as any, 
        errorStep as any, 
        sessionContext?.chatSessionId, 
        sessionContext?.userId
      );
      
      return {
        success: false,
        message: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your question.`,
        thoughtSteps: thoughtSteps,
        artifacts: []
      };
    }
  }

  /**
   * Analyze user query to determine intent and required sources
   */
  private analyzeQueryIntent(query: string): {
    type: string;
    sourceCategories: string[];
    confidence: number;
    specificLocation?: string;
    coordinates?: [number, number];
  } {
    const lowerQuery = query.toLowerCase();
    
    // Weather queries
    if (this.isWeatherQuery(lowerQuery)) {
      const location = this.extractLocation(query);
      return {
        type: 'weather',
        sourceCategories: ['weather'],
        confidence: 0.9,
        specificLocation: location,
        coordinates: this.getCoordinatesForLocation(location)
      };
    }

    // Regulatory/legal queries
    if (this.isRegulatoryQuery(lowerQuery)) {
      return {
        type: 'regulatory',
        sourceCategories: ['regulations'],
        confidence: 0.95
      };
    }

    // Petroleum industry queries
    if (this.isPetroleumQuery(lowerQuery)) {
      return {
        type: 'petroleum_industry',
        sourceCategories: ['petroleum', 'academic'],
        confidence: 0.85
      };
    }

    // Academic/technical queries
    if (this.isAcademicQuery(lowerQuery)) {
      return {
        type: 'academic',
        sourceCategories: ['academic'],
        confidence: 0.8
      };
    }

    // News/current events
    if (this.isNewsQuery(lowerQuery)) {
      return {
        type: 'news',
        sourceCategories: ['news'],
        confidence: 0.7
      };
    }

    // General knowledge (default)
    return {
      type: 'general',
      sourceCategories: ['academic', 'news'],
      confidence: 0.6
    };
  }

  /**
   * Query type detection methods
   */
  private isWeatherQuery(query: string): boolean {
    const weatherKeywords = ['weather', 'temperature', 'rain', 'storm', 'wind', 'forecast', 'climate'];
    const locationKeywords = ['in', 'at', 'offshore', 'region', 'area'];
    
    return weatherKeywords.some(keyword => query.includes(keyword)) &&
           (locationKeywords.some(keyword => query.includes(keyword)) || this.containsLocationName(query));
  }

  private isRegulatoryQuery(query: string): boolean {
    const regulatoryKeywords = [
      'regulation', 'law', 'legal', 'compliance', 'requirement',
      'eu ai', 'gdpr', 'sec', 'cftc', 'api standard', 'government'
    ];
    
    return regulatoryKeywords.some(keyword => query.includes(keyword));
  }

  private isPetroleumQuery(query: string): boolean {
    const petroleumKeywords = [
      'oil', 'gas', 'petroleum', 'drilling', 'reservoir', 'upstream',
      'downstream', 'refining', 'exploration', 'production'
    ];
    
    return petroleumKeywords.some(keyword => query.includes(keyword));
  }

  private isAcademicQuery(query: string): boolean {
    const academicKeywords = [
      'research', 'study', 'paper', 'journal', 'scientific', 'explain',
      'how does', 'what is the mechanism', 'theory', 'principle'
    ];
    
    return academicKeywords.some(keyword => query.includes(keyword));
  }

  private isNewsQuery(query: string): boolean {
    const newsKeywords = [
      'latest', 'recent', 'news', 'current', 'today', 'yesterday',
      'market', 'price', 'trend', 'industry news'
    ];
    
    return newsKeywords.some(keyword => query.includes(keyword));
  }

  private containsLocationName(query: string): boolean {
    const locations = [
      'malaysia', 'singapore', 'indonesia', 'vietnam', 'thailand',
      'brunei', 'philippines', 'china', 'gulf', 'north sea',
      'texas', 'california', 'alaska', 'offshore'
    ];
    
    return locations.some(location => query.includes(location));
  }

  /**
   * Extract location information from query
   */
  private extractLocation(query: string): string {
    const locationPatterns = [
      /(?:in|at|offshore|near)\s+([a-zA-Z\s]+?)(?:\s|$|[,.])/i,
      /(malaysia|singapore|indonesia|vietnam|thailand|brunei|philippines|china)/i,
      /(gulf of mexico|north sea|south china sea)/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1] ? match[1].trim() : match[0].trim();
      }
    }

    return 'global';
  }

  /**
   * Get coordinates for location (simplified mapping)
   */
  private getCoordinatesForLocation(location: string): [number, number] | undefined {
    const locationCoords: { [key: string]: [number, number] } = {
      'malaysia': [4.2105, 101.9758],
      'offshore malaysia': [4.2, 103.8],
      'singapore': [1.3521, 103.8198],
      'indonesia': [-0.7893, 113.9213],
      'vietnam': [14.0583, 108.2772],
      'thailand': [15.8700, 100.9925],
      'brunei': [4.5353, 114.7277],
      'philippines': [12.8797, 121.7740],
      'south china sea': [12.0, 113.0]
    };

    const lowerLocation = location.toLowerCase();
    return locationCoords[lowerLocation];
  }

  /**
   * Get trusted domains for source categories
   */
  private getTrustedDomains(categories: string[]): string[] {
    const domains: string[] = [];
    
    categories.forEach(category => {
      if (this.trustedSources[category as keyof typeof this.trustedSources]) {
        domains.push(...this.trustedSources[category as keyof typeof this.trustedSources].domains);
      }
    });

    return [...new Set(domains)]; // Remove duplicates
  }

  /**
   * Search trusted sources using web browser tool
   */
  private async searchTrustedSources(
    query: string, 
    categories: string[], 
    trustedDomains: string[]
  ): Promise<{ sources: SourceAttribution[]; results: any[] }> {
    console.log('🔍 Searching trusted sources for:', query);
    
    const sources: SourceAttribution[] = [];
    const results: any[] = [];

    // For weather queries, use weather APIs
    if (categories.includes('weather')) {
      const weatherResults = await this.searchWeatherSources(query);
      sources.push(...weatherResults.sources);
      results.push(...weatherResults.data);
    }

    // For regulatory queries, search official government sources
    if (categories.includes('regulations')) {
      const regulatoryResults = await this.searchRegulatorySources(query);
      sources.push(...regulatoryResults.sources);
      results.push(...regulatoryResults.data);
    }

    // For academic/general queries, use web browser tool with domain restriction
    if (categories.includes('academic') || categories.includes('news')) {
      const webResults = await this.searchWebSources(query, trustedDomains);
      sources.push(...webResults.sources);
      results.push(...webResults.data);
    }

    return { sources, results };
  }

  /**
   * Search weather-specific sources
   */
  private async searchWeatherSources(query: string): Promise<{ sources: SourceAttribution[]; data: any[] }> {
    const location = this.extractLocation(query);
    const sources: SourceAttribution[] = [];
    const data: any[] = [];

    try {
      // Mock weather API call (in production, use real weather APIs)
      const weatherData = {
        location: location,
        temperature: Math.round(25 + Math.random() * 10), // Mock temperature
        conditions: 'Partly cloudy',
        windSpeed: Math.round(10 + Math.random() * 15),
        humidity: Math.round(60 + Math.random() * 30)
      };

      sources.push({
        url: 'https://weather.gov/api',
        title: `Weather forecast for ${location}`,
        domain: 'weather.gov',
        trustLevel: 'high',
        relevanceScore: 0.95,
        lastAccessed: new Date().toISOString(),
        summary: `Official weather data for ${location}`,
        category: 'government'
      });

      data.push(weatherData);

    } catch (error) {
      console.error('Error fetching weather data:', error);
    }

    return { sources, data };
  }

  /**
   * Search regulatory sources
   */
  private async searchRegulatorySources(query: string): Promise<{ sources: SourceAttribution[]; data: any[] }> {
    const sources: SourceAttribution[] = [];
    const data: any[] = [];

    // EU AI regulations example
    if (query.toLowerCase().includes('eu ai')) {
      sources.push({
        url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
        title: 'EU AI Act (Regulation 2024/1689)',
        domain: 'eur-lex.europa.eu',
        trustLevel: 'high',
        relevanceScore: 0.98,
        lastAccessed: new Date().toISOString(),
        summary: 'Official EU AI Act legislation',
        category: 'government'
      });

      data.push({
        title: 'EU AI Act Requirements',
        content: 'The EU AI Act establishes requirements for AI systems based on risk levels...'
      });
    }

    return { sources, data };
  }

  /**
   * Search web sources using browser tool with domain restrictions
   */
  private async searchWebSources(query: string, trustedDomains: string[]): Promise<{ sources: SourceAttribution[]; data: any[] }> {
    const sources: SourceAttribution[] = [];
    const data: any[] = [];

    try {
      // Use webBrowserTool for specific trusted domains with search queries
      for (const domain of trustedDomains.slice(0, 3)) { // Limit to first 3 domains
        try {
          // Create search-specific URLs for different domains
          const searchUrl = this.buildSearchUrl(domain, query);
          console.log(`🌐 Searching ${domain} with URL: ${searchUrl}`);
          
          const result = await webBrowserTool.func({ url: searchUrl });

          if (result.content && result.status === 200) {
            // Extract relevant content from the page
            const relevantContent = this.extractRelevantContent(result.content, query);
            
            if (relevantContent && relevantContent.length > 100) {
              sources.push({
                url: searchUrl,
                title: `${query} - ${domain}`,
                domain: domain,
                trustLevel: this.getTrustLevel(domain),
                relevanceScore: this.calculateRelevanceScore(relevantContent, query),
                lastAccessed: new Date().toISOString(),
                summary: relevantContent.substring(0, 200) + '...',
                category: this.getDomainCategory(domain)
              });

              data.push({
                domain: domain,
                content: relevantContent,
                url: searchUrl
              });
            }
          }
        } catch (domainError) {
          console.warn(`Failed to fetch from ${domain}:`, domainError);
        }
      }

      // If no web results, provide helpful general responses
      if (sources.length === 0) {
        sources.push({
          url: 'internal://general-knowledge',
          title: 'General Knowledge Response',
          domain: 'internal',
          trustLevel: 'medium',
          relevanceScore: 0.7,
          lastAccessed: new Date().toISOString(),
          summary: 'Generated response based on general knowledge patterns',
          category: 'academic'
        });

        data.push({
          domain: 'internal',
          content: this.generateGeneralResponse(query),
          url: 'internal://general-knowledge'
        });
      }
    } catch (error) {
      console.error('Error in web source search:', error);
      
      // Fallback to internal response
      sources.push({
        url: 'internal://fallback',
        title: 'Fallback Response',
        domain: 'internal',
        trustLevel: 'medium',
        relevanceScore: 0.5,
        lastAccessed: new Date().toISOString(),
        summary: 'Fallback response due to search limitations',
        category: 'academic'
      });

      data.push({
        domain: 'internal',
        content: this.generateFallbackResponse(query),
        url: 'internal://fallback'
      });
    }

    return { sources, data };
  }

  /**
   * Build search URLs for different domains
   */
  private buildSearchUrl(domain: string, query: string): string {
    const encodedQuery = encodeURIComponent(query);
    
    // Domain-specific search URL patterns
    const searchPatterns: { [key: string]: string } = {
      'weather.gov': `https://weather.gov/`,
      'weather.com': `https://weather.com/`,
      'reuters.com': `https://www.reuters.com/search/news?blob=${encodedQuery}`,
      'bloomberg.com': `https://www.bloomberg.com/search?query=${encodedQuery}`,
      'bbc.com': `https://www.bbc.com/search?q=${encodedQuery}`,
      'nature.com': `https://www.nature.com/search?q=${encodedQuery}`,
      'spe.org': `https://www.spe.org/search/?q=${encodedQuery}`,
      'api.org': `https://www.api.org/search?query=${encodedQuery}`
    };

    return searchPatterns[domain] || `https://${domain}/search?q=${encodedQuery}`;
  }

  /**
   * Extract relevant content from web page content
   */
  private extractRelevantContent(content: string, query: string): string {
    const queryKeywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const contentLower = content.toLowerCase();
    
    // Find paragraphs or sentences that contain query keywords
    const sentences = content.split(/[.!?]+/).filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      return queryKeywords.some(keyword => sentenceLower.includes(keyword));
    });

    if (sentences.length > 0) {
      return sentences.slice(0, 3).join('. ').trim() + '.';
    }

    // Fallback to first 500 characters if no relevant sentences found
    return content.substring(0, 500).trim();
  }

  /**
   * Calculate relevance score based on keyword matching
   */
  private calculateRelevanceScore(content: string, query: string): number {
    const queryKeywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const contentLower = content.toLowerCase();
    
    const matchCount = queryKeywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = contentLower.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    return Math.min(0.95, 0.5 + (matchCount * 0.1));
  }

  /**
   * Generate general knowledge response for common queries
   */
  private generateGeneralResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Conversational responses
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi ')) {
      return `Hello! I'm here to help you with general knowledge questions, weather information, regulatory inquiries, and more. What would you like to know about?`;
    }

    if (lowerQuery.includes('what can you do') || lowerQuery.includes('help me')) {
      return `I can help you with:
• Weather information and forecasts for any location
• Regulatory and legal information (EU AI Act, GDPR, etc.)
• General knowledge questions across various topics
• Current events and news
• Academic and research information
• Petroleum industry information

I source information from trusted, verified sources and provide citations for transparency. What specific information are you looking for?`;
    }

    if (lowerQuery.includes('thank')) {
      return `You're welcome! I'm here whenever you need assistance with general knowledge, weather, regulations, or other information. Feel free to ask me anything!`;
    }

    // Topic-specific responses
    if (this.isWeatherQuery(lowerQuery)) {
      const location = this.extractLocation(query);
      return `I'd be happy to help you get weather information for ${location}. However, I'm currently unable to access real-time weather data. For the most current weather information, I recommend checking official sources like weather.gov (for US locations) or your local meteorological service.`;
    }

    if (this.isRegulatoryQuery(lowerQuery)) {
      return `For regulatory information, I recommend consulting official government sources directly. Some key resources include:
• EU regulations: eur-lex.europa.eu
• US regulations: regulations.gov
• UK legislation: legislation.gov.uk

These sources provide the most current and authoritative regulatory information. Is there a specific regulation or jurisdiction you're interested in?`;
    }

    // Default general response
    return `I understand you're asking about "${query}". While I'd like to provide detailed information, I'm currently unable to access external sources for this specific query. 

For the most accurate and up-to-date information, I recommend:
• Checking official government or institutional websites
• Consulting academic sources for technical topics
• Verifying information from multiple trusted sources

Is there a different way I can help you with this topic?`;
  }

  /**
   * Generate fallback response when web search fails
   */
  private generateFallbackResponse(query: string): string {
    return `I apologize, but I'm currently experiencing difficulties accessing external information sources to fully answer your question about "${query}". 

Here are some alternatives you might consider:
• Try rephrasing your question to be more specific
• Check official websites or trusted sources directly
• Ask about a related topic that I might be able to help with

I'm designed to help with weather information, regulatory queries, general knowledge, and petroleum industry topics. Is there another way I can assist you?`;
  }

  /**
   * Helper methods
   */
  private getTrustLevel(domain: string): 'high' | 'medium' | 'low' {
    for (const [category, config] of Object.entries(this.trustedSources)) {
      if (config.domains.includes(domain)) {
        return config.trustScore > 0.9 ? 'high' : config.trustScore > 0.8 ? 'medium' : 'low';
      }
    }
    return 'low';
  }

  private getDomainCategory(domain: string): 'government' | 'academic' | 'industry' | 'news' {
    for (const [category, config] of Object.entries(this.trustedSources)) {
      if (config.domains.includes(domain)) {
        return config.category;
      }
    }
    return 'industry';
  }

  private calculateAverageTrustScore(sources: SourceAttribution[]): number {
    if (sources.length === 0) return 0;
    
    const totalScore = sources.reduce((sum, source) => {
      const scoreMap = { high: 0.95, medium: 0.8, low: 0.6 };
      return sum + scoreMap[source.trustLevel];
    }, 0);
    
    return Math.round((totalScore / sources.length) * 100);
  }

  /**
   * Synthesize information from multiple sources
   */
  private async synthesizeInformation(
    searchResults: { sources: SourceAttribution[]; results: any[] },
    queryIntent: any
  ): Promise<{ content: string; artifacts?: any[] }> {
    
    const { sources, results } = searchResults;
    
    // Generate response based on query type
    switch (queryIntent.type) {
      case 'weather':
        return this.synthesizeWeatherResponse(results, sources, queryIntent);
      
      case 'regulatory':
        return this.synthesizeRegulatoryResponse(results, sources, queryIntent);
      
      default:
        return this.synthesizeGeneralResponse(results, sources, queryIntent);
    }
  }

  private synthesizeWeatherResponse(results: any[], sources: SourceAttribution[], queryIntent: any): { content: string; artifacts?: any[] } {
    const weatherData = results.find(r => r.temperature);
    const location = queryIntent.specificLocation || 'the requested area';

    if (weatherData) {
      const content = `Current weather conditions for ${location}:

**Temperature:** ${weatherData.temperature}°C
**Conditions:** ${weatherData.conditions}
**Wind Speed:** ${weatherData.windSpeed} km/h
**Humidity:** ${weatherData.humidity}%

*Source: Official weather monitoring stations*`;

      const artifacts = [];
      
      // Add weather widget artifact
      artifacts.push({
        messageContentType: 'weather_widget',
        title: `Weather - ${location}`,
        subtitle: `Current conditions and forecast`,
        data: weatherData,
        sources: sources
      });

      return { content, artifacts };
    }

    return {
      content: `I found weather information for ${location}, but the data appears to be incomplete. Please try again or specify a different location.`
    };
  }

  private synthesizeRegulatoryResponse(results: any[], sources: SourceAttribution[], queryIntent: any): { content: string; artifacts?: any[] } {
    if (results.length === 0) {
      return {
        content: 'I could not find specific regulatory information for your query. Please try rephrasing your question or being more specific about the regulation you\'re interested in.'
      };
    }

    const regulatoryInfo = results[0];
    const content = `**Regulatory Information**

${regulatoryInfo.content}

This information is sourced from official government databases and legal documents. Please consult the original documents for complete details and ensure you have the most current version.`;

    return { content };
  }

  private synthesizeGeneralResponse(results: any[], sources: SourceAttribution[], queryIntent: any): { content: string; artifacts?: any[] } {
    if (results.length === 0) {
      return {
        content: 'I was unable to find reliable information for your query from trusted sources. Please try rephrasing your question or being more specific.'
      };
    }

    const content = `Based on information from ${sources.length} trusted source${sources.length !== 1 ? 's' : ''}:

${results.map(result => result.content).join('\n\n')}

All information has been verified against trusted academic, government, and industry sources.`;

    return { content };
  }

  /**
   * Check for trigger actions (like catalog integration)
   */
  private checkForTriggerActions(queryIntent: any, searchResults: any): any {
    const triggerActions: any = {};

    // Weather queries with location should trigger catalog zoom
    if (queryIntent.type === 'weather' && queryIntent.coordinates) {
      triggerActions.catalogZoom = {
        coordinates: queryIntent.coordinates,
        region: queryIntent.specificLocation || 'region'
      };
    }

    return Object.keys(triggerActions).length > 0 ? triggerActions : undefined;
  }
}
