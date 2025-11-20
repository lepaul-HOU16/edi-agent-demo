import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import CatalogPage from './pages/CatalogPage';
import CreateNewChatPage from './pages/CreateNewChatPage';
import ListChatsPage from './pages/ListChatsPage';
import PreviewPage from './pages/PreviewPage';
import CanvasesPage from './pages/CanvasesPage';
import ProjectsPage from './pages/ProjectsPage';
import SignInPage from './pages/SignInPage';
import ReinventDemoPage from './pages/ReinventDemoPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Public route - sign-in page */}
        <Route path="/sign-in" element={<SignInPage />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/chat/:chatSessionId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
        <Route path="/collections/:collectionId" element={<ProtectedRoute><CollectionDetailPage /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
        <Route path="/canvases" element={<ProtectedRoute><CanvasesPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/create-new-chat" element={<ProtectedRoute><CreateNewChatPage /></ProtectedRoute>} />
        <Route path="/listChats" element={<ProtectedRoute><ListChatsPage /></ProtectedRoute>} />
        <Route path="/preview/*" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
        
        {/* Hidden route for re:Invent demo materials */}
        <Route path="/reinvent-demo" element={<ProtectedRoute><ReinventDemoPage /></ProtectedRoute>} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
