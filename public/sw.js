// ==============================================================================
// VibeConnect — Service Worker with Auto-Update & Push Notifications
// ==============================================================================

const SW_VERSION = 'vibe-v1.0.4';

self.addEventListener('install', (event) => {
  console.log('⚡ [SW] VibeConnect Service Worker installed:', SW_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('⚡ [SW] VibeConnect Service Worker activated:', SW_VERSION);
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
        });
      });
    })
  );
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
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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

// Listen for message from main thread to trigger notification or check version
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
