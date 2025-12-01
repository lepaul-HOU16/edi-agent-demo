/**
 * ThinkingMessageComponent - Unified thinking indicator
 * Now uses the new purple gradient style for all waiting states
 */

import React from 'react';
import { Theme } from '@mui/material/styles';
import { Message } from '@/utils/types';
import ThinkingIndicator from '../ThinkingIndicator';

interface ThinkingComponentProps {
    message: Message;
    theme: Theme;
}

const ThinkingMessageComponent: React.FC<ThinkingComponentProps> = ({ message, theme }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            overflowY: 'auto'
        }}>
            <ThinkingIndicator />
        </div>
    );
};

export default ThinkingMessageComponent;
