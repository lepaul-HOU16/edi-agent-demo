import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, Alert, StatusIndicator } from '@cloudscape-design/components';

interface EDIcraftResponseProps {
  content: string;
}

interface ParsedResponse {
  type: 'success' | 'error' | 'progress' | 'warning' | 'info' | 'plain';
  title?: string;
  sections: Array<{
    title?: string;
    items: Array<{ label?: string; value: string }>;
  }>;
  tip?: string;
}

/**
 * Parse EDIcraft response templates into structured data
 */
function parseEDIcraftResponse(content: string): ParsedResponse {
  const lines = content.split('\n');
  
  // Detect response type by icon
  let type: ParsedResponse['type'] = 'plain';
  let title: string | undefined;
  
  if (content.includes('✅')) type = 'success';
  else if (content.includes('❌')) type = 'error';
  else if (content.includes('⏳')) type = 'progress';
  else if (content.includes('⚠️')) type = 'warning';
  else if (content.includes('ℹ️')) type = 'info';
  
  // Extract title (first line with ** markers)
  const titleMatch = content.match(/[✅❌⏳⚠️ℹ️💡]\s*\*\*([^*]+)\*\*/);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  // Parse sections
  const sections: ParsedResponse['sections'] = [];
  let currentSection: { title?: string; items: Array<{ label?: string; value: string }> } | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and title line
    if (!trimmed || trimmed.startsWith('✅') || trimmed.startsWith('❌') || 
        trimmed.startsWith('⏳') || trimmed.startsWith('⚠️') || trimmed.startsWith('ℹ️')) {
      continue;
    }
    
    // Section header (bold text followed by colon)
    if (trimmed.match(/^\*\*[^*]+:\*\*$/)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.replace(/\*\*/g, '').replace(':', ''),
        items: []
      };
      continue;
    }
    
    // List item with label (- **Label:** Value)
    const labelMatch = trimmed.match(/^-\s*\*\*([^*]+):\*\*\s*(.+)$/);
    if (labelMatch) {
      if (!currentSection) {
        currentSection = { items: [] };
      }
      currentSection.items.push({
        label: labelMatch[1].trim(),
        value: labelMatch[2].trim()
      });
      continue;
    }
    
    // Plain list item (- Value)
    if (trimmed.startsWith('- ')) {
      if (!currentSection) {
        currentSection = { items: [] };
      }
      currentSection.items.push({
        value: trimmed.substring(2).trim()
      });
      continue;
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Extract tip (line starting with 💡)
  const tipMatch = content.match(/💡\s*\*\*Tip:\*\*\s*(.+)/);
  const tip = tipMatch ? tipMatch[1].trim() : undefined;
  
  return { type, title, sections, tip };
}

/**
 * Generate stable content hash for deduplication
 */
function generateContentHash(content: string): string {
  // Create a stable hash from the content
  // Use first 100 chars + length to create unique identifier
  const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
  const length = content.length;
  return `edicraft-${prefix}-${length}`;
}

/**
 * Render EDIcraft response with Cloudscape components
 */
export const EDIcraftResponseComponent: React.FC<EDIcraftResponseProps> = ({ content }) => {
  const parsed = parseEDIcraftResponse(content);
  const renderCountRef = React.useRef(0);
  const [isReady, setIsReady] = React.useState(false);
  
  // Generate a stable content hash for deduplication
  const contentHash = React.useMemo(() => {
    return generateContentHash(content);
  }, [content]);
  
  // Track render count for debugging
  renderCountRef.current += 1;
  
  // Delay rendering to prevent flash during rapid re-renders on initial load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150); // Delay to batch rapid updates during initial load
    
    return () => clearTimeout(timer);
  }, [contentHash]);
  
  // Check if this content hash already exists in the DOM
  React.useEffect(() => {
    const existingElements = document.querySelectorAll(`[data-content-hash="${contentHash}"]`);
    if (existingElements.length > 1) {
      console.warn(`⚠️ EDIcraft response duplicate detected: ${contentHash} (${existingElements.length} instances)`);
    }
    console.log(`🔄 EDIcraft response render #${renderCountRef.current} for hash: ${contentHash}`);
  }, [contentHash]);
  
  // Don't render until ready (prevents flash during rapid initial renders)
  if (!isReady) {
    return null;
  }
  
  // If it's plain text (no template structure), render as-is
  if (parsed.type === 'plain' || !parsed.title) {
    return (
      <Box padding="s" className="edicraft-response-plain" data-content-hash={contentHash}>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
          {content}
        </pre>
      </Box>
    );
  }
  
  // Render error responses as Alert
  if (parsed.type === 'error') {
    return (
      <div className="edicraft-response-error" data-content-hash={contentHash}>
        <Alert type="error" header={parsed.title}>
          <SpaceBetween size="m">
            {parsed.sections.map((section, idx) => (
              <Box key={idx}>
                {section.title && <Box variant="h4" padding={{ bottom: 'xs' }}>{section.title}</Box>}
                <SpaceBetween size="xs">
                  {section.items.map((item, itemIdx) => (
                    <Box key={itemIdx}>
                      {item.label ? (
                        <Box>
                          <Box variant="strong">{item.label}:</Box> {item.value}
                        </Box>
                      ) : (
                        <Box>{item.value}</Box>
                      )}
                    </Box>
                  ))}
                </SpaceBetween>
              </Box>
            ))}
            {parsed.tip && (
              <Box variant="p" color="text-status-info">
                💡 <strong>Tip:</strong> {parsed.tip}
              </Box>
            )}
          </SpaceBetween>
        </Alert>
      </div>
    );
  }
  
  // Render warning responses as Alert
  if (parsed.type === 'warning') {
    return (
      <div className="edicraft-response-warning" data-content-hash={contentHash}>
        <Alert type="warning" header={parsed.title}>
          <SpaceBetween size="m">
            {parsed.sections.map((section, idx) => (
              <Box key={idx}>
                {section.title && <Box variant="h4" padding={{ bottom: 'xs' }}>{section.title}</Box>}
                <SpaceBetween size="xs">
                  {section.items.map((item, itemIdx) => (
                    <Box key={itemIdx}>
                      {item.label ? (
                        <Box>
                          <Box variant="strong">{item.label}:</Box> {item.value}
                        </Box>
                      ) : (
                        <Box>{item.value}</Box>
                      )}
                    </Box>
                  ))}
                </SpaceBetween>
              </Box>
            ))}
          </SpaceBetween>
        </Alert>
      </div>
    );
  }
  
  // Render progress responses with StatusIndicator
  if (parsed.type === 'progress') {
    return (
      <div className="edicraft-response-progress" data-content-hash={contentHash}>
        <Container>
          <SpaceBetween size="m">
            <Box>
              <StatusIndicator type="in-progress">{parsed.title}</StatusIndicator>
            </Box>
            {parsed.sections.map((section, idx) => (
              <Box key={idx}>
                {section.title && <Box variant="h4" padding={{ bottom: 'xs' }}>{section.title}</Box>}
                <SpaceBetween size="xs">
                  {section.items.map((item, itemIdx) => (
                    <Box key={itemIdx}>
                      {item.label ? (
                        <Box>
                          <Box variant="strong">{item.label}:</Box> {item.value}
                        </Box>
                      ) : (
                        <Box>{item.value}</Box>
                      )}
                    </Box>
                  ))}
                </SpaceBetween>
              </Box>
            ))}
          </SpaceBetween>
        </Container>
      </div>
    );
  }
  
  // Render success/info responses as Container with sections
  return (
    <div className="edicraft-response-success" data-content-hash={contentHash}>
      <Container>
        <SpaceBetween size="m">
          {/* Title with success indicator */}
          <Box>
            <Header variant="h3">
              {parsed.type === 'success' && '✅ '}
              {parsed.type === 'info' && 'ℹ️ '}
              {parsed.title}
            </Header>
          </Box>
          
          {/* Sections */}
          {parsed.sections.map((section, idx) => (
            <Box key={idx}>
              {section.title && (
                <Box variant="h4" padding={{ bottom: 'xs' }}>
                  {section.title}
                </Box>
              )}
              
              {/* Use ColumnLayout for key-value pairs, otherwise use list */}
              {section.items.every(item => item.label) ? (
                <ColumnLayout columns={2} variant="text-grid">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx}>
                      <Box variant="awsui-key-label">{item.label}</Box>
                      <div style={{ 
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </ColumnLayout>
              ) : (
                <SpaceBetween size="xs">
                  {section.items.map((item, itemIdx) => (
                    <Box key={itemIdx}>
                      {item.label ? (
                        <Box>
                          <Box variant="strong">{item.label}:</Box> {item.value}
                        </Box>
                      ) : (
                        <Box>{item.value}</Box>
                      )}
                    </Box>
                  ))}
                </SpaceBetween>
              )}
            </Box>
          ))}
          
          {/* Tip section */}
          {parsed.tip && (
            <Box padding={{ top: 's' }}>
              <Alert type="info" statusIconAriaLabel="Info">
                <Box variant="p">
                  <strong>💡 Tip:</strong> {parsed.tip}
                </Box>
              </Alert>
            </Box>
          )}
        </SpaceBetween>
      </Container>
    </div>
  );
};

// Memoize to prevent re-renders when parent re-renders
export default React.memo(EDIcraftResponseComponent);

/**
 * Check if content looks like an EDIcraft response
 */
export function isEDIcraftResponse(content: string): boolean {
  // Check for emoji indicators
  const indicators = ['✅', '❌', '⚠️', '⏳', '💡'];
  const hasIndicator = indicators.some(indicator => content.includes(indicator));
  
  // Check for markdown sections
  const hasSections = content.includes('**') && content.includes(':**');
  
  // Check for EDIcraft-specific terms
  const hasEDIcraftTerms = /wellbore|trajectory|minecraft|drilling|rig|rcon|blocks? placed|coordinates?|game rule|time lock|cleared|environment|clear.*confirmation/i.test(content);
  
  // Check for structured data patterns (key: value)
  const hasStructuredData = /\*\*[^*]+\*\*:\s*[^\n]+/i.test(content);
  
  // Check specifically for clear confirmation responses
  const isClearConfirmation = /✅.*\*\*Minecraft Environment Cleared\*\*/i.test(content) ||
                              (content.includes('**Summary:**') && content.includes('**Wellbores Cleared:**'));
  
  // More lenient detection - any EDIcraft term with structure OR any indicator OR clear confirmation
  return isClearConfirmation || (hasIndicator && hasEDIcraftTerms) || (hasStructuredData && hasEDIcraftTerms) || (hasSections && hasEDIcraftTerms);
}
