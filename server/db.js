// ==============================================================================
// VibeChat — Supabase-Powered Database Engine
// ALL data (users, sessions, conversations, messages, groups) stored in Supabase
// No more db.json — everything is permanent!
// ==============================================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://jfqujqsvivilnwcgtizh.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcXVqcXN2aXZpbG53Y2d0aXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NzUxMDcsImV4cCI6MjEwNzQ1MTEwN30.hWVuE5hGoL4zVE2bnwuSwWb4vkVZT2iiPsnJ4IvVEtc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// ─── Password Hashing ───────────────────────────────────────────────────────
export function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, salt, hash) {
  try {
    const calc = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(calc, 'hex'), Buffer.from(hash, 'hex'));
  } catch { return false; }
}

// ─── Row Mappers ─────────────────────────────────────────────────────────────
function userFromRow(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    nickname: u.nickname,
    email: u.email,
    phone: u.phone,
    username: u.username,
    passwordHash: u.password_hash,
    salt: u.salt,
    avatar: u.avatar || '🦊',
    bio: u.bio || '',
    status: u.status || 'offline',
    lastSeen: u.last_seen || 'Never',
    blockedUserIds: u.blocked_user_ids || [],
    resetCode: u.reset_code || null,
    resetCodeExpires: u.reset_code_expires || null,
    settings: u.settings || { theme: 'dark', readReceipts: true, soundAlerts: true },
    createdAt: u.created_at || Date.now()
  };
}

function convFromRow(c) {
  if (!c) return null;
  return {
    id: c.id,
    type: c.type || 'direct',
    participantIds: c.participant_ids || [],
    groupId: c.group_id || null,
    isPinned: c.is_pinned || false,
    isMuted: c.is_muted || false,
    isArchived: c.is_archived || false,
    unreadCounts: c.unread_counts || {},
    lastMessagePreview: c.last_message_preview || '',
    lastMessageTime: c.last_message_time || Date.now(),
    createdAt: c.created_at || Date.now()
  };
}

function msgFromRow(m) {
  if (!m) return null;
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    text: m.text || '',
    attachment: m.attachment || null,
    replyToId: m.reply_to_id || null,
    isViewOnce: m.is_view_once || false,
    isOpened: m.is_opened || false,
    openedBy: m.opened_by || [],
    isGif: m.is_gif || false,
    reactions: m.reactions || {},
    isEdited: m.is_edited || false,
    isDeleted: m.is_deleted || false,
    status: m.status || 'sent',
    timestamp: m.timestamp || Date.now(),
    readBy: m.read_by || []
  };
}

function groupFromRow(g) {
  if (!g) return null;
  return {
    id: g.id,
    name: g.name,
    avatar: g.avatar || '✨',
    creatorId: g.creator_id,
    inviteCode: g.invite_code,
    maxMembers: 5,
    members: g.members || [],
    createdAt: g.created_at || Date.now()
  };
}

// ─── Main Database Class ─────────────────────────────────────────────────────
class SupabaseDatabase {
  constructor() {
    // In-memory cache — loaded from Supabase on startup
    this.data = {
      users: [],
      sessions: {},      // token -> { userId, expiresAt }
      conversations: [],
      groups: [],
      chatRequests: [],
      callLogs: []
    };
  }

  // Called once on server startup — loads everything into memory
  async init() {
    console.log('[DB] Connecting to Supabase...');
    try {
      await this._loadUsers();
      await this._loadSessions();
      await this._loadConversations();
      await this._loadGroups();
      console.log(`[DB] ✅ Loaded from Supabase: ${this.data.users.length} users, ${this.data.conversations.length} convs, ${Object.keys(this.data.sessions).length} sessions`);
    } catch (err) {
      console.error('[DB] ❌ Supabase init error:', err.message);
    }
  }

  async _loadUsers() {
    const { data, error } = await supabase.from('vc_users').select('*');
    if (error) { console.warn('[DB] Could not load users:', error.message); return; }
    this.data.users = (data || []).map(userFromRow);
  }

  async _loadSessions() {
    const { data, error } = await supabase.from('vc_sessions').select('*').gt('expires_at', Date.now());
    if (error) { console.warn('[DB] Could not load sessions:', error.message); return; }
    this.data.sessions = {};
    for (const s of (data || [])) {
      this.data.sessions[s.token] = { userId: s.user_id, expiresAt: s.expires_at };
    }
  }

  async _loadConversations() {
    const { data, error } = await supabase.from('vc_conversations').select('*').order('last_message_time', { ascending: false });
    if (error) { console.warn('[DB] Could not load conversations:', error.message); return; }
    this.data.conversations = (data || []).map(convFromRow);
  }

  async _loadGroups() {
    const { data, error } = await supabase.from('vc_groups').select('*');
    if (error) { console.warn('[DB] Could not load groups:', error.message); return; }
    this.data.groups = (data || []).map(groupFromRow);
  }

  // No-op: Supabase is always saved
  save() {}

  // ─── Sessions ──────────────────────────────────────────────────────────────
  createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    this.data.sessions[token] = { userId, expiresAt };
    // Async write to Supabase (don't await — fast response)
    supabase.from('vc_sessions').insert({ token, user_id: userId, expires_at: expiresAt })
      .then(({ error }) => { if (error) console.warn('[DB] Session save:', error.message); });
    return token;
  }

  validateSession(token) {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      supabase.from('vc_sessions').delete().eq('token', token).then(() => {});
      return null;
    }
    return this.getUserById(session.userId);
  }

  removeSession(token) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      supabase.from('vc_sessions').delete().eq('token', token).then(() => {});
    }
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  getUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  getUserByIdentifier(identifier) {
    if (!identifier) return null;
    const idClean = identifier.trim().toLowerCase();
    const phoneClean = identifier.replace(/[^0-9]/g, '');
    return this.data.users.find(u =>
      u.email.toLowerCase() === idClean ||
      u.username.toLowerCase() === idClean ||
      (phoneClean && u.phone === phoneClean)
    ) || null;
  }

  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, salt, resetCode, resetCodeExpires, ...safe } = user;
    return safe;
  }

  createUser({ name, nickname, email, phone, username, password, avatar, bio }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanNickname = (nickname || name || '').trim();
    const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'user';

    // Check conflicts in memory cache
    if (this.data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }
    if (cleanPhone && this.data.users.some(u => u.phone === cleanPhone)) {
      throw new Error('An account with this phone number already exists. Please sign in instead.');
    }

    let finalUsername = cleanUsername;
    if (this.data.users.some(u => u.username.toLowerCase() === finalUsername)) {
      finalUsername = finalUsername + '_' + Math.random().toString(36).slice(2, 4);
    }

    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: cleanNickname,
      nickname: cleanNickname,
      email: cleanEmail,
      phone: cleanPhone || '9' + Math.floor(100000000 + Math.random() * 900000000),
      username: finalUsername,
      passwordHash: hash,
      salt: salt,
      avatar: avatar || '🦊',
      bio: bio || 'Hey there! I am using VibeChat ✨',
      status: 'online',
      lastSeen: 'Active now',
      blockedUserIds: [],
      settings: { theme: 'dark', readReceipts: true, soundAlerts: true },
      createdAt: Date.now()
    };

    // Add to in-memory cache immediately
    this.data.users.push(newUser);

    // Save to Supabase
    supabase.from('vc_users').insert({
      id: newUser.id,
      name: newUser.name,
      nickname: newUser.nickname,
      email: newUser.email,
      phone: newUser.phone,
      username: newUser.username,
      password_hash: newUser.passwordHash,
      salt: newUser.salt,
      avatar: newUser.avatar,
      bio: newUser.bio,
      status: newUser.status,
      last_seen: newUser.lastSeen,
      blocked_user_ids: newUser.blockedUserIds,
      settings: newUser.settings,
      created_at: newUser.createdAt
    }).then(({ error }) => {
      if (error) console.error('[DB] ❌ createUser Supabase error:', error.message);
      else console.log(`[DB] ✅ User saved to Supabase: ${newUser.nickname} (${newUser.phone})`);
    });

    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;

    const supabaseUpdates = {};

    if (updates.name !== undefined) { user.name = updates.name.trim(); supabaseUpdates.name = user.name; }
    if (updates.nickname !== undefined) { user.nickname = updates.nickname.trim(); supabaseUpdates.nickname = user.nickname; }
    if (updates.bio !== undefined) { user.bio = updates.bio.trim(); supabaseUpdates.bio = user.bio; }
    if (updates.avatar !== undefined) { user.avatar = updates.avatar; supabaseUpdates.avatar = user.avatar; }
    if (updates.status !== undefined) { user.status = updates.status; supabaseUpdates.status = user.status; }
    if (updates.lastSeen !== undefined) { user.lastSeen = updates.lastSeen; supabaseUpdates.last_seen = user.lastSeen; }
    if (updates.settings !== undefined) { user.settings = { ...user.settings, ...updates.settings }; supabaseUpdates.settings = user.settings; }
    if (updates.blockedUserIds !== undefined) { user.blockedUserIds = updates.blockedUserIds; supabaseUpdates.blocked_user_ids = user.blockedUserIds; }
    if (updates.passwordHash !== undefined) { user.passwordHash = updates.passwordHash; supabaseUpdates.password_hash = user.passwordHash; }
    if (updates.salt !== undefined) { user.salt = updates.salt; supabaseUpdates.salt = user.salt; }
    if (updates.resetCode !== undefined) { user.resetCode = updates.resetCode; supabaseUpdates.reset_code = user.resetCode; }
    if (updates.resetCodeExpires !== undefined) { user.resetCodeExpires = updates.resetCodeExpires; supabaseUpdates.reset_code_expires = user.resetCodeExpires; }

    if (Object.keys(supabaseUpdates).length > 0) {
      supabase.from('vc_users').update(supabaseUpdates).eq('id', id).then(({ error }) => {
        if (error) console.warn('[DB] updateUser Supabase:', error.message);
      });
    }

    return user;
  }

  deleteUser(id) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    Object.keys(this.data.sessions).forEach(token => {
      if (this.data.sessions[token].userId === id) delete this.data.sessions[token];
    });
    supabase.from('vc_users').delete().eq('id', id).then(() => {});
    return true;
  }

  // ─── Conversations ────────────────────────────────────────────────────────
  getUserConversations(userId) {
    return this.data.conversations
      .filter(c => c.participantIds.includes(userId))
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
  }

  getConversationById(convId) {
    return this.data.conversations.find(c => c.id === convId) || null;
  }

  getOrCreateDirectConversation(user1Id, user2Id) {
    let conv = this.data.conversations.find(c =>
      c.type === 'direct' &&
      c.participantIds.includes(user1Id) &&
      c.participantIds.includes(user2Id)
    );

    if (!conv) {
      conv = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        type: 'direct',
        participantIds: [user1Id, user2Id],
        groupId: null,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        unreadCounts: { [user1Id]: 0, [user2Id]: 0 },
        lastMessagePreview: 'Started a new conversation',
        lastMessageTime: Date.now(),
        createdAt: Date.now()
      };
      this.data.conversations.unshift(conv);

      supabase.from('vc_conversations').insert({
        id: conv.id,
        type: conv.type,
        participant_ids: conv.participantIds,
        group_id: conv.groupId,
        is_pinned: conv.isPinned,
        is_muted: conv.isMuted,
        is_archived: conv.isArchived,
        unread_counts: conv.unreadCounts,
        last_message_preview: conv.lastMessagePreview,
        last_message_time: conv.lastMessageTime,
        created_at: conv.createdAt
      }).then(({ error }) => {
        if (error) console.warn('[DB] createConv Supabase:', error.message);
      });
    }
    return conv;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────
  async getMessagesByConversation(convId, limit = 100) {
    const { data, error } = await supabase
      .from('vc_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('timestamp', { ascending: true })
      .limit(limit);
    if (error) { console.warn('[DB] getMessages:', error.message); return []; }
    return (data || []).map(msgFromRow);
  }

  async getMessageById(messageId) {
    const { data, error } = await supabase.from('vc_messages').select('*').eq('id', messageId).single();
    if (error) return null;
    return msgFromRow(data);
  }

  createMessage({ conversationId, senderId, text, attachment, replyToId, isViewOnce, isGif }) {
    const conv = this.getConversationById(conversationId);
    if (!conv) throw new Error('Conversation not found');

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      conversationId,
      senderId,
      text: (text || '').trim(),
      attachment: attachment || null,
      replyToId: replyToId || null,
      isViewOnce: Boolean(isViewOnce),
      isOpened: false,
      openedBy: [],
      isGif: Boolean(isGif),
      reactions: {},
      isEdited: false,
      isDeleted: false,
      status: 'sent',
      timestamp: Date.now(),
      readBy: [senderId]
    };

    // Update conversation preview in memory
    let preview = newMsg.text;
    if (newMsg.isViewOnce) preview = '① Photo (View Once)';
    else if (newMsg.isGif) preview = '👾 GIF';
    else if (attachment) preview = `📎 ${attachment.name || 'Attachment'}`;
    conv.lastMessagePreview = preview || 'New message';
    conv.lastMessageTime = newMsg.timestamp;
    if (!conv.unreadCounts) conv.unreadCounts = {};
    conv.participantIds.forEach(pid => {
      if (pid !== senderId) conv.unreadCounts[pid] = (conv.unreadCounts[pid] || 0) + 1;
    });

    // Save message to Supabase
    supabase.from('vc_messages').insert({
      id: newMsg.id,
      conversation_id: newMsg.conversationId,
      sender_id: newMsg.senderId,
      text: newMsg.text,
      attachment: newMsg.attachment,
      reply_to_id: newMsg.replyToId,
      is_view_once: newMsg.isViewOnce,
      is_opened: newMsg.isOpened,
      opened_by: newMsg.openedBy,
      is_gif: newMsg.isGif,
      reactions: newMsg.reactions,
      is_edited: newMsg.isEdited,
      is_deleted: newMsg.isDeleted,
      status: newMsg.status,
      timestamp: newMsg.timestamp,
      read_by: newMsg.readBy
    }).then(({ error }) => {
      if (error) console.warn('[DB] createMsg Supabase:', error.message);
    });

    // Update conversation in Supabase
    supabase.from('vc_conversations').update({
      last_message_preview: conv.lastMessagePreview,
      last_message_time: conv.lastMessageTime,
      unread_counts: conv.unreadCounts
    }).eq('id', conv.id).then(() => {});

    return newMsg;
  }

  async markViewOnceOpened(messageId, userId) {
    const { data } = await supabase.from('vc_messages').select('*').eq('id', messageId).single();
    if (!data) return null;
    const msg = msgFromRow(data);
    if (msg.isViewOnce) {
      const openedBy = [...(msg.openedBy || [])];
      if (!openedBy.includes(userId)) openedBy.push(userId);
      await supabase.from('vc_messages').update({ is_opened: true, opened_by: openedBy }).eq('id', messageId);
      msg.isOpened = true;
      msg.openedBy = openedBy;
    }
    return msg;
  }

  async editMessage(messageId, userId, newText) {
    const { data } = await supabase.from('vc_messages').select('*').eq('id', messageId).single();
    if (!data) throw new Error('Message not found');
    if (data.sender_id !== userId) throw new Error('Unauthorized to edit this message');
    await supabase.from('vc_messages').update({ text: newText.trim(), is_edited: true }).eq('id', messageId);
    return msgFromRow({ ...data, text: newText.trim(), is_edited: true });
  }

  async deleteMessage(messageId, userId) {
    const { data } = await supabase.from('vc_messages').select('*').eq('id', messageId).single();
    if (!data) throw new Error('Message not found');
    if (data.sender_id !== userId) throw new Error('Unauthorized to delete this message');
    await supabase.from('vc_messages').update({ is_deleted: true, text: 'This message was deleted', attachment: null }).eq('id', messageId);
    return msgFromRow({ ...data, is_deleted: true, text: 'This message was deleted' });
  }

  async toggleReaction(messageId, userId, emoji) {
    const { data } = await supabase.from('vc_messages').select('*').eq('id', messageId).single();
    if (!data) throw new Error('Message not found');
    const reactions = data.reactions || {};
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(userId)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(userId);
    }
    await supabase.from('vc_messages').update({ reactions }).eq('id', messageId);
    return msgFromRow({ ...data, reactions });
  }

  async markMessagesRead(convId, userId) {
    const conv = this.getConversationById(convId);
    if (conv && conv.unreadCounts) {
      conv.unreadCounts[userId] = 0;
      await supabase.from('vc_conversations').update({ unread_counts: conv.unreadCounts }).eq('id', convId);
    }
    // Mark messages as read in Supabase
    const { data: msgs } = await supabase.from('vc_messages').select('id, read_by').eq('conversation_id', convId);
    for (const m of (msgs || [])) {
      if (!(m.read_by || []).includes(userId)) {
        const newReadBy = [...(m.read_by || []), userId];
        await supabase.from('vc_messages').update({ read_by: newReadBy, status: 'read' }).eq('id', m.id);
      }
    }
  }

  // ─── Groups ───────────────────────────────────────────────────────────────
  createGroup({ name, avatar, creatorId, memberIds }) {
    const distinctMembers = Array.from(new Set([creatorId, ...(memberIds || [])]));
    if (distinctMembers.length > 5) throw new Error('Group member limit exceeded. Max 5 members.');

    const inviteCode = 'VIBE-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const newGroup = {
      id: 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      avatar: avatar || '✨',
      creatorId,
      inviteCode,
      maxMembers: 5,
      members: distinctMembers,
      createdAt: Date.now()
    };
    this.data.groups.push(newGroup);

    const newConv = {
      id: 'conv_' + newGroup.id,
      type: 'group',
      participantIds: distinctMembers,
      groupId: newGroup.id,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCounts: Object.fromEntries(distinctMembers.map(id => [id, 0])),
      lastMessagePreview: `Group created`,
      lastMessageTime: Date.now(),
      createdAt: Date.now()
    };
    this.data.conversations.unshift(newConv);

    supabase.from('vc_groups').insert({
      id: newGroup.id, name: newGroup.name, avatar: newGroup.avatar,
      creator_id: newGroup.creatorId, invite_code: newGroup.inviteCode,
      members: newGroup.members, created_at: newGroup.createdAt
    }).then(() => {});

    supabase.from('vc_conversations').insert({
      id: newConv.id, type: 'group', participant_ids: newConv.participantIds,
      group_id: newConv.groupId, is_pinned: false, is_muted: false, is_archived: false,
      unread_counts: newConv.unreadCounts, last_message_preview: newConv.lastMessagePreview,
      last_message_time: newConv.lastMessageTime, created_at: newConv.createdAt
    }).then(() => {});

    return { group: newGroup, conversation: newConv };
  }

  getGroupById(groupId) {
    return this.data.groups.find(g => g.id === groupId) || null;
  }

  joinGroupByCode(inviteCode, userId) {
    const cleanCode = (inviteCode || '').trim().toUpperCase();
    const group = this.data.groups.find(g => g.inviteCode.toUpperCase() === cleanCode);
    if (!group) throw new Error('Invalid invite code. No group found with this code.');
    if (group.members.includes(userId)) return group;
    if (group.members.length >= 5) throw new Error('This group has reached its maximum of 5 members.');

    group.members.push(userId);
    const conv = this.data.conversations.find(c => c.groupId === group.id);
    if (conv && !conv.participantIds.includes(userId)) {
      conv.participantIds.push(userId);
      conv.unreadCounts[userId] = 0;
      supabase.from('vc_conversations').update({ participant_ids: conv.participantIds, unread_counts: conv.unreadCounts }).eq('id', conv.id).then(() => {});
    }
    supabase.from('vc_groups').update({ members: group.members }).eq('id', group.id).then(() => {});
    return group;
  }

  addMemberToGroup(groupId, adminUserId, targetUserId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    if (group.creatorId !== adminUserId) throw new Error('Only the group creator can add members');
    if (group.members.includes(targetUserId)) return group;
    if (group.members.length >= 5) throw new Error('Group is full! Max 5 members allowed.');

    group.members.push(targetUserId);
    const conv = this.data.conversations.find(c => c.groupId === groupId);
    if (conv && !conv.participantIds.includes(targetUserId)) {
      conv.participantIds.push(targetUserId);
      supabase.from('vc_conversations').update({ participant_ids: conv.participantIds }).eq('id', conv.id).then(() => {});
    }
    supabase.from('vc_groups').update({ members: group.members }).eq('id', groupId).then(() => {});
    return group;
  }

  removeMemberFromGroup(groupId, actorUserId, targetUserId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    if (actorUserId !== targetUserId && group.creatorId !== actorUserId) throw new Error('Only the group creator can remove members');

    group.members = group.members.filter(m => m !== targetUserId);
    const conv = this.data.conversations.find(c => c.groupId === groupId);
    if (conv) {
      conv.participantIds = conv.participantIds.filter(m => m !== targetUserId);
      supabase.from('vc_conversations').update({ participant_ids: conv.participantIds }).eq('id', conv.id).then(() => {});
    }
    supabase.from('vc_groups').update({ members: group.members }).eq('id', groupId).then(() => {});
    return group;
  }
}

export const db = new SupabaseDatabase();
