import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Menu, Music2, Loader2, User } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useMood } from '../contexts/MoodContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function SearchDropdown({ suggestions, loading, onSelect, visible }) {
  if (!visible) return null;
  return (
    <div
      className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl"
      style={{ background: 'rgba(12,14,24,0.97)', backdropFilter: 'blur(24px)' }}
    >
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 text-slate-500 text-sm">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Searching…</span>
        </div>
      )}
      {!loading && suggestions.length === 0 && (
        <div className="px-4 py-3 text-slate-500 text-sm">No results</div>
      )}
      {!loading && suggestions.map((s) => (
        <button
          key={s.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
        >
          {s.artwork ? (
            <img src={s.artwork} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <Music2 className="w-4 h-4 text-slate-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100 truncate group-hover:text-white">{s.title}</div>
            <div className="text-xs text-slate-500 truncate">{s.artist}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function Header({ onSearch }) {
  const { sidebarOpen, setSidebarOpen } = useUI();
  const { currentMood, setCurrentMood, MOOD_THEMES, theme } = useMood();
  const { user, logout } = useAuth();
  const { playTrack, setQueue } = usePlayer();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const profileRef = useRef(null);
  const nav = useNavigate();

  // Debounced suggestion fetch
  const fetchSuggestions = useCallback((val) => {
    clearTimeout(debounceRef.current);
    if (!val || val.length < 2) { setSuggestions([]); return; }
    setSugLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { results } = await api.searchSuggestions(val);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSugLoading(false);
      }
    }, 280);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);
    fetchSuggestions(val);
    setDropdownOpen(true);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setDropdownOpen(false);
    nav('/');
    onSearch?.(q.trim());
  };

  const handleSuggestionSelect = (track) => {
    setQ(`${track.title} ${track.artist}`);
    setDropdownOpen(false);
    // Play immediately and trigger full search
    playTrack(track);
    onSearch?.(`${track.title} ${track.artist}`);
    nav('/');
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5">
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search with dropdown */}
        <form onSubmit={submit} className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
          <input
            ref={inputRef}
            value={q}
            onChange={handleChange}
            onFocus={() => { if (q.length >= 2) setDropdownOpen(true); }}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            placeholder="Search songs, artists, albums…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus:border-white/20 outline-none text-sm placeholder:text-slate-500"
          />
          <SearchDropdown
            suggestions={suggestions}
            loading={sugLoading}
            onSelect={handleSuggestionSelect}
            visible={dropdownOpen && (sugLoading || suggestions.length > 0)}
          />
        </form>

        {/* Mood pills */}
        <div className="hidden md:flex items-center gap-1.5 ml-auto">
          {Object.keys(MOOD_THEMES).map(m => (
            <button key={m} onClick={() => setCurrentMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                currentMood === m
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={currentMood === m ? { background: MOOD_THEMES[m].hex } : {}}>
              {m}
            </button>
          ))}
        </div>

        {/* Profile avatar */}
        <div className="relative ml-2" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95 border-2 border-white/10"
            style={{ background: `linear-gradient(135deg, ${theme.hex}, #ec4899)` }}
            title={user?.email || 'Profile'}
          >
            {user?.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 overflow-hidden shadow-2xl z-50"
              style={{ background: 'rgba(12,14,24,0.97)', backdropFilter: 'blur(24px)' }}
            >
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-xs text-slate-500 mb-0.5">Signed in as</div>
                <div className="text-sm font-medium text-slate-100 truncate">{user?.email}</div>
                {user?.displayName && (
                  <div className="text-xs text-slate-400 truncate mt-0.5">{user.displayName}</div>
                )}
              </div>
              <div className="p-2">
                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`h-0.5 bg-gradient-to-r ${theme.gradient}`} />
    </header>
  );
}
