// ==============================================================================
// VibeConnect — Individual & Group Chat Screen (Screen 4 & 6)
// ==============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Info, 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  CheckCheck, 
  Reply, 
  Edit3, 
  Trash2, 
  Users, 
  Sparkles,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { store } from '../../services/store';

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👍', '🎉', '😍', '👏', '🚀', '✨', '🤔', '😭', '💯'];

export default function ChatArea({ 
  conversationId, 
  onBack, 
  onStartCall, 
  onOpenInfo 
}) {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = store.currentUser;
  const conversation = store.conversations.find(c => c.id === conversationId);
  const messages = store.messages.filter(m => m.conversationId === conversationId);

  // Determine chat peer or group
  const isGroup = conversation?.type === 'group';
  const group = isGroup ? store.groups.find(g => g.id === conversation?.groupId) : null;
  const peerId = !isGroup ? conversation?.participantIds.find(id => id !== currentUser?.id) : null;
  const peer = !isGroup ? store.getUserById(peerId) : null;

  const title = isGroup ? (group?.name || 'Private Group') : store.getDisplayName(peer);
  const avatar = isGroup ? (group?.avatar || '👥') : (peer?.avatar || '👤');
  const statusSubtitle = isGroup 
    ? `${group?.members?.length || 0}/5 members (Strict Max 5)` 
    : (peer?.status === 'online' ? 'Active now' : `Last seen ${peer?.lastSeen || 'recently'}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (conversationId) {
      store.markConversationRead(conversationId);
    }
  }, [conversationId, messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#07090F] text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl mb-4 text-purple-400">
          💬
        </div>
        <h3 className="font-heading font-bold text-xl text-white mb-2">Select a Conversation</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Pick a friend from the left sidebar or start a new private group with up to 5 members.
        </p>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!inputText.trim() && !attachment) return;

    store.sendMessage({
      conversationId,
      text: inputText,
      attachment,
      replyToId: replyingTo?.id || null
    });

    setInputText('');
    setAttachment(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveEdit = (messageId) => {
    if (!editText.trim()) return;
    store.editMessage(messageId, editText);
    setEditingMessageId(null);
    setEditText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090F] relative overflow-hidden">
      {/* Chat Top App Bar */}
      <div className="h-18 px-4 sm:px-6 border-b border-white/5 bg-[#0B0E17]/80 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer" onClick={onOpenInfo}>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
              {avatar}
            </div>
            {!isGroup && peer?.status === 'online' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]"></span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex flex-col text-left cursor-pointer" onClick={onOpenInfo}>
            <span className="font-heading font-bold text-base text-white truncate flex items-center gap-1.5">
              {title}
              {isGroup && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  5 MAX
                </span>
              )}
            </span>
            <span className="text-xs text-slate-400 truncate flex items-center gap-1">
              {!isGroup && peer?.status === 'online' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
              {statusSubtitle}
            </span>
          </div>
        </div>

        {/* Action Buttons: Voice Call, Video Call, Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartCall({
              type: 'voice',
              isGroup,
              targetId: isGroup ? group.id : peerId,
              targetName: title,
              targetAvatar: avatar,
              participants: isGroup ? group.members : [peerId]
            })}
            className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Start Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStartCall({
              type: 'video',
              isGroup,
              targetId: isGroup ? group.id : peerId,
              targetName: title,
              targetAvatar: avatar,
              participants: isGroup ? group.members : [peerId]
            })}
            className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenInfo}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Conversation Details & Nickname"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Session Welcome Card */}
        <div className="max-w-md mx-auto my-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Private Session with {title}</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isGroup 
              ? 'This private group has a strict limit of 5 members for intimate, high-trust conversations.'
              : 'Direct messages and real-time voice/video calls are end-to-end between the two of you.'}
          </p>
        </div>

        {messages.map((msg) => {
          const isSelf = msg.senderId === currentUser?.id;
          const sender = store.getUserById(msg.senderId);
          const senderDisplayName = store.getDisplayName(sender);
          const isEditing = editingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} group relative`}
            >
              {/* Sender Name in Group Chat */}
              {isGroup && !isSelf && (
                <span className="text-[11px] font-semibold text-purple-300 ml-12 mb-1">
                  {senderDisplayName}
                </span>
              )}

              <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base flex-shrink-0 mb-1">
                  {sender?.avatar || '👤'}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  {/* Quoted / Replied message */}
                  {msg.replyTo && (
                    <div className="text-[11px] px-3 py-1.5 rounded-xl bg-white/5 border-l-2 border-purple-500 text-slate-400 truncate max-w-xs mb-1">
                      <span className="font-semibold text-slate-300">
                        {msg.replyTo.senderId === currentUser?.id ? 'You' : 'Friend'}:
                      </span>{' '}
                      {msg.replyTo.text || 'Attachment'}
                    </div>
                  )}

                  {/* Editing form or bubble */}
                  {isEditing ? (
                    <div className="p-3 rounded-2xl bg-[#151B2E] border border-purple-500/40 space-y-2 min-w-[240px]">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="px-2.5 py-1 rounded text-[11px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-2.5 py-1 rounded bg-purple-600 text-white text-[11px] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3.5 rounded-2xl text-sm relative shadow-md transition-all ${
                        isSelf
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-br-xs'
                          : 'bg-[#151B2E] border border-white/5 text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachment && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-xs">
                          {msg.attachment.type.startsWith('image/') ? (
                            <img
                              src={msg.attachment.dataUrl}
                              alt={msg.attachment.name}
                              className="w-full h-auto rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-95"
                              onClick={() => window.open(msg.attachment.dataUrl, '_blank')}
                            />
                          ) : (
                            <a
                              href={msg.attachment.dataUrl}
                              download={msg.attachment.name}
                              className="flex items-center gap-2 p-2.5 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                            >
                              <FileText className="w-5 h-5 text-purple-400" />
                              <span className="text-xs truncate">{msg.attachment.name}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}

                      {/* Meta: Timestamp, Edited badge, Read check */}
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isSelf ? 'text-purple-200/70' : 'text-slate-400'}`}>
                        {msg.isEdited && <span>(edited)</span>}
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isSelf && <CheckCheck className="w-3.5 h-3.5 text-purple-200" />}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => store.toggleReaction(msg.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                            userIds.includes(currentUser?.id)
                              ? 'bg-purple-600/30 border-purple-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-bold">{userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Message Action Menu */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#101422] p-1 rounded-xl border border-white/10 shadow-lg ${isSelf ? 'order-first' : 'order-last'}`}>
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {/* Reaction quick picker */}
                  <div className="flex items-center gap-0.5 px-1 border-x border-white/5">
                    {['❤️', '👍', '🔥'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => store.toggleReaction(msg.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {isSelf && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditText(msg.text || '');
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5"
                        title="Edit Message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => store.deleteMessage(msg.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#101422] border-t border-white/5 flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs truncate">
            <Reply className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-slate-400">Replying to</span>
            <span className="text-white font-semibold truncate max-w-xs">{replyingTo.text || 'Attachment'}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Bar */}
      {attachment && (
        <div className="px-4 py-2 bg-[#101422] border-t border-white/5 flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs">
            <Paperclip className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">{attachment.name}</span>
            <span className="text-[10px] text-slate-400">({(attachment.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Quick Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3 bg-[#101422] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Reactions & Emojis
          </span>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-[#0B0E17]/95 border-t border-white/5 flex items-center gap-2 relative z-20 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Attach Image or File"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Pick Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${title}...`}
            rows={1}
            maxLength={3000}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500/50 resize-none max-h-32 transition-colors"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() && !attachment}
          className="p-2.5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white transition-all shadow-md shadow-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          title="Send Message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
