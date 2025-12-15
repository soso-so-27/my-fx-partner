"use client"

import { useState, useEffect, useCallback } from 'react'

// VAPID public key - Generate using web-push library or online tool
// This should be in environment variable in production
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export interface PushNotificationState {
    isSupported: boolean
    isSubscribed: boolean
    permission: NotificationPermission | 'default'
    error: string | null
}

export function usePushNotifications() {
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        isSubscribed: false,
        permission: 'default',
        error: null,
    })
    const [isLoading, setIsLoading] = useState(false)

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = async () => {
            const isSupported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window

            if (!isSupported) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    error: 'Push notifications are not supported in this browser',
                }))
                return
            }

            setState(prev => ({
                ...prev,
                isSupported: true,
                permission: Notification.permission,
            }))

            // Check if already subscribed
            try {
                const registration = await navigator.serviceWorker.ready
                const subscription = await registration.pushManager.getSubscription()

                setState(prev => ({
                    ...prev,
                    isSubscribed: !!subscription,
                }))
            } catch (error) {
                console.error('Error checking subscription:', error)
            }
        }

        checkSupport()
    }, [])

    // Register service worker
    const registerServiceWorker = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported')
        }

        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        return registration
    }, [])

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!state.isSupported) {
            throw new Error('Push notifications not supported')
        }

        setIsLoading(true)
        setState(prev => ({ ...prev, error: null }))

        try {
            // Request permission
            const permission = await Notification.requestPermission()
            setState(prev => ({ ...prev, permission }))

            if (permission !== 'granted') {
                throw new Error('Notification permission denied')
            }

            // Register service worker
            const registration = await registerServiceWorker()

            // Check VAPID key
            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID public key not configured')
            }

            // Trim any whitespace from the key
            const vapidKey = VAPID_PUBLIC_KEY.trim()

            // Convert VAPID key from base64url to Uint8Array
            const padding = '='.repeat((4 - vapidKey.length % 4) % 4)
            const base64 = (vapidKey + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/')

            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i)
            }
            const applicationServerKey = outputArray

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            })

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to save subscription')
            }

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                error: null,
            }))

            return subscription
        } catch (error: any) {
            console.error('Error subscribing:', error)
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to subscribe',
            }))
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [state.isSupported, registerServiceWorker])

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        setIsLoading(true)

        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                // Unsubscribe from push
                await subscription.unsubscribe()

                // Remove from server
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                    }),
                })
            }

            setState(prev => ({
                ...prev,
                isSubscribed: false,
            }))
        } catch (error: any) {
            console.error('Error unsubscribing:', error)
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to unsubscribe',
            }))
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        ...state,
        isLoading,
        subscribe,
        unsubscribe,
    }
}
