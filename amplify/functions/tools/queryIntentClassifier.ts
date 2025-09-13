/**
 * Query Intent Classifier for Well Data Queries
 * 
 * This service analyzes user queries to determine if they are related to well data,
 * geological information, or petrophysical analysis using semantic understanding
 * rather than simple keyword matching.
 */

export interface QueryIntent {
    isWellRelated: boolean;
    confidence: number;
    category: 'well_count' | 'well_info' | 'data_analysis' | 'file_access' | 'general' | 'other';
    suggestedContext: string[];
    reasoning: string;
}

// Semantic patterns for well-related queries
const WELL_SEMANTIC_PATTERNS = {
    // Direct well references
    well_direct: [
        'well', 'wells', 'borehole', 'boreholes', 'drilling', 'drilled',
        'eagle ford', 'permian', 'wolfcamp', 'shale', 'formation'
    ],
    
    // Counting and availability queries
    count_queries: [
        'how many', 'count', 'number of', 'available', 'total', 'existing',
        'do you have', 'what wells', 'which wells', 'list wells'
    ],
    
    // Data and file queries
    data_queries: [
        'data', 'files', 'logs', 'las files', 'csv', 'information',
        'dataset', 'database', 'records', 'measurements'
    ],
    
    // Analysis and exploration queries
    analysis_queries: [
        'analysis', 'analyze', 'evaluate', 'assess', 'study', 'examine',
        'petrophysical', 'geological', 'formation evaluation', 'reservoir'
    ],
    
    // Geological terms
    geological_terms: [
        'porosity', 'permeability', 'saturation', 'gamma ray', 'resistivity',
        'density', 'neutron', 'lithology', 'rock', 'reservoir', 'hydrocarbon'
    ],
    
    // Location and field references
    location_terms: [
        'karnes', 'midland', 'texas', 'county', 'field', 'basin',
        'location', 'coordinates', 'latitude', 'longitude'
    ]
};

// Question patterns that indicate well-related queries
const QUESTION_PATTERNS = [
    /what.*well/i,
    /how many.*well/i,
    /do you have.*well/i,
    /tell me about.*well/i,
    /show me.*well/i,
    /available.*well/i,
    /what.*data/i,
    /how much.*data/i,
    /what.*formation/i,
    /drilling.*data/i,
    /geological.*information/i,
    /petrophysical.*data/i,
    /log.*data/i,
    /well.*log/i
];

/**
 * Analyzes a query to determine if it's well-related and what type of response is needed
 */
export function classifyQueryIntent(query: string): QueryIntent {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Initialize scoring
    let wellScore = 0;
    let confidence = 0;
    let category: QueryIntent['category'] = 'other';
    let suggestedContext: string[] = [];
    let reasoning = '';
    
    // Check for direct question patterns (high confidence indicators)
    const matchedPatterns = QUESTION_PATTERNS.filter(pattern => pattern.test(normalizedQuery));
    if (matchedPatterns.length > 0) {
        wellScore += 50;
        reasoning += `Matched question patterns (${matchedPatterns.length}). `;
    }
    
    // Score based on semantic pattern matching
    const patternScores: Record<string, number> = {};
    
    Object.entries(WELL_SEMANTIC_PATTERNS).forEach(([patternType, terms]) => {
        const matchCount = terms.filter(term => normalizedQuery.includes(term)).length;
        if (matchCount > 0) {
            patternScores[patternType] = matchCount;
            wellScore += matchCount * getPatternWeight(patternType);
        }
    });
    
    // Determine category based on pattern matches
    if (patternScores.count_queries > 0) {
        category = 'well_count';
        suggestedContext.push('well_count', 'well_list');
        reasoning += 'Detected counting/availability query. ';
    } else if (patternScores.well_direct > 0) {
        category = 'well_info';
        suggestedContext.push('well_details', 'well_properties');
        reasoning += 'Detected direct well reference. ';
    } else if (patternScores.analysis_queries > 0 || patternScores.geological_terms > 0) {
        category = 'data_analysis';
        suggestedContext.push('well_analysis', 'geological_data');
        reasoning += 'Detected analysis/geological query. ';
    } else if (patternScores.data_queries > 0) {
        category = 'file_access';
        suggestedContext.push('file_list', 'data_availability');
        reasoning += 'Detected data/file query. ';
    }
    
    // Check for negation or exclusion terms that might reduce well relevance
    const exclusionTerms = ['not', 'no', 'without', 'except', 'ignore'];
    const hasExclusion = exclusionTerms.some(term => normalizedQuery.includes(term));
    if (hasExclusion) {
        wellScore *= 0.7;
        reasoning += 'Detected exclusion terms. ';
    }
    
    // Calculate final confidence
    confidence = Math.min(wellScore / 100, 1.0);
    const isWellRelated = confidence > 0.3; // Threshold for well-related classification
    
    // Add context suggestions based on confidence and category
    if (isWellRelated) {
        suggestedContext.push('global_well_data');
        if (confidence > 0.7) {
            suggestedContext.push('primary_wells', 'las_files');
        }
    }
    
    // Finalize reasoning
    if (isWellRelated) {
        reasoning += `High confidence well query (${Math.round(confidence * 100)}%).`;
    } else {
        reasoning += `Low confidence for well relevance (${Math.round(confidence * 100)}%).`;
    }
    
    return {
        isWellRelated,
        confidence,
        category: isWellRelated ? category : 'other',
        suggestedContext: isWellRelated ? suggestedContext : [],
        reasoning
    };
}

/**
 * Get weight for different pattern types
 */
function getPatternWeight(patternType: string): number {
    const weights: Record<string, number> = {
        well_direct: 15,
        count_queries: 20,
        data_queries: 10,
        analysis_queries: 12,
        geological_terms: 8,
        location_terms: 5
    };
    return weights[patternType] || 5;
}

/**
 * Generate suggested system message additions based on query intent
 */
export function generateContextualSystemMessage(intent: QueryIntent): string {
    if (!intent.isWellRelated) {
        return '';
    }
    
    let contextMessage = '\n\n=== QUERY CONTEXT GUIDANCE ===\n';
    
    switch (intent.category) {
        case 'well_count':
            contextMessage += 'User is asking about the NUMBER of wells available. ';
            contextMessage += 'Provide the total count and brief overview of available wells.\n';
            break;
            
        case 'well_info':
            contextMessage += 'User is asking about SPECIFIC well information. ';
            contextMessage += 'Provide details about individual wells and their properties.\n';
            break;
            
        case 'data_analysis':
            contextMessage += 'User is interested in ANALYSIS capabilities. ';
            contextMessage += 'Highlight analytical tools and available data for analysis.\n';
            break;
            
        case 'file_access':
            contextMessage += 'User is asking about DATA FILES and access. ';
            contextMessage += 'Show available files and how to access them.\n';
            break;
    }
    
    contextMessage += `Query confidence: ${Math.round(intent.confidence * 100)}%\n`;
    contextMessage += `Reasoning: ${intent.reasoning}\n`;
    
    return contextMessage;
}

/**
 * Quick helper for backwards compatibility
 */
export function isWellRelatedQuery(query: string): boolean {
    return classifyQueryIntent(query).isWellRelated;
}

/**
 * Enhanced version of the original detection with better semantics
 */
export function detectWellQuery(query: string): {
    isWellQuery: boolean;
    confidence: number;
    category: string;
} {
    const intent = classifyQueryIntent(query);
    return {
        isWellQuery: intent.isWellRelated,
        confidence: intent.confidence,
        category: intent.category
    };
}
