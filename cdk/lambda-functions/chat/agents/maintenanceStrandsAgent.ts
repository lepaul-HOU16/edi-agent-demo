/**
 * Maintenance Strands Agent
 * AI-powered maintenance planning and equipment monitoring agent
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { BaseEnhancedAgent } from '../agents/BaseEnhancedAgent';
import { S3Client } from '@aws-sdk/client-s3';
import { 
  addStreamingThoughtStep, 
  updateStreamingThoughtStep 
} from '../shared/thoughtStepStreaming';

// Type definitions for maintenance agent functionality
interface MaintenanceIntent {
  type: 'equipment_status' | 'failure_prediction' | 'maintenance_planning' | 
        'inspection_schedule' | 'maintenance_history' | 'asset_health' | 
        'preventive_maintenance' | 'natural_language_query';
  score: number;
  equipmentId?: string;
  method?: string;
  query?: string;
}

interface MaintenanceResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
  workflow?: any;
  auditTrail?: any;
}

interface MaintenanceAuditTrail {
  timestamp: Date;
  operation: string;
  parameters: any;
  results: any;
  methodology: any;
  user: string;
}

interface MethodologyDocumentation {
  name: string;
  description: string;
  industryReferences: string[];
  assumptions: string[];
  limitations: string[];
  methodology: string;
  uncertaintyRange: number[];
}

/**
 * Maintenance Strands Agent with equipment monitoring and predictive maintenance
 */
export class MaintenanceStrandsAgent extends BaseEnhancedAgent {
  private modelId: string;
  private s3Client: S3Client;
  private s3Bucket: string;
  private maintenanceDataPath: string = '';
  private availableEquipment: string[] = [];
  
  // Workflow tracking
  private maintenanceAuditTrail: Map<string, MaintenanceAuditTrail[]>;
  private methodologyDocumentation: Map<string, MethodologyDocumentation>;

  constructor(modelId?: string, s3Bucket?: string) {
    super(); // Initialize BaseEnhancedAgent
    this.modelId = modelId || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.s3Bucket = s3Bucket || process.env.S3_BUCKET || '';
    this.s3Client = new S3Client({ region: 'us-east-1' });
    
    // Initialize workflow tracking
    this.maintenanceAuditTrail = new Map();
    this.methodologyDocumentation = new Map();

    console.log('Maintenance Strands Agent initialized');
  }

  /**
   * Process message with maintenance workflows
   * Requirements: 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async processMessage(
    message: string, 
    sessionContext?: { chatSessionId?: string; userId?: string }
  ): Promise<MaintenanceResponse> {
    const timestamp = new Date().toISOString();
    console.log('🔧 === MAINTENANCE AGENT START ===');
    console.log('📝 User Prompt:', message);
    console.log('⏰ Timestamp:', timestamp);

    try {
      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.log('❌ Invalid message input');
        return {
          success: false,
          message: 'Please provide a valid message for maintenance analysis.',
          artifacts: []
        };
      }

      // Initialize thought steps array for chain of thought
      const thoughtSteps: any[] = [];
      
      // THOUGHT STEP 1: Intent Detection
      await addStreamingThoughtStep(
        thoughtSteps,
        {
          step: 1,
          action: 'Analyzing Request',
          reasoning: 'Processing maintenance query to understand requirements',
          status: 'in_progress',
          timestamp: new Date().toISOString()
        },
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );
      
      // Detect user intent
      const intent = this.detectUserIntent(message);
      console.log('🎯 Intent Detection Result:', intent);
      
      // Complete intent detection step
      await updateStreamingThoughtStep(
        thoughtSteps,
        0,
        {
          status: 'complete',
          result: `Intent detected: ${intent.type}`,
          duration: 100
        },
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );
      
      // THOUGHT STEP 2: Executing Analysis
      await addStreamingThoughtStep(
        thoughtSteps,
        {
          step: 2,
          action: 'Executing Analysis',
          reasoning: `Running ${intent.type} workflow`,
          status: 'in_progress',
          timestamp: new Date().toISOString()
        },
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );

      // Route to appropriate handler
      let handlerResult;
      switch (intent.type) {
        case 'equipment_status':
          console.log('📊 Executing: Equipment Status Handler');
          handlerResult = await this.handleEquipmentStatus(message, intent.equipmentId);
          break;

        case 'failure_prediction':
          console.log('🔮 Executing: Failure Prediction Handler');
          handlerResult = await this.handleFailurePrediction(message, intent.equipmentId);
          break;

        case 'maintenance_planning':
          console.log('📅 Executing: Maintenance Planning Handler');
          handlerResult = await this.handleMaintenancePlanning(message);
          break;

        case 'inspection_schedule':
          console.log('🔍 Executing: Inspection Schedule Handler');
          handlerResult = await this.handleInspectionSchedule(message);
          break;

        case 'maintenance_history':
          console.log('📜 Executing: Maintenance History Handler');
          handlerResult = await this.handleMaintenanceHistory(message, intent.equipmentId);
          break;

        case 'asset_health':
          console.log('💚 Executing: Asset Health Handler');
          handlerResult = await this.handleAssetHealth(message);
          break;

        case 'preventive_maintenance':
          console.log('🛡️ Executing: Preventive Maintenance Handler');
          handlerResult = await this.handlePreventiveMaintenance(message);
          break;

        default:
          console.log('💬 Executing: Natural Language Query Handler');
          handlerResult = await this.handleNaturalLanguageQuery(message);
          break;
      }

      // Complete execution step
      await updateStreamingThoughtStep(
        thoughtSteps,
        1,
        {
          status: 'complete',
          result: `Analysis completed successfully`,
          duration: 200
        },
        sessionContext?.chatSessionId,
        sessionContext?.userId
      );
      
      console.log('🏁 === MAINTENANCE AGENT END ===');
      
      // Add thought steps to response
      return {
        ...handlerResult,
        thoughtSteps
      };

    } catch (error) {
      console.error('❌ === MAINTENANCE AGENT ERROR ===');
      console.error('💥 Error in message processing:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        artifacts: []
      };
    }
  }

  /**
   * Detect user intent from message
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   */
  private detectUserIntent(message: string): MaintenanceIntent {
    const query = message.toLowerCase().trim();
    const equipmentId = this.extractEquipmentId(message);
    
    console.log('🔍 Intent Detection:', { 
      queryPreview: query.substring(0, 100) + '...', 
      equipmentId
    });

    // Equipment status patterns
    if (this.matchesAny(query, [
      'equipment.*status',
      'status.*of.*equipment',
      'status.*for.*equipment',
      'status.*for.*all',
      'status.*all.*wells',
      'all.*wells.*status',
      'all.*equipment.*status',
      'check.*equipment',
      'check.*status',
      'get.*status',
      'show.*status',
      'equipment.*health',
      'operational.*status'
    ]) || (equipmentId && query.includes('status'))) {
      return { type: 'equipment_status', score: 10, equipmentId };
    }

    // Failure prediction patterns
    if (this.matchesAny(query, [
      'failure.*prediction',
      'predict.*failure',
      'when.*will.*fail',
      'failure.*risk',
      'equipment.*failure'
    ])) {
      return { type: 'failure_prediction', score: 10, equipmentId };
    }

    // Maintenance planning patterns
    if (this.matchesAny(query, [
      'maintenance.*plan',
      'plan.*maintenance',
      'schedule.*maintenance',
      'maintenance.*schedule',
      'optimize.*maintenance'
    ])) {
      return { type: 'maintenance_planning', score: 10 };
    }

    // Inspection schedule patterns
    if (this.matchesAny(query, [
      'inspection.*schedule',
      'schedule.*inspection',
      'inspection.*plan',
      'when.*inspect'
    ])) {
      return { type: 'inspection_schedule', score: 10 };
    }

    // Maintenance history patterns
    if (this.matchesAny(query, [
      'maintenance.*history',
      'past.*maintenance',
      'previous.*maintenance',
      'maintenance.*records'
    ])) {
      return { type: 'maintenance_history', score: 10, equipmentId };
    }

    // Asset health patterns
    if (this.matchesAny(query, [
      'asset.*health',
      'equipment.*health',
      'health.*score',
      'condition.*assessment'
    ])) {
      return { type: 'asset_health', score: 10 };
    }

    // Preventive maintenance patterns
    if (this.matchesAny(query, [
      'preventive.*maintenance',
      'preventative.*maintenance',
      'pm.*schedule',
      'routine.*maintenance'
    ])) {
      return { type: 'preventive_maintenance', score: 10 };
    }

    // Default to natural language query
    return { type: 'natural_language_query', score: 5, query: message };
  }

  /**
   * Extract equipment ID from message
   */
  private extractEquipmentId(message: string): string | undefined {
    // Look for patterns like PUMP-001, COMP-123, TURB-456, well001, etc.
    const patterns = [
      /([A-Z]{3,4}-\d{3,4})/i,  // PUMP-001, COMP-123
      /(well\d{3,4})/i,          // well001, well123
      /(pump\d{3,4})/i,          // pump001
      /(comp\d{3,4})/i,          // comp123
      /(turb\d{3,4})/i           // turb456
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const id = match[1].toUpperCase();
        // Convert well001 format to WELL-001 format
        if (/^(WELL|PUMP|COMP|TURB)(\d+)$/i.test(id)) {
          return id.replace(/^([A-Z]+)(\d+)$/i, '$1-$2');
        }
        return id;
      }
    }
    
    return undefined;
  }

  /**
   * Check if query matches any of the patterns
   */
  private matchesAny(query: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(query);
    });
  }

  /**
   * Handler methods - Implemented with full functionality
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */

  private async handleEquipmentStatus(message: string, equipmentId?: string): Promise<MaintenanceResponse> {
    const { handleEquipmentStatus } = await import('./handlers/equipmentStatusHandler.js');
    return handleEquipmentStatus(message, equipmentId);
  }

  private async handleFailurePrediction(message: string, equipmentId?: string): Promise<MaintenanceResponse> {
    const { handleFailurePrediction } = await import('./handlers/failurePredictionHandler.js');
    return handleFailurePrediction(message, equipmentId);
  }

  private async handleMaintenancePlanning(message: string): Promise<MaintenanceResponse> {
    const { handleMaintenancePlanning } = await import('./handlers/maintenancePlanningHandler.js');
    return handleMaintenancePlanning(message);
  }

  private async handleInspectionSchedule(message: string): Promise<MaintenanceResponse> {
    const { handleInspectionSchedule } = await import('./handlers/inspectionScheduleHandler.js');
    return handleInspectionSchedule(message);
  }

  private async handleMaintenanceHistory(message: string, equipmentId?: string): Promise<MaintenanceResponse> {
    const { handleMaintenanceHistory } = await import('./handlers/maintenanceHistoryHandler.js');
    return handleMaintenanceHistory(message, equipmentId);
  }

  private async handleAssetHealth(message: string): Promise<MaintenanceResponse> {
    const { handleAssetHealth } = await import('./handlers/assetHealthHandler.js');
    return handleAssetHealth(message);
  }

  private async handlePreventiveMaintenance(message: string): Promise<MaintenanceResponse> {
    const { handlePreventiveMaintenance } = await import('./handlers/preventiveMaintenanceHandler.js');
    return handlePreventiveMaintenance(message);
  }

  private async handleNaturalLanguageQuery(message: string): Promise<MaintenanceResponse> {
    return {
      success: true,
      message: 'I can help you with equipment status, failure predictions, maintenance planning, inspection schedules, maintenance history, asset health assessments, and preventive maintenance recommendations. Please specify what you would like to know about your equipment.',
      artifacts: [],
      thoughtSteps: [{
        type: 'info',
        title: 'Available Capabilities',
        summary: 'Maintenance agent capabilities',
        details: 'Equipment status, failure prediction, maintenance planning, inspection scheduling, maintenance history, asset health, preventive maintenance',
        status: 'complete',
        timestamp: Date.now()
      }]
    };
  }
}
