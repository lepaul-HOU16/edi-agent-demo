/**
 * Site Suitability Visualization Dashboard
 * 
 * Displays comprehensive site suitability assessment with component scores,
 * risk factors, and development recommendations in an interactive dashboard format.
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  ProgressBar,
  Badge,
  Button,
  Cards,
  ColumnLayout,
  StatusIndicator,
  Popover,
  Icon,
  Alert,
  Tabs,
  Table,
  TextContent
} from '@cloudscape-design/components';
import {
  SiteSuitabilityAssessment,
  ComponentScore,
  RiskFactor,
  SuitabilityRecommendation
} from '../../types/suitabilityScoring';

interface SuitabilityVisualizationDashboardProps {
  assessment: SiteSuitabilityAssessment;
  onExportResults?: () => void;
  onGenerateReport?: () => void;
  onCompareAlternatives?: () => void;
  className?: string;
}

/**
 * Site Suitability Visualization Dashboard Component
 */
export const SuitabilityVisualizationDashboard: React.FC<SuitabilityVisualizationDashboardProps> = ({
  assessment,
  onExportResults,
  onGenerateReport,
  onCompareAlternatives,
  className
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());

  // Calculate overall rating based on score
  const overallRating = useMemo(() => {
    const score = assessment.overallScore;
    if (score >= 80) return { label: 'Excellent', variant: 'success' as const };
    if (score >= 60) return { label: 'Good', variant: 'success' as const };
    if (score >= 40) return { label: 'Fair', variant: 'warning' as const };
    if (score >= 20) return { label: 'Poor', variant: 'warning' as const };
    return { label: 'Unsuitable', variant: 'warning' as const };
  }, [assessment.overallScore]);

  // Sort risks by severity
  const sortedRisks = useMemo(() => {
    return [...assessment.riskFactors].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [assessment.riskFactors]);

  // Sort recommendations by priority
  const sortedRecommendations = useMemo(() => {
    return [...assessment.recommendations].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [assessment.recommendations]);

  const toggleRiskExpansion = (riskId: string) => {
    const newExpanded = new Set(expandedRisks);
    if (newExpanded.has(riskId)) {
      newExpanded.delete(riskId);
    } else {
      newExpanded.add(riskId);
    }
    setExpandedRisks(newExpanded);
  };

  const renderOverallScoreCard = () => (
    <Container header={<Header variant="h2">Overall Site Suitability</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <Box textAlign="center">
          <Box fontSize="display-l" fontWeight="bold" color={overallRating.variant === 'success' ? 'text-status-success' : 
                                                              overallRating.variant === 'warning' ? 'text-status-warning' : 'text-status-error'}>
            {assessment.overallScore.toFixed(1)}
          </Box>
          <Box fontSize="heading-s" color="text-body-secondary">
            out of 100
          </Box>
          <Box margin={{ top: 's' }}>
            <Badge color="green">{overallRating.label}</Badge>
          </Box>
        </Box>
        
        <ProgressBar
          value={assessment.overallScore}
          additionalInfo={`${assessment.overallScore.toFixed(1)}% suitability`}
          description="Overall site suitability score"
        />

        <Box textAlign="center">
          <TextContent>
            <p>
              <strong>{assessment.location.name || 'Site'}</strong> shows{' '}
              <strong>{overallRating.label.toLowerCase()}</strong> suitability for renewable energy development
              based on comprehensive multi-criteria assessment.
            </p>
          </TextContent>
        </Box>
      </SpaceBetween>
    </Container>
  );

  const renderComponentScores = () => (
    <Container header={<Header variant="h2">Component Scores</Header>}>
      <SpaceBetween direction="vertical" size="m">
        {Object.entries(assessment.componentScores).map(([key, score]) => (
          <ComponentScoreCard key={key} componentName={key} score={score} />
        ))}
      </SpaceBetween>
    </Container>
  );

  const renderRiskFactors = () => (
    <Container header={<Header variant="h2">Risk Factors</Header>}>
      <SpaceBetween direction="vertical" size="m">
        {sortedRisks.length === 0 ? (
          <Alert type="success" header="No significant risks identified">
            The site assessment has not identified any significant risk factors that would impact development.
          </Alert>
        ) : (
          <Cards
            cardDefinition={{
              header: (risk: RiskFactor) => (
                <Box>
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Header variant="h3">{risk.description}</Header>
                    <Badge color={getRiskSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </SpaceBetween>
                </Box>
              ),
              sections: [
                {
                  id: 'riskDetails',
                  content: (risk: RiskFactor) => (
                    <SpaceBetween direction="vertical" size="s">
                      <ColumnLayout columns={3} variant="text-grid">
                        <div>
                          <Box variant="awsui-key-label">Risk Score</Box>
                          <Box>{risk.riskScore.toFixed(0)}</Box>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Probability</Box>
                          <Box>{(risk.probability * 100).toFixed(0)}%</Box>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Impact</Box>
                          <Box>{(risk.impact * 100).toFixed(0)}%</Box>
                        </div>
                      </ColumnLayout>
                      
                      {expandedRisks.has(risk.id) && (
                        <SpaceBetween direction="vertical" size="s">
                          <Box variant="awsui-key-label">Mitigation Strategies</Box>
                          {risk.mitigationStrategies.map((strategy, index) => (
                            <Box key={index} padding={{ left: 's' }}>
                              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                                <Icon name="check" variant="success" />
                                <Box>{strategy.strategy}</Box>
                                <Badge color="blue">
                                  {(strategy.effectiveness * 100).toFixed(0)}% effective
                                </Badge>
                              </SpaceBetween>
                            </Box>
                          ))}
                        </SpaceBetween>
                      )}
                      
                      <Box textAlign="right">
                        <Button
                          variant="link"
                          onClick={() => toggleRiskExpansion(risk.id)}
                        >
                          {expandedRisks.has(risk.id) ? 'Show less' : 'Show mitigation strategies'}
                        </Button>
                      </Box>
                    </SpaceBetween>
                  )
                }
              ]
            }}
            items={sortedRisks}
            loadingText="Loading risk factors..."
            empty={
              <Box textAlign="center" color="inherit">
                <b>No risk factors identified</b>
                <Box variant="p" color="inherit">
                  The assessment has not identified any significant risks.
                </Box>
              </Box>
            }
          />
        )}
      </SpaceBetween>
    </Container>
  );

  const renderRecommendations = () => (
    <Container header={<Header variant="h2">Development Recommendations</Header>}>
      <SpaceBetween direction="vertical" size="m">
        <Cards
          cardDefinition={{
            header: (rec: SuitabilityRecommendation) => (
              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                <Header variant="h3">{rec.title}</Header>
                <Badge color={getRecommendationPriorityColor(rec.priority)}>
                  {rec.priority.toUpperCase()}
                </Badge>
                <Badge color="grey">{rec.category}</Badge>
              </SpaceBetween>
            ),
            sections: [
              {
                id: 'description',
                content: (rec: SuitabilityRecommendation) => (
                  <SpaceBetween direction="vertical" size="s">
                    <TextContent>
                      <p>{rec.description}</p>
                      <p><em>{rec.rationale}</em></p>
                    </TextContent>
                    
                    <ColumnLayout columns={2} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">Expected Benefits</Box>
                        <SpaceBetween direction="vertical" size="xs">
                          {rec.expectedBenefit.scoreImprovement > 0 && (
                            <Box>Score improvement: +{rec.expectedBenefit.scoreImprovement} points</Box>
                          )}
                          {rec.expectedBenefit.riskReduction > 0 && (
                            <Box>Risk reduction: {rec.expectedBenefit.riskReduction}%</Box>
                          )}
                          {rec.expectedBenefit.timelineBenefit > 0 && (
                            <Box>Timeline benefit: {rec.expectedBenefit.timelineBenefit} months</Box>
                          )}
                        </SpaceBetween>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Implementation</Box>
                        <SpaceBetween direction="vertical" size="xs">
                          <Box>Duration: {rec.implementation.totalDuration} months</Box>
                          <Box>Cost: ${rec.implementation.totalCost.toLocaleString()}</Box>
                          <Box>Phases: {rec.implementation.phases.length}</Box>
                        </SpaceBetween>
                      </div>
                    </ColumnLayout>
                  </SpaceBetween>
                )
              }
            ]
          }}
          items={sortedRecommendations}
          loadingText="Loading recommendations..."
          empty={
            <Box textAlign="center" color="inherit">
              <b>No recommendations available</b>
              <Box variant="p" color="inherit">
                No specific recommendations have been generated for this site.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>
    </Container>
  );

  const renderSiteDetails = () => (
    <Container header={<Header variant="h2">Site Information</Header>}>
      <ColumnLayout columns={2} variant="text-grid">
        <SpaceBetween direction="vertical" size="s">
          <div>
            <Box variant="awsui-key-label">Location</Box>
            <Box>{assessment.location.name || 'Unnamed Site'}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Coordinates</Box>
            <Box>{assessment.location.lat.toFixed(4)}, {assessment.location.lng.toFixed(4)}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Region</Box>
            <Box>{assessment.location.region}</Box>
          </div>
        </SpaceBetween>
        <SpaceBetween direction="vertical" size="s">
          <div>
            <Box variant="awsui-key-label">Elevation</Box>
            <Box>{assessment.location.elevation} meters</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Site Area</Box>
            <Box>{assessment.location.area} km²</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Assessment Date</Box>
            <Box>{new Date(assessment.metadata.createdAt).toLocaleDateString()}</Box>
          </div>
        </SpaceBetween>
      </ColumnLayout>
    </Container>
  );

  return (
    <div className={className}>
      <SpaceBetween direction="vertical" size="l">
        <Container>
          <SpaceBetween direction="horizontal" size="s" alignItems="center">
            <Header variant="h1">Site Suitability Assessment</Header>
            <SpaceBetween direction="horizontal" size="s">
              {onExportResults && (
                <Button onClick={onExportResults} iconName="download">
                  Export Results
                </Button>
              )}
              {onCompareAlternatives && (
                <Button onClick={onCompareAlternatives}>
                  Compare Alternatives
                </Button>
              )}
              {onGenerateReport && (
                <Button variant="primary" onClick={onGenerateReport}>
                  Generate Report
                </Button>
              )}
            </SpaceBetween>
          </SpaceBetween>
        </Container>

        <Tabs
          activeTabId={selectedTab}
          onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
                    {renderOverallScoreCard()}
                    {renderSiteDetails()}
                  </Grid>
                  {renderComponentScores()}
                </SpaceBetween>
              )
            },
            {
              id: 'risks',
              label: `Risk Factors (${assessment.riskFactors.length})`,
              content: renderRiskFactors()
            },
            {
              id: 'recommendations',
              label: `Recommendations (${assessment.recommendations.length})`,
              content: renderRecommendations()
            }
          ]}
        />
      </SpaceBetween>
    </div>
  );
};/**

 * Component Score Card - displays individual component assessment
 */
interface ComponentScoreCardProps {
  componentName: string;
  score: ComponentScore;
}

const ComponentScoreCard: React.FC<ComponentScoreCardProps> = ({ componentName, score }) => {
  const formatComponentName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-status-success';
    if (scoreValue >= 60) return 'text-status-info';
    if (scoreValue >= 40) return 'text-status-warning';
    return 'text-status-error';
  };

  const getScoreVariant = (scoreValue: number) => {
    if (scoreValue >= 80) return 'success' as const;
    if (scoreValue >= 60) return 'info' as const;
    if (scoreValue >= 40) return 'warning' as const;
    return 'error' as const;
  };

  return (
    <Box padding="s">
      <SpaceBetween direction="vertical" size="s">
        <SpaceBetween direction="horizontal" size="s" alignItems="center">
          <Header variant="h3">{formatComponentName(componentName)}</Header>
          <Popover
            dismissButton={false}
            position="top"
            size="small"
            triggerType="custom"
            content={
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="awsui-key-label">Weight in Overall Score</Box>
                <Box>{(score.weight * 100).toFixed(0)}%</Box>
                <Box variant="awsui-key-label">Data Quality</Box>
                <Box>{score.dataQuality}</Box>
                <Box variant="awsui-key-label">Confidence</Box>
                <Box>{(score.confidence * 100).toFixed(0)}%</Box>
              </SpaceBetween>
            }
          >
            <Button variant="icon" iconName="status-info" />
          </Popover>
        </SpaceBetween>

        <SpaceBetween direction="horizontal" size="l" alignItems="center">
          <Box>
            <ProgressBar
              value={score.score}
              additionalInfo={`${score.score.toFixed(1)}/100`}
            />
          </Box>
          <Box fontSize="heading-m" fontWeight="bold" color={getScoreColor(score.score)}>
            {score.score.toFixed(1)}
          </Box>
        </SpaceBetween>

        <Box fontSize="body-s" color="text-body-secondary">
          {score.rationale}
        </Box>

        {Object.keys(score.subScores).length > 0 && (
          <SpaceBetween direction="vertical" size="xs">
            <Box variant="awsui-key-label">Component Breakdown</Box>
            <ColumnLayout columns={2} variant="text-grid">
              {Object.entries(score.subScores).map(([subKey, subScore]) => (
                <div key={subKey}>
                  <Box fontSize="body-s">
                    {formatComponentName(subKey)}: {subScore.toFixed(1)}
                  </Box>
                </div>
              ))}
            </ColumnLayout>
          </SpaceBetween>
        )}

        {score.improvementPotential > 0 && (
          <Alert type="info" header="Improvement Potential">
            This component could potentially improve by up to {score.improvementPotential.toFixed(1)} points
            with targeted interventions.
          </Alert>
        )}
      </SpaceBetween>
    </Box>
  );
};

/**
 * Helper functions for styling and formatting
 */
const getRiskSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'red';
    case 'high': return 'red';
    case 'medium': return 'grey';
    case 'low': return 'green';
    default: return 'grey';
  }
};

const getRecommendationPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'red';
    case 'high': return 'red';
    case 'medium': return 'grey';
    case 'low': return 'green';
    default: return 'grey';
  }
};

export default SuitabilityVisualizationDashboard;