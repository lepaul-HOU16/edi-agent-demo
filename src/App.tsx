import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';

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
function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/:chatSessionId" element={<ChatPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:collectionId" element={<CollectionDetailPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/canvases" element={<CanvasesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/create-new-chat" element={<CreateNewChatPage />} />
        <Route path="/listChats" element={<ListChatsPage />} />
        <Route path="/preview/*" element={<PreviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
