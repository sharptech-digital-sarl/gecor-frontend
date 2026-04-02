/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  let title = 'FPI-CONNECT'
  let body = ''
  try {
    const data = event.data ? event.data.json() : {}
    title = data.title || title
    body = data.body || ''
  } catch {
    body = event.data ? event.data.text() : ''
  }
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/favicon.ico' }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/app'))
})
