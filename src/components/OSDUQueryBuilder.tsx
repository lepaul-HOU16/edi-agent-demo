
import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  FormField,
  Select,
  Input,
  Button,
  Box,
  ExpandableSection,
  Tabs,
  Badge,
  Alert,
  ColumnLayout,
  Modal,
  Grid,
  Popover,
  Icon
} from '@cloudscape-design/components';
import { 
  generateFormattedOSDUQuery,
  generateOSDUQuery,
  validateQuerySyntax,
  optimizeQuery
} from '@/utils/osduQueryGenerator';
import {
  getAllTemplates,
  saveCustomTemplate,
  validateTemplate,
  type QueryTemplate
} from '@/utils/osduQueryTemplates';
import { OSDUTemplateSelector } from './OSDUTemplateSelector';
import { OSDUQueryHistory } from './OSDUQueryHistory';
import { OSDURangeInput } from './OSDURangeInput';
import { OSDUMultiSelect } from './OSDUMultiSelect';
import { OSDUQueryBuilderAnalyticsDashboard } from './OSDUQueryBuilderAnalyticsDashboard';
import { QueryHistory, QueryHistoryItem } from '@/utils/queryHistory';
import {
  getAutocompleteValues,
  hasAutocompleteData,
  getSuggestedValues,
  filterAutocompleteValues
} from '@/utils/osduAutocompleteData';
import { QueryBuilderAnalytics } from '@/utils/queryBuilderAnalytics';

export interface QueryCriterion {
  id: string;
  field: string;
  fieldType: 'string' | 'number' | 'date';
  operator: string;
  value: string | number | string[];
  logic: 'AND' | 'OR';
  isValid: boolean;
  errorMessage?: string;
}

interface QueryBuilderProps {
  onExecute: (query: string, criteria: QueryCriterion[]) => void;
  onClose: () => void;
}

interface FieldDefinition {
  value: string;
  label: string;
  type: 'string' | 'number' | 'date';
  description?: string;
  autocompleteValues?: string[];
  helpText?: string;
  examples?: string[];
}

interface OperatorDefinition {
  value: string;
  label: string;
  description?: string;
  helpText?: string;
  examples?: string[];
}

/**
 * Applies syntax highlighting to OSDU query string
 * Highlights keywords, operators, field names, and values
 */
const syntaxHighlightQuery = (query: string): string => {
  if (!query || query.startsWith('//')) {
    return `<span style="color: #6a9955; font-style: italic;">${query}</span>`;
  }

  let highlighted = query;

  // Highlight logical operators (AND, OR)
  highlighted = highlighted.replace(
    /\b(AND|OR)\b/g,
    '<span style="color: #c586c0; font-weight: bold;">$1</span>'
  );

  // Highlight comparison operators
  highlighted = highlighted.replace(
    /\s(=|!=|>|<|>=|<=|LIKE|IN|BETWEEN)\s/g,
    ' <span style="color: #d4d4d4; font-weight: bold;">$1</span> '
  );

  // Highlight field names (data.*)
  highlighted = highlighted.replace(
    /\b(data\.\w+)/g,
    '<span style="color: #4ec9b0;">$1</span>'
  );

  // Highlight string values (quoted text)
  highlighted = highlighted.replace(
    /"([^"]*)"/g,
    '<span style="color: #ce9178;">"$1"</span>'
  );

  // Highlight numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color: #b5cea8;">$1</span>'
  );

  // Highlight parentheses
  highlighted = highlighted.replace(
    /([()])/g,
    '<span style="color: #ffd700; font-weight: bold;">$1</span>'
  );

  return highlighted;
};

export const OSDUQueryBuilder: React.FC<QueryBuilderProps> = ({
  onExecute,
  onClose
}) => {
  const [dataType, setDataType] = useState<string>('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([]);
  const [queryPreview, setQueryPreview] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [saveTemplateError, setSaveTemplateError] = useState<string>('');
  const [showQueryHistory, setShowQueryHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Track query builder open event on mount
  useEffect(() => {
    QueryBuilderAnalytics.trackEvent('open', {
      dataType,
      timestamp: new Date().toISOString()
    });

    // Track close event on unmount
    return () => {
      QueryBuilderAnalytics.trackEvent('close', {
        criteriaCount: criteria.length,
        timestamp: new Date().toISOString()
      });
    };
  }, []); // Only run on mount/unmount

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse advanced options on mobile
      if (window.innerWidth < 768) {
        setShowAdvancedOptions(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Field definitions by data type with autocomplete values from centralized data source
  const fieldsByType: Record<string, FieldDefinition[]> = {
    well: [
      { 
        value: 'data.operator', 
        label: 'Operator', 
        type: 'string',
        description: 'Operating company name',
        helpText: 'The company that operates the well. Use this to find all wells operated by a specific company.',
        examples: ['Shell', 'BP', 'Equinor', 'TotalEnergies'],
        autocompleteValues: getAutocompleteValues('data.operator')
      },
      { 
        value: 'data.country', 
        label: 'Country', 
        type: 'string',
        description: 'Country where well is located',
        helpText: 'The country where the well is geographically located. Useful for regional searches.',
        examples: ['Norway', 'United States', 'Brazil', 'United Kingdom'],
        autocompleteValues: getAutocompleteValues('data.country')
      },
      { 
        value: 'data.basin', 
        label: 'Basin', 
        type: 'string',
        description: 'Geological basin',
        helpText: 'The geological basin where the well is located. Basins are large-scale geological structures.',
        examples: ['North Sea', 'Gulf of Mexico', 'Permian Basin', 'Santos Basin'],
        autocompleteValues: getAutocompleteValues('data.basin')
      },
      { 
        value: 'data.wellName', 
        label: 'Well Name', 
        type: 'string',
        description: 'Name or identifier of the well',
        helpText: 'The unique name or identifier for the well. Use wildcards (* or ?) for partial matches.',
        examples: ['WELL-001', 'North*', '?-15H']
      },
      { 
        value: 'data.depth', 
        label: 'Depth (m)', 
        type: 'number',
        description: 'Total depth in meters',
        helpText: 'The total measured depth of the well in meters. Use comparison operators to find wells within depth ranges.',
        examples: ['3000', '5000', '1000, 4000 (for BETWEEN)']
      },
      { 
        value: 'data.status', 
        label: 'Status', 
        type: 'string',
        description: 'Current well status',
        helpText: 'The operational status of the well. Common values include Active, Inactive, Abandoned, Drilling.',
        examples: ['Active', 'Inactive', 'Abandoned', 'Drilling'],
        autocompleteValues: getAutocompleteValues('data.status')
      },
      { 
        value: 'data.wellType', 
        label: 'Well Type', 
        type: 'string',
        description: 'Type of well',
        helpText: 'The classification of the well based on its purpose. Common types include Production, Exploration, Injection.',
        examples: ['Production', 'Exploration', 'Injection', 'Observation'],
        autocompleteValues: getAutocompleteValues('data.wellType')
      }
    ],
    wellbore: [
      { 
        value: 'data.wellboreName', 
        label: 'Wellbore Name', 
        type: 'string', 
        description: 'Wellbore identifier',
        helpText: 'The unique identifier for the wellbore. A well may have multiple wellbores.',
        examples: ['WB-001', 'Main*', 'Sidetrack-?']
      },
      { 
        value: 'data.wellboreType', 
        label: 'Wellbore Type', 
        type: 'string', 
        description: 'Type of wellbore',
        helpText: 'The classification of the wellbore. Common types include Vertical, Horizontal, Deviated, Sidetrack.',
        examples: ['Vertical', 'Horizontal', 'Deviated', 'Sidetrack'],
        autocompleteValues: getAutocompleteValues('data.wellboreType')
      },
      { 
        value: 'data.md', 
        label: 'Measured Depth (m)', 
        type: 'number', 
        description: 'Measured depth along wellbore',
        helpText: 'The measured depth along the wellbore path in meters. For deviated wells, this differs from true vertical depth.',
        examples: ['2500', '4000', '1000, 3000 (for BETWEEN)']
      },
      { 
        value: 'data.tvd', 
        label: 'True Vertical Depth (m)', 
        type: 'number', 
        description: 'True vertical depth',
        helpText: 'The true vertical depth from surface in meters. This is the straight-line depth regardless of wellbore trajectory.',
        examples: ['2000', '3500', '800, 2500 (for BETWEEN)']
      }
    ],
    log: [
      { 
        value: 'data.logType', 
        label: 'Log Type', 
        type: 'string', 
        description: 'Type of well log',
        helpText: 'The type of well log measurement. Common types include Gamma Ray, Resistivity, Density, Neutron.',
        examples: ['Gamma Ray', 'Resistivity', 'Density', 'Neutron'],
        autocompleteValues: getAutocompleteValues('data.logType')
      },
      { 
        value: 'data.logName', 
        label: 'Log Name', 
        type: 'string', 
        description: 'Log identifier',
        helpText: 'The unique name or identifier for the log run.',
        examples: ['GR-001', 'Resistivity*', 'LWD-?']
      },
      { 
        value: 'data.curveCount', 
        label: 'Curve Count', 
        type: 'number', 
        description: 'Number of curves in log',
        helpText: 'The total number of measurement curves contained in the log file.',
        examples: ['5', '10', '3, 15 (for BETWEEN)']
      },
      { 
        value: 'data.topDepth', 
        label: 'Top Depth (m)', 
        type: 'number', 
        description: 'Top depth of log',
        helpText: 'The shallowest depth where log measurements begin, in meters.',
        examples: ['1000', '500', '0, 2000 (for BETWEEN)']
      },
      { 
        value: 'data.bottomDepth', 
        label: 'Bottom Depth (m)', 
        type: 'number', 
        description: 'Bottom depth of log',
        helpText: 'The deepest depth where log measurements end, in meters.',
        examples: ['3000', '5000', '2000, 6000 (for BETWEEN)']
      }
    ],
    seismic: [
      { 
        value: 'data.surveyName', 
        label: 'Survey Name', 
        type: 'string', 
        description: 'Seismic survey identifier',
        helpText: 'The unique name or identifier for the seismic survey.',
        examples: ['Survey-2023', 'North*', '3D-?']
      },
      { 
        value: 'data.surveyType', 
        label: 'Survey Type', 
        type: 'string', 
        description: 'Type of seismic survey',
        helpText: 'The classification of the seismic survey. Common types include 2D, 3D, 4D, VSP.',
        examples: ['2D', '3D', '4D', 'VSP'],
        autocompleteValues: getAutocompleteValues('data.surveyType')
      },
      { 
        value: 'data.acquisitionDate', 
        label: 'Acquisition Date', 
        type: 'date', 
        description: 'Date survey was acquired',
        helpText: 'The date when the seismic survey was acquired. Use YYYY-MM-DD format.',
        examples: ['2023-01-15', '2022-06-30', '2020-01-01, 2023-12-31 (for BETWEEN)']
      }
    ]
  };

  // Operators by field type
  const operatorsByType: Record<string, OperatorDefinition[]> = {
    string: [
      { 
        value: '=', 
        label: 'Equals', 
        description: 'Exact match',
        helpText: 'Finds records where the field exactly matches the specified value. Case-sensitive.',
        examples: ['data.operator = "Shell"', 'data.country = "Norway"']
      },
      { 
        value: '!=', 
        label: 'Not Equals', 
        description: 'Does not match',
        helpText: 'Finds records where the field does not match the specified value.',
        examples: ['data.status != "Abandoned"', 'data.operator != "Unknown"']
      },
      { 
        value: 'LIKE', 
        label: 'Contains', 
        description: 'Partial match. Use * for any characters, ? for single character',
        helpText: 'Finds records where the field contains the pattern. Use * for multiple characters, ? for single character.',
        examples: ['data.wellName LIKE "North*"', 'data.operator LIKE "?hell"']
      },
      { 
        value: 'NOT LIKE', 
        label: 'Does Not Contain', 
        description: 'Excludes partial matches',
        helpText: 'Finds records where the field does not contain the pattern. Supports wildcards.',
        examples: ['data.wellName NOT LIKE "*Test*"', 'data.basin NOT LIKE "Temp*"']
      },
      { 
        value: 'IN', 
        label: 'In List', 
        description: 'Matches any value in list',
        helpText: 'Finds records where the field matches any value in the comma-separated list.',
        examples: ['data.operator IN ("Shell", "BP", "Equinor")', 'data.country IN ("Norway", "UK")']
      },
      { 
        value: 'NOT IN', 
        label: 'Not In List', 
        description: 'Excludes all values in list',
        helpText: 'Finds records where the field does not match any value in the list.',
        examples: ['data.status NOT IN ("Abandoned", "Inactive")', 'data.wellType NOT IN ("Test", "Temporary")']
      }
    ],
    number: [
      { 
        value: '=', 
        label: 'Equals', 
        description: 'Exact value',
        helpText: 'Finds records where the field exactly equals the specified number.',
        examples: ['data.depth = 3000', 'data.curveCount = 5']
      },
      { 
        value: '!=', 
        label: 'Not Equals', 
        description: 'Different value',
        helpText: 'Finds records where the field does not equal the specified number.',
        examples: ['data.depth != 0', 'data.curveCount != 1']
      },
      { 
        value: '>', 
        label: 'Greater Than', 
        description: 'Larger than value',
        helpText: 'Finds records where the field is greater than the specified number.',
        examples: ['data.depth > 3000', 'data.md > 2500']
      },
      { 
        value: '<', 
        label: 'Less Than', 
        description: 'Smaller than value',
        helpText: 'Finds records where the field is less than the specified number.',
        examples: ['data.depth < 5000', 'data.topDepth < 1000']
      },
      { 
        value: '>=', 
        label: 'Greater or Equal', 
        description: 'Larger than or equal to value',
        helpText: 'Finds records where the field is greater than or equal to the specified number.',
        examples: ['data.depth >= 3000', 'data.curveCount >= 3']
      },
      { 
        value: '<=', 
        label: 'Less or Equal', 
        description: 'Smaller than or equal to value',
        helpText: 'Finds records where the field is less than or equal to the specified number.',
        examples: ['data.depth <= 5000', 'data.bottomDepth <= 4000']
      },
      { 
        value: 'BETWEEN', 
        label: 'Between', 
        description: 'Between two values (comma-separated)',
        helpText: 'Finds records where the field is between two numbers (inclusive). Enter as: min, max',
        examples: ['data.depth BETWEEN 1000 AND 5000', 'data.md BETWEEN 2000 AND 4000']
      }
    ],
    date: [
      { 
        value: '=', 
        label: 'On Date', 
        description: 'Exact date match',
        helpText: 'Finds records where the date exactly matches the specified date. Use YYYY-MM-DD format.',
        examples: ['data.acquisitionDate = "2023-01-15"']
      },
      { 
        value: '>', 
        label: 'After', 
        description: 'Later than date',
        helpText: 'Finds records where the date is after the specified date.',
        examples: ['data.acquisitionDate > "2022-01-01"']
      },
      { 
        value: '<', 
        label: 'Before', 
        description: 'Earlier than date',
        helpText: 'Finds records where the date is before the specified date.',
        examples: ['data.acquisitionDate < "2024-01-01"']
      },
      { 
        value: '>=', 
        label: 'On or After', 
        description: 'On or later than date',
        helpText: 'Finds records where the date is on or after the specified date.',
        examples: ['data.acquisitionDate >= "2023-01-01"']
      },
      { 
        value: '<=', 
        label: 'On or Before', 
        description: 'On or earlier than date',
        helpText: 'Finds records where the date is on or before the specified date.',
        examples: ['data.acquisitionDate <= "2023-12-31"']
      },
      { 
        value: 'BETWEEN', 
        label: 'Between Dates', 
        description: 'Between two dates (comma-separated)',
        helpText: 'Finds records where the date is between two dates (inclusive). Enter as: start-date, end-date',
        examples: ['data.acquisitionDate BETWEEN "2022-01-01" AND "2023-12-31"']
      }
    ]
  };

  // Query templates
  const templates: Record<string, { name: string; dataType: string; criteria: Omit<QueryCriterion, 'id' | 'isValid'>[] }> = {
    wellsByOperator: {
      name: 'Wells by Operator',
      dataType: 'well',
      criteria: [{
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }]
    },
    wellsByLocation: {
      name: 'Wells by Location',
      dataType: 'well',
      criteria: [{
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }]
    },
    wellsByDepth: {
      name: 'Wells by Depth Range',
      dataType: 'well',
      criteria: [
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>',
          value: '',
          logic: 'AND'
        },
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '<',
          value: '',
          logic: 'AND'
        }
      ]
    },
    logsByType: {
      name: 'Logs by Type',
      dataType: 'log',
      criteria: [{
        field: 'data.logType',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }]
    },
    activeWells: {
      name: 'Active Production Wells',
      dataType: 'well',
      criteria: [
        {
          field: 'data.status',
          fieldType: 'string',
          operator: '=',
          value: 'Active',
          logic: 'AND'
        },
        {
          field: 'data.wellType',
          fieldType: 'string',
          operator: '=',
          value: 'Production',
          logic: 'AND'
        }
      ]
    }
  };

  // Validate a single criterion
  const validateCriterion = (criterion: QueryCriterion): { isValid: boolean; errorMessage?: string } => {
    // Check if value is empty
    if (criterion.value === '' || criterion.value === null || criterion.value === undefined) {
      return { isValid: false, errorMessage: 'Value is required' };
    }

    // Validate IN and NOT IN operators - requires comma-separated values
    if (criterion.operator === 'IN' || criterion.operator === 'NOT IN') {
      const values = String(criterion.value).split(',').map(v => v.trim()).filter(v => v.length > 0);
      if (values.length === 0) {
        return { isValid: false, errorMessage: `${criterion.operator} operator requires at least one value` };
      }
      if (values.length === 1 && !String(criterion.value).includes(',')) {
        return { isValid: false, errorMessage: 'Use comma to separate multiple values (e.g., Shell, BP, Equinor)' };
      }
    }

    // Validate BETWEEN operator - requires exactly two values
    if (criterion.operator === 'BETWEEN') {
      const values = String(criterion.value).split(',').map(v => v.trim()).filter(v => v.length > 0);
      if (values.length !== 2) {
        return { isValid: false, errorMessage: 'BETWEEN requires exactly two values (e.g., 1000, 5000)' };
      }
      
      // For numeric fields, validate both values are numbers
      if (criterion.fieldType === 'number') {
        const num1 = Number(values[0]);
        const num2 = Number(values[1]);
        if (isNaN(num1) || isNaN(num2)) {
          return { isValid: false, errorMessage: 'Both values must be valid numbers' };
        }
        if (num1 >= num2) {
          return { isValid: false, errorMessage: 'First value must be less than second value' };
        }
      }
      
      // For date fields, validate both values are dates
      if (criterion.fieldType === 'date') {
        const date1 = new Date(values[0]);
        const date2 = new Date(values[1]);
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
          return { isValid: false, errorMessage: 'Both values must be valid dates (YYYY-MM-DD)' };
        }
        if (date1 >= date2) {
          return { isValid: false, errorMessage: 'Start date must be before end date' };
        }
      }
    }

    // Validate number fields
    if (criterion.fieldType === 'number' && criterion.operator !== 'IN' && criterion.operator !== 'BETWEEN') {
      const numValue = Number(criterion.value);
      if (isNaN(numValue)) {
        return { isValid: false, errorMessage: 'Must be a valid number' };
      }
      if (numValue < 0) {
        return { isValid: false, errorMessage: 'Must be a positive number' };
      }
    }

    // Validate date fields
    if (criterion.fieldType === 'date' && criterion.operator !== 'BETWEEN') {
      const dateValue = new Date(String(criterion.value));
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, errorMessage: 'Must be a valid date (YYYY-MM-DD)' };
      }
      
      // Check date format
      const dateStr = String(criterion.value);
      const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateFormatRegex.test(dateStr)) {
        return { isValid: false, errorMessage: 'Date must be in YYYY-MM-DD format' };
      }
    }

    // Validate string fields
    if (criterion.fieldType === 'string' && criterion.operator !== 'IN') {
      const strValue = String(criterion.value).trim();
      if (strValue.length === 0) {
        return { isValid: false, errorMessage: 'Value cannot be empty' };
      }
      if (strValue.length > 100) {
        return { isValid: false, errorMessage: 'Value too long (max 100 characters)' };
      }
      
      // LIKE operator supports wildcards: * (any characters) and ? (single character)
      // No validation needed - wildcards are allowed
    }

    return { isValid: true };
  };

  // Validate all criteria
  const validateQuery = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (criteria.length === 0) {
      errors.push('At least one filter criterion is required');
      return { isValid: false, errors };
    }

    criteria.forEach((criterion, index) => {
      const validation = validateCriterion(criterion);
      if (!validation.isValid) {
        errors.push(`Criterion ${index + 1}: ${validation.errorMessage}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  // Generate query preview with validation using the query generator utility
  const generateQuery = (criteriaList: QueryCriterion[]): string => {
    if (criteriaList.length === 0) {
      return '// Add criteria to build your query';
    }

    try {
      // Use the query generator utility for proper formatting and escaping
      return generateFormattedOSDUQuery(criteriaList);
    } catch (error) {
      console.error('Query generation error:', error);
      return `// Error generating query: ${error.message}`;
    }
  };

  // Update query preview whenever criteria change
  useEffect(() => {
    const query = generateQuery(criteria);
    setQueryPreview(query);

    // Validate and update criteria
    const updatedCriteria = criteria.map(c => {
      const validation = validateCriterion(c);
      return {
        ...c,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage
      };
    });
    setCriteria(updatedCriteria);

    // Update validation errors
    const validation = validateQuery();
    setValidationErrors(validation.errors);
  }, [criteria.map(c => `${c.field}-${c.operator}-${c.value}-${c.logic}`).join('|')]);

  const addCriterion = () => {
    const firstField = fieldsByType[dataType][0];
    const newCriterion: QueryCriterion = {
      id: Date.now().toString(),
      field: firstField.value,
      fieldType: firstField.type,
      operator: operatorsByType[firstField.type][0].value,
      value: '',
      logic: 'AND',
      isValid: false,
      errorMessage: 'Value is required'
    };
    setCriteria([...criteria, newCriterion]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, updates: Partial<QueryCriterion>) => {
    setCriteria(criteria.map(c => {
      if (c.id !== id) return c;

      const updated = { ...c, ...updates };

      // If field changed, update fieldType and reset operator
      if (updates.field) {
        const fieldDef = fieldsByType[dataType].find(f => f.value === updates.field);
        if (fieldDef) {
          updated.fieldType = fieldDef.type;
          updated.operator = operatorsByType[fieldDef.type][0].value;
          updated.value = ''; // Reset value when field changes

          // Track field change
          QueryBuilderAnalytics.trackEvent('field_change', {
            field: updates.field,
            fieldLabel: fieldDef.label,
            dataType: fieldDef.type
          });
        }
      }

      // If operator changed to IN/NOT IN or BETWEEN, provide hint
      if ((updates.operator === 'IN' || updates.operator === 'NOT IN') && typeof updated.value === 'string' && !updated.value.includes(',')) {
        updated.errorMessage = 'Enter comma-separated values (e.g., Shell, BP, Equinor)';
      }
      
      if (updates.operator === 'BETWEEN' && typeof updated.value === 'string' && !updated.value.includes(',')) {
        updated.errorMessage = 'Enter two comma-separated values (e.g., 1000, 5000)';
      }

      // Track operator change
      if (updates.operator) {
        QueryBuilderAnalytics.trackEvent('operator_change', {
          field: c.field,
          operator: updates.operator,
          fieldType: updated.fieldType
        });
      }

      return updated;
    }));
  };

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      setDataType(template.dataType);
      setCriteria(template.criteria.map((c, index) => ({
        ...c,
        id: `${Date.now()}-${index}`,
        isValid: c.value !== '',
        errorMessage: c.value === '' ? 'Value is required' : undefined
      })));
      setSelectedTemplate(templateKey);

      // Track template selection
      QueryBuilderAnalytics.trackEvent('template_select', {
        templateId: templateKey,
        templateName: template.name,
        dataType: template.dataType,
        criteriaCount: template.criteria.length
      });
    }
  };

  const handleSelectTemplate = (template: QueryTemplate) => {
    setDataType(template.dataType);
    setCriteria(template.criteria.map((c, index) => ({
      ...c,
      id: `${Date.now()}-${index}`,
      isValid: c.value !== '',
      errorMessage: c.value === '' ? 'Value is required' : undefined
    })));
    setSelectedTemplate(template.id);
    setShowTemplateSelector(false);

    // Track template selection
    QueryBuilderAnalytics.trackEvent('template_select', {
      templateId: template.id,
      templateName: template.name,
      dataType: template.dataType,
      criteriaCount: template.criteria.length,
      category: template.category
    });
  };

  const handleSaveAsTemplate = () => {
    setSaveTemplateError('');
    
    // Validate current query
    const validation = validateQuery();
    if (!validation.isValid) {
      setSaveTemplateError('Cannot save template with invalid criteria. Please fix validation errors first.');
      return;
    }

    // Show save modal
    setShowSaveTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    setSaveTemplateError('');

    // Validate template data
    const templateData = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      dataType: dataType as 'well' | 'wellbore' | 'log' | 'seismic',
      category: 'custom' as const,
      criteria: criteria.map(c => ({
        field: c.field,
        fieldType: c.fieldType,
        operator: c.operator,
        value: c.value,
        logic: c.logic
      })),
      tags: templateTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    };

    const validation = validateTemplate(templateData);
    if (!validation.isValid) {
      setSaveTemplateError(validation.errors.join(', '));
      return;
    }

    try {
      const savedTemplate = saveCustomTemplate(templateData);
      
      // Reset form and close modal
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags('');
      setShowSaveTemplateModal(false);
      
      // Show success message
      alert(`Template "${savedTemplate.name}" saved successfully!`);
    } catch (error) {
      setSaveTemplateError(error.message);
    }
  };

  const executeQuery = () => {
    const validation = validateQuery();
    if (validation.isValid) {
      // Generate optimized single-line query for execution
      const executionQuery = optimizeQuery(generateOSDUQuery(criteria));
      
      // Validate the generated query syntax
      const syntaxValidation = validateQuerySyntax(executionQuery);
      if (!syntaxValidation.isValid) {
        console.error('Query syntax validation failed:', syntaxValidation.errors);
        setValidationErrors(syntaxValidation.errors);

        // Track query error
        QueryBuilderAnalytics.trackEvent('query_error', {
          errorType: 'syntax_validation',
          errors: syntaxValidation.errors,
          query: executionQuery
        });
        return;
      }
      
      // Save to query history (result count will be updated after execution)
      QueryHistory.save({
        query: executionQuery,
        dataType,
        criteria: criteria.map(c => ({
          id: c.id,
          field: c.field,
          operator: c.operator,
          value: c.value,
          logic: c.logic
        }))
      });

      // Track query execution event (metrics will be tracked by the executor)
      QueryBuilderAnalytics.trackEvent('query_execute', {
        query: executionQuery,
        dataType,
        criteriaCount: criteria.length,
        templateUsed: selectedTemplate || undefined
      });
      
      onExecute(executionQuery, criteria);
    }
  };

  const handleLoadHistoryQuery = (item: QueryHistoryItem) => {
    // Load the query from history
    setDataType(item.dataType);
    setCriteria(item.criteria.map(c => {
      const fieldDef = fieldsByType[item.dataType].find(f => f.value === c.field);
      return {
        ...c,
        fieldType: fieldDef?.type || 'string',
        isValid: true
      };
    }));
    setShowQueryHistory(false);
  };

  const isQueryValid = () => {
    return criteria.length > 0 && criteria.every(c => c.isValid);
  };

  const getFieldDefinition = (fieldValue: string): FieldDefinition | undefined => {
    return fieldsByType[dataType].find(f => f.value === fieldValue);
  };

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to execute query
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isQueryValid()) {
        e.preventDefault();
        executeQuery();
      }
      // Ctrl/Cmd + N to add new criterion
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && criteria.length < 10) {
        e.preventDefault();
        addCriterion();
      }
      // Ctrl/Cmd + H to toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowQueryHistory(!showQueryHistory);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMobile, isQueryValid, criteria.length, showQueryHistory]);

  return (
    <div style={{ 
      width: '100%',
      // Ensure touch-friendly spacing on mobile
      padding: isMobile ? '8px' : '0'
    }}>
      <SpaceBetween size={isMobile ? 'm' : 'l'}>
        {/* Help Button */}
        <Box float="right">
          <Button
            onClick={() => setShowHelpModal(true)}
            iconName="status-info"
            variant="icon"
            ariaLabel="Open query builder help"
          />
        </Box>

        {/* Validation Status Alert */}
        {criteria.length === 0 ? (
          <Alert type="info">
            <strong>Getting Started:</strong> Add criteria below or select a template to build your query. 
            All queries are validated in real-time to ensure they will execute successfully.
          </Alert>
        ) : isQueryValid() ? (
          <Alert type="success">
            <strong>✓ Query Valid:</strong> Your query has been validated and is ready to execute. 
            All {criteria.length} {criteria.length === 1 ? 'criterion is' : 'criteria are'} properly formatted.
          </Alert>
        ) : validationErrors.length >= 3 ? (
          <Alert 
            type="error"
            header="Multiple Validation Errors Detected"
            action={
              <Button onClick={() => setShowHelpModal(true)} iconName="status-info">
                Get Help
              </Button>
            }
          >
            <SpaceBetween size="s">
              <Box variant="p">
                Your query has {validationErrors.length} errors. This usually means:
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Missing values in one or more criteria</li>
                <li>Incorrect format for numbers or dates</li>
                <li>Wrong operator for the field type</li>
              </ul>
              <Box variant="p">
                <strong>Quick Fix:</strong> Look for red badges (✗) next to each criterion below. 
                Each badge shows what needs to be fixed.
              </Box>
              <Box variant="p">
                <strong>Need more help?</strong> Click "Get Help" above to open the complete guide, 
                or try starting with a template instead.
              </Box>
            </SpaceBetween>
          </Alert>
        ) : (
          <Alert type="warning">
            <strong>⚠ Validation Required:</strong> Your query has {validationErrors.length} {validationErrors.length === 1 ? 'error' : 'errors'} that must be fixed before execution. 
            Check the criteria below for red error badges (✗).
          </Alert>
        )}

        {/* Advanced Options - Collapsible on Mobile */}


        {/* Quick Start Templates */}
        <FormField 
          label="Quick Start Templates"
          description="Common pre-built queries"
        >
          <Select
            selectedOption={
              selectedTemplate && templates[selectedTemplate]
                ? {
                    value: selectedTemplate,
                    label: templates[selectedTemplate].name,
                    description: `${templates[selectedTemplate].criteria.length} ${templates[selectedTemplate].criteria.length === 1 ? 'criterion' : 'criteria'} • ${templates[selectedTemplate].dataType.charAt(0).toUpperCase() + templates[selectedTemplate].dataType.slice(1)} data`
                  }
                : null
            }
            onChange={({ detail }) => {
              if (detail.selectedOption.value) {
                applyTemplate(detail.selectedOption.value);
              }
            }}
            options={Object.entries(templates).map(([key, template]) => ({
              value: key,
              label: template.name,
              description: `${template.criteria.length} ${template.criteria.length === 1 ? 'criterion' : 'criteria'} • ${template.dataType.charAt(0).toUpperCase() + template.dataType.slice(1)} data`
            }))}
            placeholder="Select a template to get started..."
            filteringType="auto"
          />
        </FormField>

        {/* Data Type Selector */}
        <FormField
          label="Data Type"
          description="Select the type of OSDU data to search"
        >
          <Select
            selectedOption={{ 
              value: dataType, 
              label: dataType.charAt(0).toUpperCase() + dataType.slice(1),
              description: `${fieldsByType[dataType].length} searchable fields`
            }}
            onChange={({ detail }) => {
              setDataType(detail.selectedOption.value!);
              setCriteria([]); // Clear criteria when changing data type
            }}
            options={Object.keys(fieldsByType).map(type => ({
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1),
              description: `${fieldsByType[type].length} searchable fields`
            }))}
          />
        </FormField>

        {/* Filter Criteria */}
        <SpaceBetween size="m">
          <Header
            variant="h3"
            description="Add multiple criteria with AND/OR logic"
            counter={`(${criteria.length})`}
            actions={
              <Button 
                onClick={addCriterion} 
                iconName="add-plus"
                disabled={criteria.length >= 10}
              >
                Add Criterion
              </Button>
            }
          >
            Filter Criteria
          </Header>

          {criteria.length === 0 && (
            <Alert type="info">
              Click "Add Criterion" to start building your query, or select a template above.
            </Alert>
          )}

          {criteria.map((criterion, index) => {
            const fieldDef = getFieldDefinition(criterion.field);
            const hasAutocomplete = fieldDef?.autocompleteValues && fieldDef.autocompleteValues.length > 0;

            return (
              <Container key={criterion.id}>
                <SpaceBetween size="s">
                  {/* Responsive layout: stacked on mobile, 4 columns on desktop */}
                  <Grid
                    gridDefinition={
                      isMobile
                        ? [
                            { colspan: 12 }, // Field
                            { colspan: 12 }, // Operator
                            { colspan: 12 }, // Value
                            { colspan: 12 }  // Actions
                          ]
                        : [
                            { colspan: 3 }, // Field
                            { colspan: 3 }, // Operator
                            { colspan: 4 }, // Value
                            { colspan: 2 }  // Actions
                          ]
                    }
                  >
                    {/* Field Selector */}
                    <FormField 
                      label={
                        <Box display="inline">
                          <span>Field</span>
                          {fieldDef?.helpText && (
                            <Popover
                              dismissButton={false}
                              position="top"
                              size="medium"
                              triggerType="custom"
                              content={
                                <SpaceBetween size="xs">
                                  <Box variant="p">
                                    <strong>{fieldDef.label}:</strong> {fieldDef.helpText}
                                  </Box>
                                  {fieldDef.examples && fieldDef.examples.length > 0 && (
                                    <Box variant="small">
                                      <strong>Examples:</strong>
                                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                                        {fieldDef.examples.map((ex, i) => (
                                          <li key={i}>{ex}</li>
                                        ))}
                                      </ul>
                                    </Box>
                                  )}
                                </SpaceBetween>
                              }
                            >
                              <Icon name="status-info" variant="link" />
                            </Popover>
                          )}
                        </Box>
                      }
                      description={isMobile ? undefined : fieldDef?.description}
                    >
                      <Select
                        selectedOption={fieldsByType[dataType].find(f => f.value === criterion.field)}
                        onChange={({ detail }) =>
                          updateCriterion(criterion.id, { field: detail.selectedOption.value! })
                        }
                        options={fieldsByType[dataType]}
                        {...(isMobile && { 
                          // Use native controls on mobile for better UX
                          filteringType: "auto"
                        })}
                      />
                    </FormField>

                    {/* Operator Selector */}
                    <FormField 
                      label={
                        <Box display="inline">
                          <span>Operator</span>
                          {(() => {
                            const operatorDef = operatorsByType[criterion.fieldType].find(o => o.value === criterion.operator);
                            return operatorDef?.helpText && (
                              <Popover
                                dismissButton={false}
                                position="top"
                                size="medium"
                                triggerType="custom"
                                content={
                                  <SpaceBetween size="xs">
                                    <Box variant="p">
                                      <strong>{operatorDef.label}:</strong> {operatorDef.helpText}
                                    </Box>
                                    {operatorDef.examples && operatorDef.examples.length > 0 && (
                                      <Box variant="small">
                                        <strong>Usage Examples:</strong>
                                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                                          {operatorDef.examples.map((ex, i) => (
                                            <li key={i}><code>{ex}</code></li>
                                          ))}
                                        </ul>
                                      </Box>
                                    )}
                                  </SpaceBetween>
                                }
                              >
                                <Icon name="status-info" variant="link" />
                              </Popover>
                            );
                          })()}
                        </Box>
                      }
                      description={isMobile ? undefined : operatorsByType[criterion.fieldType].find(o => o.value === criterion.operator)?.description}
                    >
                      <Select
                        selectedOption={operatorsByType[criterion.fieldType].find(o => o.value === criterion.operator)}
                        onChange={({ detail }) =>
                          updateCriterion(criterion.id, { operator: detail.selectedOption.value! })
                        }
                        options={operatorsByType[criterion.fieldType]}
                      />
                    </FormField>

                    {/* Value Input */}
                    <FormField
                      label="Value"
                      errorText={!criterion.isValid ? criterion.errorMessage : undefined}
                      description={
                        isMobile ? undefined :
                        criterion.operator === 'IN' || criterion.operator === 'NOT IN' ? 'Select multiple values or type and press Enter' :
                        criterion.operator === 'BETWEEN' ? 'Enter minimum and maximum values' :
                        criterion.operator === 'LIKE' || criterion.operator === 'NOT LIKE' ? 'Use * for any characters, ? for single character (e.g., Sh*ll, ?ell)' :
                        criterion.fieldType === 'date' ? 'Format: YYYY-MM-DD' :
                        criterion.fieldType === 'number' ? 'Numeric value' :
                        hasAutocomplete ? 'Select or type value' : undefined
                      }
                    >
                      {criterion.operator === 'IN' || criterion.operator === 'NOT IN' ? (
                        <OSDUMultiSelect
                          value={typeof criterion.value === 'string' || typeof criterion.value === 'number' ? criterion.value : criterion.value.join(', ')}
                          onChange={(newValue) => updateCriterion(criterion.id, { value: newValue })}
                          options={fieldDef?.autocompleteValues}
                          invalid={!criterion.isValid}
                          placeholder="Select or type values..."
                        />
                      ) : criterion.operator === 'BETWEEN' ? (
                        <OSDURangeInput
                          fieldType={criterion.fieldType as 'number' | 'date'}
                          value={typeof criterion.value === 'string' || typeof criterion.value === 'number' ? criterion.value : ''}
                          onChange={(newValue) => updateCriterion(criterion.id, { value: newValue })}
                          invalid={!criterion.isValid}
                          fieldLabel={fieldDef?.label}
                        />
                      ) : hasAutocomplete ? (
                        <Select
                          selectedOption={
                            fieldDef?.autocompleteValues?.includes(String(criterion.value))
                              ? { value: String(criterion.value), label: String(criterion.value) }
                              : null
                          }
                          onChange={({ detail }) =>
                            updateCriterion(criterion.id, { value: detail.selectedOption.value! })
                          }
                          options={fieldDef?.autocompleteValues?.map(v => ({ value: v, label: v })) || []}
                          placeholder="Select value..."
                          filteringType="auto"
                          invalid={!criterion.isValid}
                        />
                      ) : (
                        <Input
                          value={String(criterion.value)}
                          onChange={({ detail }) =>
                            updateCriterion(criterion.id, { value: detail.value })
                          }
                          placeholder={
                            criterion.fieldType === 'date' ? 'YYYY-MM-DD' :
                            criterion.operator === 'IN' ? 'value1, value2, value3' :
                            'Enter value...'
                          }
                          type={
                            criterion.fieldType === 'number' ? 'number' : 'text'
                          }
                          invalid={!criterion.isValid}
                          {...(isMobile && { 
                            // Larger input on mobile for touch
                            inputMode: criterion.fieldType === 'number' ? 'numeric' : 'text'
                          })}
                        />
                      )}
                    </FormField>

                    {/* Logic and Remove */}
                    <FormField label="Actions">
                      <SpaceBetween 
                        direction={isMobile ? "vertical" : "horizontal"} 
                        size="xs"
                      >
                        {index > 0 && (
                          <Select
                            selectedOption={{ value: criterion.logic, label: criterion.logic }}
                            onChange={({ detail }) =>
                              updateCriterion(criterion.id, { 
                                logic: detail.selectedOption.value as 'AND' | 'OR' 
                              })
                            }
                            options={[
                              { value: 'AND', label: 'AND', description: isMobile ? undefined : 'Both conditions must match' },
                              { value: 'OR', label: 'OR', description: isMobile ? undefined : 'Either condition can match' }
                            ]}
                          />
                        )}
                        <Button
                          onClick={() => removeCriterion(criterion.id)}
                          iconName="remove"
                          variant={isMobile ? "normal" : "icon"}
                          ariaLabel="Remove criterion"
                          fullWidth={isMobile}
                          {...(isMobile && { 
                            style: { minHeight: '44px' }
                          })}
                        >
                          {isMobile ? 'Remove' : undefined}
                        </Button>
                      </SpaceBetween>
                    </FormField>
                  </Grid>

                  {/* Validation Status */}
                  {criterion.isValid ? (
                    <Badge color="green">✓ Valid</Badge>
                  ) : (
                    <Badge color="red">✗ {criterion.errorMessage}</Badge>
                  )}
                </SpaceBetween>
              </Container>
            );
          })}

          {criteria.length >= 10 && (
            <Alert type="warning">
              Maximum of 10 criteria reached. Remove a criterion to add more.
            </Alert>
          )}
        </SpaceBetween>

        {/* Query Preview */}
        <ExpandableSection
          headerText="Query Preview"
          variant="container"
          defaultExpanded={true}
          headerDescription={isQueryValid() ? '✓ Query is valid and ready to execute' : '✗ Query has validation errors'}
        >
          <SpaceBetween size="m">
            {validationErrors.length > 0 && (
              <Alert 
                type="error" 
                header={`Query Validation Errors (${validationErrors.length})`}
                dismissible={false}
              >
                <SpaceBetween size="xs">
                  <Box variant="p">
                    Please fix the following errors before executing the query:
                  </Box>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  <Box variant="small" color="text-status-error">
                    <strong>Tip:</strong> Look for red badges (✗) next to invalid criteria above.
                  </Box>
                </SpaceBetween>
              </Alert>
            )}

            <Box>
              <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
                Generated OSDU Query
              </Box>
              <pre style={{
                background: '#232f3e',
                color: '#d4d4d4',
                padding: '16px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, monospace',
                border: isQueryValid() ? '2px solid #037f0c' : '2px solid #d13212',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.5'
              }}>
                <code dangerouslySetInnerHTML={{ __html: syntaxHighlightQuery(queryPreview) }} />
              </pre>
              
              {/* Show logic grouping explanation for complex queries */}
              {criteria.length > 2 && (() => {
                const logicOperators = criteria.slice(1).map(c => c.logic);
                const hasMultipleLogics = new Set(logicOperators).size > 1;
                
                if (hasMultipleLogics) {
                  return (
                    <Alert type="info" header="Query Grouping">
                      This query uses both AND and OR operators. Criteria with the same logic operator 
                      are grouped together with parentheses to ensure correct evaluation order.
                      <br /><br />
                      <strong>Evaluation order:</strong> Parentheses are evaluated first, then AND operators, then OR operators.
                    </Alert>
                  );
                }
                return null;
              })()}
            </Box>

            <Grid
              gridDefinition={
                isMobile
                  ? [{ colspan: 12 }, { colspan: 12 }]
                  : [{ colspan: 6 }, { colspan: 6 }]
              }
            >
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(queryPreview);
                }}
                iconName="copy"
                disabled={!isQueryValid()}
                fullWidth={isMobile}
                {...(isMobile && { 
                  style: { minHeight: '44px', fontSize: '16px' }
                })}
              >
                Copy Query
              </Button>
              <Button
                onClick={executeQuery}
                variant="primary"
                iconName="search"
                disabled={!isQueryValid()}
                fullWidth={isMobile}
                {...(isMobile && { 
                  style: { minHeight: '44px', fontSize: '16px' }
                })}
              >
                Execute Query {isQueryValid() && '✓'}
              </Button>
            </Grid>

            {isQueryValid() && (
              <Alert type="success">
                <strong>Ready to Execute:</strong> This query has been validated and will execute successfully.
                {!isMobile && (
                  <>
                    <br />
                    <Box variant="small" margin={{ top: 'xs' }}>
                      💡 <strong>Tip:</strong> Press Ctrl+Enter (Cmd+Enter on Mac) to execute
                    </Box>
                  </>
                )}
              </Alert>
            )}

            {/* Keyboard Shortcuts Help - Desktop Only */}
            {!isMobile && (
              <ExpandableSection
                headerText="Keyboard Shortcuts"
                variant="footer"
              >
                <Box variant="small">
                  <SpaceBetween size="xs">
                    <div><strong>Ctrl/Cmd + Enter:</strong> Execute query</div>
                    <div><strong>Ctrl/Cmd + N:</strong> Add new criterion</div>
                    <div><strong>Ctrl/Cmd + H:</strong> Toggle query history</div>
                  </SpaceBetween>
                </Box>
              </ExpandableSection>
            )}
          </SpaceBetween>
        </ExpandableSection>
      </SpaceBetween>

      {/* Template Selector - Inline */}
      {showTemplateSelector && (
        <ExpandableSection
          headerText="Select Query Template"
          variant="container"
          expanded={true}
          onChange={({ detail }) => {
            if (!detail.expanded) {
              setShowTemplateSelector(false);
            }
          }}
        >
          <OSDUTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            currentDataType={dataType}
            onClose={() => setShowTemplateSelector(false)}
          />
        </ExpandableSection>
      )}

      {/* Query History - Inline */}
      {showQueryHistory && (
        <ExpandableSection
          headerText="Query History"
          variant="container"
          expanded={true}
          onChange={({ detail }) => {
            if (!detail.expanded) {
              setShowQueryHistory(false);
            }
          }}
        >
          <OSDUQueryHistory
            onLoadQuery={handleLoadHistoryQuery}
            onClose={() => setShowQueryHistory(false)}
          />
        </ExpandableSection>
      )}

      {/* Analytics Dashboard - Inline */}
      {showAnalyticsDashboard && (
        <ExpandableSection
          headerText="Analytics Dashboard"
          variant="container"
          expanded={true}
          onChange={({ detail }) => {
            if (!detail.expanded) {
              setShowAnalyticsDashboard(false);
            }
          }}
        >
          <OSDUQueryBuilderAnalyticsDashboard
            onClose={() => setShowAnalyticsDashboard(false)}
          />
        </ExpandableSection>
      )}

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        onDismiss={() => {
          setShowSaveTemplateModal(false);
          setTemplateName('');
          setTemplateDescription('');
          setTemplateTags('');
          setSaveTemplateError('');
        }}
        header="Save Query as Template"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setTemplateTags('');
                  setSaveTemplateError('');
                }}
                variant="link"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                variant="primary"
                disabled={!templateName.trim() || !templateDescription.trim()}
              >
                Save Template
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {saveTemplateError && (
            <Alert type="error" header="Save Failed">
              {saveTemplateError}
            </Alert>
          )}

          <FormField
            label="Template Name"
            description="A descriptive name for this template"
          >
            <Input
              value={templateName}
              onChange={({ detail }) => setTemplateName(detail.value)}
              placeholder="e.g., Deep Wells in North Sea"
            />
          </FormField>

          <FormField
            label="Description"
            description="Explain what this template searches for"
          >
            <Input
              value={templateDescription}
              onChange={({ detail }) => setTemplateDescription(detail.value)}
              placeholder="e.g., Find all wells deeper than 3000m in the North Sea basin"
            />
          </FormField>

          <FormField
            label="Tags (optional)"
            description="Comma-separated tags for easier searching"
          >
            <Input
              value={templateTags}
              onChange={({ detail }) => setTemplateTags(detail.value)}
              placeholder="e.g., deep, north sea, exploration"
            />
          </FormField>

          <Alert type="info">
            <strong>Template Preview:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Data Type: {dataType.charAt(0).toUpperCase() + dataType.slice(1)}</li>
              <li>Criteria: {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}</li>
              <li>Category: Custom</li>
            </ul>
          </Alert>
        </SpaceBetween>
      </Modal>

      {/* Help Documentation Modal */}
      <Modal
        visible={showHelpModal}
        onDismiss={() => setShowHelpModal(false)}
        header="OSDU Query Builder Help"
        size="large"
        footer={
          <Box float="right">
            <Button onClick={() => setShowHelpModal(false)} variant="primary">
              Close
            </Button>
          </Box>
        }
      >
        <SpaceBetween size="l">
          {/* Overview */}
          <Container header={<Header variant="h3">Overview</Header>}>
            <SpaceBetween size="s">
              <Box variant="p">
                The OSDU Query Builder helps you construct precise search queries for OSDU data without writing code. 
                Build queries visually using dropdown menus and form inputs, then execute them instantly to get results.
              </Box>
              <Box variant="p">
                <strong>Key Benefits:</strong>
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>No need to learn OSDU query syntax</li>
                <li>Real-time validation prevents errors</li>
                <li>Instant results without AI processing</li>
                <li>Save and reuse queries as templates</li>
              </ul>
            </SpaceBetween>
          </Container>

          {/* Getting Started */}
          <Container header={<Header variant="h3">Getting Started</Header>}>
            <SpaceBetween size="s">
              <Box variant="h4">1. Choose a Starting Point</Box>
              <Box variant="p">
                <strong>Option A:</strong> Select a pre-built template from "Quick Start Templates" for common searches.
              </Box>
              <Box variant="p">
                <strong>Option B:</strong> Start from scratch by selecting a data type and adding criteria.
              </Box>

              <Box variant="h4">2. Select Data Type</Box>
              <Box variant="p">
                Choose the type of OSDU data you want to search: Well, Wellbore, Log, or Seismic.
              </Box>

              <Box variant="h4">3. Add Filter Criteria</Box>
              <Box variant="p">
                Click "Add Criterion" to add search conditions. Each criterion has three parts:
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Field:</strong> What to search (e.g., Operator, Country, Depth)</li>
                <li><strong>Operator:</strong> How to compare (e.g., Equals, Greater Than, Contains)</li>
                <li><strong>Value:</strong> What to search for (e.g., "Shell", 3000, "Norway")</li>
              </ul>

              <Box variant="h4">4. Review and Execute</Box>
              <Box variant="p">
                Check the Query Preview to see the generated query. When all criteria are valid (green checkmarks), 
                click "Execute Query" to run the search.
              </Box>
            </SpaceBetween>
          </Container>

          {/* Field Types */}
          <Container header={<Header variant="h3">Understanding Field Types</Header>}>
            <SpaceBetween size="s">
              <Box variant="h4">String Fields</Box>
              <Box variant="p">
                Text values like operator names, countries, or well names. Supports exact matches and wildcards.
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Wildcards:</strong> Use * for multiple characters, ? for single character</li>
                <li><strong>Example:</strong> "North*" matches "North Sea", "Northern", etc.</li>
              </ul>

              <Box variant="h4">Number Fields</Box>
              <Box variant="p">
                Numeric values like depth, measured depth, or curve count. Supports comparison operators.
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Comparisons:</strong> =, !=, &gt;, &lt;, &gt;=, &lt;=</li>
                <li><strong>Ranges:</strong> Use BETWEEN with two comma-separated values</li>
                <li><strong>Example:</strong> "1000, 5000" for depths between 1000m and 5000m</li>
              </ul>

              <Box variant="h4">Date Fields</Box>
              <Box variant="p">
                Date values like acquisition date. Must use YYYY-MM-DD format.
              </Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Format:</strong> YYYY-MM-DD (e.g., 2023-01-15)</li>
                <li><strong>Comparisons:</strong> =, &gt;, &lt;, &gt;=, &lt;=, BETWEEN</li>
                <li><strong>Example:</strong> "2022-01-01, 2023-12-31" for date range</li>
              </ul>
            </SpaceBetween>
          </Container>

          {/* Operators Guide */}
          <Container header={<Header variant="h3">Operator Reference</Header>}>
            <SpaceBetween size="s">
              <Box variant="h4">Comparison Operators</Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>Equals (=):</strong> Exact match</li>
                <li><strong>Not Equals (!=):</strong> Does not match</li>
                <li><strong>Greater Than (&gt;):</strong> Larger than value</li>
                <li><strong>Less Than (&lt;):</strong> Smaller than value</li>
                <li><strong>Greater or Equal (&gt;=):</strong> Larger than or equal to</li>
                <li><strong>Less or Equal (&lt;=):</strong> Smaller than or equal to</li>
              </ul>

              <Box variant="h4">Pattern Matching</Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>LIKE:</strong> Contains pattern (supports * and ? wildcards)</li>
                <li><strong>NOT LIKE:</strong> Does not contain pattern</li>
              </ul>

              <Box variant="h4">List Operators</Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>IN:</strong> Matches any value in comma-separated list</li>
                <li><strong>NOT IN:</strong> Does not match any value in list</li>
              </ul>

              <Box variant="h4">Range Operator</Box>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><strong>BETWEEN:</strong> Value is between two numbers or dates (inclusive)</li>
              </ul>
            </SpaceBetween>
          </Container>

          {/* Combining Criteria */}
          <Container header={<Header variant="h3">Combining Multiple Criteria</Header>}>
            <SpaceBetween size="s">
              <Box variant="p">
                When you add multiple criteria, you can combine them with AND or OR logic:
              </Box>

              <Box variant="h4">AND Logic</Box>
              <Box variant="p">
                All criteria must match. Use this to narrow your search.
              </Box>
              <Box variant="code">
                data.operator = "Shell" AND data.country = "Norway"
              </Box>
              <Box variant="small">
                Finds wells operated by Shell AND located in Norway (both conditions must be true)
              </Box>

              <Box variant="h4">OR Logic</Box>
              <Box variant="p">
                Any criterion can match. Use this to broaden your search.
              </Box>
              <Box variant="code">
                data.country = "Norway" OR data.country = "UK"
              </Box>
              <Box variant="small">
                Finds wells in Norway OR UK (either condition can be true)
              </Box>

              <Box variant="h4">Complex Queries</Box>
              <Box variant="p">
                Mix AND and OR operators for sophisticated searches. The query builder automatically 
                groups criteria with parentheses to ensure correct evaluation order.
              </Box>
            </SpaceBetween>
          </Container>

          {/* Common Errors */}
          <Container header={<Header variant="h3">Troubleshooting Common Errors</Header>}>
            <SpaceBetween size="s">
              <Box variant="h4">"Value is required"</Box>
              <Box variant="p">
                Every criterion must have a value. Enter a value in the Value field.
              </Box>

              <Box variant="h4">"Must be a valid number"</Box>
              <Box variant="p">
                For numeric fields, enter only numbers (e.g., 3000, not "3000m").
              </Box>

              <Box variant="h4">"Date must be in YYYY-MM-DD format"</Box>
              <Box variant="p">
                Dates must use the format YYYY-MM-DD (e.g., 2023-01-15, not 01/15/2023).
              </Box>

              <Box variant="h4">"BETWEEN requires exactly two values"</Box>
              <Box variant="p">
                When using BETWEEN, enter two comma-separated values (e.g., "1000, 5000").
              </Box>

              <Box variant="h4">"Use comma to separate multiple values"</Box>
              <Box variant="p">
                For IN and NOT IN operators, separate values with commas (e.g., "Shell, BP, Equinor").
              </Box>

              <Box variant="h4">"First value must be less than second value"</Box>
              <Box variant="p">
                For BETWEEN operator, the first value must be smaller than the second (e.g., "1000, 5000" not "5000, 1000").
              </Box>
            </SpaceBetween>
          </Container>

          {/* Tips and Tricks */}
          <Container header={<Header variant="h3">Tips and Tricks</Header>}>
            <SpaceBetween size="s">
              <Box variant="h4">💡 Use Autocomplete</Box>
              <Box variant="p">
                Many fields have autocomplete suggestions. Start typing to see common values.
              </Box>

              <Box variant="h4">💡 Save Frequently Used Queries</Box>
              <Box variant="p">
                Click "Save as Template" to save queries you use often. Access them later from the Templates menu.
              </Box>

              <Box variant="h4">💡 Check Query History</Box>
              <Box variant="p">
                View your last 20 queries in Query History. Click any query to reload it.
              </Box>

              <Box variant="h4">💡 Use Wildcards for Flexible Searches</Box>
              <Box variant="p">
                Use * for multiple characters (e.g., "North*" matches "North Sea", "Northern") 
                or ? for single character (e.g., "?ell" matches "Well", "Bell").
              </Box>

              <Box variant="h4">💡 Copy Queries for Documentation</Box>
              <Box variant="p">
                Click "Copy Query" to copy the generated OSDU query syntax to your clipboard. 
                Useful for documentation or sharing with colleagues.
              </Box>

              {!isMobile && (
                <>
                  <Box variant="h4">⌨️ Keyboard Shortcuts (Desktop)</Box>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li><strong>Ctrl/Cmd + Enter:</strong> Execute query</li>
                    <li><strong>Ctrl/Cmd + N:</strong> Add new criterion</li>
                    <li><strong>Ctrl/Cmd + H:</strong> Toggle query history</li>
                  </ul>
                </>
              )}
            </SpaceBetween>
          </Container>

          {/* Query Syntax Reference */}
          <Container header={<Header variant="h3">OSDU Query Syntax Reference</Header>}>
            <SpaceBetween size="s">
              <Box variant="p">
                The query builder generates OSDU query syntax automatically. Here's what the syntax looks like:
              </Box>

              <Box variant="h4">Basic Query</Box>
              <Box variant="code">
                data.operator = "Shell"
              </Box>

              <Box variant="h4">Multiple Criteria with AND</Box>
              <Box variant="code">
                data.operator = "Shell" AND data.country = "Norway"
              </Box>

              <Box variant="h4">Multiple Criteria with OR</Box>
              <Box variant="code">
                data.country = "Norway" OR data.country = "UK"
              </Box>

              <Box variant="h4">Numeric Comparison</Box>
              <Box variant="code">
                data.depth &gt; 3000 AND data.depth &lt; 5000
              </Box>

              <Box variant="h4">Pattern Matching with Wildcards</Box>
              <Box variant="code">
                data.wellName LIKE "North*"
              </Box>

              <Box variant="h4">List Matching</Box>
              <Box variant="code">
                data.operator IN ("Shell", "BP", "Equinor")
              </Box>

              <Box variant="h4">Range Query</Box>
              <Box variant="code">
                data.depth BETWEEN 1000 AND 5000
              </Box>

              <Box variant="h4">Complex Query with Grouping</Box>
              <Box variant="code">
                (data.operator = "Shell" OR data.operator = "BP") AND data.depth &gt; 3000
              </Box>
            </SpaceBetween>
          </Container>

          {/* Need More Help */}
          <Container header={<Header variant="h3">Need More Help?</Header>}>
            <SpaceBetween size="s">
              <Box variant="p">
                <strong>Hover over field and operator labels</strong> to see detailed tooltips with examples.
              </Box>
              <Box variant="p">
                <strong>Watch for validation messages</strong> - red badges (✗) indicate errors that need fixing.
              </Box>
              <Box variant="p">
                <strong>Check the Query Preview</strong> to see the generated query and verify it matches your intent.
              </Box>
              <Alert type="info">
                <strong>Still stuck?</strong> Try starting with a template and modifying it to match your needs. 
                Templates provide working examples you can learn from.
              </Alert>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Modal>
    </div>
  );
};
