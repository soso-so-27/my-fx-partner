"use server"

import webpush from 'web-push'

// VAPID keys for Web Push - set these in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@solo-app.com'

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushSubscription {
    endpoint: string
    keys: {
        p256dh: string
        auth: string
    }
}

export interface PushNotificationPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    url?: string
    data?: Record<string, unknown>
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('[PushService] VAPID keys not configured')
        return false
    }

    try {
        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
            tag: payload.tag || 'pattern-alert',
            data: {
                url: payload.url || '/alerts',
                ...payload.data
            }
        })

        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: subscription.keys
            },
            notificationPayload
        )

        console.log('[PushService] Notification sent successfully')
        return true
    } catch (error) {
        console.error('[PushService] Error sending notification:', error)
        return false
    }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushToMultiple(
    subscriptions: PushSubscription[],
    payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
        subscriptions.map(sub => sendPushNotification(sub, payload))
    )

    return {
        success: results.filter(r => r).length,
        failed: results.filter(r => !r).length
    }
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY
}
