import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MoodProvider } from './contexts/MoodContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { UIProvider } from './contexts/UIContext';
import AtmosphericBackground from './components/AtmosphericBackground';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PlayerDeck from './components/PlayerDeck';
import JournalDrawer from './components/JournalDrawer';
import Discover from './pages/Discover';
import Timeline from './pages/Timeline';
import Analytics from './pages/Analytics';
import Playlists from './pages/Playlists';
import AuthPage from './pages/AuthPage';

function Shell() {
  const { isAuthed } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAuthed) return <AuthPage />;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden">
      <AtmosphericBackground />
      <Header onSearch={setSearchQuery} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8 pb-32 z-10">
          <Routes>
            <Route path="/" element={<Discover searchQuery={searchQuery} />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <PlayerDeck />
      <JournalDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MoodProvider>
        <UIProvider>
          <PlayerProvider>
            <Shell />
          </PlayerProvider>
        </UIProvider>
      </MoodProvider>
    </AuthProvider>
  );
}
