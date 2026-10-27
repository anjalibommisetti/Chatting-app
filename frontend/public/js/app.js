// ===================================================================
// DuoConnect - Main Application Coordinator
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI & Icons
  window.ui.init();

  // Establish Socket.io connection
  const socket = io();

  // App State
  let currentUser = {
    name: localStorage.getItem('duo_username') || '',
    avatar: localStorage.getItem('duo_avatar') || '🦊'
  };
  let currentRoomId = null;
  let partner = null;
  let activeCallType = null; // 'video' | 'voice'
  let isCallActive = false;
  let incomingCallData = null;
  let outgoingCallPending = false;
  let typingTimeout = null;
  let isTyping = false;

  // WebRTC Manager Instance
  const webrtc = new window.WebRTCManager({
    onIceCandidate: (candidate) => {
      socket.emit('webrtc-ice-candidate', { candidate });
    },
    onRemoteTrack: (stream, track) => {
      console.log('[Remote Track Received]:', track.kind);
      if (window.ui.elements.remoteVideo) {
        window.ui.elements.remoteVideo.srcObject = stream;
      }
      if (track.kind === 'audio' && window.ui.elements.remoteAudioWaveform) {
        window.soundFX.visualizeStream(stream, window.ui.elements.remoteAudioWaveform);
      }
    },
    onConnectionStateChange: (state) => {
      console.log('[WebRTC Connection State]:', state);
      if (state === 'connected') {
        window.ui.showToast('Call Connected!', 'success');
        window.soundFX.playCallConnected();
      } else if (state === 'disconnected' || state === 'failed') {
        window.ui.showToast('Call connection disconnected', 'info');
        endCurrentCall(false);
      }
    }
  });

  // -----------------------------------------------------------------
  // Initial Setup & URL Handling
  // -----------------------------------------------------------------
  
  // Set pre-saved username or suggest one
  const sampleNames = ['Anju', 'Alex', 'Sam', 'Jordan', 'Taylor', 'Ravi', 'Priya', 'Nova'];
  if (!currentUser.name) {
    currentUser.name = 'Anju';
  }
  if (window.ui.elements.usernameInput) {
    window.ui.elements.usernameInput.value = currentUser.name;
  }
  if (window.ui.elements.lobbyAvatarEmoji) {
    window.ui.elements.lobbyAvatarEmoji.textContent = currentUser.avatar;
  }

  // Pre-select active avatar button
  const avatarButtons = document.querySelectorAll('.avatar-btn');
  avatarButtons.forEach(btn => {
    if (btn.dataset.emoji === currentUser.avatar) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.addEventListener('click', () => {
      avatarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUser.avatar = btn.dataset.emoji;
      localStorage.setItem('duo_avatar', currentUser.avatar);
      if (window.ui.elements.lobbyAvatarEmoji) {
        window.ui.elements.lobbyAvatarEmoji.textContent = currentUser.avatar;
      }
    });
  });

  // Random Name Generator Button
  if (window.ui.elements.randomNameBtn) {
    window.ui.elements.randomNameBtn.addEventListener('click', () => {
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)] + Math.floor(Math.random() * 90 + 10);
      currentUser.name = randomName;
      window.ui.elements.usernameInput.value = randomName;
      localStorage.setItem('duo_username', randomName);
    });
  }

  // Check URL query parameters for invited room
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    const cleanParam = roomParam.trim().toUpperCase();
    if (window.ui.elements.joinRoomInput) {
      window.ui.elements.joinRoomInput.value = cleanParam;
    }
  }

  // -----------------------------------------------------------------
  // Room Creation & Joining Logic
  // -----------------------------------------------------------------

  function generateRoomCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    let code = 'DUO-';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return code;
  }

  function getCleanUsername() {
    let name = window.ui.elements.usernameInput ? window.ui.elements.usernameInput.value.trim() : '';
    if (!name) name = currentUser.name || 'Anju';
    currentUser.name = name;
    localStorage.setItem('duo_username', name);
    return name;
  }

  function joinRoom(roomId) {
    if (!roomId) {
      window.ui.showToast('Please enter a valid room ID', 'error');
      return;
    }

    const userName = getCleanUsername();
    const avatar = currentUser.avatar;

    window.ui.showToast(`Joining room ${roomId}...`, 'info', 1500);

    socket.emit('join-room', { roomId, userName, avatar }, (res) => {
      if (!res || !res.success) {
        window.ui.showToast(res ? res.message : 'Failed to join room', 'error', 4000);
        return;
      }

      currentRoomId = res.roomId;
      currentUser = res.user;
      partner = res.partner;

      // Update URL without page reload
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
      window.history.replaceState({ roomId: currentRoomId }, '', newUrl);

      // Switch to Chat & Call room view
      window.ui.updateRoomInfo(currentRoomId);
      window.ui.updatePartnerStatus(partner);
      window.ui.switchView('room');

      if (partner) {
        window.soundFX.playCallConnected();
        window.ui.appendSystemMessage(`🎉 Connected with ${partner.name}! You can now chat and make calls.`, 'check-circle');
        window.ui.showToast(`Connected with ${partner.name}!`, 'success');
      } else {
        window.ui.appendSystemMessage(`You are in private room ${currentRoomId}. Invite your partner to start!`, 'lock');
      }
    });
  }

  // "Create 1-on-1 Room" button
  if (window.ui.elements.createRoomBtn) {
    window.ui.elements.createRoomBtn.addEventListener('click', () => {
      // If room already in URL, use that; otherwise generate a new room code
      const roomId = roomParam ? roomParam.trim().toUpperCase() : generateRoomCode();
      joinRoom(roomId);
    });
  }

  // "Join Room" button
  if (window.ui.elements.joinRoomBtn) {
    window.ui.elements.joinRoomBtn.addEventListener('click', () => {
      const code = window.ui.elements.joinRoomInput ? window.ui.elements.joinRoomInput.value.trim().toUpperCase() : '';
      if (!code) {
        window.ui.showToast('Please enter a room code (e.g. DUO-842)', 'error');
        return;
      }
      joinRoom(code);
    });
  }

  // Enter key in join room input
  if (window.ui.elements.joinRoomInput) {
    window.ui.elements.joinRoomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.ui.elements.joinRoomBtn.click();
      }
    });
  }

  // Enter key in username input
  if (window.ui.elements.usernameInput) {
    window.ui.elements.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (roomParam) {
          joinRoom(roomParam.trim().toUpperCase());
        } else {
          window.ui.elements.createRoomBtn.click();
        }
      }
    });
  }

  // Auto-join if opened with ?room= link and name is ready
  if (roomParam && currentUser.name) {
    // Fill the room input and let user easily 1-click or auto-connect
    if (window.ui.elements.joinRoomInput) {
      window.ui.elements.joinRoomInput.value = roomParam.trim().toUpperCase();
    }
  }

  // -----------------------------------------------------------------
  // Copy Invite Links
  // -----------------------------------------------------------------
  function copyInviteLink() {
    if (!currentRoomId) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    window.ui.copyToClipboard(link, '🎉 Invite link copied! Send it to your partner.');
  }

  if (window.ui.elements.copyRoomBtn) {
    window.ui.elements.copyRoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyInviteLink();
    });
  }
  if (window.ui.elements.roomInfoPill) {
    window.ui.elements.roomInfoPill.addEventListener('click', copyInviteLink);
  }
  if (window.ui.elements.headerInviteBtn) {
    window.ui.elements.headerInviteBtn.addEventListener('click', copyInviteLink);
  }
  if (window.ui.elements.copyWelcomeLinkBtn) {
    window.ui.elements.copyWelcomeLinkBtn.addEventListener('click', copyInviteLink);
  }

  // Leave room button
  if (window.ui.elements.leaveRoomBtn) {
    window.ui.elements.leaveRoomBtn.addEventListener('click', () => {
      if (confirm('Leave this 1-on-1 session?')) {
        window.location.href = window.location.origin + window.location.pathname;
      }
    });
  }

  // Sound toggle button
  if (window.ui.elements.toggleSoundBtn) {
    window.ui.elements.toggleSoundBtn.addEventListener('click', () => {
      const enabled = window.soundFX.toggleSound();
      if (enabled) {
        window.ui.elements.soundIcon.setAttribute('data-lucide', 'volume-2');
        window.ui.showToast('Sound effects enabled', 'info');
      } else {
        window.ui.elements.soundIcon.setAttribute('data-lucide', 'volume-x');
        window.ui.showToast('Sound effects muted', 'info');
      }
      window.ui.initLucideIcons();
    });
  }

  // -----------------------------------------------------------------
  // Socket.io Real-Time Events
  // -----------------------------------------------------------------

  socket.on('partner-joined', (data) => {
    partner = data.partner;
    window.ui.updatePartnerStatus(partner);
    window.soundFX.playCallConnected();
    window.ui.appendSystemMessage(`🎉 ${partner.name} joined the chat! You can now chat and call.`, 'user-check');
    window.ui.showToast(`${partner.name} is now connected!`, 'success');
  });

  socket.on('partner-left', (data) => {
    const leftName = (data.user && data.user.name) || (partner ? partner.name : 'Partner');
    window.ui.appendSystemMessage(`${leftName} left the room.`, 'user-x');
    window.ui.showToast(`${leftName} disconnected`, 'info');
    partner = null;
    window.ui.updatePartnerStatus(null);
    if (isCallActive || outgoingCallPending) {
      endCurrentCall(false);
    }
  });

  // -----------------------------------------------------------------
  // Calling Initiation & Signaling
  // -----------------------------------------------------------------

  function startCall(callType) {
    if (!partner) {
      window.ui.showToast('Waiting for your partner to join before calling.', 'info');
      return;
    }
    if (isCallActive || outgoingCallPending) {
      return;
    }

    activeCallType = callType;
    outgoingCallPending = true;
    window.soundFX.startOutgoingRing();
    window.ui.showOutgoingCall(partner.name, partner.avatar, callType);

    socket.emit('call-user', { callType });
  }

  if (window.ui.elements.headerVoiceCallBtn) {
    window.ui.elements.headerVoiceCallBtn.addEventListener('click', () => startCall('voice'));
  }
  if (window.ui.elements.headerVideoCallBtn) {
    window.ui.elements.headerVideoCallBtn.addEventListener('click', () => startCall('video'));
  }

  // Cancel outgoing call
  if (window.ui.elements.cancelOutgoingBtn) {
    window.ui.elements.cancelOutgoingBtn.addEventListener('click', () => {
      outgoingCallPending = false;
      window.soundFX.stopOutgoingRing();
      window.ui.hideOutgoingCall();
      socket.emit('end-call');
    });
  }

  // Incoming call event
  socket.on('incoming-call', (data) => {
    if (isCallActive || outgoingCallPending) {
      socket.emit('reject-call', { reason: 'busy' });
      return;
    }

    incomingCallData = data;
    window.soundFX.startIncomingRing();
    window.ui.showIncomingCall(data.from.name, data.from.avatar, data.callType);
  });

  // Accept incoming call
  if (window.ui.elements.acceptCallBtn) {
    window.ui.elements.acceptCallBtn.addEventListener('click', async () => {
      if (!incomingCallData) return;
      window.soundFX.stopIncomingRing();
      window.ui.hideIncomingCall();

      activeCallType = incomingCallData.callType;
      socket.emit('accept-call', { callType: activeCallType });

      // Start local media stream
      try {
        await webrtc.getLocalMedia(activeCallType);
        if (window.ui.elements.localVideo) {
          window.ui.elements.localVideo.srcObject = webrtc.localStream;
        }
        window.ui.showCallStage(activeCallType);
        isCallActive = true;
      } catch (err) {
        console.error('Failed to get media:', err);
        window.ui.showToast('Could not access microphone/camera', 'error');
        socket.emit('end-call');
      }
    });
  }

  // Decline incoming call
  if (window.ui.elements.declineCallBtn) {
    window.ui.elements.declineCallBtn.addEventListener('click', () => {
      window.soundFX.stopIncomingRing();
      window.ui.hideIncomingCall();
      socket.emit('reject-call', { reason: 'declined' });
      incomingCallData = null;
    });
  }

  // Outgoing call accepted by partner (Callee accepted)
  socket.on('call-accepted', async (data) => {
    outgoingCallPending = false;
    window.soundFX.stopOutgoingRing();
    window.soundFX.playCallConnected();
    window.ui.hideOutgoingCall();

    try {
      await webrtc.getLocalMedia(activeCallType);
      if (window.ui.elements.localVideo) {
        window.ui.elements.localVideo.srcObject = webrtc.localStream;
      }
      window.ui.showCallStage(activeCallType);
      isCallActive = true;

      // Caller creates SDP Offer
      const offer = await webrtc.createOffer();
      socket.emit('webrtc-offer', { sdp: offer, callType: activeCallType });
    } catch (err) {
      console.error('Error starting call:', err);
      window.ui.showToast('Failed to start camera/mic', 'error');
      endCurrentCall(true);
    }
  });

  // Outgoing call rejected
  socket.on('call-rejected', (data) => {
    outgoingCallPending = false;
    window.soundFX.stopOutgoingRing();
    window.soundFX.playCallEnded();
    window.ui.hideOutgoingCall();
    window.ui.showToast(`Call was ${data.reason || 'declined'}`, 'info');
  });

  // Call ended by partner
  socket.on('call-ended', () => {
    endCurrentCall(false);
    window.soundFX.playCallEnded();
    window.ui.showToast('Call ended', 'info');
  });

  // WebRTC Offer received
  socket.on('webrtc-offer', async (data) => {
    try {
      if (!webrtc.localStream) {
        await webrtc.getLocalMedia(data.callType || activeCallType || 'video');
        if (window.ui.elements.localVideo) {
          window.ui.elements.localVideo.srcObject = webrtc.localStream;
        }
      }
      const answer = await webrtc.handleOfferAndCreateAnswer(data.sdp);
      socket.emit('webrtc-answer', { sdp: answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  });

  // WebRTC Answer received
  socket.on('webrtc-answer', async (data) => {
    try {
      await webrtc.handleAnswer(data.sdp);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  });

  // WebRTC ICE Candidate received
  socket.on('webrtc-ice-candidate', async (data) => {
    if (data.candidate) {
      await webrtc.addIceCandidate(data.candidate);
    }
  });

  // Partner media status change (mute/camera off)
  socket.on('partner-media-status', (status) => {
    window.ui.updateRemoteMediaStatus(status);
  });

  // End Call function
  function endCurrentCall(notifyPartner = true) {
    if (notifyPartner) {
      socket.emit('end-call');
    }
    outgoingCallPending = false;
    isCallActive = false;
    activeCallType = null;
    incomingCallData = null;

    window.soundFX.stopIncomingRing();
    window.soundFX.stopOutgoingRing();
    window.soundFX.stopVisualizer();

    webrtc.closePeerConnection();
    window.ui.hideCallStage();
    window.ui.hideIncomingCall();
    window.ui.hideOutgoingCall();

    // Reset button states
    window.ui.updateMicBtn(false);
    window.ui.updateCameraBtn(false);
    window.ui.updateScreenShareBtn(false);
  }

  // In-Call Controls
  if (window.ui.elements.callHangupBtn) {
    window.ui.elements.callHangupBtn.addEventListener('click', () => {
      endCurrentCall(true);
      window.soundFX.playCallEnded();
    });
  }

  if (window.ui.elements.callMicBtn) {
    window.ui.elements.callMicBtn.addEventListener('click', () => {
      const isMuted = webrtc.toggleMute();
      window.ui.updateMicBtn(isMuted);
      socket.emit('media-status-change', { isMuted });
    });
  }

  if (window.ui.elements.callCameraBtn) {
    window.ui.elements.callCameraBtn.addEventListener('click', async () => {
      const isCameraOff = await webrtc.toggleCamera();
      window.ui.updateCameraBtn(isCameraOff);
      socket.emit('media-status-change', { isCameraOff });
    });
  }

  if (window.ui.elements.callScreenBtn) {
    window.ui.elements.callScreenBtn.addEventListener('click', async () => {
      const isSharing = await webrtc.toggleScreenShare();
      window.ui.updateScreenShareBtn(isSharing);
      socket.emit('media-status-change', { isScreenSharing: isSharing });
    });
  }

  if (window.ui.elements.toggleStageViewBtn) {
    window.ui.elements.toggleStageViewBtn.addEventListener('click', () => {
      window.ui.toggleSideBySideLayout();
    });
  }

  if (window.ui.elements.fullscreenBtn) {
    window.ui.elements.fullscreenBtn.addEventListener('click', () => {
      window.ui.toggleStageFullscreen();
    });
  }

  if (window.ui.elements.pipBtn) {
    window.ui.elements.pipBtn.addEventListener('click', async () => {
      try {
        if (window.ui.elements.remoteVideo && document.pictureInPictureEnabled) {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await window.ui.elements.remoteVideo.requestPictureInPicture();
          }
        }
      } catch (err) {
        console.warn('PiP error:', err);
      }
    });
  }

  // -----------------------------------------------------------------
  // Chat Messaging Logic
  // -----------------------------------------------------------------

  async function sendMessage() {
    const textarea = window.ui.elements.chatTextarea;
    const text = textarea ? textarea.value.trim() : '';
    const file = window.ui.currentAttachment;

    if (!text && !file) return;

    let attachmentPayload = null;
    if (file) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        attachmentPayload = {
          dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        };
      } catch (err) {
        console.error('File reading failed:', err);
        window.ui.showToast('Failed to attach file', 'error');
        return;
      }
    }

    socket.emit('send-message', {
      text,
      attachment: attachmentPayload
    });

    // Reset input
    if (textarea) {
      textarea.value = '';
      textarea.style.height = 'auto';
    }
    window.ui.clearAttachmentPreview();

    // Reset typing
    if (isTyping) {
      isTyping = false;
      socket.emit('typing', { isTyping: false });
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (window.ui.elements.sendMsgBtn) {
    window.ui.elements.sendMsgBtn.addEventListener('click', sendMessage);
  }

  if (window.ui.elements.chatTextarea) {
    window.ui.elements.chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Typing emission
    window.ui.elements.chatTextarea.addEventListener('input', () => {
      if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { isTyping: true });
      }
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing', { isTyping: false });
      }, 1500);
    });
  }

  // Receive message
  socket.on('receive-message', (msg) => {
    window.ui.appendMessage({
      ...msg,
      isSelf: false,
      avatar: partner ? partner.avatar : '👤'
    });
    window.soundFX.playMessageReceived();
  });

  // Sent message confirmation
  socket.on('message-sent', (msg) => {
    window.ui.appendMessage({
      ...msg,
      isSelf: true,
      avatar: currentUser.avatar
    });
    window.soundFX.playMessageSent();
  });

  // Partner typing
  socket.on('partner-typing', (data) => {
    window.ui.setTypingIndicator(data.from ? data.from.name : 'Partner', data.isTyping);
  });

  // File Attachment Handlers
  if (window.ui.elements.attachFileBtn && window.ui.elements.fileInput) {
    window.ui.elements.attachFileBtn.addEventListener('click', () => {
      window.ui.elements.fileInput.click();
    });

    window.ui.elements.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 8MB limit
      if (file.size > 8 * 1024 * 1024) {
        window.ui.showToast('Attachment too large (Max 8MB)', 'error');
        e.target.value = '';
        return;
      }
      window.ui.setAttachmentPreview(file);
    });
  }

  if (window.ui.elements.cancelAttachmentBtn) {
    window.ui.elements.cancelAttachmentBtn.addEventListener('click', () => {
      window.ui.clearAttachmentPreview();
    });
  }

  // Emoji Picker Handlers
  if (window.ui.elements.toggleEmojiBtn) {
    window.ui.elements.toggleEmojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.ui.toggleEmojiDrawer();
    });
  }

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.textContent;
      const textarea = window.ui.elements.chatTextarea;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }
      window.ui.closeEmojiDrawer();
    });
  });

  // Close emoji drawer when clicking outside
  document.addEventListener('click', (e) => {
    if (window.ui.elements.emojiDrawer && 
        !window.ui.elements.emojiDrawer.contains(e.target) && 
        e.target !== window.ui.elements.toggleEmojiBtn) {
      window.ui.closeEmojiDrawer();
    }
  });

  // Quick Device Test Modal
  let testStream = null;
  if (window.ui.elements.testMediaBtn) {
    window.ui.elements.testMediaBtn.addEventListener('click', async () => {
      window.ui.elements.mediaTestModal.classList.remove('hidden');
      try {
        testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (window.ui.elements.testVideo) {
          window.ui.elements.testVideo.srcObject = testStream;
        }
      } catch (err) {
        window.ui.showToast('Could not access camera/mic for test', 'error');
      }
    });
  }

  function stopTestMedia() {
    if (testStream) {
      testStream.getTracks().forEach(t => t.stop());
      testStream = null;
    }
    if (window.ui.elements.testVideo) {
      window.ui.elements.testVideo.srcObject = null;
    }
    window.ui.elements.mediaTestModal.classList.add('hidden');
  }

  if (window.ui.elements.closeTestModalBtn) {
    window.ui.elements.closeTestModalBtn.addEventListener('click', stopTestMedia);
  }
  if (window.ui.elements.finishTestBtn) {
    window.ui.elements.finishTestBtn.addEventListener('click', stopTestMedia);
  }

  console.log('✨ DuoConnect 1-on-1 Chat & Call app initialized successfully.');
});
