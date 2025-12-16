import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

/**
 * Cloudflare Worker からのメール転送を受け取るエンドポイント
 * POST /api/email-inbound
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Secret 検証
        const secret = request.headers.get('x-webhook-secret')
        const expectedSecret = process.env.EMAIL_INGEST_SECRET

        if (!expectedSecret || secret !== expectedSecret) {
            console.error('[email-inbound] Unauthorized: secret mismatch')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. リクエストボディ取得
        const payload = await request.json() as {
            to?: string
            from?: string
            subject?: string
            body?: string
        }

        console.log('[email-inbound] Received payload:', {
            to: payload.to,
            from: payload.from,
            subject: payload.subject,
            bodyLength: payload.body?.length ?? 0
        })

        if (!payload.to || !payload.body) {
            return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 })
        }

        // 3. "to" アドレスからユーザーメールを抽出
        // 形式: import+<email_replaced_dots>@trade-solo.com
        const userIdentifierMatch = payload.to.match(/import\+(.+)@trade-solo\.com/i)
        if (!userIdentifierMatch) {
            console.error('[email-inbound] Could not extract user identifier from "to":', payload.to)
            return NextResponse.json({ error: 'Invalid forwarding address format' }, { status: 400 })
        }
        const userIdentifier = userIdentifierMatch[1]

        // Email Reconstruction Strategy
        // userIdentifier is like "nakanishisoya.gmail.com" (originally nakanishisoya@gmail.com)
        // We need to guess where the @ was.
        // Strategy: Iterate through dot positions from right to left, replacing one dot with @, and check if user exists.

        const parts = userIdentifier.split('.')
        let userId: string | null = null
        let matchedEmail: string | null = null

        const supabase = getSupabaseAdmin()

        // Try reconstructing email by replacing dots with @ from right to left
        // e.g. for a.b.c: try a.b@c, then a@b.c
        // We skip the very last part (TLD) so we start replacing from parts.length - 2
        for (let i = parts.length - 2; i >= 0; i--) {
            const local = parts.slice(0, i + 1).join('.')
            const domain = parts.slice(i + 1).join('.')
            const candidateEmail = `${local}@${domain}`

            console.log(`[email-inbound] Checking candidate email: ${candidateEmail}`)

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', candidateEmail)
                .single()

            if (profile) {
                userId = profile.id
                matchedEmail = candidateEmail
                console.log(`[email-inbound] Found user for email: ${candidateEmail}`)
                break
            }
        }

        if (!userId) {
            console.error('[email-inbound] User not found for identifier:', userIdentifier)
            // Return 422 Unprocessable Entity instead of 404 to distinguish from "Endpoint Not Found"
            return NextResponse.json({
                error: 'User not found',
                message: `Could not find user with identifier: ${userIdentifier}`,
                tried: parts.join('.')
            }, { status: 422 })
        }

        // 5. Simple regex parsing (no AI)
        const parsedTrade = parseSimple(payload.subject || '', payload.body)

        if (!parsedTrade) {
            console.log('[email-inbound] Failed to parse trade from email')
            return NextResponse.json({
                success: false,
                message: 'Could not extract trade data from email',
                suggestion: 'Please check if the email format is supported'
            }, { status: 200 })
        }

        // 6. データベースに保存
        const { data: insertedTrade, error: insertError } = await supabase
            .from('trades')
            .insert({
                user_id: userId,
                pair: parsedTrade.pair,
                direction: parsedTrade.direction,
                entry_price: parsedTrade.entryPrice,
                entry_time: new Date().toISOString(),
                lot_size: parsedTrade.lotSize,
                broker: parsedTrade.broker || 'Manual Forward',
                is_verified: true,
                verification_source: 'email_forward',
                data_source: 'gmail_sync',
                tags: ['Forwarded'],
                notes: `Subject: ${payload.subject}\n\n${payload.body}`,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[email-inbound] Failed to insert trade:', insertError)
            return NextResponse.json({
                error: 'Failed to save trade',
                details: insertError
            }, { status: 500 })
        }

        console.log('[email-inbound] Trade saved successfully:', insertedTrade?.id)

        return NextResponse.json({
            success: true,
            tradeId: insertedTrade?.id,
            pair: parsedTrade.pair,
            direction: parsedTrade.direction,
            broker: parsedTrade.broker
        })

    } catch (error) {
        console.error('[email-inbound] Unexpected error:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

// シンプルなパーサー (OpenAI なし)
function parseSimple(subject: string, body: string): { pair: string, direction: 'long' | 'short', entryPrice: number, lotSize?: number, broker?: string } | null {
    const text = `${subject} ${body}`.toLowerCase()

    // 通貨ペア検出
    const pairPatterns = [
        /usd\/?jpy/i, /eur\/?usd/i, /gbp\/?usd/i, /aud\/?usd/i,
        /usd\/?chf/i, /eur\/?jpy/i, /gbp\/?jpy/i, /aud\/?jpy/i
    ]
    let pair = 'USDJPY' // default
    for (const pattern of pairPatterns) {
        const match = text.match(pattern)
        if (match) {
            pair = match[0].toUpperCase().replace('/', '')
            break
        }
    }

    // 売買方向
    let direction: 'long' | 'short' = 'long'
    if (/売|sell|short|ショート/i.test(text)) {
        direction = 'short'
    } else if (/買|buy|long|ロング/i.test(text)) {
        direction = 'long'
    }

    // 価格
    const priceMatch = text.match(/(?:at|@|約定.*?|レート.*?|価格.*?)[\s:]*([\d.]+)/i)
    const entryPrice = priceMatch ? parseFloat(priceMatch[1]) : 150.0

    // ロット
    const lotMatch = text.match(/(\d+\.?\d*)\s*(?:lot|ロット)/i)
    const lotSize = lotMatch ? parseFloat(lotMatch[1]) : 0.1

    return { pair, direction, entryPrice, lotSize, broker: 'Manual Forward' }
}

// GETはヘルスチェック用
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'email-inbound-webhook' })
}
