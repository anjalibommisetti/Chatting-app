// ==============================================================================
// VibeConnect — Join Group via Code Screen / Modal
// ==============================================================================

import React, { useState } from 'react';
import { KeyRound, X, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { store } from '../../services/store';

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter a group invitation code.');
      return;
    }

    try {
      const group = store.joinGroupByCode(code);
      onGroupJoined(group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to join group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold font-heading mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Join Private Group</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the invitation code shared by the group admin
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Invitation Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. VIBE-779"
              maxLength={15}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:border-purple-500 transition-colors uppercase text-center"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Groups with 5 members will automatically reject new invites.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
          >
            <span>Join Group</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
