import React, { useState } from 'react';
import { Sparkles, RefreshCw, Download, CheckCircle, X } from 'lucide-react';

export default function OTAUpdateModal({ isOpen, newVersion, onApplyUpdate, onClose }) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

  const handleUpdateClick = async () => {
    setUpdating(true);
    await onApplyUpdate();
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#0f1424] border border-purple-500/30 p-6 text-white shadow-2xl shadow-purple-500/20 text-center relative overflow-hidden animate-scale-up">
        {/* Decorative Top Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-600/30 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/40 mb-3.5">
          <Sparkles className="w-7 h-7 text-white animate-pulse" />
        </div>

        <h3 className="font-heading font-extrabold text-lg tracking-tight">
          Over-The-Air Update Ready!
        </h3>
        <p className="text-xs text-purple-200 mt-1">
          Version <span className="font-bold text-white bg-purple-500/30 px-2 py-0.5 rounded-full border border-purple-400/30">{newVersion || '1.0.5'}</span> is ready to sync.
        </p>

        {/* Highlights */}
        <div className="my-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Right-aligned WhatsApp-style chat bubbles</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Hardware & gesture back button support</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Full-screen messaging (bottom nav auto-hidden)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Applying OTA Update...' : '⚡ Apply Instant Update (OTA)'}</span>
          </button>

          <a
            href="https://chatting-app-tan.vercel.app/VibeChat.apk"
            download="VibeChat.apk"
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors block"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Standalone APK</span>
          </a>
        </div>
      </div>
    </div>
  );
}
