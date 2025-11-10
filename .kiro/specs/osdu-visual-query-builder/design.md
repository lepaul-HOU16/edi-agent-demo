# Design Document

## Overview

This design implements a visual query builder for OSDU search that provides instant, deterministic results through a form-based UI. The builder constructs properly formatted OSDU queries client-side, eliminating AI processing latency and providing a predictable, SQL-like query experience.

**Key Design Principles:**
1. **Zero AI Latency**: Queries constructed client-side, executed directly against OSDU API
2. **Deterministic Results**: Same inputs always produce same query and results
3. **Progressive Disclosure**: Simple interface that reveals complexity as needed
4. **Learn by Doing**: Query preview teaches OSDU syntax while building

## Architecture

### High-Level Flow

```
User Opens Query Builder
    ↓
Select Query Template (Optional)
    ↓
Select Data Type (Well, Wellbore, Log, Seismic)
    ↓
Add Filter Criteria
    ├─→ Select Field (Operator, Location, Depth, etc.)
    ├─→ Select Operator (=, >, <, LIKE, IN, etc.)
    └─→ Enter Value (Text, Number, Date, Dropdown)
    ↓
Live Query Preview Updates
    ↓
Validate Query
    ↓
Execute Query → Direct OSDU API Call (No AI)
    ↓
Display Results in Chat
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CatalogChatBoxCloudscape                          │    │
│  │  - Chat interface                                  │    │
│  │  - Query builder toggle button (NEW)              │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  OSDUQueryBuilder Component (NEW)                  │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  Query Template Selector                     │ │    │
│  │  │  - Wells by Operator                         │ │    │
│  │  │  - Wells by Location                         │ │    │
│  │  │  - Wells by Depth Range                      │ │    │
│  │  │  - Logs by Type                              │ │    │
│  │  │  - Custom Query                              │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  Data Type Selector                          │ │    │
│  │  │  [Well] [Wellbore] [Log] [Seismic]          │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  Filter Criteria Builder                     │ │    │
│  │  │  ┌────────────────────────────────────────┐ │ │    │
│  │  │  │ Criterion 1:                           │ │ │    │
│  │  │  │ Field: [Operator ▼]                    │ │ │    │
│  │  │  │ Operator: [Equals ▼]                   │ │ │    │
│  │  │  │ Value: [Shell_______]                  │ │ │    │
│  │  │  │ Logic: [AND ▼] [Remove]                │ │ │    │
│  │  │  └────────────────────────────────────────┘ │ │    │
│  │  │  [+ Add Criterion]                           │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  Query Preview (Live)                        │ │    │
│  │  │  ```                                         │ │    │
│  │  │  data.operator = "Shell"                     │ │    │
│  │  │  AND data.country = "Norway"                 │ │    │
│  │  │  AND data.depth > 3000                       │ │    │
│  │  │  ```                                         │ │    │
│  │  │  [Copy Query] [Execute]                      │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  Query Executor (NEW)                              │    │
│  │  - Validates query                                 │    │
│  │  - Calls OSDU API directly (no AI)                │    │
│  │  - Returns results to chat                        │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────────┐
│  OSDU Proxy Lambda (Existing)                                │
│  - Adds API key                                              │
│  - Forwards structured query to OSDU API                     │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. OSDUQueryBuilder Component

**Location**: `src/components/OSDUQueryBuilder.tsx`

**Purpose**: Main visual query builder component

**Implementation**:
```typescript
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
  CodeEditor,
  Tabs
} from '@cloudscape-design/components';

interface QueryCriterion {
  id: string;
  field: string;
  operator: string;
  value: string | number | string[];
  logic: 'AND' | 'OR';
}

interface QueryBuilderProps {
  onExecute: (query: string) => void;
  onClose: () => void;
}

export const OSDUQueryBuilder: React.FC<QueryBuilderProps> = ({
  onExecute,
  onClose
}) => {
  const [dataType, setDataType] = useState<string>('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([]);
  const [queryPreview, setQueryPreview] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Query templates
  const templates = {
    wellsByOperator: {
      name: 'Wells by Operator',
      dataType: 'well',
      criteria: [{
        id: '1',
        field: 'data.operator',
        operator: '=',
        value: '',
        logic: 'AND'
      }]
    },
    wellsByLocation: {
      name: 'Wells by Location',
      dataType: 'well',
      criteria: [{
        id: '1',
        field: 'data.country',
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
          id: '1',
          field: 'data.depth',
          operator: '>',
          value: '',
          logic: 'AND'
        },
        {
          id: '2',
          field: 'data.depth',
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
        id: '1',
        field: 'data.logType',
        operator: '=',
        value: '',
        logic: 'AND'
      }]
    },
    recentData: {
      name: 'Recent Data',
      dataType: 'well',
      criteria: [{
        id: '1',
        field: 'data.createdDate',
        operator: '>',
        value: '',
        logic: 'AND'
      }]
    }
  };
  
  // Field definitions by data type
  const fieldsByType = {
    well: [
      { value: 'data.operator', label: 'Operator', type: 'string' },
      { value: 'data.country', label: 'Country', type: 'string' },
      { value: 'data.basin', label: 'Basin', type: 'string' },
      { value: 'data.wellName', label: 'Well Name', type: 'string' },
      { value: 'data.depth', label: 'Depth', type: 'number' },
      { value: 'data.status', label: 'Status', type: 'string' },
      { value: 'data.wellType', label: 'Well Type', type: 'string' },
      { value: 'data.createdDate', label: 'Created Date', type: 'date' }
    ],
    wellbore: [
      { value: 'data.wellboreName', label: 'Wellbore Name', type: 'string' },
      { value: 'data.wellboreType', label: 'Wellbore Type', type: 'string' },
      { value: 'data.md', label: 'Measured Depth', type: 'number' },
      { value: 'data.tvd', label: 'True Vertical Depth', type: 'number' }
    ],
    log: [
      { value: 'data.logType', label: 'Log Type', type: 'string' },
      { value: 'data.logName', label: 'Log Name', type: 'string' },
      { value: 'data.curveCount', label: 'Curve Count', type: 'number' },
      { value: 'data.topDepth', label: 'Top Depth', type: 'number' },
      { value: 'data.bottomDepth', label: 'Bottom Depth', type: 'number' }
    ],
    seismic: [
      { value: 'data.surveyName', label: 'Survey Name', type: 'string' },
      { value: 'data.surveyType', label: 'Survey Type', type: 'string' },
      { value: 'data.acquisitionDate', label: 'Acquisition Date', type: 'date' }
    ]
  };
  
  // Operators by field type
  const operatorsByType = {
    string: [
      { value: '=', label: 'Equals' },
      { value: '!=', label: 'Not Equals' },
      { value: 'LIKE', label: 'Contains' },
      { value: 'IN', label: 'In List' }
    ],
    number: [
      { value: '=', label: 'Equals' },
      { value: '!=', label: 'Not Equals' },
      { value: '>', label: 'Greater Than' },
      { value: '<', label: 'Less Than' },
      { value: '>=', label: 'Greater or Equal' },
      { value: '<=', label: 'Less or Equal' },
      { value: 'BETWEEN', label: 'Between' }
    ],
    date: [
      { value: '=', label: 'On Date' },
      { value: '>', label: 'After' },
      { value: '<', label: 'Before' },
      { value: 'BETWEEN', label: 'Between Dates' }
    ]
  };
  
  // Generate query preview
  useEffect(() => {
    const query = generateQuery(dataType, criteria);
    setQueryPreview(query);
  }, [dataType, criteria]);
  
  const generateQuery = (type: string, criteriaList: QueryCriterion[]): string => {
    if (criteriaList.length === 0) {
      return `// Select criteria to build query`;
    }
    
    const parts: string[] = [];
    
    criteriaList.forEach((criterion, index) => {
      let part = '';
      
      // Add logic operator (except for first criterion)
      if (index > 0) {
        part += `${criterion.logic} `;
      }
      
      // Build criterion
      const field = criterion.field;
      const op = criterion.operator;
      const value = criterion.value;
      
      if (op === 'LIKE') {
        part += `${field} LIKE "%${value}%"`;
      } else if (op === 'IN') {
        const values = Array.isArray(value) ? value : [value];
        part += `${field} IN (${values.map(v => `"${v}"`).join(', ')})`;
      } else if (op === 'BETWEEN') {
        const [min, max] = Array.isArray(value) ? value : [value, value];
        part += `${field} BETWEEN ${min} AND ${max}`;
      } else {
        const quotedValue = typeof value === 'string' ? `"${value}"` : value;
        part += `${field} ${op} ${quotedValue}`;
      }
      
      parts.push(part);
    });
    
    return parts.join('\n');
  };
  
  const addCriterion = () => {
    const newCriterion: QueryCriterion = {
      id: Date.now().toString(),
      field: fieldsByType[dataType][0].value,
      operator: '=',
      value: '',
      logic: 'AND'
    };
    setCriteria([...criteria, newCriterion]);
  };
  
  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };
  
  const updateCriterion = (id: string, updates: Partial<QueryCriterion>) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };
  
  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      setDataType(template.dataType);
      setCriteria(template.criteria);
      setSelectedTemplate(templateKey);
    }
  };
  
  const executeQuery = () => {
    if (queryPreview && queryPreview !== '// Select criteria to build query') {
      onExecute(queryPreview);
    }
  };
  
  const isQueryValid = () => {
    return criteria.length > 0 && criteria.every(c => c.value !== '');
  };
  
  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <Button onClick={onClose} variant="link">
              Close
            </Button>
          }
        >
          OSDU Query Builder
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Query Templates */}
        <FormField label="Quick Start Templates">
          <Tabs
            tabs={[
              {
                label: "Wells by Operator",
                id: "wellsByOperator",
                content: (
                  <Button onClick={() => applyTemplate('wellsByOperator')}>
                    Apply Template
                  </Button>
                )
              },
              {
                label: "Wells by Location",
                id: "wellsByLocation",
                content: (
                  <Button onClick={() => applyTemplate('wellsByLocation')}>
                    Apply Template
                  </Button>
                )
              },
              {
                label: "Wells by Depth",
                id: "wellsByDepth",
                content: (
                  <Button onClick={() => applyTemplate('wellsByDepth')}>
                    Apply Template
                  </Button>
                )
              },
              {
                label: "Logs by Type",
                id: "logsByType",
                content: (
                  <Button onClick={() => applyTemplate('logsByType')}>
                    Apply Template
                  </Button>
                )
              },
              {
                label: "Recent Data",
                id: "recentData",
                content: (
                  <Button onClick={() => applyTemplate('recentData')}>
                    Apply Template
                  </Button>
                )
              }
            ]}
          />
        </FormField>
        
        {/* Data Type Selector */}
        <FormField label="Data Type">
          <Select
            selectedOption={{ value: dataType, label: dataType.charAt(0).toUpperCase() + dataType.slice(1) }}
            onChange={({ detail }) => setDataType(detail.selectedOption.value!)}
            options={[
              { value: 'well', label: 'Well' },
              { value: 'wellbore', label: 'Wellbore' },
              { value: 'log', label: 'Log' },
              { value: 'seismic', label: 'Seismic' }
            ]}
          />
        </FormField>
        
        {/* Filter Criteria */}
        <SpaceBetween size="m">
          <Header variant="h3">Filter Criteria</Header>
          
          {criteria.map((criterion, index) => (
            <Container key={criterion.id}>
              <SpaceBetween size="s">
                <FormField label="Field">
                  <Select
                    selectedOption={
                      fieldsByType[dataType].find(f => f.value === criterion.field) || 
                      fieldsByType[dataType][0]
                    }
                    onChange={({ detail }) => 
                      updateCriterion(criterion.id, { field: detail.selectedOption.value! })
                    }
                    options={fieldsByType[dataType]}
                  />
                </FormField>
                
                <FormField label="Operator">
                  <Select
                    selectedOption={{ value: criterion.operator, label: criterion.operator }}
                    onChange={({ detail }) => 
                      updateCriterion(criterion.id, { operator: detail.selectedOption.value! })
                    }
                    options={
                      operatorsByType[
                        fieldsByType[dataType].find(f => f.value === criterion.field)?.type || 'string'
                      ]
                    }
                  />
                </FormField>
                
                <FormField label="Value">
                  <Input
                    value={criterion.value.toString()}
                    onChange={({ detail }) => 
                      updateCriterion(criterion.id, { value: detail.value })
                    }
                    placeholder="Enter value..."
                  />
                </FormField>
                
                {index > 0 && (
                  <FormField label="Logic">
                    <Select
                      selectedOption={{ value: criterion.logic, label: criterion.logic }}
                      onChange={({ detail }) => 
                        updateCriterion(criterion.id, { logic: detail.selectedOption.value as 'AND' | 'OR' })
                      }
                      options={[
                        { value: 'AND', label: 'AND' },
                        { value: 'OR', label: 'OR' }
                      ]}
                    />
                  </FormField>
                )}
                
                <Button onClick={() => removeCriterion(criterion.id)} variant="link">
                  Remove Criterion
                </Button>
              </SpaceBetween>
            </Container>
          ))}
          
          <Button onClick={addCriterion} iconName="add-plus">
            Add Criterion
          </Button>
        </SpaceBetween>
        
        {/* Query Preview */}
        <ExpandableSection headerText="Query Preview" defaultExpanded>
          <Box padding="s">
            <pre style={{ 
              background: '#f4f4f4', 
              padding: '12px', 
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {queryPreview}
            </pre>
          </Box>
          <SpaceBetween direction="horizontal" size="xs">
            <Button 
              onClick={() => navigator.clipboard.writeText(queryPreview)}
              iconName="copy"
            >
              Copy Query
            </Button>
            <Button 
              onClick={executeQuery}
              variant="primary"
              disabled={!isQueryValid()}
            >
              Execute Query
            </Button>
          </SpaceBetween>
        </ExpandableSection>
      </SpaceBetween>
    </Container>
  );
};
```

### 2. Query Builder Integration in Chat

**Location**: `src/components/CatalogChatBoxCloudscape.tsx`

**Purpose**: Add query builder toggle to chat interface

**Implementation**:
```typescript
import { OSDUQueryBuilder } from './OSDUQueryBuilder';

// Add state
const [showQueryBuilder, setShowQueryBuilder] = useState(false);

// Add toggle button in chat header
<Button
  iconName="settings"
  onClick={() => setShowQueryBuilder(!showQueryBuilder)}
  variant="icon"
>
  Query Builder
</Button>

// Render query builder
{showQueryBuilder && (
  <OSDUQueryBuilder
    onExecute={(query) => {
      // Execute query directly against OSDU API
      handleQueryBuilderSearch(query);
      setShowQueryBuilder(false);
    }}
    onClose={() => setShowQueryBuilder(false)}
  />
)}
```

### 3. Direct Query Execution

**Location**: `src/app/catalog/page.tsx`

**Purpose**: Execute query builder queries without AI processing

**Implementation**:
```typescript
const handleQueryBuilderSearch = async (osduQuery: string) => {
  console.log('🔧 Executing query builder query:', osduQuery);
  
  // Add user message showing the query
  const userMessage: Message = {
    id: uuidv4() as any,
    role: "human" as any,
    content: {
      text: `**Query Builder Search:**\n\`\`\`\n${osduQuery}\n\`\`\``
    } as any,
    responseComplete: true as any,
    createdAt: new Date().toISOString() as any,
    chatSessionId: '' as any,
    owner: '' as any
  } as any;
  
  setMessages(prevMessages => [...prevMessages, userMessage]);
  
  try {
    // Call OSDU API directly with structured query
    const osduResponse = await amplifyClient.queries.osduSearch({
      query: osduQuery,
      dataPartition: 'osdu',
      maxResults: 100,
      useStructuredQuery: true // Flag to bypass NLP processing
    });
    
    if (osduResponse.data) {
      const osduData = typeof osduResponse.data === 'string' 
        ? JSON.parse(osduResponse.data) 
        : osduResponse.data;
      
      // Create result message
      const resultMessage: Message = {
        id: uuidv4() as any,
        role: "ai" as any,
        content: {
          text: `**🔍 Query Results**\n\n` +
                `Found ${osduData.recordCount} records\n\n` +
                `\`\`\`osdu-search-response\n${JSON.stringify({
                  answer: `Query executed successfully`,
                  recordCount: osduData.recordCount,
                  records: osduData.records,
                  query: osduQuery
                })}\n\`\`\``
        } as any,
        responseComplete: true as any,
        createdAt: new Date().toISOString() as any,
        chatSessionId: '' as any,
        owner: '' as any
      } as any;
      
      setMessages(prevMessages => [...prevMessages, resultMessage]);
    }
  } catch (error) {
    console.error('❌ Query builder search failed:', error);
    
    const errorMessage: Message = {
      id: uuidv4() as any,
      role: "ai" as any,
      content: {
        text: `⚠️ **Query Execution Failed**\n\nThe query could not be executed. Please check your criteria and try again.`
      } as any,
      responseComplete: true as any,
      createdAt: new Date().toISOString() as any,
      chatSessionId: '' as any,
      owner: '' as any
    } as any;
    
    setMessages(prevMessages => [...prevMessages, errorMessage]);
  }
};
```

### 4. Query History Storage

**Location**: `src/utils/queryHistory.ts`

**Purpose**: Store and retrieve query history

**Implementation**:
```typescript
interface QueryHistoryItem {
  id: string;
  query: string;
  dataType: string;
  criteria: any[];
  timestamp: Date;
  resultCount?: number;
}

export class QueryHistory {
  private static STORAGE_KEY = 'osdu_query_history';
  private static MAX_ITEMS = 20;
  
  static save(item: Omit<QueryHistoryItem, 'id' | 'timestamp'>): void {
    const history = this.getAll();
    const newItem: QueryHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    history.unshift(newItem);
    
    // Keep only last 20 items
    const trimmed = history.slice(0, this.MAX_ITEMS);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
  }
  
  static getAll(): QueryHistoryItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  static delete(id: string): void {
    const history = this.getAll();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
  
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

## Data Models

### Query Criterion
```typescript
interface QueryCriterion {
  id: string;
  field: string;           // e.g., "data.operator"
  operator: string;        // e.g., "=", ">", "LIKE"
  value: string | number | string[];
  logic: 'AND' | 'OR';
}
```

### Query Template
```typescript
interface QueryTemplate {
  name: string;
  dataType: string;
  criteria: QueryCriterion[];
}
```

### Field Definition
```typescript
interface FieldDefinition {
  value: string;           // Field path in OSDU
  label: string;           // Display name
  type: 'string' | 'number' | 'date';
  autocomplete?: string[]; // Optional autocomplete values
}
```

## Error Handling

### Invalid Query
```typescript
if (!isQueryValid()) {
  return {
    error: 'Invalid query: All criteria must have values',
    suggestion: 'Please fill in all criterion values before executing'
  };
}
```

### OSDU API Error
```typescript
catch (error) {
  console.error('Query execution failed:', error);
  return {
    error: 'Query execution failed',
    suggestion: 'Check your query syntax and try again',
    query: osduQuery
  };
}
```

## Testing Strategy

### Unit Tests

**Test 1: Query Generation**
```typescript
describe('generateQuery', () => {
  it('should generate simple equality query', () => {
    const criteria = [{
      id: '1',
      field: 'data.operator',
      operator: '=',
      value: 'Shell',
      logic: 'AND'
    }];
    
    const query = generateQuery('well', criteria);
    expect(query).toBe('data.operator = "Shell"');
  });
  
  it('should generate complex multi-criteria query', () => {
    const criteria = [
      { id: '1', field: 'data.operator', operator: '=', value: 'Shell', logic: 'AND' },
      { id: '2', field: 'data.depth', operator: '>', value: 3000, logic: 'AND' }
    ];
    
    const query = generateQuery('well', criteria);
    expect(query).toContain('data.operator = "Shell"');
    expect(query).toContain('AND data.depth > 3000');
  });
});
```

### Integration Tests

**Test 1: End-to-End Query Builder Flow**
```bash
# tests/test-query-builder-e2e.js
1. Open query builder
2. Select template
3. Modify criteria
4. Verify query preview updates
5. Execute query
6. Verify results displayed
```

### Manual Testing

**Test Cases**:
1. Apply each template → Verify correct fields populated
2. Add multiple criteria → Verify AND/OR logic works
3. Change data type → Verify fields update
4. Execute valid query → Verify results returned
5. Execute invalid query → Verify error message
6. Copy query → Verify clipboard contains correct query

## Performance Considerations

- **Client-Side Query Generation**: Instant, no API calls
- **Query Execution**: Direct OSDU API call, ~500ms-2s
- **No AI Processing**: Eliminates 2-5 seconds of LLM latency
- **Local Storage**: Query history stored locally, instant retrieval

## Future Enhancements

1. **Visual Query Designer**: Drag-and-drop query building
2. **Query Validation**: Real-time syntax checking
3. **Smart Autocomplete**: Learn from previous queries
4. **Query Sharing**: Share queries with team members
5. **Saved Queries**: Personal query library
6. **Query Analytics**: Track most effective queries
7. **Advanced Operators**: Support for complex OSDU query features
8. **Query Optimization**: Suggest query improvements
