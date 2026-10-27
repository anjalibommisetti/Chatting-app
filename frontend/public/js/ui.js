// ===================================================================
// DuoConnect - User Interface & DOM Controller
// ===================================================================

class UIManager {
  constructor() {
    this.elements = {};
    this.callTimerInterval = null;
    this.callSeconds = 0;
    this.currentAttachment = null;
  }

  init() {
    this.cacheElements();
    this.initLucideIcons();
    this.setupAutoResizeTextarea();
  }

  cacheElements() {
    this.elements = {
      // Views
      lobbyView: document.getElementById('lobby-view'),
      roomView: document.getElementById('room-view'),

      // Lobby inputs & buttons
      usernameInput: document.getElementById('username-input'),
      randomNameBtn: document.getElementById('random-name-btn'),
      lobbyAvatarEmoji: document.getElementById('lobby-avatar-emoji'),
      avatarOptions: document.getElementById('avatar-options'),
      createRoomBtn: document.getElementById('create-room-btn'),
      joinRoomInput: document.getElementById('join-room-input'),
      joinRoomBtn: document.getElementById('join-room-btn'),
      testMediaBtn: document.getElementById('test-media-btn'),

      // Room Header
      headerRoomId: document.getElementById('header-room-id'),
      copyRoomBtn: document.getElementById('copy-room-btn'),
      roomInfoPill: document.getElementById('room-info-pill'),
      headerPartnerAvatar: document.getElementById('header-partner-avatar'),
      partnerOnlineIndicator: document.getElementById('partner-online-indicator'),
      headerPartnerName: document.getElementById('header-partner-name'),
      partnerSubtext: document.getElementById('partner-subtext'),
      headerInviteBtn: document.getElementById('header-invite-btn'),
      headerVoiceCallBtn: document.getElementById('header-voice-call-btn'),
      headerVideoCallBtn: document.getElementById('header-video-call-btn'),
      toggleSoundBtn: document.getElementById('toggle-sound-btn'),
      soundIcon: document.getElementById('sound-icon'),
      leaveRoomBtn: document.getElementById('leave-room-btn'),

      // Call Stage
      callStage: document.getElementById('call-stage'),
      callTypeIndicator: document.getElementById('call-type-indicator'),
      callTimer: document.getElementById('call-timer'),
      toggleStageViewBtn: document.getElementById('toggle-stage-view-btn'),
      pipBtn: document.getElementById('pip-btn'),
      fullscreenBtn: document.getElementById('fullscreen-btn'),
      videoGrid: document.getElementById('video-grid'),
      remoteVideo: document.getElementById('remote-video'),
      remoteVideoCard: document.getElementById('remote-video-card'),
      remoteVideoPlaceholder: document.getElementById('remote-video-placeholder'),
      remotePlaceholderAvatar: document.getElementById('remote-placeholder-avatar'),
      remotePlaceholderName: document.getElementById('remote-placeholder-name'),
      remotePlaceholderStatus: document.getElementById('remote-placeholder-status'),
      remoteAudioWaveform: document.getElementById('remote-audio-waveform'),
      remoteTagName: document.getElementById('remote-tag-name'),
      remoteMuteBadge: document.getElementById('remote-mute-badge'),
      localVideo: document.getElementById('local-video'),
      localVideoCard: document.getElementById('local-video-card'),
      localVideoPlaceholder: document.getElementById('local-video-placeholder'),
      localPlaceholderAvatar: document.getElementById('local-placeholder-avatar'),
      localMuteBadge: document.getElementById('local-mute-badge'),
      callMicBtn: document.getElementById('call-mic-btn'),
      micIcon: document.getElementById('mic-icon'),
      callCameraBtn: document.getElementById('call-camera-btn'),
      cameraIcon: document.getElementById('camera-icon'),
      callScreenBtn: document.getElementById('call-screen-btn'),
      screenIcon: document.getElementById('screen-icon'),
      callSwitchTypeBtn: document.getElementById('call-switch-type-btn'),
      callHangupBtn: document.getElementById('call-hangup-btn'),

      // Chat Section
      chatSection: document.getElementById('chat-section'),
      messagesContainer: document.getElementById('messages-container'),
      systemWelcomeCard: document.getElementById('system-welcome-card'),
      roomLinkDisplay: document.getElementById('room-link-display'),
      copyWelcomeLinkBtn: document.getElementById('copy-welcome-link-btn'),
      typingBanner: document.getElementById('typing-banner'),
      typingText: document.getElementById('typing-text'),
      attachmentPreviewBar: document.getElementById('attachment-preview-bar'),
      attachmentPreviewImg: document.getElementById('attachment-preview-img'),
      attachmentFileIcon: document.getElementById('attachment-file-icon'),
      attachmentPreviewName: document.getElementById('attachment-preview-name'),
      attachmentPreviewSize: document.getElementById('attachment-preview-size'),
      cancelAttachmentBtn: document.getElementById('cancel-attachment-btn'),
      emojiDrawer: document.getElementById('emoji-drawer'),
      toggleEmojiBtn: document.getElementById('toggle-emoji-btn'),
      fileInput: document.getElementById('file-input'),
      attachFileBtn: document.getElementById('attach-file-btn'),
      chatTextarea: document.getElementById('chat-textarea'),
      sendMsgBtn: document.getElementById('send-msg-btn'),

      // Modals
      incomingCallModal: document.getElementById('incoming-call-modal'),
      incomingCallerAvatar: document.getElementById('incoming-caller-avatar'),
      incomingCallerName: document.getElementById('incoming-caller-name'),
      incomingCallSubtitle: document.getElementById('incoming-call-subtitle'),
      acceptCallBtn: document.getElementById('accept-call-btn'),
      declineCallBtn: document.getElementById('decline-call-btn'),
      outgoingCallModal: document.getElementById('outgoing-call-modal'),
      outgoingPartnerAvatar: document.getElementById('outgoing-partner-avatar'),
      outgoingPartnerName: document.getElementById('outgoing-partner-name'),
      outgoingCallStatus: document.getElementById('outgoing-call-status'),
      cancelOutgoingBtn: document.getElementById('cancel-outgoing-btn'),
      mediaTestModal: document.getElementById('media-test-modal'),
      testVideo: document.getElementById('test-video'),
      micMeterFill: document.getElementById('mic-meter-fill'),
      closeTestModalBtn: document.getElementById('close-test-modal-btn'),
      finishTestBtn: document.getElementById('finish-test-btn'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  initLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  setupAutoResizeTextarea() {
    if (!this.elements.chatTextarea) return;
    this.elements.chatTextarea.addEventListener('input', () => {
      this.elements.chatTextarea.style.height = 'auto';
      const scrollHeight = this.elements.chatTextarea.scrollHeight;
      this.elements.chatTextarea.style.height = Math.min(scrollHeight, 120) + 'px';
    });
  }

  switchView(viewName) {
    if (viewName === 'room') {
      this.elements.lobbyView.classList.remove('active-view');
      this.elements.roomView.classList.add('active-view');
    } else {
      this.elements.roomView.classList.remove('active-view');
      this.elements.lobbyView.classList.add('active-view');
    }
    this.initLucideIcons();
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    this.elements.toastContainer.appendChild(toast);
    this.initLucideIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  updateRoomInfo(roomId) {
    if (this.elements.headerRoomId) {
      this.elements.headerRoomId.textContent = roomId;
    }
    const fullUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    if (this.elements.roomLinkDisplay) {
      this.elements.roomLinkDisplay.value = fullUrl;
    }
  }

  updatePartnerStatus(partner) {
    if (partner) {
      // Partner is connected!
      this.elements.headerPartnerName.textContent = partner.name;
      this.elements.headerPartnerAvatar.textContent = partner.avatar || '👤';
      this.elements.partnerOnlineIndicator.className = 'online-status-badge online';
      this.elements.partnerSubtext.textContent = 'Active & Online';

      // Enable call buttons
      this.elements.headerVoiceCallBtn.disabled = false;
      this.elements.headerVoiceCallBtn.classList.remove('disabled');
      this.elements.headerVideoCallBtn.disabled = false;
      this.elements.headerVideoCallBtn.classList.remove('disabled');

      // Update call placeholders
      this.elements.remotePlaceholderAvatar.textContent = partner.avatar || '👤';
      this.elements.remotePlaceholderName.textContent = partner.name;
      this.elements.remoteTagName.textContent = partner.name;
      this.elements.incomingCallerName.textContent = partner.name;
      this.elements.incomingCallerAvatar.textContent = partner.avatar || '👤';
      this.elements.outgoingPartnerName.textContent = partner.name;
      this.elements.outgoingPartnerAvatar.textContent = partner.avatar || '👤';
    } else {
      // No partner yet
      this.elements.headerPartnerName.textContent = 'Waiting for partner...';
      this.elements.headerPartnerAvatar.textContent = '👤';
      this.elements.partnerOnlineIndicator.className = 'online-status-badge waiting';
      this.elements.partnerSubtext.textContent = 'Share invite link to connect';

      // Disable call buttons until partner joins
      this.elements.headerVoiceCallBtn.disabled = true;
      this.elements.headerVoiceCallBtn.classList.add('disabled');
      this.elements.headerVideoCallBtn.disabled = true;
      this.elements.headerVideoCallBtn.classList.add('disabled');
    }
    this.initLucideIcons();
  }

  appendMessage({ id, senderName, text, attachment, timestamp, isSelf, avatar }) {
    const row = document.createElement('div');
    row.className = `message-row ${isSelf ? 'sent' : 'received'}`;
    if (id) row.dataset.id = id;

    const formattedTime = new Date(timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    let attachmentHtml = '';
    if (attachment && attachment.dataUrl) {
      if (attachment.fileType && attachment.fileType.startsWith('image/')) {
        attachmentHtml = `
          <div class="message-image-wrap">
            <img src="${attachment.dataUrl}" alt="${attachment.fileName || 'Image'}" onclick="window.open(this.src, '_blank')" />
          </div>
        `;
      } else {
        attachmentHtml = `
          <a href="${attachment.dataUrl}" download="${attachment.fileName || 'file'}" class="message-file-badge">
            <i data-lucide="file-text"></i>
            <span>${attachment.fileName || 'Download attachment'}</span>
          </a>
        `;
      }
    }

    const textContentHtml = text ? `<div class="message-text">${this.escapeHtml(text)}</div>` : '';
    const avatarChar = avatar || (isSelf ? 'You' : (senderName ? senderName.charAt(0).toUpperCase() : '👤'));

    row.innerHTML = `
      <div class="message-avatar">${avatarChar}</div>
      <div class="message-content">
        ${!isSelf ? `<span class="message-sender-name">${this.escapeHtml(senderName || 'Partner')}</span>` : ''}
        <div class="message-bubble">
          ${attachmentHtml}
          ${textContentHtml}
          <div class="message-meta">
            <span>${formattedTime}</span>
            ${isSelf ? '<i data-lucide="check-check" style="width:12px;height:12px;"></i>' : ''}
          </div>
        </div>
      </div>
    `;

    this.elements.messagesContainer.appendChild(row);
    this.scrollToBottom();
    this.initLucideIcons();
  }

  appendSystemMessage(text, icon = 'info') {
    const bubble = document.createElement('div');
    bubble.className = 'system-event-bubble';
    bubble.innerHTML = `<i data-lucide="${icon}"></i> <span>${text}</span>`;
    this.elements.messagesContainer.appendChild(bubble);
    this.scrollToBottom();
    this.initLucideIcons();
  }

  scrollToBottom() {
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  setTypingIndicator(name, isTyping) {
    if (isTyping) {
      this.elements.typingText.textContent = `${name || 'Partner'} is typing...`;
      this.elements.typingBanner.classList.remove('hidden');
    } else {
      this.elements.typingBanner.classList.add('hidden');
    }
  }

  setAttachmentPreview(file) {
    this.currentAttachment = file;
    this.elements.attachmentPreviewBar.classList.remove('hidden');
    this.elements.attachmentPreviewName.textContent = file.name;
    this.elements.attachmentPreviewSize.textContent = this.formatFileSize(file.size);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.elements.attachmentPreviewImg.src = e.target.result;
        this.elements.attachmentPreviewImg.classList.remove('hidden');
        this.elements.attachmentFileIcon.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    } else {
      this.elements.attachmentPreviewImg.classList.add('hidden');
      this.elements.attachmentFileIcon.classList.remove('hidden');
      this.initLucideIcons();
    }
  }

  clearAttachmentPreview() {
    this.currentAttachment = null;
    this.elements.attachmentPreviewBar.classList.add('hidden');
    this.elements.attachmentPreviewImg.src = '';
    if (this.elements.fileInput) this.elements.fileInput.value = '';
  }

  toggleEmojiDrawer() {
    this.elements.emojiDrawer.classList.toggle('hidden');
  }

  closeEmojiDrawer() {
    this.elements.emojiDrawer.classList.add('hidden');
  }

  // Call Stage UI
  showCallStage(callType = 'video') {
    this.elements.callStage.classList.remove('hidden');
    this.elements.callTypeIndicator.textContent = callType === 'video' ? 'Video Call' : 'Voice Call';
    
    if (callType === 'voice') {
      this.elements.remoteVideoPlaceholder.classList.remove('hidden');
      this.elements.remotePlaceholderStatus.textContent = 'Voice Call Active';
      this.elements.localVideoPlaceholder.classList.remove('hidden');
    } else {
      this.elements.remoteVideoPlaceholder.classList.add('hidden');
      this.elements.localVideoPlaceholder.classList.add('hidden');
    }
    this.startCallTimer();
    this.initLucideIcons();
  }

  hideCallStage() {
    this.elements.callStage.classList.add('hidden');
    this.stopCallTimer();
    if (this.elements.remoteVideo) this.elements.remoteVideo.srcObject = null;
    if (this.elements.localVideo) this.elements.localVideo.srcObject = null;
  }

  startCallTimer() {
    this.stopCallTimer();
    this.callSeconds = 0;
    this.updateCallTimerText();
    this.callTimerInterval = setInterval(() => {
      this.callSeconds++;
      this.updateCallTimerText();
    }, 1000);
  }

  stopCallTimer() {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    this.callSeconds = 0;
    if (this.elements.callTimer) this.elements.callTimer.textContent = '00:00';
  }

  updateCallTimerText() {
    const mins = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
    const secs = String(this.callSeconds % 60).padStart(2, '0');
    if (this.elements.callTimer) {
      this.elements.callTimer.textContent = `${mins}:${secs}`;
    }
  }

  toggleSideBySideLayout() {
    this.elements.videoGrid.classList.toggle('side-by-side');
  }

  toggleStageFullscreen() {
    this.elements.callStage.classList.toggle('stage-fullscreen');
  }

  updateMicBtn(isMuted) {
    if (isMuted) {
      this.elements.callMicBtn.classList.add('muted');
      this.elements.callMicBtn.innerHTML = '<i data-lucide="mic-off"></i><span class="control-tooltip">Mic Muted</span>';
    } else {
      this.elements.callMicBtn.classList.remove('muted');
      this.elements.callMicBtn.innerHTML = '<i data-lucide="mic"></i><span class="control-tooltip">Mic On</span>';
    }
    this.elements.localMuteBadge.classList.toggle('hidden', !isMuted);
    this.initLucideIcons();
  }

  updateCameraBtn(isCameraOff) {
    if (isCameraOff) {
      this.elements.callCameraBtn.classList.add('off');
      this.elements.callCameraBtn.innerHTML = '<i data-lucide="video-off"></i><span class="control-tooltip">Camera Off</span>';
      this.elements.localVideoPlaceholder.classList.remove('hidden');
    } else {
      this.elements.callCameraBtn.classList.remove('off');
      this.elements.callCameraBtn.innerHTML = '<i data-lucide="video"></i><span class="control-tooltip">Camera On</span>';
      this.elements.localVideoPlaceholder.classList.add('hidden');
    }
    this.initLucideIcons();
  }

  updateScreenShareBtn(isSharing) {
    if (isSharing) {
      this.elements.callScreenBtn.classList.add('active');
      this.elements.callScreenBtn.innerHTML = '<i data-lucide="monitor-x"></i><span class="control-tooltip">Stop Share</span>';
    } else {
      this.elements.callScreenBtn.classList.remove('active');
      this.elements.callScreenBtn.innerHTML = '<i data-lucide="monitor-up"></i><span class="control-tooltip">Share Screen</span>';
    }
    this.initLucideIcons();
  }

  updateRemoteMediaStatus({ isMuted, isCameraOff }) {
    if (isMuted !== undefined) {
      this.elements.remoteMuteBadge.classList.toggle('hidden', !isMuted);
    }
    if (isCameraOff !== undefined) {
      this.elements.remoteVideoPlaceholder.classList.toggle('hidden', !isCameraOff);
      if (isCameraOff) {
        this.elements.remotePlaceholderStatus.textContent = 'Camera is turned off';
      }
    }
  }

  // Modals
  showIncomingCall(callerName, avatar, callType) {
    this.elements.incomingCallerName.textContent = callerName || 'Partner';
    this.elements.incomingCallerAvatar.textContent = avatar || '👤';
    this.elements.incomingCallSubtitle.textContent = `Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call...`;
    this.elements.incomingCallModal.classList.remove('hidden');
    this.initLucideIcons();
  }

  hideIncomingCall() {
    this.elements.incomingCallModal.classList.add('hidden');
  }

  showOutgoingCall(partnerName, avatar, callType) {
    this.elements.outgoingPartnerName.textContent = partnerName || 'Partner';
    this.elements.outgoingPartnerAvatar.textContent = avatar || '👤';
    this.elements.outgoingCallStatus.textContent = `Calling (${callType === 'video' ? 'Video' : 'Voice'})...`;
    this.elements.outgoingCallModal.classList.remove('hidden');
    this.initLucideIcons();
  }

  hideOutgoingCall() {
    this.elements.outgoingCallModal.classList.add('hidden');
  }

  async copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      this.showToast(successMsg, 'success');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      this.showToast('Failed to copy. Please copy manually.', 'error');
    }
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.ui = new UIManager();
