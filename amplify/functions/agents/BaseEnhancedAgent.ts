/**
 * BaseEnhancedAgent - Abstract base class for agents with verbose thought step generation
 * 
 * This class provides a standardized pattern for generating detailed, educational
 * chain of thought steps that all agents can inherit and extend.
 * 
 * Design Philosophy:
 * - Verbose by default: Every operation generates detailed thought steps
 * - Educational: Steps explain what's happening and why
 * - Transparent: Users can see the agent's reasoning process
 * - Consistent: All agents follow the same thought step pattern
 */

import { ThoughtStep } from '../../../utils/thoughtTypes';

/**
 * Extended ThoughtStep interface with additional verbose fields
 * Note: We don't extend ThoughtStep directly to allow for additional step types
 */
export interface VerboseThoughtStep {
  /** Unique identifier for the step */
  id: string;
  
  /** Type of operation being performed */
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 'data_retrieval' | 'calculation' | 'validation' | 'completion' | 'error' | 'execution';
  
  /** Unix timestamp when step started */
  timestamp: number;
  
  /** Short, descriptive title of the step */
  title: string;
  
  /** Brief summary of what's happening */
  summary: string;
  
  /** Detailed information about the step (JSON stringified for complex data) */
  details?: string;
  
  /** Current status of the step */
  status: 'thinking' | 'in_progress' | 'complete' | 'error';
  
  /** Optional confidence level (0-1) */
  confidence?: number;
  
  /** Duration in milliseconds (calculated when step completes) */
  duration?: number;
  
  /** Progress percentage (0-100) for long-running operations */
  progress?: number;
  
  /** Additional context specific to the operation */
  context?: {
    wellName?: string;
    analysisType?: string;
    method?: string;
    parameters?: Record<string, any>;
    dataSource?: string;
    s3Bucket?: string;
    s3Key?: string;
    fileSize?: number;
    [key: string]: any;
  };
  
  /** Performance metrics for the operation */
  metrics?: {
    startTime?: number;
    endTime?: number;
    duration?: number;
    dataSize?: number;
    recordCount?: number;
    [key: string]: any;
  };
  
  /** Error information if step failed */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Abstract base class for agents with verbose thought step generation
 * 
 * Usage:
 * ```typescript
 * class MyAgent extends BaseEnhancedAgent {
 *   async processRequest(input: string) {
 *     const step = this.addThoughtStep(
 *       'intent_detection',
 *       'Analyzing User Request',
 *       'Determining the type of analysis requested',
 *       { parameters: { input } }
 *     );
 *     
 *     // ... do work ...
 *     
 *     this.completeThoughtStep(step.id, {
 *       details: JSON.stringify({ intent: 'porosity_calculation' })
 *     });
 *     
 *     return this.thoughtSteps;
 *   }
 * }
 * ```
 */
export abstract class BaseEnhancedAgent {
  /** Array of all thought steps generated during agent execution */
  protected thoughtSteps: VerboseThoughtStep[] = [];
  
  /** Map of step IDs to their start times for duration calculation */
  private stepTimings: Map<string, number> = new Map();
  
  /** Enable/disable verbose logging to console */
  protected verboseLogging: boolean = true;
  
  constructor(verboseLogging: boolean = true) {
    this.verboseLogging = verboseLogging;
    this.log('BaseEnhancedAgent initialized');
  }
  
  /**
   * Add a new thought step to the agent's execution trace
   * 
   * @param type - Type of operation being performed
   * @param title - Short, descriptive title
   * @param summary - Brief summary of what's happening
   * @param context - Additional context about the operation
   * @param details - Detailed information (will be JSON stringified if object)
   * @returns The created thought step
   */
  protected addThoughtStep(
    type: VerboseThoughtStep['type'],
    title: string,
    summary: string,
    context?: VerboseThoughtStep['context'],
    details?: any
  ): VerboseThoughtStep {
    const timestamp = Date.now();
    const id = `thought-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    
    const step: VerboseThoughtStep = {
      id,
      type,
      timestamp,
      title,
      summary,
      status: 'in_progress',
      context,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined,
      metrics: {
        startTime: timestamp
      }
    };
    
    this.thoughtSteps.push(step);
    this.stepTimings.set(id, timestamp);
    
    this.log(`[THOUGHT STEP] ${type.toUpperCase()}: ${title}`, {
      summary,
      context,
      stepId: id
    });
    
    return step;
  }
  
  /**
   * Mark a thought step as complete
   * 
   * @param stepId - ID of the step to complete
   * @param updates - Optional updates to apply to the step
   */
  protected completeThoughtStep(
    stepId: string,
    updates?: Partial<VerboseThoughtStep>
  ): void {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (!step) {
      this.log(`[WARNING] Attempted to complete non-existent step: ${stepId}`, null, 'warn');
      return;
    }
    
    const startTime = this.stepTimings.get(stepId);
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Update the step
    Object.assign(step, {
      ...updates,
      status: 'complete',
      duration,
      metrics: {
        ...step.metrics,
        endTime: Date.now(),
        duration
      }
    });
    
    this.stepTimings.delete(stepId);
    
    this.log(`[THOUGHT STEP COMPLETE] ${step.type.toUpperCase()}: ${step.title}`, {
      duration: `${duration}ms`,
      stepId
    });
  }
  
  /**
   * Mark a thought step as failed with error information
   * 
   * @param stepId - ID of the step that failed
   * @param error - Error that occurred
   * @param additionalContext - Additional context about the failure
   */
  protected errorThoughtStep(
    stepId: string,
    error: Error | string,
    additionalContext?: Record<string, any>
  ): void {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (!step) {
      this.log(`[WARNING] Attempted to error non-existent step: ${stepId}`, null, 'warn');
      return;
    }
    
    const startTime = this.stepTimings.get(stepId);
    const duration = startTime ? Date.now() - startTime : undefined;
    
    const errorInfo = typeof error === 'string' 
      ? { message: error }
      : { message: error.message, stack: error.stack };
    
    // Update the step
    Object.assign(step, {
      status: 'error',
      duration,
      error: errorInfo,
      context: {
        ...step.context,
        ...additionalContext
      },
      metrics: {
        ...step.metrics,
        endTime: Date.now(),
        duration
      }
    });
    
    this.stepTimings.delete(stepId);
    
    this.log(`[THOUGHT STEP ERROR] ${step.type.toUpperCase()}: ${step.title}`, {
      error: errorInfo.message,
      duration: `${duration}ms`,
      stepId
    }, 'error');
  }
  
  /**
   * Update an in-progress thought step with new information
   * 
   * @param stepId - ID of the step to update
   * @param updates - Updates to apply
   */
  protected updateThoughtStep(
    stepId: string,
    updates: Partial<VerboseThoughtStep>
  ): void {
    const step = this.thoughtSteps.find(s => s.id === stepId);
    if (!step) {
      this.log(`[WARNING] Attempted to update non-existent step: ${stepId}`, null, 'warn');
      return;
    }
    
    Object.assign(step, updates);
    
    this.log(`[THOUGHT STEP UPDATE] ${step.type.toUpperCase()}: ${step.title}`, {
      updates,
      stepId
    });
  }
  
  /**
   * Get all thought steps generated so far
   */
  public getThoughtSteps(): VerboseThoughtStep[] {
    return this.thoughtSteps;
  }
  
  /**
   * Clear all thought steps (useful for starting a new request)
   */
  protected clearThoughtSteps(): void {
    this.thoughtSteps = [];
    this.stepTimings.clear();
    this.log('[THOUGHT STEPS CLEARED]');
  }
  
  /**
   * Validate that all required fields are present in a thought step
   * 
   * @param step - Step to validate
   * @returns True if valid, false otherwise
   */
  protected validateThoughtStep(step: VerboseThoughtStep): boolean {
    const requiredFields: (keyof VerboseThoughtStep)[] = ['id', 'type', 'timestamp', 'title', 'summary', 'status'];
    
    for (const field of requiredFields) {
      if (step[field] === undefined || step[field] === null) {
        this.log(`[VALIDATION ERROR] Missing required field: ${field}`, { step }, 'error');
        return false;
      }
    }
    
    // Check for duplicate IDs
    const duplicates = this.thoughtSteps.filter(s => s.id === step.id);
    if (duplicates.length > 1) {
      this.log(`[VALIDATION ERROR] Duplicate step ID: ${step.id}`, { step }, 'error');
      return false;
    }
    
    return true;
  }
  
  /**
   * Internal logging method
   */
  private log(message: string, data?: any, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (!this.verboseLogging) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [BaseEnhancedAgent]`;
    
    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }
  
  /**
   * Helper method to create a data retrieval thought step
   * Common pattern for S3 data fetching
   */
  protected addDataRetrievalStep(
    dataSource: string,
    s3Bucket?: string,
    s3Key?: string
  ): VerboseThoughtStep {
    return this.addThoughtStep(
      'data_retrieval',
      `Retrieving ${dataSource}`,
      `Fetching data from ${s3Bucket ? 'S3 storage' : 'data source'}`,
      {
        dataSource,
        s3Bucket,
        s3Key
      }
    );
  }
  
  /**
   * Helper method to create a calculation thought step
   */
  protected addCalculationStep(
    calculationType: string,
    method: string,
    parameters?: Record<string, any>
  ): VerboseThoughtStep {
    return this.addThoughtStep(
      'calculation',
      `Calculating ${calculationType}`,
      `Using ${method} methodology`,
      {
        analysisType: calculationType,
        method,
        parameters
      }
    );
  }
  
  /**
   * Helper method to create a validation thought step
   */
  protected addValidationStep(
    validationType: string,
    criteria?: Record<string, any>
  ): VerboseThoughtStep {
    return this.addThoughtStep(
      'validation',
      `Validating ${validationType}`,
      'Checking results against quality criteria',
      {
        analysisType: validationType,
        parameters: criteria
      }
    );
  }
}

