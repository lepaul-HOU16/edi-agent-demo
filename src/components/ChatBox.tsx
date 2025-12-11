import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Fab, Paper } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { Message } from '@/utils/types';

import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';

import { defaultPrompts } from '@/constants/defaultPrompts';

import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import ExpandablePromptInput from './ExpandablePromptInput';
import AgentSwitcher from './AgentSwitcher';
import { PushToTalkButton } from './PushToTalkButton';
import { VoiceTranscriptionDisplay } from './VoiceTranscriptionDisplay';

import { getThinkingContextFromStep } from '@/utils/thoughtTypes';
import { useRenewableJobPolling, useChatMessagePolling } from '@/hooks';
import { combineAndSortMessages, sendMessage } from '@/utils/chatUtils';
import { Grid, Button } from '@cloudscape-design/components';
import { useProjectContext } from '@/contexts/ProjectContext';
import { logContextMismatchError } from '@/utils/projectContextDebug';
import { validateProjectContext, logProjectContext } from '@/utils/projectContextValidation';

// Development-only logging utility
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

const ChatBox = (params: {
  chatSessionId: string,
  showChainOfThought: boolean,
  onInputChange: (input: string) => void,
  userInput: string,
  messages?: Message[],
  setMessages?: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  selectedAgent?: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft',
  onAgentChange?: (agent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft') => void
}) => {
  const { chatSessionId, showChainOfThought } = params
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(true);
  
  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');
  
  // CRITICAL FIX: Get active project context
  const { activeProject } = useProjectContext();
  
  // Use provided messages and setMessages if available, otherwise use local state
  const messages = params.messages || localMessages;
  const setMessages = params.setMessages || setLocalMessages;

  const [, setResponseStreamChunks] = useState<any[]>([]);
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

  // ASYNC RENEWABLE JOBS: Poll for results from background processing
  const {
    isProcessing: isRenewableJobProcessing,
    hasNewResults: hasNewRenewableResults,
    latestMessage: latestRenewableMessage,
  } = useRenewableJobPolling({
    chatSessionId,
    enabled: true, // Always poll when chat is open
    pollingInterval: 3000, // Poll every 3 seconds
    onNewMessage: (message) => {
      devLog('� ChatBox: New  renewable job results received', {
        messageId: message?.id,
        role: message?.role,
        hasArtifacts: !!(message as any)?.artifacts?.length
      });
      // Manually add the message to trigger UI update
      if (message) {
        setMessages((prevMessages) => {
          // Check if message already exists
          const exists = prevMessages.some(m => m.id === message.id);
          devLog('🌱 ChatBox: Checking if message exists', {
            messageId: message.id,
            exists,
            currentMessageCount: prevMessages.length,
            currentMessageIds: prevMessages.map(m => m.id)
          });
          if (!exists) {
            devLog('🌱 ChatBox: Adding new renewable message to UI');
            return [...prevMessages, message as Message];
          } else {
            devLog('🌱 ChatBox: Message already exists, skipping add');
          }
          return prevMessages;
        });
      }
    },
  });

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
    
    devLog('🚀 ChatBox: Performing fine-tuned autoscroll');
    
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
        
        devLog('✅ ChatBox: Slow smooth scrollIntoView completed');
      } catch (error) {
        devWarn('❌ ChatBox: scrollIntoView failed:', error);
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
          devLog('✅ ChatBox: Delayed smooth scrollTo completed with extended buffer');
        }
      } catch (error) {
        devWarn('❌ ChatBox: Delayed scrollTo failed:', error);
      }
    }, 100); // Small delay to ensure DOM is fully updated
    
    // Log final position after animation completes
    setTimeout(() => {
      if (messagesContainerRef.current) {
        devLog('📏 ChatBox: Final scroll position:', messagesContainerRef.current.scrollTop, '/', messagesContainerRef.current.scrollHeight);
      }
    }, 800); // Increased delay for slower animation
  }, [autoScroll]);

  // Memoized displayed messages with deduplication
  const displayedMessages = React.useMemo(() => {
    devLog('ChatBox: Calculating displayed messages', {
      messagesLength: messages?.length || 0,
      hasStreamChunk: !!streamChunkMessage
    });
    
    // CRITICAL FIX: Deduplicate messages by ID before processing
    const deduplicatedMessages = messages ? Array.from(
      new Map(messages.map(m => [m.id, m])).values()
    ) : [];
    
    // Check if deduplication removed any messages
    if (messages && deduplicatedMessages.length < messages.length) {
      devWarn('⚠️ DUPLICATE MESSAGES REMOVED!', {
        originalCount: messages.length,
        deduplicatedCount: deduplicatedMessages.length,
        removedCount: messages.length - deduplicatedMessages.length
      });
      
      // Log which IDs were duplicated
      const messageIds = messages.map(m => m.id);
      const idCounts = messageIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const duplicates = Object.entries(idCounts).filter(([_, count]) => (count as number) > 1);
      devWarn('Removed duplicate message IDs:', duplicates);
    }
    
    const allMessages = [
      ...deduplicatedMessages,
      ...(streamChunkMessage ? [streamChunkMessage] : [])
    ];
    
    return allMessages.filter(shouldDisplayMessage);
  }, [messages, streamChunkMessage, shouldDisplayMessage]);

  // CONSOLIDATED: Single useEffect for all autoscroll triggers
  useEffect(() => {
    const newMessageCount = displayedMessages.length;
    
    // Re-enable auto-scroll for new messages
    if (newMessageCount > messageCount && !autoScroll) {
      devLog('🔄 ChatBox: Re-enabling auto-scroll for new messages');
      setAutoScroll(true);
    }
    
    // Update message count
    if (newMessageCount !== messageCount) {
      setMessageCount(newMessageCount);
    }
    
    // Perform autoscroll for any content change
    if (autoScroll && (newMessageCount > 0 || streamChunkMessage || thinkingState.isActive)) {
      devLog('🔄 ChatBox: Triggering consolidated autoscroll');
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        performAutoScroll();
      });
    }
  }, [displayedMessages, messageCount, streamChunkMessage, thinkingState.isActive, autoScroll, performAutoScroll]);



  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      // TODO: Implement load more messages via REST API if needed
      console.log('Load more messages not yet implemented via REST API');
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMoreMessages, isLoadingMore, params.chatSessionId]);

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
      devLog('ChatBox: User scrolled up, disabling auto-scroll');
      setAutoScroll(false);
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages, autoScroll]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      devLog('🔄 ChatBox: Manual scroll to bottom triggered');
      
      // Re-enable auto-scroll when user manually scrolls to bottom
      if (!autoScroll) {
        devLog('🔄 ChatBox: Re-enabling auto-scroll via manual button');
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

  // Handle typing state changes from input - disabled to prevent interference
  const handleTypingStateChange = useCallback((typing: boolean) => {
    devLog(`ChatBox: Ignoring typing state change: ${typing}`);
  }, []);

  // Enhanced thinking state management with proper reset
  React.useEffect(() => {
    devLog('🧠 ChatBox: isLoading state changed:', isLoading, 'thinkingState.isActive:', thinkingState.isActive);
    
    if (isLoading && !thinkingState.isActive) {
      devLog('� ChatBox: Activacting thinking indicator for new message');
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
      devLog('🧠 ChatBox: Scheduling thinking indicator deactivation...');
      
      thinkingTimeoutRef.current = setTimeout(() => {
        devLog('🧠 ChatBox: Deactivating thinking indicator');
        setThinkingState({
          isActive: false,
          context: '',
          step: '',
          progress: 0
        });
      }, 500); // Brief delay to ensure smooth transition
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



  // Update function to handle message regeneration
  const handleRegenerateMessage = useCallback(async (messageId: string, messageText: string) => {
    const messageToRegenerate = messages.find(msg => (msg as any).id === messageId);

    if (!messageToRegenerate?.createdAt) {
      console.error('Message to regenerate not found or missing timestamp');
      return false;
    }

    params.onInputChange(messageText);

    try {
      // TODO: Implement message deletion via REST API if needed
      console.log('Message regeneration not yet fully implemented via REST API');

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

  // CRITICAL FIX: Add ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);

  const handleSend = useCallback(async (userMessage: string) => {
    if (userMessage.trim()) {
      // CRITICAL FIX: Prevent duplicate submissions
      if (isSubmittingRef.current) {
        devLog('⚠️ FRONTEND: Duplicate submission prevented');
        return;
      }
      
      isSubmittingRef.current = true;
      
      // CRITICAL FIX: Get active project context from ProjectContext
      let projectContext = activeProject ? {
        projectId: activeProject.projectId,
        projectName: activeProject.projectName,
        location: activeProject.location,
        coordinates: activeProject.coordinates
      } : undefined;
      
      devLog('═══════════════════════════════════════════════════════════');
      devLog('🔵 FRONTEND (ChatBox): Sending message');
      devLog('═══════════════════════════════════════════════════════════');
      devLog('📝 Message:', userMessage);
      devLog('🆔 Session ID:', params.chatSessionId);
      devLog('🤖 Selected Agent:', params.selectedAgent || 'auto');
      devLog('⏰ Timestamp:', new Date().toISOString());
      
      // Validate and log project context
      if (projectContext) {
        logProjectContext(projectContext, 'ChatBox sendMessage');
        
        // Validate project context structure
        if (!validateProjectContext(projectContext)) {
          console.error('❌ [ChatBox] Invalid project context structure, will not send to backend');
          console.error('❌ [ChatBox] Context:', projectContext);
          // Don't send invalid context - set to undefined
          projectContext = undefined;
        }
      } else {
        devLog('═══════════════════════════════════════════════════════════');
        devLog('🎯 PROJECT CONTEXT IN CHATBOX');
        devLog('═══════════════════════════════════════════════════════════');
        devLog('❌ NO Project Context - activeProject is null');
        devLog('⚠️  Backend will not receive project information');
        devLog('⚠️  Workflow actions may fail or execute on wrong project');
        devLog('═══════════════════════════════════════════════════════════');
      }
      
      // INSTANT INPUT CLEARING: Clear input IMMEDIATELY before any async operations
      const clearStartTime = performance.now();
      params.onInputChange('');
      const clearDuration = performance.now() - clearStartTime;
      devLog(`⚡ FRONTEND: Input cleared in ${clearDuration.toFixed(2)}ms`);
      
      setIsLoading(true);

      const newMessage = {
        role: 'user' as const,
        content: {
          text: userMessage
        },
        chatSessionId: params.chatSessionId
      }

      try {
        devLog('🔵 FRONTEND: Calling sendMessage API...');
        const result = await sendMessage({
          chatSessionId: params.chatSessionId,
          newMessage: newMessage,
          agentType: params.selectedAgent || 'auto',
          projectContext: projectContext // CRITICAL FIX: Pass project context
        });
        
        devLog('═══════════════════════════════════════════════════════════');
        devLog('🔵 FRONTEND (ChatBox): API Response Received');
        devLog('═══════════════════════════════════════════════════════════');
        devLog('✅ Success:', result.success);
        devLog('📦 Has Response:', !!result.response);
        devLog('📊 Artifact Count:', result.response?.artifacts?.length || 0);
        devLog('💬 Response Text:', result.response?.text?.substring(0, 100) + '...');
        devLog('═══════════════════════════════════════════════════════════');
        
        if (result.success && result.response) {
          devLog('� FRONTERND: Processing successful response');
          
          // Add AI response to messages
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: { text: result.response.text },
            chatSessionId: params.chatSessionId,
            responseComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any;
          
          // Add artifacts if present
          if (result.response.artifacts && result.response.artifacts.length > 0) {
            (aiMessage as any).artifacts = result.response.artifacts;
            devLog('🔵 FRONTEND: Added', result.response.artifacts.length, 'artifacts to AI message');
          } else {
            devWarn('⚠️ FRONTEND: No artifacts in response');
          }
          
          // CRITICAL: Add thought steps if present
          if (result.data?.thoughtSteps && result.data.thoughtSteps.length > 0) {
            (aiMessage as any).thoughtSteps = result.data.thoughtSteps;
            devLog('� FRONTERND: Added', result.data.thoughtSteps.length, 'thought steps to AI message');
          } else {
            devWarn('⚠️ FRONTEND: No thought steps in response');
          }
          
          // Update messages
          devLog('� FRONTENDN: Adding AI message to chat');
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        }
        
        if (!result.success) {
          console.error('❌ FRONTEND: API returned error');
          console.error('Error:', result.error);
          
          // CONTEXT MISMATCH ERROR HANDLING
          const errorMessage = result.error || result.response?.text || 'An error occurred';
          const isContextMismatch = errorMessage.toLowerCase().includes('project context mismatch') ||
                                   errorMessage.toLowerCase().includes('context mismatch');
          
          if (isContextMismatch) {
            // Log detailed error information for debugging
            logContextMismatchError({
              errorMessage,
              activeProject,
              query: userMessage
            });
            
            // Create error message with clear suggestions
            const errorAiMessage: Message = {
              id: `error-${Date.now()}`,
              role: 'ai',
              content: { 
                text: `⚠️ **Project Context Mismatch**\n\n${errorMessage}\n\n**What you can do:**\n\n1. **Refresh the page** to ensure you have the latest project context\n2. **Start a new project** for this location by asking for terrain analysis\n3. **Switch to the correct project** using the project dashboard\n4. **Check your active project** in the project badge at the top of the page\n\nWould you like me to help you start a new project for this location?`
              },
              chatSessionId: params.chatSessionId,
              responseComplete: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any;
            
            setMessages((prevMessages) => [...prevMessages, errorAiMessage]);
          } else {
            // Generic error handling for other errors
            const errorAiMessage: Message = {
              id: `error-${Date.now()}`,
              role: 'ai',
              content: { 
                text: `❌ **Error**\n\n${errorMessage}\n\nPlease try again or rephrase your request.`
              },
              chatSessionId: params.chatSessionId,
              responseComplete: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as any;
            
            setMessages((prevMessages) => [...prevMessages, errorAiMessage]);
          }
        }
        
        setIsLoading(false);
        devLog('� FRONTFEND: Message handling complete');
        // CRITICAL FIX: Reset submission flag
        isSubmittingRef.current = false;
      } catch (error) {
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ FRONTEND (ChatBox): CRITICAL ERROR');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('═══════════════════════════════════════════════════════════');
        setIsLoading(false);
        // VALIDATION ERROR HANDLING: Restore input on error
        params.onInputChange(userMessage);
        // CRITICAL FIX: Reset submission flag on error
        isSubmittingRef.current = false;
      }
    }
  }, [
    activeProject,
    params.chatSessionId,
    params.selectedAgent,
    params.onInputChange,
    params.userInput,
    setMessages,
    setIsLoading
  ]);

  // Handler for PTT transcription updates
  const handleVoiceTranscriptionChange = useCallback((text: string) => {
    setVoiceTranscription(text);
  }, []);

  // Handler for PTT recording state changes
  const handleVoiceRecordingStateChange = useCallback((isRecording: boolean) => {
    setIsVoiceRecording(isRecording);
    
    // PTT can ONLY hide input, never show it
    // When recording starts, hide the input if it's visible
    // When recording stops, do nothing - input stays in its current state
    if (isRecording && isInputVisible) {
      devLog('🎤 ChatBox: Voice recording started, hiding input');
      setIsInputVisible(false);
    }
  }, [isInputVisible]);

  // Handler for PTT transcription completion
  const handleVoiceTranscriptionComplete = useCallback((text: string) => {
    devLog('🎤 ChatBox: Voice transcription complete:', text);
    // Clear voice display IMMEDIATELY before sending to prevent duplicate
    setVoiceTranscription('');
    setIsVoiceRecording(false);
    
    if (text.trim()) {
      handleSend(text);
    }
  }, [handleSend]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="messages-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          flexDirection: 'column',
          display: 'flex',
          marginBottom: '16px',
          borderRadius: '14px',
          position: 'relative'
        }}
      >
        {isLoadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </div>
        )}

        <List>
          {displayedMessages
            .filter((message) => {
              // Filter out ai-stream messages - they should NOT appear in conversation
              if ((message as any).role === 'ai-stream') {
                devLog('⏭️ Filtering out ai-stream message (should not be in conversation)');
                return false;
              }
              return true;
            })
            .map((message, index) => {
            const stableKey = `message-${index}-${(message as any).role}-${((message as any).content?.text || '').substring(0, 20).replace(/\W/g, '')}`;
            devLog(`🔑 Rendering message with stable key: ${stableKey}`);
            
            return (
              <ListItem key={stableKey}>
                <ChatMessage
                  message={message}
                  onRegenerateMessage={(message as any).role === 'human' ? handleRegenerateMessage : undefined}
                  onSendMessage={handleSend}
                />
              </ListItem>
            );
          })}
          
          {/* Show thinking indicator when AI is processing - SINGLE INDICATOR ONLY */}
          {(isLoading || thinkingState.isActive) && (
            <ListItem>
              <div style={{ width: '100%' }}>
                <ThinkingIndicator
                  context={thinkingState.context || "🧠 Analyzing your request..."}
                  step={thinkingState.step || "Preparing analysis workflow"}
                  progress={thinkingState.progress || 0}
                  estimatedTime={thinkingState.estimatedTime}
                  currentThoughtStep={thinkingState.currentThoughtStep}
                  isVisible={true}
                />
              </div>
            </ListItem>
          )}
          
          {/* Voice Transcription Display - shown ONLY while actively recording */}
          {isVoiceRecording && (
            <ListItem>
              <div style={{ width: '100%' }}>
                <VoiceTranscriptionDisplay
                  transcription={voiceTranscription}
                  isRecording={isVoiceRecording}
                  isVisible={true}
                />
              </div>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>

      </div>

      {/* Controls with sliding animation */}
      <div 
        className='controls'
        style={{
          transform: isInputVisible ? 'translateX(0)' : 'translateX(calc(100vw - 50% + 24.95%))',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Grid
          disableGutters
          gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
        >
          <div></div>
          <div>
            <div 
              className='input-bkgd'
              style={{
                backdropFilter: 'blur(8px)',
                position: 'relative'
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
              {params.selectedAgent !== undefined && params.onAgentChange && (
                <>
                  <Typography
                    style={{ 
                      color: 'white',
                      lineHeight: '14px', 
                      width: '50px', 
                      marginRight: '-2px', 
                    }}
                    fontSize={11}
                  >
                    AI Agent Switcher
                  </Typography>
                  <AgentSwitcher
                    selectedAgent={params.selectedAgent}
                    onAgentChange={params.onAgentChange}
                    variant="input"
                  />
                </>
              )}
            </div>
          </div>
        </Grid>

      </div>
      
      {/* Push-to-Talk Button - ALWAYS VISIBLE, positioned above input toggle */}
      <div
        style={{
          position: 'fixed',
          right: '22px',
          bottom: '98px',
          zIndex: 1002,
        }}
      >
        <PushToTalkButton
          onTranscriptionComplete={handleVoiceTranscriptionComplete}
          onTranscriptionChange={handleVoiceTranscriptionChange}
          onRecordingStateChange={handleVoiceRecordingStateChange}
          disabled={isLoading}
        />
      </div>
      
      {/* Toggle button fixed on right edge - never moves */}
      <div
        style={{
          position: 'fixed',
          right: '22px',
          bottom: '50px',
          zIndex: 1001,
        }}
      >
        <Button
          onClick={() => setIsInputVisible(!isInputVisible)}
          iconName="search"
          variant={isInputVisible ? "normal" : "primary"}
          ariaLabel={isInputVisible ? "Hide search input" : "Show search input"}
        />
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
    </div>
  );
};

// Custom comparison function that ignores userInput changes to prevent re-renders on every keystroke
const arePropsEqual = (prevProps: any, nextProps: any) => {
  // Only re-render if these props change
  return (
    prevProps.chatSessionId === nextProps.chatSessionId &&
    prevProps.showChainOfThought === nextProps.showChainOfThought &&
    prevProps.messages === nextProps.messages &&
    prevProps.setMessages === nextProps.setMessages &&
    prevProps.selectedAgent === nextProps.selectedAgent &&
    prevProps.onAgentChange === nextProps.onAgentChange &&
    prevProps.onInputChange === nextProps.onInputChange
    // Intentionally NOT comparing userInput to prevent re-renders on keystroke
  );
};

export default React.memo(ChatBox, arePropsEqual);
