"use client"
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

import { useAuth } from '@/contexts/OidcAuthContext';

import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/api';
const TopNavBar: React.FC = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { isAuthenticated, user, logout } = useAuth();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateNewChat = async () => {
    try {
      // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
      const amplifyClient = generateClient<Schema>();

      amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" })

      const newChatSession = await amplifyClient.models.ChatSession.create({});
      router.push(`/chat/${newChatSession.data!.id}`);
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("Failed to create chat session.");
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref>
            <Button color="inherit">Home</Button>
          </Link>
          <Link href="/projects" passHref>
            <Button color="inherit">Projects</Button>
          </Link>
          <Link href="/schemas" passHref>
            <Button color="inherit">Schemas</Button>
          </Link>
          <Link href="/legal-tags" passHref>
            <Button color="inherit">Legal Tags</Button>
          </Link>
          <Link href="/entitlements" passHref>
            <Button color="inherit">Entitlements</Button>
          </Link>
          {process.env.NODE_ENV === 'development' && (
            <>
              <Link href="/test-schemas" passHref>
                <Button color="inherit">Test</Button>
              </Link>
              <Link href="/auth-debug" passHref>
                <Button color="inherit">Auth Debug</Button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link href="/listChats" passHref>
                <Button color="inherit">List Chats</Button>
              </Link>
              <Button color="inherit" onClick={handleCreateNewChat}>Create</Button>
            </>
          )}
        </Typography>
        <div>
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {user?.email && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="inherit">
                      {user.email}
                    </Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={logout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => router.push('/auth')}
            >
              Login
            </Button>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
