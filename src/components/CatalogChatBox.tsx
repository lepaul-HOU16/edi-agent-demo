import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Fab } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Message } from '../../utils/types';
import ChatMessage from './ChatMessage';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Table, Header, Pagination } from '@cloudscape-design/components';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import ExpandablePromptInput from './ExpandablePromptInput';
import { v4 as uuidv4 } from 'uuid';

// Component to render a dynamic table within a chat message
function DynamicTableDisplay({ tableData }: { tableData: any[] }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 10;
  
  // Generate column definitions dynamically based on the first item's keys
  const generateColumnDefinitions = () => {
    if (!tableData || tableData.length === 0) return [];
    
    // Get keys from the first item to use as columns
    const firstItem = tableData[0];
    return Object.keys(firstItem).map(key => ({
      id: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // Format header: capitalize and replace underscores
      cell: (item: any) => item[key]?.toString() || "N/A",
      sortingField: key
    }));
  };

  const columnDefinitions = generateColumnDefinitions();

  return (
    <div style={{ 
      marginTop: '15px', 
      marginBottom: '15px',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <Table
        columnDefinitions={columnDefinitions}
        items={tableData}
        trackBy="id"
        variant="embedded"
        stickyHeader={true}
        header={<Header>Search Results</Header>}
        pagination={
          <Pagination
            currentPageIndex={currentPageIndex}
            pagesCount={Math.ceil(tableData.length / pageSize)}
            onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
          />
        }
        contentDensity="compact"
      />
      <style jsx>{`
        :global(.awsui-table-row) {
          background-color: white !important;
        }
        :global(.awsui-table-cell) {
          padding: 8px 12px !important;
          background-color: white !important;
        }
        :global(.awsui-table-header-cell) {
          background-color: white !important;
          padding: 8px 12px !important;
        }
        :global(.awsui-table-container) {
          background-color: white !important;
        }
        :global(.awsui-table) {
          background-color: white !important;
        }
      `}</style>
    </div>
  );
}

// Custom AI message component that can render tables
function CustomAIMessage({ message }: { message: Message }) {
  const theme = useTheme();
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
        <SupportAgentIcon sx={{ color: theme.palette.primary.main, width: 32, height: 32 }} />
        <div>
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
 * CatalogChatBox - A custom chat component for the catalog page that doesn't use the React agent
 * This component handles chat functionality specifically for map search operations
 */
const CatalogChatBox = (params: {
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
    // In column-reverse layout, we're at bottom when scrollTop is 0
    const isAtBottom = e.currentTarget.scrollTop === 0;
    setIsScrolledToBottom(isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      // Update isScrolledToBottom after scrolling
      setIsScrolledToBottom(true);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      const isNearBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 100;

      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

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
<<<<<<< HEAD
        createdAt: new Date().toISOString()
      } as any;
=======
        createdAt: new Date().toISOString(),
        chatSessionId: '',
        owner: ''
      };
>>>>>>> vavourak-catalog
      
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      
      // Clear the input field
      onInputChange('');
      
      // Process the message (this will be handled by the parent component's onSendMessage)
      await onSendMessage(userMessage);
      
      setIsLoading(false);
    }
  }, [onInputChange, setMessages, onSendMessage]);

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
          flexDirection: 'column-reverse',
          display: 'flex',
          mb: 2,
          position: 'relative'
        }}
      >
        <List>
<<<<<<< HEAD
          {messages.map((message, index) => {
            // Ensure key is always a string
            const messageKey = Array.isArray(message.id) 
              ? message.id.join('-') 
              : (message.id || `message-${index}`);
            
            return (
              <ListItem key={messageKey}>
                <ChatMessage
                  message={message}
                />
              </ListItem>
            );
          })}
=======
          {messages.map((message) => (
            <ListItem key={message.id}>
              {message.role === 'ai' ? (
                <CustomAIMessage message={message} />
              ) : (
                <ChatMessage message={message} />
              )}
            </ListItem>
          ))}
>>>>>>> vavourak-catalog
          <div ref={messagesEndRef} />
        </List>
      </Box>

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
          <Typography
            variant="inherit"
            color="white"
            style={{ lineHeight: '14px', width: '50px', marginRight: '-13px', marginLeft: '10px' }}
            fontSize={11}
          >
            Example Queries
          </Typography>
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
      
      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '5px 15px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Processing your query...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default CatalogChatBox;
