/**
 * Renewable Intent Classifier
 * 
 * Implements proper pattern matching for renewable analysis types to prevent
 * all queries routing to terrain analysis. Includes confidence scoring and
 * fallback suggestions for ambiguous queries.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
 */

export interface RenewableAnalysisType {
  TERRAIN_ANALYSIS: 'terrain_analysis';
  WIND_ROSE_ANALYSIS: 'wind_rose_analysis';
  WAKE_ANALYSIS: 'wake_analysis';
  LAYOUT_OPTIMIZATION: 'layout_optimization';
  SITE_SUITABILITY: 'site_suitability';
  COMPREHENSIVE_ASSESSMENT: 'comprehensive_assessment';
  REPORT_GENERATION: 'report_generation';
  COMPARE_SCENARIOS: 'compare_scenarios';
  // Project lifecycle management intents
  DELETE_PROJECT: 'delete_project';
  RENAME_PROJECT: 'rename_project';
  MERGE_PROJECTS: 'merge_projects';
  ARCHIVE_PROJECT: 'archive_project';
  EXPORT_PROJECT: 'export_project';
  SEARCH_PROJECTS: 'search_projects';
  PROJECT_DASHBOARD: 'project_dashboard';
}

export const RenewableAnalysisType: RenewableAnalysisType = {
  TERRAIN_ANALYSIS: 'terrain_analysis',
  WIND_ROSE_ANALYSIS: 'wind_rose_analysis',
  WAKE_ANALYSIS: 'wake_analysis',
  LAYOUT_OPTIMIZATION: 'layout_optimization',
  SITE_SUITABILITY: 'site_suitability',
  COMPREHENSIVE_ASSESSMENT: 'comprehensive_assessment',
  REPORT_GENERATION: 'report_generation',
  COMPARE_SCENARIOS: 'compare_scenarios',
  // Project lifecycle management intents
  DELETE_PROJECT: 'delete_project',
  RENAME_PROJECT: 'rename_project',
  MERGE_PROJECTS: 'merge_projects',
  ARCHIVE_PROJECT: 'archive_project',
  EXPORT_PROJECT: 'export_project',
  SEARCH_PROJECTS: 'search_projects',
  PROJECT_DASHBOARD: 'project_dashboard'
};

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  alternatives: Array<{
    intent: string;
    confidence: number;
  }>;
  params: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface PatternDefinition {
  patterns: RegExp[];
  exclusions: RegExp[];
  weight: number;
  keywords: string[];
}

export class RenewableIntentClassifier {
  private readonly intentPatterns: Record<string, PatternDefinition> = {
    // CRITICAL: Compare scenarios patterns MUST come BEFORE other patterns
    // to prevent "compare scenarios" queries from being misclassified
    compare_scenarios: {
      patterns: [
        /compare\s+scenarios/i,
        /scenario\s+comparison/i,
        /compare\s+layouts/i,
        /compare\s+configurations/i,
        /compare\s+projects/i,
        /scenario\s+analysis/i,
        /compare\s+options/i,
        /compare\s+alternatives/i,
        /side.*by.*side.*comparison/i,
        /compare\s+different/i,
        /which\s+scenario/i,
        /which\s+layout/i,
        /which\s+configuration/i,
        /best\s+scenario/i,
        /optimal\s+scenario/i,
        /evaluate\s+scenarios/i,
        /assess\s+scenarios/i
      ],
      exclusions: [
        /terrain(?!.*compare)/i,
        /wind.*rose(?!.*compare)/i,
        /wake(?!.*compare)/i,
        /financial(?!.*compare)/i,
        /report(?!.*compare)/i
      ],
      weight: 1.7,  // Very high weight to prioritize scenario comparison
      keywords: ['compare', 'scenarios', 'comparison', 'layouts', 'configurations', 'options', 'alternatives', 'side by side', 'which', 'best', 'optimal', 'evaluate', 'assess']
    },

    // CRITICAL: Financial analysis patterns MUST come BEFORE terrain patterns
    // to prevent "financial analysis" queries from being misclassified as terrain_analysis
    report_generation: {
      patterns: [
        /financial\s+analysis/i,
        /roi\s+calculation/i,
        /return\s+on\s+investment/i,
        /economic\s+analysis/i,
        /cost\s+benefit/i,
        /project\s+economics/i,
        /financial\s+report/i,
        /generate.*report/i,
        /create.*report/i,
        /report.*generation/i,
        /executive.*summary/i,
        /project.*report/i,
        /summary.*report/i,
        /final.*report/i,
        /analysis.*report/i,
        /report.*for/i,
        /lcoe/i,
        /levelized.*cost/i,
        /financial.*metrics/i,
        /investment.*analysis/i,
        /payback.*period/i,
        /net.*present.*value/i,
        /npv/i,
        /irr/i,
        /internal.*rate.*return/i
      ],
      exclusions: [
        /compare/i,  // Exclude compare keywords
        /scenario/i,
        /terrain(?!.*financial)/i,  // Allow "terrain" only if not followed by "financial"
        /wind.*rose(?!.*financial)/i,
        /wake(?!.*financial)/i,
        /layout(?!.*financial)/i
      ],
      weight: 1.6,  // High weight to prioritize financial analysis
      keywords: ['financial', 'roi', 'economic', 'cost', 'report', 'lcoe', 'investment', 'payback', 'npv', 'irr', 'analysis', 'summary', 'executive']
    },

    terrain_analysis: {
      patterns: [
        /terrain.*analysis/i,
        /analyz.*terrain/i,  // CRITICAL: Match "analyze terrain" word order
        /site.*terrain/i,
        /topography/i,
        /elevation.*profile/i,
        /osm.*features/i,
        /buildings.*roads.*water/i,
        /terrain.*assessment/i,
        /geographic.*analysis/i,
        /land.*use.*analysis/i,
        /terrain.*constraints/i,
        /site.*constraints/i,
        /environmental.*constraints/i
      ],
      exclusions: [
        /financial/i,  // CRITICAL: Exclude financial keywords
        /roi/i,
        /economic/i,
        /cost.*benefit/i,
        /investment/i,
        /lcoe/i,
        /payback/i,
        /wind.*rose/i,
        /wind.*direction/i,
        /wind.*pattern/i,
        /wake.*effect/i,
        /wake.*analysis/i,
        /layout.*optimization/i,
        /turbine.*placement/i,
        /site.*suitability.*score/i,
        /overall.*assessment/i,
        /report/i,
        /generate.*report/i
      ],
      weight: 0.9,
      keywords: ['terrain', 'topography', 'elevation', 'osm', 'buildings', 'roads', 'water', 'constraints']
    },

    wind_rose_analysis: {
      patterns: [
        /wind.*rose/i,
        /wind.*direction/i,
        /wind.*speed.*distribution/i,
        /prevailing.*wind/i,
        /seasonal.*wind/i,
        /wind.*pattern/i,
        /wind.*resource.*analysis/i,
        /directional.*wind/i,
        /wind.*frequency/i,
        /wind.*statistics/i,
        /show.*wind/i,
        /wind.*analysis/i
      ],
      exclusions: [
        /terrain/i,
        /wake.*effect/i,
        /layout/i,
        /site.*suitability/i,
        /turbine.*placement/i,
        /osm/i,
        /buildings/i,
        /roads/i
      ],
      weight: 1.5,
      keywords: ['wind rose', 'wind direction', 'wind speed', 'prevailing', 'seasonal', 'wind pattern', 'wind analysis']
    },

    wake_analysis: {
      patterns: [
        /wake.*effect/i,
        /turbine.*interaction/i,
        /wake.*modeling/i,
        /downstream.*impact/i,
        /wake.*loss/i,
        /wake.*deficit/i,
        /turbine.*wake/i,
        /wake.*simulation/i,
        /aerodynamic.*interaction/i,
        /wake.*interference/i,
        /analyze.*wake/i,
        /wake.*analysis.*for.*project/i,
        /wake.*study/i
      ],
      exclusions: [
        /terrain.*analysis/i,
        /wind.*rose/i,
        /layout.*optimization/i,
        /optimize.*layout/i,  // CRITICAL: Exclude "optimize layout" queries
        /optimize.*turbine/i,  // CRITICAL: Exclude "optimize turbine" queries
        /turbine.*placement/i,  // CRITICAL: Exclude layout-related queries
        /site.*suitability/i,
        /overall.*assessment/i,
        /create.*layout/i,
        /generate.*layout/i,
        /design.*layout/i,
        /new.*layout/i,
        /build.*layout/i,
        /make.*layout/i,
        /create.*wind.*farm/i,
        /generate.*wind.*farm/i,
        /design.*wind.*farm/i
      ],
      weight: 1.3,
      keywords: ['wake', 'turbine interaction', 'downstream', 'wake loss', 'wake modeling', 'wake analysis']
    },

    layout_optimization: {
      patterns: [
        /layout.*optimization/i,
        /turbine.*placement/i,
        /spacing.*optimization/i,
        /array.*design/i,
        /optimal.*layout/i,
        /turbine.*positioning/i,
        /farm.*layout/i,
        /placement.*optimization/i,
        /turbine.*spacing/i,
        /layout.*design/i,
        /create.*layout/i,
        /generate.*layout/i,
        /design.*layout/i,
        /new.*layout/i,
        /build.*layout/i,
        /make.*layout/i,
        /create.*wind.*farm.*layout/i,
        /generate.*wind.*farm.*layout/i,
        /design.*wind.*farm/i,
        /create.*turbine.*layout/i,
        /plan.*turbine.*placement/i,
        /design.*turbine.*array/i,
        /optimize.*wind.*farm/i,  // CRITICAL: Match "optimize wind farm"
        /optimize.*layout/i,
        /optimize.*turbine/i,
        /wind.*farm.*optimization/i
      ],
      exclusions: [
        /terrain.*analysis/i,
        /wind.*rose/i,
        /wake.*effect.*only/i,
        /wake.*analysis.*only/i,
        /analyze.*wake/i,
        /site.*suitability.*score/i,
        /overall.*assessment/i
      ],
      weight: 1.4,
      keywords: ['layout', 'placement', 'spacing', 'optimization', 'positioning', 'array design', 'create', 'generate', 'design', 'build']
    },

    site_suitability: {
      patterns: [
        /site.*suitability/i,
        /feasibility.*analysis/i,
        /site.*assessment/i,
        /development.*potential/i,
        /overall.*scoring/i,
        /suitability.*score/i,
        /site.*evaluation/i,
        /comprehensive.*assessment/i,
        /site.*ranking/i,
        /viability.*analysis/i
      ],
      exclusions: [
        /terrain.*analysis.*only/i,
        /wind.*rose.*only/i,
        /wake.*analysis.*only/i,
        /layout.*optimization.*only/i
      ],
      weight: 1.0,
      keywords: ['suitability', 'feasibility', 'assessment', 'potential', 'scoring', 'evaluation']
    },

    comprehensive_assessment: {
      patterns: [
        /comprehensive.*analysis/i,
        /full.*assessment/i,
        /complete.*evaluation/i,
        /end.*to.*end/i,
        /all.*analysis/i,
        /complete.*workflow/i,
        /full.*suite/i,
        /comprehensive.*study/i
      ],
      exclusions: [],
      weight: 0.8,
      keywords: ['comprehensive', 'complete', 'full', 'all analysis', 'end-to-end']
    },

    // Project Lifecycle Management Intents
    delete_project: {
      patterns: [
        /delete.*project/i,
        /remove.*project/i,
        /get.*rid.*of.*project/i,
        /trash.*project/i,
        /delete.*all.*projects/i,
        /remove.*all.*projects/i,
        /delete.*projects.*matching/i,
        /delete.*projects.*except/i,
        /clean.*up.*projects/i,
        /purge.*projects/i
      ],
      exclusions: [
        /rename/i,
        /merge/i,
        /archive/i,
        /export/i,
        /list/i,
        /show/i,
        /search/i
      ],
      weight: 1.6,
      keywords: ['delete', 'remove', 'trash', 'get rid of', 'clean up', 'purge']
    },

    rename_project: {
      patterns: [
        /rename.*project/i,
        /change.*name.*project/i,
        /call.*it/i,
        /rename.*to/i,
        /change.*project.*name/i,
        /update.*project.*name/i,
        /project.*name.*to/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /merge/i,
        /archive/i,
        /export/i
      ],
      weight: 1.6,
      keywords: ['rename', 'change name', 'call it', 'update name']
    },

    merge_projects: {
      patterns: [
        /merge.*projects/i,
        /combine.*projects/i,
        /merge.*project.*with/i,
        /combine.*project.*with/i,
        /consolidate.*projects/i,
        /join.*projects/i,
        /merge.*into/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /rename/i,
        /archive/i,
        /export/i,
        /list/i,
        /show/i
      ],
      weight: 1.6,
      keywords: ['merge', 'combine', 'consolidate', 'join']
    },

    archive_project: {
      patterns: [
        /archive.*project/i,
        /unarchive.*project/i,
        /restore.*project/i,
        /archived.*projects/i,
        /list.*archived/i,
        /show.*archived/i,
        /move.*to.*archive/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /rename/i,
        /merge/i,
        /export/i
      ],
      weight: 1.5,
      keywords: ['archive', 'unarchive', 'restore', 'archived']
    },

    export_project: {
      patterns: [
        /export.*project/i,
        /import.*project/i,
        /download.*project/i,
        /save.*project/i,
        /backup.*project/i,
        /export.*data/i,
        /import.*from/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /rename/i,
        /merge/i,
        /archive/i
      ],
      weight: 1.5,
      keywords: ['export', 'import', 'download', 'save', 'backup']
    },

    search_projects: {
      patterns: [
        /search.*projects/i,
        /find.*projects/i,
        /filter.*projects/i,
        /projects.*in/i,
        /projects.*at/i,
        /projects.*created/i,
        /incomplete.*projects/i,
        /show.*duplicates/i,
        /find.*duplicates/i,
        /duplicate.*projects/i,
        /projects.*near/i,
        /projects.*within/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /rename/i,
        /merge/i,
        /archive/i,
        /export/i
      ],
      weight: 1.4,
      keywords: ['search', 'find', 'filter', 'duplicates', 'incomplete', 'near', 'within']
    },

    project_dashboard: {
      patterns: [
        /show.*project.*dashboard/i,
        /project.*dashboard/i,
        /dashboard/i,
        /show.*all.*projects/i,
        /list.*all.*projects/i,
        /project.*overview/i,
        /project.*summary/i,
        /show.*projects/i,
        /view.*projects/i,
        /my.*projects/i,
        /all.*projects/i
      ],
      exclusions: [
        /delete/i,
        /remove/i,
        /rename/i,
        /merge/i,
        /archive/i,
        /export/i,
        /search/i,
        /find/i,
        /filter/i
      ],
      weight: 1.6,
      keywords: ['dashboard', 'overview', 'summary', 'all', 'show', 'list', 'view']
    }
  };

  /**
   * Classify the intent of a renewable energy query
   */
  classifyIntent(query: string): IntentClassificationResult {
    console.log('🔍 RenewableIntentClassifier: Analyzing query:', query);
    
    // Safety check for undefined/null query
    if (!query || typeof query !== 'string') {
      console.error('❌ Invalid query provided to classifyIntent:', query);
      return {
        intent: 'unknown',
        confidence: 0,
        parameters: {},
        alternatives: []
      };
    }
    
    const lowerQuery = query.toLowerCase();
    const scores: Record<string, number> = {};
    
    // Calculate scores for each intent type
    for (const [intentType, definition] of Object.entries(this.intentPatterns)) {
      scores[intentType] = this.calculateIntentScore(lowerQuery, definition);
    }
    
    console.log('🔍 Intent scores:', scores);
    
    // Sort by confidence score
    const sortedIntents = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([intent, score]) => ({ intent, confidence: Math.round(score * 100) }));
    
    const topIntent = sortedIntents[0];
    const alternatives = sortedIntents.slice(1, 4); // Top 3 alternatives
    
    // Determine if confirmation is required
    const requiresConfirmation = this.shouldRequireConfirmation(topIntent.confidence, alternatives);
    
    const result: IntentClassificationResult = {
      intent: topIntent.intent,
      confidence: topIntent.confidence,
      alternatives,
      params: this.extractParameters(query, topIntent.intent),
      requiresConfirmation
    };
    
    console.log('🎯 Classification result:', result);
    return result;
  }

  /**
   * Get confidence score for a specific intent
   */
  getConfidenceScore(query: string, intent: string): number {
    const definition = this.intentPatterns[intent];
    if (!definition) return 0;
    if (!query || typeof query !== 'string') return 0;
    
    return Math.round(this.calculateIntentScore(query.toLowerCase(), definition) * 100);
  }

  /**
   * Suggest alternative intents for ambiguous queries
   */
  suggestAlternatives(query: string): string[] {
    const result = this.classifyIntent(query);
    return result.alternatives.map(alt => alt.intent);
  }

  /**
   * Calculate intent score based on pattern matching
   */
  private calculateIntentScore(query: string, definition: PatternDefinition): number {
    let score = 0;
    
    // Check positive patterns - give higher base score for matches
    const patternMatches = definition.patterns.filter(pattern => pattern.test(query)).length;
    if (patternMatches > 0) {
      // Base score of 0.6 for any pattern match, plus bonus for multiple matches
      score = 0.6 + (patternMatches * 0.1);
      score *= definition.weight;
    }
    
    // Apply exclusion penalties
    const exclusionMatches = definition.exclusions.filter(exclusion => exclusion.test(query)).length;
    if (exclusionMatches > 0) {
      score -= (exclusionMatches * 0.4); // Stronger penalty for exclusion matches
    }
    
    // Keyword bonus - more generous scoring
    const keywordMatches = definition.keywords.filter(keyword => 
      query.includes(keyword.toLowerCase())
    ).length;
    if (keywordMatches > 0) {
      score += (keywordMatches * 0.15); // Higher keyword bonus
    }
    
    // Special boost for exact keyword matches
    const exactKeywordMatches = definition.keywords.filter(keyword => {
      const keywordRegex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return keywordRegex.test(query);
    }).length;
    if (exactKeywordMatches > 0) {
      score += (exactKeywordMatches * 0.2); // Bonus for exact matches
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine if user confirmation is required
   */
  private shouldRequireConfirmation(topConfidence: number, alternatives: Array<{intent: string, confidence: number}>): boolean {
    // Require confirmation if:
    // 1. Top confidence is below 70%
    // 2. There's a close second option (within 20 points)
    if (topConfidence < 70) return true;
    
    if (alternatives.length > 0 && (topConfidence - alternatives[0].confidence) < 20) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract parameters from query based on intent type
   */
  private extractParameters(query: string, intent: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract coordinates if present - look for decimal coordinates
    const coordMatch = query.match(/(-?\d+\.\d+),?\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      params.latitude = parseFloat(coordMatch[1]);
      params.longitude = parseFloat(coordMatch[2]);
    }
    
    // Extract capacity if present
    const capacityMatch = query.match(/(\d+)\s*mw/i);
    if (capacityMatch) {
      params.capacity = parseInt(capacityMatch[1]);
    }
    
    // Extract area/radius if present
    const areaMatch = query.match(/(\d+)\s*(km|mile|meter)/i);
    if (areaMatch) {
      params.radius = parseInt(areaMatch[1]);
      params.unit = areaMatch[2].toLowerCase();
    }
    
    // Extract project ID if present
    // Matches: "project: ID", "project ID", "project-ID", "project_ID"
    const projectIdMatch = query.match(/project[:\s_-]+([a-zA-Z0-9_-]+)/i);
    if (projectIdMatch) {
      params.project_id = projectIdMatch[1];
    }
    
    // Intent-specific parameter extraction
    switch (intent) {
      case 'terrain_analysis':
        params.includeBuildings = /building/i.test(query);
        params.includeRoads = /road/i.test(query);
        params.includeWater = /water/i.test(query);
        break;
        
      case 'wind_rose_analysis':
        params.includeSeasonal = /seasonal/i.test(query);
        params.includeHourly = /hourly/i.test(query);
        break;
        
      case 'wake_analysis':
        params.includeOptimization = /optimization/i.test(query);
        break;
        
      case 'layout_optimization':
        params.optimizeForWake = /wake/i.test(query);
        params.optimizeForTerrain = /terrain/i.test(query);
        break;
    }
    
    return params;
  }

  /**
   * Validate that terrain analysis is not called for non-terrain queries
   */
  validateNonTerrainRouting(query: string): boolean {
    const result = this.classifyIntent(query);
    
    // Check if query contains non-terrain renewable keywords
    const nonTerrainKeywords = [
      'wind rose', 'wake effect', 'layout optimization', 
      'site suitability', 'turbine placement', 'wake analysis'
    ];
    
    const hasNonTerrainKeywords = nonTerrainKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    // If query has non-terrain keywords but was classified as terrain, it's a validation failure
    if (hasNonTerrainKeywords && result.intent === 'terrain_analysis') {
      console.warn('⚠️ Validation failed: Non-terrain query routed to terrain analysis', {
        query,
        classification: result.intent,
        confidence: result.confidence
      });
      return false;
    }
    
    return true;
  }
}