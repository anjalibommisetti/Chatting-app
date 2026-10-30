// ==============================================================================
// VibeConnect — Professional REST API Client
// Handles Authentication, Users, Conversations, Messages, Groups, and File Uploads
// ==============================================================================

export function getServerUrl() {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('vibe_server_url');
  if (stored) return stored;

  // 1. Environment variable (e.g. from Render or .env)
  if (import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
  }

  // 2. Mobile APK / Capacitor native runtime
  const isCapacitor = (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) ||
    window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && !window.location.port);
    
  if (isCapacitor) {
    return 'https://chatting-app-3f5q.onrender.com';
  }

  // 3. Web browsers (Chrome, Safari, Firefox, Android Chrome, iOS Safari):
  return 'https://chatting-app-3f5q.onrender.com';
}

export function setCustomServerUrl(url) {
  if (url) {
    localStorage.setItem('vibe_server_url', url.replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('vibe_server_url');
  }
}

export async function testServerConnection(customUrl) {
  const base = (customUrl !== undefined ? customUrl : getServerUrl()) || '';
  const target = base ? `${base}/api/users` : '/api/users';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(target, { signal: timeout.signal });
    clearTimeout(timeout);
    return { ok: true, status: res.status, url: base || 'Local Relative /api' };
  } catch (err) {
    return { ok: false, error: err.message, url: base || 'Local Relative /api' };
  }
}

class ApiClient {
  getBaseUrl() {
    const srv = getServerUrl();
    return srv ? `${srv}/api` : '/api';
  }
  getToken() {
    return localStorage.getItem('vibe_auth_token') || null;
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('vibe_auth_token', token);
    } else {
      localStorage.removeItem('vibe_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          if (!response.ok) {
            throw new Error(`Server returned error (${response.status}). Please make sure the backend server is running.`);
          }
          throw new Error('Server returned unexpected non-JSON response.');
        }
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      console.warn(`[API] Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // --- Auth ---
  async register({ name, email, phone, username, password, avatar, bio }) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, username, password, avatar, bio })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async login(identifier, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async forgotPassword(identifier) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, email: identifier })
    });
  }

  async resetPassword({ identifier, email, resetCode, newPassword }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier || email, email: email || identifier, resetCode, newPassword })
    });
  }

  // --- Users & Profile ---
  async searchUsers(query = '') {
    return this.request(`/users?q=${encodeURIComponent(query)}`);
  }

  async getUserByPhone(phone) {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    return this.request(`/users/by-phone/${clean}`);
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async updateSettings(settingsData) {
    return this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  }

  async blockUser(targetUserId) {
    return this.request('/users/block', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  async unblockUser(targetUserId) {
    return this.request('/users/unblock', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  async deleteAccount() {
    const res = await this.request('/users/account', { method: 'DELETE' });
    this.setToken(null);
    return res;
  }

  // --- Conversations & Messages ---
  async getConversations() {
    return this.request('/conversations');
  }

  async startConversation(targetUserId) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  async getMessages(conversationId, limit = 100) {
    return this.request(`/conversations/${conversationId}/messages?limit=${limit}`);
  }

  async sendMessage(conversationId, { text, attachment, replyToId, isViewOnce, isGif }) {
    return this.request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, attachment, replyToId, isViewOnce, isGif })
    });
  }

  async openViewOnce(messageId) {
    return this.request(`/messages/${messageId}/view-once-open`, {
      method: 'POST'
    });
  }

  async editMessage(messageId, text) {
    return this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text })
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async toggleReaction(messageId, emoji) {
    return this.request(`/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  }

  // --- Groups ---
  async getGroups() {
    return this.request('/groups');
  }

  async createGroup({ name, avatar, memberIds }) {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, avatar, memberIds })
    });
  }

  async joinGroupByCode(inviteCode) {
    return this.request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
  }

  async addMemberToGroup(groupId, targetUserId) {
    return this.request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  async removeMemberFromGroup(groupId, userId) {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE'
    });
  }

  // --- File Upload ---
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/upload', {
      method: 'POST',
      body: formData
    });
  }
}

export const api = new ApiClient();
