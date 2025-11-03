import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Badge,
  Box,
  ColumnLayout,
  KeyValuePairs,
  Alert,
  ExpandableSection,
  Cards,
  Link
} from '@cloudscape-design/components';

interface GuidanceSection {
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

interface BestPractice {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  impact: 'high' | 'medium' | 'low';
  estimatedCost: string;
}

interface TechnologyComparison {
  technology: string;
  efficiency: number;
  cost: string;
  suitability: string;
  pros: string[];
  cons: string[];
}

interface RegulatoryRequirement {
  jurisdiction: string;
  requirement: string;
  compliance: 'required' | 'recommended' | 'optional';
  deadline: string;
  description: string;
}

interface RenewableEnergyGuidanceData {
  topic: string;
  overview: string;
  guidanceSections: GuidanceSection[];
  bestPractices: BestPractice[];
  technologyComparisons: TechnologyComparison[];
  regulatoryRequirements: RegulatoryRequirement[];
  keyMetrics: {
    label: string;
    value: string;
    description: string;
  }[];
  resources: {
    title: string;
    type: 'article' | 'guide' | 'tool' | 'regulation';
    url: string;
    description: string;
  }[];
  nextSteps: string[];
}

interface RenewableEnergyGuidanceComponentProps {
  data: RenewableEnergyGuidanceData;
}

const RenewableEnergyGuidanceComponent: React.FC<RenewableEnergyGuidanceComponentProps> = ({ data }) => {
  const getImportanceBadge = (importance: string) => {
    const colorMap: Record<string, "red" | "blue" | "grey"> = {
      high: 'red',
      medium: 'blue', 
      low: 'grey'
    };
    return <Badge color={colorMap[importance] || 'grey'}>{importance.toUpperCase()}</Badge>;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colorMap: Record<string, "green" | "blue" | "red"> = {
      beginner: 'green',
      intermediate: 'blue',
      advanced: 'red'
    };
    return <Badge color={colorMap[difficulty] || 'blue'}>{difficulty}</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    const colorMap: Record<string, "green" | "blue" | "grey"> = {
      high: 'green',
      medium: 'blue',
      low: 'grey'
    };
    return <Badge color={colorMap[impact] || 'grey'}>{impact} impact</Badge>;
  };

  const getComplianceBadge = (compliance: string) => {
    const colorMap: Record<string, "red" | "blue" | "grey"> = {
      required: 'red',
      recommended: 'blue',
      optional: 'grey'
    };
    return <Badge color={colorMap[compliance] || 'grey'}>{compliance}</Badge>;
  };

  const getResourceTypeBadge = (type: string) => {
    const colorMap: Record<string, "blue" | "green" | "grey" | "red"> = {
      article: 'blue',
      guide: 'green',
      tool: 'grey',
      regulation: 'red'
    };
    return <Badge color={colorMap[type] || 'blue'}>{type}</Badge>;
  };

  const bestPracticeCards = data.bestPractices.map((practice, index) => ({
    id: `practice-${index}`,
    header: practice.title,
    description: practice.description,
    content: (
      <SpaceBetween direction="vertical" size="xs">
        <div>
          <SpaceBetween direction="horizontal" size="xs">
            {getDifficultyBadge(practice.difficulty)}
            {getImpactBadge(practice.impact)}
          </SpaceBetween>
        </div>
        <Box variant="small">
          <strong>Estimated Cost:</strong> {practice.estimatedCost}
        </Box>
      </SpaceBetween>
    )
  }));

  const technologyCards = data.technologyComparisons.map((tech, index) => ({
    id: `tech-${index}`,
    header: tech.technology,
    description: tech.suitability,
    content: (
      <SpaceBetween direction="vertical" size="s">
        <div>
          <Box variant="h5">Efficiency: {tech.efficiency}%</Box>
          <Box variant="small">Cost Range: {tech.cost}</Box>
        </div>
        <div>
          <Box variant="h5">Advantages:</Box>
          <ul>
            {tech.pros.map((pro, i) => <li key={i}>{pro}</li>)}
          </ul>
        </div>
        <div>
          <Box variant="h5">Disadvantages:</Box>
          <ul>
            {tech.cons.map((con, i) => <li key={i}>{con}</li>)}
          </ul>
        </div>
      </SpaceBetween>
    )
  }));

  const tabs = [
    {
      label: 'Overview & Guidance',
      id: 'overview',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Topic Overview</Header>
            <Box variant="p">{data.overview}</Box>
          </Container>

          <Container>
            <Header variant="h2">Key Metrics</Header>
            <KeyValuePairs 
              columns={2} 
              items={data.keyMetrics.map(metric => ({
                label: metric.label,
                value: (
                  <SpaceBetween direction="vertical" size="xs">
                    <Box variant="strong">{metric.value}</Box>
                    <Box variant="small" color="text-body-secondary">{metric.description}</Box>
                  </SpaceBetween>
                )
              }))}
            />
          </Container>

          <Container>
            <Header variant="h2">Guidance Sections</Header>
            <SpaceBetween direction="vertical" size="m">
              {data.guidanceSections.map((section, index) => (
                <ExpandableSection
                  key={index}
                  headerText={section.title}
                  headerActions={getImportanceBadge(section.importance)}
                >
                  <Box variant="p">{section.content}</Box>
                  <Box variant="small" color="text-body-secondary">
                    Category: {section.category}
                  </Box>
                </ExpandableSection>
              ))}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      )
    },
    {
      label: 'Best Practices',
      id: 'practices',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Implementation Guidance"
          >
            These best practices are organized by difficulty level and potential impact. 
            Start with high-impact, beginner-level practices for maximum benefit.
          </Alert>

          <Cards
            cardDefinition={{
              header: (item) => item.header,
              sections: [
                {
                  id: 'description',
                  content: (item) => item.description
                },
                {
                  id: 'details',
                  content: (item) => item.content
                }
              ]
            }}
            items={bestPracticeCards}
            loadingText="Loading best practices"
            empty={
              <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                <b>No best practices available</b>
                <Box variant="p" color="inherit">
                  No best practices to display for this topic.
                </Box>
              </Box>
            }
            header={
              <Header
                counter={`(${data.bestPractices.length})`}
                description="Proven strategies for renewable energy implementation"
              >
                Best Practices
              </Header>
            }
          />
        </SpaceBetween>
      )
    },
    {
      label: 'Technology Comparison',
      id: 'technology',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Technology Selection Guide"
          >
            Compare different renewable energy technologies to select the most suitable option 
            for your specific requirements and constraints.
          </Alert>

          <Cards
            cardDefinition={{
              header: (item) => item.header,
              sections: [
                {
                  id: 'description',
                  content: (item) => item.description
                },
                {
                  id: 'details',
                  content: (item) => item.content
                }
              ]
            }}
            items={technologyCards}
            loadingText="Loading technology comparisons"
            empty={
              <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                <b>No technology comparisons available</b>
                <Box variant="p" color="inherit">
                  No technology comparisons to display.
                </Box>
              </Box>
            }
            header={
              <Header
                counter={`(${data.technologyComparisons.length})`}
                description="Comparative analysis of renewable energy technologies"
              >
                Technology Options
              </Header>
            }
          />
        </SpaceBetween>
      )
    },
    {
      label: 'Regulatory Requirements',
      id: 'regulatory',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Alert
            statusIconAriaLabel="Warning"
            type="warning"
            header="Compliance Notice"
          >
            Regulatory requirements vary by jurisdiction and change frequently. 
            Always consult with local authorities and legal experts for current requirements.
          </Alert>

          <Container>
            <Header variant="h2">Regulatory Overview</Header>
            <SpaceBetween direction="vertical" size="m">
              {data.regulatoryRequirements.map((req, index) => (
                <Container key={index}>
                  <Header 
                    variant="h3"
                    actions={getComplianceBadge(req.compliance)}
                  >
                    {req.jurisdiction}: {req.requirement}
                  </Header>
                  <SpaceBetween direction="vertical" size="s">
                    <Box variant="p">{req.description}</Box>
                    {req.deadline && (
                      <Box variant="small">
                        <strong>Deadline:</strong> {req.deadline}
                      </Box>
                    )}
                  </SpaceBetween>
                </Container>
              ))}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      )
    },
    {
      label: 'Resources & Next Steps',
      id: 'resources',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Additional Resources</Header>
            <SpaceBetween direction="vertical" size="s">
              {data.resources.map((resource, index) => (
                <Box key={index}>
                  <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                    {getResourceTypeBadge(resource.type)}
                    <Link href={resource.url} external>
                      {resource.title}
                    </Link>
                  </SpaceBetween>
                  <Box variant="small" color="text-body-secondary">
                    {resource.description}
                  </Box>
                </Box>
              ))}
            </SpaceBetween>
          </Container>

          <Container>
            <Header variant="h2">Recommended Next Steps</Header>
            <ol>
              {data.nextSteps.map((step, index) => (
                <li key={index}>
                  <Box variant="p">{step}</Box>
                </li>
              ))}
            </ol>
          </Container>

          <Alert
            statusIconAriaLabel="Success"
            type="success"
            header="Ready to Get Started?"
          >
            Use this guidance as a foundation for your renewable energy project. 
            Consider consulting with industry experts for project-specific advice and implementation support.
          </Alert>
        </SpaceBetween>
      )
    }
  ];

  return (
    <Container>
      <Header
        variant="h1"
        description={`Comprehensive guidance for ${data.topic.toLowerCase()}`}
      >
        Renewable Energy Guidance: {data.topic}
      </Header>
      <Tabs tabs={tabs} />
    </Container>
  );
};

export default RenewableEnergyGuidanceComponent;
