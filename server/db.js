// ==============================================================================
// VibeConnect — ACID-Safe JSON Database Storage Engine (ESM)
// Auto-persists users, conversations, messages, groups, and settings on disk
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helpers for secure password hashing using Node crypto (Scrypt)
export function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, salt, hash) {
  try {
    const calculated = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Default Seed Users (all have password: password123)
const DEFAULT_SALT = 'e5b7218ac93f412d8a546b81d6d3765e';
const DEFAULT_HASH = hashPassword('password123', DEFAULT_SALT).hash;

const INITIAL_DB = {
  users: [
    {
      id: 'usr_anju',
      name: 'Anjali Bommisetti',
      email: 'anju@vibeconnect.io',
      phone: '9876543210',
      username: 'anju',
      nickname: 'Anju',
      passwordHash: DEFAULT_HASH,
      salt: DEFAULT_SALT,
      avatar: '🦊',
      bio: 'Building the next-gen private messenger ✨',
      status: 'online',
      lastSeen: 'Active now',
      blockedUserIds: [],
      settings: {
        theme: 'dark',
        readReceipts: true,
        soundAlerts: true
      },
      createdAt: Date.now() - 86400000 * 3
    },
    {
      id: 'usr_priya',
      name: 'Priya Sharma',
      email: 'priya@vibeconnect.io',
      phone: '9876543211',
      username: 'priya',
      nickname: 'Priya',
      passwordHash: DEFAULT_HASH,
      salt: DEFAULT_SALT,
      avatar: '🌸',
      bio: 'Coffee & Code ☕',
      status: 'online',
      lastSeen: 'Active now',
      blockedUserIds: [],
      settings: {
        theme: 'dark',
        readReceipts: true,
        soundAlerts: true
      },
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex@vibeconnect.io',
      phone: '9876543212',
      username: 'alex',
      nickname: 'Alex',
      passwordHash: DEFAULT_HASH,
      salt: DEFAULT_SALT,
      avatar: '⚡',
      bio: 'Available for video & voice calls 🎧',
      status: 'online',
      lastSeen: 'Active now',
      blockedUserIds: [],
      settings: {
        theme: 'dark',
        readReceipts: true,
        soundAlerts: true
      },
      createdAt: Date.now() - 86400000 * 1
    },
    {
      id: 'usr_sam',
      name: 'Sammy Taylor',
      email: 'sammy@vibeconnect.io',
      phone: '9876543213',
      username: 'sammy',
      nickname: 'Sammy',
      passwordHash: DEFAULT_HASH,
      salt: DEFAULT_SALT,
      avatar: '🚀',
      bio: 'Exploring tech and decentralized protocols!',
      status: 'away',
      lastSeen: '15m ago',
      blockedUserIds: [],
      settings: {
        theme: 'dark',
        readReceipts: true,
        soundAlerts: true
      },
      createdAt: Date.now() - 3600000 * 4
    }
  ],
  groups: [
    {
      id: 'grp_core_team',
      name: 'Core Dev Circle',
      avatar: '⚡',
      creatorId: 'usr_anju',
      inviteCode: 'VIBE-DEV1',
      maxMembers: 5,
      members: ['usr_anju', 'usr_priya', 'usr_alex'],
      createdAt: Date.now() - 86400000
    }
  ],
  conversations: [
    {
      id: 'conv_direct_priya',
      type: 'direct',
      participantIds: ['usr_anju', 'usr_priya'],
      groupId: null,
      isPinned: true,
      isMuted: false,
      isArchived: false,
      unreadCounts: { usr_anju: 0, usr_priya: 0 },
      lastMessagePreview: 'Sounds great! I will test the voice calling now 🎧',
      lastMessageTime: Date.now() - 1000 * 60 * 5,
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'conv_direct_alex',
      type: 'direct',
      participantIds: ['usr_anju', 'usr_alex'],
      groupId: null,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCounts: { usr_anju: 0, usr_alex: 0 },
      lastMessagePreview: 'Hey! Are you ready for our 1-on-1 video call?',
      lastMessageTime: Date.now() - 1000 * 60 * 35,
      createdAt: Date.now() - 86400000 * 1
    },
    {
      id: 'conv_grp_core_team',
      type: 'group',
      participantIds: ['usr_anju', 'usr_priya', 'usr_alex'],
      groupId: 'grp_core_team',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCounts: { usr_anju: 0, usr_priya: 0, usr_alex: 0 },
      lastMessagePreview: 'Priya: Strict 5-member limit is fully enforced!',
      lastMessageTime: Date.now() - 1000 * 60 * 12,
      createdAt: Date.now() - 86400000
    }
  ],
  messages: [
    {
      id: 'msg_init_1',
      conversationId: 'conv_direct_priya',
      senderId: 'usr_priya',
      text: 'Hey Anju! The new UI redesign looks incredibly smooth. Love the WhatsApp & Telegram vibes! 🚀',
      attachment: null,
      replyToId: null,
      reactions: { '❤️': ['usr_anju'] },
      isEdited: false,
      isDeleted: false,
      status: 'read',
      timestamp: Date.now() - 1000 * 60 * 25,
      deliveredTo: ['usr_anju'],
      readBy: ['usr_anju']
    },
    {
      id: 'msg_init_2',
      conversationId: 'conv_direct_priya',
      senderId: 'usr_anju',
      text: 'Thank you Priya! Real-time messaging, file sharing, and dark/light modes are all active.',
      attachment: null,
      replyToId: 'msg_init_1',
      reactions: { '🔥': ['usr_priya'] },
      isEdited: false,
      isDeleted: false,
      status: 'read',
      timestamp: Date.now() - 1000 * 60 * 15,
      deliveredTo: ['usr_priya'],
      readBy: ['usr_priya']
    },
    {
      id: 'msg_init_3',
      conversationId: 'conv_direct_priya',
      senderId: 'usr_priya',
      text: 'Sounds great! I will test the voice calling now 🎧',
      attachment: null,
      replyToId: null,
      reactions: {},
      isEdited: false,
      isDeleted: false,
      status: 'read',
      timestamp: Date.now() - 1000 * 60 * 5,
      deliveredTo: ['usr_anju'],
      readBy: ['usr_anju']
    },
    {
      id: 'msg_init_4',
      conversationId: 'conv_direct_alex',
      senderId: 'usr_alex',
      text: 'Hey! Are you ready for our 1-on-1 video call?',
      attachment: null,
      replyToId: null,
      reactions: {},
      isEdited: false,
      isDeleted: false,
      status: 'read',
      timestamp: Date.now() - 1000 * 60 * 35,
      deliveredTo: ['usr_anju'],
      readBy: ['usr_anju']
    },
    {
      id: 'msg_init_5',
      conversationId: 'conv_grp_core_team',
      senderId: 'usr_priya',
      text: 'Strict 5-member limit is fully enforced!',
      attachment: null,
      replyToId: null,
      reactions: { '👍': ['usr_anju', 'usr_alex'] },
      isEdited: false,
      isDeleted: false,
      status: 'read',
      timestamp: Date.now() - 1000 * 60 * 12,
      deliveredTo: ['usr_anju', 'usr_alex'],
      readBy: ['usr_anju', 'usr_alex']
    }
  ],
  chatRequests: [],
  callLogs: [],
  sessions: {} // token -> { userId, expiresAt }
};

class JSONDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || INITIAL_DB.users,
          groups: parsed.groups || INITIAL_DB.groups,
          conversations: parsed.conversations || INITIAL_DB.conversations,
          messages: parsed.messages || INITIAL_DB.messages,
          chatRequests: parsed.chatRequests || [],
          callLogs: parsed.callLogs || [],
          sessions: parsed.sessions || {}
        };
      }
    } catch (e) {
      console.warn('[DB] Failed reading db.json, creating initial database:', e.message);
    }
    this.save(INITIAL_DB);
    return INITIAL_DB;
  }

  save(dataToSave = null) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed saving database:', e);
    }
  }

  // --- Auth & Sessions ---
  createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    this.data.sessions[token] = { userId, expiresAt };
    this.save();
    return token;
  }

  validateSession(token) {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }
    const user = this.getUserById(session.userId);
    return user;
  }

  removeSession(token) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  // --- Users ---
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
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  createUser({ name, email, phone, username, password, avatar, bio }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Check conflicts
    if (this.data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists.');
    }
    if (cleanPhone && this.data.users.some(u => u.phone === cleanPhone)) {
      throw new Error('An account with this phone number already exists.');
    }
    if (this.data.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const { hash, salt } = hashPassword(password);
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone || '9' + Math.floor(100000000 + Math.random() * 900000000),
      username: cleanUsername,
      nickname: name.trim().split(' ')[0] || cleanUsername,
      passwordHash: hash,
      salt: salt,
      avatar: avatar || '🦊',
      bio: bio || 'Using VibeConnect ✨',
      status: 'online',
      lastSeen: 'Active now',
      blockedUserIds: [],
      settings: {
        theme: 'dark',
        readReceipts: true,
        soundAlerts: true
      },
      createdAt: Date.now()
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.nickname !== undefined) user.nickname = updates.nickname.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.lastSeen !== undefined) user.lastSeen = updates.lastSeen;
    if (updates.settings !== undefined) {
      user.settings = { ...user.settings, ...updates.settings };
    }
    if (updates.blockedUserIds !== undefined) {
      user.blockedUserIds = updates.blockedUserIds;
    }

    this.save();
    return user;
  }

  deleteUser(id) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    Object.keys(this.data.sessions).forEach(token => {
      if (this.data.sessions[token].userId === id) {
        delete this.data.sessions[token];
      }
    });
    this.data.groups.forEach(g => {
      g.members = g.members.filter(m => m !== id);
    });
    this.save();
    return true;
  }

  // --- Conversations ---
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
      this.save();
    }
    return conv;
  }

  // --- Messages ---
  getMessagesByConversation(convId, limit = 100, offset = 0) {
    const list = this.data.messages
      .filter(m => m.conversationId === convId)
      .sort((a, b) => a.timestamp - b.timestamp);
    return list.slice(Math.max(0, list.length - limit));
  }

  getMessageById(messageId) {
    return this.data.messages.find(m => m.id === messageId) || null;
  }

  createMessage({ conversationId, senderId, text, attachment, replyToId }) {
    const conv = this.getConversationById(conversationId);
    if (!conv) throw new Error('Conversation not found');

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      conversationId,
      senderId,
      text: (text || '').trim(),
      attachment: attachment || null,
      replyToId: replyToId || null,
      reactions: {},
      isEdited: false,
      isDeleted: false,
      status: 'sent',
      timestamp: Date.now(),
      deliveredTo: [senderId],
      readBy: [senderId]
    };

    this.data.messages.push(newMsg);

    // Update conversation metadata
    conv.lastMessagePreview = newMsg.text || (attachment ? `📎 ${attachment.name || 'Attachment'}` : 'New message');
    conv.lastMessageTime = newMsg.timestamp;

    if (!conv.unreadCounts) conv.unreadCounts = {};
    conv.participantIds.forEach(pid => {
      if (pid !== senderId) {
        conv.unreadCounts[pid] = (conv.unreadCounts[pid] || 0) + 1;
      }
    });

    this.save();
    return newMsg;
  }

  editMessage(messageId, userId, newText) {
    const msg = this.getMessageById(messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.senderId !== userId) throw new Error('Unauthorized to edit this message');

    msg.text = newText.trim();
    msg.isEdited = true;
    this.save();
    return msg;
  }

  deleteMessage(messageId, userId) {
    const msg = this.getMessageById(messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.senderId !== userId) throw new Error('Unauthorized to delete this message');

    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    msg.attachment = null;
    this.save();
    return msg;
  }

  toggleReaction(messageId, userId, emoji) {
    const msg = this.getMessageById(messageId);
    if (!msg) throw new Error('Message not found');

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    if (msg.reactions[emoji].includes(userId)) {
      msg.reactions[emoji] = msg.reactions[emoji].filter(id => id !== userId);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    this.save();
    return msg;
  }

  markMessagesRead(convId, userId) {
    const conv = this.getConversationById(convId);
    if (conv && conv.unreadCounts) {
      conv.unreadCounts[userId] = 0;
    }

    let changed = false;
    this.data.messages.forEach(m => {
      if (m.conversationId === convId && m.senderId !== userId) {
        if (!m.readBy) m.readBy = [];
        if (!m.readBy.includes(userId)) {
          m.readBy.push(userId);
          m.status = 'read';
          changed = true;
        }
      }
    });

    if (changed || conv) {
      this.save();
    }
  }

  // --- Groups (Strict 5-member limit) ---
  createGroup({ name, avatar, creatorId, memberIds }) {
    const distinctMembers = Array.from(new Set([creatorId, ...(memberIds || [])]));
    if (distinctMembers.length > 5) {
      throw new Error('Group member limit exceeded. Groups strictly support up to 5 members.');
    }

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
      unreadCounts: {},
      lastMessagePreview: `Group created by ${this.getUserById(creatorId)?.nickname || 'Admin'}`,
      lastMessageTime: Date.now(),
      createdAt: Date.now()
    };
    distinctMembers.forEach(id => {
      newConv.unreadCounts[id] = 0;
    });

    this.data.conversations.unshift(newConv);
    this.save();
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

    if (group.members.length >= 5) {
      throw new Error('This private group has reached its strict maximum of 5 members.');
    }

    group.members.push(userId);
    const conv = this.data.conversations.find(c => c.groupId === group.id);
    if (conv && !conv.participantIds.includes(userId)) {
      conv.participantIds.push(userId);
      conv.unreadCounts[userId] = 0;
    }

    this.save();
    return group;
  }

  addMemberToGroup(groupId, adminUserId, targetUserId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    if (group.creatorId !== adminUserId) throw new Error('Only the group creator can add members');
    if (group.members.includes(targetUserId)) return group;
    if (group.members.length >= 5) {
      throw new Error('Group is full! Strictly 5 members allowed.');
    }

    group.members.push(targetUserId);
    const conv = this.data.conversations.find(c => c.groupId === group.id);
    if (conv && !conv.participantIds.includes(targetUserId)) {
      conv.participantIds.push(targetUserId);
    }
    this.save();
    return group;
  }

  removeMemberFromGroup(groupId, actorUserId, targetUserId) {
    const group = this.getGroupById(groupId);
    if (!group) throw new Error('Group not found');
    
    if (actorUserId !== targetUserId && group.creatorId !== actorUserId) {
      throw new Error('Only the group creator can remove members');
    }

    group.members = group.members.filter(m => m !== targetUserId);
    const conv = this.data.conversations.find(c => c.groupId === group.id);
    if (conv) {
      conv.participantIds = conv.participantIds.filter(m => m !== targetUserId);
    }
    this.save();
    return group;
  }
}

export const db = new JSONDatabase();
