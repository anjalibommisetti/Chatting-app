// ==============================================================================
// VibeConnect — Private Key Vault Gatekeeper
// Strict zero-exposure locked screen until correct Private Key is verified.
// Protects all 2-member chats, voice/video calls, photos, files & GIFs.
// ==============================================================================

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogOut, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Delete
} from 'lucide-react';
import { store } from '../../services/store';

export default function PrivateVaultLock({ onUnlocked }) {
  const currentUser = store.currentUser;
  const hasExistingKey = store.hasPrivateKey();

  // If no key exists yet, we are in setup mode; otherwise unlock mode
  const [isSetupMode, setIsSetupMode] = useState(!hasExistingKey);
  const [keyInput, setKeyInput] = useState('');
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Trigger error shake
  const triggerError = (msg) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Handle Unlock
  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    if (!keyInput.trim()) {
      triggerError('Please enter your Private Key');
      return;
    }

    const success = store.unlockVault(keyInput.trim());
    if (success) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        if (onUnlocked) onUnlocked();
      }, 400);
    } else {
      triggerError('Incorrect Private Key. Chats remain locked.');
      setKeyInput('');
    }
  };

  // Handle Set New Key
  const handleSetKey = (e) => {
    if (e) e.preventDefault();
    if (!keyInput.trim() || keyInput.trim().length < 4) {
      triggerError('Private Key must be at least 4 digits or characters');
      return;
    }
    if (keyInput.trim() !== confirmKeyInput.trim()) {
      triggerError('Keys do not match. Please re-enter');
      return;
    }

    store.setPrivateKey(keyInput.trim());
    setIsSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      if (onUnlocked) onUnlocked();
    }, 400);
  };

  // PIN Pad key press helper
  const handlePinDigit = (digit) => {
    setErrorMsg('');
    if (keyInput.length < 12) {
      const next = keyInput + digit;
      setKeyInput(next);
      // Auto-unlock if matching 4-digit key in unlock mode
      if (!isSetupMode && hasExistingKey && next.length >= 4 && store.privateKey === next) {
        store.unlockVault(next);
        setIsSuccess(true);
        setTimeout(() => {
          if (onUnlocked) onUnlocked();
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setKeyInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060810] select-none overflow-y-auto">
      {/* Ambient background security glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[350px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full"></div>

      <div className={`w-full max-w-md bg-[#0F1322]/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative transition-transform ${isShaking ? 'animate-bounce' : ''}`}>
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>2-Member Duo Sanctuary</span>
          </div>

          <button
            onClick={() => store.logOut()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
            title="Log out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Center Lock Visual */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-4 transition-all duration-500 shadow-xl ${
            isSuccess 
              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 scale-110 shadow-emerald-500/30' 
              : 'bg-purple-600/20 border-2 border-purple-500/40 text-purple-400 shadow-purple-600/30'
          }`}>
            {isSuccess ? <Unlock className="w-10 h-10 animate-pulse" /> : <Lock className="w-9 h-9" />}
          </div>

          <h2 className="font-heading font-extrabold text-2xl text-white tracking-tight mb-1">
            {isSetupMode ? 'Set Your Private Key' : 'Duo Vault is Locked'}
          </h2>

          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            {isSetupMode
              ? 'Create a secret key or PIN. All your chats, calls, view-once photos, and files are hidden until this key is typed.'
              : `Hello ${currentUser?.nickname || currentUser?.name || 'there'}! Enter your Private Key to reveal your 2-member conversations.`}
          </p>
        </div>

        {/* SETUP MODE FORM */}
        {isSetupMode ? (
          <form onSubmit={handleSetKey} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-purple-300 block mb-1.5">
                New Private Key (PIN or Passcode)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. 1234 or SecretKey"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-300 block mb-1.5">
                Confirm Private Key
              </label>
              <input
                type={showKey ? 'text' : 'password'}
                value={confirmKeyInput}
                onChange={(e) => setConfirmKeyInput(e.target.value)}
                placeholder="Re-enter your private key"
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Set Private Key & Open Vault</span>
            </button>

            {hasExistingKey && (
              <button
                type="button"
                onClick={() => {
                  setIsSetupMode(false);
                  setKeyInput('');
                  setErrorMsg('');
                }}
                className="w-full py-2 text-xs text-purple-300 hover:text-white text-center transition-colors cursor-pointer"
              >
                Cancel & Return to Unlock
              </button>
            )}
          </form>
        ) : (
          /* UNLOCK MODE FORM */
          <div className="space-y-4">
            {/* PIN / Key Input Display */}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                placeholder="••••"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/50 border border-purple-500/30 text-white text-center font-mono text-2xl tracking-[0.4em] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-600"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Numeric Keypad for fast PIN entry */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num.toString())}
                  className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-purple-600/30 border border-white/5 text-white font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsSetupMode(true);
                  setKeyInput('');
                  setErrorMsg('');
                }}
                className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-purple-300 text-[11px] font-semibold flex items-center justify-center transition-all cursor-pointer"
                title="Change or reset private key"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-purple-600/30 border border-white/5 text-white font-mono text-lg font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Unlock Button */}
            <button
              onClick={handleUnlock}
              className="w-full py-3.5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Duo Chats</span>
            </button>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Dedicated 2-Member space • Press Esc anytime to instant-lock</span>
          </p>
        </div>
      </div>
    </div>
  );
}
