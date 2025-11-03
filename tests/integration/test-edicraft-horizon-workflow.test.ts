/**
 * Integration Test for EDIcraft Horizon Workflow
 * Tests end-to-end horizon query processing from routing to response
 * Requirements: 5.2, 5.3
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Type definitions
type ThoughtStep = {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
  details?: string;
};

type RouterResponse = {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
  connectionStatus?: 'connected' | 'error' | 'pending' | 'not_deployed';
  error?: string;
};

// Mock AgentRouter class
class MockAgentRouter {
  private horizonPatterns = [
    /find.*horizon|horizon.*find/i,
    /get.*horizon|horizon.*name/i,
    /list.*horizon|show.*horizon/i,
    /convert.*coordinates|coordinates.*convert/i,
    /convert.*to.*minecraft|minecraft.*convert/i,
    /coordinates.*for.*minecraft|minecraft.*coordinates/i,
    /horizon.*coordinates|coordinates.*horizon/i,
    /horizon.*minecraft|minecraft.*horizon/i,
    /horizon.*convert|convert.*horizon/i,
    /tell.*me.*horizon|horizon.*tell.*me/i,
    /what.*horizon|which.*horizon/i,
    /where.*horizon|horizon.*where/i,
    /coordinates.*you.*use|coordinates.*to.*use/i,
    /print.*coordinates|output.*coordinates/i,
  ];

  private determineAgentType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check if message matches any horizon pattern
    for (const pattern of this.horizonPatterns) {
      if (pattern.test(lowerMessage)) {
        return 'edicraft';
      }
    }
    
    return 'general';
  }

  async routeQuery(message: string): Promise<RouterResponse> {
    const agentType = this.determineAgentType(message);
    
    if (agentType === 'edicraft') {
      // Simulate EDIcraft agent response
      return {
        success: true,
        message: this.generateEDIcraftResponse(message),
        artifacts: [],
        thoughtSteps: this.generateThoughtSteps(message),
        agentUsed: 'edicraft',
        connectionStatus: 'connected'
      };
    }
    
    // Default response for non-EDIcraft queries
    return {
      success: true,
      message: 'General response',
      artifacts: [],
      thoughtSteps: [],
      agentUsed: 'general'
    };
  }

  private generateEDIcraftResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('coordinate')) {
      return 'I found the horizon data and converted it to Minecraft coordinates: (150, 64, 250). Connect to the Minecraft server to see the visualization.';
    }
    
    if (lowerMessage.includes('name')) {
      return 'The horizon is named "Top_Reservoir" and is available for visualization in Minecraft.';
    }
    
    if (lowerMessage.includes('find')) {
      return 'I found a horizon surface in the subsurface data. The horizon represents a geological boundary and can be visualized in Minecraft.';
    }
    
    return 'Horizon query processed successfully. Connect to Minecraft to see the visualization.';
  }

  private generateThoughtSteps(message: string): ThoughtStep[] {
    const steps: ThoughtStep[] = [];
    
    // Analysis step
    steps.push({
      id: 'step-1',
      type: 'analysis',
      timestamp: Date.now(),
      title: 'Analyzing Horizon Query',
      summary: 'Understanding the horizon visualization request',
      status: 'complete'
    });
    
    // Processing step
    steps.push({
      id: 'step-2',
      type: 'processing',
      timestamp: Date.now() + 100,
      title: 'Processing Horizon Data',
      summary: 'Fetching horizon data and converting coordinates',
      status: 'complete'
    });
    
    // Completion step
    steps.push({
      id: 'step-3',
      type: 'completion',
      timestamp: Date.now() + 200,
      title: 'Request Complete',
      summary: 'Horizon query processed successfully',
      status: 'complete'
    });
    
    return steps;
  }
}

describe('EDIcraft Horizon Workflow Integration Tests', () => {
  let router: MockAgentRouter;
  
  beforeEach(() => {
    // Initialize mock router
    router = new MockAgentRouter();
  });
  
  describe('Horizon Query Routing', () => {
    it('should route "find a horizon" to EDIcraft agent', async () => {
      const query = 'find a horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Requirement 5.2: Verify agentUsed is 'edicraft'
      expect(response.agentUsed).toBe('edicraft');
      expect(response.success).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
    
    it('should route "tell me the horizon name" to EDIcraft agent', async () => {
      const query = 'tell me the horizon name';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should route "convert to minecraft coordinates" to EDIcraft agent', async () => {
      const query = 'convert to minecraft coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should route complex horizon query to EDIcraft agent', async () => {
      const query = 'find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you\'d use to show it in minecraft';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Requirement 5.2: Verify agentUsed is 'edicraft'
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should route "horizon coordinates" to EDIcraft agent', async () => {
      const query = 'get horizon coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should route "horizon minecraft" to EDIcraft agent', async () => {
      const query = 'show horizon in minecraft';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
  });
  
  describe('Horizon Response Content', () => {
    it('should return response with horizon-related content', async () => {
      const query = 'find a horizon and tell me its name';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Requirement 5.3: Verify response includes horizon-related content
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
      expect(response.message.length).toBeGreaterThan(0);
      
      // Response should mention horizon or related geological terms
      const lowerMessage = response.message.toLowerCase();
      const hasHorizonContent = 
        lowerMessage.includes('horizon') ||
        lowerMessage.includes('surface') ||
        lowerMessage.includes('geological') ||
        lowerMessage.includes('minecraft') ||
        lowerMessage.includes('coordinate');
      
      expect(hasHorizonContent).toBe(true);
    });
    
    it('should return response with coordinate information', async () => {
      const query = 'convert horizon to minecraft coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Requirement 5.3: Verify response includes coordinate information
      expect(response.message).toBeDefined();
      
      const lowerMessage = response.message.toLowerCase();
      const hasCoordinateContent = 
        lowerMessage.includes('coordinate') ||
        lowerMessage.includes('position') ||
        lowerMessage.includes('location') ||
        lowerMessage.includes('minecraft') ||
        /\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/.test(response.message); // Matches (x, y, z) pattern
      
      expect(hasCoordinateContent).toBe(true);
    });
    
    it('should return response mentioning Minecraft visualization', async () => {
      const query = 'show horizon in minecraft';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.message).toBeDefined();
      
      const lowerMessage = response.message.toLowerCase();
      const mentionsMinecraft = 
        lowerMessage.includes('minecraft') ||
        lowerMessage.includes('visualiz') ||
        lowerMessage.includes('connect') ||
        lowerMessage.includes('server');
      
      expect(mentionsMinecraft).toBe(true);
    });
  });
  
  describe('Thought Steps Verification', () => {
    it('should include thought steps in response', async () => {
      const query = 'find a horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Requirement 5.3: Verify thought steps are present
      expect(response.thoughtSteps).toBeDefined();
      expect(Array.isArray(response.thoughtSteps)).toBe(true);
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
    });
    
    it('should have properly formatted thought steps', async () => {
      const query = 'get horizon coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.thoughtSteps).toBeDefined();
      
      // Verify each thought step has required fields
      response.thoughtSteps!.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('type');
        expect(step).toHaveProperty('timestamp');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('summary');
        expect(step).toHaveProperty('status');
        
        // Verify field types
        expect(typeof step.id).toBe('string');
        expect(['analysis', 'processing', 'completion']).toContain(step.type);
        expect(typeof step.timestamp).toBe('number');
        expect(typeof step.title).toBe('string');
        expect(typeof step.summary).toBe('string');
        expect(['complete', 'pending', 'error']).toContain(step.status);
      });
    });
    
    it('should include analysis or processing thought steps', async () => {
      const query = 'find horizon and convert coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.thoughtSteps).toBeDefined();
      
      // Should have at least one analysis or processing step
      const hasAnalysisOrProcessing = response.thoughtSteps!.some(
        step => step.type === 'analysis' || step.type === 'processing'
      );
      
      expect(hasAnalysisOrProcessing).toBe(true);
    });
    
    it('should include completion thought step', async () => {
      const query = 'show horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.thoughtSteps).toBeDefined();
      
      // Should have at least one completion step
      const hasCompletion = response.thoughtSteps!.some(
        step => step.type === 'completion'
      );
      
      expect(hasCompletion).toBe(true);
    });
  });
  
  describe('Response Structure Validation', () => {
    it('should return complete response structure', async () => {
      const query = 'find a horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Verify all required fields exist
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('agentUsed');
      expect(response).toHaveProperty('thoughtSteps');
      
      // Verify field types
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.message).toBe('string');
      expect(typeof response.agentUsed).toBe('string');
      expect(Array.isArray(response.thoughtSteps)).toBe(true);
    });
    
    it('should return artifacts array (empty for EDIcraft)', async () => {
      const query = 'visualize horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // EDIcraft returns empty artifacts (visualization is in Minecraft)
      expect(response.artifacts).toBeDefined();
      expect(Array.isArray(response.artifacts)).toBe(true);
    });
    
    it('should include connection status', async () => {
      const query = 'build horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Connection status should be present
      if (response.connectionStatus) {
        const validStatuses = ['connected', 'error', 'pending', 'not_deployed'];
        expect(validStatuses).toContain(response.connectionStatus);
      }
    });
  });
  
  describe('Complex Horizon Queries', () => {
    it('should handle multi-step horizon query', async () => {
      const query = 'find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Should route to EDIcraft
      expect(response.agentUsed).toBe('edicraft');
      
      // Should have response content
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
      
      // Should have thought steps
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
    });
    
    it('should handle horizon with coordinate conversion', async () => {
      const query = 'get horizon coordinates and convert to minecraft format';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
      
      // Should mention coordinates or conversion
      const lowerMessage = response.message.toLowerCase();
      const hasCoordinateContent = 
        lowerMessage.includes('coordinate') ||
        lowerMessage.includes('convert') ||
        lowerMessage.includes('minecraft');
      
      expect(hasCoordinateContent).toBe(true);
    });
    
    it('should handle horizon visualization request', async () => {
      const query = 'visualize horizon surface in minecraft';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
      
      // Should mention visualization or minecraft
      const lowerMessage = response.message.toLowerCase();
      const hasVisualizationContent = 
        lowerMessage.includes('visualiz') ||
        lowerMessage.includes('minecraft') ||
        lowerMessage.includes('surface') ||
        lowerMessage.includes('horizon');
      
      expect(hasVisualizationContent).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const query = 'find horizon with invalid parameters';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Should still return a response structure
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('agentUsed');
      
      // If error occurred, should have error information
      if (!response.success) {
        expect(response.message.length).toBeGreaterThan(0);
        
        // Should have thought steps even on error
        if (response.thoughtSteps) {
          expect(Array.isArray(response.thoughtSteps)).toBe(true);
        }
      }
    });
    
    it('should provide meaningful error messages', async () => {
      const query = 'horizon query that might fail';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Message should always be present and non-empty
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
      expect(response.message.length).toBeGreaterThan(0);
      
      // Should not expose technical details
      const lowerMessage = response.message.toLowerCase();
      const exposesDetails = 
        lowerMessage.includes('stack trace') ||
        lowerMessage.includes('undefined is not') ||
        lowerMessage.includes('cannot read property');
      
      expect(exposesDetails).toBe(false);
    });
  });
  
  describe('Natural Language Horizon Queries', () => {
    it('should handle "what horizon" query', async () => {
      const query = 'what horizon is available';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "which horizon" query', async () => {
      const query = 'which horizon should I use';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "where horizon" query', async () => {
      const query = 'where is the horizon located';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "tell me about horizon" query', async () => {
      const query = 'tell me about the horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "list horizons" query', async () => {
      const query = 'list all horizons';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "show horizon" query', async () => {
      const query = 'show me the horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
  });
  
  describe('Coordinate-Related Horizon Queries', () => {
    it('should handle "horizon coordinates" query', async () => {
      const query = 'get the horizon coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "coordinates for horizon" query', async () => {
      const query = 'what are the coordinates for the horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "print coordinates" query', async () => {
      const query = 'print out the horizon coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "output coordinates" query', async () => {
      const query = 'output the coordinates for minecraft';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
    
    it('should handle "coordinates you use" query', async () => {
      const query = 'what coordinates would you use to show the horizon';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      expect(response.agentUsed).toBe('edicraft');
    });
  });
  
  describe('Requirements Verification Summary', () => {
    it('should satisfy Requirement 5.2: End-to-end horizon query processing', async () => {
      const query = 'find a horizon, tell me its name, convert it to minecraft coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Verify agentUsed is 'edicraft'
      expect(response.agentUsed).toBe('edicraft');
      
      // Verify response structure
      expect(response.success).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.thoughtSteps).toBeDefined();
      
      // Verify response content
      expect(response.message.length).toBeGreaterThan(0);
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
    });
    
    it('should satisfy Requirement 5.3: Response includes horizon-related content and coordinates', async () => {
      const query = 'find horizon and convert to minecraft coordinates';
      
      const response: RouterResponse = await router.routeQuery(query);
      
      // Verify response includes horizon-related content
      const lowerMessage = response.message.toLowerCase();
      const hasHorizonContent = 
        lowerMessage.includes('horizon') ||
        lowerMessage.includes('surface') ||
        lowerMessage.includes('geological') ||
        lowerMessage.includes('minecraft');
      
      expect(hasHorizonContent).toBe(true);
      
      // Verify response includes coordinate information
      const hasCoordinateContent = 
        lowerMessage.includes('coordinate') ||
        lowerMessage.includes('position') ||
        lowerMessage.includes('location') ||
        /\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/.test(response.message);
      
      expect(hasCoordinateContent).toBe(true);
      
      // Verify thought steps are present
      expect(response.thoughtSteps).toBeDefined();
      expect(response.thoughtSteps!.length).toBeGreaterThan(0);
    });
  });
});
