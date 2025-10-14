/**
 * useChatMessagePolling Hook
 * 
 * Polls for chat message updates to automatically refresh the UI when
 * long-running operations (like terrain analysis) complete.
 */

import { useEffect, useRef, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/../amplify/data/resource';

const amplifyClient = generateClient<Schema>();

interface UseChatMessagePollingOptions {
  chatSessionId: string;
  enabled?: boolean;
  interval?: number; // milliseconds
  onMessagesUpdated?: (messages: any[]) => void;
}

export function useChatMessagePolling({
  chatSessionId,
  enabled = true,
  interval = 3000, // Poll every 3 seconds
  onMessagesUpdated,
}: UseChatMessagePollingOptions) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !chatSessionId) {
      return;
    }

    const pollMessages = async () => {
      try {
        setIsPolling(true);
        
        // Fetch messages for this chat session
        const { data: messages } = await amplifyClient.models.ChatMessage.list({
          filter: {
            chatSessionId: {
              eq: chatSessionId,
            },
          },
        });

        if (messages) {
          // Check if message count changed or if any message was updated recently
          const currentCount = messages.length;
          const hasNewMessages = currentCount !== lastMessageCountRef.current;
          
          // Check if any message has artifacts that might have been updated
          const hasUpdatedArtifacts = messages.some(msg => {
            const updatedAt = msg.updatedAt ? new Date(msg.updatedAt).getTime() : 0;
            return updatedAt > lastUpdateTime;
          });

          if (hasNewMessages || hasUpdatedArtifacts) {
            console.log('🔄 Chat messages updated, refreshing UI...', {
              previousCount: lastMessageCountRef.current,
              currentCount,
              hasUpdatedArtifacts,
            });
            
            lastMessageCountRef.current = currentCount;
            setLastUpdateTime(Date.now());
            
            if (onMessagesUpdated) {
              onMessagesUpdated(messages);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error polling chat messages:', error);
      } finally {
        setIsPolling(false);
      }
    };

    // Initial poll
    pollMessages();

    // Set up interval
    intervalRef.current = setInterval(pollMessages, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chatSessionId, enabled, interval]); // Removed lastUpdateTime and onMessagesUpdated from dependencies

  return {
    isPolling,
    lastUpdateTime,
  };
}
