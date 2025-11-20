import React, { useState } from 'react';
import { Container, Header, SpaceBetween, Box, Button, Tabs } from '@cloudscape-design/components';

const ReinventDemoPage: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState('backup-slides');

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="AWS re:Invent Chalk Talk - Interactive Demo Materials"
        >
          re:Invent Demo Materials
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Box variant="p">
          This page contains all the materials needed for the AWS re:Invent chalk talk presentation.
          Access is restricted to internal use only.
        </Box>

        <Tabs
          activeTabId={activeTabId}
          onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
          tabs={[
            {
              id: 'backup-slides',
              label: 'Backup Slides',
              content: (
                <SpaceBetween size="m">
                  <Box variant="p">
                    Interactive HTML backup slides for use if live demo fails.
                    Press 'E' to toggle emergency mode.
                  </Box>
                  <iframe
                    src="/demo/backup-slides.html"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    title="Backup Slides"
                  />
                  <Button
                    variant="primary"
                    iconName="external"
                    href="/demo/backup-slides.html"
                    target="_blank"
                  >
                    Open in Full Screen
                  </Button>
                </SpaceBetween>
              )
            },
            {
              id: 'master-deck',
              label: 'Master Deck',
              content: (
                <SpaceBetween size="m">
                  <Box variant="p">
                    Complete presentation deck with all slides.
                  </Box>
                  <iframe
                    src="/demo/master-deck.html"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    title="Master Deck"
                  />
                  <Button
                    variant="primary"
                    iconName="external"
                    href="/demo/master-deck.html"
                    target="_blank"
                  >
                    Open in Full Screen
                  </Button>
                </SpaceBetween>
              )
            },
            {
              id: 'cheat-sheet',
              label: 'Cheat Sheet',
              content: (
                <SpaceBetween size="m">
                  <Box variant="p">
                    Quick reference guide - print this and keep in your pocket during the presentation.
                  </Box>
                  <iframe
                    src="/demo/cheat-sheet.html"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    title="Cheat Sheet"
                  />
                  <Button
                    variant="primary"
                    iconName="download"
                    href="/demo/PRESENTER-CHEAT-SHEET.md"
                    target="_blank"
                  >
                    Download Markdown
                  </Button>
                </SpaceBetween>
              )
            },
            {
              id: 'demo-script',
              label: 'Demo Script',
              content: (
                <SpaceBetween size="m">
                  <Box variant="p">
                    Complete 15-minute demo script with step-by-step narration.
                  </Box>
                  <iframe
                    src="/demo/demo-script.html"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    title="Demo Script"
                  />
                  <Button
                    variant="primary"
                    iconName="download"
                    href="/demo/INTERACTIVE-DEMO-SCRIPT.md"
                    target="_blank"
                  >
                    Download Markdown
                  </Button>
                </SpaceBetween>
              )
            },
            {
              id: 'troubleshooting',
              label: 'Troubleshooting',
              content: (
                <SpaceBetween size="m">
                  <Box variant="p">
                    Comprehensive troubleshooting guide for common demo issues.
                  </Box>
                  <iframe
                    src="/demo/troubleshooting.html"
                    style={{
                      width: '100%',
                      height: '600px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    title="Troubleshooting Guide"
                  />
                  <Button
                    variant="primary"
                    iconName="download"
                    href="/demo/DEMO-TROUBLESHOOTING-GUIDE.md"
                    target="_blank"
                  >
                    Download Markdown
                  </Button>
                </SpaceBetween>
              )
            },
            {
              id: 'downloads',
              label: 'Downloads',
              content: (
                <SpaceBetween size="m">
                  <Box variant="h3">All Demo Materials</Box>
                  <Box variant="p">
                    Download individual files or the complete package.
                  </Box>
                  <SpaceBetween size="s">
                    <Button iconName="download" href="/demo/backup-slides.html" target="_blank">
                      Backup Slides (HTML)
                    </Button>
                    <Button iconName="download" href="/demo/master-deck.html" target="_blank">
                      Master Deck (HTML)
                    </Button>
                    <Button iconName="download" href="/demo/PRESENTER-CHEAT-SHEET.md" target="_blank">
                      Cheat Sheet (Markdown)
                    </Button>
                    <Button iconName="download" href="/demo/INTERACTIVE-DEMO-SCRIPT.md" target="_blank">
                      Demo Script (Markdown)
                    </Button>
                    <Button iconName="download" href="/demo/DEMO-TROUBLESHOOTING-GUIDE.md" target="_blank">
                      Troubleshooting Guide (Markdown)
                    </Button>
                    <Button iconName="download" href="/demo/DEMO-README.md" target="_blank">
                      README (Markdown)
                    </Button>
                  </SpaceBetween>
                </SpaceBetween>
              )
            }
          ]}
        />
      </SpaceBetween>
    </Container>
  );
};

export default ReinventDemoPage;
