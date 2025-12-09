import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  Button,
  Select,
  Input,
  FormField,
  ExpandableSection,
  Alert,
  Badge,
  Toggle,
  ColumnLayout,
  Table
} from '@cloudscape-design/components';
import { CompactOSDUQueryBuilder } from '@/components/CompactOSDUQueryBuilder';
import './OSDUQueryBuilderMockup.css';

const OldQueryBuilder: React.FC = () => {
  return (
    <div className="old-query-builder-container">
      <Container>
        <SpaceBetween size="l">
          <FormField label="Data Type">
            <Select
              selectedOption={{ label: 'Well', value: 'well' }}
              options={[{ label: 'Well', value: 'well' }]}
            />
          </FormField>

          <Container header={<Header variant="h3">Criterion 1</Header>}>
            <SpaceBetween size="m">
              <FormField label="Field">
                <Select
                  selectedOption={{ label: 'Operator', value: 'operator' }}
                  options={[{ label: 'Operator', value: 'operator' }]}
                />
              </FormField>
              <FormField label="Operator">
                <Select
                  selectedOption={{ label: 'Equals', value: '=' }}
                  options={[{ label: 'Equals', value: '=' }]}
                />
              </FormField>
              <FormField label="Value">
                <Input value="Shell" />
              </FormField>
              <Button>Remove</Button>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Criterion 2</Header>}>
            <SpaceBetween size="m">
              <FormField label="Field">
                <Select
                  selectedOption={{ label: 'Country', value: 'country' }}
                  options={[{ label: 'Country', value: 'country' }]}
                />
              </FormField>
              <FormField label="Operator">
                <Select
                  selectedOption={{ label: 'Equals', value: '=' }}
                  options={[{ label: 'Equals', value: '=' }]}
                />
              </FormField>
              <FormField label="Value">
                <Input value="Norway" />
              </FormField>
              <Button>Remove</Button>
            </SpaceBetween>
          </Container>

          <FormField label="Query Preview">
            <Box padding="s">
              <code className="query-preview-code">
                data.operator = "Shell" AND data.country = "Norway"
              </code>
            </Box>
          </FormField>

          <FormField label="Advanced Options">
            <Input value="1000" placeholder="Max Results" />
          </FormField>

          <Button variant="primary" fullWidth>Execute Query</Button>
        </SpaceBetween>
      </Container>
    </div>
  );
};

export default function OSDUQueryBuilderMockup() {
  const [showOld, setShowOld] = useState(false);
  const [isSticky, setIsSticky] = useState(true);

  const metricsData = [
    { metric: 'Lines of Code', old: '1971', new: '~500', improvement: '75% reduction', isGood: true },
    { metric: 'Max Height', old: '800px+', new: '400px', improvement: '50% smaller', isGood: true },
    { metric: 'Sticky Positioning', old: 'No', new: 'Yes (z-index 1400)', improvement: 'Always visible', isGood: true },
    { metric: 'Query Preview Update', old: 'Immediate', new: 'Debounced (300ms)', improvement: 'Faster', isGood: true },
    { metric: 'Advanced Options', old: 'Always visible', new: 'Collapsed', improvement: 'Cleaner UI', isGood: true },
    { metric: 'Mobile Optimized', old: 'No', new: 'Yes', improvement: 'Responsive', isGood: true },
    { metric: 'Criteria Layout', old: 'Vertical (huge)', new: 'Inline (compact)', improvement: 'Space efficient', isGood: true }
  ];

  return (
    <div className="mockup-page-container">
      <SpaceBetween size="l">
        <Header variant="h1">
          OSDU Query Builder - Compact Design
        </Header>

        <Box variant="p" color="text-body-secondary">
          Redesigned for speed, simplicity, and sticky behavior
        </Box>

        <SpaceBetween direction="horizontal" size="s">
          <Toggle
            checked={showOld}
            onChange={({ detail }) => setShowOld(detail.checked)}
          >
            Show Old Design
          </Toggle>
          <Toggle
            checked={isSticky}
            onChange={({ detail }) => setIsSticky(detail.checked)}
          >
            Enable Sticky
          </Toggle>
        </SpaceBetween>

        <Grid gridDefinition={showOld ? [{ colspan: 6 }, { colspan: 6 }] : [{ colspan: 12 }]}>
          <Container
            header={
              <Header variant="h2">
                <SpaceBetween direction="horizontal" size="xs">
                  <span>New Design</span>
                  <Badge color="green">COMPACT</Badge>
                </SpaceBetween>
              </Header>
            }
          >
            <SpaceBetween size="m">
              <CompactOSDUQueryBuilder 
                isSticky={isSticky}
                onExecute={() => {}}
                onClose={() => {}}
              />

              <Alert type="success" header="Key Improvements">
                <ColumnLayout columns={2} variant="text-grid">
                  <div>
                    <Box variant="strong">Max 400px height</Box>
                    <Box variant="p">Compact and focused</Box>
                  </div>
                  <div>
                    <Box variant="strong">Sticky positioning</Box>
                    <Box variant="p">Stays at top when scrolling</Box>
                  </div>
                  <div>
                    <Box variant="strong">Scrollable criteria</Box>
                    <Box variant="p">Handle many filters gracefully</Box>
                  </div>
                  <div>
                    <Box variant="strong">Inline forms</Box>
                    <Box variant="p">All fields in one row</Box>
                  </div>
                  <div>
                    <Box variant="strong">Collapsed preview</Box>
                    <Box variant="p">Expand only when needed</Box>
                  </div>
                  <div>
                    <Box variant="strong">~500 lines</Box>
                    <Box variant="p">75% smaller codebase</Box>
                  </div>
                </ColumnLayout>
              </Alert>
            </SpaceBetween>
          </Container>

          {showOld && (
            <Container
              header={
                <Header variant="h2">
                  <SpaceBetween direction="horizontal" size="xs">
                    <span>Old Design</span>
                    <Badge color="red">LARGE</Badge>
                  </SpaceBetween>
                </Header>
              }
            >
              <SpaceBetween size="m">
                <OldQueryBuilder />

                <Alert type="warning" header="Issues">
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="strong">800px+ height</Box>
                      <Box variant="p">Takes up entire screen</Box>
                    </div>
                    <div>
                      <Box variant="strong">Not sticky</Box>
                      <Box variant="p">Scrolls away with results</Box>
                    </div>
                    <div>
                      <Box variant="strong">Vertical layout</Box>
                      <Box variant="p">Each criterion is huge</Box>
                    </div>
                    <div>
                      <Box variant="strong">Always expanded</Box>
                      <Box variant="p">All options visible</Box>
                    </div>
                    <div>
                      <Box variant="strong">1971 lines</Box>
                      <Box variant="p">Massive codebase</Box>
                    </div>
                    <div>
                      <Box variant="strong">Slow updates</Box>
                      <Box variant="p">No debouncing</Box>
                    </div>
                  </ColumnLayout>
                </Alert>
              </SpaceBetween>
            </Container>
          )}
        </Grid>

        <Container header={<Header variant="h2">Metrics Comparison</Header>}>
          <Table
            columnDefinitions={[
              {
                id: 'metric',
                header: 'Metric',
                cell: item => item.metric
              },
              {
                id: 'old',
                header: 'Old Design',
                cell: item => <Badge color="red">{item.old}</Badge>
              },
              {
                id: 'new',
                header: 'New Design',
                cell: item => <Badge color="green">{item.new}</Badge>
              },
              {
                id: 'improvement',
                header: 'Improvement',
                cell: item => <Box variant="strong" color="text-status-success">{item.improvement}</Box>
              }
            ]}
            items={metricsData}
            variant="embedded"
          />
        </Container>

        <Container header={<Header variant="h2">Scroll Demo - Query Builder Stays at Top</Header>}>
          <SpaceBetween size="m">
            <Box variant="p" color="text-body-secondary">
              Scroll down to see how the compact query builder remains sticky at the top of the viewport.
              The old design would scroll away, forcing you to scroll back up to modify your query.
            </Box>

            {Array.from({ length: 10 }).map((_, i) => (
              <Box key={i} padding="l" className="demo-result-box">
                <SpaceBetween size="xs">
                  <Box variant="strong">WELL-{String(i + 1).padStart(3, '0')} - North Sea</Box>
                  <Box variant="small" color="text-body-secondary">
                    Operator: Shell | Depth: {3500 + (i * 300)}m | Country: Norway
                  </Box>
                </SpaceBetween>
              </Box>
            ))}

            <Alert type="info" header="Notice">
              As you scroll, the compact query builder at the top stays visible with a shadow effect.
              This allows you to modify your query without losing your place in the results!
            </Alert>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
