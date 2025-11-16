import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

// useAuthenticator removed;
import { useUserAttributes } from '@/components/UserAttributesProvider';
import { createSession } from '@/lib/api/sessions';
import { Schema } from '@/types/api';

const TopNavBar: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const { signOut, authStatus } = useAuthenticator(context => [context.user, context.authStatus]);
  const { userAttributes } = useUserAttributes();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateNewChat = async () => {
    try {
      // Invoke the lightweight agent for initialization (replaced deprecated reActAgent)
      const newChatSession = await createSession({});
      navigate(`/chat/${newChatSession.id}`);
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("Failed to create chat session.");
    }
  };

  const handleCreatePetrophysicsChat = async () => {
    try {
      // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
      const newChatSession = await createSession({});
      
      if (newChatSession && newChatSession.id) {
        // Send an initial message with petrophysics keywords to trigger the petrophysics system message
        const initialMessage: Schema['ChatMessage']['createType'] = {
          role: 'human' as any,
          content: {
            text: "I need help with petrophysical analysis. Please show me the available tools and capabilities."
          } as any,
          chatSessionId: newChatSession.id,
        } as any;
        
        // Send the initial message
        await sendMessage({
          chatSessionId: newChatSession.id,
          newMessage: initialMessage,
        });
        
        // Navigate to the new chat session
        navigate(`/chat/${newChatSession.id}`);
      }
    } catch (error) {
      console.error("Error creating petrophysics chat session:", error);
      alert("Failed to create petrophysics chat session.");
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
          <Link href="/catalog" passHref>
            <Button color="inherit">Data Catalog</Button>
          </Link>
          {authStatus === 'authenticated' && (
            <>
              <Button color="inherit" onClick={handleCreateNewChat}>Workspace</Button>
              <Button color="inherit" onClick={handleCreatePetrophysicsChat}>Petrophysical Analysis</Button>
              <Link href="/canvases" passHref>
                <Button color="inherit">Canvases</Button>
              </Link>
              <Button color="inherit" onClick={handleCreateNewChat}>Create</Button>
            </>
          )}
        </Typography>
        <div>
          {authStatus === 'authenticated' ? (
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
                {userAttributes?.email && (
                  <MenuItem disabled>
                    <Typography variant="body2" color="inherit">
                      {userAttributes.email}
                    </Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={signOut}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => navigate('/auth')}
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
