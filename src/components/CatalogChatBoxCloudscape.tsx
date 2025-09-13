import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../../utils/types';
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
import { v4 as uuidv4 } from 'uuid';

// Component to render a dynamic table within a chat message
function DynamicTableDisplay({ tableData }: { tableData: any[] }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 10;
  
  // Generate column definitions dynamically based on the first item's keys
  const generateColumnDefinitions = () => {
    if (!tableData || tableData.length === 0) return [];
    
    // Get keys from the first item to use as columns, excluding 'id'
    const firstItem = tableData[0];
    return Object.keys(firstItem)
      .filter(key => key !== 'id') // Remove ID column
      .map(key => ({
        id: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // Format header: capitalize and replace underscores
        cell: (item: any) => item[key]?.toString() || "N/A",
        sortingField: key
      }));
  };

  const columnDefinitions = generateColumnDefinitions();

  return (
    <div 
      style={{ 
        marginTop: '15px', 
        marginBottom: '15px'
      }}
    >
      <div className='tables'>
        <Table
          columnDefinitions={columnDefinitions}
          items={tableData}
          trackBy={(item) => item.name || `item-${Math.random()}`}
        />
      </div>
      
    </div>
  );
}

// Custom AI message component that can render tables
function CustomAIMessage({ message }: { message: Message }) {
  const [tableData, setTableData] = useState<any[] | null>(null);
  
  // Parse the message content to extract table data if present
  useEffect(() => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    if (messageText) {
      try {
        // Look for JSON table data marker in the message
        const tableDataMatch = messageText.match(/```json-table-data\n([\s\S]*?)\n```/);
        if (tableDataMatch && tableDataMatch[1]) {
          const parsedData = JSON.parse(tableDataMatch[1]);
          setTableData(parsedData);
        }
      } catch (error) {
        console.error("Error parsing table data:", error);
      }
    }
  }, [message.content]);
  
  // Get clean text without the JSON table data
  const getCleanText = () => {
    // Access the text content safely
    const messageText = typeof message.content === 'object' && message.content && 'text' in message.content 
      ? String(message.content.text)
      : '';
    
    if (!messageText) return "";
    return messageText.replace(/```json-table-data\n[\s\S]*?\n```/g, "");
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#0073bb',
          borderRadius: '50%',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          <Icon name="gen-ai" />
        </div>
        <div style={{ flex: 1 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {getCleanText()}
          </ReactMarkdown>
          
          {/* Render table if table data is present */}
          {tableData && tableData.length > 0 && (
            <DynamicTableDisplay tableData={tableData} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * CatalogChatBoxCloudscape - A pure Cloudscape version of the chat component
 * This version removes all Material UI dependencies to prevent styling conflicts
 */
const CatalogChatBoxCloudscape = (params: {
  onInputChange: (input: string) => void,
  userInput: string,
  messages: Message[],
  setMessages: (input: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  onSendMessage: (message: string) => Promise<void>
}) => {
  const { onInputChange, userInput, messages, setMessages, onSendMessage } = params;
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

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
      setIsLoading(true);

      // Add user message to the chat
      const newUserMessage: Message = {
        id: uuidv4(),
        role: 'human',
        content: {
          text: userMessage
        },
        responseComplete: true,
        createdAt: new Date().toISOString(),
        chatSessionId: '',
        owner: ''
      } as any;
      
      // Defer the state update to avoid setState-during-render warning
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
      }, 0);
      
      // Clear the input field
      onInputChange('');
      
      // Process the message (this will be handled by the parent component's onSendMessage)
      await onSendMessage(userMessage);
      
      setIsLoading(false);
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
      {/* Messages container */}
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
          position: 'relative'
        }}
      >
        <div>
          {messages.map((message, index) => (
            <div 
              key={Array.isArray(message.id) ? message.id[0] || `message-${index}` : message.id || `message-${index}`}
              style={{ marginBottom: '16px', padding: '0 16px' }}
            >
              {message.role === 'ai' ? (
                <CustomAIMessage message={message} />
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className='controls'>
        <div className='input-bkgd'>
          <ExpandablePromptInput
            onChange={(value) => onInputChange(value)}
            onAction={() => handleSend(userInput)}
            value={userInput}
            actionButtonAriaLabel="Send message"
            actionButtonIconName="send"
            ariaLabel="Prompt input with action button"
            placeholder="Search for wells or seismic data..."
          />
          <div style={{ 
            color: 'white', 
            fontSize: '11px', 
            lineHeight: '14px', 
            width: '50px', 
            marginRight: '-13px', 
            marginLeft: '10px' 
          }}>
            Example Queries
          </div>
          <ButtonDropdown
            items={[
              {
                text: 'Show me wells with GR, DTC and RHOB logs',
                id: '1'
              },
              {
                text: 'Find WELL-008',
                id: '2'
              },
              {
                text: 'Which wells have logs below 3000 meters',
                id: '3'
              }
            ]}
            onItemClick={({ detail }) => {
              // Find the clicked item and populate the text box with its text
              const clickedItem = [
                {
                  text: 'Show me wells with GR, DTC and RHOB logs',
                  id: '1'
                },
                {
                  text: 'Find WELL-008',
                  id: '2'
                },
                {
                  text: 'Which wells have logs below 3000 meters',
                  id: '3'
                }
              ].find(item => item.id === detail.id);
              
              if (clickedItem) {
                onInputChange(clickedItem.text);
              }
            }}
          />
        </div>
      </div>
      
      {/* Scroll to bottom button */}
      {!isScrolledToBottom && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          right: '20px',
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
