// ==============================================================================
// VibeConnect — Mobile Number Login & Registration Modal
// ==============================================================================

import React, { useState } from 'react';
import { Phone, User, Smile, ArrowRight, X, AlertCircle, Sparkles } from 'lucide-react';
import { store } from '../../services/store';

const AVATAR_OPTIONS = ['🦊', '🌸', '⚡', '🚀', '🐼', '🌟', '🦁', '🔥', '🦋', '🍀', '☕', '🐱'];

export default function LoginModal({ isOpen, onClose }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    try {
      await store.loginWithPhone({
        phone: cleanPhone,
        name: name.trim(),
        avatar
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white text-2xl font-bold font-heading mb-3 shadow-lg shadow-purple-600/30">
            V
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Sign In with Mobile</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your phone number and name to start</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                {avatar}
              </div>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base cursor-pointer transition-transform ${
                      avatar === item ? 'bg-purple-600 scale-110 shadow-sm' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Your Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={12}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anju"
                maxLength={30}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter VibeConnect</span>
          </button>
        </form>
      </div>
    </div>
  );
}
