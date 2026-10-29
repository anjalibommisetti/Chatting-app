// ==============================================================================
// VibeConnect — Service Worker for Mobile Chrome & Web Push Notifications
// Powers system notifications in the Android notification bar from Chrome
// ==============================================================================

const CACHE_NAME = 'vibeconnect-sw-v1';

self.addEventListener('install', (event) => {
  console.log('⚡ [SW] VibeConnect Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('⚡ [SW] VibeConnect Service Worker activated.');
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push message (from server)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { text: event.data ? event.data.text() : 'You received a new message' };
  }

  const title = data.title || 'VibeConnect';
  const options = {
    body: data.body || data.text || 'New message received',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'vibe_msg_' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      conversationId: data.conversationId
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle user clicking on notification in the mobile notification bar
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (notifData.conversationId && client.postMessage) {
            client.postMessage({
              type: 'OPEN_CONVERSATION',
              conversationId: notifData.conversationId
            });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for message from main thread to trigger notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
