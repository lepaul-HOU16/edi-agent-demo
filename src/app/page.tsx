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

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react';
// import Subsurface from '../app/login/edi-bkgd.jpg';

const amplifyClient = generateClient<Schema>();
const LandingPage = () => {
  const router = useRouter();
  const { authStatus } = useAuthenticator(context => [context.authStatus]);

  return (
    <div
      className="hero-header"
      style={{
        backgroundImage: `url("/login/edi-bkgd.jpg")`,
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
      // headerBackgroundStyle={mode =>
      //   `center center/cover url("/hero-header-${mode}.png")`
      // }
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
                  <Button onClick={async () => {
                    if (authStatus === 'authenticated') {
                      const newChatSession = await amplifyClient.models.ChatSession.create({});
                      router.push(`/chat/${newChatSession.data!.id}`);
                    } else {
                      router.push('/auth');
                    }
                  }}>
                    Start a new chat
                  </Button>
                  <Button onClick={() => {
                    if (authStatus === 'authenticated') {
                      router.push('/listChats');
                    } else {
                      router.push('/auth');
                    }
                  }}>
                    Browse chats
                  </Button>
                  <Button variant="primary" onClick={async () => {
                    if (authStatus === 'authenticated') {
                      router.push('/catalog');
                    } else {
                      router.push('/auth');
                    }
                  }}>
                    Explore the Data Catalog
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
