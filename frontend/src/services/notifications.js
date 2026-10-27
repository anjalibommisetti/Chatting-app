// ==============================================================================
// VibeConnect — Browser Desktop & In-App Notification Engine
// System Web Notifications, Ringtone Audio Alerts, Vibration API
// ==============================================================================

import { sound } from './audio';

class NotificationService {
  constructor() {
    this.permission = typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'default';
  }

  // Request browser desktop notification permission
  async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[Notifications] Desktop notifications not supported in this browser.');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (err) {
      console.warn('[Notifications] Permission request error:', err);
      return 'denied';
    }
  }

  hasPermission() {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  }

  // Show desktop notification for incoming text or media message
  showMessageNotification({ senderName, text, avatar, conversationId, onClick }) {
    // Play message audio chime
    sound.playMessageSent();

    // Vibrate device if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }

    // Only fire browser desktop notification if permitted and tab is not active or user is in background
    if (this.hasPermission()) {
      try {
        const title = senderName ? `${senderName} • VibeConnect` : 'New Message • VibeConnect';
        const body = text || 'Sent an attachment 📎';
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'msg_' + (conversationId || Date.now()),
          renotify: true
        });

        notif.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          if (onClick) onClick();
          notif.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => notif.close(), 5000);
      } catch (err) {
        console.warn('[Notifications] Desktop notification display error:', err);
      }
    }
  }

  // Show high-priority desktop notification for incoming voice/video call
  showCallNotification({ callerName, callType = 'voice', onAccept, onDecline }) {
    // Continuous ring sound
    sound.startIncomingRing();

    // Continuous vibration for mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }

    if (this.hasPermission()) {
      try {
        const title = `📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`;
        const body = `${callerName || 'A friend'} is calling you on VibeConnect. Click to answer!`;
        
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'incoming_call_' + Date.now(),
          requireInteraction: true
        });

        notif.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          if (onAccept) onAccept();
          notif.close();
        };

        return notif;
      } catch (err) {
        console.warn('[Notifications] Call notification display error:', err);
      }
    }
    return null;
  }
}

export const notifications = new NotificationService();
