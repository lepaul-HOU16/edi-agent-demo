/**
 * Intent Router
 * 
 * Creates routing mechanism that directs queries to appropriate analysis services.
 * Includes fallback handling for low-confidence or ambiguous intent detection
 * and user confirmation for uncertain intent classifications.
 * 
 * Requirements: 13.6, 13.7
 */

import { RenewableIntentClassifier, IntentClassificationResult } from './RenewableIntentClassifier';
import { RenewableIntent } from './types';

export interface RoutingResult {
  intent: RenewableIntent;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  fallbackOptions?: Array<{
    intent: string;
    description: string;
    confidence: number;
  }>;
}

export interface AnalysisService {
  type: string;
  functionName: string;
  description: string;
  capabilities: string[];
}

export class IntentRouter {
  private classifier: RenewableIntentClassifier;
  private services: Record<string, AnalysisService>;

  constructor() {
    this.classifier = new RenewableIntentClassifier();
    this.services = this.initializeServices();
  }

  /**
   * Route query to appropriate analysis service
   */
  async routeQuery(query: string, context?: any): Promise<RoutingResult> {
    console.log('🚦 IntentRouter: Routing query:', query);
    
    // Step 1: Classify intent
    const classification = this.classifier.classifyIntent(query);
    
    // Step 2: Validate service availability
    const serviceAvailable = this.validateServiceAvailability(classification.intent);
    if (!serviceAvailable) {
      return this.handleServiceUnavailable(classification, query);
    }
    
    // Step 3: Handle low confidence or ambiguous queries
    if (classification.requiresConfirmation) {
      return this.handleAmbiguousIntent(classification, query);
    }
    
    // Step 4: Create routing result
    const intent = this.createRenewableIntent(classification, query);
    
    console.log('✅ IntentRouter: Successfully routed to', intent.type);
    return {
      intent,
      requiresConfirmation: false
    };
  }

  /**
   * Handle fallback for low-confidence intent detection
   */
  handleLowConfidenceIntent(classification: IntentClassificationResult, query: string): RoutingResult {
    console.log('⚠️ IntentRouter: Low confidence detection, providing fallback options');
    
    const fallbackOptions = classification.alternatives.map(alt => ({
      intent: alt.intent,
      description: this.getIntentDescription(alt.intent),
      confidence: alt.confidence
    }));
    
    // Default to most likely intent but require confirmation
    const intent = this.createRenewableIntent(classification, query);
    
    return {
      intent,
      requiresConfirmation: true,
      confirmationMessage: this.generateConfirmationMessage(classification, query),
      fallbackOptions
    };
  }

  /**
   * Handle ambiguous intent detection
   */
  private handleAmbiguousIntent(classification: IntentClassificationResult, query: string): RoutingResult {
    console.log('🤔 IntentRouter: Ambiguous intent detected, requiring user confirmation');
    
    const fallbackOptions = classification.alternatives
      .filter(alt => alt.confidence > 30) // Only show reasonable alternatives
      .map(alt => ({
        intent: alt.intent,
        description: this.getIntentDescription(alt.intent),
        confidence: alt.confidence
      }));
    
    const intent = this.createRenewableIntent(classification, query);
    
    return {
      intent,
      requiresConfirmation: true,
      confirmationMessage: this.generateConfirmationMessage(classification, query),
      fallbackOptions
    };
  }

  /**
   * Handle service unavailable scenario
   */
  private handleServiceUnavailable(classification: IntentClassificationResult, query: string): RoutingResult {
    console.log('❌ IntentRouter: Service unavailable for', classification.intent);
    
    // Find available alternative services
    const availableAlternatives = classification.alternatives
      .filter(alt => this.validateServiceAvailability(alt.intent))
      .map(alt => ({
        intent: alt.intent,
        description: this.getIntentDescription(alt.intent),
        confidence: alt.confidence
      }));
    
    if (availableAlternatives.length > 0) {
      // Route to best available alternative
      const bestAlternative = availableAlternatives[0];
      const intent: RenewableIntent = {
        type: bestAlternative.intent as any,
        params: classification.params,
        confidence: bestAlternative.confidence
      };
      
      return {
        intent: {
          ...intent,
          params: {
            ...intent.params,
            originalIntent: classification.intent // Preserve original intent
          }
        },
        requiresConfirmation: true,
        confirmationMessage: `The requested ${this.getIntentDescription(classification.intent)} service is not available. Would you like to use ${bestAlternative.description} instead?`,
        fallbackOptions: availableAlternatives
      };
    }
    
    // No alternatives available - fallback to terrain analysis
    const fallbackIntent: RenewableIntent = {
      type: 'terrain_analysis',
      params: {
        ...classification.params,
        originalIntent: classification.intent, // Preserve original intent
        query: classification.params.query || ''
      },
      confidence: 50
    };
    
    return {
      intent: fallbackIntent,
      requiresConfirmation: true,
      confirmationMessage: `The requested service is not available. Would you like to perform terrain analysis instead?`,
      fallbackOptions: []
    };
  }

  /**
   * Validate that the required service is available
   */
  private validateServiceAvailability(intent: string): boolean {
    const service = this.services[intent];
    if (!service) return false;
    
    // Check if environment variable is set for the service
    const envVarName = this.getEnvironmentVariableName(intent);
    const functionName = process.env[envVarName];
    
    if (!functionName) {
      console.warn(`⚠️ Service ${intent} not configured: ${envVarName} not set`);
      return false;
    }
    
    return true;
  }

  /**
   * Create RenewableIntent from classification result
   */
  private createRenewableIntent(classification: IntentClassificationResult, query: string): RenewableIntent {
    // Map new intent types to existing types for backward compatibility
    const intentTypeMapping: Record<string, string> = {
      'terrain_analysis': 'terrain_analysis',
      'wind_rose_analysis': 'wind_rose', // Maps to simulation tool which handles wind rose
      'wake_analysis': 'wake_simulation',
      'layout_optimization': 'layout_optimization',
      'site_suitability': 'report_generation', // Maps to report tool for comprehensive assessment
      'comprehensive_assessment': 'report_generation', // Maps to report tool
      'report_generation': 'report_generation', // Direct mapping
      // Project lifecycle management intents - keep original names
      'delete_project': 'delete_project',
      'rename_project': 'rename_project',
      'merge_projects': 'merge_projects',
      'archive_project': 'archive_project',
      'export_project': 'export_project',
      'search_projects': 'search_projects'
    };
    
    const mappedType = intentTypeMapping[classification.intent] || 'terrain_analysis';
    
    return {
      type: mappedType as any,
      params: {
        ...classification.params,
        originalIntent: classification.intent, // Preserve original intent for future use
        query: query
      },
      confidence: classification.confidence
    };
  }

  /**
   * Generate confirmation message for ambiguous intents
   */
  private generateConfirmationMessage(classification: IntentClassificationResult, query: string): string {
    const intentDescription = this.getIntentDescription(classification.intent);
    const confidence = classification.confidence;
    
    if (confidence < 50) {
      return `I'm not sure what type of renewable energy analysis you're looking for. Did you mean ${intentDescription}?`;
    } else if (confidence < 70) {
      return `I think you're looking for ${intentDescription} (${confidence}% confidence). Is that correct?`;
    } else {
      // High confidence but close alternatives
      const topAlternative = classification.alternatives[0];
      if (topAlternative && (confidence - topAlternative.confidence) < 20) {
        return `Did you mean ${intentDescription} or ${this.getIntentDescription(topAlternative.intent)}?`;
      }
    }
    
    return `I'll proceed with ${intentDescription}. Let me know if you meant something else.`;
  }

  /**
   * Get human-readable description for intent type
   */
  private getIntentDescription(intent: string): string {
    const descriptions: Record<string, string> = {
      'terrain_analysis': 'terrain and site constraint analysis',
      'wind_rose_analysis': 'wind rose and directional analysis',
      'wake_analysis': 'wake effect modeling and analysis',
      'layout_optimization': 'turbine layout optimization',
      'site_suitability': 'comprehensive site suitability assessment',
      'comprehensive_assessment': 'comprehensive renewable energy assessment'
    };
    
    return descriptions[intent] || 'renewable energy analysis';
  }

  /**
   * Get environment variable name for service
   */
  private getEnvironmentVariableName(intent: string): string {
    const envVarMapping: Record<string, string> = {
      'terrain_analysis': 'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'wind_rose_analysis': 'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME', // Wind rose uses simulation tool
      'wake_analysis': 'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'layout_optimization': 'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
      'site_suitability': 'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
      'comprehensive_assessment': 'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
      'report_generation': 'RENEWABLE_REPORT_TOOL_FUNCTION_NAME'
    };
    
    return envVarMapping[intent] || 'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME';
  }

  /**
   * Initialize available analysis services
   */
  private initializeServices(): Record<string, AnalysisService> {
    return {
      'terrain_analysis': {
        type: 'terrain_analysis',
        functionName: process.env.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME || '',
        description: 'Terrain and site constraint analysis',
        capabilities: ['OSM data integration', 'terrain feature analysis', 'constraint mapping']
      },
      'wind_rose_analysis': {
        type: 'wind_rose_analysis',
        functionName: process.env.RENEWABLE_WIND_TOOL_FUNCTION_NAME || '',
        description: 'Wind rose and directional analysis',
        capabilities: ['wind direction analysis', 'seasonal patterns', 'wind speed distributions']
      },
      'wake_analysis': {
        type: 'wake_analysis',
        functionName: process.env.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME || '',
        description: 'Wake effect modeling and analysis',
        capabilities: ['turbine interaction modeling', 'wake loss calculations', 'downstream impact analysis']
      },
      'layout_optimization': {
        type: 'layout_optimization',
        functionName: process.env.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME || '',
        description: 'Turbine layout optimization',
        capabilities: ['optimal turbine placement', 'spacing optimization', 'energy yield maximization']
      },
      'site_suitability': {
        type: 'site_suitability',
        functionName: process.env.RENEWABLE_SUITABILITY_TOOL_FUNCTION_NAME || '',
        description: 'Comprehensive site suitability assessment',
        capabilities: ['multi-criteria assessment', 'risk analysis', 'development recommendations']
      },
      'comprehensive_assessment': {
        type: 'comprehensive_assessment',
        functionName: process.env.RENEWABLE_COMPREHENSIVE_TOOL_FUNCTION_NAME || '',
        description: 'Comprehensive renewable energy assessment',
        capabilities: ['end-to-end analysis', 'integrated reporting', 'stakeholder presentations']
      },
      'report_generation': {
        type: 'report_generation',
        functionName: process.env.RENEWABLE_REPORT_TOOL_FUNCTION_NAME || '',
        description: 'Financial analysis and report generation',
        capabilities: ['ROI calculation', 'financial metrics', 'economic analysis', 'executive reports']
      }
    };
  }

  /**
   * Get available analysis services
   */
  getAvailableServices(): AnalysisService[] {
    return Object.values(this.services).filter(service => 
      this.validateServiceAvailability(service.type)
    );
  }

  /**
   * Validate routing for non-terrain queries (for testing)
   */
  validateNonTerrainRouting(query: string): boolean {
    return this.classifier.validateNonTerrainRouting(query);
  }
}