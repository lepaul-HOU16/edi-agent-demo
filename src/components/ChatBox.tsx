import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Fab, Paper } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { combineAndSortMessages, sendMessage } from '../../utils/amplifyUtils';
import { Message } from '../../utils/types';

import ChatMessage from './ChatMessage';

import { defaultPrompts } from '@/constants/defaultPrompts';

import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import ExpandablePromptInput from './ExpandablePromptInput';

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";

// DefaultPrompts component removed

const ChatBox = (params: {
  chatSessionId: string,
  showChainOfThought: boolean,
  onInputChange: (input: string) => void,  // Add this new prop
  userInput: string,  // Add this new prop
  messages?: Message[],  // Make messages optional
  setMessages?: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void  // Make setMessages optional
}) => {
  const { chatSessionId, showChainOfThought } = params
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [amplifyClient, setAmplifyClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);
  
  // Use provided messages and setMessages if available, otherwise use local state
  const messages = params.messages || localMessages;
  const setMessages = params.setMessages || setLocalMessages;

  // Initialize Amplify client after component mounts
  useEffect(() => {
    try {
      const client = generateClient<Schema>();
      setAmplifyClient(client);
    } catch (error) {
      console.error('Failed to generate Amplify client:', error);
    }
  }, []);

  const [, setResponseStreamChunks] = useState<(Schema["recieveResponseStreamChunk"]["returnType"] | null)[]>([]);
  const [streamChunkMessage, setStreamChunkMessage] = useState<Message>();
  // const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const messagesPerPage = 20;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  
  // Simplified auto-scroll state
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  // const [showChainOfThought, setShowChainOfThought] = useState(false);
  // const [selectedAgent, setSelectedAgent] = useState<('reActAgent' | 'planAndExecuteAgent' | 'projectGenerationAgent')>("reActAgent");

  //Subscribe to the chat messages
  useEffect(() => {
    if (!amplifyClient) return;

    const messageSubscriptionHandler = async () => {
      console.log('Creating message subscription for garden: ', params.chatSessionId)
      const messagesSub = amplifyClient.models.ChatMessage.observeQuery({
        filter: {
          chatSessionId: { eq: params.chatSessionId }
        }
      }).subscribe({
        next: ({ items }) => {
        setMessages((prevMessages) => {
          // Only take the most recent messagesPerPage messages
          const recentMessages = items.slice(-messagesPerPage);
          const sortedMessages = combineAndSortMessages(prevMessages, recentMessages)
          if (sortedMessages[sortedMessages.length - 1] && sortedMessages[sortedMessages.length - 1].responseComplete) {
            // Remove setTimeout to prevent rendering race conditions
            setIsLoading(false)
            setStreamChunkMessage(undefined)
            setResponseStreamChunks([])
          }
          // Remove setTimeout to prevent display flickering
          setHasMoreMessages(items.length > messagesPerPage);
          return sortedMessages
        })
        }
      })

      return () => {
        messagesSub.unsubscribe();
      };
    }

    messageSubscriptionHandler()
  }, [params.chatSessionId, amplifyClient])

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !amplifyClient) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await amplifyClient.models.ChatMessage.list({
        filter: {
          chatSessionId: { eq: params.chatSessionId }
        }
      });

      if (result.data) {
        // Get the next page of messages
        const startIndex = (nextPage - 1) * messagesPerPage;
        const endIndex = startIndex + messagesPerPage;
        const newMessages = result.data.slice(startIndex, endIndex);

        setMessages(prevMessages => {
          const combinedMessages = [...prevMessages, ...newMessages];
          return combineAndSortMessages(prevMessages, combinedMessages);
        });
        setHasMoreMessages(endIndex < result.data.length);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMoreMessages, isLoadingMore, params.chatSessionId, amplifyClient]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // For normal layout, handle load more messages at the top
    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }

    // For normal layout, check if we're at the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    setIsScrolledToBottom(isAtBottom);
    
    // Enhanced auto-scroll: detect user interrupt
    if (!isAtBottom && autoScroll) {
      console.log('ChatBox: User scrolled up, disabling auto-scroll');
      setAutoScroll(false);
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages, autoScroll]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      console.log('ChatBox: Scrolling to bottom, messages length:', messages.length);
      // Set scroll to maximum possible value - browser will clamp to actual max
      messagesContainerRef.current.scrollTop = Number.MAX_SAFE_INTEGER;
      
      // Update isScrolledToBottom state
      setTimeout(() => {
        setIsScrolledToBottom(true);
      }, 100);
    }
  }, [messages.length]);

  // Handle typing state changes from input - simplified, no immediate scroll impact
  const handleTypingStateChange = useCallback((typing: boolean) => {
    console.log(`ChatBox: User typing state changed to: ${typing}`);
    setIsUserTyping(typing);
  }, []);

  // Simplified auto-scroll functionality - memoized to prevent recreation
  const autoScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current && autoScroll) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [autoScroll]);

  // Stable message monitoring - remove unstable dependencies to prevent pop-in/out
  useEffect(() => {
    const displayedMessages = [
      ...(messages ? messages : []),
      ...(streamChunkMessage ? [streamChunkMessage] : [])
    ].filter((message) => {
      switch (message.role) {
        case 'ai':
          return message.responseComplete
        case 'ai-stream':
          return true
        case 'tool':
          return ['renderAssetTool', 'userInputTool', 'createProject'].includes((message as any).toolName!);
        default:
          return true;
      }
    });

    const newMessageCount = displayedMessages.length;
    
    // Only scroll when message count actually increases and auto-scroll is enabled
    if (newMessageCount > messageCount) {
      setMessageCount(newMessageCount);
      
      if (autoScroll && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      
      // Re-enable auto-scroll when new content arrives
      if (!autoScroll) {
        setAutoScroll(true);
      }
    }
  }, [messages, streamChunkMessage, messageCount, autoScroll]);

  // Minimal streaming auto-scroll - direct scroll without function dependency
  useEffect(() => {
    if (streamChunkMessage && autoScroll && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [streamChunkMessage, autoScroll]);

  //Subscribe to the response stream chunks for the garden
  useEffect(() => {
    if (!amplifyClient) return;

    const responseStreamChunkSubscriptionHandler = async () => {
      console.log('Creating response stream chunk subscription for garden: ', params.chatSessionId)
      const responseStreamChunkSub = amplifyClient.subscriptions.recieveResponseStreamChunk({ chatSessionId: params.chatSessionId }).subscribe({
        error: (error) => console.error('Error subscribing stream chunks: ', error),
        next: (newChunk) => {
          // console.log('Received new response stream chunk: ', newChunk)
          setResponseStreamChunks((prevChunks) => {
            if (newChunk.index === 0) return [newChunk] //If this is the first chunk, reset the preChunk array

            //Now Insert the new chunk into the correct position in the array
            if (newChunk.index >= 0 && newChunk.index < prevChunks.length) {
              prevChunks[newChunk.index] = newChunk;
            } else {
              // Extend the list with nulls up to the specified index
              while (prevChunks.length < newChunk.index) {
                prevChunks.push(null)
              }
              prevChunks.push(newChunk)
            }

            //Only set the chunk message if the inital chunk is defined. This prevents the race condition between the message and the chunk
            if (prevChunks[0] || true) {
              setStreamChunkMessage({
                id: 'streamChunkMessage' as any,
                role: 'ai-stream',
                content: {
                  text: prevChunks.map((chunk) => chunk?.chunkText).join("")
                },
                createdAt: new Date().toISOString()
              } as any)
            }

            return prevChunks
          })
        }
      })

      return () => {
        responseStreamChunkSub.unsubscribe();
      };

    }

    responseStreamChunkSubscriptionHandler()
  }, [params.chatSessionId, amplifyClient])

  // Update function to handle message regeneration
  const handleRegenerateMessage = useCallback(async (messageId: string, messageText: string) => {
    if (!amplifyClient) {
      console.error('Amplify client not initialized');
      return false;
    }

    // Find the message to regenerate to get its timestamp
    const messageToRegenerate = messages.find(msg => (msg as any).id === messageId);

    console.log(`Regenerating messages created after: ${messageToRegenerate?.createdAt} in chat session: ${params.chatSessionId}`)
    console.log(`Message to regenerate: `, messageToRegenerate)

    if (!messageToRegenerate?.createdAt) {
      console.error('Message to regenerate not found or missing timestamp');
      return false;
    }

    // Set the message text as the current input
    params.onInputChange(messageText);

    try {
      // Get all messages after the selected message's timestamp
      const { data: messagesToDelete } = await amplifyClient.models.ChatMessage.listChatMessageByChatSessionIdAndCreatedAt({
        chatSessionId: params.chatSessionId as any,
        createdAt: { ge: messageToRegenerate.createdAt as any }
      });

      // Delete messages from the API
      if (!messagesToDelete || messagesToDelete.length === 0) {
        console.error('No messages found to delete');
        return false;
      }

      const totalMessages = messagesToDelete.length;
      let deletedCount = 0;

      try {
        // Store IDs of messages to be deleted
        const messageIdsToDelete = new Set(
          messagesToDelete
            .filter(msg => msg !== null && msg !== undefined)  // Add null/undefined check
            .map(msg => msg.id)
            .filter((id): id is string => id !== undefined)
        );

        // Create an array of deletion promises
        const deletionPromises = messagesToDelete
          .filter(msg => msg !== null && msg !== undefined && msg.id)  // Add null/undefined check
          .map(async (msgToDelete) => {
            if (msgToDelete.id) {
              await amplifyClient.models.ChatMessage.delete({
                id: msgToDelete.id
              });
              deletedCount++;
              console.log(`Deleted message ${msgToDelete.id} from API (${deletedCount}/${totalMessages})`);
            }
          });

        // Wait for all deletions to complete
        await Promise.all(deletionPromises);

        // Remove messages from UI immediately after successful API deletion
        setMessages(prevMessages =>
          prevMessages.filter(msg =>
            // Keep message if:
            // 1. It has a valid createdAt timestamp
            // 2. It was created before the message we're regenerating
            // 3. Its ID is not in the set of messages to delete
            msg.createdAt &&
            messageToRegenerate.createdAt &&
            msg.createdAt < messageToRegenerate.createdAt // && 
            // typeof msg.id === 'string' && 
            // !messageIdsToDelete.has(msg.id)
          )
        );

        // Clear streaming message if any
        setStreamChunkMessage(undefined);
        setResponseStreamChunks([]);

        // Ensure loading state is reset
        setIsLoading(false);

        // Scroll to the input box
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });

        return true; // Indicate successful completion
      } catch (error) {
        console.error('Error deleting messages:', error);
        return false;
      }
    } catch (error) {
      console.error('Error in message regeneration:', error);
      // Ensure loading state is reset even if there's an error
      setIsLoading(false);
      return false;
    }
  }, [messages, params.chatSessionId, params.onInputChange, setStreamChunkMessage, setResponseStreamChunks, setMessages, setIsLoading]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (userMessage.trim()) {
      console.log('=== CHATBOX DEBUG: Sending message ===');
      console.log('User message:', userMessage);
      console.log('Chat session ID:', params.chatSessionId);
      console.log('Timestamp:', new Date().toISOString());
      
      setIsLoading(true);

      const newMessage: Schema['ChatMessage']['createType'] = {
        role: 'human' as any,
        content: {
          text: userMessage
        } as any,
        chatSessionId: params.chatSessionId as any
      } as any

      console.log('New message object:', newMessage);

      try {
        const result = await sendMessage({
          chatSessionId: params.chatSessionId as any,
          newMessage: newMessage as any
        });
        
        console.log('=== CHATBOX DEBUG: Send message result ===');
        console.log('Result:', result);
        console.log('New message data:', result.newMessageData);
        console.log('Invoke response:', result.invokeResponse);
        
        if (result.invokeResponse?.data) {
          console.log('Agent response data:', result.invokeResponse.data);
        }
        if (result.invokeResponse?.errors) {
          console.error('Agent response errors:', result.invokeResponse.errors);
        }
      } catch (error) {
        console.error('=== CHATBOX DEBUG: Send message error ===');
        console.error('Error:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
      }

      params.onInputChange('');
    }
  }, [messages, params.chatSessionId]);

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'hidden',
      position: 'relative'
    }}>
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="messages-container"
        sx={{
          flex: 1,
          overflowY: 'auto',
          flexDirection: 'column',
          display: 'flex',
          mb: 2,
          position: 'relative'
        }}
      >
        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <List>
          {[
            // ...messages,
            ...(messages ? messages : []),
            ...(streamChunkMessage ? [streamChunkMessage] : [])
          ]
            .filter((message) => {
              // if (showChainOfThought) return true
              switch (message.role) {
                case 'ai':
                  return message.responseComplete
                case 'tool':
                  return ['renderAssetTool', 'userInputTool', 'createProject'].includes((message as any).toolName!);
                default:
                  return true;
              }
            })
            .map((message) => (
              <ListItem key={(message as any).id}>
                <ChatMessage
                  message={message}
                  onRegenerateMessage={(message as any).role === 'human' ? handleRegenerateMessage : undefined}
                />
              </ListItem>
            ))}
          <div ref={messagesEndRef} />
        </List>

      </Box>

      <div className='controls'>
        <div 
          className='input-bkgd'
          style={{
            backdropFilter: 'blur(8px)' // Only add the blur effect, keep original structure
          }}
        >
          <ExpandablePromptInput
            onChange={(value) => params.onInputChange(value)}
            onAction={() => handleSend(params.userInput)}
            value={params.userInput}
            actionButtonAriaLabel="Send message"
            actionButtonIconName="send"
            ariaLabel="Prompt input with action button"
            placeholder="Ask a question"
            onTypingStateChange={handleTypingStateChange}
          />
          <Typography
            variant="inherit"
            color="white"
            style={{ lineHeight: '14px', width: '50px', marginRight: '-13px', marginLeft: '10px' }}
            fontSize={11}
          >
            AI Agent Switcher
          </Typography>
          <ButtonDropdown
            items={[
              {
                text: 'Investigate the borehole washout - Why would this lead to elevated GR?',
                id: '1'
              }
            ]}
          ></ButtonDropdown>
        </div>
      </div>
      
      {!isScrolledToBottom && (
        <Fab
          color="primary"
          size="small"
          onClick={scrollToBottom}
          sx={{
            position: 'fixed',
            bottom: 120,
            right: 20,
            zIndex: 1400,
            opacity: 0.8,
            '&:hover': {
              opacity: 1
            }
          }}
        >
          <KeyboardArrowDownIcon />
        </Fab>
      )}
    </Box>
  );
};

export default ChatBox;
