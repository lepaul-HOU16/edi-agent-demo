import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Fab, Paper } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { combineAndSortMessages, sendMessage } from '../../utils/amplifyUtils';
import { Message } from '../../utils/types';

import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';

import { defaultPrompts } from '@/constants/defaultPrompts';

import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import ExpandablePromptInput from './ExpandablePromptInput';

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { getThinkingContextFromStep } from '../../utils/thoughtTypes';

const ChatBox = (params: {
  chatSessionId: string,
  showChainOfThought: boolean,
  onInputChange: (input: string) => void,
  userInput: string,
  messages?: Message[],
  setMessages?: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void
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
  
  // Chain of Thought thinking state management
  const [thinkingState, setThinkingState] = useState<{
    isActive: boolean;
    context: string;
    step: string;
    progress?: number;
    estimatedTime?: string;
    currentThoughtStep?: any;
  }>({
    isActive: false,
    context: '',
    step: '',
    progress: 0
  });

  // CRITICAL FIX: Add ref for thinking timeout management
  const thinkingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Unified message filter function to ensure consistency
  const shouldDisplayMessage = useCallback((message: Message) => {
    switch (message.role) {
      case 'ai':
        return message.responseComplete || 
               (message.content && (message.content as any).text && (message.content as any).text.trim().length > 0)
      case 'ai-stream':
        return true
      case 'tool':
        return ['renderAssetTool', 'userInputTool', 'createProject'].includes((message as any).toolName!);
      default:
        return true;
    }
  }, []);

  // FINE-TUNED: Enhanced autoscroll with better positioning and slower animation
  const performAutoScroll = useCallback(() => {
    if (!autoScroll || !messagesContainerRef.current) return;
    
    console.log('🚀 ChatBox: Performing fine-tuned autoscroll');
    
    const container = messagesContainerRef.current;
    
    // Calculate extra scroll distance to account for input area (increased buffer)
    const inputBuffer = 200; // Increased buffer to account for input area and padding
    const targetScrollTop = container.scrollHeight + inputBuffer;
    
    // Method 1: Use scrollIntoView with smooth animation on the end ref
    if (messagesEndRef.current) {
      try {
        // Add custom CSS for slower scroll animation
        const originalScrollBehavior = container.style.scrollBehavior;
        container.style.scrollBehavior = 'smooth';
        container.style.scrollPaddingBottom = '180px'; // Add padding to scroll farther
        
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
        
        // Reset after scroll
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.style.scrollBehavior = originalScrollBehavior;
          }
        }, 800);
        
        console.log('✅ ChatBox: Slow smooth scrollIntoView completed');
      } catch (error) {
        console.warn('❌ ChatBox: scrollIntoView failed:', error);
      }
    }
    
    // Method 2: Enhanced scrollTo with buffer and slower timing
    setTimeout(() => {
      try {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
          console.log('✅ ChatBox: Delayed smooth scrollTo completed with extended buffer');
        }
      } catch (error) {
        console.warn('❌ ChatBox: Delayed scrollTo failed:', error);
      }
    }, 100); // Small delay to ensure DOM is fully updated
    
    // Log final position after animation completes
    setTimeout(() => {
      if (messagesContainerRef.current) {
        console.log('📏 ChatBox: Final scroll position:', messagesContainerRef.current.scrollTop, '/', messagesContainerRef.current.scrollHeight);
      }
    }, 800); // Increased delay for slower animation
  }, [autoScroll]);

  // Memoized displayed messages
  const displayedMessages = React.useMemo(() => {
    console.log('ChatBox: Calculating displayed messages', {
      messagesLength: messages?.length || 0,
      hasStreamChunk: !!streamChunkMessage
    });
    
    const allMessages = [
      ...(messages ? messages : []),
      ...(streamChunkMessage ? [streamChunkMessage] : [])
    ];
    
    return allMessages.filter(shouldDisplayMessage);
  }, [messages, streamChunkMessage, shouldDisplayMessage]);

  // CONSOLIDATED: Single useEffect for all autoscroll triggers
  useEffect(() => {
    const newMessageCount = displayedMessages.length;
    
    // Re-enable auto-scroll for new messages
    if (newMessageCount > messageCount && !autoScroll) {
      console.log('🔄 ChatBox: Re-enabling auto-scroll for new messages');
      setAutoScroll(true);
    }
    
    // Update message count
    if (newMessageCount !== messageCount) {
      setMessageCount(newMessageCount);
    }
    
    // Perform autoscroll for any content change
    if (autoScroll && (newMessageCount > 0 || streamChunkMessage || thinkingState.isActive)) {
      console.log('🔄 ChatBox: Triggering consolidated autoscroll');
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        performAutoScroll();
      });
    }
  }, [displayedMessages, messageCount, streamChunkMessage, thinkingState.isActive, autoScroll, performAutoScroll]);

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
            setIsLoading(false)
            setStreamChunkMessage(undefined)
            setResponseStreamChunks([])
          }
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
    
    // Handle load more messages at the top
    if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }

    // Check if we're at the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    setIsScrolledToBottom(isAtBottom);
    
    // Detect user interrupt
    if (!isAtBottom && autoScroll) {
      console.log('ChatBox: User scrolled up, disabling auto-scroll');
      setAutoScroll(false);
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages, autoScroll]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      console.log('🔄 ChatBox: Manual scroll to bottom triggered');
      
      // Re-enable auto-scroll when user manually scrolls to bottom
      if (!autoScroll) {
        console.log('🔄 ChatBox: Re-enabling auto-scroll via manual button');
        setAutoScroll(true);
      }
      
      // Use the performAutoScroll function
      performAutoScroll();
      
      // Update isScrolledToBottom state
      setTimeout(() => {
        setIsScrolledToBottom(true);
      }, 100);
    }
  }, [performAutoScroll, autoScroll]);

  // Handle typing state changes from input - COMPLETELY DISABLED FOR TESTING
  const handleTypingStateChange = useCallback((typing: boolean) => {
    console.log(`ChatBox: IGNORING typing state change to prevent interference: ${typing}`);
  }, []);

  // Enhanced thinking state management with artificial delays and proper reset
  React.useEffect(() => {
    console.log('🧠 ChatBox: isLoading state changed:', isLoading, 'thinkingState.isActive:', thinkingState.isActive);
    
    if (isLoading && !thinkingState.isActive) {
      console.log('🧠 ChatBox: Activating thinking indicator for new message');
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
      
      setThinkingState({
        isActive: true,
        context: 'Analyzing your request...',
        step: 'Preparing analysis workflow',
        progress: 0,
        estimatedTime: 'any second now'
      });
    } else if (!isLoading && thinkingState.isActive) {
      console.log('🧠 ChatBox: Scheduling thinking indicator deactivation with artificial delay...');
      
      thinkingTimeoutRef.current = setTimeout(() => {
        console.log('🧠 ChatBox: Deactivating thinking indicator after artificial delay');
        setThinkingState({
          isActive: false,
          context: '',
          step: '',
          progress: 0
        });
      }, 2000);
    }
  }, [isLoading, thinkingState.isActive]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
    };
  }, []);

  //Subscribe to the response stream chunks
  useEffect(() => {
    if (!amplifyClient) return;

    const responseStreamChunkSubscriptionHandler = async () => {
      console.log('Creating response stream chunk subscription for garden: ', params.chatSessionId)
      const responseStreamChunkSub = amplifyClient.subscriptions.recieveResponseStreamChunk({ chatSessionId: params.chatSessionId }).subscribe({
        error: (error) => console.error('Error subscribing stream chunks: ', error),
        next: (newChunk) => {
          setResponseStreamChunks((prevChunks) => {
            if (newChunk.index === 0) return [newChunk]

            if (newChunk.index >= 0 && newChunk.index < prevChunks.length) {
              prevChunks[newChunk.index] = newChunk;
            } else {
              while (prevChunks.length < newChunk.index) {
                prevChunks.push(null)
              }
              prevChunks.push(newChunk)
            }

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

    const messageToRegenerate = messages.find(msg => (msg as any).id === messageId);

    if (!messageToRegenerate?.createdAt) {
      console.error('Message to regenerate not found or missing timestamp');
      return false;
    }

    params.onInputChange(messageText);

    try {
      const { data: messagesToDelete } = await amplifyClient.models.ChatMessage.listChatMessageByChatSessionIdAndCreatedAt({
        chatSessionId: params.chatSessionId as any,
        createdAt: { ge: messageToRegenerate.createdAt as any }
      });

      if (!messagesToDelete || messagesToDelete.length === 0) {
        console.error('No messages found to delete');
        return false;
      }

      const deletionPromises = messagesToDelete
        .filter(msg => msg !== null && msg !== undefined && msg.id)
        .map(async (msgToDelete) => {
          if (msgToDelete.id) {
            await amplifyClient.models.ChatMessage.delete({
              id: msgToDelete.id
            });
          }
        });

      await Promise.all(deletionPromises);

      setMessages(prevMessages =>
        prevMessages.filter(msg =>
          msg.createdAt &&
          messageToRegenerate.createdAt &&
          msg.createdAt < messageToRegenerate.createdAt
        )
      );

      setStreamChunkMessage(undefined);
      setResponseStreamChunks([]);
      setIsLoading(false);

      // Scroll after regeneration
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'auto'
        });
      }

      return true;
    } catch (error) {
      console.error('Error in message regeneration:', error);
      setIsLoading(false);
      return false;
    }
  }, [messages, params.chatSessionId, params.onInputChange, setStreamChunkMessage, setResponseStreamChunks, setMessages, setIsLoading]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (userMessage.trim()) {
      console.log('=== CHATBOX DEBUG: Sending message ===');
      console.log('User message:', userMessage);
      
      setIsLoading(true);

      const newMessage: Schema['ChatMessage']['createType'] = {
        role: 'human' as any,
        content: {
          text: userMessage
        } as any,
        chatSessionId: params.chatSessionId as any
      } as any

      try {
        const result = await sendMessage({
          chatSessionId: params.chatSessionId as any,
          newMessage: newMessage as any
        });
        
        console.log('=== CHATBOX DEBUG: Send message result ===', result);
        
        if (result.invokeResponse?.data) {
          console.log('Agent response data:', result.invokeResponse.data);
        }
        if (result.invokeResponse?.errors) {
          console.error('Agent response errors:', result.invokeResponse.errors);
        }
      } catch (error) {
        console.error('=== CHATBOX DEBUG: Send message error ===', error);
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
          {displayedMessages.map((message, index) => {
            const stableKey = `message-${index}-${(message as any).role}-${((message as any).content?.text || '').substring(0, 20).replace(/\W/g, '')}`;
            console.log(`🔑 Rendering message with stable key: ${stableKey}`);
            
            return (
              <ListItem key={stableKey} style={{ 
                visibility: (message as any).role === 'ai' && !(message as any).artifacts && (message as any).content?.text ? 'visible' : undefined,
                display: (message as any).role === 'ai' && !(message as any).artifacts && (message as any).content?.text ? 'flex' : undefined,
                opacity: (message as any).role === 'ai' && !(message as any).artifacts && (message as any).content?.text ? 1 : undefined
              }}>
                <ChatMessage
                  message={message}
                  onRegenerateMessage={(message as any).role === 'human' ? handleRegenerateMessage : undefined}
                  onSendMessage={handleSend}
                />
              </ListItem>
            );
          })}
          
          {/* Show thinking indicator when AI is processing */}
          {thinkingState.isActive && (
            <ListItem>
              <div style={{ width: '100%' }}>
                <ThinkingIndicator
                  context={thinkingState.context}
                  step={thinkingState.step}
                  progress={thinkingState.progress}
                  estimatedTime={thinkingState.estimatedTime}
                  currentThoughtStep={thinkingState.currentThoughtStep}
                  isVisible={thinkingState.isActive}
                />
              </div>
            </ListItem>
          )}
          
          {/* Alternative: Show basic loading indicator when isLoading but no thought steps */}
          {isLoading && !thinkingState.isActive && (
            <ListItem>
              <div style={{ width: '100%' }}>
                <ThinkingIndicator
                  context="🧠 Analyzing your request..."
                  step="Preparing analysis workflow"
                  progress={0}
                  isVisible={true}
                />
              </div>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>

      </Box>

      <div className='controls'>
        <div 
          className='input-bkgd'
          style={{
            backdropFilter: 'blur(8px)'
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
              text: 'General AI Assistant - Weather, regulations, general knowledge',
              id: 'generalAgent',
            },
            {
              text: 'Petrophysics Agent - Well data analysis & formation evaluation',
              id: 'petroAgent',
            },
            {
              text: 'Catalog Explorer - Geographic well search & mapping',
              id: 'catalogAgent',
            },
            {
              text: 'Renewable Energy Agent - Wind farm site analysis & optimization',
              id: 'renewableAgent',
            },
            ]}
            expandToViewport={true}
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
