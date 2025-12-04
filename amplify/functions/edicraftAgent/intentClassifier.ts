/**
 * Intent Classifier for EDIcraft Agent
 * Implements hybrid approach: deterministic pattern matching for common queries,
 * LLM routing for ambiguous cases
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */

export interface Intent {
  type: 'wellbore_trajectory' | 'horizon_surface' | 'list_players' | 'player_positions' | 'system_status' | 'unknown';
  confidence: number; // 0.0 to 1.0
  parameters: {
    wellId?: string;
    horizonName?: string;
  };
}

/**
 * Classify user intent using deterministic pattern matching
 * 
 * This function analyzes the user query and determines the most likely intent
 * with high confidence for common patterns. Queries that don't match known
 * patterns return 'unknown' with low confidence, triggering LLM routing.
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */
export function classifyIntent(query: string): Intent {
  const normalizedQuery = query.toLowerCase().trim();
  
  console.log('[INTENT CLASSIFIER] Analyzing query:', query);
  
  // Pattern 1: Wellbore trajectory with well ID extraction
  // Matches: "Build wellbore trajectory for WELL-011", "Visualize wellbore WELL-005", etc.
  const wellborePatterns = [
    /build.*wellbore.*trajectory.*for\s+(well-\d+)/i,
    /visualize.*wellbore\s+(well-\d+)/i,
    /show.*me.*wellbore\s+(well-\d+)/i,
    /create.*wellbore.*path.*for\s+(well-\d+)/i,
    /wellbore.*trajectory.*for\s+(well-\d+)/i,
    /trajectory.*for\s+(well-\d+)/i,
    /(well-\d+).*trajectory/i,
    /(well-\d+).*wellbore/i,
    /build.*(well-\d+)/i,
    /visualize.*(well-\d+)/i
  ];
  
  for (const pattern of wellborePatterns) {
    const match = query.match(pattern);
    if (match) {
      const wellId = match[1].toUpperCase(); // Extract and normalize well ID
      console.log('[INTENT CLASSIFIER] Matched wellbore_trajectory pattern:', pattern.source);
      console.log('[INTENT CLASSIFIER] Extracted well ID:', wellId);
      return {
        type: 'wellbore_trajectory',
        confidence: 0.95,
        parameters: { wellId }
      };
    }
  }
  
  // Pattern 2: Horizon surface with optional horizon name extraction
  // Matches: "Build horizon surface", "Visualize horizon", "Show me horizon Top_Reservoir", etc.
  const horizonPatterns = [
    /build.*horizon.*surface/i,
    /visualize.*horizon/i,
    /show.*me.*horizon/i,
    /create.*horizon/i,
    /render.*horizon/i,
    /horizon.*surface/i,
    /build.*horizon/i,
    /find.*horizon/i,
    /horizon.*name/i,
    /horizon.*coordinates/i,
    /convert.*horizon/i,
    /horizon.*minecraft/i
  ];
  
  for (const pattern of horizonPatterns) {
    if (pattern.test(query)) {
      console.log('[INTENT CLASSIFIER] Matched horizon_surface pattern:', pattern.source);
      
      // Try to extract horizon name if specified
      // Look for patterns like "horizon Top_Reservoir" or "horizon named XYZ"
      const horizonNameMatch = query.match(/horizon\s+(?:named\s+)?([A-Z][A-Za-z0-9_]+)/);
      const horizonName = horizonNameMatch ? horizonNameMatch[1] : undefined;
      
      if (horizonName) {
        console.log('[INTENT CLASSIFIER] Extracted horizon name:', horizonName);
      }
      
      return {
        type: 'horizon_surface',
        confidence: 0.90,
        parameters: { horizonName }
      };
    }
  }
  
  // Pattern 3: List players
  // Matches: "List players", "Who is online?", "Show me players", etc.
  const listPlayersPatterns = [
    /list.*players?/i,
    /who.*(?:is|are).*online/i,
    /show.*me.*players?/i,
    /how.*many.*players?/i,
    /players?.*online/i,
    /online.*players?/i
  ];
  
  for (const pattern of listPlayersPatterns) {
    if (pattern.test(query)) {
      console.log('[INTENT CLASSIFIER] Matched list_players pattern:', pattern.source);
      return {
        type: 'list_players',
        confidence: 0.95,
        parameters: {}
      };
    }
  }
  
  // Pattern 4: Player positions
  // Matches: "Where are the players?", "Player positions", "Show player coordinates", etc.
  const playerPositionsPatterns = [
    /where.*(?:are|is).*(?:the\s+)?players?/i,
    /players?.*positions?/i,
    /show.*players?.*coordinates?/i,
    /players?.*coordinates?/i,
    /get.*players?.*positions?/i,
    /positions?.*of.*players?/i
  ];
  
  for (const pattern of playerPositionsPatterns) {
    if (pattern.test(query)) {
      console.log('[INTENT CLASSIFIER] Matched player_positions pattern:', pattern.source);
      return {
        type: 'player_positions',
        confidence: 0.95,
        parameters: {}
      };
    }
  }
  
  // Pattern 5: System status (greetings and status checks)
  // Matches: "Hello", "What's the status?", "Are you ready?", etc.
  // IMPORTANT: Only match if NO action words are present
  const hasActionWords = /build|visualize|create|show|render|find|list|get|where/i.test(query);
  
  if (!hasActionWords) {
    const systemStatusPatterns = [
      /^hello$/i,
      /^hi$/i,
      /^hey$/i,
      /^status$/i,
      /what.*status/i,
      /are.*you.*ready/i,
      /system.*status/i,
      /^help$/i,
      /^$/  // Empty query
    ];
    
    for (const pattern of systemStatusPatterns) {
      if (pattern.test(normalizedQuery)) {
        console.log('[INTENT CLASSIFIER] Matched system_status pattern:', pattern.source);
        return {
          type: 'system_status',
          confidence: 0.90,
          parameters: {}
        };
      }
    }
  }
  
  // No pattern matched - return unknown with low confidence
  // This will trigger LLM routing in the handler
  console.log('[INTENT CLASSIFIER] No pattern matched, returning unknown intent');
  return {
    type: 'unknown',
    confidence: 0.0,
    parameters: {}
  };
}

/**
 * Generate a direct tool call message for the Python agent
 * 
 * This function creates a formatted message that the Python agent can parse
 * to directly invoke the appropriate tool without LLM inference.
 * 
 * Format: "DIRECT_TOOL_CALL: function_name(parameters)"
 * 
 * Requirements: 2.2, 2.3
 */
export function generateToolCallMessage(intent: Intent): string {
  console.log('[TOOL CALL GENERATOR] Generating tool call for intent:', intent.type);
  
  switch (intent.type) {
    case 'wellbore_trajectory':
      if (!intent.parameters.wellId) {
        throw new Error('Well ID is required for wellbore_trajectory intent');
      }
      const toolCall = `DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("${intent.parameters.wellId}")`;
      console.log('[TOOL CALL GENERATOR] Generated:', toolCall);
      return toolCall;
    
    case 'horizon_surface':
      const horizonParam = intent.parameters.horizonName 
        ? `"${intent.parameters.horizonName}"` 
        : 'None';
      const horizonCall = `DIRECT_TOOL_CALL: build_horizon_surface_complete(${horizonParam})`;
      console.log('[TOOL CALL GENERATOR] Generated:', horizonCall);
      return horizonCall;
    
    case 'list_players':
      const listCall = 'DIRECT_TOOL_CALL: list_players()';
      console.log('[TOOL CALL GENERATOR] Generated:', listCall);
      return listCall;
    
    case 'player_positions':
      const posCall = 'DIRECT_TOOL_CALL: get_player_positions()';
      console.log('[TOOL CALL GENERATOR] Generated:', posCall);
      return posCall;
    
    case 'system_status':
      const statusCall = 'DIRECT_TOOL_CALL: get_system_status()';
      console.log('[TOOL CALL GENERATOR] Generated:', statusCall);
      return statusCall;
    
    case 'unknown':
      throw new Error('Cannot generate tool call for unknown intent');
    
    default:
      throw new Error(`Unknown intent type: ${intent.type}`);
  }
}
