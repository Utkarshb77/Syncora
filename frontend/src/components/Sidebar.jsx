import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Clock, BarChart3, Music, BookOpen, LogOut, Sparkles } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useMood } from '../contexts/MoodContext';

const links = [
  { to: '/', label: 'Discover', icon: Compass },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/playlists', label: 'Playlists', icon: Music },
];

export default function Sidebar() {
  const { sidebarOpen, setJournalOpen } = useUI();
  const { logout, user } = useAuth();
  const { theme } = useMood();

  return (
    <aside
      className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/5 z-10 shrink-0`}
      style={{ background: 'rgba(8,10,18,0.6)', backdropFilter: 'blur(24px)' }}
    >
      <div className="w-64 p-5 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.hex}, #ec4899)` }}
          >
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-shimmer">Syncora</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: `linear-gradient(135deg, ${theme.hex}22, rgba(236,72,153,0.12))`,
                borderLeft: `2px solid ${theme.hex}`,
                paddingLeft: '14px',
              } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <button
            onClick={() => setJournalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Journal
          </button>
        </nav>

        {/* Footer with user info + logout */}
        <div className="border-t border-white/5 pt-4 mt-4">
          {user && (
            <div className="px-3 py-3 mb-2 rounded-xl bg-white/3 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ background: `linear-gradient(135deg, ${theme.hex}, #ec4899)` }}
                >
                  {(user.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="min-w-0">
                  {user.displayName && (
                    <div className="text-xs font-medium text-slate-200 truncate">{user.displayName}</div>
                  )}
                  <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
