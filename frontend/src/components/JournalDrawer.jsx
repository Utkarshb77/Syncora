import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Lock, Trash2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useMood } from '../contexts/MoodContext';
import { api } from '../utils/api';
import { localCrypto } from '../utils/crypto';

function DecryptModal({ entry, onSuccess, onClose }) {
  const [pw, setPw]       = useState('');
  const [show, setShow]   = useState(false);
  const [error, setError] = useState(null);
  const inputRef          = useRef(null);

  useEffect(() => {
    // Auto-focus the password input when modal opens
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const attempt = () => {
  if (!pw.trim()) { setError('Please enter your password.'); return; }
  const plain = localCrypto.decrypt(entry.encryptedContent, pw);
  if (plain === null) {
    setError('Incorrect password. Please try again.');
    setPw('');
    setTimeout(() => inputRef.current?.focus(), 50);
    return;
  }
  onSuccess(plain);
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: 'rgba(12,14,24,0.98)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Decrypt entry</div>
            <div className="text-xs text-slate-500 truncate max-w-[220px]">{entry.title}</div>
          </div>
          <button onClick={onClose}
            className="ml-auto w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter the password you used when saving this entry to reveal its contents.
          </p>

          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              placeholder="Encryption password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(null); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none border transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
              }}
            />
            <button onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={attempt}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
              Decrypt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JournalDrawer() {
  const { journalOpen, setJournalOpen, notify } = useUI();
  const { isAuthed } = useAuth();
  const { currentMood } = useMood();
  const [entries, setEntries]         = useState([]);
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [password, setPassword]       = useState('');
  const [reveal, setReveal]           = useState({});    // id → decrypted text
  const [decryptTarget, setDecryptTarget] = useState(null); // entry awaiting modal

  useEffect(() => {
    if (!journalOpen || !isAuthed) return;
    api.listNotes().then(setEntries).catch(() => {});
  }, [journalOpen, isAuthed]);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!isAuthed) { notify('Please log in to save journal entries'); return; }
    if (!title.trim() || !content.trim()) return;
    if (!password.trim()) { notify('Set a password to encrypt'); return; }
    setSaving(true);
    try {
      const encrypted = localCrypto.encrypt(content, password);
      const n = await api.createNote({ title, mood: currentMood, encryptedContent: encrypted, isEncrypted: true, tags: [] });
      setEntries([n, ...entries]);
      setTitle(''); setContent(''); setPassword('');
      notify('Note saved');
    } catch (e) {
      notify(e.message || 'Could not save entry — try again');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteNote(id);
      setEntries(entries.filter(e => (e._id || e.id) !== id));
      notify('Entry deleted');
    } catch (e) {
      notify(e.message || 'Could not delete entry');
    }
  };

  const handleDecryptSuccess = (plain) => {
    const id = decryptTarget._id || decryptTarget.id;
    setReveal(prev => ({ ...prev, [id]: plain }));
    setDecryptTarget(null);
    notify('Entry decrypted');
  };

  const handleHide = (id) => {
    setReveal(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <>
      {/* Decrypt password modal */}
      {decryptTarget && (
        <DecryptModal
          entry={decryptTarget}
          onSuccess={handleDecryptSuccess}
          onClose={() => setDecryptTarget(null)}
        />
      )}

      <div className={`fixed inset-y-0 right-0 w-[420px] max-w-full glass border-l border-white/5 z-40 transform transition-transform ${journalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-lg">Encrypted Journal</h3>
          <button onClick={() => setJournalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 border-b border-white/5">
          <input type="password" placeholder="Encryption password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 outline-none text-sm" />
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 outline-none text-sm" />
          <textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)}
            rows={3} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/5 outline-none text-sm resize-none" />
          <button onClick={save} disabled={saving} className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-pink-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus className="w-4 h-4" />{saving ? 'Saving…' : 'Save encrypted entry'}
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {entries.length === 0 && <div className="text-sm text-slate-500">No entries yet.</div>}
          {entries.map(e => {
            const id = e._id || e.id;
            const isRevealed = !!reveal[id];
            return (
              <div key={id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{e.title}</div>
                  <button onClick={() => remove(id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()} · {e.mood}</div>

                {isRevealed ? (
                  <>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap bg-white/3 rounded-lg p-2.5 border border-white/5 overflow-y-auto" style={{ maxHeight: '250px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {reveal[id]}
                    </div>
                    {/* Hide button after revealing */}
                    <button onClick={() => handleHide(id)}
                      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                      <EyeOff className="w-3 h-3" /> Hide
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDecryptTarget(e)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                    <Lock className="w-3 h-3" /> Decrypt
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}