import React, { useState, useEffect } from 'react';
import { Phone, Search, UserCheck, X, Send, AlertCircle, CheckCircle2, Copy, Check, Loader2 } from 'lucide-react';
import { store } from '../../services/store';

export default function NewChatByPhoneModal({ isOpen, onClose, onChatCreated }) {
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

  useEffect(() => {
    if (cleanPhone.length < 10) {
      setMatchedUser(null);
      return;
    }

    const localUser = store.findUserByPhone(cleanPhone);
    if (localUser) {
      setMatchedUser(localUser);
      return;
    }

    // Search online in Supabase
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
  }, [cleanPhone]);

  if (!isOpen) return null;

  const isSelf = matchedUser && matchedUser.id === store.currentUser?.id;

  const handleSendRequest = async () => {
    setError('');
    setSuccess('');

    try {
      const res = await store.sendChatRequest(cleanPhone);
      if (res.status === 'already_connected') {
        setSuccess('You are already connected with this user! Opening chat...');
        setTimeout(() => {
          onChatCreated(res.conversation.id);
          onClose();
        }, 1000);
      } else {
        setSuccess(`Chat request sent to ${res.targetUser.nickname}! When they accept, your chat will open.`);
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2500);
      }
    } catch (err) {
      setError(err.message || 'Failed to send request.');
    }
  };

  const handleCopyLink = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chatting-app-tan.vercel.app';
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
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
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold font-heading mb-3 shadow-inner">
            <Phone className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Find by Mobile Number</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your friend's mobile number to send them a chat request
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
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

        {/* Current user identifier banner */}
        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">You are logged in as:</span>
            <span className="text-white font-bold text-xs">
              {store.currentUser?.nickname}{' '}
              <span className="text-purple-300 font-mono">({store.currentUser?.phone})</span>
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              store.logOut();
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Switch Number
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Friend's Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 9876543211 or your friend's 10-digit number"
                maxLength={12}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Tip: You can test sample numbers: <strong className="text-purple-300">9876543211</strong> (Priya), <strong className="text-purple-300">9876543212</strong> (Alex)
            </span>
          </div>

          {/* Real-time Match Result */}
          {cleanPhone.length >= 10 && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 animate-fadeIn">
              {isSearching ? (
                <div className="flex items-center justify-center py-3 text-xs text-purple-300 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching database for {cleanPhone}...</span>
                </div>
              ) : matchedUser ? (
                isSelf ? (
                  <p className="text-xs text-amber-300">This is your own mobile number.</p>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
                        {matchedUser.avatar}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-white">{matchedUser.nickname}</span>
                        <span className="text-xs text-slate-400">Mobile: {matchedUser.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSendRequest}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Request</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-2 space-y-3">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">
                      No user found with number <strong className="text-purple-300">{cleanPhone}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ask your friend to open VibeConnect in their browser and register with this number!
                    </p>
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied! Send it to your friend' : 'Copy VibeConnect Link to Share'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
