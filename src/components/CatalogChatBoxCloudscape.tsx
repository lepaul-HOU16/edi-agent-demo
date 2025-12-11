import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Message } from '@/utils/types';
import ChatMessage from './ChatMessage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Table, 
  ButtonDropdown, 
  Button, 
  Spinner,
  Icon,
  Pagination
} from '@cloudscape-design/components';
import ExpandablePromptInput from './ExpandablePromptInput';
import { OSDUSearchResponse, OSDUErrorResponse } from './OSDUSearchResponse';
import { OSDUQueryBuilder } from './OSDUQueryBuilder';
import type { QueryCriterion } from './OSDUQueryBuilder';
import { ExpandableSection, Grid } from '@cloudscape-design/components';
import { PushToTalkButton } from './PushToTalkButton';
import { VoiceTranscriptionDisplay } from './VoiceTranscriptionDisplay';

// Enhanced component to render professional geoscientist content instead of boring tables
// Memoized to prevent unnecessary re-renders
const ProfessionalGeoscientistDisplay = React.memo(({ 
  tableData
}: { 
  tableData: any[]
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 10;

  // Generate column definitions dynamically based on the first item's keys
  const columnDefinitions = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    
    const firstItem = tableData[0];
    return Object.keys(firstItem)
      .filter(key => key !== 'id') // Remove ID column
      .map(key => ({
        id: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        cell: (item: any) => item[key]?.toString() || "N/A",
        sortingField: key
      }));
  }, [tableData]);

  // Calculate pagination
  const startIndex = (currentPageIndex - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = tableData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(tableData.length / pageSize);

  return (
    <div 
      style={{ 
        marginTop: '15px', 
        marginBottom: '15px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'visible',
        boxSizing: 'border-box'
      }}
    >
      <div className='tables' style={{ 
        width: '100%',
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'visible',
        boxSizing: 'border-box'
      }}>
        <Table
          columnDefinitions={columnDefinitions}
          items={paginatedData}
          trackBy={(item) => item.name || item.id || JSON.stringify(item)}
          pagination={
            <Pagination
              currentPageIndex={currentPageIndex}
              pagesCount={totalPages}
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
            />
          }
        />
      </div>
    </div>
  );
});

// Enhanced AI message component that renders professional geoscientist content
// Memoized to prevent unnecessary re-renders
const CustomAIMessage = React.memo(({ message, originalSearchQuery }: { message: Message, originalSearchQuery?: string }) => {
  const [tableData, setTableData] = useState<any[] | null>(null);
  
  // Parse the message content to extract table data and OSDU responses
  useEffect(() => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    if (messageText) {
      try {
        // Check for OSDU search response format
        const osduResponseMatch = messageText.match(/```osdu-search-response\n([\s\S]*?)\n```/);
        if (osduResponseMatch && osduResponseMatch[1]) {
          const osduData = JSON.parse(osduResponseMatch[1]);
          setTableData(osduData.records || []);
          return;
        }
        
        // Check for OSDU error response format
        const osduErrorMatch = messageText.match(/```osdu-error-response\n([\s\S]*?)\n```/);
        if (osduErrorMatch) {
          return;
        }
        
        // Look for JSON table data marker in the message
        const tableDataMatch = messageText.match(/```json-table-data\n([\s\S]*?)\n```/);
        if (tableDataMatch && tableDataMatch[1]) {
          const parsedData = JSON.parse(tableDataMatch[1]);
          setTableData(parsedData);
        }
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    }
  }, [message.content, originalSearchQuery]);
  
  // Get clean text without the JSON table data or OSDU response markers
  const getCleanText = () => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    if (!messageText) return "";
    return messageText
      .replace(/```json-table-data\n[\s\S]*?\n```/g, "")
      .replace(/```osdu-search-response\n[\s\S]*?\n```/g, "")
      .replace(/```osdu-error-response\n[\s\S]*?\n```/g, "");
  };
  
  // Extract OSDU response data if present
  const getOSDUResponseData = () => {
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    const osduResponseMatch = messageText.match(/```osdu-search-response\n([\s\S]*?)\n```/);
    if (osduResponseMatch && osduResponseMatch[1]) {
      try {
        return JSON.parse(osduResponseMatch[1]);
      } catch (error) {
        console.error("Error parsing OSDU response:", error);
      }
    }
    return null;
  };
  
  // Extract OSDU error data if present
  const getOSDUErrorData = () => {
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    const osduErrorMatch = messageText.match(/```osdu-error-response\n([\s\S]*?)\n```/);
    if (osduErrorMatch && osduErrorMatch[1]) {
      try {
        return JSON.parse(osduErrorMatch[1]);
      } catch (error) {
        console.error("Error parsing OSDU error:", error);
      }
    }
    return null;
  };
  
  const osduResponseData = getOSDUResponseData();
  const osduErrorData = getOSDUErrorData();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          minWidth: '32px',
          minHeight: '32px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#0073bb',
          borderRadius: '50%',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          <Icon name="gen-ai" />
        </div>
        <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 40px)' }}>
          {/* Render OSDU search response with Cloudscape components */}
          {osduResponseData ? (
            <OSDUSearchResponse
              answer={osduResponseData.answer}
              recordCount={osduResponseData.recordCount}
              records={osduResponseData.records}
              query={osduResponseData.query}
            />
          ) : osduErrorData ? (
            <OSDUErrorResponse
              errorType={osduErrorData.errorType}
              errorMessage={osduErrorData.errorMessage}
              query={osduErrorData.query}
            />
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {getCleanText()}
              </ReactMarkdown>
              
              {/* Render simple data table only - visualizations moved to analytics tab */}
              {tableData && tableData.length > 0 && (
                <ProfessionalGeoscientistDisplay 
                  tableData={tableData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * CatalogChatBoxCloudscape - A pure Cloudscape version of the chat component
 * Enhanced with professional geoscientist visualizations instead of boring tables
 */
const CatalogChatBoxCloudscape = (params: {
  onInputChange: (input: string) => void,
  userInput: string,
  messages: Message[],
  setMessages: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  onSendMessage: (message: string) => Promise<void>,
  onOpenQueryBuilder?: () => void,
  showQueryBuilder?: boolean,
  onExecuteQuery?: (query: string, criteria: any[]) => void
}) => {
  const { onInputChange, userInput, messages, setMessages, onSendMessage, onOpenQueryBuilder, showQueryBuilder, onExecuteQuery } = params;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(true);
  
  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // Account for 100px padding-bottom when checking if at bottom
    // Only hide button when truly at absolute bottom (within 5px)
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      console.log('Scrolling to bottom, messages length:', messages.length);
      // Scroll to absolute bottom accounting for padding
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      // Update isScrolledToBottom after a brief delay to ensure scroll completes
      setTimeout(() => {
        setIsScrolledToBottom(true);
      }, 500);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive - with proper timing
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      console.log('Auto-scroll effect triggered, messages:', messages.length);
      // Scroll to absolute bottom accounting for padding
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  const handleSend = useCallback(async (userMessage: string) => {
    if (userMessage.trim()) {
      // INSTANT INPUT CLEARING: Clear input IMMEDIATELY before any async operations
      const clearStartTime = performance.now();
      onInputChange('');
      const clearDuration = performance.now() - clearStartTime;
      console.log(`⚡ Catalog input cleared in ${clearDuration.toFixed(2)}ms`);
      
      setIsLoading(true);
      
      // Store the search query for context in dashboard rendering
      setLastSearchQuery(userMessage);

      // Add user message to the chat
      const newUserMessage: Message = {
        role: 'human',
        content: {
          text: userMessage
        },
        responseComplete: true,
        chatSessionId: ''
      } as any;
      
      // Defer the state update to avoid setState-during-render warning
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
      }, 0);
      
      try {
        // Process the message (this will be handled by the parent component's onSendMessage)
        await onSendMessage(userMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        // VALIDATION ERROR HANDLING: Restore input on error
        onInputChange(userMessage);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onInputChange, setMessages, onSendMessage]);

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
      console.log('🎤 Catalog: Voice recording started, hiding input');
      setIsInputVisible(false);
    }
  }, [isInputVisible]);

  // Handler for PTT transcription completion
  const handleVoiceTranscriptionComplete = useCallback((text: string) => {
    console.log('🎤 Catalog: Voice transcription complete:', text);
    // Clear voice display IMMEDIATELY before sending to prevent duplicate
    setVoiceTranscription('');
    setIsVoiceRecording(false);
    
    if (text.trim()) {
      handleSend(text);
    }
  }, [handleSend]);

  return (
    <div className="catalog-chat-container">
      {/* Messages container with query builder at top */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="messages-container"
      >
        <div>
          {/* Query Builder - Inline at top of messages, full width */}
          {showQueryBuilder && (
            <div style={{ 
              width: '100%',
              marginBottom: '16px',
              borderRadius: '0',
              backgroundColor: '#ffffff'
            }}>
              <ExpandableSection
                headerText="OSDU Query Builder"
                variant="container"
                defaultExpanded={true}
                headerDescription="Build structured OSDU queries with dropdown selections - guaranteed to succeed"
              >
                <OSDUQueryBuilder
                  onExecute={(query: string, criteria: QueryCriterion[]) => {
                    if (onExecuteQuery) {
                      onExecuteQuery(query, criteria);
                    }
                    if (onOpenQueryBuilder) {
                      onOpenQueryBuilder(); // Close the query builder
                    }
                  }}
                  onClose={() => {
                    if (onOpenQueryBuilder) {
                      onOpenQueryBuilder(); // Toggle to close
                    }
                  }}
                />
              </ExpandableSection>
            </div>
          )}
          
          {/* Chat Messages */}
          {messages.map((message, index) => (
            <div 
              key={Array.isArray(message.id) ? message.id[0] || `message-${index}` : message.id || `message-${index}`}
              style={{ marginBottom: '16px' }}
            >
              {message.role === 'ai' ? (
                <CustomAIMessage message={message} originalSearchQuery={lastSearchQuery} />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          
          {/* Voice Transcription Display - shown ONLY while actively recording */}
          {isVoiceRecording && (
            <div style={{ marginBottom: '16px' }}>
              <VoiceTranscriptionDisplay
                transcription={voiceTranscription}
                isRecording={isVoiceRecording}
                isVisible={true}
              />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
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
          <div className='input-bkgd'>
            <ExpandablePromptInput
              onChange={(value) => onInputChange(value)}
              onAction={() => handleSend(userInput)}
              value={userInput}
              actionButtonAriaLabel="Send message"
              actionButtonIconName="send"
              ariaLabel="Prompt input with action button"
              placeholder="Ask me a question about your data"
            />
            <div style={{ 
              color: 'white', 
              fontSize: '11px', 
              lineHeight: '14px', 
              marginRight: '-2px',
              width: '50px', 
            }}>
              Data Sources
            </div>
            <ButtonDropdown
              items={[
                {
                  text: 'OSDU',
                  id: 'osduData'
                },
                {
                  text: 'TGS',
                  id: 'tgsData'
                },
                {
                  text: 'Volve',
                  id: 'volveData'
                },
                {
                  text: 'S&P',
                  id: 'spData'
                },
              ]}
              expandToViewport={true}
              onItemClick={({ detail }) => {
                // Find the clicked item and populate the text box with its text
                const clickedItem = [
                  {
                    text: 'can you show me weather maps for the area near my wells',
                    id: '1'
                  },
                  {
                    text: 'show me my wells with reservoir analysis',
                    id: '2'
                  },
                  {
                    text: 'field development recommendations for my wells',
                    id: '3'
                  },
                  {
                    text: 'production optimization analysis',
                    id: '4'
                  },
                  {
                    text: 'operational weather windows for drilling',
                    id: '5'
                  }
                ].find(item => item.id === detail.id);
                
                if (clickedItem) {
                  onInputChange(clickedItem.text);
                }
              }}
            />
          </div>
        </Grid>

      </div>
      
      {/* Push-to-Talk Button - ALWAYS VISIBLE, positioned above input toggle */}
      <div
        style={{
          position: 'fixed',
          right: '22px',
          bottom: '90px',
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
      
      {/* Scroll to bottom button */}
      {!isScrolledToBottom && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '22px',
          zIndex: 1400
        }}>
          <Button
            variant="primary"
            iconName="angle-down"
            onClick={scrollToBottom}
            ariaLabel="Scroll to bottom"
          />
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000,
          border: '1px solid #e9ebed'
        }}>
          <Spinner size="normal" />
          <span style={{ marginLeft: '8px', fontSize: '14px', color: '#232f3e' }}>
            Processing your query...
          </span>
        </div>
      )}
    </div>
  );
};

export default CatalogChatBoxCloudscape;
