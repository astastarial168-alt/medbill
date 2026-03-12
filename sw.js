self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.location.origin;
  const medName = e.notification.data && e.notification.data.medName;
  if (e.action === 'taken' && medName) {
    // Post message to app to mark medicine as taken
    e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      for (const c of list) {
        c.postMessage({ type: 'MARK_TAKEN', medName });
        return c.focus ? c.focus() : null;
      }
      if (clients.openWindow) return clients.openWindow(url + '#mark-taken-' + encodeURIComponent(medName));
    }));
  } else if (e.action === 'dismiss') {
    // Just close the notification, do nothing
    return;
  } else {
    // Default tap - open/focus the app
    e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    }));
  }
});
self.addEventListener('fetch', e => {
  if(e.request.url.includes('googleapis.com') || e.request.url.includes('fonts.google')) {
    e.respondWith(fetch(e.request).catch(()=>new Response('offline',{status:503})));
    return;
  }
  e.respondWith(caches.open('medbill-v1').then(c=>c.match(e.request).then(r=>r||fetch(e.request))));
})