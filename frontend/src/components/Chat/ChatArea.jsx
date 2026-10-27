// ==============================================================================
// VibeConnect — Professional Chat Area (Screen 4 & 6)
// WhatsApp & Telegram Inspired Usability:
// Delivery ticks (Clock, Sent, Delivered, Read), Typing Indicators, Date Dividers,
// Copy Text, Reply Quotes, Reactions, Server File Uploads, Voice/Video Call Launch
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
  Check,
  CheckCheck, 
  Clock,
  Reply, 
  Edit3, 
  Trash2, 
  Copy,
  Users, 
  Sparkles,
  ArrowLeft,
  FileText,
  ChevronDown,
  AlertCircle,
  RotateCw,
  Lock
} from 'lucide-react';
import { store } from '../../services/store';
import { api } from '../../services/api';
import GifPickerModal from './GifPickerModal';
import ViewOnceModal from './ViewOnceModal';

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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isViewOnceActive, setIsViewOnceActive] = useState(false);
  const [activeViewOnceMsg, setActiveViewOnceMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Instant Escape key to lock vault
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !showEmojiPicker && !showGifPicker && !activeViewOnceMsg) {
        store.lockVault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEmojiPicker, showGifPicker, activeViewOnceMsg]);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewOnceInputRef = useRef(null);
  const typingTimerRef = useRef(null);

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

  // Typing indicators
  const typingUsers = store.getTypingUsers(conversationId);
  const isTypingNow = typingUsers.length > 0;

  let statusSubtitle = '';
  if (isTypingNow) {
    statusSubtitle = `${typingUsers.join(', ')} is typing...`;
  } else if (isGroup) {
    statusSubtitle = `${group?.members?.length || 0}/5 members (Strict Max 5)`;
  } else if (peer?.status === 'online') {
    statusSubtitle = 'Active now';
  } else {
    statusSubtitle = `Last seen ${peer?.lastSeen || 'recently'}`;
  }

  // Auto-fetch messages on open & join room
  useEffect(() => {
    if (conversationId) {
      store.fetchConversationMessages(conversationId);
      store.markConversationRead(conversationId);
    }
  }, [conversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (conversationId) {
      store.markConversationRead(conversationId);
    }
  }, [conversationId, messages.length]);

  // Track scroll position to show "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottom(isUp);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-main)] text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-3xl mb-4 text-purple-400">
          💬
        </div>
        <h3 className="font-heading font-bold text-xl text-[var(--text-primary)] mb-2">Select a Conversation</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Pick a contact from the left panel or start a new private group with up to 5 members.
        </p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing indicator with debounce
    store.setTyping(conversationId, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      store.setTyping(conversationId, false);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachment) return;

    store.setTyping(conversationId, false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    await store.sendMessage({
      conversationId,
      text: inputText,
      attachment,
      replyToId: replyingTo?.id || null,
      isViewOnce: isViewOnceActive && Boolean(attachment),
      isGif: false
    });

    setInputText('');
    setAttachment(null);
    setIsViewOnceActive(false);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleSelectGif = async (gifObj) => {
    setShowGifPicker(false);
    await store.sendMessage({
      conversationId,
      text: '',
      attachment: gifObj,
      replyToId: replyingTo?.id || null,
      isViewOnce: false,
      isGif: true
    });
    setReplyingTo(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload via backend endpoint
      const res = await api.uploadFile(file);
      if (res && res.file) {
        setAttachment({
          name: res.file.fileName,
          type: res.file.fileType,
          size: res.file.fileSize,
          url: res.file.url
        });
      }
    } catch (err) {
      console.warn('File upload server fallback:', err.message);
      // Fallback: Read as DataURL for offline use
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          size: file.size,
          url: reader.result
        });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveEdit = (messageId) => {
    if (!editText.trim()) return;
    store.editMessage(messageId, editText);
    setEditingMessageId(null);
    setEditText('');
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  // Helper: Format date divider
  const formatDateDivider = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (now.toDateString() === date.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] relative overflow-hidden text-[var(--text-primary)]">
      {/* Toast Notification */}
      {copyToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg animate-fadeIn flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>Copied to clipboard</span>
        </div>
      )}

      {/* Chat Top App Bar */}
      <div className="h-18 px-4 sm:px-6 border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0 cursor-pointer" onClick={onOpenInfo}>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
              {avatar}
            </div>
            {!isGroup && peer?.status === 'online' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]"></span>
            )}
          </div>

          <div className="min-w-0 flex flex-col text-left cursor-pointer" onClick={onOpenInfo}>
            <span className="font-heading font-bold text-base text-[var(--text-primary)] truncate flex items-center gap-1.5">
              {title}
              {isGroup && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  5 MAX
                </span>
              )}
            </span>
            <span className={`text-xs truncate flex items-center gap-1 ${isTypingNow ? 'text-purple-400 font-semibold' : 'text-[var(--text-secondary)]'}`}>
              {isTypingNow ? (
                <>
                  <span className="flex gap-0.5 items-center mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-2"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-3"></span>
                  </span>
                  <span>{statusSubtitle}</span>
                </>
              ) : (
                <>
                  {!isGroup && peer?.status === 'online' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                  {statusSubtitle}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Controls: Voice Call, Video Call, Details */}
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
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Conversation Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Instant Private Vault Lock Button */}
          <button
            onClick={() => store.lockVault()}
            className="px-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ml-1"
            title="Lock Private Vault (Esc)"
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5"
      >
        {/* Welcome Card */}
        <div className="max-w-md mx-auto my-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[var(--text-primary)]">Conversation with {title}</h4>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {isGroup 
              ? 'This private group has a strict limit of 5 members for intimate, high-trust conversations.'
              : 'Direct messages, files, and voice/video calls are end-to-end between the two of you.'}
          </p>
        </div>

        {messages.map((msg, index) => {
          const isSelf = msg.senderId === currentUser?.id;
          const sender = store.getUserById(msg.senderId);
          const senderDisplayName = store.getDisplayName(sender);
          const isEditing = editingMessageId === msg.id;

          // Check if date divider is needed
          const prevMsg = messages[index - 1];
          const showDateDivider = !prevMsg || 
            new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

          const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

          return (
            <React.Fragment key={msg.id}>
              {/* Date Divider */}
              {showDateDivider && (
                <div className="flex items-center justify-center my-3">
                  <span className="px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-semibold text-[var(--text-muted)] shadow-xs">
                    {formatDateDivider(msg.timestamp)}
                  </span>
                </div>
              )}

              <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} group relative`}>
                {/* Group Sender Name */}
                {isGroup && !isSelf && (
                  <span className="text-[11px] font-semibold text-purple-400 ml-10 mb-1">
                    {senderDisplayName}
                  </span>
                )}

                <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-[var(--border-color)] flex items-center justify-center text-base flex-shrink-0 mb-1">
                    {sender?.avatar || '👤'}
                  </div>

                  {/* Message Bubble Block */}
                  <div className="space-y-1">
                    {/* Quoted Reply Preview */}
                    {repliedMsg && (
                      <div className="text-[11px] px-3 py-1.5 rounded-xl bg-black/20 border-l-2 border-purple-500 text-[var(--text-muted)] truncate max-w-xs mb-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {repliedMsg.senderId === currentUser?.id ? 'You' : store.getDisplayName(store.getUserById(repliedMsg.senderId))}:
                        </span>{' '}
                        {repliedMsg.text || 'Attachment'}
                      </div>
                    )}

                    {/* Inline Editing Mode */}
                    {isEditing ? (
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-purple-500/40 space-y-2 min-w-[240px]">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-[var(--text-primary)] text-xs focus:outline-none focus:border-purple-500"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-1 rounded bg-purple-600 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`p-3.5 rounded-2xl text-sm relative shadow-md transition-all message-bubble ${
                          isSelf
                            ? 'bg-vibe-gradient text-white rounded-br-xs'
                            : 'bg-[var(--chat-bubble-peer)] border border-[var(--chat-bubble-border)] text-[var(--chat-bubble-peer-text)] rounded-bl-xs'
                        }`}
                      >
                        {/* View-Once Photo Bubble */}
                        {msg.isViewOnce ? (
                          <div className="my-1.5 max-w-xs">
                            {isSelf ? (
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-200 text-xs">
                                <span className="w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  ①
                                </span>
                                <div className="text-left">
                                  <span className="font-semibold block">{msg.isOpened ? '✓ Photo Opened' : 'View-Once Photo Sent'}</span>
                                  <span className="text-[10px] text-purple-300/80">{msg.isOpened ? 'Partner viewed and burned photo' : 'Vandishes after viewing'}</span>
                                </div>
                              </div>
                            ) : (
                              msg.isOpened ? (
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs text-slate-500 flex-shrink-0">
                                    ✓
                                  </span>
                                  <div className="text-left">
                                    <span className="font-semibold block text-slate-300">Photo Opened</span>
                                    <span className="text-[10px] text-slate-500">Expired • Cannot view again</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveViewOnceMsg(msg)}
                                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 w-full text-left"
                                >
                                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-base animate-pulse flex-shrink-0">
                                    ①
                                  </span>
                                  <div>
                                    <span className="font-bold text-xs block">View-Once Photo</span>
                                    <span className="text-[10px] text-purple-200">Tap to open (Vanishes once closed)</span>
                                  </div>
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          /* Standard Attachment & GIF Rendering */
                          msg.attachment && (
                            <div className="mb-2 rounded-xl overflow-hidden max-w-xs">
                              {msg.attachment.type?.startsWith('image/') || msg.isGif ? (
                                <img
                                  src={msg.attachment.url || msg.attachment.dataUrl}
                                  alt={msg.attachment.name}
                                  className="w-full h-auto rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-95"
                                  onClick={() => window.open(msg.attachment.url || msg.attachment.dataUrl, '_blank')}
                                />
                              ) : (
                                <a
                                  href={msg.attachment.url || msg.attachment.dataUrl}
                                  download={msg.attachment.name}
                                  className="flex items-center gap-2 p-2.5 bg-black/20 rounded-lg hover:bg-black/40 transition-colors"
                                >
                                  <FileText className="w-5 h-5 text-purple-300" />
                                  <div className="truncate text-left">
                                    <span className="text-xs truncate block">{msg.attachment.name}</span>
                                    {msg.attachment.size && (
                                      <span className="text-[10px] opacity-70">
                                        {(msg.attachment.size / 1024).toFixed(1)} KB
                                      </span>
                                    )}
                                  </div>
                                </a>
                              )}
                            </div>
                          )
                        )}

                        {/* Message Text */}
                        {msg.text && (
                          <p className={`leading-relaxed break-words select-text ${msg.isDeleted ? 'italic opacity-60' : ''}`}>
                            {msg.text}
                          </p>
                        )}

                        {/* Meta: Timestamp, Edited tag, Delivery status */}
                        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${isSelf ? 'text-purple-200/80' : 'text-[var(--text-muted)]'}`}>
                          {msg.isEdited && <span>(edited)</span>}
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                          {/* WhatsApp / Telegram Status Ticks for Sent Messages */}
                          {isSelf && (
                            <span>
                              {msg.status === 'sending' && (
                                <Clock className="w-3 h-3 text-purple-200/60 animate-spin" />
                              )}
                              {msg.status === 'sent' && (
                                <Check className="w-3.5 h-3.5 text-purple-200/70" title="Sent to server" />
                              )}
                              {msg.status === 'delivered' && (
                                <CheckCheck className="w-3.5 h-3.5 text-purple-200" title="Delivered to partner" />
                              )}
                              {msg.status === 'read' && (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-300" title="Read" />
                              )}
                              {msg.status === 'failed' && (
                                <span className="flex items-center gap-1 text-rose-300 font-bold">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Failed</span>
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            onClick={() => store.toggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all cursor-pointer ${
                              userIds.includes(currentUser?.id)
                                ? 'bg-purple-600/30 border-purple-500 text-white'
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold">{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Action Bar (Hover Overlay) */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-lg ${isSelf ? 'order-first' : 'order-last'}`}>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-white/5 cursor-pointer"
                      title="Reply"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopyText(msg.text)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-white/5 cursor-pointer"
                      title="Copy text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Reactions */}
                    <div className="flex items-center gap-0.5 px-1 border-x border-[var(--border-color)]">
                      {['❤️', '👍', '🔥'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => store.toggleReaction(msg.id, emoji)}
                          className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {isSelf && !msg.isDeleted && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditText(msg.text || '');
                          }}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-white/5 cursor-pointer"
                          title="Edit message"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this message?')) {
                              store.deleteMessage(msg.id);
                            }
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/10 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-6 z-30 p-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs truncate">
            <Reply className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-[var(--text-muted)]">Replying to</span>
            <span className="text-[var(--text-primary)] font-semibold truncate max-w-xs">{replyingTo.text || 'Attachment'}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Upload Preview Bar with View-Once Toggle */}
      {attachment && (
        <div className="px-4 py-2.5 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-3 text-xs">
            <Paperclip className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-[var(--text-primary)] font-medium truncate block max-w-xs">{attachment.name}</span>
              {attachment.size && (
                <span className="text-[10px] text-[var(--text-muted)]">({(attachment.size / 1024).toFixed(1)} KB)</span>
              )}
            </div>

            {/* View Once Toggle Button for Image Attachments */}
            {attachment.type?.startsWith('image/') && (
              <button
                type="button"
                onClick={() => setIsViewOnceActive(!isViewOnceActive)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isViewOnceActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
                title="When ON, photo permanently vanishes once viewed by recipient"
              >
                <span className="font-bold text-sm">①</span>
                <span>View Once: {isViewOnceActive ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setAttachment(null);
              setIsViewOnceActive(false);
            }}
            className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2 px-1">
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
      <div className="p-3 sm:p-4 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2 relative z-20 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <input
          type="file"
          ref={viewOnceInputRef}
          onChange={(e) => {
            setIsViewOnceActive(true);
            handleFileChange(e);
          }}
          className="hidden"
          accept="image/*"
        />

        {/* Attach File / Photo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          title="Attach Image, Document, or File"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Quick View-Once Photo Button */}
        <button
          type="button"
          onClick={() => viewOnceInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 transition-all cursor-pointer font-bold text-xs flex items-center gap-1 shadow-xs"
          title="Send View-Once Photo (Vanishes once opened)"
        >
          <span className="text-sm font-extrabold leading-none">①</span>
          <span className="hidden sm:inline text-[11px] font-semibold">1-View</span>
        </button>

        {/* Animated GIFs Button */}
        <button
          type="button"
          onClick={() => setShowGifPicker(!showGifPicker)}
          className="px-2.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all font-mono font-bold text-xs cursor-pointer"
          title="Browse & Send Animated GIFs"
        >
          GIF
        </button>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors cursor-pointer"
          title="Pick Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${title}...`}
            rows={1}
            maxLength={3000}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-purple-500 resize-none max-h-32 transition-colors"
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={(!inputText.trim() && !attachment) || uploading}
          className="p-2.5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white transition-all shadow-md shadow-purple-600/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          title="Send Message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Animated GIF Picker Drawer */}
      <GifPickerModal
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleSelectGif}
      />

      {/* View-Once Photo Burner Modal */}
      <ViewOnceModal
        isOpen={Boolean(activeViewOnceMsg)}
        photoUrl={activeViewOnceMsg?.attachment?.url || activeViewOnceMsg?.attachment?.dataUrl}
        senderName={store.getDisplayName(store.getUserById(activeViewOnceMsg?.senderId))}
        onClose={() => {
          if (activeViewOnceMsg) {
            store.markViewOnceOpened(activeViewOnceMsg.id);
          }
          setActiveViewOnceMsg(null);
        }}
      />
    </div>
  );
}
