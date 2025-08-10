/**
 * Response Normalizer
 * 
 * This module provides response normalization and parsing for API responses,
 * converting different response formats to consistent structures with comprehensive
 * null/undefined checking and proper error detection.
 */

export interface LegalTag {
  id: string;
  name: string;
  description: string;
  properties: LegalTagProperties | string; // Can be object or JSON string
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LegalTagProperties {
  countryOfOrigin?: string[];
  contractId?: string;
  expirationDate?: string;
  originator?: string;
  dataType?: string;
  securityClassification?: string;
  personalData?: string;
  exportClassification?: string;
  [key: string]: any; // Allow additional properties
}

export interface LegalTagConnection {
  items: LegalTag[];
  pagination?: {
    nextToken?: string;
    hasNextPage?: boolean;
    totalCount?: number;
  };
}

export interface NormalizedResponse<T = any> {
  data: T;
  isEmpty: boolean;
  isError: boolean;
  errorType?: 'NETWORK' | 'AUTHENTICATION' | 'VALIDATION' | 'SERVER' | 'DATA' | 'UNKNOWN';
  errorMessage?: string;
  originalResponse?: any;
  metadata?: {
    source: string;
    queryType: string;
    timestamp: number;
  };
}

export interface ResponseNormalizationOptions {
  allowEmptyResponse?: boolean;
  validateProperties?: boolean;
  parseJsonProperties?: boolean;
  includeMetadata?: boolean;
  source?: string;
  queryType?: string;
}

export class ResponseNormalizer {
  /**
   * Normalize legal tag response from different query formats
   */
  static normalizeLegalTagResponse(
    response: any,
    options: ResponseNormalizationOptions = {}
  ): NormalizedResponse<LegalTagConnection> {
    const {
      allowEmptyResponse = true,
      validateProperties = true,
      parseJsonProperties = true,
      includeMetadata = true,
      source = 'unknown',
      queryType = 'unknown'
    } = options;

    // Initialize normalized response
    const normalized: NormalizedResponse<LegalTagConnection> = {
      data: { items: [], pagination: {} },
      isEmpty: true,
      isError: false,
      originalResponse: response
    };

    // Add metadata if requested
    if (includeMetadata) {
      normalized.metadata = {
        source,
        queryType,
        timestamp: Date.now()
      };
    }

    try {
      // Handle null or undefined response
      if (response === null || response === undefined) {
        if (allowEmptyResponse) {
          return normalized; // Return empty but valid response
        } else {
          return {
            ...normalized,
            isError: true,
            errorType: 'DATA',
            errorMessage: 'Response is null or undefined'
          };
        }
      }

      // Handle different response structures
      let legalTags: LegalTag[] = [];
      let pagination: any = {};

      // Case 1: Response has getLegalTags field (connection format)
      if (response.getLegalTags !== undefined && response.getLegalTags !== null) {
        const result = this.extractFromConnectionFormat(response.getLegalTags);
        legalTags = result.items;
        pagination = result.pagination;
      }
      // Case 2: Response has listLegalTags field (connection format)
      else if (response.listLegalTags !== undefined && response.listLegalTags !== null) {
        const result = this.extractFromConnectionFormat(response.listLegalTags);
        legalTags = result.items;
        pagination = result.pagination;
      }
      // Case 2a: Handle null values for GraphQL fields (valid empty response)
      else if (response.getLegalTags === null || response.listLegalTags === null) {
        // GraphQL returned null for the field, which means empty result
        legalTags = [];
        pagination = {};
      }
      // Case 3: Direct array format
      else if (Array.isArray(response)) {
        legalTags = response;
      }
      // Case 4: Response has items field directly
      else if (response.items && Array.isArray(response.items)) {
        legalTags = response.items;
        pagination = response.pagination || {};
      }
      // Case 5: Single legal tag object
      else if (response.id && response.name) {
        legalTags = [response];
      }
      // Case 6: Nested structure with data field
      else if (response.data) {
        return this.normalizeLegalTagResponse(response.data, options);
      }
      // Case 7: Unknown structure
      else {
        return {
          ...normalized,
          isError: true,
          errorType: 'DATA',
          errorMessage: `Unknown response structure: ${JSON.stringify(Object.keys(response))}`
        };
      }

      // Validate and normalize each legal tag
      const normalizedTags = legalTags
        .filter(tag => tag !== null && tag !== undefined)
        .map(tag => this.normalizeLegalTag(tag, { validateProperties, parseJsonProperties }))
        .filter(tag => tag !== null);

      // Update normalized response
      normalized.data = {
        items: normalizedTags,
        pagination: this.normalizePagination(pagination)
      };
      normalized.isEmpty = normalizedTags.length === 0;

      return normalized;

    } catch (error) {
      return {
        ...normalized,
        isError: true,
        errorType: 'UNKNOWN',
        errorMessage: `Response normalization failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Extract legal tags from connection format (with items and pagination)
   */
  private static extractFromConnectionFormat(connectionData: any): { items: LegalTag[], pagination: any } {
    if (!connectionData) {
      return { items: [], pagination: {} };
    }

    // Handle different connection formats
    if (connectionData.items && Array.isArray(connectionData.items)) {
      return {
        items: connectionData.items,
        pagination: connectionData.pagination || (connectionData.nextToken ? { nextToken: connectionData.nextToken } : {})
      };
    }

    // Handle direct array (some backends return array directly)
    if (Array.isArray(connectionData)) {
      return { items: connectionData, pagination: {} };
    }

    // Handle single item
    if (connectionData.id && connectionData.name) {
      return { items: [connectionData], pagination: {} };
    }

    return { items: [], pagination: {} };
  }

  /**
   * Normalize a single legal tag object
   */
  private static normalizeLegalTag(
    tag: any,
    options: { validateProperties?: boolean; parseJsonProperties?: boolean } = {}
  ): LegalTag | null {
    const { validateProperties = true, parseJsonProperties = true } = options;

    if (!tag || typeof tag !== 'object') {
      return null;
    }

    // Ensure required fields exist
    if (!tag.id || !tag.name) {
      console.warn('Legal tag missing required fields (id, name):', tag);
      if (validateProperties) {
        return null;
      }
    }

    // Normalize properties field
    let properties: LegalTagProperties = {};
    if (tag.properties) {
      if (typeof tag.properties === 'string' && parseJsonProperties) {
        try {
          properties = JSON.parse(tag.properties);
        } catch (error) {
          console.warn('Failed to parse legal tag properties JSON:', tag.properties, error);
          properties = { rawValue: tag.properties };
        }
      } else if (typeof tag.properties === 'object') {
        properties = tag.properties;
      } else {
        properties = { rawValue: String(tag.properties) };
      }
    }

    return {
      id: String(tag.id || ''),
      name: String(tag.name || ''),
      description: String(tag.description || ''),
      properties,
      status: tag.status ? String(tag.status) : undefined,
      createdBy: tag.createdBy ? String(tag.createdBy) : undefined,
      createdAt: tag.createdAt ? String(tag.createdAt) : undefined,
      updatedBy: tag.updatedBy ? String(tag.updatedBy) : undefined,
      updatedAt: tag.updatedAt ? String(tag.updatedAt) : undefined
    };
  }

  /**
   * Normalize pagination object
   */
  private static normalizePagination(pagination: any): LegalTagConnection['pagination'] {
    if (!pagination || typeof pagination !== 'object') {
      return {};
    }

    return {
      nextToken: pagination.nextToken ? String(pagination.nextToken) : undefined,
      hasNextPage: pagination.hasNextPage !== undefined ? Boolean(pagination.hasNextPage) : Boolean(pagination.nextToken),
      totalCount: pagination.totalCount ? Number(pagination.totalCount) : undefined
    };
  }

  /**
   * Detect if response represents an empty result vs an error
   */
  static isEmptyResponse(response: any): boolean {
    if (response === null || response === undefined) {
      return true;
    }

    // Check for explicit empty indicators
    if (Array.isArray(response) && response.length === 0) {
      return true;
    }

    if (response.items && Array.isArray(response.items) && response.items.length === 0) {
      return true;
    }

    if (response.getLegalTags && Array.isArray(response.getLegalTags) && response.getLegalTags.length === 0) {
      return true;
    }

    if (response.listLegalTags && response.listLegalTags.items && 
        Array.isArray(response.listLegalTags.items) && response.listLegalTags.items.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Detect if response represents an error condition
   */
  static isErrorResponse(response: any): { isError: boolean; errorType?: string; errorMessage?: string } {
    if (response === null || response === undefined) {
      return { isError: false }; // Null can be valid empty response
    }

    // Check for GraphQL errors
    if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
      return {
        isError: true,
        errorType: 'VALIDATION',
        errorMessage: response.errors.map((e: any) => e.message).join(', ')
      };
    }

    // Check for HTTP error indicators
    if (response.error || response.message) {
      return {
        isError: true,
        errorType: 'SERVER',
        errorMessage: response.error || response.message
      };
    }

    // Check for status codes
    if (response.status && response.status >= 400) {
      return {
        isError: true,
        errorType: response.status >= 500 ? 'SERVER' : 'AUTHENTICATION',
        errorMessage: `HTTP ${response.status}: ${response.statusText || 'Error'}`
      };
    }

    return { isError: false };
  }

  /**
   * Create a standardized error response
   */
  static createErrorResponse<T>(
    errorType: NormalizedResponse<T>['errorType'],
    errorMessage: string,
    originalResponse?: any
  ): NormalizedResponse<T> {
    return {
      data: {} as T,
      isEmpty: true,
      isError: true,
      errorType,
      errorMessage,
      originalResponse,
      metadata: {
        source: 'error',
        queryType: 'error',
        timestamp: Date.now()
      }
    };
  }

  /**
   * Validate legal tag properties structure
   */
  static validateLegalTagProperties(properties: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!properties || typeof properties !== 'object') {
      errors.push('Properties must be an object');
      return { isValid: false, errors };
    }

    // Check for common required properties
    const requiredFields = ['countryOfOrigin', 'contractId', 'originator'];
    for (const field of requiredFields) {
      if (!properties[field]) {
        errors.push(`Missing required property: ${field}`);
      }
    }

    // Validate specific field types
    if (properties.countryOfOrigin && !Array.isArray(properties.countryOfOrigin)) {
      errors.push('countryOfOrigin must be an array');
    }

    if (properties.expirationDate && !this.isValidDate(properties.expirationDate)) {
      errors.push('expirationDate must be a valid ISO date string');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check if a string is a valid date
   */
  private static isValidDate(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) && dateString.includes('T'); // Expect ISO format
    } catch {
      return false;
    }
  }
}

// Export convenience functions
export const normalizeLegalTagResponse = ResponseNormalizer.normalizeLegalTagResponse.bind(ResponseNormalizer);
export const isEmptyResponse = ResponseNormalizer.isEmptyResponse.bind(ResponseNormalizer);
export const isErrorResponse = ResponseNormalizer.isErrorResponse.bind(ResponseNormalizer);
export const createErrorResponse = ResponseNormalizer.createErrorResponse.bind(ResponseNormalizer);
export const validateLegalTagProperties = ResponseNormalizer.validateLegalTagProperties.bind(ResponseNormalizer);