/**
 * GraphQL Type Definitions
 * 
 * This module provides TypeScript interfaces for GraphQL schema introspection
 * and query building operations.
 */

export interface GraphQLField {
  name: string;
  type: GraphQLType;
  args: GraphQLArgument[];
  description?: string;
}

export interface GraphQLArgument {
  name: string;
  type: GraphQLType;
  defaultValue?: any;
  description?: string;
}

export interface GraphQLType {
  kind: string;
  name?: string;
  ofType?: GraphQLType;
  fields?: GraphQLField[];
}

export interface GraphQLSchema {
  queryType: {
    name: string;
    fields: GraphQLField[];
  };
  mutationType?: {
    name: string;
    fields: GraphQLField[];
  };
  types: GraphQLType[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface QueryBuilderOptions {
  includeTypename?: boolean;
  maxDepth?: number;
  defaultDataPartition?: string;
}

export interface QueryTemplate {
  name: string;
  query: string;
  variables: Record<string, any>;
  description?: string;
}

export interface ServiceEndpoints {
  schema: string;
  entitlements: string;
  legal: string;
  search: string;
  storage: string;
  ai?: string;
  dataIngestion?: string;
  seismicIngestion?: string;
}

export interface ServiceApiKeys {
  schema: string;
  entitlements: string;
  legal: string;
  search: string;
  storage: string;
}

export interface APIError {
  service: string;
  operation: string;
  errorType: 'VALIDATION' | 'AUTHENTICATION' | 'NETWORK' | 'SERVER';
  message: string;
  suggestions: string[];
  details?: {
    missingArguments?: string[];
    invalidFields?: string[];
    requiredFields?: string[];
  };
}