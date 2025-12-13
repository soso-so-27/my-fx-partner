// Service Worker for Push Notifications
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

// Install event
sw.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...')
    event.waitUntil(sw.skipWaiting())
})

// Activate event
sw.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated')
    event.waitUntil(sw.clients.claim())
})

// Push notification received
sw.addEventListener('push', (event) => {
    console.log('Service Worker: Push received')

    if (!event.data) {
        console.log('Push event but no data')
        return
    }

    try {
        const data = event.data.json()

        const options: NotificationOptions = {
            body: data.body || 'パターンアラートを確認してください',
            icon: '/icon-192.png',
            badge: '/icon-72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/alerts',
                alertId: data.alertId,
            },
            actions: [
                {
                    action: 'view',
                    title: '確認する',
                },
                {
                    action: 'dismiss',
                    title: '後で',
                },
            ],
            tag: data.tag || 'pattern-alert',
            renotify: true,
        }

        event.waitUntil(
            sw.registration.showNotification(
                data.title || 'パターンアラート',
                options
            )
        )
    } catch (error) {
        console.error('Error parsing push data:', error)
    }
})

// Notification click handler
sw.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action)
    event.notification.close()

    if (event.action === 'dismiss') {
        return
    }

    const url = event.notification.data?.url || '/alerts'

    event.waitUntil(
        sw.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if any client is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url)
                        return client.focus()
                    }
                }
                // Open new window if no client is open
                if (sw.clients.openWindow) {
                    return sw.clients.openWindow(url)
                }
            })
    )
})

// Background sync (for offline actions)
sw.addEventListener('sync', (event: any) => {
    console.log('Background sync:', event.tag)
})

export { }
