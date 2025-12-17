'use client';

import { useEffect, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, getSession } from '@/lib/api/sessions';
import { loadCanvasContext } from '@/services/collectionContextLoader';

function CreateNewChatContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
            const currentSessionResponse = await getSession(fromSessionId);
            
            if (currentSessionResponse?.session?.linkedCollectionId) {
              collectionId = currentSessionResponse.session.linkedCollectionId;
              console.log('✅ Inherited collection context:', collectionId);
            } else {
              console.log('ℹ️ Current session has no collection context to inherit');
            }
          } catch (inheritError) {
            console.warn('⚠️ Failed to inherit collection context from session:', inheritError);
          }
        }
        
        console.log('🎨 Creating new canvas', collectionId ? `with collection: ${collectionId}` : 'without collection');

        // Note: The lightweight agent initialization call has been removed as it's not needed
        // The agent will be initialized on first message send via the REST API

        // Create chat session with optional collection linkage
        const sessionData: any = {
          name: `Chat ${new Date().toLocaleString()}`
        };
        
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

        const newChatSession = await createSession(sessionData);
        
        if (newChatSession && newChatSession.sessionId) {
          console.log('✅ Canvas created successfully:', newChatSession.sessionId);
          // Navigate to the new chat session
          navigate(`/chat/${newChatSession.sessionId}`);
        }
      } catch (error) {
        console.error("Error creating chat session:", error);
        alert("Failed to create chat session.");
      }
    };

    createNewChat();
  }, [navigate, searchParams]);

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
