
import React, { useState } from 'react';
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
  Cards,
  Icon
} from '@cloudscape-design/components';

/**
 * OSDU Query Builder Mockup
 * 
 * This is a visual demonstration of the proposed OSDU Query Builder interface.
 * It shows how users can construct OSDU queries through dropdown selections
 * instead of natural language, providing instant, deterministic search results.
 */

interface QueryCriterion {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

export default function OSDUQueryBuilderMockup() {
  const [dataType, setDataType] = useState('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([
    {
      id: '1',
      field: 'data.operator',
      operator: '=',
      value: 'Shell',
      logic: 'AND'
    }
  ]);
  const [showQueryBuilder, setShowQueryBuilder] = useState(true);

  // Field definitions by data type
  const fieldsByType = {
    well: [
      { value: 'data.operator', label: 'Operator' },
      { value: 'data.country', label: 'Country' },
      { value: 'data.basin', label: 'Basin' },
      { value: 'data.wellName', label: 'Well Name' },
      { value: 'data.depth', label: 'Depth (m)' },
      { value: 'data.status', label: 'Status' },
      { value: 'data.wellType', label: 'Well Type' }
    ],
    wellbore: [
      { value: 'data.wellboreName', label: 'Wellbore Name' },
      { value: 'data.wellboreType', label: 'Wellbore Type' },
      { value: 'data.md', label: 'Measured Depth' },
      { value: 'data.tvd', label: 'True Vertical Depth' }
    ],
    log: [
      { value: 'data.logType', label: 'Log Type' },
      { value: 'data.logName', label: 'Log Name' },
      { value: 'data.curveCount', label: 'Curve Count' },
      { value: 'data.topDepth', label: 'Top Depth' },
      { value: 'data.bottomDepth', label: 'Bottom Depth' }
    ]
  };

  const operators = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'LIKE', label: 'Contains' },
    { value: 'IN', label: 'In List' }
  ];

  // Generate query preview
  const generateQueryPreview = () => {
    if (criteria.length === 0) {
      return '// Add criteria to build your query';
    }

    const parts = criteria.map((criterion, index) => {
      let part = '';
      if (index > 0) {
        part += `${criterion.logic} `;
      }
      
      if (criterion.operator === 'LIKE') {
        part += `${criterion.field} LIKE "%${criterion.value}%"`;
      } else {
        const quotedValue = isNaN(Number(criterion.value)) ? `"${criterion.value}"` : criterion.value;
        part += `${criterion.field} ${criterion.operator} ${quotedValue}`;
      }
      
      return part;
    });

    return parts.join('\n');
  };

  const addCriterion = () => {
    setCriteria([...criteria, {
      id: Date.now().toString(),
      field: fieldsByType[dataType][0].value,
      operator: '=',
      value: '',
      logic: 'AND'
    }]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, updates: Partial<QueryCriterion>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const queryPreview = generateQueryPreview();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <SpaceBetween size="l">
        {/* Header */}
        <Container>
          <SpaceBetween size="m">
            <Header
              variant="h1"
              description="Visual demonstration of the OSDU Query Builder - a zero-latency, deterministic search interface"
            >
              OSDU Query Builder Mockup
            </Header>
            
            <Alert type="info">
              <strong>Key Benefits:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                <li><strong>Zero AI Latency:</strong> Queries built client-side, executed directly against OSDU API</li>
                <li><strong>Deterministic Results:</strong> Same inputs always produce the same query</li>
                <li><strong>Learning Tool:</strong> Live preview teaches OSDU query syntax</li>
                <li><strong>Power User Friendly:</strong> Complex multi-criteria queries easy to build</li>
              </ul>
            </Alert>

            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Query Construction</Box>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
                  Instant
                </div>
                <Box variant="small">Client-side, no API calls</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Query Execution</Box>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
                  ~1-2s
                </div>
                <Box variant="small">Direct OSDU API (no AI)</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">vs Conversational</Box>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#037f0c' }}>
                  5x Faster
                </div>
                <Box variant="small">Eliminates 3-5s AI processing</Box>
              </div>
            </ColumnLayout>
          </SpaceBetween>
        </Container>

        {/* Toggle Button Demo */}
        <Container>
          <SpaceBetween size="s">
            <Header variant="h3">Integration with Chat Interface</Header>
            <Box>
              <Button
                iconName={showQueryBuilder ? "angle-up" : "angle-down"}
                onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                variant="primary"
              >
                {showQueryBuilder ? 'Hide' : 'Show'} Query Builder
              </Button>
              <Box variant="small" color="text-body-secondary" margin={{ top: 'xs' }}>
                This button would appear in the catalog chat interface header
              </Box>
            </Box>
          </SpaceBetween>
        </Container>

        {/* Main Query Builder */}
        {showQueryBuilder && (
          <Container
            header={
              <Header
                variant="h2"
                description="Build OSDU queries visually with dropdown selections"
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Badge color="blue">Zero Latency</Badge>
                    <Badge color="green">Deterministic</Badge>
                  </SpaceBetween>
                }
              >
                Query Builder
              </Header>
            }
          >
            <SpaceBetween size="l">
              {/* Query Templates */}
              <FormField
                label="Quick Start Templates"
                description="Pre-built queries for common searches"
              >
                <Tabs
                  tabs={[
                    {
                      label: "Wells by Operator",
                      id: "template1",
                      content: (
                        <Box padding={{ vertical: 's' }}>
                          <SpaceBetween size="xs">
                            <Box>Search for wells operated by a specific company</Box>
                            <Button variant="primary" iconName="check">Apply Template</Button>
                          </SpaceBetween>
                        </Box>
                      )
                    },
                    {
                      label: "Wells by Location",
                      id: "template2",
                      content: (
                        <Box padding={{ vertical: 's' }}>
                          <SpaceBetween size="xs">
                            <Box>Find wells in a specific country or basin</Box>
                            <Button variant="primary" iconName="check">Apply Template</Button>
                          </SpaceBetween>
                        </Box>
                      )
                    },
                    {
                      label: "Wells by Depth Range",
                      id: "template3",
                      content: (
                        <Box padding={{ vertical: 's' }}>
                          <SpaceBetween size="xs">
                            <Box>Filter wells by minimum and maximum depth</Box>
                            <Button variant="primary" iconName="check">Apply Template</Button>
                          </SpaceBetween>
                        </Box>
                      )
                    },
                    {
                      label: "Logs by Type",
                      id: "template4",
                      content: (
                        <Box padding={{ vertical: 's' }}>
                          <SpaceBetween size="xs">
                            <Box>Search for specific log types (GR, RHOB, etc.)</Box>
                            <Button variant="primary" iconName="check">Apply Template</Button>
                          </SpaceBetween>
                        </Box>
                      )
                    },
                    {
                      label: "Recent Data",
                      id: "template5",
                      content: (
                        <Box padding={{ vertical: 's' }}>
                          <SpaceBetween size="xs">
                            <Box>Find recently added or updated data</Box>
                            <Button variant="primary" iconName="check">Apply Template</Button>
                          </SpaceBetween>
                        </Box>
                      )
                    }
                  ]}
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
                    label: dataType.charAt(0).toUpperCase() + dataType.slice(1) 
                  }}
                  onChange={({ detail }) => setDataType(detail.selectedOption.value!)}
                  options={[
                    { value: 'well', label: 'Well', description: 'Well master data' },
                    { value: 'wellbore', label: 'Wellbore', description: 'Wellbore trajectories' },
                    { value: 'log', label: 'Log', description: 'Well log data' },
                    { value: 'seismic', label: 'Seismic', description: 'Seismic surveys' }
                  ]}
                />
              </FormField>

              {/* Filter Criteria */}
              <SpaceBetween size="m">
                <Header
                  variant="h3"
                  description="Add multiple criteria with AND/OR logic"
                  counter={`(${criteria.length})`}
                >
                  Filter Criteria
                </Header>

                {criteria.map((criterion, index) => (
                  <Container key={criterion.id}>
                    <ColumnLayout columns={4} variant="text-grid">
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
                          selectedOption={operators.find(o => o.value === criterion.operator) || operators[0]}
                          onChange={({ detail }) =>
                            updateCriterion(criterion.id, { operator: detail.selectedOption.value! })
                          }
                          options={operators}
                        />
                      </FormField>

                      <FormField label="Value">
                        <Input
                          value={criterion.value}
                          onChange={({ detail }) =>
                            updateCriterion(criterion.id, { value: detail.value })
                          }
                          placeholder="Enter value..."
                        />
                      </FormField>

                      <FormField label="Actions">
                        <SpaceBetween direction="horizontal" size="xs">
                          {index > 0 && (
                            <Select
                              selectedOption={{ value: criterion.logic, label: criterion.logic }}
                              onChange={({ detail }) =>
                                updateCriterion(criterion.id, { 
                                  logic: detail.selectedOption.value as 'AND' | 'OR' 
                                })
                              }
                              options={[
                                { value: 'AND', label: 'AND' },
                                { value: 'OR', label: 'OR' }
                              ]}
                            />
                          )}
                          <Button
                            onClick={() => removeCriterion(criterion.id)}
                            iconName="remove"
                            variant="icon"
                          />
                        </SpaceBetween>
                      </FormField>
                    </ColumnLayout>
                  </Container>
                ))}

                <Button onClick={addCriterion} iconName="add-plus">
                  Add Criterion
                </Button>
              </SpaceBetween>

              {/* Query Preview */}
              <ExpandableSection
                headerText="Query Preview"
                variant="container"
                defaultExpanded={true}
              >
                <SpaceBetween size="m">
                  <Alert type="success">
                    <strong>Live Preview:</strong> See the exact OSDU query being generated in real-time
                  </Alert>
                  
                  <Box>
                    <pre style={{
                      background: '#232f3e',
                      color: '#d4d4d4',
                      padding: '16px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '14px',
                      fontFamily: 'Monaco, Menlo, monospace'
                    }}>
                      {queryPreview}
                    </pre>
                  </Box>

                  <ColumnLayout columns={2} variant="text-grid">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(queryPreview);
                        alert('Query copied to clipboard!');
                      }}
                      iconName="copy"
                    >
                      Copy Query
                    </Button>
                    <Button
                      onClick={() => alert('Query would be executed directly against OSDU API (no AI processing)')}
                      variant="primary"
                      iconName="search"
                      disabled={criteria.some(c => !c.value)}
                    >
                      Execute Query
                    </Button>
                  </ColumnLayout>
                </SpaceBetween>
              </ExpandableSection>

              {/* Query History Preview */}
              <ExpandableSection
                headerText="Query History"
                variant="container"
              >
                <Cards
                  cardDefinition={{
                    header: item => (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.name}</span>
                        <Badge>{item.results} results</Badge>
                      </div>
                    ),
                    sections: [
                      {
                        id: 'query',
                        content: item => (
                          <Box fontSize="body-s" color="text-body-secondary">
                            <code>{item.query}</code>
                          </Box>
                        )
                      },
                      {
                        id: 'timestamp',
                        content: item => (
                          <Box fontSize="body-s" color="text-body-secondary">
                            {item.timestamp}
                          </Box>
                        )
                      }
                    ]
                  }}
                  items={[
                    {
                      name: 'Wells by Shell in Norway',
                      query: 'data.operator = "Shell" AND data.country = "Norway"',
                      results: 47,
                      timestamp: '2 hours ago'
                    },
                    {
                      name: 'Deep wells > 4000m',
                      query: 'data.depth > 4000',
                      results: 123,
                      timestamp: 'Yesterday'
                    },
                    {
                      name: 'Production wells in North Sea',
                      query: 'data.wellType = "Production" AND data.basin = "North Sea"',
                      results: 89,
                      timestamp: '3 days ago'
                    }
                  ]}
                  cardsPerRow={[{ cards: 1 }]}
                />
              </ExpandableSection>
            </SpaceBetween>
          </Container>
        )}

        {/* Comparison with Conversational Search */}
        <Container
          header={
            <Header variant="h2">
              Comparison: Query Builder vs Conversational Search
            </Header>
          }
        >
          <ColumnLayout columns={2} variant="text-grid">
            <SpaceBetween size="s">
              <Header variant="h3">
                <Icon name="settings" /> Query Builder
              </Header>
              <Box>
                <strong>Speed:</strong> Instant query building + 1-2s execution = <strong>1-2s total</strong>
              </Box>
              <Box>
                <strong>Predictability:</strong> Same inputs always produce same query
              </Box>
              <Box>
                <strong>Learning:</strong> See and learn OSDU query syntax
              </Box>
              <Box>
                <strong>Best For:</strong> Power users, complex queries, repeated searches
              </Box>
              <Box color="text-status-success">
                <strong>✓ Zero AI latency</strong>
              </Box>
              <Box color="text-status-success">
                <strong>✓ Deterministic results</strong>
              </Box>
              <Box color="text-status-success">
                <strong>✓ Query reuse via history</strong>
              </Box>
            </SpaceBetween>

            <SpaceBetween size="s">
              <Header variant="h3">
                <Icon name="contact" /> Conversational Search
              </Header>
              <Box>
                <strong>Speed:</strong> 2-5s AI processing + 1-2s execution = <strong>3-7s total</strong>
              </Box>
              <Box>
                <strong>Predictability:</strong> AI interpretation may vary
              </Box>
              <Box>
                <strong>Learning:</strong> Natural language, no syntax knowledge needed
              </Box>
              <Box>
                <strong>Best For:</strong> Exploratory searches, casual users, complex natural language
              </Box>
              <Box color="text-status-info">
                <strong>✓ Natural language interface</strong>
              </Box>
              <Box color="text-status-info">
                <strong>✓ No syntax knowledge required</strong>
              </Box>
              <Box color="text-status-info">
                <strong>✓ Contextual understanding</strong>
              </Box>
            </SpaceBetween>
          </ColumnLayout>
        </Container>

        {/* Use Cases */}
        <Container
          header={
            <Header variant="h2">
              Example Use Cases
            </Header>
          }
        >
          <Cards
            cardDefinition={{
              header: item => item.title,
              sections: [
                {
                  id: 'description',
                  content: item => <Box>{item.description}</Box>
                },
                {
                  id: 'query',
                  header: 'Query Builder Approach',
                  content: item => (
                    <Box>
                      <pre style={{
                        background: '#f4f4f4',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {item.query}
                      </pre>
                    </Box>
                  )
                },
                {
                  id: 'time',
                  content: item => (
                    <Badge color="green">
                      {item.time}
                    </Badge>
                  )
                }
              ]
            }}
            items={[
              {
                title: 'Find Shell wells in Norway',
                description: 'Simple two-criterion search',
                query: 'data.operator = "Shell"\nAND data.country = "Norway"',
                time: '~1.5s'
              },
              {
                title: 'Deep production wells',
                description: 'Combine type and depth filters',
                query: 'data.wellType = "Production"\nAND data.depth > 3000',
                time: '~1.8s'
              },
              {
                title: 'Recent North Sea data',
                description: 'Location and date range',
                query: 'data.basin = "North Sea"\nAND data.createdDate > "2024-01-01"',
                time: '~2.0s'
              },
              {
                title: 'Multiple operators',
                description: 'OR logic for operator list',
                query: 'data.operator IN ("Shell", "BP", "Equinor")\nAND data.status = "Active"',
                time: '~1.7s'
              }
            ]}
            cardsPerRow={[{ cards: 2 }]}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
