'use client';

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
  Badge,
  ColumnLayout,
  Textarea,
  Icon,
  Alert
} from '@cloudscape-design/components';

/**
 * OSDU Query Builder - Chat Integration Mockup
 * 
 * This demonstrates how the Query Builder would integrate into the
 * existing catalog chat interface, showing the complete user workflow.
 */

interface QueryCriterion {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'query-builder' | 'conversational';
}

export default function OSDUQueryBuilderChatIntegration() {
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [dataType, setDataType] = useState('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([
    {
      id: '1',
      field: 'data.operator',
      operator: '=',
      value: 'Shell',
      logic: 'AND'
    },
    {
      id: '2',
      field: 'data.country',
      operator: '=',
      value: 'Norway',
      logic: 'AND'
    }
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'user',
      content: 'show me osdu wells',
      timestamp: '10:30 AM',
      type: 'conversational'
    },
    {
      id: '2',
      role: 'assistant',
      content: '🔍 OSDU Search Results\n\nFound 1,247 wells in the OSDU database.\n\nShowing top 10 results:\n• Well-001 (Shell, Norway, 3,450m)\n• Well-002 (Equinor, Norway, 4,120m)\n• Well-003 (BP, UK, 2,890m)\n...',
      timestamp: '10:30 AM',
      type: 'conversational'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const fieldsByType = {
    well: [
      { value: 'data.operator', label: 'Operator' },
      { value: 'data.country', label: 'Country' },
      { value: 'data.basin', label: 'Basin' },
      { value: 'data.depth', label: 'Depth (m)' },
      { value: 'data.wellType', label: 'Well Type' }
    ]
  };

  const operators = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'LIKE', label: 'Contains' }
  ];

  const generateQueryPreview = () => {
    if (criteria.length === 0) return '// Add criteria';
    
    return criteria.map((c, i) => {
      let part = i > 0 ? `${c.logic} ` : '';
      const quotedValue = isNaN(Number(c.value)) ? `"${c.value}"` : c.value;
      part += `${c.field} ${c.operator} ${quotedValue}`;
      return part;
    }).join('\n');
  };

  const executeQuery = () => {
    const query = generateQueryPreview();
    
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Query Builder Search:\n\`\`\`\n${query}\n\`\`\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'query-builder'
    };
    
    // Add assistant response
    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `✅ Query Executed Successfully\n\nFound 47 wells matching your criteria:\n• Shell-Norway-001 (3,450m, Production)\n• Shell-Norway-002 (4,120m, Exploration)\n• Shell-Norway-003 (2,890m, Production)\n...\n\n⚡ Execution time: 1.2s (Zero AI latency)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'query-builder'
    };
    
    setMessages([...messages, userMsg, assistantMsg]);
    setShowQueryBuilder(false);
  };

  const sendConversationalMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'conversational'
    };
    
    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `🔍 Searching OSDU data...\n\n(This would show conversational AI response with ~3-5s latency)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'conversational'
    };
    
    setMessages([...messages, userMsg, assistantMsg]);
    setChatInput('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <SpaceBetween size="l">
        {/* Header */}
        <Container>
          <Header
            variant="h1"
            description="See how the Query Builder integrates seamlessly into the catalog chat interface"
          >
            Query Builder - Chat Integration Demo
          </Header>
        </Container>

        {/* Main Chat Interface */}
        <Container>
          <SpaceBetween size="l">
            {/* Chat Header with Query Builder Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: '#f4f4f4',
              borderRadius: '8px'
            }}>
              <Header variant="h2">
                Data Catalog Chat
              </Header>
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color={showQueryBuilder ? 'green' : 'grey'}>
                  {showQueryBuilder ? 'Query Builder Active' : 'Conversational Mode'}
                </Badge>
                <Button
                  iconName="settings"
                  onClick={() => setShowQueryBuilder(!showQueryBuilder)}
                  variant={showQueryBuilder ? 'primary' : 'normal'}
                >
                  {showQueryBuilder ? 'Hide' : 'Show'} Query Builder
                </Button>
              </SpaceBetween>
            </div>

            {/* Query Builder Panel (Collapsible) */}
            {showQueryBuilder && (
              <Container
                header={
                  <Header
                    variant="h3"
                    description="Build structured OSDU queries with zero AI latency"
                    actions={
                      <Button
                        onClick={() => setShowQueryBuilder(false)}
                        variant="link"
                        iconName="close"
                      >
                        Close
                      </Button>
                    }
                  >
                    <Icon name="settings" /> OSDU Query Builder
                  </Header>
                }
              >
                <SpaceBetween size="m">
                  <Alert type="info">
                    <strong>💡 Tip:</strong> Use the Query Builder for fast, deterministic searches. 
                    Results in ~1-2s vs 3-7s for conversational search.
                  </Alert>

                  {/* Data Type */}
                  <FormField label="Data Type">
                    <Select
                      selectedOption={{ value: dataType, label: 'Well' }}
                      onChange={({ detail }) => setDataType(detail.selectedOption.value!)}
                      options={[
                        { value: 'well', label: 'Well' },
                        { value: 'wellbore', label: 'Wellbore' },
                        { value: 'log', label: 'Log' }
                      ]}
                    />
                  </FormField>

                  {/* Criteria */}
                  <SpaceBetween size="s">
                    <Header variant="h4" counter={`(${criteria.length})`}>
                      Filter Criteria
                    </Header>
                    
                    {criteria.map((criterion, index) => (
                      <Box key={criterion.id} padding="s" style={{ background: '#fafafa', borderRadius: '4px' }}>
                        <ColumnLayout columns={4} variant="text-grid">
                          <FormField label="Field">
                            <Select
                              selectedOption={fieldsByType[dataType].find(f => f.value === criterion.field)}
                              options={fieldsByType[dataType]}
                              disabled
                            />
                          </FormField>
                          <FormField label="Operator">
                            <Select
                              selectedOption={operators.find(o => o.value === criterion.operator)}
                              options={operators}
                              disabled
                            />
                          </FormField>
                          <FormField label="Value">
                            <Input value={criterion.value} disabled />
                          </FormField>
                          <FormField label="Logic">
                            {index > 0 && (
                              <Badge color="blue">{criterion.logic}</Badge>
                            )}
                          </FormField>
                        </ColumnLayout>
                      </Box>
                    ))}
                  </SpaceBetween>

                  {/* Query Preview */}
                  <ExpandableSection headerText="Query Preview" defaultExpanded>
                    <SpaceBetween size="s">
                      <pre style={{
                        background: '#232f3e',
                        color: '#d4d4d4',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'Monaco, monospace'
                      }}>
                        {generateQueryPreview()}
                      </pre>
                      <ColumnLayout columns={2}>
                        <Button iconName="copy">Copy Query</Button>
                        <Button
                          variant="primary"
                          iconName="search"
                          onClick={executeQuery}
                        >
                          Execute Query
                        </Button>
                      </ColumnLayout>
                    </SpaceBetween>
                  </ExpandableSection>
                </SpaceBetween>
              </Container>
            )}

            {/* Chat Messages */}
            <div style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '400px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              <SpaceBetween size="m">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: msg.role === 'user' ? '#0972d3' : '#f4f4f4',
                      color: msg.role === 'user' ? '#fff' : '#000'
                    }}>
                      <SpaceBetween size="xs">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
                          {msg.type === 'query-builder' && (
                            <Badge color="green">Query Builder</Badge>
                          )}
                          <span style={{ 
                            fontSize: '11px', 
                            opacity: 0.7 
                          }}>
                            {msg.timestamp}
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                          {msg.content}
                        </div>
                      </SpaceBetween>
                    </div>
                  </div>
                ))}
              </SpaceBetween>
            </div>

            {/* Chat Input */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <Textarea
                  value={chatInput}
                  onChange={({ detail }) => setChatInput(detail.value)}
                  placeholder="Type your message or use Query Builder above for structured search..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendConversationalMessage();
                    }
                  }}
                />
              </div>
              <Button
                variant="primary"
                iconName="send"
                onClick={sendConversationalMessage}
                disabled={!chatInput.trim()}
              >
                Send
              </Button>
            </div>
          </SpaceBetween>
        </Container>

        {/* Workflow Comparison */}
        <Container
          header={
            <Header variant="h2">
              User Workflow Comparison
            </Header>
          }
        >
          <ColumnLayout columns={2} variant="text-grid">
            {/* Query Builder Workflow */}
            <SpaceBetween size="s">
              <Header variant="h3">
                <Icon name="settings" /> Query Builder Workflow
              </Header>
              <Box>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Click "Show Query Builder" button</li>
                  <li>Select data type (Well, Log, etc.)</li>
                  <li>Add filter criteria via dropdowns</li>
                  <li>See live query preview</li>
                  <li>Click "Execute Query"</li>
                  <li>Results appear in chat (~1-2s)</li>
                </ol>
              </Box>
              <Alert type="success">
                <strong>Total Time: ~1-2 seconds</strong>
                <br />
                ✓ Zero AI processing latency
                <br />
                ✓ Deterministic results
                <br />
                ✓ Learn OSDU syntax
              </Alert>
            </SpaceBetween>

            {/* Conversational Workflow */}
            <SpaceBetween size="s">
              <Header variant="h3">
                <Icon name="contact" /> Conversational Workflow
              </Header>
              <Box>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>Type natural language query</li>
                  <li>Click "Send"</li>
                  <li>AI interprets query (2-5s)</li>
                  <li>OSDU API executes (1-2s)</li>
                  <li>Results appear in chat</li>
                </ol>
              </Box>
              <Alert type="info">
                <strong>Total Time: ~3-7 seconds</strong>
                <br />
                ✓ Natural language interface
                <br />
                ✓ No syntax knowledge needed
                <br />
                ✓ Contextual understanding
              </Alert>
            </SpaceBetween>
          </ColumnLayout>
        </Container>

        {/* Integration Benefits */}
        <Container
          header={
            <Header variant="h2">
              Why Both Approaches?
            </Header>
          }
        >
          <SpaceBetween size="m">
            <Alert type="success">
              <strong>Complementary, Not Competing</strong>
              <br />
              The Query Builder and conversational search work together to serve different user needs and scenarios.
            </Alert>

            <ColumnLayout columns={3} variant="text-grid">
              <SpaceBetween size="xs">
                <Header variant="h4">Use Query Builder When:</Header>
                <Box>• You know exactly what you want</Box>
                <Box>• Speed is critical</Box>
                <Box>• Building complex multi-criteria queries</Box>
                <Box>• Reusing similar queries</Box>
                <Box>• Learning OSDU query syntax</Box>
                <Box>• Need deterministic results</Box>
              </SpaceBetween>

              <SpaceBetween size="xs">
                <Header variant="h4">Use Conversational When:</Header>
                <Box>• Exploring data</Box>
                <Box>• Unsure of exact criteria</Box>
                <Box>• Complex natural language requests</Box>
                <Box>• Need contextual understanding</Box>
                <Box>• Prefer natural language</Box>
                <Box>• One-off queries</Box>
              </SpaceBetween>

              <SpaceBetween size="xs">
                <Header variant="h4">Seamless Switching:</Header>
                <Box>• Toggle between modes anytime</Box>
                <Box>• Both appear in same chat</Box>
                <Box>• Shared message history</Box>
                <Box>• Consistent result display</Box>
                <Box>• No context loss</Box>
                <Box>• Best of both worlds</Box>
              </SpaceBetween>
            </ColumnLayout>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
