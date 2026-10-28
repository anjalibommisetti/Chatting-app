// ==============================================================================
// VibeChat — PhonePe-Style Phone Number Lookup & Instant Chat/Call Launcher
// Entering a mobile number instantly reveals the registered person's name!
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Search, 
  UserCheck, 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Loader2,
  Video,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { store } from '../../services/store';

export default function NewChatByPhoneModal({ isOpen, onClose, onChatCreated, onStartCall }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  useEffect(() => {
    if (!isOpen) {
      setPhoneNumber('');
      setError('');
      setSuccess('');
      setMatchedUser(null);
      return;
    }
  }, [isOpen]);

  // Live PhonePe-style Lookup
  useEffect(() => {
    if (cleanPhone.length < 5) {
      setMatchedUser(null);
      setIsSearching(false);
      return;
    }

    // Instant local cache check
    const localUser = store.findUserByPhone(cleanPhone);
    if (localUser) {
      setMatchedUser(localUser);
      setIsSearching(false);
      return;
    }

    // If 10 digits, search online database
    if (cleanPhone.length >= 10) {
      let isCancelled = false;
      setIsSearching(true);
      store.searchUserByPhoneOnline(cleanPhone).then((cloudUser) => {
        if (!isCancelled) {
          setMatchedUser(cloudUser);
          setIsSearching(false);
        }
      }).catch(() => {
        if (!isCancelled) setIsSearching(false);
      });

      return () => {
        isCancelled = true;
      };
    } else {
      setMatchedUser(null);
      setIsSearching(false);
    }
  }, [cleanPhone]);

  if (!isOpen) return null;

  const isSelf = matchedUser && matchedUser.id === store.currentUser?.id;

  const handleStartChat = async (targetUser = matchedUser) => {
    if (!targetUser) return;
    setError('');
    setSuccess('');

    try {
      const conv = await store.getDirectConversation(targetUser.id);
      if (conv) {
        setSuccess(`Opening conversation with ${targetUser.name || targetUser.nickname}...`);
        setTimeout(() => {
          onChatCreated(conv.id);
          onClose();
        }, 300);
      }
    } catch (err) {
      setError(err.message || 'Failed to start chat.');
    }
  };

  const handleStartCallAction = (type, targetUser = matchedUser) => {
    if (!targetUser || !onStartCall) return;
    onClose();
    onStartCall({
      type,
      isGroup: false,
      targetId: targetUser.id,
      targetName: targetUser.name || targetUser.nickname,
      targetAvatar: targetUser.avatar || '👤',
      participants: [targetUser.id]
    });
  };

  const handleCopyLink = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chatting-app-tan.vercel.app';
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Other available registered users (excluding current user)
  const registeredContacts = (store.users || []).filter(u => u.id !== store.currentUser?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#111726] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center text-xl font-bold font-heading mb-3 shadow-lg shadow-purple-600/30">
            <Phone className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Find Contact by Mobile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Type any mobile number — like PhonePe, the registered name appears instantly!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* PhonePe-Style Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Enter 10-Digit Mobile Number
            </label>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-purple-500 transition-colors">
              <span className="text-sm font-semibold text-purple-300 font-mono flex items-center gap-1 border-r border-white/10 pr-2.5">
                <span>🇮🇳</span>
                <span>+91</span>
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 9390064784 or 9876543210"
                maxLength={10}
                className="w-full bg-transparent text-white placeholder-slate-500 text-base font-mono tracking-wider focus:outline-none"
                autoFocus
              />
              {cleanPhone && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneNumber('');
                    setMatchedUser(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Test with: <strong className="text-purple-300 cursor-pointer" onClick={() => setPhoneNumber('9876543210')}>9876543210</strong> (Anjali) or <strong className="text-purple-300 cursor-pointer" onClick={() => setPhoneNumber('9876543211')}>9876543211</strong> (Partner)
            </span>
          </div>

          {/* REAL-TIME PHONEPE MATCH CARD */}
          {cleanPhone.length >= 5 && (
            <div className="animate-fadeIn">
              {isSearching ? (
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center text-xs text-purple-300 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Looking up registered name for +91 {cleanPhone}...</span>
                </div>
              ) : matchedUser ? (
                isSelf ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    This is your own mobile number ({matchedUser.name}).
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1c36] to-[#0f1424] border border-purple-500/40 shadow-xl">
                    {/* Verified Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Verified Contact (PhonePe Style)
                      </span>
                      <span className="text-xs text-purple-300 font-mono">
                        {matchedUser.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                      </span>
                    </div>

                    {/* Name & Phone */}
                    <div className="flex items-center gap-3.5 my-3">
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                        {matchedUser.avatar || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-extrabold text-white text-base truncate">
                          {matchedUser.name || matchedUser.nickname}
                        </h3>
                        <p className="text-xs text-purple-300 font-mono mt-0.5">
                          +91 {matchedUser.phone}
                        </p>
                        {matchedUser.bio && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {matchedUser.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Chat, Call, Video */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleStartChat(matchedUser)}
                        className="py-2.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/30 active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => handleStartCallAction('voice', matchedUser)}
                        className="py-2.5 px-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call</span>
                      </button>

                      <button
                        onClick={() => handleStartCallAction('video', matchedUser)}
                        className="py-2.5 px-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Video className="w-4 h-4" />
                        <span>Video</span>
                      </button>
                    </div>
                  </div>
                )
              ) : cleanPhone.length >= 10 ? (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-lg flex-shrink-0">
                      📱
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white">+91 {cleanPhone}</h4>
                      <p className="text-[11px] text-purple-300">New Contact</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const conv = await store.startChatWithPhoneNumber(cleanPhone);
                      if (conv) {
                        onChatCreated(conv.id);
                        onClose();
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/30 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Start Chat with +91 {cleanPhone}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied! Send it to your friend' : 'Copy App Link to Invite'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Quick List of Registered Contacts */}
          {registeredContacts.length > 0 && cleanPhone.length < 5 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Registered Contacts
              </span>
              <div className="space-y-2">
                {registeredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartChat(contact)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl flex-shrink-0">
                        {contact.avatar || '👤'}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-purple-300">
                          {contact.name || contact.nickname}
                        </div>
                        <div className="text-[11px] text-purple-300 font-mono">
                          +91 {contact.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCallAction('voice', contact);
                        }}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Voice Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCallAction('video', contact);
                        }}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
