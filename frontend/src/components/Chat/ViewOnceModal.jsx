// ==============================================================================
// VibeConnect — View-Once Ephemeral Photo Lightbox
// Disappears and marks as Opened as soon as recipient closes or timer expires.
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, Clock } from 'lucide-react';

export default function ViewOnceModal({ isOpen, photoUrl, senderName, onClose }) {
  const [timeLeft, setTimeLeft] = useState(20); // 20-second viewing window

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(20);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Automatically close and mark opened
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn select-none">
      {/* Top Security Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-sm">
            ①
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              View-Once Photo
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Confidential
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Sent by {senderName || 'Partner'} • Auto-expires in {timeLeft}s
            </p>
          </div>
        </div>

        {/* Timer & Close button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-mono font-bold border border-white/15">
            <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>{timeLeft}s</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Close & Burn</span>
          </button>
        </div>
      </div>

      {/* Main Photo Center */}
      <div className="max-w-4xl max-h-[82vh] flex items-center justify-center relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <img
          src={photoUrl}
          alt="View Once Attachment"
          className="max-w-full max-h-[80vh] object-contain rounded-2xl pointer-events-none"
        />
      </div>

      {/* Bottom Security Notice */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-white/10 text-slate-300 text-xs shadow-xl">
        <ShieldAlert className="w-4 h-4 text-amber-400" />
        <span>This photo cannot be reopened or saved after closing.</span>
      </div>
    </div>
  );
}
