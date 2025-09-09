import React from 'react';
import { Theme } from '@mui/material/styles';
import { Typography, CircularProgress } from '@mui/material';
import { Message } from '../../../utils/types';
import LoadingBar from '@cloudscape-design/chat-components/loading-bar';


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
            <div style={{
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
                padding: theme.spacing(0.75),
                borderRadius: theme.shape.borderRadius,
                opacity: 0.8,
            }}>
                <LoadingBar variant="gen-ai-masked" />
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1), marginBottom: theme.spacing(0.5), marginTop: '20px', }}>
                    <Typography variant="body2" color="text.secondary">
                        Thinking:
                    </Typography>
                </div>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {typeof message.content === 'string' 
                        ? message.content 
                        : Array.isArray(message.content) 
                            ? message.content.join(' ') 
                            : message.content?.text || ''
                    }
                </Typography>
            </div>
        </div>
    );
};

export default ThinkingMessageComponent;
