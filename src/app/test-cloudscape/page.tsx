'use client';

import React, { useState } from 'react';
import CatalogChatBoxCloudscape from '../../components/CatalogChatBoxCloudscape';
import { Message } from '../../../utils/types';

// Test data matching the screenshot format
const testTableData = [
  {
    name: 'Well-001',
    type: 'Exploration',
    location: 'Block A-123',
    depth: '3,450 m'
  },
  {
    name: 'Well-002',
    type: 'Production',
    location: 'Block B-456',
    depth: '2,780 m'
  },
  {
    name: 'Well-003',
    type: 'Injection',
    location: 'Block A-123',
    depth: '3,200 m'
  }
];

export default function TestCloudsapePage() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'test-ai-message',
      role: 'ai',
      content: {
        text: `Found 3 wells matching your search criteria. The map has been updated to show these wells.

Here's a table of the wells found:

\`\`\`json-table-data
${JSON.stringify(testTableData, null, 2)}
\`\`\``
      },
      responseComplete: true,
      createdAt: new Date().toISOString(),
      chatSessionId: 'test',
      owner: 'test'
    } as any
  ]);

  const handleSendMessage = async (message: string) => {
    // Mock response for testing
    const newMessage: Message = {
      id: 'new-ai-message',
      role: 'ai',
      content: {
        text: `You searched for: "${message}". Here are the results with a test table:

\`\`\`json-table-data
${JSON.stringify(testTableData, null, 2)}
\`\`\``
      },
      responseComplete: true,
      createdAt: new Date().toISOString(),
      chatSessionId: 'test',
      owner: 'test'
    } as any;

    setTimeout(() => {
      setMessages(prev => [...prev, newMessage]);
    }, 1000);
  };

  return (
    <div style={{ 
      padding: '20px', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", sans-serif'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#232f3e' }}>Pure Cloudscape Chat Test</h1>
      <p style={{ marginBottom: '20px', color: '#687078' }}>
        Testing the chat component with zero Material UI dependencies - only Cloudscape components and native HTML/CSS.
      </p>
      
      <div style={{ 
        flex: 1, 
        border: '1px solid #e9ebed', 
        borderRadius: '8px', 
        overflow: 'hidden',
        backgroundColor: '#ffffff'
      }}>
        <CatalogChatBoxCloudscape
          onInputChange={setUserInput}
          userInput={userInput}
          messages={messages}
          setMessages={setMessages}
          onSendMessage={handleSendMessage}
        />
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#687078' }}>
        <h3>What to test:</h3>
        <ul>
          <li>Table should have pure Cloudscape styling with no Material UI interference</li>
          <li>Clean typography matching AWS design system</li>
          <li>No style conflicts or overrides</li>
          <li>All interactive elements use Cloudscape components</li>
        </ul>
      </div>
    </div>
  );
}