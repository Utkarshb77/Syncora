import React, { createContext, useContext, useState, useCallback } from 'react';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [journalOpen, setJournalOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);

  const openAddToPlaylist = useCallback((track) => {
    if (track) setPlaylistModalTrack(track);
  }, []);

  const closeAddToPlaylist = useCallback(() => {
    setPlaylistModalTrack(null);
  }, []);

  return (
    <UIContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        journalOpen,
        setJournalOpen,
        notify,
        openAddToPlaylist,
        closeAddToPlaylist,
      }}
    >
      {children}

      {/* Global Add to Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          onClose={closeAddToPlaylist}
        />
      )}

      {/* Toast stack */}
      <div className="fixed bottom-28 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="glass px-4 py-3 rounded-xl shadow-2xl text-sm text-slate-100 border border-white/10 pointer-events-auto animate-slideIn"
            style={{ animation: 'slideIn 0.25s ease-out' }}
          >
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </UIContext.Provider>
  );
}
