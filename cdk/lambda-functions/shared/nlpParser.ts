/**
 * Shared NLP Parser for Universal Conversational Filtering
 * 
 * Provides consistent natural language parsing across OSDU and Catalog Lambdas.
 * Supports location, operator, well name prefix, and depth filtering.
 */

export interface ParsedQuery {
  locations: string[];
  operators: string[];
  wellPrefixes: string[];
  minDepth?: number;
  depthUnit?: 'm' | 'ft';
  confidence: number;
  hasFilters: boolean;
}

/**
 * Parse natural language query for filtering criteria
 * @param query - User's natural language query
 * @returns ParsedQuery object with extracted filter criteria
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowerQuery = query.toLowerCase();
  
  const result: ParsedQuery = {
    locations: [],
    operators: [],
    wellPrefixes: [],
    confidence: 0,
    hasFilters: false
  };

  // Location keywords - expanded for Brunei/Malaysia support
  const locationKeywords = {
    'north sea': 'North Sea',
    'gulf of mexico': 'Gulf of Mexico',
    'brunei': 'Brunei',
    'malaysia': 'Malaysia',
    'offshore': 'Offshore',
    'offshore brunei': 'Offshore Brunei',
    'offshore malaysia': 'Offshore Malaysia'
  };

  // Operator keywords
  const operatorKeywords = {
    'bp': 'BP',
    'shell': 'Shell',
    'my company': 'My Company',
    'chevron': 'Chevron',
    'exxonmobil': 'ExxonMobil',
    'exxon mobil': 'ExxonMobil'
  };

  // Well name prefixes - only match when used as actual prefixes, not generic "wells"
  const wellPrefixKeywords = {
    'usa-': 'USA',
    'nor-': 'NOR', 
    'well-': 'WELL',  // Only match "well-" not just "well" or "wells"
    'vie-': 'VIE',
    'uae-': 'UAE',
    'kaz-': 'KAZ'
  };

  let matchCount = 0;

  // Parse locations
  for (const [keyword, location] of Object.entries(locationKeywords)) {
    if (lowerQuery.includes(keyword)) {
      result.locations.push(location);
      matchCount++;
    }
  }

  // Parse operators
  for (const [keyword, operator] of Object.entries(operatorKeywords)) {
    if (lowerQuery.includes(keyword)) {
      result.operators.push(operator);
      matchCount++;
    }
  }

  // Parse well prefixes - only match explicit prefix patterns
  for (const [keyword, prefix] of Object.entries(wellPrefixKeywords)) {
    if (lowerQuery.includes(keyword)) {
      result.wellPrefixes.push(prefix);
      matchCount++;
    }
  }

  // Parse depth criteria - merged from catalog handler
  const depthResult = parseDepthCriteria(lowerQuery);
  if (depthResult.minDepth !== undefined) {
    result.minDepth = depthResult.minDepth;
    result.depthUnit = depthResult.unit;
    matchCount++;
  }

  // Calculate confidence and set hasFilters
  result.hasFilters = matchCount > 0;
  result.confidence = matchCount > 0 ? Math.min(matchCount * 0.3, 1.0) : 0;

  return result;
}

/**
 * Parse depth criteria from natural language query
 * Supports various phrasings: "deeper than 3000m", "depth > 5000 feet", etc.
 */
function parseDepthCriteria(query: string): { minDepth?: number; unit?: 'm' | 'ft' } {
  // Patterns for depth parsing
  const depthPatterns = [
    // "deeper than 3000m", "deeper than 3000 meters"
    /deeper\s+than\s+(\d+)\s*(m|meters?|ft|feet?)?/i,
    // "depth > 5000", "depth greater than 5000"
    /depth\s*[>]\s*(\d+)\s*(m|meters?|ft|feet?)?/i,
    /depth\s+greater\s+than\s+(\d+)\s*(m|meters?|ft|feet?)?/i,
    // "wells with depth > 2500", "wells with depth greater than 2500"
    /wells?\s+with\s+depth\s*[>]\s*(\d+)\s*(m|meters?|ft|feet?)?/i,
    /wells?\s+with\s+depth\s+greater\s+than\s+(\d+)\s*(m|meters?|ft|feet?)?/i,
    // "above 4000m", "over 3000 feet"
    /(?:above|over)\s+(\d+)\s*(m|meters?|ft|feet?)?/i
  ];

  for (const pattern of depthPatterns) {
    const match = query.match(pattern);
    if (match) {
      const depth = parseInt(match[1]);
      const unitStr = match[2]?.toLowerCase() || 'm';
      
      // Determine unit
      let unit: 'm' | 'ft' = 'm';
      if (unitStr.startsWith('ft') || unitStr.startsWith('feet')) {
        unit = 'ft';
      }

      return { minDepth: depth, unit };
    }
  }

  return {};
}

/**
 * Check if query contains filter intent keywords
 * Used by frontend to detect when to apply context filtering
 */
export function hasFilterIntent(query: string): boolean {
  const filterKeywords = [
    'just', 'only', 'near', 'deeper', 'filter', 'show me', 
    'greater than', 'above', 'over', 'with depth'
  ];
  
  const lowerQuery = query.toLowerCase();
  return filterKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Apply parsed filters to a dataset
 * Generic function that works with any data structure
 */
export function applyFilters<T>(
  data: T[], 
  filters: ParsedQuery,
  extractors: {
    location?: (item: T) => string;
    operator?: (item: T) => string;
    wellName?: (item: T) => string;
    depth?: (item: T) => number;
  }
): T[] {
  if (!filters.hasFilters) {
    return data;
  }

  return data.filter(item => {
    // Location filter
    if (filters.locations.length > 0 && extractors.location) {
      const itemLocation = extractors.location(item);
      const locationMatch = filters.locations.some(loc => 
        itemLocation.toLowerCase().includes(loc.toLowerCase())
      );
      if (!locationMatch) return false;
    }

    // Operator filter
    if (filters.operators.length > 0 && extractors.operator) {
      const itemOperator = extractors.operator(item);
      const operatorMatch = filters.operators.some(op => 
        itemOperator.toLowerCase().includes(op.toLowerCase())
      );
      if (!operatorMatch) return false;
    }

    // Well name prefix filter
    if (filters.wellPrefixes.length > 0 && extractors.wellName) {
      const itemWellName = extractors.wellName(item);
      const prefixMatch = filters.wellPrefixes.some(prefix => 
        itemWellName.toUpperCase().startsWith(prefix.toUpperCase())
      );
      if (!prefixMatch) return false;
    }

    // Depth filter
    if (filters.minDepth !== undefined && extractors.depth) {
      const itemDepth = extractors.depth(item);
      if (itemDepth < filters.minDepth) return false;
    }

    return true;
  });
}
