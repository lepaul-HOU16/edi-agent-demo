import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@/utils/types';
import ChatMessage from './ChatMessage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Table, 
  Header, 
  Pagination, 
  ButtonDropdown, 
  Button, 
  Spinner,
  Icon
} from '@cloudscape-design/components';
import ExpandablePromptInput from './ExpandablePromptInput';
import { OSDUSearchResponse, OSDUErrorResponse } from './OSDUSearchResponse';
import { v4 as uuidv4 } from 'uuid';
import { OSDUQueryBuilder } from './OSDUQueryBuilder';
import type { QueryCriterion } from './OSDUQueryBuilder';
import { ExpandableSection, Grid } from '@cloudscape-design/components';

// Enhanced component to render professional geoscientist content instead of boring tables
function ProfessionalGeoscientistDisplay({ 
  tableData, 
  searchQuery, 
  queryType, 
  weatherData 
}: { 
  tableData: any[], 
  searchQuery: string, 
  queryType?: string,
  weatherData?: any 
}) {
  
  // Convert table data to well data format for the dashboard
  const wellsData = tableData.map(item => ({
    name: item.name || item.Name || `Well-${Math.random().toString().substr(2, 3)}`,
    type: item.type || item.Type || 'Production',
    depth: item.depth || item.Depth || 'Unknown',
    location: item.location || item.Location || 'Offshore',
    operator: item.operator || item.Operator || 'Unknown',
    coordinates: [
      parseFloat(item.longitude) || 114.5 + Math.random() * 0.1,
      parseFloat(item.latitude) || 10.4 + Math.random() * 0.1
    ] as [number, number]
  }));

  // Check if we should show professional dashboard vs simple table
  const shouldShowProfessionalDashboard = 
    wellsData.length <= 50 && // Don't overwhelm with too many wells
    (searchQuery.toLowerCase().includes('well') || 
     searchQuery.toLowerCase().includes('weather') ||
     searchQuery.toLowerCase().includes('analysis') ||
     searchQuery.toLowerCase().includes('field'));

  // Always show simple table in chat - visualizations moved to analytics tab
  console.log('📋 Rendering simple data table in chat (visualizations in analytics tab)');

  // Fallback to simple table for very large datasets
  console.log('📋 Rendering simple table for large dataset:', wellsData.length, 'items');
  
  // Generate column definitions dynamically based on the first item's keys
  const generateColumnDefinitions = () => {
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
  };

  const columnDefinitions = generateColumnDefinitions();

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
          items={tableData}
          trackBy={(item) => item.name || `item-${Math.random()}`}
        />
      </div>
    </div>
  );
}

// Enhanced AI message component that renders professional geoscientist content
function CustomAIMessage({ message, originalSearchQuery }: { message: Message, originalSearchQuery?: string }) {
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [queryType, setQueryType] = useState<string>('general');
  const [weatherData, setWeatherData] = useState<any>(null);
  
  // Parse the message content to extract table data, OSDU responses, and determine query type
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
          setQueryType('osdu-search');
          setTableData(osduData.records || []);
          console.log('🔍 OSDU search response detected:', osduData.recordCount, 'records');
          return;
        }
        
        // Check for OSDU error response format
        const osduErrorMatch = messageText.match(/```osdu-error-response\n([\s\S]*?)\n```/);
        if (osduErrorMatch && osduErrorMatch[1]) {
          const errorData = JSON.parse(osduErrorMatch[1]);
          setQueryType('osdu-error');
          console.log('❌ OSDU error response detected:', errorData.errorType);
          return;
        }
        
        // Look for JSON table data marker in the message
        const tableDataMatch = messageText.match(/```json-table-data\n([\s\S]*?)\n```/);
        if (tableDataMatch && tableDataMatch[1]) {
          const parsedData = JSON.parse(tableDataMatch[1]);
          setTableData(parsedData);
          
          // Determine query type from the original search query
          if (originalSearchQuery) {
            const lowerQuery = originalSearchQuery.toLowerCase();
            if (lowerQuery.includes('weather map') || 
                (lowerQuery.includes('weather') && lowerQuery.includes('map')) ||
                (lowerQuery.includes('weather') && lowerQuery.includes('near'))) {
              setQueryType('weatherMaps');
              // Create mock weather data for dashboard
              setWeatherData({
                temperature: { min: 26, max: 31, current: 28.5 },
                precipitation: { current: 2.3, forecast: 'Light showers' },
                operationalStatus: 'Favorable'
              });
            } else if (lowerQuery.includes('production') || lowerQuery.includes('reservoir')) {
              setQueryType('production');
            } else if (lowerQuery.includes('my wells')) {
              setQueryType('myWells');
            }
          }
          
          console.log('🎯 Detected query type:', queryType);
          console.log('📊 Table data:', parsedData.length, 'items');
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
                  searchQuery={originalSearchQuery || 'wells analysis'}
                  queryType={queryType}
                  weatherData={weatherData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    // For normal layout, check if we're at the bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      console.log('Scrolling to bottom, messages length:', messages.length);
      // Use scrollIntoView on the end ref for more reliable scrolling
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
      // Update isScrolledToBottom after a brief delay to ensure scroll completes
      setTimeout(() => {
        setIsScrolledToBottom(true);
      }, 500);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive - with proper timing
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      console.log('Auto-scroll effect triggered, messages:', messages.length);
      // Multiple approaches to ensure reliable scrolling
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          // First try scrollIntoView
          scrollToBottom();
          
          // Backup: also try container scroll after additional delay
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight + 100, // Add extra buffer
                behavior: 'smooth'
              });
            }
          }, 100);
        });
      }, 300); // Increased delay
      
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

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Messages container with query builder at top */}
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
        <div>
          {/* Query Builder - Inline at top of messages, full width */}
          {showQueryBuilder && (
            <div style={{ 
              width: '100%',
              marginBottom: '16px',
              borderRadius: '14px',
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
          <div>
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
                marginRight: '-8px',
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
          </div>
        </Grid>

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
          bottom: '22px',
          right: '50px',
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
