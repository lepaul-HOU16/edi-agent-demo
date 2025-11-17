import React, { useEffect, useState } from 'react';

import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Cards from '@cloudscape-design/components/cards';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Header from '@cloudscape-design/components/header';
import { withAuth } from '@/components/WithAuth';
import { listSessions, deleteSession } from '@/lib/api/sessions';
import { cognitoAuth } from '@/lib/auth/cognitoAuth';

const Page = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userInfo = await cognitoAuth.getUserInfo();
                setUser(userInfo);
            } catch (error) {
                console.error('Failed to load user info:', error);
                // User will remain null, triggering the loading state
                // This will be handled by the ProtectedRoute wrapper in future tasks
            }
        };
        loadUser();
    }, []);
    const [chatSessions, setChatSessions] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    // Function to fetch and refresh chat sessions
    const fetchChatSessions = async () => {
        const result = await listSessions(100);
        const sortedChatSessions = result.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Add default title for untitled chats
        const processedSessions = sortedChatSessions.map(session => {
            if (!session.name) {
                const date = new Date(session.createdAt);
                const formattedDate = date.toLocaleString();
                return { ...session, name: `Untitled - ${formattedDate}` };
            }
            return session;
        });

        setChatSessions(processedSessions);
        return processedSessions;
    };

    useEffect(() => {
        if (user) {
            fetchChatSessions();
        }
    }, [user]);

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected chat${selectedItems.length > 1 ? 's' : ''}?`)) {
            // Create a copy of the selected items to use after deletion
            const itemsToDelete = [...selectedItems];
            
            // Delete all selected items
            for (const item of itemsToDelete) {
                await deleteSession(item.id!);
            }
            
            // Refresh the chat sessions from the server
            await fetchChatSessions();
            setSelectedItems([]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === chatSessions.length) {
            // If all are selected, deselect all
            setSelectedItems([]);
        } else {
            // Otherwise, select all
            setSelectedItems([...chatSessions]);
        }
    };

    // Define card definition for Cloudscape Cards component
    const cardDefinition = {
        header: (item: any) => (
            <Box fontSize="heading-m" fontWeight="bold">
                <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {item.name}
                </div>
            </Box>
        ),
        sections: [
            {
                id: "description",
                content: (item: any) => (
                    <Box>
                        <div style={{
                            maxHeight: '4.5em', /* Approximately 3 lines of text */
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.5em', /* Consistent line height for better control */
                            marginBottom: '16px',
                            height: '150px',
                        }}>
                            {/* Use a default message if no description is available */}
                            {item.name ? `Chat session: ${item.name}` : "No description available."}
                        </div>
                    </Box>
                )
            },
            {
                id: "actions",
                content: (item: any) => (
                    <Box>
                        <div style={{
                            position: 'absolute',
                            bottom: '16px',
                            left: '16px',
                            right: '16px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    iconName="remove"
                                    variant="inline-link"
                                    onClick={async () => {
                                        if (window.confirm(`Are you sure you want to delete the chat "${item.name}"?`)) {
                                            await deleteSession(item.id!);
                                            
                                            // Refresh the chat sessions from the server
                                            await fetchChatSessions();
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                                <Button
                                    href={`/chat/${item.id}`}
                                    variant="primary"
                                >
                                    Open Chat
                                </Button>
                            </div>
                        </div>
                    </Box>
                )
            }
        ]
    };

    if (!user) {
        return (
            <Box padding="m" textAlign="center">
                <SpaceBetween direction="vertical" size="m">
                    <Box variant="p">Loading user information...</Box>
                </SpaceBetween>
            </Box>
        );
    }

    return (
        <Box padding="m">
            <SpaceBetween direction="vertical" size="m">
                <Header
                    counter={
                        selectedItems?.length
                            ? "(" + selectedItems.length + "/" + chatSessions.length + ")"
                            : "(" + chatSessions.length + ")"
                    }
                >
                    Your Chat Sessions
                </Header>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                        onClick={handleSelectAll}
                        variant="normal"
                    >
                        {selectedItems.length === chatSessions.length && chatSessions.length > 0 ? 'Deselect All' : 'Select All'}
                    </Button>

                    {selectedItems.length > 0 && (
                        <Button
                            variant="primary"
                            iconName="remove"
                            onClick={handleDeleteSelected}
                        >
                            Delete Selected ({selectedItems.length})
                        </Button>
                    )}
                </div>
                <Cards
                    items={chatSessions}
                    cardDefinition={cardDefinition}
                    cardsPerRow={[
                        { cards: 1 },
                        { minWidth: 300, cards: 5 }
                    ]}
                    variant="container"
                    stickyHeader={true}
                    selectionType="multi"
                    selectedItems={selectedItems}
                    onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
                    className="fixed-height-cards"
                    empty={
                        <Box textAlign="center" color="inherit">
                            <Box padding={{ bottom: "s" }} variant="p" fontWeight="bold">
                                No chat sessions
                            </Box>
                            <Box variant="p" color="inherit">
                                Create a new chat to get started.
                            </Box>
                        </Box>
                    }
                />
            </SpaceBetween>
        </Box>
    );
}

export default withAuth(Page);
