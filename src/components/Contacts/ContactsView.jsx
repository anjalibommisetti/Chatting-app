// ==============================================================================
// VibeConnect — Professional Contacts & Friends Directory (Screen 9)
// Contact search, start conversation, custom personal nicknames, and direct call
// ==============================================================================

import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  UserPlus, 
  MessageSquare, 
  Phone, 
  Video, 
  Edit3, 
  Check, 
  X,
  Sparkles,
  PhoneCall,
  Mail
} from 'lucide-react';
import { store } from '../../services/store';

export default function ContactsView({ onOpenChat, onStartCall }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [customNicknameInput, setCustomNicknameInput] = useState('');
  const [feedback, setFeedback] = useState('');

  const currentUser = store.currentUser;
  const contacts = store.users.filter(u => u.id !== currentUser?.id);

  const filteredContacts = contacts.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const displayName = store.getDisplayName(f).toLowerCase();
    const username = (f.username || '').toLowerCase();
    const email = (f.email || '').toLowerCase();
    const phone = (f.phone || '').toLowerCase();
    return displayName.includes(q) || username.includes(q) || email.includes(q) || phone.includes(q);
  });

  const handleSaveNickname = (friendId) => {
    store.setFriendNickname(friendId, customNicknameInput);
    setEditingFriendId(null);
    setCustomNicknameInput('');
    setFeedback('Custom friend nickname saved!');
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleStartChat = async (targetUserId) => {
    const conv = await store.getDirectConversation(targetUserId);
    if (conv) {
      onOpenChat(conv.id);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] overflow-y-auto p-4 sm:p-8 select-none text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">Contacts & Friends</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Connect directly with registered members or set private personal nicknames
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, mobile number, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-purple-500 transition-colors shadow-xs"
          />
        </div>

        {/* Contacts Grid */}
        <div className="space-y-3">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
              No contacts match your search query.
            </div>
          ) : (
            filteredContacts.map(contact => {
              const displayName = store.getDisplayName(contact);
              const isEditing = editingFriendId === contact.id;

              return (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                        {contact.avatar || '👤'}
                      </div>
                      {contact.status === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]"></span>
                      )}
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        {displayName}
                        {contact.nickname && contact.nickname !== contact.name && (
                          <span className="text-[10px] text-purple-400 font-normal">
                            ({contact.name})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {contact.phone ? `📱 ${contact.phone}` : `@${contact.username}`}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] italic truncate max-w-xs mt-0.5">
                        "{contact.bio || 'Using VibeConnect'}"
                      </span>
                    </div>
                  </div>

                  {/* Actions & Nickname Form */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <input
                          type="text"
                          value={customNicknameInput}
                          onChange={(e) => setCustomNicknameInput(e.target.value)}
                          placeholder="Private nickname..."
                          className="px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-purple-500 w-36"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNickname(contact.id)}
                          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                          title="Save Nickname"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFriendId(null)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingFriendId(contact.id);
                            setCustomNicknameInput(store.friendNicknames[contact.id] || '');
                          }}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          title="Set Custom Nickname"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onStartCall({
                            type: 'voice',
                            isGroup: false,
                            targetId: contact.id,
                            targetName: displayName,
                            targetAvatar: contact.avatar,
                            participants: [contact.id]
                          })}
                          className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 hover:text-white transition-colors cursor-pointer"
                          title="Start Voice Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onStartCall({
                            type: 'video',
                            isGroup: false,
                            targetId: contact.id,
                            targetName: displayName,
                            targetAvatar: contact.avatar,
                            participants: [contact.id]
                          })}
                          className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                          title="Start Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStartChat(contact.id)}
                          className="px-4 py-2 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
