'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/api';
import { sendMessage } from '@/../utils/amplifyUtils';

const amplifyClient = generateClient<Schema>();

export default function PetrophysicalAnalysisPage() {
  const router = useRouter();

  useEffect(() => {
    const createPetrophysicsChat = async () => {
      try {
        // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
        amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" });

        const newChatSession = await amplifyClient.models.ChatSession.create({});
        
        if (newChatSession.data && newChatSession.data.id) {
          // Send an initial message with petrophysics keywords to trigger the petrophysics system message
          const initialMessage: Schema['ChatMessage']['createType'] = {
            role: 'human',
            content: {
              text: "I need help with petrophysical analysis. Please show me the available tools and capabilities."
            },
            chatSessionId: newChatSession.data.id,
          };
          
          // Send the initial message
          await sendMessage({
            chatSessionId: newChatSession.data.id,
            newMessage: initialMessage,
          });
          
          // Navigate to the new chat session
          router.push(`/chat/${newChatSession.data.id}`);
        }
      } catch (error) {
        console.error("Error creating petrophysics chat session:", error);
        alert("Failed to create petrophysics chat session.");
      }
    };

    createPetrophysicsChat();
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Creating petrophysical analysis chat session...</p>
    </div>
  );
}
