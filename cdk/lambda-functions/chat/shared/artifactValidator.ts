/**
 * Artifact Validation Utility
 * 
 * Ensures artifacts are JSON-serializable and conform to expected structure
 * before being returned to the frontend.
 */

export interface ArtifactValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedArtifact?: any;
}

export interface ArtifactValidationOptions {
  /**
   * Whether to attempt to sanitize non-serializable artifacts
   * @default true
   */
  sanitize?: boolean;

  /**
   * Whether to log validation failures
   * @default true
   */
  logFailures?: boolean;

  /**
   * Maximum depth for circular reference detection
   * @default 10
   */
  maxDepth?: number;
}

/**
 * Validate that an artifact is JSON-serializable and has required fields
 * 
 * @param artifact - Artifact to validate
 * @param options - Validation options
 * @returns Validation result with errors and sanitized artifact if applicable
 */
export function validateArtifact(
  artifact: any,
  options: ArtifactValidationOptions = {}
): ArtifactValidationResult {
  const {
    sanitize = true,
    logFailures = true,
    maxDepth = 10,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if artifact exists
  if (!artifact) {
    errors.push('Artifact is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Check if artifact is an object
  if (typeof artifact !== 'object') {
    errors.push(`Artifact must be an object, got ${typeof artifact}`);
    return { valid: false, errors, warnings };
  }

  // Check required fields
  if (!artifact.type && !artifact.messageContentType) {
    errors.push('Artifact missing required field: type or messageContentType');
  }

  if (!artifact.data && !artifact.title) {
    warnings.push('Artifact missing both data and title fields');
  }

  // Check for circular references
  const circularCheck = detectCircularReferences(artifact, maxDepth);
  if (circularCheck.hasCircular) {
    errors.push(`Circular reference detected at path: ${circularCheck.path}`);
    
    if (sanitize) {
      warnings.push('Attempting to remove circular references');
    }
  }

  // Test JSON serializability
  let sanitizedArtifact = artifact;
  try {
    const serialized = JSON.stringify(artifact);
    const deserialized = JSON.parse(serialized);
    
    // Verify deserialization preserves structure
    if (!deserialized) {
      errors.push('Artifact deserialization resulted in null');
    }
  } catch (error: any) {
    errors.push(`Artifact is not JSON-serializable: ${error.message}`);
    
    if (sanitize) {
      try {
        sanitizedArtifact = sanitizeArtifact(artifact, maxDepth);
        warnings.push('Artifact was sanitized to remove non-serializable properties');
        
        // Test sanitized version
        JSON.stringify(sanitizedArtifact);
      } catch (sanitizeError: any) {
        errors.push(`Failed to sanitize artifact: ${sanitizeError.message}`);
        sanitizedArtifact = undefined;
      }
    }
  }

  // Log failures if requested
  if (logFailures && errors.length > 0) {
    console.error('❌ Artifact validation failed:', {
      artifactType: artifact.type || artifact.messageContentType || 'unknown',
      errors,
      warnings,
      timestamp: new Date().toISOString(),
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    sanitizedArtifact: valid || sanitize ? sanitizedArtifact : undefined,
  };
}

/**
 * Validate an array of artifacts
 * 
 * @param artifacts - Array of artifacts to validate
 * @param options - Validation options
 * @returns Array of validation results
 */
export function validateArtifacts(
  artifacts: any[],
  options: ArtifactValidationOptions = {}
): {
  allValid: boolean;
  results: ArtifactValidationResult[];
  validArtifacts: any[];
  invalidCount: number;
} {
  if (!Array.isArray(artifacts)) {
    console.error('❌ validateArtifacts: Input is not an array');
    return {
      allValid: false,
      results: [],
      validArtifacts: [],
      invalidCount: 0,
    };
  }

  const results: ArtifactValidationResult[] = [];
  const validArtifacts: any[] = [];
  let invalidCount = 0;

  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    const result = validateArtifact(artifact, options);
    
    results.push(result);

    if (result.valid) {
      validArtifacts.push(result.sanitizedArtifact || artifact);
    } else {
      invalidCount++;
      console.error(`❌ Artifact ${i} validation failed:`, {
        index: i,
        type: artifact?.type || artifact?.messageContentType || 'unknown',
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }

  const allValid = invalidCount === 0;

  if (!allValid) {
    console.error('❌ Artifact array validation summary:', {
      total: artifacts.length,
      valid: validArtifacts.length,
      invalid: invalidCount,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    allValid,
    results,
    validArtifacts,
    invalidCount,
  };
}

/**
 * Detect circular references in an object
 * 
 * @param obj - Object to check
 * @param maxDepth - Maximum depth to traverse
 * @param visited - Set of visited objects (for recursion)
 * @param path - Current path (for error reporting)
 * @returns Detection result with path if circular reference found
 */
function detectCircularReferences(
  obj: any,
  maxDepth: number,
  visited: Set<any> = new Set(),
  path: string = 'root'
): { hasCircular: boolean; path?: string } {
  // Base cases
  if (obj === null || typeof obj !== 'object') {
    return { hasCircular: false };
  }

  if (maxDepth <= 0) {
    return { hasCircular: false };
  }

  // Check if we've seen this object before
  if (visited.has(obj)) {
    return { hasCircular: true, path };
  }

  // Add to visited set
  visited.add(obj);

  // Check array elements
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = detectCircularReferences(
        obj[i],
        maxDepth - 1,
        visited,
        `${path}[${i}]`
      );
      if (result.hasCircular) {
        return result;
      }
    }
  } else {
    // Check object properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = detectCircularReferences(
          obj[key],
          maxDepth - 1,
          visited,
          `${path}.${key}`
        );
        if (result.hasCircular) {
          return result;
        }
      }
    }
  }

  // Remove from visited set (for other branches)
  visited.delete(obj);

  return { hasCircular: false };
}

/**
 * Sanitize an artifact by removing non-serializable properties
 * 
 * @param obj - Object to sanitize
 * @param maxDepth - Maximum depth to traverse
 * @param visited - Set of visited objects (for circular reference detection)
 * @returns Sanitized object
 */
function sanitizeArtifact(
  obj: any,
  maxDepth: number,
  visited: WeakSet<any> = new WeakSet()
): any {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    // Check if primitive is serializable
    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return undefined;
    }
    return obj;
  }

  // Check depth limit
  if (maxDepth <= 0) {
    return '[Max depth reached]';
  }

  // Check for circular references
  if (visited.has(obj)) {
    return '[Circular reference]';
  }

  visited.add(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map(item => sanitizeArtifact(item, maxDepth - 1, visited))
      .filter(item => item !== undefined);
  }

  // Handle dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle regular expressions
  if (obj instanceof RegExp) {
    return obj.toString();
  }

  // Handle plain objects
  const sanitized: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }

      // Recursively sanitize nested objects
      const sanitizedValue = sanitizeArtifact(value, maxDepth - 1, visited);

      // Only include if not undefined
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
  }

  return sanitized;
}

/**
 * Create a validation error artifact for display in UI
 * 
 * @param originalArtifact - Original artifact that failed validation
 * @param validationResult - Validation result
 * @returns Error artifact
 */
export function createValidationErrorArtifact(
  originalArtifact: any,
  validationResult: ArtifactValidationResult
): any {
  return {
    type: 'validation_error',
    messageContentType: 'validation_error',
    title: 'Artifact Validation Error',
    data: {
      originalType: originalArtifact?.type || originalArtifact?.messageContentType || 'unknown',
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      message: `This artifact could not be displayed due to validation errors:\n\n${validationResult.errors.join('\n')}`,
    },
  };
}
