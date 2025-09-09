import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, List, ListItem, Typography, CircularProgress, Fab } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Message } from '../../utils/types';
import ChatMessage from './ChatMessage';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import ExpandablePromptInput from './ExpandablePromptInput';
import { v4 as uuidv4 } from 'uuid';

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
        createdAt: new Date().toISOString()
      } as any;
      
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
                text: 'Show me wells in the Barrow region',
                id: '1'
              },
              {
                text: 'Find seismic data near Dampier',
                id: '2'
              },
              {
                text: 'Display wells drilled after 2020',
                id: '3'
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
