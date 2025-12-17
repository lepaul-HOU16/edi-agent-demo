
import React, { useState } from 'react';
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Container from "@cloudscape-design/components/container";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Grid from "@cloudscape-design/components/grid";
import Flashbar from "@cloudscape-design/components/flashbar";

import { useNavigate } from 'react-router-dom';
import { createSession } from '@/lib/api/sessions';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div
      className="hero-header"
      style={{
        backgroundImage: `url("/login/edi-bkgd.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100vh',
        margin: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {errorMessage && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '600px' }}>
          <Flashbar
            items={[
              {
                type: 'error',
                dismissible: true,
                onDismiss: () => setErrorMessage(null),
                content: errorMessage,
                header: 'Error creating chat session'
              }
            ]}
          />
        </div>
      )}
      <ContentLayout
        defaultPadding
        disableOverlap
        headerBackgroundStyle="transparent"
        header={
          <Box>
            <Grid
              gridDefinition={[
                { colspan: { default: 12, s: 8 } }
              ]}
            >
              <Box>
                <Container>
                  <Box padding="s">
                  <Box
                    fontSize="display-l"
                    fontWeight="bold"
                    variant="h1"
                    padding="n"
                  >
                    AWS Energy Data Insights
                  </Box>
                  <Box
                    fontSize="display-l"
                    fontWeight="light"
                  >
                    Your AI companion for subsurface data
                  </Box>
                  <Box
                    variant="p"
                    color="text-body-secondary"
                    margin={{ top: "xs", bottom: "l" }}
                  >
                    Experience intelligent, personalized conversations with our 24/7 AI assistant, designed to meet your unique needs and preferences.
                  </Box>
                  <SpaceBetween
                    direction="horizontal"
                    size="xs"
                  >
                    <Button 
                      onClick={async () => {
                        try {
                          setIsCreatingSession(true);
                          setErrorMessage(null);
                          const newChatSession = await createSession({});
                          navigate(`/chat/${newChatSession.id}`);
                        } catch (error) {
                          console.error('Failed to create chat session:', error);
                          setErrorMessage(
                            error instanceof Error 
                              ? error.message 
                              : 'Failed to create chat session. Please try again.'
                          );
                        } finally {
                          setIsCreatingSession(false);
                        }
                      }}
                      loading={isCreatingSession}
                      disabled={isCreatingSession}
                    >
                      Start a new chat
                    </Button>
                    <Button onClick={() => {
                      navigate('/canvases');
                    }}>
                      Browse canvases
                    </Button>
                    <Button variant="primary" onClick={() => {
                      navigate('/catalog');
                    }}>
                      Explore the Data Catalog
                    </Button>
                  </SpaceBetween>
                </Box>
                </Container>
              </Box>
            </Grid>
          </Box>
        }
      />
    </div>
  );
};

export default LandingPage;
