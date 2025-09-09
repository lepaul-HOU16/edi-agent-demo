'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/api';

const amplifyClient = generateClient<Schema>();

export default function CreateNewChatPage() {
  const router = useRouter();

  useEffect(() => {
    const createNewChat = async () => {
      try {
        // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
        amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" });

        const newChatSession = await amplifyClient.models.ChatSession.create({});
        
        if (newChatSession.data && newChatSession.data.id) {
          // Navigate to the new chat session
          router.push(`/chat/${newChatSession.data.id}`);
        }
      } catch (error) {
        console.error("Error creating chat session:", error);
        alert("Failed to create chat session.");
      }
    };

    createNewChat();
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Creating new chat session...</p>
    </div>
  );
}
