'use client';

import React from 'react';
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import TextContent from "@cloudscape-design/components/text-content";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Grid from "@cloudscape-design/components/grid";

import { useRouter } from 'next/navigation';

import { type Schema } from "@/../amplify/data/resource";
import { useAuth } from '../contexts/OidcAuthContext';
import { safeGenerateClient } from '../utils/amplifyTest';
import { logError } from '../utils/errorHandling';
import Subsurface from '../app/login/edi-bkgd.jpg';
const LandingPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div
      className="hero-header"
      style={{
        backgroundImage: `url(${Subsurface.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <ContentLayout
      defaultPadding
      disableOverlap
      header={
        <Box padding={{ vertical: "xxxl" }}>
          <Grid
            gridDefinition={[
              { colspan: { default: 12, s: 8 } }
            ]}
          >
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
                  <Button variant="primary" onClick={async () => {
                      try {
                        if (isAuthenticated) {
                          console.log('Creating safe Amplify client...');
                          const amplifyClient = await safeGenerateClient<Schema>();
                          console.log('Amplify client created successfully');
                          console.log('Available models:', Object.keys(amplifyClient.models || {}));
                          console.log('Creating ChatSession...');
                          const newChatSession = await amplifyClient.models.ChatSession.create({});
                          console.log('ChatSession created:', newChatSession);
                          if (newChatSession.data?.id) {
                            router.push(`/chat/${newChatSession.data.id}`);
                          } else {
                            throw new Error('ChatSession creation failed - no ID returned');
                          }
                        } else {
                          router.push('/auth');
                        }
                      } catch (error) {
                        logError('Error in button click handler', error);
                        console.error('Full error details:', error);
                        alert(`Error creating chat session: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
                      }
                    }}>
                    Start a new chat
                  </Button>
                  <Button onClick={() => {
                      if (isAuthenticated) {
                        router.push('/listChats');
                      } else {
                        router.push('/auth');
                      }
                    }}>
                    Browse chats
                  </Button>
                </SpaceBetween>
              </Box>
            </Container>
          </Grid>
        </Box>
      }
    />
    </div>
  );
};

export default LandingPage;
