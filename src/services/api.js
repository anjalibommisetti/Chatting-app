// ==============================================================================
// VibeConnect — Professional REST API Client
// Handles Authentication, Users, Conversations, Messages, Groups, and File Uploads
// ==============================================================================

const API_BASE = '/api';

class ApiClient {
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
    const url = `${API_BASE}${endpoint}`;
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
      const data = await response.json();

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

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword({ email, resetCode, newPassword }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword })
    });
  }

  // --- Users & Profile ---
  async searchUsers(query = '') {
    return this.request(`/users?q=${encodeURIComponent(query)}`);
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
