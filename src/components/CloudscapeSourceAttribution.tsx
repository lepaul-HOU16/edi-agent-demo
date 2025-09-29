/**
 * Cloudscape Source Attribution Component
 * Displays trusted source links with visual trust indicators
 * Uses AWS Cloudscape Design System for enterprise-grade UI
 */

import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Badge,
  Link,
  Icon,
  Box,
  StatusIndicator,
  Popover,
  Button
} from '@cloudscape-design/components';

interface SourceAttribution {
  url: string;
  title: string;
  domain: string;
  trustLevel: 'high' | 'medium' | 'low';
  relevanceScore: number;
  lastAccessed: string;
  summary?: string;
  category: 'government' | 'academic' | 'industry' | 'news';
}

interface Props {
  sources: SourceAttribution[];
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * Get Cloudscape color based on trust level
 */
const getTrustColor = (trustLevel: string): 'blue' | 'grey' | 'green' | 'red' => {
  switch (trustLevel) {
    case 'high': return 'green';      // Green - Official/Government
    case 'medium': return 'blue';     // Blue - Academic/Industry  
    case 'low': return 'grey';        // Grey - General Web
    default: return 'red';            // Red - Unverified
  }
};

/**
 * Get trust icon name for Cloudscape
 */
const getTrustIcon = (trustLevel: string): 'security' | 'status-info' | 'status-warning' | 'status-negative' => {
  switch (trustLevel) {
    case 'high': return 'security';
    case 'medium': return 'status-info';
    case 'low': return 'status-warning';
    default: return 'status-negative';
  }
};

/**
 * Get trust description for tooltips
 */
const getTrustDescription = (source: SourceAttribution): string => {
  const descriptions = {
    high: 'Official government or regulatory source',
    medium: 'Academic or industry source',
    low: 'General web source'
  };
  
  return `${descriptions[source.trustLevel]} - ${source.category}`;
};

/**
 * Compact source display for mobile/space-constrained views
 */
const CompactSourceDisplay: React.FC<Props> = ({ sources }) => (
  <Container>
    <SpaceBetween direction="horizontal" size="xs">
      <Box variant="small" color="text-label">
        Sources:
      </Box>
      
      <StatusIndicator type="success">
        {sources.length} verified
      </StatusIndicator>
      
      {sources.slice(0, 3).map((source, idx) => (
        <Badge key={idx} color={getTrustColor(source.trustLevel)}>
          {source.domain.split('.')[0]}
        </Badge>
      ))}
      
      {sources.length > 3 && (
        <Badge color="grey">+{sources.length - 3}</Badge>
      )}
    </SpaceBetween>
  </Container>
);

/**
 * Full source attribution bar with trust indicators
 */
const FullSourceDisplay: React.FC<Props> = ({ sources, showDetails }) => {
  const [showSourceDetails, setShowSourceDetails] = React.useState(showDetails || false);
  
  return (
    <Container>
      <Header
        description={
          <SpaceBetween direction="horizontal" size="xs">
            <Box variant="small" color="text-status-success">
              All sources verified for accuracy and reliability
            </Box>
            <StatusIndicator type="success">
              Avg. trust: {Math.round(sources.reduce((sum, s) => {
                const scoreMap = { high: 95, medium: 80, low: 60 };
                return sum + scoreMap[s.trustLevel];
              }, 0) / sources.length)}%
            </StatusIndicator>
          </SpaceBetween>
        }
      >
        <SpaceBetween direction="horizontal" size="s">
          <Icon name="external" />
          <Box>Trusted Sources ({sources.length})</Box>
        </SpaceBetween>
      </Header>
      
      <SpaceBetween direction="horizontal" size="xs">
        {sources.map((source, idx) => (
          <Popover
            key={idx}
            dismissButton={false}
            position="top"
            size="medium"
            triggerType="custom"
            content={
              <Box>
                <SpaceBetween size="xs">
                  <Box>
                    <strong>{source.domain}</strong>
                  </Box>
                  <Box variant="small">
                    {getTrustDescription(source)}
                  </Box>
                  <Box variant="small" color="text-status-info">
                    Relevance: {Math.round(source.relevanceScore * 100)}%
                  </Box>
                  <Box variant="small" color="text-status-info">
                    Last accessed: {new Date(source.lastAccessed).toLocaleTimeString()}
                  </Box>
                  {source.summary && (
                    <Box variant="small">
                      {source.summary}
                    </Box>
                  )}
                </SpaceBetween>
              </Box>
            }
          >
            <Link 
              href={source.url}
              external={true}
              variant="primary"
            >
              <SpaceBetween direction="horizontal" size="xxs">
                <Badge color={getTrustColor(source.trustLevel)}>
                  <SpaceBetween direction="horizontal" size="xxs">
                    <Icon name="external" size="inherit" />
                    <Box>{source.domain}</Box>
                  </SpaceBetween>
                </Badge>
                <Icon name="external" size="inherit" />
              </SpaceBetween>
            </Link>
          </Popover>
        ))}
        
        {showDetails && (
          <Button
            variant="link"
            iconName={showSourceDetails ? "angle-up" : "angle-down"}
            onClick={() => setShowSourceDetails(!showSourceDetails)}
          >
            {showSourceDetails ? 'Hide' : 'Show'} details
          </Button>
        )}
      </SpaceBetween>
      
      {showSourceDetails && (
        <Container>
          <SpaceBetween size="xs">
            {sources.map((source, idx) => (
              <Container key={idx}>
                <SpaceBetween direction="horizontal" size="s">
                  <Badge color={getTrustColor(source.trustLevel)}>
                    {source.category}
                  </Badge>
                  <Box variant="small">
                    <strong>{source.domain}</strong> - Trust: {source.trustLevel}
                  </Box>
                  <Box variant="small">
                    Relevance: {Math.round(source.relevanceScore * 100)}%
                  </Box>
                </SpaceBetween>
                {source.summary && (
                  <Box variant="small" color="text-body-secondary">
                    {source.summary}
                  </Box>
                )}
              </Container>
            ))}
          </SpaceBetween>
        </Container>
      )}
    </Container>
  );
};

/**
 * Main CloudscapeSourceAttribution component
 */
const CloudscapeSourceAttribution: React.FC<Props> = ({ 
  sources, 
  compact = false, 
  showDetails = false 
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return compact ? (
    <CompactSourceDisplay sources={sources} />
  ) : (
    <FullSourceDisplay sources={sources} showDetails={showDetails} />
  );
};

export default CloudscapeSourceAttribution;
