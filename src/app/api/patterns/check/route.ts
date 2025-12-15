/**
 * Pattern Check API
 * 
 * Checks registered patterns against current market data and triggers alerts
 * when similarity threshold is met.
 * 
 * This can be called by:
 * 1. Vercel Cron Jobs
 * 2. Manual trigger from admin panel
 * 3. Real-time via WebSocket (future)
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { fetchOHLCData } from '@/lib/forex-rate'
import { calculateCosineSimilarity, similarityToPercent } from '@/lib/pattern-similarity'
import { extractBasicFeatures, generateMockFeatureVector } from '@/lib/feature-vector'
import { chartRenderer } from '@/lib/chart-renderer'

// Cron secret for verifying cron job requests
const CRON_SECRET = process.env.CRON_SECRET

interface PatternCheckResult {
    patternId: string
    patternName: string
    similarity: number
    alertTriggered: boolean
}

/**
 * GET /api/patterns/check
 * 
 * Checks all active patterns for similarity matches
 * Can be triggered by cron job or manually
 */
export async function GET(request: Request) {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    const session = await getServerSession(authOptions)

    // Allow cron jobs with secret or authenticated users
    const isCronJob = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
    const isAuthedUser = !!session?.user

    if (!isCronJob && !isAuthedUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const results: PatternCheckResult[] = []
    const alertsCreated: string[] = []

    try {
        // Get all active patterns
        const { data: patterns, error: patternsError } = await supabase
            .from('patterns')
            .select('*')
            .eq('is_active', true)

        if (patternsError) throw patternsError

        if (!patterns || patterns.length === 0) {
            return NextResponse.json({
                message: 'No active patterns to check',
                checked: 0,
                alertsCreated: 0,
            })
        }

        // Process each pattern
        for (const pattern of patterns) {
            try {
                // Get current market data
                const ohlcData = await fetchOHLCData(
                    pattern.currency_pair.replace('/', ''),
                    pattern.timeframe,
                    50
                )

                if (ohlcData.length === 0) continue

                // Get pattern's feature vector (or generate mock if not exists for old data)
                const patternVector = pattern.feature_vector ||
                    generateMockFeatureVector(pattern.id)

                // Generate current chart's feature vector
                // NEW: Render chart to image -> Extract Features (Apple to Apple comparison)
                const chartImageBuffer = await chartRenderer.renderToBuffer(ohlcData, 500, 300)
                const currentVector = await extractBasicFeatures(chartImageBuffer)

                // Calculate similarity
                const similarity = calculateCosineSimilarity(patternVector, currentVector)
                const similarityPercent = similarityToPercent(similarity)

                const threshold = pattern.similarity_threshold || 70
                const alertTriggered = similarityPercent >= threshold

                results.push({
                    patternId: pattern.id,
                    patternName: pattern.name,
                    similarity: similarityPercent,
                    alertTriggered,
                })

                // Create alert if threshold met
                if (alertTriggered) {
                    // Check if we already created an alert recently (within last hour)
                    const { data: recentAlert } = await supabase
                        .from('alerts')
                        .select('id')
                        .eq('pattern_id', pattern.id)
                        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
                        .single()

                    if (!recentAlert) {
                        // Create new alert
                        const { data: alert, error: alertError } = await supabase
                            .from('alerts')
                            .insert({
                                user_id: pattern.user_id,
                                pattern_id: pattern.id,
                                similarity: similarityPercent / 100, // Convert to decimal 0-1
                                chart_snapshot_url: null, // Could upload the rendered buffer here if we had storage setup
                                status: 'unread',
                            })
                            .select()
                            .single()

                        if (!alertError && alert) {
                            alertsCreated.push(alert.id)

                            // Send push notification to user
                            try {
                                // Get user's push subscriptions
                                const { data: subscriptions } = await supabase
                                    .from('push_subscriptions')
                                    .select('endpoint, keys')
                                    .eq('user_id', pattern.user_id)

                                if (subscriptions && subscriptions.length > 0) {
                                    const webpush = await import('web-push')

                                    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
                                    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
                                    const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@solo-app.com'

                                    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
                                        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

                                        const payload = JSON.stringify({
                                            title: `🎯 ${pattern.name}`,
                                            body: `${similarityPercent}% 類似パターン検出！`,
                                            icon: '/icon-192.png',
                                            badge: '/icon-192.png',
                                            tag: `alert-${alert.id}`,
                                            url: `/alerts?id=${alert.id}`,
                                        })

                                        // Send to all subscriptions
                                        await Promise.all(
                                            subscriptions.map(sub =>
                                                webpush.sendNotification(
                                                    { endpoint: sub.endpoint, keys: sub.keys },
                                                    payload
                                                ).catch(err => console.error('Push failed:', err))
                                            )
                                        )
                                    }
                                }
                            } catch (pushError) {
                                console.error('Push notification error:', pushError)
                            }
                        }
                    }
                }

                // Update last checked timestamp
                await supabase
                    .from('patterns')
                    .update({ last_checked_at: new Date().toISOString() })
                    .eq('id', pattern.id)

            } catch (patternError) {
                console.error(`Error processing pattern ${pattern.id}:`, patternError)
            }
        }

        return NextResponse.json({
            message: 'Pattern check completed',
            checked: results.length,
            alertsCreated: alertsCreated.length,
            results,
        })

    } catch (error) {
        console.error('Pattern check error:', error)
        return NextResponse.json(
            { error: 'Pattern check failed' },
            { status: 500 }
        )
    }
}
