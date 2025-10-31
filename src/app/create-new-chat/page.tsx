'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/api';
import { loadCanvasContext } from '@/services/collectionContextLoader';

const amplifyClient = generateClient<Schema>();

function CreateNewChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const createNewChat = async () => {
      try {
        // Get collectionId from URL query parameter if provided
        let collectionId = searchParams.get('collectionId');
        
        // Check for fromSession parameter to inherit collection context
        const fromSessionId = searchParams.get('fromSession');
        
        // If fromSession is provided but no collectionId, fetch the current session to inherit context
        if (fromSessionId && !collectionId) {
          console.log('🔗 Inheriting collection context from session:', fromSessionId);
          try {
            const { data: currentSession } = await amplifyClient.models.ChatSession.get({
              id: fromSessionId
            });
            
            if (currentSession?.linkedCollectionId) {
              collectionId = currentSession.linkedCollectionId;
              console.log('✅ Inherited collection context:', collectionId);
            } else {
              console.log('ℹ️ Current session has no collection context to inherit');
            }
          } catch (inheritError) {
            console.warn('⚠️ Failed to inherit collection context from session:', inheritError);
          }
        }
        
        console.log('🎨 Creating new canvas', collectionId ? `with collection: ${collectionId}` : 'without collection');

        // Invoke the lightweight agent for initialization (replaced deprecated reActAgent)
        amplifyClient.mutations.invokeLightweightAgent({ chatSessionId: "initialize", message: "initialize" });

        // Create chat session with optional collection linkage
        const sessionData: any = {};
        
        if (collectionId) {
          sessionData.linkedCollectionId = collectionId;
          
          // Load and cache collection context
          try {
            const context = await loadCanvasContext('', collectionId);
            if (context) {
              sessionData.collectionContext = context;
              console.log('✅ Collection context loaded and cached for new canvas');
            }
          } catch (contextError) {
            console.warn('⚠️ Failed to load collection context, continuing without it:', contextError);
          }
        }

        const newChatSession = await amplifyClient.models.ChatSession.create(sessionData);
        
        if (newChatSession.data && newChatSession.data.id) {
          console.log('✅ Canvas created successfully:', newChatSession.data.id);
          // Navigate to the new chat session
          router.push(`/chat/${newChatSession.data.id}`);
        }
      } catch (error) {
        console.error("Error creating chat session:", error);
        alert("Failed to create chat session.");
      }
    };

    createNewChat();
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Creating new chat session...</p>
    </div>
  );
}

export default function CreateNewChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    }>
      <CreateNewChatContent />
    </Suspense>
  );
}
