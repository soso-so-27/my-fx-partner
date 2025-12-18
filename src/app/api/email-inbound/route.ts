import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emailParser } from '@/lib/email-parser'

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
        const userIdentifierMatch = payload.to.match(/import\+(.+)@trade-solo\.com/i)
        if (!userIdentifierMatch) {
            console.error('[email-inbound] Could not extract user identifier from "to":', payload.to)
            return NextResponse.json({ error: 'Invalid forwarding address format' }, { status: 400 })
        }
        const userIdentifier = userIdentifierMatch[1]

        const parts = userIdentifier.split('.')
        let userId: string | null = null

        const supabase = getSupabaseAdmin()

        // Try reconstructing email by replacing dots with @ from right to left
        for (let i = parts.length - 2; i >= 0; i--) {
            const local = parts.slice(0, i + 1).join('.')
            const domain = parts.slice(i + 1).join('.')
            const candidateEmail = `${local}@${domain}`

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', candidateEmail)
                .single()

            if (profile) {
                userId = profile.id
                console.log(`[email-inbound] Found user for email: ${candidateEmail}`)
                break
            }
        }

        if (!userId) {
            console.error('[email-inbound] User not found for identifier:', userIdentifier)
            return NextResponse.json({
                error: 'User not found',
                message: `Could not find user with identifier: ${userIdentifier}`,
            }, { status: 422 })
        }

        // 4. emailParser でトレード解析
        const emailId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const parsedTrade = await emailParser.parse(payload.subject || '', payload.body, emailId)

        if (!parsedTrade) {
            console.log('[email-inbound] Failed to parse trade from email')
            return NextResponse.json({
                success: false,
                message: 'Could not extract trade data from email',
            }, { status: 200 })
        }

        console.log('[email-inbound] Parsed trade:', {
            pair: parsedTrade.pair,
            direction: parsedTrade.direction,
            tradeType: parsedTrade.tradeType,
            entryPrice: parsedTrade.entryPrice,
            exitPrice: parsedTrade.exitPrice,
            lotSizeRaw: parsedTrade.lotSizeRaw
        })

        // 5. 決済トレードの場合: 対応する新規エントリーを検索して紐付け
        let linkedEntryId: string | undefined
        let calculatedPnl: { amount: number; pips: number; currency: string } | undefined

        if (parsedTrade.tradeType === 'exit' && parsedTrade.exitPrice) {
            // 同じユーザー、同じペア、tradeType='entry'、未決済（linkedされていない）を検索
            const { data: entryTrades } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', userId)
                .eq('pair_normalized', parsedTrade.pair.replace('/', ''))
                .eq('trade_type', 'entry')
                .is('exit_price', null)
                .order('entry_time', { ascending: false })
                .limit(1)

            if (entryTrades && entryTrades.length > 0) {
                const entryTrade = entryTrades[0]
                linkedEntryId = entryTrade.id

                // PnL計算: (決済レート - 新規レート) × 約定数量
                const entryPrice = Number(entryTrade.entry_price)
                const exitPrice = parsedTrade.exitPrice
                const rawQuantity = parsedTrade.lotSizeRaw?.value || (parsedTrade.lotSize || 0.1) * 100000

                // 方向を考慮したPnL計算
                let priceDiff: number
                if (entryTrade.direction === 'BUY') {
                    priceDiff = exitPrice - entryPrice
                } else {
                    priceDiff = entryPrice - exitPrice
                }

                // JPYペアかどうかで計算方法を変更
                const isJpyPair = parsedTrade.pair.includes('JPY')
                let pnlAmount: number
                let pnlPips: number

                if (isJpyPair) {
                    // JPYペア: 1pip = 0.01
                    pnlPips = priceDiff * 100 // pipsに変換
                    pnlAmount = priceDiff * rawQuantity
                } else {
                    // 非JPYペア: 1pip = 0.0001
                    pnlPips = priceDiff * 10000
                    pnlAmount = priceDiff * rawQuantity * 100 // USD換算概算
                }

                calculatedPnl = {
                    amount: Math.round(pnlAmount),
                    pips: Math.round(pnlPips * 10) / 10,
                    currency: 'JPY'
                }

                console.log('[email-inbound] Linked to entry:', linkedEntryId, 'PnL:', calculatedPnl)
            }
        }

        // 6. データベースに保存
        const { data: insertedTrade, error: insertError } = await supabase
            .from('trades')
            .insert({
                user_id: userId,
                pair: parsedTrade.pair,
                pair_normalized: parsedTrade.pair.replace('/', ''),
                direction: parsedTrade.direction,
                entry_price: parsedTrade.entryPrice || (linkedEntryId ? 0 : parsedTrade.exitPrice),
                exit_price: parsedTrade.exitPrice,
                entry_time: parsedTrade.entryTime,
                exit_time: parsedTrade.exitTime,
                lot_size: parsedTrade.lotSize,
                lot_size_raw: parsedTrade.lotSizeRaw,
                pnl: calculatedPnl || parsedTrade.pnl,
                pnl_source: calculatedPnl ? 'calculated' : (parsedTrade.pnlSource || 'email'),
                broker: parsedTrade.broker,
                is_verified: true,
                verification_source: 'gmail_import',
                data_source: 'gmail_sync',
                trade_type: parsedTrade.tradeType,
                linked_entry_id: linkedEntryId,
                order_number: parsedTrade.orderNumber,
                tags: parsedTrade.tags || [],
                notes: '',
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

        // 7. 紐付けられた場合、エントリー側も更新
        if (linkedEntryId && calculatedPnl) {
            await supabase
                .from('trades')
                .update({
                    exit_price: parsedTrade.exitPrice,
                    exit_time: parsedTrade.exitTime,
                    pnl: calculatedPnl,
                    pnl_source: 'calculated'
                })
                .eq('id', linkedEntryId)
        }

        console.log('[email-inbound] Trade saved successfully:', insertedTrade?.id)

        return NextResponse.json({
            success: true,
            tradeId: insertedTrade?.id,
            pair: parsedTrade.pair,
            direction: parsedTrade.direction,
            tradeType: parsedTrade.tradeType,
            linkedEntryId,
            pnl: calculatedPnl
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
