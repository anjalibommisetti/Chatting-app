// ==============================================================================
// VibeConnect — System Mobile & Desktop Notification Engine
// Supports Android Notification Bar (Capacitor Native APK & Chrome Service Worker)
// ==============================================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { sound } from './audio';

class NotificationService {
  constructor() {
    this.isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    this.permission = 'default';
    this.swReg = null;

    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        this.permission = Notification.permission;
      }
      this.init();
    }
  }

  async init() {
    // 1. If running as Native Android APK
    if (this.isNative) {
      try {
        const check = await LocalNotifications.checkPermissions();
        this.permission = check.display === 'granted' ? 'granted' : 'default';

        // Listen for user tapping notification in Android status bar
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const convId = action.notification?.extra?.conversationId;
          if (convId && typeof window !== 'undefined' && window.__openConversation) {
            window.__openConversation(convId);
          }
        });
      } catch (err) {
        console.warn('[Notifications] Native permission check error:', err);
      }
    } 
    // 2. If running in Web Browser (Mobile Chrome or Desktop)
    else if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        this.swReg = reg;
        console.log('⚡ [Notifications] Service Worker registered for Mobile Chrome notifications.');

        // Listen for SW message when notification is clicked
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'OPEN_CONVERSATION') {
            const convId = event.data.conversationId;
            if (convId && typeof window !== 'undefined' && window.__openConversation) {
              window.__openConversation(convId);
            }
          }
        });
      } catch (err) {
        console.warn('[Notifications] Service Worker registration failed:', err);
      }
    }
  }

  // Request notification permission from the user
  async requestPermission() {
    // A. Native Android Capacitor App
    if (this.isNative) {
      try {
        const res = await LocalNotifications.requestPermissions();
        this.permission = res.display === 'granted' ? 'granted' : 'denied';
        return this.permission;
      } catch (err) {
        console.warn('[Notifications] Native request permission error:', err);
        return 'denied';
      }
    }

    // B. Mobile Chrome / Desktop Web Browser
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        this.permission = result;
        return result;
      } catch (err) {
        console.warn('[Notifications] Browser request permission error:', err);
        return 'denied';
      }
    }

    return 'denied';
  }

  hasPermission() {
    if (this.isNative) {
      return this.permission === 'granted';
    }
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  }

  // Show status bar notification for incoming message
  async showMessageNotification({ senderName, text, avatar, conversationId, onClick }) {
    // 1. Play incoming message chime
    sound.playMessageSent();

    // 2. Vibrate phone if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180, 100, 180]);
    }

    const title = senderName ? `${senderName}` : 'New Message • VibeConnect';
    const body = text || 'Sent an attachment 📎';

    // 3. CASE A: Native Android App (VibeChat APK) -> Posts to Android Notification Bar
    if (this.isNative) {
      try {
        const notifId = Math.floor(Date.now() % 1000000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              largeBody: body,
              summaryText: 'New message',
              smallIcon: 'ic_launcher',
              iconColor: '#9333ea',
              sound: 'beep.wav',
              extra: { conversationId }
            }
          ]
        });
        return;
      } catch (err) {
        console.warn('[Notifications] LocalNotifications schedule failed:', err);
      }
    }

    // 4. CASE B: Mobile Chrome (and desktop browsers) -> Service Worker Notification Bar
    if (this.hasPermission()) {
      const options = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'msg_' + (conversationId || Date.now()),
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          url: '/',
          conversationId
        }
      };

      // In Mobile Chrome, new Notification() fails with Illegal constructor!
      // Must use ServiceWorkerRegistration.showNotification()
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, options);
          return;
        } catch (swErr) {
          console.warn('[Notifications] SW showNotification error:', swErr);
        }
      }

      // Fallback for Desktop Browsers that allow new Notification()
      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          if (typeof window !== 'undefined') window.focus();
          if (onClick) onClick();
          notif.close();
        };
        setTimeout(() => notif.close(), 6000);
      } catch (err) {
        console.warn('[Notifications] Desktop notification constructor failed:', err);
      }
    }
  }

  // Show high-priority notification for incoming call
  async showCallNotification({ callerName, callType = 'voice', onAccept, onDecline }) {
    sound.startIncomingRing();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }

    const title = `📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`;
    const body = `${callerName || 'A friend'} is calling you on VibeConnect. Tap to answer!`;

    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 99999,
              title,
              body,
              smallIcon: 'ic_launcher',
              iconColor: '#9333ea',
              extra: { callType }
            }
          ]
        });
        return;
      } catch (e) {}
    }

    if (this.hasPermission()) {
      const options = {
        body,
        icon: '/favicon.ico',
        tag: 'call_' + Date.now(),
        requireInteraction: true,
        vibrate: [500, 250, 500, 250, 500],
        data: { url: '/' }
      };

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, options);
          return;
        } catch (e) {}
      }

      try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
          if (typeof window !== 'undefined') window.focus();
          if (onAccept) onAccept();
          notif.close();
        };
        return notif;
      } catch (e) {}
    }
  }
}

export const notifications = new NotificationService();
