/**
 * Site Comparison Dashboard
 * 
 * Provides comparative analysis for multiple site options with ranking,
 * side-by-side comparison, and decision support tools.
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Grid,
  Box,
  Button,
  Table,
  Badge,
  ProgressBar,
  ColumnLayout,
  Cards,
  Tabs,
  Alert,
  TextContent,
  StatusIndicator,
  Select,
  FormField
} from '@cloudscape-design/components';
import {
  SiteSuitabilityAssessment,
  ComparativeAnalysis,
  SiteComparison,
  ComponentScores
} from '../../types/suitabilityScoring';

interface SiteComparisonDashboardProps {
  sites: SiteSuitabilityAssessment[];
  comparativeAnalysis?: ComparativeAnalysis;
  onSelectSite?: (siteId: string) => void;
  onGenerateComparison?: () => void;
  className?: string;
}

/**
 * Site Comparison Dashboard Component
 */
export const SiteComparisonDashboard: React.FC<SiteComparisonDashboardProps> = ({
  sites,
  comparativeAnalysis,
  onSelectSite,
  onGenerateComparison,
  className
}) => {
  const [selectedTab, setSelectedTab] = useState('ranking');
  const [comparisonCriteria, setComparisonCriteria] = useState('overall');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // Sort sites by overall score
  const rankedSites = useMemo(() => {
    return [...sites].sort((a, b) => b.overallScore - a.overallScore);
  }, [sites]);

  // Get top performing site
  const topSite = rankedSites[0];

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (sites.length < 2) return null;

    const scores = sites.map(s => s.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreRange = maxScore - minScore;

    return {
      averageScore: avgScore,
      maxScore,
      minScore,
      scoreRange,
      topPerformer: sites.find(s => s.overallScore === maxScore)?.location.name || 'Unknown'
    };
  }, [sites]);

  const renderRankingTable = () => (
    <Container header={<Header variant="h2">Site Ranking</Header>}>
      <Table
        columnDefinitions={[
          {
            id: 'rank',
            header: 'Rank',
            cell: (item: SiteSuitabilityAssessment) => {
              const index = rankedSites.indexOf(item);
              return <Box fontWeight="bold">#{index + 1}</Box>;
            },
            width: 60
          },
          {
            id: 'site',
            header: 'Site',
            cell: (item: SiteSuitabilityAssessment) => (
              <SpaceBetween direction="vertical" size="xs">
                <Box fontWeight="bold">{item.location.name || `Site ${item.siteId}`}</Box>
                <Box fontSize="body-s" color="text-body-secondary">
                  {item.location.region}
                </Box>
              </SpaceBetween>
            )
          },
          {
            id: 'overallScore',
            header: 'Overall Score',
            cell: (item: SiteSuitabilityAssessment) => (
              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                <Box fontWeight="bold" fontSize="heading-s">
                  {item.overallScore.toFixed(1)}
                </Box>
                <ProgressBar
                  value={item.overallScore}
                />
              </SpaceBetween>
            )
          },
          {
            id: 'windResource',
            header: 'Wind Resource',
            cell: (item: SiteSuitabilityAssessment) => (
              <Box>{item.componentScores.windResource.score.toFixed(1)}</Box>
            )
          },
          {
            id: 'terrain',
            header: 'Terrain',
            cell: (item: SiteSuitabilityAssessment) => (
              <Box>{item.componentScores.terrainSuitability.score.toFixed(1)}</Box>
            )
          },
          {
            id: 'grid',
            header: 'Grid',
            cell: (item: SiteSuitabilityAssessment) => (
              <Box>{item.componentScores.gridConnectivity.score.toFixed(1)}</Box>
            )
          },
          {
            id: 'environmental',
            header: 'Environmental',
            cell: (item: SiteSuitabilityAssessment) => (
              <Box>{item.componentScores.environmentalImpact.score.toFixed(1)}</Box>
            )
          },
          {
            id: 'risks',
            header: 'Risk Level',
            cell: (item: SiteSuitabilityAssessment) => {
              const highRisks = item.riskFactors.filter(r => r.severity === 'high' || r.severity === 'critical').length;
              const mediumRisks = item.riskFactors.filter(r => r.severity === 'medium').length;
              
              if (highRisks > 0) {
                return <Badge color="red">High ({highRisks})</Badge>;
              } else if (mediumRisks > 0) {
                return <Badge color="grey">Medium ({mediumRisks})</Badge>;
              } else {
                return <Badge color="green">Low</Badge>;
              }
            }
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (item: SiteSuitabilityAssessment) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => onSelectSite?.(item.siteId)}
                >
                  View Details
                </Button>
              </SpaceBetween>
            )
          }
        ]}
        items={rankedSites}
        loadingText="Loading sites..."
        empty={
          <Box textAlign="center" color="inherit">
            <b>No sites to compare</b>
            <Box variant="p" color="inherit">
              Add sites to begin comparison analysis.
            </Box>
          </Box>
        }
        header={
          <Header
            counter={`(${sites.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="s">
                {onGenerateComparison && (
                  <Button onClick={onGenerateComparison}>
                    Generate Detailed Comparison
                  </Button>
                )}
              </SpaceBetween>
            }
          >
            Site Comparison Results
          </Header>
        }
      />
    </Container>
  );

  const renderSummaryCards = () => (
    <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
      <Container>
        <SpaceBetween direction="vertical" size="s">
          <Box variant="awsui-key-label">Sites Evaluated</Box>
          <Box fontSize="display-l" fontWeight="bold">
            {sites.length}
          </Box>
        </SpaceBetween>
      </Container>
      
      <Container>
        <SpaceBetween direction="vertical" size="s">
          <Box variant="awsui-key-label">Top Performer</Box>
          <Box fontSize="heading-m" fontWeight="bold">
            {comparisonMetrics?.topPerformer || 'N/A'}
          </Box>
          <Box fontSize="body-s" color="text-body-secondary">
            Score: {comparisonMetrics?.maxScore.toFixed(1) || 'N/A'}
          </Box>
        </SpaceBetween>
      </Container>
      
      <Container>
        <SpaceBetween direction="vertical" size="s">
          <Box variant="awsui-key-label">Average Score</Box>
          <Box fontSize="display-l" fontWeight="bold">
            {comparisonMetrics?.averageScore.toFixed(1) || 'N/A'}
          </Box>
        </SpaceBetween>
      </Container>
      
      <Container>
        <SpaceBetween direction="vertical" size="s">
          <Box variant="awsui-key-label">Score Range</Box>
          <Box fontSize="heading-m" fontWeight="bold">
            {comparisonMetrics?.scoreRange.toFixed(1) || 'N/A'}
          </Box>
          <Box fontSize="body-s" color="text-body-secondary">
            {comparisonMetrics?.minScore.toFixed(1)} - {comparisonMetrics?.maxScore.toFixed(1)}
          </Box>
        </SpaceBetween>
      </Container>
    </Grid>
  );

  const renderComponentComparison = () => (
    <Container header={<Header variant="h2">Component Score Comparison</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <FormField label="Comparison Criteria">
          <Select
            selectedOption={{ label: 'Overall Score', value: 'overall' }}
            onChange={({ detail }) => setComparisonCriteria(detail.selectedOption.value)}
            options={[
              { label: 'Overall Score', value: 'overall' },
              { label: 'Wind Resource', value: 'windResource' },
              { label: 'Terrain Suitability', value: 'terrainSuitability' },
              { label: 'Grid Connectivity', value: 'gridConnectivity' },
              { label: 'Environmental Impact', value: 'environmentalImpact' },
              { label: 'Economic Viability', value: 'economicViability' }
            ]}
          />
        </FormField>

        <Cards
          cardDefinition={{
            header: (site: SiteSuitabilityAssessment) => (
              <Header variant="h3">
                {site.location.name || `Site ${site.siteId}`}
              </Header>
            ),
            sections: [
              {
                id: 'scores',
                content: (site: SiteSuitabilityAssessment) => (
                  <SpaceBetween direction="vertical" size="s">
                    <ComponentScoreBar
                      label="Wind Resource"
                      score={site.componentScores.windResource.score}
                      weight={site.componentScores.windResource.weight}
                    />
                    <ComponentScoreBar
                      label="Terrain Suitability"
                      score={site.componentScores.terrainSuitability.score}
                      weight={site.componentScores.terrainSuitability.weight}
                    />
                    <ComponentScoreBar
                      label="Grid Connectivity"
                      score={site.componentScores.gridConnectivity.score}
                      weight={site.componentScores.gridConnectivity.weight}
                    />
                    <ComponentScoreBar
                      label="Environmental Impact"
                      score={site.componentScores.environmentalImpact.score}
                      weight={site.componentScores.environmentalImpact.weight}
                    />
                    <ComponentScoreBar
                      label="Economic Viability"
                      score={site.componentScores.economicViability.score}
                      weight={site.componentScores.economicViability.weight}
                    />
                  </SpaceBetween>
                )
              }
            ]
          }}
          items={rankedSites.slice(0, 4)} // Show top 4 sites
          loadingText="Loading comparison..."
        />
      </SpaceBetween>
    </Container>
  );

  const renderRecommendations = () => (
    <Container header={<Header variant="h2">Comparative Recommendations</Header>}>
      <SpaceBetween direction="vertical" size="m">
        {topSite && (
          <Alert type="success" header="Recommended Site">
            <TextContent>
              <p>
                <strong>{topSite.location.name || `Site ${topSite.siteId}`}</strong> is the recommended
                choice with an overall suitability score of <strong>{topSite.overallScore.toFixed(1)}</strong>.
              </p>
              <p>
                This site excels in{' '}
                {Object.entries(topSite.componentScores)
                  .filter(([_, score]) => score.score >= 80)
                  .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                  .join(', ') || 'multiple areas'}.
              </p>
            </TextContent>
          </Alert>
        )}

        {comparisonMetrics && comparisonMetrics.scoreRange > 30 && (
          <Alert type="info" header="Significant Score Variation">
            <TextContent>
              <p>
                There is a significant variation in site suitability scores 
                (range: {comparisonMetrics.scoreRange.toFixed(1)} points). 
                Consider focusing development efforts on the top-performing sites.
              </p>
            </TextContent>
          </Alert>
        )}

        {sites.some(site => site.riskFactors.some(risk => risk.severity === 'high' || risk.severity === 'critical')) && (
          <Alert type="warning" header="High-Risk Sites Identified">
            <TextContent>
              <p>
                Some sites have been identified with high or critical risk factors. 
                Review risk mitigation strategies before proceeding with development.
              </p>
            </TextContent>
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );

  return (
    <div className={className}>
      <SpaceBetween direction="vertical" size="l">
        <Container>
          <Header variant="h1">Site Comparison Analysis</Header>
        </Container>

        {comparisonMetrics && renderSummaryCards()}

        <Tabs
          activeTabId={selectedTab}
          onChange={({ detail }) => setSelectedTab(detail.activeTabId)}
          tabs={[
            {
              id: 'ranking',
              label: 'Site Ranking',
              content: renderRankingTable()
            },
            {
              id: 'components',
              label: 'Component Comparison',
              content: renderComponentComparison()
            },
            {
              id: 'recommendations',
              label: 'Recommendations',
              content: renderRecommendations()
            }
          ]}
        />
      </SpaceBetween>
    </div>
  );
};

/**
 * Component Score Bar - displays individual component score with weight
 */
interface ComponentScoreBarProps {
  label: string;
  score: number;
  weight: number;
}

const ComponentScoreBar: React.FC<ComponentScoreBarProps> = ({ label, score, weight }) => {
  const getScoreVariant = (scoreValue: number) => {
    if (scoreValue >= 80) return 'success' as const;
    if (scoreValue >= 60) return 'info' as const;
    if (scoreValue >= 40) return 'warning' as const;
    return 'error' as const;
  };

  return (
    <SpaceBetween direction="vertical" size="xs">
      <SpaceBetween direction="horizontal" size="s" alignItems="center">
        <Box fontSize="body-s">
          {label}
        </Box>
        <Box fontSize="body-s" color="text-body-secondary">
          {(weight * 100).toFixed(0)}% weight
        </Box>
        <Box fontSize="body-s" fontWeight="bold">
          {score.toFixed(1)}
        </Box>
      </SpaceBetween>
      <ProgressBar
        value={score}
      />
    </SpaceBetween>
  );
};

export default SiteComparisonDashboard;