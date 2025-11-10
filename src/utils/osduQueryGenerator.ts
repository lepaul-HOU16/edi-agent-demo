/**
 * OSDU Query Generator
 * 
 * Generates properly formatted OSDU query strings from structured criteria.
 * Handles string escaping, operator logic, and AND/OR combinations.
 */

export interface QueryCriterion {
  id: string;
  field: string;
  fieldType: 'string' | 'number' | 'date';
  operator: string;
  value: string | number | string[];
  logic: 'AND' | 'OR';
}

/**
 * Escapes special characters in string values for OSDU queries
 */
export function escapeQueryString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}

/**
 * Formats a value based on field type and operator
 */
export function formatQueryValue(
  value: string | number,
  fieldType: 'string' | 'number' | 'date',
  operator: string
): string {
  // Handle IN and NOT IN operators - expects comma-separated values
  if (operator === 'IN' || operator === 'NOT IN') {
    const values = String(value).split(',').map(v => v.trim());
    return `(${values.map(v => `"${escapeQueryString(v)}"`).join(', ')})`;
  }

  // Handle BETWEEN operator - expects two values
  if (operator === 'BETWEEN') {
    const values = String(value).split(',').map(v => v.trim());
    if (values.length !== 2) {
      throw new Error('BETWEEN operator requires exactly two values separated by comma');
    }
    if (fieldType === 'string') {
      return `"${escapeQueryString(values[0])}" AND "${escapeQueryString(values[1])}"`;
    }
    return `${values[0]} AND ${values[1]}`;
  }

  // Handle string values
  if (fieldType === 'string') {
    const strValue = String(value);
    
    // LIKE and NOT LIKE operators - handle wildcards
    if (operator === 'LIKE' || operator === 'NOT LIKE') {
      // Check if user provided wildcards (* or ?)
      const hasWildcards = strValue.includes('*') || strValue.includes('?');
      
      if (hasWildcards) {
        // Convert user wildcards to SQL wildcards
        // * becomes % (matches any sequence of characters)
        // ? becomes _ (matches any single character)
        const sqlWildcard = strValue
          .replace(/\*/g, '%')
          .replace(/\?/g, '_');
        return `"${escapeQueryString(sqlWildcard)}"`;
      } else {
        // No wildcards provided - add % on both sides for contains behavior
        return `"%${escapeQueryString(strValue)}%"`;
      }
    }
    
    // Regular string comparison
    return `"${escapeQueryString(strValue)}"`;
  }

  // Handle numeric values
  if (fieldType === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
    return String(numValue);
  }

  // Handle date values
  if (fieldType === 'date') {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }
    // Format as ISO date string
    return `"${dateValue.toISOString().split('T')[0]}"`;
  }

  return String(value);
}

/**
 * Generates a single criterion query string
 */
export function generateCriterionQuery(criterion: QueryCriterion): string {
  const { field, fieldType, operator, value } = criterion;

  try {
    const formattedValue = formatQueryValue(value, fieldType, operator);
    
    // Handle special operators
    if (operator === 'IN') {
      return `${field} IN ${formattedValue}`;
    }
    
    if (operator === 'NOT IN') {
      return `${field} NOT IN ${formattedValue}`;
    }
    
    if (operator === 'BETWEEN') {
      return `${field} BETWEEN ${formattedValue}`;
    }
    
    if (operator === 'LIKE') {
      return `${field} LIKE ${formattedValue}`;
    }
    
    if (operator === 'NOT LIKE') {
      return `${field} NOT LIKE ${formattedValue}`;
    }
    
    // Standard comparison operators
    return `${field} ${operator} ${formattedValue}`;
  } catch (error) {
    throw new Error(`Failed to generate query for field ${field}: ${error.message}`);
  }
}

/**
 * Groups criteria by logic operator for proper parentheses handling
 */
export function groupCriteriaByLogic(criteria: QueryCriterion[]): QueryCriterion[][] {
  if (criteria.length === 0) return [];
  if (criteria.length === 1) return [criteria];

  const groups: QueryCriterion[][] = [];
  let currentGroup: QueryCriterion[] = [criteria[0]];
  let currentLogic = criteria[1]?.logic || 'AND';

  for (let i = 1; i < criteria.length; i++) {
    const criterion = criteria[i];
    
    // If logic changes, start a new group
    if (criterion.logic !== currentLogic && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [criterion];
      currentLogic = criteria[i + 1]?.logic || criterion.logic;
    } else {
      currentGroup.push(criterion);
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Generates a complete OSDU query from multiple criteria with AND/OR logic
 * Implements proper parentheses grouping for mixed AND/OR operations
 */
export function generateOSDUQuery(criteria: QueryCriterion[]): string {
  if (criteria.length === 0) {
    return '';
  }

  // Single criterion - no grouping needed
  if (criteria.length === 1) {
    return generateCriterionQuery(criteria[0]);
  }

  // Group consecutive criteria with the same logic operator
  const groups: { logic: 'AND' | 'OR'; criteria: QueryCriterion[] }[] = [];
  let currentGroup: QueryCriterion[] = [criteria[0]];
  let currentLogic: 'AND' | 'OR' = criteria[1]?.logic || 'AND';

  for (let i = 1; i < criteria.length; i++) {
    const criterion = criteria[i];
    
    // If logic operator changes, finalize current group and start new one
    if (criterion.logic !== currentLogic) {
      groups.push({ logic: currentLogic, criteria: currentGroup });
      currentGroup = [criterion];
      currentLogic = criteria[i + 1]?.logic || criterion.logic;
    } else {
      currentGroup.push(criterion);
    }
  }
  
  // Add the last group
  if (currentGroup.length > 0) {
    groups.push({ logic: currentLogic, criteria: currentGroup });
  }

  // If all criteria use the same logic operator, no grouping needed
  if (groups.length === 1) {
    const parts: string[] = [];
    for (let i = 0; i < criteria.length; i++) {
      const criterionQuery = generateCriterionQuery(criteria[i]);
      if (i === 0) {
        parts.push(criterionQuery);
      } else {
        parts.push(`${criteria[i].logic} ${criterionQuery}`);
      }
    }
    return parts.join(' ');
  }

  // Multiple groups with different logic operators - add parentheses
  const groupQueries: string[] = [];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupParts: string[] = [];
    
    for (let j = 0; j < group.criteria.length; j++) {
      const criterion = group.criteria[j];
      const criterionQuery = generateCriterionQuery(criterion);
      
      if (j === 0) {
        groupParts.push(criterionQuery);
      } else {
        groupParts.push(`${group.logic} ${criterionQuery}`);
      }
    }
    
    // Wrap group in parentheses if it has multiple criteria
    const groupQuery = group.criteria.length > 1 
      ? `(${groupParts.join(' ')})`
      : groupParts.join(' ');
    
    groupQueries.push(groupQuery);
  }

  // Join groups with their respective logic operators
  const result: string[] = [groupQueries[0]];
  for (let i = 1; i < groupQueries.length; i++) {
    const logic = groups[i].logic;
    result.push(`${logic} ${groupQueries[i]}`);
  }

  return result.join(' ');
}

/**
 * Generates a formatted, multi-line OSDU query for display
 */
export function generateFormattedOSDUQuery(criteria: QueryCriterion[]): string {
  if (criteria.length === 0) {
    return '// Add criteria to build your query';
  }

  const parts: string[] = [];
  let indentLevel = 0;
  
  for (let i = 0; i < criteria.length; i++) {
    const criterion = criteria[i];
    const criterionQuery = generateCriterionQuery(criterion);
    
    if (i === 0) {
      parts.push(criterionQuery);
    } else {
      const logicOperator = criterion.logic;
      const prevLogic = i > 1 ? criteria[i - 1]?.logic : null;
      
      // Add newline and logic operator
      parts.push(`\n${logicOperator} ${criterionQuery}`);
    }
  }

  return parts.join('');
}

/**
 * Validates that a query string is properly formatted
 */
export function validateQuerySyntax(query: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query || query.trim().length === 0) {
    errors.push('Query cannot be empty');
    return { isValid: false, errors };
  }

  // Check for unmatched quotes
  const doubleQuotes = (query.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unmatched double quotes in query');
  }

  // Check for unmatched parentheses
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unmatched parentheses in query');
  }

  // Check for valid operators
  const validOperators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'BETWEEN', 'AND', 'OR'];
  const tokens = query.split(/\s+/);
  const operators = tokens.filter(token => 
    validOperators.includes(token.toUpperCase())
  );
  
  if (operators.length === 0 && !query.includes('=')) {
    errors.push('Query must contain at least one comparison operator');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Optimizes a query by removing redundant parentheses
 */
export function optimizeQuery(query: string): string {
  // Remove unnecessary outer parentheses
  let optimized = query.trim();
  
  while (optimized.startsWith('(') && optimized.endsWith(')')) {
    // Check if these are matching outer parentheses
    let depth = 0;
    let isOuterPair = true;
    
    for (let i = 0; i < optimized.length; i++) {
      if (optimized[i] === '(') depth++;
      if (optimized[i] === ')') depth--;
      
      // If depth reaches 0 before the end, these aren't outer parentheses
      if (depth === 0 && i < optimized.length - 1) {
        isOuterPair = false;
        break;
      }
    }
    
    if (isOuterPair) {
      optimized = optimized.slice(1, -1).trim();
    } else {
      break;
    }
  }
  
  return optimized;
}
