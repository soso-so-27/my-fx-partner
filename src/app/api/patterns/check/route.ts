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
import { generateMockFeatureVector } from '@/lib/feature-vector'

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

                // Get pattern's feature vector (or generate mock if not exists)
                const patternVector = pattern.feature_vector ||
                    generateMockFeatureVector(pattern.id)

                // Generate current chart's feature vector
                // For MVP, we use a simplified approach based on OHLC data
                const currentVector = generateVectorFromOHLC(ohlcData)

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
                        .gte('triggered_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
                        .single()

                    if (!recentAlert) {
                        // Create new alert
                        const { data: alert, error: alertError } = await supabase
                            .from('alerts')
                            .insert({
                                user_id: pattern.user_id,
                                pattern_id: pattern.id,
                                similarity_score: similarityPercent,
                                matched_image_url: null, // Will be set when chart image is generated
                                triggered_at: new Date().toISOString(),
                                is_read: false,
                            })
                            .select()
                            .single()

                        if (!alertError && alert) {
                            alertsCreated.push(alert.id)

                            // TODO: Send push notification
                            // await sendPushNotification(pattern.user_id, {
                            //     title: `Pattern Alert: ${pattern.name}`,
                            //     body: `${similarityPercent}% 類似パターン検出！`,
                            // })
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

/**
 * Generate a feature vector from OHLC data
 * This is a simplified approach for MVP
 */
function generateVectorFromOHLC(ohlcData: { open: number; high: number; low: number; close: number }[]): number[] {
    const vector: number[] = []

    if (ohlcData.length === 0) {
        // Return zero vector if no data
        return new Array(64).fill(0)
    }

    // Normalize prices to 0-1 range
    const closes = ohlcData.map(d => d.close)
    const minPrice = Math.min(...closes)
    const maxPrice = Math.max(...closes)
    const priceRange = maxPrice - minPrice || 1

    // Sample at regular intervals to create 64-dimensional vector
    const targetSize = 64
    const step = Math.max(1, Math.floor(ohlcData.length / targetSize))

    for (let i = 0; i < targetSize; i++) {
        const idx = Math.min(i * step, ohlcData.length - 1)
        const candle = ohlcData[idx]

        // Normalize close price
        const normalizedClose = (candle.close - minPrice) / priceRange
        vector.push(normalizedClose)
    }

    // Pad with zeros if needed
    while (vector.length < targetSize) {
        vector.push(0)
    }

    return vector
}
